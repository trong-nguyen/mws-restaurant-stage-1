// Common code to register a service worker for the entire site

navigator.serviceWorker.register('/sw.js', {
    scope: '/'
}).then(
    reg => {
        // add sync event
        reg.sync.register('sendQueuedReviews');
    },
    err => {
        console.log('Error installing ServiceWorker', err);
    }
);