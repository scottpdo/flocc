/**
 * Gets a random element from `array`. (This is lodash's implementation).
 * @param {Array} array 
 * @returns {*} Returns the random element.
 */
export default function sample(array) {
    const length = array == null ? 0 : array.length;
    return length ? array[Math.floor(Math.random() * length)] : undefined;
};