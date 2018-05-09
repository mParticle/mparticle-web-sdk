## Releases
--

#### 2.4.1 - 2017-05-09
*  Bugfix - encode event value before sending to iOS
*  Update package-lock.json to pass CI tests

#### 2.4.0 - 2017-04-26
*  Implement Consent State
*  Expose Identitiy HTTP constants to the public

#### 2.3.3 - 2017-04-19
*  Bugfix - filter user attributes to forwarders on init

#### 2.3.2 - 2017-04-04
*  Bugfix - filter user attributes to forwarders on init

#### 2.3.1 - 2017-04-02
*  Bugfix - Compare strings when filtering event/user attribute values

#### 2.3.0 - 2017-03-28
*  Bugfix - Prioritize client entered config over persistence
*  Bugfix - Correct capitalization of clearing eCommerce carts
*  Add Identify to public API

#### 2.2.6 - 2017-03-07
*  Add forceHttps as a config option
*  Fix linting
*  Migrate all mpids between cookies and LS when useCookieStorage changes

#### 2.2.5 - 2017-03-01
*  Bugfix - add shouldUseNativeSdk logic to fix null user and null path values

#### 2.2.4 - 2017-02-28
*  Add config option for maxCookieSize
*  Refactor useNativeSdk and prevent identify calls when in webview

#### 2.2.3 - 2017-02-23
*  Update logic for useNativeSdk and isIOS

#### 2.2.2 - 2017-02-20
*  Pass identityApiData to native SDKs

#### 2.2.1 - 2017-02-14
*  Queue events when mpid is null or 0
*  Stub primary methods for pre-loading SDK invocation
*  Add eventSubscriptionId to forwarder contract
*  Update readme to remove adchemix

#### 2.2.0 - 2017-01-31
*  Remove product bags

#### 2.1.5 - 2017-01-25
*  Update version endpoint for /Forwarding

#### 2.1.4 - 2017-01-10
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
