#!/bin/bash
# Common functions for WireMock integration testing scripts
# Adapted from mparticle-apple-sdk for Web SDK

# ============================================================================
# Configuration
# ============================================================================

# WireMock configuration (can be overridden by scripts)
HTTP_PORT=${HTTP_PORT:-8080}
HTTPS_PORT=${HTTPS_PORT:-8443}
MAPPINGS_DIR=${MAPPINGS_DIR:-"./wiremock-recordings"}

# Test app configuration
TEST_APP_PORT=${TEST_APP_PORT:-3000}
TEST_APP_DIR="./test-app"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Global variables
HTTP_SERVER_PID=""
BROWSER_PID=""

# ============================================================================
# SDK Build Functions
# ============================================================================

build_sdk() {
    echo "[BUILD] Building mParticle Web SDK"
    
    cd "$SDK_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "[BUILD] Installing dependencies..."
        npm ci || { echo "[ERROR] npm install failed"; exit 1; }
    fi
    
    # Build the SDK
    echo "[BUILD] Running build..."
    npm run build || { echo "[ERROR] SDK build failed"; exit 1; }
    
    cd "$SCRIPT_DIR"
    
    echo "[BUILD] SDK built successfully at: $SDK_DIR/dist/mparticle.js"
}

# ============================================================================
# HTTP Server Functions
# ============================================================================

start_http_server() {
    echo "[SERVER] Starting HTTP server for test app..."
    
    cd "$SDK_DIR"
    
    # Check if http-server is available
    if ! command -v npx &> /dev/null; then
        echo "[ERROR] npx not found. Please install Node.js"
        exit 1
    fi
    
    # Start http-server in background, serving from SDK root so we can access both dist/ and IntegrationTests/
    npx http-server . -p $TEST_APP_PORT -c-1 --silent &
    HTTP_SERVER_PID=$!
    
    cd "$SCRIPT_DIR"
    
    # Wait for server to start
    echo "[SERVER] Waiting for HTTP server to start..."
    local MAX_RETRIES=30
    local RETRY_COUNT=0
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:${TEST_APP_PORT}/ | grep -q "200\|301\|302"; then
            echo "[SERVER] HTTP server is ready on port ${TEST_APP_PORT}"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        sleep 0.5
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "[ERROR] HTTP server failed to start"
        exit 1
    fi
}

stop_http_server() {
    echo "[SERVER] Stopping HTTP server..."
    
    if [ -n "$HTTP_SERVER_PID" ]; then
        # Kill the process (don't wait - it can hang)
        kill $HTTP_SERVER_PID 2>/dev/null || true
        # Give it a moment to die
        sleep 0.5
        # Force kill if still alive
        kill -9 $HTTP_SERVER_PID 2>/dev/null || true
        HTTP_SERVER_PID=""
    fi
    
    # Kill any orphaned http-server processes on our port
    pkill -f "http-server.*-p.*${TEST_APP_PORT}" 2>/dev/null || true
    
    # Extra safety: kill anything holding port 3000
    local pids=$(lsof -ti:${TEST_APP_PORT} 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
}

# ============================================================================
# Browser Functions (Playwright)
# ============================================================================

install_playwright() {
    echo "[PLAYWRIGHT] Checking Playwright installation..."
    
    cd "$SCRIPT_DIR"
    
    # Check if node_modules exists in IntegrationTests
    if [ ! -d "node_modules" ]; then
        echo "[PLAYWRIGHT] Installing IntegrationTests dependencies..."
        npm install || { echo "[ERROR] npm install failed"; exit 1; }
    fi
    
    # Install Playwright browsers if needed
    if ! npx playwright --version &> /dev/null; then
        echo "[PLAYWRIGHT] Installing Playwright browsers..."
        npx playwright install chromium || { echo "[ERROR] Playwright browser install failed"; exit 1; }
    fi
    
    echo "[PLAYWRIGHT] Playwright is ready"
}

run_test_in_browser() {
    local mode=${1:-"verify"}  # "record" or "verify"
    
    echo "[BROWSER] Running test app in headless browser (mode: $mode)..."
    
    cd "$SCRIPT_DIR"
    
    # Run the Playwright test script
    node run-browser-test.js "$mode" || {
        local exit_code=$?
        echo "[ERROR] Browser test failed with exit code: $exit_code"
        return $exit_code
    }
    
    echo "[BROWSER] Browser test completed"
}

# ============================================================================
# WireMock Functions
# ============================================================================

wait_for_wiremock() {
    echo "[WIREMOCK] Waiting for WireMock to start..."
    local MAX_RETRIES=30
    local RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        # Try HTTPS first (our primary endpoint), fall back to HTTP admin
        if curl -k -s -o /dev/null -w "%{http_code}" https://localhost:${HTTPS_PORT}/__admin/mappings 2>/dev/null | grep -q "200"; then
            echo "[WIREMOCK] WireMock is ready (HTTPS)!"
            break
        elif curl -s -o /dev/null -w "%{http_code}" http://localhost:${HTTP_PORT}/__admin/mappings 2>/dev/null | grep -q "200"; then
            echo "[WIREMOCK] WireMock is ready (HTTP)!"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "  Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 1
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "[ERROR] WireMock failed to start within ${MAX_RETRIES} seconds"
        exit 1
    fi
    
    echo ""
}

start_wiremock() {
    local mode=${1:-"verify"}  # "record" or "verify"
    
    if [ "$mode" = "record" ]; then
        echo "[WIREMOCK] Starting WireMock container in recording mode..."
    else
        echo "[WIREMOCK] Starting WireMock container in verification mode..."
    fi
    
    stop_wiremock
    
    # Ensure mappings directory exists
    mkdir -p "${MAPPINGS_DIR}/mappings"
    mkdir -p "${MAPPINGS_DIR}/__files"
    mkdir -p "${MAPPINGS_DIR}/proxies"
    
    # Handle proxy and stub files based on mode
    if [ "$mode" = "record" ]; then
        # Recording mode: 
        # 1. Move existing stubs aside (so they don't intercept requests)
        # 2. Copy proxy files into mappings (so requests go to real servers)
        echo "[WIREMOCK] Preparing for recording mode..."
        
        # Create backup directory for existing stubs
        mkdir -p "${MAPPINGS_DIR}/stubs-backup"
        
        # Move existing mapping-*.json stubs to backup (except auto-generated ones with random suffixes)
        for f in "${MAPPINGS_DIR}/mappings/"mapping-*.json; do
            if [ -f "$f" ]; then
                mv "$f" "${MAPPINGS_DIR}/stubs-backup/" 2>/dev/null || true
            fi
        done
        echo "[WIREMOCK] Existing stubs moved to stubs-backup/"
        
        # Copy proxy files into mappings
        echo "[WIREMOCK] Loading proxy configurations for recording..."
        cp "${MAPPINGS_DIR}/proxies/"proxy-*.json "${MAPPINGS_DIR}/mappings/" 2>/dev/null || true
    else
        # Verification mode: 
        # 1. Restore stubs from backup if they exist
        # 2. Remove proxy files from mappings
        echo "[WIREMOCK] Preparing for verification mode..."
        
        # Restore stubs from backup if backup exists
        if [ -d "${MAPPINGS_DIR}/stubs-backup" ] && [ "$(ls -A ${MAPPINGS_DIR}/stubs-backup 2>/dev/null)" ]; then
            echo "[WIREMOCK] Restoring stubs from backup..."
            mv "${MAPPINGS_DIR}/stubs-backup/"*.json "${MAPPINGS_DIR}/mappings/" 2>/dev/null || true
            rmdir "${MAPPINGS_DIR}/stubs-backup" 2>/dev/null || true
        fi
        
        # Remove proxy files from mappings
        echo "[WIREMOCK] Removing proxy configurations for strict verification..."
        rm -f "${MAPPINGS_DIR}/mappings/"proxy-*.json 2>/dev/null || true
    fi
    
    # Base docker command
    local docker_cmd="docker run -d --name ${CONTAINER_NAME} \
        -p ${HTTP_PORT}:8080 \
        -p ${HTTPS_PORT}:8443 \
        -v \"$(pwd)/${MAPPINGS_DIR}\":/home/wiremock \
        wiremock/wiremock:3.9.1 \
        --https-port 8443"
    
    # Add mode-specific parameters
    if [ "$mode" = "record" ]; then
        # Recording mode: use proxy mappings (proxy-*.json) to route to real servers
        # and record the actual request/response pairs
        docker_cmd="${docker_cmd} \
            --enable-browser-proxying \
            --preserve-host-header \
            --record-mappings \
            --verbose"
    else
        # Verification mode: use stored mappings to match requests
        docker_cmd="${docker_cmd} \
            --verbose"
    fi
    
    # Execute docker command
    eval $docker_cmd || {
        echo "[ERROR] Failed to start WireMock container"
        exit 1
    }
}

show_wiremock_logs() {
    echo ""
    echo "[WIREMOCK] Container logs:"
    echo "================================================================"
    docker logs ${CONTAINER_NAME} 2>&1 || echo "[ERROR] Could not retrieve container logs"
    echo "================================================================"
    echo ""
}

stop_wiremock() {
    echo "[WIREMOCK] Stopping WireMock containers..."
    
    # Stop the current script's container (with timeout)
    if [ -n "${CONTAINER_NAME}" ]; then
        docker stop -t 2 ${CONTAINER_NAME} 2>/dev/null || true
        docker rm -f ${CONTAINER_NAME} 2>/dev/null || true
    fi
    
    # Also stop ANY wiremock container that might be using our ports
    # This handles the case where recorder was run but verify is starting
    docker stop -t 2 wiremock-recorder 2>/dev/null || true
    docker rm -f wiremock-recorder 2>/dev/null || true
    docker stop -t 2 wiremock-verify 2>/dev/null || true
    docker rm -f wiremock-verify 2>/dev/null || true
    
    # Kill any process holding our ports (extra safety, only if something is there)
    local http_pids=$(lsof -ti:${HTTP_PORT} 2>/dev/null)
    if [ -n "$http_pids" ]; then
        echo "$http_pids" | xargs kill -9 2>/dev/null || true
    fi
    
    local https_pids=$(lsof -ti:${HTTPS_PORT} 2>/dev/null)
    if [ -n "$https_pids" ]; then
        echo "$https_pids" | xargs kill -9 2>/dev/null || true
    fi
    
    echo "[WIREMOCK] Cleanup complete"
}

# ============================================================================
# Verification Functions
# ============================================================================

verify_wiremock_results() {
    echo ""
    echo "[VERIFY] Verifying WireMock results..."
    echo ""
    
    local WIREMOCK_PORT=${HTTP_PORT}
    
    # Count all requests
    local TOTAL=$(curl -s http://localhost:${WIREMOCK_PORT}/__admin/requests | jq '.requests | length')
    local UNMATCHED=$(curl -s http://localhost:${WIREMOCK_PORT}/__admin/requests/unmatched | jq '.requests | length')
    local MATCHED=$((TOTAL - UNMATCHED))
    
    echo "[VERIFY] WireMock summary:"
    echo "--------------------------------"
    echo "  Total requests:     $TOTAL"
    echo "  Matched requests:   $MATCHED"
    echo "  Unmatched requests: $UNMATCHED"
    echo "--------------------------------"
    echo ""
    
    # Check for unmatched requests
    if [ "$UNMATCHED" -gt 0 ]; then
        echo "[ERROR] Found requests that did not match any mappings:"
        curl -s http://localhost:${WIREMOCK_PORT}/__admin/requests/unmatched | \
            jq -r '.requests[] | "  [\(.method)] \(.url)"'
        echo ""
        show_wiremock_logs
        return 1
    else
        echo "[SUCCESS] All incoming requests matched their mappings."
    fi
    
    # Check for unused mappings
    echo ""
    echo "[VERIFY] Checking: were all mappings invoked..."
    
    # Get all non-proxy mapping URLs from files
    local EXPECTED_MAPPINGS=$(jq -r 'select(.response.proxyBaseUrl == null) | "\(.request.method // "ANY") \(.request.url // .request.urlPattern // .request.urlPath // .request.urlPathPattern)"' ${MAPPINGS_DIR}/mappings/*.json 2>/dev/null | sort)
    
    # Get all actual request URLs
    local ACTUAL_REQUESTS=$(curl -s http://localhost:${WIREMOCK_PORT}/__admin/requests | \
        jq -r '.requests[] | "\(.request.method) \(.request.url)"' | sort | uniq)
    
    # Check each expected mapping
    local UNUSED_FOUND=false
    while IFS= read -r mapping; do
        if [ -n "$mapping" ]; then
            local method=$(echo "$mapping" | awk '{print $1}')
            local url=$(echo "$mapping" | awk '{$1=""; print $0}' | sed 's/^ //')
            
            # Check if mapping was used
            local matched=false
            
            # For patterns, check by comparing base structure
            if echo "$url" | grep -q '\[' || echo "$url" | grep -q '\\'; then
                local url_start=$(echo "$url" | cut -d'[' -f1 | cut -d'\' -f1)
                
                if echo "$ACTUAL_REQUESTS" | grep -Fq "$method $url_start"; then
                    matched=true
                fi
            else
                if echo "$ACTUAL_REQUESTS" | grep -Fq "$mapping"; then
                    matched=true
                fi
            fi
            
            if [ "$matched" = false ]; then
                if [ "$UNUSED_FOUND" = false ]; then
                    echo "[WARNING] Some mappings were not invoked by the application:"
                    UNUSED_FOUND=true
                fi
                echo "  $mapping"
            fi
        fi
    done <<< "$EXPECTED_MAPPINGS"
    
    if [ "$UNUSED_FOUND" = false ]; then
        echo "[SUCCESS] All recorded mappings were invoked by the application."
    fi
    
    echo ""
    echo "[SUCCESS] Verification completed successfully!"
    return 0
}

# ============================================================================
# Cleanup Functions
# ============================================================================

cleanup() {
    echo ""
    echo "[CLEANUP] Cleaning up..."
    stop_http_server
    stop_wiremock
    echo "[CLEANUP] Done"
}

trap cleanup EXIT INT TERM
