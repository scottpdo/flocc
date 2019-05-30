export default function max(arr: Array<number>): number {
  return Math.min.apply(null, arr);
}
