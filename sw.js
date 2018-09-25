var appCache = 'restaurant-app-v1';
var dynamicCache = 'restaurant-content';
var allCaches = [
    appCache,
    dynamicCache
];

var appCacheFiles = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/js/dbhelper.js',
    '/css/styles.css',
    '/data/restaurants.json',
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
    return fetch(request).then(response => {
        cache.put(request.url, response.clone());
        return response;
    });
}

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('restaurant-app')
                    && !allCaches.includes(cacheName);
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    )
});

self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);
    // console.log(url);

    if (url.pathname !== '/restaurant.html' &&
        (appCacheFiles.includes(url.pathname)
        // this one for leafletjs
        || appCacheFiles.includes(event.request.url))) {

        // console.log('serving skeleton files', event.request);
        event.respondWith(caches.match(url));
    }

    // only cache the data from our site
    // else if (url.origin === location.origin) {
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
})