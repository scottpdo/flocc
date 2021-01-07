export default function torusNormalize(value: number, max: number) {
  if (!max || max === 0) return value;
  while (value >= max) value -= max;
  while (value < 0) value += max;
  return value;
}
