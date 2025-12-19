function generateRecap() {
  const gamertag = document.getElementById("gamertagInput").value.trim();

  if (!gamertag) {
    alert("Please enter a Gamertag");
    return;
  }

  // Simulated Xbox data (placeholder)
  const fakeData = {
    topGame: "Halo Infinite",
    achievements: Math.floor(Math.random() * 500) + 100,
    gamerscore: Math.floor(Math.random() * 5000) + 1000,
    playtime: Math.floor(Math.random() * 800) + " hours"
  };

  document.getElementById("playerName").innerText =
    "🎮 " + gamertag + "'s 2025 Recap";

  document.getElementById("topGame").innerText = fakeData.topGame;
  document.getElementById("achievements").innerText = fakeData.achievements;
  document.getElementById("gamerscore").innerText = fakeData.gamerscore;
  document.getElementById("playtime").innerText = fakeData.playtime;

  document.getElementById("recap").classList.remove("hidden");

  // Update URL for sharing
  const url = new URL(window.location);
  url.searchParams.set("gamertag", gamertag);
  window.history.pushState({}, "", url);
}

// Auto-load if gamertag in URL
window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const gamertag = params.get("gamertag");
  if (gamertag) {
    document.getElementById("gamertagInput").value = gamertag;
    generateRecap();
  }
};
