self.addEventListener('push', (event) => {
  let payload = { title: 'UriGo', body: '', data: {}, url: '/notificacoes' };
  try {
    payload = { ...payload, ...JSON.parse(event.data?.text() ?? '{}') };
  } catch {
    /* ignore */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { url: payload.url, ...payload.data },
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/notificacoes';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
