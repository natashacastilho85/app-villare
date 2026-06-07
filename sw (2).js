const CACHE = 'villare-v35';
const STATIC = ['/', '/index.html', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('supabase.co')) return;

  // Intercepta navegações para a raiz do PWA — evita que o Chrome
  // feche o app ao recuar no histórico até uma entrada sem estado JS
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html')
        .then(cached => cached || fetch(e.request))
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// PUSH: recebe e exibe a notificação
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        appUrl: data.appUrl || '/',
      },
      requireInteraction: true,
      vibrate: [200, 100, 200],
    })
  );
});

// NOTIFICATIONCLICK: abre o app na URL certa
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const appUrl = e.notification.data?.appUrl || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(appUrl);
      } else {
        clients.openWindow(appUrl);
      }
    })
  );
});
