/**
 * Playwright script to run the mParticle Web SDK integration test app
 * in a headless browser and capture results.
 */

const { chromium } = require('playwright');

// Configuration
const TEST_APP_URL = process.env.TEST_APP_URL || 'http://localhost:3000/IntegrationTests/test-app/';
const TEST_TIMEOUT = parseInt(process.env.TEST_TIMEOUT || '30000', 10);
const MODE = process.argv[2] || 'verify'; // 'record' or 'verify'

async function runTest() {
    console.log('[BROWSER] Starting Playwright browser test...');
    console.log(`   Mode: ${MODE}`);
    console.log(`   URL: ${TEST_APP_URL}`);
    console.log(`   Timeout: ${TEST_TIMEOUT}ms`);
    console.log('');

    const browser = await chromium.launch({
        headless: true,
        args: [
            '--ignore-certificate-errors', // Accept self-signed WireMock cert
            '--allow-insecure-localhost',
        ],
    });

    const context = await browser.newContext({
        ignoreHTTPSErrors: true, // Accept self-signed certificates
    });

    const page = await context.newPage();

    // Capture console logs from the page
    page.on('console', (msg) => {
        const text = msg.text();
        if (text.includes('[TEST]')) {
            console.log(`   [LOG] ${text}`);
        }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
        console.error(`   [PAGE_ERROR] ${error.message}`);
    });

    // Capture failed requests (useful for debugging WireMock issues)
    page.on('requestfailed', (request) => {
        console.log(`   [REQUEST_FAILED] ${request.method()} ${request.url()}`);
        console.log(`      Failure: ${request.failure()?.errorText || 'Unknown'}`);
    });

    // Log successful requests to WireMock (for debugging)
    page.on('response', (response) => {
        const url = response.url();
        if (url.includes('127.0.0.1') || url.includes('localhost:8443')) {
            console.log(`   [RESPONSE] ${response.request().method()} ${url} -> ${response.status()}`);
        }
    });

    try {
        console.log('[BROWSER] Navigating to test app...');
        await page.goto(TEST_APP_URL, {
            waitUntil: 'networkidle',
            timeout: TEST_TIMEOUT,
        });

        console.log('[BROWSER] Waiting for tests to complete...');
        
        // Wait for TEST_COMPLETE flag to be set
        await page.waitForFunction(
            () => window.TEST_COMPLETE === true,
            { timeout: TEST_TIMEOUT }
        );

        // Get test results
        const testSuccess = await page.evaluate(() => window.TEST_SUCCESS);
        const testError = await page.evaluate(() => window.TEST_ERROR);

        console.log('');
        
        if (testSuccess) {
            console.log('[SUCCESS] Browser test completed successfully!');
            await browser.close();
            return 0;
        } else {
            console.log(`[FAILED] Browser test failed: ${testError}`);
            await browser.close();
            return 1;
        }

    } catch (error) {
        console.error('');
        console.error(`[ERROR] Browser test error: ${error.message}`);
        await browser.close();
        return 1;
    }
}

// Run the test
runTest()
    .then((exitCode) => {
        process.exit(exitCode);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
