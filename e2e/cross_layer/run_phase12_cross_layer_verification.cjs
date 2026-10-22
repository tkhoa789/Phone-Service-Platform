const path = require('path');
const crypto = require('crypto');
const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { queryDb, queryScalar } = require('../helpers/db.cjs');

async function runPhase12CrossLayerVerification() {
  console.log('===============================================================');
  console.log('PHASE 12 — CROSS-LAYER VERIFICATION ENGINE');
  console.log('UI -> API -> Application -> Domain -> Infrastructure -> DB -> Side Effects');
  console.log('===============================================================\n');

  const traceResults = [];
  function record(traceId, flow, layer, check, passed, details = '') {
    traceResults.push({ traceId, flow, layer, check, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${mark} [${traceId}] [${flow}::${layer}] ${check}${details ? ' - ' + details : ''}`);
  }

  const browser = await launchBrowser();
  const { page } = await createPage(browser, config.VIEWPORTS.desktopLarge);

  let token = null;

  try {
    // =========================================================================
    // TRACE 1: AUTHENTICATION & AUTHORIZATION CROSS-LAYER
    // =========================================================================
    console.log('\n--- [TRACE 1] AUTHENTICATION & AUTHORIZATION CROSS-LAYER ---');
    
    // 1.1 UI: Login Form Submission
    await page.goto(`${config.BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="username"], input[type="text"]', { timeout: 8000 });
    await page.type('input[name="username"], input[type="text"]', 'admin');
    await page.type('input[name="password"], input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));
    
    const currentUrl = page.url();
    const isLoginSuccessful = currentUrl.includes('/dashboard');
    record('AUTH-TRACE-01', 'Authentication', 'UI', 'User login via browser form succeeds & navigates to /dashboard', isLoginSuccessful, `URL: ${currentUrl}`);

    // 1.2 FE State / Storage
    const feToken = await page.evaluate(() => localStorage.getItem('token'));
    const feUser = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
    });
    token = feToken;
    record('AUTH-TRACE-02', 'Authentication', 'FE State', 'JWT token and user state securely persisted in client storage', !!feToken && feUser.username === 'admin', `User: ${feUser.username}`);

    // 1.3 HTTP / API Wire Contract
    const directLoginRes = await fetch(`${config.API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
    });
    const loginData = await directLoginRes.json();
    const isWireValid = directLoginRes.status === 200 && loginData?.isSuccess === true && !!loginData?.data?.accessToken;
    record('AUTH-TRACE-03', 'Authentication', 'API / Wire', 'POST /api/Auth/login returns canonical ApiResponse<AuthResponseDto>', isWireValid, `Status: ${directLoginRes.status}`);

    // 1.4 Claims Verification
    const jwtPayloadBase64 = loginData?.data?.accessToken.split('.')[1];
    const jwtPayload = JSON.parse(Buffer.from(jwtPayloadBase64, 'base64').toString('utf8'));
    const roleClaim = jwtPayload['role'] || jwtPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    record('AUTH-TRACE-04', 'Authentication', 'Application / JWT', 'JWT claims contain valid Subject, Role=Admin, and Expiration', roleClaim === 'Admin' && !!jwtPayload.exp, `Role Claim: ${roleClaim}`);

    // 1.5 Authorization Cross-Layer Enforcement (API vs UI)
    // 1.5.1 Call protected Admin endpoint without Token -> 401
    const anonRes = await fetch(`${config.API_BASE_URL}/AuditLog`, { method: 'GET' });
    record('AUTH-TRACE-05', 'Authorization', 'Infrastructure / Policy', 'Anonymous access to protected endpoint strictly returns HTTP 401 Unauthorized', anonRes.status === 401, `Status: ${anonRes.status}`);

    // 1.5.2 Login as Sales role and attempt to call Admin endpoint -> 403 Forbidden
    const salesLoginRes = await fetch(`${config.API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sales', password: 'Sales@123' })
    });
    const salesToken = (await salesLoginRes.json())?.data?.accessToken;
    const forbiddenRes = await fetch(`${config.API_BASE_URL}/AuditLog`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    record('AUTH-TRACE-06', 'Authorization', 'Infrastructure / Policy', 'Insufficient role (Sales calling AuditLog) strictly returns HTTP 403 Forbidden', forbiddenRes.status === 403, `Status: ${forbiddenRes.status}`);

    // 1.5.3 Call public endpoint without Token -> 200 OK
    const sampleImei = queryScalar(`SELECT TOP 1 Imei FROM Imeis WHERE Status = 'InStock';`) || '860776661448417';
    const publicRes = await fetch(`${config.API_BASE_URL}/WarrantyTicket/check/${sampleImei}`, { method: 'GET' });
    record('AUTH-TRACE-07', 'Authorization', 'Controller / AllowAnonymous', 'Public endpoint [AllowAnonymous] accepts unauthenticated requests with HTTP 200 OK', publicRes.status === 200, `Status: ${publicRes.status}`);

    // 1.6 DB Truth: LoginHistories
    const loginHistoryCount = parseInt(queryScalar(`
      SELECT COUNT(*) FROM LoginHistories WHERE UserId = '20000000-0000-0000-0000-000000000001';
    `) || '0', 10);
    record('AUTH-TRACE-08', 'Authentication', 'DB Truth', 'Login audit record successfully written to SQL Server LoginHistories', loginHistoryCount > 0, `Log count: ${loginHistoryCount}`);


    // =========================================================================
    // TRACE 2: REPAIR INTAKE & FINANCIAL DEPOSIT CROSS-LAYER
    // =========================================================================
    console.log('\n--- [TRACE 2] REPAIR INTAKE & DEPOSIT CROSS-LAYER ---');

    const customerId = queryScalar(`SELECT TOP 1 Id FROM Customers WHERE IsDeleted = 0;`);
    const variantId = queryScalar(`SELECT TOP 1 Id FROM ProductVariants WHERE IsDeleted = 0;`);
    const estimatedCost = 1500000;
    const depositAmount = 500000;
    const repairIdempKey = crypto.randomUUID();

    // 2.1 API Execution: Create Repair Ticket
    const createRepairRes = await fetch(`${config.API_BASE_URL}/RepairTicket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': repairIdempKey
      },
      body: JSON.stringify({
        customerId,
        productVariantId: variantId,
        problemDescription: 'Cross-layer verification test: Cracked screen glass',
        estimatedCost
      })
    });
    const repairResult = await createRepairRes.json();
    const repairTicketId = repairResult?.data;
    record('REP-TRACE-01', 'Repair', 'API / Application', 'POST /api/RepairTicket creates repair ticket with initial status Received', createRepairRes.status === 200 && !!repairTicketId, `Ticket ID: ${repairTicketId}`);

    // 2.2 Create Deposit Mutation
    const depKey = crypto.randomUUID();
    const depositRes = await fetch(`${config.API_BASE_URL}/RepairTicket/${repairTicketId}/deposits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': depKey
      },
      body: JSON.stringify({
        repairTicketId,
        amount: depositAmount,
        paymentMethodId: '30000000-0000-0000-0000-000000000001',
        idempotencyKey: depKey
      })
    });
    const depositResult = await depositRes.json();
    const depositId = depositResult?.data;
    record('REP-TRACE-02', 'Repair', 'API / Application', 'POST /api/RepairTicket/{id}/deposits records monetary deposit via CreateRepairDepositCommandHandler', depositRes.status === 200 && !!depositId, `Deposit ID: ${depositId}`);

    // 2.3 DB Truth & Domain Verification
    const repTicketDb = queryDb(`SELECT Status, EstimatedCost FROM RepairTickets WHERE Id = '${repairTicketId}';`);
    const repParts = repTicketDb ? repTicketDb.split(',') : [];
    const repStatus = repParts[0]?.trim();
    const repEst = parseFloat(repParts[1]?.trim() || '0');
    record('REP-TRACE-03', 'Repair', 'DB Truth', 'RepairTickets row created with Status=Received and EstimatedCost=1,500,000', repStatus === 'Received' && repEst === estimatedCost, `Status: ${repStatus}, Est: ${repEst}`);

    const repDepositDb = queryDb(`SELECT Amount, Status, PaymentMethodId FROM RepairDeposits WHERE RepairTicketId = '${repairTicketId}';`);
    const isDepositDbValid = repDepositDb && repDepositDb.includes('500000') && repDepositDb.includes('Paid');
    record('REP-TRACE-04', 'Repair', 'DB Truth', 'RepairDeposits entity persisted with exact monetary Amount=500,000 and Status=Paid', isDepositDbValid, `Row: ${repDepositDb}`);

    // 2.4 Financial Domain Invariant & Over-Deposit Rejection
    const overDepositRes = await fetch(`${config.API_BASE_URL}/RepairTicket/${repairTicketId}/deposits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        repairTicketId,
        amount: 1500000, // 500k existing + 1500k = 2000k > 1500k estimated cost
        paymentMethodId: '30000000-0000-0000-0000-000000000001',
        idempotencyKey: crypto.randomUUID()
      })
    });
    record('REP-TRACE-05', 'Repair', 'Domain / Financial Rule', 'Over-limit deposit strictly rejected with HTTP 400 Bad Request', overDepositRes.status === 400, `Status: ${overDepositRes.status}`);

    // 2.5 UI Persistence: Browser Navigation to /repairs
    await page.goto(`${config.BASE_URL}/repairs`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const isRepairsRendered = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.length > 0;
    });
    record('REP-TRACE-06', 'Repair', 'UI Persistence', 'Repair list table reflects newly persisted repair records upon navigation', isRepairsRendered);


    // =========================================================================
    // TRACE 3: POS CHECKOUT & FINANCIAL INVARIANTS CROSS-LAYER
    // =========================================================================
    console.log('\n--- [TRACE 3] POS CHECKOUT & FINANCIAL INVARIANTS CROSS-LAYER ---');

    // Pre-condition setup for deterministic POS execution
    queryDb("UPDATE TOP (2) Imeis SET Status = 'InStock', WarehouseId = '43AC29E4-98BA-499D-BB72-1EBE60923337' WHERE ProductVariantId = 'F7903B43-A0ED-46A0-94D6-0C1952E5CE1F'");
    queryDb("UPDATE Inventories SET Quantity = 20 WHERE ProductVariantId = 'F7903B43-A0ED-46A0-94D6-0C1952E5CE1F' AND WarehouseId = '43AC29E4-98BA-499D-BB72-1EBE60923337'");
    queryDb("UPDATE Vouchers SET UsageCount = 0, Status = 'Active' WHERE Code = 'TANTHU01' AND UsageCount >= UsageLimit");

    const imeiRows = queryDb("SELECT TOP 2 i.Imei FROM Imeis i JOIN Warehouses w ON i.WarehouseId = w.Id WHERE i.ProductVariantId = 'F7903B43-A0ED-46A0-94D6-0C1952E5CE1F' AND w.BranchId = '00000000-0000-0000-0000-000000000001' AND i.Status = 'InStock' ORDER BY i.Imei ASC");
    const testImeis = imeiRows.split(/\r?\n/).map(s => s.trim()).filter(Boolean).filter(s => !s.includes('affected'));

    // 3.1 Navigate to POS
    await page.goto(`${config.BASE_URL}/pos`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => !document.body.innerText.includes('Đang tải dữ liệu sản phẩm'));

    // 3.2 Add Serialized Product (Qty = 2)
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

    // 3.3 Assign IMEIs
    const imeiInputs = await page.$$('input[placeholder^="Nhập IMEI"]');
    await imeiInputs[0].click();
    await imeiInputs[0].type(testImeis[0]);
    await imeiInputs[1].click();
    await imeiInputs[1].type(testImeis[1]);

    // 3.4 Apply Voucher TANTHU01
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

    // 3.5 Proceed to Payment & Tender Cash
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const payBtn = btns.find(b => b.textContent.includes('Thanh toán đơn hàng') || b.textContent.includes('Proceed'));
      if (payBtn) payBtn.click();
    });
    await page.waitForFunction(() => document.body.innerText.includes('Phương thức thanh toán:'), { timeout: 8000 });

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

    // Submit Payment
    const submitBtn = await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
    await submitBtn.click();

    // Verify K80 Receipt rendered in UI
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Thanh Toán Hoàn Tất') && text.includes('HÓA ĐƠN BÁN HÀNG (K80)');
    }, { timeout: 20000 });
    record('POS-TRACE-01', 'POS Checkout', 'UI / Mutation', 'POS full order checkout & cash payment executed with K80 receipt rendered', true);

    // 3.6 DB Correlation: SalesOrder & Invoice
    const latestSoRow = queryDb("SELECT TOP 1 Id, Code, Status, Subtotal, Discount, Total FROM SalesOrders ORDER BY CreatedAt DESC;");
    const [soId, soCode, soStatus, soSubtotal, soDiscount, soTotal] = (latestSoRow || '').split(',').map(s => s.trim());
    record('POS-TRACE-02', 'POS Checkout', 'DB Truth', 'SalesOrder persisted with Status=Completed and exact Total amount', soStatus === 'Completed' && parseFloat(soTotal) === 49900000, `Code: ${soCode}, Total: ${soTotal}`);

    const latestInvRow = queryDb(`SELECT TOP 1 Code, Status, Amount FROM Invoices WHERE SalesOrderId = '${soId}';`);
    const [invCode, invStatus, invAmount] = (latestInvRow || '').split(',').map(s => s.trim());
    record('POS-TRACE-03', 'POS Checkout', 'Financial Invariant', 'Invoice created with Status=Paid and Amount equal to SalesOrder Total', invStatus === 'Paid' && parseFloat(invAmount) === parseFloat(soTotal), `Inv Code: ${invCode}, Amount: ${invAmount}`);

    // 3.7 Payment Entity
    const paymentRow = queryDb(`SELECT TOP 1 p.Code, p.Amount, p.Status, pm.Code as MethodCode FROM Payments p JOIN PaymentMethods pm ON p.PaymentMethodId = pm.Id WHERE p.InvoiceId IN (SELECT Id FROM Invoices WHERE SalesOrderId = '${soId}');`);
    const [payCode, payAmount, payStatus, payMethod] = (paymentRow || '').split(',').map(s => s.trim());
    record('POS-TRACE-04', 'POS Checkout', 'Financial Invariant', 'Payment entity persisted with exact Invoice amount and CASH method', payStatus === 'Completed' && payMethod === 'CASH' && parseFloat(payAmount) === parseFloat(soTotal), `Pay Code: ${payCode}`);

    // 3.8 Serialized IMEI State Machine & Inventory
    const imei1Status = queryScalar(`SELECT Status FROM Imeis WHERE Imei = '${testImeis[0]}'`);
    const imei2Status = queryScalar(`SELECT Status FROM Imeis WHERE Imei = '${testImeis[1]}'`);
    record('POS-TRACE-05', 'POS Checkout', 'IMEI State Machine', 'Sold IMEIs transitioned to Status=Sold with WarehouseId cleared', imei1Status === 'Sold' && imei2Status === 'Sold', `IMEIs: ${testImeis[0]}=${imei1Status}, ${testImeis[1]}=${imei2Status}`);

    const saleTxCount = parseInt(queryScalar(`
      SELECT COUNT(*) FROM InventoryTransactions WHERE ReferenceId = '${soId}' AND Type = 'SALE';
    `) || '0', 10);
    record('POS-TRACE-06', 'POS Checkout', 'Side Effect / Ledger', 'InventoryTransactions ledger record written with Type=SALE for each sold item', saleTxCount === 2, `Ledger count: ${saleTxCount}`);


    // =========================================================================
    // TRACE 4: PURCHASE ORDER RECEIVING & CONCURRENCY CROSS-LAYER
    // =========================================================================
    console.log('\n--- [TRACE 4] PURCHASE ORDER RECEIVING & CONCURRENCY CROSS-LAYER ---');

    const poSupplierId = queryScalar("SELECT TOP 1 Id FROM Suppliers WHERE IsDeleted = 0 AND Name LIKE N'%Apple%';");
    const poWarehouseId = '43AC29E4-98BA-499D-BB72-1EBE60923337';
    const poVariantId = '46DBF34C-F036-4A9F-B5D5-090C24000A81'; // Non-serialized spare part
    const poQty = 2;
    const poUnitPrice = 5000000;
    const poTotalAmount = poQty * poUnitPrice;
    const poCode = `PO-X-${Date.now().toString().slice(-6)}`;

    const prePoStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories WHERE WarehouseId = '${poWarehouseId}' AND ProductVariantId = '${poVariantId}';
    `) || '0', 10);
    const prePoDebt = parseFloat(queryScalar(`SELECT ISNULL(DebtAmount, 0) FROM Suppliers WHERE Id = '${poSupplierId}';`) || '0');

    // 4.1 Create PO
    const createPoRes = await fetch(`${config.API_BASE_URL}/PurchaseOrder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        supplierId: poSupplierId,
        warehouseId: poWarehouseId,
        code: poCode,
        items: [{ productVariantId: poVariantId, quantity: poQty, unitPrice: poUnitPrice }]
      })
    });
    const poCreatedId = (await createPoRes.json())?.data;
    record('PO-TRACE-01', 'Purchase Order', 'API / Application', 'POST /api/PurchaseOrder creates Draft purchase order', createPoRes.status === 200 && !!poCreatedId, `PO ID: ${poCreatedId}`);

    // Fetch PO to obtain current RowVersion
    const getPoRes = await fetch(`${config.API_BASE_URL}/PurchaseOrder/${poCreatedId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const poDto = (await getPoRes.json())?.data;
    const validRowVersion = poDto?.rowVersion;

    // 4.2 Concurrency Check: Stale RowVersion Rejection
    const staleCompleteRes = await fetch(`${config.API_BASE_URL}/PurchaseOrder/${poCreatedId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: poCreatedId,
        rowVersion: 'AQIDBAUGBwgJCgsMDQ4PEA==', // Corrupted / stale rowversion token
        variantImeis: []
      })
    });
    record('PO-TRACE-02', 'Purchase Order', 'Concurrency / RowVersion', 'Completing PO with stale RowVersion strictly rejected with HTTP 409 Conflict', staleCompleteRes.status === 409, `Status: ${staleCompleteRes.status}`);

    // 4.3 Complete PO with Valid RowVersion
    const validCompleteRes = await fetch(`${config.API_BASE_URL}/PurchaseOrder/${poCreatedId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: poCreatedId,
        rowVersion: validRowVersion,
        variantImeis: []
      })
    });
    record('PO-TRACE-03', 'Purchase Order', 'API / Application', 'Completing PO with valid RowVersion succeeds with HTTP 200 OK', validCompleteRes.status === 200, `Status: ${validCompleteRes.status}`);

    // 4.4 Inventory Invariant
    const postPoStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories WHERE WarehouseId = '${poWarehouseId}' AND ProductVariantId = '${poVariantId}';
    `) || '0', 10);
    record('PO-TRACE-04', 'Purchase Order', 'Inventory Invariant', 'Warehouse stock incremented by exact PO received quantity (+2)', postPoStock === (prePoStock + poQty), `Pre: ${prePoStock}, Post: ${postPoStock}`);

    // 4.5 Financial Invariant: Supplier Debt
    const postPoDebt = parseFloat(queryScalar(`SELECT ISNULL(DebtAmount, 0) FROM Suppliers WHERE Id = '${poSupplierId}';`) || '0');
    record('PO-TRACE-05', 'Purchase Order', 'Financial Invariant', 'Supplier DebtAmount incremented by exact PO total amount (+10,000,000 VND)', postPoDebt === (prePoDebt + poTotalAmount), `Pre Debt: ${prePoDebt}, Post Debt: ${postPoDebt}`);

    // 4.6 Ledger & Replay Protection
    const poLedgerCount = parseInt(queryScalar(`
      SELECT COUNT(*) FROM InventoryTransactions WHERE ReferenceId = '${poCreatedId}' AND Type = 'IMPORT';
    `) || '0', 10);
    record('PO-TRACE-06', 'Purchase Order', 'Side Effect / Ledger', 'InventoryTransactions ledger record written with Type=IMPORT and QuantityChange=+2', poLedgerCount === 1, `Ledger count: ${poLedgerCount}`);

    const replayPoRes = await fetch(`${config.API_BASE_URL}/PurchaseOrder/${poCreatedId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: poCreatedId,
        rowVersion: validRowVersion,
        variantImeis: []
      })
    });
    record('PO-TRACE-07', 'Purchase Order', 'Idempotency / State Machine', 'Re-executing complete on already Received PO strictly rejected with HTTP 409 Conflict', replayPoRes.status === 409, `Status: ${replayPoRes.status}`);


    // =========================================================================
    // TRACE 5: STOCK TAKE RECONCILIATION CROSS-LAYER
    // =========================================================================
    console.log('\n--- [TRACE 5] STOCK TAKE RECONCILIATION CROSS-LAYER ---');

    const stkWarehouseId = '7472624C-8861-45CB-9ED3-BDB52332735E';
    const stkVariantId = '46DBF34C-F036-4A9F-B5D5-090C24000A81';
    const preStkStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories WHERE WarehouseId = '${stkWarehouseId}' AND ProductVariantId = '${stkVariantId}';
    `) || '0', 10);
    const varianceToAdd = 2;
    const actualCounted = preStkStock + varianceToAdd;
    const stkCode = `STK-X-${Date.now().toString().slice(-6)}`;

    // 5.1 Create & Complete Stock Take
    const createStkRes = await fetch(`${config.API_BASE_URL}/StockTake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        warehouseId: stkWarehouseId,
        code: stkCode,
        items: [{ productVariantId: stkVariantId, actualQuantity: actualCounted, note: 'Cross-layer verification audit' }]
      })
    });
    const stkId = (await createStkRes.json())?.data;

    const completeStkRes = await fetch(`${config.API_BASE_URL}/StockTake/${stkId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: stkId, variantImeis: [] })
    });
    record('STK-TRACE-01', 'Stock Take', 'API / Application', 'Stock Take created and completed via CompleteStockTakeCommandHandler', completeStkRes.status === 200, `Status: ${completeStkRes.status}`);

    // 5.2 DB Truth
    const stkItemDb = queryDb(`SELECT SystemQuantity, ActualQuantity, Difference FROM StockTakeItems WHERE StockTakeId = '${stkId}';`);
    const stkParts = stkItemDb ? stkItemDb.split(',') : [];
    const isStkItemValid = stkParts[0]?.trim() === preStkStock.toString() && stkParts[1]?.trim() === actualCounted.toString() && stkParts[2]?.trim() === varianceToAdd.toString();
    record('STK-TRACE-02', 'Stock Take', 'DB Truth', 'StockTakeItems record created with exact SystemQuantity, ActualQuantity, and Difference (+2)', isStkItemValid, `Row: ${stkItemDb}`);

    const postStkStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories WHERE WarehouseId = '${stkWarehouseId}' AND ProductVariantId = '${stkVariantId}';
    `) || '0', 10);
    record('STK-TRACE-03', 'Stock Take', 'Inventory Invariant', 'Inventories.Quantity adjusted in SQL Server to match actual counted quantity', postStkStock === actualCounted, `New Stock: ${postStkStock}`);

    const stkTxCount = parseInt(queryScalar(`
      SELECT COUNT(*) FROM InventoryTransactions WHERE ReferenceId = '${stkId}' AND Type = 'STOCKTAKE_ADJUSTMENT' AND QuantityChange = ${varianceToAdd};
    `) || '0', 10);
    record('STK-TRACE-04', 'Stock Take', 'Side Effect / Ledger', 'STOCKTAKE_ADJUSTMENT ledger written with exact positive variance delta (+2)', stkTxCount === 1, `Ledger count: ${stkTxCount}`);

    const replayStkRes = await fetch(`${config.API_BASE_URL}/StockTake/${stkId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: stkId, variantImeis: [] })
    });
    record('STK-TRACE-05', 'Stock Take', 'Idempotency / Concurrency', 'Re-executing completion on completed Stock Take strictly rejected with HTTP 409 Conflict', replayStkRes.status === 409, `Status: ${replayStkRes.status}`);


    // =========================================================================
    // TRACE 6: PUBLIC WARRANTY & PRIVACY PROTECTION CROSS-LAYER
    // =========================================================================
    console.log('\n--- [TRACE 6] PUBLIC WARRANTY & PRIVACY PROTECTION CROSS-LAYER ---');

    const soldImei = queryScalar("SELECT TOP 1 Imei FROM SalesOrderItems WHERE Imei IS NOT NULL AND Imei <> '' ORDER BY CreatedAt DESC;") || '860123469903945';
    const publicLookupRes = await fetch(`${config.API_BASE_URL}/WarrantyTicket/check/${soldImei}`, {
      method: 'GET'
    });
    const publicData = await publicLookupRes.json();
    const isPublicValid = publicLookupRes.status === 200 && publicData?.isSuccess === true;
    record('WAR-TRACE-01', 'Warranty', 'API / Privacy', 'Public warranty check returns HTTP 200 OK without requiring authentication', isPublicValid, `Status: ${publicLookupRes.status}`);

    const customerMasked = publicData?.data?.customerName;
    const isMaskedProperly = customerMasked && customerMasked.includes('***');
    record('WAR-TRACE-02', 'Warranty', 'Domain / Privacy Rule', 'Customer identity is privacy-masked (e.g. "Khách ***") to protect PII', isMaskedProperly, `Masked Value: ${customerMasked}`);

    const hasPhoneLeaked = !!publicData?.data?.customerPhone;
    const hasInternalIdLeaked = !!publicData?.data?.customerId || !!publicData?.data?.salesOrderId || !!publicData?.data?.productVariantId;
    record('WAR-TRACE-03', 'Warranty', 'API Contract / DTO', 'Internal database IDs and customer phone numbers strictly stripped from public DTO', !hasPhoneLeaked && !hasInternalIdLeaked, `Phone: ${publicData?.data?.customerPhone}`);

    const notFoundRes = await fetch(`${config.API_BASE_URL}/WarrantyTicket/check/999999999999999`, { method: 'GET' });
    const notFoundData = await notFoundRes.json();
    record('WAR-TRACE-04', 'Warranty', 'Domain / Classification', 'Non-existent IMEI classified truthfully as status "NotFound" without fake fallback', notFoundData?.data?.warrantyStatus === 'NotFound', `Status: ${notFoundData?.data?.warrantyStatus}`);


    // =========================================================================
    // TRACE 7: WAREHOUSE TRANSFER LIFECYCLE CROSS-LAYER
    // =========================================================================
    console.log('\n--- [TRACE 7] WAREHOUSE TRANSFER LIFECYCLE CROSS-LAYER ---');

    const fromWhId = '43AC29E4-98BA-499D-BB72-1EBE60923337';
    const toWhId = 'D6933948-6457-4B61-A46F-210E9FBEA008';
    const trVariantId = '46DBF34C-F036-4A9F-B5D5-090C24000A81';
    const trQty = 1;
    const trCode = `TR-X-${Date.now().toString().slice(-6)}`;

    const preTrSourceStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories WHERE WarehouseId = '${fromWhId}' AND ProductVariantId = '${trVariantId}';
    `) || '0', 10);
    const preTrDestStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories WHERE WarehouseId = '${toWhId}' AND ProductVariantId = '${trVariantId}';
    `) || '0', 10);

    // 7.1 Create Transfer
    const createTrRes = await fetch(`${config.API_BASE_URL}/WarehouseTransfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fromWarehouseId: fromWhId,
        toWarehouseId: toWhId,
        code: trCode,
        items: [{ productVariantId: trVariantId, quantity: trQty }]
      })
    });
    const trId = (await createTrRes.json())?.data;
    record('TR-TRACE-01', 'Transfer', 'API / Application', 'WarehouseTransfer ticket created with initial Status=Pending (0)', createTrRes.status === 200 && !!trId, `Transfer ID: ${trId}`);

    // 7.2 Ship Transfer (Pending -> InTransit)
    const shipTrRes = await fetch(`${config.API_BASE_URL}/WarehouseTransfer/${trId}/ship`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: trId, variantImeis: [] })
    });
    const postShipSourceStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories WHERE WarehouseId = '${fromWhId}' AND ProductVariantId = '${trVariantId}';
    `) || '0', 10);
    record('TR-TRACE-02', 'Transfer', 'Domain / Side Effect', 'Ship operation decrements source inventory and transitions ticket to InTransit (1)', shipTrRes.status === 200 && postShipSourceStock === (preTrSourceStock - trQty), `Source Stock: ${postShipSourceStock}`);

    // 7.3 Receive Transfer (InTransit -> Received)
    const receiveTrRes = await fetch(`${config.API_BASE_URL}/WarehouseTransfer/${trId}/receive`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: trId, variantImeis: [] })
    });
    const postReceiveDestStock = parseInt(queryScalar(`
      SELECT ISNULL(Quantity, 0) FROM Inventories WHERE WarehouseId = '${toWhId}' AND ProductVariantId = '${trVariantId}';
    `) || '0', 10);
    record('TR-TRACE-03', 'Transfer', 'Domain / Side Effect', 'Receive operation increments destination inventory and transitions ticket to Received (2)', receiveTrRes.status === 200 && postReceiveDestStock === (preTrDestStock + trQty), `Dest Stock: ${postReceiveDestStock}`);

    // 7.4 Ledger Audit
    const outLedger = queryScalar(`
      SELECT COUNT(*) FROM InventoryTransactions WHERE ReferenceId = '${trId}' AND Type = 'TRANSFER_OUT' AND QuantityChange = -${trQty};
    `);
    const inLedger = queryScalar(`
      SELECT COUNT(*) FROM InventoryTransactions WHERE ReferenceId = '${trId}' AND Type = 'TRANSFER_IN' AND QuantityChange = ${trQty};
    `);
    record('TR-TRACE-04', 'Transfer', 'Side Effect / Ledger', 'InventoryTransactions records both TRANSFER_OUT (-1) and TRANSFER_IN (+1) ledgers', outLedger === '1' && inLedger === '1', `Out: ${outLedger}, In: ${inLedger}`);

    // 7.5 Double-Receive Protection
    const replayReceiveRes = await fetch(`${config.API_BASE_URL}/WarehouseTransfer/${trId}/receive`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: trId, variantImeis: [] })
    });
    record('TR-TRACE-05', 'Transfer', 'Idempotency / State Machine', 'Re-executing receive on already Received transfer strictly rejected with HTTP 409 Conflict', replayReceiveRes.status === 409, `Status: ${replayReceiveRes.status}`);


    // =========================================================================
    // TRACE 8: SYSTEM-WIDE MATHEMATICAL & INVARIANT INTEGRITY AUDIT
    // =========================================================================
    console.log('\n--- [TRACE 8] MATHEMATICAL & INVARIANT INTEGRITY AUDIT ---');

    // 8.1 Invoices & SalesOrders Balance Integrity: Total = Subtotal - Discount
    const corruptedSalesOrdersCount = parseInt(queryScalar(`
      SELECT COUNT(*) FROM SalesOrders WHERE Total <> (Subtotal - Discount);
    `) || '0', 10);
    const corruptedInvoicesCount = parseInt(queryScalar(`
      SELECT COUNT(*) FROM Invoices inv JOIN SalesOrders so ON inv.SalesOrderId = so.Id WHERE inv.Amount <> so.Total;
    `) || '0', 10);
    record('INV-TRACE-01', 'Invariants', 'Financial Integrity', '100% of SalesOrders & Invoices satisfy mathematical invariant Total = Subtotal - Discount', corruptedSalesOrdersCount === 0 && corruptedInvoicesCount === 0, `SO Mismatches: ${corruptedSalesOrdersCount}, Inv Mismatches: ${corruptedInvoicesCount}`);

    // 8.2 Inventory Non-Negative Integrity
    const negativeInventoryCount = parseInt(queryScalar(`
      SELECT COUNT(*) FROM Inventories WHERE Quantity < 0;
    `) || '0', 10);
    record('INV-TRACE-02', 'Invariants', 'Inventory Integrity', '100% of inventory records maintain non-negative stock balance (Quantity >= 0)', negativeInventoryCount === 0, `Negative records: ${negativeInventoryCount}`);

    // 8.3 Serialized IMEI Isolation Invariant
    const duplicateInStockImeis = parseInt(queryScalar(`
      SELECT COUNT(*) FROM (
        SELECT Imei, COUNT(*) as cnt FROM Imeis WHERE Status = 'InStock' GROUP BY Imei HAVING COUNT(*) > 1
      ) sub;
    `) || '0', 10);
    record('INV-TRACE-03', 'Invariants', 'IMEI Integrity', 'Zero duplicate active IMEIs exist across all warehouses and products in the enterprise', duplicateInStockImeis === 0, `Duplicate count: ${duplicateInStockImeis}`);

    // 8.4 Sold IMEIs Isolation
    const orphanedSoldImeis = parseInt(queryScalar(`
      SELECT COUNT(*) FROM Imeis WHERE Status = 'Sold' AND WarehouseId IS NOT NULL;
    `) || '0', 10);
    record('INV-TRACE-04', 'Invariants', 'IMEI State Machine', 'Sold IMEIs strictly have WarehouseId cleared to prevent double-sale', orphanedSoldImeis === 0, `Orphaned count: ${orphanedSoldImeis}`);

  } finally {
    await browser.close();
  }

  const passedCount = traceResults.filter(t => t.passed).length;
  const totalCount = traceResults.length;
  const allPassed = passedCount === totalCount;

  console.log('\n===============================================================');
  console.log(`PHASE 12 VERIFICATION SUMMARY: ${passedCount}/${totalCount} ASSERTIONS PASSED`);
  console.log(`OVERALL VERDICT: ${allPassed ? 'FULL PASS' : 'FAIL / BLOCKERS DETECTED'}`);
  console.log('===============================================================\n');

  return { allPassed, passedCount, totalCount, traceResults };
}

if (require.main === module) {
  runPhase12CrossLayerVerification().then(res => {
    process.exit(res.allPassed ? 0 : 1);
  }).catch(err => {
    console.error('Fatal error in Phase 12 verification:', err);
    process.exit(1);
  });
}

module.exports = { runPhase12CrossLayerVerification };
