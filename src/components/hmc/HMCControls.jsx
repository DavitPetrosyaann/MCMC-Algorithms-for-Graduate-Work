import { distributionOptions, styleOptions } from "./hmcData.js";

export default function HMCControls({
  params,
  running,
  smoothAnim,
  onParamChange,
  onReset,
  onStep,
  onToggleRunning,
  onToggleSmooth,
}) {
  return (
    <div className="hmc-controls">
      <button className={running ? "active" : ""} type="button" onClick={onToggleRunning}>
        {running ? "⏸ Կանգ" : "▶ Սկսել"}
      </button>
      <button type="button" onClick={onStep} disabled={running}>
        ⏭ Քայլ
      </button>
      <button className="act-red" type="button" onClick={onReset}>
        ↺ Reset
      </button>

      <div className="hmc-controls__sep" />

      <button
        className={smoothAnim ? "smooth-on" : ""}
        title="Slow down first 5 leapfrog steps for clear visualisation"
        type="button"
        onClick={onToggleSmooth}
      >
        {smoothAnim ? "Smooth ON" : "Smooth Anim"}
      </button>

      <div className="hmc-controls__sep" />

      <ControlGroup label="Բաշխ.">
        <select
          value={params.dist}
          onChange={(event) => onParamChange("dist", Number(event.target.value))}
        >
          {distributionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </ControlGroup>

      <div className="hmc-controls__sep" />

      <RangeControl
        label="T"
        min="0.1"
        max="3"
        step="0.05"
        value={params.T}
        display={params.T.toFixed(2)}
        onChange={(value) => onParamChange("T", value)}
      />
      <RangeControl
        label="L"
        min="5"
        max="40"
        step="1"
        value={params.L}
        display={params.L.toFixed(0)}
        onChange={(value) => onParamChange("L", value)}
      />
      <RangeControl
        label="ε"
        min="0.04"
        max="0.4"
        step="0.01"
        value={params.eps}
        display={params.eps.toFixed(2)}
        onChange={(value) => onParamChange("eps", value)}
      />
      <RangeControl
        label="Արագ."
        min="1"
        max="10"
        step="1"
        value={params.speed}
        display={`${params.speed}×`}
        onChange={(value) => onParamChange("speed", value)}
      />

      <div className="hmc-controls__sep" />

      <ControlGroup label="3D Ոճ">
        <select
          value={params.style}
          onChange={(event) => onParamChange("style", Number(event.target.value))}
        >
          {styleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </ControlGroup>
    </div>
  );
}

function ControlGroup({ children, label }) {
  return (
    <div className="hmc-controls__group">
      <span className="hmc-controls__label">{label}</span>
      {children}
    </div>
  );
}

function RangeControl({ display, label, max, min, onChange, step, value }) {
  return (
    <ControlGroup label={label}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="hmc-controls__value">{display}</span>
    </ControlGroup>
  );
}
