/// <reference path="../types/Point.d.ts" />
import sum from "../utils/sum";
import lerp from "../utils/lerp";
import copyArray from "../utils/internal/copyArray";

class Vector implements Point {
  data: Array<number>;
  dimension: number;

  constructor(...data: Array<number>) {
    this.data = data || [];
    this.dimension = data ? data.length : 0;
  }

  index(n: number): number {
    if (this.dimension > n) {
      return this.data[n];
    }
    // Attempting to access index ${n} on a vector greater than the vector's dimension returns 0 by default
    return 0;
  }

  /**
   * Overwrite the value at a given index or position. If the index is beyond the dimension of this vector,
   * the dimension will be increased to the dimensionality implied by the index.
   * @param i {number | string} - The numerical index (0-based) or lowercase string value ('x') to set.
   * @param value {number} - The value to set at this index/position.
   */
  set(i: number | string, value: number): this {
    let index: number;

    if (i === "x" || i === "r") {
      index = 0;
    } else if (i === "y" || i === "g") {
      index = 1;
    } else if (i === "z" || i === "b") {
      index = 2;
    } else if (i === "w" || i === "a") {
      index = 3;
    } else if (typeof i === "number") {
      index = i;
    }

    while (this.dimension <= index) {
      this.data[this.dimension] = 0;
      this.dimension++;
    }

    this.data[index] = value;

    return this;
  }

  get x(): number {
    return this.index(0);
  }
  get y(): number {
    return this.index(1);
  }
  get z(): number {
    return this.index(2);
  }
  get w(): number {
    return this.index(3);
  }

  get xy(): Array<number> {
    return [this.index(0), this.index(1)];
  }
  get xz(): Array<number> {
    return [this.index(0), this.index(2)];
  }
  get yz(): Array<number> {
    return [this.index(1), this.index(2)];
  }

  get xyz(): Array<number> {
    return [this.index(0), this.index(1), this.index(2)];
  }

  get r(): number {
    return this.index(0);
  }
  get g(): number {
    return this.index(1);
  }
  get b(): number {
    return this.index(2);
  }
  get a(): number {
    return this.index(3);
  }

  get rgb(): Array<number> {
    return [this.index(0), this.index(1), this.index(2)];
  }
  get rgba(): Array<number> {
    return [this.index(0), this.index(1), this.index(2), this.index(3)];
  }

  set x(n) {
    this.set(0, n);
  }
  set y(n) {
    this.set(1, n);
  }
  set z(n) {
    this.set(2, n);
  }
  set w(n) {
    this.set(3, n);
  }

  set r(n) {
    this.set(0, n);
  }
  set g(n) {
    this.set(1, n);
  }
  set b(n) {
    this.set(2, n);
  }
  set a(n) {
    this.set(3, n);
  }

  add(v: Vector): this {
    const dimension = Math.max(this.dimension, v.dimension);
    for (let i = 0; i < dimension; i++) {
      if (i >= this.dimension) {
        this.dimension = i;
        this.set(i, 0);
      }
      this.set(i, this.index(i) + v.index(i));
    }
    return this;
  }

  multiplyScalar(n: number): this {
    this.data = this.data.map(x => x * n);
    return this;
  }

  addScalar(n: number): this {
    this.data = this.data.map(x => x + n);
    return this;
  }

  /**
   * Computes the Euclidean length (straight-line length) from the origin to this vector.
   */
  length(): number {
    return Math.sqrt(sum(this.data.map(x => x ** 2)));
  }

  /**
   * Normalize the vector (turn it into a vector with length = 1).
   * Has no effect on the 0 vector.
   */
  normalize(): this {
    const l = this.length();
    if (l > 0) {
      this.multiplyScalar(1 / l);
    }
    return this;
  }

  clone(): Vector {
    const data = copyArray(this.data);
    return new Vector(...data);
  }

  /**
   * Rotate a vector about the Z axis.
   * @param angle {number} - The angle by which to rotate the vector, in radians
   */
  rotateZ(angle: number): this {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Get the dot product of this vector with another.
   * @param {Vector} v - The other vector.
   */
  dot(v: Vector): number {
    const dimension = Math.max(this.dimension, v.dimension);
    let sum = 0;
    for (let i = 0; i < dimension; i++) sum += this.index(i) * v.index(i);
    return sum;
  }

  /**
   * Linearly interpolate between this vector and another vector.
   * Note that this method returns a new vector and does not mutate the vector on which it is called!
   * @param {Vector} v - The other vector.
   * @param {number} t - The amount by which to interpolate.
   * @returns {Vector} - The new, interpolated vector.
   */
  lerp(v: Vector, t: number): Vector {
    const longerVector = this.dimension > v.dimension ? this : v;
    const shorterVector = this.dimension > v.dimension ? v : this;
    const lerpedData = longerVector.data.map((x, i) =>
      lerp(x, shorterVector.index(i), t)
    );
    return new Vector(...lerpedData);
  }
}

export { Vector };
