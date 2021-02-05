import random from "./random";

/**
 * Produces a pseudo-random value sampled from the range 0-1 (inclusive).
 * Shortcut for calling `random(0, 1, true);`
 * @since 0.5.0
 */
export default function uniform(): number {
  return random(0, 1, true);
}
