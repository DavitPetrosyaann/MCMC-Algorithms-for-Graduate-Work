import SectionPage from "../pages/SectionPage.jsx";

export default function SlideDeck({ slides }) {
  return (
    <div className="slide-deck">
      {slides.map((slide) => (
        <SectionPage key={slide.id} slide={slide} />
      ))}
    </div>
  );
}
