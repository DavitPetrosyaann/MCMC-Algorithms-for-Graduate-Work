import { useCallback, useEffect, useMemo, useState } from "react";

export default function useSlideNavigation(slides) {
  const [activeSlide, setActiveSlide] = useState(slides[0]?.id);

  const activeIndex = useMemo(
    () => Math.max(0, slides.findIndex((slide) => slide.id === activeSlide)),
    [activeSlide, slides],
  );

  const scrollToSlide = useCallback((slideId) => {
    document.getElementById(slideId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveSlide(slideId);
  }, []);

  const goToPreviousSlide = useCallback(() => {
    const previous = slides[Math.max(0, activeIndex - 1)];
    if (previous) scrollToSlide(previous.id);
  }, [activeIndex, scrollToSlide, slides]);

  const goToNextSlide = useCallback(() => {
    const next = slides[Math.min(slides.length - 1, activeIndex + 1)];
    if (next) scrollToSlide(next.id);
  }, [activeIndex, scrollToSlide, slides]);

  useEffect(() => {
    const sections = slides
      .map((slide) => document.getElementById(slide.id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (current) setActiveSlide(current.target.id);
      },
      { rootMargin: "-30% 0px -45% 0px", threshold: [0.15, 0.35, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [slides]);

  return {
    activeIndex,
    activeSlide,
    canGoNext: activeIndex < slides.length - 1,
    canGoPrevious: activeIndex > 0,
    goToNextSlide,
    goToPreviousSlide,
    scrollToSlide,
  };
}
