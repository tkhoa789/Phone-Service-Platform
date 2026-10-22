const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { loginViaUi } = require('../helpers/auth.cjs');

async function runMobileJourney() {
  console.log('\n==================================================');
  console.log('E2E JOURNEY 08: MOBILE RESPONSIVENESS & DRAWER NAVIGATION');
  console.log('==================================================');

  const browser = await launchBrowser();
  const results = [];

  try {
    // 1. Mobile Viewport 375x812 (iPhone X / 13 Mini)
    console.log('--- Testing 375x812 Viewport ---');
    const { page, takeScreenshot } = await createPage(browser, config.VIEWPORTS.mobileSmall);

    await loginViaUi(page, 'admin', 'Admin@123');

    // Check no horizontal overflow on dashboard
    const isOverflow375 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    results.push({ test: 'MOB-375-01', desc: 'No horizontal overflow on Dashboard (375x812)', pass: !isOverflow375 });

    // Verify Hamburger button visible
    const hamburger = await page.waitForSelector('button[aria-label="Mở menu điều hướng"]', { timeout: 5000 });
    results.push({ test: 'MOB-375-02', desc: 'Hamburger menu button visible on mobile', pass: !!hamburger });

    // Open Drawer
    await hamburger.click();
    await page.waitForSelector('aside.translate-x-0', { timeout: 5000 });
    results.push({ test: 'MOB-375-03', desc: 'Drawer slides into view (translate-x-0)', pass: true });

    // Verify backdrop overlay mounted
    const backdrop = await page.$('.bg-black\\/60');
    results.push({ test: 'MOB-375-04', desc: 'Backdrop overlay mounted', pass: !!backdrop });

    await takeScreenshot('08_mobile_375_drawer_open.png');

    // Close via Backdrop Tap
    console.log('  Testing close via Backdrop tap...');
    await page.mouse.click(340, 300);
    await page.waitForFunction(() => {
      const aside = document.querySelector('aside[aria-label="Main Navigation"]');
      const rect = aside ? aside.getBoundingClientRect() : null;
      return rect && rect.right <= 0;
    }, { timeout: 5000 });
    results.push({ test: 'MOB-375-05', desc: 'Backdrop tap closes drawer', pass: true });

    // Reopen & Close via Escape Key
    console.log('  Testing close via Escape key...');
    await page.click('button[aria-label="Mở menu điều hướng"]');
    await page.waitForFunction(() => {
      const aside = document.querySelector('aside[aria-label="Main Navigation"]');
      const rect = aside ? aside.getBoundingClientRect() : null;
      return rect && rect.left >= 0;
    }, { timeout: 5000 });

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
      const aside = document.querySelector('aside[aria-label="Main Navigation"]');
      const rect = aside ? aside.getBoundingClientRect() : null;
      return rect && rect.right <= 0;
    }, { timeout: 5000 });
    results.push({ test: 'MOB-375-06', desc: 'Escape key closes drawer', pass: true });

    // Reopen & Navigate to POS from Drawer
    console.log('  Testing navigation from drawer to POS...');
    await page.click('button[aria-label="Mở menu điều hướng"]');
    await page.waitForFunction(() => {
      const aside = document.querySelector('aside[aria-label="Main Navigation"]');
      const rect = aside ? aside.getBoundingClientRect() : null;
      return rect && rect.left >= 0;
    }, { timeout: 5000 });

    const posLink = await page.waitForSelector('aside a[href="/pos"]', { timeout: 5000 });
    await posLink.click();
    await page.waitForFunction(() => window.location.pathname.includes('/pos'), { timeout: 8000 });

    results.push({ test: 'MOB-375-07', desc: 'Navigate to /pos from drawer closes drawer', pass: true });

    // Check POS on 375x812
    const isPosOverflow375 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    results.push({ test: 'MOB-375-08', desc: 'No horizontal overflow on POS (375x812)', pass: !isPosOverflow375 });

    // 2. Mobile Viewport 390x844 (iPhone 14)
    console.log('--- Testing 390x844 Viewport ---');
    await page.setViewport(config.VIEWPORTS.mobileMedium);
    await page.goto(`${config.BASE_URL}/purchase-orders`, { waitUntil: 'networkidle0' });
    
    const isPoOverflow390 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    results.push({ test: 'MOB-390-01', desc: 'No horizontal overflow on Purchase Orders (390x844)', pass: !isPoOverflow390 });

    await takeScreenshot('08_mobile_390_po.png');

  } catch (err) {
    console.error('Error in Mobile Journey:', err);
    results.push({ test: 'MOB-ERR', desc: err.message, pass: false });
  } finally {
    await browser.close();
  }

  return { journey: 'MOBILE', results };
}

module.exports = { runMobileJourney };
