/**
 * Return a random integer (or float)
 * between `min` and `max`
 * @param min
 * @param max
 * @param {boolean} float - If true, returns a float. If false or empty, returns an int.
 */
function random(
  min: number = 0,
  max: number = 1,
  float: boolean = false
): number {
  let r = Math.random() * (max - min);
  if (!float) r = Math.round(r);
  return min + r;
}

export default random;
