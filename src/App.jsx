import { useEffect, useMemo } from "react";
import SlideDeck from "./components/SlideDeck.jsx";
import { applyMeta, previewMeta } from "./config/previewMeta.js";
import { coverMeta, coverSlide, sectionSlides } from "./data/presentation.js";
import useRevealOnInput from "./hooks/useRevealOnInput.js";
import useSlideNavigation from "./hooks/useSlideNavigation.js";
import CoverPage from "./pages/CoverPage.jsx";

function isAdvanceKey(event) {
  return (
    event.code === "Space" ||
    event.key === " " ||
    event.key === "Enter" ||
    event.key === "ArrowRight"
  );
}

function isPreviousKey(event) {
  return event.key === "ArrowLeft";
}

function isRevealKey(event) {
  return event.code === "Space" || event.key === " ";
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
    goToNextSlide,
    goToPreviousSlide,
  } = useSlideNavigation(slides);

  useEffect(() => {
    applyMeta(previewMeta);
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (
        (!isAdvanceKey(event) && !isPreviousKey(event)) ||
        isTypingTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();

      if (isPreviousKey(event)) {
        goToPreviousSlide();
        return;
      }

      if (
        !isMetaVisible &&
        activeSlide === coverSlide.id &&
        isRevealKey(event)
      ) {
        revealMeta();
        return;
      }

      goToNextSlide();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeSlide,
    goToNextSlide,
    goToPreviousSlide,
    isMetaVisible,
    revealMeta,
  ]);

  return (
    <div
      className={isMetaVisible ? "app meta-visible" : "app"}
      onClick={revealMeta}
    >
      <CoverPage
        isMetaVisible={isMetaVisible}
        metaItems={coverMeta}
      />
      <SlideDeck slides={sectionSlides} />
    </div>
  );
}
