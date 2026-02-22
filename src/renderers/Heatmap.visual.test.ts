import { Agent, Environment, Heatmap } from '../main';

const width = 200;
const height = 200;

it("Renders an empty Heatmap", () => {
  const environment = new Environment();
  const heatmap = new Heatmap(environment, { width, height });
  (heatmap.canvas.getContext("2d") as any).__clearDrawCalls();

  environment.tick();

  const calls = (heatmap.canvas.getContext("2d") as any).__getDrawCalls();
  expect(calls).toMatchSnapshot();
});

it("Renders a Heatmap with agents distributed across the space", () => {
  const environment = new Environment();
  const heatmap = new Heatmap(environment, { width, height });
  (heatmap.canvas.getContext("2d") as any).__clearDrawCalls();

  // x/y values in 0–1 range to match default Heatmap axis min/max
  for (let i = 0; i < 50; i++) {
    environment.addAgent(new Agent({
      x: (i % 10) / 10,
      y: Math.floor(i / 10) / 10
    }));
  }

  environment.tick();

  const calls = (heatmap.canvas.getContext("2d") as any).__getDrawCalls();
  expect(calls).toMatchSnapshot();
});

it("Renders a Heatmap with a custom color range", () => {
  const environment = new Environment();
  const heatmap = new Heatmap(environment, { width, height, from: "#fff", to: "#f00" });
  (heatmap.canvas.getContext("2d") as any).__clearDrawCalls();

  for (let i = 0; i < 20; i++) {
    environment.addAgent(new Agent({ x: i * 0.05, y: i * 0.05 }));
  }

  environment.tick();

  const calls = (heatmap.canvas.getContext("2d") as any).__getDrawCalls();
  expect(calls).toMatchSnapshot();
});
