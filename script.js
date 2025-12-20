const WORKER_URL = "https://falling-cake-f670.kirkjlemon.workers.dev/";

function safeText(v, fallback = "—") {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s.length ? s : fallback;
}

function fmtDateTime(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function fmtGamerscore(gs) {
  if (gs === null || gs === undefined) return "—";
  const n = Number(String(gs).replace(/,/g, ""));
  if (Number.isNaN(n)) return safeText(gs, "—");
  return n.toLocaleString();
}

function presenceDisplay(profile) {
  // Prefer "Playing X" extraction if available; else show presenceText; else fallback.
  const lastGame = profile?.lastGame ? String(profile.lastGame).trim() : "";
  const presenceText = profile?.presenceText ? String(profile.presenceText).trim() : "";

  if (lastGame) return `Playing: ${lastGame}`;
  if (presenceText) return presenceText;

  return "Offline / Private / Unknown";
}

async function generateRecap() {
  const gamertag = document.getElementById("gamertagInput").value.trim();
  if (!gamertag) return alert("Please enter a Gamertag");

  const card = document.getElementById("gamerCard");
  card.classList.add("hidden");

  try {
    const res = await fetch(`${WORKER_URL}?gamertag=${encodeURIComponent(gamertag)}`);
    if (!res.ok) throw new Error(`Worker error ${res.status}`);

    const data = await res.json();
    if (!data || data.exists === false) {
      alert("Gamertag not found");
      return;
    }

    const profile = data.profile || {};
    const recap = data.recap || {};

    // Gamerpic
    const pic = profile.displayPicRaw ? String(profile.displayPicRaw) : "";
    const picEl = document.getElementById("gamerPic");
    if (pic) {
      picEl.src = pic;
      picEl.style.visibility = "visible";
    } else {
      // keep layout clean if missing
      picEl.removeAttribute("src");
      picEl.style.visibility = "hidden";
    }

    // Fill rows
    document.getElementById("gtName").innerText = safeText(data.gamertag, gamertag);
    document.getElementById("gtGamerscore").innerText = fmtGamerscore(profile.gamerscore);
    document.getElementById("gtPresence").innerText = presenceDisplay(profile);

    document.getElementById("gtFirstSeen").innerText = fmtDateTime(recap.firstSeen);
    document.getElementById("gtLastSeen").innerText = fmtDateTime(recap.lastSeen);
    document.getElementById("gtChecks").innerText = safeText(recap.lookupCount, "0");

    document.getElementById("gtSource").innerText = `source: ${safeText(data.source, "—")}`;

    // Show card
    card.classList.remove("hidden");

    // Shareable URL
    const url = new URL(window.location.href);
    url.searchParams.set("gamertag", gamertag);
    window.history.replaceState({}, "", url);

  } catch (err) {
    console.error(err);
    alert("Failed to load Xbox Recap");
  }
}

// Button + Enter key
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("generateBtn").addEventListener("click", generateRecap);

  document.getElementById("gamertagInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") generateRecap();
  });

  // Auto-load from URL
  const params = new URLSearchParams(window.location.search);
  const gamertag = params.get("gamertag");
  if (gamertag) {
    document.getElementById("gamertagInput").value = gamertag;
    generateRecap();
  }
});
