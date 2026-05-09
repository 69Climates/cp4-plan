const DashboardPage = (() => {
  let initialized = false;

  function currentWeekDayText() {
    const settings = Store.settings.get();
    const wd = Utils.getCurrentWeekAndDay(settings.startDate);
    if (!wd) return "Set start date";
    return `Week ${wd.week} Day ${wd.day}`;
  }

  function findTodayPlan() {
    const settings = Store.settings.get();
    const wd = Utils.getCurrentWeekAndDay(settings.startDate);
    if (!wd) return null;
    const week = SEED_DATA.weeks.find((w) => w.weekNum === wd.week);
    const day = week?.days.find((d) => d.dayNum === wd.day);
    if (!week || !day) return null;
    return { week, day, wdKey: Utils.getWeekDayKey(wd.week, wd.day) };
  }

  function renderOverview() {
    const problems = Store.problems.getAll();
    const sections = Store.sections.get();
    const completion = Utils.calculateBookCompletion(sections, Object.keys(sections).length || 1);
    document.getElementById("dash-overview").innerHTML = `
      <h3>Overview</h3>
      <div class="grid-2" style="margin-top:8px">
        <div class="card card-muted"><strong>${Object.keys(sections).length}</strong><br><small class="muted">Sections tracked</small></div>
        <div class="card card-muted"><strong>${problems.length}</strong><br><small class="muted">Problems logged</small></div>
      </div>
      <div style="margin-top:10px">Completion: ${completion}%</div>
      <div class="progress"><span style="width:${completion}%"></span></div>
    `;
  }

  function renderPace() {
    const settings = Store.settings.get();
    const sections = Store.sections.get();
    const pace = Utils.calculatePace(settings.startDate, sections, Object.keys(sections).length || 1);
    const node = document.getElementById("dash-pace");
    if (!pace) {
      node.innerHTML = '<h3>Pace Tracker</h3><div class="empty-state">Set start date in first run/settings.</div>';
      return;
    }
    const cls = pace.onTrack === "ahead" ? "success" : pace.onTrack === "behind" ? "danger" : "warning";
    node.innerHTML = `
      <h3>Pace Tracker</h3>
      <div class="badge ${cls}" style="margin-top:8px">${pace.onTrack}</div>
      <p style="margin-top:8px">Done: <strong>${pace.sectionsDone}</strong> / ${pace.totalSections}</p>
      <p>Expected: <strong>${pace.sectionsExpected}</strong></p>
      <p>Delta: <strong>${pace.daysAhead >= 0 ? "+" : ""}${pace.daysAhead}</strong></p>
      <small class="muted">Projected finish: ${Utils.formatDate(pace.projectedFinishDate)}</small>
    `;
  }

  function renderStreak() {
    const streak = Utils.calculateStreak(Store.problems.getAll());
    const todayMin = Utils.getTotalTimeTodayMinutes();
    document.getElementById("dash-streak").innerHTML = `
      <h3>Streak + Today</h3>
      <p style="margin-top:8px">Solve streak: <strong>${streak}</strong> day(s)</p>
      <p>Study today: <strong>${Utils.formatTime(todayMin)}</strong></p>
      <small class="muted">Includes pomodoro + study sessions.</small>
    `;
  }

  function renderTodayPlan() {
    const node = document.getElementById("dash-today-plan");
    const plan = findTodayPlan();
    if (!plan) {
      node.innerHTML = '<h3>Today\'s Plan</h3><div class="empty-state">No plan available yet.</div>';
      return;
    }
    const sectionState = Store.sections.get();
    const dayMeta = Store.dayMeta.getDay(plan.wdKey);
    node.innerHTML = `
      <h3>Today's Study Plan</h3>
      <p class="muted" style="margin-top:6px">${Utils.escapeHtml(plan.day.topic)}</p>
      <div class="form-grid" style="margin-top:8px">
        ${plan.day.sections
          .map((s) => `<div class=\"row-wrap\"><span class=\"status-dot ${sectionState[s.key]?.read ? "good" : "bad"}\"></span>${Utils.escapeHtml(s.title)}</div>`)
          .join("")}
      </div>
      <hr>
      <div class="row-wrap"><span class="badge">Problems +/- ${dayMeta.problemsDelta || 0}</span><span class="badge">Time ${Utils.formatTime(dayMeta.timeMinutes || 0)}</span></div>
    `;
  }

  function renderGoals() {
    const settings = Store.settings.get();
    const todayProblems = Store.problems
      .getAll()
      .filter((p) => (p.solvedAt || p.createdAt || "").startsWith(Utils.getTodayKey())).length;
    const todayTime = Utils.getTotalTimeTodayMinutes();
    const goalP = settings.dailyGoal || 3;
    const goalT = settings.timeGoal || 120;
    const pPct = Math.min(100, Math.round((todayProblems / goalP) * 100));
    const tPct = Math.min(100, Math.round((todayTime / goalT) * 100));

    document.getElementById("dash-goals").innerHTML = `
      <h3>Today's Goals</h3>
      <p style="margin-top:8px">Problems: ${todayProblems}/${goalP}</p>
      <div class="progress"><span style="width:${pPct}%"></span></div>
      <p style="margin-top:8px">Time: ${todayTime}/${goalT} min</p>
      <div class="progress"><span style="width:${tPct}%"></span></div>
    `;
  }

  function renderBookPdfLinks() {
    const node = document.getElementById("dash-book-pdfs");
    if (!node) return;

    const links = [
      {
        label: "CP4 Book Part 1 (PDF)",
        href: "/pages/pdf-viewer.html?file=/assets/pdfs/competitive-programming-book-4-p1.pdf&title=CP4%20Book%20Part%201"
      },
      {
        label: "CP4 Book Part 2 (PDF)",
        href: "/pages/pdf-viewer.html?file=/assets/pdfs/competitive-programming-book-4-p2.pdf&title=CP4%20Book%20Part%202"
      }
    ];

    node.innerHTML = `
      <h3>CP4 PDF Links</h3>
      <div class="form-grid" style="margin-top:8px">
        ${links
          .map(
            (item) => `
          <a class="btn" href="${item.href}" target="_blank" rel="noopener noreferrer">${Utils.escapeHtml(item.label)}</a>
        `
          )
          .join("")}
      </div>
      <small class="muted">Opens each PDF in a new tab.</small>
    `;
  }

  function renderTagWeakness() {
    const weak = Utils.getTagWeaknesses(Store.problems.getAll()).slice(0, 8);
    document.getElementById("dash-tag-weakness").innerHTML = weak.length
      ? `<h3>Tag Weakness Alerts</h3><div class="table-wrap"><table><thead><tr><th>Tag</th><th>Count</th><th>Solo Rate</th></tr></thead><tbody>${weak
          .map((w) => `<tr><td>${Utils.escapeHtml(w.tag)}</td><td>${w.count}</td><td>${w.soloRate}%</td></tr>`)
          .join("")}</tbody></table></div>`
      : '<h3>Tag Weakness Alerts</h3><div class="empty-state">No weak tags detected yet.</div>';
  }

  function renderDeadDays() {
    const settings = Store.settings.get();
    const dead = Utils.getDeadDays(settings.startDate, Store.problems.getAll(), Store.dayMeta.get());
    const recent = dead.slice(-28);

    document.getElementById("dash-dead-days").innerHTML = `
      <h3>Dead Days (mini)</h3>
      <div class="dead-day-grid" style="margin-top:8px">
        ${recent
          .map((d) => `<div class=\"dead-day-cell dead\" title=\"${d}\"></div>`)
          .join("")}
      </div>
      <small class="muted">Recent dead days: ${dead.length}</small>
    `;
  }

  function renderActivity() {
    const entries = [];

    Store.problems.getAll().slice(0, 6).forEach((p) => {
      entries.push({ t: p.createdAt || p.solvedAt, text: `Problem: ${p.title}` });
    });

    Store.contests.getAll().slice(0, 4).forEach((c) => {
      entries.push({ t: c.date, text: `Contest: ${c.name}` });
    });

    Store.notes.getAll().slice(0, 4).forEach((n) => {
      entries.push({ t: n.createdAt, text: `Note: ${n.title || "Untitled"}` });
    });

    entries.sort((a, b) => new Date(b.t || 0) - new Date(a.t || 0));

    document.getElementById("dash-activity").innerHTML = entries.length
      ? `<h3>Recent Activity</h3><div class="form-grid" style="margin-top:8px">${entries
          .slice(0, 10)
          .map((e) => `<div class=\"card card-muted\">${Utils.escapeHtml(e.text)} <small class=\"muted\">${Utils.formatDate(e.t)}</small></div>`)
          .join("")}</div>`
      : '<h3>Recent Activity</h3><div class="empty-state">No activity yet.</div>';
  }

  function renderUpcoming() {
    const wd = Utils.getCurrentWeekAndDay(Store.settings.get().startDate);
    if (!wd) {
      document.getElementById("dash-upcoming").innerHTML = '<h3>Upcoming</h3><div class="empty-state">Set start date first.</div>';
      return;
    }

    const nextDays = [];
    for (let i = 1; i <= 3; i += 1) {
      const dayOffset = wd.day + i;
      const week = wd.week + Math.floor((dayOffset - 1) / 7);
      const day = ((dayOffset - 1) % 7) + 1;
      const weekData = SEED_DATA.weeks.find((w) => w.weekNum === week);
      const d = weekData?.days.find((x) => x.dayNum === day);
      if (d) nextDays.push({ week, day, topic: d.topic });
    }

    document.getElementById("dash-upcoming").innerHTML = nextDays.length
      ? `<h3>Upcoming (next 3 days)</h3>${nextDays
          .map((d) => `<div class=\"card card-muted\" style=\"margin-top:8px\">W${d.week}D${d.day}: ${Utils.escapeHtml(d.topic)}</div>`)
          .join("")}`
      : '<h3>Upcoming</h3><div class="empty-state">No upcoming plan found.</div>';
  }

  function renderTimeToday() {
    const pomos = Store.pomodoroLog.getToday().filter((x) => x.type === "focus" && x.status === "completed").length;
    const sessions = Store.studySessions.getToday().length;
    document.getElementById("dash-time-today").innerHTML = `
      <h3>Time Blocks Today</h3>
      <p style="margin-top:8px">Pomodoro focus blocks: <strong>${pomos}</strong></p>
      <p>Study sessions: <strong>${sessions}</strong></p>
      <p>Total focused time: <strong>${Utils.formatTime(Utils.getTotalTimeTodayMinutes())}</strong></p>
    `;
  }

  function renderFocusQuote() {
    const q = [
      "Solve clean before solving fast.",
      "Hard problems bend to persistence.",
      "Track mistakes, then eliminate them.",
      "Understand first principles, not just templates."
    ];
    document.getElementById("dash-focus-quote").innerHTML = `<h3>Focus Quote</h3><p style=\"margin-top:8px\">${q[new Date().getDay() % q.length]}</p>`;
  }

  function renderAlerts() {
    const dead = Utils.getDeadDays(Store.settings.get().startDate, Store.problems.getAll(), Store.dayMeta.get()).length;
    const weak = Utils.getTagWeaknesses(Store.problems.getAll()).length;

    document.getElementById("dash-alerts").innerHTML = `
      <h3>Alerts</h3>
      <div class="row-wrap" style="margin-top:8px">
        <span class="badge ${dead > 10 ? "danger" : "warning"}">Dead days: ${dead}</span>
        <span class="badge ${weak > 0 ? "warning" : "success"}">Weak tags: ${weak}</span>
      </div>
    `;
  }

  function renderHeatmap() {
    document.getElementById("dash-heatmap").innerHTML = '<h3>Activity Heatmap</h3><div id="dash-heatmap-box"></div>';
    Heatmap.render("dash-heatmap-box", {
      mode: "codeforces",
      accountCreationYear: 2026
    });
  }

  function renderHabitsWidget() {
    const node = document.getElementById("dash-habits");
    if (!node) return;

    const today = Utils.getTodayKey();
    const habits = Store.habits.getActive();
    
    // Filter habits for today based on frequency patterns
    const todayHabits = habits.filter(habit => {
      const dayOfWeek = new Date().getDay();
      
      if (habit.frequency.type === "daily") {
        return true;
      } else if (habit.frequency.type === "weekdays") {
        return habit.frequency.weekdays.includes(dayOfWeek);
      } else if (habit.frequency.type === "custom") {
        const createdDate = new Date(habit.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const daysSinceCreation = Math.floor((todayDate - createdDate) / 86400000);
        
        return daysSinceCreation >= 0 && daysSinceCreation % habit.frequency.interval === 0;
      }
      return false;
    });

    if (todayHabits.length === 0) {
      node.innerHTML = `
        <h3>Today's Habits</h3>
        <div class="empty-state">No habits scheduled for today</div>
      `;
      return;
    }

    // Calculate completion status
    const completedCount = todayHabits.filter(h => Store.habits.isCompleted(h.id, today)).length;
    const totalCount = todayHabits.length;
    const percentage = Math.round((completedCount / totalCount) * 100);

    // Calculate streaks for each habit
    const habitsWithStreaks = todayHabits.map(habit => {
      const completions = Store.habits.getCompletions(habit.id);
      let streak = 0;
      
      if (completions.length > 0) {
        const completionDates = new Set(completions.map(c => c.date));
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(todayDate);
          checkDate.setDate(checkDate.getDate() - i);
          
          // Check if this day is expected based on frequency
          let isExpectedDay = false;
          const dayOfWeek = checkDate.getDay();
          
          if (habit.frequency.type === "daily") {
            isExpectedDay = true;
          } else if (habit.frequency.type === "weekdays") {
            isExpectedDay = habit.frequency.weekdays.includes(dayOfWeek);
          } else if (habit.frequency.type === "custom") {
            const createdDate = new Date(habit.createdAt);
            createdDate.setHours(0, 0, 0, 0);
            const daysSinceCreation = Math.floor((checkDate - createdDate) / 86400000);
            isExpectedDay = daysSinceCreation >= 0 && daysSinceCreation % habit.frequency.interval === 0;
          }
          
          if (isExpectedDay) {
            const dateKey = checkDate.toISOString().split("T")[0];
            const isCompleted = completionDates.has(dateKey);
            
            if (isCompleted) {
              streak++;
            } else {
              if (i > 0) {
                break;
              }
            }
          }
        }
      }
      
      return { ...habit, streak };
    });

    // Show up to 5 habits
    const displayHabits = habitsWithStreaks.slice(0, 5);
    const hasMore = todayHabits.length > 5;

    node.innerHTML = `
      <h3>Today's Habits</h3>
      <div class="row-wrap" style="margin-top:8px">
        <span class="badge">${completedCount}/${totalCount}</span>
      </div>
      <div class="progress" style="margin-top:8px">
        <span style="width:${percentage}%"></span>
      </div>
      <div class="form-grid" style="margin-top:12px">
        ${displayHabits.map(habit => {
          const isCompleted = Store.habits.isCompleted(habit.id, today);
          return `
            <div class="row-wrap space-between" style="align-items:center">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1">
                <input 
                  type="checkbox" 
                  ${isCompleted ? "checked" : ""}
                  data-habit-id="${habit.id}"
                  data-date="${today}"
                  class="dash-habit-checkbox"
                >
                <span style="font-size:1.2em">${habit.icon || "📋"}</span>
                <span 
                  class="dash-habit-name" 
                  data-habit-id="${habit.id}"
                  style="cursor:pointer;flex:1"
                >${Utils.escapeHtml(habit.name)}</span>
              </label>
              ${habit.streak > 0 ? `<span class="badge" style="font-size:0.85em">🔥 ${habit.streak}</span>` : ""}
            </div>
          `;
        }).join("")}
      </div>
      ${hasMore ? `
        <button 
          class="btn" 
          style="margin-top:12px;width:100%" 
          id="dash-view-all-habits"
        >View all ${totalCount} habits</button>
      ` : ""}
    `;

    // Bind event handlers
    bindHabitsWidgetEvents();
  }

  function bindHabitsWidgetEvents() {
    // Handle checkbox toggles
    document.querySelectorAll(".dash-habit-checkbox").forEach(checkbox => {
      checkbox.addEventListener("change", (e) => {
        const habitId = e.target.dataset.habitId;
        const date = e.target.dataset.date;
        
        if (e.target.checked) {
          Store.habits.addCompletion(habitId, date);
        } else {
          Store.habits.deleteCompletion(habitId, date);
        }
        
        // Re-render the widget to update progress and streaks
        renderHabitsWidget();
      });
    });

    // Handle habit name clicks - navigate to habits page
    document.querySelectorAll(".dash-habit-name").forEach(nameEl => {
      nameEl.addEventListener("click", () => {
        if (window.App?.navigate) {
          window.App.navigate("habits");
        }
      });
    });

    // Handle "View all X habits" button
    const viewAllBtn = document.getElementById("dash-view-all-habits");
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", () => {
        if (window.App?.navigate) {
          window.App.navigate("habits");
        }
      });
    }
  }

  function bindLostButton() {
    document.getElementById("dash-im-lost")?.addEventListener("click", () => {
      Modal.showConfirm(
        "Open Week Plan and jump to current day checklist?",
        () => window.App?.navigate("weekplan"),
        () => {}
      );
    });
  }

  function render() {
    document.getElementById("dash-weekday-badge").textContent = currentWeekDayText();
    renderOverview();
    renderPace();
    renderStreak();
    renderTodayPlan();
    renderGoals();
    renderBookPdfLinks();
    renderTagWeakness();
    renderDeadDays();
    renderActivity();
    renderUpcoming();
    renderTimeToday();
    renderFocusQuote();
    renderAlerts();
    renderHeatmap();
    renderHabitsWidget();
    bindLostButton();
  }

  function init() {
    initialized = true;
    render();
  }

  return {
    init,
    onShow: render,
    isInitialized: () => initialized
  };
})();

window.DashboardPage = DashboardPage;
