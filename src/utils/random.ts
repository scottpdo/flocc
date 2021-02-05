import PRNG from "./internal/PRNG";

/**
 * Return a random integer (or float)
 * between `min` and `max`
 * @param min
 * @param max
 * @param {boolean} float - If true, returns a float. If false or empty, returns an int.
 * @since 0.1.4
 */
function random(
  min: number = 0,
  max: number = 1,
  float: boolean = false
): number {
  const rand = (PRNG.getSeed() === null ? Math : PRNG).random();
  const length = `${rand}`.length - 1;
  if (float) {
    return Math.min(min + rand * (max - min + parseFloat(`1e-${length}`)), max);
  } else {
    return min + Math.floor(rand * (max - min + 1));
  }
}

export default random;
