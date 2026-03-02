# mParticle Web SDK — Kits

This directory contains integration kits (forwarders) that are maintained alongside the core Web SDK in a monorepo structure.

## Kits

| Kit | Directory | npm Package | Partner SDK | Module ID |
|-----|-----------|-------------|-------------|-----------|
| Amplitude | [amplitude/amplitude-8](amplitude/amplitude-8/) | `@mparticle/web-amplitude-kit` | Amplitude JS v8.x | 53 |

## Kit Structure

Each kit follows a consistent directory layout:

```
kits/<provider>/<provider>-<partner-major>/
  package.json             # Kit npm package
  rollup.config.js         # Build config (IIFE + CJS)
  rollup.test.config.js    # Test bundle config
  src/                     # Kit source
  test/                    # Test suite (Karma + Mocha + Chai)
  dist/                    # Built outputs (gitignored)
  example/                 # Example apps (CDN + npm)
  docs/                    # Additional documentation
  README.md
  CHANGELOG.md
  LICENSE
```

Kits are versioned by partner SDK major version (e.g., `amplitude-8` for Amplitude JS SDK v8.x), following the same convention used in the iOS monorepo.

## Adding a New Kit

1. Create the directory: `kits/<provider>/<provider>-<major>/`
2. Copy the structure from an existing kit (e.g., `amplitude/amplitude-8`)
3. Implement the kit constructor with the required API (see below)
4. Add tests and example apps
5. Add an entry to `matrix.json`
6. Update the table above

## Kit API Contract

Each kit must export a constructor that returns an object with these methods:

```javascript
{
  init(settings, reportingService, testMode, trackerId, userAttributes, userIdentities, appVersion, appName),
  process(event),
  setUserAttribute(key, value),
  removeUserAttribute(key),
  setUserIdentity(id, type),
  onUserIdentified(user),
  setOptOut(isOptingOut)
}
```

## Development

```bash
cd kits/<provider>/<provider>-<major>
npm install
npm run build      # Build IIFE + CJS bundles
npm test           # Run full test suite
npm run test:debug # Debug tests in Chrome
```

## Cross-Platform Reference

The iOS SDK uses a similar monorepo kit structure. See:
- [mparticle-apple-sdk/kits](https://github.com/mParticle/mparticle-apple-sdk/tree/master/kits)
