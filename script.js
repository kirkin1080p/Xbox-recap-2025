const WORKER_URL =
  "https://falling-cake-f670.kirkjlemon.workers.dev/";

async function generateRecap() {
  const input = document.getElementById("gamertagInput");
  const gamertag = input.value.trim();

  if (!gamertag) {
    alert("Please enter a Gamertag");
    return;
  }

  document.getElementById("recap").classList.add("hidden");

  try {
    const response = await fetch(
      `${WORKER_URL}?gamertag=${encodeURIComponent(gamertag)}`
    );

    if (!response.ok) {
      throw new Error("Worker request failed");
    }

    const data = await response.json();

    if (!data.exists || !data.recap) {
      alert("Gamertag not found");
      return;
    }

    const recap = data.recap;

    // ---- Header ----
    document.getElementById("playerName").innerText =
      `🎮 ${data.gamertag}'s 2025 Recap`;

    // ---- Card 1: Recap Status (was Top Game) ----
    document.getElementById("topGame").innerText =
      recap.recapStatus;

    // ---- Card 2: Days Active (was Achievements) ----
    document.getElementById("achievements").innerText =
      `${recap.daysActive} day${recap.daysActive > 1 ? "s" : ""} active in 2025`;

    // ---- Card 3: Engagement Count (was Gamerscore) ----
    document.getElementById("gamerscore").innerText =
      `${recap.lookupCount} recap check${recap.lookupCount > 1 ? "s" : ""}`;

    // ---- Card 4: Early Adopter Status (was Playtime) ----
    document.getElementById("playtime").innerText =
      recap.earlyAdopter
        ? "Early 2025 Recap user"
        : "Joined Recap later in 2025";

    document.getElementById("recap").classList.remove("hidden");

    // ---- Shareable URL ----
    const url = new URL(window.location.href);
    url.searchParams.set("gamertag", gamertag);
    window.history.replaceState({}, "", url);

  } catch (error) {
    console.error("Failed to load recap:", error);
    alert("Failed to load Xbox Recap");
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
