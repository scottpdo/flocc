const {
  Agent,
  Environment,
  LineChartRenderer,
  utils
} = require("../dist/flocc");
const fs = require("fs");
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");
const puppeteer = require("puppeteer");
let browser, page;

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

it("Renders static LineChartRenderer test correctly", async () => {
  browser = await puppeteer.launch();
  page = await browser.newPage();
  try {
    await page.goto("http://localhost:3000/linechart", {
      waitUntil: "networkidle2"
    });
  } catch {
    console.warn(
      "Could not connect to localhost:3000, so skipping a LineChartRenderer test. Run `npm run dev` in a separate terminal window to make sure all tests run."
    );
    return await browser.close();
  }
  const filePath = __dirname + "/screenshots/linechart1.png";
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
});

it("Renders static Lorenz attractor test correctly", async () => {
  browser = await puppeteer.launch();
  page = await browser.newPage();
  try {
    await page.goto("http://localhost:3000/lorenz-static", {
      waitUntil: "networkidle2"
    });
  } catch {
    console.warn(
      "Could not connect to localhost:3000, so skipping a LineChartRenderer test. Run `npm run dev` in a separate terminal window to make sure all tests run."
    );
    return await browser.close();
  }
  const filePath = __dirname + "/screenshots/linechart2.png";
  const existingImage = fs.existsSync(filePath)
    ? PNG.sync.read(fs.readFileSync(filePath))
    : null;
  await page.screenshot({ path: filePath });
  if (!existingImage) {
    await browser.close();
    return;
  }
  const { width, height } = existingImage;
  const newImage = PNG.sync.read(fs.readFileSync(filePath));
  const diff = new PNG({ width, height });
  expect(
    pixelmatch(existingImage.data, newImage.data, diff.data, width, height)
  ).toBe(0);

  await browser.close();
});
