const WORKER_URL = "https://falling-cake-f670.kirkjlemon.workers.dev/";

function safeText(v, fallback = "Unknown") {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s.length ? s : fallback;
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return safeText(iso, "Unknown");
  }
}

async function generateRecap() {
  const input = document.getElementById("gamertagInput");
  const gamertag = input.value.trim();

  if (!gamertag) {
    alert("Please enter a Gamertag");
    return;
  }

  document.getElementById("recap").classList.add("hidden");

  try {
    const res = await fetch(`${WORKER_URL}?gamertag=${encodeURIComponent(gamertag)}`);
    if (!res.ok) throw new Error(`Worker error: ${res.status}`);

    const data = await res.json();
    if (!data.exists) {
      alert("Gamertag not found");
      return;
    }

    const profile = data.profile || {};
    const recap = data.recap || {};

    // Header with profile pic (if available)
    const pic = profile.displayPicRaw ? String(profile.displayPicRaw) : "";
    const headerEl = document.getElementById("playerName");

    headerEl.innerHTML = pic
      ? `🎮 <img src="${pic}" alt="Gamerpic" style="width:28px;height:28px;border-radius:50%;vertical-align:middle;margin:0 8px;"> ${data.gamertag}'s 2025 Recap`
      : `🎮 ${data.gamertag}'s 2025 Recap`;

    // Card mapping (tight + truthful):
    // "Top Game" -> last known activity (presenceText / playing)
    document.getElementById("topGame").innerText =
      safeText(profile.lastGame || profile.presenceText, "Offline / Private / Unknown");

    // "Achievements Earned" -> first seen (your stat)
    document.getElementById("achievements").innerText =
      `First seen: ${fmtDate(recap.firstSeen)}`;

    // "Gamerscore Gained" -> current gamerscore (real) + lookup count (your stat)
    const gs = safeText(profile.gamerscore, "Private / Unavailable");
    const lc = safeText(recap.lookupCount, "0");
    document.getElementById("gamerscore").innerText =
      `Gamerscore: ${gs} • Recap checks: ${lc}`;

    // "Estimated Playtime" -> last seen (your stat)
    document.getElementById("playtime").innerText =
      `Last seen: ${fmtDate(recap.lastSeen)}`;

    document.getElementById("recap").classList.remove("hidden");

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
  const params = new URLSearchParams(window.location.search);
  const gamertag = params.get("gamertag");
  if (gamertag) {
    document.getElementById("gamertagInput").value = gamertag;
    generateRecap();
  }
});
