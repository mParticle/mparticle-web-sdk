<img src="https://static.mparticle.com/sdk/mp_logo_black.svg" width="280"><br>

<!-- <img src="https://img.shields.io/github/release/mparticle/mparticle-web-sdk.svg?color=green"> <img src ="https://img.shields.io/npm/v/@mparticle/web-sdk.svg?color=green"> -->

# mParticle Web SDK

Hello! This is the public repo of the mParticle Web SDK. We've built the mParticle platform to take a new approach to web and mobile app data and the platform has grown to support 300+ integrations including analytics, data warehouses, and marketing automation. mParticle is designed to serve as the connector between all of these services - check out [our site](http://mparticle.com), or hit us at developers@mparticle.com to learn more.

## Documentation

Fully detailed documentation and other information about mParticle web SDK can be found at our doc site [here](https://docs.mparticle.com/developers/sdk/web/initialization/)

## Web SDK v3

Version 3 of the mParticle Web SDK is generally available. See [MIGRATING.md](MIGRATING.md) for the in-repo upgrade steps, the [3.0.0 changelog](https://github.com/mParticle/mparticle-web-sdk/blob/main/CHANGELOG.md#300) for the full commit list, and the [Upgrade to Version 3](https://docs.mparticle.com/developers/client-sdks/web/upgrade-to-version-3/) guide on the docs site.

## Include and Initialize the SDK

There are two ways to initialize the SDK, either via a script tag, or you can bundle the SDK via NPM. A summary of steps for both is available below, but you should review the detailed documentation for the [script tag](https://docs.mparticle.com/developers/sdk/web/getting-started) and [self hosting](https://docs.mparticle.com/developers/sdk/web/self-hosting) on the mParticle docs site.

### Option 1. Load mParticle via Script Tag

To integrate the SDK add the following snippet to your site after customizing `mParticle.config`, ideally in the `<head>` element. Replace `REPLACE WITH API KEY` at the end of the snippet with the API key for your mParticle Web workspace.

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
(function(e){window.mParticle=window.mParticle||{};window.mParticle.EventType={Unknown:0,Navigation:1,Location:2,Search:3,Transaction:4,UserContent:5,UserPreference:6,Social:7,Other:8,Media:9};window.mParticle.eCommerce={Cart:{}};window.mParticle.Identity={};window.mParticle.Rokt={};window.mParticle.config=window.mParticle.config||{};window.mParticle.config.rq=[];window.mParticle.config.snippetVersion=3;window.mParticle.ready=function(e){window.mParticle.config.rq.push(e)};var i=["endSession","logError","logBaseEvent","logEvent","logForm","logLink","logPageView","setSessionAttribute","setAppName","setAppVersion","setOptOut","setPosition","startNewSession","startTrackingLocation","stopTrackingLocation"];var n=["setCurrencyCode"];var t=["identify","login","logout","modify","search"];var o=["selectPlacements","hashAttributes","hashSha256","setExtensionData","use","getVersion","terminate","onShoppableAdsReady"];i.forEach(function(e){window.mParticle[e]=r(e)});n.forEach(function(e){window.mParticle.eCommerce[e]=r(e,"eCommerce")});t.forEach(function(e){window.mParticle.Identity[e]=r(e,"Identity")});o.forEach(function(e){window.mParticle.Rokt[e]=r(e,"Rokt")});function r(i,n){return function(){if(n){i=n+"."+i}var e=Array.prototype.slice.call(arguments);e.unshift(i);window.mParticle.config.rq.push(e)}}var a,c,s=window.mParticle.config,l=s.isDevelopmentMode?1:0,w="?env="+l,d=window.mParticle.config.dataPlan;if(d){a=d.planId;c=d.planVersion;if(a){if(c&&(c<1||c>1e3)){c=null}w+="&plan_id="+a+(c?"&plan_version="+c:"")}}var m=window.mParticle.config.versions;var f=[];if(m){Object.keys(m).forEach(function(e){f.push(e+"="+m[e])})}var p=document.createElement("script");p.type="text/javascript";p.async=true;p.src="https://jssdkcdns.mparticle.com/js/v3/"+e+"/mparticle.js"+w+"&"+f.join("&");var P=document.getElementsByTagName("script")[0];P.parentNode.insertBefore(p,P)})("REPLACE WITH API KEY");
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

V2 and V3 release with separate workflows: `staging-step-1.yml`,
`staging-step-2.yml` and `staging-step-3.yml` for v2, and
`v3-release-step-1.yml`, `v3-release-step-2.yml` and `v3-release-step-3.yml`
for v3. In GitHub Actions, choose the version's branch from the **Use workflow
from** dropdown and run its workflows in order:

1. **Step 1: Prepare CDN Pre-Release, Publish NPM**: run
   **Staging Release - Step 1** (`staging-step-1.yml`) from `staging` with
   `track=v2`, or **V3 Release - Step 1** (`v3-release-step-1.yml`) from
   `v3-staging`. This workflow builds and tests the version, creates and
   merges a generated release branch, runs semantic-release, and publishes the npm
   release. Before a new v3 release can advance, every existing kit `next` tag
   must match the core SDK's current `next` version. The one-time `3.0.0`
   bootstrap permits all kit tags to be absent so the first synchronized release
   can establish them. After building the target version, Step 1 also packs and
   registry-preflights all kit artifacts before publishing core. It then checks
   out the immutable release tag, waits up to five minutes for core to become
   visible on npm, and publishes all packages in `kits/publish-matrix.json`
   concurrently with a bounded worker pool. After all publishes finish, a
   separate **Audit V3 kits on npm** job, which no other job waits for, gives
   npm up to five minutes to show every package and verifies that the core SDK
   and every kit have the expected version, artifact integrity, and npm
   dist-tag. A package npm has not confirmed by then, because it does not show
   it yet or `npm view` failed, is a warning in the job summary, not a failure;
   a mismatched artifact or dist-tag fails the job. The next
   Step 1 refuses to start until every kit's `next` matches core, so a kit
   that never appears blocks the next release rather than shipping
   unnoticed. A rerun skips an existing kit only when its artifact is
   identical. `dryRun=true` previews the merge and semantic-release result
   without creating a branch or publishing; `dryRun=false` creates/pushes the
   release branch and publishes. If core publishes but kit publication cannot
   finish, rerun V3 Release - Step 1 from `v3-staging` with `dryRun=false` and
   `resumeKitReleaseTag` set to the exact Step 1 tag. Recovery validates that
   immutable tag and resumes kits without republishing core.
2. **Step 2: Publish SDK Release to Release Order Branch** (optional): run
   **Staging Release - Step 2** (`staging-step-2.yml`) from `master` for v2, or
   **V3 Release - Step 2** (`v3-release-step-2.yml`) from `main` for v3. Every
   run, dry runs included, rejects the other version's tag and a dispatch from
   any other branch. For `releaseTag`, enter the exact Git tag created by the
   successful Step 1 run (for example, `v2.80.0` or `v3.0.1`). Choose
   `release-order-a`, `-b`, or `-c` as `releaseOrderBranch`. For v3, that
   logical choice maps to the corresponding `v3-release-order-*` branch.
   `dryRun=true` validates the exact candidate and fast-forward without
   pushing; `dryRun=false` promotes it.
3. **Step 3: Release to CDN and Synchronize Branches**: run
   **Staging Release - Step 3** (`staging-step-3.yml`) from `master` for v2, or
   **V3 Release - Step 3** (`v3-release-step-3.yml`) from `main` for v3, with
   the same rule as Step 2. For `releaseTag`, enter the same exact Git
   tag created by the successful Step 1 run. The workflow verifies that the tag
   matches `package.json`, resolves to the version's current staging head, and can
   fast-forward every destination. It then uses one atomic push to synchronize
   the version's development branch, trunk (`master` or `main`), and all three
   release-order branches; either every ref updates or none does. `dryRun=true`
   performs all validation without pushing. `dryRun=false` performs the atomic
   synchronization and releases the candidate to those destinations.

Safe sequence: run Step 1 with `dryRun=true`, then Step 1 with `dryRun=false`;
copy its release tag; optionally preview and run Step 2 for each needed
release-order branch; finally run Step 3 with `dryRun=true`, then
`dryRun=false`.

Shadow v3 candidate packaging: when the `V3_PACKAGE_CANDIDATE` repository
variable is `true`, a real V3 Step 1 run also runs **Package V3 candidate
(shadow)** after the release. It packages the release tag's committed
bundles into a `v3-candidate-<run id>-<run attempt>` artifact, kept for 7 days.
It never runs for v2 or dry runs, has read-only access, and its failure does
not fail the Step 1 run. It does keep the Step 1 run open until it finishes,
so wait for the whole run to finish before starting Step 2 or Step 3. To turn
it off, delete the variable or set it to anything other than `true`.

### Recover an incomplete v3 kit publication

A real v3 Step 1 run can publish core and create the GitHub Release before all
33 kits finish. If the kit job fails:

1. Do not start a newer release or run Step 2 or Step 3.
2. Copy the exact release tag from the failed Step 1 run.
3. Use the failed job and its npm kit publish summary to identify any
   missing or rejected kits. Correct their npm or trusted-publisher configuration.
4. Dispatch **V3 Release - Step 1** from `v3-staging` with `dryRun=false`
   and `resumeKitReleaseTag` set to the failed run's exact tag.
5. Wait for recovery to verify core and all 33 kits at that version on `next`.
   Existing byte-identical packages are skipped and only missing kits publish.
6. Continue to Step 2 or Step 3 only after the recovery run is green.

If recovery reports that the tagged core version is missing from npm, stop the
kit recovery. Semantic-release may have pushed the generated staging commit and
tag before core publication failed:

1. Wait for npm propagation and confirm whether the tagged core version exists.
2. If core appears, rerun the kit recovery above with the same tag.
3. If core is confirmed absent, use the controlled maintainer procedure to
   restore `v3-staging` to the parent of the generated release commit and delete
   the automation-created orphan tag.
4. Rerun a normal Step 1 release with `resumeKitReleaseTag` empty.

Do not delete or move the tag until npm absence is confirmed. An npm publish
that times out locally can still succeed in the registry.

If core's `next` tag changes without a corresponding Step 1 Git tag, do not use
the bootstrap exception or guess a recovery tag. Stop releases and reconcile
the unexpected npm and Git state before continuing.

Each version's trunk owns its own copy of its release workflows: `master` for
v2 and `main` for v3. A change to one version's release steps does not need a
twin on the other trunk. Steps 2 and 3 run from the dispatching trunk, and the
rule above keeps each version on its own trunk's copy. GitHub executes Step 1
from the branch selected in the **Use workflow from** dropdown, so every
`dryRun=false` Step 1 run rejects the release unless its workflow on the
staging branch is identical to its trunk's copy: `staging-step-1.yml` on
`staging` to `master`'s, and `v3-release-step-1.yml` on `v3-staging` to
`main`'s.

npm trusted publishing names the workflow file that publishes each package:
`staging-step-1.yml` publishes v2 of `@mparticle/web-sdk`, and
`v3-release-step-1.yml` publishes v3 of `@mparticle/web-sdk` and every kit in
`kits/publish-matrix.json`.

## Support

<support@mparticle.com>

## License

The mParticle Web SDK is available under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0). See the LICENSE file for more info.

---
This project is tested with BrowserStack
