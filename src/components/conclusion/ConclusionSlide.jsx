import "./ConclusionSlide.scss";

const conclusions = [
  {
    title: "Մարկովյան շղթա",
    text: "Շղթան քայլ առ քայլ մոտենում է ցանկալի բաշխմանը։",
  },
  {
    title: "Monte Carlo",
    text: "Պատահական նմուշները դառնում են հաշվարկային գործիք։",
  },
  {
    title: "Metropolis-Hastings",
    text: "Ընդհանուր մեթոդ է․ առաջարկում ենք թեկնածու և ընդունում կամ մերժում։",
  },
  {
    title: "Gibbs Sampling",
    text: "Հարմար է, երբ պայմանական բաշխումները հեշտ են։",
  },
  {
    title: "Hamiltonian Monte Carlo",
    text: "Օգտագործում է gradient և շարժվում է երկար, տեղեկացված քայլերով։",
  },
];

export default function ConclusionSlide() {
  return (
    <section className="conclusion-slide">
      <div className="conclusion-slide__particles" aria-hidden="true">
        {Array.from({ length: 20 }, (_, index) => (
          <i key={index} style={{ "--i": index }} />
        ))}
      </div>

      <header className="conclusion-slide__header">
        <span>§13 Եզրակացություն</span>
        <h1>Ինչ սովորեցինք MCMC-ից</h1>
        <p>
          MCMC մեթոդները թույլ են տալիս ուսումնասիրել բարդ բաշխումներ՝
          կառուցելով պատահական շղթա, որի երկարաժամկետ վարքը տալիս է մեզ
          անհրաժեշտ նմուշները։
        </p>
      </header>

      <main className="conclusion-slide__content">
        <section className="conclusion-slide__cards">
          {conclusions.map((item, index) => (
            <article key={item.title} style={{ "--i": index }}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <aside className="conclusion-slide__takeaway">
          <div className="conclusion-slide__ring" aria-hidden="true">
            <b />
            <i />
            <i />
            <i />
          </div>
          <h2>Գլխավոր միտքը</h2>
          <p>
            Երբ ուղիղ նմուշառումը դժվար է, MCMC-ն ստեղծում է ճանապարհ դեպի
            բաշխումը՝ փոքր պատահական քայլերից մինչև վստահելի վիճակագրական
            գնահատումներ։
          </p>
          <strong>random steps → structured samples → inference</strong>
        </aside>
      </main>
    </section>
  );
}
