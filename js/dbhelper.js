/**
 * Common database helper functions.
 */
// import idb from 'idb';

const RESTAURANT_DB_NAME = 'restaurant-db';

let dbPromise = idb.open(RESTAURANT_DB_NAME, 1, db => {
  if(!db.objectStoreNames.containes('keyval')) {
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

// a wrapper around XMLHttpRequest that returns a promise
function requestJson(url) {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  return new Promise( (resolve, reject) => {
    xhr.onload = () => {
      if (xhr.status === 200) {
        const json = JSON.parse(xhr.responseText);
        resolve(json);
      } else {
        reject(`XHR request failed with error ${xhr.status}`);
      }
    };
    xhr.send();
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
  static get DATABASE_URL() {
    // const port = 8000 // Change this to your server port
    // return `http://localhost:${port}/data/restaurants.json`;

    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static getRestaurantUrl(id) {
    return `${DBHelper.DATABASE_URL}/${id}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    return requestJson(DBHelper.DATABASE_URL);
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    return requestJson(DBHelper.getRestaurantUrl(id));
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

}

