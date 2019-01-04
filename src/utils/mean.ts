import sum from './sum';

/**
 * Find the mean value of an Array of numbers.
 * @param {Array<number>} arr
 * @returns {number}
 */
function mean(arr: Array<number>): number {
  return sum(arr) / arr.length;
}

export default mean;
