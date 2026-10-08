const CACHE = 'countdown-static-v2';
const FILES = [
  './', './index.html', './abwesenheiten.html', './styles.css', './countdown.js',
  './app.js', './absences.js', './db.js', './seed-data.js', './pwa.js',
  './manifest.webmanifest', './assets/Palmen.jpg', './icons/icon-192.png',
  './icons/icon-512.png', './icons/icon-maskable.png',
];
const allowedUrls = new Set(FILES.map(file => new URL(file, self.location).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('countdown-static-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !allowedUrls.has(event.request.url)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request);
    return cached || fetch(event.request);
  }));
});