const config = require('../config.cjs');

async function loginViaUi(page, username = 'admin', password = 'Admin@123') {
  await page.goto(`${config.BASE_URL}/login`, { waitUntil: 'networkidle0' });

  // Fill in login credentials
  const usernameInput = await page.waitForSelector('input[type="text"], input[name="username"], #username', { timeout: 8000 });
  const passwordInput = await page.waitForSelector('input[type="password"]', { timeout: 8000 });

  await usernameInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await usernameInput.type(username);

  await passwordInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await passwordInput.type(password);

  const submitButton = await page.waitForSelector('button[type="submit"]', { timeout: 8000 });
  await submitButton.click();

  // Wait for landing
  await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
}

async function logoutViaUi(page) {
  // Click logout button
  const logoutBtn = await page.waitForSelector('button[title="Đăng xuất"], button[aria-label="Đăng xuất"], [data-testid="logout-btn"]', { timeout: 5000 });
  await logoutBtn.click();

  // Wait for redirect to /login
  await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 8000 });
}

module.exports = { loginViaUi, logoutViaUi };
