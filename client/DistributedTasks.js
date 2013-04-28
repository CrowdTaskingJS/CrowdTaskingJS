function DistributedTasks () {
  this.setup();
}

DistributedTasks.prototype.setup = function (options) {
  this.socket = io.connect();
  this.socket.on('connected', function() {
    this.researchSet(research);
  });

  this.socket.on('task', function(research) {
    code && this.evalCode(research.client);
    this.taskExecute(research);
  });
};

DistributedTasks.prototype.researchSet = function (researchId) {
  this.socket.emit('research', researchId);
};

DistributedTasks.prototype.taskExecute = function (research) {
  this.code(params, this.taskResult);
};

DistributedTasks.prototype.taskResult = function (task) {
  this.socket.emit('result', task);
};

DistributedTasks.prototype.evalCode = function (code) {
 this.code = new Function(code);
};