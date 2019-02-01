// Node modules
var express = require('express')
var http = require('http')
var path = require('path')
var bodyParser = require('body-parser')
var PythonShell = require('python-shell');

var app = express()

var publicDir = path.join(__dirname, 'public')

app.set('port', process.env.PORT || 3000)

app.use(bodyParser.json()) // Parses json, multi-part (file), url-encoded

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, content-type, Data-Type, Accept, hardwareid, authtoken, username");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
    next();
});

app.get('/', function (req, res) {
    res.send('API Server Aliveggg');
})

app.get('/test', function(req,res){
    res.json({
        status: 'Alive',
        data: {
            title: 'test',
            content: 'more testing'
        }
    })
})

app.get('/ATAT/v1/:advertid/:postcode/:searchurl', function (req, res){
    var options = {
        mode: 'text',
        pythonPath: 'path/to/python',
        pythonOptions: ['-u'],
        scriptPath: 'path/to/my/scripts',
        args: ['value1', 'value2', 'value3']
    };

    PythonShell.run('test.py', options, function (err, results) {
        if (err)
            throw err;
        // Results is an array consisting of messages collected during execution
        console.log('results: %j', results);
    });
})

var server = http.createServer(app)

server.listen(app.get('port'), function () {
    console.log('KioskAPI Server listening on port ' + app.get('port'))
})
