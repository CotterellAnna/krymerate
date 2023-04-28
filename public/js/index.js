let map, infoWindow, marker, geocoder, lat, lng, location_name, pos;
let location_form = document.getElementById("location_form");
let location_input = document.getElementById("location");
let map_loader = document.getElementById("map_loader");
let stats_loaders = document.querySelectorAll(".crime_stats");
let no_data_container = document.getElementById("no_data_container");

let total_crimes_committed = document.getElementById("total_crimes_committed");
let crime_rating = document.getElementById("crime_rating");
let highest_crime = document.querySelectorAll(".highest_crime");
let highest_crime_count = document.querySelectorAll(".highest_crime_count");
let least_crime = document.getElementById("least_crime");
let crime_rate_info_container = document.getElementById("crime_rate_info_container");
let crime_chart_container = document.getElementById("crime_chart_container");
let locationName = document.querySelectorAll(".location_name")
let modalBtn = document.getElementById("modalBtn");
let crime_rate_icon = document.getElementById("crime_rate_icon");
let modal_title = document.getElementById("modal_title");

async function getApiKey() {
  try {
    const response = await fetch('/api_key');
    const data = await response.json();
    return data.key;
  } catch (error) {
    console.error(error);
  }
}

// show notification modal on getting the crime_info 
modalBtn.addEventListener("click", ()=>{});

function clear_data(){
  total_crimes_committed.innerHTML = "";
  crime_rating.innerHTML = "";
  highest_crime.forEach(el=>{
    el.innerHTML = "";
  });
  least_crime.innerHTML = "";
  
  hide(crime_chart_container);
  hide(no_data_container);
}

// show element
function show(loader){
  loader.style.display = "block";
};

// hide element
function hide(loader){
  loader.style.display = "none";
};

// initializing map
function initMap(position){
  show(map_loader);
  if(!position){
    position ={lat:-34.397,lng: 150.644};
  };
  map = new google.maps.Map(document.getElementById("interactive_map_container"), {
      center: position,
      zoom: 15
  });

  infoWindow = new google.maps.InfoWindow();
  marker = new google.maps.Marker({position: position, map: map});
  geocoder = new google.maps.Geocoder();
};

// display map
function displayMap(pos){
  lat = pos.lat;
  lng = pos.lng;
  infoWindow.setPosition(pos);
  infoWindow.setContent("Location found.");
  infoWindow.open(map);
  map.setCenter(pos);
  marker = new google.maps.Marker({position: pos, map: map})

  hide(map_loader);
}

// when the user inputs location
location_form.addEventListener("submit", function(e){
  e.preventDefault();
  clear_data();
  stats_loaders.forEach(e=>{
    show(e);
  });
  location_name = location_input.value;
  getApiKey().then((apiKey) => {
    // Do something with the apiKey
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${location_name}&key=${apiKey}`)
    .then(res =>{
      return res.json();
    })
    .then(data=>{
      let results = data.results[0];
      pos = {
        lat:results.geometry.location.lat,
        lng:results.geometry.location.lng
      };

      get_crime_info(results.address_components, 0)
        .then(data => {
          modalBtn.dispatchEvent(new Event("click"));
          stats_loaders.forEach(e=>{
            hide(e);
          });
          display_crime_info(data);
        })
        .catch(err => {
          console.log(err);
          stats_loaders.forEach(e=>{
            hide(e);
          });
          show(no_data_container);
        });
      
      displayMap(pos);
    })
  });
});

// for users live location
function find_location_map(){
  clear_data();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        displayMap(pos)

        getApiKey().then((apiKey) => {
          // Do something with the apiKey
          fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`)
          .then(res =>{
            return res.json()
          })
          .then(data=>{
            get_crime_info(data["results"][0].address_components, 0)
              .then(data => {
                modalBtn.dispatchEvent(new Event("click"));
                stats_loaders.forEach(e=>{
                  hide(e);
                });
                display_crime_info(data)
              })
              .catch(err => {
                console.log(err);
                stats_loaders.forEach(e=>{
                  hide(e);
                });
                show(no_data_container);
              });

            location_name = data["results"][0].formatted_address;
            location_input.setAttribute("value", location_name)
          })
        });
      },
      () => {
        handleLocationError(true, infoWindow, map.getCenter());
      }
    );
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
};

// handle location error
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
  clear_data();
  stats_loaders.forEach(e=>{
    hide(e);
  });
  show(no_data_container)
};

// to search for data in the crime api
function get_crime_info(address_components, index) {
  return new Promise((resolve, reject) => {
    if (index >= address_components.length) {
      reject('No match found');
      return;
    }

    let name = address_components[index].long_name;

    fetch(`/location/${name}`)
      .then(res => {
        return res.json();
      })
      .then(data => {
        if (!data.message) {
          resolve(data);
        } else {
          get_crime_info(address_components, index + 1)
            .then(resolve)
            .catch(reject);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
};

// to display crime info
function display_crime_info(data){
  hide(no_data_container);
  show(crime_chart_container);
  if(data.name){
    const maxCrime = data.crime_info.crimes.reduce((max, crime) => {
      if (crime.count > max.count) {
        return crime;
      }
      return max;
    }, { count: -Infinity });
    
    const minCrime = data.crime_info.crimes.reduce((min, crime) => {
    if (crime.count < min.count) {
      return crime;
    }
      return min;
    }, { count: Infinity });

    // represent crime_info in bar chart
    let crimes = data.crime_info.crimes;
    let crimes_arr = [] ;
    let crime_count_arr = [];

    for(let i = 0; i<crimes.length; i++){
      crimes_arr.push(crimes[i].type);
      crime_count_arr.push(crimes[i].count);
    }

    const highestValueIndex = crime_count_arr.indexOf(Math.max(...crime_count_arr));

    const canvas = document.getElementById("crime_chart");
    const ctx = canvas.getContext("2d");
    const chart = canvas.chart; //get reference to existing chart


    if(chart){
      chart.destroy(); //destroy existing chart
    }
    // create new chart
    const crime_chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: crimes_arr,
        datasets: [{
          label: "Crime Rate Info",
          data: crime_count_arr,
          borderWidth: 0,
          backgroundColor: crime_count_arr.map((value, index) => index === highestValueIndex ? "#2563EB" : "#DBEAFE"),
          borderColor: crime_count_arr.map((value, index) => index === highestValueIndex ? "#2563EB" : "#DBEAFE"),
          color: "#64748B",
          borderRadius: 20,
          borderSkipped: "bottom"
        }]
      }, 
      options: {
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: false
            }
          },
          x: {
            beginAtZero: true,
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeInOutQuart'
        }
      }
    })
    canvas.chart = crime_chart;

    total_crimes_committed.innerHTML = data.crime_info.total_crimes_committed;
    crime_rating.innerHTML = data.crime_rating;
    highest_crime.innerHTML = maxCrime.type;
    least_crime.innerHTML = minCrime.type;
    highest_crime.forEach(el =>{
      el.innerHTML = maxCrime.type;
    });
    highest_crime_count.forEach(el=>{
      el.innerHTML = maxCrime.count;
    });
    locationName.forEach(el=>{
      el.innerHTML = `${data.name}`;
    });
    if(data.crime_rating == "Low"){
      crime_rate_icon.setAttribute("src", "../images/low_rate.svg");
      modal_title.innerHTML = "Safe";
    }else if(data.crime_rating == "Mid"){
      crime_rate_icon.setAttribute("src", "../images/mid_rate.svg");
      modal_title.innerHTML = "Relatively Safe";
    }else{
      crime_rate_icon.setAttribute("src", "../images/high_rate.svg");
      modal_title.innerHTML = "Unsafe"
    }
  }
};

find_location_map();
