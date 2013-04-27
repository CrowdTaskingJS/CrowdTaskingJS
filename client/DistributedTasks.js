function DistributedTasks () {

}

DistributedTasks.prototype.setup = function (options) {
  this.socket = io.connect();
  this.socket.on('connected', function() {
    this.researchSet(research);
  });

  this.socket.on('task', function() {
    this.taskExecute(research);
  });
};

DistributedTasks.prototype.researchSet = function (research) {
  this.socket('research', research);
};

DistributedTasks.prototype.taskExecute = function (research) {
  this.taskResult(task);
};

DistributedTasks.prototype.taskResult = function (task) {
  this.socket.emit('result', task);
};