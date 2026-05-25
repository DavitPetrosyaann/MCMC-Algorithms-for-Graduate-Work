export const distributionOptions = [
  { value: 0, label: "Оղակային (Ring)" },
  { value: 1, label: "Կրկ. Խութ" },
  { value: 2, label: "Banana" },
];

export const styleOptions = [
  { value: 0, label: "Ջերմային" },
  { value: 1, label: "Օվկիանոս" },
  { value: 2, label: "Neon" },
];

export const algorithmSteps = [
  "Սկզբ. x₀",
  "Կիրառել p~N(0,1)",
  "Leapfrog (L քայլ)",
  "Հաշ. ΔH",
  "Ընդ./Մերժ.",
  "Ավ. նմուշ",
];

export const initialStepInfo = {
  tag: "Սպասում",
  tone: "idle",
  desc: "Սեղմեք «Սկսել» կամ «Քայլ»՝ HMC ալգորիթմը դիտելու համար:",
  math: "",
};

export const initialStats = {
  total: 0,
  accepted: 0,
  rejected: 0,
  rate: "—",
};
