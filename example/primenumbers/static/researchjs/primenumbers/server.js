module.exports = {
  updateState: function(state, result, save) {
    if (state === undefined && result === undefined) {
      return save(null, {"highestPrime": 3});
    }
    if (result) state.highestPrime = Math.max(state.highestPrime, result.nextPrime);
    return save(null, state);
  },
  generateTask: function(state, next) {
    console.log("STATE2", state);
    next(null, state);
  }
};