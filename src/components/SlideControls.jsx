import { useEffect } from "react";

function firstFunction(...candidates) {
  return candidates.find((candidate) => typeof candidate === "function");
}

export default function SlideControls(props) {
  const goNext = firstFunction(
    props.onNext,
    props.next,
    props.goNext,
    props.handleNext,
    props.nextSlide,
  );
  const goPrevious = firstFunction(
    props.onPrevious,
    props.onPrev,
    props.previous,
    props.prev,
    props.goPrevious,
    props.goPrev,
    props.handlePrevious,
    props.handlePrev,
    props.previousSlide,
    props.prevSlide,
  );

  const current =
    props.current ??
    props.currentSlide ??
    props.index ??
    props.slideIndex ??
    props.activeIndex ??
    0;
  const total = props.total ?? props.totalSlides ?? props.count ?? props.length;

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      const isTyping =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      if (isTyping || event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext?.();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrevious]);

  return (
    <nav className="slide-controls" aria-label="Slide controls">
      <button
        aria-label="Previous slide"
        className="slide-controls__button slide-controls__button--prev"
        disabled={!goPrevious}
        onClick={goPrevious}
        type="button"
      >
        ←
      </button>

      {total !== undefined && (
        <span className="slide-controls__counter">
          {Number(current) + 1} / {total}
        </span>
      )}

      <button
        aria-label="Next slide"
        className="slide-controls__button slide-controls__button--next"
        disabled={!goNext}
        onClick={goNext}
        type="button"
      >
        →
      </button>
    </nav>
  );
}
