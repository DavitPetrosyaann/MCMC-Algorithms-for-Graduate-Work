import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./MetropolisStepVisualizer.scss";

const INITIAL_UI = {
  accepts: 0,
  rejects: 0,
  step: 0,
  formula: "alpha = min(1, p(x') / p(x))",
  formulaState: "",
  formulaSub: "Waiting for proposal...",
  currentDensity: null,
  proposedDensity: null,
  version: 0,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randn() {
  const u = Math.max(Math.random(), 1e-12);
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function modelX(point, width) {
  return (point.x / Math.max(width, 1)) * 10 - 5;
}

function targetDensity(x, y, width, height) {
  const sx = width * 0.13;
  const sy = height * 0.12;
  const dx1 = (x - width * 0.35) / sx;
  const dy1 = (y - height * 0.5) / sy;
  const dx2 = (x - width * 0.68) / sx;
  const dy2 = (y - height * 0.5) / sy;

  return (
    0.55 * Math.exp(-0.5 * (dx1 * dx1 + dy1 * dy1)) +
    0.45 * Math.exp(-0.5 * (dx2 * dx2 + dy2 * dy2))
  );
}

export default function MetropolisStepVisualizer() {
  const canvasRef = useRef(null);
  const heatmapRef = useRef(null);
  const timerRef = useRef(null);
  const timeoutsRef = useRef([]);
  const runtimeRef = useRef({
    width: 1,
    height: 1,
    x: 0,
    y: 0,
    chain: [],
    proposed: null,
    phase: "idle",
    running: false,
  });

  const [sigma, setSigma] = useState(28);
  const [speed, setSpeed] = useState(4);
  const [ui, setUi] = useState(INITIAL_UI);

  const sampleStats = useMemo(() => {
    const { chain, width } = runtimeRef.current;
    const values = chain.map((point) => modelX(point, width));
    const n = values.length;

    if (!n) {
      return { n: 0, mean: null, sigma: null, values: [] };
    }

    const mean = values.reduce((sum, value) => sum + value, 0) / n;
    const variance =
      n > 1
        ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
          (n - 1)
        : 0;

    return {
      n,
      mean,
      sigma: Math.sqrt(variance),
      values: values.slice(-34),
    };
  }, [ui.version]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const state = runtimeRef.current;
    const { width, height, x, y, chain, proposed, phase } = state;

    ctx.clearRect(0, 0, width, height);
    if (heatmapRef.current) {
      ctx.drawImage(heatmapRef.current, 0, 0);
    }

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < width; gx += 60) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += 60) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }
    ctx.restore();

    if (chain.length > 1) {
      const start = Math.max(0, chain.length - 70);
      ctx.save();
      ctx.strokeStyle = "rgba(200,212,240,0.2)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(chain[start].x, chain[start].y);
      for (let i = start + 1; i < chain.length; i += 1) {
        ctx.lineTo(chain[i].x, chain[i].y);
      }
      ctx.stroke();
      ctx.restore();

      for (let i = start; i < chain.length; i += 1) {
        const t = (i - start + 1) / (chain.length - start + 1);
        const point = chain[i];
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = point.accepted
          ? `rgba(61,220,132,${t * 0.75})`
          : `rgba(255,71,87,${t * 0.5})`;
        ctx.fill();
      }
    }

    if (proposed) {
      if (phase === "propose") {
        ctx.save();
        ctx.strokeStyle = "rgba(255,215,0,0.55)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(proposed.x, proposed.y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = "rgba(79,142,247,0.18)";
        ctx.setLineDash([4, 6]);
        for (let radius = sigma * 0.55; radius <= sigma * 1.8; radius += sigma * 0.4) {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      const color =
        phase === "decide"
          ? proposed.accepted
            ? "#3ddc84"
            : "#ff4757"
          : "#ffd700";
      ctx.beginPath();
      ctx.arc(proposed.x, proposed.y, 19, 0, Math.PI * 2);
      ctx.fillStyle =
        phase === "decide"
          ? proposed.accepted
            ? "rgba(61,220,132,0.18)"
            : "rgba(255,71,87,0.18)"
          : "rgba(255,215,0,0.18)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(proposed.x, proposed.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    const currentGlow = ctx.createRadialGradient(x, y, 0, x, y, 24);
    currentGlow.addColorStop(0, "rgba(79,195,247,0.6)");
    currentGlow.addColorStop(1, "rgba(79,195,247,0)");
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fillStyle = currentGlow;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#4fc3f7";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }, [sigma]);

  const buildHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const heatmap = document.createElement("canvas");
    heatmap.width = width;
    heatmap.height = height;
    const hctx = heatmap.getContext("2d");
    const image = hctx.createImageData(width, height);
    const densities = new Float32Array(width * height);
    let maxDensity = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const density = targetDensity(x, y, width, height);
        densities[y * width + x] = density;
        maxDensity = Math.max(maxDensity, density);
      }
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const t = densities[y * width + x] / maxDensity;
        const i = (y * width + x) * 4;
        image.data[i] = Math.round(t * 220);
        image.data[i + 1] = Math.round(t * t * 95);
        image.data[i + 2] = Math.round(t * t * 35);
        image.data[i + 3] = Math.round(6 + t * 205);
      }
    }

    hctx.putImageData(image, 0, 0);
    heatmapRef.current = heatmap;

    const state = runtimeRef.current;
    const scaleX = width / Math.max(state.width, 1);
    const scaleY = height / Math.max(state.height, 1);
    state.width = width;
    state.height = height;
    state.x = state.x ? clamp(state.x * scaleX, 10, width - 10) : width * 0.35;
    state.y = state.y ? clamp(state.y * scaleY, 10, height - 10) : height * 0.5;
    state.chain = state.chain.length
      ? state.chain.map((point) => ({
          ...point,
          x: clamp(point.x * scaleX, 10, width - 10),
          y: clamp(point.y * scaleY, 10, height - 10),
        }))
      : [{ x: state.x, y: state.y, accepted: true }];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    const state = runtimeRef.current;
    state.running = false;
    state.phase = "idle";
    state.x = state.width * 0.35;
    state.y = state.height * 0.5;
    state.chain = [{ x: state.x, y: state.y, accepted: true }];
    state.proposed = null;

    setUi((current) => ({
      ...INITIAL_UI,
      version: current.version + 1,
    }));
    draw();
  }, [clearTimers, draw]);

  const doStep = useCallback(() => {
    const state = runtimeRef.current;
    if (state.phase !== "idle") return;

    state.phase = "propose";
    const px = clamp(state.x + randn() * sigma, 10, state.width - 10);
    const py = clamp(state.y + randn() * sigma, 10, state.height - 10);
    const pcurr = targetDensity(state.x, state.y, state.width, state.height);
    const pprop = targetDensity(px, py, state.width, state.height);
    const alpha = Math.min(1, pprop / Math.max(pcurr, 1e-10));

    state.proposed = { x: px, y: py, accepted: false };
    setUi((current) => ({
      ...current,
      step: 1,
      currentDensity: pcurr,
      proposedDensity: pprop,
      formula: `alpha = min(1, ${pprop.toFixed(4)} / ${pcurr.toFixed(4)}) = ${alpha.toFixed(4)}`,
      formulaState: "",
      formulaSub: "Candidate sampled from proposal distribution",
      version: current.version + 1,
    }));
    draw();

    const decisionTimer = setTimeout(() => {
      const latest = runtimeRef.current;
      const u = Math.random();
      const accepted = u < alpha;
      latest.phase = "decide";
      latest.proposed.accepted = accepted;

      setUi((current) => ({
        ...current,
        step: 3,
        formulaState: accepted ? "accept" : "reject",
        formulaSub: accepted
          ? `u = ${u.toFixed(3)} < alpha = ${alpha.toFixed(3)} -> accept`
          : `u = ${u.toFixed(3)} >= alpha = ${alpha.toFixed(3)} -> reject`,
        version: current.version + 1,
      }));
      draw();

      const settleTimer = setTimeout(() => {
        const settled = runtimeRef.current;
        if (accepted) {
          settled.x = px;
          settled.y = py;
          settled.chain.push({ x: settled.x, y: settled.y, accepted: true });
        } else {
          settled.chain.push({ x: settled.x, y: settled.y, accepted: false });
        }

        if (settled.chain.length > 500) {
          settled.chain = settled.chain.slice(-500);
        }
        settled.proposed = null;
        settled.phase = "idle";

        setUi((current) => ({
          ...current,
          accepts: current.accepts + (accepted ? 1 : 0),
          rejects: current.rejects + (accepted ? 0 : 1),
          step: 0,
          version: current.version + 1,
        }));
        draw();
      }, 360);

      timeoutsRef.current.push(settleTimer);
    }, 560);

    timeoutsRef.current.push(decisionTimer);
  }, [draw, sigma]);

  const scheduleAuto = useCallback(() => {
    const state = runtimeRef.current;
    if (!state.running) return;

    const delay = Math.max(170, Math.round(1500 / speed));
    timerRef.current = setTimeout(() => {
      doStep();
      scheduleAuto();
    }, delay);
  }, [doStep, speed]);

  const toggleRun = useCallback(() => {
    const state = runtimeRef.current;
    state.running = !state.running;
    setUi((current) => ({ ...current }));

    if (state.running) {
      scheduleAuto();
    } else {
      clearTimers();
    }
  }, [clearTimers, scheduleAuto]);

  useEffect(() => {
    buildHeatmap();
    draw();

    const onResize = () => {
      buildHeatmap();
      draw();
      setUi((current) => ({ ...current, version: current.version + 1 }));
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimers();
    };
  }, [buildHeatmap, clearTimers, draw]);

  const running = runtimeRef.current.running;
  const maxDensity = Math.max(
    ui.currentDensity || 0,
    ui.proposedDensity || 0,
    0.001,
  );

  return (
    <section className="mh-step">
      <header className="mh-step__header">
        <h1>Metropolis-Hastings</h1>
        <span>MCMC sampling visualizer</span>
      </header>

      <div className="mh-step__body">
        <div className="mh-step__canvas-panel">
          <div className="mh-step__canvas-label">
            Target distribution / sample chain
          </div>
          <div className="mh-step__counters">
            <span>
              <i className="mh-step__dot mh-step__dot--accept" />
              {ui.accepts} accepted
            </span>
            <span>
              <i className="mh-step__dot mh-step__dot--reject" />
              {ui.rejects} rejected
            </span>
          </div>
          <canvas ref={canvasRef} />
        </div>

        <aside className="mh-step__sidebar">
          <section className="mh-step__panel mh-step__panel--steps">
            <h2>Algorithm Steps</h2>
            {[
              ["Current state x", "Start at the present chain position."],
              ["Propose x'", "Draw a candidate near x using Gaussian noise."],
              ["Compute alpha", "Compare p(x') against p(x)."],
              ["Accept / reject", "Move to x' or repeat the old sample."],
            ].map(([title, text], index) => (
              <div
                className={[
                  "mh-step__step",
                  ui.step === index ? "mh-step__step--active" : "",
                  ui.step > index ? "mh-step__step--done" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={title}
              >
                <span>{index + 1}</span>
                <p>
                  <strong>{title}</strong>
                  {text}
                </p>
              </div>
            ))}
          </section>

          <section className="mh-step__panel">
            <h2>Acceptance Probability</h2>
            <div className={`mh-step__formula ${ui.formulaState}`}>
              {ui.formula}
            </div>
            <p className="mh-step__formula-sub">{ui.formulaSub}</p>
          </section>

          <section className="mh-step__panel">
            <h2>Density Comparison</h2>
            <div className="mh-step__bar-row">
              <span>p(x)</span>
              <div>
                <i
                  className="mh-step__bar mh-step__bar--current"
                  style={{
                    width: `${((ui.currentDensity || 0) / maxDensity) * 100}%`,
                  }}
                />
              </div>
              <b>{ui.currentDensity === null ? "-" : ui.currentDensity.toFixed(4)}</b>
            </div>
            <div className="mh-step__bar-row">
              <span>p(x')</span>
              <div>
                <i
                  className="mh-step__bar mh-step__bar--proposal"
                  style={{
                    width: `${((ui.proposedDensity || 0) / maxDensity) * 100}%`,
                  }}
                />
              </div>
              <b>{ui.proposedDensity === null ? "-" : ui.proposedDensity.toFixed(4)}</b>
            </div>
          </section>

          <section className="mh-step__panel mh-step__panel--samples">
            <h2>Sampling Data</h2>
            <div className="mh-step__sample-stats">
              <div>
                <span>n</span>
                <strong>{sampleStats.n}</strong>
              </div>
              <div>
                <span>mean</span>
                <strong>
                  {sampleStats.mean === null ? "-" : sampleStats.mean.toFixed(3)}
                </strong>
              </div>
              <div>
                <span>sigma</span>
                <strong>
                  {sampleStats.sigma === null
                    ? "-"
                    : sampleStats.sigma.toFixed(3)}
                </strong>
              </div>
            </div>
            <div className="mh-step__sample-values">
              {sampleStats.values.length
                ? sampleStats.values.map((value, index) => (
                    <span key={`${index}-${value.toFixed(3)}`}>
                      {value.toFixed(2)}
                    </span>
                  ))
                : "-"}
            </div>
          </section>

          <section className="mh-step__panel mh-step__panel--controls">
            <h2>Controls</h2>
            <div className="mh-step__buttons">
              <button onClick={doStep} disabled={runtimeRef.current.phase !== "idle"}>
                Step
              </button>
              <button onClick={toggleRun}>{running ? "Pause" : "Auto Run"}</button>
              <button onClick={reset}>Reset</button>
            </div>
            <label>
              Proposal sigma
              <input
                max="80"
                min="5"
                onChange={(event) => setSigma(Number(event.target.value))}
                type="range"
                value={sigma}
              />
              <span>{sigma}</span>
            </label>
            <label>
              Speed
              <input
                max="10"
                min="1"
                onChange={(event) => setSpeed(Number(event.target.value))}
                type="range"
                value={speed}
              />
              <span>{speed}</span>
            </label>
          </section>
        </aside>
      </div>
    </section>
  );
}
