// === CONFIG ===
const WORKER_BASE = "https://falling-cake-f670.kirkjlemon.workers.dev";
const PUBLIC_KEY  = "4f6e9e47-98c9-0501-ae8a-4c078183a6dc";

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

// === AVATAR (PFP) HELPERS ===
// Shows Xbox gamerpic when available, otherwise shows first letter fallback (like before).
function firstLetter(gt) {
  const s = (gt || "").trim();
  return s ? s[0].toUpperCase() : "?";
}

function setAvatarImage(imgEl, fallbackEl, gamertag, url) {
  if (fallbackEl) fallbackEl.textContent = firstLetter(gamertag);
  if (!imgEl) return;

  const wrap = typeof imgEl.closest === "function" ? imgEl.closest(".avatarWrap") : null;

  imgEl.onload = null;
  imgEl.onerror = null;

  if (!url) {
    imgEl.removeAttribute("src");
    imgEl.alt = "";
    if (wrap) wrap.classList.remove("hasImage");
    return;
  }

  imgEl.src = url;
  imgEl.alt = `${gamertag} gamerpic`;

  imgEl.onload = () => { if (wrap) wrap.classList.add("hasImage"); };
  imgEl.onerror = () => {
    imgEl.removeAttribute("src");
    imgEl.alt = "";
    if (wrap) wrap.classList.remove("hasImage");
  };
}

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

const signinPrompt = el("signinPrompt");
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
const userAvatarFallback = el("userAvatarFallback");
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

// === PRE-FLIGHT (ONLY RUN ON GENERATE) ===
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

function setSignedInUiState({ gamertag, avatarUrl, qualityLabel }) {
  show(userArea);
  hide(signinPrompt);

  setText(userName, gamertag, "—");
  setAvatarImage(userAvatar, userAvatarFallback, gamertag, avatarUrl || null);

  if (userBadge) {
    removeClass(userBadge, "good", "limited", "off");
    userBadge.textContent = qualityLabel || "Connected";
    addClass(userBadge, qualityLabel === "Full" ? "good" : qualityLabel === "Limited" ? "limited" : "off");
  }

  show(signoutBtn);
  if (signoutBtn) signoutBtn.disabled = false;
}

function setSignedOutUiState() {
  show(userArea);

  setAvatarImage(userAvatar, userAvatarFallback, "?", null);
  if (userAvatar) userAvatar.alt = "Not connected";

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
  if (!ds || !donateTotal || !donateSupporters) return;
  const cur = ds.currency || "GBP";
  const symbol = cur === "GBP" ? "£" : cur === "USD" ? "$" : cur === "EUR" ? "€" : "";
  donateTotal.textContent = `${symbol}${Number(ds.totalRaised || 0).toFixed(0)}`;
  donateSupporters.textContent = String(ds.supporters || 0);
}

function setPillQuality(recap, linked) {
  if (!dataQualityPill) return;
  const q = recap?.dataQuality || (linked ? "good" : "tracking-only");
  let label = "Tracking";
  if (q === "good") label = "Full";
  if (q === "limited") label = "Limited";
  dataQualityPill.textContent = label;
}

function setLastUpdated(recap) {
  if (!lastUpdatedPill) return;
  const observed = recap?.lastObservedAt || null;
  const refreshed = recap?.lastSeen || null;

  if (observed) lastUpdatedPill.textContent = `Last observed ${fmtDateTime(observed)}`;
  else lastUpdatedPill.textContent = `Last refreshed ${fmtDateTime(refreshed)}`;
}

function showCard() { show(gamerCardWrap); }
function hideCard() { hide(gamerCardWrap); }

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

  setAvatarImage(profilePic, profilePicFallback, gamertag, profile?.displayPicRaw || null);

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
    trackingInfo.textContent = `First seen: ${fmtDateTime(recap?.firstSeen)} • ${observedLine} • Lookups: ${recap?.lookupCount ?? 0}`;
  }

  setPillQuality(recap, linked);
  setLastUpdated(recap);

  const urls = buildShareUrls(gamertag);
  if (liveLink) liveLink.value = urls.embed;
  if (bbcode) bbcode.value = `[url=${urls.embed}]Xbox Recap Card[/url]`;
  if (openEmbedLink) openEmbedLink.href = urls.embed;

  renderAchievement(recap);
  showCard();

  const quality =
    recap?.dataQuality === "good" ? "Full" :
    recap?.dataQuality === "limited" ? "Limited" :
    linked ? "Connected" : "Not connected";

  if (linked) {
    setSignedInUiState({
      gamertag,
      avatarUrl: profile?.displayPicRaw || null,
      qualityLabel: quality,
    });
  } else {
    setSignedOutUiState();
  }

  return recap;
}

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

// === EVENTS (ONLY IF ELEMENT EXISTS) ===
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

// ✅ CONNECT (ABSOLUTELY RELIABLE)
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
    const gt =
      (gamertagInput?.value || "").trim() ||
      (gtName?.textContent || "").trim();

    if (!gt || gt === "—") {
      setStatus("No gamertag to sign out.");
      setTimeout(clearStatus, 1400);
      return;
    }

    setStatus("Signing out…");

    try {
      await signOutWorker(gt);

      try {
        const u = new URL(window.location.href);
        u.searchParams.delete("gamertag");
        u.searchParams.delete("embed");
        window.history.replaceState({}, "", u);
      } catch {}

      if (gamertagInput) gamertagInput.value = "";
      hideCard();
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
  setSignedOutUiState();

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
