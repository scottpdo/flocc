/**
 * Restricts a number x to the range min --> max.
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @return {number} The clamped value.
 * @since 0.0.5
 */
export default function clamp(x: number, min: number, max: number): number {
  if (x < min) return min;
  if (x > max) return max;
  return x;
}
