declare class Vector {
    data: Array<number>;
    dimension: number;
    constructor(...data: Array<number>);
    index(n: number): number;
    /**
     * Overwrite the value at a given index or position. If the index is beyond the dimension of this vector,
     * the dimension will be increased to the dimensionality implied by the index.
     * @param i {number | string} - The numerical index (0-based) or lowercase string value ('x') to set.
     * @param value {number} - The value to set at this index/position.
     */
    set(i: number | string, value: number): this;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
    add(v: Vector): this;
    multiplyScalar(n: number): this;
    addScalar(n: number): this;
    /**
     * Computes the Euclidean length (straight-line length) from the origin to this vector.
     */
    length(): number;
    /**
     * Normalize the vector (turn it into a vector with length = 1).
     * Has no effect on the 0 vector.
     */
    normalize(): this;
    clone(): Vector;
}
export { Vector };
