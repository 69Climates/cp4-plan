const StatsPage = (() => {
  let initialized = false;

  function toggleSections() {
    document.querySelectorAll(".stats-title").forEach((btn) => {
      btn.addEventListener("click", () => {
        const block = btn.parentElement;
        block.classList.toggle("show");
        if (block.classList.contains("show")) {
          renderSection(block.dataset.statsKey);
        }
      });
    });
  }

  function cumulativeSectionCompletionByWeek() {
    const sections = Store.sections.get();
    const labels = [];
    const data = [];
    let running = 0;
    let totalSeen = 0;

    SEED_DATA.weeks.forEach((w) => {
      const keys = w.days.flatMap((d) => d.sections.map((s) => s.key));
      totalSeen += keys.length;
      running += keys.filter((k) => sections[k]?.read).length;
      labels.push(`W${w.weekNum}`);
      data.push(totalSeen ? Math.round((running / totalSeen) * 100) : 0);
    });

    return { labels, data };
  }

  function renderOverviewCards() {
    const sections = Store.sections.get();
    const problems = Store.problems.getAll();
    const contests = Store.contests.getAll();
    const completion = Utils.calculateBookCompletion(sections, Object.keys(sections).length || 1);
    const streak = Utils.calculateStreak(problems);
    const focused = Utils.getTotalTimeTodayMinutes();

    document.getElementById("stats-overview-cards").innerHTML = `
      <article class="card card-muted"><strong>${completion}%</strong><br><small class="muted">Book completion</small></article>
      <article class="card card-muted"><strong>${problems.length}</strong><br><small class="muted">Problems</small></article>
      <article class="card card-muted"><strong>${contests.length}</strong><br><small class="muted">Contests</small></article>
      <article class="card card-muted"><strong>${streak}</strong><br><small class="muted">Current streak</small></article>
      <article class="card card-muted"><strong>${focused}m</strong><br><small class="muted">Focused today</small></article>
      <article class="card card-muted"><strong>${Store.quickCaptures.getAll().filter((c) => !c.isReviewed).length}</strong><br><small class="muted">Capture inbox</small></article>
    `;
  }

  function updateStatsBadge() {
    const sections = Store.sections.get();
    const settings = Store.settings.get();
    const totalSections = Object.keys(sections).length || 1;
    const pace = Utils.calculatePace(settings.startDate, sections, totalSections);
    document.getElementById("stats-total").textContent = pace
      ? `Pace: ${pace.onTrack} (${pace.sectionsDone}/${pace.totalSections})`
      : "Set start date for pace tracking";
  }

  function renderPaceChart() {
    const sections = Store.sections.get();
    const settings = Store.settings.get();
    const keysByWeek = SEED_DATA.weeks.map((w) => w.days.flatMap((d) => d.sections.map((s) => s.key)));
    const labels = SEED_DATA.weeks.map((w) => `Week ${w.weekNum}`);

    let actualCumulative = 0;
    let targetCumulative = 0;
    const target = [];
    const actual = [];

    const totalSections = Object.keys(sections).length || 1;
    const pace = Utils.calculatePace(settings.startDate, sections, totalSections);

    // Calculate target based on actual weekly sections in seed data
    keysByWeek.forEach((keys, i) => {
      // Target is cumulative count of sections up to this week
      targetCumulative += keys.length;
      target.push(targetCumulative);
      
      // Actual is cumulative count of completed sections
      actualCumulative += keys.filter((k) => sections[k]?.read).length;
      actual.push(actualCumulative);
    });

    // Add pace info card
    const paceInfo = document.getElementById('pace-info-card');
    if (paceInfo && pace) {
      const daysAhead = pace.sectionsDone - pace.sectionsExpected;
      const percentComplete = Math.round((pace.sectionsDone / pace.totalSections) * 100);
      const weeksRemaining = 14 - pace.currentWeek + 1;
      const sectionsPerWeek = Math.ceil((pace.totalSections - pace.sectionsDone) / Math.max(1, weeksRemaining));
      
      let statusClass = 'on-track';
      let statusIcon = '✓';
      let statusText = 'On Track';
      
      if (daysAhead > 2) {
        statusClass = 'ahead';
        statusIcon = '↑';
        statusText = 'Ahead';
      } else if (daysAhead < -2) {
        statusClass = 'behind';
        statusIcon = '↓';
        statusText = 'Behind';
      }
      
      paceInfo.innerHTML = `
        <div class="pace-status ${statusClass}">
          <div class="pace-status-icon">${statusIcon}</div>
          <div class="pace-status-text">${statusText}</div>
        </div>
        <div class="pace-details">
          <div class="pace-detail-item">
            <span class="pace-label">Progress</span>
            <span class="pace-value">${percentComplete}%</span>
            <div class="pace-bar"><span style="width: ${percentComplete}%"></span></div>
          </div>
          <div class="pace-detail-item">
            <span class="pace-label">Completed</span>
            <span class="pace-value">${pace.sectionsDone} / ${pace.totalSections}</span>
          </div>
          <div class="pace-detail-item">
            <span class="pace-label">Current Week</span>
            <span class="pace-value">Week ${pace.currentWeek}, Day ${pace.currentDay}</span>
          </div>
          <div class="pace-detail-item">
            <span class="pace-label">Sections ${daysAhead >= 0 ? 'Ahead' : 'Behind'}</span>
            <span class="pace-value ${daysAhead >= 0 ? 'positive' : 'negative'}">${Math.abs(daysAhead)}</span>
          </div>
          <div class="pace-detail-item">
            <span class="pace-label">Needed Per Week</span>
            <span class="pace-value">${sectionsPerWeek} sections</span>
          </div>
          <div class="pace-detail-item">
            <span class="pace-label">Projected Finish</span>
            <span class="pace-value">${Utils.formatDate(pace.projectedFinishDate)}</span>
          </div>
        </div>
      `;
    }

    Charts.buildPaceChart("chart-pace", labels, target, actual);
  }

  function renderProblemCharts() {
    const problems = Store.problems.getAll();
    Charts.buildProblemStatusChart("chart-problem-status", problems);
    Charts.buildProblemMethodChart("chart-problem-method", problems);
  }

  function renderContestCharts() {
    const contests = Store.contests.getAll();
    Charts.buildContestScoreChart("chart-contest-score", contests);
  }

  function renderWeeklyReportCards() {
    const root = document.getElementById("weekly-report-cards");
    const sections = Store.sections.get();
    const problems = Store.problems.getAll();
    const dayMeta = Store.dayMeta.get();
    const startDate = Store.settings.get().startDate;

    root.innerHTML = SEED_DATA.weeks
      .map((w) => {
        const grade = Utils.calculateWeekGrade(w.weekNum, sections, w, problems, startDate, dayMeta);
        const done = w.days.flatMap((d) => d.sections).filter((s) => sections[s.key]?.read).length;
        const total = w.days.flatMap((d) => d.sections).length;
        return `
          <article class="card card-muted">
            <div class="row-wrap space-between">
              <strong>Week ${w.weekNum}</strong>
              <span class="week-grade">${grade}</span>
            </div>
            <small class="muted">${Utils.escapeHtml(w.title)}</small>
            <div style="margin-top:6px">Sections: ${done}/${total}</div>
            <div class="progress"><span style="width:${Math.round((done / Math.max(1, total)) * 100)}%"></span></div>
          </article>
        `;
      })
      .join("");
  }

  function renderTagWeaknessTable() {
    const body = document.getElementById("tag-weakness-table");
    const rows = Utils.getTagWeaknesses(Store.problems.getAll());
    body.innerHTML = rows.length
      ? rows
          .map((r) => `<tr><td>${Utils.escapeHtml(r.tag)}</td><td>${r.count}</td><td>${r.soloRate}%</td></tr>`)
          .join("")
      : '<tr><td colspan="3" class="muted">No weakness tags found.</td></tr>';
  }

  function renderDeadHeatmap() {
    Heatmap.render("stats-heatmap");
  }

  function renderAdditionalCharts() {
    const solvedByWeek = Array.from({ length: 14 }, (_, i) => {
      const weekNum = i + 1;
      return Store.problems
        .getAll()
        .filter((p) => Number(p.week) === weekNum && ["solved", "upsolved"].includes(p.status)).length;
    });

    // Optional hidden charts can be reused in future pages.
    const hiddenWrapId = "stats-hidden-charts";
    let hidden = document.getElementById(hiddenWrapId);
    if (!hidden) {
      hidden = document.createElement("div");
      hidden.id = hiddenWrapId;
      hidden.style.display = "none";
      hidden.innerHTML = `
        <canvas id="chart-hidden-a"></canvas>
        <canvas id="chart-hidden-b"></canvas>
        <canvas id="chart-hidden-c"></canvas>
        <canvas id="chart-hidden-d"></canvas>
        <canvas id="chart-hidden-e"></canvas>
        <canvas id="chart-hidden-f"></canvas>
        <canvas id="chart-hidden-g"></canvas>
      `;
      document.getElementById("stats-page")?.appendChild(hidden);
    }

    const labels = SEED_DATA.weeks.map((w) => `W${w.weekNum}`);
    const sectionSeries = cumulativeSectionCompletionByWeek();

    Charts.buildWeeklyProblemsChart("chart-hidden-a", labels, solvedByWeek);
    Charts.buildSectionCompletionChart("chart-hidden-b", sectionSeries.labels, sectionSeries.data);

    const diffMap = { easy: 0, medium: 0, hard: 0 };
    Object.values(Store.sections.get()).forEach((s) => {
      if (s.difficulty && diffMap[s.difficulty] !== undefined) diffMap[s.difficulty] += 1;
    });
    Charts.buildDifficultyChart("chart-hidden-c", Object.keys(diffMap), Object.values(diffMap));

    const tagCount = {};
    Store.problems.getAll().forEach((p) => {
      (p.tags || []).forEach((t) => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    Charts.buildTagCountChart(
      "chart-hidden-d",
      topTags.map((x) => x[0]),
      topTags.map((x) => x[1])
    );

    const contests = Store.contests.getAll().slice(0, 12).reverse();
    Charts.buildContestRankChart(
      "chart-hidden-e",
      contests.map((c) => c.name || "Contest"),
      contests.map((c) => Number(c.rank || 0))
    );

    Charts.buildSolvesByWeekChart("chart-hidden-f", labels, solvedByWeek);
    Charts.buildStreakChart(
      "chart-hidden-g",
      Array.from({ length: 7 }, (_, i) => `D-${6 - i}`),
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().split("T")[0];
        return Store.problems
          .getAll()
          .filter((p) => ["solved", "upsolved"].includes(p.status) && (p.solvedAt || "").startsWith(key)).length;
      })
    );
  }

  function renderSection(key) {
    switch (key) {
      case "overview":
        renderOverviewCards();
        break;
      case "pace":
        renderPaceChart();
        break;
      case "problems":
        renderProblemCharts();
        break;
      case "contests":
        renderContestCharts();
        break;
      case "weeks":
        renderWeeklyReportCards();
        break;
      case "tags":
        renderTagWeaknessTable();
        break;
      case "dead-days":
        renderDeadHeatmap();
        break;
      default:
        break;
    }
  }

  function renderVisibleSections() {
    document.querySelectorAll(".stats-block.show").forEach((block) => {
      renderSection(block.dataset.statsKey);
    });
  }

  function render() {
    updateStatsBadge();
    renderVisibleSections();
    renderAdditionalCharts();
  }

  function init() {
    initialized = true;
    toggleSections();
    render();
  }

  return {
    init,
    onShow: render,
    isInitialized: () => initialized
  };
})();

window.StatsPage = StatsPage;
