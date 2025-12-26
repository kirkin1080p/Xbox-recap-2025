/**
 * ExportScript.js
 * Creates a NEW 970x540 PNG on a canvas (NOT a screenshot of the page).
 * Intended for forum signatures: consistent sizing, crisp text, controlled background.
 *
 * Requires: DOM to be present; reads values from existing page elements by ID.
 */

(function () {
  "use strict";

  const W = 970;
  const H = 540;

  const $ = (id) => document.getElementById(id);

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

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

  function ExportToPNG() {
    // If your main script exposes setStatus/clearStatus, use them; otherwise noop.
    const setStatus = (window.setStatus || function () {});
    const clearStatus = (window.clearStatus || function () {});

    clearStatus();
    setStatus("Rendering PNG…");

    // Source elements (existing recap UI)
    const gt = (($("gtName")?.textContent || "").trim() || "Player");
    const presenceText = (($("presence")?.textContent || "").trim() || "");

    const pillQuality = (($("dataQualityPill")?.textContent || "").trim() || "");
    const pillUpdated = (($("lastUpdatedPill")?.textContent || "").trim() || "");

    const stats = [
      { k: "Gamerscore",          v: ($("gamerscore")?.textContent || "—").trim(),       s: ($("gamerscoreDelta")?.textContent || "—").trim() },
      { k: "Days played",         v: ($("daysPlayed")?.textContent || "—").trim(),       s: ($("playRange")?.textContent || "—").trim() },
      { k: "Favourite",           v: ($("favGame")?.textContent || "—").trim(),          s: ($("favGameSessions")?.textContent || "—").trim() },

      { k: "Unique games",        v: ($("uniqueGames")?.textContent || "—").trim(),      s: ($("oneHit")?.textContent || "—").trim() },
      { k: "Current streak",      v: ($("currentStreak")?.textContent || "—").trim(),    s: ($("longestStreak")?.textContent || "—").trim() },
      { k: "Longest break",       v: ($("longestBreak")?.textContent || "—").trim(),     s: "days" },

      { k: "Peak day",            v: ($("peakDay")?.textContent || "—").trim(),          s: ($("peakDaySub")?.textContent || "—").trim() },
      { k: "Most active weekday", v: ($("activeWeekday")?.textContent || "—").trim(),    s: ($("activeWeekdaySub")?.textContent || "—").trim() },
      { k: "Most active month",   v: ($("activeMonth")?.textContent || "—").trim(),      s: ($("activeMonthSub")?.textContent || "—").trim() },
    ];

    const achName = ($("achievementName")?.textContent || "").trim();
    const achMeta1 = ($("achievementPercent")?.textContent || "").trim();
    const achMeta2 = ($("achievementContext")?.textContent || "").trim();
    const achIconUrl = ($("achievementIcon") && !$("achievementIcon").classList.contains("hidden")) ? $("achievementIcon").src : null;

    // profile pic (prefer real pic, else use fallback letter)
    const profilePic = $("profilePic");
    const pfpUrl = (profilePic && profilePic.style.display !== "none" && profilePic.src) ? profilePic.src : null;

    // Canvas draw (async for images)
    (async () => {
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setStatus("PNG export failed: canvas unsupported.");
        return;
      }

      // Load images (may fail if CORS is blocked; we gracefully fallback)
      const [pfpImg, achImg] = await Promise.all([
        loadImageSafe(pfpUrl),
        loadImageSafe(achIconUrl),
      ]);

      // --- helpers ---
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
        if (lines.length) lines[lines.length - 1] = ellipsize(lines[lines.length - 1], maxWidth, font);
        ctx.restore();
        return lines.slice(0, maxLines);
      }

      // --- Background (Xbox-ish vibe, no logos) ---
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

      const pSize = 58;
      const pX = headerX;
      const pY = headerY + 6;

      // ring
      ctx.beginPath();
      ctx.arc(pX + pSize/2, pY + pSize/2, pSize/2 + 3, 0, Math.PI*2);
      ctx.strokeStyle = "rgba(14,205,17,0.55)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // avatar
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

      // watermark
      ctx.fillStyle = "rgba(245,246,247,0.35)";
      ctx.font = "600 11px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      const wm = "xboxrecap";
      const wmw = ctx.measureText(wm).width;
      ctx.fillText(wm, shellX + shellW - 16 - wmw, shellY + shellH - 18);

      // download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `xbox-recap-${gt.replace(/\s+/g, "-").toLowerCase()}-sig.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setStatus("PNG exported ✅");
      setTimeout(() => clearStatus(), 1400);
    })().catch((err) => {
      console.error(err);
      setStatus("Export failed. Check console.");
    });
  }

  // Expose for debugging
  window.ExportToPNG = ExportToPNG;

  // Bind button
  const btn = $("exportBtn");
  if (btn) {
    btn.addEventListener("click", ExportToPNG);
  } else {
    console.warn("[ExportScript] exportBtn not found");
  }
})();
