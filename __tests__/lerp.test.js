/**
 * Test linear interpolation function.
 */

const { utils } = require("../dist/flocc");
const { lerp } = utils;

it("Correctly linearly interpolates between two values.", () => {
  expect(lerp(0, 10, 0)).toBe(0);
  expect(lerp(0, 10, 0.1)).toBe(1);
  expect(lerp(0, 10, 1)).toBe(10);
  expect(lerp(-5.123, 5.123, 0.5)).toBe(0);
});
