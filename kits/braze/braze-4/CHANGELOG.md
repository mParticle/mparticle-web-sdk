## Releases

--


## 4.2.2 - 2026-02-12
-   fix: Replace enableHtmlInAppMessages deprecated method with allowUserSuppliedJavascript (v4 [#61](https://github.com/mparticle-integrations/mparticle-javascript-integration-braze/pull/61)


## 4.2.1 - 2024-10-24
-   fix: Declare reportEvent where previously undeclared [#55](https://github.com/mparticle-integrations/mparticle-javascript-integration-braze/pull/55)

## 4.2.0 - 2024-10-24

-   fix: Report purchase events to mParticle when bundling ecommerce data [#50](https://github.com/mparticle-integrations/mparticle-javascript-integration-braze/pull/50)
-   feat: Implement Google EU Consent [#51](https://github.com/mparticle-integrations/mparticle-javascript-integration-braze/pull/51)

## 4.1.5 - 2024-05-07

-   fix: Allow any userIdentificationType to be used when initializing kit (#48)

## 4.1.4 - 2024-01-24

-   fix: Forward SKU as product name when ecommerce events are bundled [#47](https://github.com/mparticle-integrations/mparticle-javascript-integration-braze/pull/47)

## 4.1.3 - 2023-09-25

-   fix: Add custom logging for onUserIdentified [#42](https://github.com/mparticle-integrations/mparticle-javascript-integration-braze/pull/42))

## 4.1.2 - 2023-07-25

-   fix: Set MPID before open session ([#41](https://github.com/mparticle-integrations/mparticle-javascript-integration-braze/pull/41))

## 4.1.1 - 2023-06-30
- fix: Support bundling products, impressions, and promotions as a single event (#36)

## 4.1.0 - 2023-06-28
- feat: Support bundling products, impressions, and promotions as a single event (#36)

## 4.0.2 - 2023-06-26
- fix: Update @mparticle/web-sdk version in package.json
- ci: Update node version (#35)
- docs: Update readme to include Braze V4 SDK option (#28)

## 4.0.1 - 2023-06-12
- fix: Add suffix of v4 to forwarder (#21)

## 4.0.0 - 2022-10-19

⚠️ **Breaking** - The mParticle web Braze kit now supports Braze's Web SDK V4.2.1.  
* Our partner, Braze, has made significant changes to their web SDK.  As a result, we are also updating our mParticle Braze web kit to support Braze’s Web SDK version 4.2.1.  The updated mParticle Braze Web kit will be available via CDN on Feb 15, 2023 and is currently available on npm at @mparticle/web-braze-kit v4.0.0.  
* There are lots of breaking changes, most notably Braze deprecating the entire `appboy` namespace in favor of `braze`, so please proceed with caution when updating to v4.0.0 via NPM.  If you implement mParticle via snippet, you will have to make changes to your codebase before Feb 15, 2023 to be compatible with both version 3 and version 4 of the Braze SDK to ensure your code continues to work.
* Full details about the changes and recommended code changes can be found on mParticle's [Braze integration docs page](https://docs.mparticle.com/integrations/braze/event).

#### 3.0.4 - 2022-09-06
-   fix: Add Transaction Id to Purchase Commerce Events

#### 3.0.3 - 2022-08-24
-   feat: Add logging for debugging

#### 3.0.2 - 2022-06-16
-   fix: add register_inapp and pushPrimer variables

#### 3.0.1 - 2022-05-18

-   consume initOptions customFlags - this allows a customer to pass a callback to include additional options that mParticle doesn't support in the UI

#### 3.0.0 - 2022-03-28

⚠️ **Breaking** - If you reference any of the below deprecations and implement mParticle via snippet, you will have to make changes to your codebase before June 8, 2022 to be compatible with both version 2 and version 3 of the Braze SDK to ensure your code continues to work.
* Our partner, Braze, has made a few significant changes to their web SDK.  As a result, we are also updating our mParticle Braze web kit to support Braze’s Web SDK version 3.5.0, which includes breaking changes to the Braze SDK behavior.  The updated mParticle Braze Web kit will be available via CDN on June 8, 2022 and is currently available on NPM at @mparticle/web-braze-kit v3.0.0.  Also note that we have updated the name of our npm package from @mparticle/web-appboy-kit to @mparticle/web-braze-kit.
* We highly recommend that you review the changes between version 2 and 3 of the Braze Web SDK to understand these changes, which can be found here.  To summarize:
  * The `appboy.ab` namespace has been removed and everything lives under the `appboy` namespace now.
  * `InAppMessage.Button` has been renamed to `InAppMessageButton`
* Full details can be found in the README at our [AppBoy Repo](https://github.com/mparticle-integrations/mparticle-javascript-integration-appboy#readme).

#### 2.0.7 - 2022-02-09

-   Feat - add new Braze clusters

#### 2.0.6 - 2020-12-10

-   Feat - Add additional Braze clusters to URL mapping table

#### 2.0.5 - 2020-06-04

-   Update Braze to 2.5.2

#### 2.0.4 - 2020-02-12

-   Send SKU if forwardSkuAsProductName is set

#### 2.0.2 - 2020-01-23

-   Feat - Set event name sent to Braze as user provided pageName

#### 2.0.1 - 2019-12-03

-   Bugfix - Respect userId choice in mParticle UI dropdown
-   Add version number
-   Remove isObject dependency
