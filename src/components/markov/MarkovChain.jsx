import { useEffect, useMemo, useState } from "react";
import "./MarkovChain.scss";

const P = {
  v: { v: 0.13, c: 0.87 },
  c: { v: 0.65, c: 0.35 },
};

const INITIAL_COUNTS = { v: 0, c: 0 };
const INITIAL_TRANSITIONS = { vv: 0, vc: 0, cv: 0, cc: 0 };

function createInitialState(startState = "v") {
  return {
    counts: INITIAL_COUNTS,
    lastR: null,
    sequence: [],
    state: startState,
    startState,
    stepInfo: null,
    total: 0,
    trans: INITIAL_TRANSITIONS,
  };
}

function letter(state) {
  return state === "v" ? "Ձ" : "Բ";
}

function nextTransition(currentState) {
  const random = Math.random();
  const next = random <= P[currentState].v ? "v" : "c";
  return { next, random };
}

function buildStepInfo(from, to, random, total) {
  const threshold = P[from].v;
  const condition =
    random <= threshold
      ? `${random.toFixed(3)} <= ${threshold.toFixed(2)} -> Ձ`
      : `${random.toFixed(3)} > ${threshold.toFixed(2)} -> Բ`;

  return {
    condition,
    from,
    random,
    to,
    total,
  };
}

function applyStep(current) {
  const { next, random } = nextTransition(current.state);
  const key = `${current.state}${next}`;
  const sequence = [...current.sequence, next].slice(-60);
  const total = current.total + 1;

  return {
    ...current,
    counts: {
      ...current.counts,
      [next]: current.counts[next] + 1,
    },
    lastR: random,
    sequence,
    state: next,
    stepInfo: buildStepInfo(current.state, next, random, total),
    total,
    trans: {
      ...current.trans,
      [key]: current.trans[key] + 1,
    },
  };
}

function runSteps(current, count) {
  let nextState = current;
  for (let i = 0; i < count; i += 1) {
    nextState = applyStep(nextState);
  }
  return nextState;
}

export default function MarkovChain() {
  const [sim, setSim] = useState(() => createInitialState("v"));
  const [autoRunning, setAutoRunning] = useState(false);

  const stats = useMemo(() => {
    const pV = sim.total > 0 ? (sim.counts.v / sim.total) * 100 : 0;
    const pC = sim.total > 0 ? (sim.counts.c / sim.total) * 100 : 0;
    const convergence = sim.total > 0 ? Math.max(0, Math.min(100, 100 - Math.abs(pV - 43) * 6)) : 0;
    const fromV = sim.trans.vv + sim.trans.vc;
    const fromC = sim.trans.cv + sim.trans.cc;

    return {
      convergence,
      fromC,
      fromV,
      pC,
      pV,
    };
  }, [sim]);

  useEffect(() => {
    if (!autoRunning) return undefined;

    const interval = window.setInterval(() => {
      setSim((current) => applyStep(current));
    }, 120);

    return () => window.clearInterval(interval);
  }, [autoRunning]);

  function setStart(startState) {
    setAutoRunning(false);
    setSim(createInitialState(startState));
  }

  function resetSim() {
    setAutoRunning(false);
    setSim(createInitialState(sim.startState));
  }

  return (
    <div className="markov-chain">
      <div className="markov-chain__layout">
        <header className="markov-header">
          <p>
            Ա. Ա. Մարկով, 1913 - Պուշկինի «Եվգենի Օնեգին» պոեմի առաջին 20,000
            տառերի վերլուծություն։
            <br />
            Ձ = ձայնավոր (43%), Բ = բաղաձայն (57%) - տառերը <em>կախյալ</em> են,
            ոչ թե անկախ։
          </p>
        </header>

        <StateDiagram activeState={sim.state} hasStarted={sim.total > 0} />

        <div className="markov-matrix-grid">
          <TransitionMatrix />
          <ObservedPairs />
        </div>

        <section className="markov-card markov-simulator">
          <div className="markov-card__label">Մոնտե Կառլո Սիմուլյատոր</div>

          <div className="markov-controls">
            <button className="markov-btn markov-btn--v" type="button" onClick={() => setSim((current) => applyStep(current))}>
              +1 քայլ
            </button>
            <button className="markov-btn" type="button" onClick={() => setSim((current) => runSteps(current, 10))}>
              +10 քայլ
            </button>
            <button className="markov-btn" type="button" onClick={() => setSim((current) => runSteps(current, 100))}>
              +100 քայլ
            </button>
            <button
              className={autoRunning ? "markov-btn markov-btn--active" : "markov-btn"}
              type="button"
              onClick={() => setAutoRunning((current) => !current)}
            >
              {autoRunning ? "⏸ Stop" : "▶ Auto"}
            </button>
            <button className="markov-btn markov-btn--reset" type="button" onClick={resetSim}>
              ↺ Զրոյացնել
            </button>
          </div>

          <div className="markov-start">
            <span>Սկիզբ՝</span>
            <label>
              <input
                type="radio"
                name="markov-start"
                value="v"
                checked={sim.startState === "v"}
                onChange={() => setStart("v")}
              />
              <span className="markov-v">Ձ</span>
            </label>
            <label>
              <input
                type="radio"
                name="markov-start"
                value="c"
                checked={sim.startState === "c"}
                onChange={() => setStart("c")}
              />
              <span className="markov-c">Բ</span>
            </label>
          </div>

          <div className="markov-seq-label">Հաջորդականություն (վերջին 60 տառ)</div>
          <div className="markov-sequence">
            {sim.sequence.length
              ? sim.sequence.map((item, index) => (
                  <span className={item === "v" ? "markov-char-v" : "markov-char-c"} key={`${item}-${index}`}>
                    {letter(item)}
                  </span>
                ))
              : "—"}
          </div>

          <StepInfo info={sim.stepInfo} />

          <div className="markov-stats-grid">
            <StatBox label="Ընդ. քայլ" value={sim.total.toLocaleString()} />
            <StatBox label="Ձ հաճախ." value={sim.total > 0 ? `${stats.pV.toFixed(1)}%` : "—"} tone="v" />
            <StatBox label="Բ հաճախ." value={sim.total > 0 ? `${stats.pC.toFixed(1)}%` : "—"} tone="c" />
            <StatBox label="Վերջ. random" value={sim.lastR !== null ? sim.lastR.toFixed(4) : "—"} small />
          </div>

          <div className="markov-conv-row">
            <span>Ձ հաճախ. → 43% (ստացիոնար)</span>
            <span>{sim.total > 0 ? `${stats.pV.toFixed(1)}%` : "—"}</span>
          </div>
          <div className="markov-conv-bar-wrap">
            <div className="markov-conv-bar" style={{ width: `${stats.convergence.toFixed(1)}%` }} />
          </div>

          <div className="markov-bottom-row">
            <FrequencyBars pC={stats.pC} pV={stats.pV} total={sim.total} />
            <TransitionCounts fromC={stats.fromC} fromV={stats.fromV} trans={sim.trans} />
          </div>
        </section>
      </div>
    </div>
  );
}

function StateDiagram({ activeState, hasStarted }) {
  return (
    <section className="markov-diagram-wrap">
      <div className="markov-card__label">Վիճակային Դիագրամ</div>
      <svg className="markov-diagram" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="markov-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        <path d="M230 88 Q350 20 470 88" fill="none" stroke="#1DB885" strokeWidth="1.5" markerEnd="url(#markov-arr)" opacity="0.85" />
        <text x="350" y="36" textAnchor="middle" fontFamily="'IBM Plex Mono'" fontSize="13" fill="#1DB885" fontWeight="600">0.87</text>
        <text x="350" y="52" textAnchor="middle" fontFamily="'IBM Plex Sans'" fontSize="10" fill="#787390">Ձ → Բ</text>

        <path d="M470 132 Q350 200 230 132" fill="none" stroke="#7C6EFA" strokeWidth="1.5" markerEnd="url(#markov-arr)" opacity="0.85" />
        <text x="350" y="185" textAnchor="middle" fontFamily="'IBM Plex Mono'" fontSize="13" fill="#7C6EFA" fontWeight="600">0.65</text>
        <text x="350" y="200" textAnchor="middle" fontFamily="'IBM Plex Sans'" fontSize="10" fill="#787390">Բ → Ձ</text>

        <path d="M155 90 Q95 25 170 75" fill="none" stroke="#7C6EFA" strokeWidth="1.2" markerEnd="url(#markov-arr)" opacity="0.75" />
        <text x="92" y="52" textAnchor="middle" fontFamily="'IBM Plex Mono'" fontSize="12" fill="#7C6EFA">0.13</text>
        <text x="92" y="66" textAnchor="middle" fontFamily="'IBM Plex Sans'" fontSize="10" fill="#787390">Ձ→Ձ</text>

        <path d="M545 90 Q605 25 530 75" fill="none" stroke="#1DB885" strokeWidth="1.2" markerEnd="url(#markov-arr)" opacity="0.75" />
        <text x="608" y="52" textAnchor="middle" fontFamily="'IBM Plex Mono'" fontSize="12" fill="#1DB885">0.35</text>
        <text x="608" y="66" textAnchor="middle" fontFamily="'IBM Plex Sans'" fontSize="10" fill="#787390">Բ→Բ</text>

        <circle cx="190" cy="110" r="58" className={hasStarted && activeState === "v" ? "markov-node-v active" : "markov-node-v"} />
        <text x="190" y="102" textAnchor="middle" dominantBaseline="central" fontFamily="'IBM Plex Mono'" fontSize="30" fontWeight="600" fill="#7C6EFA">Ձ</text>
        <text x="190" y="128" textAnchor="middle" fontFamily="'IBM Plex Sans'" fontSize="10" fill="#a89cff">ձայնավոր</text>
        <text x="190" y="143" textAnchor="middle" fontFamily="'IBM Plex Mono'" fontSize="10" fill="#7C6EFA">43%</text>

        <circle cx="510" cy="110" r="58" className={hasStarted && activeState === "c" ? "markov-node-c active" : "markov-node-c"} />
        <text x="510" y="102" textAnchor="middle" dominantBaseline="central" fontFamily="'IBM Plex Mono'" fontSize="30" fontWeight="600" fill="#1DB885">Բ</text>
        <text x="510" y="128" textAnchor="middle" fontFamily="'IBM Plex Sans'" fontSize="10" fill="#7fd4b0">բաղաձայն</text>
        <text x="510" y="143" textAnchor="middle" fontFamily="'IBM Plex Mono'" fontSize="10" fill="#1DB885">57%</text>
      </svg>
    </section>
  );
}

function TransitionMatrix() {
  return (
    <section className="markov-card">
      <div className="markov-card__label">Անցման Մատրից</div>
      <table className="markov-matrix-table">
        <thead>
          <tr>
            <th>Ից \ Դեպի</th>
            <th className="markov-v">→ Ձ</th>
            <th className="markov-c">→ Բ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="row-head markov-v">Ձ-ից</td>
            <td className="val-hi">0.13</td>
            <td className="val-mid">0.87</td>
          </tr>
          <tr>
            <td className="row-head markov-c">Բ-ից</td>
            <td className="val-hi">0.65</td>
            <td className="val-mid">0.35</td>
          </tr>
        </tbody>
      </table>
      <div className="markov-stationary">
        <div><span>Ստացիոնար բաշխում</span></div>
        <div>π(Ձ) = 0.65 / (0.87 + 0.65) ≈ <b className="markov-v">43%</b></div>
        <div>π(Բ) = 0.87 / (0.87 + 0.65) ≈ <b className="markov-c">57%</b></div>
      </div>
    </section>
  );
}

function ObservedPairs() {
  const rows = [
    ["⟨Ձ, Ձ⟩", "6%", "ակնկ. 18%", "6%", "18%", "#7C6EFA", "rgba(124,110,250,0.3)"],
    ["⟨Բ, Բ⟩", "19%", "ակնկ. 32%", "19%", "32%", "#1DB885", "rgba(29,184,133,0.3)"],
    ["⟨Ձ, Բ⟩", "37.5%", "ակնկ. 24.5%", "37.5%", "24.5%", "#7C6EFA", "rgba(124,110,250,0.3)"],
    ["⟨Բ, Ձ⟩", "37.5%", "ակնկ. 24.5%", "37.5%", "24.5%", "#1DB885", "rgba(29,184,133,0.3)"],
  ];

  return (
    <section className="markov-card">
      <div className="markov-card__label">Դիտարկված Զույգեր (Մարկով 1913)</div>
      <table className="markov-obs-table">
        <tbody>
          {rows.map(([pair, actual, expected, actualWidth, expectedWidth, color, mutedColor]) => (
            <tr key={pair}>
              <td className="pair">{pair}</td>
              <td className="actual">{actual}</td>
              <td className="expected">{expected}</td>
              <td className="bars">
                <div className="obs-bar-wrap"><div className="obs-bar" style={{ width: actualWidth, background: color }} /></div>
                <div className="obs-bar-wrap"><div className="obs-bar" style={{ width: expectedWidth, background: mutedColor }} /></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="markov-legend-note">
        <span className="markov-legend-line markov-legend-line--solid" />դիտարկված
        <span className="markov-legend-line markov-legend-line--muted" />ակնկալվող (անկախ)
      </div>
    </section>
  );
}

function StepInfo({ info }) {
  if (!info) return <div className="markov-step-info" />;

  return (
    <div className="markov-step-info">
      Քայլ {info.total}: <span className="rnd">{letter(info.from)}</span> → random ={" "}
      <span className="rnd">{info.random.toFixed(4)}</span> →{" "}
      <span className={info.to === "v" ? "verdict markov-v" : "verdict markov-c"}>
        {letter(info.to)}
      </span>
      <span className="condition"> | {info.condition}</span>
    </div>
  );
}

function StatBox({ label, small = false, tone = "", value }) {
  return (
    <div className="markov-stat-box">
      <span className={tone ? `markov-stat-val markov-${tone}` : "markov-stat-val"} data-small={small ? "true" : "false"}>
        {value}
      </span>
      <span className="markov-stat-lbl">{label}</span>
    </div>
  );
}

function FrequencyBars({ pC, pV, total }) {
  return (
    <div>
      <div className="markov-seq-label">Հաճախությունների Բաշխում</div>
      <div className="markov-freq-bars">
        <FreqCol label="Ձ" pct={total > 0 ? pV : 43} value={total > 0 ? `${pV.toFixed(1)}%` : "—"} tone="v" />
        <FreqCol label="Բ" pct={total > 0 ? pC : 57} value={total > 0 ? `${pC.toFixed(1)}%` : "—"} tone="c" />
        <FreqCol label="π(Ձ)" pct={43} value="43%" tone="v" ghost />
        <FreqCol label="π(Բ)" pct={57} value="57%" tone="c" ghost />
      </div>
      <div className="markov-footnote">Լուսավոր = ստացիոնար ակնկալ.</div>
    </div>
  );
}

function FreqCol({ ghost = false, label, pct, tone, value }) {
  return (
    <div className={ghost ? "markov-freq-col markov-freq-col--ghost" : "markov-freq-col"}>
      <span className={`markov-freq-val markov-${tone}`}>{value}</span>
      <div className="markov-freq-bar-outer">
        <div className={`markov-freq-bar-inner markov-bg-${tone}`} style={{ height: `${pct}%` }} />
      </div>
      <span className="markov-freq-key">{label}</span>
    </div>
  );
}

function TransitionCounts({ fromC, fromV, trans }) {
  const rows = [
    ["Ձ→Ձ", trans.vv, fromV > 0 ? `${((trans.vv / fromV) * 100).toFixed(1)}%` : "—", "markov-v"],
    ["Ձ→Բ", trans.vc, fromV > 0 ? `${((trans.vc / fromV) * 100).toFixed(1)}%` : "—", "markov-c-soft"],
    ["Բ→Ձ", trans.cv, fromC > 0 ? `${((trans.cv / fromC) * 100).toFixed(1)}%` : "—", "markov-v-soft"],
    ["Բ→Բ", trans.cc, fromC > 0 ? `${((trans.cc / fromC) * 100).toFixed(1)}%` : "—", "markov-c"],
  ];

  return (
    <div>
      <div className="markov-seq-label">Անցումների Հաշվիչ</div>
      <table className="markov-transition-counts">
        <thead>
          <tr>
            <th>Անցում</th>
            <th>Թիվ</th>
            <th>Հաճախ.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, count, pct, tone]) => (
            <tr key={label}>
              <td className={tone}>{label}</td>
              <td>{count}</td>
              <td>{pct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
