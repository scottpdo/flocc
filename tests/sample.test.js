const { utils } = require("../dist/flocc");
const { sample } = utils;

it("Samples an array without weights.", () => {
  const arr = [20, 30, 40];
  for (let i = 0; i < 10; i++) {
    expect(arr).toContain(sample(arr));
  }

  const arr2 = [{ a: 1 }, { b: 2 }, { c: 3 }];
  for (let i = 0; i < 10; i++) {
    expect(arr2).toContain(sample(arr2));
  }
});

it("Samples an array with weights.", () => {
  const arr = [20, 30, 40];
  // weights already normalized
  const weights = [0.1, 0.1, 0.8];
  const output = [];

  while (output.length < 1000) output.push(sample(arr, weights));

  // given 10% chance of 20, 10% chance of 30, and 80% chance of 40,
  // the below values should be safe, although there is a minute chance
  // that this will fail
  expect(output.filter(el => el === 20).length).toBeLessThan(150);
  expect(output.filter(el => el === 30).length).toBeLessThan(150);
  expect(output.filter(el => el === 40).length).toBeGreaterThan(750);

  // test with complex types and weights not yet normalized
  const [a, b, c] = [{ a: 1 }, { b: 2 }, { c: 3 }];
  const arr2 = [a, b, c];
  const weights2 = [2, 2, 16];
  const output2 = [];

  while (output2.length < 1000) output2.push(sample(arr2, weights2));

  // same as above
  expect(output2.filter(el => el === a).length).toBeLessThan(150);
  expect(output2.filter(el => el === b).length).toBeLessThan(150);
  expect(output2.filter(el => el === c).length).toBeGreaterThan(750);
});
