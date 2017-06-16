var app = {};

app.key = 'LxMLi9ZbkEmy7BpYtkvVF7ECF4XnZqWO3BE01CiC';

//create an instance of the map
app.initMap = function() {
  app.map = new google.maps.Map(document.getElementById('map'), {
  center: new google.maps.LatLng(0, 0),
  mapTypeId: 'hybrid',
  mapTypeControlOptions: {
    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
  },
  zoom: 2,
  scrollwheel: false ,
  rotateControl: true 
  });
}


// Make AJAX request to NASAevents for data on events
app.getEventsInfo = function() {
  return $.ajax({
        url: 'https://eonet.sci.gsfc.nasa.gov/api/v2.1/events',
        method: 'GET',
        dataType: 'json',
        data: {
            key: app.key,
            format: 'json',
            status: 'open',
            limit: 50
            }
    })
};

//make AJAX request to NASA categories on events
app.getCategoriesInfo = function(){
  return $.ajax({
        url: 'https://eonet.sci.gsfc.nasa.gov/api/v2.1/categories',
        method: 'GET',
        dataType: 'json',
        data: {
            key: app.key,
            format: 'json',
            }
    })
};
//when events info and categories info are both returned allow app to continue
$.when(app.getEventsInfo() , app.getCategoriesInfo())
//then execute a function 
  .then(function (response1, response2) {
      let nasaEventsObject = response1[0].events;
      let nasaCategoriesObject = response2[0].categories;
      app.mergeEventsAndCategories(nasaEventsObject, nasaCategoriesObject);
    })
//create object to store categories with same event titles and descriptions of each
app.mergedEventsAndCategories = {};

//loop over each category
app.mergeEventsAndCategories = function(events, categories) {
  categories.forEach(function(category) {
    // grabs all of the events that pertain to a particular category (e.g volcanoes) and filter them into an array
    var filteredEvents = events.filter(function(event){
      return event.categories[0].title === category.title;
    });
    //sets new key: value pairs on new ME&C object
    app.mergedEventsAndCategories[category.title] = {
      description: category.description,
      events: filteredEvents
    }
  });  
}

console.log(app.mergedEventsAndCategories);
//listen for selection change and place markers in category
$('select').on('change', function(){ 
  var userVal =  $(this).val();
  $('categoryInfo').html('');
  //set markersArray to clear 
  clearMarkersArray();
  var allCategories = app.mergedEventsAndCategories;
  var selectedCategory = $('option:selected').val();
  //iterate over each category in mergedEvents object 
  $('.categoryInfo').html(`Description of Event: ${allCategories[userVal].description}`);

  let totalCoordinatesOfEvent;
  for (var category in allCategories) {
    let eventsArray = allCategories[selectedCategory].events;
    //generate description for each general event category i.e. volcanoes, snow events...etc.
    //for each event with the value of the selected option
    if (eventsArray.length === 0) {
    console.log('cannot generate coordinates of empty array!');
    } 
    eventsArray.forEach(function(event){ 
      //set marker content to each
      var markerContentString = `
              <div id="content">
                <div id="markerNotice"></div>
                <h2 id="firstHeading" class="firstHeading">${event.title}</h2>
                <div id="bodyContent">
                  <p>Date of Event: ${event.geometries[0].date}</p>
                  <p>More on event: <a href="${event.sources[0].url}" target="_blank">Link
                  </a></p>
                </div>
              </div>`
      //iterate over each array that represents events and 
      //set coordinates variable to store all coordinates from all events
      totalCoordinatesOfEvent = event.geometries[event.geometries.length - 1].coordinates; 
      //call generateMarkers and pass coordinates of event in
      // app.generateMarkers(eventsArray , totalCoordinatesOfEvent);
      app.addMarkerWithTimeout(totalCoordinatesOfEvent , markerContentString)
    })
  }
});

app.markersArray = [];

app.addMarkerWithTimeout = function (coordinatesOfEvents, string) {
    var marker; //declare marker variable so able to reference outside of actual marker generation
    if(coordinatesOfEvents.length === 1 ) {
      coordinatesOfEvents = coordinatesOfEvents[0][coordinatesOfEvents.length - 1];
    }//create new marker as forEach loop executes
    marker = new google.maps.Marker({
      position: {lat: coordinatesOfEvents[1], lng: coordinatesOfEvents[0]},
      map: app.map,
      animation: google.maps.Animation.DROP
    });//declare infowindow on each marker
    var infowindow = new google.maps.InfoWindow({
          content: string
        });//add event listener for click on each infowindow
    marker.addListener('click', function() {
          infowindow.open(map, marker);
        });
    //push marker to array
    app.markersArray.push(marker)
}
   
function clearMarkersArray () {
  app.markersArray.forEach(function(m){
    m.setMap(null)
  });
  app.markersArray = [];
};






//initialize application
app.init = function(){
  app.initMap();
  app.getEventsInfo();
};


//run the whole app on page load
$(function() {
    app.init();
});