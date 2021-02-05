import sum from "./sum";

/**
 * Find the mean value of an Array of numbers.
 * @param {Array<number>} arr
 * @returns {number}
 * @since 0.0.16
 */
function mean(arr: Array<number>): number {
  if (arr.length === 0) return null;
  return sum(arr) / arr.length;
}

export default mean;
