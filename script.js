// =======================
// Xbox Recap - script.js
// =======================

// === CONFIG ===
const SIGNED_IN_KEY = "xr_signedInGamertag";

const WORKER_BASE = "https://falling-cake-f670.kirkjlemon.workers.dev";
const PUBLIC_KEY = "4f6e9e47-98c9-0501-ae8a-4c078183a6dc";

// === DOM HELPERS (NULL SAFE) ===
function el(id) { return document.getElementById(id); }

function setText(node, value, fallback = "—") {
  if (!node) return;
  node.textContent =
    value === null || value === undefined || value === "" ? fallback : String(value);
}

function show(node) { if (node) node.classList.remove("hidden"); }
function hide(node) { if (node) node.classList.add("hidden"); }

function addClass(node, ...cls) { if (node) node.classList.add(...cls); }
function removeClass(node, ...cls) { if (node) node.classList.remove(...cls); }

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Minimal, safe inline formatting for journal text.
// - Escapes all HTML first (prevents injection)
// - Then converts **bold** to <strong>bold</strong>
// This intentionally does NOT implement full markdown.
function formatJournalText(raw) {
  const safe = esc(raw ?? "");
  // Support **bold** spanning across words/newlines (lazy match).
  return safe.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
}

// === DOM ===
const gamertagInput = el("gamertagInput");
const generateBtn = el("generateBtn");
const statusEl = el("status");

const gamerCardWrap = el("gamerCardWrap");
const gamerCard = el("gamerCard");

const profilePic = el("profilePic");
const profilePicFallback = el("profilePicFallback");

const gtName = el("gtName");
const presence = el("presence");

const gamerscore = el("gamerscore");
const gamerscoreDelta = el("gamerscoreDelta");
const daysPlayed = el("daysPlayed");
const playRange = el("playRange");
const favGame = el("favGame");
const favGameSessions = el("favGameSessions");

const currentStreak = el("currentStreak");
const longestStreak = el("longestStreak");
const longestBreak = el("longestBreak");
const uniqueGames = el("uniqueGames");
const oneHit = el("oneHit");

const peakDay = el("peakDay");
const peakDaySub = el("peakDaySub");
const activeWeekday = el("activeWeekday");
const activeWeekdaySub = el("activeWeekdaySub");
const activeMonth = el("activeMonth");
const activeMonthSub = el("activeMonthSub");

const trackingInfo = el("trackingInfo");
const dataQualityPill = el("dataQualityPill");
const lastUpdatedPill = el("lastUpdatedPill");

const signinPrompt = el("signinPrompt");
const signinBtn = el("signinBtn");
const badgeBox = el("badgeBox"); // ✅ NEW: Badges & Milestones placeholder panel
const openEmbedLink = el("openEmbedLink");

const exportBtn = el("exportBtn");
const copyLinkBtn = el("copyLinkBtn");

const achievementBlock = el("achievementBlock");
const achievementIcon = el("achievementIcon");
const achievementIconFallback = el("achievementIconFallback");
const achievementName = el("achievementName");
const achievementPercent = el("achievementPercent");
const achievementContext = el("achievementContext");
const achievementList = el("achievementList");
const achievementListTitle = el("achievementListTitle");
const achievementListSub = el("achievementListSub");

const blogEntries = el("blogEntries");

const donateTotal = el("donateTotal");
const donateSupporters = el("donateSupporters");

const liveLink = el("liveLink");
const bbcode = el("bbcode");
const copyLiveLinkBtn = el("copyLiveLinkBtn");
const copyBbBtn = el("copyBbBtn");

// User area
const userArea = el("userArea");
const userAvatar = el("userAvatar");
const userAvatarFallback = el("userAvatarFallback");
const userName = el("userName");
const userBadge = el("userBadge");
const signoutBtn = el("signoutBtn");

// === STATUS ===
function setStatus(msg) {
  if (!statusEl) return;
  show(statusEl);
  statusEl.textContent = msg;
}
function clearStatus() {
  if (!statusEl) return;
  hide(statusEl);
  statusEl.textContent = "";
}

// === PRE-FLIGHT (prevents “Cannot set properties of null”) ===
const REQUIRED_IDS = [
  "gamerCardWrap", "gamerCard",
  "profilePic", "profilePicFallback",
  "gtName", "presence",
  "gamerscore", "gamerscoreDelta", "daysPlayed", "playRange",
  "favGame", "favGameSessions",
  "currentStreak", "longestStreak", "longestBreak", "uniqueGames", "oneHit",
  "peakDay", "peakDaySub",
  "activeWeekday", "activeWeekdaySub",
  "activeMonth", "activeMonthSub",
  "trackingInfo", "dataQualityPill", "lastUpdatedPill",
  "blogEntries",
  "donateTotal", "donateSupporters",
  "liveLink", "bbcode",
  "exportBtn", "copyLinkBtn", "copyLiveLinkBtn", "copyBbBtn",
  // user area ids (safe to require; your UI expects them)
  "userArea", "userAvatar", "userAvatarFallback", "userName", "userBadge", "signoutBtn",
  "signinPrompt", "signinBtn",
  // ✅ NEW
  "badgeBox"
];

function preflightReportMissingIds() {
  const missing = REQUIRED_IDS.filter((id) => !document.getElementById(id));
  if (!missing.length) return true;

  setStatus(
    `Your index.html is missing ${missing.length} element(s) that the script expects:\n` +
    missing.map((m) => `• #${m}`).join("\n")
  );
  return false;
}

// === GENERAL HELPERS ===
function setEmbedModeIfNeeded() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("embed") === "1") document.body.classList.add("embed");
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied ✅");
    setTimeout(clearStatus, 1200);
  } catch {
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

function getOpenXblSigninUrl() {
  return `https://xbl.io/app/auth/${PUBLIC_KEY}`;
}

function showCard() { show(gamerCardWrap); }
function hideCard() { hide(gamerCardWrap); }

// === IMAGE PROXY (fixes flaky Xbox image loads) ===
function proxifyImage(url) {
  if (!url) return null;
  return `${WORKER_BASE}/img?url=${encodeURIComponent(url)}`;
}

// ✅ Sanitize legacy Xbox gamerpic URLs (helps some 360-era pics)
function sanitizeXboxPicUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Known offender on some legacy endpoints
    u.searchParams.delete("mode");
    return u.toString();
  } catch {
    return url;
  }
}

// === AVATAR FALLBACK ===
function firstLetter(name) {
  const s = String(name || "").trim();
  return s ? s[0].toUpperCase() : "?";
}

function setAvatar({ imgEl, fallbackEl, url, labelText }) {
  if (!imgEl || !fallbackEl) return;

  fallbackEl.textContent = firstLetter(labelText);

  imgEl.onerror = null;
  imgEl.onload = null;

  if (!url) {
    imgEl.removeAttribute("src");
    imgEl.style.display = "none";
    fallbackEl.style.display = "grid";
    return;
  }

  fallbackEl.style.display = "none";
  imgEl.style.display = "block";
  imgEl.alt = `${labelText || "Player"} gamerpic`;

  imgEl.onload = () => {
    fallbackEl.style.display = "none";
    imgEl.style.display = "block";
  };

  imgEl.onerror = () => {
    imgEl.removeAttribute("src");
    imgEl.style.display = "none";
    fallbackEl.style.display = "grid";
  };

  const cleanUrl = sanitizeXboxPicUrl(url);
  const prox = proxifyImage(cleanUrl);
  imgEl.src = prox
    ? `${prox}&_=${Date.now()}`
    : `${cleanUrl}${cleanUrl.includes("?") ? "&" : "?"}_=${Date.now()}`;
}

// === SIGNED-IN STORAGE (authoritative) ===
function getSignedInGamertag() {
  try {
    const gt = localStorage.getItem(SIGNED_IN_KEY);
    return gt ? String(gt).trim() : null;
  } catch {
    return null;
  }
}

function setSignedInGamertag(gt) {
  try {
    if (!gt) localStorage.removeItem(SIGNED_IN_KEY);
    else localStorage.setItem(SIGNED_IN_KEY, String(gt).trim());
  } catch {}
}

// === USER AREA STATES ===
function setSignedInUiState({ gamertag, avatarUrl, qualityLabel }) {
  show(userArea);

  // ✅ When signed in: hide connect prompt, show badges panel
  hide(signinPrompt);
  show(badgeBox);

  setText(userName, gamertag, "—");

  setAvatar({
    imgEl: userAvatar,
    fallbackEl: userAvatarFallback,
    url: avatarUrl,
    labelText: gamertag,
  });

  if (userBadge) {
    removeClass(userBadge, "good", "limited", "off");
    userBadge.textContent = qualityLabel || "Connected";
    addClass(
      userBadge,
      qualityLabel === "Full" ? "good" : qualityLabel === "Limited" ? "limited" : "off"
    );
  }

  show(signoutBtn);
  if (signoutBtn) signoutBtn.disabled = false;
}

function setSignedOutUiState() {
  show(userArea);

  setAvatar({
    imgEl: userAvatar,
    fallbackEl: userAvatarFallback,
    url: null,
    labelText: "?",
  });

  setText(userName, "Not connected", "Not connected");

  if (userBadge) {
    removeClass(userBadge, "good", "limited", "off");
    addClass(userBadge, "off");
    userBadge.textContent = "Not connected";
  }

  hide(signoutBtn);
  if (signoutBtn) signoutBtn.disabled = true;

  // ✅ When signed out: show connect prompt, hide badges panel
  show(signinPrompt);
  hide(badgeBox);
}

// Render user area ONLY from signed-in identity (never from generated gamertag)
async function renderUserAreaFromSignedIn() {
  const signedInGt = getSignedInGamertag();

  if (!signedInGt) {
    setSignedOutUiState();
    return;
  }

  // Immediate UI (fast) while we fetch better details
  setSignedInUiState({
    gamertag: signedInGt,
    avatarUrl: null,
    qualityLabel: "Connected",
  });

  // Fetch profile/quality for signed-in gamertag ONLY
  try {
    const data = await fetchRecap(signedInGt);
    const profile = data?.profile || null;
    const recap = data?.recap || null;
    const linked = !!data?.linked;

    const quality =
      recap?.dataQuality === "good" ? "Full" :
      recap?.dataQuality === "limited" ? "Limited" :
      linked ? "Connected" : "Tracking";

    setSignedInUiState({
      gamertag: signedInGt,
      avatarUrl: profile?.displayPicRaw || null,
      qualityLabel: quality,
    });
  } catch {
    // Keep the basic signed-in state even if fetch fails
    setSignedInUiState({
      gamertag: signedInGt,
      avatarUrl: null,
      qualityLabel: "Connected",
    });
  }
}

// === NETWORK (NO-CACHE) ===
async function fetchJsonOrText(url, init) {
  const res = await fetch(url, { cache: "no-store", ...init });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* not json */ }
  return { res, text, data };
}

function withNoCache(url) {
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}_=${Date.now()}`;
}

async function fetchRecap(gamertag) {
  const url = withNoCache(`${WORKER_BASE}/?gamertag=${encodeURIComponent(gamertag)}`);
  const { res, text, data } = await fetchJsonOrText(url);

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : (text || `HTTP ${res.status}`);
    throw new Error(`Worker recap failed (${res.status}): ${msg}`);
  }
  return data;
}

async function fetchBlog(gamertag) {
  const url = withNoCache(`${WORKER_BASE}/blog?gamertag=${encodeURIComponent(gamertag)}&limit=7`);
  const { res, data } = await fetchJsonOrText(url);
  if (!res.ok) return null;
  return data;
}

async function fetchDonateStats() {
  const url = withNoCache(`${WORKER_BASE}/donate-stats`);
  const { res, data } = await fetchJsonOrText(url);
  if (!res.ok) return null;
  return data;
}

async function signOutWorker(gamertag) {
  const { res, data, text } = await fetchJsonOrText(withNoCache(`${WORKER_BASE}/signout`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gamertag }),
  });

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : (text || `HTTP ${res.status}`);
    throw new Error(`Sign out failed (${res.status}): ${msg}`);
  }
  return data;
}

// === TWEET BUILDER (per-entry) ===
function buildTweet({ gamertag, entry, shareUrl }) {
  const date = entry?.date ? entry.date : "";
  const rawText = entry?.text ? entry.text : "My console refused to write today. Suspicious.";

  const base =
`Xbox Journal ${date ? "• " + date : ""}

${rawText}

Generate yours: ${shareUrl}

#Xbox #Gaming`;

  let t = base.trim();
  if (t.length <= 280) return t;

  // Trim body first
  const head = `Xbox Journal ${date ? "• " + date : ""}\n\n`;
  const tail = `\n\nGenerate yours: ${shareUrl}\n\n#Xbox #Gaming`;
  const maxBody = 280 - head.length - tail.length;

  const body = rawText.length > maxBody
    ? rawText.slice(0, Math.max(0, maxBody - 1)).trimEnd() + "…"
    : rawText;

  t = (head + body + tail).trim();
  return t.slice(0, 280);
}

// === RENDERERS ===
function setPillQuality(recap, linked) {
  if (!dataQualityPill) return;
  const q = recap?.dataQuality || (linked ? "good" : "tracking-only");
  let label = "Tracking";
  if (q === "good") label = "Full";
  if (q === "limited") label = "Limited";
  if (q === "tracking-only") label = "Tracking";
  dataQualityPill.textContent = label;
}

function setLastUpdated(recap) {
  if (!lastUpdatedPill) return;
  const observed = recap?.lastObservedAt || null;
  const refreshed = recap?.lastSeen || null;

  if (observed) lastUpdatedPill.textContent = `Last observed ${fmtDateTime(observed)}`;
  else lastUpdatedPill.textContent = `Last refreshed ${fmtDateTime(refreshed)}`;
}

function renderAchievement(recap) {
  if (!achievementBlock) return;

  const rarestEver = recap?.achievements?.rarestEver;
  const fallback = recap?.achievements;

  const name = rarestEver?.name || fallback?.rarestName || null;
  const pct  = rarestEver?.percent ?? fallback?.rarestPercent ?? null;
  const icon = rarestEver?.icon || fallback?.rarestIcon || null;
  const title = rarestEver?.titleName || fallback?.lastTitleName || null;

  if (!name && !icon && pct == null) {
    hide(achievementBlock);
    return;
  }

  show(achievementBlock);

  // Hero (rarest)
  if (achievementIcon) {
    if (icon) {
      const cleanIcon = sanitizeXboxPicUrl(icon);
      const prox = proxifyImage(cleanIcon);
      achievementIcon.src = prox ? `${prox}&_=${Date.now()}` : cleanIcon;
      show(achievementIcon);
      if (achievementIconFallback) hide(achievementIconFallback);
    } else {
      hide(achievementIcon);
      if (achievementIconFallback) show(achievementIconFallback);
    }
  }

  setText(achievementName, name || "Rarest achievement");
  setText(achievementPercent, pct != null ? `${pct}% unlocked` : "Rarity unknown");
  setText(achievementContext, title ? `From ${title}` : "From recent play");

  // Secondary list (5 items): prefer "recent unlocked" if provided, else show 5 rarest.
  if (!achievementList) return;

  const recent = Array.isArray(recap?.achievements?.recentUnlocked) ? recap.achievements.recentUnlocked : [];
  const rare5 = Array.isArray(recap?.achievements?.rarestTop) ? recap.achievements.rarestTop : [];

  const list = (recent && recent.length) ? recent.slice(0, 5) : rare5.slice(0, 5);
  const mode = (recent && recent.length) ? "recent" : "rarest";

  if (!list.length) {
    achievementList.innerHTML = `<div class="muted" style="font-size:12px;">No extra achievement data yet — connect Xbox or generate again later.</div>`;
    setText(achievementListTitle, "Also rare…");
    setText(achievementListSub, "");
    return;
  }

  setText(achievementListTitle, mode === "recent" ? "Last 5 unlocked" : "5 rarest unlocked");
  setText(achievementListSub, mode === "recent" ? "Newest trophies detected" : "Sorted by lowest %" );

  achievementList.innerHTML = list.map((a) => {
    const nm = esc(a?.name || "—");
    const p = (a?.percent != null) ? `${Number(a.percent).toFixed(2).replace(/\.00$/, "")}%` : "—";
    const sub = mode === "recent" ? (a?.unlockedAt ? `Unlocked ${fmtDateTime(a.unlockedAt)}` : (a?.titleName ? `From ${a.titleName}` : "")) : (a?.titleName ? `From ${a.titleName}` : "");
    const iconUrl = a?.icon ? proxifyImage(sanitizeXboxPicUrl(a.icon)) : null;
    const iconHtml = iconUrl
      ? `<img class="achItemIcon" alt="" crossorigin="anonymous" referrerpolicy="no-referrer" src="${esc(iconUrl)}&_=${Date.now()}" />`
      : `<div class="achItemIcon" style="display:grid;place-items:center;">🏆</div>`;

    return `
      <div class="achItem">
        ${iconHtml}
        <div>
          <div class="achItemName">${nm}</div>
          <div class="achItemSub">${esc(sub || "")}</div>
        </div>
        <div class="achItemPct">${esc(p)}</div>
      </div>
    `;
  }).join("");
}

function renderDonate(ds) {
  if (!ds || !donateTotal || !donateSupporters) return;

  const cur = ds.currency || "GBP";
  const symbol = cur === "GBP" ? "£" : cur === "USD" ? "$" : cur === "EUR" ? "€" : "";
  donateTotal.textContent = `${symbol}${Number(ds.totalRaised || 0).toFixed(0)}`;
  donateSupporters.textContent = String(ds.supporters || 0);
}

function renderBlog(blog, recap, gamertag, shareUrl) {
  if (!blogEntries) return;

  blogEntries.innerHTML = "";

  const entries = blog?.entries || [];
  if (!entries.length) {
    blogEntries.innerHTML =
      `<div class="journalEntry"><div class="journalBody muted">No journal entries yet — generate again tomorrow and it’ll start writing daily.</div></div>`;
    return;
  }

  // Render latest entries with per-entry Tweet button
  for (const e of entries.slice(0, 4)) {
    const date = e?.date ? esc(e.date) : "—";
    const text = e?.text ? formatJournalText(e.text) : "—";
    const chip = e?.type ? esc(e.type) : "Journal";

    const tweetText = buildTweet({ gamertag, entry: e, shareUrl });
    const encoded = encodeURIComponent(tweetText);

    const html = `
      <div class="journalEntry">
        <div class="journalMeta">
          <span class="journalDate">${date}</span>
          <span class="journalChip">${chip}</span>
        </div>
        <div class="journalBody">${text}</div>

        <div class="journalActions">
          <button class="btn ghost small copyTweetBtn" type="button" data-tweet="${encoded}">Copy</button>
          <a class="btn small tweetEntryLink" href="https://twitter.com/intent/tweet?text=${encoded}" target="_blank" rel="noopener noreferrer">Tweet</a>
        </div>
      </div>
    `;
    blogEntries.insertAdjacentHTML("beforeend", html);
  }

  if (recap?.journal?.policy) {
    blogEntries.insertAdjacentHTML(
      "beforeend",
      `<div class="journalEntry"><div class="journalBody muted">${formatJournalText(recap.journal.policy)}</div></div>`
    );
  }
}

function renderRecap(data) {
  const { gamertag, profile, recap, linked } = data;

  setText(gtName, gamertag);

  const lastPlayedName =
    recap?.lastPlayedGame ||
    recap?.titleHistory?.lastTitleName ||
    recap?.lastObservedGame ||
    null;

  const lastPlayedAt =
    recap?.lastPlayedAt ||
    recap?.titleHistory?.lastTimePlayed ||
    null;

  const fallbackPresence =
    lastPlayedName
      ? `Last played: ${lastPlayedName} • ${fmtDateTime(lastPlayedAt)}`
      : "No recent activity observed yet.";

  setText(presence, profile?.presenceText || fallbackPresence);

  // ✅ PFP: proxy + fallback
  setAvatar({
    imgEl: profilePic,
    fallbackEl: profilePicFallback,
    url: profile?.displayPicRaw || null,
    labelText: gamertag,
  });

  setText(gamerscore, recap?.gamerscoreCurrent ?? profile?.gamerscore ?? "—");

  if (gamerscoreDelta) {
    gamerscoreDelta.textContent =
      recap?.gamerscoreDelta != null
        ? `+${recap.gamerscoreDelta} since tracking`
        : (linked ? "Delta unknown" : "Connect Xbox for delta");
  }

  setText(daysPlayed, recap?.daysPlayedCount ?? "—");

  const range =
    recap?.firstPlayDay && recap?.lastPlayDay
      ? `${recap.firstPlayDay} → ${recap.lastPlayDay}`
      : recap?.firstSeen
      ? `Tracking since ${fmtDateTime(recap.firstSeen)}`
      : "—";
  setText(playRange, range);

  setText(favGame, recap?.favouriteGame ?? "—");
  setText(
    favGameSessions,
    recap?.favouriteGameSessions ? `${recap.favouriteGameSessions} sessions` : "—"
  );

  setText(currentStreak, recap?.currentStreak ?? "—");
  setText(longestStreak, recap?.longestStreak ? `Best: ${recap.longestStreak} days` : "—");
  setText(longestBreak, recap?.longestBreakDays ?? 0);

  setText(uniqueGames, recap?.uniqueGamesObserved ?? "—");

  const oneHitEff = recap?.oneHitWondersEffective ?? recap?.oneHitWondersCount ?? 0;
  const mature = recap?.oneHitWondersIsMature ?? false;
  setText(oneHit, mature ? `${oneHitEff} one-hit wonders` : "—");

  setText(peakDay, recap?.peakDay?.date ?? "—");
  setText(
    peakDaySub,
    recap?.peakDay?.uniqueGames != null ? `${recap.peakDay.uniqueGames} unique games` : "—"
  );

  setText(activeWeekday, recap?.mostActiveWeekdayName ?? "—");
  setText(
    activeWeekdaySub,
    recap?.mostActiveWeekdayDays != null ? `${recap.mostActiveWeekdayDays} days` : "—"
  );

  setText(activeMonth, recap?.mostActiveMonthName ?? "—");
  setText(
    activeMonthSub,
    recap?.mostActiveMonthDays != null ? `${recap.mostActiveMonthDays} days` : "—"
  );

  if (trackingInfo) {
    const observedLine = recap?.lastObservedAt
      ? `Observed play: ${fmtDateTime(recap.lastObservedAt)}`
      : `No play observed yet`;
    trackingInfo.textContent =
      `First seen: ${fmtDateTime(recap?.firstSeen)} • ${observedLine} • Lookups: ${recap?.lookupCount ?? 0}`;
  }

  setPillQuality(recap, linked);
  setLastUpdated(recap);

  const urls = buildShareUrls(gamertag);
  if (liveLink) liveLink.value = urls.embed;
  if (bbcode) bbcode.value = `[url=${urls.embed}]Xbox Recap Card[/url]`;
  if (openEmbedLink) openEmbedLink.href = urls.embed;

  renderAchievement(recap);
  showCard();

  // IMPORTANT:
  // Do NOT touch the user area here.
  // User area is authoritative from localStorage SIGNED_IN_KEY only.

  return recap;
}

// === EXPORT PNG ===
async function exportCardAsPng() {
  clearStatus();

  if (!window.html2canvas) {
    setStatus("PNG export library failed to load.");
    return;
  }
  if (!gamerCard) {
    setStatus("Card element missing (gamerCard).");
    return;
  }

  setStatus("Rendering PNG…");

  // Wait for images to load/fail
  const imgs = gamerCard.querySelectorAll("img");
  await Promise.all(
    [...imgs].map((img) => {
      if (!img.src) return Promise.resolve();
      if (img.complete) return Promise.resolve();
      return new Promise((res) => {
        img.onload = () => res();
        img.onerror = () => res();
      });
    })
  );

  const canvas = await window.html2canvas(gamerCard, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });

  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `xbox-recap-${(gtName?.textContent || "player").replace(/\s+/g, "-")}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setStatus("PNG exported ✅");
  setTimeout(clearStatus, 1600);
}

// === MAIN FLOW ===
async function run(gamertag) {
  try {
    clearStatus();
    hideCard();

    if (!preflightReportMissingIds()) return;

    const gt = (gamertag || "").trim();
    if (!gt) { setStatus("Enter a gamertag first."); return; }

    // Keep URL in sync
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("gamertag", gt);
      window.history.replaceState({}, "", u);
    } catch {}

    setStatus("Loading recap…");

    const [recapData, blogData, donateData] = await Promise.all([
      fetchRecap(gt),
      fetchBlog(gt),
      fetchDonateStats(),
    ]);

    const recap = renderRecap(recapData);

    const urls = buildShareUrls(gt);
    renderBlog(blogData, recap, gt, urls.normal);

    renderDonate(donateData);

    clearStatus();
  } catch (err) {
    console.error(err);
    setStatus(`JS crashed: ${String(err?.message || err)}\nOpen DevTools Console for the stack trace.`);
  }
}

// === EVENTS ===
if (generateBtn) generateBtn.addEventListener("click", () => run(gamertagInput?.value || ""));
if (gamertagInput) {
  gamertagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run(gamertagInput.value);
  });
}
if (exportBtn) exportBtn.addEventListener("click", exportCardAsPng);

if (copyLinkBtn) {
  copyLinkBtn.addEventListener("click", () => {
    const url = new URL(window.location.href);
    copyToClipboard(url.toString());
  });
}
if (copyLiveLinkBtn && liveLink) copyLiveLinkBtn.addEventListener("click", () => copyToClipboard(liveLink.value || ""));
if (copyBbBtn && bbcode) copyBbBtn.addEventListener("click", () => copyToClipboard(bbcode.value || ""));

// Copy tweet per entry (delegated)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".copyTweetBtn");
  if (!btn) return;

  const t = btn.getAttribute("data-tweet");
  if (!t) return;

  copyToClipboard(decodeURIComponent(t));
});

// ✅ CONNECT
if (signinBtn) {
  signinBtn.href = getOpenXblSigninUrl();
  signinBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = getOpenXblSigninUrl();
  });
}

// Sign out (SIGNED-IN USER ONLY)
if (signoutBtn) {
  signoutBtn.addEventListener("click", async () => {
    const signedInGt = getSignedInGamertag();

    if (!signedInGt) {
      setStatus("Not signed in.");
      setTimeout(clearStatus, 1400);
      setSignedOutUiState();
      return;
    }

    setStatus("Signing out…");

    try {
      // Tell worker to forget auth for this signed-in identity
      await signOutWorker(signedInGt);

      // Clear local identity
      setSignedInGamertag(null);

      // Reset UI state
      setSignedOutUiState();

      setStatus("Signed out ✅");
      setTimeout(clearStatus, 1400);
    } catch (err) {
      console.error(err);
      setStatus(String(err?.message || "Sign out failed."));
    }
  });
}

// === INIT ===
(function init() {
  setEmbedModeIfNeeded();

  // User area should ONLY ever reflect localStorage SIGNED_IN_KEY
  // and should NOT be changed by generating recaps.
  if (!preflightReportMissingIds()) return;
  renderUserAreaFromSignedIn();

  const params = new URLSearchParams(window.location.search);
  const gt = params.get("gamertag");

  if (gt && gamertagInput) {
    gamertagInput.value = gt;
    run(gt);
  } else {
    fetchDonateStats().then(renderDonate).catch(() => {});
    if (openEmbedLink) {
      openEmbedLink.href = `${window.location.origin}${window.location.pathname}?embed=1`;
    }
  }
})();
