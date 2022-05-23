const cacheName = "edge-v1";
const contentToCache = [
	"/",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon-194x194.png",
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/mstile-150x150.png",
  "/safari-pinned-tab.svg",
  "/browserconfig.xml",
];

self.addEventListener("install", (e) => {
  console.log("[Service Worker] Install");
  e.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      console.log("[Service Worker] Caching All Content");
      await cache.addAll(contentToCache);
    })()
  );
});

self.addEventListener("fetch", (e) => {
  const url = (new URL(e.request.url)).pathname;

	if(url.startsWith('/f/')) {
		e.respondWith((async () => {
			const cache = await caches.open(cacheName);
			const cacheResponse = await cache.match(e.request);
			const networkResponse = await fetch(e.request);
			cache.put(e.request, networkResponse.clone());
			return cacheResponse || networkResponse;
		})());
		return;
	};

  switch (url) {
    case "/": {
			e.respondWith((async () => {
				const networkResponse = await fetch(e.request);

				if(networkResponse.type === 'opaqueredirect') {
					return Response.redirect('/~', 307);
				}

				if(!networkResponse.ok) {
					const cache = await caches.open(cacheName);
					const cacheResponse = await cache.match(e.request);
					if(cacheResponse) { return cacheResponse; }
				}

				return networkResponse;
			})());
      break;
    }
    case "/~": {
      e.respondWith((async () => {
				const networkResponse = await fetch(e.request);
				return networkResponse;
			})());
      break;
    }
    default: {
      e.respondWith((async () => {			
				const cache = await caches.open(cacheName);
				const cacheResponse = await cache.match(e.request);
				if(cacheResponse) { return cacheResponse; }
				else {
					const networkResponse = await fetch(e.request);
					cache.put(e.request, networkResponse.clone());
					return networkResponse;
				};
    	})());
		}
  }
});
