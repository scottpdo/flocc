/**
 * Linearly interpolate between two values.
 * @param x {number} - The first value.
 * @param y {number} - The second value.
 * @param t {number} - The amount by which to interpolate (0 returns x, 1 returns y).
 * @since 0.2.4
 */
export default function lerp(x: number, y: number, t: number): number {
  return (1 - t) * x + t * y;
}
