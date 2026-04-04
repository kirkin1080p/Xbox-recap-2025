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

  function badgeChip(item) {
    const klass = item?.category === "milestone" ? "miniMilestone" : "miniBadge";
    const icon = item?.icon ? `${esc(item.icon)} ` : "";
    const name = esc(item?.name || "Unknown");
    return `<span class="${klass}" title="${esc(item?.desc || "")}">${icon}${name}</span>`;
  }

  function summaryText(badges, milestones) {
    const unlockedBadges = pickUnlocked(badges, 99).length;
    const unlockedMilestones = pickUnlocked(milestones, 99).length;
    return `${unlockedBadges} badge${unlockedBadges === 1 ? "" : "s"} and ${unlockedMilestones} milestone${unlockedMilestones === 1 ? "" : "s"} unlocked.`;
  }

  function footText(badges, milestones) {
    const recent = [...pickUnlocked(badges, 2), ...pickUnlocked(milestones, 2)].slice(0, 2);
    if (!recent.length) return "Keep generating recaps and linking Xbox to start unlocking profile flex.";
    return `Latest unlocks: ${recent.map((item) => item.name).join(", ")}`;
  }

  window.XRComponents = {
    renderBadgeBox(root, badges, milestones) {
      if (!root) return;

      const groups = root.querySelectorAll(".badgeGroup .badgeRow");
      const badgeRow = groups[0] || null;
      const milestoneRow = groups[1] || null;
      const text = root.querySelector(".badgeText");
      const foot = root.querySelector(".badgeFoot");

      const badgeItems = pickUnlocked(badges, 5);
      const milestoneItems = pickUnlocked(milestones, 5);

      if (badgeRow) {
        badgeRow.innerHTML = badgeItems.length
          ? badgeItems.map((item) => badgeChip(item)).join("")
          : `<span class="miniBadge">Link Xbox to start unlocking badges</span>`;
      }

      if (milestoneRow) {
        milestoneRow.innerHTML = milestoneItems.length
          ? milestoneItems.map((item) => badgeChip(item)).join("")
          : `<span class="miniMilestone">Play tracked days to unlock milestones</span>`;
      }

      if (text) text.textContent = summaryText(badges, milestones);
      if (foot) foot.textContent = footText(badges, milestones);
    },
  };
})();
