// src/utils/createTestSuite.js

function testSuite(n) {
  let suite = new Array()

  let i = 1;
  while (i < n) {
    suite.push(i * 10);
    i++
  }
  return suite;
}

module.exports = {
  testSuite,
};
