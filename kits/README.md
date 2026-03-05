# mParticle Web SDK — Integration Kits

Kits forward events from the mParticle Web SDK to partner services. If you are implementing mParticle [via snippet](https://docs.mparticle.com/developers/client-sdks/web/initialization/), you can ignore the below instructions. If you implementing [via npm](https://docs.mparticle.com/developers/client-sdks/web/self-hosting/), please review that documentation and follow the below instructions if there are multiple versions of a partner that we support.

## How to Choose a Kit

Kits are versioned by the partner SDK major:

- `braze-5` -> Braze Web SDK 5.x
- `braze-6` -> Braze Web SDK 6.x

Pick the kit that matches the partner SDK major you want in your app.

## Important Note (Monorepo Paths)

The `kits/<provider>/<provider>-<major>/` paths are how kits are organized in
this repository. For your app, use the npm package (or the kit README) for
installation and usage instructions.

## Setup Instructions

Each kit has its own README with installation and configuration steps.

## Available Kits

| Kit | Directory | npm Package | Partner SDK |
| --- | --- | --- | --- |
| Amplitude 8 | [`amplitude/amplitude-8`](amplitude/amplitude-8/) | [`@mparticle/web-amplitude-kit`](https://www.npmjs.com/package/@mparticle/web-amplitude-kit) | [Amplitude Browser SDK 8.x](https://github.com/amplitude/Amplitude-TypeScript) |

## Integrations Not in This Repository

Integrations that are not maintained directly by mParticle are not currently
included in this repository. These may live in separate, partner- or
community-maintained repositories.
