const path = require('path');
const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { loginViaUi } = require('../helpers/auth.cjs');

async function runDialogRegressionBlocker() {
  console.log('\n===============================================================');
  console.log('BLOCKER 4: SHARED DIALOG.TSX TARGETED REGRESSION VERIFICATION');
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

  const consoleErrors = [];
  const browser = await launchBrowser();
  const { page } = await createPage(browser, config.VIEWPORTS.desktopLarge);

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore benign dev warnings
      if (!text.includes('React DevTools') && !text.includes('favicon.ico') && !text.includes('download')) {
        consoleErrors.push(text);
        console.error(`  [CONSOLE ERROR]: ${text}`);
      }
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error(`  [PAGE ERROR]: ${err.message}`);
  });

  try {
    // Step 1: Login via UI
    console.log('--- Step 1: Login via UI ---');
    await loginViaUi(page, 'admin', 'Admin@123');

    // ==============================================================
    // PART A: POS FLOW (PaymentModal Dialog)
    // ==============================================================
    console.log('\n--- PART A: POS Flow Dialog Regression ---');
    await page.goto(`${config.BASE_URL}/pos`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.grid .group.cursor-pointer', { timeout: 10000 });

    // Find and click an in-stock product
    console.log('--- Adding In-Stock Product to Cart ---');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.grid .group.cursor-pointer'));
      const inStock = cards.find(c => !c.textContent.includes('Hết hàng'));
      if (inStock) inStock.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Handle IMEI input if product is serialized
    const hasImeiInput = await page.evaluate(() => !!document.querySelector('input[placeholder^="Nhập IMEI"]'));
    if (hasImeiInput) {
      console.log('--- Serialized item added: supplying IMEI ---');
      const imeiInput = await page.$('input[placeholder^="Nhập IMEI"]');
      if (imeiInput) await imeiInput.type('TEST-IMEI-REG-01');
      await new Promise(r => setTimeout(r, 500));
    }

    // Open PaymentModal
    console.log('--- Opening Payment Modal ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const payBtn = btns.find(b => b.textContent.includes('Thanh toán đơn hàng') || b.textContent.includes('Proceed') || b.textContent.includes('Thanh Toán'));
      if (payBtn) payBtn.click();
    });

    // Verify Payment Dialog is open
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    record('DLG-POS-OPEN-01', 'Payment dialog opens successfully in POS flow', true);

    // A.1: Select Cash method, Focus Management & No Focus Theft Test
    console.log('--- Selecting Cash Payment Method ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('[role="dialog"] button'));
      const btn = btns.find(b => b.textContent.includes('Tiền mặt') || b.textContent.includes('Cash'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const cashInput = await page.waitForSelector('[role="dialog"] input[type="number"]', { timeout: 5000 });
    await cashInput.focus();
    await page.keyboard.type('500000');
    
    const isInputFocused = await page.evaluate((el) => {
      return document.activeElement === el;
    }, cashInput);
    record('DLG-POS-FOCUS-01', 'Active editing focus remains on input without background focus theft', isInputFocused);

    // A.2: Close "X" Button Test - MUST NOT Trigger Form Submit
    console.log('--- Testing Close "X" Button does NOT submit form ---');
    const closeXBtn = await page.waitForSelector('[role="dialog"] button[aria-label="Close dialog"]', { timeout: 5000 });
    await closeXBtn.click();
    await new Promise(r => setTimeout(r, 600));

    const isPosDialogOpenAfterClose = await page.evaluate(() => {
      return !!document.querySelector('[role="dialog"]');
    });
    record('DLG-POS-CLOSE-X-01', 'Dialog closes cleanly when Close "X" button is clicked', !isPosDialogOpenAfterClose);

    // Check cart is still intact (not submitted/cleared by accidental form submit)
    const cartStillHasItems = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const checkoutBtn = btns.find(b => b.textContent.includes('Thanh toán đơn hàng') || b.textContent.includes('Proceed') || b.textContent.includes('Thanh Toán'));
      return checkoutBtn && !checkoutBtn.hasAttribute('disabled');
    });
    record('DLG-POS-NO-SUBMIT-01', 'Close "X" button did NOT trigger accidental checkout / form submit', cartStillHasItems);

    // A.3: Reopen Dialog Cleanly
    console.log('--- Reopening Payment Dialog ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Thanh toán đơn hàng') || b.textContent.includes('Proceed') || b.textContent.includes('Thanh Toán'));
      if (btn) btn.click();
    });
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    record('DLG-POS-REOPEN-01', 'Payment dialog reopens cleanly with fresh interactive state', true);

    // A.4: Escape Key Closes Dialog
    console.log('--- Testing Escape key closes dialog ---');
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));

    const isPosDialogOpenAfterEscape = await page.evaluate(() => {
      return !!document.querySelector('[role="dialog"]');
    });
    record('DLG-POS-ESCAPE-01', 'Escape key closes POS dialog properly', !isPosDialogOpenAfterEscape);

    // ==============================================================
    // PART B: REPAIR FLOW (RepairChecklistModal Dialog)
    // ==============================================================
    console.log('\n--- PART B: Repair Flow Dialog Regression ---');
    await page.goto(`${config.BASE_URL}/repairs`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click Checklist button on first repair row
    await page.evaluate(() => {
      const firstRow = document.querySelector('tbody tr');
      if (firstRow) {
        const btns = Array.from(firstRow.querySelectorAll('button'));
        // Find button with CheckCircle2 or the 3rd action button
        const checkBtn = btns.find(b => b.querySelector('.lucide-check-circle-2')) || btns[2] || btns[0];
        if (checkBtn) checkBtn.click();
      }
    });

    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    record('DLG-REPAIR-OPEN-01', 'Repair checklist dialog opens successfully', true);

    // Type in textarea without focus theft
    const textarea = await page.waitForSelector('[role="dialog"] textarea', { timeout: 5000 });
    await textarea.focus();
    await page.keyboard.type('Test note for dialog regression check');
    const isTextareaFocused = await page.evaluate((el) => {
      return document.activeElement === el;
    }, textarea);
    record('DLG-REPAIR-FOCUS-01', 'Repair dialog textarea maintains focus without focus theft', isTextareaFocused);

    // Escape closes repair dialog
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));
    const isRepairOpenAfterEscape = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    record('DLG-REPAIR-ESCAPE-01', 'Escape key closes Repair dialog properly', !isRepairOpenAfterEscape);

    // Reopen and close via Close "X"
    await page.evaluate(() => {
      const firstRow = document.querySelector('tbody tr');
      if (firstRow) {
        const btns = Array.from(firstRow.querySelectorAll('button'));
        const checkBtn = btns.find(b => b.querySelector('.lucide-check-circle-2')) || btns[2] || btns[0];
        if (checkBtn) checkBtn.click();
      }
    });
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    record('DLG-REPAIR-REOPEN-01', 'Repair dialog reopens cleanly', true);

    const repairCloseX = await page.waitForSelector('[role="dialog"] button[aria-label="Close dialog"]', { timeout: 5000 });
    await repairCloseX.click();
    await new Promise(r => setTimeout(r, 600));
    const isRepairOpenAfterX = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    record('DLG-REPAIR-CLOSE-X-01', 'Close "X" button cleanly closes Repair dialog', !isRepairOpenAfterX);

    // ==============================================================
    // PART C: PURCHASE ORDER FLOW (Purchase Order Detail Modal)
    // ==============================================================
    console.log('\n--- PART C: Purchase Order Flow Modal Regression ---');
    await page.goto(`${config.BASE_URL}/purchase-orders`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click on first PO row
    await page.evaluate(() => {
      const row = document.querySelector('tbody tr');
      if (row) row.click();
    });

    await page.waitForFunction(() => {
      return document.body.textContent.includes('Chi Tiết Phiếu Nhập');
    }, { timeout: 8000 });
    record('DLG-PO-OPEN-01', 'PO detail modal opens upon row click', true);

    // Click Close "X" on PO detail
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.fixed.inset-0 button.hover\\:bg-slate-100');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const isPoOpenAfterX = await page.evaluate(() => document.body.textContent.includes('Chi Tiết Phiếu Nhập'));
    record('DLG-PO-CLOSE-X-01', 'Close "X" button cleanly closes PO detail modal', !isPoOpenAfterX);

    // Reopen PO dialog
    await page.evaluate(() => {
      const row = document.querySelector('tbody tr');
      if (row) row.click();
    });
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Chi Tiết Phiếu Nhập');
    }, { timeout: 5000 });
    record('DLG-PO-REOPEN-01', 'PO detail modal reopens cleanly', true);

    // Close again
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.fixed.inset-0 button.hover\\:bg-slate-100');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // ==============================================================
    // PART D: STOCK TAKE FLOW (StockTake Detail Modal)
    // ==============================================================
    console.log('\n--- PART D: Stock Take History Dialog Regression ---');
    await page.goto(`${config.BASE_URL}/stock-take`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#warehouse-select', { timeout: 8000 });

    // Switch to History tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const historyTab = tabs.find(t => t.textContent.includes('Lịch Sử') || t.textContent.includes('History'));
      if (historyTab) historyTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Click view detail button on first stock take
    await page.evaluate(() => {
      const firstRow = document.querySelector('tbody tr');
      if (firstRow) {
        const viewBtn = firstRow.querySelector('button');
        if (viewBtn) viewBtn.click();
      }
    });

    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    record('DLG-STK-OPEN-01', 'Stock take detail modal opens from history grid', true);

    // Escape closes Stock Take dialog
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));
    const isStkOpenAfterEscape = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    record('DLG-STK-ESCAPE-01', 'Escape key closes Stock Take detail modal properly', !isStkOpenAfterEscape);

    // Reopen Stock Take dialog and test Close "X"
    await page.evaluate(() => {
      const firstRow = document.querySelector('tbody tr');
      if (firstRow) {
        const viewBtn = firstRow.querySelector('button');
        if (viewBtn) viewBtn.click();
      }
    });
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    record('DLG-STK-REOPEN-01', 'Stock take detail modal reopens cleanly', true);

    const stkCloseX = await page.waitForSelector('[role="dialog"] button[aria-label="Close dialog"]', { timeout: 5000 });
    await stkCloseX.click();
    await new Promise(r => setTimeout(r, 600));
    const isStkOpenAfterX = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    record('DLG-STK-CLOSE-X-01', 'Close "X" button cleanly closes Stock Take detail modal', !isStkOpenAfterX);

    // ==============================================================
    // PART E: INVENTORY TRANSFER FLOW (WarehouseTransferModal Dialog)
    // ==============================================================
    console.log('\n--- PART E: Inventory Transfer Dialog Regression ---');
    await page.goto(`${config.BASE_URL}/inventory`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click 'Luân Chuyển Hàng'
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const transferBtn = btns.find(b => b.textContent.includes('Luân Chuyển Hàng') || b.textContent.includes('Transfer Stock'));
      if (transferBtn) transferBtn.click();
    });

    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    record('DLG-WHT-OPEN-01', 'Warehouse Transfer modal opens properly', true);

    // Escape closes Transfer dialog
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));
    const isWhtOpenAfterEscape = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    record('DLG-WHT-ESCAPE-01', 'Escape key closes Warehouse Transfer dialog properly', !isWhtOpenAfterEscape);

    // Reopen Transfer dialog and test Close "X"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const transferBtn = btns.find(b => b.textContent.includes('Luân Chuyển Hàng') || b.textContent.includes('Transfer Stock'));
      if (transferBtn) transferBtn.click();
    });
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    record('DLG-WHT-REOPEN-01', 'Warehouse Transfer dialog reopens cleanly', true);

    const whtCloseX = await page.waitForSelector('[role="dialog"] button[aria-label="Close dialog"]', { timeout: 5000 });
    await whtCloseX.click();
    await new Promise(r => setTimeout(r, 600));
    const isWhtOpenAfterX = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    record('DLG-WHT-CLOSE-X-01', 'Close "X" button cleanly closes Warehouse Transfer dialog', !isWhtOpenAfterX);

    // Capture visual proof
    const dialogScreenshot = path.join(config.SCREENSHOTS_DIR, 'blocker4_dialog_regression_success.png');
    await page.screenshot({ path: dialogScreenshot, fullPage: false });

    // Step F: Console Exception Audit
    console.log('\n--- Step F: Browser Console Exception Audit ---');
    record('DLG-CONSOLE-NO-ERRORS-01', 'Zero unhandled console errors across all dialog lifecycle operations', consoleErrors.length === 0, `Errors: ${consoleErrors.length}`);

  } finally {
    await browser.close();
  }

  const allPassed = assertions.every(a => a.passed);
  console.log(`\nBlocker 4 Summary: ${assertions.filter(a => a.passed).length}/${assertions.length} Passed`);
  return { blocker: 'DIALOG_REGRESSION', allPassed, assertions };
}

if (require.main === module) {
  runDialogRegressionBlocker().then(res => {
    process.exit(res.allPassed ? 0 : 1);
  }).catch(err => {
    console.error('Fatal error in Blocker 4:', err);
    process.exit(1);
  });
}

module.exports = { runDialogRegressionBlocker };
