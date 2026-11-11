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
(function(e){window.mParticle=window.mParticle||{};window.mParticle.EventType={Unknown:0,Navigation:1,Location:2,Search:3,Transaction:4,UserContent:5,UserPreference:6,Social:7,Other:8,Media:9};window.mParticle.eCommerce={Cart:{}};window.mParticle.Identity={};window.mParticle.Rokt={};window.mParticle.config=window.mParticle.config||{};window.mParticle.config.rq=[];window.mParticle.config.snippetVersion=3;window.mParticle.ready=function(e){window.mParticle.config.rq.push(e)};var i=["endSession","logError","logBaseEvent","logEvent","logForm","logLink","logPageView","setSessionAttribute","setAppName","setAppVersion","setOptOut","setPosition","startNewSession","startTrackingLocation","stopTrackingLocation"];var t=["setCurrencyCode"];var n=["identify","login","logout","modify","search"];var o=["selectPlacements","hashAttributes","hashSha256","setExtensionData","use","getVersion","terminate","onShoppableAdsReady"];i.forEach(function(e){window.mParticle[e]=r(e)});t.forEach(function(e){window.mParticle.eCommerce[e]=r(e,"eCommerce")});n.forEach(function(e){window.mParticle.Identity[e]=r(e,"Identity")});o.forEach(function(e){window.mParticle.Rokt[e]=r(e,"Rokt")});function r(i,t){return function(){if(t){i=t+"."+i}var e=Array.prototype.slice.call(arguments);e.unshift(i);window.mParticle.config.rq.push(e)}}var a,c,s=window.mParticle.config,l=s.isDevelopmentMode?1:0,w="?env="+l,d=window.mParticle.config.dataPlan;if(d){a=d.planId;c=d.planVersion;if(a){if(c&&(c<1||c>1e3)){c=null}w+="&plan_id="+a+(c?"&plan_version="+c:"")}}var m=window.mParticle.config.versions;var f=[];if(m){Object.keys(m).forEach(function(e){f.push(e+"="+m[e])})}var p=document.createElement("script");p.type="text/javascript";p.charset="utf-8";p.async=true;p.src="https://jssdkcdns.mparticle.com/js/v3/"+e+"/mparticle.js"+w+"&"+f.join("&");var P=document.getElementsByTagName("script")[0];P.parentNode.insertBefore(p,P)})("REPLACE WITH API KEY");
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
for v3.

During the switch to the V3 files, `staging-step-1.yml` keeps its `v3` track
and kit recovery. The first V3 release after the split still runs it from
`v3-staging` with `track=v3`, because `v3-release-step-1.yml` reaches `main`
only at that release's Step 3. If that release's kit publishing fails, resume
it with **Staging Release - Step 1** from `v3-staging` (`track=v3`,
`dryRun=false`, `resumeKitReleaseTag`). The same release runs Steps 2 and 3
with **Staging Release - Step 2** and **Staging Release - Step 3** from `main`,
because `v3-release-step-2.yml` and `v3-release-step-3.yml` also reach `main`
only at its Step 3. Once a V3 release has run on
`v3-release-step-1.yml`, a follow-up removes the `v3` track from
`staging-step-1.yml`. V2 runs the copies on `staging` and `master`, which this
split does not change.

The last V3 release cut by semantic-release, whose Step 3 brings `main` level
with `v3-development`, ends that path. Every later V3 release is cut from
`main` by Release Please, as the next section describes, and `v3-development`
is retired.

### V3 releases from `main` with Release Please

V3 pull requests merge to `main`. Release Please reads their Conventional
Commit titles and cuts each V3 release from `main`:

1. **V3 Release Please** (`v3-release-please.yml`) keeps one release pull
   request open on `main`. It carries the next version, the changelog entry and
   the version of every kit.
2. On each push to that pull request, **V3 Release Please - Commit Release
   Bundles** builds core and every kit at that version and commits `dist/` and
   `kits/**/dist` as the release machine user. The check **V3 release bundles
   match version** passes once the committed bundles match that build. No other
   pull request to `main` may change `dist/` or `kits/**/dist` (the check **V3
   bundles change only in release PRs**).
3. Before merging the release pull request, check that it does not show "This
   branch is out-of-date with the base branch". If it does, wait for Release
   Please to rewrite it and for **V3 release bundles match version** to go
   green again. Hold other merges to `main` for a couple of minutes while you
   merge. Release Please publishes the GitHub release, creates the `v3.X.Y`
   tag on the merge commit, and dispatches **V3 Release - Step 1**
   (`v3-release-step-1.yml`) on that tag with `dryRun=false`.
4. **V3 Release - Step 1** checks that the tag is on `main`, builds the
   distribution bundle, rebuilds core and every kit and compares them with the
   tag's bundles, and runs the test suites. Once the build, bundle check and
   tests pass, it publishes core and every kit to npm `next`, moves
   `v3-staging` forward to the tag commit, and uploads and stages the V3
   candidate in S3. If the automatic dispatch from Release Please did not start
   Step 1 (or if Step 1 failed before packaging or staging started and needs to
   be started manually), run **V3 Release - Step 1** manually from that tag (in
   **Use workflow from**, choose the tag, not a branch) with `dryRun=false`: it
   skips every package npm already holds with the same bytes. If a Step 1 run
   stops part-way after packaging or staging, use **Re-run failed jobs** on
   that original Step 1 run (see **Recover an incomplete v3 kit publication**).
   A Step 1 run from a tag runs only while the repository variable
   `V3_RELEASE_PLEASE_ENABLED` is `true`, and a run from `v3-staging` fails
   once it is.
5. Run Steps 2 and 3 from `main` as described below. Step 3 pushes only the
   three release-order branches, because `main` already holds the release.
   Don't change `V3_RELEASE_PLEASE_ENABLED` while a Step 3 run or its S3
   promote is in progress. If a promote skipped because the variable changed,
   run `promote-ga` by hand.

`main` moves to the new version when the release pull request merges, and
`ga` serves it only after `promote-ga`. In that window `main` is ahead of
`ga` on every release. This is expected, and the gap closes at `promote-ga`.
Roll a release back with **v3-shadow-promote**: `rollback` for one channel, or
`rollback-all` for every channel in the selected pods. Rokt's internal V3 web
SDK delivery runbook holds the serving checks for each release.

Set the repository variable `V3_DIST_GUARD_ENABLED` to `true` once the first
Release Please release pull request's bundle commit shows as **Verified** on
GitHub. Until then, **V3 bundles change only in release PRs** passes with a
note. Then add it and **V3 release bundles match version** to the required
checks on `main`. When `V3_DIST_GUARD_ENABLED` is first set, or set again,
re-run **V3 bundles change only in release PRs** on every open pull request to
`main`. Each of them passed with a note while the variable was unset, and that
result stands until the check runs again.

#### Switch to Release Please

1. Run the last V3 release cut by semantic-release with the three steps below,
   Step 1 from `v3-staging`. Its Step 3 brings `main` level with
   `v3-development`, and with it **V3 Release Please**, which does nothing
   while `V3_RELEASE_PLEASE_ENABLED` is set to `false`.
2. Lock `v3-development` with its ruleset, and retarget its open pull requests
   to `main`. From here on, V3 pull requests merge to `main`.
3. Before `V3_RELEASE_PLEASE_ENABLED` is set, merge one small pull request to
   `main` that sets `.release-please-manifest.json` and `CHANGELOG.md` to that
   release's version. The manifest reads that version. The changelog gains a
   `# Changelog` title, and each semantic-release `# [3.X.0]` heading becomes
   `## [3.X.0]`. Release Please adds each entry before the first `##` or `###`
   version heading, so without this its first entry would land below that
   release's.
4. Set `V3_RELEASE_PLEASE_ENABLED` to `true`.
5. Set `V3_DIST_GUARD_ENABLED` once the first release pull request's bundle
   commit shows as **Verified**, as described above.

#### When a release does not go as planned

- **The release pull request merged, but no release or tag appeared.** Re-run
  the failed **V3 Release Please** run. If it fails again, publish the release
  from your own machine with the same files, then run Step 1 from the new tag.
  The command pins release-please 17.6.0, the version that the workflow's
  pinned `googleapis/release-please-action` v5.0.0 locks. Change both pins
  together. For `GITHUB_TOKEN`, create a fine-grained personal access token
  for this repository only, with a one-day expiry. Give it write access to
  Contents, Pull requests and Issues, and nothing else (GitHub adds read-only
  Metadata). Release Please labels the release pull request through the Issues
  API. Delete the token once the release is published.

  ```sh
  npx release-please@17.6.0 github-release --token "$GITHUB_TOKEN" \
    --repo-url mParticle/mparticle-web-sdk --target-branch main \
    --config-file release-please-config.json \
    --manifest-file .release-please-manifest.json
  ```

- **Abandon a release.** Before the merge, close the release pull request.
  Release Please opens a new one on the next push to `main`, with every
  unreleased change. To pause Release Please, set `V3_RELEASE_PLEASE_ENABLED`
  to `false` first, then close the open release pull request. That pauses V3
  releases. It does not bring back the semantic-release path (see **Fall back
  to the semantic-release path**). Don't use the `autorelease: snooze` label.
  With `always-update`, Release Please keeps force-updating a snoozed PR.
  After the merge, if a release must not ship, cancel the in-progress
  **V3 Release - Step 1** run if it is still running, do not run Steps 2 or 3
  for that tag, and do not re-dispatch Step 1 for it.
  Leave the tag and the GitHub release in place, never reuse the version, and
  merge the fix to `main`. Release Please then cuts the next version, and Step
  1 from that tag moves `v3-staging` past the abandoned one. This roll-forward
  is how to replace a bad release.
- **Release a chosen version.** Add the footer `Release-As: 3.X.Y` to the
  commit message of a pull request merged to `main`, for example by editing
  the squash commit message. The next release pull request then proposes
  3.X.Y instead of the version the commit types give.

#### Fall back to the semantic-release path

Fall back only when Release Please itself cannot cut releases. To replace one
bad release, roll forward as **Abandon a release** describes.

Setting `V3_RELEASE_PLEASE_ENABLED` to `false` does not bring back the old
path on its own. Step 1 from `v3-staging` builds whatever `v3-development`
holds, and `v3-development` stops moving at the switch.

It is safe to fall back only when no release is part-way. Every tag Release
Please cut has finished Step 3 or was abandoned, and no Step 1, 2 or 3 run is
in progress. Then:

1. Set `V3_RELEASE_PLEASE_ENABLED` to `false` first, then close the open
   release pull request without merging it.
2. Unset `V3_DIST_GUARD_ENABLED`. Remove **V3 bundles change only in release
   PRs** and **V3 release bundles match version** from the required checks on
   `main`. The old Step 3 pushes each release to `main` directly, not through
   a pull request.
3. Lift the ruleset that locks `v3-development`. Then bring `v3-development`
   and `v3-staging` up to `main`. If either ancestor check fails, stop: that
   branch holds a commit `main` lacks. Merge it into `main` with a pull
   request, then repeat this step. The push is not forced, so it only
   fast-forwards.

   ```sh
   git fetch origin main v3-development v3-staging
   git merge-base --is-ancestor origin/v3-development origin/main
   git merge-base --is-ancestor origin/v3-staging origin/main
   git push --atomic origin origin/main:refs/heads/v3-development \
     origin/main:refs/heads/v3-staging
   ```

4. Point both Dependabot updates in `.github/dependabot.yml` back at
   `v3-development`, and merge V3 pull requests there again. From here on,
   only Step 3 moves `main`.
5. Release with the three steps below, Step 1 from `v3-staging`. Step 1 and
   semantic-release take the newest `v3.X.Y` tag reachable from `v3-staging`,
   a Release Please tag included, so the next version follows it.

Step 3 cannot push an older `v3-development` over a newer `main`. Without
Release Please it pushes all five branches, `main` included. Before the push
it checks that each one can fast-forward to the tag. If one cannot, it stops
with `origin/main cannot fast-forward to v3.X.Y` and pushes nothing. That
means a commit reached `main` outside Step 3. Merge `main` into
`v3-development` with a pull request, then run Step 1 again.

To return to Release Please, finish the last release's Step 3, so `main` and
`v3-development` are the same commit. Then merge one pull request to `main`
that sets `.release-please-manifest.json` and `CHANGELOG.md` to that release's
version, as step 3 of **Switch to Release Please** describes, and points
Dependabot back at `main`. Set `V3_RELEASE_PLEASE_ENABLED` to `true`, and merge
V3 pull requests to `main` again. Set `V3_DIST_GUARD_ENABLED` again as
described above.

In GitHub Actions, choose the version's branch from the **Use workflow
from** dropdown and run its workflows in order:

1. **Step 1: Prepare CDN Pre-Release, Publish NPM**: run
   **Staging Release - Step 1** (`staging-step-1.yml`) from `staging` with
   `track=v2`, or **V3 Release - Step 1** (`v3-release-step-1.yml`) from the
   V3 release tag (see the section above; before Release Please, from
   `v3-staging`). From `staging` or `v3-staging`, this workflow builds and tests the version, creates and
   merges a generated release branch, runs semantic-release, and publishes the npm
   release. Before a new v3 release can advance, every existing kit `next` tag
   must match the core SDK's current `next` version. The one-time `3.0.0`
   bootstrap permits all kit tags to be absent so the first synchronized release
   can establish them. After building the target version, Step 1 also packs and
   registry-preflights all kit artifacts before publishing core. It then checks
   out the immutable release tag, waits up to five minutes for core to become
   visible on npm, publishes all packages in `kits/publish-matrix.json`
   concurrently with a bounded worker pool, and runs `auditRemotePackages` in
   strict mode at the end of `publish-kits.js`, reusing the tarballs it already
   packed so a missing or mismatched kit fails **Publish V3 kits** (`publish-kits`)
   before `advance-staging` moves `v3-staging` (with no extra `npm pack` and no
   extra workflow job). In **V3 Release - Step 1**, npm is then checked a second
   time by the release gate in **Upload and stage V3 candidate** described below:
   `check-release-parity.ts` compares every package's `dist.integrity` with the
   candidate and reads npm again for up to 10 minutes before it fails the
   release. The gate does not read dist-tags: `npm publish --tag` sets them,
   `assertDistTagWillNotMoveBackward` guards them before each publish,
   `auditRemotePackages` verifies them at the end of `publish-kits.js`, and the
   next release's `--preflight-tags` refuses to start until every kit's tag
   matches core's. The standalone **Audit V3 kits on npm** entrypoint
   (`publish-kits.js --audit`) warns when npm has not confirmed a package yet
   and fails on a mismatched artifact or dist-tag (or fails on both when called
   with `--strict`), and stays callable for older Step 1 copies and
   `staging-step-1.yml`'s v3 track. The next
   Step 1 refuses to start until every kit's `next` matches core, so a kit
   that never appears blocks the next release rather than shipping
   unnoticed. A rerun skips an existing kit only when its artifact is
   identical. `dryRun=true` previews the merge and semantic-release result
   without creating a branch or publishing; `dryRun=false` creates/pushes the
   release branch and publishes. If core publishes but kit publication (or
   candidate upload/stage) cannot finish, recovery depends on the Step 1 mode:
   in tag mode (Release Please, dispatched from `v3.X.Y`), use **Re-run failed
   jobs** on the original **V3 Release - Step 1** run (which keeps the original
   packaged candidate and its `${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}` build
   ID; never start a fresh Step 1 run or use **Re-run all jobs**), or if kits
   and `v3-staging` already succeeded and only candidate upload or stage
   failed, dispatch **V3 shadow release: upload candidate**
   (`v3-shadow-candidate.yml`) on `main` with `step1_run_id` set to the
   original Step 1 run ID, `release_gate=true`, and `release_tag` set to the
   release tag (`v3.X.Y`). In branch mode (dispatched from `v3-staging` before
   Release Please), rerun **V3 Release - Step 1** from `v3-staging` with
   `dryRun=false` and `resumeKitReleaseTag` set to the exact Step 1 tag.
   Branch-mode recovery validates that immutable tag, resumes kits without
   republishing core, and runs the integrated strict npm audit at the end of
   `publish-kits.js` so a missing or mismatched kit fails the recovery run.
   Because a branch-mode `resumeKitReleaseTag` recovery run
   skips Perform Release, Package and Upload, once it finishes green dispatch
   **V3 shadow release: upload candidate** (`v3-shadow-candidate.yml`) on
   `main` with `release_gate=true` and `step1_run_id` set to the original Step
   1 run.
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
   fast-forward every destination. It then uses one atomic push, so either every
   ref updates or none does. For v2, and for v3 before Release Please, that push
   synchronizes the version's development branch, trunk (`master` or `main`),
   and all three release-order branches. Once `V3_RELEASE_PLEASE_ENABLED` is
   `true`, V3 Step 3 first checks that the tag is on `main`, then pushes only the
   three release-order branches, because `main` already holds the release and
   `v3-development` is retired. `dryRun=true` performs all validation without
   pushing. `dryRun=false` performs the atomic push and releases the candidate
   to those destinations.

Safe sequence: run Step 1 with `dryRun=true`, then Step 1 with `dryRun=false`;
copy its release tag; optionally preview and run Step 2 for each needed
release-order branch; finally run Step 3 with `dryRun=true`, then
`dryRun=false`.

V3 candidate packaging, upload, and staging: a real **V3 Release - Step 1**
(`v3-release-step-1.yml`, `dryRun=false`) runs **Package V3 candidate
(shadow)** after the release to package the release tag's committed bundles
into a `v3-candidate-<run id>-<run attempt>` artifact (kept for 7 days). Once
**Publish V3 kits** has also succeeded, it runs
**Upload and stage V3 candidate**, which dispatches **V3 shadow
release: upload candidate** (`v3-shadow-candidate.yml`) on `main` with
`release_gate=true` and waits up to 120 minutes (the child jobs' 110-minute
ceiling plus 10 minutes of queue time, inside a 130-minute job timeout) for it
to succeed. A failed read of the child run's status (a 5xx or rate-limit reply)
is retried until that deadline. If the job fails, times out or is cancelled
before the child run completes, it cancels the child run. A refused cancel (a
5xx or rate-limit reply) is retried with a doubling backoff (6 tries, 5 seconds
apart at first) until GitHub accepts it or the child run reads completed, first
by the wait step and then by the cleanup step. Release-gate dispatches for one
Step 1 run share one concurrency group (`v3-shadow-candidate-gate-STEP1_RUN_ID`),
so a re-run's child queues behind a leftover child instead of staging the same
build in parallel with it. A newer gate dispatch for the same Step 1 run takes
the group's single pending slot from an older pending one, which then fails its
own Step 1 wait. A manual dispatch with `release_gate=false` or a transition
`workflow_run` runs in another group, so it cannot displace a pending gate run.

If the dispatch request succeeds but its reply is lost or carries no
`workflow_run_id`, the job fails with no child run ID, so nothing cancels that
child. Before re-running Step 1, open the **V3 shadow release: upload
candidate** runs, find any run dispatched after the failed Step 1 run started,
and cancel it if it is still running. If it is missed, the shared concurrency
group still makes the re-run's child wait for it to finish.

Release-gate mode accepts both an in-progress `v3-release-step-1.yml`
parent run and one that has already
completed without being cancelled (so a maintainer can also dispatch
`v3-shadow-candidate.yml` manually with `release_gate=true` for repair after
Step 1 finishes), provided **Perform Release** and **Package V3 candidate
(shadow)** succeeded and one unexpired candidate artifact exists. Release-gate
mode also requires npm parity to pass: every package must be on npm with the
candidate's integrity. npm can take minutes to show a version it has
accepted, so while npm parity reads pending (a version npm does not show yet) or unavailable
(an `npm view` error or an unexpected reply), the candidate workflow reads npm
again with a doubling backoff (15 seconds at first, at most 2 minutes apart)
for up to 10 minutes, with a last read when the 10 minutes run out. A fail
reading (a published package with another integrity) fails the gate at once,
and a read stops at the first package that differs. A package still pending
or unavailable after the last read fails the gate instead of uploading. Each
`npm view` gets at most 30 seconds, and each read of every package at most 2
minutes. A package the read has no time left for reads unavailable. If `sleep`
fails between reads, the check fails instead of reading npm again at once. A
transition `workflow_run`, or a manual dispatch with `release_gate=false`,
reads npm once. The **Check the candidate against the release** job's
25-minute timeout covers the 10 minutes, a last read of at most 2 minutes and
its other checks.
A failure in packaging, candidate verification, S3
upload, or `v3-staging` pointer staging fails the Step 1 release. In
release-gate mode, `V3_SHADOW_PODS` must include all five production pods
(`us1`, `us2`, `st1`, `eu1`, `au1`); `qa` is optional (if `qa` is listed in
`V3_SHADOW_PODS`, it runs in the same matrix and blocks the release on failure;
if `qa` is omitted from `V3_SHADOW_PODS`, only the five
production pods block the release and `qa` can run separately). Stage moves each
pod's `v3-staging` pointer independently in parallel, so if one pod fails, the
other pods have already moved to the new candidate; re-running failed jobs on
Step 1 (within the 7-day artifact window) re-runs **Upload and stage V3
candidate**, dispatches the candidate workflow again, and repairs the remaining
pods so every pod converges (`resumeKitReleaseTag` skips packaging and upload
as before). During the transition before a V3 release's Step 3 brings these
workflow updates to `main`, the shared **Staging Release - Step 1**
(`staging-step-1.yml`, `track=v3`) still uses the `V3_PACKAGE_CANDIDATE`
repository variable and the `workflow_run` trigger on `main`, so
`V3_PACKAGE_CANDIDATE` stays `true` until that transition release finishes.

### Recover an incomplete v3 kit publication

A real v3 Step 1 run can publish core and create the GitHub Release before all
33 kits finish. If the kit job fails:

1. Do not start a newer release or run Step 2 or Step 3.
2. Copy the exact release tag from the failed Step 1 run.
3. Use the failed job and its npm kit publish summary to identify any
   missing or rejected kits. Correct their npm or trusted-publisher configuration.
4. For a Release Please release (dispatched from a `v3.X.Y` tag), use
   **Re-run failed jobs** on the original **V3 Release - Step 1** run (which
   keeps the successful package job and its
   `${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}` build ID; never start a fresh Step
   1 run or use **Re-run all jobs**), and skip the rest of this step.
   Otherwise, dispatch **V3 Release - Step 1** from `v3-staging` with `dryRun=false`
   and `resumeKitReleaseTag` set to the failed run's exact tag. If `main` has
   no `v3-release-step-1.yml` yet (the first V3 release after the split),
   dispatch **Staging Release - Step 1** from `v3-staging` with `track=v3`
   and the same two inputs instead.
5. Wait for recovery to publish any missing kits (existing byte-identical
   packages are skipped) and for `publish-kits.js` to run its integrated strict
   npm audit to verify core and all 33 kits at that version on `next` and fail
   on any missing or mismatched package.
6. For a Release Please release, **Re-run failed jobs** on the original Step 1
   run re-runs `advance-staging` and `upload-v3-candidate` using the original
   run's packaged candidate (or, if `v3-staging` already moved and only
   candidate upload or stage failed, dispatch **V3 shadow release: upload
   candidate** (`v3-shadow-candidate.yml`) on `main` with `step1_run_id` set to
   the original Step 1 run's ID, `release_gate=true`, and `release_tag` set to
   the release tag `v3.X.Y` within the candidate's 7-day retention window).
   Otherwise, if the failed run was **V3 Release - Step 1** from `v3-staging`,
   it did not upload or stage its candidate because `resumeKitReleaseTag` skips
   packaging and upload: dispatch **V3 shadow release: upload candidate**
   (`v3-shadow-candidate.yml`) on `main` with `step1_run_id` set to the
   original failed Step 1 run's ID and `release_gate=true`, within the
   candidate's 7 days.
7. Continue to Step 2 or Step 3 only after the recovery run and the candidate
   upload are green.

In tag mode, `v3-staging` moves to the release tag before the S3 upload and
stage runs. If `v3-staging` moves and the S3 upload or stage then fails,
recover by using **Re-run failed jobs** on the original **V3 Release - Step 1**
run (which preserves the successful package job and its
`${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}` build ID) or by dispatching **V3
shadow release: upload candidate** (`v3-shadow-candidate.yml`) on `main` with
`step1_run_id` set to the original Step 1 run's ID, `release_gate=true`, and
`release_tag` set to the release tag (`v3.X.Y`),
within the candidate's 7-day artifact retention window. Never start a fresh
Step 1 run or use **Re-run all jobs** for recovery after any pod has staged:
that packages a new `${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}` build ID, and
`promote-v3-release.ts` rejects a different build of the same version on
already-staged pods without `--allow-rebuild`. When `release_tag` is omitted on
a tag-origin run (for example, when re-running failed jobs on an earlier
release tag whose `v3-release-step-1.yml` predates `release_tag`),
`shadow-release-trigger.ts` reads the release tag from the Step 1 run's
`head_branch`, logs a warning that the caller predates `release_tag`, and
continues; the check fails only when `release_tag` is provided and differs from
`head_branch`. Any rollback of this change on `main` must keep the
`release_tag` input declaration on `v3-shadow-candidate.yml` so Step 1 runs
from newer tags that send `inputs[release_tag]` can still dispatch the workflow
without GitHub rejecting `release_tag` as an unexpected input.

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
`main`'s. During the switch to the V3 files, a `track=v3` run of
`staging-step-1.yml` from `v3-staging` must match `main`'s copy instead. A V3
Step 1 run from a release tag requires the tag's commit to be on `main`
instead, so a later edit to the workflow on `main` does not block an earlier
tag.

npm trusted publishing names the workflow file that publishes each package:
`staging-step-1.yml` publishes v2 of `@mparticle/web-sdk`, and
`v3-release-step-1.yml` publishes v3 of `@mparticle/web-sdk` and every kit in
`kits/publish-matrix.json`. Until a V3 release has run on
`v3-release-step-1.yml`, each of those packages keeps `staging-step-1.yml` as a
trusted publisher too, so the first V3 release after the split can publish.

## Support

<support@mparticle.com>

## License

The mParticle Web SDK is available under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0). See the LICENSE file for more info.

---
This project is tested with BrowserStack
