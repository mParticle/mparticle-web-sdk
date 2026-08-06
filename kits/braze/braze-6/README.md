![Braze Logo](https://github.com/mparticle-integrations/mparticle-javascript-integration-appboy/blob/master/braze-logo.png) 

⚠️⚠️⚠️
# Notice! Opt in is now available for Braze Web SDK V6 - Action Required

You can now select what version of the Braze SDK you want to use when setting up a Braze connection in the mParticle UI.  Braze occasionally makes breaking changes to their SDK, so if you call `braze` directly in your code, you will have to update your code to ensure your website performs as expected when updating versions of Braze.

Please review the [Braze Changelog](https://www.braze.com/docs/developer_guide/platform_integration_guides/web/changelog#600) and [V6 migration guide](https://github.com/braze-inc/braze-web-sdk/blob/master/UPGRADE_GUIDE.md) to learn about the differences between V5 and V6 and what changes you will need to make in your code. The most significant breaking change is the removal of the legacy News Feed feature and associated methods (e.g. `destroyFeed()`, `toggleFeed()`, `showFeed()`), in addition to the removal and renaming of several other APIs. There may be API changes that affect you if you call `braze` directly from your code.

You can opt into the latest major version of the Braze Web SDK whether you implement mParticle's Web SDK using npm or our snippet/CDN.
* Customers who self-host mParticle via npm - You should add @mparticle/web-braze-kit-6 version 6.1.0 or greater in your package.json.  You must also select `Version 6` under `Braze Web SDK Version`  in the Braze connection settings.
* Customers who load mParticle via snippet/CDN - You must  select `Version 6` under `Braze Web SDK Version`  in the Braze connection settings.

Step 1: Whether you are using the snippet or self hosting, you need to navigate to your Braze connection settings and select `Version 6` from the `Braze Web SDK Version` drop down.

Step 2: Remove or replace any calls to removed APIs (e.g. News Feed methods such as `destroyFeed()`, `toggleFeed()`, `showFeed()`) and update any renamed APIs per the migration guide. We recommend testing thoroughly in a development environment before releasing.

Step 3: Push Notifications via service-worker.js
If you use Push Notifications, your `service-worker.js` file should be updated to reference `https://static.mparticle.com/sdk/js/braze/service-worker-6.5.0.js` instead of `https://static.mparticle.com/sdk/js/braze/service-worker-5.5.0.js`.  Your `service-worker.js` file should now contain:

```javascript
self.importScripts('https://static.mparticle.com/sdk/js/braze/service-worker-6.5.0.js')
```

# Recommended eCommerce Events (opt-in)

Braze Web SDK **6.9.0+** introduces [recommended eCommerce events](https://www.braze.com/docs/developer_guide/analytics/logging_ecommerce_events/#web) with the full attribute set (including top-level `tax`, `shipping`, and `subtotal_value`). When the **`useEcommerceRecommendedEvents`** setting is enabled on the Braze connection, this kit forwards supported mParticle commerce events using that schema. When the setting is off (the default), commerce forwarding is unchanged and fully backward compatible.

Requirements:

* **Minimum Braze Web SDK version: 6.9.0** (`braze.logEcommerceEvent` with the `tax`/`shipping`/`subtotal_value` attributes). The kit detects support at runtime; if the loaded Braze SDK is older than 6.9.0, commerce events automatically fall back to legacy forwarding.
* **Minimum mParticle Braze kit version:** the first release that includes this feature (`@mparticle/web-braze-kit-6`).

When enabled, mParticle commerce actions map to Braze recommended events:

| mParticle commerce action | Braze recommended event |
| :--- | :--- |
| `add_to_cart` | `ecommerce.cart_updated` (action `add`) |
| `remove_from_cart` | `ecommerce.cart_updated` (action `remove`) |
| `checkout` | `ecommerce.checkout_started` |
| `view_detail` | `ecommerce.product_viewed` (one per product) |
| `purchase` | `ecommerce.order_placed` |
| `refund` | `ecommerce.order_refunded` (custom event; no typed Braze API) |

`tax` and `shipping` map to the recognized top-level attributes from mParticle's `TransactionAttributes.tax`/`shipping`. `total_discounts` and `subtotal_value` have no native mParticle field and are sourced from the `total_discounts` / `subtotal_value` commerce custom attributes (`tax`/`shipping`/`subtotal_value` apply to cart_updated/checkout_started/order_placed; `total_discounts` to order_placed/refund). Any remaining attribute without a direct Braze equivalent (`cart_id`, `checkout_id`, `source`, product `brand`/`category`/`coupon_code`/`position`, etc.) is placed inside the event- or product-level `metadata` object, per Braze's strict recommended-event schema. `source` is reported as `"web"`. Any commerce action not listed above continues to use legacy forwarding.

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
