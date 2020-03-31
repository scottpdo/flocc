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

it("Renders correctly", async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/linechart", {
    waitUntil: "networkidle2"
  });
  const filePath = __dirname + "/screenshots/linechart1.png";
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
