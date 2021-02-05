import uniform from "./uniform";

/**
 * Given a mean and standard deviation,
 * returns a value from a normal/Gaussian distribution.
 * @param {number} mean
 * @param {number} sd
 * @returns {number}
 * @since 0.0.8
 */
export default function gaussian(mean: number = 0, sd: number = 1): number {
  let y: number, x1: number, x2: number, w: number;

  do {
    x1 = 2 * uniform() - 1;
    x2 = 2 * uniform() - 1;
    w = x1 * x1 + x2 * x2;
  } while (w >= 1);

  w = Math.sqrt((-2 * Math.log(w)) / w);
  y = x1 * w;

  return y * sd + mean;
}
