const DeFlakeClient = require('../javascript/client');
const fs = require('fs');
const path = require('path');

class DeFlakeWDIOService {
    async afterTest(test, context, { error, result, duration, passed, retries }) {
        if (!passed) {
            console.log(`\n🚑 DeFlake: Analyzing failure for "${test.title}"...`);

            // Capture context
            const html = await browser.getPageSource();
            const logContent = `
Test Failed: ${test.title}
File: ${test.file}
Error: ${error.message}
stack: ${error.stack}
            `;

            // Create temp files to reuse existing client logic
            const tempLogPath = path.resolve('deflake-wdio-error.log');
            const tempHtmlPath = path.resolve('deflake-wdio-source.html');

            try {
                fs.writeFileSync(tempLogPath, logContent);
                fs.writeFileSync(tempHtmlPath, html);

                // Initialize Client (reads env vars internally if not passed)
                const client = new DeFlakeClient(process.env.DEFLAKE_API_URL, process.env.DEFLAKE_API_KEY);

                const healResult = await client.heal(tempLogPath, tempHtmlPath);

                if (healResult && healResult.status === 'success') {
                    console.log("\n" + "=".repeat(40));
                    console.log("✅ DEFLAKE FIX SUGGESTED:");
                    console.log("=".repeat(40));
                    console.log(healResult.fix);
                    console.log("=".repeat(40) + "\n");
                }

            } catch (err) {
                console.error("❌ DeFlake Service Error:", err.message);
            } finally {
                // Cleanup
                try {
                    if (fs.existsSync(tempLogPath)) fs.unlinkSync(tempLogPath);
                    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
                } catch (e) { }
            }
        }
    }
}

module.exports = DeFlakeWDIOService;
