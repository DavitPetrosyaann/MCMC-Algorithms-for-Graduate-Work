export default function HMCSidebar({ contourRef, phaseRef, traceRef }) {
  return (
    <aside className="hmc-sidebar">
      <CanvasPanel className="hmc-panel--contour" dot="blue" label="Կոնտուր + Նմուշներ">
        <canvas ref={contourRef} />
      </CanvasPanel>

      <CanvasPanel dot="gold" label="Ֆազային Տարածություն (x, p)">
        <canvas ref={phaseRef} />
      </CanvasPanel>

      <CanvasPanel className="hmc-panel--trace" dot="green" label="Էներգ. H(x,p) հետք">
        <canvas ref={traceRef} />
      </CanvasPanel>
    </aside>
  );
}

function CanvasPanel({ children, className = "", dot, label }) {
  return (
    <section className={`hmc-panel ${className}`}>
      <div className="hmc-panel__header">
        <span className={`hmc-panel__dot hmc-panel__dot--${dot}`} />
        {label}
      </div>
      {children}
    </section>
  );
}
