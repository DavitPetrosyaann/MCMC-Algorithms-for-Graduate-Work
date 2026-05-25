import { useRef } from "react";
import HMCBottomPanel from "./HMCBottomPanel.jsx";
import HMCControls from "./HMCControls.jsx";
import HMCHeader from "./HMCHeader.jsx";
import HMCMainVisualizer from "./HMCMainVisualizer.jsx";
import useHmcSimulation from "./useHmcSimulation.js";
import "./HMC.scss";

export default function HMC() {
  const threeWrapRef = useRef(null);
  const contourRef = useRef(null);
  const phaseRef = useRef(null);
  const traceRef = useRef(null);

  const simulation = useHmcSimulation({
    contourRef,
    phaseRef,
    threeWrapRef,
    traceRef,
  });

  return (
    <section className="hmc-visualizer" aria-label="Hamiltonian Monte Carlo visualizer">
      <HMCHeader />
      <HMCControls
        params={simulation.params}
        running={simulation.running}
        smoothAnim={simulation.smoothAnim}
        onParamChange={simulation.setParam}
        onReset={simulation.reset}
        onStep={simulation.step}
        onToggleRunning={simulation.toggleRunning}
        onToggleSmooth={simulation.toggleSmooth}
      />
      <HMCMainVisualizer
        activeStep={simulation.activeStep}
        contourRef={contourRef}
        lfProgress={simulation.lfProgress}
        phaseRef={phaseRef}
        stats={simulation.stats}
        stepInfo={simulation.stepInfo}
        threeWrapRef={threeWrapRef}
        traceRef={traceRef}
      />
    </section>
  );
}

export { HMCBottomPanel, HMCControls, HMCHeader, HMCMainVisualizer };
