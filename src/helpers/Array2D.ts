import { NumArray } from "./NumArray";

class Array2D {
  data: NumArray;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.data = new NumArray();
    this.width = width;
    this.height = height;
  }

  set(x: number, y: number, n: number): void {
    const index = x + this.width * y;
    this.data.set(index, n);
  }

  get(x: number, y: number): number {
    const index = x + this.width * y;
    return this.data.get(index);
  }
}

export { Array2D };
