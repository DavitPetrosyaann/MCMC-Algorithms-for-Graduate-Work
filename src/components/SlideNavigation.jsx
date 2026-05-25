import { coverSlide, sectionSlides } from "../data/presentation.js";

function firstFunction(...values) {
  return values.find((value) => typeof value === "function");
}

function firstNumber(...values) {
  const value = values.find((item) => Number.isFinite(Number(item)));
  return value === undefined ? undefined : Number(value);
}

const fallbackSlideCount = [coverSlide, ...sectionSlides].filter(Boolean).length;

export default function SlideNavigation(props) {
  const currentIndex =
    firstNumber(
      props.currentIndex,
      props.currentSlide,
      props.slideIndex,
      props.activeIndex,
      props.index,
      props.current,
      props.page,
    ) ?? 0;

  const totalSlides =
    firstNumber(
      props.totalSlides,
      props.slideCount,
      props.total,
      props.count,
      props.length,
      props.slides?.length,
    ) ||
    fallbackSlideCount ||
    1;

  const goToSlide = firstFunction(
    props.onNavigate,
    props.onChange,
    props.onSlideChange,
    props.onSlideSelect,
    props.onSelect,
    props.onSelectSlide,
    props.onJump,
    props.onJumpToSlide,
    props.onGoToSlide,
    props.setSlide,
    props.setCurrentSlide,
    props.setCurrentIndex,
    props.setSlideIndex,
    props.setActiveIndex,
    props.goToSlide,
    props.navigateTo,
    props.navigate,
  );

  const goPrevious = firstFunction(
    props.onPrevious,
    props.onPrev,
    props.onPreviousSlide,
    props.onPrevSlide,
    props.previous,
    props.prev,
    props.goPrevious,
    props.goPrev,
    props.handlePrevious,
    props.handlePrev,
    props.previousSlide,
    props.prevSlide,
  );

  const goNext = firstFunction(
    props.onNext,
    props.onNextSlide,
    props.next,
    props.goNext,
    props.handleNext,
    props.nextSlide,
  );

  const navigateTo = (index) => {
    const nextIndex = Math.max(0, Math.min(totalSlides - 1, index));

    if (goToSlide) {
      goToSlide(nextIndex);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("slide:navigate", { detail: { index: nextIndex } }),
    );
  };

  const previous = () => {
    if (goPrevious) {
      goPrevious();
      return;
    }

    navigateTo(currentIndex - 1);
  };

  const next = () => {
    if (goNext) {
      goNext();
      return;
    }

    navigateTo(currentIndex + 1);
  };

  return (
    <aside
      aria-label="Slide navigation"
      className="slide-navigation slide-nav slideNavigation"
      style={{
        position: "fixed",
        right: "18px",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        padding: "10px 8px",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "18px",
        background: "rgba(7,8,14,0.82)",
        boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
        backdropFilter: "blur(12px)",
      }}
    >
      <button
        aria-label="Previous slide"
        className="slide-navigation__arrow slide-nav__arrow slide-navigation__prev"
        disabled={currentIndex <= 0 && !goPrevious}
        onClick={previous}
        style={{
          width: "32px",
          height: "32px",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.05)",
          color: "#e8e6f0",
          cursor: "pointer",
          fontWeight: 900,
        }}
        type="button"
      >
        ↑
      </button>

      <div
        className="slide-navigation__numbers slide-nav__numbers"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "5px",
          maxHeight: "72vh",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: totalSlides }, (_, index) => {
          const active = index === currentIndex;

          return (
            <button
              aria-current={active ? "step" : undefined}
              aria-label={`Go to slide ${index + 1}`}
              className={[
                "slide-navigation__number",
                "slide-nav__number",
                active ? "is-active active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={index}
              onClick={() => navigateTo(index)}
              style={{
                width: active ? "38px" : "30px",
                height: active ? "38px" : "30px",
                border: active
                  ? "1px solid rgba(255,216,117,0.9)"
                  : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "999px",
                background: active
                  ? "linear-gradient(135deg,#ffd875,#ff9f43)"
                  : "rgba(255,255,255,0.04)",
                color: active ? "#08090f" : "rgba(232,230,240,0.76)",
                cursor: "pointer",
                fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
                fontSize: active ? "0.78rem" : "0.68rem",
                fontWeight: 900,
                transition: "0.16s ease",
              }}
              type="button"
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <button
        aria-label="Next slide"
        className="slide-navigation__arrow slide-nav__arrow slide-navigation__next"
        disabled={currentIndex >= totalSlides - 1 && !goNext}
        onClick={next}
        style={{
          width: "32px",
          height: "32px",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.05)",
          color: "#e8e6f0",
          cursor: "pointer",
          fontWeight: 900,
        }}
        type="button"
      >
        ↓
      </button>
    </aside>
  );
}
