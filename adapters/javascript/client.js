const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class DeFlakeClient {
    constructor(apiUrl, apiKey) {
        this.apiUrl = apiUrl || process.env.DEFLAKE_API_URL || 'http://localhost:8000/api/deflake';
        this.apiKey = apiKey || process.env.DEFLAKE_API_KEY;

        if (!this.apiKey) {
            console.error("❌ Security Error: DEFLAKE_API_KEY is missing.");
            console.error("   Please set it in your environment or .env file.");
            console.error("   We do not allow anonymous submissions.");
            process.exit(1);
        }
    }

    async heal(logPath, htmlPath, failureLocation = null, sourceCode = null) {
        try {
            // 1. Validate Input Paths (Security: Prevent directory traversal outside of intended scope? 
            // Realistically, the user runs this on their own machine, but basic checks are good)
            if (!fs.existsSync(logPath)) {
                throw new Error(`Log file not found: ${logPath}`);
            }
            if (!fs.existsSync(htmlPath)) {
                throw new Error(`HTML file not found: ${htmlPath}`);
            }

            // 2. Read Files
            const logContent = fs.readFileSync(logPath, 'utf8');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');

            // 3. Send securely to API
            console.log(`🔒 Authenticating with API Key: ${this.apiKey.substring(0, 4)}***`);
            console.log(`📤 Sending context to: ${this.apiUrl}`);

            // Prepare payload
            const payload = {
                error_log: logContent,
                html_snapshot: htmlContent,
                failing_line: failureLocation ? `Line ${failureLocation.rootLine}` : null,
                source_code: sourceCode
            };

            const response = await axios.post(this.apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': this.apiKey
                }
            });

            return response.data;

        } catch (error) {
            if (error.response) {
                console.error(`❌ API Error: ${error.response.status} - ${error.response.data.detail || error.response.statusText}`);
                if (error.response.status === 403) {
                    console.error("   ⛔ Access Denied. Check your API Key.");
                }
            } else {
                console.error(`❌ Client Error: ${error.message}`);
            }
            process.exit(1);
        }
    }
}

module.exports = DeFlakeClient;
