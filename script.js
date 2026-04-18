// =======================
// chatterbox - script.js
// =======================

// === CONFIG ===
const SIGNED_IN_KEY = "xr_signedInGamertag";
const API_BASE_OVERRIDE_KEY = "xr_api_base_override";
const REFERRAL_CODE_KEY = "cb_referrer_code";
const MAX_DISPLAY_BADGES = 7;

const DEFAULT_WORKER_BASE = trimTrailingSlash(window.location.origin);
const DEFAULT_PUBLIC_KEY = "";

function trimTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function readConfiguredApiBase() {
  const fromQuery = new URLSearchParams(window.location.search).get("apiBase");
  if (fromQuery) {
    const normalized = trimTrailingSlash(fromQuery);
    try { localStorage.setItem(API_BASE_OVERRIDE_KEY, normalized); } catch {}
    return normalized;
  }

  try {
    const stored = localStorage.getItem(API_BASE_OVERRIDE_KEY);
    if (stored) return trimTrailingSlash(stored);
  } catch {}

  const fromGlobal = trimTrailingSlash(window.__XR_CONFIG__?.workerBase);
  if (fromGlobal) return fromGlobal;

  return DEFAULT_WORKER_BASE;
}

function getApiBase() {
  return readConfiguredApiBase();
}

function getApiBaseCandidates() {
  const configured = getApiBase();
  const candidates = [configured, DEFAULT_WORKER_BASE]
    .map(trimTrailingSlash)
    .filter(Boolean);

  return [...new Set(candidates)];
}

function rememberWorkingApiBase(apiBase) {
  const normalized = trimTrailingSlash(apiBase);
  if (!normalized) return;
  try { localStorage.setItem(API_BASE_OVERRIDE_KEY, normalized); } catch {}
}

function getPublicKey() {
  const fromGlobal = String(window.__XR_CONFIG__?.publicKey || "").trim();
  return fromGlobal || DEFAULT_PUBLIC_KEY;
}

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
  return safe
    .replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(\d{4}-\d{2}-\d{2})\*/g, "<strong>$1</strong>");
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
const staleDataNotice = el("staleDataNotice");
const staleDataText = el("staleDataText");
const staleReconnectBtn = el("staleReconnectBtn");

const signinPrompt = el("signinPrompt");
const signinBtn = el("signinBtn");
const badgeBox = el("badgeBox"); // ✅ NEW: Badges & Milestones placeholder panel
const badgeActionBtn = el("badgeActionBtn");
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
const badgesSection = el("badges");
const displaySlots = el("displaySlots");
const saveDisplayBtn = el("saveDisplayBtn");
const closeDisplayModalBtn = el("closeDisplayModalBtn");
const displayEditorHint = el("displayEditorHint");
const badgeCatalog = el("badgeCatalog");
const referralLink = el("referralLink");
const copyReferralBtn = el("copyReferralBtn");
const referralStats = el("referralStats");

let latestRecapData = null;
let latestEditableItems = [];
let selectedDisplayIds = [];

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

function setStaleNotice({ showNotice, message }) {
  if (!staleDataNotice) return;
  if (showNotice) {
    if (staleDataText) staleDataText.textContent = message || "Reconnect Xbox to restore richer account updates.";
    show(staleDataNotice);
  } else {
    hide(staleDataNotice);
  }
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

function fmtWholeNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "—");
  return Math.trunc(n).toLocaleString();
}

function fmtSignedWholeNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "—");
  const abs = Math.abs(Math.trunc(n)).toLocaleString();
  return `${n >= 0 ? "+" : "-"}${abs}`;
}

// UTC day helpers (match worker's day keys)
function yyyyMmDdUTCFromDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetweenDayKeysUTC(aYYYYMMDD, bYYYYMMDD) {
  if (!aYYYYMMDD || !bYYYYMMDD) return null;
  const ap = String(aYYYYMMDD).split("-").map(Number);
  const bp = String(bYYYYMMDD).split("-").map(Number);
  if (ap.length !== 3 || bp.length !== 3) return null;
  const a = Date.UTC(ap[0], ap[1] - 1, ap[2]);
  const b = Date.UTC(bp[0], bp[1] - 1, bp[2]);
  return Math.round((b - a) / 86400000);
}

function diffDaysFromIso(iso) {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((Date.now() - then.getTime()) / 86400000);
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
  url.searchParams.delete("apiBase");

  const embed = new URL(window.location.href);
  embed.searchParams.set("gamertag", gamertag);
  embed.searchParams.set("embed", "1");
  embed.searchParams.delete("apiBase");

  return { normal: url.toString(), embed: embed.toString() };
}

function getOpenXblSigninUrl() {
  return `https://api.xbl.io/app/auth/${getPublicKey()}`;
}

function showCard() { show(gamerCardWrap); }
function hideCard() { hide(gamerCardWrap); }

// === IMAGE PROXY (fixes flaky Xbox image loads) ===
function proxifyImage(url) {
  if (!url) return null;
  return `${getApiBase()}/img?url=${encodeURIComponent(url)}`;
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

function getStoredReferralCode() {
  try {
    const code = localStorage.getItem(REFERRAL_CODE_KEY);
    return code ? String(code).trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

function setStoredReferralCode(code) {
  try {
    if (!code) localStorage.removeItem(REFERRAL_CODE_KEY);
    else localStorage.setItem(REFERRAL_CODE_KEY, String(code).trim().toUpperCase());
  } catch {}
}

function captureReferralFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setStoredReferralCode(ref);
  } catch {}
}

function badgeLevelText(item) {
  const level = item?.levelLabel || item?.level || null;
  const rank = item?.rank ? ` • rank #${item.rank}` : "";
  return level ? `${level}${rank}` : (rank ? `Rank #${item.rank}` : "Unlocked");
}

function badgeTileHtml(item) {
  if (window.XRComponents?.badgeTile) return window.XRComponents.badgeTile(item);
  const icon = esc(String(item?.icon || item?.name?.[0] || "?"));
  return `<span class="badgeTile"><span class="badgeTileFallback">${icon}</span></span>`;
}

function getEditableBadgeItems(recap) {
  const all = [...(recap?.badges?.list || []), ...(recap?.badges?.milestones || [])]
    .filter((item) => item && item.unlocked);
  const seen = new Set();
  return all.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function buildReferralLink(code) {
  if (!code) return "";
  const url = new URL(window.location.href);
  url.searchParams.delete("gamertag");
  url.searchParams.delete("embed");
  url.searchParams.delete("apiBase");
  url.searchParams.set("ref", code);
  return url.toString();
}

function renderDisplaySlots(items, selectedIds) {
  if (!displaySlots) return;

  const byId = new Map(items.map((item) => [item.id, item]));
  const selected = selectedIds.map((id) => byId.get(id)).filter(Boolean);

  const html = [];
  for (const item of selected) {
    html.push(`
      <div class="displaySlot">
        ${badgeTileHtml(item)}
        <div class="displaySlotMeta">
          <div class="displaySlotName">${esc(item.name || "Badge")}</div>
          <div class="displaySlotSub">${esc(badgeLevelText(item))}</div>
        </div>
      </div>
    `);
  }
  for (let i = selected.length; i < MAX_DISPLAY_BADGES; i += 1) {
    html.push(`<div class="displaySlot empty">Empty</div>`);
  }
  displaySlots.innerHTML = html.join("");
}

function renderBadgeCatalog(items, selectedIds) {
  if (!badgeCatalog) return;
  if (!items.length) {
    badgeCatalog.innerHTML = `<div class="muted">Generate and unlock more badges to customize your profile rail.</div>`;
    return;
  }

  badgeCatalog.innerHTML = items.map((item) => {
    const selected = selectedIds.includes(item.id);
    const desc = item?.desc || "Unlocked";
    return `
      <button class="catalogItem${selected ? " selected" : ""}" type="button" data-badge-id="${esc(item.id)}">
        <span class="catalogTileWrap">
          ${badgeTileHtml(item)}
          <span class="catalogLevel">${esc(item?.levelLabel || item?.level || "Live")}</span>
        </span>
        <span class="catalogMeta">
          <span class="catalogName">${esc(item?.name || "Badge")}</span>
          <span class="catalogSub">${esc(badgeLevelText(item))} • ${esc(desc)}</span>
        </span>
      </button>
    `;
  }).join("");
}

function renderReferralPanel(recap) {
  const referral = recap?.badges?.referral || null;
  const code = referral?.code || "";
  const count = Number(referral?.count || 0);
  if (referralLink) referralLink.value = buildReferralLink(code);
  if (referralStats) {
    referralStats.textContent = code
      ? `${count} successful referral${count === 1 ? "" : "s"} • code ${code}`
      : "Invite friends to unlock the Friendship Badge.";
  }
}

function openDisplayModal() {
  if (!badgesSection) return;
  show(badgesSection);
  badgesSection.setAttribute("aria-hidden", "false");
  document.body.classList.add("modalOpen");
}

function closeDisplayModal() {
  if (!badgesSection) return;
  hide(badgesSection);
  badgesSection.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modalOpen");
}

function renderProfileArea(recap, gamertag, linked) {
  if (!badgesSection) return;

  if (!linked) {
    closeDisplayModal();
    latestEditableItems = [];
    selectedDisplayIds = [];
    if (badgeCatalog) badgeCatalog.innerHTML = "";
    if (displaySlots) displaySlots.innerHTML = "";
    return;
  }

  latestEditableItems = getEditableBadgeItems(recap);
  const savedIds = Array.isArray(recap?.badges?.display?.ids) ? recap.badges.display.ids : [];
  selectedDisplayIds = savedIds.length
    ? savedIds.slice(0, MAX_DISPLAY_BADGES)
    : (Array.isArray(recap?.badges?.displayed) ? recap.badges.displayed.map((item) => item?.id).filter(Boolean).slice(0, MAX_DISPLAY_BADGES) : []);

  renderDisplaySlots(latestEditableItems, selectedDisplayIds);
  renderBadgeCatalog(latestEditableItems, selectedDisplayIds);
  renderReferralPanel(recap);

  if (displayEditorHint) {
    displayEditorHint.textContent = `${selectedDisplayIds.length}/${MAX_DISPLAY_BADGES} slots selected for ${gamertag}.`;
  }
}

// === USER AREA STATES ===
function setSignedInUiState({ gamertag, avatarUrl, qualityLabel }) {
  show(userArea);

  // ✅ When signed in: hide connect prompt, show badges panel
  hide(signinPrompt);
  show(badgeBox);
  if (badgeActionBtn) {
    badgeActionBtn.textContent = "Edit display";
    badgeActionBtn.href = "#";
  }

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
  if (badgesSection && latestRecapData?.linked) show(badgesSection);
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
  if (badgeActionBtn) {
    badgeActionBtn.textContent = "Connect Xbox";
    badgeActionBtn.href = getOpenXblSigninUrl();
  }
  closeDisplayModal();
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
    latestRecapData = data;

    const quality =
      recap?.dataQuality === "good" ? "Full" :
      recap?.dataQuality === "limited" ? "Limited" :
      linked ? "Connected" : "Tracking";

    setSignedInUiState({
      gamertag: signedInGt,
      avatarUrl: profile?.displayPicRaw || null,
      qualityLabel: quality,
    });
    renderProfileArea(recap, signedInGt, linked);
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

async function fetchFromApi(path, init, options = {}) {
  const candidates = getApiBaseCandidates();
  const errors = [];
  const allowFallbackOnHttpError = options.allowFallbackOnHttpError !== false;

  for (let i = 0; i < candidates.length; i += 1) {
    const apiBase = candidates[i];
    const url = withNoCache(`${apiBase}${path}`);

    try {
      const result = await fetchJsonOrText(url, init);
      const shouldFallback =
        i < candidates.length - 1 &&
        apiBase !== DEFAULT_WORKER_BASE &&
        allowFallbackOnHttpError &&
        !result.res.ok;

      if (shouldFallback) {
        errors.push(`HTTP ${result.res.status} from ${apiBase}`);
        continue;
      }

      if (result.res.ok) rememberWorkingApiBase(apiBase);
      return { apiBase, ...result };
    } catch (err) {
      errors.push(`${apiBase}: ${String(err?.message || err)}`);
      if (i === candidates.length - 1) throw err;
    }
  }

  throw new Error(errors.join(" | ") || "All API bases failed");
}

function withNoCache(url) {
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}_=${Date.now()}`;
}

async function fetchRecap(gamertag) {
  const { apiBase, res, text, data } = await fetchFromApi(`/?gamertag=${encodeURIComponent(gamertag)}`);

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : (text || `HTTP ${res.status}`);
    throw new Error(`Recap request failed (${res.status}): ${msg}`);
  }
  return data;
}

async function fetchBlog(gamertag) {
  const { res, data } = await fetchFromApi(`/blog?gamertag=${encodeURIComponent(gamertag)}&limit=7`);
  if (!res.ok) return null;
  return data;
}

async function fetchDonateStats() {
  const { res, data } = await fetchFromApi(`/donate-stats`);
  if (!res.ok) return null;
  return data;
}

async function signOutWorker(gamertag) {
  const { apiBase, res, data, text } = await fetchFromApi(`/signout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gamertag }),
  }, { allowFallbackOnHttpError: true });

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : (text || `HTTP ${res.status}`);
    throw new Error(`Sign out failed (${res.status}): ${msg}`);
  }
  return data;
}

async function saveDisplaySelection(gamertag, badgeIds) {
  const { res, data, text } = await fetchFromApi(`/profile/display`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gamertag, badgeIds }),
  }, { allowFallbackOnHttpError: true });

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : (text || `HTTP ${res.status}`);
    throw new Error(`Save failed (${res.status}): ${msg}`);
  }
  return data;
}

// === TWEET BUILDER (per-entry) ===
function buildTweet({ gamertag, entry, shareUrl }) {
  const date = entry?.date ? entry.date : "";
  const rawText = entry?.text ? entry.text : "My console refused to write today. Suspicious.";

  const base =
`chatterbox Journal ${date ? "• " + date : ""}

${rawText}

Generate yours: ${shareUrl}

#chatterbox #Xbox #Gaming`;

  let t = base.trim();
  if (t.length <= 280) return t;

  // Trim body first
  const head = `chatterbox Journal ${date ? "• " + date : ""}\n\n`;
  const tail = `\n\nGenerate yours: ${shareUrl}\n\n#chatterbox #Xbox #Gaming`;
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
    const gameName = esc(a?.titleName || "Unknown game");
    const unlockedAtText = a?.unlockedAt ? esc(fmtDateTime(a.unlockedAt)) : "";
    const subHtml = mode === "recent"
      ? (unlockedAtText
        ? `<strong>${gameName}</strong> <em>Unlocked ${unlockedAtText}</em>`
        : `<strong>${gameName}</strong>`)
      : (a?.titleName ? `From <strong>${gameName}</strong>` : "");
    const iconUrl = a?.icon ? proxifyImage(sanitizeXboxPicUrl(a.icon)) : null;
    const iconHtml = iconUrl
      ? `<img class="achItemIcon" alt="" crossorigin="anonymous" referrerpolicy="no-referrer" src="${esc(iconUrl)}&_=${Date.now()}" />`
      : `<div class="achItemIcon" style="display:grid;place-items:center;">🏆</div>`;

    return `
      <div class="achItem">
        ${iconHtml}
        <div>
          <div class="achItemName">${nm}</div>
          <div class="achItemSub">${subHtml || ""}</div>
        </div>
        <div class="achItemPct">${esc(p)}</div>
      </div>
    `;
  }).join("");
}

function renderDonate(ds) {
  if (!ds || !donateTotal || !donateSupporters) return;

  const cur = String(ds.currency || "GBP").toUpperCase();
  const total = Number(ds.totalRaised || 0);
  const supporters = Number(ds.supporters || 0);

  try {
    donateTotal.textContent = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(total) ? total : 0);
  } catch {
    const symbol = cur === "GBP" ? "£" : cur === "USD" ? "$" : cur === "EUR" ? "€" : `${cur} `;
    donateTotal.textContent = `${symbol}${(Number.isFinite(total) ? total : 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }

  donateSupporters.textContent = Math.max(0, Math.trunc(Number.isFinite(supporters) ? supporters : 0)).toLocaleString();
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
  latestRecapData = data;

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

  const observedAgeDays = diffDaysFromIso(recap?.lastObservedAt);
  const lastRefreshAt =
    recap?.lastOpenXblOkAt ||
    recap?.lastSeen ||
    null;
  const refreshAgeDays = diffDaysFromIso(lastRefreshAt);

  const staleTrackingPresence =
    !linked && observedAgeDays != null && observedAgeDays >= 7
      ? `Tracking only • no new play observed since ${fmtDateTime(recap?.lastObservedAt)}`
      : null;
  const staleTrackingMessage =
    !linked && observedAgeDays != null && observedAgeDays >= 7
      ? `Xbox activity has not refreshed for ${observedAgeDays} days. Reconnect Xbox to restore live account syncing.`
      : "";

  setText(presence, profile?.presenceText || staleTrackingPresence || fallbackPresence);

  // ✅ PFP: proxy + fallback
  setAvatar({
    imgEl: profilePic,
    fallbackEl: profilePicFallback,
    url: profile?.displayPicRaw || null,
    labelText: gamertag,
  });

  const gamerscoreCurrent = recap?.gamerscoreCurrent ?? profile?.gamerscore ?? null;
  const gamerscoreSinceTracking =
    recap?.gamerscoreDelta != null
      ? recap.gamerscoreDelta
      : (recap?.gamerscoreCurrent != null && recap?.gamerscoreFirst != null)
      ? (recap.gamerscoreCurrent - recap.gamerscoreFirst)
      : null;

  if (gamerscoreCurrent != null && gamerscoreSinceTracking != null) {
    setText(
      gamerscore,
      `${fmtWholeNumber(gamerscoreCurrent)} (${fmtSignedWholeNumber(gamerscoreSinceTracking)} total)`
    );
  } else {
    setText(gamerscore, gamerscoreCurrent != null ? fmtWholeNumber(gamerscoreCurrent) : "—");
  }

  if (gamerscoreDelta) {
    const lastUpdateGain = recap?.gamerscoreDeltaSinceLastRecap;
    gamerscoreDelta.textContent =
      lastUpdateGain != null
        ? `${fmtSignedWholeNumber(lastUpdateGain)} in last update`
        : (linked ? "Awaiting next update" : "Connect Xbox for update deltas");
  }

  setText(daysPlayed, recap?.daysPlayedCount ?? "—");

  const todayKeyUTC = yyyyMmDdUTCFromDate(new Date());

  // Days Played counts ONLY days with confirmed play,
  // but the displayed date window should keep moving forward even on inactive days.
  const range =
    recap?.firstPlayDay
      ? `${recap.firstPlayDay} → ${todayKeyUTC}`
      : recap?.firstSeen
      ? `Tracking since ${fmtDateTime(recap.firstSeen)}`
      : "—";
  setText(playRange, range);

  setText(favGame, recap?.favouriteGame ?? "—");
  setText(
    favGameSessions,
    recap?.favouriteGameSessions ? `${recap.favouriteGameSessions} sessions` : "—"
  );

  // Streak display: if you haven't played today (UTC), streak is 0.
  const lastPlayDay = recap?.lastPlayDay || null;
  const gapDays = lastPlayDay ? daysBetweenDayKeysUTC(lastPlayDay, todayKeyUTC) : null;

  const displayStreak = (typeof gapDays === "number" && (gapDays === 0 || gapDays === 1)) ? (recap?.currentStreak ?? 0) : 0;

  setText(currentStreak, displayStreak);
  setText(longestStreak, recap?.longestStreak ? `Best: ${recap.longestStreak} days` : "—");

  // ✅ Breaks: show "current break" + "longest break" stacked
  const currentBreakDays =
    (typeof gapDays === "number" && gapDays > 1) ? (gapDays - 1) : 0;

  const longestBreakDays =
    (recap?.longestBreakDays != null) ? recap.longestBreakDays : 0;

  if (longestBreak) {
    // Using <br> so it renders as two lines without needing CSS changes.
    longestBreak.innerHTML =
      `Current break: ${esc(String(currentBreakDays))} day${currentBreakDays === 1 ? "" : "s"}<br>` +
      `Longest break: ${esc(String(longestBreakDays))} day${longestBreakDays === 1 ? "" : "s"}`;
  }

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
    const refreshLine = lastRefreshAt
      ? `Worker refreshed: ${fmtDateTime(lastRefreshAt)}`
      : `Worker refresh unknown`;
    const staleLine =
      !linked && observedAgeDays != null && observedAgeDays >= 7
        ? `No new Xbox activity for ${observedAgeDays} days`
        : null;

    trackingInfo.textContent = [
      `First seen: ${fmtDateTime(recap?.firstSeen)}`,
      observedLine,
      refreshLine,
      staleLine,
      `Lookups: ${recap?.lookupCount ?? 0}`
    ].filter(Boolean).join(" • ");
  }

  setStaleNotice({
    showNotice: !linked && observedAgeDays != null && observedAgeDays >= 7,
    message: staleTrackingMessage
  });

  if (!linked && refreshAgeDays != null && refreshAgeDays <= 1 && observedAgeDays != null && observedAgeDays >= 7) {
    setStatus(
      `The worker refreshed on ${fmtDateTime(lastRefreshAt)}, but it has not observed new Xbox play since ${fmtDateTime(recap?.lastObservedAt)}.`
    );
  }

  setPillQuality(recap, linked);
  setLastUpdated(recap);

  if (window.XRComponents?.renderBadgeBox) {
    window.XRComponents.renderBadgeBox(
      badgeBox,
      recap?.badges?.list || [],
      recap?.badges?.milestones || [],
      recap?.badges?.displayed || []
    );
  }

  renderProfileArea(recap, gamertag, linked);

  const urls = buildShareUrls(gamertag);
  if (liveLink) liveLink.value = urls.embed;
  if (bbcode) bbcode.value = `[url=${urls.embed}]chatterbox Card[/url]`;
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

    const [recapResult, blogResult, donateResult] = await Promise.allSettled([
      fetchRecap(gt),
      fetchBlog(gt),
      fetchDonateStats(),
    ]);

    if (recapResult.status !== "fulfilled") {
      throw recapResult.reason;
    }

    const recapData = recapResult.value;
    const blogData = blogResult.status === "fulfilled" ? blogResult.value : null;
    const donateData = donateResult.status === "fulfilled" ? donateResult.value : null;

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
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    if (typeof window.ExportToPNG === "function") {
      window.ExportToPNG();
      return;
    }
    exportCardAsPng();
  });
}

if (copyLinkBtn) {
  copyLinkBtn.addEventListener("click", () => {
    const url = new URL(window.location.href);
    copyToClipboard(url.toString());
  });
}
if (copyLiveLinkBtn && liveLink) copyLiveLinkBtn.addEventListener("click", () => copyToClipboard(liveLink.value || ""));
if (copyBbBtn && bbcode) copyBbBtn.addEventListener("click", () => copyToClipboard(bbcode.value || ""));
if (copyReferralBtn && referralLink) copyReferralBtn.addEventListener("click", () => copyToClipboard(referralLink.value || ""));

if (badgeActionBtn) {
  badgeActionBtn.addEventListener("click", (e) => {
    if (!getSignedInGamertag()) return;
    e.preventDefault();
    openDisplayModal();
  });
}

if (closeDisplayModalBtn) {
  closeDisplayModalBtn.addEventListener("click", () => {
    closeDisplayModal();
  });
}

if (badgesSection) {
  badgesSection.addEventListener("click", (e) => {
    if (e.target === badgesSection) closeDisplayModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && badgesSection && !badgesSection.classList.contains("hidden")) {
    closeDisplayModal();
  }
});

if (badgeCatalog) {
  badgeCatalog.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-badge-id]");
    if (!btn) return;

    const id = String(btn.getAttribute("data-badge-id") || "").trim();
    if (!id) return;

    if (selectedDisplayIds.includes(id)) {
      selectedDisplayIds = selectedDisplayIds.filter((x) => x !== id);
    } else if (selectedDisplayIds.length < MAX_DISPLAY_BADGES) {
      selectedDisplayIds = [...selectedDisplayIds, id];
    } else {
      setStatus(`You can pin up to ${MAX_DISPLAY_BADGES} badges.`);
      setTimeout(clearStatus, 1200);
      return;
    }

    renderDisplaySlots(latestEditableItems, selectedDisplayIds);
    renderBadgeCatalog(latestEditableItems, selectedDisplayIds);
    if (displayEditorHint) displayEditorHint.textContent = `${selectedDisplayIds.length}/${MAX_DISPLAY_BADGES} slots selected.`;
  });
}

if (saveDisplayBtn) {
  saveDisplayBtn.addEventListener("click", async () => {
    const signedInGt = getSignedInGamertag();
    if (!signedInGt) {
      setStatus("Connect Xbox first.");
      return;
    }

    saveDisplayBtn.disabled = true;
    setStatus("Saving display…");
    try {
      await saveDisplaySelection(signedInGt, selectedDisplayIds);
      if (latestRecapData?.recap?.badges) {
        latestRecapData.recap.badges.display = {
          ...(latestRecapData.recap.badges.display || {}),
          ids: selectedDisplayIds.slice(0, MAX_DISPLAY_BADGES),
        };
        latestRecapData.recap.badges.displayed = selectedDisplayIds
          .map((id) => latestEditableItems.find((item) => item.id === id))
          .filter(Boolean);

        if (window.XRComponents?.renderBadgeBox) {
          window.XRComponents.renderBadgeBox(
            badgeBox,
            latestRecapData.recap.badges.list || [],
            latestRecapData.recap.badges.milestones || [],
            latestRecapData.recap.badges.displayed || []
          );
        }
      }
      setStatus("Display saved.");
      setTimeout(clearStatus, 1200);
      closeDisplayModal();
    } catch (err) {
      console.error(err);
      setStatus(String(err?.message || "Save failed."));
    } finally {
      saveDisplayBtn.disabled = false;
    }
  });
}

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

if (staleReconnectBtn) {
  staleReconnectBtn.href = getOpenXblSigninUrl();
  staleReconnectBtn.addEventListener("click", (e) => {
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
  captureReferralFromUrl();

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
