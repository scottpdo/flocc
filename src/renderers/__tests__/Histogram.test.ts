import { Agent, Environment, Histogram } from '../../main';

const width = 200;
const height = 400;

const container = document.createElement("div");
const environment = new Environment();
let histogram: Histogram;

beforeEach(() => {
  histogram = new Histogram(environment, {
    buckets: 4,
    width,
    height
  });
  histogram.metric("x");
  histogram.mount(container);
  (histogram.canvas.getContext("2d") as any).__clearEvents();
  (histogram.canvas.getContext("2d") as any).__clearDrawCalls();
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
  const calls = (histogram.canvas.getContext("2d") as any).__getDrawCalls();
  expect(calls).toMatchSnapshot();
});

it("Correctly renders with agents", () => {
  for (let i = 0; i < 100; i++) {
    const agent = new Agent();
    agent.set("x", Math.sqrt(i));
    environment.addAgent(agent);
  }
  environment.tick();
  const calls = (histogram.canvas.getContext("2d") as any).__getDrawCalls();
  expect(calls).toMatchSnapshot();
});

it("Correctly renders with discrete buckets", () => {
  const env = new Environment();
  const h = new Histogram(env, {
    background: 'yellow',
    buckets: [1, 2, 3],
    width,
    height
  });
  h.metric("x");
  h.mount(container);
  for (let i = 0; i < 10; i++) {
    const agent = new Agent({ x: i % 4 });
    env.addAgent(agent);
  }
  env.tick();
  expect(true).toBe(true);
  const calls = (h.canvas.getContext("2d") as any).__getDrawCalls();
  expect(calls).toMatchSnapshot();
});

it("Correctly renders histogram with many agents across buckets", () => {
  for (let i = 0; i < 40; i++) {
    const agent = new Agent({ x: i % 4 });
    environment.addAgent(agent);
  }
  environment.tick();
  const calls = (histogram.canvas.getContext("2d") as any).__getDrawCalls();
  expect(calls).toMatchSnapshot();
});
