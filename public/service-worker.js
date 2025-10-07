self.addEventListener("install", event => {
  console.log("Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("Service Worker activado");
});

// ==============================
// 🔔 Recepción de notificaciones push
// ==============================
self.addEventListener("push", event => {
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
    })
  );
});

// ==============================
// 👆 Click en notificación
// ==============================
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
