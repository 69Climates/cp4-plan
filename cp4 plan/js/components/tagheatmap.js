const TagHeatmap = (() => {
  function parseTags(problem) {
    if (!problem.tags) return [];
    if (Array.isArray(problem.tags)) return problem.tags;
    return String(problem.tags)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function daysSince(dateKey) {
    if (!dateKey) return null;
    const now = new Date();
    const then = new Date(dateKey);
    now.setHours(0, 0, 0, 0);
    then.setHours(0, 0, 0, 0);
    return Math.floor((now - then) / 86400000);
  }

  function borderByRecency(lastDate) {
    if (!lastDate) return "var(--border)";
    const d = daysSince(lastDate);
    if (d <= 6) return "var(--success)";
    if (d <= 13) return "var(--warning)";
    return "var(--danger)";
  }

  function render(containerId, options = {}) {
    const root = document.getElementById(containerId);
    if (!root) return;

    const mode = options.mode || "all";
    const onClick = options.onClick || (() => {});
    const data = {};

    const settings = Store.settings.get();
    const current = Utils.getCurrentWeekAndDay(settings.startDate);
    const problems = Store.problems.getAll();

    let selected = problems;
    if (mode === "week" && current) {
      const weekPrefix = `w${current.week}`;
      selected = problems.filter((p) => String(p.week || "").startsWith(String(current.week)) || p.weekRef?.startsWith(weekPrefix));
    }

    selected.forEach((p) => {
      const solvedDate = p.solvedAt?.split("T")[0] || p.createdAt?.split("T")[0] || null;
      parseTags(p).forEach((tag) => {
        if (!data[tag]) data[tag] = { count: 0, last: null };
        data[tag].count += 1;
        if (!data[tag].last || (solvedDate && solvedDate > data[tag].last)) {
          data[tag].last = solvedDate;
        }
      });
    });

    const tags = Object.keys(data).sort((a, b) => data[b].count - data[a].count);
    if (!tags.length) {
      root.innerHTML = '<div class="empty-state">No tags yet.</div>';
      return;
    }

    const max = Math.max(...tags.map((t) => data[t].count));

    root.innerHTML = tags
      .map((tag) => {
        const d = data[tag];
        const intensity = Math.max(0.12, d.count / Math.max(1, max));
        return `
          <button class="tag-cell" type="button" data-tag="${Utils.escapeHtml(tag)}"
            style="border-color:${borderByRecency(d.last)};background:color-mix(in srgb,var(--primary) ${Math.round(intensity * 70)}%, var(--card));">
            <div>${Utils.escapeHtml(tag)}</div>
            <small class="muted">${d.count} problem(s)</small>
          </button>
        `;
      })
      .join("");

    root.querySelectorAll("[data-tag]").forEach((el) => {
      el.addEventListener("click", () => onClick(el.getAttribute("data-tag")));
    });
  }

  return { render };
})();

window.TagHeatmap = TagHeatmap;
