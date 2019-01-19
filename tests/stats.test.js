/**
 * Test stats functions (sum, mean, standard deviation).
 */

const { utils } = require('../dist/flocc');
const { sum, mean, stdDev } = utils;

it('Correctly sums an array.', () => {
  expect(sum([1])).toBe(1);
  expect(sum([1, 2, 3])).toBe(6);
});

it('Correctly finds the mean value of an array.', () => {
  expect(mean([1])).toBe(1);
  expect(mean([1, 2, 3])).toBe(2);
});

it('Correctly finds the standard deviation of an array.', () => {
  expect(stdDev([3, 3, 3, 3, 3])).toBeCloseTo(0);
  expect(stdDev([6, 2, 3, 1])).toBeCloseTo(1.87)
});
