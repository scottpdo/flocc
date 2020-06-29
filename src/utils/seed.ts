let seed: number | null = null;

const setSeed = (n: number): void => {
  seed = n;
};

const getSeed = (): number | null => seed;

export default setSeed;
export { getSeed };
