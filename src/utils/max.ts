export default function max(arr: Array<number>): number {
  if (arr.length === 0) return null;
  return Math.max.apply(null, arr);
}
