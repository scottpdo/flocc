/**
 * Copies the values of `source` to `arr`
 * or to a new Array.
 *
 * @private
 * @param {Array} source The Array to copy values from.
 * @param {Array} [arr=[]] The Array to copy values to.
 * @returns {Array}
 * @since 0.0.7
 */
export default function copyArray<T>(source: T[], arr?: T[]) {
  let index: number = -1;
  const length: number = source.length;

  if (!arr) arr = new Array(length);

  while (++index < length) arr[index] = source[index];

  return arr;
}
