import MetaGrid from "./MetaGrid.jsx";

export default function CoverSlide({ isMetaVisible, metaItems }) {
  return (
    <main className="slide" aria-labelledby="presentation-title">
      <h1 className="cover-huge" id="presentation-title">
        Monte Carlo
        <span className="line2">Markov Chains</span>
      </h1>

      <MetaGrid isVisible={isMetaVisible} items={metaItems} />

      <section className="cover-key-guide" aria-label="Keyboard navigation">
        <div className="cover-key-guide__group">
          <div className="cover-key-guide__item">
            <span className="keycap keycap--arrow" aria-hidden="true">
              {"\u2190"}
            </span>
            <span>Previous slide</span>
          </div>
          <div className="cover-key-guide__item">
            <span className="keycap keycap--arrow" aria-hidden="true">
              {"\u2192"}
            </span>
            <span>Next slide</span>
          </div>
        </div>

        <div className="cover-key-guide__group cover-key-guide__group--wide">
          <div className="cover-key-guide__item">
            <span className="keycap keycap--enter" aria-hidden="true">
              Enter
            </span>
            <span>Next slide</span>
          </div>
          <div className="cover-key-guide__item">
            <span className="keycap keycap--space" aria-hidden="true">
              Space
            </span>
            <span>Next slide</span>
          </div>
        </div>
      </section>
    </main>
  );
}
