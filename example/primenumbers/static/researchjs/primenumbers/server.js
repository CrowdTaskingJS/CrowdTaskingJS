module.exports = {
  updateState: function(state, result, callback) {
    if (state === undefined || result === undefined) {
      return callback({"highestPrime": 3});
    }
    state.highestPrime = Math.max(state.highestPrime, result.nextPrime);
    return callback(state);
  },
  generateTask: function(state, callback) {
    callback(state);
  }
};