import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./NuclearMarkovLab.scss";

const TRAVEL = 0.4;
const MAX_PARTICLES = 1000;

function mean(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function std(values, avg) {
  return values.length
    ? Math.sqrt(
        values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) /
          values.length,
      )
    : 0;
}

class Neutron {
  constructor(x, y, generation = 0) {
    this.x = x;
    this.y = y;
    this.vx = 2 + Math.random() * 1.15;
    this.vy = (Math.random() - 0.5) * 3.2;
    this.generation = generation;
    this.active = true;
  }
}

export default function NuclearMarkovLab() {
  const simRef = useRef(null);
  const growthRef = useRef(null);
  const histRef = useRef(null);
  const rafRef = useRef(null);
  const autoRef = useRef(null);
  const particlesRef = useRef([]);
  const historyRef = useRef([]);
  const kDataRef = useRef([]);
  const frameRef = useRef(0);
  const pausedRef = useRef(false);

  const [pFiss, setPFiss] = useState(0.4);
  const [paused, setPaused] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [stats, setStats] = useState({
    kAvg: 0,
    sigma: 0,
    neutrons: 0,
  });

  const pAbsorb = useMemo(() => 1 - TRAVEL - pFiss, [pFiss]);
  const criticalK = useMemo(() => (pFiss * 2) / (1 - TRAVEL), [pFiss]);
  const isCritical = criticalK > 1.05;

  const resizeCanvas = useCallback((canvas) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const runMonteCarloTrial = useCallback(() => {
    const start = 12;
    let final = 0;

    for (let j = 0; j < start; j += 1) {
      let active = true;
      let guard = 0;

      while (active && guard < 80) {
        guard += 1;
        const r = Math.random();

        if (r < TRAVEL) continue;
        if (r < TRAVEL + pAbsorb) {
          active = false;
        } else {
          active = false;
          final += 2;
        }
      }
    }

    const runs = [...kDataRef.current, final / start].slice(-900);
    const avg = mean(runs);
    kDataRef.current = runs;
    setStats((current) => ({
      ...current,
      kAvg: avg,
      sigma: std(runs, avg),
    }));
  }, [pAbsorb]);

  const drawHistogram = useCallback(() => {
    const canvas = histRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const data = kDataRef.current;
    const bins = 32;
    const maxK = 2.5;
    const counts = Array.from({ length: bins }, () => 0);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#05050a";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(224,224,224,0.36)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(`k distribution (${data.length})`, 8, 14);

    if (!data.length) return;

    data.forEach((value) => {
      const index = Math.floor((value / maxK) * bins);
      if (index >= 0 && index < bins) counts[index] += 1;
    });

    const maxCount = Math.max(1, ...counts);
    const barWidth = width / bins;
    counts.forEach((count, index) => {
      const x = index * barWidth;
      const h = (count / maxCount) * (height - 24);
      const k = (index * maxK) / bins;
      ctx.fillStyle = k > 1 ? "rgba(255,62,96,0.62)" : "rgba(0,210,255,0.6)";
      ctx.fillRect(x + 1, height - h - 12, Math.max(1, barWidth - 2), h);
    });

    const avg = mean(data);
    const sigma = Math.max(std(data, avg), 0.001);
    ctx.beginPath();
    ctx.strokeStyle = "#00d2ff";
    ctx.lineWidth = 1.7;
    for (let x = 0; x < width; x += 1) {
      const k = (x / width) * maxK;
      const density =
        (1 / (sigma * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * Math.pow((k - avg) / sigma, 2));
      const y = height - 12 - density * 28;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, []);

  const drawGrowth = useCallback(() => {
    const canvas = growthRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const history = historyRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#05050a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i += 1) {
      const y = (height * i) / 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const maxN = Math.max(100, ...history);
    ctx.beginPath();
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    history.forEach((value, index) => {
      const x = (index / Math.max(1, history.length - 1)) * width;
      const y = height - 10 - (value / maxN) * (height - 22);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "rgba(224,224,224,0.36)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("N(t)", 8, 14);
  }, []);

  const drawSimulation = useCallback(() => {
    const canvas = simRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#05050a";
    ctx.fillRect(0, 0, width, height);

    particlesRef.current.forEach((particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = particle.generation > 3 ? "#ff3e60" : "#00d2ff";
      ctx.fill();
    });
  }, []);

  const injectOne = useCallback(() => {
    const canvas = simRef.current;
    if (!canvas) return;
    particlesRef.current.push(
      new Neutron(
        10,
        10 + Math.random() * Math.max(20, canvas.clientHeight - 20),
      ),
    );
  }, []);

  const injectMany = useCallback(
    (count) => {
      for (let i = 0; i < count; i += 1) {
        injectOne();
      }
    },
    [injectOne],
  );

  const resetAll = useCallback(() => {
    particlesRef.current = [];
    historyRef.current = [];
    kDataRef.current = [];
    frameRef.current = 0;
    setStats({ kAvg: 0, neutrons: 0, sigma: 0 });
    drawHistogram();
    drawGrowth();
  }, [drawGrowth, drawHistogram]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (autoRun) {
      autoRef.current = setInterval(injectOne, 520);
    }

    return () => {
      if (autoRef.current) {
        clearInterval(autoRef.current);
        autoRef.current = null;
      }
    };
  }, [autoRun, injectOne]);

  useEffect(() => {
    const resize = () => {
      [simRef.current, growthRef.current, histRef.current].forEach(resizeCanvas);
      drawHistogram();
      drawGrowth();
    };

    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const canvas = simRef.current;
      const width = canvas?.clientWidth || 0;
      const height = canvas?.clientHeight || 0;

      if (!pausedRef.current && canvas) {
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i -= 1) {
          const particle = particles[i];
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.y < 2) {
            particle.y = 2;
            particle.vy = Math.abs(particle.vy);
          } else if (particle.y > height - 2) {
            particle.y = height - 2;
            particle.vy = -Math.abs(particle.vy);
          }

          if (Math.random() < 0.05) {
            const r = Math.random();
            if (r >= TRAVEL + pAbsorb) {
              particle.active = false;
              if (particles.length < MAX_PARTICLES) {
                particles.push(
                  new Neutron(particle.x, particle.y, particle.generation + 1),
                );
                particles.push(
                  new Neutron(particle.x, particle.y, particle.generation + 1),
                );
              }
            } else if (r >= TRAVEL) {
              particle.active = false;
            }
          }

          if (particle.x > width) {
            particle.active = false;
          }
        }

        particlesRef.current = particles.filter((particle) => particle.active);
        frameRef.current += 1;

        if (frameRef.current % 5 === 0) {
          historyRef.current.push(particlesRef.current.length);
          if (historyRef.current.length > 280) historyRef.current.shift();
        }

        if (autoRun && frameRef.current % 6 === 0) {
          runMonteCarloTrial();
        }
      }

      drawSimulation();
      drawGrowth();
      drawHistogram();

      if (frameRef.current % 8 === 0) {
        setStats((current) => ({
          ...current,
          neutrons: particlesRef.current.length,
        }));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [
    autoRun,
    drawGrowth,
    drawHistogram,
    drawSimulation,
    pAbsorb,
    resizeCanvas,
    runMonteCarloTrial,
  ]);

  useEffect(() => {
    kDataRef.current = [];
    setStats((current) => ({ ...current, kAvg: 0, sigma: 0 }));
    drawHistogram();
  }, [drawHistogram, pAbsorb]);

  useEffect(() => {
    drawHistogram();
  }, [drawHistogram, stats.kAvg, stats.sigma]);

  return (
    <section className="nuclear-markov">
      <div className="nuclear-markov__left nuclear-markov__card">
        <p>Անցման Մատրից P</p>
        <table className="nuclear-markov__matrix">
          <tbody>
            <tr>
              <th />
              <th>Tr</th>
              <th>Ab</th>
              <th>Fi</th>
            </tr>
            <tr>
              <th>Tr</th>
              <td>{TRAVEL.toFixed(2)}</td>
              <td>{pAbsorb.toFixed(2)}</td>
              <td>{pFiss.toFixed(2)}</td>
            </tr>
            <tr>
              <th>Ab</th>
              <td>0</td>
              <td>1</td>
              <td>0</td>
            </tr>
            <tr>
              <th>Fi</th>
              <td>0</td>
              <td>0</td>
              <td>1</td>
            </tr>
          </tbody>
        </table>

        <div className="nuclear-markov__matrix-note">
          <h3>States</h3>

          <section>
            <b>Tr - Traveling</b>
            <span>Active neutron movement through the reactor surface.</span>
          </section>

          <section>
            <b>Ab - Absorbed</b>
            <span>Absorbed neutron; this chain branch stops.</span>
          </section>

          <section>
            <b>Fi - Fission</b>
            <span>Fission event; the branch creates two new neutron paths.</span>
          </section>
        </div>

        <p>Մոնտե Կառլո Բաշխում</p>
        <canvas ref={histRef} />
        <p>k-ի հիստոգրամ՝ ըստ Monte Carlo փորձարկումների։</p>
      </div>

      <div className="nuclear-markov__center">
        <div className="nuclear-markov__card nuclear-markov__reactor">
          <p>Ակտիվ Գոտի</p>
          <canvas ref={simRef} />
          <div className="nuclear-markov__buttons">
            <button
              className={paused ? "is-danger" : ""}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              className={autoRun ? "is-active" : ""}
              onClick={() => setAutoRun((value) => !value)}
            >
              Auto Run: {autoRun ? "On" : "Off"}
            </button>
            <button className="is-blue" onClick={injectOne}>
              +1 Նեյտրոն
            </button>
            <button className="is-blue" onClick={() => injectMany(10)}>
              +10
            </button>
            <button className="is-blue" onClick={() => injectMany(50)}>
              +50
            </button>
            <button className="is-blue" onClick={() => injectMany(100)}>
              +100
            </button>
          </div>
        </div>

        <div className="nuclear-markov__card nuclear-markov__growth">
          <p>Էքսպոնենցիալ Աճ N(t)</p>
          <canvas ref={growthRef} />
        </div>
      </div>

      <div className="nuclear-markov__right nuclear-markov__card">
        <p>Հավանականության փոփոխություն</p>
        <label className="nuclear-markov__slider">
          <span>
            P(Fission): <b>{pFiss.toFixed(2)}</b>
          </span>
          <input
            max="0.59"
            min="0.05"
            onChange={(event) => setPFiss(Number(event.target.value))}
            step="0.01"
            type="range"
            value={pFiss}
          />
        </label>

        <p>Վիճակագրություն</p>
        <div className="nuclear-markov__stats">
          <span>
            k-avg <b>{stats.kAvg.toFixed(2)}</b>
          </span>
          <span>
            sigma <b>{stats.sigma.toFixed(3)}</b>
          </span>
          <span>
            Նեյտրոններ <b>{stats.neutrons}</b>
          </span>
        </div>

        <div className="nuclear-markov__k-info">
          <h3>k distribution</h3>
          <p>
            k-ն ցույց է տալիս, թե միջինում մեկ նեյտրոնից քանի նոր նեյտրոն է
            ծնվում։
          </p>
          <span>
            <b>k &lt; 1</b> շղթան մարում է
          </span>
          <span>
            <b>k ≈ 1</b> կայուն վիճակ
          </span>
          <span>
            <b>k &gt; 1</b> շղթան աճում է
          </span>
        </div>

        <button className="nuclear-markov__reset" onClick={resetAll}>
          Reset All
        </button>

        <div
          className={`nuclear-markov__status ${
            isCritical ? "is-critical" : "is-stable"
          }`}
        >
          <span>{isCritical ? "Critical" : "Stable"}</span>
          <b>k = {criticalK.toFixed(2)}</b>
        </div>
      </div>
    </section>
  );
}
