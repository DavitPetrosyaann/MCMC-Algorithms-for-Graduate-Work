import { useState } from "react";
import MarkovChain from "./MarkovChain.jsx";
import NuclearMarkovLab from "./NuclearMarkovLab.jsx";
import "./MarkovSuite.scss";

export default function MarkovSuite({ children }) {
  const [mode, setMode] = useState("letters");

  return (
    <section className="markov-suite">
      <header className="markov-suite__header">
        <span>§3 Մարկովյան Շղթաներ</span>
        <h1>Մարկովյան Շղթա // Евгений Онегин // Nuclear Lab</h1>
      </header>

      <div className="markov-suite__switch" aria-label="Markov simulation mode">
        <button
          className={mode === "letters" ? "is-active" : ""}
          onClick={() => setMode("letters")}
          type="button"
        >
          Letter Chain
        </button>
        <button
          className={mode === "nuclear" ? "is-active" : ""}
          onClick={() => setMode("nuclear")}
          type="button"
        >
          Nuclear Chain
        </button>
      </div>

      <div className="markov-suite__view">
        {mode === "letters" ? children || <MarkovChain /> : <NuclearMarkovLab />}
      </div>
    </section>
  );
}
