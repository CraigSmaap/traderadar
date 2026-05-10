// TradeRadar Service Worker

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Required for PWA installability
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "TradeRadar", body: "New signal available" };
  }

  const title = data.title || "TradeRadar Signal";
  const options = {
    body: data.body || "A new trade setup is ready.",
    icon: "/traderadar-mark.svg",
    badge: "/traderadar-mark.svg",
    tag: data.tag || "traderadar-signal",
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || "/live" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/live";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }
        return clients.openWindow(target);
      })
  );
});
