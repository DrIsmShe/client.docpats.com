/* DocPats service worker: web-push + PWA (устанавливаемость).
   Показывает пуш-уведомления и открывает нужную страницу по клику. */

// Активируемся сразу, не ждём закрытия старых вкладок.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

// Пассивный fetch-обработчик — нужен для установочных критериев PWA.
// Кэширование НЕ делаем (минимальный PWA): запросы идут в сеть как обычно.
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "DocPats";
  const options = {
    body: data.body || "",
    icon: "/logo_docpats_192.png",
    badge: "/logo_docpats_192.png",
    data: { url: data.url || "/" },
    tag: data.tag || undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) {
            client.navigate(url).catch(() => {});
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
