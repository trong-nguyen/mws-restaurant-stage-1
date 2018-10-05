let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

// favorite button
document
  .getElementById('favorite-button')
  .addEventListener('change', handleFavoriteChange, false);

function handleFavoriteChange(event) {
  var el = event.target;

  console.log('favorite state changed to', el.checked);
}

function submitReview {
  let data = {};

  let rating = collectRating();
  let name = collectReviewerName();
  let comments = collectComments();

  if (!(rating && name && comments)) {
    rejectSubmission();
  }

  data = {
    rating: rating,
    name: name,
    comments: comments
  }
}

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else if (!self.newMap) {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoidmluY2VudHZpbmNlIiwiYSI6ImNqbG1rem93ZjE5YmszcHQ1a3NkMGhjNGUifQ.8i68eUxusF_3DsKBicKwCg',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb(restaurant);
      DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    RestaurantDb.get(id)
      .then(restaurantData => {
        if(restaurantData) {
          fillRestaurantHTML(restaurantData);
          callback(null, restaurantData);
        }
        DBHelper.fetchRestaurantById(id)
          .then(data => {
            fillRestaurantHTML(data);
            RestaurantDb.set(id, data); // cache
            callback(null, data);
          })
          .catch(console.error);
      });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';

  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = 'A picture respresents ' + restaurant.name + ' restaurant';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML(restaurant.operating_hours);
  }
  // fill reviews
  fillReviewsHTML(restaurant.reviews);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');
  const ul = document.getElementById('reviews-list');

  ul.innerHTML = ""; // to avoid duplicated if already created
  if (reviews) {
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
  }

  if (!ul.hasChildNodes()) {
    ul.append(createReviewHTML({comments:'No reviews yet!'}))
  }
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex', '0'); // add this review to the navigationable tabs
  const name = document.createElement('p');
  name.innerHTML = review.name || '';
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date || '';
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = review.rating ? `Rating: ${review.rating}` : '';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
