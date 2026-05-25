import "./MhVsGibbsSlide.scss";

function MhFormula() {
  return (
    <div className="compare-math compare-math--stack">
      <span>
        <var>x′</var> <span>∼</span> <var>q</var>
        <span>(</span>
        <var>x′</var>
        <span> | </span>
        <var>x</var>
        <sub>t</sub>
        <span>)</span>
      </span>
      <span>
        <span>α = min</span>
        <span className="compare-paren">(</span>
        <span>1,</span>
        <span className="compare-frac">
          <span className="compare-frac__top">
            <span>π(</span>
            <var>x′</var>
            <span>)q(</span>
            <var>x</var>
            <sub>t</sub>
            <span> | </span>
            <var>x′</var>
            <span>)</span>
          </span>
          <span className="compare-frac__bottom">
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
        <span className="compare-paren">)</span>
      </span>
    </div>
  );
}

function GibbsFormula() {
  return (
    <div className="compare-math compare-math--stack">
      <span>
        <var>x</var>
        <sub>i</sub>
        <span> ∼ π(</span>
        <var>x</var>
        <sub>i</sub>
        <span> | </span>
        <var>x</var>
        <sub>−i</sub>
        <span>)</span>
      </span>
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

export default function MhVsGibbsSlide() {
  return (
    <section className="mh-gibbs-compare">
      <div className="mh-gibbs-compare__particles" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <i key={index} style={{ "--i": index }} />
        ))}
      </div>

      <header className="mh-gibbs-compare__header">
        <span>§10 MH vs Gibbs Համեմատություն</span>
        <h1>Metropolis-Hastings vs Gibbs</h1>
        <p>
          Երկուսն էլ MCMC մեթոդներ են, բայց հաջորդ վիճակը կառուցում են տարբեր
          ձևով։
        </p>
      </header>

      <main className="mh-gibbs-compare__content">
        <section className="mh-gibbs-compare__column mh-gibbs-compare__column--mh">
          <h2>Metropolis-Hastings</h2>
          <p>proposal → acceptance probability → accept/reject</p>
          <MhFormula />
          <strong>Ավելի ընդհանուր է, բայց պետք է լավ proposal q։</strong>
        </section>

        <section className="mh-gibbs-compare__column mh-gibbs-compare__column--gibbs">
          <h2>Gibbs Sampling</h2>
          <p>conditional distribution → update coordinate → always accept</p>
          <GibbsFormula />
          <strong>Հարմար է, երբ պայմանական բաշխումները հեշտ են։</strong>
        </section>
      </main>

      <footer className="mh-gibbs-compare__takeaway">
        MH-ը ավելի ընդհանուր է, Gibbs-ը ավելի հարմար է, երբ conditional
        distributions-ը հեշտ են։
      </footer>
    </section>
  );
}
