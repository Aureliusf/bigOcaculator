const { performance } = require('perf_hooks');

const { generateInputArray } = require('./calculator');
const { linearTime } = require('./test_algorithms');
const { getNumberFromConsole } = require('./utils/input');


function main() {
  console.log("---- Test Algo ----")
  let zeros = (getNumberFromConsole("Please enter the number of 0s you want to test: "));
  let steps = (getNumberFromConsole("Please enter the the incremental steps you want to test: "));

  let suite = testSuite(zeros, steps);

  console.log("array sizes to test in my test-suite:", suite);

  let suiteResults = new Array();

  for (let index = 0; index < suite.length; index++) {
    const arraysize = suite[index];

    const start = performance.now();

    linearTime(generateInputArray(arraysize));

    const end = performance.now();

    const time = end - start;

    console.log("time taken:", time)

    suiteResults.push(time);

  }


  console.log(suiteResults);


}


function testSuite(zeros, steps) {
  let suite = new Array()

  let i = 0;
  while (i < zeros + 1) { //n+1 because, we start counting number of 0s at 10, 10^1
    suite.push(10 ** i); // 10^i
    i = i + steps;
  }
  return suite;
}

main()
