const { Heatmap, Agent, Environment } = require('flocc');
const fs = require("fs");
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");
const puppeteer = require("puppeteer");
let browser, page;

it("Renders a Heatmap from the test page", async () => {
    browser = await puppeteer.launch({
        defaultViewport: {
            height: 1400,
            width: 1400
        }
    });
    page = await browser.newPage();

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
      const filePath = __dirname + "/screenshots/heatmap.png";
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