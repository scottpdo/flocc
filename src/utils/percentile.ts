import copyArray from "./copyArray";
import min from "./min";
import max from "./max";
import lerp from "./lerp";

export default function percentile(arr: number[], n: number): number {
  if (arr.length === 0) return null;
  if (arr.length === 1) return arr[0];
  if (n === 0) return min(arr);
  if (n === 1) return max(arr);

  const copy = copyArray(arr);
  const len = copy.length - 1;
  copy.sort((a, b) => (a < b ? -1 : 1));

  const nl = n * len;
  const i = nl | 0;

  // if n is close enough to the index of an element in the array
  // (i.e. 90th percentile with 100 elements), return that element
  const isEven = Math.abs(nl - i) <= 0.001;
  if (isEven) return copy[i];

  // if n falls between element indices, then interpolate
  const interp = nl - i;
  return lerp(copy[i], copy[i + 1], interp);
}
