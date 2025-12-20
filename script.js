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

    const data = await res.json();

    if (!data.exists) {
      alert("Gamertag not found");
      return;
    }

    const stats = data.stats;

    document.getElementById("playerName").innerText =
      `🎮 ${data.gamertag}'s 2025 Recap`;

    // ---- REAL DATA ----
    document.getElementById("topGame").innerText =
      stats.engagementLevel;

    document.getElementById("achievements").innerText =
      `${stats.daysActive} day${stats.daysActive > 1 ? "s" : ""} active`;

    document.getElementById("gamerscore").innerText =
      `${stats.lookupCount} recap check${stats.lookupCount > 1 ? "s" : ""}`;

    document.getElementById("playtime").innerText =
      stats.earlyAdopter
        ? "Early 2025 Recap user"
        : "Joined Recap later in 2025";

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
