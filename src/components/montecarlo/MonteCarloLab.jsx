import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "./MonteCarloLab.scss";

const LABS = [
  "PRNG (LCG)",
  "Buffon's Needle",
  "Pi Estimation",
  "MC Integration",
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: { ticks: { color: "#4a4464", font: { family: "IBM Plex Mono", size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
    y: { ticks: { color: "#4a4464", font: { family: "IBM Plex Mono", size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
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
        {activeLab === 0 && <PrngLab />}
        {activeLab === 1 && <BuffonLab />}
        {activeLab === 2 && <PiLab />}
        {activeLab === 3 && <IntegrationLab />}
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
  const [seed, setSeed] = useState(42);
  const [samples, setSamples] = useState([]);
  const [autoRun, setAutoRun] = useState(false);
  const stateRef = useRef(42);

  const traceChart = useChart(traceRef, () => ({
    type: "line",
    data: { labels: [], datasets: [{ data: [], borderColor: "rgba(167,139,250,0.8)", borderWidth: 1, pointRadius: 0 }] },
    options: chartOptions,
  }), []);
  const scatterChart = useChart(scatterRef, () => ({
    type: "scatter",
    data: { datasets: [{ data: [], backgroundColor: "rgba(232,197,71,0.7)", pointRadius: 1.5 }] },
    options: chartOptions,
  }), []);
  const histChart = useChart(histRef, () => ({
    type: "bar",
    data: {
      labels: Array.from({ length: 20 }, (_, i) => ((i + 0.5) / 20).toFixed(2)),
      datasets: [{ data: new Array(20).fill(0), backgroundColor: "rgba(106,197,197,0.65)" }],
    },
    options: chartOptions,
  }), []);

  useEffect(() => {
    stateRef.current = seed;
    setSamples([]);
    setAutoRun(false);
  }, [seed]);

  useEffect(() => {
    const trace = samples.slice(-200);
    traceChart.current.data.labels = trace.map((_, i) => i);
    traceChart.current.data.datasets[0].data = trace;
    traceChart.current.update("none");

    const sc = samples.slice(-501);
    scatterChart.current.data.datasets[0].data = sc.slice(0, -1).map((value, index) => ({ x: value, y: sc[index + 1] }));
    scatterChart.current.update("none");

    const counts = new Array(20).fill(0);
    samples.forEach((sample) => counts[Math.min(19, Math.floor(sample * 20))] += 1);
    histChart.current.data.datasets[0].data = counts;
    histChart.current.update("none");
  }, [samples, traceChart, scatterChart, histChart]);

  useEffect(() => {
    if (!autoRun) return undefined;

    const id = window.setInterval(() => generate(1000), 70);
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

  const mean = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;

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
            <label>Seed</label>
            <input type="range" min="1" max="100" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
            <Stat label="Current seed" value={seed} />
            <Stat label="Recurrence" value="xₙ₊₁ = (a·xₙ + c) mod 2³²" />
            <Stat label="a" value="1664525" />
            <Stat label="c" value="1013904223" />
            <button type="button" onClick={() => generate(1000)}>Generate 1,000</button>
            <button type="button" onClick={() => generate(10000)}>Generate 10,000</button>
            <button type="button" onClick={() => setAutoRun((value) => !value)}>
              {autoRun ? "Stop Auto" : "Auto Run"}
            </button>
            <button type="button" onClick={() => { setAutoRun(false); stateRef.current = seed; setSamples([]); }}>Reset</button>
          </ControlCard>
          <ControlCard>
            <Stat label="Count" value={samples.length.toLocaleString()} />
            <Stat label="Mean" value={mean.toFixed(4)} />
            <Stat label="Min" value={samples.length ? Math.min(...samples).toFixed(4) : "0"} />
            <Stat label="Max" value={samples.length ? Math.max(...samples).toFixed(4) : "0"} />
            <div className="mc-log">
              Uniform LCG stream. The scatter plot shows serial pairs (Uₙ, Uₙ₊₁);
              histogram convergence becomes visible at large N.
            </div>
          </ControlCard>
        </>
      }
    />
  );
}

function BuffonLab() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ hits: 0, needles: [], total: 0 });
  const needleLength = 72;
  const lineGap = 120;

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#080810";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.setLineDash([3, 4]);
    for (let y = lineGap; y < rect.height; y += lineGap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    stats.needles.forEach((needle) => {
      ctx.strokeStyle = needle.hit ? "#e8c547" : "rgba(106,197,197,0.5)";
      ctx.lineWidth = needle.hit ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(needle.x1, needle.y1);
      ctx.lineTo(needle.x2, needle.y2);
      ctx.stroke();
    });
  }

  useEffect(draw, [stats, lineGap]);
  useEffect(() => {
    if (!running) return undefined;
    const loop = () => {
      setStats((current) => dropNeedles(current, canvasRef.current, needleLength, lineGap, 120));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, needleLength, lineGap]);

  const pi = stats.hits ? (2 * needleLength * stats.total) / (lineGap * stats.hits) : null;

  return (
    <LabLayout
      visual={<canvas ref={canvasRef} />}
      controls={
        <>
          <ControlCard title="Buffon's Needle">
            <Stat label="Needle Length (L)" value={`${needleLength}px`} />
            <Stat label="Line Gap (d)" value={`${lineGap}px`} />
            <div className="mc-log">
              Fixed geometry keeps L ≤ d, matching Buffon's classical formula:
              π ≈ 2LN / dH. More drops improve convergence.
            </div>
            <button type="button" onClick={() => setRunning((value) => !value)}>{running ? "Stop" : "Start"}</button>
            <button type="button" onClick={() => setStats((current) => dropNeedles(current, canvasRef.current, needleLength, lineGap, 10000))}>Drop 10,000</button>
            <button type="button" onClick={() => { setRunning(false); setStats({ hits: 0, needles: [], total: 0 }); }}>Reset</button>
          </ControlCard>
          <ControlCard>
            <Stat label="Total (N)" value={stats.total.toLocaleString()} />
            <Stat label="Hits (H)" value={stats.hits.toLocaleString()} />
            <Stat label="pi ≈" value={pi ? pi.toFixed(5) : "—"} />
            <Stat label="Error" value={pi ? Math.abs(pi - Math.PI).toFixed(5) : "—"} />
          </ControlCard>
        </>
      }
    />
  );
}

function dropNeedles(current, canvas, length, gap, count) {
  if (!canvas) return current;
  const rect = canvas.parentElement.getBoundingClientRect();
  let hits = current.hits;
  let total = current.total;
  const needles = [...current.needles];
  for (let i = 0; i < count; i += 1) {
    const cx = Math.random() * rect.width;
    const cy = Math.random() * rect.height;
    const angle = Math.random() * Math.PI;
    const dx = (Math.cos(angle) * length) / 2;
    const dy = (Math.sin(angle) * length) / 2;
    const needle = { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy, hit: false };
    for (let k = 1; k * gap < rect.height + gap; k += 1) {
      const y = k * gap;
      if ((needle.y1 < y && needle.y2 >= y) || (needle.y1 >= y && needle.y2 < y)) needle.hit = true;
    }
    if (needle.hit) hits += 1;
    total += 1;
    needles.push(needle);
  }
  return { hits, needles: needles.slice(-400), total };
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
      ctx.fillStyle = point.in ? "rgba(232,197,71,0.72)" : "rgba(224,92,74,0.45)";
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
      visual={<><div className="mc-pi-label">π ≈ {estimate ? estimate.toFixed(5) : "—"}</div><canvas ref={canvasRef} /></>}
      controls={
        <>
          <ControlCard title="Dart Throwing">
            <button type="button" onClick={() => setRunning((value) => !value)}>{running ? "Stop" : "Start"}</button>
            <button type="button" onClick={() => { setRunning(false); setState({ inside: 0, points: [], total: 0 }); }}>Reset</button>
            <label>Speed</label>
            <input type="range" min="1" max="4" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            <Stat label="Value" value={`×${[1, 5, 25, 125][speed - 1]}`} />
          </ControlCard>
          <ControlCard>
            <Stat label="Total" value={state.total.toLocaleString()} />
            <Stat label="Inside" value={state.inside.toLocaleString()} />
            <Stat label="Result" value={estimate ? estimate.toFixed(5) : "—"} />
            <Stat label="Error" value={estimate ? Math.abs(estimate - Math.PI).toFixed(5) : "—"} />
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
    const hit = (x - 0.5) ** 2 + (y - 0.5) ** 2 <= 0.25;
    if (hit) inside += 1;
    total += 1;
    points.push({ x, y, in: hit });
  }
  return { inside, points: points.slice(-6000), total };
}

function IntegrationLab() {
  const chartRef = useRef(null);
  const convRef = useRef(null);
  const [funcKey, setFuncKey] = useState("x2");
  const [sampleCount, setSampleCount] = useState(100);
  const [result, setResult] = useState(null);
  const convDataRef = useRef([]);
  const functions = {
    x2: { f: (x) => x * x, a: 0, b: 1, true: 1 / 3, label: "f(x) = x² [0,1]" },
    sin: { f: (x) => Math.sin(x), a: 0, b: Math.PI, true: 2, label: "f(x) = sin(x) [0,π]" },
    exp: { f: (x) => Math.exp(x), a: 0, b: 1, true: Math.E - 1, label: "f(x) = eˣ [0,1]" },
    gauss: { f: (x) => Math.exp(-x * x), a: 0, b: 2, true: 0.88208, label: "f(x) = e^(-x²) [0,2]" },
  };
  const mainChart = useChart(chartRef, () => ({
    type: "line",
    data: { labels: [], datasets: [
      { data: [], borderColor: "rgba(232,197,71,0.8)", backgroundColor: "rgba(232,197,71,0.08)", pointRadius: 0, fill: true },
      { data: [], type: "scatter", backgroundColor: "rgba(106,197,197,0.7)", pointRadius: 3 },
    ] },
    options: chartOptions,
  }), []);
  const convChart = useChart(convRef, () => ({
    type: "line",
    data: { labels: [], datasets: [
      { data: [], borderColor: "rgba(224,92,74,0.8)", borderWidth: 1.5, pointRadius: 0 },
      { data: [], borderColor: "rgba(232,197,71,0.4)", borderWidth: 1, pointRadius: 0, borderDash: [4, 4] },
    ] },
    options: chartOptions,
  }), []);

  function run() {
    const fn = functions[funcKey];
    const xs = Array.from({ length: sampleCount }, () => fn.a + (fn.b - fn.a) * Math.random());
    const ys = xs.map(fn.f);
    const mean = ys.reduce((a, b) => a + b, 0) / sampleCount;
    const estimate = (fn.b - fn.a) * mean;
    const sigma = Math.sqrt(ys.reduce((acc, y) => acc + (y - mean) ** 2, 0) / sampleCount);
    const se = (sigma / Math.sqrt(sampleCount)) * (fn.b - fn.a);
    const err = Math.abs(estimate - fn.true);
    setResult({ estimate, trueValue: fn.true, err, se });

    const grid = Array.from({ length: 100 }, (_, i) => fn.a + ((fn.b - fn.a) * i) / 99);
    mainChart.current.data.labels = grid.map((x) => x.toFixed(2));
    mainChart.current.data.datasets[0].data = grid.map(fn.f);
    mainChart.current.data.datasets[1].data = xs.slice(0, 800).map((x, i) => ({ x, y: ys[i] }));
    mainChart.current.update("none");

    convDataRef.current = [...convDataRef.current, { n: sampleCount, err }].slice(-30);
    convChart.current.data.labels = convDataRef.current.map((d) => d.n);
    convChart.current.data.datasets[0].data = convDataRef.current.map((d) => d.err);
    convChart.current.data.datasets[1].data = convDataRef.current.map((d) => 1 / Math.sqrt(d.n));
    convChart.current.update("none");
  }

  useEffect(() => {
    convDataRef.current = [];
    run();
  }, [funcKey]);

  return (
    <LabLayout
      visual={<div className="mc-stack mc-stack--two"><canvas ref={chartRef} /><canvas ref={convRef} /></div>}
      controls={
        <>
          <ControlCard title="Integration">
            <select value={funcKey} onChange={(e) => setFuncKey(e.target.value)}>
              {Object.entries(functions).map(([key, fn]) => <option key={key} value={key}>{fn.label}</option>)}
            </select>
            <label>N Samples</label>
            <input type="range" min="10" max="2000" value={sampleCount} onChange={(e) => setSampleCount(Number(e.target.value))} />
            <Stat label="N" value={sampleCount} />
            <button type="button" onClick={run}>Run</button>
          </ControlCard>
          <ControlCard>
            <Stat label="Estimate" value={result ? result.estimate.toFixed(6) : "—"} />
            <Stat label="Analytical" value={result ? result.trueValue.toFixed(6) : "—"} />
            <Stat label="Abs Error" value={result ? result.err.toFixed(6) : "—"} />
            <Stat label="Std Error" value={result ? result.se.toFixed(6) : "—"} />
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
