const StudySession = (() => {
  let timer = null;
  let startedAt = null;
  let pausedAt = null;
  let pausedMs = 0;
  let running = false;
  let goalReachedNotified = false;

  function format(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function elapsedMs() {
    if (!startedAt) return 0;
    if (!running && pausedAt) {
      return pausedAt - startedAt - pausedMs;
    }
    return Date.now() - startedAt - pausedMs;
  }

  function getGoalMinutes() {
    return Math.max(1, Number(document.getElementById("session-goal")?.value) || 60);
  }

  function updateGoalBar(ms) {
    const ring = document.getElementById("session-ring-progress");
    const text = document.getElementById("session-progress-text");
    const banner = document.getElementById("session-goal-banner");
    if (!ring || !text || !banner) return;

    const goal = getGoalMinutes() * 60000;
    const pct = Math.min(100, Math.round((ms / goal) * 100));
    const r = 102;
    const c = 2 * Math.PI * r;
    const progress = Math.max(0, Math.min(1, ms / goal));
    ring.style.strokeDasharray = `${c}`;
    ring.style.strokeDashoffset = `${c * (1 - progress)}`;
    text.textContent = `${pct}% of goal`;
    
    // Show banner when goal reached
    const goalReached = ms >= goal;
    banner.style.display = goalReached ? "block" : "none";
    
    // Notify when goal reached (once)
    if (goalReached && !goalReachedNotified && running) {
      goalReachedNotified = true;
      window.showToast?.("🎉 Study goal reached! Great work!", "success", 3000);
      
      // Play a subtle notification sound if available
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBQLSKDf8sFuIwUrgc7y2Yk2CBhkuezooVARDEyl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVC0ig3/LBbiMFK4HO8tmJNggYZLns6KFQEQxMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQtIoN/ywW4jBSuBzvLZiTYIGGS57OihUBEMTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBULSKDf8sFuIwUrgc7y2Yk2CBhkuezooVARDEyl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVC0ig3/LBbiMFK4HO8tmJNggYZLns6KFQEQxMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQtIoN/ywW4jBSuBzvLZiTYIGGS57OihUBEMTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBULSKDf8sFuIwUrgc7y2Yk2CBhkuezooVARDEyl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVC0ig3/LBbiMFK4HO8tmJNggYZLns6KFQEQxMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQtIoN/ywW4jBSuBzvLZiTYIGGS57OihUBEMTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBULSKDf8sFuIwUrgc7y2Yk2CBhkuezooVARDEyl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVC0ig3/LBbiMFK4HO8tmJNggYZLns6KFQEQxMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQtIoN/ywW4jBQ==');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore if audio fails
      } catch (e) {
        // Ignore audio errors
      }
    }
  }

  function tick() {
    const clock = document.getElementById("session-clock");
    if (!clock) {
      clearInterval(timer);
      timer = null;
      running = false;
      return;
    }

    const ms = elapsedMs();
    clock.textContent = format(ms);
    updateGoalBar(ms);
    
    // Update document title with timer
    if (running) {
      document.title = `${format(ms)} - Study Session - CP4`;
    }
  }

  function addTimeToDayMeta(minutes) {
    const settings = Store.settings.get();
    const wd = Utils.getCurrentWeekAndDay(settings.startDate);
    if (!wd) return;
    const key = Utils.getWeekDayKey(wd.week, wd.day);
    const cur = Store.dayMeta.getDay(key);
    Store.dayMeta.setDay(key, {
      ...cur,
      timeMinutes: (cur.timeMinutes || 0) + minutes
    });
  }

  function saveSession(ms, note) {
    const actualMinutes = Math.max(1, Math.round(ms / 60000));
    const item = {
      id: Utils.generateId(),
      date: Utils.getTodayKey(),
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date().toISOString(),
      actualMinutes,
      goalMinutes: getGoalMinutes(),
      notes: note || ""
    };
    Store.studySessions.add(item);
    addTimeToDayMeta(actualMinutes);
    window.showToast?.(`Study session saved: ${Utils.formatTime(actualMinutes)}`, "success");
  }

  function endSession() {
    if (!startedAt) {
      window.showToast?.("No active session to end", "warning");
      return;
    }
    
    // Pause if running
    if (running) {
      pausedAt = Date.now();
      running = false;
      clearInterval(timer);
      timer = null;
    }
    
    const ms = elapsedMs();
    
    // Don't allow ending sessions less than 1 minute
    if (ms < 60000) {
      window.showToast?.("Session must be at least 1 minute to save", "warning");
      return;
    }

    const summary = `Session duration: ${format(ms)}. Save this session?`;
    const title = document.getElementById("generic-title");
    const body = document.getElementById("generic-body");
    const ok = document.getElementById("generic-ok");

    title.textContent = "End Study Session";
    body.innerHTML = `
      <p>${Utils.escapeHtml(summary)}</p>
      <label style="display:grid;gap:6px;margin-top:10px"><span>Notes (optional)</span>
      <textarea id="session-end-note" class="input" rows="4" placeholder="What did you study? Any insights?"></textarea></label>
      <div class="row-wrap" style="margin-top:10px;gap:8px">
        <button id="session-discard" class="btn" type="button">Discard</button>
        <button id="session-save" class="btn btn-primary" type="button">Save Session</button>
      </div>
    `;
    ok.style.display = "none";
    Modal.openModal("modal-generic");

    body.querySelector("#session-discard")?.addEventListener(
      "click",
      () => {
        Modal.closeModal("modal-generic");
        ok.style.display = "inline-flex";
        resetSession();
        window.showToast?.("Session discarded", "warning");
      },
      { once: true }
    );

    body.querySelector("#session-save")?.addEventListener(
      "click",
      () => {
        const note = body.querySelector("#session-end-note")?.value || "";
        saveSession(ms, note);
        Modal.closeModal("modal-generic");
        ok.style.display = "inline-flex";
        resetSession();
        renderHistory();
      },
      { once: true }
    );
  }

  function resetSession() {
    clearInterval(timer);
    timer = null;
    running = false;
    startedAt = null;
    pausedAt = null;
    pausedMs = 0;
    goalReachedNotified = false;
    
    const clock = document.getElementById("session-clock");
    const startBtn = document.getElementById("session-start");
    if (clock) clock.textContent = "00:00:00";
    if (startBtn) startBtn.textContent = "Start";
    updateGoalBar(0);
    
    // Reset document title
    document.title = "CP4";
  }

  function startPauseResume() {
    if (!startedAt) {
      // Start new session
      startedAt = Date.now();
      pausedMs = 0;
      pausedAt = null;
      running = true;
      goalReachedNotified = false;
      timer = setInterval(tick, 1000);
      document.getElementById("session-start").textContent = "Pause";
      tick();
      window.showToast?.("Study session started", "success", 1500);
      return;
    }

    if (running) {
      // Pause
      pausedAt = Date.now();
      running = false;
      clearInterval(timer);
      timer = null;
      document.getElementById("session-start").textContent = "Resume";
      document.title = "CP4 - Paused";
      window.showToast?.("Session paused", "info", 1500);
    } else {
      // Resume
      pausedMs += Date.now() - pausedAt;
      pausedAt = null;
      running = true;
      timer = setInterval(tick, 1000);
      document.getElementById("session-start").textContent = "Pause";
      tick();
      window.showToast?.("Session resumed", "success", 1500);
    }
  }

  function renderHistory() {
    const list = document.getElementById("session-history");
    if (!list) return;
    const today = Store.studySessions.getToday();
    if (!today.length) {
      list.innerHTML = '<div class="empty-state">No study sessions today.</div>';
    } else {
      const totalToday = today.reduce((sum, s) => sum + (s.actualMinutes || 0), 0);
      list.innerHTML = `
        <div class="card" style="background: var(--primary-dim); border-left: 3px solid var(--primary)">
          <strong>Today's Total: ${Utils.formatTime(totalToday)}</strong>
        </div>
        ${today
          .slice()
          .reverse()
          .slice(0, 8)
          .map(
            (s) => {
              const startTime = new Date(s.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const goalMet = s.actualMinutes >= s.goalMinutes;
              return `<div class="card card-muted">
                <div class="row-wrap space-between">
                  <span><strong>${Utils.formatTime(s.actualMinutes)}</strong> ${goalMet ? '✅' : ''}</span>
                  <span class="muted">${startTime}</span>
                </div>
                ${s.notes ? `<p class="muted" style="margin-top:4px">${Utils.escapeHtml(s.notes)}</p>` : ''}
              </div>`;
            }
          )
          .join("")}
      `;
    }

    const dayMap = {};
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dayMap[key] = 0;
    }

    Store.studySessions.getAll().forEach((s) => {
      if (dayMap[s.date] !== undefined) dayMap[s.date] += s.actualMinutes || 0;
    });

    const labels = Object.keys(dayMap).map((k) => {
      const date = new Date(k);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = Object.values(dayMap);
    Charts.buildWeeklyTimeChart("chart-session-week", labels, data);
  }

  function init(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;

    root.innerHTML = `
      <div class="grid-2">
        <section class="card">
          <div class="timer-main">
            <div class="timer-ring-wrap">
              <svg class="timer-ring" viewBox="0 0 240 240" aria-hidden="true">
                <circle class="timer-ring-track" cx="120" cy="120" r="102"></circle>
                <circle id="session-ring-progress" class="timer-ring-progress session-ring" cx="120" cy="120" r="102"></circle>
              </svg>
              <div class="timer-center">
                <div class="timer-label">Study Session</div>
                <div class="session-time" id="session-clock">00:00:00</div>
                <small id="session-progress-text" class="muted">0% of goal</small>
              </div>
            </div>
            <div class="session-goal-row">
              <label><span>Goal (minutes)</span><input id="session-goal" class="input" type="number" min="1" max="480" value="90"></label>
            </div>
            <div id="session-goal-banner" class="badge success timer-goal-badge" style="display:none">🎉 Goal reached!</div>
            <div class="row-wrap" style="margin-top:6px;gap:8px">
              <button id="session-start" class="btn btn-primary" type="button">Start</button>
              <button id="session-end" class="btn" type="button">End Session</button>
              <button id="session-reset" class="btn btn-danger" type="button" style="display:none">Reset</button>
            </div>
          </div>
        </section>

        <section class="card">
          <h3>Today's Sessions</h3>
          <div id="session-history" class="form-grid"></div>
        </section>
      </div>

      <section class="card">
        <h3>Last 7 Days</h3>
        <div class="chart-wrap"><canvas id="chart-session-week"></canvas></div>
      </section>
    `;

    document.getElementById("session-start")?.addEventListener("click", startPauseResume);
    document.getElementById("session-end")?.addEventListener("click", endSession);
    document.getElementById("session-reset")?.addEventListener("click", () => {
      if (confirm("Reset current session? This will discard unsaved progress.")) {
        resetSession();
        window.showToast?.("Session reset", "info");
      }
    });
    document.getElementById("session-goal")?.addEventListener("input", () => {
      updateGoalBar(elapsedMs());
      goalReachedNotified = false; // Reset notification when goal changes
    });

    // Show/hide reset button based on session state
    setInterval(() => {
      const resetBtn = document.getElementById("session-reset");
      if (resetBtn) {
        resetBtn.style.display = startedAt ? "inline-flex" : "none";
      }
    }, 500);

    renderHistory();
  }

  return { init, resetSession };
})();

window.StudySession = StudySession;
