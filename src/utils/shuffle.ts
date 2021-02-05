import copyArray from "./internal/copyArray";
import random from "./random";

/**
 * Creates an array of shuffled values, using a version of the
 * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
 * (This is lodash's implementation).
 *
 * @param {Array} array The array to shuffle.
 * @returns {Array} Returns the new shuffled array.
 * @since 0.0.7
 */
export default function shuffle<T>(array: T[]): T[] {
  const length = array ? array.length : 0;
  if (!length) return [];

  let index: number = -1;
  const lastIndex: number = length - 1;
  const result: T[] = copyArray(array);
  while (++index < length) {
    const rand: number = index + random(0, lastIndex - index);
    const value: T = result[rand];
    result[rand] = result[index];
    result[index] = value;
  }

  return result;
}
