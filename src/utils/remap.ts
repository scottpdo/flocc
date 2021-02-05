/**
 * Maps a number x, from the given domain aMin --> aMax,
 * onto the given range bMin --> bMax.
 * Ex: remap(5, 0, 10, 0, 100) => 50.
 * @param {number} x
 * @param {number} aMin
 * @param {number} aMax
 * @param {number} bMin
 * @param {number} bMax
 * @returns {number} The remapped value.
 * @since 0.0.5
 */
export default function remap(
  x: number,
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number
): number {
  return bMin + ((bMax - bMin) * (x - aMin)) / (aMax - aMin);
}
