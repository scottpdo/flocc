import { Agent, Environment, CanvasRenderer } from '../main';

// Ensure devicePixelRatio is 1 for deterministic canvas coordinates
Object.defineProperty(window, "devicePixelRatio", { value: 1 });

const width = 200;
const height = 200;

it("Renders agents to the buffer canvas", () => {
  const environment = new Environment();
  const renderer = new CanvasRenderer(environment, { width, height });
  (renderer.buffer.getContext("2d") as any).__clearDrawCalls();

  environment.addAgent(new Agent({ x: 100, y: 100, size: 5 }));
  environment.addAgent(new Agent({ x: 50, y: 50, shape: "rect", width: 10, height: 10 }));

  environment.tick();

  const calls = (renderer.buffer.getContext("2d") as any).__getDrawCalls();
  expect(calls).toMatchSnapshot();
});

it("Produces additional arc draw calls for agents near the boundary in a torus environment", () => {
  const plainEnv = new Environment({ torus: false, width, height });
  const plainRenderer = new CanvasRenderer(plainEnv, { width, height });
  (plainRenderer.buffer.getContext("2d") as any).__clearDrawCalls();

  const torusEnv = new Environment({ torus: true, width, height });
  const torusRenderer = new CanvasRenderer(torusEnv, { width, height });
  (torusRenderer.buffer.getContext("2d") as any).__clearDrawCalls();

  // Agent near the right edge — wrap condition: x + size >= canvas width
  // shape must be "circle" (not left null) so the circle draw path is taken
  plainEnv.addAgent(new Agent({ x: width - 2, y: height / 2, size: 5, shape: "circle" }));
  torusEnv.addAgent(new Agent({ x: width - 2, y: height / 2, size: 5, shape: "circle" }));

  plainEnv.tick();
  torusEnv.tick();

  const plainCalls = (plainRenderer.buffer.getContext("2d") as any).__getDrawCalls();
  const torusCalls = (torusRenderer.buffer.getContext("2d") as any).__getDrawCalls();

  // arc calls are nested inside the 'path' of each 'fill' draw call
  const arcCount = (calls: any[]) => {
    let count = 0;
    calls.forEach(call => {
      if (call.type === "arc") count++;
      if (call.props?.path) {
        call.props.path.forEach((p: any) => {
          if (p.type === "arc") count++;
        });
      }
    });
    return count;
  };
  expect(arcCount(torusCalls)).toBeGreaterThan(arcCount(plainCalls));
});

it("Produces snapshot of buffer draw calls for torus wrap rendering near a corner", () => {
  const environment = new Environment({ torus: true, width, height });
  const renderer = new CanvasRenderer(environment, { width, height });
  (renderer.buffer.getContext("2d") as any).__clearDrawCalls();

  // Agent near top-left corner — should wrap in both x and y directions
  environment.addAgent(new Agent({ x: 3, y: 3, size: 6, shape: "circle" }));

  environment.tick();

  const calls = (renderer.buffer.getContext("2d") as any).__getDrawCalls();
  expect(calls).toMatchSnapshot();
});
