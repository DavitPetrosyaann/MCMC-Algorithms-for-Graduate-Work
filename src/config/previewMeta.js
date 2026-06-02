const PUBLIC_PROJECT_URL =
  "https://davitpetrosyaann.github.io/MCMC-Algorithms-for-Graduate-Work/";
const PUBLIC_PREVIEW_IMAGE_URL = `${PUBLIC_PROJECT_URL}preview-card.png`;

const fallbackMeta = {
  title: "Monte Carlo Markov Chains",
  description:
    "An interactive visual presentation of MCMC methods, including Markov chains, Metropolis-Hastings, Gibbs sampling, and Hamiltonian Monte Carlo.",
  image: PUBLIC_PREVIEW_IMAGE_URL,
  url: PUBLIC_PROJECT_URL,
};

export const previewMeta = {
  title: fallbackMeta.title,
  description: fallbackMeta.description,
  image: fallbackMeta.image,
  url: fallbackMeta.url,
};

function ensureContentMeta(selector, attributes, content) {
  if (!content) {
    return;
  }

  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("meta");
    Object.entries(attributes).forEach(([name, value]) => {
      tag.setAttribute(name, value);
    });
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

export function applyMeta(meta) {
  const safeMeta = {
    ...fallbackMeta,
    ...meta,
    title: meta?.title || fallbackMeta.title,
    description: meta?.description || fallbackMeta.description,
    image: meta?.image || fallbackMeta.image,
    url: meta?.url || fallbackMeta.url,
  };

  document.title = safeMeta.title;

  ensureContentMeta(
    'meta[name="description"]',
    { name: "description" },
    safeMeta.description,
  );
  ensureContentMeta(
    'meta[property="og:title"]',
    { property: "og:title" },
    safeMeta.title,
  );
  ensureContentMeta(
    'meta[property="og:description"]',
    { property: "og:description" },
    safeMeta.description,
  );
  ensureContentMeta(
    'meta[property="og:image"]',
    { property: "og:image" },
    safeMeta.image,
  );
  ensureContentMeta(
    'meta[property="og:url"]',
    { property: "og:url" },
    safeMeta.url,
  );
  ensureContentMeta(
    'meta[name="twitter:title"]',
    { name: "twitter:title" },
    safeMeta.title,
  );
  ensureContentMeta(
    'meta[name="twitter:description"]',
    { name: "twitter:description" },
    safeMeta.description,
  );
  ensureContentMeta(
    'meta[name="twitter:image"]',
    { name: "twitter:image" },
    safeMeta.image,
  );
}

// TODO: Add dynamic metadata per route/page.
// TODO: Auto-generate preview image later.
// TODO: Add fallback image.
// TODO: Add structured schema.org metadata.
// TODO: Add project category/type tags.
// TODO: Optimize preview image size.
// TODO: Add cache invalidation for updated previews.
