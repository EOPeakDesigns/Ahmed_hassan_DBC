/**
 * Service Worker — Tour Guide Digital Business Card
 * Bump CACHE_VERSION when static assets change.
 */
const CACHE_VERSION = 'dbc-gm-v20';
const CACHE_NAME = `tour-guide-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/data/card.json',
  '/styles/variables.css',
  '/styles/base.css',
  '/styles/layout.css',
  '/styles/components.css',
  '/styles/animations.css',
  '/styles/responsive.css',
  '/styles/interactions.css',
  '/scripts/interaction-utils.js',
  '/scripts/card-loader.js',
  '/scripts/clipboard-manager.js',
  '/scripts/modal-manager.js',
  '/scripts/video-handler.js',
  '/scripts/social-interactions.js',
  '/scripts/vcard-manager.js',
  '/scripts/share-manager.js',
  '/scripts/email-link-manager.js',
  '/scripts/pwa-manager.js',
  '/scripts/app.js',
  '/assets/favicon.svg',
  '/assets/site.webmanifest',
  '/assets/owner.png',
  '/assets/MYQR.png',
  '/assets/images/background.png',
  '/404.html',
  '/robots.txt'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('tour-guide-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/data/card.json')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, '/index.html'));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

async function networkFirst(request, fallbackPath) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackPath) {
      const fallback = await cache.match(fallbackPath);
      if (fallback) return fallback;
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || networkFetch || Response.error();
}
