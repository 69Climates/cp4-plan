const HabitsPage = (() => {
  let initialized = false;
  let selectedDate = Utils.getTodayKey();
  let activeView = "daily"; // "daily" | "list" | "stats"
  let selectedHabitId = null;
  let draggedHabitId = null;

  // ============================================================================
  // Initialization
  // ============================================================================

  function init(options = {}) {
    if (initialized) return;
    initialized = true;

    bindEvents();
    checkStorageHealth(); // Subtask 19.3
    initNotifications(); // Subtask 19.4
    render();
  }
  
  // Initialize notifications with graceful degradation (Subtask 19.4)
  function initNotifications() {
    if (!window.NotificationManager) {
      hideNotificationUI("Notification system not available");
      return;
    }
    
    if (!NotificationManager.checkNotificationSupport()) {
      hideNotificationUI("Notifications are not supported in this browser");
      return;
    }
    
    if (!NotificationManager.checkServiceWorkerSupport()) {
      window.showToast?.(
        "Service Workers not supported. Notifications may not work reliably.",
        "warning",
        4000
      );
    }
  }
  
  function hideNotificationUI(message) {
    // Hide reminder section in habit form
    const reminderFieldset = document.querySelector('#habit-form fieldset:has(#habit-reminders-list)');
    if (reminderFieldset) {
      reminderFieldset.style.display = 'none';
    }
    
    // Hide test notification button
    const testBtn = document.getElementById("habits-test-notification");
    if (testBtn) {
      testBtn.style.display = 'none';
    }
    
    // Show info message once
    if (message && window.showToast) {
      window.showToast(message, "info", 4000);
    }
  }
  
  // Storage health check (Subtask 19.3)
  async function checkStorageHealth() {
    try {
      const quota = await Store.checkStorageQuota();
      if (quota && quota.percentUsed > 90) {
        window.showToast?.(
          `Storage is ${quota.percentUsed}% full. Consider deleting old data.`,
          "warning",
          5000
        );
      }
    } catch (error) {
      console.error("Error checking storage quota:", error);
    }
  }

  function onShow(options = {}) {
    if (options.date) {
      selectedDate = options.date;
    }
    if (options.habitId) {
      selectedHabitId = options.habitId;
    }
    render();
  }

  // ============================================================================
  // Event Binding
  // ============================================================================

  function bindEvents() {
    // Tab switching
    document.querySelectorAll(".habits-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tab = e.target.getAttribute("data-habits-tab");
        switchView(tab);
      });
    });

    // Date picker
    const datePicker = document.getElementById("habits-date-picker");
    if (datePicker) {
      // Bug Fix 4: Initialize date picker with today's date if empty
      if (!datePicker.value) {
        datePicker.value = Utils.getTodayKey();
      }
      datePicker.value = selectedDate;
      datePicker.addEventListener("change", (e) => {
        selectedDate = e.target.value;
        renderDailyView();
      });
    }

    // Add habit button
    document.getElementById("habits-add-btn")?.addEventListener("click", openCreateModal);

    // Test notification button
    document.getElementById("habits-test-notification")?.addEventListener("click", async () => {
      if (!window.NotificationManager) {
        window.showToast?.("Notification system not available", "error");
        return;
      }

      const result = await NotificationManager.sendTestNotification();
      if (result.success) {
        window.showToast?.("Test notification sent! Check your system notifications.", "success");
      } else {
        window.showToast?.(`Notification failed: ${result.message}`, "error");
      }
    });

    // Daily list event delegation
    document.getElementById("habits-daily-list")?.addEventListener("click", handleDailyListClick);

    // List view event delegation
    document.getElementById("habits-list")?.addEventListener("click", handleListClick);

    // Category filter
    document.getElementById("habits-category-filter")?.addEventListener("change", renderListView);

    // Show archived button
    document.getElementById("habits-show-archived")?.addEventListener("click", toggleArchivedView);

    // Stats selector
    document.getElementById("habits-stats-selector")?.addEventListener("change", (e) => {
      const habitId = e.target.value;
      if (habitId) {
        renderStatsView(habitId);
      }
    });

    // Habit form events
    document.getElementById("habit-form")?.addEventListener("submit", handleHabitFormSubmit);
    document.getElementById("habit-form-cancel")?.addEventListener("click", () => {
      Modal.closeModal("modal-habit-form");
    });

    // Frequency type change
    document.querySelectorAll('input[name="habit-frequency-type"]').forEach(radio => {
      radio.addEventListener("change", updateFrequencyOptions);
    });

    // Add reminder button
    document.getElementById("habit-add-reminder")?.addEventListener("click", addReminder);

    // Delete confirmation modal
    document.getElementById("habit-delete-confirm")?.addEventListener("click", confirmDeleteHabit);
    document.getElementById("habit-delete-cancel")?.addEventListener("click", () => {
      Modal.closeModal("modal-habit-delete");
    });

    // Archive confirmation modal
    document.getElementById("habit-archive-confirm")?.addEventListener("click", confirmArchiveHabit);
    document.getElementById("habit-archive-cancel")?.addEventListener("click", () => {
      Modal.closeModal("modal-habit-archive");
    });
    
    // Clear errors on input change (Subtask 19.1)
    document.getElementById("habit-name")?.addEventListener("input", () => {
      clearFieldError("habit-name");
    });
    
    document.getElementById("habit-description")?.addEventListener("input", () => {
      clearFieldError("habit-description");
    });
    
    document.getElementById("habit-target-time")?.addEventListener("change", () => {
      clearFieldError("habit-target-time");
    });
    
    document.getElementById("habit-frequency-interval")?.addEventListener("input", () => {
      clearFieldError("habit-frequency-interval");
    });
    
    // Clear weekdays error when any checkbox changes
    document.querySelectorAll('.weekday-checkbox input').forEach(checkbox => {
      checkbox.addEventListener("change", () => {
        const fieldset = document.getElementById("habit-frequency-weekdays").closest("fieldset");
        if (fieldset) fieldset.classList.remove("error");
        document.getElementById("habit-frequency-weekdays-error").textContent = "";
      });
    });
  }

  function handleDailyListClick(e) {
    const checkbox = e.target.closest('input[type="checkbox"]');
    if (checkbox) {
      const habitId = checkbox.getAttribute("data-habit-id");
      const date = checkbox.getAttribute("data-date");
      handleHabitToggle(habitId, date);
      return;
    }
  }

  function handleListClick(e) {
    const habitCard = e.target.closest(".habit-list-card");
    if (!habitCard) return;

    const habitId = habitCard.getAttribute("data-habit-id");

    if (e.target.closest(".habit-edit-btn")) {
      openEditModal(habitId);
    } else if (e.target.closest(".habit-archive-btn")) {
      openArchiveConfirm(habitId);
    } else if (e.target.closest(".habit-delete-btn")) {
      openDeleteConfirm(habitId);
    }
  }

  // ============================================================================
  // View Switching
  // ============================================================================

  function switchView(view) {
    activeView = view;

    // Update tab buttons
    document.querySelectorAll(".habits-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-habits-tab") === view);
    });

    // Update panels
    document.querySelectorAll(".habits-panel").forEach(panel => {
      panel.classList.toggle("show", panel.id === `habits-panel-${view}`);
    });

    // Render appropriate view
    if (view === "daily") renderDailyView();
    else if (view === "list") renderListView();
    else if (view === "stats") {
      // Bug Fix 7: Update stats selector when switching to stats view
      updateStatsSelector();
      renderStatsView(selectedHabitId);
    }
  }

  // ============================================================================
  // Daily View Rendering (Subtask 8.2)
  // ============================================================================

  function renderDailyView() {
    const habits = Store.habits.getActive();
    const date = selectedDate;
    const dayOfWeek = new Date(date).getDay();

    // Filter habits by frequency pattern
    const todayHabits = habits.filter(habit => {
      if (habit.frequency.type === "daily") return true;

      if (habit.frequency.type === "weekdays") {
        return habit.frequency.weekdays.includes(dayOfWeek);
      }

      if (habit.frequency.type === "custom") {
        const completions = Store.habits.getCompletions(habit.id);
        if (completions.length === 0) return true;

        const sorted = completions.sort((a, b) => b.date.localeCompare(a.date));
        const lastCompletion = sorted[0];
        const daysSince = Math.floor(
          (new Date(date) - new Date(lastCompletion.date)) / 86400000
        );

        return daysSince >= habit.frequency.interval;
      }

      return false;
    });

    // Calculate progress
    const completed = todayHabits.filter(h => Store.habits.isCompleted(h.id, date)).length;
    const total = todayHabits.length;

    // Update progress badge
    const progressBadge = document.getElementById("habits-daily-progress");
    if (progressBadge) {
      progressBadge.textContent = `${completed}/${total}`;
    }

    // Bug Fix 1: Set date picker value to selectedDate
    const datePicker = document.getElementById("habits-date-picker");
    if (datePicker) {
      datePicker.value = selectedDate;
    }

    // Render habit cards
    const listContainer = document.getElementById("habits-daily-list");
    if (!listContainer) return;

    if (todayHabits.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No habits scheduled for this day.</div>';
      return;
    }

    listContainer.innerHTML = todayHabits
      .map(habit => renderHabitCard(habit, date))
      .join("");
  }

  // ============================================================================
  // List View Rendering (Subtask 8.3)
  // ============================================================================

  function renderListView() {
    const categoryFilter = document.getElementById("habits-category-filter")?.value || "all";
    const showArchived = document.getElementById("habits-show-archived")?.dataset.showing === "archived";

    let habits = showArchived ? Store.habits.getArchived() : Store.habits.getActive();

    // Apply category filter
    if (categoryFilter !== "all") {
      habits = habits.filter(h => h.category === categoryFilter);
    }

    // Update category filter options
    updateCategoryFilter();

    // Update habit count
    const countBadge = document.getElementById("habits-count");
    if (countBadge) {
      countBadge.textContent = `${habits.length} habit${habits.length !== 1 ? 's' : ''}`;
    }

    // Render list
    const listContainer = document.getElementById("habits-list");
    if (!listContainer) return;

    if (habits.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No habits found.</div>';
      return;
    }

    listContainer.innerHTML = habits
      .map(habit => renderHabitListCard(habit))
      .join("");

    // Bind drag-and-drop for active habits
    if (!showArchived) {
      bindDragAndDrop();
    }
  }

  function renderHabitListCard(habit) {
    const streak = calculateCurrentStreak(habit);
    const completionRate = calculateCompletionRate(habit);
    const frequencyText = getFrequencyText(habit.frequency);

    return `
      <article class="habit-list-card" data-habit-id="${habit.id}" draggable="${!habit.archived}">
        <div class="habit-list-header">
          <div class="habit-list-icon" style="color: ${habit.color}">${habit.icon}</div>
          <div class="habit-list-info">
            <strong>${Utils.escapeHtml(habit.name)}</strong>
            ${habit.description ? `<p class="muted">${Utils.escapeHtml(habit.description)}</p>` : ''}
          </div>
          <div class="habit-list-actions">
            ${!habit.archived ? `<button class="btn btn-xs habit-edit-btn" type="button">Edit</button>` : ''}
            <button class="btn btn-xs habit-archive-btn" type="button">${habit.archived ? 'Unarchive' : 'Archive'}</button>
            <button class="btn btn-xs btn-danger habit-delete-btn" type="button">Delete</button>
          </div>
        </div>
        <div class="habit-list-meta">
          <span class="badge">${frequencyText}</span>
          ${habit.category ? `<span class="badge">${Utils.escapeHtml(habit.category)}</span>` : ''}
          ${habit.reminders && habit.reminders.length > 0 ? `<span class="badge">${habit.reminders.length} reminder${habit.reminders.length !== 1 ? 's' : ''}</span>` : ''}
          ${streak > 0 ? `<span class="badge">🔥 ${streak} day streak</span>` : ''}
          <span class="badge">${completionRate}% complete</span>
        </div>
      </article>
    `;
  }

  function updateCategoryFilter() {
    const filterSelect = document.getElementById("habits-category-filter");
    if (!filterSelect) return;

    const habits = Store.habits.getActive();
    const categories = new Set(habits.map(h => h.category).filter(Boolean));

    const currentValue = filterSelect.value;
    filterSelect.innerHTML = '<option value="all">All Categories</option>';

    Array.from(categories).sort().forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      filterSelect.appendChild(option);
    });

    filterSelect.value = currentValue;
  }

  function toggleArchivedView() {
    const btn = document.getElementById("habits-show-archived");
    if (!btn) return;

    const isShowingArchived = btn.dataset.showing === "archived";
    btn.dataset.showing = isShowingArchived ? "active" : "archived";
    btn.textContent = isShowingArchived ? "Show Archived" : "Show Active";

    renderListView();
  }

  // ============================================================================
  // Habit Card Rendering (Subtask 8.4)
  // ============================================================================

  function renderHabitCard(habit, date) {
    const isCompleted = Store.habits.isCompleted(habit.id, date);
    const streak = calculateCurrentStreak(habit);

    return `
      <div class="habit-card" style="border-left: 4px solid ${habit.color}">
        <label class="habit-checkbox-label">
          <input 
            type="checkbox" 
            class="habit-checkbox"
            ${isCompleted ? 'checked' : ''}
            data-habit-id="${habit.id}"
            data-date="${date}"
          >
          <div class="habit-card-content">
            <div class="habit-card-header">
              <span class="habit-icon" style="color: ${habit.color}">${habit.icon}</span>
              <strong>${Utils.escapeHtml(habit.name)}</strong>
              ${streak > 0 ? `<span class="habit-streak-badge">🔥 ${streak}</span>` : ''}
            </div>
            ${habit.description ? `<p class="habit-description muted">${Utils.escapeHtml(habit.description)}</p>` : ''}
          </div>
        </label>
      </div>
    `;
  }

  // ============================================================================
  // Habit Toggle Handler (Subtask 8.5)
  // ============================================================================

  function handleHabitToggle(habitId, date) {
    const isCompleted = Store.habits.isCompleted(habitId, date);

    if (isCompleted) {
      Store.habits.deleteCompletion(habitId, date);
    } else {
      Store.habits.addCompletion(habitId, date);
    }

    // Re-render to update UI and streak
    if (activeView === "daily") {
      renderDailyView();
    }
  }

  // ============================================================================
  // Habit Reordering (Subtask 8.6)
  // ============================================================================

  function bindDragAndDrop() {
    const cards = document.querySelectorAll(".habit-list-card[draggable='true']");

    cards.forEach(card => {
      card.addEventListener("dragstart", handleDragStart);
      card.addEventListener("dragover", handleDragOver);
      card.addEventListener("drop", handleDrop);
      card.addEventListener("dragend", handleDragEnd);
    });
  }

  function handleDragStart(e) {
    draggedHabitId = e.currentTarget.getAttribute("data-habit-id");
    e.currentTarget.style.opacity = "0.5";
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    return false;
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const targetCard = e.currentTarget;
    const targetHabitId = targetCard.getAttribute("data-habit-id");

    if (draggedHabitId && draggedHabitId !== targetHabitId) {
      handleHabitReorder(draggedHabitId, targetHabitId);
    }

    return false;
  }

  function handleDragEnd(e) {
    e.currentTarget.style.opacity = "1";
    draggedHabitId = null;
  }

  function handleHabitReorder(draggedId, targetId) {
    const habits = Store.habits.getActive();
    const draggedIndex = habits.findIndex(h => h.id === draggedId);
    const targetIndex = habits.findIndex(h => h.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder array
    const reordered = [...habits];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update displayOrder
    const habitIds = reordered.map(h => h.id);
    Store.habits.reorder(habitIds);

    // Re-render
    renderListView();
  }

  // ============================================================================
  // Stats View Rendering (Task 12.1)
  // ============================================================================

  function renderStatsView(habitId) {
    const statsContent = document.getElementById("habits-stats-content");
    if (!statsContent) return;

    if (!habitId) {
      statsContent.innerHTML = '<div class="empty-state">Select a habit to view statistics.</div>';
      return;
    }

    const habit = Store.habits.getById(habitId);
    if (!habit) {
      statsContent.innerHTML = '<div class="empty-state">Habit not found.</div>';
      return;
    }

    const currentStreak = calculateCurrentStreak(habit);
    const longestStreak = calculateLongestStreak(habit);
    const completionRate = calculateCompletionRate(habit);
    const totalCompletions = Store.habits.getCompletions(habit.id).length;
    const bestDay = calculateBestDay(habit);
    const trend = calculateTrend(habit);

    statsContent.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h4>Current Streak</h4>
          <p class="stat-value">🔥 ${currentStreak} days</p>
        </div>
        <div class="stat-card">
          <h4>Longest Streak</h4>
          <p class="stat-value">⭐ ${longestStreak} days</p>
        </div>
        <div class="stat-card">
          <h4>Completion Rate</h4>
          <p class="stat-value">${completionRate}%</p>
        </div>
        <div class="stat-card">
          <h4>Total Completions</h4>
          <p class="stat-value">${totalCompletions}</p>
        </div>
      </div>

      ${bestDay ? `
        <div class="stat-card" style="margin-top: 16px;">
          <h4>Best Day</h4>
          <p class="stat-value">${bestDay.dayName}</p>
          <p class="muted" style="font-size: 0.9em; margin-top: 8px;">${bestDay.rate}% completion rate</p>
        </div>
      ` : ''}

      ${trend ? `
        <div class="stat-card" style="margin-top: 16px;">
          <h4>Trend</h4>
          <p class="stat-value">${trend.icon} ${trend.label}</p>
          <p class="muted" style="font-size: 0.9em; margin-top: 8px;">${trend.description}</p>
        </div>
      ` : ''}
    `;

    // Update stats selector
    updateStatsSelector();
  }

  function updateStatsSelector() {
    const selector = document.getElementById("habits-stats-selector");
    if (!selector) return;

    const habits = Store.habits.getAll();
    const currentValue = selector.value;

    selector.innerHTML = '<option value="">Select a habit...</option>';

    habits.forEach(habit => {
      const option = document.createElement("option");
      option.value = habit.id;
      option.textContent = `${habit.icon} ${habit.name}`;
      selector.appendChild(option);
    });

    selector.value = currentValue;
  }

  // ============================================================================
  // Streak Calculation Helpers
  // ============================================================================

  function calculateCurrentStreak(habit) {
    const completions = Store.habits.getCompletions(habit.id);
    if (completions.length === 0) return 0;

    const completionDates = new Set(completions.map(c => c.date));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let missedExpectedDay = false;

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      // Check if this day is expected based on frequency
      const isExpectedDay = isExpectedDayForFrequency(habit, checkDate);
      
      if (isExpectedDay) {
        const dateKey = checkDate.toISOString().split("T")[0];
        const isCompleted = completionDates.has(dateKey);
        
        if (isCompleted) {
          streak++;
        } else {
          // Missed an expected day
          if (i > 0) {
            // Break streak (but not if today isn't completed yet)
            break;
          }
          missedExpectedDay = true;
        }
      }
    }

    return streak;
  }

  function calculateLongestStreak(habit) {
    const completions = Store.habits.getCompletions(habit.id);
    if (completions.length === 0) return 0;

    const completionDates = new Set(completions.map(c => c.date));
    let longestStreak = 0;
    let currentStreak = 0;

    // Get date range from first completion to today
    const sortedDates = completions.map(c => c.date).sort();
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const isExpectedDay = isExpectedDayForFrequency(habit, d);
      
      if (isExpectedDay) {
        const dateKey = d.toISOString().split("T")[0];
        const isCompleted = completionDates.has(dateKey);
        
        if (isCompleted) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
    }

    return longestStreak;
  }

  function isExpectedDayForFrequency(habit, date) {
    const dayOfWeek = date.getDay();

    if (habit.frequency.type === "daily") {
      return true;
    } else if (habit.frequency.type === "weekdays") {
      return habit.frequency.weekdays.includes(dayOfWeek);
    } else if (habit.frequency.type === "custom") {
      // For custom intervals, check if this date falls on an interval boundary
      const createdDate = new Date(habit.createdAt);
      createdDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      const daysSinceCreation = Math.floor((checkDate - createdDate) / 86400000);
      
      return daysSinceCreation >= 0 && daysSinceCreation % habit.frequency.interval === 0;
    }

    return false;
  }

  function calculateCompletionRate(habit) {
    const createdDate = new Date(habit.createdAt);
    const today = new Date();
    const daysSinceCreation = Math.floor((today - createdDate) / 86400000) + 1;

    let expectedDays = 0;

    if (habit.frequency.type === "daily") {
      expectedDays = daysSinceCreation;
    } else if (habit.frequency.type === "weekdays") {
      // Count expected days based on weekdays
      for (let i = 0; i < daysSinceCreation; i++) {
        const checkDate = new Date(createdDate);
        checkDate.setDate(checkDate.getDate() + i);
        if (habit.frequency.weekdays.includes(checkDate.getDay())) {
          expectedDays++;
        }
      }
    } else if (habit.frequency.type === "custom") {
      expectedDays = Math.floor(daysSinceCreation / habit.frequency.interval);
    }

    const completions = Store.habits.getCompletions(habit.id).length;

    if (expectedDays === 0) return 0;

    return Math.min(100, Math.round((completions / expectedDays) * 100));
  }

  // ============================================================================
  // Best Day Calculation (Task 12.6)
  // ============================================================================

  function calculateBestDay(habit) {
    const completions = Store.habits.getCompletions(habit.id);
    if (completions.length === 0) return null;

    // Count completions by day of week
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const completionsByDay = [0, 0, 0, 0, 0, 0, 0];
    const expectedByDay = [0, 0, 0, 0, 0, 0, 0];

    // Count actual completions by day
    completions.forEach(completion => {
      const date = new Date(completion.date);
      const dayOfWeek = date.getDay();
      completionsByDay[dayOfWeek]++;
    });

    // Count expected days by day of week
    const createdDate = new Date(habit.createdAt);
    const today = new Date();
    const daysSinceCreation = Math.floor((today - createdDate) / 86400000) + 1;

    for (let i = 0; i < daysSinceCreation; i++) {
      const checkDate = new Date(createdDate);
      checkDate.setDate(checkDate.getDate() + i);
      const dayOfWeek = checkDate.getDay();

      if (isExpectedDayForFrequency(habit, checkDate)) {
        expectedByDay[dayOfWeek]++;
      }
    }

    // Calculate completion rate for each day
    let bestDayIndex = -1;
    let bestRate = -1;

    for (let i = 0; i < 7; i++) {
      if (expectedByDay[i] > 0) {
        const rate = (completionsByDay[i] / expectedByDay[i]) * 100;
        if (rate > bestRate) {
          bestRate = rate;
          bestDayIndex = i;
        }
      }
    }

    if (bestDayIndex === -1) return null;

    return {
      dayName: dayNames[bestDayIndex],
      rate: Math.round(bestRate)
    };
  }

  // ============================================================================
  // Trend Calculation (Task 12.6)
  // ============================================================================

  function calculateTrend(habit) {
    const completions = Store.habits.getCompletions(habit.id);
    const createdDate = new Date(habit.createdAt);
    const today = new Date();
    const daysSinceCreation = Math.floor((today - createdDate) / 86400000) + 1;

    // Need at least 30 days of history
    if (daysSinceCreation < 30) return null;

    // Calculate recent completion rate (last 14 days)
    const recentStartDate = new Date(today);
    recentStartDate.setDate(recentStartDate.getDate() - 13); // Last 14 days including today

    let recentExpected = 0;
    let recentCompleted = 0;

    for (let i = 0; i < 14; i++) {
      const checkDate = new Date(recentStartDate);
      checkDate.setDate(checkDate.getDate() + i);
      const dateKey = checkDate.toISOString().split("T")[0];

      if (isExpectedDayForFrequency(habit, checkDate)) {
        recentExpected++;
        if (completions.some(c => c.date === dateKey)) {
          recentCompleted++;
        }
      }
    }

    // Calculate historical completion rate (all time before recent period)
    const historicalEndDate = new Date(recentStartDate);
    historicalEndDate.setDate(historicalEndDate.getDate() - 1);

    let historicalExpected = 0;
    let historicalCompleted = 0;

    for (let d = new Date(createdDate); d <= historicalEndDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split("T")[0];

      if (isExpectedDayForFrequency(habit, d)) {
        historicalExpected++;
        if (completions.some(c => c.date === dateKey)) {
          historicalCompleted++;
        }
      }
    }

    if (recentExpected === 0 || historicalExpected === 0) return null;

    const recentRate = (recentCompleted / recentExpected) * 100;
    const historicalRate = (historicalCompleted / historicalExpected) * 100;

    const difference = recentRate - historicalRate;
    const threshold = 10; // 10% threshold for stable

    if (difference > threshold) {
      return {
        label: "Improving",
        icon: "📈",
        description: `Recent completion rate (${Math.round(recentRate)}%) is higher than historical average (${Math.round(historicalRate)}%)`
      };
    } else if (difference < -threshold) {
      return {
        label: "Declining",
        icon: "📉",
        description: `Recent completion rate (${Math.round(recentRate)}%) is lower than historical average (${Math.round(historicalRate)}%)`
      };
    } else {
      return {
        label: "Stable",
        icon: "➡️",
        description: `Recent completion rate (${Math.round(recentRate)}%) is consistent with historical average (${Math.round(historicalRate)}%)`
      };
    }
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  function getFrequencyText(frequency) {
    if (frequency.type === "daily") return "Daily";

    if (frequency.type === "weekdays") {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const days = frequency.weekdays.map(d => dayNames[d]).join(", ");
      return days;
    }

    if (frequency.type === "custom") {
      return `Every ${frequency.interval} day${frequency.interval !== 1 ? 's' : ''}`;
    }

    return "Unknown";
  }

  // ============================================================================
  // Modal Management (Subtask 9.1, 9.2, 9.3)
  // ============================================================================

  let currentEditingHabitId = null;
  let currentReminders = [];

  function openCreateModal() {
    currentEditingHabitId = null;
    currentReminders = [];
    
    // Reset form
    document.getElementById("habit-form-title").textContent = "Add Habit";
    document.getElementById("habit-form").reset();
    clearAllErrors();
    
    // Set default color and icon
    document.querySelector('input[name="habit-color"][value="#5f9fb0"]').checked = true;
    document.querySelector('input[name="habit-icon"][value="📚"]').checked = true;
    
    // Reset frequency to daily
    document.querySelector('input[name="habit-frequency-type"][value="daily"]').checked = true;
    updateFrequencyOptions();
    
    // Clear reminders list
    renderRemindersList();
    
    Modal.openModal("modal-habit-form");
    
    // Bug Fix 2: Auto-focus on habit name input after modal opens
    setTimeout(() => {
      const nameInput = document.getElementById("habit-name");
      if (nameInput) {
        nameInput.focus();
      }
    }, 100);
  }

  function openEditModal(habitId) {
    const habit = Store.habits.getById(habitId);
    if (!habit) {
      window.showToast?.("Habit not found", "error");
      return;
    }
    
    currentEditingHabitId = habitId;
    currentReminders = [...(habit.reminders || [])];
    
    // Set form title
    document.getElementById("habit-form-title").textContent = "Edit Habit";
    clearAllErrors();
    
    // Populate form fields
    document.getElementById("habit-name").value = habit.name || "";
    document.getElementById("habit-description").value = habit.description || "";
    document.getElementById("habit-category").value = habit.category || "";
    document.getElementById("habit-target-time").value = habit.targetTime || "";
    
    // Set frequency
    const freqType = habit.frequency?.type || "daily";
    document.querySelector(`input[name="habit-frequency-type"][value="${freqType}"]`).checked = true;
    
    if (freqType === "weekdays" && habit.frequency.weekdays) {
      habit.frequency.weekdays.forEach(day => {
        const checkbox = document.querySelector(`.weekday-checkbox input[value="${day}"]`);
        if (checkbox) checkbox.checked = true;
      });
    } else if (freqType === "custom" && habit.frequency.interval) {
      document.getElementById("habit-frequency-interval").value = habit.frequency.interval;
    }
    
    updateFrequencyOptions();
    
    // Set color
    const colorInput = document.querySelector(`input[name="habit-color"][value="${habit.color}"]`);
    if (colorInput) {
      colorInput.checked = true;
    }
    
    // Set icon
    const iconInput = document.querySelector(`input[name="habit-icon"][value="${habit.icon}"]`);
    if (iconInput) {
      iconInput.checked = true;
    }
    
    // Render reminders
    renderRemindersList();
    
    Modal.openModal("modal-habit-form");
    
    // Bug Fix 2: Auto-focus on habit name input after modal opens
    setTimeout(() => {
      const nameInput = document.getElementById("habit-name");
      if (nameInput) {
        nameInput.focus();
      }
    }, 100);
  }

  function updateFrequencyOptions() {
    const selectedType = document.querySelector('input[name="habit-frequency-type"]:checked')?.value;
    
    document.getElementById("habit-frequency-weekdays").style.display = 
      selectedType === "weekdays" ? "block" : "none";
    document.getElementById("habit-frequency-custom").style.display = 
      selectedType === "custom" ? "block" : "none";
  }

  function renderRemindersList() {
    const container = document.getElementById("habit-reminders-list");
    if (!container) return;
    
    if (currentReminders.length === 0) {
      container.innerHTML = '<p class="muted">No reminders set</p>';
      return;
    }
    
    container.innerHTML = currentReminders
      .map((time, index) => `
        <div class="reminder-item">
          <span>${time}</span>
          <button class="btn btn-xs btn-danger" type="button" data-reminder-index="${index}">Remove</button>
        </div>
      `)
      .join("");
    
    // Bind remove buttons
    container.querySelectorAll("button[data-reminder-index]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.getAttribute("data-reminder-index"));
        removeReminder(index);
      });
    });
  }

  function addReminder() {
    const timeInput = document.getElementById("habit-reminder-time");
    const time = timeInput.value;
    const errorSpan = document.getElementById("habit-reminders-error");
    
    // Clear previous error
    errorSpan.textContent = "";
    
    // Validate time
    if (!time) {
      errorSpan.textContent = "Please select a time";
      return;
    }
    
    const validation = Utils.validateTime(time);
    if (!validation.valid) {
      errorSpan.textContent = validation.error;
      return;
    }
    
    // Check max 5 reminders
    if (currentReminders.length >= 5) {
      errorSpan.textContent = "Maximum 5 reminders allowed";
      return;
    }
    
    // Check for duplicates
    if (currentReminders.includes(time)) {
      errorSpan.textContent = "This reminder time already exists";
      return;
    }
    
    // Add reminder
    currentReminders.push(time);
    currentReminders.sort();
    
    // Clear input and re-render
    timeInput.value = "";
    renderRemindersList();
  }

  function removeReminder(index) {
    currentReminders.splice(index, 1);
    renderRemindersList();
  }

  function clearAllErrors() {
    // Clear error messages
    document.querySelectorAll(".error-message").forEach(el => {
      el.textContent = "";
    });
    
    // Remove error classes from inputs
    document.querySelectorAll(".input.error, textarea.error, select.error, fieldset.error").forEach(el => {
      el.classList.remove("error");
    });
  }
  
  function setFieldError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    const errorSpan = document.getElementById(`${fieldId}-error`);
    
    if (field) {
      field.classList.add("error");
    }
    
    if (errorSpan) {
      errorSpan.textContent = errorMessage;
    }
  }
  
  function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorSpan = document.getElementById(`${fieldId}-error`);
    
    if (field) {
      field.classList.remove("error");
    }
    
    if (errorSpan) {
      errorSpan.textContent = "";
    }
  }

  function validateHabitForm() {
    clearAllErrors();
    let isValid = true;
    
    // Validate name
    const name = document.getElementById("habit-name").value;
    const nameValidation = Utils.validateHabitName(name);
    if (!nameValidation.valid) {
      setFieldError("habit-name", nameValidation.error);
      isValid = false;
    }
    
    // Validate description
    const description = document.getElementById("habit-description").value;
    const descValidation = Utils.validateDescription(description);
    if (!descValidation.valid) {
      setFieldError("habit-description", descValidation.error);
      isValid = false;
    }
    
    // Validate frequency
    const freqType = document.querySelector('input[name="habit-frequency-type"]:checked')?.value;
    let frequency = { type: freqType };
    
    if (freqType === "weekdays") {
      const weekdays = Array.from(
        document.querySelectorAll('.weekday-checkbox input:checked')
      ).map(cb => parseInt(cb.value));
      frequency.weekdays = weekdays;
      
      const freqValidation = Utils.validateFrequency(frequency);
      if (!freqValidation.valid) {
        const fieldset = document.getElementById("habit-frequency-weekdays").closest("fieldset");
        if (fieldset) fieldset.classList.add("error");
        document.getElementById("habit-frequency-weekdays-error").textContent = freqValidation.error;
        isValid = false;
      }
    } else if (freqType === "custom") {
      const interval = parseInt(document.getElementById("habit-frequency-interval").value);
      frequency.interval = interval;
      
      const freqValidation = Utils.validateFrequency(frequency);
      if (!freqValidation.valid) {
        setFieldError("habit-frequency-interval", freqValidation.error);
        isValid = false;
      }
    }
    
    // Validate target time (optional)
    const targetTime = document.getElementById("habit-target-time").value;
    if (targetTime) {
      const timeValidation = Utils.validateTime(targetTime);
      if (!timeValidation.valid) {
        setFieldError("habit-target-time", timeValidation.error);
        isValid = false;
      }
    }
    
    // Validate color
    const color = document.querySelector('input[name="habit-color"]:checked')?.value;
    const colorValidation = Utils.validateColor(color);
    if (!colorValidation.valid) {
      window.showToast?.(colorValidation.error, "error");
      isValid = false;
    }
    
    // Validate icon
    const icon = document.querySelector('input[name="habit-icon"]:checked')?.value;
    const iconValidation = Utils.validateIcon(icon);
    if (!iconValidation.valid) {
      window.showToast?.(iconValidation.error, "error");
      isValid = false;
    }
    
    return isValid;
  }

  function handleHabitFormSubmit(e) {
    e.preventDefault();
    
    if (!validateHabitForm()) {
      return;
    }
    
    // Show loading state (Subtask 19.5)
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
      // Collect form data
      const name = document.getElementById("habit-name").value.trim();
      const description = document.getElementById("habit-description").value.trim();
      const category = document.getElementById("habit-category").value;
      const targetTime = document.getElementById("habit-target-time").value;
      const color = document.querySelector('input[name="habit-color"]:checked')?.value;
      const icon = document.querySelector('input[name="habit-icon"]:checked')?.value;
      
      // Build frequency object
      const freqType = document.querySelector('input[name="habit-frequency-type"]:checked')?.value;
      let frequency = { type: freqType };
      
      if (freqType === "weekdays") {
        frequency.weekdays = Array.from(
          document.querySelectorAll('.weekday-checkbox input:checked')
        ).map(cb => parseInt(cb.value));
      } else if (freqType === "custom") {
        frequency.interval = parseInt(document.getElementById("habit-frequency-interval").value);
      }
      
      const habitData = {
        name,
        description,
        category,
        targetTime,
        color,
        icon,
        frequency,
        reminders: [...currentReminders]
      };
      
      if (currentEditingHabitId) {
        // Update existing habit
        Store.habits.update(currentEditingHabitId, habitData);
        
        // Update notifications (Subtask 9.6)
        if (window.NotificationManager) {
          NotificationManager.cancelAllReminders(currentEditingHabitId);
          
          if (habitData.reminders.length > 0) {
            const habit = Store.habits.getById(currentEditingHabitId);
            habitData.reminders.forEach((time, index) => {
              NotificationManager.scheduleReminder(habit, time, `reminder-${index}`);
            });
          }
        }
        
        window.showToast?.(`"${name}" updated successfully! 🎉`, "success");
      } else {
        // Create new habit
        const newHabit = Store.habits.add(habitData);
        
        // Schedule notifications (Subtask 9.6)
        if (window.NotificationManager && habitData.reminders.length > 0) {
          // Request permission if needed
          NotificationManager.checkPermission().then(status => {
            if (status === "default") {
              NotificationManager.requestPermission().then(result => {
                if (result === "granted") {
                  habitData.reminders.forEach((time, index) => {
                    NotificationManager.scheduleReminder(newHabit, time, `reminder-${index}`);
                  });
                  window.showToast?.("Reminders scheduled! 🔔", "success", 3000);
                }
              });
            } else if (status === "granted") {
              habitData.reminders.forEach((time, index) => {
                NotificationManager.scheduleReminder(newHabit, time, `reminder-${index}`);
              });
              window.showToast?.("Reminders scheduled! 🔔", "success", 3000);
            }
          });
        }
        
        window.showToast?.(`"${name}" created successfully! 🎉`, "success");
      }
      
      // Close modal and refresh view
      Modal.closeModal("modal-habit-form");
      render();
      
    } catch (error) {
      console.error("Error saving habit:", error);
      window.showToast?.("Failed to save habit. Please try again.", "error");
    } finally {
      // Remove loading state (Subtask 19.5)
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  // ============================================================================
  // Delete and Archive Handlers (Subtask 9.5)
  // ============================================================================

  let pendingDeleteHabitId = null;
  let pendingArchiveHabitId = null;

  function openDeleteConfirm(habitId) {
    const habit = Store.habits.getById(habitId);
    if (!habit) return;

    pendingDeleteHabitId = habitId;

    const message = document.getElementById("habit-delete-message");
    if (message) {
      const streak = calculateCurrentStreak(habit);
      // Bug Fix 8: Enhanced warning for active habits
      if (!habit.archived && streak > 0) {
        message.textContent = `Are you sure you want to delete "${habit.name}"? This is an ACTIVE habit with a ${streak}-day streak. This will permanently remove all completion history and cannot be undone.`;
      } else if (!habit.archived) {
        message.textContent = `Are you sure you want to delete "${habit.name}"? This is an ACTIVE habit. This will permanently remove all completion history and cannot be undone.`;
      } else if (streak > 0) {
        message.textContent = `Are you sure you want to delete "${habit.name}"? This will remove all completion history including your ${streak}-day streak.`;
      } else {
        message.textContent = `Are you sure you want to delete "${habit.name}"? This will remove all completion history.`;
      }
    }

    Modal.openModal("modal-habit-delete");
  }

  function confirmDeleteHabit() {
    if (!pendingDeleteHabitId) return;

    const habitId = pendingDeleteHabitId;
    const habit = Store.habits.getById(habitId);
    const habitName = habit?.name || "Habit";
    
    // Show loading state (Subtask 19.5)
    const confirmBtn = document.getElementById("habit-delete-confirm");
    confirmBtn.classList.add('loading');
    confirmBtn.disabled = true;

    try {
      // Cancel all notifications (Subtask 9.6)
      if (window.NotificationManager) {
        NotificationManager.cancelAllReminders(habitId);
      }

      // Delete habit and completions
      Store.habits.delete(habitId);

      window.showToast?.(`"${habitName}" deleted successfully`, "success");
      Modal.closeModal("modal-habit-delete");
      pendingDeleteHabitId = null;

      render();
    } catch (error) {
      console.error("Error deleting habit:", error);
      window.showToast?.("Failed to delete habit. Please try again.", "error");
    } finally {
      // Remove loading state (Subtask 19.5)
      confirmBtn.classList.remove('loading');
      confirmBtn.disabled = false;
    }
  }

  function openArchiveConfirm(habitId) {
    const habit = Store.habits.getById(habitId);
    if (!habit) return;

    pendingArchiveHabitId = habitId;

    const message = document.getElementById("habit-archive-message");
    const confirmBtn = document.getElementById("habit-archive-confirm");
    
    if (message) {
      const streak = calculateCurrentStreak(habit);
      if (habit.archived) {
        message.textContent = `Unarchive "${habit.name}"? It will be shown in daily views again.`;
        if (confirmBtn) confirmBtn.textContent = "Unarchive";
      } else {
        if (streak > 0) {
          message.textContent = `Archive "${habit.name}"? Your ${streak}-day streak will be preserved but the habit will be hidden from daily views.`;
        } else {
          message.textContent = `Archive "${habit.name}"? It will be hidden from daily views but history will be preserved.`;
        }
        if (confirmBtn) confirmBtn.textContent = "Archive";
      }
    }

    Modal.openModal("modal-habit-archive");
  }

  function confirmArchiveHabit() {
    if (!pendingArchiveHabitId) return;

    const habitId = pendingArchiveHabitId;
    const habit = Store.habits.getById(habitId);
    if (!habit) return;
    
    const habitName = habit.name;
    const wasArchived = habit.archived;
    
    // Show loading state (Subtask 19.5)
    const confirmBtn = document.getElementById("habit-archive-confirm");
    confirmBtn.classList.add('loading');
    confirmBtn.disabled = true;

    try {
      // Update archived status
      Store.habits.update(habitId, { archived: !habit.archived });

      // Cancel all notifications if archiving (Subtask 9.6)
      if (!habit.archived && window.NotificationManager) {
        NotificationManager.cancelAllReminders(habitId);
      }

      window.showToast?.(
        wasArchived 
          ? `"${habitName}" unarchived successfully! 📂` 
          : `"${habitName}" archived successfully`,
        "success"
      );

      Modal.closeModal("modal-habit-archive");
      pendingArchiveHabitId = null;

      render();
    } catch (error) {
      console.error("Error archiving habit:", error);
      window.showToast?.("Failed to archive habit. Please try again.", "error");
    } finally {
      // Remove loading state (Subtask 19.5)
      confirmBtn.classList.remove('loading');
      confirmBtn.disabled = false;
    }
  }

  function render() {
    // Update habit count
    const habits = Store.habits.getActive();
    const countBadge = document.getElementById("habits-count");
    if (countBadge) {
      countBadge.textContent = `${habits.length} habit${habits.length !== 1 ? 's' : ''}`;
    }

    // Render active view
    if (activeView === "daily") renderDailyView();
    else if (activeView === "list") renderListView();
    else if (activeView === "stats") renderStatsView(selectedHabitId);
  }

  // ============================================================================
  // Public API
  // ============================================================================

  return {
    init,
    onShow,
    isInitialized: () => initialized,
    openCreateModal,
    calculateCurrentStreak,
    calculateLongestStreak
  };
})();

window.HabitsPage = HabitsPage;
