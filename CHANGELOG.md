## [2.12.6](https://github.com/mParticle/mparticle-web-sdk-public-test/compare/v2.12.5...v2.12.6) (2021-02-09)


### Bug Fixes

* Add failCmd to ci ([315646d](https://github.com/mParticle/mparticle-web-sdk-public-test/commit/315646d947fbe3a6506f6355231cc813bec84149))
* Add key to constants ([a9413b9](https://github.com/mParticle/mparticle-web-sdk-public-test/commit/a9413b93e6dcc835e7215b215692a6868dbf1e67))
* Remove npx and use prepareCmd instead of verifyRelease ([89e96cc](https://github.com/mParticle/mparticle-web-sdk-public-test/commit/89e96cccc3bbec4f0d051b089d62132dbbd44691))
* Update token name ([4fc24fe](https://github.com/mParticle/mparticle-web-sdk-public-test/commit/4fc24fe8c94560c301c942bc3a0da6ef1447665b))

## [2.12.5](https://github.com/mParticle/mparticle-web-sdk-public-test/compare/v2.12.4...v2.12.5) (2021-02-05)


### Bug Fixes

* add abc.js ([7fce6b6](https://github.com/mParticle/mparticle-web-sdk-public-test/commit/7fce6b65ed05944b79221230d2ab2eb5d188e10c))

## [2.12.4](https://github.com/mParticle/mparticle-web-sdk-public-test/compare/v2.12.3...v2.12.4) (2021-02-02)


### Bug Fixes

* remove .releaserc in favor of release.config.js ([9dffabc](https://github.com/mParticle/mparticle-web-sdk-public-test/commit/9dffabcfbdb5dcfbb4583390f1a4127f05ea872a))
* update key1 for constants.js ([fb11b87](https://github.com/mParticle/mparticle-web-sdk-public-test/commit/fb11b87be627424e5bca6801b947faa8db0c4c90))
* update public github test url ([045e3b9](https://github.com/mParticle/mparticle-web-sdk-public-test/commit/045e3b9c679c073e305285a68fe6aa7e136a3433))

## Releases

--

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
