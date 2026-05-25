export const coverMeta = [
  {
    label: "Ուսանող",
    value: "Պետրոսյան Դավիթ",
  },
  {
    label: "Ղեկավար",
    value: "Ահարոնյան Նարինե",
  },
  {
    label: "Ծրագիր",
    value: "Կիրառական Վիճ. & Տվյալների Գիտություն",
  },
  {
    label: "Ամբիոն",
    value: "Հավանականությունների Տ. & Մաթ. Վիճ.",
  },
];

export const coverSlide = {
  id: "cover",
  number: 0,
  title: "Monte Carlo Markov Chains",
};

export const sectionSlides = [
  "§1 Ներածություն",
  "§2 Պատմական Ակնարկ",
  "§3 Մարկովյան Շղթաներ",
  "§4 Մոնտե Կառլո Մեթոդ",
  "§5 MCMC Ընդհանուր Սկզբունքներ & Կիրառումներ",
  "§6 Metropolis-Hastings ներածություն",
  "§7 Metropolis-Hastings Algorithm Simulation",
  "§8 Gibbs Sampling ներածություն",
  "§9 Gibbs Sampling Algorithm Simulation",
  "§10 MH vs Gibbs Համեմատություն",
  "§11 Hamiltonian Monte Carlo ներածություն",
  "§12 HMC Algorithm Simulation",
  "§13 Եզրակացություն",
  "§14 Գրականության ցանկ",
].map((title, index) => ({
  id: `slide-${index + 1}`,
  number: index + 1,
  title,
}));
