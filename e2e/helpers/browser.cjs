const path = require('path');
const puppeteer = require(path.resolve('D:/Phone-Service-Platform/src/frontend/node_modules/puppeteer'));
const config = require('../config.cjs');

async function launchBrowser(options = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    ...options,
  });

  return browser;
}

async function createPage(browser, viewport = config.VIEWPORTS.desktopLarge) {
  const page = await browser.newPage();
  await page.setViewport(viewport);

  const consoleLogs = [];
  const networkRequests = [];
  const networkErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
  });

  page.on('pageerror', err => {
    consoleLogs.push({ type: 'pageerror', text: err.message });
  });

  page.on('request', req => {
    if (req.url().includes('/api/')) {
      networkRequests.push({
        method: req.method(),
        url: req.url(),
        postData: req.postData(),
        time: Date.now(),
      });
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      const status = res.status();
      if (status >= 400) {
        let errBody = '';
        try { errBody = await res.text(); } catch (e) {}
        networkErrors.push({
          status,
          url: res.url(),
          body: errBody,
        });
      }
    }
  });

  return {
    page,
    consoleLogs,
    networkRequests,
    networkErrors,
    async takeScreenshot(filename) {
      const filePath = path.join(config.SCREENSHOTS_DIR, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      return filePath;
    }
  };
}

module.exports = { launchBrowser, createPage };
