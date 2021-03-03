const { utils } = require("../dist/flocc");
const { seed, uniform } = utils;

it("Initially instantiates with no seed.", () => {
  const a = [];
  const b = [];
  while (a.length < 10) {
    a.push(uniform());
  }
  while (b.length < 10) {
    b.push(uniform());
  }
  a.forEach((ai, i) => {
    expect(ai).not.toBe(b[i]);
  });
});

it("After seeding, produces repeatable pseudo-random values", () => {
  seed(1);
  const a = [];
  const aExpected = [
    0.3566528179889171,
    0.888477936864751,
    0.3316682528366106,
    0.15588588459042862,
    0.5672305619456324,
    0.10542564902948615,
    0.8324220377655731,
    0.06861663580412347,
    0.6626740097861556,
    0.010195111586840722
  ];
  while (a.length < 10) {
    a.push(uniform());
  }
  a.forEach((ai, i) => {
    expect(ai).toBeCloseTo(aExpected[i]);
  });
});

it("Can re-seed to produce the same pseudo-random values", () => {
  seed(1);
  const a = [];
  const b = [];
  while (a.length < 10) {
    a.push(uniform());
  }
  seed(1);
  while (b.length < 10) {
    b.push(uniform());
  }
  a.forEach((ai, i) => {
    expect(ai).toBe(b[i]);
  });
});

it("Can unseed to produce new pseudo-random values", () => {
  seed(1);
  const firstValue = 0.3566528179889171;
  let secondValue;
  expect(uniform()).toBeCloseTo(firstValue);
  seed(null);
  secondValue = uniform();
  seed(1);
  expect(uniform()).toBeCloseTo(firstValue);
  seed(null);
  expect(uniform()).not.toBe(secondValue);
});
