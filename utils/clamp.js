/**
 * Restricts a number x to the range min --> max.
 * @param {number} x 
 * @param {number} min 
 * @param {number} max
 * @return {number} The clamped value.
 */
export default function clamp(x, min, max) {
    if (x < min) return min;
    if (x > max) return max;
    return x;
};