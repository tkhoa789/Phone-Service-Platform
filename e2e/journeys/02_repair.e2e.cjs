const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { loginViaUi } = require('../helpers/auth.cjs');
const { queryScalar } = require('../helpers/db.cjs');

async function runRepairJourney() {
  console.log('\n==================================================');
  console.log('E2E JOURNEY 02: REPAIR INTAKE → DEPOSIT → RECEIPT');
  console.log('==================================================');

  const browser = await launchBrowser();
  const { page, networkRequests, networkErrors, takeScreenshot } = await createPage(browser);
  const results = [];

  try {
    // 1. Authenticate
    await loginViaUi(page, 'admin', 'Admin@123');

    // 2. Navigate to Repair Intake
    console.log('--- Step 1: Open Repair Intake Page ---');
    await page.goto(`${config.BASE_URL}/repairs/intake`, { waitUntil: 'networkidle0' });

    // Step 1: Customer selection
    console.log('--- Step 1: Customer Selection ---');
    await page.waitForSelector('ul li', { timeout: 10000 });
    const firstCustomer = await page.$('ul li');
    if (!firstCustomer) throw new Error('No customers rendered');
    await firstCustomer.click();

    // Step 2: Device & Variant selection
    console.log('--- Step 2: Select Device Variant & Issue ---');
    await page.waitForSelector('ul li', { timeout: 10000 });
    const firstVariant = await page.$('ul li');
    if (!firstVariant) throw new Error('No variants rendered');
    await firstVariant.click();
    results.push({ test: 'REP-01', desc: 'Device variants loaded and selectable', pass: true });

    // Fill problem description
    const issueTextarea = await page.waitForSelector('textarea', { timeout: 5000 });
    await issueTextarea.type('Màn hình bị nứt kính cảm ứng, cần thay màn hình mới.');

    // Click Next (Tiếp tục) to Step 3
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Tiếp tục') || b.innerText.includes('Next'));
      if (nextBtn) nextBtn.click();
    });

    // Step 3: Checklist
    console.log('--- Step 3: Physical Checklist ---');
    await page.waitForFunction(() => document.body.innerText.includes('3. Kiểm tra Ngoại quan') || document.body.innerText.includes('Checklist'), { timeout: 8000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Tiếp tục') || b.innerText.includes('Next'));
      if (nextBtn) nextBtn.click();
    });

    // Step 4: Estimate
    console.log('--- Step 4: Cost Estimation ---');
    await page.waitForFunction(() => document.body.innerText.includes('4. Báo giá Dự kiến') || document.body.innerText.includes('Estimated Cost'), { timeout: 8000 });
    const costInput = await page.waitForSelector('input[type="number"]', { timeout: 5000 });
    await costInput.type('1000000');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Xác nhận Báo giá') || b.innerText.includes('Tiếp tục'));
      if (nextBtn) nextBtn.click();
    });

    // Step 5: Deposit collection
    console.log('--- Step 5: Deposit Collection ---');
    await page.waitForFunction(() => document.body.innerText.includes('5. Thu tiền Đặt cọc') || document.body.innerText.includes('Deposit'), { timeout: 8000 });
    const depositInput = await page.waitForSelector('input[type="number"]', { timeout: 5000 });
    await depositInput.type('500000');
    await new Promise(r => setTimeout(r, 600));

    // Click submit button (Xác Nhận Thu Tiền)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submitBtn = btns.find(b => b.innerText.includes('Xác Nhận Thu Tiền') || b.innerText.includes('Confirm Payment'));
      if (submitBtn) submitBtn.click();
    });

    // Step 6: Receipt screen renders
    console.log('--- Step 6: Receipt Confirmation ---');
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('MÃ PHIẾU') || text.includes('In Biên Nhận') || text.includes('Về Danh Sách') || text.includes('REP-');
    }, { timeout: 15000 });
    
    const pageHtml = await page.content();
    const hasTicketCode = pageHtml.includes('REP-') || pageHtml.toLowerCase().includes('phiếu tiếp nhận');
    results.push({ test: 'REP-02', desc: 'Repair intake completed and receipt rendered', pass: hasTicketCode });

    // Verify spinner is dismissed
    const hasSpinner = await page.evaluate(() => !!document.querySelector('.animate-spin'));
    results.push({ test: 'REP-03', desc: 'Spinner dismissed cleanly on receipt screen', pass: !hasSpinner });

    await takeScreenshot('02_repair_receipt_success.png');

    // Database correlation
    const latestTicket = queryScalar('SELECT TOP 1 Code FROM RepairTickets ORDER BY CreatedAt DESC');
    results.push({ test: 'REP-DB-01', desc: `RepairTicket persisted in database (${latestTicket})`, pass: !!latestTicket && latestTicket.startsWith('REP-') });

    const depositCount = queryScalar(`SELECT COUNT(*) FROM RepairDeposits WHERE RepairTicketId = (SELECT TOP 1 Id FROM RepairTickets WHERE Code = '${latestTicket}')`);
    results.push({ test: 'REP-DB-02', desc: 'RepairDeposit record persisted in database', pass: parseInt(depositCount, 10) >= 1 });

  } catch (err) {
    console.error('Error in Repair Journey:', err);
    results.push({ test: 'REP-ERR', desc: err.message, pass: false });
  } finally {
    await browser.close();
  }

  return { journey: 'REPAIR', results };
}

module.exports = { runRepairJourney };
