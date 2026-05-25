import SectionPage from "../pages/SectionPage.jsx";
import SlideNavigation from "./SlideNavigation.jsx";

export default function SlideDeck({ activeSlide, onSelectSlide, slides }) {
  return (
    <>
      <SlideNavigation
        slides={slides}
        activeSlide={activeSlide}
        onSelectSlide={onSelectSlide}
      />

      <div className="slide-deck">
        {slides.map((slide) => (
          <SectionPage key={slide.id} slide={slide} />
        ))}
      </div>
    </>
  );
}
