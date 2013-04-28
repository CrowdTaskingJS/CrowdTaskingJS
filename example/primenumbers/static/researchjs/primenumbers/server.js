module.exports = {
  updateState: function(state, result, save) {
    if (state === undefined || result === undefined) {
      console.log("STATE", state, result);
      return save(null, {"highestPrime": 3});
    }
    state.highestPrime = Math.max(state.highestPrime, result.nextPrime);
    return save(null, state);
  },
  generateTask: function(state, next) {
    console.log("STATE2", state);
    next(null, state);
  }
};