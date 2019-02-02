function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: {lat: -24.345, lng: 134.46}  // Australia.
    });

    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map
    });

    directionsDisplay.addListener('directions_changed', function() {

    });

    displayRoute('Perth, WA', 'Sydney, NSW', directionsService,
        directionsDisplay);

    for(i=0; i<20; i++){
        new google.maps.Marker({
            position: {lat: -24.363-i, lng: 131.044-(i**2/10)},
            map: map,
            title: 'test World!'
        });
    }

}

function displayRoute(origin, destination, service, display) {
    service.route({
        origin: origin,
        destination: destination,
        waypoints: [{location: 'Adelaide, SA'}, {location: 'Broken Hill, NSW'}],
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
