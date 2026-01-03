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
    for (let i = 0; i < 5; i++) {
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
 * Determines the Big O complexity based on the correlation (R^2) of the data.
 * @param {Array<{n: number, time: number}>} dataPoints
 * @returns {Object} Analysis result with R^2 scores and best fit.
 */
function determineComplexity(dataPoints) {
  // Extract N and Time values
  const nValues = dataPoints.map(d => d.n);
  const timeValues = dataPoints.map(d => d.time);

  // Prepare data for regression models
  // 1. O(1) Constant: Time vs N
  // We check if the slope of the linear regression is negligible.
  const linearData = dataPoints.map(d => [d.n, d.time]);
  const linearModel = ss.linearRegression(linearData);
  const linearLine = ss.linearRegressionLine(linearModel);
  const linearR2 = ss.rSquared(linearData, linearLine);

  const slope = linearModel.m;
  const minN = Math.min(...nValues);
  const maxN = Math.max(...nValues);
  const meanTime = ss.mean(timeValues);
  // Calculate total predicted growth across the input range
  const totalGrowth = slope * (maxN - minN);
  
  // If growth is less than 20% of the average execution time (or negative due to noise), assume O(1)
  // We relaxed this from 5% to 20% because for very fast operations (micro-seconds), system noise 
  // can easily simulate a 5-10% "growth" or fluctuation.
  // We also check if the Linear R^2 is very low (< 0.6), which implies N doesn't explain the time changes (noise).
  const isConstantTime = slope < 0 || (meanTime > 0 && totalGrowth < 0.2 * meanTime) || linearR2 < 0.6;

  if (isConstantTime) {
      return {
          bestFit: 'O(1) - Constant',
          results: [
              { type: 'O(1) - Constant', r2: 1.0 },
              { type: 'O(n) - Linear', r2: linearR2 },
              // We'll calculate the others just for completeness if needed, but returning here is fine
          ]
      };
  }

  // 2. O(n) Linear: Time vs N
  // (Already calculated linearR2 above)

  // 3. O(n^2) Quadratic: Time vs N^2
  // We model Time = a * N^2 + b
  const quadraticData = dataPoints.map(d => [d.n ** 2, d.time]);
  const quadraticModel = ss.linearRegression(quadraticData);
  const quadraticLine = ss.linearRegressionLine(quadraticModel);
  const quadraticR2 = ss.rSquared(quadraticData, quadraticLine);

  // 4. O(log n) Logarithmic: Time vs log(N)
  // We model Time = a * log(N) + b
  const logData = dataPoints.map(d => [Math.log(d.n), d.time]);
  const logModel = ss.linearRegression(logData);
  const logLine = ss.linearRegressionLine(logModel);
  const logR2 = ss.rSquared(logData, logLine);

  // 5. O(n log n) Linear-ithmic: Time vs N * log(N)
  const nLogNData = dataPoints.map(d => [d.n * Math.log(d.n), d.time]);
  const nLogNModel = ss.linearRegression(nLogNData);
  const nLogNLine = ss.linearRegressionLine(nLogNModel);
  const nLogNR2 = ss.rSquared(nLogNData, nLogNLine);

  // Find the best fit
  const models = [
    { type: 'O(n) - Linear', r2: linearR2 },
    { type: 'O(n^2) - Quadratic', r2: quadraticR2 },
    { type: 'O(log n) - Logarithmic', r2: logR2 },
    { type: 'O(n log n) - Linear-ithmic', r2: nLogNR2 }
  ];

  // Sort by R^2 descending
  models.sort((a, b) => b.r2 - a.r2);

  // Apply Occam's Razor: Prefer simpler models if R^2 is very close (within 0.01)
  // Complexity hierarchy (simplest to most complex): O(1) -> O(log n) -> O(n) -> O(n log n) -> O(n^2)
  // Note: We don't check O(1) in this list explicitly yet.
  
  let bestModel = models[0];
  const tolerance = 0.01;

  // Check if O(n) is close to the top model (likely O(n log n))
  const simpleLinear = models.find(m => m.type === 'O(n) - Linear');
  if (simpleLinear && bestModel.type !== 'O(n) - Linear') {
    if (bestModel.r2 - simpleLinear.r2 < tolerance) {
       bestModel = simpleLinear;
    }
  }

  // Check if O(log n) is close to the top model
  const simpleLog = models.find(m => m.type === 'O(log n) - Logarithmic');
  if (simpleLog && bestModel.type !== 'O(log n) - Logarithmic') {
     if (bestModel.r2 - simpleLog.r2 < tolerance) {
        bestModel = simpleLog;
     }
  }

  return {
    bestFit: bestModel.type,
    results: models
  };
}

module.exports = {
  generateInputArray,
  runAnalysis,
  determineComplexity
};
