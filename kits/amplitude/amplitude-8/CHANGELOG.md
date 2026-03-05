# [2.3.0](https://github.com/mparticle-integrations/mparticle-javascript-integration-amplitude/compare/v2.2.1...v2.3.0) (2023-11-13)


### Bug Fixes

* Remove isObject dependency ([#63](https://github.com/mparticle-integrations/mparticle-javascript-integration-amplitude/issues/63)) ([b25b619](https://github.com/mparticle-integrations/mparticle-javascript-integration-amplitude/commit/b25b619f6af232427db68d0dc0173e3ddc396975))


### Features

* Add support for Amplitude JS v8.21.8 ([#62](https://github.com/mparticle-integrations/mparticle-javascript-integration-amplitude/issues/62)) ([4385a76](https://github.com/mparticle-integrations/mparticle-javascript-integration-amplitude/commit/4385a761ff2c43477ac4038ff1a8588659f36329))

## Releases

--
#### 2.2.1 - 2022-09-12

-   feat: Add feature flag for sending ecommerce summary events
#### 2.2.0 - 2021-11-03

-   feat: Support other5-other10 IDs

#### 2.1.0 - 2021-08-30

-   feat: Add support for EU Data Center

#### 2.0.8 - 2021-05-26

-   Generate bundle that was not included in 2.0.7 release 

#### 2.0.7 - 2021-05-26

-   fix: Map impression and promotion events to align with server

#### 2.0.6 - 2021-04-06

-   feat: Add includeEmailAsUserProperty and no longer set userIdentities as user properties to align with server

    -   Previously the web kit set non-customerid user identities as user properties. This was not consistent with the server, and so this functionality has been removed from web SDK v2.

-   build: Update eslint/prettier config, fix linting errors

#### 2.0.5 - 2021-01-11

-   Update Amplitude SDK to 7.2.1
-   Bugfix - Check window for node environments
-   Remove build file from root directory

#### 2.0.4 - 2020-11-04

-   Bugfix - remove isTesting variable

#### 2.0.3 - 2020-06-30

-   Feat: Support sending objects as custom attributes to Amplitude

#### 2.0.2 - 2020-06-03

-   Update Amplitude SDK version to 6.2.0
-   Update test configuration

#### 2.0.1 - 2020-02-03

-   Modify rollup settings - build dist files
