import copyArray from './copyArray'

/**
 * Creates an array of shuffled values, using a version of the
 * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
 * (This is lodash's implementation).
 *
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to shuffle.
 * @returns {Array} Returns the new shuffled array.
 */
export default function shuffle(array) {

    const length = array == null ? 0 : array.length;

    if (!length) return [];
    
    let index = -1;
    const lastIndex = length - 1;
    const result = copyArray(array);
    while (++index < length) {
        const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
        const value = result[rand];
        result[rand] = result[index];
        result[index] = value;
    }

    return result;
};