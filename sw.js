// Service Worker for StreetSentinel
const CACHE_NAME = 'streetsentinel-v3';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache strategy: Network-First for HTML navigation, Cache-First for static assets
self.addEventListener('fetch', (e) => {
  // Avoid interception of external APIs or database auth routes
  if (
    e.request.url.includes('/api') || 
    e.request.url.includes('firebase') || 
    e.request.url.includes('nominatim') || 
    e.request.url.includes('osrm') ||
    e.request.url.includes('ipwho') ||
    e.request.method !== 'GET'
  ) {
    return;
  }

  // HTML navigation requests: Network-First so users always get the latest deployment
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).then((response) => {
        if (response.ok && e.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});

// Handle custom push notifications from server
self.addEventListener('push', (e) => {
  let data = { title: 'StreetSentinel Alert', body: 'Emergency countdown initiated!' };
  if (e.data) {
    try {
      data = e.data.json();
    } catch (err) {
      data = { title: 'StreetSentinel Alert', body: e.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: './favicon.svg',
    badge: './favicon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || './'
    },
    requireInteraction: true
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click to focus or open window
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const urlToOpen = e.notification.data?.url || './';

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
