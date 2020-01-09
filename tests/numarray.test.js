const { NumArray } = require("../dist/flocc");

it("Correctly instantiates a NumArray", () => {
  const arr = new NumArray();
  expect(arr).toHaveLength(0);
});

it("Correctly pushes to a NumArray", () => {
  const arr = new NumArray();
  const n = 2;
  arr.push(n);
  expect(arr).toHaveLength(1);
  arr.push(n);
  arr.push(n);
  expect(arr).toHaveLength(3);
});

it("Returns null values for out-of-bounds", () => {
  const arr = new NumArray();
  for (let i = 0; i < 10; i++) {
    arr.push(i);
  }
  expect(arr.get(-1)).toBeNull();
  expect(arr.get(0)).toBe(0);
  expect(arr.get(10)).toBeNull();
  expect(arr.get(100)).toBeNull();
});

it("Throws error when setting negative index value", () => {
  const arr = new NumArray();
  expect(() => arr.set(-1, 100)).toThrow();
});

it("Sets out-of-bound values.", () => {
  const arr = new NumArray();
  arr.set(10, 100);
  expect(arr.get(0)).toBe(0);
  expect(arr.get(5)).toBe(0);
  expect(arr.get(10)).toBe(100);
  expect(arr.get(11)).toBeNull();
});
