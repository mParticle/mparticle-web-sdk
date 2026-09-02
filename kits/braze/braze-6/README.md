![Braze Logo](https://github.com/mparticle-integrations/mparticle-javascript-integration-appboy/blob/master/braze-logo.png)

# mParticle Braze Kit — Braze Web SDK V6

This kit bundles **Braze Web SDK V6** (`@braze/web-sdk@^6.0.0`) and exposes it on the page as `window.braze`.

---

## ✅ This is the version we recommend

**V6 is the current major version of the Braze Web SDK and the version mParticle recommends for all customers.** Braze ships fixes and new features only on the V6 line, so if you are already here, you are on the right kit and there is nothing to upgrade.

If you are still on the V3, V4, or V5 kit, we recommend updating straight to V6 for latest support of all Braze features. Jump to the section for your current version:

- [Upgrading from V3 to V6](#upgrading-from-v3-to-v6) — largest change; the `appboy` global goes away
- [Upgrading from V4 to V6](#upgrading-from-v4-to-v6) — moderate; deprecated API cleanup plus News Feed removal
- [Upgrading from V5 to V6](#upgrading-from-v5-to-v6) — smallest; News Feed removal and card-analytics renames
- [Write version-tolerant code](#write-version-tolerant-code) — ship code that works before and after you select Version 6

**Full, authoritative upgrade instructions live in the mParticle docs: [Braze Event Integration → Braze Web Kit Critical Updates and Timelines → Opt In to Braze SDK Version 6](https://docs.mparticle.com/integrations/braze/event/).**

---

## Installing and enabling V6

Regardless of which version you are coming from, the mechanics are the same:

1. **Install the kit** (only if you self-host mParticle via npm — snippet/CDN users have it delivered automatically):
   - Core Web SDK v3: `npm install @mparticle/web-braze-kit-6`
   - Core Web SDK v2: `npm install @mparticle/web-braze-kit@^6`
2. **Select `Version 6`** under `Braze Web SDK Version` in your Braze connection settings in the mParticle UI. **This is required for both npm and snippet/CDN integrations** — installing the package alone does not switch you over.
3. **Add defensive code**, if you call Braze directly, so your site works before and after the switch. See [Write version-tolerant code](#write-version-tolerant-code) and use the example for the version you are coming from.
4. **Update your push service worker**, if you use push. See [Push notifications](#push-notifications).

If you never call Braze directly from your own code, skip step 3; steps 1, 2, and 4 are the entire upgrade. The code samples below only matter if you reference `window.appboy` or `window.braze` yourself.

We recommend shipping your code changes **before** flipping the version setting wherever possible, so that the code change and the version change remain two separately revertible steps.

---

## Upgrading from V3 to V6

We recommend updating straight to V6 for latest support of all Braze features.

Primary sources: the [Braze Web SDK changelog](https://github.com/braze-inc/braze-web-sdk/blob/master/CHANGELOG.md) and the [Braze upgrade guide](https://github.com/braze-inc/braze-web-sdk/blob/master/UPGRADE_GUIDE.md).

| V3 | V6 |
| --- | --- |
| `appboy` global | `braze` |
| `appboy.display.*` namespace | Methods moved to the top level: `braze.*` |
| `appboy.registerAppboyPushMessages()` | `braze.requestPushPermission()` |
| `appboy.unregisterAppboyPushMessages()` | `braze.unregisterPush()` |
| `appboy.display.automaticallyShowNewInAppMessages()` | `braze.automaticallyShowInAppMessages()` — must run *before* `openSession()` |
| `appboy.toggleAppboyLogging()` | `braze.toggleLogging()` |
| `appboy.isPushGranted()` *(deprecated since 1.6.2)* | `braze.isPushPermissionGranted()` |
| `appboy.subscribeToNewInAppMessages()` *(deprecated since 2.4.0)* | `braze.subscribeToInAppMessage()` |
| `appboy.trackLocation()` *(deprecated since 3.3.0)* | Native Geolocation API + `User.setLastKnownLocation()` |
| `appboy.stopWebTracking()` *(deprecated since 3.5.0)* | `braze.disableSDK()` |
| `appboy.resumeWebTracking()` *(deprecated since 3.5.0)* | `braze.enableSDK()` |
| `appboy.logCardClick()` | `braze.logContentCardClick()` |
| `appboy.logCardImpressions()` | `braze.logContentCardImpressions()` |
| `appboy.logContentCardsDisplayed()` | Delete it — it was already a no-op |
| Legacy News Feed APIs | **No drop-in replacement.** Migrate to Content Cards |
| `devicePropertyWhitelist` init option | `devicePropertyAllowlist` |
| `enableHtmlInAppMessages` init option | `allowUserSuppliedJavascript` |
| `language` init option | `localization` |
| `safariWebsitePushId` param on `registerAppboyPushMessages()` | `safariWebsitePushId` initialization option |
| `User.setAvatarImageUrl()` | No replacement |
| `appboy.Banner` card class | `braze.ImageOnly` |
| `ab-banner` CSS class | `ab-image-only` |

Search your codebase for **every** `appboy` reference and use Braze's changelog and upgrade guide to determine the corresponding V6 change. The table above highlights common changes but is not a substitute for reviewing your implementation.

For example, the `appboy.display` namespace was removed and its methods moved to `braze`:

```javascript
// V3
window.appboy.display.showContentCards();

// V6
window.braze.showContentCards();
```

---

## Upgrading from V4 to V6

We recommend updating straight to V6 for latest support of all Braze features. You already have the `braze` global.

| V4 | V6 |
| --- | --- |
| `braze.logCardClick()` | `braze.logContentCardClick()` — already exists in V4 |
| `braze.logCardImpressions()` | `braze.logContentCardImpressions()` — already exists in V4 |
| `braze.logContentCardsDisplayed()` *(already a no-op)* | Delete it |
| Legacy News Feed APIs | **No drop-in replacement.** Migrate to Content Cards |
| `braze.Banner` card class *(deprecated since 4.9.0)* | `braze.ImageOnly` |
| `ab-banner` CSS class | `ab-image-only` |
| `enableHtmlInAppMessages` init option | `allowUserSuppliedJavascript` |
| `getDeviceId(callback)` / `User.getUserId(callback)` | Return values directly |
| `Card.created`, `Card.categories` | No replacement; these were News Feed fields |

Search your codebase for **every** direct `braze` call and use Braze's changelog and upgrade guide to determine the corresponding V6 change. The table above highlights common changes but is not a substitute for reviewing your implementation.

For example, use the Content Card-specific analytics methods:

```javascript
// V4
window.braze.logCardImpressions([card], true);

// V6
window.braze.logContentCardImpressions([card]);
```

---

## Upgrading from V5 to V6

We recommend updating straight to V6 for latest support of all Braze features. The `braze` global, initialization options, and nearly the whole API are unchanged.

| V5 | V6 |
| --- | --- |
| `braze.logCardClick()` | `braze.logContentCardClick()` — already exists in V5 |
| `braze.logCardImpressions()` | `braze.logContentCardImpressions()` — already exists in V5 |
| Legacy News Feed APIs | **No drop-in replacement.** Migrate to Content Cards |
| `Card.created`, `Card.categories` | No replacement; these were News Feed fields |
| `ImageOnly.linkText` | No replacement |
| Custom banner HTML + `logBannerClick()` / `logBannerImpressions()` | `braze.insertBanner()` |

Search your codebase for **every** direct `braze` call and use Braze's changelog and upgrade guide to determine the corresponding V6 change. The table above highlights common changes but is not a substitute for reviewing your implementation.

For example, use the Content Card-specific analytics methods:

```javascript
// V5
window.braze.logCardImpressions([card], true);

// V6
window.braze.logContentCardImpressions([card]);
```

---

## Write version-tolerant code

Selecting `Version 6` in your connection settings swaps the kit that loads on your site, and that happens outside of your own deploy. If you call Braze directly, ship code that works against both versions first, then flip the setting.

Use the example that matches the version you are coming from. Search your codebase for every remaining direct `appboy` or `braze` call and apply the same pattern, using the mapping table for your starting version and Braze's changelog to find the V6 equivalent of each one.

Once V6 is live and verified, you can delete the fallbacks and call the V6 methods directly.

### From V3

The V3 → V6 change that matters most is the global rename, so guard on which global is present:

```javascript
if (window.braze) {
    window.braze.showContentCards();
} else if (window.appboy) {
    window.appboy.display.showContentCards();
}
```

### From V4

The `braze` global is the same in V4 and V6, so guard on the method instead. For the card-analytics renames:

```javascript
if (window.braze.logContentCardImpressions) {
    window.braze.logContentCardImpressions([card]);
} else {
    window.braze.logCardImpressions([card], true);
}
```

### From V5

The `braze` global is the same in V5 and V6, so guard on the method instead. For the card-analytics renames:

```javascript
if (window.braze.logContentCardImpressions) {
    window.braze.logContentCardImpressions([card]);
} else {
    window.braze.logCardImpressions([card], true);
}
```

---

## Push notifications

If you use push notifications, your `service-worker.js` should import the V6 service worker that mParticle hosts:

```javascript
self.importScripts('https://static.mparticle.com/sdk/js/braze/service-worker-6.5.0.js');
```

Earlier kits referenced `service-worker-3.5.0.js`, `service-worker-4.2.1.js`, and `service-worker-5.5.0.js` respectively. In mParticle's testing Braze's push notifications work regardless of which service worker version is used, but you should update this file to ensure future compatibility.

mParticle hosts Braze's service worker to avoid unpredictable versioning issues — do not point at Braze's own service worker CDN.

---

## eCommerce Recommended Events

If you enable the `Enable eCommerce Recommended Events` connection setting, mParticle maps commerce events to Braze's eCommerce Recommended Events schema. Client-side forwarding of these events requires **web Braze kit version 6.1.0 or later**. On earlier versions, mParticle falls back to forwarding commerce events as legacy custom and purchase events. See the [connection settings reference](https://docs.mparticle.com/integrations/braze/event/) for the full event and attribute mapping.

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
