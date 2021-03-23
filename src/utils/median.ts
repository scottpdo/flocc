import percentile from "./percentile";

/**
 * Return the mean value from an array of numbers.
 *
 * ```js
 * median([1, 2, 3]); // returns 2
 * median([10]); // returns 10
 * median([1, 2, 3, 4]); // returns 2.5 (the mean of the two median values)
 *
 * median([]); // returns null for empty arrays
 * ```
 *
 * @param {number[]} arr
 * @since 0.2.0
 */
export default function median(arr: number[]): number {
  return percentile(arr, 0.5);
}
