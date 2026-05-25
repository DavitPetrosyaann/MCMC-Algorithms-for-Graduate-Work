import { useEffect, useMemo } from "react";
import RevealHint from "./components/RevealHint.jsx";
import SlideControls from "./components/SlideControls.jsx";
import SlideDeck from "./components/SlideDeck.jsx";
import { coverMeta, coverSlide, sectionSlides } from "./data/presentation.js";
import useRevealOnInput from "./hooks/useRevealOnInput.js";
import useSlideNavigation from "./hooks/useSlideNavigation.js";
import CoverPage from "./pages/CoverPage.jsx";

function isAdvanceKey(event) {
  return event.code === "Space" || event.key === " " || event.key === "Enter";
}

function isTypingTarget(target) {
  return Boolean(
    target?.closest?.("input, textarea, select, button") ||
    target?.isContentEditable,
  );
}

export default function App() {
  const slides = useMemo(() => [coverSlide, ...sectionSlides], []);
  const { isMetaVisible, revealMeta } = useRevealOnInput();
  const {
    activeSlide,
    canGoNext,
    canGoPrevious,
    goToNextSlide,
    goToPreviousSlide,
    scrollToSlide,
  } = useSlideNavigation(slides);

  useEffect(() => {
    function handleKeyDown(event) {
      if (!isAdvanceKey(event) || isTypingTarget(event.target)) return;

      event.preventDefault();

      if (!isMetaVisible && activeSlide === coverSlide.id) {
        revealMeta();
        return;
      }

      goToNextSlide();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide, goToNextSlide, isMetaVisible, revealMeta]);

  return (
    <div
      className={isMetaVisible ? "app meta-visible" : "app"}
      onClick={revealMeta}
    >
      <SlideControls
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        onNext={goToNextSlide}
        onPrevious={goToPreviousSlide}
      />

      <CoverPage metaItems={coverMeta} />
      <SlideDeck
        slides={sectionSlides}
        activeSlide={activeSlide}
        onSelectSlide={scrollToSlide}
      />
      {!isMetaVisible && <RevealHint />}
    </div>
  );
}
