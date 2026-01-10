#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const DeFlakeClient = require('./client');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const argv = yargs(hideBin(process.argv))
    .option('log', {
        alias: 'l',
        type: 'string',
        description: 'Path to the error log file',
        demandOption: false // No longer strictly required if running in wrapper mode
    })
    .option('html', {
        alias: 'h',
        type: 'string',
        description: 'Path to the HTML snapshot',
        demandOption: false // No longer strictly required if auto-detected
    })
    .option('api-url', {
        type: 'string',
        description: 'Override Default API URL',
    })
    .help()
    .argv;

// Helper to auto-detect artifacts
function detectArtifacts(providedLog, providedHtml) {
    let logPath = providedLog;
    let htmlPath = providedHtml;

    // 1. High Priority: Look for deep traces in test-results (Trace Viewer / Snapshots)
    // This gives the AI the ACTUAL DOM, not just the report summary.
    if (!htmlPath) {
        if (fs.existsSync('test-results')) {
            // Find the most recent metadata or trace inside subfolders
            const files = [];
            function findFiles(dir) {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const res = path.resolve(dir, entry.name);
                    if (entry.isDirectory()) {
                        findFiles(res);
                    } else {
                        // HIT: Prioritize 'error-context.md' or textual traces
                        // Binary zip traces are fallback if no text context exists

                        // Priority 1: error-context.md (Perfect text summary)
                        if (entry.name === 'error-context.md' || entry.name.endsWith('.md')) {
                            files.push({ path: res, time: fs.statSync(res).mtime.getTime() + 10000000 }); // Massive Bonus
                        }
                        // Priority 2: HTML Snapshots (not index.html)
                        else if (entry.name.endsWith('.html') && entry.name !== 'index.html') {
                            files.push({ path: res, time: fs.statSync(res).mtime.getTime() + 5000 });
                        }
                        // Priority 3: Trace Zips (Last resort, hard to parse)
                        else if (entry.name === 'trace.zip') {
                            files.push({ path: res, time: fs.statSync(res).mtime.getTime() });
                        }
                    }
                }
            }
            try { findFiles('test-results'); } catch (e) { }

            // Sort by priority (time + bonus)
            files.sort((a, b) => b.time - a.time);

            if (files.length > 0) {
                console.log(`🔎 Auto-detected Artifact: ${path.relative(process.cwd(), files[0].path)}`);
                htmlPath = files[0].path;
            }
        }
    }

    // 2. Fallback: Generic Report
    if (!htmlPath) {
        const commonPaths = [
            'playwright-report/index.html',
            'reports/index.html'
        ];
        for (const p of commonPaths) {
            if (fs.existsSync(p)) {
                console.log(`🔎 Auto-detected Report (Summary): ${p}`);
                htmlPath = p;
                break;
            }
        }
    }

    // 2. Try to find log file if not provided (and not in wrapper mode)
    if (!logPath) {
        if (fs.existsSync('error.log')) {
            console.log(`🔎 Auto-detected Log file: error.log`);
            logPath = 'error.log';
        }
    }

    return { logPath, htmlPath };
}

async function runHealer(logContent, htmlPath, apiUrl) {
    if (!logContent) {
        console.error("❌ Error: No log content available. Please provide a log file via --log or run a command.");
        return;
    }
    if (!htmlPath || !fs.existsSync(htmlPath)) {
        console.error("❌ Error: HTML report not found. Please specify via --html or ensure 'playwright-report/index.html' exists.");
        // Hint for user
        if (!htmlPath) console.log("   (DeFlake checked common paths but found nothing)");
        return;
    }

    // Check for Binary Zip (User Friendly Error)
    if (htmlPath.endsWith('.zip')) {
        console.error("❌ Error: Found a 'trace.zip' binary, but DeFlake JS CLI currently requires text-based snapshots (HTML/MD).");
        console.error("   Action Required:");
        console.error("   1. Configure Playwright to output an HTML report: 'reporter: [[\"html\"]]'");
        console.error("   2. OR ensure your custom reporter outputs 'error-context.md'");
        console.error("   3. OR manually unzip the trace and pass one of the files: --html path/to/trace.network");
        return;
    }

    const client = new DeFlakeClient(apiUrl);
    console.log("🧠 Consulting the Cloud Brain...");

    // Check file size limit (Basic check to avoid 429s on huge files)
    const stats = fs.statSync(htmlPath);
    if (stats.size > 5 * 1024 * 1024) { // 5MB limit warning
        console.warn("⚠️  Warning: Artifact is large (" + (stats.size / 1024 / 1024).toFixed(2) + "MB). This might hit API rate limits.");
    }

    // Pass log CONTENT (string) directly if it came from wrapper, or file path if from args
    let finalLogPath = argv.log;

    if (logContent) {
        // We have memory content from the wrapper execution, write to .deflake-error.log
        finalLogPath = '.deflake-error.log';
        fs.writeFileSync(finalLogPath, logContent);
    } else if (!finalLogPath && fs.existsSync('error.log')) {
        // Fallback to auto-detected error.log if nothing else
        finalLogPath = 'error.log';
    }

    // Extract location info from log content if available
    const failureLocation = logContent ? extractFailureLocation(logContent) : null;

    const result = await client.heal(finalLogPath, htmlPath);

    if (result && result.status === 'success') {
        printDetailedFix(result.fix, failureLocation);
    } else {
        console.error("❌ Failed to get a fix.");
        if (result && result.fix) console.error("   Reason: " + result.fix);
    }
}

// Helper: Parse Playwright logs to find both Test Start and Error Line
function extractFailureLocation(logText) {
    // 1. Find Test Start (Test Runner Header)
    // [brave] › .../DocumentFormValidation.spec.ts:63:5 › ...
    const testMatch = logText.match(/\[.*?\]\s+›\s+(.*?.spec.ts):(\d+):\d+\s+›/);

    // 2. Find specific Error Line (Stack Trace)
    // at .../DocumentFormValidation.spec.ts:71:79
    const errorMatch = logText.match(/at\s+.*[\/\\]([^\/\\]+\.spec\.ts):(\d+):(\d+)/);

    if (testMatch || errorMatch) {
        return {
            file: testMatch ? testMatch[1] : (errorMatch ? errorMatch[1] : null),
            testLine: testMatch ? testMatch[2] : null,
            errorLine: errorMatch ? errorMatch[2] : null
        };
    }
    return null;
}

// Helper: Pretty print with ANSI colors
function printDetailedFix(fixText, location) {
    const C = {
        RESET: "\x1b[0m",
        BRIGHT: "\x1b[1m",
        RED: "\x1b[31m",
        GREEN: "\x1b[32m",
        YELLOW: "\x1b[33m",
        CYAN: "\x1b[36m",
        GRAY: "\x1b[90m",
        WHITE: "\x1b[37m"
    };

    console.log("\n" + C.GRAY + "─".repeat(50) + C.RESET);

    if (location) {
        if (location.file) console.log(`📄 File: ${C.BRIGHT}${location.file}${C.RESET}`);
        if (location.testLine) console.log(`🧪 Test Start: ${C.CYAN}Line ${location.testLine}${C.RESET}`);
        if (location.errorLine) console.log(`💥 Failure At: ${C.RED}Line ${location.errorLine}${C.RESET}`);
        console.log(C.GRAY + "─".repeat(50) + C.RESET);
    }

    console.log(`${C.GREEN}${C.BRIGHT}✨ DEFLAKE SUGGESTION:${C.RESET}`);

    // Manual Syntax Highlighting logic (Restored)
    const lines = fixText.split('\n');
    let insideCode = false;

    lines.forEach(line => {
        if (line.trim().startsWith('```')) {
            insideCode = !insideCode;
            // Don't print the fences, just toggle mode, or print faintly
            console.log(C.GRAY + line + C.RESET);
        } else if (insideCode) {
            // Simple syntax highlighting
            let colored = line
                .replace(/(\/\/.*)/g, `${C.GRAY}$1${C.RESET}`) // Comments
                .replace(/\b(const|let|var|await|async|function|return|page|expect|test)\b/g, `${C.YELLOW}$1${C.RESET}`) // Keywords
                .replace(/('.*?')/g, `${C.GREEN}$1${C.RESET}`) // Strings '...'
                .replace(/(".*?")/g, `${C.GREEN}$1${C.RESET}`) // Strings "..."
                .replace(/(`.*?`)/g, `${C.GREEN}$1${C.RESET}`) // Template Check
                .replace(/(\.locator|\.click|\.fill|\.toBe|\.toHaveText)/g, `${C.CYAN}$1${C.RESET}`); // Methods

            console.log("  " + colored);
        } else {
            console.log(line);
        }
    });

    console.log(C.GRAY + "─".repeat(50) + C.RESET);
}

async function main() {
    console.log("🚑 DeFlake JS Client (Secure Mode)");

    const command = argv._; // Non-hyphenated arguments

    // MODE 1: Wrapper Mode (user typed `npx deflake npx playwright test`)
    if (command.length > 0) {
        const cmd = command[0];
        const args = command.slice(1);
        console.log(`🚀 Running command: ${cmd} ${args.join(' ')}`);

        const child = spawn(cmd, args, { shell: true, stdio: 'pipe' });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            process.stdout.write(data);
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            process.stderr.write(data);
            stderr += data.toString();
        });

        child.on('close', async (code) => {
            if (code !== 0) {
                console.log(`\n🔴 Command failed with code ${code}. Activating DeFlake...`);
                // Auto-detect artifacts
                const { htmlPath } = detectArtifacts(null, argv.html);
                const fullLog = stdout + "\n" + stderr;

                await runHealer(fullLog, htmlPath, argv.apiUrl);

                process.exit(code); // Propagate exit code
            } else {
                console.log("\n🟢 Command passed successfully. No fix needed.");
                process.exit(0);
            }
        });
    }
    // MODE 2: Standalone Mode (user typed `npx deflake --log ...`)
    else {
        const { logPath, htmlPath } = detectArtifacts(argv.log, argv.html);

        if (logPath && fs.existsSync(logPath)) {
            // Read file content? No, client.heal takes path.
            // Just pass null for content and path for file.
            // Wait, my runHealer logic wrote to temp file if content existed.
            // Here we have path. passing path is fine if I adjust runHealer.

            // Actually, simply:
            await runHealer(null, htmlPath, argv.apiUrl);
            // Wait, runHealer checks for logContent string.
            // I should assume if logPath is passed, it's file based.
            // Let's check `client.js` implementation.
            // client.js reads the file from the path.
            // So if I have logPath, I'm good.

            // Refined runHealer call for standalone:
            const client = new DeFlakeClient(argv.apiUrl);
            const result = await client.heal(logPath, htmlPath);
            // ... generate output (duplicated code, should consolidate)
            if (result && result.status === 'success') {
                console.log("\n" + "=".repeat(40));
                console.log("✅ FIX SUGGESTED:");
                console.log("=".repeat(40));
                console.log(result.fix);
                console.log("=".repeat(40));
            } else {
                console.error("❌ Failed to get a fix.");
            }

        } else {
            console.error("❌ No log file found or command provided.");
            console.log("Usage:");
            console.log("  1. Wrap command: npx deflake npx playwright test");
            console.log("  2. Manual files: npx deflake --log error.log --html report.html");
            process.exit(1);
        }
    }
}

main();
