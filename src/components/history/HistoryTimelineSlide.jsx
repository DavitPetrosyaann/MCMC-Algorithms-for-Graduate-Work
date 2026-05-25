import "./HistoryTimelineSlide.scss";

const milestones = [
  {
    year: "1906-1913",
    title: "Մարկովյան շղթաներ",
    text: "Ա. Ա. Մարկովը ձևակերպեց կախյալ պատահական պրոցեսների գաղափարը․ ապագա վիճակը կախված է ներկա վիճակից։",
  },
  {
    year: "1940s",
    title: "Մոնտե Կառլո մեթոդ",
    text: "Լոս Ալամոսում պատահական նմուշառումը դարձավ հաշվարկային գործիք բարդ ֆիզիկական խնդիրների համար։",
  },
  {
    year: "1953",
    title: "Metropolis ալգորիթմ",
    text: "Պատահական քայլերը կառուցվեցին այնպես, որ երկարաժամկետ արդյունքում ստացվի ցանկալի բաշխումը։",
  },
  {
    year: "1970",
    title: "Metropolis-Hastings",
    text: "W. K. Hastings-ը ընդհանրացրեց մեթոդը և դրեց ժամանակակից MCMC-ի հիմնական հիմքերից մեկը։",
  },
];

export default function HistoryTimelineSlide() {
  return (
    <section className="history-timeline">
      <div className="history-timeline__particles" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <i key={index} style={{ "--i": index }} />
        ))}
      </div>

      <div className="history-timeline__header">
        <span>§2 Պատմական Ակնարկ</span>
        <h1>MCMC-ի պատմական ճանապարհը</h1>
        <p>
          MCMC-ն ծնվեց երկու գաղափարների միավորումից՝ Մարկովյան շղթաներ և Մոնտե
          Կառլո սիմուլյացիաներ։
        </p>
      </div>

      <div className="history-timeline__line" aria-hidden="true">
        <i />
      </div>

      <div className="history-timeline__items">
        {milestones.map((item, index) => (
          <article key={item.year} style={{ "--i": index }}>
            <div className="history-timeline__year">{item.year}</div>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
