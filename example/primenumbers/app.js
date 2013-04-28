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

// High order function helper
var hh = function (hfunction) {
  return hfunction;
};

var base64encode = function(data) {
  return new Buffer(data, 'utf8').toString('base64').replace(/\//g, '_').replace(/\+/g, '-').replace(/\=/g, '');
};

var base64decode = function(data) {
  while (data.length % 4 !== 0) {
    data += '=';
  }
  data = data.replace(/-/g, '+').replace(/_/g, '/');
  return new Buffer(data, 'base64').toString('utf-8');
};


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

app.post("/canvas/", function(req, res) {
  var parts = req.body.signed_request.split('.');
  var encodedSignature = parts[0];
  var encoded = parts[1];
  var signature = base64decode(encodedSignature);
  var decoded = base64decode(encoded);
  var data = JSON.parse(decoded);
  if (data.user_id) {
    res.render("canvas.html", {"name": data.User});
  } else {
    res.render("fb_redirect.html");
  }
});

var ResearchMemory = {};

var ResearchPopulate = function (researchId) {

  return function(callback) {
    // If already in memory, skip and return
    if (ResearchMemory[researchId]) {
      return callback(null, ResearchMemory[researchId]);
    }
    // Find objects and require the file
    Research.findById(researchId).exec(function(err, research) {
      research.toObject();
      research.code = require("."+research.url);
      ResearchMemory[researchId] = research;
      callback(err, ResearchMemory[researchId]);
    })
  };
};

// Controller to go to next task and update the status
var ResearchCtrl = function(researchId, result) {
  return {
    // Goes to next status
    nextTask: function (code, callback) {
      return (code || ResearchMemory[researchId].code).generateTask(ResearchMemory[researchId].state, callback);
    },
    // Update the status
    updateState: function(code, result, callback) {
      return (code || ResearchMemory[researchId].code).updateState(ResearchMemory[researchId].state, result, callback);
    }
  };
};

io.sockets.on('connection', function (socket) {
  socket.emit("connected", 1);

  socket.on('research', function(researchId) {
    async.series([
      ResearchPopulate(researchId),
      ResearchCtrl(researchId).nextTask
    ], function(err, task){
      if (err) console.log(err);
      socket.emit('task', task);
    });
  });
  socket.on('result', function(researchId, result) {
    async.series([
      ResearchPopulate(researchId),
      ResearchCtrl(researchId, result).updateState,
      ResearchCtrl(researchId).nextTask
    ], function(err, task) {
      if (err) console.log(err);
      socket.emit('task', task);
    });
    /* Research.findOneAndUpdate({_id: research}, {state: result}, function(err, doc) {
      if (err) console.log(err);
      socket.emit('task', doc);
    });
    */
  });
});

console.log("Listening at port "+ port);
var test = new Research({title: "Prime numbers", url: "/researchjs/primenumbers"});
test.save(function(err){ if (err) console.log(err); });