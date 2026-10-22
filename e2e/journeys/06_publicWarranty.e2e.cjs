const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');

async function runPublicWarrantyJourney() {
  console.log('\n==================================================');
  console.log('E2E JOURNEY 06: ANONYMOUS PUBLIC WARRANTY LOOKUP');
  console.log('==================================================');

  const browser = await launchBrowser();
  const { page, networkRequests, takeScreenshot } = await createPage(browser);
  const results = [];

  try {
    console.log('--- Step 1: Open Public Warranty Page Anonymously ---');
    await page.goto(`${config.BASE_URL}/warranty-check`, { waitUntil: 'networkidle0' });
    
    const isPublicPage = page.url().includes('/warranty-check');
    results.push({ test: 'WAR-ANON-01', desc: 'Navigates to /warranty-check without login', pass: isPublicPage });

    // Verify input and submit button exist
    const input = await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    const submitBtn = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });

    // 2. Active Warranty Device Lookup
    console.log('--- Step 2: Query Active Device IMEI ---');
    const testImei = '860123455442088';
    await input.click({ clickCount: 3 });
    await input.type(testImei);
    await submitBtn.click();

    // Wait for result card to render
    await page.waitForSelector('text/Galaxy S24 Ultra Master', { timeout: 8000 });
    results.push({ test: 'WAR-01', desc: 'Active device name rendered (Galaxy S24 Ultra Master)', pass: true });

    // Verify Privacy Masking
    const pageContent = await page.content();
    const hasMaskedName = pageContent.includes('Khách *** định') || pageContent.includes('Khách') && pageContent.includes('***');
    results.push({ test: 'WAR-02', desc: 'Customer name is privacy masked', pass: hasMaskedName });

    // Verify NO internal identifiers or phone leaked
    const noPhoneLeaked = !pageContent.includes('0901234567') && !pageContent.includes('0912345678');
    results.push({ test: 'WAR-03', desc: 'Customer phone number NOT exposed in DOM', pass: noPhoneLeaked });

    // Verify ZERO fake AppleCare fallback
    const noFakeFallback = !pageContent.includes('AppleCare+');
    results.push({ test: 'WAR-04', desc: 'Zero fake AppleCare+ fallback in DOM', pass: noFakeFallback });

    await takeScreenshot('06_warranty_active_success.png');

    // 3. Negative Test: Query Non-existent IMEI
    console.log('--- Step 3: Query Non-existent IMEI ---');
    await page.reload({ waitUntil: 'networkidle0' });
    const inputClean = await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    const submitBtnClean = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await inputClean.type('860111222333444');
    await submitBtnClean.click();

    // Wait for "Không tìm thấy" message
    await page.waitForFunction(() => document.body.innerText.includes('Không tìm thấy'), { timeout: 8000 });
    results.push({ test: 'WAR-NEG-01', desc: 'Unknown IMEI displays truthful not-found state', pass: true });
    await takeScreenshot('06_warranty_not_found.png');

    // 4. Expired Warranty Device Lookup
    console.log('--- Step 4: Query Expired Device IMEI ---');
    await page.reload({ waitUntil: 'networkidle0' });
    const inputExp = await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    const submitBtnExp = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await inputExp.type('860999999999999');
    await submitBtnExp.click();

    await page.waitForFunction(() => document.body.innerText.includes('Hết hạn bảo hành'), { timeout: 8000 });
    results.push({ test: 'WAR-05', desc: 'Expired device renders "Hết hạn bảo hành" status', pass: true });
    await takeScreenshot('06_warranty_expired_success.png');

  } catch (err) {
    console.error('Error in Public Warranty Journey:', err);
    results.push({ test: 'WAR-ERR', desc: err.message, pass: false });
  } finally {
    await browser.close();
  }

  return { journey: 'PUBLIC_WARRANTY', results };
}

module.exports = { runPublicWarrantyJourney };
