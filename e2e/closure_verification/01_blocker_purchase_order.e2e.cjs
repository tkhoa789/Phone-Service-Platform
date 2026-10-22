const path = require('path');
const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { queryDb, queryScalar, executeDb } = require('../helpers/db.cjs');

async function runPurchaseOrderBlocker() {
  console.log('\n===============================================================');
  console.log('BLOCKER 1: PURCHASE ORDER COMPLETE / RECEIVE E2E VERIFICATION');
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

  // Step 1: Pre-seed a valid Draft Purchase Order via API
  console.log('--- Step 1: Preparing Valid Purchase Order ---');
  const poCode = `PO-E2E-BLK1-${Date.now().toString().slice(-6)}`;
  const supplierId = '61A4D566-0B88-4EA2-B944-0300F9713560';
  const warehouseId = '43AC29E4-98BA-499D-BB72-1EBE60923337';
  const variantId = 'F7903B43-A0ED-46A0-94D6-0C1952E5CE1F';
  const unitPrice = 20000000;

  // Login via API to get token for seeding
  const loginRes = await fetch(`${config.API_BASE_URL}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
  });
  const loginData = await loginRes.json();
  const token = loginData?.data?.accessToken;

  const createPoRes = await fetch(`${config.API_BASE_URL}/PurchaseOrder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      code: poCode,
      supplierId,
      warehouseId,
      items: [{ productVariantId: variantId, quantity: 1, unitPrice }]
    })
  });
  const createPoData = await createPoRes.json();
  const poId = createPoData?.data;
  console.log(`Created PO Code: ${poCode}, ID: ${poId}`);
  record('PO-SEED-01', 'Draft Purchase Order created for E2E receiving', !!poId, `Code: ${poCode}`);

  // Query baseline DB metrics
  const initialStock = parseInt(queryScalar(`
    SELECT ISNULL(Quantity, 0) FROM Inventories 
    WHERE ProductVariantId = '${variantId}' AND WarehouseId = '${warehouseId}';
  `) || '0', 10);

  const initialDebt = parseFloat(queryScalar(`
    SELECT ISNULL(DebtAmount, 0) FROM Suppliers WHERE Id = '${supplierId}';
  `) || '0');

  console.log(`Initial stock in warehouse: ${initialStock}`);
  console.log(`Initial supplier debt: ${initialDebt}`);

  const browser = await launchBrowser();
  const { page, takeScreenshot } = await createPage(browser, config.VIEWPORTS.desktopLarge);

  try {
    const { loginViaUi } = require('../helpers/auth.cjs');
    await loginViaUi(page, 'admin', 'Admin@123');

    // Step 2 & 3: Open Purchase Orders List Page with PO filter
    console.log(`--- Step 2 & 3: Navigating to Purchase Orders Page for [${poCode}] ---`);
    await page.goto(`${config.BASE_URL}/purchase-orders?search=${poCode}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Step 4: Click the row to open PurchaseOrderDetailModal
    console.log('--- Step 4: Opening Purchase Order Detail Modal ---');
    const poRow = await page.waitForFunction((code) => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.find(r => r.textContent.includes(code));
    }, { timeout: 8000 }, poCode);

    await page.evaluate((code) => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const target = rows.find(r => r.textContent.includes(code));
      if (target) target.click();
    }, poCode);

    // Wait for Detail Modal
    await page.waitForFunction(() => document.body.textContent.includes('Chi Tiết Phiếu Nhập'), { timeout: 8000 });
    record('PO-UI-DETAIL-01', 'PurchaseOrderDetailModal opened via row click', true);

    // Step 5: Click 'Nhận Hàng (Hoàn Tất)' button
    console.log('--- Step 5: Clicking Nhận Hàng (Complete PO) Action ---');
    const completeBtn = await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Nhận Hàng (Hoàn Tất)'));
    }, { timeout: 8000 });

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Nhận Hàng (Hoàn Tất)'));
      if (btn) btn.click();
    });

    // Wait for CompletePOModal
    await page.waitForFunction(() => document.body.textContent.includes('Nhận Hàng (Complete PO)'), { timeout: 8000 });
    record('PO-UI-COMPLETE-MODAL-01', 'CompletePOModal opened successfully', true);

    // Step 6: Enter unique IMEI
    const newImei = `86077${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    console.log(`--- Step 6: Scanning Unique IMEI [${newImei}] ---`);
    const imeiInput = await page.waitForSelector('input[placeholder="Quét mã IMEI và nhấn Enter..."]', { timeout: 8000 });
    await imeiInput.type(newImei);
    await page.keyboard.press('Enter');

    // Verify IMEI chip appears
    await page.waitForFunction((imei) => {
      return document.body.textContent.includes(imei);
    }, { timeout: 5000 }, newImei);
    record('PO-UI-IMEI-INPUT-01', 'IMEI scanned and rendered in modal tags', true, `IMEI: ${newImei}`);

    // Step 7: Submit Complete Form
    console.log('--- Step 7: Submitting Complete Form ---');
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[form="complete-form"]');
      if (submitBtn) submitBtn.click();
    });

    // Wait for toast or modal dismiss
    await page.waitForFunction(() => {
      const toastEl = document.querySelector('.react-hot-toast, [role="status"]');
      return (toastEl && toastEl.textContent.includes('thành công')) || !document.body.textContent.includes('Nhận Hàng (Complete PO)');
    }, { timeout: 10000 });
    record('PO-UI-SUBMIT-01', 'Complete PO submitted through UI successfully', true);

    // Step 8: Reload / Re-fetch in browser and verify status
    console.log('--- Step 8: Browser Re-fetch & UI State Verification ---');
    await page.goto(`${config.BASE_URL}/purchase-orders?search=${poCode}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));

    const finalStatus = await page.evaluate((code) => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const row = rows.find(r => r.textContent.includes(code));
      return row ? row.textContent : null;
    }, poCode);

    const isReceivedInUi = finalStatus && (finalStatus.includes('Received') || finalStatus.includes('Đã nhập kho'));
    record('PO-UI-REFETCH-01', 'Browser re-fetch displays Received status in PO list table', !!isReceivedInUi, `Status text: ${finalStatus?.slice(0, 50)}`);

    // Capture visual proof
    const screenshotPath = path.join(config.SCREENSHOTS_DIR, 'blocker1_po_received_success.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Step 9: Database Reconciliation Verification
    console.log('\n--- Step 9: Database Correlation Assertions ---');

    // 9.1 PO Status in DB (2 = Received)
    const dbPoStatus = queryScalar(`SELECT Status FROM PurchaseOrders WHERE Code = '${poCode}';`);
    record('PO-DB-STATUS-01', 'PurchaseOrders.Status transitioned to Received (2) in SQL Server', dbPoStatus === '2' || dbPoStatus === 'Received', `DB Status: ${dbPoStatus}`);

    // 9.2 Inventory Quantity updated
    const finalStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories 
      WHERE ProductVariantId = '${variantId}' AND WarehouseId = '${warehouseId}';
    `) || '0', 10);
    record('PO-DB-STOCK-01', 'Inventories.Quantity incremented by exact received quantity (+1)', finalStock === initialStock + 1, `Before: ${initialStock}, After: ${finalStock}`);

    // 9.3 IMEI row exists and status is InStock (0) in target warehouse
    const imeiDb = queryDb(`
      SELECT Imei, Status, WarehouseId FROM Imeis WHERE Imei = '${newImei}';
    `);
    const isImeiValid = imeiDb && (imeiDb.includes('InStock') || imeiDb.includes(',0,')) && imeiDb.includes(warehouseId);
    record('PO-DB-IMEI-01', 'New IMEI row created in Imeis table with Status=InStock and target WarehouseId', isImeiValid, `Record: ${imeiDb}`);

    // 9.4 InventoryTransaction created
    const txCount = parseInt(queryScalar(`
      SELECT COUNT(*) FROM InventoryTransactions 
      WHERE ProductVariantId = '${variantId}' AND WarehouseId = '${warehouseId}' 
      AND Type = 'IMPORT' AND ReferenceId = '${poId}';
    `) || '0', 10);
    record('PO-DB-TX-01', 'InventoryTransactions ledger record exists for stock receipt', txCount > 0, `Transactions count: ${txCount}`);

    // 9.5 Supplier debt updated
    const finalDebt = parseFloat(queryScalar(`
      SELECT ISNULL(DebtAmount, 0) FROM Suppliers WHERE Id = '${supplierId}';
    `) || '0');
    record('PO-DB-DEBT-01', 'Supplier debt incremented in database', finalDebt >= initialDebt + unitPrice, `Before: ${initialDebt}, After: ${finalDebt}`);

  } finally {
    await browser.close();
  }

  const allPassed = assertions.every(a => a.passed);
  console.log(`\nBlocker 1 Summary: ${assertions.filter(a => a.passed).length}/${assertions.length} Passed`);
  return { blocker: 'PURCHASE_ORDER', allPassed, assertions };
}

if (require.main === module) {
  runPurchaseOrderBlocker().then(res => {
    process.exit(res.allPassed ? 0 : 1);
  }).catch(err => {
    console.error('Fatal error in Blocker 1:', err);
    process.exit(1);
  });
}

module.exports = { runPurchaseOrderBlocker };
