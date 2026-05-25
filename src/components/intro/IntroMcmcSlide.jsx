import "./IntroMcmcSlide.scss";

const talkingPoints = [
  {
    title: "Հիմնական հարցը",
    text: "Ինչպե՞ս ուսումնասիրել բարդ հավանականային բաշխումներ, երբ ուղիղ նմուշառում անելը դժվար կամ անհնար է։",
  },
  {
    title: "MCMC-ի գաղափարը",
    text: "Կառուցում ենք Մարկովյան շղթա, որի երկարաժամկետ վարքը մոտենում է մեզ հետաքրքրող բաշխմանը։",
  },
  {
    title: "Այս ներկայացման ընթացքը",
    text: "Սկզբում Մարկովյան շղթաներ և Մոնտե Կառլո, հետո Metropolis-Hastings, Gibbs Sampling և HMC։",
  },
];

export default function IntroMcmcSlide() {
  return (
    <section className="intro-mcmc">
      <div className="intro-mcmc__copy">
        <span className="intro-mcmc__eyebrow">§1 Ներածություն</span>
        <h1>Markov Chain Monte Carlo</h1>
        <p className="intro-mcmc__lead">
          Այս աշխատանքում ես ներկայացնում եմ MCMC մեթոդների գաղափարը՝ ինչպես
          քայլ առ քայլ կառուցված շղթան կարող է մեզ տալ նմուշներ բարդ
          բաշխումներից։
        </p>

        <div className="intro-mcmc__cards">
          {talkingPoints.map((point, index) => (
            <article key={point.title} style={{ "--i": index }}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{point.title}</h2>
              <p>{point.text}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="intro-mcmc__visual" aria-hidden="true">
        <div className="intro-mcmc__target">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="intro-mcmc__chain">
          {Array.from({ length: 9 }, (_, index) => (
            <b key={index} style={{ "--i": index }} />
          ))}
        </div>
        <div className="intro-mcmc__formula">
          samples → target distribution
        </div>
      </div>
    </section>
  );
}
