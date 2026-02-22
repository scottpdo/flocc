import { utils } from '../main';

const { series } = utils;

it("Creates non-repeating series.", () => {
  const a = 100;
  const b = 202;
  const c = 999;

  [a, b, c].forEach(n => {
    const arr: number[] = [];
    const generator = series(n);
    for (let i = 0; i < n; i++) {
      const { value } = generator.next();
      expect(arr).not.toContain(value);
      arr.push(value);
    }
  });
});
