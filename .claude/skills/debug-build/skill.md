---
name: debug-build
description: Debug TypeScript/Rollup build failures in mParticle Web SDK including TS2307 cannot find module/TS2345 argument type mismatch/TS2339 property doesn't exist/TS2322 type not assignable/TS2532 object possibly undefined/TS2554 expected X arguments/TS2769 no overload matches/TS7006 implicit any/TS7053 element implicitly has any/compilation error/compilation failed/compile error/tsc failed/tsc error/build failed/build error/rollup error/module not found/cannot resolve module/cannot find module/failed to resolve/import error/export error/declaration file missing/missing type declarations/@types package missing/bundle error/bundling failed/chunk load error
---

# Build Debug Skill - Web SDK

## Purpose
Fix TypeScript compilation and Rollup bundling failures in the mParticle Web SDK that block development and deployment.

## Core Principles
- **Types are contracts**: TS errors reveal actual vs expected interfaces
- **Module resolution is path math**: Cannot find module → path calculation wrong
- **Avoid `any`**: Use proper types where possible, but SDK has strictNullChecks=false
- **Build before test**: TS errors block everything downstream

## Architecture Context
TypeScript in `tsconfig.json` (ES5 target, no strict mode). Rollup in `rollup.config.js` builds IIFE, CommonJS, and ESM bundles. Build must pass before dev/test/deploy.

## Failure Classification

**Type errors:**
- TS2307: Cannot find module → import path wrong or missing declaration
- TS2345: Argument type mismatch → function signature changed
- TS2339: Property doesn't exist → interface outdated or typo
- TS2322: Type not assignable → incompatible types
- TS2769: No overload matches → wrong argument count/types
- TS7006: Implicit any → no type annotation (less strict in this SDK)

**Module resolution:**
- Cannot find module → path wrong, file moved, extension missing
- Circular dependency → A imports B imports A
- Ambient module missing → @types package not installed
- Path mapping wrong → tsconfig paths not resolving

**Rollup errors:**
- Module not found → file path incorrect or missing
- Chunk size exceeded → bundle too large (check with `npm run bundle`)
- Plugin failure → Rollup plugin crashed (Babel, TypeScript, Uglify)
- Circular dependency warning → refactor to break cycle

**Build output issues:**
- IIFE format broken → browser <script> tag fails
- CommonJS format broken → npm package fails
- ESM format broken → modern bundlers fail
- Stub file broken → pre-init capture fails

## Investigation Strategy

### 1. Locate Error
Build output shows:
- File path and line number
- Error code (TS2XXX)
- Expected vs actual types
- Quick fix suggestions

Navigate to exact location.

### 2. Check Recent Changes
- What file was last modified?
- Did interface change?
- Was dependency added/removed?
- Did someone add untyped code?

### 3. Validate Types
Hover in IDE to see inferred types:
- What does TS think this is?
- Does it match expectation?
- Where did inference go wrong?

### 4. Module Resolution Debug
Check import path:
- Relative vs absolute correct?
- File extension needed?
- Index file exists?
- tsconfig paths configured?

## Common Root Causes

**TS2307 Cannot find module:**
- Import path relative/absolute wrong
- File extension required but missing (.ts/.js)
- File moved but import not updated
- @types package missing (`npm install -D @types/package`)
- tsconfig paths not including directory

**TS2345 Argument type mismatch:**
- Function signature changed upstream
- Optional param became required
- Type widened/narrowed
- Generic constraint violated

**TS2339 Property doesn't exist:**
- Interface outdated (API contract changed)
- Typo in property name
- Property optional but not checked (use `?.`)
- Type guard failed (narrowing didn't work)

**Circular dependency:**
- A imports B, B imports A → refactor to shared file
- Barrel export (index.ts) imports from files that import it
- Type-only import can break cycle: `import type { X } from './y'`

**Rollup module not found:**
- Import path incorrect for Rollup resolution
- File extension required for some imports
- Plugin order wrong in rollup.config.js
- Node module not installed

## Obscure Debugging Vectors

- **npm run build:ts**: TypeScript compilation only (faster than full build)
- **tsc --noEmit**: Check types without building
- **tsc --traceResolution**: See module resolution path
- **tsc --listFiles**: All files included in compilation
- **npm run bundle**: Check minified bundle size (uglify + gzip)
- **rollup --environment BUILD:iife**: Build only IIFE format
- **VSCode restart**: Language server cache stale
- **Check dist/ output**: Verify all three formats generated

## Debugging Flow

1. Run build: `npm run build` or `npm run build:ts`
2. Read first error (fix top-down, errors cascade)
3. Navigate to file:line
4. Check recent changes to that file
5. Validate types with IDE hover
6. Fix issue (import, type, signature)
7. Re-run build (verify no cascade errors)
8. Run `npm run bundle` to verify bundle size
9. Run full test suite to confirm

## Success Criteria
- `npm run build` completes successfully
- All three bundles generated (IIFE, CommonJS, ESM)
- Bundle size reasonable (check with `npm run bundle`)
- No new implicit `any` types introduced
- Stub file generated correctly
- Screenshot: successful build output

## SDK-Specific Build Targets

**IIFE bundle (dist/mparticle.js):**
- Browser <script> tag usage
- Global `mParticle` variable
- Minified with Uglify

**CommonJS (dist/mparticle.common.js):**
- npm/Node.js environments
- `require('mparticle')` syntax

**ESM (dist/mparticle.esm.js):**
- Modern bundlers
- Tree-shaking support
- `import mParticle from 'mparticle'`

**Stub (dist/mparticle.stub.js):**
- Pre-init API call capture
- Async snippet loading

## Build Commands Reference

```bash
# Full build (all formats)
npm run build

# Individual formats
npm run build:iife       # Browser bundle
npm run build:npm        # CommonJS
npm run build:esm        # ES Modules
npm run build:stub       # Stub file

# Development
npm run build:dev        # Dev build with sourcemaps
npm run watch            # Watch IIFE and rebuild
npm run watch:all        # Watch all formats

# Analysis
npm run bundle           # Uglify + gzip for size
npm run uglify           # Minify only
npm run gzip             # Gzip only
```

## Self-Improvement
**CRITICAL**: Update with:
- Module resolution patterns specific to Rollup
- Type inference gotchas in non-strict mode
- Rollup configuration issues
- Build performance optimizations
- Common SDK build failures
