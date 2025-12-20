const WORKER_URL =
  "https://falling-cake-f670.kirkjlemon.workers.dev/";

async function generateRecap() {
  const input = document.getElementById("gamertagInput");
  const gamertag = input.value.trim();

  if (!gamertag) {
    alert("Please enter a Gamertag");
    return;
  }

  // Reset UI state
  document.getElementById("recap").classList.add("hidden");

  try {
    const response = await fetch(
      `${WORKER_URL}?gamertag=${encodeURIComponent(gamertag)}`
    );

    if (!response.ok) {
      throw new Error("Gamertag lookup failed");
    }

    const data = await response.json();

    if (!data.exists) {
      alert("Gamertag not found");
      return;
    }

    // ---- Estimated Recap Data ----
    const estimatedAchievements = Math.floor(
      Math.random() * 300 + 200
    );

    const estimatedGamerscore = Math.floor(
      Math.random() * 4000 + 2000
    );

    const estimatedPlaytime =
      Math.floor(Math.random() * 500 + 300) + " hours";

    const topGames = [
      "Call of Duty",
      "Halo 6",
      "Battlefield 2042",
      "Rainbow Six Siege",
      "Warzone"
    ];

    const topGame =
      topGames[Math.floor(Math.random() * topGames.length)];

    // ---- Populate UI ----
    document.getElementById("playerName").innerText =
      `🎮 ${data.gamertag}'s 2025 Recap`;

    document.getElementById("topGame").innerText = topGame;
    document.getElementById("achievements").innerText =
      estimatedAchievements;
    document.getElementById("gamerscore").innerText =
      estimatedGamerscore;
    document.getElementById("playtime").innerText =
      estimatedPlaytime;

    document.getElementById("recap").classList.remove("hidden");

    // ---- Update URL for Sharing ----
    const url = new URL(window.location.href);
    url.searchParams.set("gamertag", gamertag);
    window.history.replaceState({}, "", url);

  } catch (error) {
    console.error("Recap error:", error);
    alert("Something went wrong. Please try again.");
  }
}

// ---- Auto-load from URL ----
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const gamertag = params.get("gamertag");

  if (gamertag) {
    document.getElementById("gamertagInput").value = gamertag;
    generateRecap();
  }
});
