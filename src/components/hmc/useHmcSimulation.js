import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { initialStats, initialStepInfo } from "./hmcData.js";

const INITIAL_PARAMS = {
  T: 1.0,
  L: 20,
  eps: 0.15,
  speed: 3,
  dist: 0,
  style: 0,
};

const GRID_RES = 60;
const RANGE = 4.5;

function createState() {
  return {
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    samples: [],
    traj: [],
    phase: [],
    energyTrace: [],
    total: 0,
    accepted: 0,
    lastAcc: true,
    H0: 0,
    Hp: 0,
  };
}

function randn() {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeGlowTexture(hexColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const color = new THREE.Color(hexColor);
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  const rgb = `${Math.trunc(color.r * 255)},${Math.trunc(color.g * 255)},${Math.trunc(color.b * 255)}`;

  gradient.addColorStop(0, `rgba(${rgb},1)`);
  gradient.addColorStop(0.4, `rgba(${rgb},0.4)`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  return new THREE.CanvasTexture(canvas);
}

const colorStyles = [
  (t) =>
    new THREE.Color(
      (20 + 220 * Math.pow(t, 0.7)) / 255,
      (10 + 100 * Math.pow(t, 1.5)) / 255,
      (180 - 160 * t) / 255,
    ),
  (t) =>
    new THREE.Color(
      (5 + 80 * t * t) / 255,
      (40 + 170 * Math.pow(t, 0.6)) / 255,
      (80 + 130 * t) / 255,
    ),
  (t) =>
    new THREE.Color(
      (20 + 150 * Math.pow(t, 3)) / 255,
      (5 + 220 * t * t) / 255,
      (30 + 200 * Math.pow(t, 0.5)) / 255,
    ),
];

export default function useHmcSimulation({
  contourRef,
  phaseRef,
  threeWrapRef,
  traceRef,
}) {
  const [params, setParams] = useState(INITIAL_PARAMS);
  const [running, setRunning] = useState(false);
  const [smoothAnim, setSmoothAnim] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [stepInfo, setStepInfo] = useState(initialStepInfo);
  const [stats, setStats] = useState(initialStats);
  const [lfProgress, setLfProgress] = useState({
    label: "Leapfrog: —",
    percent: 0,
  });

  const paramsRef = useRef(INITIAL_PARAMS);
  const smoothRef = useRef(false);
  const runningRef = useRef(false);
  const stateRef = useRef(createState());
  const lfAnimRef = useRef(null);
  const lastStepTsRef = useRef(0);
  const prevTsRef = useRef(0);
  const rafRef = useRef(null);
  const contourCacheRef = useRef(null);
  const contourDistRef = useRef(-1);
  const apiRef = useRef({});

  const threeRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    surfaceMesh: null,
    surfaceGeo: null,
    wireframe: null,
    particleMesh: null,
    trailLine: null,
    trailPositions: null,
    samplePoints: [],
    orbit: {
      theta: 0.6,
      phi: 0.85,
      radius: 18,
      dragging: false,
      panning: false,
      lx: 0,
      ly: 0,
      target: new THREE.Vector3(0, 1, 0),
    },
  });

  const updateStatsState = useCallback(() => {
    const state = stateRef.current;
    setStats({
      total: state.total,
      accepted: state.accepted,
      rejected: state.total - state.accepted,
      rate: state.total
        ? `${((state.accepted / state.total) * 100).toFixed(1)}%`
        : "—",
    });
  }, []);

  useEffect(() => {
    const wrap = threeWrapRef.current;
    const contourC = contourRef.current;
    const phaseC = phaseRef.current;
    const traceC = traceRef.current;
    if (!wrap || !contourC || !phaseC || !traceC) return undefined;

    const runtime = threeRef.current;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const cCtx = contourC.getContext("2d");
    const pCtx = phaseC.getContext("2d");
    const tCtx = traceC.getContext("2d");

    function U(x, y, dist = paramsRef.current.dist) {
      if (dist === 0) {
        const r = Math.sqrt(x * x + y * y);
        return 2 * Math.pow(r - 2.5, 2) + 0.15 * y * y;
      }
      if (dist === 1) return 0.3 * Math.pow(x * x - 2.5, 2) + 0.4 * y * y;
      return 0.5 * Math.pow(y - 0.3 * x * x, 2) + 0.15 * x * x;
    }

    function gradU(x, y) {
      const h = 1e-5;
      return [
        (U(x + h, y) - U(x - h, y)) / (2 * h),
        (U(x, y + h) - U(x, y - h)) / (2 * h),
      ];
    }

    function kin(px, py) {
      return 0.5 * (px * px + py * py);
    }

    function resizeCanvases() {
      [contourC, phaseC, traceC].forEach((canvas) => {
        const panel = canvas.parentElement;
        const width = panel.clientWidth;
        const height = Math.max(10, panel.clientHeight - 24);
        canvas.width = width * DPR;
        canvas.height = height * DPR;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      });
    }

    function w2p(canvas, wx, wy, range = 4.5) {
      return [
        ((wx / range + 1) * canvas.width) / 2,
        ((-wy / range + 1) * canvas.height) / 2,
      ];
    }

    function surfaceY(wx, wz) {
      const geo = runtime.surfaceGeo;
      if (!geo) return 0;
      const u = U(wx, wz);
      const t = Math.min(
        1,
        (u - geo.userData.uMin) /
          (geo.userData.uMax - geo.userData.uMin + 1e-9),
      );
      return Math.min(t * 3.5, 3.5);
    }

    function buildSurface() {
      const scene = runtime.scene;
      if (!scene) return;

      if (runtime.surfaceMesh) {
        scene.remove(runtime.surfaceMesh);
        runtime.surfaceMesh.geometry.dispose();
        runtime.surfaceMesh.material.dispose();
      }
      if (runtime.wireframe) {
        scene.remove(runtime.wireframe);
        runtime.wireframe.geometry.dispose();
        runtime.wireframe.material.dispose();
      }

      const surfaceGeo = new THREE.PlaneGeometry(
        RANGE * 2,
        RANGE * 2,
        GRID_RES - 1,
        GRID_RES - 1,
      );
      surfaceGeo.rotateX(-Math.PI / 2);

      const pos = surfaceGeo.attributes.position;
      const colors = [];
      const uCache = [];
      let uMin = Infinity;
      let uMax = -Infinity;

      for (let i = 0; i < GRID_RES; i += 1) {
        for (let j = 0; j < GRID_RES; j += 1) {
          const wx = ((j / (GRID_RES - 1)) * 2 - 1) * RANGE;
          const wy = ((i / (GRID_RES - 1)) * 2 - 1) * RANGE;
          const u = U(wx, wy);
          uCache.push(u);
          uMin = Math.min(uMin, u);
          uMax = Math.max(uMax, u);
        }
      }

      const uSpan = uMax - uMin + 1e-9;
      for (let vi = 0; vi < pos.count; vi += 1) {
        const t = Math.min(1, (uCache[vi] - uMin) / uSpan);
        pos.setY(vi, Math.min(t * 3.5, 3.5));
        const color = colorStyles[paramsRef.current.style](t);
        colors.push(color.r, color.g, color.b);
      }

      pos.needsUpdate = true;
      surfaceGeo.computeVertexNormals();
      surfaceGeo.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3),
      );
      surfaceGeo.userData.uMin = uMin;
      surfaceGeo.userData.uMax = uMax;

      const surfaceMat = new THREE.MeshPhongMaterial({
        vertexColors: true,
        shininess: 60,
        side: THREE.FrontSide,
      });
      runtime.surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
      runtime.surfaceGeo = surfaceGeo;
      runtime.surfaceMesh.receiveShadow = true;
      scene.add(runtime.surfaceMesh);

      runtime.wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(surfaceGeo),
        new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.04,
          depthWrite: false,
        }),
      );
      scene.add(runtime.wireframe);
    }

    function revealTrailUpTo(traj, count) {
      if (!runtime.trailLine || !runtime.particleMesh) return;

      const n = Math.min(count, traj.length, 100);
      const start = Math.max(0, n - 100);
      let vi = 0;

      for (let i = start; i < n; i += 1) {
        const pt = traj[i];
        const ty = surfaceY(pt.x, pt.y);
        runtime.trailPositions[vi * 3] = pt.x;
        runtime.trailPositions[vi * 3 + 1] = ty + 0.18;
        runtime.trailPositions[vi * 3 + 2] = pt.y;
        vi += 1;
      }

      runtime.trailLine.geometry.setDrawRange(0, vi);
      runtime.trailLine.geometry.attributes.position.needsUpdate = true;

      if (n > 0) {
        const current = traj[n - 1];
        runtime.particleMesh.position.set(
          current.x,
          surfaceY(current.x, current.y) + 0.25,
          current.y,
        );
      }
    }

    function update3DSurface() {
      if (!runtime.surfaceMesh || !runtime.particleMesh) return;
      const state = stateRef.current;
      const y = surfaceY(state.x, state.y);
      runtime.particleMesh.position.set(state.x, y + 0.25, state.y);

      const color = state.lastAcc ? 0x34d399 : 0xf87171;
      runtime.particleMesh.material.color.setHex(color);
      runtime.particleMesh.material.emissive.setHex(color);
      runtime.particleMesh.children[0].material.map?.dispose?.();
      runtime.particleMesh.children[0].material.map = makeGlowTexture(color);
      runtime.particleMesh.children[0].material.needsUpdate = true;

      if (state.traj.length > 1) revealTrailUpTo(state.traj, state.traj.length);

      runtime.samplePoints.forEach((mesh) => {
        runtime.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      runtime.samplePoints = [];

      state.samples.slice(-80).forEach((sample) => {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshBasicMaterial({
            color: sample.accepted ? 0x34d399 : 0xf87171,
            transparent: true,
            opacity: sample.accepted ? 0.8 : 0.4,
          }),
        );
        mesh.position.set(
          sample.x,
          surfaceY(sample.x, sample.y) + 0.08,
          sample.y,
        );
        runtime.scene.add(mesh);
        runtime.samplePoints.push(mesh);
      });
    }

    function drawContour() {
      const W = contourC.width;
      const H = contourC.height;
      if (W < 2 || H < 2) return;
      cCtx.clearRect(0, 0, W, H);

      const currentCache = contourCacheRef.current;
      if (
        contourDistRef.current !== paramsRef.current.dist ||
        !currentCache ||
        currentCache.width !== W ||
        currentCache.height !== H
      ) {
        const image = cCtx.createImageData(W, H);
        const uArr = new Float32Array(W * H);
        let uMin = Infinity;
        let uMax = -Infinity;

        for (let ix = 0; ix < W; ix += 1) {
          for (let iy = 0; iy < H; iy += 1) {
            const wx = ((ix / W) * 2 - 1) * 4.5;
            const wy = -(((iy / H) * 2 - 1) * 4.5);
            const u = U(wx, wy, paramsRef.current.dist);
            uArr[iy * W + ix] = u;
            uMin = Math.min(uMin, u);
            uMax = Math.max(uMax, u);
          }
        }

        const span = uMax - uMin + 1e-9;
        for (let i = 0; i < W * H; i += 1) {
          const t = Math.min(1, (uArr[i] - uMin) / span);
          image.data[i * 4] = 8 + 50 * t * t;
          image.data[i * 4 + 1] = 15 + 80 * (1 - t) * (1 - t) * t;
          image.data[i * 4 + 2] = 40 + 130 * (1 - t);
          image.data[i * 4 + 3] = 255;
        }

        image.uArr = uArr;
        image.uMin = uMin;
        image.uMax = uMax;
        contourCacheRef.current = image;
        contourDistRef.current = paramsRef.current.dist;
      }

      const cache = contourCacheRef.current;
      cCtx.putImageData(cache, 0, 0);

      const span = cache.uMax - cache.uMin + 1e-9;
      cCtx.strokeStyle = "rgba(255,255,255,0.10)";
      cCtx.lineWidth = 1;
      for (let lv = 1; lv < 9; lv += 1) {
        const th = cache.uMin + (span * lv) / 9;
        cCtx.beginPath();
        for (let ix = 0; ix < W - 1; ix += 1) {
          for (let iy = 0; iy < H - 1; iy += 1) {
            const u00 = cache.uArr[iy * W + ix];
            const u10 = cache.uArr[iy * W + ix + 1];
            const u01 = cache.uArr[(iy + 1) * W + ix];
            if ((u00 - th) * (u10 - th) < 0) {
              cCtx.moveTo(ix, iy);
              cCtx.lineTo(ix + 1, iy);
            }
            if ((u00 - th) * (u01 - th) < 0) {
              cCtx.moveTo(ix, iy);
              cCtx.lineTo(ix, iy + 1);
            }
          }
        }
        cCtx.stroke();
      }

      const state = stateRef.current;
      const lfAnim = lfAnimRef.current;
      const animating = lfAnim && !lfAnim.done;
      const trajToDraw = animating
        ? lfAnim.traj.slice(0, lfAnim.visStep + 1)
        : state.traj;

      if (trajToDraw?.length > 1) {
        if (smoothRef.current && animating) {
          for (let i = 1; i < trajToDraw.length; i += 1) {
            const alpha = 0.3 + 0.7 * (i / trajToDraw.length);
            const thick = i <= 3 ? 3.0 * DPR : i <= 6 ? 2.0 * DPR : 1.5 * DPR;
            const [x0, y0] = w2p(
              contourC,
              trajToDraw[i - 1].x,
              trajToDraw[i - 1].y,
            );
            const [x1, y1] = w2p(contourC, trajToDraw[i].x, trajToDraw[i].y);
            cCtx.beginPath();
            cCtx.strokeStyle = `rgba(251,191,36,${alpha.toFixed(2)})`;
            cCtx.lineWidth = thick;
            cCtx.moveTo(x0, y0);
            cCtx.lineTo(x1, y1);
            cCtx.stroke();
          }
        } else {
          cCtx.beginPath();
          cCtx.strokeStyle = "rgba(251,191,36,.9)";
          cCtx.lineWidth = 1.5 * DPR;
          trajToDraw.forEach((pt, index) => {
            const [px, py] = w2p(contourC, pt.x, pt.y);
            if (index === 0) cCtx.moveTo(px, py);
            else cCtx.lineTo(px, py);
          });
          cCtx.stroke();
        }

        const last = trajToDraw[trajToDraw.length - 1];
        const [ex, ey] = w2p(contourC, last.x, last.y);
        cCtx.beginPath();
        cCtx.arc(
          ex,
          ey,
          (smoothRef.current && animating ? 5 : 4) * DPR,
          0,
          Math.PI * 2,
        );
        cCtx.fillStyle = animating
          ? "#fbbf24"
          : state.lastAcc
            ? "#34d399"
            : "#f87171";
        cCtx.fill();
      }

      state.samples.forEach((sample) => {
        const [px, py] = w2p(contourC, sample.x, sample.y);
        cCtx.beginPath();
        cCtx.arc(px, py, sample.accepted ? 3 * DPR : 2 * DPR, 0, Math.PI * 2);
        cCtx.fillStyle = sample.accepted
          ? "rgba(52,211,153,.8)"
          : "rgba(248,113,113,.4)";
        cCtx.fill();
      });

      const curX = animating ? lfAnim.traj[lfAnim.visStep].x : state.x;
      const curY = animating ? lfAnim.traj[lfAnim.visStep].y : state.y;
      const [cx, cy] = w2p(contourC, curX, curY);
      cCtx.beginPath();
      cCtx.arc(cx, cy, 6 * DPR, 0, Math.PI * 2);
      cCtx.fillStyle = "#38bdf8";
      cCtx.fill();
      cCtx.strokeStyle = "#fff";
      cCtx.lineWidth = 1.5 * DPR;
      cCtx.stroke();
    }

    function drawPhase() {
      const W = phaseC.width;
      const H = phaseC.height;
      if (W < 2 || H < 2) return;

      pCtx.fillStyle = "#080b14";
      pCtx.fillRect(0, 0, W, H);
      pCtx.strokeStyle = "rgba(255,255,255,0.08)";
      pCtx.lineWidth = 1;
      pCtx.beginPath();
      pCtx.moveTo(W / 2, 0);
      pCtx.lineTo(W / 2, H);
      pCtx.moveTo(0, H / 2);
      pCtx.lineTo(W, H / 2);
      pCtx.stroke();

      function ph(x, p) {
        return [((x / 4.5 + 1) * W) / 2, ((-p / 3.5 + 1) * H) / 2];
      }

      const state = stateRef.current;
      if (state.phase.length > 2) {
        pCtx.beginPath();
        pCtx.strokeStyle = "rgba(251,191,36,.15)";
        pCtx.lineWidth = 1;
        state.phase.forEach((pt, index) => {
          const [px, py] = ph(pt.x, pt.px);
          if (index === 0) pCtx.moveTo(px, py);
          else pCtx.lineTo(px, py);
        });
        pCtx.stroke();
      }

      if (state.traj.length > 1) {
        pCtx.beginPath();
        pCtx.strokeStyle = "#fbbf24";
        pCtx.lineWidth = 2 * DPR;
        state.traj.forEach((pt, index) => {
          const [px, py] = ph(pt.x, pt.px);
          if (index === 0) pCtx.moveTo(px, py);
          else pCtx.lineTo(px, py);
        });
        pCtx.stroke();

        state.traj.forEach((pt, index) => {
          const [px, py] = ph(pt.x, pt.px);
          pCtx.beginPath();
          pCtx.arc(
            px,
            py,
            index === 0 || index === state.traj.length - 1
              ? 4 * DPR
              : 1.5 * DPR,
            0,
            Math.PI * 2,
          );
          if (index === 0) pCtx.fillStyle = "#38bdf8";
          else if (index === state.traj.length - 1)
            pCtx.fillStyle = state.lastAcc ? "#34d399" : "#f87171";
          else pCtx.fillStyle = "rgba(251,191,36,.6)";
          pCtx.fill();
        });
      }
    }

    function drawTrace() {
      const W = traceC.width;
      const H = traceC.height;
      if (W < 2 || H < 2) return;

      tCtx.fillStyle = "#080b14";
      tCtx.fillRect(0, 0, W, H);
      const trace = stateRef.current.energyTrace;

      if (trace.length < 2) {
        tCtx.fillStyle = "rgba(120,140,180,.4)";
        tCtx.font = `${9 * DPR}px JetBrains Mono, monospace`;
        tCtx.fillText("H(x,p) հետք", 8 * DPR, H / 2 + 4 * DPR);
        return;
      }

      let hMin = Infinity;
      let hMax = -Infinity;
      trace.forEach((entry) => {
        hMin = Math.min(hMin, entry.H0, entry.Hp);
        hMax = Math.max(hMax, entry.H0, entry.Hp);
      });

      const pad = 10 * DPR;
      const span = hMax - hMin + 1e-9;
      const hx = (i) => pad + (i / (trace.length - 1)) * (W - 2 * pad);
      const hy = (h) => H - pad - ((h - hMin) / span) * (H - 2 * pad);

      tCtx.beginPath();
      tCtx.strokeStyle = "rgba(56,189,248,.6)";
      tCtx.lineWidth = 1.5 * DPR;
      trace.forEach((entry, index) => {
        if (index === 0) tCtx.moveTo(hx(index), hy(entry.H0));
        else tCtx.lineTo(hx(index), hy(entry.H0));
      });
      tCtx.stroke();

      trace.forEach((entry, index) => {
        tCtx.beginPath();
        tCtx.arc(hx(index), hy(entry.Hp), 2.5 * DPR, 0, Math.PI * 2);
        tCtx.fillStyle = entry.accepted ? "#34d399" : "#f87171";
        tCtx.fill();
      });
    }

    function draw2D() {
      drawContour();
      drawPhase();
      drawTrace();
    }

    function computeLeapfrogTraj() {
      const P = paramsRef.current;
      const state = stateRef.current;
      let cpx = randn();
      let cpy = randn();
      let cx = state.x;
      let cy = state.y;
      const H0 = U(cx, cy) / P.T + kin(cpx, cpy);
      const traj = [{ x: cx, y: cy, px: cpx, py: cpy }];
      let [gx, gy] = gradU(cx, cy);

      cpx -= (0.5 * P.eps * gx) / P.T;
      cpy -= (0.5 * P.eps * gy) / P.T;

      for (let l = 0; l < P.L; l += 1) {
        cx += P.eps * cpx;
        cy += P.eps * cpy;
        [gx, gy] = gradU(cx, cy);
        if (l < P.L - 1) {
          cpx -= (P.eps * gx) / P.T;
          cpy -= (P.eps * gy) / P.T;
        } else {
          cpx -= (0.5 * P.eps * gx) / P.T;
          cpy -= (0.5 * P.eps * gy) / P.T;
        }
        traj.push({ x: cx, y: cy, px: cpx, py: cpy });
      }

      const Hp = U(cx, cy) / P.T + kin(cpx, cpy);
      const dH = Hp - H0;
      const pacc = dH < 0 ? 1 : Math.exp(-dH);
      const acc = Math.random() < pacc;
      return { traj, H0, Hp, dH, pacc, acc };
    }

    function buildStepDelays(trajLen) {
      return Array.from({ length: trajLen }, (_, i) => {
        if (!smoothRef.current) return i === 0 ? 0 : 18;
        if (i === 0) return 0;
        if (i === 1) return 420;
        if (i === 2) return 380;
        if (i === 3) return 310;
        if (i === 4) return 240;
        if (i === 5) return 170;
        if (i <= 8) return 90;
        if (i <= 12) return 45;
        return 20;
      });
    }

    function updateLFBar(current, total) {
      setLfProgress({
        label: `Leapfrog: ${current}/${total}`,
        percent: (current / total) * 100,
      });
    }

    function setResultInfo(accepted, dH, acc, H0, Hp) {
      setActiveStep(accepted ? 5 : 4);
      setStepInfo({
        tone: accepted ? "accepted" : "rejected",
        tag: accepted ? "ԸՆԴՈՒՆՎԱԾ ✓" : "ՄԵՐԺՎԱԾ ✗",
        desc: accepted
          ? "Նոր վիճակն ընդունվեց. մասնիկը անցնում է նոր դիրք:"
          : "Նոր վիճակը մերժվեց. շղթան մնում է հին x-ի վրա:",
        math: `ΔH=${dH.toFixed(3)}  p_acc=${Math.min(1, acc).toFixed(3)}  H₀=${H0.toFixed(3)}→H'=${Hp.toFixed(3)}`,
      });
    }

    function commitAnimatedStep() {
      const lfAnim = lfAnimRef.current;
      if (!lfAnim) return;

      const { traj, H0, Hp, dH, pacc, acc } = lfAnim;
      const state = stateRef.current;
      const propX = traj[traj.length - 1].x;
      const propY = traj[traj.length - 1].y;

      state.traj = traj;
      state.H0 = H0;
      state.Hp = Hp;
      state.total += 1;
      state.energyTrace.push({ H0, Hp, accepted: acc, dH, acc: pacc });
      if (state.energyTrace.length > 100) state.energyTrace.shift();

      if (acc) {
        state.accepted += 1;
        state.samples.push({ x: propX, y: propY, accepted: true });
        state.x = propX;
        state.y = propY;
      } else {
        state.samples.push({
          x: state.x,
          y: state.y,
          accepted: false,
          propX,
          propY,
        });
      }

      if (state.samples.length > 600) state.samples.shift();
      traj.forEach((pt) => state.phase.push(pt));
      if (state.phase.length > 2500)
        state.phase.splice(0, state.phase.length - 2500);
      state.lastAcc = acc;

      setResultInfo(acc, dH, pacc, H0, Hp);
      updateStatsState();
      update3DSurface();
      draw2D();
    }

    function startAnimatedStep() {
      if (lfAnimRef.current && !lfAnimRef.current.done) return;

      setActiveStep(1);
      const result = computeLeapfrogTraj();
      setActiveStep(2);
      lfAnimRef.current = {
        ...result,
        visStep: 0,
        stepDelays: buildStepDelays(result.traj.length),
        elapsed: 0,
        done: false,
      };

      revealTrailUpTo(lfAnimRef.current.traj, 1);
      updateLFBar(1, lfAnimRef.current.traj.length);
    }

    function doHMCStep() {
      setActiveStep(1);
      const result = computeLeapfrogTraj();
      setActiveStep(2);
      lfAnimRef.current = {
        ...result,
        done: true,
        visStep: result.traj.length - 1,
      };
      commitAnimatedStep();
      updateLFBar(result.traj.length, result.traj.length);
    }

    function tickLFAnim(dtMs) {
      const lfAnim = lfAnimRef.current;
      if (!lfAnim || lfAnim.done) return;

      lfAnim.elapsed += dtMs;
      const nextStep = lfAnim.visStep + 1;
      const delay = lfAnim.stepDelays[nextStep] ?? 18;

      if (lfAnim.elapsed >= delay) {
        lfAnim.elapsed = 0;
        lfAnim.visStep = Math.min(nextStep, lfAnim.traj.length - 1);
        revealTrailUpTo(lfAnim.traj, lfAnim.visStep + 1);
        updateLFBar(lfAnim.visStep + 1, lfAnim.traj.length);
        drawContour();

        if (lfAnim.visStep >= lfAnim.traj.length - 1) {
          lfAnim.done = true;
          commitAnimatedStep();
        }
      }
    }

    function orbitTick() {
      const { camera, orbit } = runtime;
      if (!camera) return;

      const x =
        orbit.target.x +
        orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
      const y = orbit.target.y + orbit.radius * Math.cos(orbit.phi);
      const z =
        orbit.target.z +
        orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta);
      camera.position.set(x, y, z);
      camera.lookAt(orbit.target);
    }

    function rafLoop(ts) {
      rafRef.current = requestAnimationFrame(rafLoop);
      const dt = ts - prevTsRef.current;
      prevTsRef.current = ts;

      orbitTick();
      tickLFAnim(dt);

      if (runningRef.current) {
        const interval = 1200 / paramsRef.current.speed;
        const previousDone = !lfAnimRef.current || lfAnimRef.current.done;
        if (previousDone && ts - lastStepTsRef.current > interval) {
          lastStepTsRef.current = ts;
          if (smoothRef.current) startAnimatedStep();
          else doHMCStep();
        }
      }

      runtime.renderer?.render(runtime.scene, runtime.camera);
    }

    function initOrbitControls() {
      const orbit = runtime.orbit;
      const handleMouseDown = (event) => {
        if (event.shiftKey) orbit.panning = true;
        else orbit.dragging = true;
        orbit.lx = event.clientX;
        orbit.ly = event.clientY;
      };
      const handleMouseUp = () => {
        orbit.dragging = false;
        orbit.panning = false;
      };
      const handleMouseMove = (event) => {
        const dx = event.clientX - orbit.lx;
        const dy = event.clientY - orbit.ly;
        orbit.lx = event.clientX;
        orbit.ly = event.clientY;
        if (orbit.dragging) {
          orbit.theta -= dx * 0.008;
          orbit.phi = Math.max(
            0.1,
            Math.min(Math.PI / 2 - 0.05, orbit.phi - dy * 0.006),
          );
        }
        if (orbit.panning) {
          orbit.target.x -= dx * 0.02;
          orbit.target.z += dy * 0.02;
        }
      };
      const handleWheel = (event) => {
        event.preventDefault();
        orbit.radius = Math.max(
          5,
          Math.min(35, orbit.radius + event.deltaY * 0.02),
        );
      };

      wrap.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mousemove", handleMouseMove);
      wrap.addEventListener("wheel", handleWheel, { passive: false });

      return () => {
        wrap.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("mousemove", handleMouseMove);
        wrap.removeEventListener("wheel", handleWheel);
      };
    }

    function initThree() {
      runtime.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      runtime.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      runtime.renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      runtime.renderer.shadowMap.enabled = true;
      wrap.appendChild(runtime.renderer.domElement);

      runtime.scene = new THREE.Scene();
      runtime.scene.background = new THREE.Color(0x080b14);
      runtime.scene.fog = new THREE.Fog(0x080b14, 20, 60);

      runtime.camera = new THREE.PerspectiveCamera(
        45,
        wrap.clientWidth / wrap.clientHeight,
        0.1,
        200,
      );
      runtime.camera.position.set(8, 10, 14);
      runtime.camera.lookAt(0, 0, 0);

      runtime.scene.add(new THREE.AmbientLight(0x223355, 0.8));
      const dir = new THREE.DirectionalLight(0x88ccff, 1.2);
      dir.position.set(8, 14, 6);
      dir.castShadow = true;
      runtime.scene.add(dir);

      const pt = new THREE.PointLight(0x38bdf8, 1.5, 30);
      pt.position.set(-4, 8, -4);
      runtime.scene.add(pt);
      const pt2 = new THREE.PointLight(0xfbbf24, 0.8, 20);
      pt2.position.set(6, 4, 6);
      runtime.scene.add(pt2);

      const grid = new THREE.GridHelper(20, 20, 0x1f2a42, 0x131829);
      grid.position.y = -0.05;
      runtime.scene.add(grid);

      buildSurface();

      runtime.particleMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshPhongMaterial({
          color: 0x38bdf8,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.8,
          shininess: 120,
        }),
      );
      runtime.particleMesh.castShadow = true;
      runtime.scene.add(runtime.particleMesh);

      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeGlowTexture(0x38bdf8),
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      sprite.scale.set(1.2, 1.2, 1);
      runtime.particleMesh.add(sprite);

      runtime.trailPositions = new Float32Array(200 * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(runtime.trailPositions, 3),
      );
      runtime.trailLine = new THREE.Line(
        trailGeo,
        new THREE.LineBasicMaterial({
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      runtime.scene.add(runtime.trailLine);
      update3DSurface();
    }

    function reset() {
      runningRef.current = false;
      setRunning(false);
      lfAnimRef.current = null;
      stateRef.current = createState();
      setActiveStep(null);
      setStepInfo(initialStepInfo);
      setLfProgress({ label: "Leapfrog: —", percent: 0 });
      updateStatsState();
      if (runtime.scene) {
        buildSurface();
        update3DSurface();
      }
      draw2D();
    }

    apiRef.current = {
      buildSurface,
      draw2D,
      reset,
      step: () => {
        if (
          runningRef.current ||
          (lfAnimRef.current && !lfAnimRef.current.done)
        )
          return;
        if (smoothRef.current) startAnimatedStep();
        else doHMCStep();
      },
    };

    resizeCanvases();
    initThree();
    draw2D();
    const disposeOrbit = initOrbitControls();
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvases();
      if (runtime.renderer && runtime.camera) {
        runtime.renderer.setSize(wrap.clientWidth, wrap.clientHeight);
        runtime.camera.aspect = wrap.clientWidth / wrap.clientHeight;
        runtime.camera.updateProjectionMatrix();
      }
      draw2D();
    });
    resizeObserver.observe(wrap);
    resizeObserver.observe(wrap.parentElement);
    rafRef.current = requestAnimationFrame(rafLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      disposeOrbit();
      runtime.samplePoints.forEach((mesh) => {
        runtime.scene?.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      runtime.scene?.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material))
          object.material.forEach((material) => material.dispose?.());
        else object.material?.dispose?.();
      });
      runtime.renderer?.dispose();
      if (runtime.renderer?.domElement?.parentElement) {
        runtime.renderer.domElement.parentElement.removeChild(
          runtime.renderer.domElement,
        );
      }
    };
  }, [contourRef, phaseRef, threeWrapRef, traceRef, updateStatsState]);

  const setParam = useCallback((key, value) => {
    paramsRef.current = { ...paramsRef.current, [key]: value };
    setParams(paramsRef.current);

    if (key === "dist") {
      contourDistRef.current = -1;
      apiRef.current.reset?.();
      return;
    }

    if (key === "style") apiRef.current.buildSurface?.();
    apiRef.current.draw2D?.();
  }, []);

  const toggleRunning = useCallback(() => {
    runningRef.current = !runningRef.current;
    setRunning(runningRef.current);
    if (runningRef.current) lastStepTsRef.current = prevTsRef.current;
  }, []);

  const toggleSmooth = useCallback(() => {
    smoothRef.current = !smoothRef.current;
    setSmoothAnim(smoothRef.current);
  }, []);

  const reset = useCallback(() => apiRef.current.reset?.(), []);
  const step = useCallback(() => apiRef.current.step?.(), []);

  return {
    activeStep,
    lfProgress,
    params,
    reset,
    running,
    setParam,
    smoothAnim,
    stats,
    step,
    stepInfo,
    toggleRunning,
    toggleSmooth,
  };
}
