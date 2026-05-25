import HMC from "../components/hmc/HMC.jsx";
import MarkovChain from "../components/markov/MarkovSuite.jsx";
import IntroMcmcSlide from "../components/intro/IntroMcmcSlide.jsx";
import HistoryTimelineSlide from "../components/history/HistoryTimelineSlide.jsx";
import McmcPrinciplesSlide from "../components/principles/McmcPrinciplesSlide.jsx";
import MetropolisIntroSlide from "../components/metropolisIntro/MetropolisIntroSlide.jsx";
import GibbsIntroSlide from "../components/gibbsIntro/GibbsIntroSlide.jsx";
import MhVsGibbsSlide from "../components/comparison/MhVsGibbsSlide.jsx";
import HmcIntroSlide from "../components/hmcIntro/HmcIntroSlide.jsx";
import ConclusionSlide from "../components/conclusion/ConclusionSlide.jsx";
import ReferencesThanksSlide from "../components/references/ReferencesThanksSlide.jsx";
import MetropolisSuite from "../components/metropolis/MetropolisSuite.jsx";
import MonteCarloLab from "../components/montecarlo/MonteCarloLab.jsx";
import GibbsSimulationPage from "./GibbsSimulationPage.jsx";

export default function SectionPage({ slide }) {
  if (slide?.title?.includes("Ներածություն")) {
    return <IntroMcmcSlide />;
  }

  if (slide?.title?.includes("Պատմական Ակնարկ")) {
    return <HistoryTimelineSlide />;
  }

  if (slide?.title?.includes("MCMC Ընդհանուր Սկզբունքներ")) {
    return <McmcPrinciplesSlide />;
  }

  if (slide?.title?.includes("Metropolis-Hastings ներածություն")) {
    return <MetropolisIntroSlide />;
  }

  if (slide?.title?.includes("Gibbs Sampling ներածություն")) {
    return <GibbsIntroSlide />;
  }

  if (slide?.title?.includes("MH vs Gibbs")) {
    return <MhVsGibbsSlide />;
  }

  if (slide?.title?.includes("Hamiltonian Monte Carlo ներածություն")) {
    return <HmcIntroSlide />;
  }

  if (slide?.title?.includes("Եզրակացություն")) {
    return <ConclusionSlide />;
  }

  if (slide?.title?.includes("Գրականության ցանկ")) {
    return <ReferencesThanksSlide />;
  }

  const isGibbsSimulation = slide.title.includes("Gibbs Sampling Algorithm Simulation");
  const isHmcSimulation = slide.title.includes("HMC Algorithm Simulation");
  const isMarkovChains = slide.title.includes("Մարկովյան Շղթաներ");
  const isMetropolisSimulation = slide.title.includes("Metropolis-Hastings Algorithm Simulation");
  const isMonteCarloMethod = slide.title.includes("Մոնտե Կառլո Մեթոդ");

  if (isMarkovChains) {
    return (
      <section className="section-slide section-slide--visualizer" id={slide.id}>
        <MarkovChain />
      </section>
    );
  }

  if (isMetropolisSimulation) {
    return (
      <section className="section-slide section-slide--visualizer" id={slide.id}>
          <MetropolisSuite />
      </section>
    );
  }

  if (isMonteCarloMethod) {
    return (
      <section className="section-slide section-slide--visualizer" id={slide.id}>
        <MonteCarloLab />
      </section>
    );
  }

  if (isGibbsSimulation) {
    return (
      <section className="section-slide section-slide--visualizer" id={slide.id}>
        <GibbsSimulationPage />
      </section>
    );
  }

  if (isHmcSimulation) {
    return (
      <section className="section-slide section-slide--visualizer" id={slide.id}>
        <HMC />
      </section>
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
