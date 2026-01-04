// src/test_algorithms.js
//
// Knonw bigO times for testing

// O(1) - Constant Time Complexity
// The execution time does not depend on the input size.
function constantTime(arr) {
  return arr[0]; // Accessing the first element is always one operation
}

// O(n) - Linear Time Complexity
// The execution time grows linearly with the input size (n).
function linearTime(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]; // Operations inside the loop run 'n' times
  }
  return sum;
}

// O(n^2) - Quadratic Time Complexity
// The execution time grows quadratically with the input size (n).
function quadraticTime(arr) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      count++; // Operations inside nested loops run 'n * n' times
    }
  }
  return count;
}

// O(log n) - Logarithmic Time Complexity
// The execution time halves with each step. Example: Binary Search.
function logarithmicTime(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return -1; // Target not found
}



module.exports = {
  constantTime,
  linearTime,
  quadraticTime,
  logarithmicTime,
};
