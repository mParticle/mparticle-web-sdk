<img src="https://static.mparticle.com/sdk/mp_logo_black.svg" width="280"><br>

<!-- <img src="https://img.shields.io/github/release/mparticle/mparticle-web-sdk.svg?color=green"> <img src ="https://img.shields.io/npm/v/@mparticle/web-sdk.svg?color=green"> -->

# mParticle Web SDK

Hello! This is the public repo of the mParticle Web SDK. We've built the mParticle platform to take a new approach to web and mobile app data and the platform has grown to support 300+ integrations including analytics, data warehouses, and marketing automation. mParticle is designed to serve as the connector between all of these services - check out [our site](http://mparticle.com), or hit us at developers@mparticle.com to learn more.

## Documentation

Fully detailed documentation and other information about mParticle web SDK can be found at our doc site [here](https://docs.mparticle.com/developers/sdk/web/initialization/)

## Include and Initialize the SDK

There are two ways to initialize the SDK, either via a script tag, or you can bundle the SDK via NPM. A summary of steps for both are available below, but you should review the detailed documentation for the [script tag](https://docs.mparticle.com/developers/sdk/web/getting-started) and [self hosting](https://docs.mparticle.com/developers/sdk/web/self-hosting) on the mParticle docs site.

### Option 1. Load mParticle via Script Tag

To integrate the SDK add the following snippet to your site after customizing `mParticle.config`, ideally in the `<head>` element. Replace `YOUR_API_KEY` with the API key for your mParticle Web workspace.

This snippet pre-populates method stubs for much of the public SDK API, allowing immediate reference to these APIs as the SDK loads.

```javascript
<script type="text/javascript">

//configure the SDK
window.mParticle = {
    config: {
        isDevelopmentMode: true,
        identifyRequest: {
            userIdentities: {
                email: 'email@example.com',
                customerid: '123456',
            },
        },
        identityCallback: function(result) {
            // Do something once an identity call has been made.
            // For more information, see https://docs.mparticle.com/developers/sdk/web/idsync/#sdk-initialization-and-identify
            console.log(result);
        },
        dataPlan: {
           planId: 'my_plan_id',
           planVersion: 2
        }
    },
};

//load the SDK
(function(e){window.mParticle=window.mParticle||{};window.mParticle.EventType={Unknown:0,Navigation:1,Location:2,Search:3,Transaction:4,UserContent:5,UserPreference:6,Social:7,Other:8,Media:9};window.mParticle.eCommerce={Cart:{}};window.mParticle.Identity={};window.mParticle.Rokt={};window.mParticle.config=window.mParticle.config||{};window.mParticle.config.rq=[];window.mParticle.config.snippetVersion=2.8;window.mParticle.ready=function(e){window.mParticle.config.rq.push(e)};var t=["endSession","logError","logBaseEvent","logEvent","logForm","logLink","logPageView","setSessionAttribute","setAppName","setAppVersion","setOptOut","setPosition","startNewSession","startTrackingLocation","stopTrackingLocation"];var i=["setCurrencyCode","logCheckout"];var n=["identify","login","logout","modify"];var o=["selectPlacements","hashAttributes","hashSha256","setExtensionData","use","getVersion","terminate"];t.forEach(function(e){window.mParticle[e]=r(e)});i.forEach(function(e){window.mParticle.eCommerce[e]=r(e,"eCommerce")});n.forEach(function(e){window.mParticle.Identity[e]=r(e,"Identity")});o.forEach(function(e){window.mParticle.Rokt[e]=r(e,"Rokt")});function r(t,i){return function(){if(i){t=i+"."+t}var e=Array.prototype.slice.call(arguments);e.unshift(t);window.mParticle.config.rq.push(e)}}var a,c,s=window.mParticle.config,l=s.isDevelopmentMode?1:0,w="?env="+l,d=window.mParticle.config.dataPlan;if(d){a=d.planId;c=d.planVersion;if(a){if(c&&(c<1||c>1e3)){c=null}w+="&plan_id="+a+(c?"&plan_version="+c:"")}}var m=window.mParticle.config.versions;var f=[];if(m){Object.keys(m).forEach(function(e){f.push(e+"="+m[e])})}var p=document.createElement("script");p.type="text/javascript";p.async=true;p.src=("https:"==document.location.protocol?"https://jssdkcdns":"http://jssdkcdn")+".mparticle.com/js/v2/"+e+"/mparticle.js"+w+"&"+f.join("&");var P=document.getElementsByTagName("script")[0];P.parentNode.insertBefore(p,P)})("REPLACE WITH API KEY");
```

You can then log events, for example, as follows:

```javascript
mParticle.logEvent('Play Movie', mParticle.EventType.Navigation, {
    movie_length: '127 minutes',
    rating: 'PG',
});
```

### Option 2. Self host mParticle via NPM

#### 1. Add the SDK via NPM

In your root project directory, add the SDK to your package.json:

```
npm install @mparticle/web-sdk
```

#### 2. Customize and Initialize the SDK

```javascript
// index.js
import mParticle from '@mparticle/web-sdk';

let mParticleConfig = {
    isDevelopmentMode: true,
    identifyRequest: {
        userIdentities: {
            email: 'email@example.com',
            customerid: '123456',
        },
    },
    identityCallback: myIdentityCallback,
    dataPlan: {
        planId: 'my_plan_id',
        planVersion: 2,
    },
};
mParticle.init('REPLACE WITH API KEY', mParticleConfig);
```

You can then log events, for example, as follows:

```javascript
mParticle.logEvent('Play Movie', mParticle.EventType.Navigation, {
    movie_length: '127 minutes',
    rating: 'PG',
});
```

## Creating an Integration

If you configure mParticle via a snippet tag, the Web SDK is able to automatically include, initialize, and delegate API calls to 3rd-party SDKs. Otherwise you will install them via npm. For more instructions on installing via npm, view the [documentation](https://docs.mparticle.com/developers/sdk/web/self-hosting).

If you would like to add your company as a new Javascript integration, reference the following integrations as examples:

-   [Amplitude](https://github.com/mparticle-integrations/mparticle-javascript-integration-amplitude)
-   [Appboy](https://github.com/mparticle-integrations/mparticle-javascript-integration-appboy)
-   [BingAds](https://github.com/mparticle-integrations/mparticle-javascript-integration-bingads)
-   [Device Match](https://github.com/mparticle-integrations/mparticle-javascript-integration-device-match)
-   [Facebook](https://github.com/mparticle-integrations/mparticle-javascript-integration-facebook)
-   [Google Analytics](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics)
-   [Inspectlet](https://github.com/mparticle-integrations/mparticle-javascript-integration-inspectlet)
-   [Intercom](https://github.com/mparticle-integrations/mparticle-javascript-integration-intercom)
-   [Kahuna](https://github.com/mparticle-integrations/mparticle-javascript-integration-kahuna)
-   [Kissmetrics](https://github.com/mparticle-integrations/mparticle-javascript-integration-kissmetrics)
-   [Localytics](https://github.com/mparticle-integrations/mparticle-javascript-integration-localytics)
-   [Mixpanel](https://github.com/mparticle-integrations/mparticle-javascript-integration-mixpanel)
-   [Optimizely](https://github.com/mparticle-integrations/mparticle-javascript-integration-optimizely)
-   [SimpleReach](https://github.com/mparticle-integrations/mparticle-javascript-integration-simplereach)
-   [Twitter](https://github.com/mparticle-integrations/mparticle-javascript-integration-twitter)

## Contributing

See [CONTRIBUTING.md](https://github.com/mParticle/mparticle-web-sdk/blob/master/CONTRIBUTING.md).

The test script will run all tests using Karma and ChromeHeadless, and Firefox by default. To run tests using a different browser, use the command:

```
$ BROWSER=[browserBrand] npm run testBrowser
```

where browserBrand can be another browser such as Edge or IE.

## Development Notes

This package comes with the NPM package [pre-commit](https://www.npmjs.com/package/pre-commit), which will run [ESLint](http://eslint.org/) when you try to commit.

## Three-step release process (maintainers)

Releases have separate v2 and v3 tracks. In GitHub Actions, choose the
track-specific branch from the **Use workflow from** dropdown and run these
workflows in order:

1. **Staging Release - Step 1: Prepare CDN Pre-Release, Publish NPM**
   (`staging-step-1.yml`): select `staging` for `track=v2`, or `v3-staging` for
   `track=v3`. This workflow builds and tests the track, creates and merges a
   generated release branch, runs semantic-release, and publishes the npm
   release. `dryRun=true` previews the merge and semantic-release result
   without creating a branch or publishing; `dryRun=false` creates/pushes the
   release branch and publishes.
2. **Staging Release - Step 2: Publish SDK Release to Release Order Branch**
   (`staging-step-2.yml`, optional): select `master` for v2 or `main` for v3.
   The source-ref guard accepts either `master` or `main`, but use the track's
   matching trunk. For `releaseTag`, enter the exact Git tag created by the
   successful Step 1 run (for example, `v2.80.0` or `v3.0.1`). Choose
   `release-order-a`, `-b`, or `-c` as `releaseOrderBranch`. For v3, that
   logical choice maps to the corresponding `v3-release-order-*` branch.
   `dryRun=true` validates the exact candidate and fast-forward without
   pushing; `dryRun=false` promotes it.
3. **Staging Release - Step 3: Release to CDN and Synchronize Branches**
   (`staging-step-3.yml`): select `master` for v2 or `main` for v3 (the
   source-ref guard accepts either). For `releaseTag`, enter the same exact Git
   tag created by the successful Step 1 run. The workflow verifies that the tag
   matches `package.json`, resolves to the current track staging head, and can
   fast-forward every destination. It then uses one atomic push to synchronize
   the track's development branch, trunk (`master` or `main`), and all three
   release-order branches; either every ref updates or none does. `dryRun=true`
   performs all validation without pushing. `dryRun=false` performs the atomic
   synchronization and releases the candidate to those destinations.

Safe sequence: run Step 1 with `dryRun=true`, then Step 1 with `dryRun=false`;
copy its release tag; optionally preview and run Step 2 for each needed
release-order branch; finally run Step 3 with `dryRun=true`, then
`dryRun=false`.

The release controls must remain synchronized across the v2 and v3 trunks.
These files must be byte-for-byte identical on `master` and `main`:

- `.github/workflows/staging-step-1.yml`
- `.github/workflows/staging-step-2.yml`
- `.github/workflows/staging-step-3.yml`

Any change to any release step must be applied to both `master` and `main`
before running a real release. Every `dryRun=false` workflow verifies all three
files and rejects the release if either branch has a different version.
Additionally, the current Step 1 workflow must be present on `staging` for v2
and `v3-staging` for v3 because GitHub executes the workflow definition from
the branch selected in the **Use workflow from** dropdown.

## Support

<support@mparticle.com>

## License

The mParticle Web SDK is available under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0). See the LICENSE file for more info.

---
This project is tested with BrowserStack
