// === CONFIG ===
const WORKER_BASE = "https://falling-cake-f670.kirkjlemon.workers.dev";
const PUBLIC_KEY  = "4f6e9e47-98c9-0501-ae8a-4c078183a6dc";

// localStorage key for "who is signed in"
const SIGNED_IN_KEY = "xr_signedInGamertag";

// === DOM HELPERS (NULL SAFE) ===
function el(id) { return document.getElementById(id); }

function setText(node, value, fallback = "—") {
  if (!node) return;
  node.textContent =
    value === null || value === undefined || value === "" ? fallback : String(value);
}

function setHtml(node, html) {
  if (!node) return;
  node.innerHTML = html;
}

function show(node) {
  if (!node) return;
  node.classList.remove("hidden");
}

function hide(node) {
  if (!node) return;
  node.classList.add("hidden");
}

function setAttr(node, name, value) {
  if (!node) return;
  if (value === null || value === undefined || value === "") node.removeAttribute(name);
  else node.setAttribute(name, value);
}

function addClass(node, ...cls) {
  if (!node) return;
  node.classList.add(...cls);
}

function removeClass(node, ...cls) {
  if (!node) return;
  node.classList.remove(...cls);
}

// === SIGN-IN STORAGE ===
function getSignedInGamertag() {
  try {
    const v = localStorage.getItem(SIGNED_IN_KEY);
    return v ? String(v).trim() : "";
  } catch {
    return "";
  }
}
function setSignedInGamertag(gt) {
  try {
    const v = String(gt || "").trim();
    if (v) localStorage.setItem(SIGNED_IN_KEY, v);
  } catch {}
}
function clearSignedInGamertag() {
  try { localStorage.removeItem(SIGNED_IN_KEY); } catch {}
}

// === DOM ===
const gamertagInput = el("gamertagInput");
const generateBtn   = el("generateBtn");
const statusEl      = el("status");

const gamerCardWrap = el("gamerCardWrap");
const gamerCard     = el("gamerCard");

const profilePic = el("profilePic");
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
const openEmbedLink = el("openEmbedLink");

const exportBtn   = el("exportBtn");
const copyLinkBtn = el("copyLinkBtn");

const achievementBlock   = el("achievementBlock");
const achievementIcon    = el("achievementIcon");
const achievementName    = el("achievementName");
const achievementPercent = el("achievementPercent");
const achievementContext = el("achievementContext");

const blogEntries = el("blogEntries");

const donateTotal      = el("donateTotal");
const donateSupporters = el("donateSupporters");

const liveLink = el("liveLink");
const bbcode   = el("bbcode");
const copyLiveLinkBtn = el("copyLiveLinkBtn");
const copyBbBtn       = el("copyBbBtn");

// User area (always visible)
const userArea   = el("userArea");
const userAvatar = el("userAvatar");
const userName   = el("userName");
const userBadge  = el("userBadge");
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

// === PRE-FLIGHT ===
const CARD_IDS_THAT_SHOULD_EXIST = [
  "gamerCardWrap", "gamerCard",
  "profilePic", "gtName", "presence",
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
  "exportBtn", "copyLinkBtn", "copyLiveLinkBtn", "copyBbBtn"
];

function preflightReportMissingIds() {
  const missing = CARD_IDS_THAT_SHOULD_EXIST.filter((id) => !document.getElementById(id));
  if (missing.length) {
    setStatus(
      `Your index.html is missing ${missing.length} element(s) that the script expects:\n` +
      missing.map((m) => `• #${m}`).join("\n") +
      `\n\nFix: restore the gamer card markup (the section inside #gamerCardWrap).`
    );
    return false;
  }
  return true;
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

function setPillQuality(recap, linked) {
  if (!dataQualityPill) return;
  const q = recap?.dataQuality || (linked ? "good" : "tracking-only");
  let label = "Tracking";
  if (q === "good") label = "Full";
  if (q === "limited") label = "Limited";
  if (q === "tracking-only") label = "Tracking";
  dataQualityPill.textContent = label;
}

/**
 * IMPORTANT:
 * - "Last played" is the Xbox lastTimePlayed (can be hours/days ago).
 * - "Refreshed" is when we fetched OpenXBL (should be "now" when you load the page).
 */
function setLastUpdated(recap) {
  if (!lastUpdatedPill) return;

  const refreshed =
    recap?.lastOpenXblOkAt ||
    recap?.titleHistory?.sampledAt ||
    recap?.lastSeen ||
    null;

  const lastPlayed =
    recap?.lastPlayedAt ||
    recap?.titleHistory?.lastTimePlayed ||
    recap?.lastObservedAt ||
    null;

  const refreshedText = refreshed ? `Refreshed ${fmtDateTime(refreshed)}` : "Refreshed —";
  const playedText = lastPlayed ? `Last played ${fmtDateTime(lastPlayed)}` : "Last played —";

  lastUpdatedPill.textContent = `${refreshedText} • ${playedText}`;
}

function showCard() { show(gamerCardWrap); }
function hideCard() { hide(gamerCardWrap); }

// === USER AREA STATES ===
function setSignedInUiState({ gamertag, avatarUrl, qualityLabel }) {
  show(userArea);
  hide(signinPrompt);

  setText(userName, gamertag, "—");

  if (userAvatar) {
    if (avatarUrl) {
      userAvatar.src = avatarUrl;
      userAvatar.alt = `${gamertag} gamerpic`;
    } else {
      userAvatar.removeAttribute("src");
      userAvatar.alt = "No gamerpic";
    }
  }

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

  if (userAvatar) {
    userAvatar.removeAttribute("src");
    userAvatar.alt = "Not connected";
  }
  setText(userName, "Not connected", "Not connected");

  if (userBadge) {
    removeClass(userBadge, "good", "limited", "off");
    addClass(userBadge, "off");
    userBadge.textContent = "Not connected";
  }

  hide(signoutBtn);
  if (signoutBtn) signoutBtn.disabled = true;

  show(signinPrompt);
}

// === NETWORK (WITH GOOD ERRORS) ===
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

// === OPTION A: REFRESH SIGNED-IN USER ON PAGE LOAD ===
function qualityLabelFromRecap(recap, linked) {
  const q = recap?.dataQuality || (linked ? "good" : "tracking-only");
  return q === "good" ? "Full" : q === "limited" ? "Limited" : "Not connected";
}

async function refreshUserAreaOnLoad() {
  const signedIn = getSignedInGamertag();
  if (!signedIn) {
    setSignedOutUiState();
    return null;
  }

  try {
    // This is the refresh. It calls your Worker for the signed-in gamertag.
    const data = await fetchRecap(signedIn);

    const gt = data?.gamertag || signedIn;
    const avatarUrl = data?.profile?.displayPicRaw || null;
    const label = qualityLabelFromRecap(data?.recap, data?.linked);

    setSignedInUiState({
      gamertag: gt,
      avatarUrl,
      qualityLabel: label,
    });

    return data; // return the signed-in recap data for optional auto-render
  } catch (e) {
    console.warn("User area refresh failed:", e);
    setSignedOutUiState();
    return null;
  }
}

// === RENDERERS (NULL SAFE) ===
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

function renderBlog(blog, recap) {
  if (!blogEntries) return;

  blogEntries.innerHTML = "";

  if (!blog?.entries?.length) {
    blogEntries.innerHTML =
      `<div class="blogLine muted">No journal entries yet — generate again tomorrow and it’ll start writing daily.</div>`;
  } else {
    for (const e of blog.entries.slice(0, 4)) {
      const div = document.createElement("div");
      div.className = "blogLine";
      div.textContent = e?.text ? e.text : `📓 ${e?.date || ""} — (missing entry)`;
      blogEntries.appendChild(div);
    }
  }

  if (recap?.journal?.policy) {
    const hint = document.createElement("div");
    hint.className = "blogLine muted";
    hint.textContent = recap.journal.policy;
    blogEntries.appendChild(hint);
  }
}

function renderDonate(ds) {
  if (!ds) return;
  if (!donateTotal || !donateSupporters) return;

  const cur = ds.currency || "GBP";
  const symbol = cur === "GBP" ? "£" : cur === "USD" ? "$" : cur === "EUR" ? "€" : "";
  donateTotal.textContent = `${symbol}${Number(ds.totalRaised || 0).toFixed(0)}`;
  donateSupporters.textContent = String(ds.supporters || 0);
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

  if (profilePic) {
    if (profile?.displayPicRaw) {
      profilePic.src = profile.displayPicRaw;
      profilePic.alt = `${gamertag} gamerpic`;
    } else {
      profilePic.removeAttribute("src");
      profilePic.alt = "No gamerpic";
    }
  }

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
  setText(favGameSessions, recap?.favouriteGameSessions ? `${recap.favouriteGameSessions} sessions` : "—");

  setText(currentStreak, recap?.currentStreak ?? "—");
  setText(longestStreak, recap?.longestStreak ? `Best: ${recap.longestStreak} days` : "—");
  setText(longestBreak, recap?.longestBreakDays ?? 0);

  setText(uniqueGames, recap?.uniqueGamesObserved ?? "—");

  const oneHitEff = recap?.oneHitWondersEffective ?? recap?.oneHitWondersCount ?? 0;
  const mature = recap?.oneHitWondersIsMature ?? false;
  setText(oneHit, mature ? `${oneHitEff} one-hit wonders` : "—");

  if (peakDay) setText(peakDay, recap?.peakDay?.date ?? "—");
  if (peakDaySub) setText(peakDaySub, recap?.peakDay?.uniqueGames != null ? `${recap.peakDay.uniqueGames} unique games` : "—");

  setText(activeWeekday, recap?.mostActiveWeekdayName ?? "—");
  setText(activeWeekdaySub, recap?.mostActiveWeekdayDays != null ? `${recap.mostActiveWeekdayDays} days` : "—");

  setText(activeMonth, recap?.mostActiveMonthName ?? "—");
  setText(activeMonthSub, recap?.mostActiveMonthDays != null ? `${recap.mostActiveMonthDays} days` : "—");

  // ✅ Tracking info now shows BOTH refreshed + last played
  if (trackingInfo) {
    const refreshed =
      recap?.lastOpenXblOkAt ||
      recap?.titleHistory?.sampledAt ||
      recap?.lastSeen ||
      null;

    const lastPlayed =
      recap?.lastPlayedAt ||
      recap?.titleHistory?.lastTimePlayed ||
      recap?.lastObservedAt ||
      null;

    const refreshedLine = refreshed ? `Refreshed: ${fmtDateTime(refreshed)}` : "Refreshed: —";
    const playedLine = lastPlayed ? `Last played: ${fmtDateTime(lastPlayed)}` : "Last played: —";

    trackingInfo.textContent =
      `First seen: ${fmtDateTime(recap?.firstSeen)} • ${refreshedLine} • ${playedLine} • Lookups: ${recap?.lookupCount ?? 0}`;
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
  // We DO NOT touch the header user area here.
  // The header is ONLY refreshed from localStorage on page load.

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
async function run(gamertag) {
  try {
    clearStatus();
    hideCard();

    if (!preflightReportMissingIds()) return;

    const gt = (gamertag || "").trim();
    if (!gt) {
      setStatus("Enter a gamertag first.");
      return;
    }

    // keep URL shareable
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
    renderBlog(blogData, recap);
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

// ✅ CONNECT (reliable)
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
    const signedIn = getSignedInGamertag();
    if (!signedIn) {
      setSignedOutUiState();
      setStatus("You’re not signed in.");
      setTimeout(clearStatus, 1400);
      return;
    }

    setStatus("Signing out…");

    try {
      await signOutWorker(signedIn);
      clearSignedInGamertag();

      try {
        const u = new URL(window.location.href);
        const currentGt = (u.searchParams.get("gamertag") || "").trim();
        if (currentGt && currentGt.toLowerCase() === signedIn.toLowerCase()) {
          u.searchParams.delete("gamertag");
          u.searchParams.delete("embed");
          window.history.replaceState({}, "", u);
          if (gamertagInput) gamertagInput.value = "";
          hideCard();
        }
      } catch {}

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
(async function init() {
  setEmbedModeIfNeeded();

  // Refresh signed-in header (Option A)
  const signedInData = await refreshUserAreaOnLoad();

  // Normal recap load:
  const params = new URLSearchParams(window.location.search);
  const gt = (params.get("gamertag") || "").trim();

  if (gt) {
    if (gamertagInput) gamertagInput.value = gt;
    run(gt);
    return;
  }

  // ✅ FIX: if no gamertag in URL but user is signed in, auto-load their recap
  const signedIn = getSignedInGamertag();
  if (signedIn) {
    if (gamertagInput) gamertagInput.value = signedIn;

    // If we already fetched it for the header refresh, reuse it to render instantly
    // (still fetch blog/donate in parallel)
    if (signedInData && signedInData?.gamertag) {
      try {
        hideCard();
        setStatus("Loading your recap…");

        const [blogData, donateData] = await Promise.all([
          fetchBlog(signedIn),
          fetchDonateStats(),
        ]);

        const recap = renderRecap(signedInData);
        renderBlog(blogData, recap);
        renderDonate(donateData);

        clearStatus();
      } catch (e) {
        // fallback: just run normally
        run(signedIn);
      }
    } else {
      run(signedIn);
    }

    return;
  }

  // Signed out landing
  fetchDonateStats().then(renderDonate).catch(() => {});
  if (openEmbedLink) {
    openEmbedLink.href = `${window.location.origin}${window.location.pathname}?embed=1`;
  }
})();
