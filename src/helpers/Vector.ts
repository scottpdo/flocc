/// <reference path="../types/Point.d.ts" />
import sum from '../utils/sum';
import copyArray from '../utils/copyArray';

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
    } else {
      console.warn(`Attempted to access index ${n} on a vector greater than the vector's dimension ${this.dimension}. Returning 0 by default.`);
    }
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

    if (i === 'x' || i === 'r') {
      index = 0;
    } else if (i === 'y' || i === 'g') {
      index = 1;
    } else if (i === 'z' || i === 'b') {
      index = 2;
    } else if (i === 'w' || i === 'a') {
      index = 3;
    } else if (typeof i === 'number') {
      index = i;
    }

    while (this.dimension <= index) {
      this.data[this.dimension] = 0;
      this.dimension++;
    }

    this.data[index] = value;

    return this;
  }

  get x(): number { return this.index(0); }
  get y(): number { return this.index(1); }
  get z(): number { return this.index(2); }
  get w(): number { return this.index(3); }

  get r(): number { return this.index(0); }
  get g(): number { return this.index(1); }
  get b(): number { return this.index(2); }
  get a(): number { return this.index(3); }

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
}

export { Vector };
