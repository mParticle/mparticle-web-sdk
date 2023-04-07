## [2.20.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.20.0...v2.20.1) (2023-04-05)

# [2.20.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.19.3...v2.20.0) (2023-03-15)


### Features

* Support sideloaded kits ([#395](https://github.com/mParticle/mparticle-web-sdk/issues/395)) ([aa86073](https://github.com/mParticle/mparticle-web-sdk/commit/aa86073adc768a448b7d443101fd7f086cb34518))

## [2.19.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.19.2...v2.19.3) (2023-03-08)


### Bug Fixes

* removeUserAttribute and forwarder filters fix ([#391](https://github.com/mParticle/mparticle-web-sdk/issues/391)) ([838f267](https://github.com/mParticle/mparticle-web-sdk/commit/838f267c858d56bf5a75b0f1f3a19f1bac4fbc79))
* Verify Batches and events are uploaded in order of creation ([#394](https://github.com/mParticle/mparticle-web-sdk/issues/394)) ([8553331](https://github.com/mParticle/mparticle-web-sdk/commit/8553331fa7e53e9c59901e98a5f45519b2f7d533))

## [2.19.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.19.1...v2.19.2) (2023-03-03)


### Bug Fixes

* Revert "refactor: Modify BatchUploader to use promises for individual uploads ([#385](https://github.com/mParticle/mparticle-web-sdk/issues/385))" ([#398](https://github.com/mParticle/mparticle-web-sdk/issues/398)) ([bc9de3a](https://github.com/mParticle/mparticle-web-sdk/commit/bc9de3a6dc9a43e62ac2c53c4897a4b02eb5875f))

## [2.19.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.19.0...v2.19.1) (2023-02-16)

# [2.19.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.18.3...v2.19.0) (2023-02-08)


### Features

* Add Persistence Wrapper ([#388](https://github.com/mParticle/mparticle-web-sdk/issues/388)) ([f4bc3d6](https://github.com/mParticle/mparticle-web-sdk/commit/f4bc3d6548451d0167d6dffb7da73e574a44a069))

## [2.18.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.18.2...v2.18.3) (2023-02-01)


### Bug Fixes

* use currentUser consent state as backup if missing in last event ([#384](https://github.com/mParticle/mparticle-web-sdk/issues/384)) ([9493faa](https://github.com/mParticle/mparticle-web-sdk/commit/9493faa67da415ff54eb18ec001bdef537b3cca5))

## [2.18.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.18.1...v2.18.2) (2023-01-25)


### Bug Fixes

* Add wrapper SDK name/version setter for diagnostics ([#376](https://github.com/mParticle/mparticle-web-sdk/issues/376)) ([727e8e2](https://github.com/mParticle/mparticle-web-sdk/commit/727e8e2abed705041930cd13ba43204e5d8c2b32))

## [2.18.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.18.0...v2.18.1) (2023-01-04)


### Bug Fixes

* Fix Firefox Runner and Remove references to node 12 ([#369](https://github.com/mParticle/mparticle-web-sdk/issues/369)) ([083672f](https://github.com/mParticle/mparticle-web-sdk/commit/083672f8d5056f88c2362e2eab42e92762c17b5d))
* Prevent Batches from queuing empty events ([#367](https://github.com/mParticle/mparticle-web-sdk/issues/367)) ([4bf8ef9](https://github.com/mParticle/mparticle-web-sdk/commit/4bf8ef96e2cd130e3a9ff83e14047c63987c694f))

# [2.18.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.17.4...v2.18.0) (2022-11-08)


### Bug Fixes

* Process queued events after there are no more integration delays ([#365](https://github.com/mParticle/mparticle-web-sdk/issues/365)) ([99910c7](https://github.com/mParticle/mparticle-web-sdk/commit/99910c79849063adcf922c588d6b96bcc984c9f3))


### Features

* Expose getEnvironment() for mParticle Instance ([#366](https://github.com/mParticle/mparticle-web-sdk/issues/366)) ([378b894](https://github.com/mParticle/mparticle-web-sdk/commit/378b8948cc77edc71625cd07b21a3613a6300ea2))

## [2.17.4](https://github.com/mParticle/mparticle-web-sdk/compare/v2.17.3...v2.17.4) (2022-10-11)

## [2.17.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.17.2...v2.17.3) (2022-10-03)


### Bug Fixes

* Check for undefined rather than falsey values for UAC events ([#361](https://github.com/mParticle/mparticle-web-sdk/issues/361)) ([2514055](https://github.com/mParticle/mparticle-web-sdk/commit/2514055e2ba7f0dc1b3030a187bafba49b72dbd7))

## [2.17.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.17.1...v2.17.2) (2022-09-14)


### Bug Fixes

* Update last event sent timestamp for batch uploads ([#360](https://github.com/mParticle/mparticle-web-sdk/issues/360)) ([4cbb3c5](https://github.com/mParticle/mparticle-web-sdk/commit/4cbb3c55b2702da35dc79db195607ff00aee4f2f))

## [2.17.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.17.0...v2.17.1) (2022-08-25)

# [2.17.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.16.3...v2.17.0) (2022-08-23)


### Features

* Add custom logger to kits ([#341](https://github.com/mParticle/mparticle-web-sdk/issues/341)) ([76ad737](https://github.com/mParticle/mparticle-web-sdk/commit/76ad73765942cef4ba7a355512283e097b292813))

## [2.16.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.16.2...v2.16.3) (2022-07-28)


### Bug Fixes

* prevent errors when onCreateBatch does not return a batch ([#299](https://github.com/mParticle/mparticle-web-sdk/issues/299)) ([c8f085d](https://github.com/mParticle/mparticle-web-sdk/commit/c8f085d8eaac5e8fa6cc1a01eaf70c92dc07b773))

## [2.16.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.16.1...v2.16.2) (2022-06-29)

## [2.16.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.16.0...v2.16.1) (2022-06-16)


### Bug Fixes

* Rebuild package-lock.json ([#276](https://github.com/mParticle/mparticle-web-sdk/issues/276)) ([a9c8990](https://github.com/mParticle/mparticle-web-sdk/commit/a9c899040a8b49856743a06f8b73cfa10611e232))
* Remove YUI from package.json ([#266](https://github.com/mParticle/mparticle-web-sdk/issues/266)) ([129e1d1](https://github.com/mParticle/mparticle-web-sdk/commit/129e1d1854c5d4f3ee842308340ab19634e8d71c))

# [2.16.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.15.5...v2.16.0) (2022-05-18)


### Features

* add package to batch application info ([#238](https://github.com/mParticle/mparticle-web-sdk/issues/238)) ([5e6e773](https://github.com/mParticle/mparticle-web-sdk/commit/5e6e773aaa6e4b476a7aa029db04e1b9facdb372))
* add support for client side rules ([#241](https://github.com/mParticle/mparticle-web-sdk/issues/241)) ([dc40f14](https://github.com/mParticle/mparticle-web-sdk/commit/dc40f14a0ed1cebba5ce4169fa823991be1d3202))

## [2.15.5](https://github.com/mParticle/mparticle-web-sdk/compare/v2.15.4...v2.15.5) (2022-05-11)


### Bug Fixes

* add warning of upcoming upgrade for V2 Users ([#237](https://github.com/mParticle/mparticle-web-sdk/issues/237)) ([93d1ad4](https://github.com/mParticle/mparticle-web-sdk/commit/93d1ad47f9d38c22312049913450409a1de1a7a8))

## [2.15.4](https://github.com/mParticle/mparticle-web-sdk/compare/v2.15.3...v2.15.4) (2022-05-02)


### Bug Fixes

* add UAC and UIC as upload triggers ([7576509](https://github.com/mParticle/mparticle-web-sdk/commit/75765092840fbf80752fbafd26dae7cceed03e6c))

## [2.15.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.15.2...v2.15.3) (2022-04-28)


### Bug Fixes

* revert slugify removal ([15c6af5](https://github.com/mParticle/mparticle-web-sdk/commit/15c6af591cd6d9f1ef9d665e9d0565ccc080b18d))

## [2.15.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.15.1...v2.15.2) (2022-04-27)

## [2.15.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.15.0...v2.15.1) (2022-04-20)


### Bug Fixes

* add validation to prevent null event category from sending ([#358](https://github.com/mParticle/mparticle-web-sdk/issues/358)) ([cc93497](https://github.com/mParticle/mparticle-web-sdk/commit/cc934975a196e0f5c20ab834e9f9026fbb7f53db))
* decode cookie error on special character attributes ([#365](https://github.com/mParticle/mparticle-web-sdk/issues/365)) ([9237a44](https://github.com/mParticle/mparticle-web-sdk/commit/9237a449d7eb5b7e8910ff3cd584e60929efaf9d))
* ensure sessions/AST initialize before identity callback ([#360](https://github.com/mParticle/mparticle-web-sdk/issues/360)) ([2663a57](https://github.com/mParticle/mparticle-web-sdk/commit/2663a57a23d0b478cc149d1b7361f72a3e1c68f0))

# [2.15.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.14.2...v2.15.0) (2022-03-01)


### Bug Fixes

* prevent erroneous event logging to kits when an event is not sent ([dfc0f4f](https://github.com/mParticle/mparticle-web-sdk/commit/dfc0f4f260e5e608d86d75e2f426889b8864c581))


### Features

* add API to set device id ([#341](https://github.com/mParticle/mparticle-web-sdk/issues/341)) ([b81e4d3](https://github.com/mParticle/mparticle-web-sdk/commit/b81e4d30fd502ad6d76cfc4d1f95c91602975738))
* add isInitialized to mParticle object ([5fbc9df](https://github.com/mParticle/mparticle-web-sdk/commit/5fbc9dffecaf187a08eab464428a5e75048f89d3))

## [2.14.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.14.1...v2.14.2) (2022-02-09)


### Bug Fixes

* Refactor Public methods to queue if Store is not initialized ([#311](https://github.com/mParticle/mparticle-web-sdk/issues/311)) ([27d506c](https://github.com/mParticle/mparticle-web-sdk/commit/27d506cb06d0cb4f5e50b9a7175c1113d5f42b0c))
* Update cookie sync date only upon successful cookie sync ([48d6fe1](https://github.com/mParticle/mparticle-web-sdk/commit/48d6fe179c3b9952a89661c785fb4af6ce4f8b23))
* update reusable workflow urls ([#265](https://github.com/mParticle/mparticle-web-sdk/issues/265)) ([1c334d3](https://github.com/mParticle/mparticle-web-sdk/commit/1c334d3eeccb481aa100f232146269018da2323e))

## [2.14.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.14.0...v2.14.1) (2021-09-02)


### Bug Fixes

* Add launch_referrer to event data ([cd7dc62](https://github.com/mParticle/mparticle-web-sdk/commit/cd7dc622016ebba0fd190a0d029de4c45afdbc38))
* Allow multiple promotions to be logged when calling logPromotion ([9e0dd5b](https://github.com/mParticle/mparticle-web-sdk/commit/9e0dd5b22da657d5a4274d80c38eaab64f57182d))

# [2.14.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.13.0...v2.14.0) (2021-08-04)


### Bug Fixes

* globalThis is not defined ([3a849c6](https://github.com/mParticle/mparticle-web-sdk/commit/3a849c68a284fa21eb370836accca7fb584e30dd))
* Update semantic release secret name ([0824ef5](https://github.com/mParticle/mparticle-web-sdk/commit/0824ef57e6ea795702d631051fc02d52d2b8fb6a))


### Features

* Allow scope param on user alias requests ([a864aef](https://github.com/mParticle/mparticle-web-sdk/commit/a864aefc2db11d63d57174e92b6c5965a93471a8))

# [2.13.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.12.9...v2.13.0) (2021-07-29)


### Features

* Bypass functionality when a specific config option is passed ([#159](https://github.com/mParticle/mparticle-web-sdk/issues/159)) ([2727a43](https://github.com/mParticle/mparticle-web-sdk/commit/2727a437a6d0a25481c9120b3c93fd23fb520f37))

## [2.12.9](https://github.com/mParticle/mparticle-web-sdk/compare/v2.12.8...v2.12.9) (2021-06-23)


### Bug Fixes

* Update esm/common rollup.config to prevent regenerator runtime issue ([2ff362f](https://github.com/mParticle/mparticle-web-sdk/commit/2ff362f5243659cdefd4863609c1c93d5e76fc66))

## Releases

--

#### 2020-05-06

-   Any new workspaces with JS API Keys will now batch all web events in order to save bandwidth and improve site performance. To read more about web batching see here - https://docs.mparticle.com/developers/sdk/web/getting-started#upload-interval--batching. This does not require any updates to the SDK itself. No implementation changes are required. If you have a workspace created prior to 2020-05-06 and are not yet on batching, please contact your Customer Success Manager.

#### 2.12.8 - 2021-04-06

-   Bugfix: Rename pageViewFilters to screenAttributeFilters
    Enables screen attributes to be filtered out on downstream forwarders

#### 2.12.7 - 2021-03-25

-   Bugfix - Add product impressions to kit blocking
-   Feat - Consent-based cookie-sync
-   Bugfix - Add source message id

#### 2.12.5 - 2021-02-17

-   Bugfix - Use addEventListeners for life cycle events
-   Bugfix - Set setCurrencyCode on eCommerce object

#### 2.12.4 - 2021-02-09

-   Refactor - Import version from package.json
-   Format code styling

#### 2.12.3 - 2021-01-20

-   Bugfix - update is first run to booleans
-   Bugfix - Sanitize ecommerce amounts to numbers
-   Bugfix - Set sessionStartDate to 0 instead of null
-   Bugfix - Error events - Set to null if stack trace is undefined; Add context to error events

#### 2.12.2 - 2020-11-12

-   Bugfix - Fix data plan options API
-   Bugfix - Add try/catch to cookie searching

#### 2.12.1 - 2020-11-11

-   Fix Typo in logging
-   Update identity mappings
-   Bugfix - Add check for window for node environments

#### 2.12.0 - 2020-10-29

-   Feat - Implement client side kit blocking
    You can now use Data Master to block unplanned events and attributes from being sent to client side forwarders.

#### 2.11.16 - 2020-10-26

-   Remove eventsApiModels.ts in favor of js-events npm module
-   Feat - Add event and product context to sanitized attributes
-   Add logic to handle Media Events as Custom Events
-   Add additional tests for app name change in config

#### 2.11.15 - 2020-06-30

-   Feat - Add transactionAttributes to logProductAction method signature

#### 2.11.14 - 2020-06-24

-   Bugfix - Make tagging batches with appropriate UI more robust

#### 2.11.13 - 2020-06-17

-   Bugfix - prevent null CCPA consent on events v3 endpoint

#### 2.11.12 - 2020-06-03

-   Bugfix - logProductActions of purchase/refund conform to logPurchase/logRefund

#### 2.11.11 - 2020-05-12

-   Feat - Add Other5-Other10, mobile/phone number identity types

#### 2.11.10 - 2020-04-23

-   Bugfix - Fix v3 events endpoint location payload

#### 2.11.9 - 2020-04-02

-   Bugfix - Send specific user along with UIC and UAC Events
-   Dependabot - Bump Acorn version

#### 2.11.8 - 2020-03-16

-   Don't set empty TransactionAttribute fields

#### 2.11.7 - 2020-03-04

-   Deprecate removeCCPAState in favor of removeCCPAConsentState
-   Feat - XHR Support for Batching

#### 2.11.6 - 2020-02-26

-   Migrate network tests from local Mockhttprequest to Sinon
-   Bugfix - Flush eventQueue after identity callback

#### 2.11.5 - 2020-02-12

-   Update node version for Travis
-   Api docs update
-   Bugfix - Enable configuration of v1 endpoints

#### 2.11.4 - 2020-02-06

-   Feat - Modify reset API for public consumption
-   Feat - Import @mparticle/event-models to replace eventApiModels
-   Bugfix - Typo & keep persistence checking consistent

#### 2.11.3 - 2020-02-04

-   Update package.json (Add mparticle.js to dist/ for partner kit testing)

#### 2.11.2 - 2020-02-01

-   Feat - Add support for custom v3 URL

#### 2.11.1 - 2020-01-29

-   Bugfix - resolve when browser has disabled localStorage
-   Bugfix - Do not log deprecated warnings when logging purchases
-   Feat - Add support for Data Planning to V2 Events upload

#### 2.11.0 - 2020-01-16

-   Feat - Add CCPA support
-   Add batch creator class for ESLint data planning plugin

#### 2.10.2 - 2019-12-19

-   Feat - Pass appName to config

#### 2.10.1 - 2019-12-11

-   Bugfix - Do not populate data plan context when plan id is null

#### 2.10.0 - 2019-11-13

-   Feat - Implement Multiple Instances

#### 2.9.16 - 2019-11-06

-   Bugfix - Parse string in shouldEnableBatching

#### 2.9.15 - 2019-11-06

-   Deprecate Cart - The mParticle functionality will be removed in a future release, please
-   Bugfix - Self hosting namespaces storage with workspaceToken again

#### 2.9.14 - 2019-10-31

-   Remove mparticle.js from root
-   Feat - Stub logBaseEvent in snippet, add snippet comments
-   Feat - Implement User Identity Change & User Attribute Change Events
-   Allow MediaEvents and Media PageEvents to be supported
-   Happy Halloween! :jack_o_lantern:

#### 2.9.13 - 2019-10-09

-   Refactor codebase with Prettier
-   Bugfix - Resolve Sonarqube code smells
-   Modify Rollup builds

#### 2.9.12 - 2019-10-02

-   Support event batching and beacon API; provide new Events API v3 endpoint which supports batching
-   Implement Typescript and Babel compilation
-   Feat - Enable configuration of config endpoint

#### 2.9.11 - 2019-09-26

-   Feat - Add Base Event functionality to core for future child SDK use
-   Update .eslintrc, fix urls in yuidoc comments

#### 2.9.10 - 2019-08-21

-   Add integration tests for bundlers (webpack, browserify, rollup)
-   Bugfix - Make getCartProducts more robust
-   Bugfix - Fix immediate logging for self hosting
-   Feat - add session start to server DTO
-   Bugfix - update modify old_value

#### 2.9.9 - 2019-08-07

-   Bugfix - Check all event attributes when forwarding rules are set

#### 2.9.8 - 2019-08-07

-   Migrate to ES6 Modules; Replace Browserify with Rollup

#### 2.9.7 - 2019-07-16

-   Bugfix - noHttpCoverage code properly sent to callback
-   Bugfix - Configure forwarders prior to identify callback

#### 2.9.6 - 2019-07-08

-   Bugfix - Alias requests respect isDevelopmentMode setting

#### 2.9.5 - 2019-07-01

-   Bugfix - set isInitialized in both web and webview contexts
-   Feature: log error custom attributes
-   Update build parameters

#### 2.9.4 - 2019-06-25

-   Modify files for self hosting
    -   Add a /config endpoint
    -   Accept 2nd argument to init for configuration
-   Bugfix - Initialize Logger before Store

#### 2.9.3 - 2019-06-20

-   Bugfix - retain mParticle.isIOS on script load

#### 2.9.2 - 2019-06-10

-   Bugfix - respect mParticle.isIOS setting

#### 2.9.1 - 2019-06-05

-   Make endpoints configurable

#### 2.9.0 - 2019-05-28

-   Implement User Aliasing
-   Bugfixes - Helpers.debug & set isFirstRun to false after app inits for the first time

#### 2.8.12 - 2019-05-08

-   Implement firstSeen and lastSeen fields for MParticleUser
-   Sort MParticleUser Array returned by getUsers() by lastSeenTime
-   Bugfix - Callback validation & correct warning message
-   Add getPreviousUser() to Identity callbacks

#### 2.8.11 - 2019-04-24

-   Refactor config into a class
-   Implement Logger
-   Fix consent object validation and remove unneeded null check

#### 2.8.10 - 2019-04-10

-   Prefer modules over public mParticle methods

#### 2.8.9 - 2019-03-13

-   Simplify / remove migrations

#### 2.8.8 - 2019-02-20

-   Bugfix - Native SDK - prioritize equality of requiredWebviewBridgeName

#### 2.8.7 - 2019-02-14

-   Update native bridge logic

#### 2.8.6 - 2019-02-14

-   Namespace localstorage with workspace token

#### 2.8.5 - 2019-02-13

-   Add callback to location tracking method

#### 2.8.4 - 2019-02-04

-   Set session attributes when using native bridge

#### 2.8.3 - 2019-01-30

-   Bugfix - Check for LocalStorage before migrating

#### 2.8.2 - 2019-01-25

-   Bugfix - Guard against undefined result from crypto API
-   Bugfix - Call identify if cookies exist, but there is no current user

#### 2.8.1 - 2019-01-23

-   Add identityMethod to onUserIdentified function definition
-   Bugfix - return 0 instead of null for hashing boolean false

#### 2.8.0 - 2018-12-19

-   Fix autogen yuidocs comments
-   Add get/setIntegrationAttribute APIs
-   Add snippet tests
-   Add boolean validation for isDevelopmentMode

#### 2.7.8 - 2018-10-24

-   Initialize forwarders based on logged in status

#### 2.7.7 - 2018-10-15

-   Bugfix - remove cart item uses proper product persistence
-   Bugfix - Guard against corrupt local storage/cookies

#### 2.7.6 - 2018-10-10

-   Bugfix - guard against null cookie

#### 2.7.5 - 2018-09-19

-   Add getUser method to identity callback results
-   Only call initial identify and callback once
-   Bugfix - logLevel

#### 2.7.4 - 2018-09-14

-   Bugfix - Remove corrupt localStorage
-   Bugfix - Fix encoding LS for special characters

#### 2.7.3 - 2018-08-30

-   Bugfix - Always init forwarder when no UA filters are present

#### 2.7.2 - 2018-08-22

-   Re-initialize forwarders after userAttr changes
-   Capitalize all letters in sessionId

#### 2.7.1 - 2018-08-10

-   Bugfix - Create copy of MP.eventQueue to iterate through

#### 2.7.0 - 2018-08-08

-   Add setUserAttributes to public API

#### 2.6.4 - 2018-08-01

-   Implement forwarderUploader module, feaure flags, batch forwarder stats
-   Bugfix - Change ProductActionTypes to be consistent with mobile/S2S

#### 2.6.3 - 2018-07-18

-   Implement customFlags per public API method

#### 2.6.2 - 2018-07-16

-   Update growl and hoek for testing dependencies
-   Bugfix - sendEventToForwarder fix

#### 2.6.1 - 2018-07-11

-   Default forceHttps to true
-   Add apiClient module

#### 2.6.0 - 2018-06-20

-   Implement Consent forwarding rules

#### 2.5.1 - 2018-06-11

-   Bugfix - Fix filterUserAttributeValues break/continue

#### 2.5.0 - 2018-06-06

-   Expose getUser and getUsers to public Identity API
-   Bugfix - send newUser to forwarder on user identified
-   Add filtered user object

#### 2.4.1 - 2018-05-09

-   Bugfix - encode event value before sending to iOS
-   Update package-lock.json to pass CI tests

#### 2.4.0 - 2018-04-26

-   Implement Consent State
-   Expose Identitiy HTTP constants to the public

#### 2.3.3 - 2018-04-19

-   Bugfix - filter user attributes to forwarders on init

#### 2.3.2 - 2018-04-04

-   Bugfix - filter user attributes to forwarders on init

#### 2.3.1 - 2018-04-02

-   Bugfix - Compare strings when filtering event/user attribute values

#### 2.3.0 - 2018-03-28

-   Bugfix - Prioritize client entered config over persistence
-   Bugfix - Correct capitalization of clearing eCommerce carts
-   Add Identify to public API

#### 2.2.6 - 2018-03-07

-   Add forceHttps as a config option
-   Fix linting
-   Migrate all mpids between cookies and LS when useCookieStorage changes

#### 2.2.5 - 2018-03-01

-   Bugfix - add shouldUseNativeSdk logic to fix null user and null path values

#### 2.2.4 - 2018-02-28

-   Add config option for maxCookieSize
-   Refactor useNativeSdk and prevent identify calls when in webview

#### 2.2.3 - 2018-02-23

-   Update logic for useNativeSdk and isIOS

#### 2.2.2 - 2018-02-20

-   Pass identityApiData to native SDKs

#### 2.2.1 - 2018-02-14

-   Queue events when mpid is null or 0
-   Stub primary methods for pre-loading SDK invocation
-   Add eventSubscriptionId to forwarder contract
-   Update readme to remove adchemix

#### 2.2.0 - 2018-01-31

-   Remove product bags

#### 2.1.5 - 2018-01-25

-   Update version endpoint for /Forwarding

#### 2.1.4 - 2018-01-10

-   Ensure customerid is always the first identity being set
-   Auto generate API docs
-   Add migration for base64 encoded products
-   Finalize Other IDs
-   Bugfix - Adjust logic for session end event

#### 2.1.3 - 2017-12-20

-   Remove logLTVIncrease
-   Return an empty array when there are no cart products
-   Bugfix - Adjust arguments for applyToForwarders

#### 2.1.2 - 2017-12-14

-   Add setForwarderOnUserIdentified, return null currentUser when MPID is null

#### 2.1.1 - 2017-12-13

-   Modularize tests for readability and robustness
-   Adjust Application State Transition, include initial location
-   Bugfix - Add CheckoutOption to ProductAction-related switch statements
-   Add parseStringOrNumber function
-   Sanitize additional attributes
-   Correct order of internal createProducts arguments
-   Refactor logPageView
-   Require explicit UIWebview binding

#### 2.1.0 - 2017-11-30

-   Migrate persistence to v4
-   Add onUserAlias callback

#### 2.0.13 - 2017-11-08

-   Add support for filtering user attribute values
-   Update persistence after a modify call

#### 2.0.12 - 2017-10-23

-   Complete modularization of SDK

#### 2.0.11 - 2017-10-19

-   Modularize Types, Constants, Helpers, DTO, Identity, Ecommerce
-   Reorganize tests

#### 2.0.10 - 2017-10-17

-   Bugfix - Execute useLocalStorage method

#### 1.14.1 - 2017-06-22

-   Fixes for cookie syncing. Properly cookie sync when MPID changes, and only perform a cookie sync when debug modes for defined pixel and mParticle match
-   Store productBags and cartProducts to cookies, with config option to change number of products allowed in each (config.maxProducts = 20 by default)
-   Prevent setUserIdentity from accepting booleans
-   Clean up code - Add additional validations, convert remaining == to ===

#### 1.14.0 - 2017-06-15

-   Support for cookie-syncing. Cookie-syncing enables the optional collection of 3rd-party IDs to enable enhanced audience sharing with advertising platforms such as DoubleClick, Adobe, and AppNexus
-   Add application state transition to mParticle initialization

#### 1.13.1 - 2017-05-25

-   Fix for removing duplicate user identities where ID is missing, allow ID to be `undefined`
-   Fix for creating CGID on initial load

#### 1.13.0 - 2017-05-18

-   Send sessionLength to server when sessionEnd is called.

#### 1.12.0 - 2017-05-11

-   Add deviceId, and deviceId retrieval via `mParticle.getDeviceId()`.

#### 1.11.0 - 2017-04-27

-   Add new session management.
-   Fixed a bug where the same sessionId may be associated with events over several days.

#### 1.10.0 - 2017-04-20

-   Added config option for useCookieStorage to allow use of either cookies or localStorage. By default, localStorage is used (useCookieStorage = false). If localStorage not available, reverts to cookie use.
-   Fixed a bug where `forwarders` contained a mix of both initialized and uninitialized forwarders. `forwarders` now only contains initialized forwarders.

#### 1.9.0 - 2017-04-17

-   Fixed bug where calling setUserIdentity with a similar type added another identity, rather than replacing the identity.
-   Calling setUserIdentity with `id = null` and valid type will remove the user identity of that type.
-   Include CommerceEvent custom attributions in expansion; makes a copy of the original commerce event rather than referencing it, which would mutate it.
