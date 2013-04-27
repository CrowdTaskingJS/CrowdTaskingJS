var port = process.env.PORT || 1234
  , express = require('express')
  , async = require('async')
  , redis = require("redis")
  , ejs = require("ejs")
  , Q = require('q')
  , http = require('http');

var app = express()
  , server = app.listen(port)
  , io = require('socket.io').listen(server);

var store;
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  store = redis.createClient(rtg.port, rtg.hostname);
  store.auth(rtg.auth.split(":")[1]);
} else {
  store = redis.createClient();
}

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

var researchGet = function(obj, research) {
  return function(obj, callback) {
    store.get("research:"+research, function(data) {
      callback(data);
    });
  }
};

var generateNextTask = function(research) {
  return function(research, callback) {

  };
};

io.sockets.on('connection', function (socket) {
  socket.emit("connected", 1);

  socket.on('research', function(research) {
    // getCode // get State // generate Task
    // async.series([codeGet(research), generateNewTask(research),]);

    socket.emit('task', taskWithCode);
  });
  socket.on('result', function(research) {
    socket.emit('task', task);
  });
});
