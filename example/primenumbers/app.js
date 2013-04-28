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

if ( process.env.HEROKU) {
  io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
  });
}


app.configure(function () {
  app.set("views", __dirname + "/views");
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
    Research.find({}, function(err, docs) {
      if (err) console.log(err);
      res.locals.researches = docs;
      console.log("AAAA", docs);
      res.render("canvas.html");
    });
  } else {
    res.render("fb_redirect.html");
  }
});

app.get("/canvas/", function(req, res) {
  Research.find({}, function(err, docs) {
    if (err) console.log(err);
    res.locals.researches = docs;
    res.render("canvas.html");
  });
});

var ResearchMemory = {};

var ResearchPopulate = function (researchId, callback) {
  // If already in memory, skip and return
  if (ResearchMemory[researchId]) {
    return callback(null, ResearchMemory[researchId]);
  }
  // Find objects and require the file
  Research.findById(researchId).exec(function(err, research) {
    if (err || !research) return console.log("DB", err);
    research = research.toObject();
    research.code = require("./static/researchjs/"+research.path+"/server.js");
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
      //Research.findOneAndUpdate({_id: researchId}, {state: newState}, function(err, doc) {
        //if (err) console.log(err);
        ResearchMemory[researchId].state = newState;
        callback(null, ResearchMemory[researchId]);
      //});
    }
  };
};

function TaskSend (researchId, callback) {
  async.waterfall([
    hh(ResearchPopulate, researchId),
    ResearchCtrl(researchId).generateTask
  ], callback);
}
function TaskEmit (task, callback){
  io.sockets.emit('task', task);
  callback();
}

function StateUpdate (d, callback) {
  async.waterfall([
   hh(ResearchPopulate, d.researchId),
   ResearchCtrl(d.researchId, d.result).updateState,
   ResearchCtrl(d.researchId).saveState
  ], callback);
}
io.sockets.on('connection', function (socket) {
  socket.emit("connected", 1);

  socket.on('research', function(researchId) {
    console.log(researchId);
    async.waterfall([
      function(callback) {
        if (!ResearchMemory[researchId]) {
          Research.findById(researchId).exec(function(err, doc) {
            if (!doc) return callback("error");
            ResearchMemory[researchId] = doc.toObject();
            ResearchMemory[researchId].code = require("./static/researchjs/"+ResearchMemory[researchId].path+"/server.js");
            callback(err);
          });
        } else {
          callback(null);
        }

      },
      function(callback) {
        ResearchMemory[researchId].code.updateState(ResearchMemory[researchId].state, false, function(err, state){
          console.log("AAAAA", ResearchMemory[researchId].state);
          ResearchMemory[researchId].state = state;
          callback(err);
        });
      },
      function(callback) {
        ResearchMemory[researchId].code.generateTask(ResearchMemory[researchId].state, function(err, state){
          callback(err);
        })
      }
    ], function(err) {
      if (err) return console.log("ERR", err);
      socket.emit('task', ResearchMemory[researchId].state);
    });
  });
  socket.on('result', function(obj) {
    async.waterfall([
      function(callback) {
        ResearchMemory[obj._id].code.updateState(ResearchMemory[obj._id].state, obj.result, function(err, state){
          ResearchMemory[obj._id].state = state;
          callback(err);
        });
      },
      function(callback) {
        ResearchMemory[obj._id].code.generateTask(ResearchMemory[obj._id].state, function(err, state){
          callback(err);
        })
      }
    ], function(err) {
      if (err) return console.log("ERR", err);
      socket.emit('task', ResearchMemory[obj._id].state);
    });
  });
  socket.on('test', function(obj){
    socket.emit('tested', obj);
  })
});

console.log("Listening at port "+ port);
Research.findOne({path:"primenumbers"}).exec(function(err, doc) {
  if (doc) return;

  var test = new Research({title: "Compute Primes", path: "primenumbers", description: "Hi! We're researchers from University College London (UCL), UK. We've done goofed and we've forgotten all of the prime numbers! That's right! All of them. Rather than admit this embarrassing oversight, we've decided to ask you, the kind people of Facebook, to help us re-calculate them all. It's a total nightmare and really not something you would expect from a university of our renown. It's almost like this is fictitious research, designed to show only the bare minimum of the potential of this rather spiffing Facebook App."});
  test.save(function(err){ if (err) console.log(err); });
});