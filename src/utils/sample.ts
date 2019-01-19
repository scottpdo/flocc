/**
 * Gets a random element from `array`.
 * @param {Array} array
 * @returns {*} Returns the random element.
 */
export default function sample(array: Array<any>): any {
  const length = array ? array.length : 0;
  return length ? array[Math.floor(Math.random() * length)] : null;
};
