const path = require('path');
const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { loginViaUi } = require('../helpers/auth.cjs');
const { queryDb, queryScalar } = require('../helpers/db.cjs');

async function runStockTakeBlocker() {
  console.log('\n===============================================================');
  console.log('BLOCKER 2: STOCK TAKE RECONCILIATION E2E VERIFICATION');
  console.log('===============================================================\n');

  const assertions = [];
  function record(id, desc, passed, details = '') {
    assertions.push({ id, desc, passed, details });
    if (passed) {
      console.log(`  ✅ PASS [${id}] ${desc}${details ? ' - ' + details : ''}`);
    } else {
      console.error(`  ❌ FAIL [${id}] ${desc}${details ? ' - ' + details : ''}`);
    }
  }

  const warehouseId = '7472624C-8861-45CB-9ED3-BDB52332735E';
  const stockTakeCode = `STK-E2E-BLK2-${Date.now().toString().slice(-5)}`;

  const browser = await launchBrowser();
  const { page } = await createPage(browser, config.VIEWPORTS.desktopLarge);

  page.on('console', msg => console.log(`  [BROWSER ${msg.type()}]: ${msg.text()}`));
  page.on('response', async res => {
    if (res.status() >= 400) {
      try {
        const text = await res.text();
        console.log(`  [API ERROR ${res.status()}]: ${res.url()} -> ${text}`);
      } catch (e) {}
    }
  });

  try {
    // Step 1: Login via UI
    console.log('--- Step 1: Login via UI ---');
    await loginViaUi(page, 'admin', 'Admin@123');

    // Step 2: Navigate to Stock Take Page
    console.log('--- Step 2: Navigating to Stock Take Page ---');
    await page.goto(`${config.BASE_URL}/stock-take`, { waitUntil: 'networkidle0' });

    // Step 3: Select Warehouse
    console.log(`--- Step 3: Selecting Warehouse [${warehouseId}] ---`);
    await page.waitForSelector('#warehouse-select', { timeout: 8000 });
    const selectedValue = await page.evaluate((targetId) => {
      const select = document.querySelector('#warehouse-select');
      if (!select) return null;
      const opt = Array.from(select.options).find(o => o.value.toLowerCase() === targetId.toLowerCase());
      if (opt) {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return opt.value;
      }
      return null;
    }, warehouseId);
    console.log(`  Selected warehouse option value: ${selectedValue}`);
    await new Promise(r => setTimeout(r, 2000));

    // Step 4: Wait for physical audit grid to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Read the first row's SKU and current system stock
    const itemData = await page.evaluate(() => {
      const firstRow = document.querySelector('tbody tr');
      if (!firstRow) return null;
      const cells = firstRow.querySelectorAll('td');
      if (cells.length < 5) return null;
      const sku = cells[0].textContent.trim();
      const name = cells[1].textContent.trim();
      const systemStock = parseInt(cells[2].textContent.trim(), 10);
      return { sku, name, systemStock };
    });

    if (!itemData || isNaN(itemData.systemStock)) {
      throw new Error('Could not read inventory items from Stock Take physical grid');
    }

    console.log(`Auditing Item: ${itemData.name} (${itemData.sku}), System Stock: ${itemData.systemStock}`);
    const variantId = queryScalar(`SELECT Id FROM ProductVariants WHERE Sku = '${itemData.sku}';`);
    const initialSystemStock = itemData.systemStock;
    const varianceToAdd = 3;
    const countedQuantity = initialSystemStock + varianceToAdd;

    // Step 5: Input Custom Stock Take Code
    console.log(`--- Step 5: Setting Stock Take Code [${stockTakeCode}] ---`);
    const codeInput = await page.waitForSelector('#stocktake-code', { timeout: 5000 });
    await page.evaluate((el, code) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, code);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, codeInput, stockTakeCode);

    // Step 6: Input Actual Count in Grid
    console.log(`--- Step 6: Inputting Actual Count [${countedQuantity}] (Variance: +${varianceToAdd}) ---`);
    await page.evaluate((val) => {
      const input = document.querySelector('tbody tr:first-child td input[type="number"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, countedQuantity.toString());

    // Step 7: Verify Live Variance Calculation in UI
    console.log('--- Step 7: Verifying Live Variance Display in UI ---');
    await page.waitForFunction((expectedVariance) => {
      const firstRow = document.querySelector('tbody tr');
      const varCell = firstRow ? firstRow.querySelectorAll('td')[4] : null;
      return varCell && varCell.textContent.includes(`+${expectedVariance}`);
    }, { timeout: 5000 }, varianceToAdd);

    const uiVarianceText = await page.evaluate(() => {
      const firstRow = document.querySelector('tbody tr');
      return firstRow ? firstRow.querySelectorAll('td')[4].textContent.trim() : '';
    });
    record('STK-UI-VARIANCE-01', 'Physical grid calculates positive variance in real-time badge', uiVarianceText === `+${varianceToAdd}`, `Variance Text: ${uiVarianceText}`);

    // Step 8: Click Complete & Reconcile Button
    console.log('--- Step 8: Completing Stock Take via UI Button ---');
    const completeBtn = await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Cân Bằng Kho (Hoàn Tất)') || b.textContent.includes('Reconcile & Complete'));
    }, { timeout: 5000 });

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Cân Bằng Kho (Hoàn Tất)') || b.textContent.includes('Reconcile & Complete'));
      if (btn) btn.click();
    });

    // Wait for success toast
    await page.waitForFunction(() => {
      const toastEl = document.querySelector('.react-hot-toast, [role="status"]');
      return toastEl && (toastEl.textContent.includes('thành công') || toastEl.textContent.includes('successfully'));
    }, { timeout: 12000 });
    record('STK-UI-COMPLETE-01', 'Stock take completed & reconciled through UI action with success feedback', true);

    // Step 9: Switch to History Tab and Verify Persisted Stock Take
    console.log('--- Step 9: Verifying Stock Take in History Tab ---');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const historyTab = tabs.find(t => t.textContent.includes('Lịch Sử Phiếu Kiểm Kê') || t.textContent.includes('Stock Take History'));
      if (historyTab) historyTab.click();
    });

    await page.waitForFunction((code) => {
      return document.body.textContent.includes(code);
    }, { timeout: 8000 }, stockTakeCode);
    record('STK-UI-HISTORY-01', 'Completed Stock Take appears in History table', true, `Code: ${stockTakeCode}`);

    // Step 10: Browser Reload & Verify System Stock Reflects Adjusted Quantity
    console.log('--- Step 10: Reloading Browser & Verifying Updated System Stock ---');
    await page.goto(`${config.BASE_URL}/stock-take`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#warehouse-select', { timeout: 8000 });
    await page.evaluate((targetId) => {
      const select = document.querySelector('#warehouse-select');
      if (!select) return;
      const opt = Array.from(select.options).find(o => o.value.toLowerCase() === targetId.toLowerCase());
      if (opt) {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, warehouseId);
    await new Promise(r => setTimeout(r, 2000));
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const reloadedStock = await page.evaluate((targetSku) => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const targetRow = rows.find(r => r.textContent.includes(targetSku));
      if (!targetRow) return null;
      const cells = targetRow.querySelectorAll('td');
      return parseInt(cells[2].textContent.trim(), 10);
    }, itemData.sku);

    record('STK-UI-REFETCH-01', 'Physical audit grid reflects adjusted stock upon browser reload', reloadedStock === countedQuantity, `New Stock: ${reloadedStock} (Expected: ${countedQuantity})`);

    // Capture visual proof
    const screenshotPath = path.join(config.SCREENSHOTS_DIR, 'blocker2_stocktake_success.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Step 11: Database Correlation Assertions
    console.log('\n--- Step 11: Database Correlation Assertions ---');

    // 11.1 StockTakes row in DB
    const stRow = queryDb(`SELECT Id, Code, Status FROM StockTakes WHERE Code = '${stockTakeCode}';`);
    const stParts = stRow ? stRow.split(',') : [];
    const stId = stParts[0]?.trim();
    const stStatus = stParts[2]?.trim();
    record('STK-DB-STATUS-01', 'StockTakes entity persisted with Status=Completed (2)', stStatus === '2' || stStatus === 'Completed', `Status: ${stStatus}, ID: ${stId}`);

    // 11.2 StockTakeItems row with variance
    const itemRow = queryDb(`
      SELECT SystemQuantity, ActualQuantity, Difference 
      FROM StockTakeItems 
      WHERE StockTakeId = '${stId}' AND ProductVariantId = '${variantId}';
    `);
    const isItemAccurate = itemRow && itemRow.includes(`${initialSystemStock},${countedQuantity},${varianceToAdd}`);
    record('STK-DB-ITEMS-01', 'StockTakeItems record created with exact SystemQuantity, ActualQuantity, and Variance', isItemAccurate, `Row: ${itemRow}`);

    // 11.3 Inventories.Quantity updated in database
    const dbFinalStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories 
      WHERE ProductVariantId = '${variantId}' AND WarehouseId = '${warehouseId}';
    `) || '0', 10);
    record('STK-DB-STOCK-01', 'Inventories.Quantity adjusted in SQL Server to match actual counted quantity', dbFinalStock === countedQuantity, `DB Quantity: ${dbFinalStock}`);

    // 11.4 InventoryTransactions record created
    const txCount = parseInt(queryScalar(`
      SELECT COUNT(*) FROM InventoryTransactions 
      WHERE ProductVariantId = '${variantId}' AND WarehouseId = '${warehouseId}' 
      AND Type = 'STOCKTAKE_ADJUSTMENT' AND ReferenceId = '${stId}';
    `) || '0', 10);
    record('STK-DB-TX-01', 'STOCKTAKE_ADJUSTMENT ledger record created in InventoryTransactions', txCount === 1, `Ledger count: ${txCount}`);

    // 11.5 Double Adjustment Prevention (Double Completion Blocked)
    console.log('--- Step 12: Concurrency & Double-Adjustment Prevention ---');
    const loginRes = await fetch(`${config.API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
    });
    const token = (await loginRes.json())?.data?.accessToken;

    const replayRes = await fetch(`${config.API_BASE_URL}/StockTake/${stId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: stId, variantImeis: [] })
    });

    const isDoubleAdjustBlocked = replayRes.status === 400 || replayRes.status === 409;
    record('STK-CONCURRENCY-01', 'Re-executing completion on already-completed stock take is strictly rejected (400/409)', isDoubleAdjustBlocked, `Status: ${replayRes.status}`);

    const postReplayTxCount = parseInt(queryScalar(`
      SELECT COUNT(*) FROM InventoryTransactions 
      WHERE ProductVariantId = '${variantId}' AND WarehouseId = '${warehouseId}' 
      AND Type = 'STOCKTAKE_ADJUSTMENT' AND ReferenceId = '${stId}';
    `) || '0', 10);
    record('STK-NO-DUPLICATE-01', 'Zero duplicate transaction rows created on repeated completion attempt', postReplayTxCount === 1, `Ledger count: ${postReplayTxCount}`);

  } finally {
    await browser.close();
  }

  const allPassed = assertions.every(a => a.passed);
  console.log(`\nBlocker 2 Summary: ${assertions.filter(a => a.passed).length}/${assertions.length} Passed`);
  return { blocker: 'STOCK_TAKE', allPassed, assertions };
}

if (require.main === module) {
  runStockTakeBlocker().then(res => {
    process.exit(res.allPassed ? 0 : 1);
  }).catch(err => {
    console.error('Fatal error in Blocker 2:', err);
    process.exit(1);
  });
}

module.exports = { runStockTakeBlocker };
