const DeFlakeClient = require('../javascript/client');

module.exports = (on, config) => {
    on('task', {
        async deflakeHeal({ html, error, testTitle, testFile }) {
            console.log(`\n🚑 DeFlake: Analyzing failure for "${testTitle}"...`);

            const client = new DeFlakeClient(process.env.DEFLAKE_API_URL, process.env.DEFLAKE_API_KEY);

            // We don't have a local log file, so we construct the log content from the error message
            // and metadata passed from the browser.
            const syntheticLog = `
Test Failed: ${testTitle}
File: ${testFile}
Error: ${error}
      `;

            try {
                // Reuse the existing Node.js client logic
                // We pass the raw string content instead of file paths if we modified the client to support it.
                // However, our current client expects PATHS. 
                // Strategy: Write temp files to reuse existing client logic cleanly without refactoring everything yet.
                const fs = require('fs');
                const path = require('path');
                const tempLogPath = path.join(config.projectRoot, 'deflake-temp.log');
                const tempHtmlPath = path.join(config.projectRoot, 'deflake-temp.html');

                fs.writeFileSync(tempLogPath, syntheticLog);
                fs.writeFileSync(tempHtmlPath, html);

                const result = await client.heal(tempLogPath, tempHtmlPath);

                // Cleanup
                try {
                    fs.unlinkSync(tempLogPath);
                    fs.unlinkSync(tempHtmlPath);
                } catch (e) { }

                if (result && result.status === 'success') {
                    console.log("\n" + "=".repeat(40));
                    console.log("✅ DEFLAKE FIX SUGGESTED:");
                    console.log("=".repeat(40));
                    console.log(result.fix);
                    console.log("=".repeat(40) + "\n");
                    return result.fix;
                }

                return null;

            } catch (err) {
                console.error("❌ DeFlake Error:", err.message);
                return null;
            }
        },
    });
};
