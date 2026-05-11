import { useState, useEffect } from "react";

const plingGeluid = new Audio("/sounds/Pling.mp3");
const bonusGeluid = new Audio("/sounds/Bonus.mp3");
const aaahhhGeluid = new Audio("/sounds/Aaahhh.mp3");
const yahtzeeGeluid = new Audio("/sounds/Yahtzee.mp3");
const startupGeluid = new Audio("/sounds/Startup.mp3");
const sadTrombone = new Audio("/sounds/sadtrombone.mp3");
const finishedGeluid = new Audio("/sounds/finished.mp3");

function App() {
  const spellen = [1, 2, 3, 4, 5, 6];
  const boven = ["Enen", "Tweeën", "Drieën", "Vieren", "Vijven", "Zessen"];

  const onder = [
    { naam: "3 dezelfde", vast: null },
    { naam: "4 dezelfde", vast: null },
    { naam: "Full House", vast: 25 },
    { naam: "Kleine straat", vast: 30 },
    { naam: "Grote straat", vast: 40 },
    { naam: "Yahtzee", vast: 50 },
    { naam: "Kans", vast: null },
    { naam: "Yahtzee bonus", vast: 100 },
  ];

  const [bonusBehaald, setBonusBehaald] = useState([false, false, false, false, false, false]);
  const [sadPlayed, setSadPlayed] = useState([false, false, false, false, false, false]);

  const [scoresBoven, setScoresBoven] = useState(() => {
    const data = localStorage.getItem("scoresBoven");
    return data ? JSON.parse(data) : boven.map(() => spellen.map(() => ""));
  });

  const [scoresOnder, setScoresOnder] = useState(() => {
    const data = localStorage.getItem("scoresOnder");
    return data ? JSON.parse(data) : onder.map(() => spellen.map(() => ""));
  });

  const [naam, setNaam] = useState(() => localStorage.getItem("naam") || "");

  useEffect(() => {
    localStorage.setItem("scoresBoven", JSON.stringify(scoresBoven));
  }, [scoresBoven]);

  useEffect(() => {
    localStorage.setItem("scoresOnder", JSON.stringify(scoresOnder));
  }, [scoresOnder]);

  useEffect(() => {
    localStorage.setItem("naam", naam);
  }, [naam]);

  useEffect(() => {
    startupGeluid.currentTime = 0;
    startupGeluid.play();
  }, []);

  const totaal = (k) =>
    scoresBoven.reduce((s, r) => s + (Number(r[k]) || 0), 0);

  const bonus = (k) => (totaal(k) >= 63 ? 35 : 0);
  const totaalBoven = (k) => totaal(k) + bonus(k);
  const totaalOnder = (k) =>
    scoresOnder.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const eind = (k) => totaalBoven(k) + totaalOnder(k);
  const grand = () => spellen.reduce((s, _, k) => s + eind(k), 0);

  const bonusNogNodig = (kolom) => {
    const bovenCompleet = scoresBoven.every((rij) => rij[kolom] !== "");
    const nodig = 63 - totaal(kolom);

    if (bonusBehaald[kolom] || totaal(kolom) >= 63) return "🎉";
    if (bovenCompleet) return "❌";
    return nodig < 0 ? 0 : nodig;
  };

  function nieuwSpel() {
    if (!window.confirm("Nieuw spel starten?")) return;

    plingGeluid.currentTime = 0;
    plingGeluid.play();

    setScoresBoven(boven.map(() => spellen.map(() => "")));
    setScoresOnder(onder.map(() => spellen.map(() => "")));
    setBonusBehaald([false, false, false, false, false, false]);
    setSadPlayed([false, false, false, false, false, false]);
  }

  function setBoven(r, k, v) {
    const waarde = v === "" ? "" : Number(v);
    const kopie = scoresBoven.map((x) => [...x]);

    kopie[r][k] = waarde;
    setScoresBoven(kopie);

    if (waarde === 0) {
      aaahhhGeluid.currentTime = 0;
      aaahhhGeluid.play();
    }

    const nieuwTotaal = kopie.reduce((s, rij) => s + (Number(rij[k]) || 0), 0);
    const bovenCompleet = kopie.every((rij) => rij[k] !== "");

    if (nieuwTotaal >= 63 && !bonusBehaald[k]) {
  bonusGeluid.currentTime = 0;
  bonusGeluid.play();

  setBonusBehaald((prev) => {
    const nieuw = [...prev];
    nieuw[k] = true;
    return nieuw;
  });
}

if (nieuwTotaal < 63 && bonusBehaald[k]) {
  setBonusBehaald((prev) => {
    const nieuw = [...prev];
    nieuw[k] = false;
    return nieuw;
  });
}

    if (bovenCompleet && nieuwTotaal < 63 && !sadPlayed[k]) {
      sadTrombone.currentTime = 0;
      sadTrombone.play();

      setSadPlayed((prev) => {
        const nieuw = [...prev];
        nieuw[k] = true;
        return nieuw;
      });
    }
  }

  function setOnder(r, k, v) {
    const value = v.replace(/[^0-9]/g, "");
    const kopie = scoresOnder.map((x) => [...x]);

    kopie[r][k] = value === "" ? "" : Number(value);
    const allesBovenIngevuld = scoresBoven.every((rij) =>
  rij.every((vak) => vak !== "")
);

const allesOnderIngevuld = kopie
  .slice(0, -1)
  .every((rij) => rij.every((vak) => vak !== ""));

if (allesBovenIngevuld && allesOnderIngevuld) {
  finishedGeluid.currentTime = 0;
  finishedGeluid.play();
}

    if (Number(value) === 0 && value !== "") {
      aaahhhGeluid.currentTime = 0;
      aaahhhGeluid.play();
    }

    if ((r === 5 || r === 7) && Number(value) > 0) {
      yahtzeeGeluid.currentTime = 0;
      yahtzeeGeluid.play();
    }

    setScoresOnder(kopie);
  }

  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; }

        .app {
          min-height: 100vh;
          background: #101217;
          color: #f5f5f5;
          font-family: Arial, sans-serif;
          padding: 16px;
        }

        h1 {
          text-align: center;
          margin: 6px 0 12px;
          font-size: 40px;
        }

        .topbar {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        button {
          background: #168a5a;
          color: white;
          border: none;
          padding: 7px 13px;
          border-radius: 7px;
          font-weight: bold;
          cursor: pointer;
        }

        input, select {
          background: #252a33;
          color: white;
          border: 1px solid #5c6575;
          border-radius: 5px;
          padding: 4px;
          text-align: center;
        }

        input { width: 50px; }
        select { width: 58px; }
        .nameInput { width: 160px; }

        .tableWrap {
          overflow-x: auto;
          max-width: 1000px;
          margin: 0 auto;
          border-radius: 10px;
        }

        table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          background: #1b1f27;
        }

        th {
          background: #273447;
          color: white;
          padding: 9px;
        }

        td {
          padding: 6px;
          text-align: center;
          border-bottom: 1px solid #303744;
        }

        td:first-child {
          font-weight: bold;
          width: 150px;
        }

        .total {
          background: #273447;
          color: white;
          font-weight: bold;
        }

        .grand {
          background: #8b1e1e;
          color: white;
          font-weight: bold;
          font-size: 18px;
        }
      `}</style>

      <h1>YAHTZEE</h1>

      <div className="topbar">
        <button onClick={nieuwSpel}>Nieuw spel</button>
        <input
          className="nameInput"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="Naam speler"
        />
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Categorie</th>
              {spellen.map((s) => (
                <th key={s}>Spel {s}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {boven.map((cat, i) => (
              <tr key={cat}>
                <td>{cat}</td>

                {spellen.map((_, k) => (
                  <td key={k}>
                    <select
                      value={scoresBoven[i][k]}
                      onChange={(e) => {
  setBoven(i, k, e.target.value);
  e.target.blur();
}}
                    >
                      <option value="">-</option>
                      <option value="0">0</option>

                      {Array.from({ length: 5 }, (_, n) => (n + 1) * (i + 1)).map(
                        (waarde) => (
                          <option key={waarde} value={waarde}>
                            {waarde}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                ))}
              </tr>
            ))}

            <tr className="total">
              <td>Totaal</td>
              {spellen.map((_, k) => (
                <td key={k}>{totaal(k)}</td>
              ))}
            </tr>

            <tr className="total">
              <td>Punten tot bonus</td>
              {spellen.map((_, k) => (
                <td
                  key={k}
                  style={{
                    color: totaal(k) >= 63 ? "lightgreen" : "red",
                    fontWeight: "bold",
                  }}
                >
                  {bonusNogNodig(k)}
                </td>
              ))}
            </tr>

            <tr>
              <td><b>Bonus</b></td>
              {spellen.map((_, k) => (
                <td key={k}>{bonus(k)}</td>
              ))}
            </tr>

            <tr className="total">
              <td>Totaal boven</td>
              {spellen.map((_, k) => (
                <td key={k}>{totaalBoven(k)}</td>
              ))}
            </tr>

            {onder.map((cat, i) => (
              <tr key={cat.naam}>
                <td>{cat.naam}</td>

                {spellen.map((_, k) => (
                  <td key={k}>
                    {cat.vast ? (
                      <select
                        value={scoresOnder[i][k]}
                        onChange={(e) => {
  setOnder(i, k, e.target.value);
  e.target.blur();
}}
                      >
                        <option value="">-</option>
                        <option value={0}>0</option>
                        <option value={cat.vast}>{cat.vast}</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        inputMode="numeric"
                        enterKeyHint="done"
                        pattern="[0-9]*"
                        value={
                          scoresOnder[i][k] === ""
                            ? ""
                            : scoresOnder[i][k] === 0
                            ? "❌"
                            : scoresOnder[i][k]
                        }
                        onChange={(e) => setOnder(i, k, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.target.blur();
                          }
                        }}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}

            <tr className="total">
              <td>Totaal onder</td>
              {spellen.map((_, k) => (
                <td key={k}>{totaalOnder(k)}</td>
              ))}
            </tr>

            <tr className="total">
              <td>Totaal boven</td>
              {spellen.map((_, k) => (
                <td key={k}>{totaalBoven(k)}</td>
              ))}
            </tr>

            <tr className="total">
              <td>Eind totaal</td>
              {spellen.map((_, k) => (
                <td key={k}>{eind(k)}</td>
              ))}
            </tr>

            <tr className="grand">
              <td>Grand totaal</td>
              <td colSpan="6">{grand()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;