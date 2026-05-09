const NotificationManager = (() => {
  // Private state
  let permissionStatus = "default"; // "default" | "granted" | "denied"
  let scheduledNotifications = {}; // { habitId: { reminderId: timeoutId } }
  let snoozeCounters = {}; // { "habitId-reminderId-date": count }
  
  // Constants
  const MAX_SNOOZE_PER_DAY = 3;
  const SNOOZE_DURATIONS = {
    short: 5 * 60 * 1000,      // 5 minutes
    medium: 15 * 60 * 1000,    // 15 minutes
    long: 60 * 60 * 1000       // 1 hour
  };

  // Permission management methods
  async function checkPermission() {
    if (!("Notification" in window)) {
      console.warn("Notification API not available");
      return "denied";
    }
    
    // Get current permission
    const currentPermission = Notification.permission;
    permissionStatus = currentPermission;
    
    console.log("Current notification permission:", currentPermission);
    return permissionStatus;
  }

  async function requestPermission() {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported in this browser");
      handleServiceWorkerUnavailable();
      return "denied";
    }
    
    try {
      console.log("Requesting notification permission...");
      
      // Request permission
      const result = await Notification.requestPermission();
      permissionStatus = result;
      
      console.log("Permission request result:", result);
      
      // If granted, schedule all reminders
      if (result === "granted") {
        console.log("Permission granted! Scheduling reminders...");
        scheduleAllReminders();
      } else if (result === "denied") {
        console.warn("Permission denied by user");
        handlePermissionDenied();
      }
      
      return result;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  }
  
  // Error handling functions (Subtask 19.2)
  function handlePermissionDenied() {
    if (window.showToast) {
      window.showToast(
        "Notification permission denied. Enable notifications in your browser settings to receive habit reminders.",
        "warning",
        5000
      );
    } else {
      alert(
        "Notification permission denied.\n\n" +
        "To enable notifications:\n" +
        "1. Click the lock icon in your browser's address bar\n" +
        "2. Find 'Notifications' in the permissions list\n" +
        "3. Change the setting to 'Allow'\n" +
        "4. Reload the page"
      );
    }
  }
  
  function handleServiceWorkerUnavailable() {
    if (window.showToast) {
      window.showToast(
        "Notifications are not supported in this browser. Habit reminders will not work.",
        "warning",
        4000
      );
    }
  }

  // Snooze helper functions
  function getSnoozeKey(habitId, reminderId, date) {
    return `${habitId}-${reminderId}-${date}`;
  }

  function getSnoozeCount(habitId, reminderId, date) {
    const key = getSnoozeKey(habitId, reminderId, date);
    return snoozeCounters[key] || 0;
  }

  function incrementSnoozeCount(habitId, reminderId, date) {
    const key = getSnoozeKey(habitId, reminderId, date);
    snoozeCounters[key] = (snoozeCounters[key] || 0) + 1;
  }

  function resetDailySnoozeCounters() {
    snoozeCounters = {};
  }

  // Notification delivery logic
  function shouldSendNotification(habit, date) {
    // Don't send if archived
    if (habit.archived) return false;
    
    // Don't send if already completed today
    if (Store.habits.isCompleted(habit.id, date)) return false;
    
    // Check frequency pattern
    const dayOfWeek = new Date(date).getDay();
    
    if (habit.frequency.type === "daily") {
      return true;
    }
    
    if (habit.frequency.type === "weekdays") {
      return habit.frequency.weekdays.includes(dayOfWeek);
    }
    
    if (habit.frequency.type === "custom") {
      // Check if today matches the interval
      const completions = Store.habits.getCompletions(habit.id);
      if (completions.length === 0) return true;
      
      const lastCompletion = completions
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const daysSinceCompletion = Math.floor(
        (new Date(date) - new Date(lastCompletion.date)) / 86400000
      );
      
      return daysSinceCompletion >= habit.frequency.interval;
    }
    
    return false;
  }

  async function sendNotification(habit, reminderId) {
    const today = Utils.getTodayKey();
    
    if (!shouldSendNotification(habit, today)) {
      return;
    }

    // Check permission before sending
    if (permissionStatus !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    const snoozeCount = getSnoozeCount(habit.id, reminderId, today);
    const canSnooze = snoozeCount < MAX_SNOOZE_PER_DAY;

    // Get absolute URL for icons (important for Windows notifications)
    const baseUrl = self.location ? self.location.origin : window.location.origin;
    const iconUrl = `${baseUrl}/512_icon.png`;
    const badgeUrl = `${baseUrl}/72_icon.png`;

    const options = {
      body: `Time to work on: ${habit.name}`,
      icon: iconUrl,
      badge: badgeUrl,
      tag: `habit-${habit.id}-${reminderId}`,
      requireInteraction: false,
      silent: false,
      data: {
        habitId: habit.id,
        reminderId,
        url: `${baseUrl}/index.html?tab=habits&habitId=${habit.id}`
      }
    };

    // Only add actions if service worker is available (not supported in all browsers/platforms)
    if (canSnooze && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
      options.actions = [
        { action: "snooze-short", title: "5 min" },
        { action: "snooze-medium", title: "15 min" },
        { action: "snooze-long", title: "1 hour" }
      ];
    }

    try {
      // Use standard Web Notification API
      // In Tauri, this automatically shows native Windows notifications
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(habit.name, options);
      } else {
        // Fallback to basic notification API
        new Notification(habit.name, options);
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  // Notification scheduling logic
  function scheduleReminder(habit, reminderTime, reminderId) {
    const now = new Date();
    const [hours, minutes] = reminderTime.split(":").map(Number);
    
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const delay = scheduledTime - now;
    
    const timeoutId = setTimeout(() => {
      sendNotification(habit, reminderId);
      // Reschedule for next day
      scheduleReminder(habit, reminderTime, reminderId);
    }, delay);
    
    if (!scheduledNotifications[habit.id]) {
      scheduledNotifications[habit.id] = {};
    }
    scheduledNotifications[habit.id][reminderId] = timeoutId;
  }

  function cancelReminder(habitId, reminderId) {
    if (scheduledNotifications[habitId]?.[reminderId]) {
      clearTimeout(scheduledNotifications[habitId][reminderId]);
      delete scheduledNotifications[habitId][reminderId];
    }
  }

  function cancelAllReminders(habitId) {
    if (scheduledNotifications[habitId]) {
      Object.values(scheduledNotifications[habitId]).forEach(clearTimeout);
      delete scheduledNotifications[habitId];
    }
  }

  function scheduleAllReminders() {
    // Clear existing
    Object.keys(scheduledNotifications).forEach(cancelAllReminders);
    
    // Schedule all active habits
    const habits = Store.habits.getActive();
    habits.forEach(habit => {
      (habit.reminders || []).forEach((time, index) => {
        scheduleReminder(habit, time, `reminder-${index}`);
      });
    });
  }

  // Snooze functionality
  function handleSnooze(habitId, reminderId, duration) {
    const today = Utils.getTodayKey();
    incrementSnoozeCount(habitId, reminderId, today);
    
    const habit = Store.habits.getById(habitId);
    if (!habit) return;
    
    setTimeout(() => {
      sendNotification(habit, reminderId);
    }, duration);
  }

  // Test notification (for debugging)
  async function sendTestNotification() {
    // Always check current permission status first
    const currentPermission = await checkPermission();
    
    if (currentPermission !== "granted") {
      console.log("Permission not granted, requesting...");
      const result = await requestPermission();
      console.log("Permission request result:", result);
      
      if (result !== "granted") {
        return { success: false, message: "Permission denied. Please enable notifications in your browser/system settings." };
      }
    }

    const baseUrl = self.location ? self.location.origin : window.location.origin;
    const iconUrl = `${baseUrl}/512_icon.png`;
    
    try {
      console.log("Attempting to send test notification...");
      
      // Use standard Web Notification API
      // In Tauri, this shows native Windows notifications automatically
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("CP4 Habit Tracker", {
          body: "Notifications are working! You'll receive reminders for your habits.",
          icon: iconUrl,
          tag: "test-notification"
        });
      } else {
        // Direct notification (works in Tauri)
        const notification = new Notification("CP4 Habit Tracker", {
          body: "Notifications are working! You'll receive reminders for your habits.",
          icon: iconUrl,
          tag: "test-notification"
        });
        
        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
      
      console.log("Test notification sent successfully");
      return { success: true, message: "Test notification sent" };
    } catch (error) {
      console.error("Test notification failed:", error);
      return { success: false, message: `Failed: ${error.message}` };
    }
  }

  // Initialization
  function init() {
    console.log("NotificationManager initializing...");
    
    // Check initial permission
    checkPermission().then(status => {
      console.log("Initial permission status:", status);
    });
    
    // Check for notification support (Subtask 19.4)
    if (!checkNotificationSupport()) {
      console.warn("Notifications not supported");
      return; // Exit early if notifications not supported
    }
    
    // Reset snooze counters at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
      resetDailySnoozeCounters();
      // Set up daily reset
      setInterval(resetDailySnoozeCounters, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
    
    // Schedule all reminders if permission granted
    if (permissionStatus === "granted") {
      console.log("Permission already granted, scheduling reminders");
      scheduleAllReminders();
    }
    
    // Log initialization status
    console.log("NotificationManager initialized. Permission status:", permissionStatus);
  }
  
  // Graceful degradation checks (Subtask 19.4)
  function checkNotificationSupport() {
    if (!("Notification" in window)) {
      console.warn("Notifications are not supported in this browser");
      return false;
    }
    return true;
  }
  
  function checkServiceWorkerSupport() {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Workers are not supported in this browser");
      return false;
    }
    return true;
  }

  // Public API
  return {
    init,
    checkPermission,
    requestPermission,
    scheduleReminder,
    cancelReminder,
    cancelAllReminders,
    scheduleAllReminders,
    handleSnooze,
    sendTestNotification,
    handlePermissionDenied,
    handleServiceWorkerUnavailable,
    checkNotificationSupport,
    checkServiceWorkerSupport,
    getPermissionStatus: () => permissionStatus,
    SNOOZE_DURATIONS
  };
})();

window.NotificationManager = NotificationManager;
