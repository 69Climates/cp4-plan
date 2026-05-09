const Heatmap = (() => {
  const LEVEL_CLASSES = ["lvl-0", "lvl-1", "lvl-2", "lvl-3", "lvl-4"];
  const selectedYearByContainer = {};
  const NUMBER_FORMAT = new Intl.NumberFormat("en-US");
  // Keep hover dates anchored to local calendar days instead of UTC boundaries.

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function toLocalDateKey(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = pad2(date.getMonth() + 1);
    const d = pad2(date.getDate());
    return `${y}-${m}-${d}`;
  }

  function utcDateKeyToLocalDateKey(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key || ""))) return "";
    const d = new Date(`${key}T00:00:00Z`);
    return toLocalDateKey(d);
  }

  function isDateKey(key) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(key || ""));
  }

  function dateKeyToDate(key) {
    if (!isDateKey(key)) return null;
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function shiftDays(date, delta) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatInt(value) {
    return NUMBER_FORMAT.format(Math.max(0, Number(value) || 0));
  }

  function withNoun(value, singular, plural = `${singular}s`) {
    const safe = Math.max(0, Number(value) || 0);
    return `${formatInt(safe)} ${safe === 1 ? singular : plural}`;
  }

  function normalizeScoreMap(countMap) {
    const map = {};
    Object.entries(countMap || {}).forEach(([key, val]) => {
      if (!isDateKey(key)) return;
      const n = Number(val) || 0;
      if (n > 0) {
        map[key] = n;
      }
    });
    return map;
  }

  function keyInRange(key, start, end) {
    const date = dateKeyToDate(key);
    if (!date || !start || !end) return false;
    return date >= start && date <= end;
  }

  function countActiveDays(scoreMap, start, end) {
    return Object.keys(scoreMap).filter((key) => keyInRange(key, start, end)).length;
  }

  function longestStreak(scoreMap, start, end) {
    if (!start || !end || start > end) return 0;

    let best = 0;
    let cur = 0;
    const cursor = new Date(start);

    while (cursor <= end) {
      const key = toLocalDateKey(cursor);
      if ((scoreMap[key] || 0) > 0) {
        cur += 1;
        if (cur > best) best = cur;
      } else {
        cur = 0;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return best;
  }

  function getCodeforcesSolveDateKeys(problems) {
    const keys = [];

    (problems || []).forEach((problem) => {
      const status = String(problem.status || "").toLowerCase();
      if (!problem.solvedAt && !["solved", "upsolved"].includes(status)) {
        return;
      }

      const source = problem.solvedAt || problem.createdAt;
      const key = source ? toLocalDateKey(new Date(source)) : "";
      if (key) keys.push(key);
    });

    return keys;
  }

  function countSolveKeysInRange(keys, start, end) {
    return keys.filter((key) => keyInRange(key, start, end)).length;
  }

  function buildSummaryHtml({ isCodeforcesMode, problems, scoreMap }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yearStart = shiftDays(today, -364);
    const monthStart = shiftDays(today, -29);

    const activeKeys = Object.keys(scoreMap).sort();
    const allTimeStart = activeKeys.length ? dateKeyToDate(activeKeys[0]) : today;

    const streakAll = longestStreak(scoreMap, allTimeStart, today);
    const streakYear = longestStreak(scoreMap, yearStart, today);
    const streakMonth = longestStreak(scoreMap, monthStart, today);

    let totalAll;
    let totalYear;
    let totalMonth;
    let totalNoun;
    let totalAllCaption;
    let totalYearCaption;
    let totalMonthCaption;

    if (isCodeforcesMode) {
      const solveKeys = getCodeforcesSolveDateKeys(problems);
      totalAll = solveKeys.length;
      totalYear = countSolveKeysInRange(solveKeys, yearStart, today);
      totalMonth = countSolveKeysInRange(solveKeys, monthStart, today);
      totalNoun = "problem";
      totalAllCaption = "solved for all time";
      totalYearCaption = "solved for the last year";
      totalMonthCaption = "solved for the last month";
    } else {
      totalAll = activeKeys.length;
      totalYear = countActiveDays(scoreMap, yearStart, today);
      totalMonth = countActiveDays(scoreMap, monthStart, today);
      totalNoun = "active day";
      totalAllCaption = "with activity for all time";
      totalYearCaption = "with activity for the last year";
      totalMonthCaption = "with activity for the last month";
    }

    const cards = [
      {
        value: withNoun(totalAll, totalNoun),
        note: totalAllCaption
      },
      {
        value: withNoun(totalYear, totalNoun),
        note: totalYearCaption
      },
      {
        value: withNoun(totalMonth, totalNoun),
        note: totalMonthCaption
      },
      {
        value: withNoun(streakAll, "day"),
        note: "in a row max."
      },
      {
        value: withNoun(streakYear, "day"),
        note: "in a row for the last year"
      },
      {
        value: withNoun(streakMonth, "day"),
        note: "in a row for the last month"
      }
    ];

    return `
      <div class="cf-summary" aria-label="Heatmap summary">
        ${cards
          .map(
            (card) => `
              <article class="cf-summary-item">
                <strong class="cf-summary-value">${card.value}</strong>
                <span class="cf-summary-note">${card.note}</span>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  }

  function addScore(map, key, delta) {
    if (!key || !delta) return;
    map[key] = (map[key] || 0) + delta;
  }

  function scoreToLevel(score) {
    if (score <= 0) return 0;
    if (score === 1) return 1;
    if (score <= 3) return 2;
    if (score <= 6) return 3;
    return 4;
  }

  function getCountMap(startDate, problems, dayMeta) {
    const map = {};

    (problems || []).forEach((p) => {
      const utcKey = p.solvedAt?.split("T")[0];
      if (!utcKey) return;

      addScore(map, utcKey, 1);

      const localKey = p.solvedAt ? toLocalDateKey(new Date(p.solvedAt)) : "";
      if (localKey && localKey !== utcKey) {
        addScore(map, localKey, 1);
      }
    });

    Object.entries(dayMeta || {}).forEach(([k, v]) => {
      const utcKey = Utils.getDateFromWeekDayKey(startDate, k);
      if (!utcKey) return;

      const blocks = Math.floor((v.timeMinutes || 0) / 25);
      addScore(map, utcKey, blocks);

      const localKey = utcDateKeyToLocalDateKey(utcKey);
      if (localKey && localKey !== utcKey) {
        addScore(map, localKey, blocks);
      }
    });

    return map;
  }

  function getCodeforcesCountMap(problems) {
    const map = {};

    (problems || []).forEach((p) => {
      const status = String(p.status || "").toLowerCase();
      if (!p.solvedAt && !["solved", "upsolved"].includes(status)) {
        return;
      }

      const source = p.solvedAt || p.createdAt;
      const key = source ? toLocalDateKey(new Date(source)) : "";
      addScore(map, key, 1);
    });

    return map;
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function parseYearRange(options) {
    const start = Number(options.yearStart);
    const end = Number(options.yearEnd);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) {
      return null;
    }

    return { start, end };
  }

  function resolveCodeforcesYearRange(options) {
    const currentYear = new Date().getFullYear();
    const accountCreationYear = Number(options.accountCreationYear);
    const startYear = Number.isInteger(accountCreationYear)
      ? Math.min(accountCreationYear, currentYear)
      : currentYear;

    return {
      start: startYear,
      end: currentYear
    };
  }

  function buildRange(totalDays) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - (totalDays - 1));

    const gridStart = new Date(start);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    return { start, today, gridStart };
  }

  function buildYearRange(year) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(year, 0, 1);
    start.setHours(0, 0, 0, 0);

    const yearEnd = new Date(year, 11, 31);
    yearEnd.setHours(0, 0, 0, 0);

    const end = new Date(year === today.getFullYear() ? today : yearEnd);
    const hasDays = end >= start;

    const gridStart = new Date(start);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    return { start, end, gridStart, hasDays };
  }

  function buildMonthLabels(days, columns) {
    const labels = Array(columns).fill("");
    let previous = "";

    for (let col = 0; col < columns; col += 1) {
      for (let row = 0; row < 7; row += 1) {
        const d = days[col * 7 + row];
        if (!d || !d.inRange) continue;

        if (!previous || (d.dayOfMonth <= 7 && d.month !== previous)) {
          labels[col] = d.month;
          previous = d.month;
        }
        break;
      }
    }

    return labels;
  }

  function renderYearPicker(yearRange, selectedYear) {
    const years = [];
    for (let y = yearRange.start; y <= yearRange.end; y += 1) {
      years.push(y);
    }

    return `
      <div class="cf-year-picker" aria-label="Heatmap year selector">
        ${years
          .map(
            (year) =>
              `<button class="btn btn-xs cf-year-btn ${year === selectedYear ? "is-active" : ""}" type="button" data-cf-year="${year}">${year}</button>`
          )
          .join("")}
      </div>
    `;
  }

  function bindYearPicker(root, containerId, options) {
    root.querySelectorAll("[data-cf-year]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedYearByContainer[containerId] = Number(btn.getAttribute("data-cf-year"));
        render(containerId, options);
      });
    });
  }

  function render(containerId, options = {}) {
    const root = document.getElementById(containerId);
    if (!root) return;

    const isCodeforcesMode = options.mode === "codeforces";
    const settings = Store.settings.get();
    const startDate = settings.startDate;
    const problems = options.problems || Store.problems.getAll();
    const dayMeta = options.dayMeta || Store.dayMeta.get();
    const countMap = isCodeforcesMode
      ? getCodeforcesCountMap(problems)
      : getCountMap(startDate, problems, dayMeta);
    const scoreMap = normalizeScoreMap(countMap);
    const deadDays = new Set();
    if (!isCodeforcesMode) {
      Utils.getDeadDays(startDate, problems, dayMeta).forEach((utcKey) => {
        deadDays.add(utcKey);
        const localKey = utcDateKeyToLocalDateKey(utcKey);
        if (localKey) deadDays.add(localKey);
      });
    }

    const explicitYearRange = parseYearRange(options);
    const yearRange = isCodeforcesMode ? resolveCodeforcesYearRange(options) : explicitYearRange;
    const totalDays = Number(options.totalDays || 90);

    let start;
    let end;
    let gridStart;
    let pickerHtml = "";
    let activeYear = null;

    if (yearRange) {
      const todayYear = new Date().getFullYear();
      const fallbackYear = clamp(todayYear, yearRange.start, yearRange.end);
      activeYear = clamp(
        Number(selectedYearByContainer[containerId] || fallbackYear),
        yearRange.start,
        yearRange.end
      );
      selectedYearByContainer[containerId] = activeYear;

      const range = buildYearRange(activeYear);
      start = range.start;
      end = range.end;
      gridStart = range.gridStart;
      pickerHtml = renderYearPicker(yearRange, activeYear);

      if (!range.hasDays) {
        root.innerHTML = `${pickerHtml}<div class="empty-state">Year ${activeYear} has no days yet. Activity appears as dates arrive.</div>`;
        bindYearPicker(root, containerId, options);
        return;
      }
    } else {
      const range = buildRange(totalDays);
      start = range.start;
      end = range.today;
      gridStart = range.gridStart;
    }

    const days = [];
    const cursor = new Date(gridStart);
    while (cursor <= end) {
      const key = toLocalDateKey(cursor);
      const inRange = cursor >= start;
      const score = inRange ? countMap[key] || 0 : 0;
      const month = cursor.toLocaleDateString("en-US", { month: "short" });

      days.push({
        key,
        inRange,
        score,
        month,
        dayOfMonth: cursor.getDate(),
        isDead: inRange && deadDays.has(key)
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    const columns = Math.max(1, Math.ceil(days.length / 7));
    const monthLabels = buildMonthLabels(days, columns);

    const grid = days
      .map((d) => {
        if (!d.inRange) {
          return '<span class="cf-cell cf-cell-empty" aria-hidden="true"></span>';
        }

        const levelClass = LEVEL_CLASSES[scoreToLevel(d.score)];
        const deadClass = !isCodeforcesMode && d.isDead && d.score === 0 ? " is-dead" : "";
        const title = isCodeforcesMode
          ? `${d.key}: ${d.score} submission${d.score === 1 ? "" : "s"}`
          : `${d.key} | score: ${d.score}${d.isDead ? " | dead day" : ""}`;

        return `<span class="cf-cell ${levelClass}${deadClass}" title="${title}"></span>`;
      })
      .join("");

    const summaryHtml = buildSummaryHtml({
      isCodeforcesMode,
      problems,
      scoreMap
    });

    root.innerHTML = `
      ${pickerHtml}
      <div class="cf-heatmap" aria-label="${activeYear ? `${activeYear} ${isCodeforcesMode ? "submissions" : "activity"}` : `Last ${totalDays} days activity`}">
        <div class="cf-months" style="--cf-cols:${columns}">
          <span class="cf-month-spacer"></span>
          ${monthLabels.map((m) => `<span>${m}</span>`).join("")}
        </div>
        <div class="cf-map-body">
          <div class="cf-weekdays" aria-hidden="true">
            <span></span>
            <span>Mon</span>
            <span></span>
            <span>Wed</span>
            <span></span>
            <span>Fri</span>
            <span></span>
          </div>
          <div class="cf-grid" style="--cf-cols:${columns}">
            ${grid}
          </div>
        </div>
        ${summaryHtml}
      </div>
    `;

    if (yearRange) {
      bindYearPicker(root, containerId, options);
    }
  }

  return { render };
})();

window.Heatmap = Heatmap;
