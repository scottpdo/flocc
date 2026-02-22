import path from 'path';

it("Renders a Heatmap from the test page", async () => {
  const fs = require('fs');
  const { PNG } = require('pngjs');
  const pixelmatch = require('pixelmatch');
  const puppeteer = require('puppeteer');

  const browser = await puppeteer.launch({
    defaultViewport: {
      height: 1400,
      width: 1400
    }
  });
  const page = await browser.newPage();

  try {
    await page.goto("http://localhost:3000/heatmap", {
      waitUntil: "networkidle2"
    });
  } catch {
    console.warn(
      "Could not connect to localhost:3000, so skipping a Heatmap test. Run `npm run dev` in a separate terminal window to make sure all tests run."
    );
    return await browser.close();
  }
  const filePath = path.join(__dirname, '../../__tests__/screenshots/heatmap.png');
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
