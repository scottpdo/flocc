/**
 * Return the minimum value from an array of numbers.
 *
 * ```js
 * min([1, 2, 3]); // returns 1
 * min([10]); // returns 10
 *
 * min([]); // returns null for empty arrays
 * ```
 * @since 0.2.0
 */
export default function min(arr: Array<number>): number {
  if (arr.length === 0) return null;
  return Math.min.apply(null, arr);
}
