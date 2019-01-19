const { Vector } = require('../dist/flocc');

const v = new Vector();
const v2 = new Vector();

it('Instantiates an empty vector', () => {

  expect(v.dimension).toEqual(0);

  // Non-existent indices should return 0 by default
  expect(v.index(0)).toEqual(0);
  expect(v.x).toEqual(0);
  expect(v.index(5)).toEqual(0);

  // Ensure that accessing non-existent indices doesn't change the vector's dimension
  expect(v.dimension).toEqual(0);
});

it('Correctly instantiates a vector with data', () => {
  const a = new Vector(1);
  const b = new Vector(1, 2, 3, 4, 5);
  expect(a.dimension).toEqual(1);
  expect(b.dimension).toEqual(5);
  expect(a.index(0)).toEqual(1);
  expect(a.x).toEqual(1);
  expect(b.index(2)).toEqual(3);
  expect(b.b).toEqual(3);
})

it('Correctly sets and get indices of a vector', () => {

  v.set(2, 5);
  expect(v.index(2)).toEqual(5);
  expect(v.z).toEqual(5);
  expect(v.b).toEqual(5);
  expect(v.dimension).toEqual(3);

  v.set('x', 1);
  expect(v.r).toEqual(1);
  v.set(0, 2);
  expect(v.r).toEqual(2);

  v.x = 5;
  expect(v.x).toEqual(5);
  v.x -= 2;
  expect(v.x).toEqual(3);
});

it('Correctly finds the length of vectors', () => {

  v2.set(0, 100);
  expect(v2.length()).toEqual(100);

  v2.set(0, 3);
  v2.set(15, -4); // high dimension just cuz, negative just cuz
  expect(v2.length()).toEqual(5); // 3-4-5 right triangle
});

it('Correctly normalizes vectors', () => {

  const zero = new Vector();
  zero.normalize();
  expect(zero.length()).toEqual(0);

  // Because of floating point numbers, we can't expect that the new
  // length is going to be EXACTLY 1 (ex. might be 0.9999999999)
  v.normalize();
  expect(v.length()).toBeCloseTo(1);

  v2.normalize();
  expect(v2.length()).toBeCloseTo(1);
});
