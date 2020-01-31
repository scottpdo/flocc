/// <reference path="../types/Point.d.ts" />
/// <reference path="../agents/Agent.d.ts" />
import instanceOfPoint from "../types/instanceOfPoint";

/**
 * Finds the distance between `p1` and `p2`. The inputs may be plain objects
 * with `x`, `y`, and/or `z` keys, or Agent-like objects who have
 * `x`, `y`, and/or `z` data.
 * @param {Point|Agent} p1
 * @param {Point|Agent} p2
 * @return {number} The distance between p1 and p2.
 */
export default function distance(p1: Point | Agent, p2: Point | Agent): number {
  let x1: number = (instanceOfPoint(p1) ? p1.x : p1.get("x")) || 0;
  let y1: number = (instanceOfPoint(p1) ? p1.y : p1.get("y")) || 0;
  let z1: number = (instanceOfPoint(p1) ? p1.z : p1.get("z")) || 0;

  let x2: number = (instanceOfPoint(p2) ? p2.x : p2.get("x")) || 0;
  let y2: number = (instanceOfPoint(p2) ? p2.y : p2.get("y")) || 0;
  let z2: number = (instanceOfPoint(p2) ? p2.z : p2.get("z")) || 0;

  let dx: number = Math.abs(x2 - x1);
  let dy: number = Math.abs(y2 - y1);
  let dz: number = Math.abs(z2 - z1);

  // distance for toroidal environments
  if (
    !instanceOfPoint(p1) &&
    !instanceOfPoint(p2) &&
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

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
