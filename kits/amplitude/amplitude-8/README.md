# mParticle Amplitude Kit — Web SDK

Amplitude JavaScript integration for the mParticle Web SDK.

## Installation

### npm

```bash
npm install @mparticle/web-amplitude-kit @mparticle/web-sdk
```

```javascript
import mParticle from '@mparticle/web-sdk';
import amplitudeKit from '@mparticle/web-amplitude-kit';

amplitudeKit.register(mParticle.config);

mParticle.init('YOUR_API_KEY', mParticle.config);
```

### CDN (Script Tag)

JavaScript kits are automatically included when using the mParticle CDN-hosted SDK. See the [mParticle Web SDK documentation](https://docs.mparticle.com/developers/sdk/web/) for setup instructions.

For self-hosted usage:

```html
<script src="path/to/mparticle.js"></script>
<script src="path/to/Amplitude.iife.js"></script>
<script>
  mParticle.init('YOUR_API_KEY', window.mParticle.config);
</script>
```

## Configuration

The Amplitude kit supports the following settings (configured via the mParticle dashboard):

| Setting | Description |
|---------|-------------|
| `apiKey` | Your Amplitude API key |
| `userIdentification` | Identity type for Amplitude user ID (mpId, customerId, email, other, etc.) |
| `includeEmailAsUserProperty` | Send email as a user property |
| `saveEvents` | Enable offline event caching |
| `savedMaxCount` | Max events to cache offline |
| `uploadBatchSize` | Batch size for uploads |
| `includeUtm` | Include UTM parameters |
| `includeReferrer` | Include referrer |
| `forceHttps` | Force HTTPS |
| `baseUrl` | Custom API endpoint (e.g., for EU data center) |
| `instanceName` | Amplitude instance name (for multiple instances) |
| `excludeIndividualProductEvents` | Exclude per-product commerce events |
| `enableTempAmplitudeEcommerce` | Enable enhanced commerce event format |
| `sendEventAttributesAsObjects` | Parse JSON string attributes to objects |
| `allowUnsetUserAttributes` | Allow unsetting user properties via `removeUserAttribute` |

## Supported Events

- Page views
- Custom events
- Commerce events (purchase, refund, add/remove from cart, impressions, promotions)
- User identity changes
- User attribute changes
- Opt-out

## Development

```bash
npm install
npm run build      # Build IIFE + CJS bundles
npm test           # Run full test suite
npm run test:debug # Debug tests in Chrome
npm run watch      # Watch and rebuild on changes
```

## License

Apache 2.0 — Copyright 2015 mParticle, Inc.
