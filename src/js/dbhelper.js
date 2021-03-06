/**
 * Common database helper functions.
 */
// import idb from 'idb';

const RESTAURANT_DB_NAME = 'restaurant-db';

let dbPromise = idb.open(RESTAURANT_DB_NAME, 1, db => {
  if(!db.objectStoreNames.contains('keyval')) {
    db.createObjectStore('keyval');
  }
});

// jake archibald implement
const RestaurantDb = {
  get(key) {
    return dbPromise.then(db => {
      return db.transaction('keyval')
        .objectStore('keyval').get(key);
    });
  },
  set(key, val) {
    return dbPromise.then(db => {
      const tx = db.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').put(val, key);
      return tx.complete;
    });
  }
};

function requestJson(url) {
  return fetch(url).then(response => {
    return response.json();
  });
}

function fetchRestaurantsWithAction(action, callback) {
  DBHelper.fetchRestaurants()
    .then(restaurants => {
      const results = action(restaurants);
      callback(null, results);
    })
    .catch(error => {
      callback(error, null);
    });
}


class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get SERVER_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
  }

  static get POST_REVIEW_ENDPOINT() {
    return `${DBHelper.SERVER_URL}/reviews/`;
  }

  // http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=true

  static getRestaurantEndpoint(id) {
    return `${DBHelper.SERVER_URL}/restaurants/${id}`;
  }

  static getRestaurantReviewsEndpoint(id) {
    return `${DBHelper.SERVER_URL}/reviews/?restaurant_id=${id}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    return requestJson(`${DBHelper.SERVER_URL}/restaurants`);
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    return requestJson(DBHelper.getRestaurantEndpoint(id));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    fetchRestaurantsWithAction(
      restaurants => {
        return restaurants.filter(r => r.cuisine_type == cuisine);
      },
      callback
    );
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    fetchRestaurantsWithAction(
      restaurants => {
        return restaurants.filter(r => r.neighborhood == neighborhood);
      },
      callback
    );
  }


  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    let filter = restaurant => {
      let selected =
        (cuisine      == 'all' || restaurant.cuisine_type == cuisine) &&
        (neighborhood == 'all' || restaurant.neighborhood == neighborhood);

      return selected;
    }

    fetchRestaurantsWithAction(
      restaurants => {
        return restaurants.filter(filter);
      },
      callback
    );
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    fetchRestaurantsWithAction(
      restaurants => {
        let results = restaurants.map((v, i) => restaurants[i].neighborhood);
        return results.filter((v, i) => results.indexOf(v) === i); // remove duplicates
      },
      callback
    );
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    fetchRestaurantsWithAction(
      restaurants => {
        let results = restaurants.map((v, i) => restaurants[i].cuisine_type);
        return results.filter((v, i) => results.indexOf(v) === i); // remove duplicates
      },
      callback
    );
  }

  static fetchReviewsForRestaurant(restaurantId) {
    return requestJson(DBHelper.getRestaurantReviewsEndpoint(restaurantId));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return restaurant.photograph ? (`/img/${restaurant.photograph}.jpg`) : "";
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  static addReview(data) {
    // let xhr = new XMLHttpRequest();
    // xhr.open('POST', DBHelper.POST_REVIEW_ENDPOINT);
    // xhr.setRequestHeader('Content-type', 'application/json');
    // // console.log(data);
    // return new Promise((resolve, reject) => {
    //   xhr.onload = () => {
    //     let status = xhr.status;
    //     if (status === 200 /* queued */ || status === 201 /* created */) {
    //       resolve(JSON.parse(xhr.responseText));
    //     } else {
    //       reject(`XHR request failed with error ${xhr.status}`);
    //     }
    //   };
    //   xhr.send(JSON.stringify(data));
    // });

    const url = DBHelper.POST_REVIEW_ENDPOINT;
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  static toggleFavorite(restaurantId, isFavorite) {
    // let xhr = new XMLHttpRequest();
    // xhr.open('PUT', DBHelper.getRestaurantEndpoint(restaurantId) + '/?is_favorite=' + (isFavorite ? 'true' : 'false'), true);
    // xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    // return new Promise((resolve, reject) => {
    //   xhr.onload = () => {
    //     if (xhr.status === 200) {
    //       resolve(xhr.responseText);
    //     } else {
    //       reject(`XHR request failed with error ${xhr.status}`);
    //     }
    //   };
    //   xhr.send();
    // });

    const url = DBHelper.getRestaurantEndpoint(restaurantId) + '/?is_favorite=' + (isFavorite ? 'true' : 'false');
    return fetch(url, {
      method: 'PUT'
    });
  }

  // this is surely not efficient largely due to the lack of an id-only favorite list
  static isRestaurantFavorite(restaurantId) {
    return requestJson(`${DBHelper.SERVER_URL}/restaurants/?is_favorite=true`)
      .then(restaurants => {
        let ids = restaurants.map(rest => {
          return rest.id;
        });
        return Boolean(ids.find(id => String(id) === String(restaurantId)));
      });
  }
}


