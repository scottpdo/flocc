/// <reference path="../types/Point.d.ts" />
import sum from "../utils/sum";
import lerp from "../utils/lerp";
import copyArray from "../utils/internal/copyArray";

/**
 * A `Vector` contains multi-dimensional numeric data.
 *
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
   * Retrieve a value from a `Vector` by its index. If the given index is greater than the
   * `Vector`'s dimension, this returns `0` by default.
   *
   * ```js
   * const v = new Vector(1, 2, 4);
   *
   * v.index(0); // returns 1
   * v.index(2); // returns 4
   * v.index(5); // returns 0
   * ```
   * @since 0.1.0
   */
  index(i: number): number {
    if (this.dimension > i) {
      return this.data[i];
    }
    // Attempting to access index ${n} on a vector greater than the vector's dimension returns 0 by default
    return 0;
  }

  /**
   * Set the value at a given index. If the index is greater than the {@linkcode dimension}
   * of this `Vector`, the dimension will be increased to the dimensionality implied by the index.
   * @param i The numerical index (0-based) or lowercase string value (e.g. `"x"`) to set.
   * @param value The value to set at this index/position.
   *
   * ```js
   * const vector = new Vector();
   * vector.set(0, 10);
   * vector.set('y', 2);
   * vector.set(2, 4);
   *
   * vector.xyz; // [10, 2, 4]
   * ```
   *
   * @since 0.1.0
   */
  set(
    i: number | "x" | "y" | "z" | "w" | "r" | "g" | "b" | "a",
    value: number
  ): this {
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
   * Add another `Vector` to this `Vector`. This *does* mutate the `Vector` that calls this method.
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
   * Multiply this `Vector` by a scalar number. This *does* mutate the `Vector` that calls this method.
   *
   * ```js
   * const v = new Vector(1, 2);
   * v.multiplyScalar(5);
   * v.xy; // returns [5, 10]
   *
   * v.multiplyScalar(-0.5);
   * v.xy; // returns [-2.5, -5]
   * ```
   *
   * @since 0.1.0
   */
  multiplyScalar(n: number): this {
    this.data = this.data.map(x => x * n);
    return this;
  }

  /**
   * Add a scalar number to all of this `Vector`'s values'. This *does* mutate the `Vector` that calls this method.
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
   * Normalize the `Vector` (turn it into a `Vector` with length = `1`). Has no effect on the 0 `Vector`. This *does* mutate the `Vector` that calls this method.
   *
   * ```js
   * const v = new Vector(5, 3, -1);
   * v.normalize();
   * v.length(); // returns 1
   * ```
   *
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
   * Create a copy of this `Vector`.
   * @since 0.1.0
   */
  clone(): Vector {
    const data = copyArray(this.data);
    return new Vector(...data);
  }

  /**
   * Rotate the `Vector` about the z-axis by `angle` radians (updating its `x` and `y` values). This *does* mutate the `Vector` that calls this method.
   *
   * ```js
   * const v = new Vector(1, 0);
   * v.rotateZ(Math.PI / 2); // rotate by PI / 2 radians = 90 degrees
   *
   * v.xy; // returns [0, 1]
   * ```
   *
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
   * Linearly interpolate between this `Vector` and another `Vector`. This *does not* mutate the original `Vector` that calls this method, but returns a new `Vector`.
   *
   * ```js
   * const a = new Vector(1, 3, -5);
   * const b = new Vector(4, -2);
   *
   * a.lerp(b, 0); // returns a clone of Vector a
   * a.lerp(b, 1); // returns a clone of Vector b
   *
   * const mid = a.lerp(b, 0.5); // returns a Vector halfway between a and b
   * mid.xyz; // returns [2.5, 0.5, -2.5]
   * ```
   *
   * @param v - The other vector.
   * @param t - The amount by which to interpolate (usually between `0` and `1`, although it can be any number).
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
