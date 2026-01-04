// src/calculator.js
const { performance } = require('perf_hooks');
const ss = require('simple-statistics');

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
function runAnalysis(algorithm, inputSizes, iterations = 10) {
  const dataPoints = [];

  // Warmup phase: Run with the smallest input size a few times to trigger JIT
  if (inputSizes.length > 0) {
    const warmupSize = inputSizes[0];
    const warmupArray = generateInputArray(warmupSize);
    // Increased warmup iterations to ensure JIT optimization
    for (let i = 0; i < 100; i++) {
      algorithm(warmupArray);
    }
  }

  for (const n of inputSizes) {
    // Adaptive Batching Calibration
    // Determine how many iterations (batchSize) are needed to get a measurable execution time (~10ms)
    // This is crucial for very fast algorithms (O(1), O(log n)) to avoid system timer noise.
    let batchSize = 1;
    let calibrationArray = generateInputArray(n);
    let calStart = performance.now();
    let calEnd = calStart;
    let calCount = 0;

    // Run until at least 5ms have passed or we hit a safety limit
    // We increment calCount to avoid infinite loops if the clock doesn't advance
    while ((calEnd - calStart) < 5 && calCount < 1000000) {
      // Execute the algorithm
      // Note: We reuse the array. This assumes the algorithm is read-only or idempotent.
      // For O(1)/O(log n) detection, this is usually true and necessary for accuracy.
      algorithm(calibrationArray);
      calCount++;
      calEnd = performance.now();
    }

    const calDuration = calEnd - calStart;
    if (calCount > 1) {
      // If we needed multiple runs to reach 5ms, we calculate a batchSize for ~15ms per measurement
      // batchSize = (Target Time / Time per Op) = (15 / (calDuration / calCount))
      //             = (15 * calCount) / calDuration
      batchSize = Math.ceil((15 * calCount) / (calDuration || 0.001));
    }

    const times = [];
    for (let i = 0; i < iterations; i++) {
      // Create a fresh array for each iteration
      let array = generateInputArray(n);

      const start = performance.now();
      // Execute batch
      for (let b = 0; b < batchSize; b++) {
        algorithm(array);
      }
      const end = performance.now();

      // Calculate average time per single execution
      times.push((end - start) / batchSize);
    }

    const avgTime = ss.mean(times);
    // or use median to remove outliers: const avgTime = ss.median(times); 

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

  // Apply Occam's Razor 2.0: A simpler model wins if its RMSE is not "statistically worse" than a better-fitting, more complex model.
  // We define "statistically worse" as being more than `tolerance` percent higher than the best model's RMSE.
  // This prevents a complex model with a tiny RMSE advantage (e.g., 0.001 vs 0.0011) from winning.

  let bestModel = models[0];
  const tolerance = 0.15; // 15% tolerance

  for (let i = 1; i < models.length; i++) {
    const candidate = models[i];
    
    // If candidate is simpler...
    if (candidate.complexity < bestModel.complexity) {
      // And its RMSE is within the tolerance margin of the current best model...
      const diff = (candidate.rmse - bestModel.rmse) / (bestModel.rmse || 1e-9);
      if (diff < tolerance) {
        bestModel = candidate; // ...then prefer the simpler model.
      }
    }
    
    // A special check for O(log n) vs O(1)
    // If the best model is O(log n) and O(1) is a close contender, it's often due to noise.
    // Let's make O(log n) "prove" it's significantly better than O(1).
    if (bestModel.type.includes('O(log n)')) {
        const o1_model = models.find(m => m.type.includes('O(1)'));
        if (o1_model) {
            // If O(1)'s error is NOT much larger than O(log n)'s error, prefer O(1).
            // "Much larger" can be defined as, e.g., 3x the error.
            if (o1_model.rmse < bestModel.rmse * 3) {
                 // Check if it's not just noise
                const signalMagnitude = meanTime > 0 ? meanTime : 1;
                const normalizedError = bestModel.rmse / signalMagnitude;
                // If the error is very small relative to the measurement, it's likely noise, so prefer O(1).
                if (normalizedError < 0.1) { // Error is less than 10% of the mean time
                    bestModel = o1_model;
                }
            }
        }
    }
  }

  // Final check: If the timing is extremely low and flat, it must be O(1).
  // This catches cases where O(log n) fits a tiny upward noise trend.
  const timeVariance = ss.variance(timeValues);
  const maxTime = ss.max(timeValues);
  const noiseFloor = 1e-9;
  
  if (maxTime < 0.001 && (timeVariance / meanTime) < 0.1) { // < 1 microsecond and low relative variance
    bestModel = models.find(m => m.type.includes('O(1)'));
  }

  // Calculate Confidence
  // Confidence is a combination of:
  // 1. Fit Quality: How well does the best model explain the data?
  // 2. Separation: How much better is the best model than the next best hypothesis?
  
  let confidence;
  
  if (bestModel.rmse < noiseFloor) {
      // If the error is indistinguishable from zero (noise), we are 100% confident it's the simplest model fitting this.
      confidence = 100;
  } else {
      // 1. Fit Quality (0 to 1)
      // Normalized RMSE (Coefficient of Variation of the Error)
      // If error is 10% of the signal, fit quality is 0.9.
      const signalMagnitude = meanTime > 0 ? meanTime : 1;
      const normalizedError = bestModel.rmse / signalMagnitude;
      const fitQuality = Math.max(0, 1 - (normalizedError * 2)); // Penalize error more steeply
      
      // 2. Separation (0 to 1)
      // Find the next best model that is NOT the chosen one (based on the sorted 'results' list or original 'models')
      // Note: 'bestModel' might not be results[0] because of Occam's razor logic above.
      
      // Sort models by RMSE again just to be sure we find the runner up in terms of fit
      const sortedByFit = [...models].sort((a, b) => a.rmse - b.rmse);
      let secondBest = sortedByFit[0];
      if (secondBest === bestModel) {
          secondBest = sortedByFit[1];
      }
      
      let separation = 0;
      if (secondBest) {
          // Percent difference between best RMSE and second best RMSE
          separation = (secondBest.rmse - bestModel.rmse) / (secondBest.rmse || 1);
          // Clamp to 0-1 range (if second best is way worse, separation is high)
          separation = Math.min(1, separation);
      }
      
      // Combined Confidence Score
      // We weight Fit Quality higher because if the data is garbage, separation doesn't matter.
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
