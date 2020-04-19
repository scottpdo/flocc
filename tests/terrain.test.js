const { Environment, Terrain, Colors } = require("../dist/flocc");

let environment;
let terrain;

const width = 50;
const height = 50;

beforeEach(() => {
  environment = new Environment({ width, height });
  terrain = new Terrain(width, height);
  environment.use(terrain);
});

it("Instantiates a terrain", () => {
  expect(terrain.width).toBe(width);
  expect(terrain.height).toBe(height);
});

it("Uses a terrain as an environment helper.", () => {
  expect(environment.helpers.terrain).toBe(terrain);
});

it("Instantiates with black pixels", () => {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      expect(terrain.sample(x, y)).toStrictEqual(Colors.BLACK);
    }
  }
});

it("Can initialize with other pixels", () => {
  terrain.init((x, y) => {
    return x > width / 2 ? Colors.RED : Colors.BLUE;
  });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      expect(terrain.sample(x, y)).toStrictEqual(
        x > width / 2 ? Colors.RED : Colors.BLUE
      );
    }
  }
});

it("Can have a single update rule", () => {
  const update = (x, y) => {};
  terrain.addRule(update);
  expect(terrain.rule).toBe(update);
});

it("Update rules that don't return anything don't affect the pixel value", () => {
  const update = (x, y) => {};
  terrain.addRule(update);
  // set all to red
  terrain.init((x, y) => Colors.RED);
  environment.tick();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // should still be red
      expect(terrain.sample(x, y)).toStrictEqual(Colors.RED);
    }
  }
});

it("Returning a pixel from the update rule sets that pixel value", () => {
  const update = (x, y) => Colors.YELLOW;
  terrain.addRule(update);
  environment.tick();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // should still be red
      expect(terrain.sample(x, y)).toStrictEqual(Colors.YELLOW);
    }
  }
});

it("Returning a number from the update rule sets that value on r/g/b", () => {
  const update = (x, y) => 127;
  terrain.addRule(update);
  environment.tick();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // should still be red
      expect(terrain.sample(x, y)).toStrictEqual({
        r: 127,
        g: 127,
        b: 127,
        a: 255
      });
    }
  }
});

const DEAD = 0;
const ALIVE = 255;

const isAlive = p => p === ALIVE;

const lifeRule = (x, y) => {
  const self = terrain.sample(x, y);
  const isSelfAlive = isAlive(self);
  const livingNeighbors = terrain.neighbors(x, y, 1, true).filter(isAlive)
    .length;

  if (isSelfAlive && livingNeighbors < 2) return DEAD;
  if (isSelfAlive && livingNeighbors > 3) return DEAD;
  if (!isSelfAlive && livingNeighbors === 3) return ALIVE;
};

it("Can even implement the Game of Life", () => {
  terrain = new Terrain(width, height, { grayscale: true });
  environment.use(terrain);

  terrain.init((x, y) => (Math.abs(Math.sin(x * y)) < 0.1 ? ALIVE : DEAD));

  terrain.addRule(lifeRule);

  environment.tick(10);

  expect(terrain.data).toMatchSnapshot();
});

it("Works when scaling up.", () => {
  terrain = new Terrain(width, height, { scal3: 2 });
  environment.use(terrain);

  terrain.init((x, y) => (Math.abs(Math.sin(x * y)) < 0.1 ? ALIVE : DEAD));

  terrain.addRule(lifeRule);

  environment.tick(10);

  expect(terrain.data).toMatchSnapshot();
});
