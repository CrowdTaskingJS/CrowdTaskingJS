var server = {
  updateState: function(state, result) {
    if (state === undefined || result === undefined) {
      return {"highestPrime": 3};
    }
    state.highestPrime = Math.max(state.highestPrime, result.nextPrime);
    return state;
  },
  generateTask: function(state) {
    return state;
  }
};

module.exports = server;