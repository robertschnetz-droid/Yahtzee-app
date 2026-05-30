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

function clampPopup(left, top) {
  const padding = 12;
  const width = Math.min(360, window.innerWidth - padding * 2);
  const x = Math.min(Math.max(left, padding + width / 2), window.innerWidth - padding - width / 2);
  const y = Math.min(Math.max(top, 80), window.innerHeight - 110);
  return { left: x, top: y, width };
}

function GoldenYahtzeeDice() {
  return (
    <div className="goldDiceRow" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((dice, index) => (
        <img
          key={index}
          src="/gold-dice.png"
          alt=""
          className="goldDice"
          style={{ animationDelay: `${index * 0.08}s` }}
        />
      ))}
    </div>
  );
}

function FireworkShow() {
  return (
    <div className="fireworkShow" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="fireworkSpark"
          style={{
            left: `${8 + Math.random() * 84}%`,
            top: `${10 + Math.random() * 62}%`,
            animationDelay: `${Math.random() * 1.2}s`,
          }}
        >
          {['✦', '✧', '★', '✺'][Math.floor(Math.random() * 4)]}
        </span>
      ))}
    </div>
  );
}

function App() {
  const [gestart, setGestart] = useState(
  sessionStorage.getItem("spelGestart") === "true"
);

const [startAnimatie, setStartAnimatie] = useState(false);
  

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

  const [scoreMenu, setScoreMenu] = useState(null);
  const [bevestiging, setBevestiging] = useState(null);
  const [melding, setMelding] = useState(null);
  const [cellAnim, setCellAnim] = useState(null);
  const [rowAnim, setRowAnim] = useState(null);
  const [effect, setEffect] = useState(null);
  const [startDice, setStartDice] = useState(false);

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

  function triggerCellAnim(type, deel, r, k) {
    setCellAnim({ type, key: `${deel}-${r}-${k}` });
    setTimeout(() => setCellAnim(null), type === "yahtzee" ? 2100 : 700);
  }

  function triggerRowAnim(deel, r) {
    setRowAnim(`${deel}-${r}`);
    setTimeout(() => setRowAnim(null), 1200);
  }

  function triggerEffect(type, text = "") {
    setEffect({ type, text });
    setTimeout(() => setEffect(null), 3500);
  }

  function bevestigNieuwSpel() {
    setBevestiging({
      titel: "Nieuw spel starten?",
      tekst: "Alle scores worden gewist.",
      okTekst: "Nieuw spel",
      onOk: () => {
        speelGeluid(plingGeluid);
        setScoresBoven(boven.map(() => spellen.map(() => "")));
        setScoresOnder(onder.map(() => spellen.map(() => "")));
        setBonusBehaald([false, false, false, false, false, false]);
        setSadPlayed([false, false, false, false, false, false]);
      },
    });
  }

  function speelFinishedOf(geluid, bovenData, onderData) {
    if (spelKlaar(bovenData, onderData)) {
      speelGeluid(finishedGeluid);
      triggerEffect("finished", "Spel klaar!");
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
      setMelding({
        titel: "Yahtzee gegooid",
        tekst: "Vul eerst het Yahtzee-vak in.",
      });
      return;
    }

    const bovenKopie = scoresBoven.map((x) => [...x]);
    const onderKopie = scoresOnder.map((x) => [...x]);
    const wasRijVol = rijVol(bovenKopie[r]);

    bovenKopie[r][k] = waarde;
    vulYahtzeeBonusAlsNodig(onderKopie, r, k, waarde);

    setScoresBoven(bovenKopie);
    setScoresOnder(onderKopie);

    triggerCellAnim(waarde === 0 ? "zero" : "pulse", "boven", r, k);
    if (!wasRijVol && rijVol(bovenKopie[r])) triggerRowAnim("boven", r);

    if (spelKlaar(bovenKopie, onderKopie)) {
      speelGeluid(finishedGeluid);
      triggerEffect("finished", "Spel klaar!");
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
      triggerEffect("bonus", "Bonus gehaald 🎉");
      setBonusBehaald((prev) => {
        const nieuw = [...prev];
        nieuw[k] = true;
        return nieuw;
      });
    }

    if (bovenCompleet && nieuwTotaal < 63 && !sadPlayed[k]) {
      speelGeluid(sadTrombone);
      triggerEffect("sad", "Bonus niet gehaald");
      setSadPlayed((prev) => {
        const nieuw = [...prev];
        nieuw[k] = true;
        return nieuw;
      });
    }
  }

  function setOnder(r, k, v) {
    const waarde = v === "" ? "" : Number(v);

    const onderKopie = scoresOnder.map((x) => [...x]);
    const wasRijVol = rijVol(onderKopie[r]);
    onderKopie[r][k] = waarde;

    setScoresOnder(onderKopie);

    const isYahtzee = r === YAHTZEE_INDEX && waarde > 0;
    const animType = waarde === 0 ? "zero" : isYahtzee ? "yahtzee" : "pulse";
    triggerCellAnim(animType, "onder", r, k);
    if (!wasRijVol && rijVol(onderKopie[r])) triggerRowAnim("onder", r);

    if (spelKlaar(scoresBoven, onderKopie)) {
      speelGeluid(finishedGeluid);
      triggerEffect("finished", "Spel klaar!");
      return;
    }

    if (waarde === 0) {
      speelGeluid(aaahhhGeluid);
      return;
    }

    if (isYahtzee) {
      speelGeluid(yahtzeeGeluid);
      triggerEffect("yahtzee", "YAHTZEE!");
    }
  }

  function openScoreMenu(event, deel, r, k, opties, label) {
    const rect = event.currentTarget.getBoundingClientRect();
    const pos = clampPopup(rect.left + rect.width / 2, rect.bottom + 10);
    setScoreMenu({ deel, r, k, opties, label, pos });
  }

  function kiesScore(waarde) {
    if (!scoreMenu) return;

    if (waarde === "cancel") {
      setScoreMenu(null);      
      return;
    }

    const actie = { ...scoreMenu, waarde };
    setScoreMenu(null);
    document.activeElement.blur();
    setBevestiging({
      titel: "Weet je het zeker?",
      tekst: `${actie.label}: ${waarde === "" ? "-" : waarde}`,
      okTekst: "OK",
      onOk: () => {
        if (actie.deel === "boven") setBoven(actie.r, actie.k, waarde);
        if (actie.deel === "onder") setOnder(actie.r, actie.k, waarde);
      },
    });
  }

  function optiesBoven(r) {
  return ["0", ...Array.from({ length: 5 }, (_, n) => String((n + 1) * (r + 1)))];
}

function optiesOnder(cat) {
  if (cat.vast) return ["0", String(cat.vast)];
  return ["0", ...Array.from({ length: 32 }, (_, n) => String(n + 5))];
}

  function scoreButtonClass(isIngevuld, animKey) {
    const classes = ["scoreButton"];
    if (isIngevuld) classes.push("filled");
    if (cellAnim?.key === animKey) classes.push(cellAnim.type);
    return classes.join(" ");
  }

  function rijClass(deel, index) {
    return rowAnim === `${deel}-${index}` ? "rowComplete" : "";
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
  setStartAnimatie(true);
  setTimeout(() => {
    setGestart(true);
    sessionStorage.setItem("spelGestart", "true");
  }, 2000);
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
        {startAnimatie && (
  <div className="diceIntro">
  <img src="/2 dice.gif" alt="Rolling Dice" />
</div>
)}
      </div>
    );
  }

  return (
    <>
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
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 28px;
            overflow: hidden;
          }

          .startButton {
            font-size: 32px;
            padding: 20px 40px;
            border-radius: 15px;
            font-weight: bold;
            cursor: pointer;
            background: #f5c542;
            color: #101217;
            border: none;
            animation: softFloat 2s infinite ease-in-out;
          }

          .startLogo {
            width: 200px;
            margin-top: 20px;
          }

          .diceIntro {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            pointer-events: none;
            z-index: 9999;
          }

          .diceIntro span {
            font-size: 42px;
            animation: rollDice 1.5s ease-in-out both;
          }

          .diceIntro span:nth-child(2) { animation-delay: 0.08s; }
          .diceIntro span:nth-child(3) { animation-delay: 0.16s; }
          .diceIntro span:nth-child(4) { animation-delay: 0.24s; }
          .diceIntro span:nth-child(5) { animation-delay: 0.32s; }

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

          input {
            background: #252a33;
            color: white;
            border: 1px solid #5c6575;
            border-radius: 5px;
            padding: 4px;
            text-align: center;
          }

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

          .scoreButton {
            min-width: 58px;
            height: 34px;
            background: #252a33;
            color: white;
            border: 1px solid #5c6575;
            border-radius: 7px;
            padding: 4px 8px;
            transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          }

          .scoreButton.filled {
            background: ${GROEN};
            color: white;
            font-weight: bold;
            border: 2px solid ${GROEN};
          }

          .scoreButton:disabled {
            opacity: 0.95;
            cursor: default;
          }

          .scoreButton.pulse {
            animation: cellPulse 0.65s ease;
          }

          .scoreButton.zero {
            animation: zeroShake 0.65s ease;
          }

          .scoreButton.yahtzee {
            animation: yahtzeeJackpot 2s ease;
          }

          .autoScore {
            display: inline-block;
            min-width: 58px;
          }

          .rowComplete {
            animation: rowShine 1.1s ease;
          }

          .scoreMenu {
            position: fixed;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            background: #111827;
            padding: 10px;
            border-radius: 14px;
            box-shadow: 0 12px 35px rgba(0,0,0,0.55);
            z-index: 9999;
            transform: translateX(-50%);
            animation: menuIn 0.18s ease;
          }

          .scoreMenu button {
            min-width: 44px;
            background: #168a5a;
          }

          .modalBackdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.58);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
            z-index: 10000;
          }

          .modalBox {
            width: min(420px, 100%);
            background: #111827;
            color: white;
            border: 1px solid #2d3748;
            border-radius: 18px;
            padding: 20px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.6);
            animation: modalIn 0.2s ease;
          }

          .modalBox h2 {
            margin: 0 0 10px;
            font-size: 24px;
          }

          .modalBox p {
            margin: 0 0 18px;
            color: #d8dee9;
            line-height: 1.4;
          }

          .modalActions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .cancelButton {
            background: #374151;
          }

          .effectOverlay {
            position: fixed;
            inset: 0;
            z-index: 10001;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            font-size: clamp(34px, 8vw, 82px);
            font-weight: 900;
            text-align: center;
            text-shadow: 0 4px 20px rgba(0,0,0,0.65);
          }

          .effectOverlay.bonus {
            animation: confettiFade 2.2s ease both;
          }

          .effectOverlay.bonus::before,
          .effectOverlay.bonus::after {
            content: "🎉 🎊 ✨ 🎉 🎊";
            position: absolute;
            top: 15%;
            left: 0;
            right: 0;
            font-size: 34px;
            animation: confettiFall 2.1s ease both;
          }

          .effectOverlay.bonus::after {
            top: 35%;
            animation-delay: 0.25s;
          }

          .effectOverlay.sad {
            color: #ff6262;
            animation: dramaIn 2.2s ease both;
          }

          .effectOverlay.yahtzee {
            color: #ffd166;
            animation: yahtzeeOverlay 2.7s ease both;
          }

          .effectOverlay.finished {
            color: #ffd166;
            animation: finishedOverlay 3.4s ease both;
          }

          .finishSweepActive {
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 34px rgba(255,209,102,0.25);
          }

          .finishSweepActive::after {
            content: "";
            position: absolute;
            inset: -35%;
            pointer-events: none;
            background: linear-gradient(135deg,
              transparent 36%,
              rgba(255,209,102,0.0) 42%,
              rgba(255,209,102,0.55) 49%,
              rgba(255,255,255,0.85) 50%,
              rgba(255,209,102,0.55) 51%,
              rgba(255,209,102,0.0) 58%,
              transparent 64%
            );
            animation: scoreCardSweep 3.2s ease both;
            z-index: 4;
          }

          @keyframes softFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }

          @keyframes rollDice {
            0% { transform: translateX(-120vw) rotate(0deg) scale(0.7); opacity: 0; }
            60% { opacity: 1; }
            85% { transform: translateX(10px) rotate(680deg) scale(1.15); }
            100% { transform: translateX(0) rotate(720deg) scale(1); opacity: 0; }
          }

          @keyframes menuIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.96); }
            to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }

          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.94); }
            to { opacity: 1; transform: scale(1); }
          }

          @keyframes cellPulse {
            0% { transform: scale(1); box-shadow: 0 0 0 rgba(47,191,113,0); }
            50% { transform: scale(1.14); box-shadow: 0 0 22px rgba(47,191,113,0.95); }
            100% { transform: scale(1); box-shadow: 0 0 0 rgba(47,191,113,0); }
          }

          @keyframes zeroShake {
            0%, 100% { transform: translateX(0); background: ${GROEN}; }
            15% { transform: translateX(-6px); background: #b91c1c; }
            30% { transform: translateX(6px); background: #b91c1c; }
            45% { transform: translateX(-5px); }
            60% { transform: translateX(5px); }
            75% { transform: translateX(-3px); }
          }

          @keyframes yahtzeeJackpot {
            0% { transform: scale(1); box-shadow: 0 0 0 rgba(255,209,102,0); }
            25% { transform: scale(1.2) rotate(-2deg); box-shadow: 0 0 26px rgba(255,209,102,1); }
            50% { transform: scale(1.12) rotate(2deg); box-shadow: 0 0 34px rgba(255,255,255,0.9); }
            75% { transform: scale(1.18); box-shadow: 0 0 30px rgba(255,209,102,1); }
            100% { transform: scale(1); box-shadow: 0 0 0 rgba(255,209,102,0); }
          }

          @keyframes rowShine {
            0% { filter: brightness(1); }
            35% { filter: brightness(1.8); }
            100% { filter: brightness(1); }
          }

          @keyframes confettiFade {
            0% { opacity: 0; transform: scale(0.8); }
            20% { opacity: 1; transform: scale(1.05); }
            85% { opacity: 1; }
            100% { opacity: 0; transform: scale(1); }
          }

          @keyframes confettiFall {
            from { transform: translateY(-80px); opacity: 0; }
            20% { opacity: 1; }
            to { transform: translateY(220px); opacity: 0; }
          }

          @keyframes dramaIn {
            0% { opacity: 0; transform: translateY(-20px) scale(0.9); }
            20% { opacity: 1; transform: translateY(0) scale(1); }
            45% { transform: rotate(-2deg); }
            65% { transform: rotate(2deg); }
            100% { opacity: 0; transform: translateY(20px) scale(0.98); }
          }

          @keyframes yahtzeeOverlay {
            0% { opacity: 0; transform: scale(0.72); }
            18% { opacity: 1; transform: scale(1.06); }
            72% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.96); }
          }

          @keyframes finishedOverlay {
            0% { opacity: 0; transform: scale(0.84); letter-spacing: 0; }
            18% { opacity: 1; transform: scale(1.08); letter-spacing: 1px; }
            78% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.04); }
          }

          @keyframes scoreCardSweep {
            0% { transform: translate(-70%, -70%); opacity: 0; }
            18% { opacity: 1; }
            82% { opacity: 1; }
            100% { transform: translate(70%, 70%); opacity: 0; }
          }

          .goldDiceRow {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: clamp(6px, 2vw, 14px);
            margin-top: 18px;
            padding: 10px 14px;
            border-radius: 22px;
            background: radial-gradient(circle, rgba(255,209,102,0.18), rgba(255,209,102,0.04) 62%, transparent 72%);
          }

          .goldDice {
            width: clamp(42px, 12vw, 78px);
            height: clamp(42px, 12vw, 78px);
            object-fit: contain;
            animation: goldDicePop 2.4s ease both;
            filter: drop-shadow(0 0 4px rgba(255,209,102,0.75));
          }

          @keyframes goldDicePop {
            0% {
              opacity: 0;
              transform: translateY(18px) scale(0.72) rotate(-8deg);
              filter: drop-shadow(0 0 0 rgba(255,209,102,0));
            }
            22% {
              opacity: 1;
              transform: translateY(0) scale(1.12) rotate(3deg);
              filter:
                drop-shadow(0 0 5px #ffd166)
                drop-shadow(0 0 14px rgba(255,209,102,0.9))
                brightness(1.15);
            }
            45% {
              transform: translateY(0) scale(1) rotate(0deg);
              filter: drop-shadow(0 0 6px rgba(255,209,102,0.7));
            }
            62% {
              transform: translateY(0) scale(1.18);
              filter:
                drop-shadow(0 0 6px #ffd166)
                drop-shadow(0 0 18px rgba(255,209,102,0.95))
                brightness(1.2);
            }
            82% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translateY(-14px) scale(0.96);
              filter: drop-shadow(0 0 0 rgba(255,209,102,0));
            }
          }

          .fireworkShow {
            position: fixed;
            inset: 0;
            z-index: 10000;
            pointer-events: none;
            overflow: hidden;
          }

          .fireworkSpark {
            position: absolute;
            color: #ffd166;
            font-size: clamp(18px, 5vw, 42px);
            text-shadow: 0 0 12px rgba(255,209,102,0.95);
            animation: fireworkPop 1.7s ease both;
          }

          @keyframes fireworkPop {
            0% { opacity: 0; transform: scale(0.2) rotate(0deg); }
            28% { opacity: 1; transform: scale(1.45) rotate(18deg); }
            68% { opacity: 1; transform: scale(0.95) rotate(-10deg); }
            100% { opacity: 0; transform: scale(0.35) translateY(28px); }
          }
        `}</style>

        <div className="topbar">
          <button onClick={bevestigNieuwSpel}>Nieuw spel</button>
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

        <div className={`tableWrap ${effect?.type === "finished" ? "finishSweepActive" : ""}`}>
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
                  <tr key={cat} className={rijClass("boven", i)}>
                    <td style={{ opacity: rijIsVol ? RIJ_FADE : 1 }}>{cat}</td>

                    {spellen.map((_, k) => {
                      const isIngevuld = scoresBoven[i][k] !== "";
                      const animKey = `boven-${i}-${k}`;

                      return (
                        <td key={k} style={{ opacity: rijIsVol ? RIJ_FADE : 1 }}>
                          <button
                            type="button"
                            className={scoreButtonClass(isIngevuld, animKey)}
                            disabled={isIngevuld}
                            onClick={(e) =>
                              openScoreMenu(e, "boven", i, k, optiesBoven(i), cat)
                            }
                          >
                            {isIngevuld ? scoresBoven[i][k] : ""}
                          </button>
                        </td>
                      );
                    })}
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
                  <tr key={cat.naam} className={rijClass("onder", i)}>
                    <td style={{ opacity: rijIsVol ? RIJ_FADE : 1 }}>{cat.naam}</td>

                    {spellen.map((_, k) => {
                      const isIngevuld = scoresOnder[i][k] !== "";
                      const animKey = `onder-${i}-${k}`;

                      return (
                        <td key={k} style={{ opacity: rijIsVol ? RIJ_FADE : 1 }}>
                          {cat.automatisch ? (
                            <span
                              className="autoScore"
                              style={{
                                opacity: rijIsVol ? RIJ_FADE : 1,
                                fontWeight: isIngevuld ? "bold" : "normal",
                                color: isIngevuld ? "lightgreen" : "white",
                              }}
                            >
                              {isIngevuld ? scoresOnder[i][k] : "-"}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={scoreButtonClass(isIngevuld, animKey)}
                              disabled={isIngevuld}
                              onClick={(e) =>
                                openScoreMenu(e, "onder", i, k, optiesOnder(cat), cat.naam)
                              }
                            >
                              {isIngevuld ? scoresOnder[i][k] : ""}
                            </button>
                          )}
                        </td>
                      );
                    })}
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

      {scoreMenu && (
        <div
          className="scoreMenu"
          style={{
  position: "fixed",
  left: "50%",
  bottom: "16px",
  transform: "translateX(-50%)",
  width: "min(92vw, 650px)",
  maxHeight: "55vh",
  overflowY: "auto",
  zIndex: 10000,
}}
        >
          {scoreMenu.opties.map((waarde) => (
            <button key={waarde || "leeg"} type="button" onClick={() => kiesScore(waarde)}>
              {waarde === "" ? "-" : waarde}
            </button>
          ))}
          <button type="button" onClick={() => kiesScore("cancel")}>Sluiten</button>
        </div>
      )}

      {bevestiging && (
        <div className="modalBackdrop">
          <div className="modalBox">
            <h2 style={{ color: "#e5e7eb" }}>{bevestiging.titel}</h2>
            <p>{bevestiging.tekst}</p>
            <div className="modalActions">
              <button
                type="button"
                className="cancelButton"
                onClick={() => setBevestiging(null)}
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={() => {
                  const actie = bevestiging.onOk;
                  setBevestiging(null);
                  actie();
                }}
              >
                {bevestiging.okTekst || "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {melding && (
        <div className="modalBackdrop">
          <div className="modalBox">
            <h2>{melding.titel}</h2>
            <p>{melding.tekst}</p>
            <div className="modalActions">
              <button type="button" onClick={() => setMelding(null)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {effect && (
  <>
    {effect.type === "sad" && Array.from({ length: 15 }, (_, i) => (
        <div
    key={i}
    style={{
      position: "fixed",
      top: `${Math.random() * 100}vh`,
      left: `${Math.random() * 100}vw`,
      zIndex: 999999,
      color: "red",
      fontSize: `${20 + Math.random() * 40}px`,
      pointerEvents: "none",
    }}
  >
    ❌
  </div>
))}
{effect?.type === "bonus" &&
  Array.from({ length: 25 }, (_, i) => (
    <div
      key={`confetti-${i}`}
      style={{
        position: "fixed",
        top: `${Math.random() * 100}vh`,
        left: `${Math.random() * 100}vw`,
        zIndex: 999999,
        fontSize: `${20 + Math.random() * 40}px`,
        pointerEvents: "none",
      }}
    >
      {["🎉", "🎊", "✨"][Math.floor(Math.random() * 3)]}
    </div>
))}

    {effect.type === "finished" && <FireworkShow />}

    <div className={`effectOverlay ${effect.type}`}>
  <div>{effect.text}</div>

  {effect.type === "yahtzee" && (
    <GoldenYahtzeeDice />
  )}
</div>
  </>
)}
    </>
  );
}

export default App;
