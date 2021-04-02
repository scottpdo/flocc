const { utils } = require("../dist/flocc");
const { gcd } = utils;

it("Finds the greatest common divisor of two numbers.", () => {
  expect(gcd(24, 54)).toBe(6);
  expect(gcd(30, 36)).toBe(6);
  expect(gcd(42, 56)).toBe(14);
  expect(gcd(1701, 3678)).toBe(3);
});
