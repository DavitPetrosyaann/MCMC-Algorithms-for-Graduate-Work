import "./ReferencesThanksSlide.scss";

const references = [
  {
    author: "Metropolis et al.",
    year: "1953",
    title: "Equation of State Calculations by Fast Computing Machines",
  },
  {
    author: "Hastings",
    year: "1970",
    title: "Monte Carlo Sampling Methods Using Markov Chains",
  },
  {
    author: "Geman & Geman",
    year: "1984",
    title: "Stochastic Relaxation, Gibbs Distributions, and Bayesian Restoration",
  },
  {
    author: "Neal",
    year: "2011",
    title: "MCMC Using Hamiltonian Dynamics",
  },
  {
    author: "Robert & Casella",
    year: "2004",
    title: "Monte Carlo Statistical Methods",
  },
  {
    author: "Gelman et al.",
    year: "2013",
    title: "Bayesian Data Analysis",
  },
];

export default function ReferencesThanksSlide() {
  return (
    <section className="references-thanks">
      <div className="references-thanks__particles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <i key={index} style={{ "--i": index }} />
        ))}
      </div>

      <header className="references-thanks__header">
        <span>§14 Գրականության ցանկ և Շնորհակալություն</span>
        <h1>Գրականություն</h1>
        <p>
          Այս աշխատանքում օգտագործված հիմնական գաղափարները գալիս են MCMC-ի
          դասական հոդվածներից և ժամանակակից Բայեսյան վիճակագրության գրքերից։
        </p>
      </header>

      <main className="references-thanks__content">
        <section className="references-thanks__list">
          {references.map((item, index) => (
            <article key={`${item.author}-${item.year}`} style={{ "--i": index }}>
              <span>{item.year}</span>
              <h2>{item.author}</h2>
              <p>{item.title}</p>
            </article>
          ))}
        </section>

        <aside className="references-thanks__thanks">
          <div className="references-thanks__atom" aria-hidden="true">
            <div className="references-thanks__nucleus">
              {Array.from({ length: 9 }, (_, index) => (
                <b
                  className={index % 2 === 0 ? "is-proton" : "is-neutron"}
                  key={index}
                  style={{ "--i": index }}
                />
              ))}
            </div>
            <i className="references-thanks__orbit references-thanks__orbit--one">
              <span />
            </i>
            <i className="references-thanks__orbit references-thanks__orbit--two">
              <span />
            </i>
            <i className="references-thanks__orbit references-thanks__orbit--three">
              <span />
            </i>
          </div>
          <h2>Շնորհակալություն</h2>
        </aside>
      </main>
    </section>
  );
}
