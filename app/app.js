
var app = angular.module('TaxiScanner', ['google-maps']);

app.controller('MapsCtrl', MapsCtrl);
app.service('TaxiService', TaxiService);






MapsCtrl.$inject = ['TaxiService', '$scope', '$http', '$q'];
function MapsCtrl (TaxiService, $scope, $http, $q) {
  // map object
  var gmaps = this;
  gmaps.map = {
    control: {},
    center: {
        latitude: 60.19,
        longitude: 24.94
    },
    zoom: 10
  };
  
// marker object
// $scope.marker = {
//   center: {
//        latitude: -37.812150,
//        longitude: 144.971008
//    }
// }
  

  
  // directions object -- with defaults
  gmaps.directions = {
    origin: "",
    destination: "",
    showList: false
  }
  
  //// get directions using google maps api
  //   gmaps.getDirections = function () {
  //   var request = {
  //     origin: gmaps.directions.origin,
  //     destination: gmaps.directions.destination,
  //     travelMode: google.maps.DirectionsTravelMode.DRIVING
  //   };

  //   directionsService.route(request, function (response, status) {
  //     if (status === google.maps.DirectionsStatus.OK) {
  //       directionsDisplay.setDirections(response);
  //       directionsDisplay.setMap($scope.map.control.getGMap());
  //       //directionsDisplay.setPanel(document.getElementById('directionsList'));
  //       //$scope.directions.showList = true;
  //     } else {
  //       alert('Google route unsuccesfull!');
  //     }
  //   });
  // }



  gmaps.getDirections =function() {
    var request = {
      origin: gmaps.directions.origin,
      destination: gmaps.directions.destination,
      travelMode: google.maps.DirectionsTravelMode.DRIVING
    };


    TaxiService.getMap(request, gmaps);
    
    $q.all([TaxiService.getCoordinates(request.origin, gmaps, $q), TaxiService.getCoordinates(request.destination, gmaps, $q)])
    .then(function(results) {
      var coordinates = {
      origin_loc: '',
      dest_loc: ''
      };
      coordinates.origin_loc=results[0].lat+','+results[0].lng;
      coordinates.dest_loc=results[1].lat+','+results[1].lng;
      TaxiService.getEntity(coordinates.origin_loc, gmaps);
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
        directionsDisplay.setMap(gmaps.map.control.getGMap());
        //directionsDisplay.setPanel(document.getElementById('directionsList'));
        //$scope.directions.showList = true;
      } else {
        alert('Google route unsuccesfull!');
      }
    });
  }



service.getEntity = function(locate, gmaps){
  var url='https://api.taxifarefinder.com/entity?key=C3EcRac5eNec';
  var method='JSONP';
  $http({
    method: method, 
    url: url,
    params: { 
      location: locate,
      callback: 'JSON_CALLBACK' }})
 .success(function (response) {
    console.log(response.status);
    gmaps.data = response;
  });
  }


service.getRates = function (entity, coordinates, gmaps){
  var url='https://api.taxifarefinder.com/fare?key=C3EcRac5eNec';
  var method='JSONP';
  $http({
    method: method, 
    url: url,
    params: { 
      entity_handle: entity,
      origin: coordinates.origin_loc,
      destination: coordinates.dest_loc,
      callback: 'JSON_CALLBACK' }})
 .success(function (response) {
    console.log(response);
  });
}


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








