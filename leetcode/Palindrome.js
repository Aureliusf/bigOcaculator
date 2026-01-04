var bruteForce = function (x) {
  var s = x.toString();
  var t = s.split("").reverse().join("");
  return s === t;
};

var optimized = function (x) {
  if (x < 0 || (x !== 0 && x % 10 === 0)) {
    return false;
  }
  var half = 0;
  while (x > half) {
    half = half * 10 + x % 10;
    x = Math.floor(x / 10);
  }
  return x === half || x === Math.floor(half / 10);
};

module.exports = {
  bruteForce,
  optimized,
};
