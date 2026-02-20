# mParticle Web SDK - Agent Instructions

This file provides guidance for AI coding agents working with the mParticle Web SDK codebase.

---

<!-- ============================================ -->
<!-- COMMON SECTION - Keep synced across all SDKs -->
<!-- Last Updated: 2026-02-16 -->
<!-- ============================================ -->

## About mParticle SDKs

mParticle is a Customer Data Platform that collects, validates, and forwards event data to analytics and marketing integrations. The SDK is responsible for:

- **Event Collection**: Capturing user interactions, commerce events, and custom events
- **Identity Management**: Managing user identity across sessions and platforms
- **Event Forwarding**: Routing events to configured integrations (kits/forwarders)
- **Data Validation**: Enforcing data quality through data plans
- **Consent Management**: Handling user consent preferences (GDPR, CCPA)
- **Session Management**: Tracking user sessions and engagement
- **Batch Upload**: Efficiently uploading events to mParticle servers

### Glossary of Terms

- **MPID (mParticle ID)**: Unique identifier for a user across sessions and devices
- **Kit/Forwarder**: Third-party integration (e.g., Google Analytics, Braze) that receives events from the SDK
- **Data Plan**: Validation schema that defines expected events and their attributes
- **Workspace**: A customer's mParticle environment (identified by API key)
- **Batch**: Collection of events grouped together for efficient server upload
- **Identity Request**: API call to identify, login, logout, or modify a user's identity
- **Session**: Period of user activity with automatic timeout (typically 30 minutes)
- **Consent State**: User's privacy preferences (GDPR, CCPA) that control data collection and forwarding
- **User Attributes**: Key-value pairs describing user properties (e.g., email, age, preferences)
- **Custom Events**: Application-specific events defined by the developer
- **Commerce Events**: Predefined events for e-commerce tracking (purchases, product views, etc.)
- **Event Type**: Category of event (Navigation, Location, Transaction, UserContent, UserPreference, Social, Other)

## General Development Guidelines

### Before Making Changes

1. **Read First, Modify Later**: Always read relevant files before proposing changes. Use the Read tool to understand existing code, patterns, and conventions.
2. **Understand the Architecture**: Review the instance-based architecture and module structure before adding features. Check `ARCHITECTURE.md` if available for architectural diagrams and design patterns.
3. **Review Contributing Guidelines**: Check `CONTRIBUTING.md` for repository-specific contribution guidelines, workflow, and standards.
4. **Check Existing Tests**: Look at test files for usage examples and to understand expected behavior.
5. **Review Constants**: Check the constants file(s) for standard values, messages, and configuration options.

### Code Quality Standards

- **Security First**: Prevent injection vulnerabilities (XSS, command injection, etc.)
- **Avoid Over-Engineering**: Only make changes that are directly requested or clearly necessary
- **No Premature Abstractions**: Don't create helpers or utilities for one-time operations
- **Keep It Simple**: Three similar lines of code is better than a premature abstraction
- **No Unnecessary Features**: Don't add error handling for scenarios that can't happen
- **Trust Internal Code**: Only validate at system boundaries (user input, external APIs)

### Testing Requirements

- Run the full test suite before committing
- Add tests for new features or bug fixes
- Test both success and error cases
- Use existing test patterns as examples
- Ensure tests pass in all supported environments

### Git Commit Standards

This repository uses **Conventional Commits** for semantic versioning:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

**Commit Types:**
- `feat` → Triggers minor version bump (new feature)
- `fix` → Triggers patch version bump (bug fix)
- `docs` → Documentation changes
- `test` → Adding or updating tests
- `refactor` → Code refactoring without behavior changes
- `perf` → Performance improvements
- `style` → Code style changes (formatting, etc.)
- `chore` → Maintenance tasks
- `ci` → CI/CD changes
- `build` → Build system changes
- `revert` → Reverting previous commits

**Breaking Changes:**
```
feat: new API for identity management

BREAKING CHANGE: Identity.login() now requires a callback parameter
```

**Examples:**
```
feat: add consent state filtering for forwarders
fix: prevent duplicate events in batch upload
docs: update API reference for eCommerce methods
test: add cross-browser tests for identity API
```

### Pull Request Guidelines

- Create PRs against the `master` branch
- Ensure all CI checks pass
- Include test coverage for changes
- Reference any related issues
- Follow the commit message format throughout the branch

## Common API Patterns

### Core Modules

All SDKs should provide these core modules:

1. **Identity**: User identification, login, logout, modify
2. **Events**: Event logging with custom attributes
3. **eCommerce**: Commerce event tracking (purchases, product views, etc.)
4. **Consent**: User consent state management
5. **Session**: Session lifecycle management
6. **Configuration**: SDK configuration and feature flags

### Data Flow Architecture

```
Event Logged → Validation → Consent Check → Kit Forwarding → Batch Upload
                  ↓              ↓               ↓              ↓
            Data Plan      Consent State   Active Kits    API Client
```

### Configuration Cascade

```
Initial Config (provided by developer)
  ↓
SDK Config (normalized and validated)
  ↓
Server Config (merged from mParticle servers)
  ↓
Feature Flags & Kit Configs (runtime)
```

---

<!-- ============================================ -->
<!-- WEB PLATFORM SPECIFIC SECTION -->
<!-- ============================================ -->

## Web SDK Architecture

### Tech Stack

- **Languages**: TypeScript and JavaScript
- **Build Tool**: Rollup with multiple output formats:
  - IIFE (Immediately Invoked Function Expression) for browser `<script>` tags
  - CommonJS for npm/Node.js environments
  - ES Modules for modern bundlers with tree-shaking support
  - Stub for capturing API calls before SDK loads
- **Testing**: Karma (browser integration), Jest (TypeScript modules), BrowserStack (cross-browser)
- **Code Quality**: ESLint, Prettier, GTS (Google TypeScript Style)
- **Package Manager**: npm

### Project Structure

```
/                                       # Repo root
  jest.config.js                        # Jest config for TypeScript unit tests
/src/                                   # Source code
  ├── mparticle-instance-manager.ts  # Global manager, creates and retrieves named SDK instances
  ├── mp-instance.ts            # Core SDK instance, initialization flow, public APIs, and private modules
  ├── apiClient.ts              # HTTP client for making requests to mParticle Events API
  ├── batchUploader.ts          # Batches events and uploads them to server with retry logic
  ├── identityApiClient.ts      # Handles identity API calls (identify, login, logout, modify)
  ├── configAPIClient.ts        # Fetches SDK configuration and kit settings from server
  ├── identity.js               # User identity operations, MPID management, and identity callbacks
  ├── identity-utils.ts         # Identity request validation and preprocessing helpers
  ├── events.js                 # Event logging, validation, and processing before forwarding
  ├── ecommerce.js              # Commerce event creation (purchases, product views, promotions)
  ├── forwarders.js             # Manages third-party kits, event forwarding, and filtering rules
  ├── kitBlocking.ts            # Blocks events from kits based on data plan violations
  ├── integrationCapture.ts     # Captures integration-specific events and metadata
  ├── consent.ts                # GDPR/CCPA consent state management and filtering
  ├── cookieConsentManager.ts   # Cookie-specific consent management and compliance
  ├── sessionManager.ts         # Session creation, timeout tracking, and session ID generation
  ├── roktManager.ts            # Bridge to Rokt services (selectPlacements, placement rendering)
  ├── store.ts                  # In-memory runtime state (config, flags, session data)
  ├── persistence.js            # LocalStorage and cookie read/write operations
  ├── cookieSyncManager.ts      # Synchronizes user data across domains via cookies
  ├── validators.ts             # Input validation for events, attributes, and identities
  ├── constants.ts              # SDK constants, error messages, and configuration defaults
  ├── types.ts                  # TypeScript type definitions and enums
  ├── utils.ts                  # Helper functions (parsing, formatting, feature detection)
  ├── helpers.js                # General utility functions for data manipulation
  ├── logger.ts                 # Logging utility for errors, warnings, and debug messages
  └── *.interfaces.ts           # TypeScript interface definitions for public APIs
/test/                          # Test suite
  ├── karma.config.js           # Karma test runner config
  ├── src/tests-*.ts            # Test files
  └── jest/*.spec.ts            # Jest unit tests
/dist/                          # Built output
  ├── mparticle.js              # IIFE bundle (browser <script> tag)
  ├── mparticle.common.js       # CommonJS bundle (npm)
  └── mparticle.esm.js          # ES Modules bundle
/scripts/                       # Build and release automation
/.github/workflows/             # CI/CD pipelines
```

### Code Organization Pattern

Features are organized with implementation and interface files:

```
src/
├── [feature].ts                    # TypeScript implementation
├── [feature].js                    # JavaScript implementation (legacy)
└── [feature].interfaces.ts         # TypeScript interfaces

test/
├── src/tests-[feature].ts          # Karma tests (browser integration)
├── src/tests-[feature].js          # Karma tests (browser integration, legacy)
└── jest/[feature].spec.ts          # Jest tests (TypeScript unit tests)
```

**Testing Structure:**
- **Karma tests** (`test/src/tests-*.ts` or `tests-*.js`): Browser-based integration tests with full SDK runtime
  - `.js` files are legacy, prefer `.ts` for new tests
- **Jest tests** (`test/jest/*.spec.ts`): Unit tests for TypeScript modules, fast isolated tests

**Examples:**
- Identity: `identity.js` + `identity.interfaces.ts` + `identity-utils.ts` + `test/src/tests-identity.ts` + `test/jest/identity.spec.ts`
- Events: `events.js` + `events.interfaces.ts` + `test/src/tests-events.ts`
- eCommerce: `ecommerce.js` + `ecommerce.interfaces.ts` + `test/src/tests-ecommerce.ts`
- Forwarders: `forwarders.js` + `forwarders.interfaces.ts` + `kitBlocking.ts` + `test/src/tests-forwarders.ts`

### TypeScript & JavaScript Conventions

**TypeScript Configuration:**
- Target: ES5
- Lib: ES5, ES6, DOM
- Module Resolution: Node
- Strict type checking: strictNullChecks=false, noImplicitAny=false

**Naming Conventions:**
```typescript
// Interfaces (prefix with 'I' or 'SDK')
interface IFeatureName { }
interface SDKFeatureName { }

// Enums
enum EventType { }
enum MessageType { }

// Constants
const UPPER_SNAKE_CASE = 'value';

// Methods
function publicMethod() { }
function _privateMethod() { }
function getProperty() { }
function setProperty() { }
```

**Code Style (Prettier):**
- Tab width: 4 spaces
- Quotes: Single quotes (`'`)
- Trailing commas: ES5 style
- Line length: 80 characters (suggested)

**ESLint Rules:**
- Prettier enforcement enabled
- No unused variables
- Avoid console.log in production code; prefer Logger (not currently enforced by ESLint)

**Linting & Code Quality Commands:**

```bash
# Linting
npm run lint                # ESLint check (both .js and .ts files)
npm run prettier            # Prettier check (.js files only)
npm run gts:check           # TypeScript style check (.ts files)
npm run gts:fix             # Auto-fix TypeScript style issues

# Bundle Analysis
npm run bundle              # Uglify + gzip for size reporting
npm run uglify              # Minify bundle
npm run gzip                # Gzip bundle
```

**Linting by File Type:**
- **JavaScript (.js)**: ESLint + Prettier
- **TypeScript (.ts)**: ESLint + GTS (Google TypeScript Style)

**Pre-commit Hooks:**
- ESLint runs automatically before commits
- Commit will fail if linting errors exist

### Instance-Based Architecture

The Web SDK uses an instance manager pattern to support multiple SDK instances:

```javascript
mParticle.init(apiKey, config, instanceName?)
mParticle.getInstance(instanceName?)
```

**Key Concepts:**
- **Default Instance**: Used when no instance name is specified (typically named `default_instance`)
- **Multiple Instances**: Support for multiple workspaces or isolated data streams
- **Instance Isolation**: Each instance has its own configuration, user identity, and state

**Use Cases for Multiple Instances:**
- Multiple mParticle workspaces in a single application
- Isolated analytics streams (e.g., separate tracking for different features)
- Testing scenarios requiring separate SDK states

### Instance Structure

The Web SDK uses a global instance manager that creates individual SDK instances:

```typescript
// Global manager
mParticle {
  init(apiKey, config, instanceName?)
  getInstance(instanceName?)
  _instances: { [name: string]: IMParticleWebSDKInstance }
}

// Individual instance
IMParticleWebSDKInstance {
  // Public API
  logEvent(), logPurchase(), setUserAttribute()
  Identity, eCommerce, Consent

  // Private modules (accessed via mpInstance._ModuleName)
  _APIClient              // HTTP communication
  _Identity               // Identity management
  _Events                 // Event logging
  _Ecommerce              // Commerce events
  _Consent                // Consent management
  _Persistence            // Storage (LocalStorage/Cookies)
  _Store                  // Runtime state
  _SessionManager         // Session lifecycle
  _Forwarders             // Kit management
  _Logger                 // Logging utility
}
```

### Key Files Reference

When working on specific features, refer to these files:

| Feature | Main Files |
|---------|-----------|
| Entry Point | `mparticle-instance-manager.ts` |
| Core Instance | `mp-instance.ts` |
| Identity | `identity.js`, `identity-utils.ts`, `identity.interfaces.ts` |
| Events | `events.js`, `events.interfaces.ts` |
| eCommerce | `ecommerce.js`, `ecommerce.interfaces.ts` |
| Forwarders | `forwarders.js`, `forwarders.interfaces.ts`, `kitBlocking.ts` |
| Consent | `consent.ts` |
| Session | `sessionManager.ts` |
| Storage | `persistence.js`, `store.ts` |
| HTTP | `apiClient.ts`, `identityApiClient.ts`, `configAPIClient.ts` |
| Validation | `validators.ts` |
| Constants | `constants.ts` |
| Types | `types.ts` |

### Build System

**Build Commands:**

```bash
# Development
npm run watch                # Watch IIFE and rebuild
npm run watch:all           # Watch all formats
npm run watch:tests         # Watch and rebuild tests
npm run build:dev           # Dev build with sourcemap

# Production Builds
npm run build               # Build all formats
npm run build:iife          # Browser bundle (dist/mparticle.js)
npm run build:npm           # CommonJS (dist/mparticle.common.js)
npm run build:esm           # ES Modules (dist/mparticle.esm.js)
npm run build:stub          # Stub file (pre-init API)

# Specialized
npm run build:snippet       # Minified snippets
npm run build:ts            # TypeScript compilation only
```

**Rollup Configuration:**
- Entry: `src/mparticle-instance-manager.ts`
- Plugins: Babel, TypeScript, Node Resolve, CommonJS, Uglify

**Environment Variables:**
- `ENVIRONMENT`: `dev` or `production`
- `BUILD`: Target build format (e.g., `iife`, `cjs`)
- `BUILDALL`: Build all formats

### Testing Strategy

**Test Commands:**

```bash
npm run test                # Full suite (Karma + Jest)
npm run test:debug          # Interactive Chrome debug mode
npm run test:jest           # Jest unit tests only (TypeScript)
npm run test:jest:watch     # Jest watch mode
npm run test:browserstack   # BrowserStack cross-browser tests
npm run test:integrations   # All integrations (CJS, ESM, RequireJS)
```

**Karma (Browser Integration Tests):**
- **Purpose**: Full SDK integration tests in real browser environment
- **Files**: `test/src/tests-*.ts` or `tests-*.js` (legacy)
- **Browsers**: ChromeHeadless, Firefox
- **Key Patterns**:
  - Reset state with `mParticle._resetForTests(MPConfig)` in `beforeEach`
  - Mock HTTP with fetch-mock/esm/client
  - Use `waitForCondition()` helper from `test/src/config/utils.ts` for async operations
  - Chai assertions: `expect(...).to.equal()`, `expect(...).to.be.ok`, `expect(...).to.have.keys()`
  - Sinon for spies/stubs

**Jest (TypeScript Unit Tests):**
- **Purpose**: Fast isolated unit tests for TypeScript modules
- **Files**: `test/jest/*.spec.ts`
- **Environment**: jsdom (simulates browser)
- **Key Patterns**:
  - Mock timers with `jest.useFakeTimers()` and `jest.advanceTimersByTime()`
  - Mock global.fetch with `jest.fn().mockResolvedValue()`
  - Create mock mpInstance objects as needed
  - Jest matchers: `toBe()`, `toEqual()`, `toBeDefined()`, `toHaveBeenCalled()`

### Storage Strategy

The Web SDK uses a tiered storage approach:

1. **Primary**: LocalStorage (`window.localStorage`)
2. **Fallback**: Cookies (`document.cookie`)
3. **Key Pattern**: `mp_[workspace]_[mpid]`

**Stored Data:**
- User MPID (mParticle ID)
- User attributes
- Identity information
- Session data
- Consent state
- Cookie sync information

**Access Pattern:**
```javascript
// Via instance
mpInstance._Persistence.setLocalStorage(key, value);
const value = mpInstance._Persistence.getLocalStorage(key);

// Store for runtime state
mpInstance._Store.devToken = 'xyz';
```

### API Communication

**Endpoints:**
- **Events**: `/v1/[workspace]/events`
- **Identity**: `/v1/[workspace]/identify`, `/login`, `/logout`, `/modify`
- **Config**: `/v1/[workspace]/config`

**Request Flow:**
```
Event/Identity Call → Validation → mpInstance._APIClient.send() → Batch → HTTP POST
                                                                            ↓
Callback Invoked ← Response Processed ← Server Response ← ← ← ← ← ← ← ← ←
```

**HTTP Client:**
- Uses `fetch` API (polyfilled if needed)
- Automatic retry logic for failed requests
- Batch upload with configurable intervals
- Request timeout handling

### Forwarder (Kit) System

**Forwarder Flow:**
```
Event Logged → Kit Filters Applied → Forwarded to Active Kits → Kit Processes Event
                  ↓
    Consent Check, User Attribute Filters,
    Anonymous User Rules, Kit Blocking
```

**Kit Configuration:**
- Fetched from mParticle servers on init
- Applied at runtime based on server config
- Can be dynamically enabled/disabled
- Each kit has its own filtering rules

**Key Files:**
- `forwarders.js`: Main forwarder logic
- `forwarders.interfaces.ts`: Forwarder types
- `kitBlocking.ts`: Data plan violation handling
- `integrationCapture.ts`: Integration event capture

### Session Management

**Session Lifecycle:**
```
SDK Init → Session Start → Activity → Timeout Check → Session End
             ↓                           ↓               ↓
        Session ID Created      Session Extended   New Session Created
```

**Session Configuration:**
- Default timeout: 30 minutes
- Configurable via `config.sessionTimeout`
- Tracked in `sessionManager.ts`
- Session ID included in all events

### Logging

**Logger Usage:**
```javascript
// Via instance
mpInstance.Logger.error('Error message');
mpInstance.Logger.warning('Warning message');
mpInstance.Logger.verbose('Debug message');
```

**Log Levels:**
- `error`: Critical errors
- `warning`: Important warnings
- `verbose`: Debug information (only in development)

**Best Practices:**
- Use Logger instead of `console.log`
- Include context in error messages
- Reference constants for standard messages: `Constants.Messages.ErrorMessages`

### Dependency Injection Pattern

Core modules receive `mpInstance` as a parameter, allowing them to access other modules (e.g., `mpInstance._Store`, `mpInstance.Logger`). This provides testability, clear dependencies, no circular dependencies, and instance isolation.

### Common Gotchas

1. **Instance vs Manager**: `mParticle` is the manager, `mpInstance` is the SDK instance
2. **Private Methods**: Methods prefixed with `_` are private/internal
3. **Async Identity**: Identity calls are async, use callbacks
4. **Storage Limits**: LocalStorage has size limits (~5-10MB), cookies have 4KB limit
5. **Forwarder Timing**: Kits may not be initialized immediately
6. **Filtering Rules**: Events may be blocked by data plan rules or consent state

### Performance Considerations

- **Batch Events**: Events are batched before upload (default: 100 events or 30 seconds)
- **Minimize Storage**: Only store essential data in LocalStorage/Cookies
- **Async Operations**: Use callbacks for async operations (don't block)
- **Bundle Size**: Monitor bundle size with `npm run bundle`
- **Tree Shaking**: ESM build supports tree shaking for smaller bundles
- **Lazy Loading**: Kits are loaded on-demand when configured

### Debugging Tips

1. **Enable Verbose Logging**: Set `config.logLevel = 'verbose'` in init
2. **Use Debug Mode**: Run `npm run test:debug` for interactive debugging
3. **Check Network**: Inspect Network tab for API calls
4. **Inspect Storage**: Check Application tab for LocalStorage/Cookies
5. **Use Source Maps**: Dev builds include source maps

### Additional Resources

- **Documentation**: https://docs.mparticle.com/developers/sdk/web/
- **GitHub**: https://github.com/mParticle/mparticle-web-sdk
