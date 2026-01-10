import { test, expect } from '@playwright/test';

test.describe('DeFlake Complex Challenges', () => {

    test('Challenge 1: Dynamic ID', async ({ page }) => {
        await page.goto('http://uitestingplayground.com/dynamicid');
        // FAIL: This ID doesn't exist. Real button has dynamic ID.
        await page.click('#legacy-static-id', { timeout: 2000 });
    });

    test('Challenge 2: Class Attribute', async ({ page }) => {
        await page.goto('http://uitestingplayground.com/classattr');
        // FAIL: The class includes dynamic gibberish.
        await page.click('.btn.class1.class2.btn-warning.fix-this-selector', { timeout: 2000 });
    });

    test('Challenge 3: Hidden Layers', async ({ page }) => {
        await page.goto('http://uitestingplayground.com/hiddenlayers');
        await page.click('#greenButton');
        // FAIL: Trying to click the green button again (it's covered now)
        await page.click('#blue-layer-button-old-id', { timeout: 2000 });
    });

    test('Challenge 4: Class Change', async ({ page }) => {
        await page.goto('http://uitestingplayground.com/sampleapp');
        // FAIL: Real name is "UserName"
        await page.fill('input[name="old_username"]', 'myUser', { timeout: 2000 });
    });


    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== testInfo.expectedStatus) {
            const fs = require('fs');
            const html = await page.content();
            const path = `failure-${testInfo.title.replace(/\s+/g, '-')}.html`;
            fs.writeFileSync(path, html);
            console.log(`Saved HTML to ${path}`);
        }
    });

    test('Challenge 5: Text Match', async ({ page }) => {
        await page.goto('http://uitestingplayground.com/verifytext');
        // FAIL: Looking for old text
        await expect(page.locator('.bg-primary')).toHaveText('Welcome UserName!', { timeout: 2000 });
    });

});
