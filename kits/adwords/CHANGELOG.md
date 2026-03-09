## [2.3.2](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/compare/v2.3.1...v2.3.2) (2024-10-02)


### Bug Fixes

* send default and update consent payloads on kit init ([#58](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/issues/58)) ([200b918](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/200b918ba583c41a66c2a8ecfee736f508ed61b8))

## [2.3.1](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/compare/v2.3.0...v2.3.1) (2024-04-16)


### Bug Fixes

* Set mapped consent name from server to lowercase ([#57](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/issues/57)) ([e1cbf49](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/e1cbf493f440d0642d30db1bae83262a61a3880a))

# [2.3.0](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/compare/v2.2.1...v2.3.0) (2024-02-29)


### Bug Fixes

* Delete GoogleAdWordsEventForwarder.js ([#53](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/issues/53)) ([7726369](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/7726369ad54a9d7b45fbc0e70e46f3a2747f2605))


### Features

* Add support for Consent State Updates ([#52](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/issues/52)) ([fbddd45](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/fbddd45db90791932d8ad2b26092a7f6ca58b737))

## [2.2.1](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/compare/v2.2.0...v2.2.1) (2023-08-14)

### Bug Fixes

* Bugfix - Add support for stringified objects in custom flags ([#48](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/pull/48))


### CI/CD Changes

* Fix tests that fail silently ([#49](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/pull/49))

# [2.2.0](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/compare/v2.1.1...v2.2.0) (2021-11-11)


### Features

* Add support for enhanced conversions ([7c3c5d6](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/7c3c5d6092b0574c3f54ca5651c27a2b3d8edb4c))

## [2.1.1](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/compare/v2.1.0...v2.1.1) (2021-11-11)

* fix: Correct send_to in gtag API ([#23](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/pull/23)) ([af01adc](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/af01adc2b04453f77845e228bff4aa6c49824fde))
* fix: Prevent unmapped events from being forwarded ([#22](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/pull/22)) ([50e6d27](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/50e6d279dff666f5621e585878672707a21d911f))

### Bug Fixes

* Correct send_to in gtag API ([#23](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/issues/23)) ([af01adc](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/af01adc2b04453f77845e228bff4aa6c49824fde))
* Prevent unmapped events from being forwarded ([#22](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/issues/22)) ([50e6d27](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/50e6d279dff666f5621e585878672707a21d911f))

## Releases
--

#### 2.1.0 - 2021-10-25
* Implement Google Site Tag (GTAG) support as an opt-in feature

#### 2.0.5 - 2020-11-11
* There are no code changes in this commit. NPM published 2.0.4 but with the dist/ file from 2.0.3. This commit will include the correct dist/ file as we bump to 2.0.5

#### 2.0.4 - 2020-11-10
* Bugfix - Check window for node environments
* Bugfix - rename event --> adWordEvent

#### 2.0.3 - 2020-02-03
* Update package.json

#### 2.0.2 - 2019-10-03
* Bugfix - Remove parseInt(conversionId) which could result in NaN and data not sent to AdWords
* Turn src file into an ESM module
* Remove isObject dependency

#### 2.0.1 - 2019-08-12
* Bugfix - Refactor calculateJSHash
