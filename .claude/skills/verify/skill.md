---
name: verify
description: Run lint, build, and tests to verify changes. Use when user says /verify, check my changes, validate changes, run checks, verify everything passes, pre-commit check, ready to commit, does it pass, CI check, sanity check
---

# Verify Skill - mParticle Web SDK

Run lint, build, and tests to verify the current state of the codebase.

## Steps

1. Run the following checks. Lint and build can run in parallel. Tests depend on build completing first.

**Lint:**
```bash
npm run lint
```

**Build:**
```bash
npm run build
```

**Tests (after build passes):**
```bash
npm run test:jest
```

2. Report results in this format:

| Check  | Status |
|--------|--------|
| Lint   | PASS / FAIL |
| Build  | PASS / FAIL |
| Tests  | PASS / FAIL |

3. If any check fails, show the relevant error output so the user can diagnose and fix the issue.

## Notes

- `npm run test:jest` runs Jest unit tests against the built output. It requires `npm run build` to complete first.
- The full Karma browser test suite (`npm run test`) is slower and typically only needed for integration-level verification. Use `test:jest` for fast feedback.
- Lint covers both ESLint (`src/` and `test/src/`) rules.
