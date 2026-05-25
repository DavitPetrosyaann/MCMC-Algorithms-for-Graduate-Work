import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "./MonteCarloLab.scss";

const LABS = [
  "Buffon's Needle",
  "PRNG (LCG)",
  "Pi Estimation",
  "Lake Surface Calc",
  "Integral",
];
const PRNG_SEED = 42;
const PRNG_AUTO_BATCH = 20;
const PRNG_HIST_BINS = 20;
const BUFFON_L = 0.8;
const BUFFON_D = 1;
const LAKE_WIDTH = 760;
const LAKE_HEIGHT = 300;

function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: {
      ticks: { color: "#4a4464", font: { family: "IBM Plex Mono", size: 10 } },
      grid: { color: "rgba(255,255,255,0.05)" },
    },
    y: {
      ticks: { color: "#4a4464", font: { family: "IBM Plex Mono", size: 10 } },
      grid: { color: "rgba(255,255,255,0.05)" },
    },
  },
};

export default function MonteCarloLab() {
  const [activeLab, setActiveLab] = useState(0);

  return (
    <section className="mc-lab">
      <nav className="mc-lab__nav">
        <div className="mc-lab__brand">MC LAB</div>
        {LABS.map((lab, index) => (
          <button
            className={activeLab === index ? "active" : ""}
            key={lab}
            type="button"
            onClick={() => setActiveLab(index)}
          >
            {String(index + 1).padStart(2, "0")}. {lab}
          </button>
        ))}
      </nav>

      <main className="mc-lab__main">
        {activeLab === 0 && <BuffonLabUpdated />}
        {activeLab === 1 && <PrngLab />}
        {activeLab === 2 && <PiLab />}
        {activeLab === 3 && <LakeSurfaceLab />}
        {activeLab === 4 && <IntegrationLab />}
      </main>
    </section>
  );
}

function useChart(ref, configFactory, deps = []) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return undefined;
    chartRef.current = new Chart(ref.current, configFactory());
    return () => chartRef.current?.destroy();
  }, deps);

  return chartRef;
}

function Stat({ label, value }) {
  return (
    <div className="mc-stat">
      {label}: <span>{value}</span>
    </div>
  );
}

function PrngLab() {
  const traceRef = useRef(null);
  const scatterRef = useRef(null);
  const histRef = useRef(null);
  const [samples, setSamples] = useState([]);
  const [autoRun, setAutoRun] = useState(false);
  const stateRef = useRef(PRNG_SEED);

  const traceChart = useChart(
    traceRef,
    () => ({
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            borderColor: "rgba(167,139,250,0.86)",
            borderWidth: 1.8,
            pointRadius: 0,
            tension: 0.34,
          },
        ],
      },
      options: {
        ...chartOptions,
        parsing: false,
        scales: {
          x: { ...chartOptions.scales.x, type: "linear", min: 0, max: 199 },
          y: { ...chartOptions.scales.y, min: 0, max: 1 },
        },
      },
    }),
    [],
  );
  const scatterChart = useChart(
    scatterRef,
    () => ({
      type: "scatter",
      data: {
        datasets: [
          {
            data: [],
            backgroundColor: "rgba(232,197,71,0.74)",
            pointRadius: 2.35,
          },
        ],
      },
      options: {
        ...chartOptions,
        scales: {
          x: { ...chartOptions.scales.x, type: "linear", min: 0, max: 1 },
          y: { ...chartOptions.scales.y, min: 0, max: 1 },
        },
      },
    }),
    [],
  );
  const histChart = useChart(
    histRef,
    () => ({
      type: "bar",
      data: {
        labels: Array.from({ length: PRNG_HIST_BINS }, (_, i) =>
          ((i + 0.5) / PRNG_HIST_BINS).toFixed(2),
        ),
        datasets: [
          {
            data: new Array(PRNG_HIST_BINS).fill(null),
            backgroundColor: "rgba(106,197,197,0.65)",
          },
        ],
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          y: {
            ...chartOptions.scales.y,
            beginAtZero: true,
            suggestedMax: 10,
            ticks: {
              ...chartOptions.scales.y.ticks,
              callback: (value) => `${value}%`,
            },
          },
        },
      },
    }),
    [],
  );

  useEffect(() => {
    if (!traceChart.current || !scatterChart.current || !histChart.current)
      return;

    const trace = samples.slice(-200);
    const smoothTrace = trace.map((_, index) => {
      const start = Math.max(0, index - 5);
      const window = trace.slice(start, index + 1);
      return window.reduce((sum, value) => sum + value, 0) / window.length;
    });
    traceChart.current.data.labels = [];
    traceChart.current.data.datasets[0].data = smoothTrace.map(
      (value, index) => ({
        x: index,
        y: value,
      }),
    );
    traceChart.current.update("none");

    const sc = samples.slice(-500);
    scatterChart.current.data.datasets[0].data = sc.map((value, index) => ({
      x: value,
      y: samples[samples.length - sc.length + index + 1] ?? value,
    }));
    scatterChart.current.update("none");

    const counts = new Array(PRNG_HIST_BINS).fill(0);
    samples.forEach((sample) => {
      counts[
        Math.min(PRNG_HIST_BINS - 1, Math.floor(sample * PRNG_HIST_BINS))
      ] += 1;
    });
    histChart.current.data.datasets[0].data = counts.map((count) =>
      samples.length ? (count / samples.length) * 100 : 0,
    );
    histChart.current.update("none");
  }, [samples, traceChart, scatterChart, histChart]);

  useEffect(() => {
    if (!autoRun) return undefined;

    const id = window.setInterval(() => generate(PRNG_AUTO_BATCH), 95);
    return () => window.clearInterval(id);
  }, [autoRun]);

  function generate(count) {
    const next = [];
    let current = stateRef.current;
    for (let i = 0; i < count; i += 1) {
      current = (Math.imul(1664525, current) + 1013904223) >>> 0;
      next.push(current / 4294967296);
    }
    stateRef.current = current;
    setSamples((old) => [...old, ...next].slice(-100000));
  }

  function reset() {
    setAutoRun(false);
    stateRef.current = PRNG_SEED;
    setSamples([]);
  }

  const mean = samples.length
    ? samples.reduce((a, b) => a + b, 0) / samples.length
    : 0;
  const intervalCounts = new Array(PRNG_HIST_BINS).fill(0);
  samples.forEach((sample) => {
    intervalCounts[
      Math.min(PRNG_HIST_BINS - 1, Math.floor(sample * PRNG_HIST_BINS))
    ] += 1;
  });

  return (
    <LabLayout
      visual={
        <div className="mc-stack">
          <canvas ref={traceRef} />
          <canvas ref={scatterRef} />
          <canvas ref={histRef} />
        </div>
      }
      controls={
        <>
          <ControlCard title="LCG Generator">
            <Stat label="Seed" value={PRNG_SEED} />
            <Stat
              label="Recurrence"
              value={
                <>
                  x<sub>n+1</sub> = (a*x<sub>n</sub> + c) mod 2<sup>32</sup>
                </>
              }
            />
            <Stat label="a" value="1664525" />
            <Stat label="c" value="1013904223" />
            <button type="button" onClick={() => setAutoRun((value) => !value)}>
              {autoRun ? "Stop Auto" : "Auto Run"}
            </button>
            <button type="button" onClick={reset}>
              Reset
            </button>
          </ControlCard>
          <ControlCard>
            <Stat label="Count" value={samples.length.toLocaleString()} />
            <Stat label="Mean" value={mean.toFixed(4)} />
            <Stat
              label="Min"
              value={samples.length ? Math.min(...samples).toFixed(4) : "0"}
            />
            <Stat
              label="Max"
              value={samples.length ? Math.max(...samples).toFixed(4) : "0"}
            />
            <div className="mc-log">
              Uniform LCG stream. The scatter plot shows serial pairs (U_n,
              U_n+1); histogram convergence becomes visible at large N.
            </div>
          </ControlCard>
          <ControlCard title="Interval Counts">
            <div
              className="mc-interval-counts"
              aria-label="Generated numbers by histogram interval"
            >
              {intervalCounts.map((count, index) => {
                const start = index / PRNG_HIST_BINS;
                const end = (index + 1) / PRNG_HIST_BINS;
                return (
                  <div className="mc-interval-row" key={start}>
                    <span>
                      {start.toFixed(2)}-{end.toFixed(2)}
                    </span>
                    <b>{count.toLocaleString()}</b>
                  </div>
                );
              })}
            </div>
          </ControlCard>
        </>
      }
    />
  );
}

function BuffonLabUpdated() {
  const simRef = useRef(null);
  const chartRef = useRef(null);
  const rafRef = useRef(null);
  const intervalRef = useRef(null);
  const speedRef = useRef(20);
  const dataRef = useRef({ hits: 0, needles: [], piHistory: [], total: 0 });
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(20);
  const [stats, setStats] = useState({ hits: 0, pi: null, total: 0 });

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  function resizeCanvas(canvas) {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function throwNeedle() {
    const angle = Math.random() * Math.PI;
    const cx = Math.random();
    const cy = Math.random();
    const half = (BUFFON_L / 2) * Math.sin(angle);
    const x1 = cx - half;
    const x2 = cx + half;
    return {
      angle,
      cx,
      cy,
      hit: Math.floor(x1 / BUFFON_D) !== Math.floor(x2 / BUFFON_D),
    };
  }

  function simTick() {
    const data = dataRef.current;
    for (let i = 0; i < speedRef.current; i += 1) {
      const needle = throwNeedle();
      data.total += 1;
      if (needle.hit) data.hits += 1;
      data.needles.push(needle);
      if (data.needles.length > 600) data.needles.shift();

      if (data.hits && (data.total <= 3000 || data.total % 20 === 0)) {
        const estimate = (2 * BUFFON_L * data.total) / (BUFFON_D * data.hits);
        if (Number.isFinite(estimate) && estimate > 0 && estimate < 10) {
          data.piHistory.push({ n: data.total, value: estimate });
          if (data.piHistory.length > 6000) data.piHistory.splice(0, 1500);
        }
      }
    }
  }

  function drawSimulation() {
    const canvas = simRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pixPerD = width / 4;
    const needles = dataRef.current.needles;

    ctx.fillStyle = "#07070c";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const x = i * pixPerD;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    needles.forEach((needle, index) => {
      const alpha = 0.16 + 0.74 * (index / Math.max(1, needles.length - 1));
      const x = ((needle.cx * 4) % 1) * width;
      const y = needle.cy * height;
      const halfX = (BUFFON_L / 2) * Math.sin(needle.angle) * pixPerD;
      const halfY = (BUFFON_L / 2) * Math.cos(needle.angle) * (height / 8);
      const x1 = x - halfX;
      const y1 = y - halfY;
      const x2 = x + halfX;
      const y2 = y + halfY;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = needle.hit ? "#f97316" : "#5b5bd6";
      ctx.lineWidth = index === needles.length - 1 ? 2.3 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (index === needles.length - 1) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = needle.hit ? "#f97316" : "#5b5bd6";
        ctx.beginPath();
        ctx.arc(x1, y1, 2.2, 0, Math.PI * 2);
        ctx.arc(x2, y2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(85,85,106,0.72)";
    ctx.font = "11px IBM Plex Mono, monospace";
    ctx.fillText("l = 0.8", 10, height - 28);
    ctx.fillText("d = 1.0", 10, height - 12);
  }

  function drawChart() {
    const canvas = chartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const history = dataRef.current.piHistory;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#080810";
    ctx.fillRect(0, 0, width, height);
    if (history.length < 2) return;

    const pad = { bottom: 18, left: 38, right: 12, top: 8 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const values = history.map((point) => point.value);
    let yMin = Math.max(1, Math.min(...values) - 0.5);
    let yMax = Math.min(7, Math.max(...values) + 0.5);
    yMin = Math.min(yMin, Math.PI - 0.5);
    yMax = Math.max(yMax, Math.PI + 0.5);
    const maxN = history[history.length - 1].n;
    const xScale = (n) => pad.left + (n / maxN) * chartWidth;
    const yScale = (value) =>
      pad.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let value = Math.ceil(yMin * 2) / 2; value <= yMax; value += 0.5) {
      const y = yScale(value);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartWidth, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(85,85,106,0.66)";
      ctx.font = "9px IBM Plex Mono, monospace";
      ctx.fillText(value.toFixed(1), 4, y + 3);
    }

    const piY = yScale(Math.PI);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.moveTo(pad.left, piY);
    ctx.lineTo(pad.left + chartWidth, piY);
    ctx.stroke();
    ctx.setLineDash([]);

    const step = Math.max(1, Math.floor(history.length / 260));
    const points = [];
    for (let i = 0; i < history.length; i += step) {
      points.push({ x: xScale(history[i].n), y: yScale(history[i].value) });
    }

    ctx.strokeStyle = "rgba(212,168,67,0.32)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    ctx.strokeStyle = "#d4a843";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.fillStyle = "#d4a843";
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAll() {
    drawSimulation();
    drawChart();
  }

  function snapshot() {
    const { hits, total } = dataRef.current;
    const pi = hits ? (2 * BUFFON_L * total) / (BUFFON_D * hits) : null;
    return { hits, pi, total };
  }

  useEffect(() => {
    const resize = () => {
      resizeCanvas(simRef.current);
      resizeCanvas(chartRef.current);
      drawAll();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = window.setInterval(simTick, 16);
    const loop = () => {
      drawAll();
      setStats(snapshot());
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.clearInterval(intervalRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  function reset() {
    setRunning(false);
    dataRef.current = { hits: 0, needles: [], piHistory: [], total: 0 };
    setStats({ hits: 0, pi: null, total: 0 });
    drawAll();
  }

  const error = stats.pi ? Math.abs(stats.pi - Math.PI) : null;

  return (
    <div className="mc-buffon-app">
      <header>
        <div className="mc-buffon-title">
          Buffon's Needle - Monte Carlo - Geometric Probability · 1777 ·
          Georges-Louis Leclerc, Comte de Buffon
        </div>
        <div className="mc-buffon-status">
          <div className={running ? "mc-buffon-dot on" : "mc-buffon-dot"} />
          <span>{running ? "Running" : stats.total ? "Paused" : "Idle"}</span>
        </div>
      </header>

      <div className="mc-buffon-sim">
        <canvas ref={simRef} />
      </div>

      <aside className="mc-buffon-side">
        <div className="mc-buffon-formula-panel">
          <div className="mc-math-line">
            <span className="sym">P</span>
            <span className="op">=</span>
            <span className="frac">
              <span className="num">
                2<span className="sym">l</span>
              </span>
              <span className="den">
                <span className="pi">π</span> · <span className="sym">d</span>
              </span>
            </span>
            <span className="op">=</span>
            <span className="frac">
              <span className="num">
                2 · <span className="val">0.8</span>
              </span>
              <span className="den">
                <span className="pi">π</span> · <span className="val">1.0</span>
              </span>
            </span>
          </div>
          <div className="mc-math-line">
            <span className="pi">π</span>
            <span className="op">≈</span>
            <span className="frac">
              <span className="num">
                2<span className="sym">l</span> · <span className="sym">N</span>
              </span>
              <span className="den">
                <span className="sym">d</span> ·{" "}
                <span className="sym">
                  N<sub>hit</sub>
                </span>
              </span>
            </span>
            <span className="op">=</span>
            <span className="frac">
              <span className="num">
                2 · <span className="val">0.8</span> ·{" "}
                <span className="sym">N</span>
              </span>
              <span className="den">
                <span className="val">1.0</span> ·{" "}
                <span className="sym">
                  N<sub>hit</sub>
                </span>
              </span>
            </span>
          </div>
          <div className="mc-math-line">
            <span className="sym">P</span>
            <span className="op">≈</span>
            <span className="frac">
              <span className="num">
                <span className="sym">
                  N<sub>hit</sub>
                </span>
              </span>
              <span className="den">
                <span className="sym">N</span>
              </span>
            </span>
            <span className="op">=&gt; </span>
            <span className="pi">π</span>
            <span className="op">≈</span>
            <span className="frac">
              <span className="num">
                2<span className="sym">l</span>
              </span>
              <span className="den">
                <span className="sym">d</span>
              </span>
            </span>
            <span className="op">·</span>
            <span className="frac">
              <span className="num">
                <span className="sym">N</span>
              </span>
              <span className="den">
                <span className="sym">
                  N<sub>hit</sub>
                </span>
              </span>
            </span>
          </div>
        </div>

        <div className="mc-buffon-pi-big">
          <div className="pi-row">
            <div className="pi-num">{stats.pi ? stats.pi.toFixed(6) : "—"}</div>
            <div className="pi-real">≈ 3.14159265...</div>
          </div>
          <div className="pi-err">
            {error
              ? `σ = ±${error.toFixed(6)} (${((error / Math.PI) * 100).toFixed(3)}%)`
              : ""}
          </div>
        </div>

        <div className="mc-buffon-counts">
          <div className="count-box">
            <div className="stat-name">N - needles</div>
            <div className="stat-val">{formatCompact(stats.total)}</div>
          </div>
          <div className="count-box">
            <div className="stat-name">
              N<sub>hit</sub> - hits
            </div>
            <div className="stat-val hit">{formatCompact(stats.hits)}</div>
          </div>
        </div>

        <div className="mc-buffon-ctrl-strip">
          <div className="btn-row">
            <button
              className="primary"
              type="button"
              onClick={() => setRunning((value) => !value)}
            >
              {running ? "Stop" : "Start"}
            </button>
            <button className="danger" type="button" onClick={reset}>
              ↻
            </button>
          </div>
          <div className="speed-row">
            {[5, 20, 80, 300].map((value) => (
              <button
                className={speed === value ? "sp on" : "sp"}
                key={value}
                type="button"
                onClick={() => setSpeed(value)}
              >
                x{value}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="mc-buffon-chart-row">
        <div className="chart-hdr">
          <span className="chart-title">Convergence of pi estimate</span>
          <div className="legend">
            <div className="lg">
              <div className="lg-dot gold" />
              pi estimate
            </div>
            <div className="lg">
              <div className="lg-dot real" />
              real pi
            </div>
            <div className="lg">
              <div className="lg-dot hit" />
              hit
            </div>
            <div className="lg">
              <div className="lg-dot miss" />
              miss
            </div>
          </div>
        </div>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}

function PiLab() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [state, setState] = useState({ inside: 0, points: [], total: 0 });

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const size = Math.min(rect.width, rect.height) * 0.88;
    const ox = (rect.width - size) / 2;
    const oy = (rect.height - size) / 2;
    ctx.fillStyle = "#080810";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(ox, oy, size, size);
    ctx.strokeStyle = "rgba(232,197,71,0.7)";
    ctx.beginPath();
    ctx.arc(ox + size / 2, oy + size / 2, size / 2, 0, Math.PI * 2);
    ctx.stroke();
    state.points.forEach((point) => {
      ctx.fillStyle = point.in
        ? "rgba(232,197,71,0.72)"
        : "rgba(224,92,74,0.45)";
      ctx.beginPath();
      ctx.arc(ox + point.x * size, oy + point.y * size, 1.35, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  useEffect(draw, [state]);
  useEffect(() => {
    if (!running) return undefined;
    const speeds = [4, 20, 100, 500];
    const loop = () => {
      setState((current) => addPiPoints(current, speeds[speed - 1]));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, speed]);

  const estimate = state.total ? (4 * state.inside) / state.total : null;

  return (
    <LabLayout
      visual={
        <>
          <div className="mc-pi-label">
            π ≈ {estimate ? estimate.toFixed(5) : "—"}
          </div>
          <canvas ref={canvasRef} />
        </>
      }
      controls={
        <>
          <ControlCard title="Dart Throwing">
            <button type="button" onClick={() => setRunning((value) => !value)}>
              {running ? "Stop" : "Start"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setState({ inside: 0, points: [], total: 0 });
              }}
            >
              Reset
            </button>
            <label>Speed</label>
            <input
              type="range"
              min="1"
              max="4"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <Stat label="Value" value={`×${[1, 5, 25, 125][speed - 1]}`} />
          </ControlCard>
          <ControlCard>
            <Stat label="Total" value={state.total.toLocaleString()} />
            <Stat label="Inside" value={state.inside.toLocaleString()} />
            <Stat label="Result" value={estimate ? estimate.toFixed(5) : "—"} />
            <Stat
              label="Error"
              value={estimate ? Math.abs(estimate - Math.PI).toFixed(5) : "—"}
            />
          </ControlCard>
        </>
      }
    />
  );
}

function addPiPoints(current, count) {
  let inside = current.inside;
  let total = current.total;
  const points = [...current.points];
  for (let i = 0; i < count; i += 1) {
    const x = Math.random();
    const y = Math.random();
    const hit = Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2) <= 0.25;
    if (hit) inside += 1;
    total += 1;
    points.push({ x, y, in: hit });
  }
  return { inside, points: points.slice(-6000), total };
}

function LakeSurfaceLab() {
  const simRef = useRef(null);
  const errRef = useRef(null);
  const rafRef = useRef(null);
  const speedRef = useRef(30);
  const shapeRef = useRef(createLakeShape(0));
  const trueAreaRef = useRef(polygonArea(shapeRef.current));
  const dataRef = useRef({ errorHistory: [], inside: 0, points: [], total: 0 });
  const [dotRadius, setDotRadius] = useState(2);
  const [maxPoints, setMaxPoints] = useState(8000);
  const [running, setRunning] = useState(false);
  const [shapeIndex, setShapeIndex] = useState(0);
  const [speed, setSpeed] = useState(30);
  const [stats, setStats] = useState({
    area: null,
    errorPct: null,
    inside: 0,
    ratio: null,
    total: 0,
    trueArea: trueAreaRef.current,
  });

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  function resizeCanvas(canvas) {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function snapshot() {
    const { inside, total } = dataRef.current;
    if (!total) {
      return {
        area: null,
        errorPct: null,
        inside,
        ratio: null,
        total,
        trueArea: trueAreaRef.current,
      };
    }
    const ratio = inside / total;
    const area = ratio * LAKE_WIDTH * LAKE_HEIGHT;
    return {
      area,
      errorPct:
        (Math.abs(area - trueAreaRef.current) / trueAreaRef.current) * 100,
      inside,
      ratio,
      total,
      trueArea: trueAreaRef.current,
    };
  }

  function resetData() {
    dataRef.current = { errorHistory: [], inside: 0, points: [], total: 0 };
    setStats(snapshot());
  }

  function rebuildLake(index) {
    setRunning(false);
    shapeRef.current = createLakeShape(index);
    trueAreaRef.current = polygonArea(shapeRef.current);
    resetData();
    drawAll();
  }

  function drawLakeBackground(ctx, width, height) {
    const scaleX = width / LAKE_WIDTH;
    const scaleY = height / LAKE_HEIGHT;
    const shape = shapeRef.current;

    ctx.fillStyle = "#080810";
    ctx.fillRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(shape[0][0] * scaleX, shape[0][1] * scaleY);
    for (let i = 1; i < shape.length; i += 1) {
      ctx.lineTo(shape[i][0] * scaleX, shape[i][1] * scaleY);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(79,163,255,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(79,163,255,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawSimulation() {
    const canvas = simRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const scaleX = width / LAKE_WIDTH;
    const scaleY = height / LAKE_HEIGHT;

    drawLakeBackground(ctx, width, height);
    dataRef.current.points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x * scaleX, point.y * scaleY, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = point.hit
        ? "rgba(29,233,182,0.78)"
        : "rgba(255,107,74,0.58)";
      ctx.fill();
    });
  }

  function drawErrorChart() {
    const canvas = errRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const history = dataRef.current.errorHistory;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#080810";
    ctx.fillRect(0, 0, width, height);
    if (history.length < 2) return;

    const maxError = Math.max(2, ...history.map((item) => item.errorPct));
    const y = (value) =>
      height - 6 - (height - 18) * (Math.min(value, maxError) / maxError);

    ctx.strokeStyle = "#1de9b6";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    history.forEach((item, index) => {
      const x = (width * index) / Math.max(1, history.length - 1);
      if (index === 0) ctx.moveTo(x, y(item.errorPct));
      else ctx.lineTo(x, y(item.errorPct));
    });
    ctx.stroke();

    const last = history[history.length - 1];
    ctx.fillStyle = "#1de9b6";
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.fillText(`${last.errorPct.toFixed(2)}%`, width - 58, 14);
  }

  function drawAll() {
    drawSimulation();
    drawErrorChart();
  }

  function step() {
    const data = dataRef.current;
    for (let i = 0; i < speedRef.current && data.total < maxPoints; i += 1) {
      const x = Math.random() * LAKE_WIDTH;
      const y = Math.random() * LAKE_HEIGHT;
      const hit = pointInPolygon(x, y, shapeRef.current);
      data.total += 1;
      if (hit) data.inside += 1;
      data.points.push({ hit, x, y });
      if (data.points.length > 5000) data.points.shift();
    }

    const current = snapshot();
    if (
      current.errorPct !== null &&
      (data.total <= 100 || data.total % 100 === 0)
    ) {
      data.errorHistory.push({ errorPct: current.errorPct, n: data.total });
      if (data.errorHistory.length > 300) data.errorHistory.shift();
    }

    if (data.total >= maxPoints) setRunning(false);
  }

  useEffect(() => {
    const resize = () => {
      resizeCanvas(simRef.current);
      resizeCanvas(errRef.current);
      drawAll();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    rebuildLake(shapeIndex);
  }, [shapeIndex]);

  useEffect(() => {
    if (!running) return undefined;
    const loop = () => {
      step();
      drawAll();
      setStats(snapshot());
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, maxPoints, dotRadius]);

  function reset() {
    setRunning(false);
    resetData();
    drawAll();
  }

  return (
    <div className="mc-lake-app">
      <header>
        <h1>Lake Surface Calc</h1>
      </header>

      <div className="mc-lake-controls">
        <div className="mc-lake-ctrl">
          <div className="mc-lake-ctrl-label">Speed (points/frame)</div>
          <div className="mc-lake-ctrl-row">
            <input
              type="range"
              min="1"
              max="300"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
            <span>{speed}</span>
          </div>
        </div>
        <div className="mc-lake-ctrl">
          <div className="mc-lake-ctrl-label">Max points</div>
          <div className="mc-lake-ctrl-row">
            <input
              type="range"
              min="500"
              max="100000"
              step="500"
              value={maxPoints}
              onChange={(event) => setMaxPoints(Number(event.target.value))}
            />
            <span>{maxPoints.toLocaleString()}</span>
          </div>
        </div>
        <div className="mc-lake-ctrl">
          <div className="mc-lake-ctrl-label">Lake shape (1-6)</div>
          <div className="mc-lake-ctrl-row">
            <input
              type="range"
              min="1"
              max="6"
              value={shapeIndex + 1}
              onChange={(event) =>
                setShapeIndex(Number(event.target.value) - 1)
              }
            />
            <span>{shapeIndex + 1}</span>
          </div>
        </div>
        <div className="mc-lake-ctrl">
          <div className="mc-lake-ctrl-label">Dot size</div>
          <div className="mc-lake-ctrl-row">
            <input
              type="range"
              min="1"
              max="5"
              value={dotRadius}
              onChange={(event) => setDotRadius(Number(event.target.value))}
            />
            <span>{dotRadius}</span>
          </div>
        </div>
      </div>

      <div className="mc-lake-stats">
        <div className="mc-lake-stat">
          <div className="mc-lake-stat-label">Total points</div>
          <div className="mc-lake-stat-value">
            {stats.total.toLocaleString()}
          </div>
        </div>
        <div className="mc-lake-stat teal">
          <div className="mc-lake-stat-label">Inside lake</div>
          <div className="mc-lake-stat-value teal">
            {stats.inside.toLocaleString()}
          </div>
        </div>
        <div className="mc-lake-stat">
          <div className="mc-lake-stat-label">Ratio</div>
          <div className="mc-lake-stat-value">
            {stats.ratio === null ? "—" : `${(stats.ratio * 100).toFixed(2)}%`}
          </div>
        </div>
        <div className="mc-lake-stat teal">
          <div className="mc-lake-stat-label">Estimated area (px2)</div>
          <div className="mc-lake-stat-value teal">
            {stats.area === null
              ? "—"
              : Math.round(stats.area).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mc-lake-canvas-wrap">
        <canvas ref={simRef} />
        <div className="mc-lake-info">
          <span>
            True area{" "}
            <strong>
              {Math.round(stats.trueArea).toLocaleString()} px<sup>2</sup>
            </strong>
          </span>
          <span>
            Error{" "}
            <span className="err-val">
              {stats.errorPct === null ? "—" : `${stats.errorPct.toFixed(2)}%`}
            </span>
          </span>
        </div>
        <div className="mc-lake-overlay">
          <div className="mc-lake-leg-item">
            <span className="mc-lake-leg-dot teal" />
            inside
          </div>
          <div className="mc-lake-leg-item">
            <span className="mc-lake-leg-dot coral" />
            outside
          </div>
          <div className="mc-lake-leg-item">
            <span className="mc-lake-leg-dot blue" />
            lake
          </div>
        </div>
      </div>

      <div className="mc-lake-err-wrap">
        <canvas ref={errRef} />
        <div className="mc-lake-err-label">Error curve (% from true area)</div>
      </div>

      <div className="mc-lake-buttons">
        <button
          className="play"
          type="button"
          onClick={() => setRunning((value) => !value)}
        >
          <span className={running ? "mc-lake-sq-icon" : "mc-lake-dot-icon"} />
          {running ? "Stop" : "Start"}
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
        <button
          type="button"
          onClick={() => setShapeIndex((value) => (value + 1) % 6)}
        >
          New Lake
        </button>
      </div>
    </div>
  );
}

function createLakeShape(index) {
  const w = LAKE_WIDTH;
  const h = LAKE_HEIGHT;
  const cx = w / 2;
  const cy = h / 2;
  const points = [];

  if (index === 1) {
    for (let i = 0; i < 20; i += 1) {
      const angle = (Math.PI * 2 * i) / 20;
      const jx = (Math.random() - 0.5) * 0.05;
      const jy = (Math.random() - 0.5) * 0.05;
      points.push([
        cx + (0.4 + jx) * w * Math.cos(angle),
        cy + (0.2 + jy) * h * Math.sin(angle),
      ]);
    }
    return points;
  }

  if (index === 2) {
    const radii = [
      0.28, 0.23, 0.16, 0.22, 0.27, 0.25, 0.14, 0.2, 0.26, 0.22, 0.17, 0.24,
      0.27, 0.21, 0.18, 0.25,
    ];
    return radii.map((radius, i) => {
      const angle = (Math.PI * 2 * i) / radii.length;
      return [
        cx + radius * Math.min(w, h) * Math.cos(angle),
        cy + radius * Math.min(w, h) * Math.sin(angle),
      ];
    });
  }

  if (index === 3) {
    const bumps = [
      0, 0.07, -0.05, 0.09, -0.03, 0.1, -0.07, 0.08, -0.04, 0.1, -0.02, 0.06,
      0.05, -0.08, 0.09, -0.03, 0.07, -0.05, 0.1, -0.02, 0.08, -0.06, 0.11,
      -0.01, 0.07, -0.04, 0.09, -0.03, 0.06, -0.08,
    ];
    return bumps.map((bump, i) => {
      const angle = (Math.PI * 2 * i) / bumps.length;
      const radius = 0.26 * Math.min(w, h) + bump * Math.min(w, h);
      return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
    });
  }

  if (index === 4) {
    for (let i = 0; i < 20; i += 1) {
      const angle = (Math.PI * 2 * i) / 20 - Math.PI / 2;
      const radius = (i % 2 === 0 ? 0.3 : 0.15) * Math.min(w, h);
      points.push([
        cx + radius * Math.cos(angle),
        cy + radius * Math.sin(angle),
      ]);
    }
    return points;
  }

  if (index === 5) {
    const radii = [
      0.2, 0.16, 0.11, 0.18, 0.14, 0.2, 0.12, 0.17, 0.19, 0.13, 0.15, 0.21,
      0.11, 0.18, 0.16, 0.2, 0.14, 0.12, 0.19, 0.15, 0.17, 0.11, 0.2, 0.13,
    ];
    return radii.map((radius, i) => {
      const angle = (Math.PI * 2 * i) / radii.length;
      return [
        w * 0.48 + radius * Math.min(w, h) * Math.cos(angle),
        cy + radius * Math.min(w, h) * Math.sin(angle),
      ];
    });
  }

  const radii = [
    0.3, 0.26, 0.32, 0.28, 0.22, 0.29, 0.31, 0.24, 0.33, 0.27, 0.2, 0.28, 0.3,
    0.25, 0.23, 0.29,
  ];
  return radii.map((radius, i) => {
    const angle = (Math.PI * 2 * i) / radii.length;
    return [
      cx + radius * Math.min(w, h) * Math.cos(angle),
      cy + radius * Math.min(w, h) * Math.sin(angle),
    ];
  });
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const next = (i + 1) % points.length;
    area += points[i][0] * points[next][1] - points[next][0] * points[i][1];
  }
  return Math.abs(area) / 2;
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function IntegrationLab() {
  const chartRef = useRef(null);
  const convRef = useRef(null);
  const runRef = useRef(null);
  const [funcKey, setFuncKey] = useState("x2");
  const [running, setRunning] = useState(false);
  const [sampleCount, setSampleCount] = useState(100);
  const [result, setResult] = useState(null);
  const convDataRef = useRef([]);
  const functions = {
    x2: { f: (x) => x * x, a: 0, b: 1, true: 1 / 3, label: "f(x) = x² [0,1]" },
    sin: {
      f: (x) => Math.sin(x),
      a: 0,
      b: Math.PI,
      true: 2,
      label: "f(x) = sin(x) [0,π]",
    },
    exp: {
      f: (x) => Math.exp(x),
      a: 0,
      b: 1,
      true: Math.E - 1,
      label: "f(x) = eˣ [0,1]",
    },
    gauss: {
      f: (x) => Math.exp(-x * x),
      a: 0,
      b: 2,
      true: 0.88208,
      label: "f(x) = exp(-x²) [0,2]",
    },
  };
  const mainChart = useChart(
    chartRef,
    () => ({
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            borderColor: "rgba(232,197,71,0.8)",
            backgroundColor: "rgba(232,197,71,0.08)",
            pointRadius: 0,
            fill: true,
          },
          {
            data: [],
            type: "scatter",
            backgroundColor: "rgba(106,197,197,0.7)",
            pointRadius: 3,
          },
        ],
      },
      options: chartOptions,
    }),
    [],
  );
  const convChart = useChart(
    convRef,
    () => ({
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            borderColor: "rgba(224,92,74,0.8)",
            borderWidth: 1.5,
            pointRadius: 0,
          },
          {
            data: [],
            borderColor: "rgba(232,197,71,0.4)",
            borderWidth: 1,
            pointRadius: 0,
            borderDash: [4, 4],
          },
        ],
      },
      options: chartOptions,
    }),
    [],
  );

  function drawFunctionCurve(fn) {
    const grid = Array.from(
      { length: 100 },
      (_, i) => fn.a + ((fn.b - fn.a) * i) / 99,
    );
    mainChart.current.data.labels = grid.map((x) => x.toFixed(2));
    mainChart.current.data.datasets[0].data = grid.map(fn.f);
    mainChart.current.data.datasets[1].data = [];

    // Configure x-axis with proper bounds for the function domain
    mainChart.current.options.scales.x = {
      ...mainChart.current.options.scales.x,
      type: "linear",
      min: fn.a,
      max: fn.b,
    };

    mainChart.current.update("none");
  }

  function cancelRun() {
    if (runRef.current?.frameId) cancelAnimationFrame(runRef.current.frameId);
    runRef.current = null;
  }

  function updateConvergence(count, err) {
    convDataRef.current = [...convDataRef.current, { n: count, err }].slice(
      -30,
    );
    convChart.current.data.labels = convDataRef.current.map((d) => d.n);
    convChart.current.data.datasets[0].data = convDataRef.current.map(
      (d) => d.err,
    );
    convChart.current.data.datasets[1].data = convDataRef.current.map(
      (d) => 1 / Math.sqrt(d.n),
    );
    convChart.current.update("none");
  }

  function run() {
    if (!mainChart.current || !convChart.current) return;

    cancelRun();

    const fn = functions[funcKey];
    const target = sampleCount;
    const batchSize = Math.max(1, Math.ceil(target / 80));

    // Pre-compute bounds for the bounding box
    const boundsGrid = Array.from({ length: 50 }, (_, i) =>
      fn.f(fn.a + ((fn.b - fn.a) * i) / 49),
    );
    const yMax = Math.max(...boundsGrid, 0);
    const yMin = Math.min(...boundsGrid, 0);

    const progress = {
      count: 0,
      frameId: null,
      under: 0,
      xs: [],
      ys: [],
    };

    runRef.current = progress;
    setRunning(true);
    setResult({
      estimate: 0,
      trueValue: fn.true,
      err: Math.abs(fn.true),
      se: 0,
      samples: 0,
    });
    drawFunctionCurve(fn);

    const tick = () => {
      const current = runRef.current;
      if (current !== progress) return;

      const remaining = target - current.count;
      const frameCount = Math.min(batchSize, remaining);
      for (let i = 0; i < frameCount; i += 1) {
        const x = fn.a + (fn.b - fn.a) * Math.random();
        const ySampled = yMin + (yMax - yMin) * Math.random();
        const yActual = fn.f(x);
        const isUnder =
          (yActual >= yMin && ySampled <= yActual) ||
          (yActual < yMin && ySampled >= yActual);

        current.count += 1;
        if (isUnder) current.under += 1;
        current.xs.push(x);
        current.ys.push(ySampled);
      }

      const ratio = current.under / current.count;
      const boxArea = (fn.b - fn.a) * (yMax - yMin);
      const estimate = boxArea * ratio;
      const variance = Math.max(0, (ratio * (1 - ratio)) / current.count);
      const se = Math.sqrt(variance) * boxArea;
      const err = Math.abs(estimate - fn.true);

      mainChart.current.data.datasets[1].data = current.xs
        .slice(-800)
        .map((x, i, visibleXs) => {
          const offset = current.ys.length - visibleXs.length;
          const yVal = current.ys[offset + i];
          const yActual = fn.f(x);
          const isUnder =
            (yActual >= yMin && yVal <= yActual) ||
            (yActual < yMin && yVal >= yActual);
          return { x, y: yVal, under: isUnder };
        });
      mainChart.current.update("none");
      setResult({
        estimate,
        trueValue: fn.true,
        err,
        se,
        samples: current.count,
      });

      if (current.count < target) {
        current.frameId = requestAnimationFrame(tick);
        return;
      }

      updateConvergence(current.count, err);
      runRef.current = null;
      setRunning(false);
    };

    progress.frameId = requestAnimationFrame(tick);
  }

  useEffect(() => {
    convDataRef.current = [];
    run();
    return cancelRun;
  }, [funcKey]);

  useEffect(() => () => cancelRun(), []);

  return (
    <LabLayout
      visual={
        <div className="mc-stack mc-stack--two">
          <canvas ref={chartRef} />
          <canvas ref={convRef} />
        </div>
      }
      controls={
        <>
          <ControlCard title="Integration">
            <select
              value={funcKey}
              onChange={(e) => setFuncKey(e.target.value)}
            >
              {Object.entries(functions).map(([key, fn]) => (
                <option key={key} value={key}>
                  {fn.label}
                </option>
              ))}
            </select>
            <label>N Samples</label>
            <input
              type="range"
              min="10"
              max="2000"
              value={sampleCount}
              onChange={(e) => setSampleCount(Number(e.target.value))}
            />
            <Stat label="N" value={sampleCount} />
            <button type="button" onClick={run}>
              {running ? "Running" : "Run"}
            </button>
          </ControlCard>
          <ControlCard>
            <Stat
              label="Drawn"
              value={(result?.samples ?? 0).toLocaleString()}
            />
            <Stat
              label="Estimate"
              value={result ? result.estimate.toFixed(6) : "—"}
            />
            <Stat
              label="Analytical"
              value={result ? result.trueValue.toFixed(6) : "—"}
            />
            <Stat
              label="Abs Error"
              value={result ? result.err.toFixed(6) : "—"}
            />
            <Stat
              label="Std Error"
              value={result ? result.se.toFixed(6) : "—"}
            />
          </ControlCard>
        </>
      }
    />
  );
}

function LabLayout({ controls, visual }) {
  return (
    <div className="mc-page">
      <div className="mc-viz">{visual}</div>
      <aside className="mc-controls">{controls}</aside>
    </div>
  );
}

function ControlCard({ children, title }) {
  return (
    <section className="mc-card">
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}
