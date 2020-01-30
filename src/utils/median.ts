import percentile from "./percentile";

export default function median(arr: Array<number>): number {
  return percentile(arr, 0.5);
}
