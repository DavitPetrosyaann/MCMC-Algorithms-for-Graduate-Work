import MetaGrid from "./MetaGrid.jsx";

export default function CoverSlide({ metaItems }) {
  return (
    <main className="slide" aria-labelledby="presentation-title">
      <h1 className="cover-huge" id="presentation-title">
        Monte Carlo
        <span className="line2">Markov Chains</span>
      </h1>

      <MetaGrid items={metaItems} />
    </main>
  );
}
