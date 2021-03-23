/**
 * Return the maximum value from an array of numbers.
 *
 * ```js
 * max([1, 2, 3]); // returns 3
 * max([10]); // returns 10
 *
 * max([]); // returns null for empty arrays
 * ```
 *
 * @since 0.2.0
 */
export default function max(arr: Array<number>): number {
  if (arr.length === 0) return null;
  return Math.max.apply(null, arr);
}
