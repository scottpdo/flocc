/// <reference path="../types/Point.d.ts" />

import { Agent } from "../agents/Agent";

/**
 * Finds the {@link https://en.wikipedia.org/wiki/Taxicab_geometry | Manhattan distance} between `p1` and `p2`.
 *
 * The inputs may be plain objects with `x`, `y`, and/or `z` keys, {@linkcode Vector}s,
 * or {@linkcode Agent}s with `x`, `y`, and/or `z` data.
 *
 * ```js
 * const a1 = new Agent();
 * const a2 = new Agent({ x: 3, y: 4 });
 * manhattanDistance(a1, a2); // returns 7 (defaults to x = 0 and y = 0 for a1)
 *
 * const p1 = { x: 3, y: 2 };
 * const p2 = { x: 0, y: 4 };
 * manhattanDistance(p1, p2); // returns 5
 * ```
 *
 * @since 0.0.12
 */
export default function manhattanDistance(
  p1: Point | Agent,
  p2: Point | Agent
): number {
  let x1: number = (p1 instanceof Agent ? p1.get("x") : p1.x) || 0;
  let y1: number = (p1 instanceof Agent ? p1.get("y") : p1.y) || 0;
  let z1: number = (p1 instanceof Agent ? p1.get("z") : p1.z) || 0;

  let x2: number = (p2 instanceof Agent ? p2.get("x") : p2.x) || 0;
  let y2: number = (p2 instanceof Agent ? p2.get("y") : p2.y) || 0;
  let z2: number = (p2 instanceof Agent ? p2.get("z") : p2.z) || 0;

  let dx: number = Math.abs(x2 - x1);
  let dy: number = Math.abs(y2 - y1);
  let dz: number = Math.abs(z2 - z1);

  // distance for toroidal environments
  if (
    p1 instanceof Agent &&
    p2 instanceof Agent &&
    p1.environment &&
    p2.environment &&
    p1.environment === p2.environment &&
    p1.environment.width &&
    p1.environment.height &&
    p1.environment.opts.torus
  ) {
    const { environment } = p1;
    const { width, height } = environment;
    if (dx > width / 2) dx = width - dx;
    if (dy > height / 2) dy = height - dy;
  }

  return dx + dy + dz;
}
