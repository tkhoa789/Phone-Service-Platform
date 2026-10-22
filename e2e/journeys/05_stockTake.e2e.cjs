const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { loginViaUi } = require('../helpers/auth.cjs');
const { queryScalar } = require('../helpers/db.cjs');

async function runStockTakeJourney() {
  console.log('\n==================================================');
  console.log('E2E JOURNEY 05: STOCK TAKE & INVENTORY RECONCILIATION');
  console.log('==================================================');

  const browser = await launchBrowser();
  const { page, takeScreenshot } = await createPage(browser);
  const results = [];

  try {
    await loginViaUi(page, 'admin', 'Admin@123');

    console.log('--- Step 1: Open Stock Take Page ---');
    await page.goto(`${config.BASE_URL}/stock-take`, { waitUntil: 'networkidle0' });

    // Verify warehouse selector or stock take list
    await page.waitForFunction(() => document.body.innerText.includes('Kiểm kê kho') || document.querySelector('select') !== null, { timeout: 10000 });
    results.push({ test: 'STK-01', desc: 'Stock take page loaded with warehouse controls', pass: true });

    await takeScreenshot('05_stock_take_page.png');

    // Database correlation: Check recent stock take status
    const recentStockTake = queryScalar('SELECT TOP 1 Code FROM StockTakes ORDER BY CreatedAt DESC');
    const recentStatus = queryScalar('SELECT TOP 1 Status FROM StockTakes ORDER BY CreatedAt DESC');
    results.push({ test: 'STK-DB-01', desc: `StockTake persisted in DB (Code: ${recentStockTake}, Status: ${recentStatus})`, pass: !!recentStockTake });

  } catch (err) {
    console.error('Error in Stock Take Journey:', err);
    results.push({ test: 'STK-ERR', desc: err.message, pass: false });
  } finally {
    await browser.close();
  }

  return { journey: 'STOCK_TAKE', results };
}

module.exports = { runStockTakeJourney };
