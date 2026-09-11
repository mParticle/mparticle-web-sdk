/**
 * mParticle Web SDK Integration Test Application
 * 
 * This test app initializes the mParticle SDK and sends test events
 * to a local WireMock instance for integration testing.
 * 
 * The app is designed to:
 * 1. Initialize the SDK with WireMock endpoints
 * 2. Perform identity calls
 * 3. Signal completion for automated test runners
 */

// ============================================================================
// Logging Utilities
// ============================================================================

const logElement = document.getElementById('log');
const statusElement = document.getElementById('status');

function log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    const prefix = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warn: '⚠️',
    }[type] || 'ℹ️';
    
    const line = document.createElement('div');
    line.className = `log-${type}`;
    line.textContent = `[${timestamp}] ${prefix} ${message}`;
    logElement.appendChild(line);
    logElement.scrollTop = logElement.scrollHeight;
    
    // Also log to console for Playwright to capture
    console.log(`[TEST] ${message}`);
}

function setStatus(message, type = 'running') {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
}

// ============================================================================
// Test Completion Signaling
// ============================================================================

// Global flag to signal test completion to Playwright
window.TEST_COMPLETE = false;
window.TEST_SUCCESS = false;
window.TEST_ERROR = null;

function signalTestComplete(success, error = null) {
    window.TEST_COMPLETE = true;
    window.TEST_SUCCESS = success;
    window.TEST_ERROR = error;
    
    if (success) {
        setStatus('✅ All tests completed successfully!', 'success');
        log('All tests completed successfully', 'success');
    } else {
        setStatus(`❌ Tests failed: ${error}`, 'error');
        log(`Tests failed: ${error}`, 'error');
    }
}

// ============================================================================
// SDK Configuration
// ============================================================================

function buildMParticleConfig() {
    const baseUrl = TEST_CONFIG.WIREMOCK_BASE;
    
    return {
        apiKey: TEST_CONFIG.API_KEY,
        secretKey: TEST_CONFIG.API_SECRET,
        
        // Point all endpoints to WireMock
        configUrl: `${baseUrl}/JS/v2/`,
        identityUrl: `${baseUrl}/v1/`,
        v1SecureServiceUrl: `${baseUrl}/v1/JS/`,
        v2SecureServiceUrl: `${baseUrl}/v2/JS/`,
        v3SecureServiceUrl: `${baseUrl}/v3/JS/`,
        aliasUrl: `${baseUrl}/v1/identity/`,
        
        // SDK configuration for testing
        isDevelopmentMode: true,
        logLevel: 'verbose',
        
        // Disable features that may interfere with testing
        useCookieStorage: false,
        
        // Identity request for initial identify call
        identifyRequest: {
            userIdentities: {
                email: TEST_CONFIG.TEST_USER.email,
                customerid: TEST_CONFIG.TEST_USER.customerId,
            },
        },
        
        // Callbacks
        identityCallback: function(result) {
            if (result.getUser()) {
                log(`Identity callback: MPID = ${result.getUser().getMPID()}`, 'success');
            } else {
                log('Identity callback: No user returned', 'warn');
            }
        },
    };
}

// ============================================================================
// Test Functions
// ============================================================================

/**
 * Test 1: SDK Initialization with Identity
 * This test initializes the SDK which triggers an identify call
 */
async function testIdentify() {
    log('Starting Test: SDK Initialization with Identity');
    
    return new Promise((resolve, reject) => {
        const config = buildMParticleConfig();
        
        // Add completion callback
        config.identityCallback = function(result) {
            if (result.getUser()) {
                const mpid = result.getUser().getMPID();
                log(`Identify successful: MPID = ${mpid}`, 'success');
                
                // Set a user attribute to verify the user object works
                result.getUser().setUserAttribute('test_attribute', 'test_value');
                log('Set user attribute: test_attribute = test_value', 'info');
                
                resolve({ mpid, user: result.getUser() });
            } else if (result.httpCode) {
                log(`Identify failed with HTTP code: ${result.httpCode}`, 'error');
                reject(new Error(`Identity failed: HTTP ${result.httpCode}`));
            } else {
                log('Identify returned no user', 'warn');
                resolve({ mpid: null, user: null });
            }
        };
        
        log(`Initializing SDK with API key: ${config.apiKey}`);
        log(`Config URL: https://${config.configUrl}`);
        log(`Identity URL: https://${config.identityUrl}`);
        
        try {
            window.mParticle.init(config.apiKey, config);
            log('mParticle.init() called', 'info');
        } catch (error) {
            log(`mParticle.init() threw error: ${error.message}`, 'error');
            reject(error);
        }
        
        // Timeout fallback
        setTimeout(() => {
            if (!window.mParticle.Identity.getCurrentUser()) {
                log('Identity call timed out', 'warn');
                resolve({ mpid: null, user: null, timeout: true });
            }
        }, TEST_CONFIG.INIT_TIMEOUT);
    });
}

/**
 * Test 2: Simple Custom Event
 * Logs a basic custom event with simple attributes
 * Equivalent to Apple SDK's testSimpleEvent()
 */
async function testSimpleEvent() {
    log('Starting Test: Simple Custom Event');
    
    try {
        // Log a simple event with basic attributes
        window.mParticle.logEvent(
            'Simple Event Name',
            window.mParticle.EventType.Other,
            { 'SimpleKey': 'SimpleValue' }
        );
        
        log('Logged simple event: "Simple Event Name"', 'success');
        
        // Trigger upload to ensure event is sent
        window.mParticle.upload();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { success: true };
    } catch (error) {
        log(`Simple event failed: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Test 3: Event with Custom Attributes and Flags
 * Logs an event with various attribute types and custom flags
 * Equivalent to Apple SDK's testEventWithCustomAttributesAndFlags()
 */
async function testEventWithCustomAttributesAndFlags() {
    log('Starting Test: Event with Custom Attributes and Flags');
    
    try {
        // Create custom attributes with various types
        const customAttributes = {
            'A_String_Key': 'A String Value',
            'A_Number_Key': 42,
            'A_Boolean_Key': true,
            'A_Date_Key': '2023-11-14T22:13:20Z', // Static date for deterministic testing
        };
        
        // Create custom flags (sent to mParticle but not forwarded to other providers)
        const customFlags = {
            'Not_forwarded_to_providers': 'Top Secret'
        };
        
        // Log event with attributes and flags
        window.mParticle.logEvent(
            'Event With Attributes',
            window.mParticle.EventType.Transaction,
            customAttributes,
            customFlags
        );
        
        log('Logged event with custom attributes and flags', 'success');
        log(`  Attributes: ${JSON.stringify(customAttributes)}`, 'info');
        log(`  Flags: ${JSON.stringify(customFlags)}`, 'info');
        
        // Trigger upload
        window.mParticle.upload();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { success: true };
    } catch (error) {
        log(`Event with attributes failed: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Test 4: Screen View / Page View
 * Logs a screen view event
 * Equivalent to Apple SDK's testLogScreen()
 */
async function testLogScreen() {
    log('Starting Test: Screen View');
    
    try {
        // Log a page view (screen view in web context)
        window.mParticle.logPageView(
            'Home Screen',
            { 'page_category': 'main', 'referrer': 'direct' }
        );
        
        log('Logged screen view: "Home Screen"', 'success');
        
        // Trigger upload
        window.mParticle.upload();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { success: true };
    } catch (error) {
        log(`Screen view failed: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Test 5: Commerce Event - Purchase
 * Logs a commerce purchase event with product and transaction details
 * Equivalent to Apple SDK's testCommerceEvent()
 */
async function testCommerceEvent() {
    log('Starting Test: Commerce Event (Purchase)');
    
    try {
        // Create a product
        const product = window.mParticle.eCommerce.createProduct(
            'Awesome Book',           // Name
            '1234567890',             // SKU
            9.99,                     // Price
            1,                        // Quantity
            'Fiction',                // Variant (optional)
            'Fiction',                // Category (optional)
            'A Publisher',            // Brand (optional)
            1,                        // Position (optional)
            'XYZ123'                  // Coupon Code (optional)
        );
        
        // Add custom attributes to product
        product['custom_key'] = 'custom_value';
        
        log(`Created product: ${product.Name} (SKU: ${product.Sku})`, 'info');
        
        // Create transaction attributes
        const transactionAttributes = {
            Id: 'zyx098',
            Affiliation: 'Book seller',
            Revenue: 12.09,
            Tax: 0.87,
            Shipping: 1.23,
            CouponCode: 'BOOK10'
        };
        
        // Create custom attributes for the commerce event
        const customAttributes = {
            'an_extra_key': 'an_extra_value'
        };
        
        // Log the purchase event
        window.mParticle.eCommerce.logProductAction(
            window.mParticle.ProductActionType.Purchase,
            [product],
            customAttributes,
            null,  // custom flags
            transactionAttributes
        );
        
        log('Logged commerce purchase event', 'success');
        log(`  Transaction ID: ${transactionAttributes.Id}`, 'info');
        log(`  Revenue: $${transactionAttributes.Revenue}`, 'info');
        
        // Trigger upload
        window.mParticle.upload();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { success: true };
    } catch (error) {
        log(`Commerce event failed: ${error.message}`, 'error');
        throw error;
    }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests() {
    setStatus('🚀 Running integration tests...', 'running');
    log('='.repeat(50));
    log('mParticle Web SDK Integration Tests');
    log('='.repeat(50));
    log(`WireMock endpoint: https://${TEST_CONFIG.WIREMOCK_BASE}`);
    log(`API Key: ${TEST_CONFIG.API_KEY}`);
    log('');
    
    try {
        // Test 1: Identity
        log('--- Test 1: Identity ---');
        const identifyResult = await testIdentify();
        
        if (identifyResult.timeout) {
            throw new Error('Identity call timed out');
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test 2: Simple Custom Event
        log('');
        log('--- Test 2: Simple Custom Event ---');
        await testSimpleEvent();
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test 3: Event with Custom Attributes and Flags
        log('');
        log('--- Test 3: Event with Attributes and Flags ---');
        await testEventWithCustomAttributesAndFlags();
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test 4: Screen View
        log('');
        log('--- Test 4: Screen View ---');
        await testLogScreen();
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test 5: Commerce Event
        log('');
        log('--- Test 5: Commerce Event (Purchase) ---');
        await testCommerceEvent();
        
        // Add a delay to ensure all network requests complete
        log('');
        log('Waiting for pending requests to complete...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force upload any pending events
        if (window.mParticle.upload) {
            log('Triggering final upload...');
            window.mParticle.upload();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        log('');
        log('='.repeat(50));
        signalTestComplete(true);
        
    } catch (error) {
        signalTestComplete(false, error.message);
    }
}

// ============================================================================
// Entry Point
// ============================================================================

// Start tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
} else {
    // Small delay to ensure all scripts are loaded
    setTimeout(runTests, 100);
}

