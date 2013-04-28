module.exports = {
  updateState: function(state, result, save) {
    if (state === undefined || result === undefined) {
      return save(null, {"done": [], "current": {"hash": "10bcdd4f17c350fa02d69e18f717cdc74f7317bf", "salt": "ronapobu"}, "queue": [{"hash": "922fe719cf2868ca4b7fa1e075cb58839c373c50", "salt": "wuvuyuva"}]});
    }
    if (result.password) {
      state.current.password = result.password;
      done.push(state.current);
      state.current = state.queue.pop();
    } else {
      
    }
    return save(null, state);
  },
  generateTask: function(state, next) {
    next(null, state);
  }
};