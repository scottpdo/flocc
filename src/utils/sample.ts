/**
 * Gets a random element from `array`.
 * @param {Array} array
 * @returns {*} Returns the random element.
 */
export default function sample(array: any[], weights?: number[]): any {
  const length = array ? array.length : 0;
  if (length === 0) return null;

  // if no weights given, return a random value
  if (!weights) return array[Math.floor(Math.random() * length)];

  // Otherwise, use the `weights` array to tend toward certain values.
  // Normalize the weights array
  let sum = 0;
  const cumulativeWeights = weights.map(w => {
    const value = w + sum;
    sum += w;
    return value;
  });

  for (let i = 0; i < array.length; i++) {
    if (Math.random() < cumulativeWeights[i] / sum) return array[i];
  }

  return null;
}
