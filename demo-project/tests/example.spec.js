const { test, expect } = require('@playwright/test');
const path = require('path');

test('login button click', async ({ page }) => {
    // Load local file
    const filePath = path.join(__dirname, '../index.html');
    await page.goto(`file://${filePath}`);

    // This selector is BROKEN. It looks for #login-btn, but the real ID is #auth-submit
    await page.click('#login-btn', { timeout: 2000 });
});
