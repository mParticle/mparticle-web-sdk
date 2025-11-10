# [2.49.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.48.0...v2.49.0) (2025-11-10)


### Features

* add BrowserStack beta suite and workflow ([#1074](https://github.com/mParticle/mparticle-web-sdk/issues/1074)) ([8c5749d](https://github.com/mParticle/mparticle-web-sdk/commit/8c5749d42bdfe3c4a2ef0ca8e58d17705132218e))

# [2.48.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.47.1...v2.48.0) (2025-10-27)


### Features

* Add performance timing for SDK start measurement ([#1101](https://github.com/mParticle/mparticle-web-sdk/issues/1101)) ([3dbbffe](https://github.com/mParticle/mparticle-web-sdk/commit/3dbbffe3c5279aa4d17b639a28473c9e9fb4fcec))

## [2.47.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.47.0...v2.47.1) (2025-10-06)

# [2.47.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.46.0...v2.47.0) (2025-10-01)


### Bug Fixes

* SDKE-317 Call deferred methods on Rokt Manager instead of kit ([#1076](https://github.com/mParticle/mparticle-web-sdk/issues/1076)) ([3a0643b](https://github.com/mParticle/mparticle-web-sdk/commit/3a0643b13ce1d7ade12be85fa9d87ac5278fe158))


### Features

* added DisabledVault to disable id-cache when noFunctional is set ([#1072](https://github.com/mParticle/mparticle-web-sdk/issues/1072)) ([8187d72](https://github.com/mParticle/mparticle-web-sdk/commit/8187d726aac79493a1a6c5891eaa23823ca7bf52))
* added noFunctional in batchUploader to disable offline storage ([#1063](https://github.com/mParticle/mparticle-web-sdk/issues/1063)) ([97dd88a](https://github.com/mParticle/mparticle-web-sdk/commit/97dd88aa20938f2976552c86c6db774d4b6c1023))
* disable session cookie/localStorage when noFunctional is set ([#1070](https://github.com/mParticle/mparticle-web-sdk/issues/1070)) ([edb2e61](https://github.com/mParticle/mparticle-web-sdk/commit/edb2e61825ffacd2ca0b444c4a9d730cd9c95590))
* disable time tracking when noTargeting is set to true ([#1064](https://github.com/mParticle/mparticle-web-sdk/issues/1064)) ([71c891c](https://github.com/mParticle/mparticle-web-sdk/commit/71c891c703353451aaad712d2e7d25722cb9f641))

# [2.46.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.45.0...v2.46.0) (2025-09-17)


### Features

* added only rokt, all, none click ids when collectClickIdV2Enabl… ([#1062](https://github.com/mParticle/mparticle-web-sdk/issues/1062)) ([99982ac](https://github.com/mParticle/mparticle-web-sdk/commit/99982ac8d648a138d161caf507e0be256b55e488))

# [2.45.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.44.0...v2.45.0) (2025-09-15)


### Features

* add use method for rokt kit ([#1067](https://github.com/mParticle/mparticle-web-sdk/issues/1067)) ([bdcd4c5](https://github.com/mParticle/mparticle-web-sdk/commit/bdcd4c52cf74ce9688725a588c811aafe4aee19a))
* added noFunctional and noTargeting flags ([#1059](https://github.com/mParticle/mparticle-web-sdk/issues/1059)) ([9235483](https://github.com/mParticle/mparticle-web-sdk/commit/9235483a77b92000c820809cc77a6d16c4389ff5))

# [2.44.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.43.3...v2.44.0) (2025-09-02)


### Features

* Map events to an attribute flag for selectPlacements ([#1060](https://github.com/mParticle/mparticle-web-sdk/issues/1060)) ([35ede2e](https://github.com/mParticle/mparticle-web-sdk/commit/35ede2e45d38f71b82f5498c0a22240daee609ed))

## [2.43.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.43.2...v2.43.3) (2025-08-22)


### Bug Fixes

* Update BatchUploader to include integration attributes and custom flags in AST events ([#1058](https://github.com/mParticle/mparticle-web-sdk/issues/1058)) ([46c91e6](https://github.com/mParticle/mparticle-web-sdk/commit/46c91e6cb7e885c434b6344636c34f175fa36ece))

## [2.43.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.43.1...v2.43.2) (2025-08-12)


### Bug Fixes

* Refactor RoktManager with deferred call handling and message queue processing ([#1051](https://github.com/mParticle/mparticle-web-sdk/issues/1051)) ([a8b8cbc](https://github.com/mParticle/mparticle-web-sdk/commit/a8b8cbc7075ba89214775eda704e79296ffbe16e))

## [2.43.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.43.0...v2.43.1) (2025-07-21)


### Bug Fixes

* fire identify call if config identities differ from current user ([#1046](https://github.com/mParticle/mparticle-web-sdk/issues/1046)) ([d424ef6](https://github.com/mParticle/mparticle-web-sdk/commit/d424ef644180d922377f718d02e5e903d41cee41))

# [2.43.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.42.0...v2.43.0) (2025-06-10)


### Features

* Add domain to RoktManager to support CNAME for Rokt ([#1039](https://github.com/mParticle/mparticle-web-sdk/issues/1039)) ([5ad8831](https://github.com/mParticle/mparticle-web-sdk/commit/5ad88318ead7422c38413afc7c6c58569fb4c59e))

# [2.42.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.41.1...v2.42.0) (2025-06-04)


### Features

* Expose config.domain for easier CNAME configuration ([#1037](https://github.com/mParticle/mparticle-web-sdk/issues/1037)) ([cc859d7](https://github.com/mParticle/mparticle-web-sdk/commit/cc859d7770b7b742336642e4de473ec64362273f))

## [2.41.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.41.0...v2.41.1) (2025-06-03)


### Bug Fixes

* Revise sandbox setting ([#1036](https://github.com/mParticle/mparticle-web-sdk/issues/1036)) ([e768139](https://github.com/mParticle/mparticle-web-sdk/commit/e768139092f9c8d85482477519ae0ff5dcddb16b))

# [2.41.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.40.0...v2.41.0) (2025-06-02)


### Bug Fixes

* Initialize Rokt before processing forwarders ([#1034](https://github.com/mParticle/mparticle-web-sdk/issues/1034)) ([cf09cd0](https://github.com/mParticle/mparticle-web-sdk/commit/cf09cd06dba53491431205dd35cf860d592e40d2))


### Features

* Expose Rokt launcher config options ([#1033](https://github.com/mParticle/mparticle-web-sdk/issues/1033)) ([c2d25af](https://github.com/mParticle/mparticle-web-sdk/commit/c2d25af45115109ea1e6e9474ffdfa007c8b3e50))

# [2.40.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.39.1...v2.40.0) (2025-05-27)


### Features

* Fire identify in RoktManager if user email is different from selectPlacements email ([#1032](https://github.com/mParticle/mparticle-web-sdk/issues/1032)) ([1e3c824](https://github.com/mParticle/mparticle-web-sdk/commit/1e3c824fdb5b8230841f1a9a75c3cd1dd9f7d092))

## [2.39.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.39.0...v2.39.1) (2025-05-19)


### Bug Fixes

* Remove case sesitivity from query params for integration captures ([#1031](https://github.com/mParticle/mparticle-web-sdk/issues/1031)) ([d1e86d4](https://github.com/mParticle/mparticle-web-sdk/commit/d1e86d4e32c7c0d0a3a0203ef20d068f88b7659d))

# [2.39.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.38.1...v2.39.0) (2025-05-05)


### Bug Fixes

* Add Rokt hashAttributes and setExtensionData to snippet.js ([#1028](https://github.com/mParticle/mparticle-web-sdk/issues/1028)) ([7c30759](https://github.com/mParticle/mparticle-web-sdk/commit/7c30759e38b3196415d2143b3e3a4e39dfe8693d))


### Features

* Add setExtensionData method to RoktManager ([#1025](https://github.com/mParticle/mparticle-web-sdk/issues/1025)) ([d98e83f](https://github.com/mParticle/mparticle-web-sdk/commit/d98e83fe3b4e57b68e604ecb5016bdf9faada218))

## [2.38.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.38.0...v2.38.1) (2025-04-28)


### Bug Fixes

* Add try/catch logic for getCookie to prevent crashes on web extensions ([#1024](https://github.com/mParticle/mparticle-web-sdk/issues/1024)) ([4ac50cc](https://github.com/mParticle/mparticle-web-sdk/commit/4ac50cc3c65356faf8cc7c03902b79c61f946502))
* Add try/catch to getCookies util function ([#1027](https://github.com/mParticle/mparticle-web-sdk/issues/1027)) ([d143c39](https://github.com/mParticle/mparticle-web-sdk/commit/d143c395a841bc1565c8bb128bbc4dd9b2d4b5c2))
* Update Placement Attributes Mapping ([#1026](https://github.com/mParticle/mparticle-web-sdk/issues/1026)) ([9ecf540](https://github.com/mParticle/mparticle-web-sdk/commit/9ecf5401977e05804f5e1dbe6e1e8066cacc68bc))

# [2.38.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.37.0...v2.38.0) (2025-04-22)


### Features

* Add hashAttributes method to RoktManager ([#1021](https://github.com/mParticle/mparticle-web-sdk/issues/1021)) ([4f4b168](https://github.com/mParticle/mparticle-web-sdk/commit/4f4b168a6b383ca1234320e2f9bc115d62fa4837))

# [2.37.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.36.0...v2.37.0) (2025-04-16)


### Features

* Add select placement attributes to current user ([#1019](https://github.com/mParticle/mparticle-web-sdk/issues/1019)) ([1048fdf](https://github.com/mParticle/mparticle-web-sdk/commit/1048fdf908743406556f800f763290236c5d59e1))
* Add support for sandbox mode via selectPlacements ([#1015](https://github.com/mParticle/mparticle-web-sdk/issues/1015)) ([d1373c6](https://github.com/mParticle/mparticle-web-sdk/commit/d1373c69ad19ce2882de92a10d78079ad1e96b9a))
* Add user attribute mapping to Rokt Manager ([#1018](https://github.com/mParticle/mparticle-web-sdk/issues/1018)) ([99c9b54](https://github.com/mParticle/mparticle-web-sdk/commit/99c9b54f1f9160752ed7d6636755b980d4201321))

# [2.36.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.35.2...v2.36.0) (2025-04-03)


### Features

* Add User Filtering for Rokt Wrapper ([#1007](https://github.com/mParticle/mparticle-web-sdk/issues/1007)) ([8f0ecd3](https://github.com/mParticle/mparticle-web-sdk/commit/8f0ecd323c3e8915bcb21fa01d2a4be2cf2528ea))

## [2.35.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.35.1...v2.35.2) (2025-03-25)


### Bug Fixes

* Update Rokt Click ID ([#1008](https://github.com/mParticle/mparticle-web-sdk/issues/1008)) ([03d7aff](https://github.com/mParticle/mparticle-web-sdk/commit/03d7affeae70239199f31cbdd415ff1fb64c7f75))

## [2.35.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.35.0...v2.35.1) (2025-03-20)


### Bug Fixes

* Fix context reference in PreInit.processPreloadedItem ([#1005](https://github.com/mParticle/mparticle-web-sdk/issues/1005)) ([23a1ea5](https://github.com/mParticle/mparticle-web-sdk/commit/23a1ea57871ba1976926e2a9be50f2dd4e6fcf73))

# [2.35.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.34.0...v2.35.0) (2025-03-18)


### Bug Fixes

* Add Rokt Wrapper Methods to snippet.js ([#997](https://github.com/mParticle/mparticle-web-sdk/issues/997)) ([49202b3](https://github.com/mParticle/mparticle-web-sdk/commit/49202b3973a5de5403d64790ca400d85c84b93b1))
* adds native collection of snap click ID ([#989](https://github.com/mParticle/mparticle-web-sdk/issues/989)) ([92945a9](https://github.com/mParticle/mparticle-web-sdk/commit/92945a94af275b820db68985f5aa41ab019a0562))


### Features

* Fire background AST events on page transitions if feature flag enabled ([#991](https://github.com/mParticle/mparticle-web-sdk/issues/991)) ([147bad2](https://github.com/mParticle/mparticle-web-sdk/commit/147bad2da1c0f32a769b079d3d7b3eee4c9a8872))

# [2.34.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.33.1...v2.34.0) (2025-03-15)


### Features

* Add Rokt Wrapper ([#994](https://github.com/mParticle/mparticle-web-sdk/issues/994)) ([04d1efc](https://github.com/mParticle/mparticle-web-sdk/commit/04d1efcff1b64c6fb7fe1e543dbf8c7e00ccc607))

## [2.33.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.33.0...v2.33.1) (2025-02-25)


### Bug Fixes

* Add failsafes for queryStringParser ([#983](https://github.com/mParticle/mparticle-web-sdk/issues/983)) ([1c771fd](https://github.com/mParticle/mparticle-web-sdk/commit/1c771fd1e9edfaf1809f7bad10f7cbc2711a65fa))
* Add Rokt Click ID for Integration Capture ([#985](https://github.com/mParticle/mparticle-web-sdk/issues/985)) ([f5026f9](https://github.com/mParticle/mparticle-web-sdk/commit/f5026f940cbb791e4bb25118eae54240580fd520))
* Update TOS local storage key ([#987](https://github.com/mParticle/mparticle-web-sdk/issues/987)) ([32503f9](https://github.com/mParticle/mparticle-web-sdk/commit/32503f932c7dbb26dcbe494410ae881d00bb65da))

# [2.33.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.32.5...v2.33.0) (2025-02-13)


### Features

* Add time on site ([#975](https://github.com/mParticle/mparticle-web-sdk/issues/975)) ([3645120](https://github.com/mParticle/mparticle-web-sdk/commit/364512039eb34c511879a7c19746d0da6b28d7a7))

## [2.32.5](https://github.com/mParticle/mparticle-web-sdk/compare/v2.32.4...v2.32.5) (2025-02-13)


### Bug Fixes

* Support numbers in vault ([#981](https://github.com/mParticle/mparticle-web-sdk/issues/981)) ([04ca2ab](https://github.com/mParticle/mparticle-web-sdk/commit/04ca2abc2de7b404f8877bbeecc20fd4fbf3160d))

## [2.32.4](https://github.com/mParticle/mparticle-web-sdk/compare/v2.32.3...v2.32.4) (2025-02-10)


### Bug Fixes

* Update new mParticleInstance instantiation ([#974](https://github.com/mParticle/mparticle-web-sdk/issues/974)) ([fa9e65e](https://github.com/mParticle/mparticle-web-sdk/commit/fa9e65ea9450db5f583ddf6355b9b648a7db4f2b))

## [2.32.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.32.2...v2.32.3) (2025-02-03)

## [2.32.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.32.1...v2.32.2) (2025-01-27)

## [2.32.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.32.0...v2.32.1) (2025-01-21)

# [2.32.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.31.1...v2.32.0) (2025-01-14)


### Features

* Add support for TikTok Click and Cookie Ids ([#956](https://github.com/mParticle/mparticle-web-sdk/issues/956)) ([d84d759](https://github.com/mParticle/mparticle-web-sdk/commit/d84d759fcffe11e6494f9de16e2e334f593f74b6))

## [2.31.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.31.0...v2.31.1) (2025-01-06)


### Bug Fixes

* Check for uploader to prevent errors when calling upload() too early ([#938](https://github.com/mParticle/mparticle-web-sdk/issues/938)) ([4342b0a](https://github.com/mParticle/mparticle-web-sdk/commit/4342b0a6f9089d8694686afa48e1f46906398997))
* Forward user attributes to kits properly when kit blocking is enabled and unplanned UAs are allowed ([#947](https://github.com/mParticle/mparticle-web-sdk/issues/947)) ([fdbc6ba](https://github.com/mParticle/mparticle-web-sdk/commit/fdbc6baf509f4816bcc835e1b5b7105d40faa05e))

# [2.31.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.30.4...v2.31.0) (2024-12-11)


### Features

* Add support for Google Click Ids ([#955](https://github.com/mParticle/mparticle-web-sdk/issues/955)) ([#957](https://github.com/mParticle/mparticle-web-sdk/issues/957)) ([3df8d84](https://github.com/mParticle/mparticle-web-sdk/commit/3df8d8435129874bbf0f1a9daf1e7772843c5442))

## [2.30.4](https://github.com/mParticle/mparticle-web-sdk/compare/v2.30.3...v2.30.4) (2024-11-05)


### Bug Fixes

* Move ready queue processing after identity request ([#933](https://github.com/mParticle/mparticle-web-sdk/issues/933)) ([678ccb7](https://github.com/mParticle/mparticle-web-sdk/commit/678ccb7fd97e25e15bac572c3cb899a3af23b976))

## [2.30.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.30.2...v2.30.3) (2024-11-05)

## [2.30.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.30.1...v2.30.2) (2024-10-28)


### Bug Fixes

* Support capturing click ids as custom flags in commerce events ([#939](https://github.com/mParticle/mparticle-web-sdk/issues/939)) ([6fb2476](https://github.com/mParticle/mparticle-web-sdk/commit/6fb2476aa617e9a861280c02d09c0d21555d510c))

# [2.30.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.30.0...v2.30.1) (2024-10-15)


### Bug Fixes

* Check for window.screen when setting device_info ([#930](https://github.com/mParticle/mparticle-web-sdk/issues/930)) ([7ce742f](https://github.com/mParticle/mparticle-web-sdk/commit/7ce742fe7675ed6aab3db6cfd270d5e86cb02420))


# [2.30.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.29.0...v2.30.0) (2024-10-11)


### Bug Fixes

* Handle cases where window.screen is unavailable ([#929](https://github.com/mParticle/mparticle-web-sdk/issues/929)) ([6d042df](https://github.com/mParticle/mparticle-web-sdk/commit/6d042df636edfad2d84c1c2440734479d969c058))


### Features

* Replace XHR in IdentityApiClient with AsyncUploader ([#909](https://github.com/mParticle/mparticle-web-sdk/issues/909)) ([9526e3a](https://github.com/mParticle/mparticle-web-sdk/commit/9526e3a0a8e02975655a5bf49674904a882be0b2))

# [2.29.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.28.3...v2.29.0) (2024-10-08)


### Bug Fixes

* Fix typo in identity interface ([#923](https://github.com/mParticle/mparticle-web-sdk/issues/923)) ([f1e0ec9](https://github.com/mParticle/mparticle-web-sdk/commit/f1e0ec96f09995e7933400cbefbb06bc376b49da))


### Features

* Capture Integration Ids and assign to events ([#926](https://github.com/mParticle/mparticle-web-sdk/issues/926)) ([a916262](https://github.com/mParticle/mparticle-web-sdk/commit/a91626295abbc55f1dfd05069e7a5c676d9f86bc))

## [2.28.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.28.2...v2.28.3) (2024-09-16)


### Bug Fixes

* Reject xhr only on errors ([#917](https://github.com/mParticle/mparticle-web-sdk/issues/917)) ([1d6cbdd](https://github.com/mParticle/mparticle-web-sdk/commit/1d6cbdd74a9b2d11c087c3f917898450c4b0697e))

## [2.28.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.28.1...v2.28.2) (2024-09-11)


### Bug Fixes

* Remove XHR References from Identity Utils ([#905](https://github.com/mParticle/mparticle-web-sdk/issues/905)) ([8beebc7](https://github.com/mParticle/mparticle-web-sdk/commit/8beebc7be5379eacbbf91b3ece2b9f85fbfcdfcb))

## [2.28.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.28.0...v2.28.1) (2024-09-04)

# [2.28.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.27.0...v2.28.0) (2024-08-26)


### Features

* Refactor usage of XHR for Config API ([#898](https://github.com/mParticle/mparticle-web-sdk/issues/898)) ([0b6fae6](https://github.com/mParticle/mparticle-web-sdk/commit/0b6fae68a6d499444736308b9fc00bf8d08d6706))

# [2.27.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.26.10...v2.27.0) (2024-08-13)


### Bug Fixes

* Respect directUrlRouting flag in self hosted environments ([#900](https://github.com/mParticle/mparticle-web-sdk/issues/900)) ([ae07504](https://github.com/mParticle/mparticle-web-sdk/commit/ae075040955b99af0e8052217c9b565f1e545eca))


### Features

* Enable passing sourceMessageId to logProductAction ([#901](https://github.com/mParticle/mparticle-web-sdk/issues/901)) ([3b10cb1](https://github.com/mParticle/mparticle-web-sdk/commit/3b10cb1f9e08b644dd3ddb880d48d05e0ef7cc07))

## [2.26.10](https://github.com/mParticle/mparticle-web-sdk/compare/v2.26.9...v2.26.10) (2024-06-18)

## [2.26.9](https://github.com/mParticle/mparticle-web-sdk/compare/v2.26.8...v2.26.9) (2024-06-11)

## [2.26.8](https://github.com/mParticle/mparticle-web-sdk/compare/v2.26.7...v2.26.8) (2024-06-04)

## [2.26.7](https://github.com/mParticle/mparticle-web-sdk/compare/v2.26.6...v2.26.7) (2024-05-29)

## [2.26.6](https://github.com/mParticle/mparticle-web-sdk/compare/v2.26.5...v2.26.6) (2024-05-28)

## [2.26.5](https://github.com/mParticle/mparticle-web-sdk/compare/v2.26.4...v2.26.5) (2024-05-22)

## [2.26.4](https://github.com/mParticle/mparticle-web-sdk/compare/v2.26.3...v2.26.4) (2024-05-13)

## [2.26.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.26.2...v2.26.3) (2024-04-29)


### Reverts

* "refactor: Refactor ParseIdentityResponse Workflow ([#864](https://github.com/mParticle/mparticle-web-sdk/issues/864))" ([#879](https://github.com/mParticle/mparticle-web-sdk/issues/879)) ([39163d9](https://github.com/mParticle/mparticle-web-sdk/commit/39163d9a73e938354fb5b81b8498f9fc9723afad))

## [2.26.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.26.1...v2.26.2) (2024-04-23)

## [2.26.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.26.0...v2.26.1) (2024-04-22)

# [2.26.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.25.3...v2.26.0) (2024-04-15)


### Bug Fixes

* Implement audience API feature flag ([#865](https://github.com/mParticle/mparticle-web-sdk/issues/865)) ([faa4520](https://github.com/mParticle/mparticle-web-sdk/commit/faa45205f788b610bdd8418996a8a9aa58c38b58))
* Migrate First and Last Seen Time Setters and Getters to Store ([#856](https://github.com/mParticle/mparticle-web-sdk/issues/856)) ([86a9535](https://github.com/mParticle/mparticle-web-sdk/commit/86a953537660ef23a09811bfc7fa8cf1e8854f44))
* Update audience logic to new backend response ([#844](https://github.com/mParticle/mparticle-web-sdk/issues/844)) ([8a63045](https://github.com/mParticle/mparticle-web-sdk/commit/8a630459f0542e9995ddaf7402e47ba56c8ae423))
* Update url to nativesdks and update server response ([#863](https://github.com/mParticle/mparticle-web-sdk/issues/863)) ([9e46cef](https://github.com/mParticle/mparticle-web-sdk/commit/9e46cef67ade9e1c682d09d6438f330f2be9fbbd))


### Features

* Implement fetching user audiences ([#841](https://github.com/mParticle/mparticle-web-sdk/issues/841)) ([93a7fb7](https://github.com/mParticle/mparticle-web-sdk/commit/93a7fb7ce93d2f28bfc7699bae82cf755de84c3c))

## [2.25.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.25.2...v2.25.3) (2024-04-08)


### Bug Fixes

* Migrate deviceId methods to Store ([#855](https://github.com/mParticle/mparticle-web-sdk/issues/855)) ([ccb0dbe](https://github.com/mParticle/mparticle-web-sdk/commit/ccb0dbe44b742a41988c38afc25ee691dbc76bed))

## [2.25.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.25.1...v2.25.2) (2024-04-01)


### Bug Fixes

* Combine End Session Logging Messaging flow ([#848](https://github.com/mParticle/mparticle-web-sdk/issues/848)) ([a2c902d](https://github.com/mParticle/mparticle-web-sdk/commit/a2c902d4ed1f51cc214c31e5f262bd89e0513863))
* Create a simple merge object utility ([#849](https://github.com/mParticle/mparticle-web-sdk/issues/849)) ([61e82da](https://github.com/mParticle/mparticle-web-sdk/commit/61e82daa8b4c5797d77952e1bb2f8992fab20058))

## [2.25.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.25.0...v2.25.1) (2024-02-06)


### Bug Fixes

* Only cache mpid and is_loggeed_in from xhr.responseText ([#838](https://github.com/mParticle/mparticle-web-sdk/issues/838)) ([dd1920f](https://github.com/mParticle/mparticle-web-sdk/commit/dd1920ff5928b3825fb4367e21aa0d03035a6081))

# [2.25.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.24.0...v2.25.0) (2024-01-29)


### Features

* Implement identity caching ([#834](https://github.com/mParticle/mparticle-web-sdk/issues/834)) ([04514ec](https://github.com/mParticle/mparticle-web-sdk/commit/04514ec9ab06d20958426dcb66f2589a58044a17))

# [2.24.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.23.9...v2.24.0) (2024-01-09)


### Features

* Support direct url routing from config ([#797](https://github.com/mParticle/mparticle-web-sdk/issues/797)) ([#801](https://github.com/mParticle/mparticle-web-sdk/issues/801)) ([ffddbc4](https://github.com/mParticle/mparticle-web-sdk/commit/ffddbc4127e465dea4d35eef2a9948e79c199808))

## [2.23.9](https://github.com/mParticle/mparticle-web-sdk/compare/v2.23.8...v2.23.9) (2024-01-08)

## [2.23.8](https://github.com/mParticle/mparticle-web-sdk/compare/v2.23.7...v2.23.8) (2024-01-02)


### Bug Fixes

* Add filtered user identities to identity complete methods ([#816](https://github.com/mParticle/mparticle-web-sdk/issues/816)) ([715e217](https://github.com/mParticle/mparticle-web-sdk/commit/715e217cb8c630dfaefddc136eaa2150a53a5036))
* Replace identify method strings with constants ([#817](https://github.com/mParticle/mparticle-web-sdk/issues/817)) ([1bca974](https://github.com/mParticle/mparticle-web-sdk/commit/1bca9744567f12714aa8900c79a5232fe972c64b))

## [2.23.7](https://github.com/mParticle/mparticle-web-sdk/compare/v2.23.6...v2.23.7) (2023-10-23)


### Bug Fixes

* Prevent immediate upload for UserAttributeChange Events ([#793](https://github.com/mParticle/mparticle-web-sdk/issues/793)) ([2f0c5ac](https://github.com/mParticle/mparticle-web-sdk/commit/2f0c5ac8af559bf4a15c984f981123358b8488d0))
* Respect sideloaded kit filter dictionaries ([#792](https://github.com/mParticle/mparticle-web-sdk/issues/792)) ([91b6afa](https://github.com/mParticle/mparticle-web-sdk/commit/91b6afaa36644689dd19e0515701c87d1d8c2dbd))

## [2.23.6](https://github.com/mParticle/mparticle-web-sdk/compare/v2.23.5...v2.23.6) (2023-10-17)


### Bug Fixes

* Remove slugify dependency ([#786](https://github.com/mParticle/mparticle-web-sdk/issues/786)) ([8346bdc](https://github.com/mParticle/mparticle-web-sdk/commit/8346bdc4f3f8e102011952fce89c89e72d6f30d7))

## [2.23.5](https://github.com/mParticle/mparticle-web-sdk/compare/v2.23.4...v2.23.5) (2023-10-09)


### Bug Fixes

* Prevent Batches from sendBeacon from being stored offline ([#784](https://github.com/mParticle/mparticle-web-sdk/issues/784)) ([defed0a](https://github.com/mParticle/mparticle-web-sdk/commit/defed0abab667a08b2834809f5a57efb3e3fcd76))

## [2.23.4](https://github.com/mParticle/mparticle-web-sdk/compare/v2.23.3...v2.23.4) (2023-09-25)


### Bug Fixes

* Update snippet to support snippet version pinning ([#778](https://github.com/mParticle/mparticle-web-sdk/issues/778)) ([1152cf5](https://github.com/mParticle/mparticle-web-sdk/commit/1152cf5efbdaee3d141af786c32dbcaa0c886e70))

## [2.23.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.23.2...v2.23.3) (2023-09-19)

## [2.23.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.23.1...v2.23.2) (2023-07-17)

## [2.23.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.23.0...v2.23.1) (2023-07-10)


### Bug Fixes

* Rename is_using_sideloaded_kits to sideloaded_kits_count ([#646](https://github.com/mParticle/mparticle-web-sdk/issues/646)) ([98d868c](https://github.com/mParticle/mparticle-web-sdk/commit/98d868c8b91cc3ca39cf399098428542bb6e0768))

# [2.23.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.22.1...v2.23.0) (2023-06-26)


### Features

* Support config-provided suffix in kit initialization ([#617](https://github.com/mParticle/mparticle-web-sdk/issues/617)) ([1052f51](https://github.com/mParticle/mparticle-web-sdk/commit/1052f517f35ff7312c3195e52129c8ab05467783))

## [2.22.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.22.0...v2.22.1) (2023-06-12)


### Bug Fixes

* Add Sideloaded Kit flag to Batches ([#613](https://github.com/mParticle/mparticle-web-sdk/issues/613)) ([13a113b](https://github.com/mParticle/mparticle-web-sdk/commit/13a113b8e35ea0b43e4b352b3853f8a4156eb0c9))
* Revise priority of device id when initializing state ([#618](https://github.com/mParticle/mparticle-web-sdk/issues/618)) ([b71f746](https://github.com/mParticle/mparticle-web-sdk/commit/b71f746532ed542df6bb109e329ad63e5b96bf27))

# [2.22.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.21.2...v2.22.0) (2023-06-05)


### Bug Fixes

* Resolve flakey cookie sync tests ([#572](https://github.com/mParticle/mparticle-web-sdk/issues/572)) ([8f2b750](https://github.com/mParticle/mparticle-web-sdk/commit/8f2b750d77b833b64e1323db84bf764b2420d15f))


### Features

* Add MPSideloadedKit class ([#564](https://github.com/mParticle/mparticle-web-sdk/issues/564)) ([252a2ce](https://github.com/mParticle/mparticle-web-sdk/commit/252a2ceba00f72690abe4809e572c06be7fd330c))
* Expose MPSideloadedKit class to public API ([#568](https://github.com/mParticle/mparticle-web-sdk/issues/568)) ([47a9186](https://github.com/mParticle/mparticle-web-sdk/commit/47a9186d38a99e2821e00bdf8eeab5121b2211f1))

## [2.21.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.21.1...v2.21.2) (2023-05-15)

## [2.21.1](https://github.com/mParticle/mparticle-web-sdk/compare/v2.21.0...v2.21.1) (2023-05-02)


### Bug Fixes

* Remove legacy migrations module ([#500](https://github.com/mParticle/mparticle-web-sdk/issues/500)) ([3132563](https://github.com/mParticle/mparticle-web-sdk/commit/313256321d1c71bade1741830f28be943f8ae669))

# [2.21.0](https://github.com/mParticle/mparticle-web-sdk/compare/v2.20.3...v2.21.0) (2023-04-18)


### Features

* Add Offline Storage for Events and Batches via Feature Flag ([#402](https://github.com/mParticle/mparticle-web-sdk/issues/402)) ([218bbf5](https://github.com/mParticle/mparticle-web-sdk/commit/218bbf58f75165e4f0fc5459193c50a9db132f2a))

## [2.20.3](https://github.com/mParticle/mparticle-web-sdk/compare/v2.20.2...v2.20.3) (2023-04-10)


### Bug Fixes

* Revert 2.20.2 ([#491](https://github.com/mParticle/mparticle-web-sdk/issues/491)) ([38dddf9](https://github.com/mParticle/mparticle-web-sdk/commit/38dddf921fc6bd1954effa787989cff6fbd978f5)), closes [#489](https://github.com/mParticle/mparticle-web-sdk/issues/489)

## [2.20.2](https://github.com/mParticle/mparticle-web-sdk/compare/v2.20.1...v2.20.2) (2023-04-05)

### Bug Fixes

-   Revert 2.20.1 ([#489](https://github.com/mParticle/mparticle-web-sdk/issues/489)) ([0607dab](https://github.com/mParticle/mparticle-web-sdk/commit/0607dab4e9b754de5d7ebc4fd54205a00b2659af)), closes [#485](https://github.com/mParticle/mparticle-web-sdk/issues/485)

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
