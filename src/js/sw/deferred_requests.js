/*
DEFERRED REQUEST RECIPE FROM
https://github.com/mozilla/serviceworker-cookbook/blob/master/request-deferrer/service-worker.js
*/

importScripts('js/dist/idb.js');

class DeferredQueue {
  constructor(mainDb) {
    const cachePromise = idb.open(mainDb, 1, db => {
      if(!db.objectStoreNames.contains('deferred-queue')) {
        db.createObjectStore('deferred-queue');
      }
    });

    this.queueDb = {
      get() {
        if (!cachePromise) {
          throw 'Init queueDb first';
        }
        return cachePromise.then(db => {
          return db.transaction('deferred-queue')
            .objectStore('deferred-queue').get('queue');
        });
      },
      set(val) {
        if (!cachePromise) {
          throw 'Init queueDb first';
        }
        return cachePromise.then(db => {
          const tx = db.transaction('deferred-queue', 'readwrite');
          tx.objectStore('deferred-queue').put(val, 'queue');
          return tx.complete;
        });
      }
    };
  }

  // By using Mozilla's localforage db wrapper, we can count on
  // a fast setup for a versatile key-value database. We use
  // it to store queue of deferred requests.

  // Enqueue consists of adding a request to the list. Due to the
  // limitations of IndexedDB, Request and Response objects can not
  // be saved so we need an alternative representations. This is
  // why we call to `serialize()`.`
  enqueue(request) {
    const queueDb = this.queueDb;
    return DeferredQueue.serialize(request).then(function(serialized) {
      queueDb.get().then(function(queue) {
        /* eslint no-param-reassign: 0 */
        queue = queue || [];
        queue.push(serialized);
        return queueDb.set(queue).then(function() {
          console.log(serialized.method, serialized.url, 'enqueued!');
        });
      });
    });
  }

  // Flush is a little more complicated. It consists of getting
  // the elements of the queue in order and sending each one,
  // keeping track of not yet sent request. Before sending a request
  // we need to recreate it from the alternative representation
  // stored in IndexedDB.
  flushQueue() {
    const queueDb = this.queueDb;
    // Get the queue
    return queueDb.get().then(function(queue) {
      /* eslint no-param-reassign: 0 */
      queue = queue || [];

      // If empty, nothing to do!
      if (!queue.length) {
        return Promise.resolve();
      }

      // Else, send the requests in order...
      console.log('Sending ', queue.length, ' requests...');
      return sendInOrder(queue).then(function() {
        // **Requires error handling**. Actually, this is assuming all the requests
        // in queue are a success when reaching the Network. So it should empty the
        // queue step by step, only popping from the queue if the request completes
        // with success.
        return queueDb.set([]);
      });
    });
  }

  // Serialize is a little bit convolved due to headers is not a simple object.
  static serialize(request) {
    var headers = {};
    // `for(... of ...)` is ES6 notation but current browsers supporting SW, support this
    // notation as well and this is the only way of retrieving all the headers.
    for (var entry of request.headers.entries()) {
      headers[entry[0]] = entry[1];
    }
    var serialized = {
      url: request.url,
      headers: headers,
      method: request.method,
      mode: request.mode,
      credentials: request.credentials,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer
    };

    // Only if method is not `GET` or `HEAD` is the request allowed to have body.
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return request.clone().text().then(function(body) {
        serialized.body = body;
        return Promise.resolve(serialized);
      });
    }
    return Promise.resolve(serialized);
  }

  // Compared, deserialize is pretty simple.
  static deserialize(data) {
    return Promise.resolve(new Request(data.url, data));
  }
}

const deferredQueue = new DeferredQueue('queueDb');


// Send the requests inside the queue in order. Waiting for the current before
// sending the next one.
function sendInOrder(requests) {
  // The `reduce()` chains one promise per serialized request, not allowing to
  // progress to the next one until completing the current.
  var sending = requests.reduce(function(prevPromise, serialized) {
    console.log('Sending', serialized.method, serialized.url);
    return prevPromise.then(function() {
      return DeferredQueue.deserialize(serialized).then(function(request) {
        return fetch(request);
      });
    });
  }, Promise.resolve());
  return sending;
}

// This function factory does exactly that.
function fetchOrQueue(request, responseIfQueued) {
  // Return a handler that...
  if (!navigator.onLine) {
    console.log('No network availability, enqueuing');
    return deferredQueue.enqueue(request).then(() => {
      // return a response with a queued property
      return responseIfQueued;
    });
  }

  return fetch(request);
}