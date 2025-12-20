async function generateRecap() {
  const gamertag = document.getElementById("gamertagInput").value.trim()
  if (!gamertag) return alert("Enter a gamertag")

  const res = await fetch(
    `https://falling-cake-f670.kirkjlemon.workers.dev/?gamertag=${encodeURIComponent(gamertag)}`
  )

  const data = await res.json()

  if (!data.exists) {
    alert("Gamertag not found")
    return
  }

  document.getElementById("playerName").innerText =
    `🎮 ${gamertag}'s 2025 Recap`

  document.getElementById("topGame").innerText = "Most Played FPS"
  document.getElementById("achievements").innerText = "~320"
  document.getElementById("gamerscore").innerText = "~4,800"
  document.getElementById("playtime").innerText = "~640 hours"

  document.getElementById("recap").classList.remove("hidden")
}
