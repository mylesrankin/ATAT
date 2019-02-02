// Node modules
var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
const ps = require('python-shell');
const request = require('request');
var mysql = require('mysql');
var Distance = require('geo-distance');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "carswatchlist"
});

var app = express()


var publicDir = path.join(__dirname, 'public')

app.set('port', process.env.PORT || 3000)

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, application/json, content-type, Data-Type, Accept, hardwareid, authtoken, username");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
    next();
});

app.get('/', function (req, res) {
    res.send('API Server Aliveggg');
})

app.get('/test', function(req,res){
    res.json({
        status: 'Alive',
    })
})

app.get('/ATAT/v1/advert/:advertid', function (req, res){
    
})

app.post('/ATAT/v1/search/', function (req, res){
    console.log('Request Received')
    console.log(req.body.destAdvertID)
    var options = {
        mode: 'text',
        pythonPath: 'C:/Users/Myles/AppData/Local/Programs/Python/Python36-32/python.exe',
        pythonOptions: ['-u'],
        scriptPath: 'C:/Users/Myles/WebstormProjects/ATAT',
        args: [req.body.searchUrl]
    };
    var sourcePostCode = req.body.sourcePostCode
    request('https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf624809ebaa9527c64edea8bc2513ab34b995&text='+sourcePostCode, function (error, response, body) {
        var bd = JSON.parse(response.body)
        if(bd.features[0] == undefined){
            res.status(400)
            res.json({status: 'invalid-postcode'})
        }else {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            var sourceLonLat = bd.features[0].geometry.coordinates; // Returned as [longitude, latitude]
            var sourceLonLat = {
                lat: sourceLonLat[1],
                lon: sourceLonLat[0]
            }
            console.log(sourceLonLat)
            // Run scraper to update search results in db
            request('https://www.autotrader.co.uk/json/fpa/initial/' + req.body.destAdvertID, function (error, response, body) {
                console.log('scraping at ad')
                var bd2 = JSON.parse(response.body)
                console.log(bd2)
                if (bd2.error == true) {
                    res.status(400)
                    res.json({status: 'invalid-advertid'})
                } else {
                    var destLonLat = bd2.seller.longitude.split(",").reverse()
                    var destLonLat = {
                        lat: parseFloat(destLonLat[1]),
                        lon: parseFloat(destLonLat[0])
                    }
                    console.log("dist between dest and source")
                    console.log(Distance.between(sourceLonLat, destLonLat).human_readable())
                    ps.PythonShell.run('searchScraper.py', options, function (err, results) {
                        if (err)
                            throw err;
                        console.log('SCRAPE STATUS: %s', results[0])
                        var status = (results[0] == 'true');
                        if (status == true) {
                            console.log('Scraping complete--------var check')
                            console.log('Dest %s', destLonLat)
                            console.log('source %s', sourceLonLat)
                            // scrape successful
                            // Now to check each advert lonlat, then ad to a set if nearby
                            // First grab all advertID's and their lon/lat values for this search
                            con.connect(function(err) {
                                if (err) throw err;
                                var sql = ('SELECT advertID, longitude, latitude FROM watchlist WHERE searchHash = "'+ req.body.searchUrl +'"')
                                console.log(sql)
                                con.query(sql , function (err, result, fields) {
                                    if (err) throw err;
                                    // console.log(result);

                                    // Need to get list of waypoint id's + lon+lats
                                    var waypointsUrl = `https://api.openrouteservice.org/directions?api_key=5b3ce3597851110001cf624809ebaa9527c64edea8bc2513ab34b995&coordinates=${sourceLonLat.lon},${sourceLonLat.lat}%7C${destLonLat.lon},${destLonLat.lat}&profile=driving-car&geometry_format=geojson&instructions=false`
                                    request(waypointsUrl, function (error, response, body) {
                                        console.log("check waypoints")
                                        if(error)
                                            throw error;
                                        var waypointBody = JSON.parse(response.body);
                                        var coords = waypointBody.routes[0].geometry.coordinates
                                        var increment = Math.ceil(coords.length ** 0.40)
                                        console.log('Increment %s', increment)
                                        var advertsOnRoute = new Set();
                                        console.log(result)
                                        for(var i = 0; i < coords.length-1; i = i + increment){
                                            // Checking waypoint coords in this loop
                                            if(Math.ceil(i/coords.length*100) % 5 == 0){
                                                console.log('%', i/coords.length*100)
                                            }
                                            var currentCoord = {
                                                lat: coords[i][1],
                                                lon: coords[i][0]
                                            }

                                            var n = 0;
                                            result.forEach(function(data){
                                                n++;
                                                console.log(data)
                                                console.log(n)
                                                if(Distance.between(currentCoord, {lat:data.latitude,lon:data.longitude}).human_readable().distance < 30){
                                                    console.log('Found advert within dist')
                                                    advertsOnRoute.add(data.advertID)
                                                    delete result[n]
                                                }
                                            });

                                        }
                                        res.status(201)
                                        res.json({
                                            searchUrl: req.body.searchUrl,
                                            sourceCoords: sourceLonLat,
                                            destCoords: destLonLat,
                                            advertsOnRoute: Array.from(advertsOnRoute)
                                        })
                                        console.log(advertsOnRoute)
                                        console.log('Complete')



                                    });

                                });
                            });
                            res.status(200)
                        } else {
                            res.status(400)
                            console.log(results)
                            res.json({status: 'Invalid searchURL'})
                        }
                    });
                }
            })
        }

    });
})

var server = http.createServer(app)

server.listen(app.get('port'), function () {
    console.log('ATAT - AutoTraderAdvertTools API Server listening on port ' + app.get('port'))
})
