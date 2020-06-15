import random from "./random";
import gcd from "./gcd";

function primeFactorization(n: number): number[] {
  const factors: number[] = [];
  for (let i = 2; i <= Math.sqrt(n); i++) {
    while (n % i === 0) {
      factors.push(i);
      n /= i;
    }
  }
  return factors.concat(n);
}

export default function* series(m: number): IterableIterator<number> {
  // 1. m and c are relatively prime
  let c: number;
  do {
    c = random(0, m - 1);
  } while (gcd(m, c) > 1);
  // 2. `a - 1` is divisible by all prime factors of m
  const factors = primeFactorization(m);
  let a =
    factors.reduce((acc, cur) => {
      // 3. `a - 1` is divisible by 4 if m is divisible by 4
      if (acc === 2 && cur === 2) return 4;
      return acc % cur === 0 ? acc : acc * cur;
    }, 1) + 1;
  let seed = random(0, m - 1);

  while (true) {
    yield seed;
    seed = (a * seed + c) % m;
  }
}
