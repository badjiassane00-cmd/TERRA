// Service worker de TERRA.
//
// Correction importante : l'ancienne version de ce fichier contenait de
// la syntaxe TypeScript ("event: any"), invalide en JavaScript pur —
// le navigateur échouait silencieusement à l'installer (l'appel
// register() dans page.tsx avale l'erreur avec .catch(() => {})).
// Résultat : le mode hors-ligne n'a jamais fonctionné. Cette version
// est du JS valide, et n'essaie plus de mettre en cache des noms de
// fichiers Next.js (hashés à chaque build, donc jamais stables).

const SHELL_CACHE = "sununature-shell-v4";
const API_CACHE = "sununature-api-v4";

const SHELL_URLS = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // Données de plantes : stratégie "network-first, cache de secours" —
  // toujours essayer d'avoir la version la plus à jour, mais rester
  // consultable hors-ligne avec la dernière version connue.
  if (url.pathname.startsWith("/api/plants/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Fichiers statiques Next.js (JS/CSS avec hash) : cache-first, ils ne
  // changent jamais de contenu pour un même nom de fichier.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Navigation (pages) : réseau d'abord, page d'accueil en secours si
  // hors-ligne et page jamais visitée.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
  }
});
