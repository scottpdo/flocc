/// <reference path="./Point.d.ts" />

export default function instanceOfPoint(obj: any): obj is Point {
  return (
    obj.hasOwnProperty("x") &&
    typeof obj.x === "number" &&
    obj.hasOwnProperty("y") &&
    typeof obj.y === "number"
  );
}
