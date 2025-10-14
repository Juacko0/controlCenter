self.addEventListener("install", event => {
  console.log("Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");
  event.waitUntil(
    clients.claim()
  );
});

// ==============================
// 🔔 Recepción de notificaciones push
// ==============================
self.addEventListener("push", (event) => {
  let data = { title: "Notificación", body: "Tienes una nueva alerta" };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error("Error al parsear push data:", e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    })
  );
});

// ==============================
// 👆 Click en notificación
// ==============================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
