var client = {
  internal: {
    isPrime: function(possible) {
      if (possible == 2 || possible == 3) {
        return true;
      }
      if (possible % 2 == 0 || possible % 3 == 0) {
        return false;
      }
      var k = 6;
      var max = Math.sqrt(possible);
      for (; k <= max; k += 6) {
        if (possible % (k+1) == 0 || possible % (k-1) == 0) {
          return false;
        }
      }
      return true;
    }
  },
  execute: function(params) {
    var current = params.highestPrime + 2;
    while (!this.internal.isPrime(current)) {
      current += 2;
    }
    return {"nextPrime": current};
  }
};