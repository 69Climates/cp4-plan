// Tauri-specific notification enhancements
// This file provides better notification support when running as a Tauri app

const TauriNotifications = (() => {
  let isTauri = false;
  let tauriAPI = null;

  // Detect if running in Tauri
  function detectTauri() {
    // Check for Tauri-specific globals
    isTauri = window.__TAURI__ !== undefined || 
              window.__TAURI_INTERNALS__ !== undefined;
    
    if (isTauri && window.__TAURI__) {
      // Try to get the notification API
      try {
        tauriAPI = window.__TAURI__;
      } catch (e) {
        console.warn("Tauri API not fully available:", e);
      }
    }
    
    return isTauri;
  }

  // Initialize Tauri notifications
  async function init() {
    detectTauri();
    
    if (isTauri) {
      console.log("Running in Tauri - using Web Notification API with Tauri enhancements");
      
      // In Tauri, Web Notifications work automatically
      // No need to override NotificationManager
      // Just ensure permission is granted
      if (window.NotificationManager) {
        // Check if notifications are supported
        if ("Notification" in window) {
          console.log("Web Notifications available in Tauri");
        }
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
      // In Tauri v2, use the standard Web Notification API
      // It's automatically handled by Tauri and shows native notifications
      if ("Notification" in window) {
        // Check permission
        if (Notification.permission === "granted") {
          new Notification(title, options);
        } else if (Notification.permission === "default") {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            new Notification(title, options);
          }
        }
      }
    } catch (error) {
      console.error("Failed to send Tauri notification:", error);
      // Fallback: try basic notification
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
      // In Tauri, check Web Notification permission
      return "Notification" in window ? Notification.permission : "denied";
    }
    return "Notification" in window ? Notification.permission : "denied";
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
