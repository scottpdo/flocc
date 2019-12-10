export default function last<T>(arr: T[]): T {
  if (arr.length === 0) return null;
  return arr[arr.length - 1];
}
