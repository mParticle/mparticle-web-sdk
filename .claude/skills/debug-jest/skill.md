---
name: debug-jest
description: Debug Jest/unit test failures in mParticle Web SDK including assertion failed/expected X received Y/toBe failed/toEqual failed/expect failed/test failed/test failing/spec failed/mock not called/mock called with wrong args/mockReturnValue wrong/spy not called/jest.mock not working/module mock failed/async timeout/promise not resolved/test timeout/coverage gap/branch not covered/function not covered/line not covered/fetch mock error
---

# Jest Debug Skill - Web SDK

## Purpose
Fix Jest unit test failures in the mParticle Web SDK through systematic isolation of assertion, mock, or module issues.

## Core Principles
- **Isolation reveals dependencies**: Failed test shows what module actually needs
- **Mock precision**: Wrong mock shape → module fails → test fails
- **Async timing**: Using sync expectations on async operations → test fails before resolution
- **Minimal reruns**: After fixing, rerun ONLY the specific failing test, not entire suite

## Architecture Context
Jest tests in `test/jest/*.spec.ts` test TypeScript modules in `src/`. Uses jsdom to simulate browser environment. Mock `global.fetch` for HTTP calls. Mock timers for session/batch timing.

## Failure Classification

**Assertion failures:**
- Expected value wrong → logic bug or test assumption incorrect
- Property undefined → mock doesn't match production shape
- Timing → async operation not resolved before assertion
- Type mismatch → TypeScript/JavaScript type coercion issue

**Mock failures:**
- Mock not called → code path not executed
- Wrong arguments → test passing incorrect data
- Mock implementation broken → returns wrong type/shape
- Module mock not hoisted → import happens before mock
- fetch mock wrong → apiClient, identityApiClient, configAPIClient fail

**Async failures:**
- Promise not awaited → Test finishes before async completes
- Timer not advanced → `jest.advanceTimersByTime()` not called
- setTimeout/setInterval not mocked → real timers in test
- Batch upload timing → `batchUploader` needs timer mocks

**Coverage gaps:**
- Code never executed in tests → 0% coverage
- Branch not tested → if/else only one path covered
- Error handling not tested → catch blocks never hit

## Investigation Strategy

### 1. Read Error Message
Jest errors are precise:
- `Expected X, received Y` → assertion wrong
- `Cannot read property X of undefined` → mock return value wrong
- `Promise not resolved` → missing await or timer advance
- `ReferenceError: X is not defined` → global not mocked

### 2. Run Single Test
Isolate the failure:
```bash
npm run test:jest -- --testPathPattern="identity" --testNamePattern="should login"
```

Or in watch mode:
```bash
npm run test:jest:watch
# Press 'p' to filter by filename
# Press 't' to filter by test name
```

### 3. Mock Validation
Verify mocks match production:

**For fetch (HTTP calls):**
```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({ /* actual API response shape */ })
})
```

**For timers (sessions, batching):**
```typescript
jest.useFakeTimers()
// ... code that uses setTimeout/setInterval
jest.advanceTimersByTime(1000)
```

**For mpInstance:**
```typescript
const mockMpInstance = {
  _Store: { devToken: 'test-key' },
  _APIClient: { send: jest.fn() },
  Logger: { error: jest.fn(), warning: jest.fn() }
}
```

### 4. Async Debugging
Ensure all async operations complete:
```typescript
await someAsyncFunction()
// Or advance timers for setTimeout/setInterval
jest.advanceTimersByTime(30000)
```

## Common Root Causes

**fetch mock wrong:**
- Mock doesn't match Events API response structure (`/v1/[workspace]/events`)
- Mock doesn't match Identity API response (`/v1/[workspace]/identify`)
- Mock doesn't match Config API response (`/v1/[workspace]/config`)
- Status code wrong (200 vs 401 vs 500)
- JSON structure mismatch

**Timer issues:**
- Session timeout not mocked (default 30 minutes)
- Batch upload interval not mocked (default 30 seconds)
- `jest.useFakeTimers()` not called in beforeEach
- Timer not advanced: `jest.advanceTimersByTime(ms)`

**Module isolation:**
- Test imports module that imports another → cascade failure
- Shared state between tests → forgot to reset
- Global pollution → `mParticle` state not cleared
- LocalStorage not cleared → use `localStorage.clear()` in beforeEach

**Mock shape mismatch:**
- mpInstance missing required properties (_Store, _APIClient, Logger, etc.)
- Config object incomplete (missing required fields)
- Event object wrong structure (missing attributes, eventType)

## Obscure Debugging Vectors

- **jest --no-coverage**: Faster runs when debugging (skip coverage calculation)
- **jest --runInBand**: Run tests serially to eliminate race conditions
- **console.log(JSON.stringify(mockFn.mock.calls))**: Inspect all mock invocations
- **jest.clearAllMocks()**: Reset mocks between tests in beforeEach
- **jest.restoreAllMocks()**: Restore original implementations
- **--verbose**: Show individual test results
- **Check jsdom version**: Some DOM APIs may not be available in jsdom

## Debugging Flow

1. Run failing test: `npm run test:jest -- --testPathPattern="filename"`
2. Read error message, identify failure type
3. Check mocks return correct shapes (match production APIs)
4. Verify async operations are awaited or timers advanced
5. Ensure test isolation (no shared state, clear localStorage/globals)
6. Run 3+ times to confirm stability

## Success Criteria
- Test passes consistently (3+ runs)
- Coverage maintained/improved
- Mock shapes match production (Events API, Identity API, Config API)
- No shared state between tests
- Screenshot: green test output

## SDK-Specific Patterns

**Testing Identity operations:**
- Mock identityApiClient responses
- Use mock MPID (mParticle ID)
- Mock callback functions

**Testing Event logging:**
- Mock apiClient.send()
- Verify event structure (eventType, attributes)
- Test data plan validation

**Testing Batch uploads:**
- Use fake timers for batch intervals
- Mock apiClient HTTP calls
- Verify batch structure

**Testing Session management:**
- Mock sessionManager timers (30 min default timeout)
- Test session start/end events
- Verify session ID generation

## Self-Improvement
**CRITICAL**: Update with:
- Jest matcher anti-patterns
- Mock configuration gotchas for SDK modules
- Timer/async timing solutions
- Coverage gap strategies
- Common SDK test failures
