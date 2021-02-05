import PRNG from "./internal/PRNG";

/**
 * Seed a pseudo-random number generator with a value.
 * This can be used to produce predictable pseudo-random numbers.
 * When calling `utils.random`, `utils.sample`, or other functions
 * relying on randomness with the same initial seed, the values
 * generated will always be the same.
 *
 * Predictable randomness can be turned off by calling `seed(null)`, or reset
 * by calling `seed(value)` again with the initial value you used.
 * @param value
 * @since 0.5.0
 */
const seed = (value: any): void => PRNG.seed(value);

export default seed;
