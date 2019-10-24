/// <reference path="../types/NRange.d.ts" />

export default function extractRoundNumbers(range: NRange): Array<number> {
  const { min, max } = range;
  let increment = 10 ** Math.round(Math.log10(max - min) - 1); // start from closest power of 10 difference, over 10
  let ticker = 0; // 0 = 1, 1 = 2, 2 = 5, etc.
  while ((max - min) / increment > 8) {
    increment *= ticker % 3 === 1 ? 2.5 : 2;
    ticker++;
  }

  const start = min - ((min + increment) % increment);
  const end = max - (max % increment);

  const arr = [];
  for (let n = start; n <= end; n += increment) arr.push(n);
  return arr;
}
