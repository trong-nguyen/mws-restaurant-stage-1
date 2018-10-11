importScripts('js/sw/deferred_requests.js');

// tryOrFallback(new Response(
//   JSON.stringify([{
//     text: 'You are offline and I know it well.',
//     author: 'The Service Worker Cookbook',
//     id: 1,
//     isSticky: true
//   }]),
//   { headers: { 'Content-Type': 'application/json' } }
// ));

testResponse = new Response(
  JSON.stringify([{
    text: 'You are offline and I know it well.',
    author: 'The Service Worker Cookbook',
    id: 1,
    isSticky: true
  }]),
  { headers: { 'Content-Type': 'application/json' } }
);

// tryOrFallback(testResponse);

var appVersion = 'v1';
var appCache = 'restaurant-app-' + appVersion;
var dynamicCache = 'restaurant-content-' + appVersion;
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
    // console.log(url);

    var req = event.request.clone();

    // add review endpoint
    if (req.method === 'POST' && url.pathname === '/reviews') {
        req.json().then(submitedData => {
            tryOrFallback(null)(event.request.clone());
            // return the review regardless of results
            event.respondWith(makeJsonResponse(submitedData));
        });
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



// /* eslint-env es6 */
// /* eslint no-unused-vars: 0 */
// /* global importScripts, ServiceWorkerWare, localforage */
// importScripts('./lib/ServiceWorkerWare.js');
// importScripts('./lib/localforage.js');

// // Determine the root for the routes. I.e, if the Service Worker URL is
// // `http://example.com/path/to/sw.js`, then the root is
// // `http://example.com/path/to/`
// var root = (function() {
//   var tokens = (self.location + '').split('/');
//   tokens[tokens.length - 1] = '';
//   return tokens.join('/');
// })();

// // By using Mozilla's ServiceWorkerWare we can quickly setup some routes
// // for a _virtual server_. **It is convenient you review the
// // [virtual server recipe](/virtual-server.html) before seeing this**.
// var worker = new ServiceWorkerWare();

// // A fake response with a joke for when there is no connection. A real
// // implementation could have cached the last collection of quotations
// // and keep a local model. For simplicity, not implemented here.
// worker.get(root + 'api/quotations?*', tryOrFallback(new Response(
//   JSON.stringify([{
//     text: 'You are offline and I know it well.',
//     author: 'The Service Worker Cookbook',
//     id: 1,
//     isSticky: true
//   }]),
//   { headers: { 'Content-Type': 'application/json' } }
// )));
