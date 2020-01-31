import percentile from "./percentile";

/**
 * Find the median value of an array of numbers. If there are an even number
 * of elements in the array, takes the mean of the two values closest to the median.
 * @param {number[]} arr
 */
export default function median(arr: number[]): number {
  return percentile(arr, 0.5);
}
