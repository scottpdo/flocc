/**
 * Find the sum of an Array of numbers.
 * @param {Array<number>} arr
 * @returns {number}
 * @since 0.0.16
 */
function sum(arr: Array<number>): number {
  return arr.reduce((a, b) => a + b, 0);
}

export default sum;
