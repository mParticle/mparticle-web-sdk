/**
 * Test Configuration for mParticle Web SDK Integration Tests
 * 
 * This file contains configuration for pointing the SDK to WireMock
 * for integration testing. Modify these values if you need to change
 * the WireMock endpoint or API credentials.
 * 
 * IMPORTANT FOR RECORDING MODE:
 * When running ./run_wiremock_recorder.sh, you MUST use a REAL mParticle
 * API key to record against production servers. The fake test key will
 * result in 401 errors.
 * 
 * For VERIFICATION MODE (./run_clean_integration_tests.sh), the test key
 * works fine since responses come from stored WireMock mappings.
 */

const TEST_CONFIG = {
    // WireMock server configuration
    WIREMOCK_HOST: '127.0.0.1',
    WIREMOCK_HTTP_PORT: '8080',
    WIREMOCK_HTTPS_PORT: '8443',
    
    // For RECORDING: Replace with your REAL mParticle API key
    // For VERIFICATION: Use placeholder (stub mappings will match)
    API_KEY: 'us1-test0000000000000000000000000',
    API_SECRET: 'test-secret-key',
    
    // Test user identities
    TEST_USER: {
        email: 'test@example.com',
        customerId: 'test-customer-123',
    },
    
    // Timeouts (in milliseconds)
    INIT_TIMEOUT: 5000,
    EVENT_TIMEOUT: 3000,
};

// Build WireMock base URL (without protocol - SDK adds https://)
TEST_CONFIG.WIREMOCK_BASE = `${TEST_CONFIG.WIREMOCK_HOST}:${TEST_CONFIG.WIREMOCK_HTTPS_PORT}`;

// Export for use in test-app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TEST_CONFIG;
}

