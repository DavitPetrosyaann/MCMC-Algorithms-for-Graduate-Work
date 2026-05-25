import CoverSlide from "../components/CoverSlide.jsx";

export default function CoverPage({ metaItems }) {
  return (
    <section className="cover-page" id="cover">
      <CoverSlide metaItems={metaItems} />
    </section>
  );
}
