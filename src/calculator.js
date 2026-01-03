// src/calculator.js
const { performance } = require('perf_hooks');

/**
 * Generates an array of a specified size for testing algorithms.
 * @param {number} n The desired size of the array.
 * @returns {Array<number>} A new array of size 'n'.
 */
function generateInputArray(n) {

  return Array.from({ length: n }, (_, i) => i);
}

/**
 * Runs an algorithm with varying input sizes and collects execution times.
 * @param {Function} algorithm The function to test for Big O complexity.
 * @param {Function} inputGenerator A function that generates input of a given size n.
 * @returns {Array<{n: number, duration: number}>} An array of data points (input size and execution time).
 */
function runAnalysis(algorithm, inputSizes) {
  const dataPoints = [];

  for (const n of inputSizes) {

    let array = generateInputArray(inputSizes[n]);

    let start = performance.now(); //Stopwatch

    algorithm(array);

    let end = performance.now(); //Stopwatch

    let duration = end - start;

    dataPoints.push(duration);
  }

  return dataPoints;
}

module.exports = {
  generateInputArray,
  runAnalysis,
};
