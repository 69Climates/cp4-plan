const App = (() => {
  const pageCache = {};
  const tabOrder = ["dashboard", "weekplan", "problems", "contests", "notes", "stats", "timer", "habits"];
  const pageModules = {
    dashboard: () => window.DashboardPage,
    weekplan: () => window.WeekplanPage,
    problems: () => window.ProblemsPage,
    contests: () => window.ContestsPage,
    notes: () => window.NotesPage,
    stats: () => window.StatsPage,
    timer: () => window.TimerPage,
    habits: () => window.HabitsPage
  };
  const APP_PASSWORD_HASH = "e040f7b15ee6564bc8094285946b4996d930d728f28a23f9cb6f9c245b7e73ee";
  const APP_UNLOCK_KEY = "cp4_unlock_state_v1";
  const APP_UNLOCK_COOKIE = "cp4_unlock_state_v1";

  let activeTab = "dashboard";
  let deferredInstallPrompt = null;
  let isUnlocked = false;
  let initialRoute = null;
  let postUnlockReady = false;

  function setActiveTabButton(tab) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
    });
  }

  function disableLocalInputSuggestions(root = document) {
    root.querySelectorAll("form").forEach((form) => {
      form.setAttribute("autocomplete", "off");
    });

    root.querySelectorAll("input, textarea").forEach((field) => {
      field.setAttribute("autocomplete", "off");
      field.setAttribute("autocorrect", "off");
      field.setAttribute("autocapitalize", "off");
      field.setAttribute("spellcheck", "false");

      if (field.tagName === "INPUT" && field.type === "password") {
        // Use new-password token to suppress stored credential suggestions.
        field.setAttribute("autocomplete", "new-password");
      }
    });
  }

  function toHex(buffer) {
    return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i += 1) {
      mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
  }

  async function verifyPassword(password) {
    if (!window.crypto?.subtle) {
      throw new Error("WebCrypto unavailable");
    }

    const bytes = new TextEncoder().encode(password);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return timingSafeEqual(toHex(digest), APP_PASSWORD_HASH);
  }

  function setLockUi(locked) {
    document.body.classList.toggle("app-locked", locked);
    const lockScreen = document.getElementById("app-lock-screen");
    if (!lockScreen) return;
    lockScreen.classList.toggle("show", locked);
    lockScreen.setAttribute("aria-hidden", locked ? "false" : "true");
  }

  function setLockError(message = "") {
    const errorNode = document.getElementById("app-lock-error");
    if (errorNode) errorNode.textContent = message;
  }

  function getCookie(name) {
    const prefix = `${name}=`;
    const all = String(document.cookie || "").split(";");
    for (const raw of all) {
      const entry = raw.trim();
      if (entry.startsWith(prefix)) {
        return decodeURIComponent(entry.slice(prefix.length));
      }
    }
    return "";
  }

  function isUnlockRemembered() {
    try {
      return localStorage.getItem(APP_UNLOCK_KEY) === "1" || getCookie(APP_UNLOCK_COOKIE) === "1";
    } catch {
      return getCookie(APP_UNLOCK_COOKIE) === "1";
    }
  }

  function rememberUnlockState(unlocked) {
    try {
      if (unlocked) {
        localStorage.setItem(APP_UNLOCK_KEY, "1");
      } else {
        localStorage.removeItem(APP_UNLOCK_KEY);
      }
    } catch {
      // silent
    }

    if (unlocked) {
      document.cookie = `${APP_UNLOCK_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
    } else {
      document.cookie = `${APP_UNLOCK_COOKIE}=; path=/; max-age=0; samesite=lax`;
    }
  }

  function clearAppSurface() {
    const container = document.getElementById("app-content");
    if (container) container.innerHTML = "";

    const searchInput = document.getElementById("global-search");
    if (searchInput) {
      searchInput.value = "";
      searchInput.blur();
    }

    Search.closeResults?.();
    closeQuickCapture();
    Modal.closeAllModals();
    setActiveTabButton("");
  }

  function lockApp() {
    isUnlocked = false;
    rememberUnlockState(false);
    clearAppSurface();
    setLockUi(true);
    setLockError("");

    const passInput = document.getElementById("app-lock-password");
    if (passInput) {
      passInput.value = "";
      passInput.focus();
    }
  }

  function ensurePostUnlockSetup() {
    if (postUnlockReady) return;

    DoomNotes.init();
    bindFirstRun();

    if (Object.keys(Store.sections.get()).length === 0 && Store.settings.get().startDate) {
      seedIfEmpty();
    }

    // Initialize notification manager
    if (window.NotificationManager) {
      NotificationManager.init();
    }

    // Listen for service worker messages (snooze, navigation)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        const { type, habitId, reminderId, duration } = event.data || {};
        
        if (type === "snooze-notification" && window.NotificationManager) {
          const durationMs = NotificationManager.SNOOZE_DURATIONS[duration];
          if (durationMs) {
            NotificationManager.handleSnooze(habitId, reminderId, durationMs);
            window.showToast?.(`Snoozed for ${duration === 'short' ? '5 min' : duration === 'medium' ? '15 min' : '1 hour'}`, "info");
          }
        } else if (type === "navigate-to-habit") {
          navigate("habits", { habitId });
        }
      });
    }

    postUnlockReady = true;
  }

  async function loadTabHtml(tab) {
    if (pageCache[tab]) return pageCache[tab];
    const res = await fetch(`pages/${tab}.html`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${tab}`);
    const html = await res.text();
    pageCache[tab] = html;
    return html;
  }

  async function navigate(tab, options = {}) {
    if (!tabOrder.includes(tab)) tab = "dashboard";

    if (!isUnlocked) {
      initialRoute = { tab, options: { ...options } };
      return;
    }

    activeTab = tab;
    setActiveTabButton(tab);

    const container = document.getElementById("app-content");
    container.innerHTML = '<div class="card">Loading...</div>';

    try {
      const html = await loadTabHtml(tab);
      container.innerHTML = html;

      const mod = pageModules[tab]?.();
      if (mod) {
        mod.init?.(options);
        mod.onShow?.(options);
      }

      disableLocalInputSuggestions(container);

      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      if (options.action) url.searchParams.set("action", options.action);
      else url.searchParams.delete("action");
      if (options.mode) url.searchParams.set("mode", options.mode);
      else url.searchParams.delete("mode");
      if (options.habitId) url.searchParams.set("habitId", options.habitId);
      else url.searchParams.delete("habitId");
      history.replaceState({}, "", url);
    } catch (err) {
      container.innerHTML = `<div class=\"card\">Failed to load tab: ${Utils.escapeHtml(String(err))}</div>`;
    }
  }

  function openQuickCapture() {
    const box = document.getElementById("quick-capture-popup");
    const input = document.getElementById("quick-capture-input");
    if (!box || !input) return;
    box.style.display = "block";
    input.value = "";
    input.focus();
  }

  function closeQuickCapture() {
    const box = document.getElementById("quick-capture-popup");
    if (box) box.style.display = "none";
  }

  function saveQuickCapture() {
    const input = document.getElementById("quick-capture-input");
    const text = input?.value.trim();
    if (!text) {
      closeQuickCapture();
      return;
    }
    Store.quickCaptures.add(text);
    window.showToast?.("Quick capture saved", "success");

    if (activeTab === "notes") {
      const activeNotesTab = document.querySelector(".notes-tab-btn.active")?.getAttribute("data-notes-tab") || "quick";
      closeQuickCapture();
      navigate("notes", { notesTab: activeNotesTab });
      return;
    }

    closeQuickCapture();
  }

  function shortcutTableHtml() {
    const rows = [
      ["D", "Dashboard tab"],
      ["W", "Week Plan tab"],
      ["P", "Problems tab"],
      ["C", "Contests tab"],
      ["N", "Notes tab"],
      ["S", "Stats tab"],
      ["T", "Timer tab"],
      ["H", "Habits tab"],
      ["+ / A", "Open Quick Add Problem"],
      ["/", "Focus global search"],
      ["?", "Open Help Center"],
      ["Escape", "Close topmost modal"],
      ["Space", "Open quick capture popup"],
      ["Ctrl + D", "Open DOOM NOTES"],
      ["Ctrl + L", "Lock app"]
    ];

    return `<div class=\"table-wrap\"><table><thead><tr><th>Shortcut</th><th>Action</th></tr></thead><tbody>${rows
      .map((r) => `<tr><td><span class=\"kbd\">${r[0]}</span></td><td>${r[1]}</td></tr>`)
      .join("")}</tbody></table></div>`;
  }

  function bindGlobalKeys() {
    document.addEventListener("keydown", (e) => {
      const keyLower = e.key.toLowerCase();
      const typing = Utils.isTypingTarget(document.activeElement);

      if (e.ctrlKey && keyLower === "l") {
        e.preventDefault();
        lockApp();
        return;
      }

      if (!e.ctrlKey && keyLower === "l" && !typing) {
        return;
      }

      if (!isUnlocked) {
        return;
      }

      if (e.ctrlKey && keyLower === "d") {
        e.preventDefault();
        DoomNotes.open();
        return;
      }

      if (e.key === "Escape") {
        closeQuickCapture();
      }

      if (typing) {
        return;
      }

      const key = keyLower;
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
      if (!hasModifier) {
        if (key === "d") navigate("dashboard");
        if (key === "w") navigate("weekplan");
        if (key === "p") navigate("problems");
        if (key === "c") navigate("contests");
        if (key === "n") navigate("notes");
        if (key === "s") navigate("stats");
        if (key === "t") navigate("timer");
        if (key === "h") navigate("habits");
      }

      if ((key === "a" || e.key === "+") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        ProblemsPage.openQuickAddModal();
      }

      if (key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        document.getElementById("shortcuts-table-wrap").innerHTML = shortcutTableHtml();
        Modal.openModal("modal-shortcuts");
      }

      if (e.key === " " && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        openQuickCapture();
      }
    });

    document.getElementById("quick-capture-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveQuickCapture();
      }
      if (e.key === "Escape") {
        closeQuickCapture();
      }
    });
  }

  function bindNavigationButtons() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => navigate(btn.getAttribute("data-tab")));
    });

    document.getElementById("fab-add")?.addEventListener("click", () => ProblemsPage.openQuickAddModal());

    // Quick Add modal cancel button
    document.getElementById("qa-cancel")?.addEventListener("click", () => Modal.closeModal("modal-quick-add"));

    document.getElementById("shortcuts-btn")?.addEventListener("click", () => {
      document.getElementById("shortcuts-table-wrap").innerHTML = shortcutTableHtml();
      Modal.openModal("modal-shortcuts");
    });

    document.getElementById("settings-btn")?.addEventListener("click", () => {
      const settings = Store.settings.get();
      document.getElementById("settings-start-date").value = settings.startDate || "";
      document.getElementById("settings-daily-goal").value = settings.dailyGoal || 3;
      document.getElementById("settings-time-goal").value = settings.timeGoal || 120;
      
      // Initialize date input with today's date if empty
      if (!settings.startDate) {
        Utils.initializeDateInput("settings-start-date");
      }
      
      Modal.openModal("modal-settings");
    });
  }

  function bindSettingsModal() {
    document.getElementById("settings-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const startDate = document.getElementById("settings-start-date").value;
      if (!startDate) {
        window.showToast?.("Start date is required", "error");
        return;
      }

      Store.settings.set({
        ...Store.settings.get(),
        startDate,
        dailyGoal: Number(document.getElementById("settings-daily-goal").value || 3),
        timeGoal: Number(document.getElementById("settings-time-goal").value || 120)
      });

      Modal.closeModal("modal-settings");
      window.showToast?.("Settings saved", "success");
      pageModules[activeTab]?.().onShow?.();
    });

    document.getElementById("open-doom-notes-from-settings")?.addEventListener("click", () => {
      Modal.closeModal("modal-settings");
      DoomNotes.open();
    });

    document.getElementById("export-data")?.addEventListener("click", () => {
      const blob = new Blob([Store.exportAll()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cp4-backup-${Utils.getTodayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("import-data-input")?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        Store.importAll(text);
        window.showToast?.("Data imported", "success");
        location.reload();
      } catch {
        window.showToast?.("Invalid backup file", "error");
      }
    });

    document.getElementById("reset-data")?.addEventListener("click", () => {
      Modal.showConfirm("Reset all local data? This cannot be undone.", () => {
        Store.resetAll();
        location.reload();
      });
    });
  }

  function bindFirstRun() {
    const form = document.getElementById("first-run-form");
    const modal = document.getElementById("modal-first-run");
    if (!form || !modal) return;

    ensureFirstRunModalLockedIfNeeded();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const startDate = document.getElementById("first-start-date").value;
      if (!startDate) {
        window.showToast?.("Start date is required", "error");
        return;
      }

      Store.settings.set({
        ...Store.settings.get(),
        startDate,
        dailyGoal: Number(document.getElementById("first-daily-goal").value || 3),
        timeGoal: Number(document.getElementById("first-time-goal").value || 120)
      });

      seedIfEmpty();
      modal.dataset.locked = "false";
      Modal.closeModal("modal-first-run");
      window.showToast?.("Tracker initialized", "success");
      pageModules[activeTab]?.().onShow?.();
    });
  }

  function ensureFirstRunModalLockedIfNeeded() {
    const modal = document.getElementById("modal-first-run");
    if (!modal) return;

    if (!Store.settings.get().startDate) {
      modal.dataset.locked = "true";
      // Initialize date input with today's date when modal opens
      Utils.initializeDateInput("first-start-date");
      Modal.openModal("modal-first-run");
    }
  }

  function bindInstallBanner() {
    const banner = document.getElementById("install-banner");
    const installBtn = document.getElementById("install-btn");
    const dismissBtn = document.getElementById("install-dismiss");

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (banner) banner.style.display = "flex";
    });

    installBtn?.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (banner) banner.style.display = "none";
    });

    dismissBtn?.addEventListener("click", () => {
      if (banner) banner.style.display = "none";
    });

    window.addEventListener("appinstalled", () => {
      if (banner) banner.style.display = "none";
      window.showToast?.("CP4 Tracker installed", "success");
    });
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {
        // silent
      });
    }
  }

  function getInitialRoute() {
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab") || "dashboard";
    const action = url.searchParams.get("action") || "";
    const mode = url.searchParams.get("mode") || "";
    const habitId = url.searchParams.get("habitId") || "";
    return { tab, action, mode, habitId };
  }

  function maybeHandleDeepAction(route) {
    if (route.tab === "problems" && route.action === "add") {
      setTimeout(() => ProblemsPage.openQuickAddModal(), 200);
    }
    if (route.tab === "timer" && route.mode === "pomodoro") {
      navigate("timer", { mode: "pomodoro" });
    }
    if (route.tab === "habits" && route.habitId) {
      navigate("habits", { habitId: route.habitId });
    }
  }

  function bindLockScreen() {
    const form = document.getElementById("app-lock-form");
    const input = document.getElementById("app-lock-password");
    const unlockBtn = document.getElementById("app-unlock-btn");
    if (!form || !input || !unlockBtn) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isUnlocked) return;

      const candidate = input.value;
      if (!candidate) {
        setLockError("Password is required.");
        input.focus();
        return;
      }

      const previousLabel = unlockBtn.textContent;
      unlockBtn.disabled = true;
      unlockBtn.textContent = "Unlocking...";
      setLockError("");

      try {
        const ok = await verifyPassword(candidate);
        if (!ok) {
          setLockError("Incorrect password.");
          input.value = "";
          input.focus();
          return;
        }

        isUnlocked = true;
        rememberUnlockState(true);
        setLockUi(false);
        input.value = "";

        ensurePostUnlockSetup();
        ensureFirstRunModalLockedIfNeeded();

        const route = initialRoute || { tab: "dashboard", options: {} };
        initialRoute = null;

        navigate(route.tab, route.options || {});
        maybeHandleDeepAction({
          tab: route.tab,
          action: route.options?.action || "",
          mode: route.options?.mode || "",
          habitId: route.options?.habitId || ""
        });
      } catch {
        setLockError("Unlock unavailable in this browser context.");
      } finally {
        unlockBtn.disabled = false;
        unlockBtn.textContent = previousLabel;
      }
    });
  }

  function init() {
    Modal.init();
    Search.init();
    disableLocalInputSuggestions(document);

    bindNavigationButtons();
    bindGlobalKeys();
    bindLockScreen();
    bindSettingsModal();
    bindInstallBanner();

    registerServiceWorker();
    
    // Initialize all date inputs with today's date
    Utils.initializeAllDateInputs();
    
    // Watch for dynamically added date inputs
    const observer = new MutationObserver(() => {
      Utils.initializeAllDateInputs();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const route = getInitialRoute();
    initialRoute = {
      tab: route.tab,
      options: { action: route.action, mode: route.mode, habitId: route.habitId }
    };

    if (isUnlockRemembered()) {
      isUnlocked = true;
      setLockUi(false);
      setLockError("");
      ensurePostUnlockSetup();
      ensureFirstRunModalLockedIfNeeded();
      navigate(route.tab, { action: route.action, mode: route.mode, habitId: route.habitId });
      maybeHandleDeepAction(route);
      return;
    }

    lockApp();
  }

  return {
    init,
    navigate,
    getActiveTab: () => activeTab,
    isUnlocked: () => isUnlocked,
    lock: () => lockApp()
  };
})();

window.App = App;
document.addEventListener("DOMContentLoaded", App.init);
