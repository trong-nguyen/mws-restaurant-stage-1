var appCache = 'restaurant-app-v1';
var dynamicCache = 'restaurant-content';
var allCaches = [
    appCache,
    dynamicCache
];

self.addEventListener('install', event => {
    console.log('installing worker');
    event.waitUntil(
        caches.open(appCache).then(cache => {
            console.log('caching', caches);
            self.p = cache.addAll([
                '/index.html',
                '/restaurant.html',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/js/dbhelper.js',
                '/css/styles.css'
            ]);
            return p;
        })
    );
});

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
    event.respondWith(
        caches.open(dynamicCache).then(cache => {
            return fetch(event.request).then(response => {
                cache.put(event.request.url, response.clone());
                return response;
            });
        })
    );
});

self.addEventListener('message', event => {
    if (event.data.action == 'skipWaiting') {
        self.skipWaiting();
    }
})