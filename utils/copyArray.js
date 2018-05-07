/**
 * Copies the values of `source` to `array`. (This is lodash's implementation).
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
export default function copyArray(source, array) {
    let index = -1;
    const length = source.length;
  
    array || (array = new Array(length));

    while (++index < length) {
        array[index] = source[index];
    }

    return array;
};