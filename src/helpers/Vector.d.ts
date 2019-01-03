declare class Vector {

  constructor(...data: Array<number>);

  data: Array<number>;
  x: number;
  y: number;
  z: number;
  w: number;
  r: number;
  g: number;
  b: number;
  a: number;

  index(i: number): number;
  set(i: number | string, n: number): this;
  add(v: Vector): this;
  multiplyScalar(n: number): this;
  length(): number;
}
