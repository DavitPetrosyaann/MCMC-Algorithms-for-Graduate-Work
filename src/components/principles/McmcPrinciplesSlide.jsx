import "./McmcPrinciplesSlide.scss";

const principles = [
  {
    label: "Target distribution",
    title: "Նպատակ",
    text: "Ունենք բարդ բաշխում π(x), որից ուղիղ նմուշառում անել չենք կարող։",
    formula: "π(x)",
  },
  {
    label: "Markov chain",
    title: "Շղթա",
    text: "Կառուցում ենք պատահական քայլերի շղթա՝ x₀ → x₁ → x₂ → ... → xₙ։",
    formula: "x₀ → x₁ → x₂",
  },
  {
    label: "Stationarity",
    title: "Ստացիոնարություն",
    text: "Շղթայի երկարաժամկետ բաշխումը պետք է մոտենա ցանկալի π(x)-ին։",
    formula: "πP = π",
  },
  {
    label: "Detailed balance",
    title: "Հավասարակշռություն",
    text: "Detailed balance-ը ապահովում է ճիշտ երկարաժամկետ վարք։",
    formula: "π(x)P(x,y)=π(y)P(y,x)",
  },
];

const applications = [
  "Bayesian statistics",
  "Machine learning",
  "Physics & chemistry",
  "Bioinformatics",
  "Finance",
  "Graphical models",
];

export default function McmcPrinciplesSlide() {
  return (
    <section className="mcmc-principles">
      <div className="mcmc-principles__particles" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <i key={index} style={{ "--i": index }} />
        ))}
      </div>

      <header className="mcmc-principles__header">
        <span>§5 MCMC Ընդհանուր Սկզբունքներ & Կիրառումներ</span>
        <h1>MCMC-ի ընդհանուր գաղափարը</h1>
        <p>
          MCMC-ն մեկ ալգորիթմ չէ, այլ մոտեցում․ կառուցել պատահական քայլերով
          Մարկովյան շղթա, որը երկար ժամանակ հետո նմանվում է ցանկալի բաշխմանը։
        </p>
      </header>

      <main className="mcmc-principles__content">
        <section className="mcmc-principles__cards">
          {principles.map((item, index) => (
            <article key={item.label} style={{ "--i": index }}>
              <span>{item.label}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
              <strong>{item.formula}</strong>
            </article>
          ))}
        </section>

        <aside className="mcmc-principles__side">
          <div className="mcmc-principles__mixing">
            <h2>Burn-in</h2>
            <p>
              Շղթայի սկզբնական հատվածը հաճախ կախված է մեկնարկային վիճակից, դրա
              համար առաջին քայլերը (burn-in) հեռացվում են՝ մինչև շղթան մոտենա
              կայուն ռեժիմի։
            </p>
          </div>

          <div className="mcmc-principles__apps">
            <h2>Կիրառումներ</h2>
            <ul>
              {applications.map((app) => (
                <li key={app}>{app}</li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </section>
  );
}
