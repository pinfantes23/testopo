
const CACHE_NAME = "test-app-v6";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",

    "./css/styles.css",

    "./js/app.js",
    "./js/db.js",
    "./js/importer.js",
    "./js/test-generator.js",

    "./icons/uip.png"
];

self.addEventListener("install", event => {

    console.log("[SW] Instalando aplicación v6...");

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});


self.addEventListener("activate", event => {

    console.log("[SW] Activando aplicación v6...");

    event.waitUntil(
        caches
            .keys()
            .then(keys => {

                return Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                );

            })
            .then(() => self.clients.claim())
    );
});


self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }

    const url = new URL(event.request.url);

    /*
     * Para HTML, CSS y JavaScript:
     *
     * 1. Intentamos obtener la versión actual
     *    del servidor.
     *
     * 2. Si funciona, actualizamos la caché.
     *
     * 3. Si estamos offline, utilizamos la caché.
     */

    const esArchivoDeAplicacion =
        url.pathname.endsWith(".html") ||
        url.pathname.endsWith(".css") ||
        url.pathname.endsWith(".js");

    if (esArchivoDeAplicacion) {

        event.respondWith(

            fetch(event.request)
                .then(response => {

                    if (
                        response &&
                        response.status === 200 &&
                        response.type === "basic"
                    ) {

                        const copia = response.clone();

                        caches
                            .open(CACHE_NAME)
                            .then(cache => {
                                cache.put(
                                    event.request,
                                    copia
                                );
                            });
                    }

                    return response;
                })
                .catch(() => {

                    return caches.match(event.request);

                })
        );

        return;
    }

    /*
     * Para imágenes, manifest y demás recursos:
     * primero caché y, si no existe, servidor.
     */

    event.respondWith(

        caches
            .match(event.request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request);

            })
    );
});