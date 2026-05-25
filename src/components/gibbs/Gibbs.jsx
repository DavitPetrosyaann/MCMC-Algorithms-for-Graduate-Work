import { useEffect, useRef, useState } from "react";
import "./Gibbs.scss";

const INITIAL_INFO =
  '<b>P(x, y)</b> - 2D normal distribution. Contours show equal-density regions. Tilt and stretch are controlled by <b>rho</b>.<br><span class="gibbs-info-link">Click on the plot to set a starting point.</span>';

const BELL_DUR = 2200;
const MOVE_DUR = 480;

function rhoDescription(rho) {
  const a = Math.abs(rho);
  let desc =
    a < 0.1
      ? "no correlation"
      : a < 0.4
        ? "weak"
        : a < 0.7
          ? "moderate"
          : a < 0.9
            ? "strong"
            : "very strong";

  desc += " correlation";
  if (rho < 0 && a >= 0.1) desc += ", negative";
  return `(${desc})`;
}

function formatSamples(samples) {
  const n = samples.length;
  const xs = samples.map((sample) => sample[0].toFixed(2));
  const ys = samples.map((sample) => sample[1].toFixed(2));
  const pairs = samples.map((sample) => `(${sample[0].toFixed(2)}, ${sample[1].toFixed(2)})`);

  if (!n) {
    return {
      arrX: "-",
      arrY: "-",
      arrXY: "-",
      sxMean: "-",
      syMean: "-",
      sxVar: "-",
      syVar: "-",
      n: 0,
    };
  }

  const mx = samples.reduce((acc, sample) => acc + sample[0], 0) / n;
  const my = samples.reduce((acc, sample) => acc + sample[1], 0) / n;
  const vx = n > 1 ? samples.reduce((acc, sample) => acc + (sample[0] - mx) ** 2, 0) / (n - 1) : 0;
  const vy = n > 1 ? samples.reduce((acc, sample) => acc + (sample[1] - my) ** 2, 0) / (n - 1) : 0;

  return {
    arrX: `[${xs.join(", ")}]`,
    arrY: `[${ys.join(", ")}]`,
    arrXY: `[${pairs.join(",  ")}]`,
    sxMean: mx.toFixed(3),
    syMean: my.toFixed(3),
    sxVar: vx.toFixed(3),
    syVar: vy.toFixed(3),
    n,
  };
}

export default function Gibbs() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const speedRef = useRef(3);

  const [rho, setRho] = useState(0.65);
  const [speed, setSpeed] = useState(3);
  const [running, setRunning] = useState(false);
  const [canSample, setCanSample] = useState(false);
  const [info, setInfo] = useState(INITIAL_INFO);
  const [phaseLabel, setPhaseLabel] = useState("");
  const [sampleData, setSampleData] = useState(formatSamples([]));

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;

    const ctx = canvas.getContext("2d");
    const model = {
      W: 0,
      H: 0,
      CX: 0,
      CY: 0,
      SC: 1,
      rho: 0.65,
      cur: null,
      samples: [],
      path: [],
      running: false,
      runId: null,
      userInitiated: false,
      rafId: null,
      rafLastTs: null,
      bellX: null,
      bellY: null,
      greenDot: null,
      redDot: null,
      moveAnim: null,
      phase: "pick",
      bgCache: null,
      introRafId: null,
    };

    const setRunningState = (value) => {
      model.running = value;
      setRunning(value);
    };

    function randn() {
      let u = 0;
      let v = 0;
      while (!u) u = Math.random();
      while (!v) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function sXgY(y) {
      return model.rho * y + Math.sqrt(1 - model.rho * model.rho) * randn();
    }

    function sYgX(x) {
      return model.rho * x + Math.sqrt(1 - model.rho * model.rho) * randn();
    }

    function dens(x, y) {
      const d = 1 - model.rho * model.rho;
      return Math.exp((-0.5 * (x * x - 2 * model.rho * x * y + y * y)) / d);
    }

    function cXgY(x, y) {
      const mu = model.rho * y;
      const s = Math.sqrt(1 - model.rho * model.rho);
      const z = (x - mu) / s;
      return Math.exp(-0.5 * z * z) / s;
    }

    function cYgX(y, x) {
      const mu = model.rho * x;
      const s = Math.sqrt(1 - model.rho * model.rho);
      const z = (y - mu) / s;
      return Math.exp(-0.5 * z * z) / s;
    }

    function tc(x, y) {
      return [model.CX + x * model.SC, model.CY - y * model.SC];
    }

    function fc(px, py) {
      return [(px - model.CX) / model.SC, -(py - model.CY) / model.SC];
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function ease(t) {
      return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    }

    function resizeCanvas() {
      const rect = wrap.getBoundingClientRect();
      model.W = Math.floor(rect.width);
      model.H = Math.floor(rect.height);
      canvas.width = model.W;
      canvas.height = model.H;
      model.CX = model.W / 2;
      model.CY = model.H / 2;
      model.SC = Math.min(model.W, model.H) / 8;
      model.bgCache = null;
    }

    function buildBg() {
      const off = document.createElement("canvas");
      off.width = model.W;
      off.height = model.H;
      const oc = off.getContext("2d");
      oc.fillStyle = "#07090f";
      oc.fillRect(0, 0, model.W, model.H);

      const st = 5;
      for (let px = 0; px < model.W; px += st) {
        for (let py = 0; py < model.H; py += st) {
          const [x, y] = fc(px + st / 2, py + st / 2);
          oc.fillStyle = `rgba(28,72,130,${dens(x, y) * 0.25})`;
          oc.fillRect(px, py, st, st);
        }
      }

      model.bgCache = off;
    }

    function drawContours(context, progress) {
      const levels = [0.06, 0.18, 0.4, 0.65, 0.9];
      const alphas = [0.22, 0.3, 0.38, 0.45, 0.6];

      levels.forEach((level, li) => {
        const start = li / levels.length;
        const end = (li + 1) / levels.length;
        const p = Math.max(0, Math.min(1, (progress - start) / (end - start)));
        if (p <= 0) return;

        const pts = [];
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.022) {
          let lo = 0;
          let hi = 4.8;
          for (let it = 0; it < 24; it += 1) {
            const m = (lo + hi) / 2;
            if (dens(m * Math.cos(a), m * Math.sin(a)) > level) lo = m;
            else hi = m;
          }
          const r = (lo + hi) / 2;
          pts.push(tc(r * Math.cos(a), r * Math.sin(a)));
        }

        const drawN = Math.floor(pts.length * p);
        if (drawN < 2) return;
        context.strokeStyle = `rgba(50,145,210,${alphas[li]})`;
        context.lineWidth = li === levels.length - 1 ? 1.8 : 1;
        context.beginPath();
        context.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < drawN; i += 1) context.lineTo(pts[i][0], pts[i][1]);
        if (p >= 1) context.closePath();
        context.stroke();
      });
    }

    function drawAxes(context) {
      const pad = 22;
      context.strokeStyle = "rgba(255,255,255,0.3)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(pad, model.CY);
      context.lineTo(model.W - pad, model.CY);
      context.moveTo(model.CX, model.H - pad);
      context.lineTo(model.CX, pad);
      context.stroke();

      context.fillStyle = "rgba(255,255,255,0.55)";
      context.font = "15px 'DM Mono', monospace";
      context.fillText("x", model.W - pad + 4, model.CY + 5);
      context.fillText("y", model.CX + 7, pad - 2);
      context.fillStyle = "rgba(58,160,220,0.88)";
      context.font = "italic 26px 'Instrument Serif', Georgia, serif";
      context.fillText("P(x, y)", model.W - 128, 50);
    }

    function drawBellX(bell) {
      const [, ly] = tc(0, bell.fixedY);
      ctx.strokeStyle = "rgba(80,220,130,0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(18, ly);
      ctx.lineTo(model.W - 18, ly);
      ctx.stroke();
      ctx.setLineDash([]);

      const bellH = Math.min(60, model.H * 0.14);
      const revX = 18 + (model.W - 36) * bell.progress;
      ctx.strokeStyle = "rgba(80,220,130,0.93)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      let first = true;
      for (let px = 18; px <= revX; px += 1.5) {
        const x = (px - model.CX) / model.SC;
        const py = ly - cXgY(x, bell.fixedY) * bellH;
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    function drawBellY(bell) {
      const [lx] = tc(bell.fixedX, 0);
      ctx.strokeStyle = "rgba(232,90,74,0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(lx, 18);
      ctx.lineTo(lx, model.H - 18);
      ctx.stroke();
      ctx.setLineDash([]);

      const bellW = Math.min(60, model.W * 0.12);
      const revY = 18 + (model.H - 36) * bell.progress;
      ctx.strokeStyle = "rgba(232,90,74,0.93)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      let first = true;
      for (let py = 18; py <= revY; py += 1.5) {
        const y = (model.CY - py) / model.SC;
        const px = lx - cYgX(y, bell.fixedX) * bellW;
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    function drawDot(x, y, color, radius = 6) {
      const [px, py] = tc(x, y);
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    function drawSamplesPath() {
      if (model.path.length >= 2) {
        ctx.strokeStyle = "rgba(140,120,240,0.45)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        const [px0, py0] = tc(model.path[0][0], model.path[0][1]);
        ctx.moveTo(px0, py0);
        for (let i = 1; i < model.path.length; i += 1) {
          const [px, py] = tc(model.path[i][0], model.path[i][1]);
          ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      model.samples.forEach((sample) => {
        const [px, py] = tc(sample[0], sample[1]);
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(80,200,150,0.65)";
        ctx.fill();
      });
    }

    function render() {
      if (!model.bgCache) buildBg();
      ctx.drawImage(model.bgCache, 0, 0);
      drawContours(ctx, 1);
      drawAxes(ctx);
      drawSamplesPath();
      if (model.bellX) drawBellX(model.bellX);
      if (model.bellY) drawBellY(model.bellY);
      if (model.greenDot) drawDot(model.greenDot.x, model.greenDot.y, "rgba(80,220,130,1)");
      if (model.redDot) drawDot(model.redDot.x, model.redDot.y, "rgba(232,90,74,1)");
      if (model.moveAnim) {
        const t = ease(model.moveAnim.progress);
        drawDot(
          lerp(model.moveAnim.fx, model.moveAnim.tx, t),
          lerp(model.moveAnim.fy, model.moveAnim.ty, t),
          "rgba(245,200,66,0.93)",
          7,
        );
      } else if (model.cur) {
        drawDot(model.cur[0], model.cur[1], "rgba(245,200,66,0.93)", 7);
      }
    }

    function startIntro() {
      if (model.introRafId) cancelAnimationFrame(model.introRafId);
      let progress = 0;
      let last = null;

      function tick(ts) {
        if (!last) last = ts;
        const dt = ts - last;
        last = ts;
        progress = Math.min(1, progress + dt / 1600);
        ctx.drawImage(model.bgCache, 0, 0);
        drawContours(ctx, progress);
        drawAxes(ctx);
        if (progress < 1) model.introRafId = requestAnimationFrame(tick);
        else model.introRafId = null;
      }

      model.introRafId = requestAnimationFrame(tick);
    }

    function isAnimating() {
      return Boolean(
        (model.bellX && model.bellX.progress < 1) ||
          (model.bellY && model.bellY.progress < 1) ||
          model.moveAnim,
      );
    }

    function startRaf() {
      if (model.rafId) return;
      model.rafLastTs = null;
      model.rafId = requestAnimationFrame(function tick(ts) {
        if (!model.rafLastTs) model.rafLastTs = ts;
        const dt = ts - model.rafLastTs;
        model.rafLastTs = ts;
        let more = false;

        [model.bellX, model.bellY].forEach((bell) => {
          if (bell && bell.progress < 1) {
            bell.progress = Math.min(1, bell.progress + dt / BELL_DUR);
            more = true;
            if (bell.progress >= 1 && bell.onDone) {
              const callback = bell.onDone;
              bell.onDone = null;
              setTimeout(callback, 280);
            }
          }
        });

        if (model.moveAnim) {
          model.moveAnim.progress = Math.min(1, model.moveAnim.progress + dt / MOVE_DUR);
          more = true;
          if (model.moveAnim.progress >= 1) {
            const callback = model.moveAnim.onDone;
            model.moveAnim = null;
            setTimeout(callback, 60);
          }
        }

        render();
        if (more) model.rafId = requestAnimationFrame(tick);
        else {
          model.rafId = null;
          model.rafLastTs = null;
        }
      });
    }

    function doMove(tx, ty, onDone) {
      model.moveAnim = { fx: model.cur[0], fy: model.cur[1], tx, ty, progress: 0, onDone };
      startRaf();
    }

    function updateArrays() {
      setSampleData(formatSamples(model.samples));
    }

    function doFastStep() {
      const newX = sXgY(model.cur[1]);
      model.cur = [newX, model.cur[1]];
      model.path.push([...model.cur]);
      if (model.path.length > 200) model.path.shift();

      const newY = sYgX(model.cur[0]);
      model.cur = [model.cur[0], newY];
      model.path.push([...model.cur]);
      if (model.path.length > 200) model.path.shift();

      model.samples.push([...model.cur]);
      model.phase = "ready";
      setPhaseLabel(`Step ${model.samples.length}`);
      setInfo(
        model.samples.length <= 4
          ? "Collecting samples... points accumulate near the <b>dense center</b>."
          : "Gibbs sampling running. <b>Green</b> = samples, <b>yellow</b> = current.",
      );
      render();
      updateArrays();
    }

    function userStep() {
      if (isAnimating()) return;

      if (model.phase === "A0") {
        const fixedY = model.cur[1];
        model.bellX = { fixedY, progress: 0, _sampledX: sXgY(fixedY), onDone: null };
        model.greenDot = null;
        model.phase = "A1_anim";
        setInfo(`Fixing <b>Y = ${fixedY.toFixed(2)}</b>. The green curve is <b>P(x | y_fixed)</b> - all possible X values given this Y.`);
        setPhaseLabel("Drawing P(x | y_fixed)...");
        model.bellX.onDone = () => {
          model.phase = "A1_done";
          setInfo("Distribution drawn. Press Step to see <b>which X was sampled</b> from this curve.");
          setPhaseLabel("Bell done - press Step");
          render();
        };
        startRaf();
        return;
      }

      if (model.phase === "A1_done") {
        model.greenDot = { x: model.bellX._sampledX, y: model.bellX.fixedY };
        model.phase = "A2_dot";
        setInfo(`Sampled <b>X = ${model.greenDot.x.toFixed(2)}</b>. Press Step to move there.`);
        setPhaseLabel("X sampled - press Step to move");
        render();
        return;
      }

      if (model.phase === "A2_dot") {
        const { x: tx, y: ty } = model.greenDot;
        model.phase = "A2_moving";
        doMove(tx, ty, () => {
          model.cur = [tx, ty];
          model.path.push([tx, ty]);
          if (model.path.length > 150) model.path.shift();
          model.bellX = null;
          model.greenDot = null;
          model.phase = "A3";
          setInfo(`Moved to X = ${tx.toFixed(2)}. Now fix X and draw <b>P(y | x_fixed)</b>. Press Step.`);
          setPhaseLabel("X done - press Step for Y");
          render();
        });
        return;
      }

      if (model.phase === "A3") {
        const fixedX = model.cur[0];
        model.bellY = { fixedX, progress: 0, _sampledY: sYgX(fixedX), onDone: null };
        model.redDot = null;
        model.phase = "B0_anim";
        setInfo(`Fixing <b>X = ${fixedX.toFixed(2)}</b>. The red curve is <b>P(y | x_fixed)</b> - all possible Y values given this X.`);
        setPhaseLabel("Drawing P(y | x_fixed)...");
        model.bellY.onDone = () => {
          model.phase = "B0_done";
          setInfo("Distribution drawn. Press Step to see <b>which Y was sampled</b> from this curve.");
          setPhaseLabel("Bell done - press Step");
          render();
        };
        startRaf();
        return;
      }

      if (model.phase === "B0_done") {
        model.redDot = { x: model.bellY.fixedX, y: model.bellY._sampledY };
        model.phase = "B1_dot";
        setInfo(`Sampled <b>Y = ${model.redDot.y.toFixed(2)}</b>. Press Step to move there and complete the step.`);
        setPhaseLabel("Y sampled - press Step to move");
        render();
        return;
      }

      if (model.phase === "B1_dot") {
        const { x: tx, y: ty } = model.redDot;
        model.phase = "B1_moving";
        doMove(tx, ty, () => {
          model.cur = [tx, ty];
          model.path.push([tx, ty]);
          if (model.path.length > 150) model.path.shift();
          model.samples.push([tx, ty]);
          model.bellY = null;
          model.redDot = null;
          model.phase = "ready";
          setInfo(`Full step done! <b>(${tx.toFixed(2)}, ${ty.toFixed(2)})</b> saved. Press Step or Run to continue.`);
          setPhaseLabel(`Step ${model.samples.length} complete`);
          render();
          updateArrays();
        });
        return;
      }

      if (model.phase === "ready") doFastStep();
    }

    function scheduleRun() {
      if (!model.running) return;
      if (isAnimating()) {
        model.runId = setTimeout(scheduleRun, 40);
        return;
      }
      if (model.phase !== "ready") {
        autoAdvance();
        return;
      }
      doFastStep();
      model.runId = setTimeout(scheduleRun, Math.max(20, 160 - Number(apiRef.current.speed || 3) * 14));
    }

    function autoAdvance() {
      if (!model.running) return;
      if (isAnimating()) {
        model.runId = setTimeout(autoAdvance, 40);
        return;
      }
      if (model.phase === "ready") {
        scheduleRun();
        return;
      }
      userStep();
      model.runId = setTimeout(autoAdvance, 80);
    }

    function toggleRun() {
      if (!model.userInitiated || isAnimating()) return;
      setRunningState(!model.running);
      if (!model.running) {
        clearTimeout(model.runId);
        return;
      }
      if (model.phase !== "ready") autoAdvance();
      else scheduleRun();
    }

    function resetAll() {
      setRunningState(false);
      clearTimeout(model.runId);
      if (model.rafId) cancelAnimationFrame(model.rafId);
      if (model.introRafId) cancelAnimationFrame(model.introRafId);
      model.rafId = null;
      model.introRafId = null;
      model.rafLastTs = null;
      model.moveAnim = null;
      model.bellX = null;
      model.bellY = null;
      model.cur = null;
      model.samples = [];
      model.path = [];
      model.phase = "pick";
      model.greenDot = null;
      model.redDot = null;
      model.userInitiated = false;
      setCanSample(false);
      setInfo(INITIAL_INFO);
      setPhaseLabel("");
      buildBg();
      startIntro();
      updateArrays();
    }

    function handleCanvasClick(event) {
      if (model.phase !== "pick" || isAnimating() || model.introRafId) return;
      const rect = canvas.getBoundingClientRect();
      const [x, y] = fc(
        (event.clientX - rect.left) * (model.W / rect.width),
        (event.clientY - rect.top) * (model.H / rect.height),
      );
      model.cur = [x, y];
      model.path = [[x, y]];
      model.samples = [];
      model.bellX = null;
      model.bellY = null;
      model.greenDot = null;
      model.redDot = null;
      model.userInitiated = true;
      model.phase = "A0";
      setCanSample(true);
      setInfo("Starting point set. Press <b>Step</b> to fix Y and draw <b>P(x | y_fixed)</b>.");
      setPhaseLabel("Press Step to begin");
      render();
      updateArrays();
    }

    function setRhoValue(nextRho) {
      model.rho = nextRho;
      setRho(nextRho);
      model.bgCache = null;
      resetAll();
    }

    function handleResize() {
      resizeCanvas();
      resetAll();
    }

    apiRef.current = {
      get speed() {
        return speedRef.current;
      },
      resetAll,
      setRhoValue,
      toggleRun,
      userStep,
    };

    resizeCanvas();
    buildBg();
    startIntro();
    updateArrays();

    canvas.addEventListener("click", handleCanvasClick);
    window.addEventListener("resize", handleResize);

    return () => {
      canvas.removeEventListener("click", handleCanvasClick);
      window.removeEventListener("resize", handleResize);
      clearTimeout(model.runId);
      if (model.rafId) cancelAnimationFrame(model.rafId);
      if (model.introRafId) cancelAnimationFrame(model.introRafId);
    };
  }, []);

  function handleRhoChange(event) {
    apiRef.current.setRhoValue?.(Number(event.target.value));
  }

  return (
    <div className="gibbs-sampling">
      <header className="gibbs-header">
        <h1>Gibbs Sampling</h1>
        <span className="gibbs-header__subtitle">2D Normal Distribution</span>
        <div className="gibbs-rho">
          <label htmlFor="gibbs-rho">rho =</label>
          <input
            id="gibbs-rho"
            type="range"
            min="-0.97"
            max="0.97"
            step="0.01"
            value={rho}
            onChange={handleRhoChange}
            style={{
              background: `linear-gradient(to right, var(--gibbs-accent) 0%, var(--gibbs-accent) ${(((rho + 0.97) / 1.94) * 100).toFixed(1)}%, rgba(255,255,255,0.12) ${(((rho + 0.97) / 1.94) * 100).toFixed(1)}%)`,
            }}
          />
          <span className="gibbs-rho__value">{rho.toFixed(2)}</span>
          <span className="gibbs-rho__desc">{rhoDescription(rho)}</span>
        </div>
      </header>

      <div className="gibbs-canvas-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} />
      </div>

      <aside className="gibbs-panel">
        <div className="gibbs-info">
          <div dangerouslySetInnerHTML={{ __html: info }} />
          <div className="gibbs-info__phase">{phaseLabel}</div>
        </div>

        <div className="gibbs-arrays">
          <ArrayBlock title="X samples" value={sampleData.arrX} mean={sampleData.sxMean} variance={sampleData.sxVar} n={sampleData.n} />
          <div className="gibbs-divider" />
          <ArrayBlock title="Y samples" value={sampleData.arrY} mean={sampleData.syMean} variance={sampleData.syVar} n={sampleData.n} />
          <div className="gibbs-divider" />
          <div className="gibbs-array-block">
            <div className="gibbs-array-block__title">(X, Y) pairs</div>
            <div className="gibbs-array-block__values">{sampleData.arrXY}</div>
          </div>
        </div>
      </aside>

      <footer className="gibbs-bottom">
        <button className="primary" type="button" onClick={() => apiRef.current.userStep?.()} disabled={!canSample}>
          ▶ Step
        </button>
        <button type="button" onClick={() => apiRef.current.toggleRun?.()} disabled={!canSample}>
          {running ? "⏸ Pause" : "⏵ Run"}
        </button>
        <button type="button" onClick={() => apiRef.current.resetAll?.()}>
          ↺ Reset
        </button>
        <div className="gibbs-speed">
          <label htmlFor="gibbs-speed">Speed</label>
          <input
            id="gibbs-speed"
            type="range"
            min="1"
            max="10"
            value={speed}
            step="1"
            onChange={(event) => {
              const nextSpeed = Number(event.target.value);
              speedRef.current = nextSpeed;
              setSpeed(nextSpeed);
            }}
          />
        </div>
        <div className="gibbs-legend">
          <LegendDot color="var(--gibbs-green)" label="samples" />
          <LegendDot color="var(--gibbs-yellow)" label="current" />
          <LegendLine label="path" />
          <LegendDot color="var(--gibbs-green)" label="P(x|y)" opacity="0.7" />
          <LegendDot color="var(--gibbs-red)" label="P(y|x)" opacity="0.7" />
        </div>
      </footer>
    </div>
  );
}

function ArrayBlock({ mean, n, title, value, variance }) {
  return (
    <div className="gibbs-array-block gibbs-array-block--short">
      <div className="gibbs-array-block__title">{title}</div>
      <div className="gibbs-array-block__values">{value}</div>
      <div className="gibbs-stats-row">
        <span>mean: <b>{mean}</b></span>
        <span>var: <b>{variance}</b></span>
        <span>n: <b>{n}</b></span>
      </div>
    </div>
  );
}

function LegendDot({ color, label, opacity = "1" }) {
  return (
    <div className="gibbs-legend__item">
      <span className="gibbs-legend__dot" style={{ background: color, opacity }} />
      {label}
    </div>
  );
}

function LegendLine({ label }) {
  return (
    <div className="gibbs-legend__item">
      <span className="gibbs-legend__line" />
      {label}
    </div>
  );
}
