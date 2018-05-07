/**
 * Finds the distance between `p1` and `p2`.
 * Expects that p1 and p2 each contain `x`, `y`, and `z`
 * keys that have numeric values.
 * @param {*} p1 
 * @param {*} p2 
 * @return {number} The distance between p1 and p2.
 */
export default function distance(p1, p2) {

    if (!p1.x) p1.x = 0;
    if (!p1.y) p1.y = 0;
    if (!p1.z) p1.z = 0;
    if (!p2.x) p2.x = 0;
    if (!p2.y) p2.y = 0;
    if (!p2.z) p2.z = 0;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};