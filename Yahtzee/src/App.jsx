import { useState, useEffect } from "react";

const plingGeluid = new Audio("/sounds/Pling.mp3?v=2");
const bonusGeluid = new Audio("/sounds/Bonus.mp3?v=2");
const aaahhhGeluid = new Audio("/sounds/Aaahhh.mp3?v=2");
const yahtzeeGeluid = new Audio("/sounds/Yahtzee.mp3?v=2");
const sadTrombone = new Audio("/sounds/sadtrombone.mp3?v=2");
const finishedGeluid = new Audio("/sounds/finished.mp3?v=2");
const startupGeluid = new Audio("/sounds/Start Up.mp3?v=2");

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
  { naam: "Yahtzee bonus", vast: 100, automatisch: true },
];

const YAHTZEE_INDEX = 5;
const YAHTZEE_BONUS_INDEX = 7;
const RIJ_FADE = 0.35;
const GROEN = "#2fbf71";

function speelGeluid(geluid) {
  geluid.currentTime = 0;
  geluid.play().catch(() => {});
}

function rijVol(rij) {
  return rij.every((vak) => vak !== "");
}

function bovenVol(bovenData) {
  return bovenData.every(rijVol);
}

function onderVolVoorEinde(onderData) {
  return onderData
    .filter((_, index) => index !== YAHTZEE_BONUS_INDEX)
    .every(rijVol);
}

function spelKlaar(bovenData, onderData) {
  return bovenVol(bovenData) && onderVolVoorEinde(onderData);
}

function ingevuldStyle(isIngevuld, rijIsVol) {
  return {
    opacity: rijIsVol ? RIJ_FADE : 1,
    ...(isIngevuld
      ? {
          backgroundColor: GROEN,
          color: "white",
          fontWeight: "bold",
          border: `2px solid ${GROEN}`,
        }
      : {}),
  };
}

function App() {
  const [gestart, setGestart] = useState(
    sessionStorage.getItem("spelGestart") === "true"
  );

  const [bonusBehaald, setBonusBehaald] = useState([
    false,
    false,
    false,
    false,
    false,
    false,
  ]);

  const [sadPlayed, setSadPlayed] = useState([
    false,
    false,
    false,
    false,
    false,
    false,
  ]);

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
    if (!sessionStorage.getItem("startupPlayed")) {
      speelGeluid(startupGeluid);
      sessionStorage.setItem("startupPlayed", "true");
    }
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

    speelGeluid(plingGeluid);
    setScoresBoven(boven.map(() => spellen.map(() => "")));
    setScoresOnder(onder.map(() => spellen.map(() => "")));
    setBonusBehaald([false, false, false, false, false, false]);
    setSadPlayed([false, false, false, false, false, false]);
  }

  function speelFinishedOf(geluid, bovenData, onderData) {
    if (spelKlaar(bovenData, onderData)) {
      speelGeluid(finishedGeluid);
      return true;
    }

    if (geluid) speelGeluid(geluid);
    return false;
  }

  function yahtzeeVakOpen(k) {
    return scoresOnder[YAHTZEE_INDEX][k] === "";
  }

  function isYahtzeeScoreBoven(r, waarde) {
    return Number(waarde) === (r + 1) * 5;
  }

  function vulYahtzeeBonusAlsNodig(onderData, r, k, waarde) {
    const yahtzeeAlGehaald = Number(onderData[YAHTZEE_INDEX][k]) === 50;
    const bonusNogLeeg = onderData[YAHTZEE_BONUS_INDEX][k] === "";

    if (yahtzeeAlGehaald && bonusNogLeeg && isYahtzeeScoreBoven(r, waarde)) {
      onderData[YAHTZEE_BONUS_INDEX][k] = 100;
    }
  }

  function setBoven(r, k, v) {
    const waarde = v === "" ? "" : Number(v);

    if (waarde !== "" && isYahtzeeScoreBoven(r, waarde) && yahtzeeVakOpen(k)) {
      window.alert("Je hebt Yahtzee gegooid. Vul eerst het Yahtzee-vak in.");
      return;
    }

    const bovenKopie = scoresBoven.map((x) => [...x]);
    const onderKopie = scoresOnder.map((x) => [...x]);

    bovenKopie[r][k] = waarde;
    vulYahtzeeBonusAlsNodig(onderKopie, r, k, waarde);

    setScoresBoven(bovenKopie);
    setScoresOnder(onderKopie);

    if (spelKlaar(bovenKopie, onderKopie)) {
      speelGeluid(finishedGeluid);
      return;
    }

    if (waarde === 0) {
      speelGeluid(aaahhhGeluid);
    }

    const nieuwTotaal = bovenKopie.reduce(
      (s, rij) => s + (Number(rij[k]) || 0),
      0
    );
    const bovenCompleet = bovenKopie.every((rij) => rij[k] !== "");

    if (nieuwTotaal >= 63 && !bonusBehaald[k]) {
      speelGeluid(bonusGeluid);
      setBonusBehaald((prev) => {
        const nieuw = [...prev];
        nieuw[k] = true;
        return nieuw;
      });
    }

    if (bovenCompleet && nieuwTotaal < 63 && !sadPlayed[k]) {
      speelGeluid(sadTrombone);
      setSadPlayed((prev) => {
        const nieuw = [...prev];
        nieuw[k] = true;
        return nieuw;
      });
    }
  }

  function setOnder(r, k, v) {
    const value = v.replace(/[^0-9]/g, "");
    const waarde = value === "" ? "" : Number(value);

    const onderKopie = scoresOnder.map((x) => [...x]);
    onderKopie[r][k] = waarde;

    setScoresOnder(onderKopie);

    if (spelKlaar(scoresBoven, onderKopie)) {
      speelGeluid(finishedGeluid);
      return;
    }

    if (waarde === 0) {
      speelGeluid(aaahhhGeluid);
      return;
    }

    if (r === YAHTZEE_INDEX && waarde > 0) {
      speelGeluid(yahtzeeGeluid);
    }
  }

  if (!gestart) {
    return (
      <div
        className="startScherm"
        style={{
          background: "#101217",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        <button
          style={{
            fontSize: "32px",
            padding: "20px 40px",
            borderRadius: "15px",
            fontWeight: "bold",
            cursor: "pointer",
            background: "#f5c542",
            color: "#101217",
            border: "none",
          }}
          onClick={() => {
            setGestart(true);
            sessionStorage.setItem("spelGestart", "true");
          }}
        >
          Start spel
        </button>
        <img
          src="/icon.png"
          alt="Logo"
          className="startLogo"
          style={{ width: "200px", marginTop: "20px" }}
        />
      </div>
    );
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

        .startScherm {
          background: #101217;
          min-height: 100vh;
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

      <div className="topbar">
        <button onClick={nieuwSpel}>Nieuw spel</button>
        <input
          className="nameInput"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="Naam speler"
          enterKeyHint="done"
          onKeyDown={(e) => {
            if (e.key === "Enter") e.target.blur();
          }}
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
            {boven.map((cat, i) => {
              const rijIsVol = rijVol(scoresBoven[i]);

              return (
                <tr key={cat}>
                  <td style={{ opacity: rijIsVol ? RIJ_FADE : 1 }}>{cat}</td>

                  {spellen.map((_, k) => (
                    <td key={k}>
                      <select
                        style={ingevuldStyle(scoresBoven[i][k] !== "", rijIsVol)}
                        disabled={scoresBoven[i][k] !== ""}
                        value={scoresBoven[i][k]}
                        onChange={(e) => {
                          if (!window.confirm("Weet je het zeker?")) return;
                          if (e.target.value === "cancel") {
                            e.target.blur();
                            return;
                          }

                          setBoven(i, k, e.target.value);
                          e.target.blur();
                        }}
                      >
                        <option disabled>{cat}</option>
                        <option value="">-</option>
                        <option value="0">0</option>

                        {Array.from({ length: 5 }, (_, n) => (n + 1) * (i + 1)).map(
                          (waarde) => (
                            <option key={waarde} value={waarde}>
                              {waarde}
                            </option>
                          )
                        )}

                        <option value="cancel">Annuleren</option>
                      </select>
                    </td>
                  ))}
                </tr>
              );
            })}

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

            {onder.map((cat, i) => {
              const rijIsVol = rijVol(scoresOnder[i]);

              return (
                <tr key={cat.naam}>
                  <td style={{ opacity: rijIsVol ? RIJ_FADE : 1 }}>{cat.naam}</td>

                  {spellen.map((_, k) => (
                    <td
  key={k}
  className={
    cat.naam === "Yahtzee" &&
    scoresOnder[i][k] === 50
      ? "yahtzee-animation"
      : ""
  }
>
                      {cat.automatisch ? (
                        <span
                          style={{
                            display: "inline-block",
                            minWidth: "58px",
                            opacity: rijIsVol ? RIJ_FADE : 1,
                            fontWeight: scoresOnder[i][k] !== "" ? "bold" : "normal",
                            color: scoresOnder[i][k] !== "" ? "lightgreen" : "white",
                          }}
                        >
                          {scoresOnder[i][k] === "" ? "-" : scoresOnder[i][k]}
                        </span>
                      ) : (
                        <select
                            style={ingevuldStyle(scoresOnder[i][k] !== "", rijIsVol)}
                          disabled={scoresOnder[i][k] !== ""}
                          value={scoresOnder[i][k]}
                          onChange={(e) => {
                            if (!window.confirm("Weet je het zeker?")) return;
                            if (e.target.value === "cancel") {
                              e.target.blur();
                              return;
                            }

                            setOnder(i, k, e.target.value);
                            e.target.blur();
                          }}
                        >
                          <option disabled>{cat.naam}</option>
                          <option value="">-</option>
                          <option value="0">0</option>

                          {cat.vast ? (
                            <option value={cat.vast}>{cat.vast}</option>
                          ) : (
                            Array.from({ length: 32 }, (_, n) => n + 5).map(
                              (waarde) => (
                                <option key={waarde} value={waarde}>
                                  {waarde}
                                </option>
                              )
                            )
                          )}

                          <option value="cancel">Annuleren</option>
                        </select>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}

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
