const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs');
const path = require('path');

function createServer(port) {
  return new Promise((resolve) => {
    const app = express();
    const clientDir = path.join(__dirname, 'client');

    app.use('/dist', express.static(path.join(clientDir, 'dist')));
    app.use('/static', express.static(path.join(clientDir, 'static')));

    app.set('view engine', 'ejs');
    app.set('views', path.join(clientDir, 'pages'));

    const models = fs
      .readdirSync(path.join(clientDir, 'models'))
      .map(f => f.replace('.ejs', ''));

    app.get('*', (req, res) => {
      const p = req.path;
      if (p === '/') return res.render('index', { path: p, models, nav: true });
      const modelFile = path.join(clientDir, 'models', p + '.ejs');
      if (!fs.existsSync(modelFile)) return res.status(404).send('Not found');
      res.render('page', { path: p, models, nav: false });
    });

    const server = app.listen(port, () => resolve(server));
  });
}

async function screenshot(model, outputPath, opts = {}) {
  const { waitMs = 2000, width = 800, height = 600, dpr = 1 } = opts;
  const port = 9473; // unlikely to conflict

  const server = await createServer(port);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: dpr });
    await page.goto(`http://localhost:${port}/${model}`, { waitUntil: 'networkidle0' });
    await page.waitFor(waitMs);
    await page.screenshot({ path: outputPath, fullPage: true });
    await browser.close();
    console.log(`Screenshot saved to ${outputPath}`);
  } finally {
    server.close();
  }
}

const model = process.argv[2] || 'histogram';
const output = process.argv[3] || path.join(__dirname, 'screenshot.png');
const dpr = parseFloat(process.argv[4]) || 1;

screenshot(model, output, { dpr }).catch(err => {
  console.error(err);
  process.exit(1);
});
