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
  const lastGame = profile?.lastGame ? String(profile.lastGame).trim() : "";
  const presenceText = profile?.presenceText ? String(profile.presenceText).trim() : "";

  if (lastGame) return `Playing: ${lastGame}`;
  if (presenceText) return presenceText;

  return "Offline / Private / Unknown";
}

async function generateCard() {
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

    // Avatar: never stretch; show fallback icon when missing
    const pic = profile.displayPicRaw ? String(profile.displayPicRaw) : "";
    const picEl = document.getElementById("gamerPic");
    const fallbackEl = document.getElementById("avatarFallback");

    if (pic) {
      picEl.src = pic;
      picEl.style.display = "block";
      fallbackEl.style.display = "none";
    } else {
      picEl.removeAttribute("src");
      picEl.style.display = "none";
      fallbackEl.style.display = "grid";
    }

    document.getElementById("gtName").innerText = safeText(data.gamertag, gamertag);
    document.getElementById("gtGamerscore").innerText = fmtGamerscore(profile.gamerscore);
    document.getElementById("gtPresence").innerText = presenceDisplay(profile);

    document.getElementById("gtFirstSeen").innerText = fmtDateTime(recap.firstSeen);
    document.getElementById("gtLastSeen").innerText = fmtDateTime(recap.lastSeen);
    document.getElementById("gtChecks").innerText = safeText(recap.lookupCount, "0");

    document.getElementById("gtSource").innerText = `source: ${safeText(data.source, "kv-only")}`;

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

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("generateBtn").addEventListener("click", generateCard);

  document.getElementById("gamertagInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") generateCard();
  });

  const params = new URLSearchParams(window.location.search);
  const gamertag = params.get("gamertag");
  if (gamertag) {
    document.getElementById("gamertagInput").value = gamertag;
    generateCard();
  }
});
