// === CONFIG ===
const WORKER_BASE = "https://falling-cake-f670.kirkjlemon.workers.dev";
const PUBLIC_KEY  = "4f6e9e47-98c9-0501-ae8a-4c078183a6dc";
const SIGNED_IN_KEY = "xr_signedInGamertag";

// === DOM HELPERS (NULL SAFE) ===
function el(id) { return document.getElementById(id); }
function show(node){ if(node) node.classList.remove("hidden"); }
function hide(node){ if(node) node.classList.add("hidden"); }
function setText(node, value, fallback="—"){
  if(!node) return;
  node.textContent = (value === null || value === undefined || value === "") ? fallback : String(value);
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
  } catch { return "—"; }
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

// === STORAGE ===
function getSignedInGamertag(){
  try{ return (localStorage.getItem(SIGNED_IN_KEY) || "").trim(); } catch { return ""; }
}
function clearSignedInGamertag(){
  try{ localStorage.removeItem(SIGNED_IN_KEY); } catch {}
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
const nowPlaying = el("nowPlaying");
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

const liveLink = el("liveLink");
const bbcode   = el("bbcode");
const copyLiveLinkBtn = el("copyLiveLinkBtn");
const copyBbBtn       = el("copyBbBtn");

// User area
const userArea   = el("userArea");
const userAvatar = el("userAvatar");
const userAvatarFallback = el("userAvatarFallback");
const userName   = el("userName");
const userBadge  = el("userBadge");
const signoutBtn = el("signoutBtn");

// === STATUS ===
function setStatus(msg){
  if(!statusEl) return;
  show(statusEl);
  statusEl.textContent = msg;
}
function clearStatus(){
  if(!statusEl) return;
  hide(statusEl);
  statusEl.textContent = "";
}

// === URL BUILDERS ===
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

// === NETWORK ===
async function fetchJsonOrText(url, init){
  const res = await fetch(url, init);
  const text = await res.text();
  let data = null;
  try{ data = JSON.parse(text); } catch {}
  return { res, text, data };
}
async function fetchRecap(gamertag){
  const url = `${WORKER_BASE}/?gamertag=${encodeURIComponent(gamertag)}`;
  const {res, text, data} = await fetchJsonOrText(url);
  if(!res.ok){
    const msg = (data && data.error) ? data.error : (text || `HTTP ${res.status}`);
    throw new Error(`Worker recap failed (${res.status}): ${msg}`);
  }
  return data;
}
async function fetchBlog(gamertag){
  const url = `${WORKER_BASE}/blog?gamertag=${encodeURIComponent(gamertag)}&limit=7`;
  const {res, data} = await fetchJsonOrText(url);
  if(!res.ok) return null;
  return data;
}
async function signOutWorker(gamertag){
  const {res, data, text} = await fetchJsonOrText(`${WORKER_BASE}/signout`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ gamertag })
  });
  if(!res.ok){
    const msg = (data && data.error) ? data.error : (text || `HTTP ${res.status}`);
    throw new Error(`Sign out failed (${res.status}): ${msg}`);
  }
  return data;
}

// === AVATAR FALLBACKS ===
function initialsFromGamertag(gt){
  const s = String(gt || "").trim();
  if(!s) return "X";
  const alnum = s.replace(/[^a-z0-9]/ig,"");
  if(!alnum) return s.slice(0,1).toUpperCase();
  return alnum.slice(0,2).toUpperCase();
}

/**
 * Apply a robust gamerpic fallback:
 * - If url missing -> fallback immediately
 * - If image errors -> fallback
 * - Adds a CSS class to wrapper to show fallback layer
 */
function applyAvatar({ imgEl, fallbackEl, wrapEl, url, label }) {
  const fallbackText = initialsFromGamertag(label);

  if (fallbackEl) fallbackEl.textContent = fallbackText;

  // reset state
  if (wrapEl) wrapEl.classList.remove("avatar-failed", "pfp-failed");

  if (!imgEl) return;

  imgEl.onload = () => {
    if (wrapEl) wrapEl.classList.remove("avatar-failed", "pfp-failed");
  };

  imgEl.onerror = () => {
    if (wrapEl) {
      // decide which class to use based on the wrapper type
      if (wrapEl.classList.contains("userAvatarWrap")) wrapEl.classList.add("avatar-failed");
      else wrapEl.classList.add("pfp-failed");
    }
  };

  if (!url) {
    // No URL -> fallback
    if (wrapEl) {
      if (wrapEl.classList.contains("userAvatarWrap")) wrapEl.classList.add("avatar-failed");
      else wrapEl.classList.add("pfp-failed");
    }
    imgEl.removeAttribute("src");
    return;
  }

  imgEl.src = url;
}

// === USER AREA ===
function setSignedOutUiState(){
  show(userArea);
  setText(userName, "Not connected");
  if(userBadge){
    userBadge.textContent = "Not connected";
    userBadge.className = "userBadge off";
  }
  hide(signoutBtn);
  show(signinPrompt);

  // avatar fallback
  const wrap = userAvatar?.closest(".userAvatarWrap");
  applyAvatar({
    imgEl: userAvatar,
    fallbackEl: userAvatarFallback,
    wrapEl: wrap,
    url: null,
    label: "X",
  });
}

function setSignedInUiState({ gamertag, avatarUrl, qualityLabel }){
  show(userArea);
  hide(signinPrompt);

  setText(userName, gamertag);

  if(userBadge){
    userBadge.textContent = qualityLabel || "Connected";
    userBadge.className =
      "userBadge " + (qualityLabel === "Full" ? "good" : qualityLabel === "Limited" ? "limited" : "off");
  }

  show(signoutBtn);

  const wrap = userAvatar?.closest(".userAvatarWrap");
  applyAvatar({
    imgEl: userAvatar,
    fallbackEl: userAvatarFallback,
    wrapEl: wrap,
    url: avatarUrl,
    label: gamertag,
  });
}

function qualityLabelFromRecap(recap, linked){
  const q = recap?.dataQuality || (linked ? "good" : "tracking-only");
  return q === "good" ? "Full" : q === "limited" ? "Limited" : "Not connected";
}

// Option A: refresh signed-in user on page load (and keep header correct)
async function refreshUserAreaOnLoad(){
  const signedIn = getSignedInGamertag();
  if(!signedIn){
    setSignedOutUiState();
    return null;
  }
  try{
    const data = await fetchRecap(signedIn);
    const gt = data?.gamertag || signedIn;
    const avatarUrl = data?.profile?.displayPicRaw || null;
    const label = qualityLabelFromRecap(data?.recap, data?.linked);
    setSignedInUiState({ gamertag: gt, avatarUrl, qualityLabel: label });
    return data;
  } catch (e){
    console.warn("Header refresh failed:", e);
    setSignedOutUiState();
    return null;
  }
}

// === RENDERERS ===
function setPillQuality(recap, linked){
  if(!dataQualityPill) return;
  const q = recap?.dataQuality || (linked ? "good" : "tracking-only");
  dataQualityPill.textContent = q === "good" ? "Full" : q === "limited" ? "Limited" : "Tracking";
}

function setLastUpdated(recap){
  if(!lastUpdatedPill) return;

  const refreshed =
    recap?.lastOpenXblOkAt ||
    recap?.titleHistory?.sampledAt ||
    recap?.lastSeen ||
    null;

  const lastConfirmed =
    recap?.lastPlayedAt ||
    recap?.titleHistory?.lastTimePlayed ||
    recap?.lastObservedAt ||
    null;

  const refreshedText = refreshed ? `Refreshed ${fmtDateTime(refreshed)}` : "Refreshed —";
  const playedText = lastConfirmed ? `Last confirmed play ${fmtDateTime(lastConfirmed)}` : "Last confirmed play —";

  lastUpdatedPill.textContent = `${refreshedText} • ${playedText}`;
}

function renderAchievement(recap){
  if(!achievementBlock) return;

  const rarestEver = recap?.achievements?.rarestEver;
  const fallback = recap?.achievements;

  const name = rarestEver?.name || fallback?.rarestName || null;
  const pct  = rarestEver?.percent ?? fallback?.rarestPercent ?? null;
  const icon = rarestEver?.icon || fallback?.rarestIcon || null;
  const title = rarestEver?.titleName || fallback?.lastTitleName || null;

  if(!name && !icon && pct == null){
    hide(achievementBlock);
    return;
  }
  show(achievementBlock);

  if(achievementIcon){
    if(icon){
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

function renderBlog(blog, recap){
  if(!blogEntries) return;
  blogEntries.innerHTML = "";

  if(!blog?.entries?.length){
    blogEntries.innerHTML = `<div class="blogLine muted">No journal entries yet.</div>`;
    return;
  }

  // Note: your worker currently writes markdown-ish **bold** into text.
  // We keep it as-is; if you want it "pretty", we can format it later.
  for(const e of blog.entries.slice(0, 4)){
    const div = document.createElement("div");
    div.className = "blogLine";
    div.textContent = e?.text || `📓 ${e?.date || ""} — (missing entry)`;
    blogEntries.appendChild(div);
  }

  if(recap?.journal?.policy){
    const hint = document.createElement("div");
    hint.className = "blogLine muted";
    hint.textContent = recap.journal.policy;
    blogEntries.appendChild(hint);
  }
}

function renderRecap(data){
  const { gamertag, profile, recap, linked } = data;

  setText(gtName, gamertag);

  // Live now-playing (presence)
  const presenceText = profile?.presenceText || "";
  const nowLine = (presenceText && /^Playing\s+/i.test(presenceText))
    ? `Now playing (live): ${presenceText.replace(/^Playing\s+/i, "")}`
    : "Now playing (live): —";
  setText(nowPlaying, nowLine);

  // Confirmed last played (Title History)
  const lastPlayedName =
    recap?.lastPlayedGame ||
    recap?.titleHistory?.lastTitleName ||
    null;

  const lastPlayedAt =
    recap?.lastPlayedAt ||
    recap?.titleHistory?.lastTimePlayed ||
    null;

  const confirmedLine = lastPlayedName
    ? `Last confirmed: ${lastPlayedName} • ${fmtDateTime(lastPlayedAt)}`
    : "Last confirmed: —";

  setText(presence, confirmedLine);

  // Card gamerpic with fallback
  const pfpWrap = profilePic?.closest(".pfpWrap");
  applyAvatar({
    imgEl: profilePic,
    fallbackEl: profilePicFallback,
    wrapEl: pfpWrap,
    url: profile?.displayPicRaw || null,
    label: gamertag,
  });

  setText(gamerscore, recap?.gamerscoreCurrent ?? profile?.gamerscore ?? "—");

  if(gamerscoreDelta){
    gamerscoreDelta.textContent =
      recap?.gamerscoreDelta != null ? `+${recap.gamerscoreDelta} since tracking`
      : (linked ? "Delta unknown" : "Connect Xbox for delta");
  }

  setText(daysPlayed, recap?.daysPlayedCount ?? "—");

  const range =
    recap?.firstPlayDay && recap?.lastPlayDay ? `${recap.firstPlayDay} → ${recap.lastPlayDay}`
    : recap?.firstSeen ? `Tracking since ${fmtDateTime(recap.firstSeen)}`
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
  setText(oneHit, mature ? `${oneHitEff} one-hit wonders` : "0 one-hit wonders");

  setText(peakDay, recap?.peakDay?.date ?? "—");
  setText(peakDaySub, recap?.peakDay?.uniqueGames != null ? `${recap.peakDay.uniqueGames} unique games` : "—");

  setText(activeWeekday, recap?.mostActiveWeekdayName ?? "—");
  setText(activeWeekdaySub, recap?.mostActiveWeekdayDays != null ? `${recap.mostActiveWeekdayDays} days` : "—");

  setText(activeMonth, recap?.mostActiveMonthName ?? "—");
  setText(activeMonthSub, recap?.mostActiveMonthDays != null ? `${recap.mostActiveMonthDays} days` : "—");

  // Tracking line (clear and non-misleading)
  if(trackingInfo){
    const refreshed =
      recap?.lastOpenXblOkAt ||
      recap?.titleHistory?.sampledAt ||
      recap?.lastSeen ||
      null;

    const lastConfirmed =
      recap?.lastPlayedAt ||
      recap?.titleHistory?.lastTimePlayed ||
      null;

    trackingInfo.textContent =
      `First seen: ${fmtDateTime(recap?.firstSeen)} • Refreshed: ${fmtDateTime(refreshed)} • Last confirmed play: ${fmtDateTime(lastConfirmed)} • Lookups: ${recap?.lookupCount ?? 0}`;
  }

  setPillQuality(recap, linked);
  setLastUpdated(recap);
  renderAchievement(recap);

  // Share URLs
  const urls = buildShareUrls(gamertag);
  if(liveLink) liveLink.value = urls.embed;
  if(bbcode) bbcode.value = `[url=${urls.embed}]Xbox Recap Card[/url]`;
  if(openEmbedLink) openEmbedLink.href = urls.embed;
  if(openEmbedLink2) openEmbedLink2.href = urls.embed;

  show(gamerCardWrap);
  return recap;
}

// === EXPORT ===
async function exportCardAsPng(){
  clearStatus();
  if(!window.html2canvas){ setStatus("PNG export library failed to load."); return; }
  if(!gamerCard){ setStatus("Card element missing."); return; }

  setStatus("Rendering PNG…");

  const imgs = gamerCard.querySelectorAll("img");
  await Promise.all([...imgs].map((img)=>{
    if(!img.src) return Promise.resolve();
    if(img.complete) return Promise.resolve();
    return new Promise((res)=>{ img.onload=()=>res(); img.onerror=()=>res(); });
  }));

  const canvas = await window.html2canvas(gamerCard,{
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });

  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `xbox-recap-${(gtName?.textContent || "player").replace(/\s+/g,"-")}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setStatus("PNG exported ✅");
  setTimeout(clearStatus, 1600);
}

// === MAIN ===
async function run(gamertag){
  try{
    clearStatus();
    hide(gamerCardWrap);

    const gt = (gamertag || "").trim();
    if(!gt){ setStatus("Enter a gamertag first."); return; }

    // keep URL shareable
    try{
      const u = new URL(window.location.href);
      u.searchParams.set("gamertag", gt);
      window.history.replaceState({}, "", u);
    } catch {}

    setStatus("Loading recap…");

    const [recapData, blogData] = await Promise.all([
      fetchRecap(gt),
      fetchBlog(gt),
    ]);

    const recap = renderRecap(recapData);
    renderBlog(blogData, recap);

    clearStatus();
  } catch (err){
    console.error(err);
    setStatus(`JS crashed: ${String(err?.message || err)}\nOpen DevTools Console for details.`);
  }
}

// === EVENTS ===
if(generateBtn) generateBtn.addEventListener("click", ()=>run(gamertagInput?.value || ""));
if(gamertagInput){
  gamertagInput.addEventListener("keydown",(e)=>{
    if(e.key === "Enter") run(gamertagInput.value);
  });
}

if(exportBtn) exportBtn.addEventListener("click", exportCardAsPng);
if(copyLinkBtn){
  copyLinkBtn.addEventListener("click", ()=>{
    const url = new URL(window.location.href);
    copyToClipboard(url.toString());
  });
}
if(copyLiveLinkBtn && liveLink) copyLiveLinkBtn.addEventListener("click", ()=>copyToClipboard(liveLink.value || ""));
if(copyBbBtn && bbcode) copyBbBtn.addEventListener("click", ()=>copyToClipboard(bbcode.value || ""));

// Connect
if(signinBtn){
  signinBtn.href = getOpenXblSigninUrl();
  signinBtn.addEventListener("click",(e)=>{
    e.preventDefault();
    window.location.href = getOpenXblSigninUrl();
  });
}

// Sign out
if(signoutBtn){
  signoutBtn.addEventListener("click", async ()=>{
    const signedIn = getSignedInGamertag();
    if(!signedIn){
      setSignedOutUiState();
      setStatus("You’re not signed in.");
      setTimeout(clearStatus, 1200);
      return;
    }
    setStatus("Signing out…");
    try{
      await signOutWorker(signedIn);
      clearSignedInGamertag();
      setSignedOutUiState();

      // if they were viewing their own recap, clear it
      try{
        const u = new URL(window.location.href);
        const currentGt = (u.searchParams.get("gamertag") || "").trim();
        if(currentGt && currentGt.toLowerCase() === signedIn.toLowerCase()){
          u.searchParams.delete("gamertag");
          u.searchParams.delete("embed");
          window.history.replaceState({}, "", u);
          if(gamertagInput) gamertagInput.value = "";
          hide(gamerCardWrap);
        }
      } catch {}

      setStatus("Signed out ✅");
      setTimeout(clearStatus, 1200);
    } catch (e){
      console.error(e);
      setStatus(String(e?.message || "Sign out failed"));
    }
  });
}

// === INIT ===
(async function init(){
  // header refresh (Option A)
  const signedInData = await refreshUserAreaOnLoad();

  const params = new URLSearchParams(window.location.search);
  const gt = (params.get("gamertag") || "").trim();

  if(gt){
    if(gamertagInput) gamertagInput.value = gt;
    run(gt);
    return;
  }

  // ✅ If signed in and no URL gamertag, auto-load signed-in recap
  const signedIn = getSignedInGamertag();
  if(signedIn){
    if(gamertagInput) gamertagInput.value = signedIn;

    // reuse signedInData to render instantly (still gets blog fresh)
    if(signedInData && signedInData?.gamertag){
      try{
        hide(gamerCardWrap);
        setStatus("Loading your recap…");

        const blogData = await fetchBlog(signedIn);

        const recap = renderRecap(signedInData);
        renderBlog(blogData, recap);

        clearStatus();
        return;
      } catch {
        // fallback
      }
    }
    run(signedIn);
    return;
  }

  // Signed out landing
  setSignedOutUiState();
})();
