# Rokt Pay+ mParticle Web Kit

An mParticle web kit that forwards the events your application already logs through the mParticle web SDK to a Rokt Pay+ placement. It lets your conversion funnel drive the placement experience through configuration, without adding placement-specific code to your application.

## How it works

The kit loads alongside the mParticle web SDK and receives the events your application logs. It translates a configurable set of those events into the messages a Rokt Pay+ placement listens for, and posts them to the embedding window.

| Rokt signal | Source |
| :-- | :-- |
| `initiated` | the kit initializes (application loaded) |
| `stepComplete` | a configured funnel-step screen is viewed |
| `approved` | the configured conversion event |
| every other Pay+ signal (`pending`, `accountCreated`, `purchaseCompleted`, ...) | the matching configured custom event |

## Configuration

You decide which of your screens and events map to each Rokt signal through this kit's settings in the mParticle dashboard. Each setting accepts a single name or a comma-separated list of names.

Funnel progression is driven by **page view events**, matched on the screen name. The conversion and every other outcome are **custom events**, matched on the event name. A page view is never the conversion.

The screen name is read from the page view's `screen_name` attribute (falling back to the page name when that attribute is absent), so the names you list in `progressionScreenNames` are the `screen_name` values your application sends.

`progressionScreenNames` lists the screens that emit `stepComplete`. Each custom-event setting maps an event name to the Pay+ signal of the same name: `approvedEventName` maps to `approved`, `purchaseCompletedEventName` maps to `purchaseCompleted`, and so on. The full list of fields, each with its description, appears in the connection settings in the mParticle dashboard.

`initiated` is emitted automatically when the kit initializes. If no settings are provided, the kit applies a default mapping: each page view is treated as a funnel step, and a custom event named `conversion` is treated as the approval.

## Message format

Each message posted to the embedding window has the following shape:

```js
{ source: 'rokt-payplus-kit', type: 'approved', detail: { /* event attributes */ } }
```

Consumers read `type` to determine the signal; `detail` carries the originating event's attributes.

## Usage

JS kits are automatically included with your mParticle.js file when you load mParticle via the snippet. To turn this integration on for your workspace and configure the settings above, contact your Rokt account team.

## Development

The kit is a single TypeScript file (`src/RoktPayPlus-Kit.ts`) built with Vite.

### Build

```shell
npm install
npm run build        # outputs dist/RoktPayPlus-Kit.{common,esm,iife}.js and RoktPayPlus-Kit.d.ts
npm run build:watch  # rebuild on change
```

### Test

```shell
npm test             # runs the vitest suite (jsdom, no browser required)
npm run typecheck    # tsc --noEmit
```

## License

Apache-2.0. See [LICENSE](LICENSE).
