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
    text: "Target density-ն վերածում ենք էներգիայի և ավելացնում momentum-ի kinetic energy։",
    formula: <HamiltonianFormula />,
  },
  {
    step: "02",
    title: "Sample momentum",
    text: "Յուրաքանչյուր trajectory սկսվում է նոր պատահական momentum-ով։",
    formula: <MomentumFormula />,
  },
  {
    step: "03",
    title: "Leapfrog dynamics",
    text: "Շարժվում ենք gradient-ով՝ երկար, բայց կառավարվող քայլերով։",
    formula: <LeapfrogFormula />,
  },
  {
    step: "04",
    title: "Accept trajectory",
    text: "Եթե Hamiltonian energy-ն շատ չի փոխվել, նոր կետը ընդունվում է։",
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
          HMC-ն օգտագործում է gradient և ֆիզիկայի Hamiltonian dynamics-ը, որպեսզի
          շղթան շարժվի երկար, տեղեկացված քայլերով և ավելի արագ խառնի նմուշները։
        </p>
      </header>

      <main className="hmc-intro__content">
        <section className="hmc-intro__cards">
          {cards.map((card, index) => (
            <article key={card.step} style={{ "--i": index }}>
              <span>{card.step}</span>
              <h2>{card.title}</h2>
              {card.formula}
              <p>{card.text}</p>
            </article>
          ))}
        </section>

        <aside className="hmc-intro__side">
          <div className="hmc-intro__orbit" aria-hidden="true">
            <b />
            <i />
            <i />
            <i />
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
