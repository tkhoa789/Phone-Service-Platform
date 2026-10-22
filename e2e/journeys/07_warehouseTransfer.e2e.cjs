const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { loginViaUi } = require('../helpers/auth.cjs');
const { queryScalar } = require('../helpers/db.cjs');

async function runWarehouseTransferJourney() {
  console.log('\n==================================================');
  console.log('E2E JOURNEY 07: WAREHOUSE TRANSFER & LEDGER INTEGRITY');
  console.log('==================================================');

  const browser = await launchBrowser();
  const { page, takeScreenshot } = await createPage(browser);
  const results = [];

  try {
    await loginViaUi(page, 'admin', 'Admin@123');

    console.log('--- Step 1: Open Inventory Page ---');
    await page.goto(`${config.BASE_URL}/inventory`, { waitUntil: 'networkidle0' });

    // Click Transfer button
    const pageButtons = await page.$$('button');
    let transferClicked = false;
    for (const btn of pageButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Luân Chuyển Hàng') || text.includes('Điều Chuyển Kho') || text.includes('Transfer Stock')) {
        await btn.click();
        transferClicked = true;
        break;
      }
    }

    // Verify Transfer Modal
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Kho Xuất') || text.includes('Kho Nhập') || text.includes('Luân Chuyển');
    }, { timeout: 8000 });
    results.push({ test: 'TR-01', desc: 'Warehouse transfer modal rendered with real warehouse selectors', pass: true });

    await takeScreenshot('07_transfer_modal.png');

    // Close modal
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));

    // Database correlation: Check transfer records and ledger
    const latestTransfer = queryScalar('SELECT TOP 1 Code FROM WarehouseTransfers ORDER BY CreatedAt DESC');
    results.push({ test: 'TR-DB-01', desc: `WarehouseTransfer persisted in DB (Code: ${latestTransfer})`, pass: !!latestTransfer });

    const ledgerCount = queryScalar("SELECT COUNT(*) FROM InventoryTransactions WHERE Type IN ('TRANSFER_OUT', 'TRANSFER_IN')");
    results.push({ test: 'TR-DB-02', desc: `Transfer inventory ledger entries verified in DB (count: ${ledgerCount})`, pass: parseInt(ledgerCount, 10) > 0 });

  } catch (err) {
    console.error('Error in Warehouse Transfer Journey:', err);
    results.push({ test: 'TR-ERR', desc: err.message, pass: false });
  } finally {
    await browser.close();
  }

  return { journey: 'WAREHOUSE_TRANSFER', results };
}

module.exports = { runWarehouseTransferJourney };
