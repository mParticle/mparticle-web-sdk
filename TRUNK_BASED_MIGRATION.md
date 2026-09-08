# Trunk-Based Development Migration — Web SDK

**Status:** Draft / agreed v3 direction; implementation pending

**Owner:** Rob Ing

**Scope of this revision:** v3 development topology and release workflow. v2
behavior remains unchanged.

## Overview

The Web SDK has two active major-version tracks:

- v2 uses `master` and its existing development, staging, and release-order
  branches.
- v3 uses `main` and contains the core SDK plus `kits/**` on one shared version.

This migration makes `main` the sole development trunk for v3 and replaces the
v3 semantic-release pipeline with an explicit, `VERSION`-driven candidate and
publication process. It retires the active role of `v3-development` while
retaining it indefinitely at its cutover commit as a fixed read-only
compatibility ref, makes `v3-staging` the exact Rokt playground candidate, and
retains `v3-release-order-a/b/c` until canary delivery replaces them.

### Goals

- Send all normal v3 feature, fix, and maintenance PRs to `main`.
- Generate a reviewed `VERSION`-only release-intent PR from an explicit
  patch/minor/major workflow input.
- Freeze every v3 release candidate from an exact `main` commit.
- Generate, test, and pack core plus every kit once, then publish those exact
  approved artifacts without rebuilding.
- Require Rokt playground approval before a stable tag or npm publication.
- Keep the MPServer JavaScript service and production websites on the prior
  approved `main/dist` until atomic Step 3 promotes the exact approved
  candidate.
- Remove semantic-release from the target v3 process.
- Preserve the existing v3 release-order rollout until canary delivery exists.
- Keep v2 release behavior unchanged.

### Non-goals

- Changing v2 branch mappings, npm tags, or release semantics.
- Implementing canary delivery.
- Allowing `v3-staging` to become a second development branch.
- Committing generated package manifests, locks, changelog, or `dist` to
  `main` before a candidate is approved.
- Putting a rejected, pending, or otherwise unapproved generated distribution
  on `main`, even temporarily.

## Current state and migration baseline

### v2 current state — unchanged

The v2 track uses:

- `development` as its integration branch;
- `staging` as its release staging branch;
- `master` as its release-tracking/CDN branch;
- `release/<run_number>` as an ephemeral release branch; and
- `release-order-a/b/c` for phased rollout.

This document does not migrate that topology. Any future v2 trunk or
`VERSION`-file proposal must be planned and approved separately.

### v3 legacy flow — being migrated

The legacy v3 flow is:

```text
feature PRs
    |
    v
v3-development -> v3-staging -> main
                       |
                       +-> v3-release-order-a/b/c
```

The shared `staging-step-1/2/3.yml` workflows select this mapping with
`track=v3`. Step 1 freezes `v3-development`, fast-forwards `v3-staging`, runs
semantic-release, publishes the core SDK and kits to npm with the `next`
dist-tag, and creates the release commit and tag. Step 2 optionally promotes
the exact tag to a selected release-order branch. Step 3 atomically
synchronizes `v3-development`, `main`, and all three release-order branches.

This behavior successfully shipped v3 releases, but it makes
`v3-development` the effective product trunk and gives `v3-staging` both
release-source and testing responsibilities.

### Confirmed production consumer

The MPServer JavaScript service currently pulls generated bundles from
`main/dist` and serves them to production websites. MPServer is the delivery
owner and integration point for this path. Movement of `main` is therefore part
of production delivery, not merely repository synchronization. A commit that
changes `main/dist` may be fetched by MPServer through its existing refresh
behavior and then served to production consumers.

This confirmed dependency establishes three hard constraints:

- the `VERSION`-only release-intent PR and any release-fix PR leave `main/dist`
  unchanged, so MPServer continues serving the previous approved distribution
  throughout candidate generation and playground testing;
- generated candidate files exist only on `v3-staging` until approval,
  publication verification, and Step 3 preflight succeed; and
- only the exact playground-approved, checksum-verified `candidate_sha` may be
  promoted to `main`.

The production website URLs, bundle names, MPServer refresh path, and served-
bundle validation procedure must be documented in the cutover inventory. No
explicit CDN purge is currently required. Cache busting is deferred follow-up
work and is not a trunk-migration blocker.

### Legacy semantic-release responsibilities

Semantic-release is part of the current v3 implementation only. It currently:

- analyzes conventional commits and selects the next version;
- generates release notes and updates `CHANGELOG.md`;
- synchronizes core and kit package versions;
- invokes release scripts that build and commit distribution bundles;
- creates the release commit and stable Git tag;
- publishes the core package and coordinates kit publication;
- creates the GitHub Release; and
- supports the current release-tag-based kit recovery path.

The target v3 process removes semantic-release. Replacement automation must
explicitly own every required capability instead of silently dropping one:

- validate the reviewed `VERSION`;
- synchronize root and kit manifests and lockfiles;
- generate deterministic changelog content;
- clean and build all release outputs;
- run the complete core and kit test matrix;
- pack core and every publishable kit once;
- record package identities, versions, artifact hashes, and source/candidate
  SHAs;
- create the generated candidate commit;
- enforce playground approval for that exact candidate;
- create and verify the stable tag;
- publish exact packed artifacts with npm provenance and the `next` dist-tag;
- audit registry completeness and artifact integrity;
- create or recover the GitHub Release; and
- support safe pre-tag rejection and post-tag/npm recovery.

### Existing constraints that must be preserved

1. The current shared workflows enforce byte-for-byte parity between `master`
   and `main` for `staging-step-1/2/3.yml`. That parity guard is removed at
   cutover so v2 and v3 implementations can diverge. The v2 files and behavior
   remain unchanged on their existing refs.
2. v2 publishes with `latest`; v3 publishes with `next`. The target must
   preserve those explicit mappings.
3. Every phase must use its recorded full `source_sha` or `candidate_sha`;
   workflows must never resolve a moving branch independently or conflate the
   source and generated candidate commits.
4. A release must have a reachable stable baseline tag and must use the exact
   version computed by the reviewed patch/minor/major release-intent workflow.
5. Core and all publishable kits are versioned, built, published, and audited
   as one logical v3 release.
6. npm trusted publishing depends on the repository and workflow identity.
   Authentic `GITHUB_REF`, `GITHUB_REF_NAME`, and `GITHUB_SHA` must never be
   overwritten.
7. Dry runs validate workflow logic but cannot prove that npm accepts OIDC
   provenance, because no real publish occurs.
8. The v3 path initially remains in `staging-step-1.yml` so existing npm
   trusted-publisher configuration for core and all kits keeps the same
   workflow identity while branch contents diverge.

## Agreed v3 target topology

```text
short-lived branch --PR--> main
                              |
                    release-intent PR changes VERSION only
                              |
                      freeze exact main SHA
                              |
                              v
                     Step 1 generates one
                     candidate commit on
                        v3-staging
                              |
                    hard Rokt playground gate
                              |
                              v
                  tag -> publish exact packs
                    -> GitHub Release
                              |
                     Step 2 optional rollout
                              |
                  Step 3 required atomic production
                            promotion
                              |
               main + v3-release-order-a/b/c
```

Branch responsibilities:

- `main` — the only v3 product-development trunk and the source from which the
  MPServer JavaScript service pulls `main/dist` bundles for production
  websites. Normal v3 PRs target this branch. A reviewed release-intent PR
  updates only the authoritative `VERSION`; it does not regenerate `dist`.
- `v3-staging` — the exact generated candidate for Rokt-side playground
  testing. Automation derives it from a frozen `main` SHA and adds one
  generated candidate commit. No direct or product-only commit is releasable.
- `v3-release-order-a/b/c` — phased delivery branches retained until canary
  delivery is available.
- `v3-development` — legacy integration branch retained indefinitely at its
  recorded cutover commit as a fixed read-only compatibility ref after
  in-flight work is drained. It is never a PR target, candidate source, release
  source, mirror destination, or synchronization authority.
- `v3-release/<run_number>` — legacy release branches to inventory and retire;
  they have no role in the target process.

The top-level `VERSION` file is the sole v3 release-intent source. The
release-intent workflow accepts exactly one bump input: `patch`, `minor`, or
`major`. It validates that:

- current `VERSION` is valid stable semver;
- current `VERSION` agrees with the latest stable tag and the fully published
  core-and-kit npm baseline;
- root and kit package identities expected for the release are complete;
- the requested bump computes the intended next stable version; and
- the computed stable tag and every target npm package version are absent.

The workflow then opens a reviewed PR that changes only `VERSION`, for example:

```text
chore(release): set version to 3.0.2
```

Release-generated root and kit manifests, lockfiles, changelog, and
distribution outputs remain unchanged on `main` throughout candidate
generation, playground testing, and publication. This avoids leaving `main` in
a partially generated or unapproved state. Candidate automation derives all of
them from `VERSION`; only after approval and publication verification does Step
3 fast-forward the generated candidate commit back to `main`.

This separation is production-critical: while the release is prepared,
`main/dist` remains the previous approved distribution. Neither candidate
creation nor playground rejection changes the production-served files.

### Production risk and safety rationale

The highest-impact failure is advancing `main/dist` to generated files that
were not the exact playground-approved and checksum-verified release. That can
expose an unapproved bundle directly to production websites and cannot be
treated as harmless branch drift.

The main merge freeze prevents the recorded source parent from moving during
release work. Full expected-SHA and fast-forward checks prevent stale
automation from selecting a newer or unrelated commit. Atomic Step 3 prevents
`main` and release-order refs from partially diverging. Together these controls
make the production transition one auditable movement from the previous
approved `main` SHA to the approved candidate SHA.

## Target v3 release flow

### Release intent and main freeze

A maintainer dispatches the release-intent workflow with `patch`, `minor`, or
`major`. The workflow revalidates current `VERSION`, the latest stable tag,
and every core/kit npm baseline before calculating the target version and
opening the `VERSION`-only PR described above. The preferred title and squash
commit are:

```text
chore(release): set version to 3.0.2
```

Merging the generated release-intent PR does not build, publish, create a tag
or GitHub Release, or alter generated manifests, locks, changelog, or `dist`.
Production websites therefore continue consuming the prior approved
`main/dist`.

Immediately after merge, the release coordinator starts a merge freeze on
`main`. Normal feature PRs may continue through review but may not merge.
Release-fix PRs are the only exception. The freeze ends after successful Step
3, including required MPServer refresh and served-bundle validation, or an
authorized break-glass cleanup for a genuinely suspended release cycle.

Automation enforces the freeze by creating or enabling a temporary GitHub
ruleset scoped to `main`. It records the ruleset ID, release version,
`source_sha`, creation time, and authorized bypass actors in durable release
state. The ruleset blocks normal merges and direct pushes. A release-fix PR
still requires normal review and checks, and only the designated release
automation or release manager may merge it through the temporary bypass; the
bypass never permits an unreviewed direct source push.

Successful Step 3 finalization, after MPServer refresh and served-bundle
validation, and authorized break-glass cleanup remove or disable only the
recorded temporary ruleset ID, verify normal branch protections remain active,
and record cleanup success. Cleanup runs idempotently under `always()` where
safe. A separate manual unfreeze-recovery procedure accepts the release version
and recorded ruleset ID, verifies that no active publish/promotion operation
exists, removes only that matching temporary ruleset, and confirms `main` is
writable under its normal protections. Monitoring must flag stale release
rulesets so a failed workflow cannot leave `main` frozen indefinitely. It must
not automatically remove a ruleset for a valid `awaiting_approval` candidate
during its 30-day artifact lifetime; alerts do not silently shorten the
approved waiting window.
ruleset for a valid `awaiting_approval` candidate during its 30-day artifact
lifetime; alerts do not silently shorten the approved waiting window.

There is no normal `Abort` workflow. Rejection, a reviewed fix on `main`, and
`Recreate candidate` are the standard pre-tag recovery. Break-glass cleanup is
reserved for genuinely suspended release cycles and ruleset recovery; it
requires explicit authorization and an audit record.

The workflow records:

- `source_sha`: the exact frozen `main` commit containing `VERSION`;
- `version`: the validated contents of `VERSION`;
- `candidate_sha`: the generated commit tested in the playground;
- `artifact_manifest_sha256`: the hash of the artifact inventory;
- `artifact_attestation_ids`: the GitHub artifact attestations bound to the
  immutable candidate artifacts; and
- later, `release_tag`: exactly `v${version}`, resolving to `candidate_sha`.

These values must never be conflated or recomputed from a moving branch.
Immutable artifact/manifest identity is separate from append-only lifecycle
status history.

### Step 1: generate the candidate

For v3, Step 1 is dispatched from the `staging-step-1.yml` definition on
`main`. Keeping this workflow identity initially avoids reconfiguring npm
trusted publishers for core and every kit. The v3 implementation may use
explicit `Create candidate`, `Recreate candidate`, and recovery operations,
but it does not invoke semantic-release. It must:

1. Require `refs/heads/main` and acquire the non-cancelling v3 release lock.
2. Resolve and freeze `source_sha`, read `VERSION`, and validate the release
   version against Git tags and every npm package.
3. Verify that no stable tag or npm package already consumes the version.
4. Record the expected old `v3-staging` SHA and update `v3-staging` from
   `source_sha` using a pinned force-with-lease. This controlled reset is
   required after a rejected candidate diverges; an unqualified force is
   forbidden.
5. In a clean worktree at `source_sha`:
    - remove all prior generated outputs;
    - set the root package manifest and lockfile to `VERSION`;
    - use `scripts/prepare-kit-release.js` or its replacement to set every core
      and kit manifest/lock to the same version;
    - generate the changelog section from the previous stable tag through
      `source_sha` using
      `ROKT/rokt-workflows/actions/generate-changelog`, pinned to an immutable
      version or commit SHA and following the established Apple/Rokt Android
      release patterns;
    - build all core and kit distributions;
    - run lint, core, Jest, stub, integration, and all kit tests;
    - pack the core package and every publishable kit exactly once; and
    - create an inventory containing package name, version, tarball filename,
      SHA-256, size, `source_sha`, and build-tool versions.
6. Upload the packed tarballs and inventory as immutable GitHub Actions
   artifacts with `retention-days: 30`, addressed by artifact ID and digest.
   Generate GitHub artifact attestations binding those artifacts to the
   workflow, repository, `source_sha`, version, and manifest digest. Store the
   inventory and digest in the generated tree; do not commit tarballs to Git.
7. Create exactly one generated commit on top of `source_sha`, for example:

    ```text
    chore(build): generate 3.0.2 candidate artifacts
    ```

    The commit contains synchronized manifests and locks, changelog, generated
    `dist`, and the artifact inventory. It contains no product-source edits.

8. Push that commit to `v3-staging` with a lease and report `candidate_sha`.
9. Reverify that the uploaded artifact digest, attestation, and committed
   inventory agree, then append the `prepared` Deployment status linking
   `candidate_sha` to that immutable manifest and attestation identity.

Candidate generation creates no stable tag, GitHub Release, or npm package.
After the candidate is pushed, the same `staging-step-1.yml` run waits at the
protected playground environment and, if approved, continues into exact-
artifact publication. This preserves the existing trusted-publisher workflow
identity without preserving the legacy semantic-release implementation.

Lifecycle state is recorded as append-only GitHub Deployment statuses:

```text
prepared -> awaiting_approval -> rejected
                            \-> approved -> publishing -> published -> promoted
```

Every status references the exact candidate SHA, version, immutable manifest
digest, artifact ID, and attestation identity. Automation appends a new status;
it never edits or deletes history. `rejected` is terminal for that candidate.
Recreation starts a new candidate and status history.

GitHub's Deployment Status API state values are mapped to the logical labels:
`prepared=queued`, `awaiting_approval=pending`, `rejected=failure`,
`approved=success`, `publishing=in_progress`, `published=success`, and
`promoted=success`. The status description records the logical label, and the
deployment/release metadata carries the immutable identities. Repeated API
values such as `success` never replace prior records; consumers evaluate the
ordered history and logical labels.

### Rokt playground approval gate

`v3-staging` must equal `candidate_sha` and is the exact Rokt playground
candidate. Playground execution records its result against `candidate_sha`,
`version`, and `artifact_manifest_sha256`. Entering the protected environment
appends `awaiting_approval`; approval appends `approved`.

Approval is implemented with a protected GitHub Environment and required
reviewers. The waiting deployment job must be named with the exact version and
full candidate SHA, for example:

```text
Review v3.0.2 candidate a1b2c3d4e5f678901234567890abcdef12345678
```

Authorized reviewers use GitHub's **Review deployments** UI. Approval is a hard
publication gate. If a bug or rejection condition is found, a reviewer must
explicitly click **Reject** and include a reason. Never leave the deployment
pending or merely ignore it; explicit rejection is required to close the
candidate and unblock controlled recreation.

The candidate may remain `awaiting_approval` for up to the full 30-day artifact
retention ceiling. The deployment summary and job output show artifact creation
time, expiration time, and remaining lifetime; automation must not silently
shorten that window. This means the temporary ruleset may keep `main` frozen
for up to 30 days, blocking normal merges. Operators must treat that as an
explicit release risk.

At artifact expiry, an automated guard marks the deployment ineligible for
approval and publication. A late approval cannot override expiration. Because
expiration is an immutable eligibility fact rather than a lifecycle state, the
candidate remains `awaiting_approval` until an authorized reviewer explicitly
rejects it with an expiration reason. The operator then runs the normal
`Recreate candidate` flow; no expired artifact or approval is reused.

A rejection handler appends the `rejected` Deployment status with the exact
`candidate_sha`, manifest digest, artifact/attestation identity, reviewer, and
reason even though the waiting job terminates as rejected. The publication job
must independently verify the append-only status history and approved evidence
for the exact candidate. Approval attached only to a branch name, version
string, expired artifact, or superseded candidate is invalid.

### Rejection, fix, reset, and regeneration

If the playground rejects the candidate:

1. The authorized reviewer clicks **Reject** in **Review deployments**, enters
   the rejection reason, and verifies the latest logical Deployment status is
   `rejected`.
2. Block publication and verify that neither `v${version}` nor any core/kit npm
   package at that version exists.
3. Preserve the rejected `candidate_sha`, reason, logs, artifact ID, and test
   evidence for audit, but never merge the rejected candidate.
4. Fix source or tests through a reviewed release-fix PR to frozen `main`,
   merged only by the actor authorized for the temporary ruleset bypass.
   `VERSION` remains unchanged, and the PR must not modify `dist`.
5. Dispatch the `Recreate candidate` operation. It observes the rejected
   `v3-staging` SHA, then resets staging to corrected `main` only with:

    ```text
    force-with-lease=v3-staging:<expected-rejected-candidate-sha>
    ```

6. Regenerate from clean inputs, producing a new artifact ID, manifest digest,
   tarball hashes, and `candidate_sha` at the same version.
7. Create a new protected-environment deployment for the new candidate. The
   rejected deployment and its approval state are never reused.

The version remains reusable only because no stable tag or npm publication
consumed it. Any evidence that either exists ends this rejection path.
Throughout rejection and recreation, `main/dist` remains byte-for-byte equal to
the prior approved production distribution.

Defense in depth prevents a stale rejected run from publishing even if someone
later approves its old deployment. Immediately before tagging, the waiting
Step 1 run must require all of the following to match its recorded values:

- current `main` equals the candidate's `source_sha`;
- current `v3-staging` equals its `candidate_sha`;
- the latest append-only lifecycle status is `approved` and no `rejected`
  status exists;
- environment approval identifies that exact candidate and version; and
- artifact ID, artifact digest, GitHub attestation, committed manifest, and
  every tarball hash match.

Any mismatch fails closed without creating a tag or publishing.

### Publish the approved candidate

After environment approval, the same `staging-step-1.yml` run continues with
the approved `candidate_sha` and immutable artifact ID. A recovery invocation
may resume an already tagged candidate, but it uses the same workflow identity
and artifacts. Publication must never rebuild, repack, regenerate the
changelog, or change any manifest.

The safe order is:

1. Acquire the same v3 release lock and verify the `main` freeze is active.
2. Verify:
    - `VERSION` on frozen `main` equals the requested version;
    - `candidate_sha` has `source_sha` as its first parent;
    - `v3-staging == candidate_sha`;
    - the candidate contains only expected generated paths relative to
      `source_sha`;
    - playground approval matches the exact SHA and inventory digest;
    - the append-only history is valid and its latest status is `approved` for
      first publication or `publishing` for partial-publication recovery, with
      no `rejected` status;
    - downloaded artifact ID/digest, every tarball SHA-256, package name, and
      version match the committed inventory;
    - GitHub artifact attestations verify for the downloaded artifact subjects,
      workflow identity, repository, source SHA, version, and manifest digest;
    - for first publication, the stable tag and all target npm package versions
      are absent; or
    - for recovery, the stable tag already resolves to `candidate_sha` and
      every existing package is byte-identical to the inventory.
3. Append `publishing`, then for first publication create and push the annotated
   stable tag
   `v${version}` at `candidate_sha`. This is the irreversible
   version-consumption boundary. Recovery reuses that exact tag and never
   creates, deletes, or moves it.
4. Publish the exact core and kit tarballs with `--tag next --provenance`.
   Publish core and kits in the documented order and never substitute a rebuilt
   tarball. Recovery publishes only missing packages, then audits the complete
   inventory.
5. Wait for registry propagation and audit every package's version, tarball
   integrity, provenance, and `next` dist-tag.
6. Create the GitHub Release from the existing stable tag only after the npm
   completeness audit succeeds. Attach the inventory and relevant release
   assets.
7. Append `published` and report the exact tag and candidate SHA for Steps 2
   and 3.

Tag-before-npm makes the immutable Git identity explicit before publication.
Once created, the stable tag is the recovery authority for that version. If npm
partially fails, the tag remains fixed and publication resumes only for missing
packages from the same attested artifacts. Never move, delete, or reuse the tag
and never rebuild the artifacts. GitHub Release creation occurs only after the
full core-plus-kits npm audit succeeds, so a normal release is not advertised
before completeness is proven.

If any required GitHub Actions artifact is missing or its 30-day retention has
expired, approval and publication fail closed. Before stable tagging, an
authorized reviewer explicitly rejects the candidate with the missing/expired
artifact reason, then runs `Recreate candidate` to produce a distinct candidate
and obtain a new approval; never rebuild or substitute the expired approved
artifact set. After stable tagging, rebuilding is forbidden; stop the release,
preserve the tag, and use the forward-version recovery policy if the original
exact artifacts cannot be restored.

### Step 2: optional release-order promotion

Step 2 accepts only the exact stable tag emitted by the publish workflow. It:

- validates that the remote tag resolves to the approved `candidate_sha`;
- validates `VERSION`, core and kit manifests, npm completeness, and artifact
  inventory;
- verifies the selected release-order branch can fast-forward; and
- fast-forwards one selected `v3-release-order-a/b/c` branch to the tag.

Promotion remains optional. Operational guidance recommends A → B → C with
observation between phases, but the workflow does not require that order.
Step 2 never updates `main`; skipping or failing Step 2 leaves production
`main/dist` unchanged and does not make Step 3 optional.

### Step 3: required atomic production promotion

Step 3 consumes the same stable tag and:

- verifies the tag, candidate SHA, `VERSION`, npm completeness, GitHub Release,
  and candidate artifact inventory;
- verifies `main` still equals the recorded expected `source_sha`, and verifies
  every release-order destination still equals its recorded expected SHA;
- proves every destination can fast-forward to `candidate_sha`; and
- atomically pushes `candidate_sha` to `main` and all three
  `v3-release-order-a/b/c` branches.

`v3-development` is absent from preflight and the atomic push. `v3-staging`
already equals the candidate and is not an additional destination. All four
destinations update or none do. The coordinator ends the `main` merge freeze
only after Step 3 and required MPServer served-bundle validation succeed.

Step 3 is production-critical and required to complete the release because
the MPServer JavaScript service pulls `main/dist` for production websites. It
may move `main` only to the exact playground-approved `candidate_sha` whose
committed inventory and downloaded artifacts passed checksum verification. A
rejected, stale, or publication-incomplete candidate must never become `main`'s
tip. Failed preflight or failed atomic push must leave `main` and its
production `dist` tree at the prior approved SHA.

After `main` advances, operators verify that the MPServer JavaScript service
observes the new commit through its existing refresh behavior and serves the
exact approved bundle. Validation compares the served bundle identity or
checksum with the approved `candidate_sha` inventory. No explicit CDN purge is
part of Step 3. Step 3 is not complete until the MPServer observation and
served-bundle checks succeed; only then append `promoted`.

### Permanently fixed `v3-development` compatibility ref

At cutover, record the exact `v3-development` SHA and make the branch
read-only. It remains permanently fixed at that cutover commit:

- no PR may target it;
- no release workflow may read a candidate or version from it;
- Steps 1–3 neither validate nor update it;
- no mirror or post-release job may advance it; and
- its SHA is never evidence that a release or synchronization succeeded.

All consumers that require current v3 code must be inventoried and migrated to
`main`, a stable tag, or the appropriate package/bundle delivery path before
cutover. The fixed ref exists only for historical compatibility and audit.

### Branch protection and concurrency

Required target protections:

- `main`: require PRs, one approval, CODEOWNER review where configured, and
  required build/test checks; block deletion and force-push.
- Require a `main` path-policy check that rejects `dist/**` changes from normal,
  release-intent, and release-fix PRs. Only Step 3 automation may update
  `main/dist`, and only by promoting the verified `candidate_sha`.
- During a release, add the automation-controlled temporary ruleset described
  above; do not edit or replace the permanent `main` protections.
- `v3-staging`: block direct pushes for humans, block deletion and
  general force-push, and allow only the candidate automation's pinned
  force-with-lease update.
- `v3-development`: record the cutover SHA, block all normal and automation
  updates, deletion, and force-push, and alert on any attempted movement.
- `v3-release-order-a/b/c`: block human direct/force pushes and allow only
  release automation.
- Grant the release bot or GitHub App a narrow bypass for candidate generation,
  stable-tag creation, and atomic Step 3. Do not grant a general administrator
  bypass.
- Use durable release state plus one non-cancelling v3 release lock from
  candidate generation through Step 3 so two versions or candidates cannot be
  active simultaneously.
- Recheck remote SHAs immediately before every push. A failed lease or
  non-fast-forward is a safe failure, not a reason to force.

## Later canary work

Pre-publication playground approval and exact-artifact publication are part of
the initial target. Future canary work is limited to replacing
`v3-release-order-a/b/c` and their Step 2/3 promotion behavior; all other
release gates and the single `main` development trunk remain unchanged.

## Deferred cache-busting follow-up

The current MPServer JavaScript delivery path requires no explicit CDN purge.
The trunk migration relies on MPServer's existing refresh behavior and verifies
the exact served bundle after Step 3. Designing cache-busting or explicit
invalidation is separate future work; it is not required for migration
cutover and must not delay this branch-model change.

## Operator workflow guidance

- For every v3 workflow, select `main` in GitHub's **Use workflow from**
  dropdown. GitHub executes the workflow definition from the selected ref.
- Merge the reviewed `VERSION`-only release-intent PR.
- Start the `main` merge freeze and record `source_sha`.
- Run candidate generation in preview mode, then create the real candidate.
- Confirm `v3-staging`, the reported `candidate_sha`, and the committed
  inventory digest match.
- Run the Rokt playground against that exact candidate and record approval.
- If rejected, explicitly click **Reject**, enter a reason, and run the
  documented release-fix and `Recreate candidate` flow.
- If approved, allow the waiting `staging-step-1.yml` run to continue with its
  exact candidate SHA and artifact ID. Confirm tag, npm completeness,
  provenance, and GitHub Release before promotion.
- Optionally preview and run Step 2 for A, then B, then C.
- Preview Step 3, verify all destinations, then run its atomic promotion.
- Treat Step 3 as required production delivery. Wait for MPServer's existing
  refresh, verify it serves the exact approved bundle checksum, then end the
  merge freeze. Do not add an explicit CDN purge.
- Confirm `v3-development` remains at its recorded cutover SHA.
- For v2, continue using the existing documented refs, workflows, and
  `track=v2`; none of these v3 steps changes v2.

## Commit graph examples

### First candidate

```text
v3.0.1
   |
   A---B---R                         main (frozen at source_sha)
            \
             C                      v3-staging (candidate_sha)

R = chore(release): set version to 3.0.2
C = chore(build): generate 3.0.2 candidate artifacts
```

There is no `v3.0.2` tag and no npm `3.0.2` package at this point.

### Rejection, fix, reset, and regeneration

```text
v3.0.1---A---B---R---F               main (corrected source_sha)
                   \
                    C1               rejected candidate (preserved by SHA)
                         [lease reset v3-staging from C1 to F]
                           \
                            C2        v3-staging (new candidate_sha)

F  = reviewed release-fix PR; VERSION remains 3.0.2
C1 = rejected generated candidate
C2 = regenerated 3.0.2 candidate with new artifacts and hashes
```

`C1` is never merged or tagged. Reusing `3.0.2` is allowed only after proving
that no stable tag or npm package consumed it.

### Successful release

```text
v3.0.1---A---B---R---F---C2          main after Step 3
                         ^  ^
                         |  +-------- v3-staging
                         +----------- tag v3.0.2
                         +----------- v3-release-order-a/b/c after Step 3
```

The stable tag points directly to the approved generated candidate commit.

## Migration implementation phases

### Phase A: prepare and isolate v2

- Announce the v3 cutover and stop new PRs to `v3-development`.
- Retarget in-flight work to `main`.
- Inventory and migrate every `v3-development` consumer before cutover, then
  record the branch's permanent cutover SHA.
- Document the MPServer JavaScript service as the owner and integration point
  that pulls `main/dist` for production websites, including bundle URLs, bundle
  names, existing refresh behavior, and served-checksum validation procedure.
- Inventory all other `v3-staging` and legacy-workflow consumers, package
  names, npm trusted publishers, branch protections, and workflow parity
  requirements.
- Plan removal of the `master`/`main` byte-parity guard at cutover. Preserve
  the existing v2 workflow content and behavior on its current refs.

### Phase B: build replacement automation

- Add the authoritative `VERSION` and a patch/minor/major release-intent
  workflow that validates current VERSION/tag/npm state and opens a
  `VERSION`-only PR without release side effects.
- Refactor existing release scripts so candidate generation can synchronize
  versions and build without creating intermediate commits or publishing.
- Pin `ROKT/rokt-workflows/actions/generate-changelog` immutably and implement
  one generated candidate commit.
- Implement 30-day GitHub Actions artifact storage, inventory hashing, artifact
  attestations, remaining-lifetime display, expiry enforcement, and exact-
  artifact download.
- Implement append-only GitHub Deployment lifecycle statuses plus the protected
  GitHub Environment, exact candidate/version deployment job, required
  reviewers, and explicit rejection reason.
- Keep v3 publication in `staging-step-1.yml` and audit every existing core/kit
  trusted publisher against that workflow identity.
- Implement the temporary freeze ruleset, reviewed release-fix bypass,
  idempotent cleanup, manual unfreeze recovery, and stale-ruleset monitoring.
- Document the absence of a normal Abort workflow and restrict manual
  break-glass cleanup to genuinely suspended cycles and ruleset recovery.
- Adapt Steps 2 and 3 to the new tag/candidate contract and remove
  `v3-development` from all authoritative mappings.

### Phase C: prove failure behavior

- Dry-run first candidate creation and verify no tag/npm side effects.
- Verify patch, minor, and major inputs calculate and open the expected
  `VERSION`-only PR only after current VERSION/tag/npm validation; merging that
  PR must not tag, publish, build, or change `dist`.
- Test stale `main`, invalid `VERSION`, existing tag/version, staging lease
  failure, generated-path allowlist failure, artifact hash mismatch, missing or
  expired artifact, partial npm publication, GitHub Release retry, and Step 3
  atomic-push rejection.
- Verify explicit rejection records its reason and candidate status, prevents
  publication, permits the authorized release-fix bypass, and drives
  lease-protected same-version `Recreate candidate`.
- Verify a stale rejected deployment fails publication even if later approved,
  including independent mismatches in main SHA, staging SHA, candidate status,
  artifact ID, manifest digest, and tarball hash.
- Verify the only valid lifecycle paths are:
    - `prepared -> awaiting_approval -> rejected`; or
    - `prepared -> awaiting_approval -> approved -> publishing -> published -> promoted`.
      Immutable manifest identity remains separate from append-only status
      history.
- Verify artifact attestations against subject digest, workflow identity,
  repository, source SHA, version, and manifest digest before publication.
- Verify the approval UI displays the full remaining artifact lifetime up to 30
  days, late approval/publication fails after expiry, and expired candidates
  require explicit rejection and recreation.
- Verify freeze-ruleset cleanup after success, authorized break-glass
  suspension, job failure, and manual unfreeze recovery.
- Verify the real publish job retains the `staging-step-1.yml` trusted-
  publisher identity.
- Verify the stable-tag recovery path never rebuilds or moves the tag.
- Verify candidate rejection and recreation leave `main` and `main/dist` at
  the prior approved SHA.
- Verify normal, release-intent, and release-fix PRs that modify `dist/**` fail
  the required path-policy check.
- Verify failed or partial publication cannot invoke Step 3 and leaves
  `main/dist` unchanged.
- Verify skipped or failed Step 2 leaves `main/dist` unchanged and does not
  waive required Step 3.
- Verify every Step 3 expected-SHA or fast-forward preflight failure leaves all
  destinations unchanged.
- Force an atomic-push rejection and prove no destination moves, especially
  `main` and its `dist` tree.
- Verify successful Step 3 exposes only the approved `dist` checksums after
  MPServer's existing refresh, without invoking an explicit CDN purge.
- Verify `v3-development` cannot move from its recorded cutover SHA and no
  release or mirror job targets it.
- Force partial npm publication and verify the stable tag remains the recovery
  authority, only missing packages resume from exact attested artifacts, and
  the tag is never moved or reused.
- Verify the GitHub Release cannot be created until the full core-plus-kits npm
  audit succeeds.
- Verify no routine Abort workflow exists and manual cleanup enforces the
  documented break-glass suspension criteria.
- Run complete v2 regression validation.

### Phase D: controlled cutover

- Land branch protections and freeze enforcement.
- Remove the cross-branch byte-parity guard while leaving the v2 workflow
  implementation unchanged.
- Generate and merge the first `VERSION`-only release-intent PR.
- Execute candidate generation, hard playground approval, exact-artifact
  publication, optional release-order rollout, and Step 3.
- Keep `main` frozen throughout.
- Audit Git, npm, provenance, GitHub Release, and all destination SHAs before
  declaring success.
- Make `v3-development` read-only and verify it remains permanently fixed at
  the recorded cutover commit.

### Acceptance criteria

- Normal v3 PRs and all release fixes merge through `main`.
- `VERSION` is the only authoritative release intent on `main`.
- The release-intent workflow accepts patch/minor/major, validates current
  VERSION/tag/npm state, and generates a reviewed `VERSION`-only PR whose merge
  does not publish, tag, build, or modify `dist`.
- Step 1 produces one generated candidate commit from the exact frozen
  `source_sha`.
- `v3-staging` equals the tested `candidate_sha`; direct product commits are
  rejected.
- Playground approval uses the protected environment, required reviewers, and
  an exact candidate/version job name.
- Explicit rejection with a reason marks the candidate rejected and blocks
  publication.
- `Recreate candidate` resets staging only with a pinned lease, retains
  `VERSION` when unconsumed, regenerates exact artifacts, and creates a new
  approval deployment.
- Stale rejected runs fail publication even if later approved because current
  main SHA, staging SHA, candidate status, artifact ID, manifest digest, and
  tarball hashes are independently revalidated.
- Publication uses the tested tarballs without rebuilding.
- Tarballs and checksum manifest are GitHub Actions artifacts retained for 30
  days; missing or expired artifacts fail closed.
- The approval job shows artifact expiration and remaining lifetime, permits
  waiting through the full 30-day ceiling, and makes approval/publication
  ineligible at expiry until explicit rejection and recreation.
- GitHub artifact attestations verify every candidate artifact before
  publication.
- Lifecycle state follows the required append-only GitHub Deployment status
  transitions, while manifest/artifact identity remains immutable and separate.
- Candidate creation, rejection, failed publication, and Step 2 never modify
  the production-served `main/dist`.
- The stable tag resolves to `candidate_sha`.
- Core and every kit publish with expected integrity, provenance, and `next`.
- GitHub Release creation is idempotently recoverable from the existing tag.
- The stable tag is created before npm, is the immutable authority for partial-
  publication recovery, and is never moved or reused; the GitHub Release is
  created only after the complete npm audit.
- Steps 2 and 3 consume the exact stable tag; Step 3 is atomic and excludes
  `v3-development`.
- Step 3 is required production delivery and advances `main` only from its
  expected SHA to the exact approved candidate; any failed preflight or atomic
  push leaves `main/dist` unchanged.
- After `main` advances, MPServer must observe the commit through its existing
  refresh behavior and serve the exact approved bundle checksum; no explicit
  CDN purge is required.
- The merge freeze ends only after successful Step 3 plus required production
  MPServer served-bundle validation, or authorized break-glass cleanup for a
  genuinely suspended cycle.
- Temporary-ruleset cleanup is idempotent, manually recoverable, and leaves
  permanent branch protections intact.
- v3 publication retains the existing `staging-step-1.yml` npm trusted-
  publisher identity after workflow parity is removed.
- Changelog generation uses the pinned organization-owned action.
- `v3-development` remains fixed at its cutover SHA and is never mirrored or
  advanced.
- All `v3-development` consumers are inventoried and migrated before cutover.
- No normal Abort workflow exists; only audited manual break-glass cleanup may
  suspend a release cycle or recover its temporary ruleset.
- v2 behavior is unchanged.

## Failure states and recovery

### Before stable tag and npm publication

- Build/test/pack failure: fix automation or source through `main`; clean and
  rerun candidate generation.
- Playground rejection: explicitly reject with a reason, mark the candidate
  rejected, then use the authorized release-fix PR, pinned staging reset,
  `Recreate candidate`, and same-version regeneration flow.
- Stale approval: fail publication unless current main SHA, staging SHA,
  candidate status, environment approval, artifact ID, manifest digest, and
  tarball hashes all match.
- Missing or expired artifact: fail closed, explicitly reject with the artifact
  reason, then recreate/reapprove the candidate while the version remains
  unconsumed.
- Hash, ancestry, approval, or lease mismatch: stop without tagging or
  publishing.
- Rejection or failed publication: do not run Step 3; `main/dist` remains the
  prior approved production distribution.
- Do not use a routine abort to abandon a candidate or unfreeze `main`. Follow
  Reject + fix + Recreate unless the release cycle is genuinely suspended and
  the break-glass criteria below are met.

### Stable tag exists, npm absent

The version is consumed. Do not delete or move the tag and do not regenerate
artifacts at that version. Diagnose the publish blocker and retry using the
same approved tarballs. If publication is permanently abandoned, advance
`VERSION` with a new release-intent PR and use a forward patch; retain the tag
as audit evidence.

### Partial or uncertain npm publication

- Stop all newer releases.
- Wait for registry propagation; timeout is not proof of absence.
- Compare every published tarball integrity to the committed inventory.
- Resume only missing packages from the same immutable artifact set.
- Never republish an existing package unless the registry confirms the
  artifact is byte-identical and the operation is an idempotent recovery.
- Complete the full core-plus-kits audit before creating the GitHub Release or
  allowing Step 2/3.

### npm complete, GitHub Release absent

Retry only GitHub Release creation against the existing stable tag. Do not
rebuild, retag, or republish.

### Step 2 or Step 3 failure

Step 2 may be retried against the same tag and never changes `main`. A failed
Step 2 therefore leaves production `main/dist` unchanged.

A failed Step 3 preflight must make no push. A rejected atomic Step 3 push must
leave all four destinations unchanged, including the production-serving
`main/dist`. Keep `main` frozen, correct the preflight or permission issue, and
retry against the same approved candidate.

If the atomic push succeeds but MPServer does not observe the expected commit
or served-bundle checksum through its existing refresh behavior, `main` has
already advanced. Keep the freeze active and never reset or force-push `main`.
Retry observation and diagnose the existing refresh path without introducing
an ad hoc purge. If the promoted bundle is defective, use the forward-patch
rollback path.

If an unauthorized `main` merge makes the published candidate unable to
fast-forward, do not force-push, move the tag, or reuse the version. Escalate
to a reviewed reconciliation procedure that preserves both histories, then
ship a forward patch if exact atomic promotion is no longer possible.

### Fixed compatibility-ref violation

Any movement of `v3-development` after cutover is an unauthorized branch-policy
violation. Stop the actor or automation responsible, preserve audit evidence,
and restore the recorded cutover SHA only through the approved administrative
recovery procedure. Never treat the branch as release authority.

## Break-glass suspension and forward recovery

There is no normal Abort operation. Before the stable tag is pushed, an
authorized maintainer may use documented manual break-glass cleanup only when
the entire release cycle is genuinely suspended rather than rejected for a
fix. The procedure must:

1. disable real v3 dispatches and record authorization plus suspension reason;
2. preserve source/candidate SHAs, Deployment status history, attestations,
   artifacts, and logs for audit;
3. prove `v${version}` and every npm package version are absent;
4. append `rejected` for any still-active candidate and never merge it;
5. merge a reviewed replacement `VERSION` PR if required;
6. remove only the recorded temporary ruleset through the idempotent manual
   recovery procedure;
7. verify permanent protections and the fixed `v3-development` cutover SHA;
   and
8. release the `main` freeze.

Do not package this path as a routine Abort workflow. Normal candidate problems,
including artifact expiration, use explicit Reject + fix if needed + Recreate.

After the stable tag or any npm publication, the version is consumed: retain
the tag, never reuse the version, and finish exact-artifact publication only
when safe. Do not advance `main` until publication is complete and the
candidate remains approved. If a defect is found before Step 3, leave
production `main/dist` unchanged and prepare a new forward version and
candidate instead of promoting the defective commit.

After Step 3 advances `main`, never reset or force `main` back to an older
distribution. MPServer or production websites may already have fetched the new
bundle. Rollback is a reviewed forward patch with a new `VERSION`, candidate,
playground approval, checksums, tag, publication, and atomic Step 3. Verify the
corrected bundle through MPServer's existing refresh and served-bundle
validation behavior; do not reset `main` or add an ad hoc purge.

`v3-development` remains fixed at its cutover SHA throughout suspension and
forward recovery.

## Hotfix policy

v3 hotfixes follow the same trunk path as normal changes:

1. branch from `main`;
2. open and merge a reviewed fix PR to `main`;
3. dispatch the release-intent workflow with `patch` and merge its reviewed
   `VERSION`-only PR;
4. generate and approve a new candidate on `v3-staging`; and
5. run exact-artifact publication, optional Step 2, and required Step 3.

Do not patch `v3-staging` or a release-order branch directly. If a regression
appears during phased rollout, stop promotion, fix forward through `main`, and
restart with a new version.

The v2 hotfix policy and release flow are unchanged.

## Decisions finalized

No migration-blocking product decisions remain:

- Semantic-release is removed from the target v3 process.
- A workflow accepts patch/minor/major input, validates current VERSION/tag/npm
  state, and generates the reviewed `VERSION`-only PR that is the sole release
  intent.
- Generated manifests, locks, changelog, and `dist` are produced in the
  candidate commit, not the release-intent PR.
- The MPServer JavaScript service is the confirmed delivery owner that pulls
  `main/dist` for production websites; Step 3 is a required production
  transition, not optional synchronization.
- Rokt playground approval is a hard pre-publication gate.
- The stable tag is created before exact-artifact npm publication; the GitHub
  Release is created after npm completeness succeeds.
- Tested tarballs and their checksum manifest are immutable GitHub Actions
  artifacts retained for 30 days, covered by GitHub artifact attestations, and
  never rebuilt after approval.
- Approval may remain pending for the full 30-day artifact lifetime, with
  remaining time visible. Expiration makes approval/publication ineligible and
  requires explicit rejection and recreation; `main` may remain frozen for the
  full duration.
- Lifecycle state uses append-only GitHub Deployment statuses:
    - `prepared -> awaiting_approval -> rejected`; or
    - `prepared -> awaiting_approval -> approved -> publishing -> published -> promoted`.
      Immutable manifest identity remains separate from status history.
- Playground approval uses a protected GitHub Environment, required reviewers,
  explicit rejection reasons, and GitHub's **Review deployments** UI.
- The main freeze uses an automation-controlled temporary ruleset with a
  reviewed release-fix bypass and reliable cleanup/unfreeze recovery.
- v3 initially retains the `staging-step-1.yml` workflow identity while
  cross-branch byte-parity is removed and v2/v3 contents diverge.
- Changelog generation uses the established organization-owned action pinned
  to an immutable version or SHA.
- `main` remains frozen from candidate cut through successful Step 3 and
  required MPServer served-bundle validation, potentially for the full 30-day
  artifact lifetime while approval is pending.
- No explicit CDN purge is currently required. Cache busting is deferred future
  work and is not a trunk-migration blocker.
- `v3-development` remains permanently fixed at its recorded cutover commit,
  with no PR, candidate, release, mirror, or synchronization authority; its
  consumers migrate before cutover.
- The stable tag is created before npm and becomes immutable recovery authority;
  the GitHub Release follows only after the full npm audit.
- There is no normal Abort workflow. Reject + fix + Recreate is standard, with
  manual break-glass cleanup reserved for genuinely suspended cycles and
  ruleset recovery.
- Release-order promotions remain optional; operational guidance recommends
  A → B → C with observation between stages.
- Future canary work may replace release-order branches only.

## Implementation details to record before cutover

No migration-blocking architecture decisions remain. The implementation PR
must record these concrete configuration values for audit:

- the protected environment name and required reviewer users/teams;
- the temporary ruleset template, bypass actor IDs, and manual recovery owners;
- the immutable `generate-changelog` action version or commit SHA;
- the existing npm trusted-publisher inventory for core and every kit;
- the GitHub Actions artifact names and explicit 30-day retention setting;
- the GitHub Deployment environment and append-only status metadata;
- the GitHub artifact-attestation identities and verification command;
- production bundle URLs and expected checksums used for post-Step 3
  validation; and
- MPServer JavaScript ownership, existing refresh behavior, and the success
  check proving it serves the approved bundle.
