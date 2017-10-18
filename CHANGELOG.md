## Releases
--

#### 1.15.0 - 2017-10-18
*  Reduce cookie size further by encoding certain keys to base64

#### 1.14.8 - 2017-10-05
*  Apply sanitizeAttributes more broadly to other event types

#### 1.14.7 - 2017-10-05
*  Update testing suite
*  Bugfix - Add CheckoutOption to ProductAction-related switch statements
*  Ensure cookies are cleared for all domains

#### 1.14.6 - 2017-09-15
*  Update the Application State Transition message to include the initial site location

#### 1.14.5 - 2017-09-13
*  Reduce the size of persistence by removing any keys that have no value attached, and by removing server settings that are not being used

#### 1.14.4 - 2017-09-13
*  Support for Chrome headless testing
*  Allow logging of multiple impressions at once as an array
*  Move cartProducts and productBags to localStorage

#### 1.14.3 - 2017-08-16
*  Change case for product expansion labels, add product count to purchase and refund ProductActions
*  Replace current userAttribute key with most recent differently cased userAttribute key; no longer persists previous case

#### 1.14.2 - 2017-08-2
*  Fix for filtering screen views

#### 1.14.1 - 2017-06-22
*  Fixes for cookie syncing. Properly cookie sync when MPID changes, and only perform a cookie sync when debug modes for defined pixel and mParticle match
*  Store productsBags and cartProducts to cookies, with config option to change number of products allowed in each (config.maxProducts = 20 by default)
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
