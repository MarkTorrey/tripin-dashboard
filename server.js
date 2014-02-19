// parse the command line parameters
var args = process.argv.splice(2);
var argPort = 8080;
args.forEach(function(arg) {
  var a = arg.split('=');
  var param = a[0];
  var val = a[1];
  switch(param){
  case "-port" :
    argPort = val;
    break;
  }
});

// start the simple web server
var connect = require('connect');
connect.createServer(
    connect.static(__dirname + "/src/app")
).listen(argPort);

// provide feedback
console.log("Server listening on port " + argPort);
