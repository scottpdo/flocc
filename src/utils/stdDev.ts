import mean from "./mean";

/**
 * Find the standard deviation of an Array of numbers.
 * @param {Array<number>} arr
 * @returns {number}
 */
function stdDev(arr: Array<number>): number {
  if (arr.length === 0) return null;
  const ave = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - ave) * (x - ave))));
}

export default stdDev;
