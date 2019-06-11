const { Agent, Environment, LineChartRenderer } = require("../dist/flocc");

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
  expect(renderer.width).toEqual(width);
  expect(renderer.height).toEqual(height);
});
