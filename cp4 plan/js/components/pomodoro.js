const Pomodoro = (() => {
  const MODES = {
    focus: "focus",
    shortBreak: "short_break",
    longBreak: "long_break"
  };

  const DEFAULTS = {
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsBeforeLongBreak: 4,
    autoBreak: true,
    autoFocus: false,
    sound: true
  };

  const QUOTES = [
    "One hard problem per day compounds.",
    "Clarity beats speed, then speed follows.",
    "Read constraints before writing loops.",
    "Bruteforce first, optimize second.",
    "If you cannot explain it, re-derive it.",
    "Write less code, think more states.",
    "Template confidence comes from usage.",
    "Small wins build contest stamina.",
    "One solved edge case saves a WA.",
    "Math + invariants kill bugs quickly.",
    "Use examples to test your assumptions.",
    "Track mistakes, turn them into checks.",
    "Calm code is fast code.",
    "The best debugging tool is isolation.",
    "Upsolve until intuition is automatic."
  ];

  let state = {
    running: false,
    mode: MODES.focus,
    remainingSeconds: DEFAULTS.focus * 60,
    cycleCount: 0,
    linkedTaskType: "free",
    linkedTaskValue: "",
    settings: { ...DEFAULTS },
    interval: null,
    booted: false
  };

  function getSettings() {
    const s = Store.settings.get();
    return { ...DEFAULTS, ...(s.pomodoro || {}) };
  }

  function saveSettings(partial) {
    Store.settings.update((cur) => ({
      ...cur,
      pomodoro: { ...(cur.pomodoro || {}), ...partial }
    }));
  }

  function formatClock(seconds) {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  function getTargetSeconds(mode) {
    const set = state.settings;
    if (mode === MODES.focus) return set.focus * 60;
    if (mode === MODES.shortBreak) return set.shortBreak * 60;
    return set.longBreak * 60;
  }

  function ensureAudioContext() {
    if (!window.__cp4AudioCtx) {
      window.__cp4AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return window.__cp4AudioCtx;
  }

  function beep(freq = 620, ms = 140) {
    if (!state.settings.sound) return;
    try {
      const ctx = ensureAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.value = 0.06;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), ms);
    } catch {
      // silent
    }
  }

  function playCompleteSound() {
    beep(740, 120);
    setTimeout(() => beep(880, 160), 120);
  }

  function updateRing() {
    const circle = document.getElementById("pomo-ring-progress");
    if (!circle) return;
    const target = Math.max(1, getTargetSeconds(state.mode));
    const pct = Math.max(0, Math.min(1, state.remainingSeconds / target));
    const r = 102;
    const c = 2 * Math.PI * r;
    circle.style.strokeDasharray = `${c}`;
    circle.style.strokeDashoffset = `${c * (1 - pct)}`;
    circle.classList.toggle("pomo-break", state.mode !== MODES.focus);
  }

  function renderTaskOptions() {
    const sectionSelect = document.getElementById("pomo-task-section");
    if (!sectionSelect) return;
    const options = Object.keys(Store.sections.get())
      .slice(0, 300)
      .map((k) => `<option value=\"${k}\">${k}</option>`)
      .join("");
    sectionSelect.innerHTML = `<option value=\"\">None</option>${options}`;
  }

  function getLinkedTaskText() {
    const mode = document.getElementById("pomo-task-type")?.value || "free";
    if (mode === "section") {
      return document.getElementById("pomo-task-section")?.value || "";
    }
    if (mode === "problem") {
      return document.getElementById("pomo-task-problem")?.value || "";
    }
    return document.getElementById("pomo-task-free")?.value || "";
  }

  function addFocusMinutesToToday(minutes) {
    const settings = Store.settings.get();
    const wd = Utils.getCurrentWeekAndDay(settings.startDate);
    if (!wd) return;
    const key = Utils.getWeekDayKey(wd.week, wd.day);
    const day = Store.dayMeta.getDay(key);
    Store.dayMeta.setDay(key, {
      ...day,
      timeMinutes: (day.timeMinutes || 0) + minutes
    });
  }

  function logSession(status = "completed") {
    const duration = getTargetSeconds(state.mode) / 60;
    const linkedTask = getLinkedTaskText();
    Store.pomodoroLog.add({
      id: Utils.generateId(),
      date: Utils.getTodayKey(),
      mode: state.mode,
      type: state.mode,
      status,
      durationMinutes: Math.round(duration),
      completedAt: new Date().toISOString(),
      taskType: document.getElementById("pomo-task-type")?.value || "free",
      task: linkedTask
    });

    if (status === "completed" && state.mode === MODES.focus) {
      addFocusMinutesToToday(Math.round(duration));
    }
  }

  function modeName(mode) {
    if (mode === MODES.focus) return "Focus";
    if (mode === MODES.shortBreak) return "Short Break";
    return "Long Break";
  }

  function pickNextModeAfterCompletion() {
    if (state.mode === MODES.focus) {
      state.cycleCount += 1;
      if (state.cycleCount % state.settings.sessionsBeforeLongBreak === 0) {
        return MODES.longBreak;
      }
      return MODES.shortBreak;
    }
    return MODES.focus;
  }

  function applyMode(nextMode) {
    state.mode = nextMode;
    state.remainingSeconds = getTargetSeconds(nextMode);
    render();
  }

  function tick() {
    if (!state.running) return;

    if (!document.getElementById("pomo-clock")) {
      stop();
      return;
    }

    state.remainingSeconds -= 1;
    if (state.remainingSeconds <= 0) {
      state.remainingSeconds = 0;
      updateRing();
      render();
      playCompleteSound();
      logSession("completed");

      const next = pickNextModeAfterCompletion();
      const shouldAuto = state.mode === MODES.focus ? state.settings.autoBreak : state.settings.autoFocus;
      applyMode(next);

      if (shouldAuto) {
        start();
      } else {
        stop();
        window.showToast?.(`${modeName(next)} ready`, "info", 2200);
      }
      return;
    }

    if (state.remainingSeconds <= 3) beep(560, 70);
    render();
  }

  function start() {
    if (state.running) return;
    state.running = true;
    clearInterval(state.interval);
    state.interval = setInterval(tick, 1000);
    render();
  }

  function stop() {
    state.running = false;
    clearInterval(state.interval);
    state.interval = null;
    render();
  }

  function reset() {
    stop();
    state.remainingSeconds = getTargetSeconds(state.mode);
    render();
  }

  function skip() {
    stop();
    if (state.mode === MODES.focus) {
      logSession("skipped");
    }
    applyMode(pickNextModeAfterCompletion());
  }

  function updateTodayLog() {
    const root = document.getElementById("pomo-today-log");
    if (!root) return;
    const sessions = Store.pomodoroLog.getToday();
    if (!sessions.length) {
      root.innerHTML = '<div class="empty-state">No sessions today.</div>';
      return;
    }

    root.innerHTML = sessions
      .slice(0, 12)
      .map(
        (s) => `<div class=\"card card-muted\">${Utils.escapeHtml(modeName(s.mode))} | ${s.durationMinutes}m | ${Utils.escapeHtml(s.status)}${s.task ? ` | ${Utils.escapeHtml(s.task)}` : ""}</div>`
      )
      .join("");
  }

  function render() {
    const clock = document.getElementById("pomo-clock");
    if (!clock) return;

    const modeEl = document.getElementById("pomo-mode");
    const statusEl = document.getElementById("pomo-status");
    const startEl = document.getElementById("pomo-start");
    const quoteEl = document.getElementById("pomo-quote");

    clock.textContent = formatClock(state.remainingSeconds);
    if (modeEl) modeEl.textContent = modeName(state.mode);
    if (statusEl) statusEl.textContent = state.running ? "Running" : "Paused";
    if (startEl) startEl.textContent = state.running ? "Pause" : "Start";
    if (quoteEl) quoteEl.textContent = QUOTES[(state.cycleCount + new Date().getDate()) % QUOTES.length];
    updateRing();
    updateTodayLog();
  }

  function bindSettings() {
    [
      ["pomo-set-focus", "focus"],
      ["pomo-set-short", "shortBreak"],
      ["pomo-set-long", "longBreak"],
      ["pomo-set-sessions", "sessionsBeforeLongBreak"]
    ].forEach(([id, key]) => {
      document.getElementById(id)?.addEventListener("change", (e) => {
        const val = Math.max(1, Number(e.target.value) || DEFAULTS[key]);
        state.settings[key] = val;
        saveSettings({ [key]: val });
        if (!state.running) {
          state.remainingSeconds = getTargetSeconds(state.mode);
          render();
        }
      });
    });

    document.getElementById("pomo-set-auto-break")?.addEventListener("change", (e) => {
      state.settings.autoBreak = !!e.target.checked;
      saveSettings({ autoBreak: state.settings.autoBreak });
    });

    document.getElementById("pomo-set-auto-focus")?.addEventListener("change", (e) => {
      state.settings.autoFocus = !!e.target.checked;
      saveSettings({ autoFocus: state.settings.autoFocus });
    });

    document.getElementById("pomo-set-sound")?.addEventListener("change", (e) => {
      state.settings.sound = !!e.target.checked;
      saveSettings({ sound: state.settings.sound });
    });
  }

  function init(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;

    state.settings = getSettings();
    if (!state.booted) {
      state.remainingSeconds = getTargetSeconds(state.mode);
      state.booted = true;
    }

    root.innerHTML = `
      <div class="grid-2">
        <section class="card">
          <div class="timer-main">
            <div class="timer-ring-wrap">
              <svg class="timer-ring" viewBox="0 0 240 240" aria-hidden="true">
                <circle class="timer-ring-track" cx="120" cy="120" r="102"></circle>
                <circle id="pomo-ring-progress" class="timer-ring-progress" cx="120" cy="120" r="102"></circle>
              </svg>
              <div class="timer-center">
                <div id="pomo-mode" class="timer-label">Focus</div>
                <div class="timer-readout" id="pomo-clock">25:00</div>
                <div id="pomo-status" class="timer-label">Paused</div>
              </div>
            </div>
            <div class="row-wrap">
              <button id="pomo-start" class="btn btn-primary" type="button">Start</button>
              <button id="pomo-reset" class="btn" type="button">Reset</button>
              <button id="pomo-skip" class="btn" type="button">Skip</button>
            </div>
            <small id="pomo-quote" class="muted"></small>
          </div>
        </section>

        <section class="card">
          <h3>Task Linking</h3>
          <div class="form-grid">
            <label><span>Type</span>
              <select id="pomo-task-type" class="input">
                <option value="free">Free Text</option>
                <option value="section">Section</option>
                <option value="problem">Problem</option>
              </select>
            </label>
            <label><span>Section</span><select id="pomo-task-section" class="input"></select></label>
            <label><span>Problem Search</span><input id="pomo-task-problem" class="input" placeholder="e.g. Two Pointers - CF 1234A"></label>
            <label><span>Free Text</span><input id="pomo-task-free" class="input" placeholder="What are you focusing on?"></label>
          </div>
          <hr>
          <h3>Settings</h3>
          <div class="grid-2">
            <label><span>Focus (min)</span><input id="pomo-set-focus" class="input" type="number" min="1" value="${state.settings.focus}"></label>
            <label><span>Short Break</span><input id="pomo-set-short" class="input" type="number" min="1" value="${state.settings.shortBreak}"></label>
            <label><span>Long Break</span><input id="pomo-set-long" class="input" type="number" min="1" value="${state.settings.longBreak}"></label>
            <label><span>Sessions before Long</span><input id="pomo-set-sessions" class="input" type="number" min="1" value="${state.settings.sessionsBeforeLongBreak}"></label>
          </div>
          <div class="row-wrap">
            <label><input id="pomo-set-auto-break" type="checkbox" ${state.settings.autoBreak ? "checked" : ""}> Auto break</label>
            <label><input id="pomo-set-auto-focus" type="checkbox" ${state.settings.autoFocus ? "checked" : ""}> Auto focus</label>
            <label><input id="pomo-set-sound" type="checkbox" ${state.settings.sound ? "checked" : ""}> Sound</label>
          </div>
        </section>
      </div>

      <section class="card">
        <h3>Today's Sessions</h3>
        <div id="pomo-today-log" class="form-grid"></div>
      </section>
    `;

    renderTaskOptions();

    document.getElementById("pomo-start")?.addEventListener("click", () => {
      if (state.running) {
        stop();
      } else {
        start();
      }
    });

    document.getElementById("pomo-reset")?.addEventListener("click", reset);
    document.getElementById("pomo-skip")?.addEventListener("click", skip);

    bindSettings();
    render();
  }

  return { init };
})();

window.Pomodoro = Pomodoro;
