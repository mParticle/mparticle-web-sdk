![Braze Logo](https://github.com/mparticle-integrations/mparticle-javascript-integration-appboy/blob/master/braze-logo.png)

# mParticle Braze Kit — Braze Web SDK V5

This kit bundles **Braze Web SDK V5** (`@braze/web-sdk@^5.5.0`) and exposes it on the page as `window.braze`.

---

## ⚠️ We recommend upgrading to Braze Web SDK V6

Braze is now on **V6**, and V6 is the version mParticle recommends for all customers. We recommend updating straight to V6 for latest support of all Braze features.

This is the smallest of the Braze upgrades: the `braze` global, initialization options, and the vast majority of the API are unchanged. Only two areas break — the **legacy News Feed**, which V6 removes entirely, and **manual card-analytics method names**.

**Full, authoritative upgrade instructions live in the mParticle docs: [Braze Event Integration → Braze Web Kit Critical Updates and Timelines → Opt In to Braze SDK Version 6](https://docs.mparticle.com/integrations/braze/event/).**

### How to upgrade

1. **Audit the code you own.** If you call Braze directly, find every `braze` reference and compare it with the table below and Braze's upgrade documentation.
2. **Move to the V6 kit.**
   - Self-hosting via npm with **core Web SDK v3**: `npm install @mparticle/web-braze-kit-6`
   - Self-hosting via npm with **core Web SDK v2**: `npm install @mparticle/web-braze-kit@^6`
   - Loading mParticle via snippet/CDN: nothing to install; the kit is delivered for you.
3. **Select `Version 6`** under `Braze Web SDK Version` in your Braze connection settings in the mParticle UI. This step is **required for both npm and snippet/CDN** integrations — installing the package alone does not switch you over.
4. **Update your push service worker**, if you use push. See [Push notifications](#push-notifications).

---

## What changed from V5 to V6

The table below is the V5 API you have today mapped to the V6 API you should use.

Primary sources: the [Braze Web SDK changelog](https://github.com/braze-inc/braze-web-sdk/blob/master/CHANGELOG.md) and the [Braze upgrade guide](https://github.com/braze-inc/braze-web-sdk/blob/master/UPGRADE_GUIDE.md).

| V5 | V6 |
| --- | --- |
| `braze.logCardClick()` | `braze.logContentCardClick()` — already exists in V5, so you can rename before you upgrade |
| `braze.logCardImpressions()` | `braze.logContentCardImpressions()` — already exists in V5 |
| Legacy News Feed: `Feed`, `destroyFeed()`, `getCachedFeed()`, `logFeedDisplayed()`, `requestFeedRefresh()`, `showFeed()`, `subscribeToFeedUpdates()`, `toggleFeed()` | **No drop-in replacement.** Migrate to Content Cards |
| `Card.created`, `Card.categories` | No replacement; these were News Feed fields |
| `ImageOnly.linkText` | No replacement; unused |
| Custom banner HTML + `logBannerClick()` / `logBannerImpressions()` | `braze.insertBanner()`, which handles rendering, impressions, and clicks |

If you call Braze directly, search your codebase for **every** `braze` reference and use Braze's changelog and upgrade guide to determine the corresponding V6 change. The table above highlights common changes but is not a substitute for reviewing your implementation.

For example, use the Content Card-specific analytics methods:

```javascript
// V5
window.braze.logCardImpressions([card], true);

// V6
window.braze.logContentCardImpressions([card]);
```

---

## Push notifications

If you use push notifications, update your `service-worker.js` to import the V6 service worker that mParticle hosts:

```javascript
self.importScripts('https://static.mparticle.com/sdk/js/braze/service-worker-6.5.0.js');
```

The V5 kit references `service-worker-5.5.0.js`. mParticle hosts Braze's service worker to avoid unpredictable versioning issues — do not point at Braze's own service worker CDN.

---

## Reference

- [mParticle Braze integration docs](https://docs.mparticle.com/integrations/braze/event/)
- [Braze Web SDK changelog](https://github.com/braze-inc/braze-web-sdk/blob/master/CHANGELOG.md)
- [Braze Web SDK upgrade guide](https://github.com/braze-inc/braze-web-sdk/blob/master/UPGRADE_GUIDE.md)
- [Braze Web SDK API reference](https://js.appboycdn.com/web-sdk/latest/doc/modules/braze.html)

# License

Copyright 2022 mParticle, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
