const path = require('path');

module.exports = {
  BASE_URL: 'http://localhost:3000',
  API_BASE_URL: 'http://localhost:5000/api',
  SCREENSHOTS_DIR: 'C:/Users/Administrator/.gemini/antigravity-cli/brain/4411afdf-1d11-4b06-83b0-cabf9d092d83/e2e_screenshots',
  VIEWPORTS: {
    desktopLarge: { width: 1440, height: 900 },
    desktopStandard: { width: 1024, height: 768 },
    mobileSmall: { width: 375, height: 812 },
    mobileMedium: { width: 390, height: 844 },
  },
  TIMEOUTS: {
    action: 10000,
    navigation: 30000,
    backendSync: 5000,
  }
};
