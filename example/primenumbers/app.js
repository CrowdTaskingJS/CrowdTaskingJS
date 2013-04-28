var port = process.env.PORT || 1234
  , express = require('express')
  , async = require('async')
  , ejs = require("ejs")
  , Q = require('q')
  , _ = require('underscore')
  , mongoose = require('mongoose')
  , fs = require('fs')
  , http = require('http')
  , https = require('https');

if (!process.env.HEROKU) {
  var privateKey = fs.readFileSync('privatekey.pem').toString()
    , certificate = fs.readFileSync('certificate.pem').toString();

  var options = {
    key : privateKey,
    cert : certificate
  }
}

var app = express()
  , server = process.env.HEROKU ? app.listen(port) : https.createServer(options, app)
  , io = require('socket.io').listen(server)
  , Research = require('./model.js').Research();

if ( !process.env.HEROKU) server.listen(port);

app.configure(function () {
  app.set("views", __dirname + "/static");
  app.set("view engine", "ejs");
  app.engine("html", ejs.renderFile);
  app.use(express.bodyParser());
  app.use(express.cookieParser("alskjald0q9udqokwdmqldiqud0woqijdklq09"));
  app.use(express.session());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + "/static"));
  app.use(app.router);
});

app.get("/", function(req, res) {
  res.render("index");
});
app.get("/api/researches", function(req, res) {
  Research.find({}, function(err, docs) {
    if (err) console.log(err);
    res.json(docs);
  });
});

io.sockets.on('connection', function (socket) {
  socket.emit("connected", 1);

  socket.on('research', function(research) {
    Research.findById(research).exec(function(docs) {
      socket.emit('task', docs);
    })
  });
  socket.on('result', function(research, result) {
    Research.findOneAndUpdate({_id: research}, {state: result}, function(err, doc) {
      if (err) console.log(err);
      socket.emit('task', doc);
    });
  });
});

console.log("Listening at port "+ port);
var test = new Research({title: "asdasdasdasdasd", state: {yo:1}});
test.save(function(err){ if (err) console.log(err); });