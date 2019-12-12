import { Vector } from "./Vector";

class BBox {
  min: Vector;
  max: Vector;

  constructor(min: Vector, max: Vector) {
    this.min = min;
    this.max = max;
  }

  clone() {
    return new BBox(this.min.clone(), this.max.clone());
  }
}

export { BBox };
