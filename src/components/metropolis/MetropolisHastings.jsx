import { useCallback, useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "./MetropolisHastings.scss";

const INITIAL_PARAMS = {
  burnIn: 2000,
  iterations: 10000,
  sigma: 1,
};

const INITIAL_STATS = {
  acceptRate: "—",
  gauge: 0,
  gaugeTone: "warn",
  iteration: "—",
  mean: "—",
  samples: "—",
  std: "—",
};

function formatNumber(value) {
  return Number(value).toLocaleString();
}

function buildHistogram(samples, bins, xmin, xmax) {
  const width = (xmax - xmin) / bins;
  const counts = new Array(bins).fill(0);

  samples.forEach((sample) => {
    const index = Math.floor((sample - xmin) / width);
    if (index >= 0 && index < bins) counts[index] += 1;
  });

  const n = Math.max(1, samples.length);

  return {
    centers: Array.from(
      { length: bins },
      (_, i) => +(xmin + (i + 0.5) * width).toFixed(3),
    ),
    densities: counts.map((count) => count / (n * width)),
  };
}

function logTarget(x) {
  return -0.5 * Math.pow(x * x - 4, 2);
}

function targetPDF(x) {
  return Math.exp(logTarget(x));
}

export default function MetropolisHastings() {
  const traceCanvasRef = useRef(null);
  const histCanvasRef = useRef(null);
  const traceChartRef = useRef(null);
  const histChartRef = useRef(null);
  const timeoutRef = useRef(null);
  const rngRef = useRef(1);

  const [params, setParams] = useState(INITIAL_PARAMS);
  const [running, setRunning] = useState(false);
  const [burnProgress, setBurnProgress] = useState(0);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [stepLog, setStepLog] = useState(null);
  const [liveRows, setLiveRows] = useState([]);

  const resetRng = useCallback((seed = 42) => {
    rngRef.current = seed >>> 0 || 1;
  }, []);

  const lcg = useCallback(() => {
    rngRef.current = (Math.imul(1664525, rngRef.current) + 1013904223) | 0;
    return (rngRef.current >>> 0) / 4294967296;
  }, []);

  const randNorm = useCallback(() => {
    const u1 = Math.max(lcg(), 1e-12);
    const u2 = lcg();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }, [lcg]);

  const stopAnim = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setRunning(false);
  }, []);

  const updateCharts = useCallback(
    (burnSamples, postSamples, totalIter, burnIn) => {
      const traceChart = traceChartRef.current;
      const histChart = histChartRef.current;
      if (!traceChart || !histChart) return;

      const maxTrace = 3000;
      const allTrace = [...burnSamples, ...postSamples].slice(-maxTrace);
      const overflow = burnSamples.length + postSamples.length - maxTrace;
      const splitAt = Math.max(0, burnSamples.length - Math.max(0, overflow));
      const burnSlice = allTrace.slice(
        0,
        Math.min(splitAt, burnSamples.length),
      );
      const postSlice = allTrace.slice(burnSlice.length);
      const firstLabel = Math.max(0, totalIter - maxTrace);

      traceChart.data.labels = allTrace.map((_, index) => index + firstLabel);
      traceChart.data.datasets[0].data = [
        ...burnSlice,
        ...new Array(postSlice.length).fill(null),
      ];
      traceChart.data.datasets[1].data = [
        ...new Array(burnSlice.length).fill(null),
        ...postSlice,
      ];
      traceChart.update("none");

      setBurnProgress(
        totalIter > 0 ? Math.min(100, (burnIn / totalIter) * 100) : 0,
      );

      if (postSamples.length > 0) {
        const { centers, densities } = buildHistogram(postSamples, 60, -5, 5);
        histChart.data.labels = centers;
        histChart.data.datasets[0].data = densities;
        histChart.data.datasets[1].data = centers.map((x) => targetPDF(x));
        histChart.update("none");
      } else {
        histChart.data.labels = [];
        histChart.data.datasets[0].data = [];
        histChart.data.datasets[1].data = [];
        histChart.update("none");
      }
    },
    [],
  );

  const updateStats = useCallback((postSamples, accepted, totalIter) => {
    if (!postSamples.length) {
      setStats((current) => ({
        ...current,
        iteration: totalIter.toLocaleString(),
      }));
      return;
    }

    const n = postSamples.length;
    const mean = postSamples.reduce((sum, sample) => sum + sample, 0) / n;
    const std = Math.sqrt(
      postSamples.reduce((sum, sample) => sum + Math.pow(sample - mean, 2), 0) /
        n,
    );
    const acceptRate = (accepted / totalIter) * 100;

    setStats({
      acceptRate: `${acceptRate.toFixed(1)}%`,
      gauge: Math.min(100, acceptRate),
      gaugeTone: acceptRate >= 30 && acceptRate <= 60 ? "good" : "warn",
      iteration: totalIter.toLocaleString(),
      mean: mean.toFixed(5),
      samples: n.toLocaleString(),
      std: std.toFixed(5),
    });
  }, []);

  const pushLiveRow = useCallback((row) => {
    setLiveRows((current) => [row, ...current].slice(0, 14));
  }, []);

  const setLastStep = useCallback(
    (iter, x, xp, logR, alpha, u, accepted) => {
      const row = {
        accepted,
        alpha: alpha.toFixed(4),
        iter,
        logR: logR.toFixed(4),
        u: u.toFixed(4),
        x: x.toFixed(4),
        xp: xp.toFixed(4),
      };

      setStepLog(row);
      pushLiveRow(row);
    },
    [pushLiveRow],
  );

  const runMCMC = useCallback(
    (animate) => {
      stopAnim();
      setRunning(animate);
      setLiveRows([]);
      resetRng(42);

      if (histChartRef.current) {
        histChartRef.current.data.labels = [];
        histChartRef.current.data.datasets[0].data = [];
        histChartRef.current.data.datasets[1].data = [];
        histChartRef.current.update("none");
      }

      let x = 0;
      let accepted = 0;
      let iter = 0;
      const burnSamples = [];
      const postSamples = [];

      const runOneStep = () => {
        const previousX = x;
        const xp = x + randNorm() * params.sigma;
        const logR = logTarget(xp) - logTarget(x);
        const alpha = Math.min(1, Math.exp(logR));
        const u = lcg();
        const didAccept = u < alpha;

        if (didAccept) {
          x = xp;
          accepted += 1;
        }

        iter += 1;
        if (iter <= params.burnIn) burnSamples.push(x);
        else postSamples.push(x);

        return { alpha, didAccept, logR, previousX, u, xp };
      };

      if (!animate) {
        let last = null;
        while (iter < params.iterations) last = runOneStep();
        updateCharts(
          burnSamples,
          postSamples,
          params.iterations,
          params.burnIn,
        );
        updateStats(postSamples, accepted, params.iterations);
        if (last)
          setLastStep(
            params.iterations,
            last.previousX,
            last.xp,
            last.logR,
            last.alpha,
            last.u,
            last.didAccept,
          );
        setRunning(false);
        return;
      }

      function tick() {
        let last = null;
        for (let s = 0; s < 10 && iter < params.iterations; s += 1)
          last = runOneStep();

        updateCharts(burnSamples, postSamples, iter, params.burnIn);
        updateStats(postSamples, accepted, iter);
        if (last)
          setLastStep(
            iter,
            last.previousX,
            last.xp,
            last.logR,
            last.alpha,
            last.u,
            last.didAccept,
          );

        if (iter < params.iterations)
          timeoutRef.current = window.setTimeout(tick, 60);
        else setRunning(false);
      }

      timeoutRef.current = window.setTimeout(tick, 60);
    },
    [
      lcg,
      params,
      randNorm,
      resetRng,
      setLastStep,
      stopAnim,
      updateCharts,
      updateStats,
    ],
  );

  useEffect(() => {
    const gridColor = "rgba(255,255,255,0.06)";
    const tickColor = "#4a4760";
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    };

    traceChartRef.current = new Chart(traceCanvasRef.current, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            borderColor: "rgba(245,166,35,0.6)",
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
          },
          {
            data: [],
            borderColor: "#4f8ef7",
            backgroundColor: "rgba(79,142,247,0.07)",
            borderWidth: 1,
            pointRadius: 0,
            fill: true,
          },
        ],
      },
      options: {
        ...baseOptions,
        scales: {
          x: {
            ticks: {
              color: tickColor,
              maxTicksLimit: 8,
              font: { family: "JetBrains Mono", size: 10 },
            },
            grid: { color: gridColor },
          },
          y: {
            ticks: {
              color: tickColor,
              font: { family: "JetBrains Mono", size: 10 },
            },
            grid: { color: gridColor },
          },
        },
      },
    });

    histChartRef.current = new Chart(histCanvasRef.current, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: "rgba(79,142,247,0.55)",
            borderColor: "rgba(79,142,247,0.8)",
            borderWidth: 0.5,
            categoryPercentage: 1,
            barPercentage: 1,
          },
          {
            data: [],
            type: "line",
            borderColor: "#e05c4a",
            borderWidth: 2.5,
            pointRadius: 0,
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        ...baseOptions,
        scales: {
          x: {
            ticks: {
              color: tickColor,
              maxTicksLimit: 10,
              font: { family: "JetBrains Mono", size: 10 },
            },
            grid: { color: gridColor },
          },
          y: {
            ticks: {
              color: tickColor,
              font: { family: "JetBrains Mono", size: 10 },
            },
            grid: { color: gridColor },
          },
        },
      },
    });

    return () => {
      stopAnim();
      traceChartRef.current?.destroy();
      histChartRef.current?.destroy();
    };
  }, []);

  function updateParam(key, value) {
    setParams((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="mh-view">
      <header className="mh-header">
        <div>
          <h1>Metropolis MCMC — Ստանդարտ Նորմալ Բաշխում</h1>
          <p>
            Metropolis ձևը բիմոդալ f(x)-ից նմուշ վերցնելու համար։ Target
            density:{" "}
            <span className="mh-inline-math">
              p(x) ∝ e
              <sup>
                −(
                <span className="mh-frac-inline">
                  <span className="mh-frac-inline__top">1</span>
                  <span className="mh-frac-inline__bottom">2</span>
                </span>
                )(x<sup>2</sup>−4)<sup>2</sup>
              </sup>
            </span>
            , peaks at <span className="mh-inline-math">x = ±2</span>.
          </p>
        </div>
        <span className="mh-badge">seed = 42</span>
      </header>

      <div className="mh-grid">
        <aside className="mh-sidebar">
          <ControlSlider
            hint="Ավելի շատ = ավելի ճշգրիտ histogram"
            label="Iterations (N)"
            max="20000"
            min="500"
            step="500"
            value={params.iterations}
            valueLabel={formatNumber(params.iterations)}
            onChange={(value) => updateParam("iterations", value)}
          />
          <ControlSlider
            hint="Փոքր σ → բարձր accept, մեծ σ → ցածր accept"
            label="Step size (σ)"
            max="5"
            min="0.05"
            step="0.05"
            value={params.sigma}
            valueLabel={params.sigma.toFixed(2)}
            onChange={(value) => updateParam("sigma", value)}
          />
          <ControlSlider
            hint="Հեռացվող սկզբնական iteration-ները"
            label="Burn-in"
            max="5000"
            min="0"
            step="100"
            value={params.burnIn}
            valueLabel={formatNumber(params.burnIn)}
            onChange={(value) => updateParam("burnIn", value)}
          />

          <div className="mh-button-group">
            <button
              className="mh-run"
              type="button"
              onClick={() => runMCMC(false)}
            >
              ▶ Run
            </button>
            <button
              className="mh-anim"
              type="button"
              onClick={() => runMCMC(true)}
            >
              ◎ Animate
            </button>
            <button type="button" onClick={stopAnim}>
              ■ Stop
            </button>
          </div>

          <StatsPanel stats={stats} />
          <StepLog row={stepLog} />
        </aside>

        <main className="mh-charts">
          <ChartCard
            burnProgress={burnProgress}
            legend={[
              ["#4f8ef7", "x (post burn-in)"],
              ["rgba(245,166,35,0.6)", "burn-in"],
            ]}
            title="Trace Plot — շղթայի ուղին"
          >
            <canvas ref={traceCanvasRef} />
          </ChartCard>
          <ChartCard
            legend={[
              ["rgba(79,142,247,0.7)", "MCMC նմուշ"],
              ["#e05c4a", "Target theoretical"],
            ]}
            title="Histogram vs Տեսական բիմոդալ բաշխում"
          >
            <canvas ref={histCanvasRef} />
          </ChartCard>
          <LiveTable rows={liveRows} />
        </main>
      </div>
    </section>
  );
}

function ControlSlider({
  hint,
  label,
  max,
  min,
  onChange,
  step,
  value,
  valueLabel,
}) {
  return (
    <div className="mh-control">
      <div className="mh-control__head">
        <span>{label}</span>
        <b>{valueLabel}</b>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <p>{hint}</p>
    </div>
  );
}

function StatsPanel({ stats }) {
  return (
    <div className="mh-stats">
      <Stat label="Նմուշ" value={stats.samples} />
      <Stat label="Mean" value={stats.mean} />
      <Stat label="Std" value={stats.std} />
      <Stat label="Iter" value={stats.iteration} />
      <div className="mh-accept">
        <div>
          <span>Accept rate</span>
          <b className={stats.gaugeTone}>{stats.acceptRate}</b>
        </div>
        <div className="mh-gauge">
          <span
            className={stats.gaugeTone}
            style={{ width: `${stats.gauge}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="mh-stat">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function StepLog({ row }) {
  if (!row)
    return <div className="mh-step-log">— Run-ը սկսելուց հետո կերևա —</div>;

  return (
    <div className="mh-step-log">
      iter = <b>{Number(row.iter).toLocaleString()}</b>
      <br />x = <b>{row.x}</b> · x′ = <b>{row.xp}</b>
      <br />
      logR = <b>{row.logR}</b> · α = <b>{row.alpha}</b>
      <br />u = <b>{row.u}</b> →{" "}
      <strong className={row.accepted ? "acc" : "rej"}>
        {row.accepted ? "ԸՆԴՈՒՆՎԱԾ" : "ՄԵՐԺՎԱԾ"}
      </strong>
    </div>
  );
}

function ChartCard({ burnProgress, children, legend = [], title }) {
  return (
    <section className="mh-chart-card">
      {burnProgress !== undefined && (
        <div className="mh-burn-track">
          <span style={{ width: `${burnProgress}%` }} />
        </div>
      )}
      <div className="mh-chart-head">
        <span>{title}</span>
        <div>
          {legend.map(([color, label]) => (
            <em key={label}>
              <i style={{ background: color }} />
              {label}
            </em>
          ))}
        </div>
      </div>
      <div className="mh-chart-wrap">{children}</div>
    </section>
  );
}

function LiveTable({ rows }) {
  return (
    <section className="mh-live">
      <div className="mh-chart-head">
        <span>Կենդանի շղթայի վիճակ (Recent)</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Iter</th>
            <th>x</th>
            <th>x′</th>
            <th>logR</th>
            <th>α</th>
            <th>u</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={`${row.iter}-${row.u}`}>
                <td>{row.iter}</td>
                <td>{row.x}</td>
                <td>{row.xp}</td>
                <td>{row.logR}</td>
                <td>{row.alpha}</td>
                <td>{row.u}</td>
                <td className={row.accepted ? "accept" : "reject"}>
                  {row.accepted ? "✓" : "✗"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">— Սկսեք Run-ը —</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
