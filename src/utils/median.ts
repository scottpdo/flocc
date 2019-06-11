import copyArray from "./copyArray";

export default function median(arr: Array<number>): number {
  const copy = copyArray(arr);
  copy.sort();
  const len = copy.length;
  if (len % 2 === 0) {
    return (copy[len / 2 - 1] + copy[len / 2]) / 2;
  }
  return copy[(len - 1) / 2];
}
