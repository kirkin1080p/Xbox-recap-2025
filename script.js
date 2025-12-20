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

function gameplayDisplay(gameplay2025) {
  if (!gameplay2025) return "Locked — add your stats to unlock";

  const games = Array.isArray(gameplay2025.topGames) && gameplay2025.topGames.length
    ? `Top games: ${gameplay2025.topGames.join(", ")}`
    : "Top games: —";

  const hours = (typeof gameplay2025.playtimeHours === "number")
    ? `Playtime: ${gameplay2025.playtimeHours}h`
    : "Playtime: —";

  const ach = gameplay2025.rarestAchievement
    ? `Rarest: "${gameplay2025.rarestAchievement}"${gameplay2025.rarestAchievementGame ? ` (${gameplay2025.rarestAchievementGame})` : ""}`
    : "Rarest: —";

  return `${games} • ${hours} • ${ach}`;
}

let lastLoadedGamertag = "";

async function loadRecap(gamertag) {
  const card = document.getElementById("gamerCard");
  card.classList.add("hidden");

  const res = await fetch(`${WORKER_URL}?gamertag=${encodeURIComponent(gamertag)}`);
  if (!res.ok) throw new Error(`Worker error ${res.status}`);

  const data = await res.json();
  if (!data || data.exists === false) throw new Error("Gamertag not found");

  lastLoadedGamertag = data.gamertag || gamertag;

  const profile = data.profile || {};
  const recap = data.recap || {};
  const gameplay2025 = data.gameplay2025 || null;

  // Avatar
  const picEl = document.getElementById("gamerPic");
  const pic = profile.displayPicRaw ? String(profile.displayPicRaw) : "";
  if (pic) {
    picEl.src = pic;
    picEl.style.visibility = "visible";
  } else {
    picEl.removeAttribute("src");
    picEl.style.visibility = "hidden";
  }

  // Fill fields
  document.getElementById("gtName").innerText = safeText(data.gamertag, gamertag);
  document.getElementById("gtGamerscore").innerText = fmtGamerscore(profile.gamerscore);
  document.getElementById("gtPresence").innerText = presenceDisplay(profile);

  document.getElementById("gtTracking").innerText =
    `First seen: ${fmtDateTime(recap.firstSeen)} • Last seen: ${fmtDateTime(recap.lastSeen)} • Checks: ${safeText(recap.lookupCount, "0")}`;

  document.getElementById("gtGameplay").innerText = gameplayDisplay(gameplay2025);

  document.getElementById("gtSource").innerText = `source: ${safeText(data.source, "—")}`;

  // If gameplay is present, hide opt-in button (optional)
  document.getElementById("optinBtn").style.display = gameplay2025 ? "none" : "inline-block";

  card.classList.remove("hidden");

  // Shareable URL
  const url = new URL(window.location.href);
  url.searchParams.set("gamertag", gamertag);
  window.history.replaceState({}, "", url);
}

async function generateRecap() {
  const gamertag = document.getElementById("gamertagInput").value.trim();
  if (!gamertag) return alert("Please enter a Gamertag");

  try {
    await loadRecap(gamertag);
  } catch (err) {
    console.error(err);
    alert("Failed to load Xbox Recap");
  }
}

// Modal controls
function openModal() {
  document.getElementById("optinModal").classList.remove("hidden");
  document.getElementById("optinStatus").innerText = "";
}

function closeModal() {
  document.getElementById("optinModal").classList.add("hidden");
}

async function submitOptin() {
  const statusEl = document.getElementById("optinStatus");

  const gamertag = lastLoadedGamertag || document.getElementById("gamertagInput").value.trim();
  if (!gamertag) {
    statusEl.innerText = "Generate a recap first so we know which gamertag to save.";
    return;
  }

  const payload = {
    gamertag,
    topGames: document.getElementById("optTopGames").value,
    playtimeHours: document.getElementById("optPlaytime").value,
    rareAchievement: document.getElementById("optRareAch").value,
    rareAchievementGame: document.getElementById("optRareGame").value,
    consent: document.getElementById("optConsent").checked
  };

  try {
    statusEl.innerText = "Saving…";

    const res = await fetch(`${WORKER_URL}/optin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      statusEl.innerText = data?.error ? `Error: ${data.error}` : "Error saving opt-in.";
      return;
    }

    statusEl.innerText = "Saved! Reloading recap…";
    closeModal();

    // Reload recap to display gameplay data
    await loadRecap(gamertag);

  } catch (err) {
    console.error(err);
    statusEl.innerText = "Failed to save. Try again.";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("generateBtn").addEventListener("click", generateRecap);
  document.getElementById("gamertagInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") generateRecap();
  });

  document.getElementById("optinBtn").addEventListener("click", openModal);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("submitOptinBtn").addEventListener("click", submitOptin);

  // Click outside modal card to close
  document.getElementById("optinModal").addEventListener("click", (e) => {
    if (e.target.id === "optinModal") closeModal();
  });

  // Auto-load from URL
  const params = new URLSearchParams(window.location.search);
  const gamertag = params.get("gamertag");
  if (gamertag) {
    document.getElementById("gamertagInput").value = gamertag;
    generateRecap();
  }
});
