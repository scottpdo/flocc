import { Agent, Environment, Histogram } from '../main';
import path from 'path';

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

it("Renders Flocking Histogram test correctly.", async () => {
  const fs = require('fs');
  const { PNG } = require('pngjs');
  const pixelmatch = require('pixelmatch');
  const puppeteer = require('puppeteer');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    await page.goto("http://localhost:3000/flocking-histogram", {
      waitUntil: "networkidle2"
    });
  } catch {
    console.warn(
      "Could not connect to localhost:3000, so skipping a Histogram test. Run `npm run dev` in a separate terminal window to make sure all tests run."
    );
    return await browser.close();
  }
  const filePath = path.join(__dirname, '../../__tests__/screenshots/flocking-histogram.png');
  const existingImage = fs.existsSync(filePath)
    ? PNG.sync.read(fs.readFileSync(filePath))
    : null;
  await page.screenshot({ path: filePath });
  if (!existingImage) {
    return await browser.close();
  }
  const { width: imgWidth, height: imgHeight } = existingImage;
  const newImage = PNG.sync.read(fs.readFileSync(filePath));
  const diff = new PNG({ width: imgWidth, height: imgHeight });
  expect(
    pixelmatch(existingImage.data, newImage.data, diff.data, imgWidth, imgHeight)
  ).toBe(0);

  await browser.close();
});
