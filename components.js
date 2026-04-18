(() => {
  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function pickUnlocked(items, count) {
    return (Array.isArray(items) ? items : []).filter((item) => item && item.unlocked).slice(0, count);
  }

  function pickBadgeImage(item) {
    const candidates = [
      item?.imageUrl,
      item?.image,
      item?.iconUrl,
      item?.assetUrl,
      item?.icon,
    ];
    for (const value of candidates) {
      if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) return value.trim();
    }
    return null;
  }

  function fallbackBadgeGlyph(item) {
    const icon = String(item?.icon || "").trim();
    if (icon) return icon;
    const name = String(item?.name || "?").trim();
    return name ? name[0].toUpperCase() : "?";
  }

  function badgeTile(item) {
    const title = esc(item?.name || "Unknown");
    const desc = esc(item?.desc || "");
    const level = String(item?.level || "").trim().toLowerCase();
    const levelText = esc(item?.levelLabel || "");
    const rankText = item?.rank ? ` • rank #${esc(item.rank)}` : "";
    const tooltip = `${title}${levelText ? ` • ${levelText}` : ""}${rankText}${desc ? ` — ${desc}` : ""}`;
    const imageUrl = pickBadgeImage(item);
    const cls = `badgeTile${level ? ` is-${level}` : ""}`;

    if (imageUrl) {
      return `<span class="${cls}" title="${tooltip}"><img class="badgeTileImg" src="${esc(imageUrl)}" alt="${title}" loading="lazy" /></span>`;
    }

    return `<span class="${cls}" title="${tooltip}"><span class="badgeTileFallback">${esc(fallbackBadgeGlyph(item))}</span></span>`;
  }

  function summaryText(badges, milestones) {
    const unlockedBadges = pickUnlocked(badges, 99).length;
    const unlockedMilestones = pickUnlocked(milestones, 99).length;
    return `${unlockedBadges} badges and ${unlockedMilestones} milestones unlocked.`;
  }

  function footText(badges, milestones) {
    const recent = [...pickUnlocked(badges, 2), ...pickUnlocked(milestones, 2)].slice(0, 2);
    if (!recent.length) return "Link Xbox and keep generating to unlock profile badges here.";
    return `Latest unlocks: ${recent.map((item) => item.name).join(", ")}`;
  }

  window.XRComponents = {
    badgeTile,
    renderBadgeBox(root, badges, milestones, displayed) {
      if (!root) return;

      const strip = root.querySelector("#badgeStrip, .badgeStrip");
      const text = root.querySelector(".badgeText");
      const foot = root.querySelector("#badgeRailFoot, .badgeFoot");

      const visible = Array.isArray(displayed) && displayed.length
        ? displayed.slice(0, 7)
        : [...pickUnlocked(badges, 7), ...pickUnlocked(milestones, 7)].slice(0, 7);

      if (strip) {
        strip.innerHTML = visible.length
          ? visible.map((item) => badgeTile(item)).join("")
          : Array.from({ length: 7 }, () => `<span class="badgeTile isPlaceholder"><span class="badgeTileFallback">?</span></span>`).join("");
      }

      if (text) text.textContent = summaryText(badges, milestones);
      if (foot) foot.textContent = footText(badges, milestones);
    },
  };
})();
