// Tauri-specific notification enhancements
// This file provides better notification support when running as a Tauri app

const TauriNotifications = (() => {
  let isTauri = false;

  // Detect if running in Tauri
  function detectTauri() {
    // Check for Tauri-specific globals
    isTauri = window.__TAURI__ !== undefined || 
              window.__TAURI_INTERNALS__ !== undefined;
    return isTauri;
  }

  // Initialize Tauri notifications
  async function init() {
    detectTauri();
    
    if (isTauri) {
      console.log("Running in Tauri - native notifications enabled");
      
      // In Tauri, notifications are automatically granted
      // No need to request permission explicitly
      if (window.NotificationManager) {
        // Force permission status to granted in Tauri
        window.NotificationManager.checkPermission = async () => "granted";
        window.NotificationManager.requestPermission = async () => "granted";
      }
    }
  }

  // Enhanced notification for Tauri
  async function sendNotification(title, options = {}) {
    if (!isTauri) {
      // Fallback to web notifications
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, options);
      }
      return;
    }

    try {
      // Use Tauri's native notification API if available
      if (window.__TAURI__?.notification) {
        await window.__TAURI__.notification.sendNotification({
          title: title,
          body: options.body || "",
          icon: options.icon || ""
        });
      } else {
        // Fallback to web API
        new Notification(title, options);
      }
    } catch (error) {
      console.error("Failed to send Tauri notification:", error);
      // Fallback to web notification
      try {
        new Notification(title, options);
      } catch (e) {
        console.error("Fallback notification also failed:", e);
      }
    }
  }

  // Check if notifications are supported
  function isSupported() {
    return isTauri || ("Notification" in window);
  }

  // Get permission status
  async function getPermissionStatus() {
    if (isTauri) {
      return "granted"; // Tauri apps have automatic permission
    }
    return Notification.permission;
  }

  return {
    init,
    sendNotification,
    isSupported,
    getPermissionStatus,
    isTauri: () => isTauri
  };
})();

// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => TauriNotifications.init());
} else {
  TauriNotifications.init();
}

window.TauriNotifications = TauriNotifications;
