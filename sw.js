// sw.js - Service Worker para Gruken
const CACHE_NAME = 'gruken-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/scrip.js'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Estrategia de carga: Primero red, si falla, caché
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});