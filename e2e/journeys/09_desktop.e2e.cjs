const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { loginViaUi } = require('../helpers/auth.cjs');

async function runDesktopJourney() {
  console.log('\n==================================================');
  console.log('E2E JOURNEY 09: DESKTOP VIEWPORT & SIDEBAR PINNING');
  console.log('==================================================');

  const browser = await launchBrowser();
  const results = [];

  try {
    // 1. Desktop 1440x900
    console.log('--- Testing 1440x900 Viewport ---');
    const { page, takeScreenshot } = await createPage(browser, config.VIEWPORTS.desktopLarge);

    await loginViaUi(page, 'admin', 'Admin@123');
    await page.waitForSelector('aside[aria-label="Main Navigation"]', { timeout: 8000 });

    // Verify Hamburger button is hidden (md:hidden)
    const isHamburgerHidden = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Mở menu điều hướng"]');
      if (!btn) return true;
      const style = window.getComputedStyle(btn);
      return style.display === 'none' || style.visibility === 'hidden';
    });
    results.push({ test: 'DESK-1440-01', desc: 'Hamburger menu hidden on desktop 1440x900', pass: isHamburgerHidden });

    // Verify Sidebar is permanently visible
    const isSidebarVisible = await page.evaluate(() => {
      const aside = document.querySelector('aside[aria-label="Main Navigation"]');
      if (!aside) return false;
      const rect = aside.getBoundingClientRect();
      const style = window.getComputedStyle(aside);
      return (rect.width > 0 && rect.left >= 0) || style.transform === 'matrix(1, 0, 0, 1, 0, 0)' || style.transform === 'none';
    });
    results.push({ test: 'DESK-1440-02', desc: 'Desktop sidebar permanently pinned visible', pass: isSidebarVisible });

    await takeScreenshot('09_desktop_1440_dashboard.png');

    // 2. Desktop 1024x768
    console.log('--- Testing 1024x768 Viewport ---');
    await page.setViewport(config.VIEWPORTS.desktopStandard);
    await page.goto(`${config.BASE_URL}/inventory`, { waitUntil: 'networkidle0' });

    const isHamburgerHidden1024 = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Mở menu điều hướng"]');
      if (!btn) return true;
      const style = window.getComputedStyle(btn);
      return style.display === 'none' || style.visibility === 'hidden';
    });
    results.push({ test: 'DESK-1024-01', desc: 'Hamburger menu hidden on desktop 1024x768', pass: isHamburgerHidden1024 });

    const isSidebarVisible1024 = await page.evaluate(() => {
      const aside = document.querySelector('aside[aria-label="Main Navigation"]');
      if (!aside) return false;
      const rect = aside.getBoundingClientRect();
      return rect.width > 0 && rect.left >= 0;
    });
    results.push({ test: 'DESK-1024-02', desc: 'Desktop sidebar pinned visible at 1024x768', pass: isSidebarVisible1024 });

    await takeScreenshot('09_desktop_1024_inventory.png');

  } catch (err) {
    console.error('Error in Desktop Journey:', err);
    results.push({ test: 'DESK-ERR', desc: err.message, pass: false });
  } finally {
    await browser.close();
  }

  return { journey: 'DESKTOP', results };
}

module.exports = { runDesktopJourney };
