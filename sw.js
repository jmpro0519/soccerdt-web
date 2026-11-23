/* SOCCERDT · service worker mínimo: siempre intenta la red primero (nunca sirve una versión vieja si hay conexión)
   y solo usa la copia guardada si no hay internet. No toca las llamadas al servidor de la liga. */
const V = 'sdt-3';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  /* la página y los scripts se piden siempre comprobando si hay versión nueva (sin esperar a la caché de 10 min del servidor) */
  const fresh = r.mode === 'navigate' || /\.(html|js|webmanifest)$/.test(u.pathname) || u.pathname === '/';
  e.respondWith((fresh ? fetch(r.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(r)).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(ch => ch.put(r, c)); } return res; }).catch(() => caches.match(r).then(m => m || caches.match('/') )));
});

/* Avisos push: el servidor envía {c,t,b,ln,lid}; aquí solo se muestran. */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { }
  const t = d.t || 'SOCCERDT', o = { body: d.b || '', icon: '/icon-192.png', badge: '/icon-192.png', tag: (d.c || 'sdt') + ':' + (d.lid || 0), renotify: true, data: { lid: d.lid || 0 } };
  if (d.ln) o.body = d.b ? d.b + ' · ' + d.ln : d.ln;
  e.waitUntil(self.registration.showNotification(t, o));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => { for (const c of l) { if ('focus' in c) return c.focus(); } return self.clients.openWindow('/'); }));
});
