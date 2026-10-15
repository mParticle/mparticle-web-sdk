# Integration Tests

Recording mParticle Web SDK API requests using WireMock for integration testing.

## Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Docker** (for running WireMock locally)
- **Python 3** (for mapping transformation scripts)

### Install Dependencies

```bash
cd IntegrationTests
npm install
```

This will install:
- **Playwright** - Headless browser for running tests
- **http-server** - Local HTTP server for serving the test app

### Install Playwright Browsers

```bash
npx playwright install chromium
```

## Overview

This project provides tools for integration testing the mParticle Web SDK by:
- Building the mParticle Web SDK from source
- Running a minimal test web application in a headless browser
- Recording/verifying all API traffic with WireMock

The framework supports two modes:
1. **Recording Mode** - Captures SDK network requests to create baseline mappings
2. **Verification Mode** - Validates SDK requests against stored baselines

## Directory Structure

```
IntegrationTests/
├── common.sh                    # Shared shell functions
├── run_wiremock_recorder.sh     # Recording mode script
├── run_clean_integration_tests.sh # Verification mode script
├── run-browser-test.js          # Playwright browser test runner
├── sanitize_mapping.py          # API key sanitization script
├── transform_mapping_body.py    # Request body transformation script
├── package.json                 # Node.js dependencies
├── README.md                    # This file
├── test-app/                    # Test web application
│   ├── index.html              # HTML page
│   ├── test-app.js             # Test logic
│   └── test-config.js          # WireMock endpoint configuration
└── wiremock-recordings/         # Baseline mappings
    ├── mappings/               # Request/response mapping files
    └── __files/                # Response body files
```

## Available Scripts

### `run_wiremock_recorder.sh` - Record API Requests

Records all mParticle SDK API requests using WireMock for later use in integration testing.

```bash
./run_wiremock_recorder.sh
```

**What it does:**
1. Builds mParticle Web SDK from source (`npm run build`)
2. Installs Playwright and dependencies
3. Starts WireMock container in recording mode
4. Starts local HTTP server for test app
5. Runs test app in headless Chromium browser
6. Records all API traffic to mapping files
7. Displays recorded files

**Recorded Files:**
- `wiremock-recordings/mappings/*.json` - API request/response mappings
- `wiremock-recordings/__files/*` - Response body files

### `run_clean_integration_tests.sh` - Verify Against Baselines

Runs the test app and verifies all requests match the stored baseline mappings.

```bash
./run_clean_integration_tests.sh
```

**What it does:**
1. Builds mParticle Web SDK from source
2. Escapes mapping bodies for WireMock compatibility
3. Starts WireMock in verification mode with stored mappings
4. Runs test app in headless browser
5. Verifies all requests matched mappings
6. Verifies all mappings were invoked
7. Returns exit code 1 on any verification failure

**Exit Codes:**
- `0` - All tests passed
- `1` - Verification failed (unmatched requests or unused mappings)

### `sanitize_mapping.py` - Remove API Keys

Sanitizes WireMock mapping files by replacing API keys with regex patterns.

```bash
python3 sanitize_mapping.py <mapping_file> --test-name <name>
```

**Example:**
```bash
python3 sanitize_mapping.py \
  wiremock-recordings/mappings/mapping-v1-us1-abc123-identify.json \
  --test-name identify
```

**What it does:**
- Replaces API keys in URLs with regex pattern `us1-[a-f0-9]+`
- Renames mapping file to `mapping-{test-name}.json`
- Renames body file to `body-{test-name}.json`
- Updates all references in the mapping JSON

### `transform_mapping_body.py` - Transform Request Bodies

Transforms request body JSON in WireMock mappings.

```bash
# Display as readable JSON
python3 transform_mapping_body.py <mapping_file> unescape

# Convert back to escaped string (WireMock format)
python3 transform_mapping_body.py <mapping_file> escape

# Replace dynamic fields and save
python3 transform_mapping_body.py <mapping_file> unescape+update
```

**Modes:**
- `unescape` - Convert escaped string to formatted JSON object
- `escape` - Convert JSON object back to escaped string
- `unescape+update` - Parse, replace dynamic fields with `${json-unit.ignore}`, and save

**Dynamic fields replaced:**
- `session_id`, `timestamp_unixtime_ms`, `ct`, `est`, `sct`
- `id`, `mpid`, `das`, `sdk_version`, `client_generated_id`
- And more (see script for full list)

## Development Workflow

### Initial Recording of API Requests

⚠️ **Important**: Recording requires a **real mParticle API key** and **Docker**.

#### Step 1: Configure Real API Key (Temporarily)

Edit `test-app/test-config.js` and replace the placeholder with your real API key:

```javascript
// TEMPORARILY set your real API key for recording
API_KEY: 'us1-YOUR_REAL_API_KEY_HERE',  // Replace with actual key
```

#### Step 2: Run the WireMock Recorder

From your **local terminal** (not Cursor terminal, to access Docker):

```bash
cd IntegrationTests
./run_wiremock_recorder.sh
```

This will:
- Build the SDK
- Start WireMock in recording mode
- Run all tests in a headless browser
- Save recordings to `wiremock-recordings/mappings/`

#### Step 3: Process the Recordings

Sanitize and transform each recorded mapping:

```bash
# Sanitize API keys and rename
python3 sanitize_mapping.py \
  wiremock-recordings/mappings/mapping-xxx.json \
  --test-name identify

# Transform request bodies
python3 transform_mapping_body.py \
  wiremock-recordings/mappings/mapping-identify.json \
  unescape+update
```

#### Step 4: Revert API Key to Placeholder

**Critical**: After recording, restore the placeholder in `test-config.js`:

```javascript
API_KEY: 'us1-test0000000000000000000000000',  // Placeholder restored
```

#### Step 5: Verify and Commit

```bash
# Test with placeholder key
./run_clean_integration_tests.sh

# If tests pass, commit
git add wiremock-recordings/ test-app/test-config.js
git commit -m "Add sanitized baseline mappings"
```

### Running Integration Tests

```bash
./run_clean_integration_tests.sh
```

The script will:
1. Rebuild the SDK with latest changes
2. Run tests against stored baselines
3. Report any mismatches
4. Exit with code 1 if verification fails

## Test App Configuration

The test app is configured via `test-app/test-config.js`:

```javascript
const TEST_CONFIG = {
    WIREMOCK_HOST: '127.0.0.1',
    WIREMOCK_HTTPS_PORT: '8443',
    API_KEY: 'us1-test0000000000000000000000000',
    API_SECRET: 'test-secret-key',
    // ...
};
```

This configuration:
- Points all SDK endpoints to local WireMock (`127.0.0.1:8443`)
- Uses a test API key (will be sanitized in recordings)
- Works identically in local development and CI environments

## Adding New Tests

1. **Add test function** in `test-app/test-app.js`:
   ```javascript
   async function testMyNewFeature() {
       log('Starting Test: My New Feature');
       // Call SDK methods
       mParticle.logEvent('Test Event', mParticle.EventType.Other);
       await waitForUpload();
       log('Test complete', 'success');
   }
   ```

2. **Call the test** in `runTests()`:
   ```javascript
   async function runTests() {
       // ... existing tests
       await testMyNewFeature();
   }
   ```

3. **Record new baselines:**
   ```bash
   ./run_wiremock_recorder.sh
   ```

4. **Sanitize and commit** the new mappings.

## Current Test Coverage

| Test | Description | Status |
|------|-------------|--------|
| Identity | SDK initialization with identify call | Implemented |
| Simple Event | `logEvent()` with basic attributes | Implemented |
| Event with Attributes & Flags | `logEvent()` with custom flags | Implemented |
| Screen View | `logPageView()` | Implemented |
| Commerce Event | `eCommerce.logProductAction()` purchase | Implemented |

### Test Details

1. **Identity** (`testIdentify`)
   - Initializes SDK with `identifyRequest`
   - Verifies MPID is returned
   - Sets user attribute

2. **Simple Event** (`testSimpleEvent`)
   - Logs `"Simple Event Name"` event
   - Includes `{ SimpleKey: "SimpleValue" }` attributes

3. **Event with Attributes & Flags** (`testEventWithCustomAttributesAndFlags`)
   - Logs `"Event With Attributes"` event
   - Includes string, number, boolean, date attributes
   - Includes custom flags (not forwarded to providers)

4. **Screen View** (`testLogScreen`)
   - Logs `"Home Screen"` page view
   - Includes page category and referrer

5. **Commerce Event** (`testCommerceEvent`)
   - Creates product ("Awesome Book", SKU: 1234567890)
   - Logs purchase action with transaction attributes
   - Includes revenue, tax, shipping, coupon code

