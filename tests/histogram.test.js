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
  histogram.canvas.getContext("2d").__clearEvents();
  histogram.canvas.getContext("2d").__clearDrawCalls();
});

afterEach(() => {
  while (environment.getAgents().length > 0) {
    environment.getAgents().pop();
  }
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

it("Correctly renders with agents", () => {
  for (let i = 0; i < 100; i++) {
    const agent = new Agent();
    agent.set("x", Math.sqrt(i));
    environment.addAgent(agent);
  }
  environment.tick();
  const calls = histogram.canvas.getContext("2d").__getDrawCalls();
  expect(calls).toMatchSnapshot();
});

it("Correctly renders with discrete buckets", () => {
  histogram.opts.background = "yellow";
  histogram.opts.buckets = [1, 2, 3];
  for (let i = 0; i < 10; i++) {
    const agent = new Agent();
    agent.set("x", i % 4);
    environment.addAgent(agent);
  }
  environment.tick();
  const calls = histogram.canvas.getContext("2d").__getDrawCalls();
  expect(calls).toMatchSnapshot();
});
