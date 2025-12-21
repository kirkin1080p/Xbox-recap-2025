// === CONFIG ===
const WORKER_BASE = "https://falling-cake-f670.kirkjlemon.workers.dev";
const PUBLIC_KEY  = "4f6e9e47-98c9-0501-ae8a-4c078183a6dc";

// Auth storage key (signed-in identity)
const LS_AUTH_GT = "xbr_auth_gamertag";

// === DOM HELPERS ===
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

// === DOM ===
const gamertagInput = el("gamertagInput");
const generateBtn   = el("generateBtn");
const statusEl      = el("status");

const gamerCardWrap = el("gamerCardWrap");
const gamerCard     = el("gamerCard");

const profilePic = el("profilePic");
const profilePicFallback = el("profilePicFallback");

const gtName     = el("gtName");
const presence   = el("presence");

const gamerscore      = el("gamerscore");
const gamerscoreDelta = el("gamerscoreDelta");
const daysPlayed      = el("daysPlayed");
const playRange       = el("playRange");
const favGame         = el("favGame");
const favGameSessions = el("favGameSessions");

const currentStreak = el("currentStreak");
const longestStreak = el("longestStreak");
const longestBreak  = el("longestBreak");
const uniqueGames   = el("uniqueGames");
const oneHit        = el("oneHit");

const peakDay     = el("peakDay");
const peakDaySub  = el("peakDaySub");
const activeWeekday    = el("activeWeekday");
const activeWeekdaySub = el("activeWeekdaySub");
const activeMonth      = el("activeMonth");
const activeMonthSub   = el("activeMonthSub");

const trackingInfo    = el("trackingInfo");
const dataQualityPill = el("dataQualityPill");
const lastUpdatedPill = el("lastUpdatedPill");

const signinPrompt  = el("signinPrompt");
const signinBtn     = el("signinBtn");

const exportBtn   = el("exportBtn");
const copyLinkBtn = el("copyLinkBtn");
const openEmbedLink = el("openEmbedLink");
const openEmbedLink2 = el("openEmbedLink2");

const achievementBlock   = el("achievementBlock");
const achievementIcon    = el("achievementIcon");
const achievementName    = el("achievementName");
const achievementPercent = el("achievementPercent");
const achievementContext = el("achievementContext");

const blogEntries = el("blogEntries");
const tweetLatestBtn = el("tweetLatestBtn");

const donateTotal      = el("donateTotal");
const donateSupporters = el("donateSupporters");

const liveLink = el("liveLink");
const bbcode   = el("bbcode");
const copyLiveLinkBtn = el("copyLiveLinkBtn");
const copyBbBtn       = el("copyBbBtn");

// Header user area
const userArea   = el("userArea");
const userAvatar = el("userAvatar");
const userAvatarFallback = el("userAvatarFallback");
const userName   = el("userName");
const userBadge  = el("userBadge");
const userSub    = el("userSub");
const signoutBtn = el("signoutBtn");

// === STATE ===
let authGamertag = (localStorage.getItem(LS_AUTH_GT) || "").trim();
let lastRenderedJournalPlain = []; // used for Tweet latest

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

function setLoading(isLoading) {
  if (!generateBtn) return;
  generateBtn.disabled = !!isLoading;
  generateBtn.classList.toggle("loading", !!isLoading);
}

function showCard() { show(gamerCardWrap); }
function hideCard() { hide(gamerCardWrap); }

// === URL / SHARE ===
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

function setEmbedModeIfNeeded() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("embed") === "1") document.body.classList.add("embed");
}

// === DATE ===
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

// === CLIPBOARD ===
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

// === AVATAR FALLBACKS ===
function initialFromGamertag(gt) {
  const s = String(gt || "").trim();
  if (!s) return "?";
  return s[0].toUpperCase();
}

function setAvatar(imgEl, fallbackEl, url, gt) {
  if (!imgEl || !fallbackEl) return;

  const letter = initialFromGamertag(gt);
  fallbackEl.textContent = letter;

  // No URL? show fallback
  if (!url) {
    imgEl.removeAttribute("src");
    hide(imgEl);
    show(fallbackEl);
    return;
  }

  // Try load; if it fails, fallback
  imgEl.onload = () => {
    show(imgEl);
    hide(fallbackEl);
  };
  imgEl.onerror = () => {
    imgEl.removeAttribute("src");
    hide(imgEl);
    show(fallbackEl);
  };

  imgEl.src = url;
  show(imgEl);
}

// === USER AREA (AUTH ONLY) ===
function setSignedOutUiState() {
  show(userArea);
  setText(userName, "Not connected", "Not connected");
  if (userSub) userSub.textContent = "Sign in to lock your profile";

  if (userBadge) {
    removeClass(userBadge, "good", "limited", "off");
    addClass(userBadge, "off");
    userBadge.textContent = "Not connected";
  }

  // avatar fallback
  setAvatar(userAvatar, userAvatarFallback, "", "");

  hide(signoutBtn);
  if (signoutBtn) signoutBtn.disabled = true;

  show(signinPrompt);
}

function setSignedInUiState(gamertag, qualityLabel = "Connected", avatarUrl = "") {
  show(userArea);
  hide(signinPrompt);

  setText(userName, gamertag, "—");
  if (userSub) userSub.textContent = "Signed in";

  // badge
  if (userBadge) {
    removeClass(userBadge, "good", "limited", "off");
    userBadge.textContent = qualityLabel || "Connected";
    addClass(
      userBadge,
      qualityLabel === "Full" ? "good" : qualityLabel === "Limited" ? "limited" : "off"
    );
  }

  setAvatar(userAvatar, userAvatarFallback, avatarUrl, gamertag);

  show(signoutBtn);
  if (signoutBtn) signoutBtn.disabled = false;
}

function refreshAuthUiFromStorageOnly() {
  authGamertag = (localStorage.getItem(LS_AUTH_GT) || "").trim();
  if (!authGamertag) {
    setSignedOutUiState();
    return;
  }

  // We don't fetch here (avoids extra calls)
  // We’ll populate avatar when the user generates THEIR own recap.
  setSignedInUiState(authGamertag, "Connected", "");
}

// === NETWORK ===
async function fetchJsonOrText(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { res, text, data };
}

async function fetchRecap(gamertag) {
  const url = `${WORKER_BASE}/?gamertag=${encodeURIComponent(gamertag)}`;
  const { res, text, data } = await fetchJsonOrText(url);

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : (text || `HTTP ${res.status}`);
    throw new Error(`Worker recap failed (${res.status}): ${msg}`);
  }
  return data;
}

async function fetchBlog(gamertag) {
  const url = `${WORKER_BASE}/blog?gamertag=${encodeURIComponent(gamertag)}&limit=7`;
  const { res, data } = await fetchJsonOrText(url);
  if (!res.ok) return null;
  return data;
}

async function fetchDonateStats() {
  const url = `${WORKER_BASE}/donate-stats`;
  const { res, data } = await fetchJsonOrText(url);
  if (!res.ok) return null;
  return data;
}

async function signOutWorker(gamertag) {
  const { res, data, text } = await fetchJsonOrText(`${WORKER_BASE}/signout`, {
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

// === PILLS ===
function setPillQuality(recap) {
  if (!dataQualityPill) return;
  const q = recap?.dataQuality || "tracking-only";
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

// === ACHIEVEMENT ===
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
      achievementIcon.src = icon;
      show(achievementIcon);
    } else {
      hide(achievementIcon);
    }
  }

  setText(achievementName, name || "Rarest achievement");
  setText(achievementPercent, pct != null ? `${pct}% unlocked` : "Rarity unknown");
  setText(achievementContext, title ? `From ${title}` : "From recent play");
}

// === JOURNAL FORMATTING ===
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Very small “good enough” markdown-ish formatter:
// - **bold**
// - *italics*
// - `code`
// - lines starting with "-" or "*" become bullets
function formatJournalTextToHtml(text) {
  let t = escapeHtml(text);

  // Normalize weird asterisk spam: collapse multiple asterisks
  t = t.replace(/\*{3,}/g, "**");

  // bullets: lines starting with "- " or "* "
  const lines = t.split("\n");
  const bulletLines = [];
  let inList = false;

  function flushList() {
    if (!inList) return;
    bulletLines.push("</ul>");
    inList = false;
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    const m = line.match(/^(\-|\*)\s+(.*)$/);
    if (m) {
      if (!inList) {
        inList = true;
        bulletLines.push("<ul class=\"journalList\">");
      }
      bulletLines.push(`<li>${m[2]}</li>`);
    } else {
      flushList();
      bulletLines.push(line);
    }
  }
  flushList();
  t = bulletLines.join("\n");

  // inline code
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  // bold
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italics (single *)
  t = t.replace(/(^|[\s(])\*([^*]+)\*(?=[\s).,!?:]|$)/g, "$1<em>$2</em>");

  // convert remaining newlines to <br> but not inside <ul>
  // quick hack: if we see <ul>, we keep newlines (CSS handles)
  if (!t.includes("<ul")) {
    t = t.replace(/\n/g, "<br>");
  } else {
    // for text outside lists, still allow <br>
    t = t.replace(/\n(?!<\/?ul|<li)/g, "<br>\n");
  }

  return t;
}

function buildTweetUrl(text) {
  const base = "https://twitter.com/intent/tweet";
  const u = new URL(base);
  u.searchParams.set("text", text);
  return u.toString();
}

function renderBlog(blog) {
  if (!blogEntries) return;

  blogEntries.innerHTML = "";
  lastRenderedJournalPlain = [];

  const entries = blog?.entries?.slice(0, 6) || [];
  if (!entries.length) {
    blogEntries.innerHTML = `<div class="blogLine muted">No journal entries yet — generate again tomorrow and it’ll start writing daily.</div>`;
    hide(tweetLatestBtn);
    return;
  }

  // Store plain text for "Tweet latest"
  for (const e of entries) {
    const plain = e?.text ? String(e.text) : "";
    lastRenderedJournalPlain.push(plain);
  }

  show(tweetLatestBtn);

  entries.forEach((e, idx) => {
    const plain = e?.text ? String(e.text) : "";
    const html = formatJournalTextToHtml(plain);

    const row = document.createElement("div");
    row.className = "blogLine";

    const content = document.createElement("div");
    content.className = "blogText";
    content.innerHTML = html;

    const actions = document.createElement("div");
    actions.className = "blogActions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn ghost small";
    copyBtn.type = "button";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", () => copyToClipboard(plain));

    const tweetBtn = document.createElement("a");
    tweetBtn.className = "btn ghost small";
    tweetBtn.href = buildTweetUrl(plain);
    tweetBtn.target = "_blank";
    tweetBtn.rel = "noopener noreferrer";
    tweetBtn.textContent = "Tweet";

    actions.appendChild(copyBtn);
    actions.appendChild(tweetBtn);

    row.appendChild(content);
    row.appendChild(actions);

    blogEntries.appendChild(row);
  });
}

function renderDonate(ds) {
  if (!ds) return;
  if (!donateTotal || !donateSupporters) return;

  const cur = ds.currency || "GBP";
  const symbol = cur === "GBP" ? "£" : cur === "USD" ? "$" : cur === "EUR" ? "€" : "";
  donateTotal.textContent = `${symbol}${Number(ds.totalRaised || 0).toFixed(0)}`;
  donateSupporters.textContent = String(ds.supporters || 0);
}

// === MAIN RENDER ===
function renderRecap(data) {
  const { gamertag, profile, recap } = data;

  setText(gtName, gamertag);

  // Presence fallback
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

  // Card avatar with fallback
  setAvatar(profilePic, profilePicFallback, profile?.displayPicRaw || "", gamertag);

  setText(gamerscore, recap?.gamerscoreCurrent ?? profile?.gamerscore ?? "—");
  if (gamerscoreDelta) {
    gamerscoreDelta.textContent =
      recap?.gamerscoreDelta != null
        ? `+${recap.gamerscoreDelta} since tracking`
        : "—";
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
  setText(favGameSessions, recap?.favouriteGameSessions ? `${recap.favouriteGameSessions} sessions` : "—");

  setText(currentStreak, recap?.currentStreak ?? "—");
  setText(longestStreak, recap?.longestStreak ? `Best: ${recap.longestStreak} days` : "—");
  setText(longestBreak, recap?.longestBreakDays ?? 0);

  setText(uniqueGames, recap?.uniqueGamesObserved ?? "—");

  const oneHitEff = recap?.oneHitWondersEffective ?? recap?.oneHitWondersCount ?? 0;
  const mature = recap?.oneHitWondersIsMature ?? false;
  setText(oneHit, mature ? `${oneHitEff} one-hit wonders` : "—");

  setText(peakDay, recap?.peakDay?.date ?? "—");
  setText(peakDaySub, recap?.peakDay?.uniqueGames != null ? `${recap.peakDay.uniqueGames} unique games` : "—");

  setText(activeWeekday, recap?.mostActiveWeekdayName ?? "—");
  setText(activeWeekdaySub, recap?.mostActiveWeekdayDays != null ? `${recap.mostActiveWeekdayDays} days` : "—");

  setText(activeMonth, recap?.mostActiveMonthName ?? "—");
  setText(activeMonthSub, recap?.mostActiveMonthDays != null ? `${recap.mostActiveMonthDays} days` : "—");

  if (trackingInfo) {
    const observedLine = recap?.lastObservedAt
      ? `Observed play: ${fmtDateTime(recap.lastObservedAt)}`
      : `No play observed yet`;
    trackingInfo.textContent =
      `First seen: ${fmtDateTime(recap?.firstSeen)} • ${observedLine} • Lookups: ${recap?.lookupCount ?? 0}`;
  }

  setPillQuality(recap);
  setLastUpdated(recap);

  const urls = buildShareUrls(gamertag);
  if (liveLink) liveLink.value = urls.embed;
  if (bbcode) bbcode.value = `[url=${urls.embed}]Xbox Recap Card[/url]`;
  if (openEmbedLink) openEmbedLink.href = urls.embed;
  if (openEmbedLink2) openEmbedLink2.href = urls.embed;

  renderAchievement(recap);
  showCard();

  // ✅ IMPORTANT FIX:
  // ONLY update header user area if this recap is for the signed-in account
  if (authGamertag && gamertag.toLowerCase() === authGamertag.toLowerCase()) {
    const quality =
      recap?.dataQuality === "good" ? "Full" :
      recap?.dataQuality === "limited" ? "Limited" :
      "Connected";

    setSignedInUiState(authGamertag, quality, profile?.displayPicRaw || "");
  }

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
let _runToken = 0;

async function run(gamertag) {
  const token = ++_runToken;

  try {
    setLoading(true);
    clearStatus();
    hideCard();

    const gt = (gamertag || "").trim();
    if (!gt) {
      setStatus("Enter a gamertag first.");
      return;
    }

    // keep URL shareable (this is VIEW state, not AUTH state)
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("gamertag", gt);
      window.history.replaceState({}, "", u);
    } catch {}

    setStatus("Loading recap…");

    // 1) recap first for fast UI
    const recapData = await fetchRecap(gt);
    if (token !== _runToken) return;

    const recap = renderRecap(recapData);
    clearStatus();

    // 2) enrich
    const [blogRes, donateRes] = await Promise.allSettled([
      fetchBlog(gt),
      fetchDonateStats(),
    ]);
    if (token !== _runToken) return;

    if (blogRes.status === "fulfilled") renderBlog(blogRes.value);
    if (donateRes.status === "fulfilled") renderDonate(donateRes.value);
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${String(err?.message || err)}`);
  } finally {
    if (token === _runToken) setLoading(false);
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

// Tweet latest
if (tweetLatestBtn) {
  tweetLatestBtn.addEventListener("click", () => {
    const latest = lastRenderedJournalPlain?.[0] || "";
    if (!latest) return;
    window.open(buildTweetUrl(latest), "_blank", "noopener,noreferrer");
  });
}

// ✅ CONNECT
if (signinBtn) {
  signinBtn.href = getOpenXblSigninUrl();
  signinBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = getOpenXblSigninUrl();
  });
}

// Sign out
if (signoutBtn) {
  signoutBtn.addEventListener("click", async () => {
    const gt = (localStorage.getItem(LS_AUTH_GT) || "").trim();
    if (!gt) {
      setSignedOutUiState();
      return;
    }

    setStatus("Signing out…");

    try {
      await signOutWorker(gt);
    } catch (e) {
      // Even if Worker fails, user still wants to sign out locally
      console.error(e);
    }

    localStorage.removeItem(LS_AUTH_GT);
    authGamertag = "";
    setSignedOutUiState();

    setStatus("Signed out ✅");
    setTimeout(clearStatus, 1400);
  });
}

// === INIT ===
(function init() {
  setEmbedModeIfNeeded();

  // Auth UI: independent of what recap you view
  refreshAuthUiFromStorageOnly();

  // open embed default
  if (openEmbedLink) {
    openEmbedLink.href = `${window.location.origin}${window.location.pathname}?embed=1`;
  }
  if (openEmbedLink2) {
    openEmbedLink2.href = `${window.location.origin}${window.location.pathname}?embed=1`;
  }

  const params = new URLSearchParams(window.location.search);
  const gt = params.get("gamertag");

  if (gt && gamertagInput) {
    gamertagInput.value = gt;
    run(gt);
  } else {
    fetchDonateStats().then(renderDonate).catch(() => {});
  }
})();
