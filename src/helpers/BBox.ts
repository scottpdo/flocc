/// <reference path="../types/Point.d.ts" />
import { Agent } from "../agents/Agent";
import { Vector } from "./Vector";

/**
 * @since 0.3.5
 */
class BBox {
  min: Vector;
  max: Vector;

  constructor(min: Vector, max: Vector) {
    this.min = min;
    this.max = max;
  }

  /**
   * @since 0.3.5
   */
  clone() {
    return new BBox(this.min.clone(), this.max.clone());
  }

  contains(p: Point | Agent): boolean {
    const { min, max } = this;
    const dimension = Math.min(min.dimension, max.dimension);
    const x: number = (p instanceof Agent ? p.get("x") : p.x) || 0;
    const y: number = (p instanceof Agent ? p.get("y") : p.y) || 0;
    const z: number = (p instanceof Agent ? p.get("z") : p.z) || 0;

    if (dimension === 1) {
      return x >= this.min.x && x <= this.max.x;
    } else if (dimension === 2) {
      return (
        x >= this.min.x && x <= this.max.x && y >= this.min.y && y <= this.max.y
      );
    } else if (dimension === 3) {
      return (
        x >= this.min.x &&
        x <= this.max.x &&
        y >= this.min.y &&
        y <= this.max.y &&
        z >= this.min.z &&
        z <= this.max.z
      );
    }

    return false;
  }
}

export { BBox };
