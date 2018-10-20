importScripts('js/sw/deferred_requests.js');

const appVersion   = 'v1';
const appCache     = 'restaurant-app-' + appVersion;
const dynamicCache = 'restaurant-content-' + appVersion;
const allCaches    = [
    appCache,
    dynamicCache
];

const appCacheFiles = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/js/dbhelper.js',
    '/css/styles.css',
    // '/data/restaurants.json',
    '/dist/idb.js',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
];

self.addEventListener('install', event => {
    console.log('installing worker');
    event.waitUntil(
        caches.open(appCache).then(cache => {
            console.log('caching', caches);
            return cache.addAll(appCacheFiles);
        })
    );
});

function fetchNew(request, cache) {
    return fetch(request)
        .then(response => {
            cache.put(request.url, response.clone());
            return response;
        })
        .catch(error => {
            console.error('Fetch failed');
        });
}

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('restaurant-')
                    && !allCaches.includes(cacheName);
                }).map(cacheName => {
                    console.log('clearing', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    )
});

function makeJsonResponse(jsonData) {
    return new Response(JSON.stringify(jsonData), {
        status: 200,
        statusText: 'OK',
        headers: {'Content-Type': 'application/json'}
    });
}

self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);

    var req = event.request.clone();

    // add review endpoint
    if (url.hostname === location.hostname && url.pathname === '/reviews/') {
        if (req.method === 'POST') {
            event.respondWith(
                fetchOrQueue(event.request.clone(),
                    makeJsonResponse({queued: true}))
            );
        }

        else if (req.method === 'GET') {
            function fromCache(request) {
                return caches.open(dynamicCache).then(cache => {
                    return cache.match(request).then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        throw 'Should not reach here';
                    })
                });
            }

            event.respondWith(
                fetch(event.request)
                    .then(response => {
                        // online first
                        if (response) {
                            // cache it
                            clonedResponse = response.clone();
                            caches.open(dynamicCache).then(cache => {
                                cache.put(req.clone(), clonedResponse);
                            })
                            return response;
                        }

                        // then cache
                        return fromCache(req);
                    })
                    .catch(() => {
                        // if fetch failed due to whatever reason
                        // try again from cache
                        return fromCache(req);
                    })
            );
        }
    }

    else if (url.pathname !== '/restaurant.html' &&
        (appCacheFiles.includes(url.pathname)
        // this one for leafletjs
        || appCacheFiles.includes(event.request.url))) {

        // console.log('serving skeleton files', event.request);
        event.respondWith(caches.match(event.request));
    }

    // only cache the data from our site
    else if (url.hostname === location.hostname) {
        event.respondWith(
            caches.open(dynamicCache).then(cache => {
                return cache.match(url, {ignoreSearch: true})
                    .then(response => {
                        // In this implementation, clients effectively
                        // lag behind in terms of when data get updated by 1 request.
                        if (response) {
                            fetchNew(event.request, cache);
                            return response;
                        }

                    return fetchNew(event.request, cache);
                })
            })
        );
    } else {
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('message', event => {
    if (event.data.action == 'skipWaiting') {
        self.skipWaiting();
    }
});

self.addEventListener('sync', event => {
    console.log(event);
    if (event.tag === 'sendQueuedReviews') {
        event.waitUntil(
            deferredQueue.flushQueue().then(() => {
                console.log('Queued messages have been sent');
            })
        );
    }
});