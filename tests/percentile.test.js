const { utils } = require("../dist/flocc");
const { percentile } = utils;

it("Returns null when trying to get percentile of empty array", () => {
  expect(percentile([], 0.5)).toBeNull();
});

it("Always returns the only element for single-element array", () => {
  const arr = [5];
  expect(percentile(arr, 0)).toBe(5);
  expect(percentile(arr, 0.25)).toBe(5);
  expect(percentile(arr, 0.5)).toBe(5);
  expect(percentile(arr, 0.75)).toBe(5);
  expect(percentile(arr, 0.99)).toBe(5);
});

it("Calculates percentiles of two-element arrays", () => {
  const arr = [0, 2];
  expect(percentile(arr, 0)).toBe(0);
  expect(percentile(arr, 0.333)).toBe(0.666);
  expect(percentile(arr, 0.5)).toBe(1);
  expect(percentile(arr, 0.75)).toBe(1.5);
  expect(percentile(arr, 0.99)).toBe(1.98);
  expect(percentile(arr, 1)).toBe(2);
});

it("Calculates percentiles of five-element arrays", () => {
  const arr = [2, 4, 6, 8, 10];
  expect(percentile(arr, 0)).toBe(2);
  expect(percentile(arr, 0.25)).toBe(4);
  expect(percentile(arr, 0.5)).toBe(6);
  expect(percentile(arr, 0.75)).toBe(8);
  expect(percentile(arr, 1)).toBe(10);
  expect(percentile(arr, 0.125)).toBe(3);
  expect(percentile(arr, 0.333)).toBeCloseTo(4.666);
});
