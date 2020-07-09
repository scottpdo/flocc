import random from "./random";

/**
 * Produces a pseudo-random value sampled from the range 0-1 (inclusive).
 * Shortcut for calling `random(0, 1, true);`
 */
export default function uniform(): number {
  return random(0, 1, true);
}
