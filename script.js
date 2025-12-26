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
const achievementName = el("achievementName");
const achievementPercent = el("achievementPercent");
const achievementContext = el("achievementContext");

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

  if (achievementIcon) {
    if (icon) {
      const cleanIcon = sanitizeXboxPicUrl(icon);
      const prox = proxifyImage(cleanIcon);
      achievementIcon.src = prox ? `${prox}&_=${Date.now()}` : cleanIcon;
      show(achievementIcon);
    } else {
      hide(achievementIcon);
    }
  }

  setText(achievementName, name || "Rarest achievement");
  setText(achievementPercent, pct != null ? `${pct}% unlocked` : "Rarity unknown");
  setText(achievementContext, title ? `From ${title}` : "From recent play");
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
// Instead of "screenshotting" the DOM, we generate a fresh 970x540 image on a canvas.
// This is signature-friendly (consistent size, crisp text, controlled background).
async function exportCardAsPng() {
  clearStatus();

  const W = 970;
  const H = 540;

  // Pull data from the rendered recap (DOM is our source of truth)
  const gt = (gtName?.textContent || "").trim() || "Player";
  const presenceText = (presence?.textContent || "").trim();
  const pillQuality = (dataQualityPill?.textContent || "").trim();
  const pillUpdated  = (lastUpdatedPill?.textContent || "").trim();

  const stats = [
    { k: "Gamerscore",          v: (gamerscore?.textContent || "—").trim(),       s: (gamerscoreDelta?.textContent || "—").trim() },
    { k: "Days played",         v: (daysPlayed?.textContent || "—").trim(),       s: (playRange?.textContent || "—").trim() },
    { k: "Favourite",           v: (favGame?.textContent || "—").trim(),          s: (favGameSessions?.textContent || "—").trim() },

    { k: "Unique games",        v: (uniqueGames?.textContent || "—").trim(),      s: (oneHit?.textContent || "—").trim() },
    { k: "Current streak",      v: (currentStreak?.textContent || "—").trim(),    s: (longestStreak?.textContent || "—").trim() },
    { k: "Longest break",       v: (longestBreak?.textContent || "—").trim(),     s: "days" },

    { k: "Peak day",            v: (peakDay?.textContent || "—").trim(),          s: (peakDaySub?.textContent || "—").trim() },
    { k: "Most active weekday", v: (activeWeekday?.textContent || "—").trim(),    s: (activeWeekdaySub?.textContent || "—").trim() },
    { k: "Most active month",   v: (activeMonth?.textContent || "—").trim(),      s: (activeMonthSub?.textContent || "—").trim() },
  ];

  // Achievement (optional)
  const achName = (achievementName?.textContent || "").trim();
  const achMeta1 = (achievementPercent?.textContent || "").trim();
  const achMeta2 = (achievementContext?.textContent || "").trim();
  const achIconUrl = (achievementIcon && !achievementIcon.classList.contains("hidden") ? achievementIcon.src : null) || null;

  // Gamerpic (optional)
  const pfpUrl = (profilePic && profilePic.style.display !== "none" ? profilePic.src : null) || null;

  // Canvas setup
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    setStatus("PNG export failed: canvas unsupported.");
    return;
  }

  // --- helpers ---
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function roundRectPath(x, y, w, h, r) {
    const rr = clamp(r, 0, Math.min(w, h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function fillRoundRect(x, y, w, h, r, fillStyle) {
    ctx.save();
    roundRectPath(x, y, w, h, r);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.restore();
  }

  function strokeRoundRect(x, y, w, h, r, strokeStyle, lineWidth = 1) {
    ctx.save();
    roundRectPath(x, y, w, h, r);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  }

  function ellipsize(text, maxWidth, font) {
    const t = String(text || "");
    ctx.save();
    ctx.font = font;
    if (ctx.measureText(t).width <= maxWidth) { ctx.restore(); return t; }
    const ell = "…";
    let lo = 0, hi = t.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const candidate = t.slice(0, mid) + ell;
      if (ctx.measureText(candidate).width <= maxWidth) lo = mid + 1;
      else hi = mid;
    }
    const out = t.slice(0, Math.max(0, lo - 1)) + ell;
    ctx.restore();
    return out;
  }

  function wrapLines(text, maxWidth, font, maxLines = 2) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    ctx.save();
    ctx.font = font;
    const lines = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? cur + " " + w : w;
      if (ctx.measureText(next).width <= maxWidth) cur = next;
      else {
        if (cur) lines.push(cur);
        cur = w;
        if (lines.length >= maxLines) break;
      }
    }
    if (lines.length < maxLines && cur) lines.push(cur);
    if (lines.length) {
      const last = lines[lines.length - 1];
      lines[lines.length - 1] = ellipsize(last, maxWidth, font);
    }
    ctx.restore();
    return lines.slice(0, maxLines);
  }

  function loadImageSafe(url) {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  // --- Background (Xbox-ish, no logos) ---
  ctx.fillStyle = "#07080b";
  ctx.fillRect(0, 0, W, H);

  function radialGlow(cx, cy, r, rgba) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, rgba);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  radialGlow(150, 80, 520, "rgba(14,205,17,0.26)");
  radialGlow(840, 120, 520, "rgba(0,153,255,0.18)");
  radialGlow(520, 560, 640, "rgba(255,255,255,0.06)");

  // Vignette
  const vg = ctx.createRadialGradient(W/2, H/2, 120, W/2, H/2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // --- Shell ---
  const pad = 22;
  const shellX = pad;
  const shellY = pad;
  const shellW = W - pad * 2;
  const shellH = H - pad * 2;

  fillRoundRect(shellX, shellY, shellW, shellH, 22, "rgba(255,255,255,0.06)");
  strokeRoundRect(shellX, shellY, shellW, shellH, 22, "rgba(255,255,255,0.14)", 1);

  // --- Header ---
  const headerX = shellX + 16;
  const headerY = shellY + 14;

  const [pfpImg, achImg] = await Promise.all([
    loadImageSafe(pfpUrl),
    loadImageSafe(achIconUrl),
  ]);

  const pSize = 58;
  const pX = headerX;
  const pY = headerY + 6;

  // ring
  ctx.beginPath();
  ctx.arc(pX + pSize/2, pY + pSize/2, pSize/2 + 3, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(14,205,17,0.55)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(pX + pSize/2, pY + pSize/2, pSize/2, 0, Math.PI*2);
  ctx.clip();
  if (pfpImg) {
    ctx.drawImage(pfpImg, pX, pY, pSize, pSize);
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(pX, pY, pSize, pSize);
    ctx.fillStyle = "rgba(245,246,247,0.92)";
    ctx.font = "800 22px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((gt[0] || "?").toUpperCase(), pX + pSize/2, pY + pSize/2);
    ctx.textAlign = "left";
  }
  ctx.restore();

  const textX = pX + pSize + 14;
  const rightEdge = shellX + shellW - 16;
  const pillsW = 260;
  const textW = (rightEdge - pillsW) - textX;

  // Gamertag
  ctx.fillStyle = "rgba(245,246,247,0.96)";
  ctx.font = "800 22px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textBaseline = "top";
  ctx.fillText(ellipsize(gt, textW, ctx.font), textX, headerY);

  // Presence
  ctx.fillStyle = "rgba(245,246,247,0.70)";
  ctx.font = "500 12px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  const presLines = wrapLines(presenceText, textW, ctx.font, 2);
  ctx.fillText(presLines[0] || "", textX, headerY + 30);
  if (presLines[1]) ctx.fillText(presLines[1], textX, headerY + 46);

  // Pills right
  function drawRightPill(t, y) {
    const text = String(t || "").trim();
    if (!text) return;
    ctx.font = "600 12px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const tw = ctx.measureText(text).width;
    const w = Math.ceil(tw + 20);
    const h = 26;
    const x = rightEdge - w;
    fillRoundRect(x, y, w, h, 999, "rgba(0,0,0,0.18)");
    strokeRoundRect(x, y, w, h, 999, "rgba(255,255,255,0.14)", 1);
    ctx.fillStyle = "rgba(245,246,247,0.88)";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 10, y + h/2);
  }
  drawRightPill(pillQuality, headerY + 2);
  drawRightPill(pillUpdated, headerY + 34);

  // --- Grid ---
  const gridX = shellX + 16;
  const gridY = shellY + 110;
  const gridW = shellW - 32;
  const gap = 12;
  const cols = 3;
  const boxW = Math.floor((gridW - gap * (cols - 1)) / cols);
  const boxH = 86;

  function drawStatBox(x, y, w, h, item, accent = false) {
    const fill = accent ? "rgba(14,205,17,0.10)" : "rgba(0,0,0,0.22)";
    fillRoundRect(x, y, w, h, 16, fill);
    strokeRoundRect(x, y, w, h, 16, "rgba(255,255,255,0.12)", 1);

    const innerX = x + 12;
    const innerW = w - 24;

    ctx.fillStyle = "rgba(245,246,247,0.70)";
    ctx.font = "700 12px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "top";
    ctx.fillText(ellipsize(item.k, innerW, ctx.font), innerX, y + 10);

    ctx.fillStyle = "rgba(245,246,247,0.96)";
    ctx.font = "800 18px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(ellipsize(item.v, innerW, ctx.font), innerX, y + 30);

    ctx.fillStyle = "rgba(245,246,247,0.62)";
    ctx.font = "500 12px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const subLines = wrapLines(item.s, innerW, ctx.font, 2);
    ctx.fillText(subLines[0] || "—", innerX, y + 56);
    if (subLines[1]) ctx.fillText(subLines[1], innerX, y + 70);
  }

  for (let i = 0; i < stats.length; i++) {
    const r = Math.floor(i / 3);
    const c = i % 3;
    const x = gridX + c * (boxW + gap);
    const y = gridY + r * (boxH + gap);
    drawStatBox(x, y, boxW, boxH, stats[i], i === 0 || i === 2);
  }

  // --- Achievement strip ---
  const achY = shellY + shellH - 78;
  const achX = shellX + 16;
  const achW = shellW - 32;
  const achH = 60;

  fillRoundRect(achX, achY, achW, achH, 16, "rgba(0,0,0,0.22)");
  strokeRoundRect(achX, achY, achW, achH, 16, "rgba(255,255,255,0.12)", 1);

  const iconSize = 40;
  const ix = achX + 12;
  const iy = achY + (achH - iconSize) / 2;

  fillRoundRect(ix, iy, iconSize, iconSize, 12, "rgba(255,255,255,0.06)");
  strokeRoundRect(ix, iy, iconSize, iconSize, 12, "rgba(255,255,255,0.12)", 1);

  if (achImg) {
    ctx.save();
    roundRectPath(ix, iy, iconSize, iconSize, 12);
    ctx.clip();
    ctx.drawImage(achImg, ix, iy, iconSize, iconSize);
    ctx.restore();
  } else {
    ctx.fillStyle = "rgba(245,246,247,0.55)";
    ctx.font = "800 16px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🏅", ix + iconSize/2, iy + iconSize/2);
    ctx.textAlign = "left";
  }

  const ax = ix + iconSize + 12;
  const aw = achW - (ax - achX) - 12;

  ctx.fillStyle = "rgba(245,246,247,0.92)";
  ctx.font = "800 14px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  const title = achName || "Rarest achievement";
  ctx.textBaseline = "top";
  ctx.fillText(ellipsize(title, aw, ctx.font), ax, achY + 12);

  ctx.fillStyle = "rgba(245,246,247,0.62)";
  ctx.font = "500 12px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  const meta = [achMeta1, achMeta2].filter(Boolean).join(" • ");
  ctx.fillText(ellipsize(meta || "—", aw, ctx.font), ax, achY + 32);

  // Watermark
  ctx.fillStyle = "rgba(245,246,247,0.35)";
  ctx.font = "600 11px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  const wm = "xboxrecap";
  const wmw = ctx.measureText(wm).width;
  ctx.fillText(wm, shellX + shellW - 16 - wmw, shellY + shellH - 18);

  // Export
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `xbox-recap-${gt.replace(/\s+/g, "-").toLowerCase()}-sig.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setStatus("PNG exported ✅");
  setTimeout(clearStatus, 1400);
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
