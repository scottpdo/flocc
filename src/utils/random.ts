export default function random(
  min: number = 0,
  max: number = 1,
  float: boolean = false
): number {
  let r = Math.random() * (max - min);
  if (!float) r = Math.round(r);
  return min + r;
}
