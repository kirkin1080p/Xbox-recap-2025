// === CONFIG ===
const WORKER_BASE = "https://falling-cake-f670.kirkjlemon.workers.dev";
const PUBLIC_KEY = "4f6e9e47-98c9-0501-ae8a-4c078183a6dc";

// === DOM ===
const gamertagInput = document.getElementById("gamertagInput");
const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");

const gamerCardWrap = document.getElementById("gamerCardWrap");
const gamerCard = document.getElementById("gamerCard");

const profilePic = document.getElementById("profilePic");
const gtName = document.getElementById("gtName");
const presence = document.getElementById("presence");

const gamerscore = document.getElementById("gamerscore");
const gamerscoreDelta = document.getElementById("gamerscoreDelta");
const daysPlayed = document.getElementById("daysPlayed");
const playRange = document.getElementById("playRange");
const favGame = document.getElementById("favGame");
const favGameSessions = document.getElementById("favGameSessions");

const currentStreak = document.getElementById("currentStreak");
const longestStreak = document.getElementById("longestStreak");
const longestBreak = document.getElementById("longestBreak");
const uniqueGames = document.getElementById("uniqueGames");
const oneHit = document.getElementById("oneHit");
const peakDay = document.getElementById("peakDay");
const peakDaySub = document.getElementById("peakDaySub");
const activeWeekday = document.getElementById("activeWeekday");
const activeWeekdaySub = document.getElementById("activeWeekdaySub");
const activeMonth = document.getElementById("activeMonth");
const activeMonthSub = document.getElementById("activeMonthSub");

const trackingInfo = document.getElementById("trackingInfo");
const dataQualityPill = document.getElementById("dataQualityPill");
const lastUpdatedPill = document.getElementById("lastUpdatedPill");

const signinBtn = document.getElementById("signinBtn");
const openEmbedLink = document.getElementById("openEmbedLink");

const exportBtn = document.getElementById("exportBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");

const achievementBlock = document.getElementById("achievementBlock");
const achievementIcon = document.getElementById("achievementIcon");
const achievementName = document.getElementById("achievementName");
const achievementPercent = document.getElementById("achievementPercent");
const achievementContext = document.getElementById("achievementContext");

const blogEntries = document.getElementById("blogEntries");

const donateTotal = document.getElementById("donateTotal");
const donateSupporters = document.getElementById("donateSupporters");

const liveLink = document.getElementById("liveLink");
const bbcode = document.getElementById("bbcode");
const copyLiveLinkBtn = document.getElementById("copyLiveLinkBtn");
const copyBbBtn = document.getElementById("copyBbBtn");

// === HELPERS ===
function setStatus(msg, kind = "info") {
  statusEl.classList.remove("hidden");
  statusEl.textContent = msg;
  // (Optional) in future: style based on kind
}
function clearStatus() {
  statusEl.classList.add("hidden");
  statusEl.textContent = "";
}

function setEmbedModeIfNeeded() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("embed") === "1") {
    document.body.classList.add("embed");
  }
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function safeText(el, value, fallback = "—") {
  el.textContent = (value === null || value === undefined || value === "") ? fallback : String(value);
}

function toTitleCase(s) {
  if (!s) return s;
  return String(s).replace(/\b\w/g, (m) => m.toUpperCase());
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied ✅");
    setTimeout(clearStatus, 1200);
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    setStatus("Copied ✅");
    setTimeout(clearStatus, 1200);
  }
}

function buildShareUrls(gamertag) {
  const url = new URL(window.location.href);
  url.searchParams.set("gamertag", gamertag);

  const embed = new URL(window.location.href);
  embed.searchParams.set("gamertag", gamertag);
  embed.searchParams.set("embed", "1");

  return { normal: url.toString(), embed: embed.toString() };
}

function setPillQuality(recap, linked) {
  const q = recap?.dataQuality || (linked ? "good" : "tracking-only");
  let label = "Tracking";
  if (q === "good") label = "Full";
  if (q === "limited") label = "Limited";
  if (q === "tracking-only") label = "Tracking";

  dataQualityPill.textContent = label;
}

function setLastUpdated(recap) {
  lastUpdatedPill.textContent = `Updated ${fmtDateTime(recap?.lastSeen)}`;
}

function showCard() {
  gamerCardWrap.classList.remove("hidden");
}

function hideCard() {
  gamerCardWrap.classList.add("hidden");
}

// === DATA LOADERS ===
async function fetchRecap(gamertag) {
  const url = `${WORKER_BASE}/?gamertag=${encodeURIComponent(gamertag)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Worker error ${res.status}`);
  return res.json();
}

async function fetchBlog(gamertag) {
  const url = `${WORKER_BASE}/blog?gamertag=${encodeURIComponent(gamertag)}&limit=7`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

async function fetchDonateStats() {
  const url = `${WORKER_BASE}/donate-stats`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

// === RENDER ===
function renderAchievement(recap) {
  // Prefer “rarestEver” if present
  const ae = recap?.achievements?.rarestEver?.name ? recap.achievements.rarestEver : recap?.achievements;
  const name = ae?.name || recap?.achievements?.rarestName || null;
  const pct = ae?.percent ?? recap?.achievements?.rarestPercent ?? null;
  const icon = ae?.icon || recap?.achievements?.rarestIcon || null;
  const title = ae?.titleName || recap?.achievements?.lastTitleName || null;

  if (!name && !icon && pct == null) {
    achievementBlock.classList.add("hidden");
    return;
  }

  achievementBlock.classList.remove("hidden");
  if (icon) {
    achievementIcon.src = icon;
    achievementIcon.classList.remove("hidden");
  } else {
    achievementIcon.classList.add("hidden");
  }

  safeText(achievementName, name || "Rarest achievement");
  safeText(achievementPercent, (pct != null ? `${pct}% unlocked` : "Rarity unknown"));
  safeText(achievementContext, title ? `From ${title}` : "From recent play");
}

function renderBlog(blog) {
  blogEntries.innerHTML = "";
  if (!blog?.entries?.length) {
    blogEntries.innerHTML = `<div class="blogLine muted">No journal entries yet — generate again tomorrow and it’ll start writing daily.</div>`;
    return;
  }

  for (const e of blog.entries.slice(0, 4)) {
    const div = document.createElement("div");
    div.className = "blogLine";
    div.innerHTML = e?.text ? e.text : `📓 ${e.date} — (entry missing)`;
    blogEntries.appendChild(div);
  }
}

function renderDonate(ds) {
  if (!ds) return;
  const cur = ds.currency || "GBP";
  const symbol = cur === "GBP" ? "£" : (cur === "USD" ? "$" : (cur === "EUR" ? "€" : ""));
  donateTotal.textContent = `${symbol}${Number(ds.totalRaised || 0).toFixed(0)}`;
  donateSupporters.textContent = String(ds.supporters || 0);
}

function renderRecap(data) {
  const { gamertag, profile, recap, linked } = data;

  // header
  safeText(gtName, gamertag);
  safeText(presence, profile?.presenceText || recap?.lastObservedGame ? (profile?.presenceText || `Last observed: ${recap.lastObservedGame}`) : "No recent activity observed yet.");

  // pfp
  if (profile?.displayPicRaw) {
    profilePic.src = profile.displayPicRaw;
    profilePic.alt = `${gamertag} gamerpic`;
  } else {
    profilePic.removeAttribute("src");
    profilePic.alt = "No gamerpic";
  }

  // minis
  safeText(gamerscore, (recap?.gamerscoreCurrent ?? profile?.gamerscore ?? "—"));
  if (recap?.gamerscoreDelta != null) {
    gamerscoreDelta.textContent = `+${recap.gamerscoreDelta} since tracking`;
  } else {
    gamerscoreDelta.textContent = linked ? "Delta unknown" : "Sign in for delta";
  }

  safeText(daysPlayed, recap?.daysPlayedCount ?? "—");
  const range = (recap?.firstPlayDay && recap?.lastPlayDay) ? `${recap.firstPlayDay} → ${recap.lastPlayDay}` : (recap?.firstSeen ? `Tracking since ${fmtDateTime(recap.firstSeen)}` : "—");
  safeText(playRange, range);

  safeText(favGame, recap?.favouriteGame ?? "—");
  safeText(favGameSessions, recap?.favouriteGameSessions ? `${recap.favouriteGameSessions} sessions` : "—");

  safeText(currentStreak, recap?.currentStreak ?? "—");
  safeText(longestStreak, recap?.longestStreak ? `Best: ${recap.longestStreak} days` : "—");

  safeText(longestBreak, recap?.longestBreakDays ?? 0);

  safeText(uniqueGames, recap?.uniqueGamesObserved ?? "—");
  safeText(oneHit, recap?.oneHitWondersCount != null ? `${recap.oneHitWondersCount} one-hit wonders` : "—");

  // peak day
  if (recap?.peakDay?.date) {
    peakDay.textContent = recap.peakDay.date;
    peakDaySub.textContent = `${recap.peakDay.uniqueGames} unique games`;
  } else {
    peakDay.textContent = "—";
    peakDaySub.textContent = "—";
  }

  // active weekday/month
  safeText(activeWeekday, recap?.mostActiveWeekdayName ?? "—");
  safeText(activeWeekdaySub, recap?.mostActiveWeekdayDays != null ? `${recap.mostActiveWeekdayDays} days` : "—");

  safeText(activeMonth, recap?.mostActiveMonthName ?? "—");
  safeText(activeMonthSub, recap?.mostActiveMonthDays != null ? `${recap.mostActiveMonthDays} days` : "—");

  // footer
  trackingInfo.textContent = `First seen: ${fmtDateTime(recap?.firstSeen)} • Lookups: ${recap?.lookupCount ?? 0}`;
  setPillQuality(recap, linked);
  setLastUpdated(recap);

  // sign-in link
  signinBtn.href = `https://xbl.io/app/auth/${PUBLIC_KEY}`;

  // share links
  const urls = buildShareUrls(gamertag);
  liveLink.value = urls.embed;
  bbcode.value = `[url=${urls.embed}]Xbox Recap Card[/url]`;
  openEmbedLink.href = urls.embed;

  // achievement
  renderAchievement(recap);

  showCard();
}

// === EXPORT PNG ===
async function exportCardAsPng() {
  clearStatus();
  if (!window.html2canvas) {
    setStatus("PNG export library failed to load.", "error");
    return;
  }

  setStatus("Rendering PNG…");

  // Make sure images are loaded (pfp + achievement icon)
  const imgs = gamerCard.querySelectorAll("img");
  await Promise.all([...imgs].map(img => {
    if (!img.src) return Promise.resolve();
    if (img.complete) return Promise.resolve();
    return new Promise(res => {
      img.onload = () => res();
      img.onerror = () => res();
    });
  }));

  // Render at higher scale for crisp forum signature
  const canvas = await window.html2canvas(gamerCard, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false
  });

  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `xbox-recap-${(gtName.textContent || "player").replace(/\s+/g, "-")}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setStatus("PNG exported ✅");
  setTimeout(clearStatus, 1600);
}

// === MAIN FLOW ===
async function run(gamertag) {
  clearStatus();
  hideCard();

  const gt = gamertag.trim();
  if (!gt) {
    setStatus("Enter a gamertag first.");
    return;
  }

  // Update URL for sharing
  const u = new URL(window.location.href);
  u.searchParams.set("gamertag", gt);
  // Keep embed flag if present
  window.history.replaceState({}, "", u);

  setStatus("Loading recap…");

  try {
    const [recapData, blogData, donateData] = await Promise.all([
      fetchRecap(gt),
      fetchBlog(gt),
      fetchDonateStats()
    ]);

    renderRecap(recapData);
    renderBlog(blogData);
    renderDonate(donateData);

    clearStatus();
  } catch (err) {
    console.error(err);
    setStatus("Failed to load recap. Check the worker + gamertag.");
  }
}

// === EVENTS ===
generateBtn.addEventListener("click", () => run(gamertagInput.value));

gamertagInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") run(gamertagInput.value);
});

exportBtn.addEventListener("click", exportCardAsPng);

copyLinkBtn.addEventListener("click", () => {
  const url = new URL(window.location.href);
  copyToClipboard(url.toString());
});

copyLiveLinkBtn.addEventListener("click", () => copyToClipboard(liveLink.value));
copyBbBtn.addEventListener("click", () => copyToClipboard(bbcode.value));

// === INIT ===
(function init() {
  setEmbedModeIfNeeded();

  // If gamertag in URL, auto-run
  const params = new URLSearchParams(window.location.search);
  const gt = params.get("gamertag");
  if (gt) {
    gamertagInput.value = gt;
    run(gt);
  } else {
    // Still load donate stats on landing
    fetchDonateStats().then(renderDonate).catch(() => {});
    // Also set the embed chip default
    openEmbedLink.href = `${window.location.origin}${window.location.pathname}?embed=1`;
  }
})();
