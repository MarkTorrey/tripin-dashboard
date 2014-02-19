var connect = require('connect');
connect.createServer(
    connect.static(__dirname + "/src/app")
).listen(8080);