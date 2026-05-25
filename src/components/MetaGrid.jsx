import { useEffect, useState } from "react";
import "./MetaGrid.scss";

function normalizeItems(items) {
  if (Array.isArray(items)) return items;

  if (items && typeof items === "object") {
    return Object.entries(items).map(([label, value]) => ({
      label,
      value,
    }));
  }

  return [];
}

function getLabel(item) {
  return item.label ?? item.title ?? item.name ?? item.key ?? "";
}

function getValue(item) {
  return item.value ?? item.text ?? item.content ?? item.description ?? "";
}

export default function MetaGrid({ isVisible = false, items = [] }) {
  const normalizedItems = normalizeItems(items);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    setIsAnimated(false);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setIsAnimated(true));
    });
  }, [isVisible]);

  return (
    <section
      className={`thesis-meta-grid ${isAnimated ? "is-animated" : ""}`}
      aria-label="Thesis information"
    >
      {normalizedItems.map((item, index) => (
        <article
          className="thesis-meta-card"
          key={`${getLabel(item)}-${index}`}
          style={{ "--card-index": index }}
        >
          <div className="thesis-meta-graph" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="thesis-meta-label">{getLabel(item)}</div>
          <div className="thesis-meta-value">{getValue(item)}</div>
        </article>
      ))}
    </section>
  );
}
