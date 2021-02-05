/**
 * @since 0.2.0
 */
export default function min(arr: Array<number>): number {
  if (arr.length === 0) return null;
  return Math.min.apply(null, arr);
}
