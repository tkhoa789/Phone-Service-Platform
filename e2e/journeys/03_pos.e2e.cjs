const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { loginViaUi } = require('../helpers/auth.cjs');
const { queryDb, queryScalar } = require('../helpers/db.cjs');

async function runPosJourney() {
  console.log('\n==================================================');
  console.log('E2E JOURNEY 03: POS CHECKOUT → SERIALIZED → VOUCHER → CASH → RECEIPT');
  console.log('==================================================');

  // Pre-condition: Ensure at least 2 InStock IMEIs are available in active branch warehouse for variant SKU_SDEV_751350
  queryDb("UPDATE TOP (2) Imeis SET Status = 'InStock', WarehouseId = '43AC29E4-98BA-499D-BB72-1EBE60923337' WHERE ProductVariantId = 'F7903B43-A0ED-46A0-94D6-0C1952E5CE1F'");
  queryDb("UPDATE Inventories SET Quantity = 20 WHERE ProductVariantId = 'F7903B43-A0ED-46A0-94D6-0C1952E5CE1F' AND WarehouseId = '43AC29E4-98BA-499D-BB72-1EBE60923337'");
  queryDb("UPDATE Vouchers SET UsageCount = 0, Status = 'Active' WHERE Code = 'TANTHU01' AND UsageCount >= UsageLimit");

  const imeiRows = queryDb("SELECT TOP 2 i.Imei FROM Imeis i JOIN Warehouses w ON i.WarehouseId = w.Id WHERE i.ProductVariantId = 'F7903B43-A0ED-46A0-94D6-0C1952E5CE1F' AND w.BranchId = '00000000-0000-0000-0000-000000000001' AND i.Status = 'InStock' ORDER BY i.Imei ASC");
  const testImeis = imeiRows.split(/\r?\n/).map(s => s.trim()).filter(Boolean).filter(s => !s.includes('affected'));

  if (testImeis.length < 2) {
    throw new Error('Insufficient InStock IMEIs for variant SKU_SDEV_751350');
  }

  const initialVoucherUsage = parseInt(queryScalar("SELECT UsageCount FROM Vouchers WHERE Code = 'TANTHU01'") || '0', 10);

  const browser = await launchBrowser();
  const { page, takeScreenshot } = await createPage(browser);
  const results = [];

  try {
    // Step 1: Login as Admin
    console.log('--- Step 1: Login as Admin ---');
    await loginViaUi(page, 'admin', 'Admin@123');

    // Step 2: Open POS Page
    console.log('--- Step 2: Open POS Page ---');
    await page.goto(`${config.BASE_URL}/pos`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => !document.body.innerText.includes('Đang tải dữ liệu sản phẩm'));

    // Step 3: Add serialized product to cart with quantity = 2
    console.log('--- Step 3: Add Serialized Product to Cart (Qty = 2) ---');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.group.cursor-pointer'));
      const card = cards.find(c => c.textContent.includes('Điện thoại Samsung Master 751350'));
      if (card) {
        card.click();
        card.click();
      }
    });

    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('input[placeholder^="Nhập IMEI"]');
      return inputs.length >= 2;
    }, { timeout: 8000 });

    results.push({ test: 'POS-01', desc: 'Serialized product added to cart with quantity = 2', pass: true });

    // Step 4: Assign 2 distinct in-stock IMEIs
    console.log('--- Step 4: Assign 2 Distinct IMEIs ---');
    const imeiInputs = await page.$$('input[placeholder^="Nhập IMEI"]');
    await imeiInputs[0].click();
    await imeiInputs[0].type(testImeis[0]);
    await imeiInputs[1].click();
    await imeiInputs[1].type(testImeis[1]);

    const imeiValues = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[placeholder^="Nhập IMEI"]'));
      return inputs.map(i => i.value.trim());
    });

    const imeisAssigned = imeiValues[0] === testImeis[0] && imeiValues[1] === testImeis[1];
    results.push({ test: 'POS-02', desc: `2 distinct IMEIs assigned (${testImeis.join(', ')})`, pass: imeisAssigned });

    // Step 5: Apply Voucher TANTHU01
    console.log('--- Step 5: Apply Voucher TANTHU01 ---');
    const voucherInput = await page.waitForSelector('input[placeholder*="VOUCHER"], input[placeholder*="voucher"]');
    await voucherInput.click();
    await voucherInput.type('TANTHU01');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const applyBtn = btns.find(b => b.textContent.trim() === 'Áp dụng' || b.textContent.trim() === 'Apply');
      if (applyBtn) applyBtn.click();
    });

    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Giảm giá:') && text.includes('49.900.000');
    }, { timeout: 8000 });

    results.push({ test: 'POS-03', desc: 'Voucher TANTHU01 applied with -100,000 VND discount', pass: true });

    // Step 6: Proceed to Payment Modal
    console.log('--- Step 6: Proceed to Payment Modal ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const payBtn = btns.find(b => b.textContent.includes('Thanh toán đơn hàng') || b.textContent.includes('Proceed'));
      if (payBtn) payBtn.click();
    });

    await page.waitForFunction(() => document.body.innerText.includes('Phương thức thanh toán:'), { timeout: 8000 });

    // Step 7: Select Cash Payment Method & Enter Cash Tendered
    console.log('--- Step 7: Select Cash Payment & Tender 50,000,000 VND ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cashBtn = btns.find(b => b.textContent.includes('Tiền mặt') || b.textContent.includes('Cash'));
      if (cashBtn) cashBtn.click();
    });

    const cashInput = await page.waitForSelector('input[type="number"]', { timeout: 5000 });
    await cashInput.click({ clickCount: 3 });
    await cashInput.type('50000000');

    await page.waitForFunction(() => {
      const input = document.querySelector('input[type="number"]');
      const text = document.body.innerText;
      return input && input.value === '50000000' && !text.includes('Số tiền khách đưa chưa đủ!') && text.includes('Tiền thừa trả khách:');
    }, { timeout: 8000 });

    const changeText = await page.evaluate(() => {
      const el = document.querySelector('div[role="dialog"] .font-bold.text-lg');
      return el ? el.textContent.trim() : '';
    });

    const changeCorrect = changeText.includes('100.000');
    results.push({ test: 'POS-04', desc: `Cash payment selected, tendered 50M, change calculated (${changeText})`, pass: changeCorrect });

    await takeScreenshot('03_pos_payment_modal_ready.png');

    // Step 8: Confirm Payment and Print K80 Receipt
    console.log('--- Step 8: Confirm Payment and Verify Receipt ---');
    const submitBtn = await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
    await submitBtn.click();

    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Thanh Toán Hoàn Tất') && text.includes('HÓA ĐƠN BÁN HÀNG (K80)');
    }, { timeout: 20000 });

    await takeScreenshot('03_pos_receipt_success.png');
    results.push({ test: 'POS-05', desc: 'POS checkout completed and K80 receipt rendered', pass: true });

    // Step 9: Database Correlation
    console.log('--- Step 9: Database Correlation ---');
    const orderData = queryDb("SELECT TOP 1 Id, Code, Status, Subtotal, Discount, Total FROM SalesOrders ORDER BY CreatedAt DESC");
    const [orderId, orderCode, orderStatus, subtotal, discount, total] = (orderData || '').split(',').map(s => s.trim());

    const orderValid = orderStatus === 'Completed' &&
      parseFloat(subtotal) === 50000000 &&
      parseFloat(discount) === 100000 &&
      parseFloat(total) === 49900000;
    results.push({ test: 'POS-DB-01', desc: `SalesOrders row verified: Code=${orderCode}, Status=${orderStatus}, Total=${total}`, pass: orderValid });

    const invoiceData = queryDb(`SELECT TOP 1 Code, Status, Amount FROM Invoices WHERE SalesOrderId = '${orderId}'`);
    const [invoiceCode, invoiceStatus, invoiceAmount] = (invoiceData || '').split(',').map(s => s.trim());
    const invoiceValid = invoiceStatus === 'Paid' && parseFloat(invoiceAmount) === 49900000;
    results.push({ test: 'POS-DB-02', desc: `Invoices row verified: Code=${invoiceCode}, Status=${invoiceStatus}, Amount=${invoiceAmount}`, pass: invoiceValid });

    const paymentData = queryDb(`SELECT TOP 1 p.Code, p.Amount, p.Status, pm.Code as MethodCode FROM Payments p JOIN PaymentMethods pm ON p.PaymentMethodId = pm.Id WHERE p.InvoiceId IN (SELECT Id FROM Invoices WHERE SalesOrderId = '${orderId}')`);
    const [payCode, payAmount, payStatus, payMethod] = (paymentData || '').split(',').map(s => s.trim());
    const paymentValid = payStatus === 'Completed' && payMethod === 'CASH' && parseFloat(payAmount) === 49900000;
    results.push({ test: 'POS-DB-03', desc: `Payments row verified: Code=${payCode}, Method=${payMethod}, Status=${payStatus}`, pass: paymentValid });

    const imei1Status = queryScalar(`SELECT Status FROM Imeis WHERE Imei = '${testImeis[0]}'`);
    const imei2Status = queryScalar(`SELECT Status FROM Imeis WHERE Imei = '${testImeis[1]}'`);
    const imeisSold = imei1Status === 'Sold' && imei2Status === 'Sold';
    results.push({ test: 'POS-DB-04', desc: `Both IMEIs transitioned to Sold (${testImeis[0]}=${imei1Status}, ${testImeis[1]}=${imei2Status})`, pass: imeisSold });

    const updatedVoucherUsage = parseInt(queryScalar("SELECT UsageCount FROM Vouchers WHERE Code = 'TANTHU01'") || '0', 10);
    const voucherIncremented = updatedVoucherUsage === initialVoucherUsage + 1;
    results.push({ test: 'POS-DB-05', desc: `Voucher usage incremented: ${initialVoucherUsage} -> ${updatedVoucherUsage}`, pass: voucherIncremented });

  } catch (err) {
    console.error('Error in POS Journey:', err);
    await takeScreenshot('03_pos_error.png');
    results.push({ test: 'POS-ERR', desc: err.message, pass: false });
  } finally {
    await browser.close();
  }

  return { journey: 'POS', results };
}

module.exports = { runPosJourney };
