// src/calculator.js
const { performance } = require('perf_hooks');
const { stringify } = require('querystring');
const ss = require('simple-statistics');
const { VM } = require('vm2');

/**
 * Executes a user-provided function in a secure sandbox.
 * @param {string} code The string content of the user's function.
 * @param {*} input The input to pass to the user's function.
 * @returns The result of the function execution.
 * @throws An error if the code is invalid, times out, or contains errors.
 */
function runInSandbox(code, input) {
  const vm = new VM({
    timeout: 5000, // 5-second timeout per execution
    sandbox: { input },
    eval: false,
    wasm: false,
    require: false // Disallow require()
  });

  // We combine the user's code with the call to the function.
  const fullCode = `
        ${code}
        functionToTest(input);
    `;

  return vm.run(fullCode);
}

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
 * @param {Array<number>} inputSizes An array of input sizes to test.
 * @param {number} iterations Number of times to run per input size (default 10).
 * @returns {Array<{n: number, time: number}>} An array of data points.
 */
function runAnalysis(code, inputSizes, iterations = 10, inputMode = 'array') {
  const dataPoints = [];

  // The warmup phase is less critical now as each run is isolated, 
  // but a single, quick initial run can still help initialize things if needed.
  if (inputSizes.length > 0) {
    try {
      const warmupSize = inputSizes[0];
      const warmupInput = inputMode === 'number' ? warmupSize : generateInputArray(warmupSize);
      runInSandbox(code, warmupInput);
    } catch (e) {
      // If warmup fails, it's a strong indicator the user's code is broken.
      // We should probably throw this error to be caught by the server handler.
      console.error('Warmup execution failed:', e.message);
      throw new Error(`Execution failed during warmup: ${e.message}`);
    }
  }

  for (const n of inputSizes) {
    const times = [];
    for (let i = 0; i < iterations; i++) {
      const inputForAlgorithm = inputMode === 'number' ? n : generateInputArray(n);

      try {
        const start = performance.now();
        runInSandbox(code, inputForAlgorithm);
        const end = performance.now();
        times.push(end - start);
      } catch (e) {
        // If any iteration fails (e.g., timeout), we invalidate the results for this input size.
        console.error(`Execution failed for input size ${stringify(n)}:`, e.message);
        // We will return the data points gathered so far and let the server decide how to proceed.
        // Or we could throw, aborting the whole analysis. Let's throw to be safe.
        throw new Error(`Execution timed out or failed for input size n=${n}. Details: ${e.message}`);
      }
    }

    const avgTime = ss.mean(times);
    dataPoints.push({ n, time: avgTime });
  }

  return dataPoints;
}

/**
 * Calculates the Root Mean Square Error (RMSE) between actual and predicted values.
 * @param {Array<number>} actual
 * @param {Array<number>} predicted
 * @returns {number}
 */
function calculateRMSE(actual, predicted) {
  const sumSquaredErrors = actual.reduce((sum, val, i) => sum + (val - predicted[i]) ** 2, 0);
  return Math.sqrt(sumSquaredErrors / actual.length);
}

/**
 * Determines the Big O complexity based on the RMSE of various regression models.
 * @param {Array<{n: number, time: number}>} dataPoints
 * @returns {Object} Analysis result with RMSE scores and best fit.
 */
function determineComplexity(dataPoints) {
  const nValues = dataPoints.map(d => d.n);
  const timeValues = dataPoints.map(d => d.time);

  // 1. O(1) Constant: Time = mean(Time)
  const meanTime = ss.mean(timeValues);
  const constantPredictions = nValues.map(() => meanTime);
  const constantRMSE = calculateRMSE(timeValues, constantPredictions);

  // Helper to run linear regression on transformed data and get RMSE
  const getRegressionRMSE = (transformFn) => {
    const data = dataPoints.map(d => [transformFn(d.n), d.time]);
    const model = ss.linearRegression(data);
    const line = ss.linearRegressionLine(model);
    const predictions = dataPoints.map(d => line(transformFn(d.n)));
    return calculateRMSE(timeValues, predictions);
  };

  // 2. O(n) Linear
  const linearRMSE = getRegressionRMSE(n => n);

  // 3. O(n^2) Quadratic
  const quadraticRMSE = getRegressionRMSE(n => n ** 2);

  // 4. O(log n) Logarithmic
  const logRMSE = getRegressionRMSE(n => Math.log(n));

  // 5. O(n log n) Linear-ithmic
  const nLogNRMSE = getRegressionRMSE(n => n * Math.log(n));

  const models = [
    { type: 'O(1) - Constant', rmse: constantRMSE, complexity: 1 },
    { type: 'O(log n) - Logarithmic', rmse: logRMSE, complexity: 2 },
    { type: 'O(n) - Linear', rmse: linearRMSE, complexity: 3 },
    { type: 'O(n log n) - Linear-ithmic', rmse: nLogNRMSE, complexity: 4 },
    { type: 'O(n^2) - Quadratic', rmse: quadraticRMSE, complexity: 5 }
  ];

  models.sort((a, b) => a.rmse - b.rmse);

  let bestModel = models[0];
  let confidence;

  // Hybrid approach: use a special heuristic for ultra-fast functions, and standard logic for others.
  const isUltraFast = meanTime < 1e-4;

  if (isUltraFast) {
    const o1Model = models.find(m => m.type.includes('O(1)'));
    const logModel = models.find(m => m.type.includes('O(log n)'));

    // For ultra-fast functions, trust the model with the mathematically superior (lower) RMSE.
    if (logModel && o1Model && logModel.rmse < o1Model.rmse) {
      bestModel = logModel;
    } else {
      bestModel = o1Model; // Default to O(1) otherwise
    }

    confidence = 95; // Assign a high, fixed confidence score based on this heuristic.
  } else {
    // Standard logic for macroscopic measurements: prefer simpler models if they are "close enough".
    for (let i = 1; i < models.length; i++) {
      const candidate = models[i];
      if (candidate.complexity < bestModel.complexity) {
        const diff = (candidate.rmse - bestModel.rmse) / (bestModel.rmse || 1e-9);
        if (diff < 0.15) { // 15% tolerance
          bestModel = candidate;
        }
      }
    }

    // Standard confidence calculation for slower functions
    const signalMagnitude = meanTime > 0 ? meanTime : 1;
    const normalizedError = bestModel.rmse / signalMagnitude;
    const fitQuality = Math.max(0, 1 - (normalizedError * 2));

    const sortedByFit = [...models].sort((a, b) => a.rmse - b.rmse);
    let secondBest = sortedByFit[0];
    if (secondBest === bestModel) {
      secondBest = sortedByFit[1];
    }

    let separation = 0;
    if (secondBest) {
      separation = (secondBest.rmse - bestModel.rmse) / (secondBest.rmse || 1);
      separation = Math.min(1, separation);
    }

    confidence = (fitQuality * 0.7 + separation * 0.3) * 100;
  }

  // Formatting for output (converting RMSE to 4 decimals string if needed, or keeping number)
  const results = models.map(m => ({
    type: m.type,
    rmse: m.rmse
  }));

  // Re-sort results by RMSE for display purposes
  results.sort((a, b) => a.rmse - b.rmse);

  return {
    bestFit: bestModel.type,
    confidence: Math.round(confidence),
    results: results
  };
}

module.exports = {
  generateInputArray,
  runAnalysis,
  determineComplexity
};
