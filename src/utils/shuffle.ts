import copyArray from './copyArray';

/**
 * Creates an array of shuffled values, using a version of the
 * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
 * (This is lodash's implementation).
 *
 * @param {Array} array The array to shuffle.
 * @returns {Array} Returns the new shuffled array.
 */
export default function shuffle(array: Array<any>): Array<any> {

  const length = array ? array.length : 0;
  if (!length) return [];

  let index: number = -1;
  const lastIndex: number = length - 1;
  const result: Array<any> = copyArray(array);
  while (++index < length) {
    const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
    const value = result[rand];
    result[rand] = result[index];
    result[index] = value;
  }

  return result;
};
