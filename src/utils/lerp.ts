/**
 * Linearly interpolates between `x` and `y`. The third parameter `t` (usually
 * a value between `0` and `1`) is the amount by which to interpolate &mdash; a value of `0`
 * returns the `x` value and `1` returns the `y` value.
 *
 * ```js
 * lerp(5, 10, 0.5); // returns 7.5
 * lerp(0, 100, 0.1); // returns 10
 * lerp(22, 79, 1); // returns 79
 * ```
 *
 * @param x The first value.
 * @param y The second value.
 * @param t The amount by which to interpolate (0 returns x, 1 returns y).
 * @since 0.2.4
 */
export default function lerp(x: number, y: number, t: number): number {
  return (1 - t) * x + t * y;
}
