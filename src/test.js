const path = require('path');
const { runAnalysis, determineComplexity } = require('./calculator');
const algorithms = require('./test_algorithms');
const { getNumberFromConsole, getOptionFromConsole, getStringFromConsole } = require('./utils/input');
const { createGraph } = require('./utils/plot');
const { getFileWithAutocomplete } = require('./utils/inputAsync');

async function main() {
  console.log("---- Big O Calculator & Tester ----");

  // 1. Select Algorithm Source
  const sourceOptions = ['Built-in Algorithms', 'Load Custom Function from File'];
  const source = getOptionFromConsole("Select algorithm source:", sourceOptions);
  
  if (!source) return;

  let algorithm;
  let selectedAlgoName;

  if (source === 'Built-in Algorithms') {
    const algoNames = Object.keys(algorithms);
    selectedAlgoName = getOptionFromConsole("Select an algorithm to test:", algoNames);
    if (!selectedAlgoName) return;
    algorithm = algorithms[selectedAlgoName];
  } else {
    // Load custom function
    const filePath = await getFileWithAutocomplete("Enter path to file (Tab for autocomplete): ");
    if (!filePath) return;

    let absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    
    try {
      console.log(`Loading module from: ${absolutePath}`);
      const customModule = require(absolutePath);
      
      if (typeof customModule === 'function') {
        algorithm = customModule;
        selectedAlgoName = customModule.name || 'Custom Function';
      } else if (typeof customModule === 'object') {
        const exports = Object.keys(customModule).filter(k => typeof customModule[k] === 'function');
        if (exports.length === 0) {
          console.error("No exported functions found in that file.");
          return;
        }
        selectedAlgoName = getOptionFromConsole("Select exported function to test:", exports);
        if (!selectedAlgoName) return;
        algorithm = customModule[selectedAlgoName];
      } else {
        console.error("Module does not export a function or object.");
        return;
      }
    } catch (error) {
      console.error(`Error loading file: ${error.message}`);
      return;
    }
  }

  // Special handling for logarithmicTime to provide the 'target' argument
  if (selectedAlgoName === 'logarithmicTime') {
    // Wrap it to search for a value that doesn't exist (-1) for worst-case performance
    const originalAlgo = algorithm;
    algorithm = (arr) => originalAlgo(arr, -1);
    
    // Provide a recommendation to the user for better accuracy with logarithmic functions
    console.log("\n\x1b[36mRecommendation:\x1b[0m For logarithmic functions like binary search, the performance curve is very flat.");
    console.log("For best results, use the 'Powers of 10' or 'Doubling' growth strategy with a large max input (e.g., 10^6 or more) to make the trend more apparent.\n");
  }

  // 2. Select Input Growth Strategy
  const growthStrategies = ['Powers of 10 (10, 100, 1000...)', 'Doubling (100, 200, 400...)', 'Linear Steps (1000, 2000, 3000...)'];
  const selectedStrategy = getOptionFromConsole("Select input growth strategy:", growthStrategies);

  if (!selectedStrategy) return;

  let inputSizes = [];

  if (selectedStrategy.startsWith('Powers of 10')) {
    const maxPower = getNumberFromConsole("Enter max power (e.g., 5 for 10^5): ");
    if (maxPower === null) return;
    for (let i = 1; i <= maxPower; i++) {
      inputSizes.push(10 ** i);
    }
  } else if (selectedStrategy.startsWith('Doubling')) {
    const startSize = getNumberFromConsole("Enter start size (e.g., 100): ");
    const steps = getNumberFromConsole("Enter number of doubling steps: ");
    if (startSize === null || steps === null) return;

    let current = startSize;
    for (let i = 0; i < steps; i++) {
      inputSizes.push(current);
      current *= 2;
    }
  } else if (selectedStrategy.startsWith('Linear Steps')) {
    const startSize = getNumberFromConsole("Enter start size (e.g., 1000): ");
    const stepSize = getNumberFromConsole("Enter step size (e.g., 1000): ");
    const count = getNumberFromConsole("Enter number of data points: ");
    if (startSize === null || stepSize === null || count === null) return;

    for (let i = 0; i < count; i++) {
      inputSizes.push(startSize + (i * stepSize));
    }
  }

  console.log(`\nTesting ${selectedAlgoName} with input sizes: ${inputSizes.join(', ')}`);
  console.log("Running analysis (10 iterations per size)... please wait.\n");

  // 3. Run Analysis
  const dataPoints = runAnalysis(algorithm, inputSizes);

  // 4. Display Results
  console.log("Results:");
  console.table(dataPoints);

  // 5. Determine Complexity
  const complexity = determineComplexity(dataPoints);
  console.log("\n--- Complexity Analysis ---");
  console.log(`Most likely Big O: \x1b[32m${complexity.bestFit}\x1b[0m`); // Green color
  
  // Show Confidence
  const confidenceColor = complexity.confidence > 75 ? '\x1b[32m' : '\x1b[31m'; // Green if > 75, Red if <= 75
  console.log(`Confidence: ${confidenceColor}${complexity.confidence}%\x1b[0m`);
  
  if (complexity.confidence <= 75) {
      console.log("\x1b[33mWarning: Low confidence detected. The data may be noisy or the algorithm might differ from standard complexity classes.\x1b[0m");
  }

  console.log("Model Fit (RMSE - Lower is better):");
  complexity.results.forEach(res => {
    console.log(`  ${res.type}: ${res.rmse.toFixed(6)}`);
  });

  // 6. Generate Graph
  try {
    const graphPath = await createGraph(dataPoints, complexity.bestFit, complexity.confidence);
    console.log(`\nGraph generated: ${graphPath}`);
  } catch (error) {
    console.error(`\nFailed to generate graph: ${error.message}`);
  }
}

main();
