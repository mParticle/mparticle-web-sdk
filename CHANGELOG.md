## Releases
--

#### 2.9.2 - 2019-06-10
* Bugfix - respect mParticle.isIOS setting

#### 2.9.1 - 2019-06-05
* Make endpoints configurable

#### 2.9.0 - 2019-05-28
* Implement User Aliasing
* Bugfixes - Helpers.debug & set isFirstRun to false after app inits for the first time

#### 2.8.12 - 2019-05-08
* Implement firstSeen and lastSeen fields for MParticleUser
* Sort MParticleUser Array returned by getUsers() by lastSeenTime
* Bugfix - Callback validation & correct warning message
* Add getPreviousUser() to Identity callbacks

#### 2.8.11 - 2019-04-24
* Refactor config into a class
* Implement Logger
* Fix consent object validation and remove unneeded null check

#### 2.8.10 - 2019-04-10
*  Prefer modules over public mParticle methods

#### 2.8.9 - 2019-03-13
*  Simplify / remove migrations

#### 2.8.8 - 2019-02-20
*  Bugfix - Native SDK - prioritize equality of requiredWebviewBridgeName

#### 2.8.7 - 2019-02-14
*  Update native bridge logic

#### 2.8.6 - 2019-02-14
*  Namespace localstorage with workspace token

#### 2.8.5 - 2019-02-13
*  Add callback to location tracking method

#### 2.8.4 - 2019-02-04
*  Set session attributes when using native bridge

#### 2.8.3 - 2019-01-30
*  Bugfix - Check for LocalStorage before migrating

#### 2.8.2 - 2019-01-25
*  Bugfix - Guard against undefined result from crypto API
*  Bugfix - Call identify if cookies exist, but there is no current user

#### 2.8.1 - 2019-01-23
*  Add identityMethod to onUserIdentified function definition
*  Bugfix - return 0 instead of null for hashing boolean false

#### 2.8.0 - 2018-12-19
*  Fix autogen yuidocs comments
*  Add get/setIntegrationAttribute APIs
*  Add snippet tests
*  Add boolean validation for isDevelopmentMode

#### 2.7.8 - 2018-10-24
*  Initialize forwarders based on logged in status

#### 2.7.7 - 2018-10-15
*  Bugfix - remove cart item uses proper product persistence
*  Bugfix - Guard against corrupt local storage/cookies

#### 2.7.6 - 2018-10-10
*  Bugfix - guard against null cookie

#### 2.7.5 - 2018-09-19
*  Add getUser method to identity callback results
*  Only call initial identify and callback once
*  Bugfix - logLevel

#### 2.7.4 - 2018-09-14
*  Bugfix - Remove corrupt localStorage
*  Bugfix - Fix encoding LS for special characters

#### 2.7.3 - 2018-08-30
*  Bugfix - Always init forwarder when no UA filters are present

#### 2.7.2 - 2018-08-22
*  Re-initialize forwarders after userAttr changes
*  Capitalize all letters in sessionId

#### 2.7.1 - 2018-08-10
*  Bugfix - Create copy of MP.eventQueue to iterate through

#### 2.7.0 - 2018-08-08
*  Add setUserAttributes to public API

#### 2.6.4 - 2018-08-01
*  Implement forwarderUploader module, feaure flags, batch forwarder stats
*  Bugfix - Change ProductActionTypes to be consistent with mobile/S2S

#### 2.6.3 - 2018-07-18
*  Implement customFlags per public API method

#### 2.6.2 - 2018-07-16
*  Update growl and hoek for testing dependencies
*  Bugfix - sendEventToForwarder fix

#### 2.6.1 - 2018-07-11
*  Default forceHttps to true
*  Add apiClient module

#### 2.6.0 - 2018-06-20
*  Implement Consent forwarding rules

#### 2.5.1 - 2018-06-11
*  Bugfix - Fix filterUserAttributeValues break/continue

#### 2.5.0 - 2018-06-06
*  Expose getUser and getUsers to public Identity API
*  Bugfix - send newUser to forwarder on user identified
*  Add filtered user object

#### 2.4.1 - 2018-05-09
*  Bugfix - encode event value before sending to iOS
*  Update package-lock.json to pass CI tests

#### 2.4.0 - 2018-04-26
*  Implement Consent State
*  Expose Identitiy HTTP constants to the public

#### 2.3.3 - 2018-04-19
*  Bugfix - filter user attributes to forwarders on init

#### 2.3.2 - 2018-04-04
*  Bugfix - filter user attributes to forwarders on init

#### 2.3.1 - 2018-04-02
*  Bugfix - Compare strings when filtering event/user attribute values

#### 2.3.0 - 2018-03-28
*  Bugfix - Prioritize client entered config over persistence
*  Bugfix - Correct capitalization of clearing eCommerce carts
*  Add Identify to public API

#### 2.2.6 - 2018-03-07
*  Add forceHttps as a config option
*  Fix linting
*  Migrate all mpids between cookies and LS when useCookieStorage changes

#### 2.2.5 - 2018-03-01
*  Bugfix - add shouldUseNativeSdk logic to fix null user and null path values

#### 2.2.4 - 2018-02-28
*  Add config option for maxCookieSize
*  Refactor useNativeSdk and prevent identify calls when in webview

#### 2.2.3 - 2018-02-23
*  Update logic for useNativeSdk and isIOS

#### 2.2.2 - 2018-02-20
*  Pass identityApiData to native SDKs

#### 2.2.1 - 2018-02-14
*  Queue events when mpid is null or 0
*  Stub primary methods for pre-loading SDK invocation
*  Add eventSubscriptionId to forwarder contract
*  Update readme to remove adchemix

#### 2.2.0 - 2018-01-31
*  Remove product bags

#### 2.1.5 - 2018-01-25
*  Update version endpoint for /Forwarding

#### 2.1.4 - 2018-01-10
*  Ensure customerid is always the first identity being set
*  Auto generate API docs
*  Add migration for base64 encoded products
*  Finalize Other IDs
*  Bugfix - Adjust logic for session end event

#### 2.1.3 - 2017-12-20
*  Remove logLTVIncrease
*  Return an empty array when there are no cart products
*  Bugfix - Adjust arguments for applyToForwarders

#### 2.1.2 - 2017-12-14
*  Add setForwarderOnUserIdentified, return null currentUser when MPID is null

#### 2.1.1 - 2017-12-13
*  Modularize tests for readability and robustness
*  Adjust Application State Transition, include initial location
*  Bugfix - Add CheckoutOption to ProductAction-related switch statements
*  Add parseStringOrNumber function
*  Sanitize additional attributes
*  Correct order of internal createProducts arguments
*  Refactor logPageView
*  Require explicit UIWebview binding

#### 2.1.0 - 2017-11-30
*  Migrate persistence to v4
*  Add onUserAlias callback

#### 2.0.13 - 2017-11-08
*  Add support for filtering user attribute values
*  Update persistence after a modify call

#### 2.0.12 - 2017-10-23
*  Complete modularization of SDK

#### 2.0.11 - 2017-10-19
*  Modularize Types, Constants, Helpers, DTO, Identity, Ecommerce
*  Reorganize tests

#### 2.0.10 - 2017-10-17
*  Bugfix - Execute useLocalStorage method

#### 1.14.1 - 2017-06-22
*  Fixes for cookie syncing. Properly cookie sync when MPID changes, and only perform a cookie sync when debug modes for defined pixel and mParticle match
*  Store productBags and cartProducts to cookies, with config option to change number of products allowed in each (config.maxProducts = 20 by default)
*  Prevent setUserIdentity from accepting booleans
*  Clean up code - Add additional validations, convert remaining == to ===

#### 1.14.0 - 2017-06-15
*  Support for cookie-syncing. Cookie-syncing enables the optional collection of 3rd-party IDs to enable enhanced audience sharing with advertising platforms such as DoubleClick, Adobe, and AppNexus
*  Add application state transition to mParticle initialization

#### 1.13.1 - 2017-05-25
*  Fix for removing duplicate user identities where ID is missing, allow ID to be `undefined`
*  Fix for creating CGID on initial load

#### 1.13.0 - 2017-05-18
*  Send sessionLength to server when sessionEnd is called.

#### 1.12.0 - 2017-05-11
*  Add deviceId, and deviceId retrieval via `mParticle.getDeviceId()`.

#### 1.11.0 - 2017-04-27
*  Add new session management.
*  Fixed a bug where the same sessionId may be associated with events over several days.

#### 1.10.0 - 2017-04-20
*  Added config option for useCookieStorage to allow use of either cookies or localStorage. By default, localStorage is used (useCookieStorage = false). If localStorage not available, reverts to cookie use.
*  Fixed a bug where `forwarders` contained a mix of both initialized and uninitialized forwarders. `forwarders` now only contains initialized forwarders.

#### 1.9.0 - 2017-04-17
*  Fixed bug where calling setUserIdentity with a similar type added another identity, rather than replacing the identity.
*  Calling setUserIdentity with `id = null` and valid type will remove the user identity of that type.
*  Include CommerceEvent custom attributions in expansion; makes a copy of the original commerce event rather than referencing it, which would mutate it.
