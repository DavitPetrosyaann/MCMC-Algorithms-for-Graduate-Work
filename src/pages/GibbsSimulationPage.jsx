import { useEffect, useState } from "react";

const gibbsModules = import.meta.glob([
  "../components/gibbs/**/*.jsx",
  "../components/gibbs/**/*.js",
  "../components/Gibbs/**/*.jsx",
  "../components/Gibbs/**/*.js",
  "../components/gibbs-sampling/**/*.jsx",
  "../components/gibbs-sampling/**/*.js",
  "../components/GibbsSampling/**/*.jsx",
  "../components/GibbsSampling/**/*.js",
]);

function pickGibbsComponent(module) {
  return (
    module.default ||
    module.Gibbs ||
    module.GibbsSampling ||
    module.GibbsSampler ||
    module.GibbsVisualizer ||
    null
  );
}

export default function GibbsSimulationPage() {
  const [GibbsComponent, setGibbsComponent] = useState(null);
  const [loadState, setLoadState] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadGibbsComponent() {
      const candidates = Object.entries(gibbsModules).sort(([a], [b]) => {
        const aIsIndex = a.endsWith("/index.jsx") ? -1 : 0;
        const bIsIndex = b.endsWith("/index.jsx") ? -1 : 0;
        return aIsIndex - bIsIndex;
      });

      for (const [, loadModule] of candidates) {
        const module = await loadModule();
        const Component = pickGibbsComponent(module);

        if (Component && !cancelled) {
          setGibbsComponent(() => Component);
          setLoadState("ready");
          return;
        }
      }

      if (!cancelled) setLoadState("missing");
    }

    loadGibbsComponent();

    return () => {
      cancelled = true;
    };
  }, []);

  if (GibbsComponent) return <GibbsComponent />;

  return (
    <div className="simulation-placeholder">
      <span className="section-slide__eyebrow">Slide 9</span>
      <h2>§9 Gibbs Sampling Algorithm Simulation</h2>
      <p>
        {loadState === "loading"
          ? "Loading Gibbs Sampling simulation..."
          : "Gibbs simulation component was not found. Put it in src/components/gibbs and export the main component as default."}
      </p>
    </div>
  );
}
