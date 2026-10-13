/* Optional offline cache for Tim's Travel Monopoly v7. Only used when the game is served over https
   (put this file next to the HTML). The single HTML file works fine without it.
   Strategy: network first (so updates arrive), fall back to the cached copy when offline. */
var CACHE = "travel-monopoly-v10";
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll([self.registration.scope]).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf("travel-monopoly") === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      if (r.mode === "navigate") return caches.match(self.registration.scope).then(function (h) { return h || Response.error(); });
      return Response.error();
    });
  }));
});
// the page asks for itself to be cached right away (the first visit isn't controlled by the worker yet)
self.addEventListener("message", function (e) {
  var u = e.data && e.data.cache;
  if (typeof u === "string" && new URL(u).origin === location.origin) e.waitUntil(caches.open(CACHE).then(function (c) { return c.add(u); }).catch(function () {}));
});
