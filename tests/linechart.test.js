const {
  Agent,
  Environment,
  LineChartRenderer,
  utils
} = require("../dist/flocc");

const color = "#ff0000";
const width = 200;
const height = 400;

const environment = new Environment();
const renderer = new LineChartRenderer(environment, {
  width,
  height
});

it("Correctly instantiates a LineChartRenderer", () => {
  expect(renderer.canvas).toBeInstanceOf(HTMLCanvasElement);
  expect(renderer.background).toBeInstanceOf(HTMLCanvasElement);

  expect(renderer.environment).toBe(environment);
  expect(environment.renderers).toContain(renderer);

  expect(renderer.width).toEqual(width);
  expect(renderer.height).toEqual(height);
});

it("Can add metrics to a LineChartRenderer", () => {
  renderer.metric("x");
  expect(renderer.metrics).toHaveLength(1);
  renderer.metric("x", { color: "#f00" });
  expect(renderer.metrics).toHaveLength(2);
  renderer.metric("y", { fn: utils.sum });
  expect(renderer.metrics).toHaveLength(3);
});
