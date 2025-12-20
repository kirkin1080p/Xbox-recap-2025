const WORKER_URL =
  "https://falling-cake-f670.kirkjlemon.workers.dev/";

async function generateRecap() {
  const gamertag = document.getElementById("gamertagInput").value.trim();
  if (!gamertag) {
    alert("Please enter a Gamertag");
    return;
  }

  document.getElementById("recap").classList.add("hidden");

  try {
    const res = await fetch(
      `${WORKER_URL}?gamertag=${encodeURIComponent(gamertag)}`
    );

    if (!res.ok) {
      throw new Error("Lookup failed");
    }

    const data = await res.json();

    if (!data.exists) {
      alert("Gamertag not found");
      return;
    }

    // ---- REAL DATA ----
    document.getElementById("playerName").innerText =
      `🎮 ${data.gamertag}'s 2025 Recap`;

    document.getElementById("gamerscore").innerText =
      data.gamerscore !== null
        ? data.gamerscore.toLocaleString()
        : "Unavailable";

    // ---- DERIVED (EXPLAINABLE) STATS ----
    document.getElementById("topGame").innerText =
      "Most Played FPS (Public Data)";

    document.getElementById("achievements").innerText =
      "Public profile only";

    document.getElementById("playtime").innerText =
      "Estimated from gamerscore";

    document.getElementById("recap").classList.remove("hidden");

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
