import Agent from '../agents/Agent';

/**
 * Finds the Manhattan distance between `p1` and `p2`.
 * Expects that p1 and p2 each contain `x`, `y`, and `z`
 * keys that have numeric values, or are Agents with `x`, `y`, and `z` values.
 * @param {*} p1 
 * @param {*} p2 
 * @return {number} The Manhattan distance between p1 and p2.
 */
export default function manhattanDistance(p1, p2) {

    const a = {};
    const b = {};

    if (p1 instanceof Agent) {
        a.x = p1.get('x');
        a.y = p1.get('y');
        a.z = p1.get('z');
    }

    if (p2 instanceof Agent) {
        b.x = p2.get('x');
        b.y = p2.get('y');
        b.z = p2.get('z');
    }

    if (!a.x) a.x = 0;
    if (!a.y) a.y = 0;
    if (!a.z) a.z = 0;
    if (!b.x) b.x = 0;
    if (!b.y) b.y = 0;
    if (!b.z) b.z = 0;

    const dx = Math.abs(b.x - a.x);
    const dy = Math.abs(b.y - a.y);
    const dz = Math.abs(b.z - a.z);
    
    return dx + dy + dz;
};