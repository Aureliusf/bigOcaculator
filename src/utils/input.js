// src/utils/input.js

const readlineSync = require('readline-sync');

function getNumberFromConsole(message) {
  let userInput = readlineSync.question(message);

  if (userInput === null || userInput === '') {
    console.log("User cancelled the input or provided no input.");
    return null;
  }

  let number = Number(userInput);

  if (isNaN(number)) {
    console.log("Invalid input. Please enter a valid number.");
    return null;
  }

  console.log("You entered: " + number);
  return parseInt(number);
}

module.exports = {
  getNumberFromConsole,
};
