import { algorithmSteps } from "./hmcData.js";

export default function HMCBottomPanel({ activeStep, stats, stepInfo }) {
  return (
    <footer className="hmc-bottom">
      <div className="hmc-algo">
        {algorithmSteps.map((label, index) => (
          <div
            className={activeStep === index ? "hmc-algo__step active" : "hmc-algo__step"}
            key={label}
          >
            <span className="hmc-algo__number">{index}</span>
            {label}
          </div>
        ))}
      </div>

      <div className="hmc-step-info">
        <div className={`hmc-step-info__tag hmc-step-info__tag--${stepInfo.tone}`}>
          {stepInfo.tag}
        </div>
        <div className="hmc-step-info__desc">{stepInfo.desc}</div>
        <div className="hmc-step-info__math">{stepInfo.math}</div>
      </div>

      <div className="hmc-stats">
        <Stat label="Ընդամենը" value={stats.total} />
        <Stat label="Ընդ. %" value={stats.rate} />
        <Stat label="Ընդ." value={stats.accepted} tone="green" />
        <Stat label="Մերժ." value={stats.rejected} tone="red" />
      </div>
    </footer>
  );
}

function Stat({ label, tone = "", value }) {
  return (
    <div className="hmc-stat">
      <div className="hmc-stat__label">{label}</div>
      <div className={tone ? `hmc-stat__value hmc-stat__value--${tone}` : "hmc-stat__value"}>
        {value}
      </div>
    </div>
  );
}
