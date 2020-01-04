const { Agent, Environment, Histogram, utils } = require("../dist/flocc");

const width = 200;
const height = 400;

const container = document.createElement("div");
const environment = new Environment();
let histogram;

beforeEach(() => {
  histogram = new Histogram(environment, {
    buckets: 4,
    width,
    height
  });
  histogram.metric("x");
  histogram.mount(container);
});

it("Correctly instantiates a histogram", () => {
  expect(histogram.canvas).toBeInstanceOf(HTMLCanvasElement);
  expect(histogram.background).toBeInstanceOf(HTMLCanvasElement);

  expect(histogram.environment).toBe(environment);
  expect(environment.renderers).toContain(histogram);

  expect(histogram.width).toEqual(width);
  expect(histogram.height).toEqual(height);
});

it("Correctly renders", () => {
  environment.tick();
  const calls = histogram.canvas.getContext("2d").__getDrawCalls();
  expect(calls).toMatchSnapshot();
});
