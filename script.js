const WORKER_URL =
  "https://falling-cake-f670.kirkjlemon.workers.dev/";

async function generateRecap() {
  const gamertag = document
    .getElementById("gamertagInput")
    .value.trim();

  if (!gamertag) {
    alert("Please enter a Gamertag");
    return;
  }

  console.log("Generating recap for:", gamertag);

  document.getElementById("recap").classList.add("hidden");

  try {
    const url =
      `${WORKER_URL}?gamertag=${encodeURIComponent(gamertag)}`;

    console.log("Fetching:", url);

    const response = await fetch(url);

    console.log("Response status:", response.status);

    const data = await response.json();

    console.log("Worker data:", data);

    if (!data.exists) {
      alert("Gamertag not found");
      return;
    }

    document.getElementById("playerName").innerText =
      `🎮 ${data.gamertag}'s 2025 Recap`;

    document.getElementById("topGame").innerText =
      "FPS-Focused Player";

    document.getElementById("achievements").innerText =
      "Private / Not Public";

    document.getElementById("gamerscore").innerText =
      "Private / Not Public";

    document.getElementById("playtime").innerText =
      "Estimated";

    document.getElementById("recap").classList.remove("hidden");

    const pageUrl = new URL(window.location.href);
    pageUrl.searchParams.set("gamertag", gamertag);
    window.history.replaceState({}, "", pageUrl);

  } catch (err) {
    console.error("Recap failed:", err);
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
