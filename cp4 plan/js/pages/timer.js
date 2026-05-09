const TimerPage = (() => {
  let initialized = false;

  function switchTab(tab) {
    document.querySelectorAll(".timer-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-timer-tab") === tab);
    });

    document.querySelectorAll(".timer-panel").forEach((panel) => {
      panel.classList.toggle("show", panel.id === `timer-panel-${tab}`);
    });
  }

  function init(options = {}) {
    initialized = true;

    Pomodoro.init("timer-panel-pomodoro");
    StudySession.init("timer-panel-session");

    document.querySelectorAll(".timer-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.getAttribute("data-timer-tab")));
    });

    if (options.mode === "session") {
      switchTab("session");
    } else {
      switchTab("pomodoro");
    }
  }

  function onShow(options = {}) {
    if (options.mode === "pomodoro") switchTab("pomodoro");
    if (options.mode === "session") switchTab("session");
  }

  return {
    init,
    onShow,
    isInitialized: () => initialized
  };
})();

window.TimerPage = TimerPage;
