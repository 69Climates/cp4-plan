const StudySession = (() => {
  let timer = null;
  let startedAt = null;
  let pausedAt = null;
  let pausedMs = 0;
  let running = false;

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
    banner.style.display = ms >= goal ? "block" : "none";
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
    window.showToast?.("Study session saved", "success");
  }

  function endSession() {
    if (!startedAt) return;
    if (running) {
      running = false;
      clearInterval(timer);
      timer = null;
    }
    const ms = elapsedMs();

    const summary = `Ended at ${format(ms)}. Save this session?`;
    const title = document.getElementById("generic-title");
    const body = document.getElementById("generic-body");
    const ok = document.getElementById("generic-ok");

    title.textContent = "End Study Session";
    body.innerHTML = `
      <p>${Utils.escapeHtml(summary)}</p>
      <label style="display:grid;gap:6px;margin-top:10px"><span>Notes</span>
      <textarea id="session-end-note" class="input" rows="4" placeholder="Quick summary"></textarea></label>
      <div class="row-wrap" style="margin-top:10px">
        <button id="session-discard" class="btn" type="button">Discard</button>
        <button id="session-save" class="btn btn-primary" type="button">Save</button>
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
    const clock = document.getElementById("session-clock");
    const startBtn = document.getElementById("session-start");
    if (clock) clock.textContent = "00:00:00";
    if (startBtn) startBtn.textContent = "Start";
    updateGoalBar(0);
  }

  function startPauseResume() {
    if (!startedAt) {
      startedAt = Date.now();
      pausedMs = 0;
      pausedAt = null;
      running = true;
      timer = setInterval(tick, 1000);
      document.getElementById("session-start").textContent = "Pause";
      tick();
      return;
    }

    if (running) {
      pausedAt = Date.now();
      running = false;
      clearInterval(timer);
      timer = null;
      document.getElementById("session-start").textContent = "Resume";
    } else {
      pausedMs += Date.now() - pausedAt;
      pausedAt = null;
      running = true;
      timer = setInterval(tick, 1000);
      document.getElementById("session-start").textContent = "Pause";
    }
  }

  function renderHistory() {
    const list = document.getElementById("session-history");
    if (!list) return;
    const today = Store.studySessions.getToday();
    if (!today.length) {
      list.innerHTML = '<div class="empty-state">No study sessions today.</div>';
    } else {
      list.innerHTML = today
        .slice(0, 8)
        .map(
          (s) => `<div class=\"card card-muted\">${Utils.formatTime(s.actualMinutes)} | goal ${s.goalMinutes}m${s.notes ? ` | ${Utils.escapeHtml(s.notes)}` : ""}</div>`
        )
        .join("");
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

    const labels = Object.keys(dayMap).map((k) => k.slice(5));
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
              <label><span>Goal minutes</span><input id="session-goal" class="input" type="number" min="1" value="90"></label>
            </div>
            <div id="session-goal-banner" class="badge success timer-goal-badge" style="display:none">Goal reached!</div>
            <div class="row-wrap" style="margin-top:6px">
              <button id="session-start" class="btn btn-primary" type="button">Start</button>
              <button id="session-end" class="btn" type="button">End Session</button>
            </div>
          </div>
        </section>

        <section class="card">
          <h3>Today History</h3>
          <div id="session-history" class="form-grid"></div>
        </section>
      </div>

      <section class="card">
        <h3>Weekly Bar Chart (7 days)</h3>
        <div class="chart-wrap"><canvas id="chart-session-week"></canvas></div>
      </section>
    `;

    document.getElementById("session-start")?.addEventListener("click", startPauseResume);
    document.getElementById("session-end")?.addEventListener("click", endSession);
    document.getElementById("session-goal")?.addEventListener("input", () => updateGoalBar(elapsedMs()));

    renderHistory();
  }

  return { init };
})();

window.StudySession = StudySession;
