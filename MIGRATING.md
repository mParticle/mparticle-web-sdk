# Migrating to Web SDK v3

Version 3 of the mParticle Web SDK is a major release with breaking changes from 2.x. Ignore this file if you are implementing the SDK for the first time.

This is the in-repo migration guide. The [3.0.0 changelog](CHANGELOG.md#300) lists every commit. The docs site [Upgrade to Version 3](https://docs.mparticle.com/developers/client-sdks/web/upgrade-to-version-3/) guide has the same customer-facing steps.

## Summary

- **New snippet.** Replace the v2 loader with the [v3 snippet](snippet.js). It loads `/js/v3/<apiKey>/mparticle.js` and sets `snippetVersion` to 3. It no longer stubs `logCheckout`. It does stub `Identity.search` and the full `mParticle.Rokt` surface, including `onShoppableAdsReady`.
- **Unified kit versions.** The core SDK and every mParticle-hosted kit share the same version and are released together. npm customers must upgrade core and all kits to the same 3.x version at the same time.
- **Braze package names.** Kits that wrap multiple partner SDK majors now put that major in the npm name. `@mparticle/web-braze-kit` becomes `@mparticle/web-braze-kit-3` through `@mparticle/web-braze-kit-6`. Amplitude stays `@mparticle/web-amplitude-kit`.
- **Removed APIs.** The Cart API, `logCheckout`, `logRefund`, and `removeCCPAState` are gone. See [Removed APIs](#removed-apis).

## Snippet (CDN)

Do not edit a v2 snippet in place. Replace it entirely:

1. Remove the v2 snippet from your pages or templates.
2. Copy the loader from [snippet.js](snippet.js) / the [initialization guide](https://docs.mparticle.com/developers/client-sdks/web/initialization/) into the `<head>` of every page. Keep any `mParticle.config` options you already customized.
3. Replace `REPLACE WITH API KEY` with your web API key. First-party (CNAME) setup is unchanged; see [Preventing Blocked HTTP Traffic with CNAME](https://docs.mparticle.com/developers/client-sdks/web/prevent-blocked-http-traffic/).

Snippet customers do not install kits from npm. Kits for integrations enabled in the mParticle UI still load automatically. The [removed APIs](#removed-apis) still apply to your application code.

## npm (self-hosting)

```bash
npm install @mparticle/web-sdk@^3.0.0
```

Upgrade **every** mParticle kit package to that same version in the same change. Mixing a v3 core SDK with v2 kits (or the reverse) is not supported. v3 kits declare a `peerDependency` on `@mparticle/web-sdk@^3.0.0`.

```bash
npm install @mparticle/web-sdk@^3.0.0 \
  @mparticle/web-braze-kit-6@^3.0.0 \
  @mparticle/web-google-analytics-4-client-kit@^3.0.0 \
  @mparticle/web-onetrust-kit@^3.0.0
```

### Braze package names

In v2, the Braze Web SDK major lived in the kit's own version (`@mparticle/web-braze-kit@6.x`). In v3 every kit shares the core version, so the partner major moved into the package name:

| v2 | v3 |
| --- | --- |
| `@mparticle/web-braze-kit` @ 3.x | `@mparticle/web-braze-kit-3` |
| `@mparticle/web-braze-kit` @ 4.x | `@mparticle/web-braze-kit-4` |
| `@mparticle/web-braze-kit` @ 5.x | `@mparticle/web-braze-kit-5` |
| `@mparticle/web-braze-kit` @ 6.x | `@mparticle/web-braze-kit-6` |

All other kit packages keep their existing names. Install them at 3.x. Amplitude remains `@mparticle/web-amplitude-kit`.

## Removed APIs

These APIs logged deprecation warnings in v2 and are removed in v3.

### Cart API

Removed: `mParticle.eCommerce.Cart.add/remove/clear`, `mParticle.Identity.getCurrentUser().getCart()`, and the `maxProducts` config option.

```javascript
// v2
mParticle.eCommerce.Cart.add(product, true);
mParticle.eCommerce.Cart.remove(product, true);

// v3
mParticle.eCommerce.logProductAction(
    mParticle.ProductActionType.AddToCart,
    [product]
);
mParticle.eCommerce.logProductAction(
    mParticle.ProductActionType.RemoveFromCart,
    [product]
);
```

### logCheckout and logRefund

```javascript
// v2
mParticle.eCommerce.logCheckout(step, option, attrs);
mParticle.eCommerce.logRefund(transactionAttributes, product);

// v3
mParticle.eCommerce.logProductAction(
    mParticle.ProductActionType.Checkout,
    products,
    attrs,
    customFlags,
    transactionAttributes
);
mParticle.eCommerce.logProductAction(
    mParticle.ProductActionType.Refund,
    products,
    attrs,
    customFlags,
    transactionAttributes
);
```

`logPurchase` still exists in v3 because production traffic depends on it. It remains deprecated; prefer `logProductAction` with `ProductActionType.Purchase`.

### removeCCPAState

```javascript
// v2
consentState.removeCCPAState();

// v3
consentState.removeCCPAConsentState();
```

## Checklist

- **Snippet:** Replace the v2 loader with the v3 snippet and set your API key.
- **npm:** Install `@mparticle/web-sdk@^3.0.0` and every kit at the same version. Switch Braze to `@mparticle/web-braze-kit-<major>`.
- **All:** Replace Cart / `getCart()`, `logCheckout`, `logRefund`, and `removeCCPAState` as above. Plan a move off `logPurchase`.
