---
name: verify
description: Run lint and tests to verify changes. Use when user says /verify, check my changes, validate changes, run checks, verify everything passes, pre-commit check, ready to commit, does it pass, CI check, sanity check
---

# Verify Skill - mParticle Web SDK

Run the full lint and test battery to verify the current state of the codebase.

## Steps

1. Run lint first:

```bash
npm run lint
```

2. If lint passes, run both test suites in parallel. Each suite handles its own build internally.

```bash
npm run test:jest
```

```bash
npm run test
```

3. Report results in this format:

| Check       | Status |
|-------------|--------|
| Lint        | PASS / FAIL |
| Jest Tests  | PASS / FAIL |
| Karma Tests | PASS / FAIL |

4. If any check fails, show the relevant error output so the user can diagnose and fix the issue.
