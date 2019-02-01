// Node modules
var express = require('express')
var http = require('http')
var path = require('path')
var bodyParser = require('body-parser')
const ps = require('python-shell');
const request = require('request');

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

app.post('/ATAT/v1/search/', function (req, res){
    console.log('Request Received')
    console.log(req.body.searchUrl)
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
        }else{
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            var sourceLonLat = bd.features[0].geometry.coordinates; // Returned as [longitude, latitude]
            console.log(sourceLonLat)
            // Run scraper to update search results in db
            ps.PythonShell.run('searchScraper.py', options, function (err, results) {
                if (err)
                    throw err;
                var status = (results[0] == 'true');
                if(status == true){
                    // scrape successful
                    // now get long/lat of destination + sourcePostcode
                    res.status(200)
                }else{
                    res.status(400)
                    res.json({status: 'Invalid searchURL'})
                }
            });
        }

    });
})

var server = http.createServer(app)

server.listen(app.get('port'), function () {
    console.log('ATAT - AutoTraderAdvertTools API Server listening on port ' + app.get('port'))
})
