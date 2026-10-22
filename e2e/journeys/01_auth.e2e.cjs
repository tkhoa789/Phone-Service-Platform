const config = require('../config.cjs');
const { launchBrowser, createPage } = require('../helpers/browser.cjs');
const { loginViaUi } = require('../helpers/auth.cjs');

async function runAuthJourney() {
  console.log('\n==================================================');
  console.log('E2E JOURNEY 01: AUTHENTICATION & SESSION MANAGEMENT');
  console.log('==================================================');

  const browser = await launchBrowser();
  const { page, consoleLogs, networkRequests, networkErrors, takeScreenshot } = await createPage(browser);
  const results = [];

  try {
    // 1. Negative Test: Invalid Credentials
    console.log('--- Step 1: Login with Invalid Credentials ---');
    await page.goto(`${config.BASE_URL}/login`, { waitUntil: 'networkidle0' });
    
    const userIn = await page.waitForSelector('input[type="text"], #username');
    const passIn = await page.waitForSelector('input[type="password"]');
    await userIn.type('admin');
    await passIn.type('WrongPassword!123');

    const submitBtn = await page.waitForSelector('button[type="submit"]');
    await submitBtn.click();

    // Check for error toast or error message
    await page.waitForSelector('.bg-red-500, .text-red-500, [role="status"], div:has-text("không đúng"), div:has-text("thất bại")', { timeout: 5000 })
      .catch(() => {});
    
    const isStillOnLogin = page.url().includes('/login');
    results.push({ test: 'AUTH-NEG-01', desc: 'Invalid credentials rejected & remains on login', pass: isStillOnLogin });

    // 2. Happy Path: Valid Admin Login
    console.log('--- Step 2: Login with Valid Admin Credentials ---');
    await page.reload({ waitUntil: 'networkidle0' });
    const userInValid = await page.waitForSelector('input[type="text"], #username');
    const passInValid = await page.waitForSelector('input[type="password"]');
    await userInValid.type('admin');
    await passInValid.type('Admin@123');

    const submitBtnValid = await page.waitForSelector('button[type="submit"]');
    await submitBtnValid.click();

    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
    const isDashboard = page.url().includes('/dashboard');
    results.push({ test: 'AUTH-01', desc: 'Valid login navigates to /dashboard', pass: isDashboard });

    // Take screenshot of authenticated dashboard
    await takeScreenshot('01_auth_dashboard_success.png');

    // 3. Protected Route Verification & Navigation
    console.log('--- Step 3: Navigate Protected Pages ---');
    await page.goto(`${config.BASE_URL}/products`, { waitUntil: 'networkidle0' });
    const isProducts = page.url().includes('/products');
    results.push({ test: 'AUTH-02', desc: 'Authenticated navigation to /products allowed', pass: isProducts });

    // 4. Logout Journey
    console.log('--- Step 4: UI Logout Journey ---');
    const logoutBtn = await page.waitForSelector('button[title="Đăng xuất"], button[aria-label="Đăng xuất"], [data-testid="logout-btn"]', { timeout: 5000 });
    await logoutBtn.click();

    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 8000 });
    const isLoggedOut = page.url().includes('/login');
    results.push({ test: 'AUTH-03', desc: 'Logout button navigates to /login', pass: isLoggedOut });

    // 5. Protected Route Blocked After Logout
    console.log('--- Step 5: Verify Protected Route Inaccessible After Logout ---');
    await page.goto(`${config.BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 8000 });
    const isProtectedBlocked = page.url().includes('/login');
    results.push({ test: 'AUTH-04', desc: 'Direct navigation to /dashboard redirects to /login', pass: isProtectedBlocked });

  } catch (err) {
    console.error('Error in Auth Journey:', err);
    results.push({ test: 'AUTH-ERR', desc: err.message, pass: false });
  } finally {
    await browser.close();
  }

  return { journey: 'AUTH', results };
}

module.exports = { runAuthJourney };
