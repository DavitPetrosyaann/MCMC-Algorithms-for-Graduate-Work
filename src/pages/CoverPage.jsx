import CoverSlide from "../components/CoverSlide.jsx";

export default function CoverPage({ isMetaVisible, metaItems }) {
  return (
    <section className="cover-page" id="cover">
      <CoverSlide isMetaVisible={isMetaVisible} metaItems={metaItems} />
    </section>
  );
}
