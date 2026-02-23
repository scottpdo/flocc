import { Agent, Environment, LineChartRenderer, utils } from '../../main';

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

it("Renders draw calls after multiple ticks", () => {
  const env = new Environment();
  const chart = new LineChartRenderer(env, { width, height });
  chart.metric("x");

  for (let i = 0; i < 10; i++) {
    env.addAgent(new Agent({ x: Math.sin(i) * 50 + 100 }));
  }

  (chart.canvas.getContext("2d") as any).__clearDrawCalls();

  for (let t = 0; t < 5; t++) {
    env.tick();
  }

  const calls = (chart.canvas.getContext("2d") as any).__getDrawCalls();
  expect(calls).toMatchSnapshot();
});

it("Renders multiple metrics to the line chart", () => {
  const env = new Environment();
  const chart = new LineChartRenderer(env, { width, height });
  chart.metric("x");
  chart.metric("y", { color: "#f00", fn: utils.sum });

  for (let i = 0; i < 5; i++) {
    env.addAgent(new Agent({ x: i * 20, y: i * 10 }));
  }

  (chart.canvas.getContext("2d") as any).__clearDrawCalls();

  for (let t = 0; t < 3; t++) {
    env.tick();
  }

  const calls = (chart.canvas.getContext("2d") as any).__getDrawCalls();
  expect(calls).toMatchSnapshot();
});
