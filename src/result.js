// /src/result.js

/**
 * Represents a pair of floating-point numbers.
 */
class Result {
  /**
   *
   * @param {number} value1
   * @param {number} value2
   */
  constructor(value1, value2) {
    /**
     * @type {number}
     */
    this.value1 = value1;

    /**
     * @type {number}
     */
    this.value2 = value2;
  }

  /**
   * @returns {string} A string representation in the format "Result(value1, value2)".
   */
  toString() {
    return `Result(${this.value1}, ${this.value2})`;
  }

  /**
   * @returns {number[]} An array with [value1, value2].
   */
  toArray() {
    return [this.value1, this.value2];
  }
}
