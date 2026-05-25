import MhVsGibbsSlide from "../components/comparison/MhVsGibbsSlide.jsx";
import ConclusionSlide from "../components/conclusion/ConclusionSlide.jsx";
import GibbsIntroSlide from "../components/gibbsIntro/GibbsIntroSlide.jsx";
import HMC from "../components/hmc/HMC.jsx";
import HmcIntroSlide from "../components/hmcIntro/HmcIntroSlide.jsx";
import HistoryTimelineSlide from "../components/history/HistoryTimelineSlide.jsx";
import IntroMcmcSlide from "../components/intro/IntroMcmcSlide.jsx";
import MarkovChain from "../components/markov/MarkovSuite.jsx";
import MetropolisIntroSlide from "../components/metropolisIntro/MetropolisIntroSlide.jsx";
import MetropolisSuite from "../components/metropolis/MetropolisSuite.jsx";
import MonteCarloLab from "../components/montecarlo/MonteCarloLab.jsx";
import McmcPrinciplesSlide from "../components/principles/McmcPrinciplesSlide.jsx";
import ReferencesThanksSlide from "../components/references/ReferencesThanksSlide.jsx";
import GibbsSimulationPage from "./GibbsSimulationPage.jsx";

const slideComponents = {
  1: IntroMcmcSlide,
  2: HistoryTimelineSlide,
  5: McmcPrinciplesSlide,
  6: MetropolisIntroSlide,
  8: GibbsIntroSlide,
  10: MhVsGibbsSlide,
  11: HmcIntroSlide,
  13: ConclusionSlide,
  14: ReferencesThanksSlide,
};

const visualizerComponents = {
  3: MarkovChain,
  4: MonteCarloLab,
  7: MetropolisSuite,
  9: GibbsSimulationPage,
  12: HMC,
};

function SlideAnchor({ children, className = "", slide }) {
  return (
    <section
      className={["slide-anchor", className].filter(Boolean).join(" ")}
      data-slide-number={slide.number}
      id={slide.id}
    >
      {children}
    </section>
  );
}

export default function SectionPage({ slide }) {
  const Visualizer = visualizerComponents[slide.number];

  if (Visualizer) {
    return (
      <SlideAnchor className="section-slide--visualizer" slide={slide}>
        <Visualizer />
      </SlideAnchor>
    );
  }

  const CustomSlide = slideComponents[slide.number];

  if (CustomSlide) {
    return (
      <SlideAnchor slide={slide}>
        <CustomSlide />
      </SlideAnchor>
    );
  }

  return (
    <section className="section-slide" id={slide.id}>
      <div className="section-slide__inner">
        <span className="section-slide__eyebrow">Slide {slide.number}</span>
        <h2>{slide.title}</h2>
      </div>
    </section>
  );
}
