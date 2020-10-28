const { Agent, Environment, Histogram, utils } = require("../dist/flocc");
const fs = require("fs");
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");
const puppeteer = require("puppeteer");
let browser, page;

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

it("Renders Flocking Histogram test correctly.", async () => {
  browser = await puppeteer.launch();
  page = await browser.newPage();
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
  const filePath = __dirname + "/screenshots/flocking-histogram.png";
  const existingImage = fs.existsSync(filePath)
    ? PNG.sync.read(fs.readFileSync(filePath))
    : null;
  await page.screenshot({ path: filePath });
  if (!existingImage) {
    return await browser.close();
  }
  const { width, height } = existingImage;
  const newImage = PNG.sync.read(fs.readFileSync(filePath));
  const diff = new PNG({ width, height });
  expect(
    pixelmatch(existingImage.data, newImage.data, diff.data, width, height)
  ).toBe(0);

  await browser.close();
})