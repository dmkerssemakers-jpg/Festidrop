// FestiDrop Service Worker — offline-first for event pages
const CACHE = 'festidrop-v2';

// Skip these routes entirely — server-rendered, auth-dependent
const SKIP = [/^\/api\//, /^\/admin\//, /^\/login/, /^\/factuur\//];

// ── Install: pre-cache the bare minimum shell ────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['/', '/manifest.json', '/icon.svg']))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: wipe old caches ────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: two strategies ────────────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip auth/admin/API routes — always go to network
  if (SKIP.some(p => p.test(url.pathname))) return;

  // ── Static assets (_next/static) → Cache First ──────────────
  // These have content hashes in filenames → safe to cache forever
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then(hit => {
        if (hit) return hit;
        return fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        }).catch(() => new Response('', { status: 408 }));
      })
    );
    return;
  }

  // ── Pages & other assets → Network First, Cache Fallback ────
  // Tries to get fresh content; falls back to cache when offline
  e.respondWith(
    fetch(e.request, { credentials: 'include' })
      .then(res => {
        // Cache successful page responses
        if (res.ok && res.status < 400) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          // Offline fallback for navigation requests
          if (e.request.mode === 'navigate') {
            return caches.match('/').then(root => root ?? new Response(
              '<h1>Geen verbinding</h1><p>Open de app eerst met internet om hem te cachen.</p>',
              { headers: { 'Content-Type': 'text/html' } }
            ));
          }
          return new Response('', { status: 408 });
        })
      )
  );
});
