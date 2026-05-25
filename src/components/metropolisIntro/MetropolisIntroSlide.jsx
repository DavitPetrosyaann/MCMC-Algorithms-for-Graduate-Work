import "./MetropolisIntroSlide.scss";

const formulaCards = [
  {
    step: "01",
    title: "Propose",
    formula: (
      <>
        <var>x′</var> <span>∼</span> <var>q</var>
        <span>(</span>
        <var>x′</var>
        <span> | </span>
        <var>x</var>
        <sub>t</sub>
        <span>)</span>
      </>
    ),
    text: "Ներկա վիճակից առաջարկում ենք նոր թեկնածու։",
  },
  {
    step: "02",
    title: "Acceptance",
    formula: (
      <>
        <span>α(</span>
        <var>x</var>
        <sub>t</sub>
        <span>, </span>
        <var>x′</var>
        <span>) = min</span>
        <span className="mh-math-paren">(</span>
        <span>1,</span>
        <span className="mh-frac">
          <span className="mh-frac__top">
            <span>π(</span>
            <var>x′</var>
            <span>)q(</span>
            <var>x</var>
            <sub>t</sub>
            <span> | </span>
            <var>x′</var>
            <span>)</span>
          </span>
          <span className="mh-frac__bottom">
            <span>π(</span>
            <var>x</var>
            <sub>t</sub>
            <span>)q(</span>
            <var>x′</var>
            <span> | </span>
            <var>x</var>
            <sub>t</sub>
            <span>)</span>
          </span>
        </span>
        <span className="mh-math-paren">)</span>
      </>
    ),
    text: "Հաշվում ենք ընդունման հավանականությունը։",
  },
  {
    step: "03",
    title: "Draw",
    formula: (
      <>
        <var>u</var> <span>∼</span> <var>U</var>
        <span>(0, 1)</span>
      </>
    ),
    text: "Վերցնում ենք պատահական թիվ միավոր միջակայքից։",
  },
  {
    step: "04",
    title: "Decision",
    formula: (
      <span className="mh-piecewise">
        <span>
          <var>x</var>
          <sub>t+1</sub>
          <span> = </span>
          <var>x′</var>
          <em>եթե </em>
          <var>u</var>
          <span> ≤ α</span>
        </span>
        <span>
          <var>x</var>
          <sub>t+1</sub>
          <span> = </span>
          <var>x</var>
          <sub>t</sub>
          <em>հակառակ դեպքում</em>
        </span>
      </span>
    ),
    text: "Ընդունում ենք թեկնածուն կամ մնում նույն վիճակում։",
  },
];

export default function MetropolisIntroSlide() {
  return (
    <section className="mh-intro">
      <div className="mh-intro__particles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <i key={index} style={{ "--i": index }} />
        ))}
      </div>

      <header className="mh-intro__header">
        <span>§6 Metropolis-Hastings ներածություն</span>
        <h1>Metropolis-Hastings</h1>
        <p>
          Յուրաքանչյուր քայլում առաջարկում ենք նոր կետ, հաշվում ընդունման
          հավանականությունը, հետո պատահական որոշմամբ ընդունում կամ մերժում ենք։
        </p>
      </header>

      <main className="mh-intro__content">
        <section className="mh-intro__cards">
          {formulaCards.map((card, index) => (
            <article key={card.step} style={{ "--i": index }}>
              <span>{card.step}</span>
              <h2>{card.title}</h2>
              <div className="mh-math">{card.formula}</div>
              <p>{card.text}</p>
            </article>
          ))}
        </section>

        <aside className="mh-intro__side">
          <div className="mh-intro__target">
            <h2>Նպատակ</h2>
            <p>Ունենք բարդ target distribution՝</p>
            <div className="mh-math">
              <span>π(</span>
              <var>x</var>
              <span>)</span>
            </div>
            <p>և ուզում ենք ստանալ նմուշներ՝</p>
            <div className="mh-math">
              <var>x</var>
              <sub>1</sub>
              <span>, </span>
              <var>x</var>
              <sub>2</sub>
              <span>, …, </span>
              <var>x</var>
              <sub>n</sub>
              <span> ∼ π(</span>
              <var>x</var>
              <span>)</span>
            </div>
          </div>

          <div className="mh-intro__symmetric">
            <h2>Symmetric proposal</h2>
            <p>Եթե q(x' | x_t) = q(x_t | x'), ապա՝</p>
            <div className="mh-math">
              <span>α = min</span>
              <span className="mh-math-paren">(</span>
              <span>1,</span>
              <span className="mh-frac mh-frac--small">
                <span className="mh-frac__top">
                  <span>π(</span>
                  <var>x′</var>
                  <span>)</span>
                </span>
                <span className="mh-frac__bottom">
                  <span>π(</span>
                  <var>x</var>
                  <sub>t</sub>
                  <span>)</span>
                </span>
              </span>
              <span className="mh-math-paren">)</span>
            </div>
          </div>

          <div className="mh-intro__intuition">
            <h2>Ինտուիցիա</h2>
            <p>
              Բարձր խտության կետերը հեշտ են ընդունվում, բայց ցածր խտության
              կետերը նույնպես երբեմն ընդունվում են, որպեսզի շղթան չմնա մեկ
              տեղում։
            </p>
          </div>
        </aside>
      </main>
    </section>
  );
}
