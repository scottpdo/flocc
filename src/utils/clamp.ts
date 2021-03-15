/**
 * Given a `number` and `min` and `max` values, restrict the number
 * to the range specified.
 *
 * ```js
 * clamp(5, 1, 10); // returns 5
 * clamp(5, 2, 4); // returns 4
 * clamp(0, -4, -3); // returns -3
 * ```
 *
 * @since 0.0.5
 */
export default function clamp(x: number, min: number, max: number): number {
  if (x < min) return min;
  if (x > max) return max;
  return x;
}
