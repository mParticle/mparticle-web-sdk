![Braze Logo](https://github.com/mparticle-integrations/mparticle-javascript-integration-appboy/blob/master/braze-logo.png)

# mParticle Braze Kit — Braze Web SDK V4

This kit bundles **Braze Web SDK V4** (`@braze/web-sdk@^4.2.1`) and exposes it on the page as `window.braze`.

---

## ⚠️ We recommend upgrading to Braze Web SDK V6

Braze is now on **V6**, and V6 is the version mParticle recommends for all customers. We recommend updating straight to V6 for latest support of all Braze features.

See the [Braze Event Integration](https://docs.mparticle.com/integrations/braze/event/) docs.

### How to upgrade

1. **Audit the code you own.** If you call Braze directly, find every `braze` reference and compare it with the table below and Braze's upgrade documentation.
2. **Move to the V6 kit.**
   - Self-hosting via npm with **core Web SDK v3 (latest)**: `npm install @mparticle/web-braze-kit-6`
   - Self-hosting via npm with **core Web SDK v2 (legacy)**: `npm install @mparticle/web-braze-kit@^6`
   - Loading mParticle via snippet/CDN: nothing to install; the kit is delivered for you.
3. **Add defensive code** if you load mParticle via the snippet and call Braze directly. Skip this if you self-host via npm. See [Write version-tolerant code](#write-version-tolerant-code).
4. **Select `Version 6`** under `Braze Web SDK Version` in your Braze connection settings in the mParticle UI. This step is **required for both npm and snippet/CDN** integrations — installing the package alone does not switch you over.
5. **Update your push service worker**, if you use push. See [Push notifications](#push-notifications).

---

## What changed from V4 to V6

The table below is the V4 API you have today mapped to the V6 API you should use.

Primary sources: the [Braze Web SDK changelog](https://github.com/braze-inc/braze-web-sdk/blob/master/CHANGELOG.md) and the [Braze upgrade guide](https://github.com/braze-inc/braze-web-sdk/blob/master/UPGRADE_GUIDE.md).

| V4 | V6 |
| --- | --- |
| `braze.logCardClick()` | `braze.logContentCardClick()` — already exists in V4, so you can rename before you upgrade |
| `braze.logCardImpressions()` | `braze.logContentCardImpressions()` — already exists in V4 |
| `braze.logContentCardsDisplayed()` *(already a no-op)* | Delete it |
| Legacy News Feed: `Feed`, `destroyFeed()`, `getCachedFeed()`, `logFeedDisplayed()`, `requestFeedRefresh()`, `showFeed()`, `subscribeToFeedUpdates()`, `toggleFeed()` | **No drop-in replacement.** Migrate to Content Cards |
| `braze.Banner` card class *(deprecated since 4.9.0)* | `braze.ImageOnly` |
| `ab-banner` CSS class | `ab-image-only` |
| `enableHtmlInAppMessages` init option *(deprecated since 3.3.0)* | `allowUserSuppliedJavascript` |
| `getDeviceId(callback)` / `User.getUserId(callback)` *(callback params deprecated since 4.10.0)* | Return values directly: `getDeviceId()`, `getUserId()` |
| `Card.created`, `Card.categories` | No replacement; these were News Feed fields |
| `ImageOnly.linkText` | No replacement; unused |

If you call Braze directly, search your codebase for **every** `braze` reference and use Braze's changelog and upgrade guide to determine the corresponding V6 change. The table above highlights common changes but is not a substitute for reviewing your implementation.

For example, use the Content Card-specific analytics methods:

```javascript
// V4
window.braze.logCardImpressions([card], true);

// V6
window.braze.logContentCardImpressions([card]);
```

---

## Write version-tolerant code

Do this if you load mParticle via the snippet. After you select `Version 6`, cache busting can leave some visitors on the old kit for a while, so if you call Braze directly, ship code that works against both versions first, then flip the setting.

If you self-host via npm, you control when the kit version ships with your own deploy, so you do not need version-tolerant fallbacks — update your Braze calls and deploy them together with the V6 kit.

The `braze` global is the same in V4 and V6, so guard on the method instead. For the card-analytics renames:

```javascript
if (window.braze.logContentCardImpressions) {
    window.braze.logContentCardImpressions([card]);
} else {
    window.braze.logCardImpressions([card], true);
}
```

Search your codebase for every remaining direct `braze` call and apply the same pattern, using the mapping table above and Braze's changelog to find the V6 equivalent of each one.

Once V6 is live and verified, you can delete the fallbacks and call the V6 methods directly.

---

## Push notifications

If you use push notifications, update your `service-worker.js` to import the V6 service worker that mParticle hosts:

```javascript
self.importScripts('https://static.mparticle.com/sdk/js/braze/service-worker-6.5.0.js');
```

The V4 kit references `service-worker-4.2.1.js`. mParticle hosts Braze's service worker to avoid unpredictable versioning issues — do not point at Braze's own service worker CDN.

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
