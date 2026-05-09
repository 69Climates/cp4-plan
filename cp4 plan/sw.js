const CACHE = "cp4-v48";

const FILES = [
  "index.html",
  "manifest.json",
  "72_icon.png",
  "512_icon.png",
  "assets/fonts/SourceSerif4-Variable.ttf",
  "assets/fonts/SourceSerif4-Italic-Variable.ttf",
  "css/main.css",
  "css/components.css",
  "css/dashboard.css",
  "css/weekplan.css",
  "css/problems.css",
  "css/contests.css",
  "css/notes.css",
  "css/stats.css",
  "css/timer.css",
  "js/app.js?v=20260419f",
  "js/store.js",
  "js/utils.js",
  "js/data/seed.js",
  "js/pages/dashboard.js?v=20260419c",
  "js/pages/weekplan.js",
  "js/pages/problems.js?v=20260419m",
  "js/pages/contests.js",
  "js/pages/notes.js",
  "js/pages/stats.js?v=20260419a",
  "js/pages/timer.js",
  "js/components/modal.js",
  "js/components/toast.js",
  "js/components/search.js",
  "js/components/pomodoro.js",
  "js/components/session.js",
  "js/components/doomnotes.js",
  "js/components/heatmap.js?v=20260419h",
  "js/components/tagheatmap.js",
  "js/components/charts.js?v=20260419a",
  "js/components/notifications.js",
  "pages/dashboard.html",
  "pages/habits.html",
  "pages/pdf-viewer.html",
  "pages/weekplan.html",
  "pages/problems.html",
  "pages/contests.html",
  "pages/notes.html",
  "pages/stats.html",
  "pages/timer.html",
  "css/habits.css",
  "js/pages/habits.js",
  "assets/icons/icon-72.png",
  "assets/icons/icon-96.png",
  "assets/icons/icon-128.png",
  "assets/icons/icon-144.png",
  "assets/icons/icon-152.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-384.png",
  "assets/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  const urls = FILES.map((file) => new URL(file, self.registration.scope).href);
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(urls)).catch(() => Promise.resolve())
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isCacheableResponse(response) {
  return !!response && response.status === 200 && response.type !== "opaque";
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

function isNetworkFirstRequest(request) {
  const url = new URL(request.url);
  const scopePath = new URL(self.registration.scope).pathname;
  const relativePath = url.pathname.startsWith(scopePath)
    ? url.pathname.slice(scopePath.length)
    : url.pathname.replace(/^\/+/, "");

  return (
    request.mode === "navigate" ||
    relativePath === "" ||
    relativePath === "index.html" ||
    relativePath === "js/app.js" ||
    relativePath.startsWith("pages/") ||
    relativePath.startsWith("js/pages/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const htmlFallback = () => {
    if (request.headers.get("accept")?.includes("text/html")) {
      const fallbackUrl = new URL("index.html", self.registration.scope).href;
      return caches.match(fallbackUrl);
    }
    return null;
  };

  if (isNetworkFirstRequest(request)) {
    event.respondWith(
      fetchAndCache(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const fallback = await htmlFallback();
        if (fallback) return fallback;

        return new Response("Offline", {
          status: 503,
          statusText: "Offline fallback"
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetchAndCache(request)
        .catch(() => {
          const fallback = htmlFallback();
          if (fallback) return fallback;
          return new Response("Offline", {
            status: 503,
            statusText: "Offline fallback"
          });
        });
    })
  );
});

// Notification click event handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  // Handle snooze actions
  if (action.startsWith("snooze-")) {
    const duration = action.replace("snooze-", "");
    event.waitUntil(
      clients.matchAll({ type: "window" }).then(clientList => {
        if (clientList.length > 0) {
          clientList[0].postMessage({
            type: "snooze-notification",
            habitId: data.habitId,
            reminderId: data.reminderId,
            duration
          });
        }
      })
    );
    return;
  }
  
  // Default action: open app to habits page
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clientList => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && "focus" in client) {
            return client.focus().then(client => {
              client.postMessage({
                type: "navigate-to-habit",
                habitId: data.habitId
              });
            });
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(data.url || "./index.html?tab=habits");
        }
      })
  );
});

// Notification close event handler
self.addEventListener("notificationclose", (event) => {
  // Log notification dismissals for tracking
  console.log("Notification closed:", event.notification.tag);
});
