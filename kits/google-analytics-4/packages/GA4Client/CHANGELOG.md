## [1.5.1](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.5.0...v1.5.1) (2026-03-04)


### Bug Fixes

* added attribute merging to logCheckoutOptionEvent ([#65](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/65)) ([8636f3f](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/8636f3fae03f06d1ab5c69dfe0ff1d4aa44496de))

# [1.5.0](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.4.5...v1.5.0) (2025-05-05)


### Features

* Map product position to GA4 item index ([#62](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/62)) ([308076c](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/308076cc22b6a7f9e78bfb0c40486654e09a2a98))

## [1.4.5](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.4.4...v1.4.5) (2024-10-09)


### Bug Fixes

* send default and update consent payloads on kit init ([#61](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/61)) ([ec0bf79](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/ec0bf7938feed1456f69ed8169fc5795b8dee063))

## [1.4.4](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.4.3...v1.4.4) (2024-08-20)


### Bug Fixes

* forward Impressions and Promotions custom attributes ([#60](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/60)) ([d13f694](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/d13f6948f9fca0c554501035b3a7c4da91f4b911))

## [1.4.3](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.4.2...v1.4.3) (2024-05-07)


### Bug Fixes

* exceptional max attribute length and page_referrer flag addition ([#59](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/59)) ([d81fff3](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/d81fff3cc045c594289dbd9981fde57eaeeecf7f))

## [1.4.2](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.4.1...v1.4.2) (2024-04-16)


### Bug Fixes

* Set mapped consent name from server to lowercase ([#58](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/58)) ([287a8a3](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/287a8a3b69c58a0389edebcd5fc64d5ae5821ff8))

## [1.4.1](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.4.0...v1.4.1) (2024-03-11)


### Bug Fixes

* Include send_to as event param to support multiple measurement ids ([#57](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/57)) ([7d8696d](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/7d8696d720b4672c605a7bde9b92bb44b394b70d))

# [1.4.0](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.3.1...v1.4.0) (2024-03-01)


### Features

* Add support for Consent State ([#56](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/56)) ([388c346](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/388c346c5074917b32f8db8062c7d815b05cd66a))

## [1.3.1](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.3.0...v1.3.1) (2023-11-29)


### Bug Fixes

* Add check for cleansing callback; replace error with warn ([7184c2b](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/7184c2b10005db7a1486df62576b1c6ef676eb0b))

# [1.3.0](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.2.0...v1.3.0) (2023-10-02)


### Features

* Add Customer Configurable Standardization ([#53](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/53)) ([c851914](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/c85191485d5ae52cedf6949eb1c94fe05776f16b))

# [1.2.0](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.1.0...v1.2.0) (2023-09-11)


### Bug Fixes

* Add suffix of v3 to forwarder, add test infrastructure ([#38](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/38)) ([4420648](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/4420648f3e86ebb97305ebb921355a08b40c2da5))
* Flatten product.Attributes to be on the product level ([#41](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/41)) ([ee03770](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/ee037705f1d49aaa1322317dca7deb06066a8bda))
* Map CouponCode to reserved attributes `coupon` ([#50](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/50)) ([f7380d4](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/f7380d423df6c8663655dc7c15b28291b92964da))
* Prevent attribute cleansing when data cleansing is disabled ([#52](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/52)) ([9847bf8](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/9847bf858c8eb9e749b5c146a0ef1082c46c9422))
* Re-map affiliation from event level to item level ([#51](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/51)) ([b7dfef8](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/b7dfef84aa4292ed023f731d851b748f5ce04fa9))
* Update package.json ([#39](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/39)) ([d4ea321](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/d4ea32128a540b5fed5587eecfc7a246b3caa00f))


### Features

* Limit commerce event attributes to 100 keys ([#47](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/47)) ([1813a98](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/1813a986816f838fb14db3275e7bdc17b00f178f))
* Limit event attributes to 100 keys ([#40](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/40)) ([057543b](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/057543be5c4294758a8a276e7b5d71866516b69b))
* Limit item params to 10 non-reserved keys ([#49](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/49)) ([7670d99](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/7670d99c5a0f9593c027022a5d4d0544986c65df))
* Standardize Names Keys and Values ([#36](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/36)) ([f3e5aa1](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/f3e5aa109b584de6c15b558bdb0070092a2c26bd))

# [1.1.0](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.0.6...v1.1.0) (2023-05-30)


### Features

* Capture Client ID on Client Side Forwarding ([#37](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/37)) ([9636091](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/963609125d598220a69c8d1f7b854c41f345c3ba))

## [1.0.6](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.0.5...v1.0.6) (2023-02-22)


### Bug Fixes

* Check if Event Attributes are empty before truncating ([#35](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/35)) ([c17f92b](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/c17f92b4f747fa4669ba76780d71ed7311b043bd))
* Relocate config call earlier in kit initialization ([#34](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/34)) ([4587fda](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/4587fdaa998e114886412c5e99f18392c178eca3))

## [1.0.5](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.0.4...v1.0.5) (2023-01-04)


### Bug Fixes

* Correct custom flags for title and location ([#32](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/32)) ([5e54726](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/5e547269c7343c9308aa68f81c69c3c8084e68ca))
* Truncate event and user attribute key and value limits ([#30](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/30)) ([d592dfb](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/d592dfbaec887f6f029909369d7fee82ab13c70c))

## [1.0.4](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/compare/v1.0.3...v1.0.4) (2022-10-04)


### Bug Fixes

* Add Event Attributes to Pageview Event ([#26](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/issues/26)) ([6b561ec](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics-4/commit/6b561ec8d9d10b396f14939cdf013dd6c9e70a16))

## Releases

--

#### 1.0.3 - 2022-08-15

* fix: Update browser/files field in package.json (#25)

#### 1.0.2 - 2022-07-12

* Fix import filename with GA4 filename instead of old GA kit filename
