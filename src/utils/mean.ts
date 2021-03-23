import sum from "./sum";

/**
 * Return the mean value from an array of numbers.
 *
 * ```js
 * mean([1, 2, 3]); // returns 2
 * mean([10]); // returns 10
 *
 * mean([]); // returns null for empty arrays
 * ```
 *
 * @since 0.0.16
 */
function mean(arr: Array<number>): number {
  if (arr.length === 0) return null;
  return sum(arr) / arr.length;
}

export default mean;
