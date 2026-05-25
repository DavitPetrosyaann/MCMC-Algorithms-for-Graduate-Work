import { useState } from "react";
import MetropolisHastings from "./MetropolisHastings.jsx";
import MetropolisStepVisualizer from "./MetropolisStepVisualizer.jsx";
import "./MetropolisSuite.scss";

export default function MetropolisSuite() {
  const [mode, setMode] = useState("charts");

  return (
    <section className="mh-suite">
      <div className="mh-suite__switch" aria-label="Metropolis visualization switcher">
        <button
          className={mode === "charts" ? "active" : ""}
          type="button"
          onClick={() => setMode("charts")}
        >
          Charts
        </button>
        <button
          className={mode === "steps" ? "active" : ""}
          type="button"
          onClick={() => setMode("steps")}
        >
          Step Visualizer
        </button>
      </div>

      {mode === "charts" ? <MetropolisHastings /> : <MetropolisStepVisualizer />}
    </section>
  );
}
