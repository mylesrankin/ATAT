//

/**
 *
 * This file contains all angularjs routing and logic for each page in angularjs controllers
 * by Myles Rankin 2017-18
 */
    // init angularjs app
var app = angular.module('app', ['ngRoute']);

/** Routing for the single page application **/
app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'templates/main.html',
                controller: 'mainController'
            })
            .when('/search/route/', {
                templateUrl: 'templates/search-route.html',
                controller: 'searchController'
            })
            .when('/search/route/map', {
                templateUrl: 'templates/map.html',
                controller: 'mapController'
            })
            .otherwise({
                redirectTo: '/'
            });
    }]);

/** Global Controller ~ On all pages**/
app.controller('mainController', function($scope, $route, $http) {
    console.log('Main controller loaded')

    });

/** Contains all logic for map page **/
app.controller('mapController', function($scope, $route, $http) {
    console.log("map controller")
    var mapData = JSON.parse(localStorage.getItem('mapData'));
    console.log(mapData)
    $('#loading').hide()
    $scope.searchTitle = mapData.searchUrl
});

/** Contains all logic for search page **/
app.controller('searchController', function($scope, $route, $http) {

    $("#submit-search")[0].addEventListener('click', function () {
        $('#loading').show()
        if (!($("#searchUrl")[0].value === "") && !($("#searchUrl")[0].value === "") && !($("#searchUrl")[0].value === "")) { // client side validation
                $http({
                    url: "http://localhost:3000/ATAT/v1/search/",
                    method: "POST",
                    data: {
                        "searchUrl": $("#searchUrl")[0].value,
                        "destAdvertID": $("#destAdvertID")[0].value,
                        "sourcePostCode": $("#sourcePostCode")[0].value
                    }
                }).then(function successCallback(res) {
                    console.log('Success!')
                    console.log(res)
                    localStorage.clear()
                    console.log(res.data)
                    localStorage.setItem('mapData', JSON.stringify(res.data))
                    $("#searchUrl")[0].value = ''
                    $("#destAdvertID")[0].value = ''
                    $("#sourcePostCode")[0].value = ''
                    window.location.href = "#/search/route/map"
                    $route.reload();
                }, function errorCallback(res){
                    console.log(res)
                    $('#loading').hide()
                    alert(res.data)
                })
        } else {
            $('#loading').hide()
            alert('Error: One or more fields are empty.')
        }
    });

});

function mysqlTimeStampToDate(timestamp) {
    /* Code snipped from: https://dzone.com/articles/convert-mysql-datetime-js-date All credit to author */
    // function parses mysql datetime string and returns javascript Date object
    //input has to be in this format: 2007-06-05 15:26:02
    var regex=/^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
    var parts=timestamp.replace(regex,"$1 $2 $3 $4 $5 $6").split(' ');
    return new Date(parts[0],parts[1]-1,parts[2],parts[3],parts[4],parts[5]);
}

function initMap() {
    var mapData = JSON.parse(localStorage.getItem('mapData'));
    console.log('Map init...')
    console.log(mapData)
    var sourceLatLng = new google.maps.LatLng(mapData.sourceCoords.lat, mapData.sourceCoords.lon)
    var destLatLng = new google.maps.LatLng(mapData.destCoords.lat, mapData.destCoords.lon)
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: {lat: mapData.sourceCoords.lat, lng: mapData.sourceCoords.lon}  // Australia.
    });

    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map
    });

    directionsDisplay.addListener('directions_changed', function() {

    });

    displayRoute(sourceLatLng, destLatLng, directionsService,
        directionsDisplay);

    mapData.advertsOnRoute.forEach(function(data){
        console.log(data)

        $.ajax({
            url: "http://localhost:3000/ATAT/v1/adv/"+data,
            type: "GET",
            success: function(res){
                new google.maps.Marker({
                    position: {lat: res.latitude, lng: res.longitude},
                    map: map,
                    title: res.advertID
                });
            },
            error: function(err){
                console.log(err)
            }
        });

    })

}

function displayRoute(origin, destination, service, display) {
    service.route({
        origin: origin,
        destination: destination,
        travelMode: 'DRIVING',
        avoidTolls: true
    }, function(response, status) {
        if (status === 'OK') {
            display.setDirections(response);
        } else {
            alert('Could not display directions due to: ' + status);
        }
    });
}