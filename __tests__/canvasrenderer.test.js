const fs = require("fs");
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");
const puppeteer = require("puppeteer");
let browser, page;

it("Renders Agents correctly when they wrap in a torus Environment", async () => {
  browser = await puppeteer.launch({
    defaultViewport: {
      height: 200,
      width: 800
    }
  });
  page = await browser.newPage();
  try {
    await page.goto("http://localhost:3000/canvas-wrap", {
      waitUntil: "networkidle2"
    });
  } catch {
    console.warn(
      "Could not connect to localhost:3000, so skipping a CanvasRenderer test. Run `npm run dev` in a separate terminal window to make sure all tests run."
    );
    return await browser.close();
  }
  const filePath = __dirname + "/screenshots/canvas-wrap.png";
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
