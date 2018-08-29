import { Agent } from '../agents/Agent';

/**
 * Finds the distance between `p1` and `p2`.
 * Expects that p1 and p2 each contain `x`, `y`, and `z`
 * keys that have numeric values.
 * @param {*} p1 
 * @param {*} p2 
 * @return {number} The distance between p1 and p2.
 */
export default function distance(p1, p2) {

    const a = {};
    const b = {};

    if (p1 instanceof Agent) {
        a.x = p1.get('x');
        a.y = p1.get('y');
        a.z = p1.get('z');
    } else {
        a.x = p1.x;
        a.y = p1.y;
        a.z = p1.z;
    }

    if (p2 instanceof Agent) {
        b.x = p2.get('x');
        b.y = p2.get('y');
        b.z = p2.get('z');
    } else {
        b.x = p2.x;
        b.y = p2.y;
        b.z = p2.z;
    }

    if (!a.x) a.x = 0;
    if (!a.y) a.y = 0;
    if (!a.z) a.z = 0;
    if (!b.x) b.x = 0;
    if (!b.y) b.y = 0;
    if (!b.z) b.z = 0;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};