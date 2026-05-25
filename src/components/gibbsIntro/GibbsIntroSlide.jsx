import "./GibbsIntroSlide.scss";

function TargetFormula() {
  return (
    <div className="gibbs-math">
      <span>π(</span>
      <var>x</var>
      <sub>1</sub>
      <span>, </span>
      <var>x</var>
      <sub>2</sub>
      <span>, …, </span>
      <var>x</var>
      <sub>d</sub>
      <span>)</span>
    </div>
  );
}

function CoordinateFormula() {
  return (
    <div className="gibbs-math">
      <var>x</var>
      <sub>i</sub>
      <span> ∼ π(</span>
      <var>x</var>
      <sub>i</sub>
      <span> | </span>
      <var>x</var>
      <sub>−i</sub>
      <span>)</span>
    </div>
  );
}

function TwoDimensionalFormula() {
  return (
    <div className="gibbs-math gibbs-math--stack">
      <span>
        <var>x</var>
        <sup>(t+1)</sup>
        <span> ∼ π(</span>
        <var>x</var>
        <span> | </span>
        <var>y</var>
        <sup>(t)</sup>
        <span>)</span>
      </span>
      <span>
        <var>y</var>
        <sup>(t+1)</sup>
        <span> ∼ π(</span>
        <var>y</var>
        <span> | </span>
        <var>x</var>
        <sup>(t+1)</sup>
        <span>)</span>
      </span>
    </div>
  );
}

function VectorFormula() {
  return (
    <div className="gibbs-math gibbs-math--stack">
      <span>
        <var>x</var>
        <sub>1</sub>
        <sup>(t+1)</sup>
        <span> ∼ π(</span>
        <var>x</var>
        <sub>1</sub>
        <span> | </span>
        <var>x</var>
        <sub>2</sub>
        <sup>(t)</sup>
        <span>, …, </span>
        <var>x</var>
        <sub>d</sub>
        <sup>(t)</sup>
        <span>)</span>
      </span>
      <span>
        <var>x</var>
        <sub>2</sub>
        <sup>(t+1)</sup>
        <span> ∼ π(</span>
        <var>x</var>
        <sub>2</sub>
        <span> | </span>
        <var>x</var>
        <sub>1</sub>
        <sup>(t+1)</sup>
        <span>, </span>
        <var>x</var>
        <sub>3</sub>
        <sup>(t)</sup>
        <span>, …)</span>
      </span>
    </div>
  );
}

const cards = [
  {
    step: "01",
    title: "Target distribution",
    body: "Ունենք բազմաչափ բաշխում, որից ուզում ենք ստանալ նմուշներ։",
    formula: <TargetFormula />,
  },
  {
    step: "02",
    title: "Update one coordinate",
    body: "Ամեն քայլում փոխում ենք միայն մեկ փոփոխական, մնացածները պահելով ֆիքսված։",
    formula: <CoordinateFormula />,
  },
  {
    step: "03",
    title: "2D Gibbs step",
    body: "Սկզբում թարմացնում ենք x-ը, հետո նոր x-ով թարմացնում ենք y-ը։",
    formula: <TwoDimensionalFormula />,
  },
  {
    step: "04",
    title: "d-dimensional scan",
    body: "Ընդհանուր դեպքում հերթով անցնում ենք բոլոր կոորդինատներով։",
    formula: <VectorFormula />,
  },
];

export default function GibbsIntroSlide() {
  return (
    <section className="gibbs-intro">
      <div className="gibbs-intro__particles" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <i key={index} style={{ "--i": index }} />
        ))}
      </div>

      <header className="gibbs-intro__header">
        <span>§8 Gibbs Sampling ներածություն</span>
        <h1>Gibbs Sampling</h1>
        <p>
          Gibbs Sampling-ը MCMC մեթոդ է, որտեղ ամբողջ վեկտորը միանգամից փոխելու
          փոխարեն՝ յուրաքանչյուր քայլում փոխում ենք միայն մեկ փոփոխական։
        </p>
      </header>

      <main className="gibbs-intro__content">
        <section className="gibbs-intro__cards">
          {cards.map((card, index) => (
            <article key={card.step} style={{ "--i": index }}>
              <span>{card.step}</span>
              <h2>{card.title}</h2>
              {card.formula}
              <p>{card.body}</p>
            </article>
          ))}
        </section>

        <aside className="gibbs-intro__side">
          <div className="gibbs-intro__diagram" aria-hidden="true">
            <div className="gibbs-intro__axis gibbs-intro__axis--x" />
            <div className="gibbs-intro__axis gibbs-intro__axis--y" />
            {Array.from({ length: 7 }, (_, index) => (
              <b key={index} style={{ "--i": index }} />
            ))}
          </div>

          <div className="gibbs-intro__idea">
            <h2>Key idea</h2>
            <p>
              Չենք նմուշառում ամբողջ բարդ բաշխումից միանգամից։ Փոխարենը
              նմուշառում ենք պայմանական բաշխումներից։
            </p>
            <strong>one variable changes, others stay fixed</strong>
          </div>

          <div className="gibbs-intro__useful">
            <h2>Ինչու է օգտակար</h2>
            <p>
              Հարմար է, երբ ամբողջական բաշխումից նմուշառում դժվար է, բայց
              պայմանական բաշխումներից նմուշառում հեշտ է։
            </p>
          </div>
        </aside>
      </main>
    </section>
  );
}
