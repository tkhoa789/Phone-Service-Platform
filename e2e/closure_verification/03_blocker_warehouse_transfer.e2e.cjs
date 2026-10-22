const path = require('path');
const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { loginViaUi } = require('../helpers/auth.cjs');
const { queryDb, queryScalar } = require('../helpers/db.cjs');

async function runWarehouseTransferBlocker() {
  console.log('\n===============================================================');
  console.log('BLOCKER 3: WAREHOUSE TRANSFER LIFECYCLE E2E VERIFICATION');
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

  const fromWarehouseId = '43AC29E4-98BA-499D-BB72-1EBE60923337'; // Kho Dịch Vụ Master 751350
  const toWarehouseId = 'D6933948-6457-4B61-A46F-210E9FBEA008';   // Kho Dịch Vụ Master 186431
  const targetSku = 'SKU_SPART_751350';
  const transferQty = 2;

  // Initial stock levels
  const initialSourceStock = parseInt(queryScalar(`
    SELECT ISNULL(Quantity, 0) FROM Inventories 
    WHERE WarehouseId = '${fromWarehouseId}' AND ProductVariantId IN (
      SELECT Id FROM ProductVariants WHERE Sku = '${targetSku}'
    );
  `) || '0', 10);

  const initialDestStock = parseInt(queryScalar(`
    SELECT ISNULL(Quantity, 0) FROM Inventories 
    WHERE WarehouseId = '${toWarehouseId}' AND ProductVariantId IN (
      SELECT Id FROM ProductVariants WHERE Sku = '${targetSku}'
    );
  `) || '0', 10);

  console.log(`Initial Source Stock (${fromWarehouseId}): ${initialSourceStock}`);
  console.log(`Initial Destination Stock (${toWarehouseId}): ${initialDestStock}`);

  let createdTransferId = null;
  let createdTransferCode = null;

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

  // Monitor API responses
  page.on('response', async (res) => {
    try {
      if (res.url().includes('/api/WarehouseTransfer') && res.request().method() === 'POST') {
        const json = await res.json();
        if (json?.data) {
          createdTransferId = json.data;
          console.log(`Captured Created Transfer ID from API: ${createdTransferId}`);
        }
      }
    } catch (e) {}
  });

  try {
    // Step 1: Login via UI
    console.log('--- Step 1: Login via UI ---');
    await loginViaUi(page, 'admin', 'Admin@123');

    // Step 2: Navigate to Inventory Page
    console.log('--- Step 2: Navigating to Inventory Page ---');
    await page.goto(`${config.BASE_URL}/inventory`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Step 3: Open Warehouse Transfer Modal
    console.log('--- Step 3: Opening Warehouse Transfer Modal ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Luân Chuyển Hàng') || b.textContent.includes('Transfer Stock'));
      if (btn) btn.click();
    });

    // Wait for transfer dialog
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Luân Chuyển Nội Bộ') || document.body.textContent.includes('Inter-Branch Transfer');
    }, { timeout: 8000 });

    // Step 4: Configure Source and Destination Warehouses
    console.log('--- Step 4: Selecting Source and Destination Warehouses ---');
    await page.evaluate(({ fromId, toId }) => {
      const selects = Array.from(document.querySelectorAll('select'));
      if (selects.length >= 2) {
        // Source select
        const fromOpt = Array.from(selects[0].options).find(o => o.value.toLowerCase() === fromId.toLowerCase());
        if (fromOpt) {
          selects[0].value = fromOpt.value;
          selects[0].dispatchEvent(new Event('change', { bubbles: true }));
        }
        // Dest select
        const toOpt = Array.from(selects[1].options).find(o => o.value.toLowerCase() === toId.toLowerCase());
        if (toOpt) {
          selects[1].value = toOpt.value;
          selects[1].dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }, { fromId: fromWarehouseId, toId: toWarehouseId });
    await new Promise(r => setTimeout(r, 1000));

    // Step 5: Open Batch Product Select Modal
    console.log('--- Step 5: Opening Batch Product Select Modal ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('+ Thêm sản phẩm') || b.textContent.includes('+ Add Products'));
      if (btn) btn.click();
    });

    await page.waitForFunction(() => {
      return document.body.textContent.includes('Chọn Danh Sách Sản Phẩm Theo Lô') || document.body.textContent.includes('Bulk Batch Product Selector');
    }, { timeout: 8000 });

    // Step 6: Select target product and adjust quantity to 2
    console.log(`--- Step 6: Selecting SKU [${targetSku}] with Quantity [${transferQty}] ---`);
    await page.evaluate(({ sku, qty }) => {
      // Find card containing SKU
      const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
      const card = cards.find(c => c.textContent.includes(sku));
      if (card) {
        card.click(); // toggle select
      }
    }, { sku: targetSku, qty: transferQty });
    await new Promise(r => setTimeout(r, 500));

    // Adjust quantity to transferQty
    await page.evaluate(({ sku, qty }) => {
      const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
      const card = cards.find(c => c.textContent.includes(sku));
      if (card) {
        const input = card.querySelector('input[type="number"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, qty.toString());
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }, { sku: targetSku, qty: transferQty });
    await new Promise(r => setTimeout(r, 500));

    // Confirm batch selection
    console.log('--- Step 7: Confirming Batch Selection ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Xác Nhận') || b.textContent.includes('Confirm'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 8: Submit Warehouse Transfer
    console.log('--- Step 8: Submitting Warehouse Transfer ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Tạo Phiếu & Bàn Giao') || b.textContent.includes('Create Transfer'));
      if (btn) btn.click();
    });

    // Wait for toast
    await page.waitForFunction(() => {
      const toastEl = document.querySelector('.react-hot-toast, [role="status"]');
      return toastEl && (toastEl.textContent.includes('Phiếu Luân Chuyển') || toastEl.textContent.includes('stock transfer') || toastEl.textContent.includes('thành công'));
    }, { timeout: 12000 });

    const toastText = await page.evaluate(() => {
      const toastEl = document.querySelector('.react-hot-toast, [role="status"]');
      return toastEl ? toastEl.textContent : '';
    });
    const matchCode = toastText.match(/\[(TR-[^\]]+)\]/);
    if (matchCode) {
      createdTransferCode = matchCode[1];
    }
    console.log(`Created Transfer Code: ${createdTransferCode}, ID: ${createdTransferId}`);
    record('WHT-UI-CREATE-01', 'Warehouse transfer ticket created via browser UI batch selection', !!createdTransferId || !!createdTransferCode, `Code: ${createdTransferCode}`);

    // If transfer code wasn't extracted from toast, query DB by latest transfer
    if (!createdTransferCode && createdTransferId) {
      createdTransferCode = queryScalar(`SELECT Code FROM WarehouseTransfers WHERE Id = '${createdTransferId}';`);
    } else if (!createdTransferId && createdTransferCode) {
      createdTransferId = queryScalar(`SELECT Id FROM WarehouseTransfers WHERE Code = '${createdTransferCode}';`);
    }

    // Step 9: Open Transfer Tracker Modal
    console.log('--- Step 9: Opening Transfer Tracker Modal ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Theo Dõi Vận Chuyển') || b.textContent.includes('Transfer Tracker'));
      if (btn) btn.click();
    });

    await page.waitForFunction(() => {
      const modal = document.querySelector('[role="dialog"]');
      return modal && (modal.textContent.includes('Theo Dõi Luân Chuyển') || modal.textContent.includes('Transfer Tracker'));
    }, { timeout: 8000 });

    // Filter by ticket code using tracker search box
    console.log(`--- Filtering tracker by Code [${createdTransferCode}] ---`);
    await page.waitForSelector('[role="dialog"] input', { timeout: 5000 });
    await page.evaluate((code) => {
      const input = document.querySelector('[role="dialog"] input');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, code);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, createdTransferCode);
    await new Promise(r => setTimeout(r, 1500));

    // Step 10: Ship Transfer via UI Button
    console.log(`--- Step 10: Shipping Transfer [${createdTransferCode}] via UI ---`);
    await page.waitForFunction((code) => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return false;
      const cards = Array.from(modal.querySelectorAll('.bg-white.border-slate-200'));
      return cards.some(c => c.textContent.includes(code));
    }, { timeout: 10000 }, createdTransferCode);

    const shipClickResult = await page.evaluate((code) => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { success: false, reason: 'no dialog' };
      const cards = Array.from(modal.querySelectorAll('.bg-white.border-slate-200'));
      const card = cards.find(c => c.textContent.includes(code));
      if (!card) return { success: false, reason: 'card not found', count: cards.length };
      const btns = Array.from(card.querySelectorAll('button'));
      const shipBtn = btns.find(b => b.textContent.includes('Xuất Kho Giao Hàng') || b.textContent.includes('Ship Transfer'));
      if (!shipBtn) return { success: false, reason: 'ship btn not found', btns: btns.map(b => b.textContent.trim()) };
      shipBtn.click();
      return { success: true };
    }, createdTransferCode);
    console.log('Ship click result:', shipClickResult);

    // Wait for ship success: status becomes InTransit
    await page.waitForFunction((code) => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return false;
      const cards = Array.from(modal.querySelectorAll('.bg-white.border-slate-200'));
      const card = cards.find(c => c.textContent.includes(code));
      return card && (card.textContent.includes('Đang Giao Hàng') || card.textContent.includes('In Transit'));
    }, { timeout: 15000 }, createdTransferCode);
    record('WHT-UI-SHIP-01', 'Transfer shipped through browser UI with InTransit state transition', true, `Ticket: ${createdTransferCode}`);

    // Capture visual proof of InTransit
    const shipScreenshot = path.join(config.SCREENSHOTS_DIR, 'blocker3_transfer_intransit.png');
    await page.screenshot({ path: shipScreenshot, fullPage: false });

    // Step 11: Confirm Receipt via UI Button
    console.log(`--- Step 11: Confirming Receipt for [${createdTransferCode}] via UI ---`);
    const rcvClickResult = await page.evaluate((code) => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { success: false, reason: 'no dialog' };
      const cards = Array.from(modal.querySelectorAll('.bg-white.border-slate-200'));
      const card = cards.find(c => c.textContent.includes(code));
      if (!card) return { success: false, reason: 'card not found', count: cards.length };
      const btns = Array.from(card.querySelectorAll('button'));
      const rcvBtn = btns.find(b => b.textContent.includes('Kho Đích Nhận Hàng') || b.textContent.includes('Confirm Receipt'));
      if (!rcvBtn) return { success: false, reason: 'rcv btn not found', btns: btns.map(b => b.textContent.trim()) };
      rcvBtn.click();
      return { success: true };
    }, createdTransferCode);
    console.log('Receive click result:', rcvClickResult);

    // Wait for receive success: status becomes Received
    await page.waitForFunction((code) => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return false;
      const cards = Array.from(modal.querySelectorAll('.bg-white.border-slate-200'));
      const card = cards.find(c => c.textContent.includes(code));
      return card && (card.textContent.includes('Kho Đích Đã Nhận') || card.textContent.includes('Received'));
    }, { timeout: 15000 }, createdTransferCode);
    record('WHT-UI-RECEIVE-01', 'Destination receipt confirmed through browser UI with Received state transition', true, `Ticket: ${createdTransferCode}`);

    // Capture visual proof of Received
    const rcvScreenshot = path.join(config.SCREENSHOTS_DIR, 'blocker3_transfer_received_success.png');
    await page.screenshot({ path: rcvScreenshot, fullPage: false });

    // Step 12: Tracker Refresh & Persistence Assertion
    console.log('--- Step 12: Verifying Persistence via Tracker Refresh ---');
    await page.evaluate(() => {
      const refreshBtn = document.querySelector('button[title*="Làm mới"], button[title*="Refresh"]');
      if (refreshBtn) refreshBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    const isStillReceived = await page.evaluate((code) => {
      const cards = Array.from(document.querySelectorAll('.bg-white.border-slate-200.shadow-sm'));
      const card = cards.find(c => c.textContent.includes(code));
      return card && (card.textContent.includes('Kho Đích Đã Nhận') || card.textContent.includes('Received'));
    }, createdTransferCode);
    record('WHT-UI-PERSIST-01', 'Transfer status strictly persists as Received upon tracker manual refresh', isStillReceived);

    // Step 13: Database Correlation Assertions
    console.log('\n--- Step 13: Database Correlation Assertions ---');

    // 13.1 WarehouseTransfers row Status = Received (2)
    const wtStatus = queryScalar(`SELECT Status FROM WarehouseTransfers WHERE Id = '${createdTransferId}';`);
    record('WHT-DB-STATUS-01', 'WarehouseTransfers entity persisted with Status=Received (2)', wtStatus === '2' || wtStatus === 'Received', `Status: ${wtStatus}`);

    // 13.2 Source inventory decremented
    const dbFinalSourceStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories 
      WHERE WarehouseId = '${fromWarehouseId}' AND ProductVariantId IN (
        SELECT Id FROM ProductVariants WHERE Sku = '${targetSku}'
      );
    `) || '0', 10);
    const expectedSourceStock = initialSourceStock - transferQty;
    record('WHT-DB-SOURCE-01', 'Source warehouse inventory decremented by transferred quantity', dbFinalSourceStock === expectedSourceStock, `Source Stock: ${dbFinalSourceStock} (Expected: ${expectedSourceStock})`);

    // 13.3 Destination inventory incremented
    const dbFinalDestStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories 
      WHERE WarehouseId = '${toWarehouseId}' AND ProductVariantId IN (
        SELECT Id FROM ProductVariants WHERE Sku = '${targetSku}'
      );
    `) || '0', 10);
    const expectedDestStock = initialDestStock + transferQty;
    record('WHT-DB-DEST-01', 'Destination warehouse inventory incremented by transferred quantity', dbFinalDestStock === expectedDestStock, `Dest Stock: ${dbFinalDestStock} (Expected: ${expectedDestStock})`);

    // 13.4 InventoryTransactions: TRANSFER_OUT recorded
    const outTx = queryScalar(`
      SELECT COUNT(*) FROM InventoryTransactions 
      WHERE ReferenceId = '${createdTransferId}' AND Type = 'TRANSFER_OUT' AND QuantityChange = -${transferQty};
    `);
    record('WHT-DB-OUT-TX-01', 'TRANSFER_OUT ledger recorded in InventoryTransactions with negative quantity change', outTx === '1', `Out Ledger count: ${outTx}`);

    // 13.5 InventoryTransactions: TRANSFER_IN recorded
    const inTx = queryScalar(`
      SELECT COUNT(*) FROM InventoryTransactions 
      WHERE ReferenceId = '${createdTransferId}' AND Type = 'TRANSFER_IN' AND QuantityChange = ${transferQty};
    `);
    record('WHT-DB-IN-TX-01', 'TRANSFER_IN ledger recorded in InventoryTransactions with positive quantity change', inTx === '1', `In Ledger count: ${inTx}`);

    // 13.6 Double-Receive Prevention
    console.log('--- Step 14: Terminal State & Replay Protection ---');
    const loginRes = await fetch(`${config.API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
    });
    const token = (await loginRes.json())?.data?.accessToken;

    const replayRes = await fetch(`${config.API_BASE_URL}/WarehouseTransfer/${createdTransferId}/receive`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: createdTransferId, variantImeis: [] })
    });

    const isDoubleReceiveBlocked = replayRes.status === 400 || replayRes.status === 409;
    record('WHT-CONCURRENCY-01', 'Re-executing receive on already-received transfer ticket is strictly rejected (400/409)', isDoubleReceiveBlocked, `Status: ${replayRes.status}`);

    const postReplayDestStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories 
      WHERE WarehouseId = '${toWarehouseId}' AND ProductVariantId IN (
        SELECT Id FROM ProductVariants WHERE Sku = '${targetSku}'
      );
    `) || '0', 10);
    record('WHT-NO-DOUBLE-ADJUST-01', 'Destination inventory remains strictly unchanged after repeated receive attempt', postReplayDestStock === expectedDestStock, `Dest Stock: ${postReplayDestStock}`);

  } finally {
    await browser.close();
  }

  const allPassed = assertions.every(a => a.passed);
  console.log(`\nBlocker 3 Summary: ${assertions.filter(a => a.passed).length}/${assertions.length} Passed`);
  return { blocker: 'WAREHOUSE_TRANSFER', allPassed, assertions };
}

if (require.main === module) {
  runWarehouseTransferBlocker().then(res => {
    process.exit(res.allPassed ? 0 : 1);
  }).catch(err => {
    console.error('Fatal error in Blocker 3:', err);
    process.exit(1);
  });
}

module.exports = { runWarehouseTransferBlocker };
