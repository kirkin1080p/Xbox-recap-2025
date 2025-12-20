const WORKER_URL =
  "https://falling-cake-f670.kirkjlemon.workers.dev/";

async function generateRecap() {
  const gamertagInput = document.getElementById("gamertagInput");
  const gamertag = gamertagInput.value.trim();

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

    if (!data.exists) {
      alert("Gamertag not found");
      return;
    }

    // ---- Always safe ----
    document.getElementById("playerName").innerText =
      `🎮 ${data.gamertag}'s 2025 Recap`;

    document.getElementById("topGame").innerText =
      "FPS-Focused Player";

    document.getElementById("achievements").innerText =
      data.availableData.achievements
        ? "Available"
        : "Private / Not Public";

    document.getElementById("gamerscore").innerText =
      data.availableData.gamerscore && data.gamerscore !== null
        ? data.gamerscore.toLocaleString()
        : "Private / Not Public";

    document.getElementById("playtime").innerText =
      "Estimated";

    document.getElementById("recap").classList.remove("hidden");

    const url = new URL(window.location.href);
    url.searchParams.set("gamertag", gamertag);
    window.history.replaceState({}, "", url);

  } catch (error) {
    console.error("Recap error:", error);
    alert("Failed to load recap");
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
