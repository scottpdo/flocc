/// <reference path="../src/types/Point.d.ts" />
import { Agent } from '../agents/Agent';
/**
 * Finds the Manhattan distance between `p1` and `p2`.
 * The inputs may be plain objects
 * with `x`, `y`, and/or `z` keys, or Agent-like objects who have
 * `x`, `y`, and/or `z` data.
 * @param {Point|Agent} p1
 * @param {Point|Agent} p2
 * @return {number} The Manhattan distance between p1 and p2.
 */
export default function manhattanDistance(p1: Point | Agent, p2: Point | Agent): number;
