import copyArray from "./copyArray";
import min from "./min";
import max from "./max";
import median from "./median";
import lerp from "./lerp";

export default function percentile(arr: number[], n: number): number {
  if (arr.length === 0) return null;
  if (arr.length === 1) return arr[0];
  if (n === 0) return min(arr);
  if (n === 0.5) return median(arr);
  if (n === 1) return max(arr);

  const copy = copyArray(arr);
  const orig = n;

  if (n <= 0.5) {
    copy.sort((a, b) => (a < b ? -1 : 1));
  } else {
    copy.sort((a, b) => (a < b ? 1 : -1));
    n = 1 - n;
  }

  for (let i = 0; i < copy.length; i++) {
    const p = i / (copy.length - 1);
    // if at percentile n/p, return this element
    if (n === p) return copy[i];
    // if p has overshot n, linearly interpolate between elements
    if (n < p) {
      const interp = n * (copy.length - 1) - (i - 1);
      console.log("interpolating", copy[i - 1], copy[i], interp);
      return lerp(copy[i - 1], copy[i], interp);
    }
  }
}
