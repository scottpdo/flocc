/// <reference path="../types/Point.d.ts" />
import sum from "../utils/sum";
import lerp from "../utils/lerp";
import copyArray from "../utils/internal/copyArray";

/**
 * @since 0.1.0
 */
class Vector implements Point {
  data: Array<number>;
  /**
   * The dimension of this `Vector`, or the last index that has a value (plus one).
   *
   * ```js
   * const a = new Vector(1, 1, 1);
   * a.dimension; // 3
   *
   * const b = new Vector(1, 2, 3, 4, 5);
   * b.dimension; // 5
   * ```
   *
   * Dimensions can be dynamically updated after a `Vector` is created:
   *
   * ```js
   * const v = new Vector(0);
   * v.dimension; // 1
   *
   * v.set(3, 10);
   * v.dimension; // 4 (indices start at 0)
   * ```
   *
   *  */
  dimension: number;

  constructor(...data: Array<number>) {
    this.data = data || [];
    this.dimension = data ? data.length : 0;
  }

  /**
   * @since 0.1.0
   */
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
   * @since 0.1.0
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

  /** @since 0.1.0 */
  get x(): number {
    return this.index(0);
  }
  /** @since 0.1.0 */
  get y(): number {
    return this.index(1);
  }
  /** @since 0.1.0 */
  get z(): number {
    return this.index(2);
  }
  /** @since 0.1.0 */
  get w(): number {
    return this.index(3);
  }

  /** @since 0.2.4 */
  get xy(): [number, number] {
    return [this.index(0), this.index(1)];
  }
  /** @since 0.2.4 */
  get xz(): [number, number] {
    return [this.index(0), this.index(2)];
  }
  /** @since 0.2.4 */
  get yz(): [number, number] {
    return [this.index(1), this.index(2)];
  }

  /** @since 0.2.4 */
  get xyz(): [number, number, number] {
    return [this.index(0), this.index(1), this.index(2)];
  }

  /**
   * `r` for 'red' (the 1st value)
   * @since 0.1.0
   */
  get r(): number {
    return this.index(0);
  }
  /**
   * `g` for 'green' (the 2nd value)
   * @since 0.1.0
   */
  get g(): number {
    return this.index(1);
  }
  /**
   * `b` for 'blue' (the 3rd value)
   * @since 0.1.0
   */
  get b(): number {
    return this.index(2);
  }
  /**
   * `a` for 'alpha' (the 4th value)
   * @since 0.1.0
   */
  get a(): number {
    return this.index(3);
  }

  /** @since 0.2.4 */
  get rgb(): [number, number, number] {
    return [this.index(0), this.index(1), this.index(2)];
  }
  /** @since 0.2.4 */
  get rgba(): [number, number, number, number] {
    return [this.index(0), this.index(1), this.index(2), this.index(3)];
  }

  /** @since 0.1.0 */
  set x(n) {
    this.set(0, n);
  }
  /** @since 0.1.0 */
  set y(n) {
    this.set(1, n);
  }
  /** @since 0.1.0 */
  set z(n) {
    this.set(2, n);
  }
  /** @since 0.1.0 */
  set w(n) {
    this.set(3, n);
  }

  /**
   * `r` for 'red' (the 1st value)
   * @since 0.1.0
   */
  set r(n) {
    this.set(0, n);
  }
  /**
   * `g` for 'green' (the 2nd value)
   * @since 0.1.0
   */
  set g(n) {
    this.set(1, n);
  }
  /**
   * `b` for 'blue' (the 3rd value)
   * @since 0.1.0
   */
  set b(n) {
    this.set(2, n);
  }
  /**
   * `a` for 'alpha' (the 4th value)
   * @since 0.1.0
   */
  set a(n) {
    this.set(3, n);
  }

  /**
   * @since 0.1.0
   */
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

  /**
   * @since 0.1.0
   */
  multiplyScalar(n: number): this {
    this.data = this.data.map(x => x * n);
    return this;
  }

  /**
   * @since 0.1.0
   */
  addScalar(n: number): this {
    this.data = this.data.map(x => x + n);
    return this;
  }

  /**
   * Computes the Euclidean length (straight-line length) from the origin to this vector.
   * @since 0.1.0
   */
  length(): number {
    return Math.sqrt(sum(this.data.map(x => x ** 2)));
  }

  /**
   * Normalize the vector (turn it into a vector with length = 1).
   * Has no effect on the 0 vector.
   * @since 0.1.0
   */
  normalize(): this {
    const l = this.length();
    if (l > 0) {
      this.multiplyScalar(1 / l);
    }
    return this;
  }

  /**
   * @since 0.1.0
   */
  clone(): Vector {
    const data = copyArray(this.data);
    return new Vector(...data);
  }

  /**
   * Rotate a vector about the Z axis.
   * @param angle {number} - The angle by which to rotate the vector, in radians
   * @since 0.2.2
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
   * Get the {@link https://en.wikipedia.org/wiki/Dot_product | dot product} of this `Vector` with another.
   * @since 0.2.4
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
   * @since 0.2.4
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
