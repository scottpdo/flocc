/**
 * Finds the {@link https://en.wikipedia.org/wiki/Greatest_common_divisor | greatest common divisor} of `a` and `b`.
 *
 * ```js
 * gcd(7, 13); // returns 1
 * gcd(9, 15); // returns 3
 * gcd(12, 24); // returns 12
 * ```
 *
 * @since 0.4.5
 */
export default function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  if (b > a) {
    const temp = a;
    a = b;
    b = temp;
  }
  while (true) {
    if (b === 0) return a;
    a %= b;
    if (a === 0) return b;
    b %= a;
  }
}
