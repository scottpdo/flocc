/**
 * Maps a number x, from the given domain aMin --> aMax,
 * onto the given range bMin --> bMax.
 * Ex: remap(5, 0, 10, 0, 100) => 50.
 * @param {number} x 
 * @param {number} aMin 
 * @param {number} aMax 
 * @param {number} bMin 
 * @param {number} bMax 
 * @return {number} The remapped value.
 */
export default function remap(x, aMin, aMax, bMin, bMax) {
    return bMin + (bMax - bMin) * (x - aMin) / (aMax - aMin);
};