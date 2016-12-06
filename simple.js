var express = require('express');
var session = require('express-session');
var app = express();

app.use(express.static(process.cwd() + '/public'));


app.get('/', function(req, res){
    res.sendFile('index.html');
  });

app.listen(8080, function () {
        console.log('Listening on port 8080...');
});