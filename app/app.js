var app = angular.module('TaxiScanner', ['google-maps', 'google.places']);

app.controller('TaxiCtrl', TaxiCtrl);
app.service('TaxiService', TaxiService);


TaxiCtrl.$inject = ['TaxiService', '$scope', '$http', '$q'];
function TaxiCtrl (TaxiService, $scope, $http, $q) {
  // map object
  var gmaps = this;
  gmaps.loading=false;
  var mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(60.1900, 24.9400),
        mapTypeId: google.maps.MapTypeId.TERRAIN
  };

  gmaps.map = new google.maps.Map(document.getElementById('map'), mapOptions);
  // directions object -- with defaults
  gmaps.directions = {
    origin: "",
    destination: "",
    showList: false
  }
  

  gmaps.getDirections =function() {
    gmaps.map = new google.maps.Map(document.getElementById('map'), mapOptions);
    gmaps.data=null;
    //console.log(gmaps.directions.origin.formatted_address);
    var request = {
      origin: gmaps.directions.origin.formatted_address,
      destination: gmaps.directions.destination.formatted_address,
      travelMode: google.maps.DirectionsTravelMode.DRIVING
    };
    gmaps.loading=true;
    gmaps.error=false;


    TaxiService.getMap(request, gmaps);

    
    
    $q.all([TaxiService.getCoordinates(request.origin, gmaps, $q), 
            TaxiService.getCoordinates(request.destination, gmaps, $q)])
    .then(function(results) {
      var coordinates = {
      origin_loc: '',
      dest_loc: ''
      };
      coordinates.origin_loc=results[0].lat+','+results[0].lng;
      coordinates.dest_loc=results[1].lat+','+results[1].lng;
      TaxiService.getEntity(coordinates.origin_loc, gmaps)
      .success(function(response){

        TaxiService.getRates(response.handle, coordinates, gmaps).
        success(function (response){
          if (response.status === 'OK'){
            gmaps.data=response;
            gmaps.loading=false;
          }
          else 
          {
            console.log("LOCATION PROBLEM");
            gmaps.error=true;
            gmaps.loading=false;
          }
          
        });
});
});
}



}



TaxiService.$inject=['$http', '$q']
function TaxiService($http, $q) {
  var service=this;

//SERVICE FOR MAP PRINTING
service.getMap = function (request, gmaps) {
  var directionsDisplay = new google.maps.DirectionsRenderer();
  var directionsService = new google.maps.DirectionsService();
  var geocoder = new google.maps.Geocoder();
      directionsService.route(request, function (response, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
        directionsDisplay.setMap(gmaps.map);
        directionsDisplay.setPanel(document.getElementById('directionsList'));
        //$scope.directions.showList = true;
      } else {
        alert('Route is unsuccesfull!');
      }
    });
  }


//SERVICE FOR GETTING ENTITY FOR TAXIFARE API
service.getEntity = function(locate, gmaps){
  var url='https://api.taxifarefinder.com/entity?key=C3EcRac5eNec';
  var method='JSONP';
  var response = $http({
    method: method, 
    url: url,
    params: { 
      location: locate,
      callback: 'JSON_CALLBACK' }});
  return response;
  
  }

//SERVICE FOR GETTING FARE
service.getRates = function (entity, coordinates, gmaps){
  var url='https://api.taxifarefinder.com/fare?key=C3EcRac5eNec';
  var method='JSONP';
  return $http({
    method: method, 
    url: url,
    params: { 
      entity_handle: entity,
      origin: coordinates.origin_loc,
      destination: coordinates.dest_loc,
      callback: 'JSON_CALLBACK' }});
}


//-f1tJC3o_30ASWGoqAKuxcrRJcXYKOI2fVKq3Hz9
// service.getRatesUber = function (){
//   var url='https://api.uber.com/v1.2/estimates/price?start_latitude=37.7752315&start_longitude=-122.418075&end_latitude=37.7752415&end_longitude=-122.518075&server_token=-f1tJC3o_30ASWGoqAKuxcrRJcXYKOI2fVKq3Hz9';
//   //var method='JSONP';
//   $http({
//   headers: {'Content-Type': 'application/json'},
//   method: 'GET',
//   url: url,
//   params: {callback: 'JSON_CALLBACK'}
//   })
//   .then(function(response){
//         console.log(response);
//       });

// };

//SERVICE FOR GETTING COORDINATES
service.getCoordinates = function(name, gmaps, $q){
  var deferred = $q.defer();

  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({ "address": name}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
        var latLng = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        };
        deferred.resolve(latLng);
    }});
  return deferred.promise;
  
};



}

