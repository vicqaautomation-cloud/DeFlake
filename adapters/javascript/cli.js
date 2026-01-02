#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const DeFlakeClient = require('./client');

const argv = yargs(hideBin(process.argv))
    .option('log', {
        alias: 'l',
        type: 'string',
        description: 'Path to the error log file',
        demandOption: true
    })
    .option('html', {
        alias: 'h',
        type: 'string',
        description: 'Path to the HTML snapshot',
        demandOption: true
    })
    .option('api-url', {
        type: 'string',
        description: 'Override Default API URL',
    })
    .help()
    .argv;

async function main() {
    console.log("🚑 DeFlake JS Client (Secure Mode)");

    const client = new DeFlakeClient(argv.apiUrl);

    console.log("🧠 Consulting the Cloud Brain...");
    const result = await client.heal(argv.log, argv.html);

    if (result && result.status === 'success') {
        console.log("\n" + "=".repeat(40));
        console.log("✅ FIX SUGGESTED:");
        console.log("=".repeat(40));
        console.log(result.fix);
        console.log("=".repeat(40));
    } else {
        console.error("❌ Failed to get a fix.");
    }
}

main();
