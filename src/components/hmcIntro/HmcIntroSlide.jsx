import "./HmcIntroSlide.scss";

function HamiltonianFormula() {
  return (
    <div className="hmc-math hmc-math--stack">
      <span>
        <var>H</var>
        <span>(</span>
        <var>q</var>
        <span>, </span>
        <var>p</var>
        <span>) = </span>
        <var>U</var>
        <span>(</span>
        <var>q</var>
        <span>) + </span>
        <var>K</var>
        <span>(</span>
        <var>p</var>
        <span>)</span>
      </span>
      <span>
        <var>U</var>
        <span>(</span>
        <var>q</var>
        <span>) = −log π(</span>
        <var>q</var>
        <span>)</span>
      </span>
      <span>
        <var>K</var>
        <span>(</span>
        <var>p</var>
        <span>) = </span>
        <span className="hmc-frac">
          <span className="hmc-frac__top">1</span>
          <span className="hmc-frac__bottom">2</span>
        </span>
        <var>p</var>
        <sup>T</sup>
        <var>M</var>
        <sup>−1</sup>
        <var>p</var>
      </span>
    </div>
  );
}

function MomentumFormula() {
  return (
    <div className="hmc-math">
      <var>p</var>
      <span> ∼ </span>
      <var>N</var>
      <span>(0, </span>
      <var>M</var>
      <span>)</span>
    </div>
  );
}

function LeapfrogFormula() {
  return (
    <div className="hmc-math hmc-math--stack">
      <span>
        <var>p</var>
        <sub>t+1/2</sub>
        <span> = </span>
        <var>p</var>
        <sub>t</sub>
        <span> − </span>
        <span className="hmc-frac">
          <span className="hmc-frac__top">ε</span>
          <span className="hmc-frac__bottom">2</span>
        </span>
        <span>∇</span>
        <var>U</var>
        <span>(</span>
        <var>q</var>
        <sub>t</sub>
        <span>)</span>
      </span>
      <span>
        <var>q</var>
        <sub>t+1</sub>
        <span> = </span>
        <var>q</var>
        <sub>t</sub>
        <span> + ε</span>
        <var>M</var>
        <sup>−1</sup>
        <var>p</var>
        <sub>t+1/2</sub>
      </span>
      <span>
        <var>p</var>
        <sub>t+1</sub>
        <span> = </span>
        <var>p</var>
        <sub>t+1/2</sub>
        <span> − </span>
        <span className="hmc-frac">
          <span className="hmc-frac__top">ε</span>
          <span className="hmc-frac__bottom">2</span>
        </span>
        <span>∇</span>
        <var>U</var>
        <span>(</span>
        <var>q</var>
        <sub>t+1</sub>
        <span>)</span>
      </span>
    </div>
  );
}

function LeapfrogAnimation() {
  const steps = 6;
  return (
    <svg
      className="hmc-leapfrog-anim"
      viewBox="0 0 220 72"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* energy-landscape curve */}
      <path
        d="M10 60 Q55 8 110 36 Q155 58 210 14"
        fill="none"
        stroke="rgba(79,142,247,0.28)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      {/* trajectory arc segments */}
      {Array.from({ length: steps }, (_, k) => {
        const x0 = 10 + k * 34;
        const x1 = x0 + 34;
        const y0 = 60 - k * 7 + (k % 2 === 0 ? 0 : -10);
        const y1 = 60 - (k + 1) * 7 + ((k + 1) % 2 === 0 ? 0 : -10);
        const cy = Math.min(y0, y1) - 18;
        return (
          <path
            key={k}
            className="hmc-leapfrog-anim__arc"
            style={{ "--k": k }}
            d={`M${x0},${y0} Q${(x0 + x1) / 2},${cy} ${x1},${y1}`}
            fill="none"
            stroke="#4f8ef7"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        );
      })}
      {/* landing dots */}
      {Array.from({ length: steps + 1 }, (_, k) => {
        const x = 10 + k * 34;
        const y = 60 - k * 7 + (k % 2 === 0 ? 0 : -10);
        return (
          <circle
            key={k}
            className="hmc-leapfrog-anim__dot"
            style={{ "--k": k }}
            cx={x}
            cy={y}
            r="4"
            fill={k % 2 === 0 ? "#ffd875" : "#4f8ef7"}
          />
        );
      })}
      {/* q-label */}
      <text x="6" y="70" className="hmc-leapfrog-anim__label">
        q
      </text>
      <text x="214" y="70" className="hmc-leapfrog-anim__label">
        q′
      </text>
    </svg>
  );
}

function AcceptanceFormula() {
  return (
    <div className="hmc-math">
      <span>α = min</span>
      <span className="hmc-paren">(</span>
      <span>1, exp(</span>
      <var>H</var>
      <span>(</span>
      <var>q</var>
      <span>, </span>
      <var>p</var>
      <span>) − </span>
      <var>H</var>
      <span>(</span>
      <var>q′</var>
      <span>, </span>
      <var>p′</var>
      <span>))</span>
      <span className="hmc-paren">)</span>
    </div>
  );
}

const cards = [
  {
    step: "01",
    title: "Hamiltonian energy",
    text: (
      <>
        <var>H</var>(<var>q</var>, <var>p</var>) = <var>U</var>(<var>q</var>) +
        <var>K</var>(<var>p</var>), որտեղ <var>U</var>(<var>q</var>) = −log π(
        <var>q</var>)։
      </>
    ),
    formula: <HamiltonianFormula />,
  },
  {
    step: "02",
    title: "Sample momentum",
    text: (
      <>
        Ամեն trajectory-ի սկզբում վերցնում ենք <var>p</var> ∼ <var>N</var>(0,
        <var>M</var>), այսինքն՝ նոր momentum՝ նույն թիրախի համար։
      </>
    ),
    formula: <MomentumFormula />,
  },
  {
    step: "03",
    title: "Leapfrog dynamics",
    text: (
      <>
        Թարմացումները կատարվում են ε քայլով՝ <var>p</var>
        <sub>t+1/2</sub>, <var>q</var>
        <sub>t+1</sub>, <var>p</var>
        <sub>t+1</sub>, որտեղ գործածվում է ∇<var>U</var>(<var>q</var>)։
      </>
    ),
    formula: <LeapfrogFormula />,
    extra: <LeapfrogAnimation />,
  },
  {
    step: "04",
    title: "Accept trajectory",
    text: (
      <>
        Ընդունման հավանականությունն է α = min(1, exp(<var>H</var>(<var>q</var>,
        <var>p</var>) − <var>H</var>(<var>q</var>′, <var>p</var>′)))։
      </>
    ),
    formula: <AcceptanceFormula />,
  },
];

export default function HmcIntroSlide() {
  return (
    <section className="hmc-intro">
      <div className="hmc-intro__particles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <i key={index} style={{ "--i": index }} />
        ))}
      </div>

      <header className="hmc-intro__header">
        <span>§11 Hamiltonian Monte Carlo ներածություն</span>
        <h1>Hamiltonian Monte Carlo</h1>
        <p>
          HMC-ն օգտագործում է gradient և ֆիզիկայի Hamiltonian dynamics-ը,
          որպեսզի շղթան շարժվի երկար, տեղեկացված քայլերով և ավելի արագ խառնի
          նմուշները։
        </p>
      </header>

      <main className="hmc-intro__content">
        <section className="hmc-intro__cards">
          {cards.map((card, index) => (
            <article
              className={index === 2 ? "hmc-intro__card--leapfrog" : undefined}
              key={card.step}
              style={{ "--i": index }}
            >
              <h2>{card.title}</h2>
              {card.formula}
              {card.extra && card.extra}
              <p>{card.text}</p>
            </article>
          ))}
        </section>

        <aside className="hmc-intro__side">
          <div className="hmc-intro__orbit" aria-hidden="true">
            <svg
              className="hmc-orbit-svg"
              viewBox="0 0 260 160"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* potential energy landscape */}
              <path
                className="hmc-orbit-svg__landscape"
                d="M0 130 C30 130 44 28 80 28 C116 28 130 130 160 130 C190 130 204 28 240 28 C258 28 260 80 260 80"
                fill="none"
              />
              {/* filled area under landscape */}
              <path
                className="hmc-orbit-svg__fill"
                d="M0 130 C30 130 44 28 80 28 C116 28 130 130 160 130 C190 130 204 28 240 28 C258 28 260 80 260 80 L260 160 L0 160 Z"
              />
              {/* leapfrog trajectory arcs — forward path */}
              <path
                className="hmc-orbit-svg__traj"
                d="M20 124 Q38 60 56 108 Q74 60 92 108 Q110 60 128 108 Q146 60 164 108 Q182 60 200 56 Q218 28 236 32"
                fill="none"
              />
              {/* landing dots */}
              {[20, 56, 92, 128, 164, 200, 236].map((cx, k) => {
                const cy = [124, 108, 108, 108, 108, 56, 32][k];
                return (
                  <circle
                    key={k}
                    className="hmc-orbit-svg__step"
                    style={{ "--k": k }}
                    cx={cx}
                    cy={cy}
                    r="3.5"
                  />
                );
              })}
              {/* animated ball */}
              <circle className="hmc-orbit-svg__ball" r="6">
                <animateMotion
                  dur="3.2s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.16;0.3;0.46;0.6;0.76;0.9;1"
                  keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
                  path="M20 124 Q38 60 56 108 Q74 60 92 108 Q110 60 128 108 Q146 60 164 108 Q182 60 200 56 Q218 28 236 32"
                />
              </circle>
              {/* gradient trail */}
              <defs>
                <linearGradient id="hmcTrajGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ffd875" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="hmcLandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#4f8ef7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="hmc-intro__idea">
            <h2>Ինտուիցիա</h2>
            <p>
              MH-ը հաճախ քայլում է փոքր random քայլերով, իսկ HMC-ն օգտագործում է
              բաշխման gradient-ը, որպեսզի չշրջի կուրորեն։
            </p>
            <strong>random walk → guided trajectory</strong>
          </div>
          <div className="hmc-intro__terms">
            <span>q = position / parameters</span>
            <span>p = momentum</span>
            <span>ε = step size</span>
            <span>L = leapfrog steps</span>
          </div>
        </aside>
      </main>
    </section>
  );
}
