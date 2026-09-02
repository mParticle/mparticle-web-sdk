![Braze Logo](https://github.com/mparticle-integrations/mparticle-javascript-integration-appboy/blob/master/braze-logo.png)

# mParticle Braze Kit — Braze Web SDK V3

This kit bundles **Braze Web SDK V3** (`@braze/web-sdk@^3.5.0`) and exposes it on the page as `window.appboy`.

---

## ⚠️ We recommend upgrading to Braze Web SDK V6

Braze is now on **V6**, and V6 is the version mParticle recommends for all customers. We recommend updating straight to V6 for latest support of all Braze features.

See the [Braze Event Integration](https://docs.mparticle.com/integrations/braze/event/) docs.

### How to upgrade

1. **Audit the code you own.** If you call Braze directly, find every `appboy` reference and compare it with the table below and Braze's upgrade documentation.
2. **Move to the V6 kit.**
   - Self-hosting via npm with **core Web SDK v3 (latest)**: `npm install @mparticle/web-braze-kit-6`
   - Self-hosting via npm with **core Web SDK v2 (legacy)**: `npm install @mparticle/web-braze-kit@^6`
   - Loading mParticle via snippet/CDN: nothing to install; the kit is delivered for you.
3. **Add defensive code** if you load mParticle via the snippet and call Braze directly. Skip this if you self-host via npm. See [Write version-tolerant code](#write-version-tolerant-code).
4. **Select `Version 6`** under `Braze Web SDK Version` in your Braze connection settings in the mParticle UI. This step is **required for both npm and snippet/CDN** integrations — installing the package alone does not switch you over.
5. **Update your push service worker**, if you use push. See [Push notifications](#push-notifications).

---

## What changed from V3 to V6

The table below is the V3 API you have today mapped to the V6 API you should use. Several of these were deprecated in V3 and then removed.

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
| Legacy News Feed: `Feed`, `destroyFeed()`, `getCachedFeed()`, `logFeedDisplayed()`, `requestFeedRefresh()`, `showFeed()`, `subscribeToFeedUpdates()`, `toggleFeed()` | **No drop-in replacement.** Migrate to Content Cards |
| `devicePropertyWhitelist` init option *(deprecated since 3.1.0)* | `devicePropertyAllowlist` |
| `enableHtmlInAppMessages` init option *(deprecated since 3.3.0)* | `allowUserSuppliedJavascript` |
| `language` init option | `localization` |
| `safariWebsitePushId` param on `registerAppboyPushMessages()` | `safariWebsitePushId` initialization option |
| `cardId` / `campaignId` on in-app messages | Update your `InAppMessage` subclass constructors |
| `User.setAvatarImageUrl()` | No replacement; no longer used |
| `appboy.Banner` card class | `braze.ImageOnly` |
| `ab-banner` CSS class | `ab-image-only` |

If you call Braze directly, search your codebase for **every** `appboy` reference and use Braze's changelog and upgrade guide to determine the corresponding V6 change. The table above highlights common changes but is not a substitute for reviewing your implementation.

For example, the `appboy.display` namespace was removed and its methods moved to `braze`:

```javascript
// V3
window.appboy.display.showContentCards();

// V6
window.braze.showContentCards();
```

---

## Write version-tolerant code

Do this if you load mParticle via the snippet. After you select `Version 6`, cache busting can leave some visitors on the old kit for a while, so if you call Braze directly, ship code that works against both versions first, then flip the setting.

If you self-host via npm, you control when the kit version ships with your own deploy, so you do not need version-tolerant fallbacks — update your Braze calls and deploy them together with the V6 kit.

The V3 → V6 change that matters most is the global rename, so guard on which global is present:

```javascript
if (window.braze) {
    window.braze.showContentCards();
} else if (window.appboy) {
    window.appboy.display.showContentCards();
}
```

Search your codebase for every remaining direct `appboy` call and apply the same pattern, using the mapping table above and Braze's changelog to find the V6 equivalent of each one.

Once V6 is live and verified, you can delete the `window.appboy` fallbacks and call `window.braze` directly.

---

## Push notifications

If you use push notifications, update your `service-worker.js` to import the V6 service worker that mParticle hosts:

```javascript
self.importScripts('https://static.mparticle.com/sdk/js/braze/service-worker-6.5.0.js');
```

The V3 kit references `service-worker-3.5.0.js`. mParticle hosts Braze's service worker to avoid unpredictable versioning issues — do not point at Braze's own service worker CDN.

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
