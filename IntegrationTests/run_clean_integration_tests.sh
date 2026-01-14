#!/bin/bash
# Script for running mParticle Web SDK integration tests with WireMock verification
# Adapted from mparticle-apple-sdk for Web SDK

set -e

# ============================================================================
# Configuration
# ============================================================================

HTTP_PORT=${1:-8080}
HTTPS_PORT=${2:-8443}
MAPPINGS_DIR=${3:-"./wiremock-recordings"}

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Container name for this script
CONTAINER_NAME="wiremock-verify"

# ============================================================================
# Mapping Body Transformation Functions
# ============================================================================

escape_mapping_bodies() {
    echo "[TRANSFORM] Converting mapping bodies to escaped format (WireMock-compatible)..."
    local MAPPINGS_FILES="${MAPPINGS_DIR}/mappings"
    
    if [ -d "$MAPPINGS_FILES" ] && [ "$(ls -A $MAPPINGS_FILES/*.json 2>/dev/null)" ]; then
        for mapping_file in "$MAPPINGS_FILES"/*.json; do
            if [ -f "$mapping_file" ]; then
                python3 transform_mapping_body.py "$mapping_file" escape > /dev/null 2>&1 || {
                    echo "[WARNING] Failed to escape $(basename $mapping_file)"
                }
            fi
        done
        echo "[TRANSFORM] Mapping bodies escaped"
    else
        echo "[INFO] No mapping files found to escape"
    fi
}

unescape_mapping_bodies() {
    echo "[TRANSFORM] Converting mapping bodies back to unescaped format (readable)..."
    local MAPPINGS_FILES="${MAPPINGS_DIR}/mappings"
    
    if [ -d "$MAPPINGS_FILES" ] && [ "$(ls -A $MAPPINGS_FILES/*.json 2>/dev/null)" ]; then
        for mapping_file in "$MAPPINGS_FILES"/*.json; do
            if [ -f "$mapping_file" ]; then
                python3 transform_mapping_body.py "$mapping_file" unescape > /dev/null 2>&1 || {
                    echo "[WARNING] Failed to unescape $(basename $mapping_file)"
                }
            fi
        done
        echo "[TRANSFORM] Mapping bodies unescaped"
    else
        echo "[INFO] No mapping files found to unescape"
    fi
}

# ============================================================================
# Error Handling
# ============================================================================

# Custom cleanup that also unescapes mappings
cleanup_with_unescape() {
    unescape_mapping_bodies
    cleanup
}

# Error handler that shows logs before cleanup
error_handler() {
    local exit_code=$?
    echo ""
    echo "[ERROR] Script failed with exit code: $exit_code"
    show_wiremock_logs
    unescape_mapping_bodies
    stop_http_server
    stop_wiremock
    exit $exit_code
}

# Override trap from common.sh
trap cleanup_with_unescape EXIT INT TERM
trap error_handler ERR

# ============================================================================
# Main Execution
# ============================================================================

echo ""
echo "================================================================"
echo "  mParticle Web SDK - Integration Test Verification"
echo "================================================================"
echo ""

# Step 1: Build SDK
build_sdk

# Step 2: Install Playwright
install_playwright

# Step 3: Escape mapping bodies for WireMock
escape_mapping_bodies

# Step 4: Start WireMock in verification mode
start_wiremock "verify"
wait_for_wiremock

echo "[INFO] WireMock is running in verification mode"
echo "[INFO] Admin UI: http://localhost:${HTTP_PORT}/__admin"
echo "[INFO] HTTPS Endpoint: https://localhost:${HTTPS_PORT}"
echo ""

# Step 5: Start HTTP server for test app
start_http_server

echo "[INFO] Test app available at: http://localhost:${TEST_APP_PORT}/IntegrationTests/test-app/"
echo ""

# Step 6: Run test in browser
echo "[TEST] Running integration tests..."
run_test_in_browser "verify"

# Step 7: Verify WireMock results
verify_wiremock_results
VERIFY_RESULT=$?

# Step 8: Unescape mapping bodies (restore readable format)
unescape_mapping_bodies

# Step 9: Cleanup
stop_http_server
stop_wiremock

# Exit with verification result
if [ $VERIFY_RESULT -ne 0 ]; then
    echo ""
    echo "[FAILED] Integration tests FAILED"
    exit 1
fi

echo ""
echo "[PASSED] Integration tests PASSED"
exit 0
