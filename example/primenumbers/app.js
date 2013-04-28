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
var hh = function (hfunction, data) {
  return function(callback) {
    hfunction(data, callback);
  }
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

var ResearchPopulate = function (researchId, callback) {
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

// Controller to go to next task and update the status
var ResearchCtrl = function(researchId, result) {
  return {
    generateTask: function (obj, callback) {
      return (obj || ResearchMemory[researchId]).code
        .generateTask(ResearchMemory[researchId].state, callback);
    },
    updateState: function(obj, callback) {
      return (obj || ResearchMemory[researchId]).code
        .updateState(ResearchMemory[researchId].state, result, callback);
    },
    saveState: function(newState, callback) {
      Research.findOneAndUpdate({_id: researchId}, {state: newState}, function(err, doc) {
        if (err) console.log(err);
        io.socket.emit('task', doc);
      });
    }
  };
};

function TaskSend (researchId, callback) {
  async.series([
    hh(ResearchPopulate, researchId),
    ResearchCtrl(researchId).generateTask
  ], callback);
}
function TaskEmit (err, task){
  if (err) console.log(err);
  io.socket.emit('task', task);
}

function StateUpdate (d, callback) {
  async.series([
   hh(ResearchPopulate, d.researchId),
   ResearchCtrl(d.researchId, d.result).updateState
  ], function(err, newState) {
   Research.findOneAndUpdate({_id: d.researchId}, {state: newState}, callback);
  });
}
io.sockets.on('connection', function (socket) {
  socket.emit("connected", 1);

  socket.on('research', function(data) {
    async.waterfall([hh(TaskSend, data), TaskEmit]);
  });
  socket.on('result', function(researchId, result) {
    async.waterfall(hh(StateUpdate, {researchId: researchId, result:result}), TaskSend, TaskEmit);
  });
});

console.log("Listening at port "+ port);
var test = new Research({title: "Prime numbers", url: "/researchjs/primenumbers"});
test.save(function(err){ if (err) console.log(err); });