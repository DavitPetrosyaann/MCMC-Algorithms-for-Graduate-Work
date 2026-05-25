import HMCSidebar from "./HMCSidebar.jsx";
import HMCBottomPanel from "./HMCBottomPanel.jsx";

export default function HMCMainVisualizer({
  activeStep,
  contourRef,
  lfProgress,
  phaseRef,
  stats,
  stepInfo,
  threeWrapRef,
  traceRef,
}) {
  return (
    <main className="hmc-main">
      <div className="hmc-three" ref={threeWrapRef}>
        <div className="hmc-three__label">
          3D Պոտենցիալ Էներգ. Մակ. U(x₁,x₂)
        </div>
        <div className="hmc-three__hint">
          Rotate · Scroll Zoom · Shift+Drag Pan
        </div>
        <div className="hmc-lf">
          <div className="hmc-lf__label">{lfProgress.label}</div>
          <div className="hmc-lf__track">
            <div
              className="hmc-lf__fill"
              style={{ width: `${lfProgress.percent}%` }}
            />
          </div>
        </div>
      </div>

      <HMCSidebar
        contourRef={contourRef}
        phaseRef={phaseRef}
        traceRef={traceRef}
      />

      <HMCBottomPanel
        activeStep={activeStep}
        stepInfo={stepInfo}
        stats={stats}
      />
    </main>
  );
}
