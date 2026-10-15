#!/bin/bash
# Script for recording mParticle Web SDK API requests using WireMock
# Adapted from mparticle-apple-sdk for Web SDK

set -e

# ============================================================================
# Configuration
# ============================================================================

HTTP_PORT=${1:-8080}
HTTPS_PORT=${2:-8443}
MAPPINGS_DIR=${3:-"./wiremock-recordings"}
TARGET_URL=${4:-"https://identity.mparticle.com"}

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Container name for this script
CONTAINER_NAME="wiremock-recorder"

# ============================================================================
# Main Execution
# ============================================================================

echo ""
echo "================================================================"
echo "  mParticle Web SDK - WireMock Recording Mode"
echo "================================================================"
echo ""

# Step 1: Build SDK
build_sdk

# Step 2: Install Playwright
install_playwright

# Step 3: Prepare mappings directory
mkdir -p "${MAPPINGS_DIR}/mappings"
mkdir -p "${MAPPINGS_DIR}/__files"

# Step 4: Start WireMock in recording mode
start_wiremock "record"
wait_for_wiremock

echo "[INFO] WireMock is running and recording traffic to: ${MAPPINGS_DIR}"
echo "[INFO] Admin UI: http://localhost:${HTTP_PORT}/__admin"
echo "[INFO] HTTPS Proxy: https://localhost:${HTTPS_PORT}"
echo ""

# Step 5: Start HTTP server for test app
start_http_server

echo "[INFO] Test app available at: http://localhost:${TEST_APP_PORT}/IntegrationTests/test-app/"
echo ""

# Step 6: Run test in browser
echo "[BROWSER] Running test app in browser..."
run_test_in_browser "record"

# Step 7: Show recorded files
echo ""
echo "[INFO] Recorded files:"
echo "--------------------------------"
if [ -d "${MAPPINGS_DIR}/mappings" ]; then
    ls -la "${MAPPINGS_DIR}/mappings/" 2>/dev/null || echo "  No mapping files yet"
fi
echo ""

# Step 8: Restore original stubs
echo "[RESTORE] Restoring original stub mappings..."
if [ -d "${MAPPINGS_DIR}/stubs-backup" ] && [ "$(ls -A ${MAPPINGS_DIR}/stubs-backup 2>/dev/null)" ]; then
    mv "${MAPPINGS_DIR}/stubs-backup/"*.json "${MAPPINGS_DIR}/mappings/" 2>/dev/null || true
    rmdir "${MAPPINGS_DIR}/stubs-backup" 2>/dev/null || true
    echo "[RESTORE] Stubs restored"
fi

# Step 9: Remove proxy files from mappings (cleanup)
rm -f "${MAPPINGS_DIR}/mappings/"proxy-*.json 2>/dev/null || true

echo ""
echo "[SUCCESS] Recording complete!"
echo ""
echo "Next steps:"
echo "  1. Review NEW recorded mappings in ${MAPPINGS_DIR}/mappings/ (files with random suffixes)"
echo "  2. Sanitize API keys: python3 sanitize_mapping.py <mapping_file> --test-name <name>"
echo "  3. Transform request bodies: python3 transform_mapping_body.py <mapping_file> unescape+update"
echo "  4. Revert test-config.js to use placeholder API key"
echo "  5. Run ./run_clean_integration_tests.sh to verify"
echo ""
