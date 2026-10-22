const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { loginViaUi } = require('../helpers/auth.cjs');
const { queryScalar } = require('../helpers/db.cjs');

async function runPurchaseOrderJourney() {
  console.log('\n==================================================');
  console.log('E2E JOURNEY 04: PURCHASE ORDER LIFECYCLE & CONCURRENCY');
  console.log('==================================================');

  const browser = await launchBrowser();
  const { page, takeScreenshot } = await createPage(browser);
  const results = [];

  try {
    await loginViaUi(page, 'admin', 'Admin@123');

    console.log('--- Step 1: Open Purchase Orders Page ---');
    await page.goto(`${config.BASE_URL}/purchase-orders`, { waitUntil: 'networkidle0' });

    // Verify PO List Page loaded
    await page.waitForSelector('table', { timeout: 10000 });
    await page.waitForFunction(() => document.body.innerText.includes('Phiếu Nhập Kho') || document.body.innerText.includes('Purchase Orders'), { timeout: 8000 });
    results.push({ test: 'PO-01', desc: 'Purchase orders list page rendered', pass: true });

    // Wait for rows to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    const firstPoRow = await page.$('tbody tr');
    if (firstPoRow) {
      await firstPoRow.click();
      // Verify Detail Modal rendered
      await page.waitForFunction(() => document.body.innerText.includes('Chi Tiết Phiếu Nhập') || document.body.innerText.includes('PO-'), { timeout: 8000 });
      results.push({ test: 'PO-02', desc: 'Purchase order detail modal renders successfully', pass: true });

      await takeScreenshot('04_po_detail_modal.png');

      // Close detail modal via Escape key
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 500));
    } else {
      results.push({ test: 'PO-02', desc: 'No PO rows to open modal', pass: false });
    }

    // Concurrency Verification via DB RowVersion
    const latestPoId = queryScalar('SELECT TOP 1 Id FROM PurchaseOrders WHERE IsDeleted = 0 ORDER BY CreatedAt DESC');
    const hasRowVersion = queryScalar(`SELECT COUNT(*) FROM PurchaseOrders WHERE Id = '${latestPoId}' AND RowVersion IS NOT NULL`);
    results.push({ test: 'PO-DB-01', desc: 'PurchaseOrder has RowVersion concurrency token in DB', pass: parseInt(hasRowVersion, 10) === 1 });

  } catch (err) {
    console.error('Error in Purchase Order Journey:', err);
    results.push({ test: 'PO-ERR', desc: err.message, pass: false });
  } finally {
    await browser.close();
  }

  return { journey: 'PURCHASE_ORDER', results };
}

module.exports = { runPurchaseOrderJourney };
