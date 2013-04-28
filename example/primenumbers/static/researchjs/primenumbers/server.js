module.exports = {
  updateState: function(state, result, save) {
    if (state === undefined || result === undefined) {
      return save(null, {"highestPrime": 3});
    }
    state.highestPrime = Math.max(state.highestPrime, result.nextPrime);
    return callback(null, state);
  },
  generateTask: function(state, next) {
    next(null, state);
  }
};