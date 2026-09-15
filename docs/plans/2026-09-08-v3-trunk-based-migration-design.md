# Web SDK v3 Trunk-Based Migration Design

## 1. Summary and scope

The Web SDK has two independent major-version release tracks in one repository.
This design changes only v3:

- v2 continues to use `master`, `development`, `staging`, and the unprefixed
`release-order-a/b/c` branches. Its versioning, semantic-release process, and npm behavior remain unchanged.
- v3 moves all development to `main`. It uses `v3-staging` for one generated,
testable release candidate and retains `v3-release-order-a/b/c` until canary delivery replaces them. `v3-development` is deprecated.

The target v3 process replaces semantic-release with an explicit, top-level
`VERSION` file and an exact-artifact release lifecycle. It freezes an exact
`main` commit, generates and tests core plus every publishable kit once, obtains
playground approval for that exact candidate, and publishes the same packed
artifacts without rebuilding.

### Goals

- Make `main` the sole v3 product-development trunk.
- Express v3 release intent through a reviewed `VERSION`-only PR.
- Keep unapproved generated files away from `main`.
- Make `v3-staging` the exact Rokt playground testing surface.
- Publish the exact approved core and kit tarballs under npm tag `next`.
- Preserve phased v3 release-order delivery until canary delivery exists.
- Make production promotion atomic and independently verifiable.
- Replace every v3 responsibility currently supplied by semantic-release.



### Out of scope

- Any change to v2 branch mappings, versioning, npm tags, or release semantics.
- Canary delivery or removal of v3 release-order branches.
- Cache-busting design; it remains deferred work.
- Product development or direct fixes on `v3-staging`.
- Generated manifests, locks, changelog, or `dist` in the release-intent PR.
- Promotion of a rejected, pending, stale, or incompletely published candidate.



### Approaches considered


| Approach                                                                                                                                                       | Outcome                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Keep `v3-development` as the effective trunk and promote through `v3-staging`                                                                                  | Rejected. Retains semantic-release but splits development authority and diverges from trunk-based development.                          |
| Make `main` the sole trunk, generate one exact candidate on `v3-staging`, require approval before publication, then promote to release order branches and main | Selected. Establishes one development authority, keeps unapproved distributions off the production path, and publishes exact artifacts. |




## 2. Current and target topology



### Current topology

The unchanged v2 track uses:

- `development` as its integration branch;
- `staging` as its release staging branch;
- `master` as its release-tracking branch;
- `release/<run_number>` as an ephemeral release branch; and
- unprefixed `release-order-a/b/c` for phased rollout.

The legacy v3 flow is:

```text
feature PRs
    |
    v
v3-development -> v3-staging -> main
                       |
                       +-> v3-release-order-a/b/c
```

Shared Step 1–3 workflows currently select this mapping with `track=v3`.
Semantic-release chooses a version, updates release files, builds, tags,
publishes core and kits, and creates the GitHub Release. The legacy model makes
`v3-development` the effective product trunk and gives `v3-staging` both source
and testing responsibilities.

### Target topology

```text
short-lived branch --PR--> main
                              |
                    VERSION-only intent PR
                              |
                    freeze exact source_sha
                              |
                              v
              Step 1: one generated candidate commit
                         on v3-staging
                              |
                 protected-environment approval
                              |
                              v
                stable tag -> exact npm packs
                         -> GitHub Release
                              |
                 Step 2: optional one-branch
                         phased promotion
                              |
                 Step 3: required atomic full
                         production promotion
                              |
               main + v3-release-order-a/b/c
```

Branch responsibilities are:

- `main` is the sole v3 development trunk. Normal feature, fix, maintenance,
hotfix, and release-fix PRs target it.
- `v3-staging` contains exactly one generated candidate commit over the frozen
`main` source. It is the Rokt playground testing surface, never a development
branch or an independently authored release source.
- `v3-release-order-a/b/c` remain phased v3 delivery branches until canary
delivery replaces them.
- `v3-development` is fixed at its recorded cutover SHA. It is read-only and non-authoritative: no PR, workflow, mirror, candidate, release, or synchronization process may read from or advance it. Can be deleted at an agreed upon time after trunk based development is implemented.
- Legacy `v3-release/<run_number>` branches are retired.

Unprefixed release-order branches always belong to v2. v3 workflows must never interpret them as v3 destinations. In a future point in time, when v3 becomes the main branch, we can switch names so that v3 is the default.

### Production-delivery invariant

A downstream production delivery system consumes approved distribution
artifacts after Step 3. Therefore movement of `main` is a production transition,
not repository housekeeping.

Until Step 3, `main` and its generated distribution remain at the previous
approved release. Step 3 may advance `main` only to the exact approved
`candidate_sha`, and promotion is complete only after downstream validation
confirms the approved served artifact.

Concrete production endpoints, checksums, privileged environment configuration,
and operational procedures belong in an access-controlled operational
inventory. Public implementation records contain only non-sensitive invariants
and references to that inventory.

### Migration baseline

Before cutover:

1. Drain or retarget all in-flight v3 work to `main`.
2. Migrate every current-code consumer away from `v3-development`.
3. Record its cutover SHA and enforce permanent read-only protection.
4. Inventory core and kit package names, current release tags, trusted
  publishers, branch protections, and legacy release consumers.
5. Bootstrap top-level `VERSION` to the latest stable v3 version.
6. Remove the cross-track workflow parity guard at cutover while preserving
  the existing v2 files and behavior on their refs.



## 3. Release lifecycle



### Definitions



#### Release intent

Top-level `VERSION` is authoritative only for v3. A release-intent workflow:

1. runs from the exact protected `main` commit selected by the maintainer;
2. reads and validates `VERSION` as stable semver;
3. accepts exactly one of `patch`, `minor`, or `major`;
4. computes the target version;
5. rejects a new intent while another v3 release cycle is active; and
6. opens a reviewed PR that changes only `VERSION`.

The preferred title and squash commit are:

```text
chore(release): set version to 3.0.2
```

The intent workflow does not perform authoritative tag, npm, package-inventory,
or recovery validation. Those potentially slow and race-sensitive checks occur
under the Step 1 release lock. Intent may show advisory warnings, but they are
not correctness gates.

Merging the intent PR creates no build, candidate, changelog, tag, package,
GitHub Release, or `dist` change. It begins the `main` merge freeze. Normal PRs
may continue through review but may not merge; a reviewed, narrowly scoped
release-fix PR is the only exception. The freeze ends only after successful
Step 3 and downstream served-artifact validation.

#### Artifact identity

Each candidate records immutable identity:

- `version`: validated top-level `VERSION`;
- `source_sha`: the frozen `main` commit;
- `candidate_sha`: the one generated commit whose first parent is `source_sha`;
- artifact ID and artifact subject digests;
- `artifact_manifest_sha256`: digest of the signed inventory; and
- after tagging, `release_tag`: `v${version}` resolving to `candidate_sha`.

The inventory links version, source SHA, candidate SHA, package names, versions,
tarball filenames, SHA-256 digests, sizes, build-tool versions, and the
release-notes digest. It is attested or signed so that this linkage is
verifiable.

A GitHub attestation proves one narrow thing: a file with a given SHA-256 was
produced by a specific workflow run in this repository. It says nothing about
what that file claims to be.

The inventory supplies that missing meaning, so it is attested or signed too.
Verification then covers both halves:

- the tarball digests prove the files are the ones Step 1 built; and
- the inventory digest proves nobody altered which version, commit, or package
those files belong to.

Recorded identity is read back from the release record and never re-derived
from a branch tip, because a branch can move. Identity is fixed for the life of
the candidate; lifecycle status is a separate append-only history.

#### Lifecycle states

Logical lifecycle state is append-only:

```text
prepared -> awaiting_approval -> rejected
                            \-> approved -> publishing -> published -> promoted
```

`rejected` is terminal for that candidate. Recreation produces a new candidate,
artifact identity, deployment, and status history, even when the unpublished
version is unchanged.

GitHub Deployment status values map to the logical labels:

- `prepared=queued`;
- `awaiting_approval=pending`;
- `rejected=failure`;
- `approved=success`;
- `publishing=in_progress`;
- `published=success`; and
- `promoted=success`.

Descriptions and release metadata carry the logical label and immutable
identity. Repeated API values do not overwrite earlier status records.

The Step 1 workflow completes at `published`. The overall release lifecycle
completes only at `promoted`, after required Step 3 and downstream validation.

#### Approval and expiration

The exact candidate publication job uses one protected GitHub Environment.
That environment is both:

- the playground approval gate for the named version and full candidate SHA;
and
- the npm-authorized publication environment.

This is one approval gate, not two independent approvals unless a future
security requirement explicitly adds another. Approval merely resumes the same
waiting Step 1 job. Approval itself creates no commit, branch movement, tag,
package, or GitHub Release; resumed automation performs and records subsequent
mutations.

The deployment name includes the exact version and full SHA:

```text
Review v3.0.2 candidate a1b2c3d4e5f678901234567890abcdef12345678
```

Reviewers approve or explicitly reject through GitHub's deployment review.
Rejection includes a reason and closes the candidate so controlled recreation
can proceed.

Candidate artifacts are retained for 30 days. The job displays creation,
expiration, and remaining-lifetime information and may wait for that full
period. Expiration makes approval and publication ineligible and cannot be
overridden by late approval. An expired candidate is explicitly rejected and
recreated; its artifact set and approval are never reused.

### Step 1: prepare, approve, and publish

For both tracks, `.github/workflows/staging-step-1.yml` remains the small,
stable, npm-registered top-level caller. It declares static v2 and v3 reusable
workflow jobs with mutually exclusive `if` conditions because
`jobs.<id>.uses` cannot be dynamic. Same-repository relative calls resolve from
the caller commit.

The v2 and v3 reusable workflows may differ and need not have byte parity. v2
continues its existing behavior. The selected v3 workflow implements the
following locked lifecycle without semantic-release.

#### Candidate preparation

1. Require `refs/heads/main` and acquire one non-cancelling v3 release lock.
2. Freeze `source_sha`; read and validate `VERSION`.
3. Authoritatively inventory the stable baseline tag and every publishable core
  and kit package.
4. Reject conflicts with lifecycle state, an existing target tag, or any target
  npm package version.
5. Record the expected old `v3-staging` SHA and perform only a
  force-with-lease update. Plain force is forbidden.
6. In a clean worktree at `source_sha`:
  - remove prior generated outputs;
  - synchronize root and kit manifests and lockfiles to `VERSION`;
  - generate changelog and release notes;
  - build all core and kit distributions;
  - run lint, core, Jest, stub, integration, and all kit tests;
  - pack core and every publishable kit exactly once; and
  - generate the artifact inventory.
7. Upload tarballs, inventory, and release notes as immutable Actions artifacts
  with `retention-days: 30`.
8. Generate standard artifact attestations for artifact subject digests and
  workflow provenance, and sign or attest the inventory digest.
9. Create exactly one generated commit over `source_sha`, for example:
  ```text
   chore(build): generate 3.0.2 candidate artifacts
  ```
   It contains synchronized manifests and locks, changelog, generated `dist`,
   and inventory, but no product-source edits or tarballs.
10. Push that commit to `v3-staging` with a lease.
11. Revalidate artifact subjects against the inventory linkage, append
  `prepared`, then enter `awaiting_approval`.

Candidate preparation creates no stable tag, npm package, or GitHub Release.
`v3-staging` must equal `candidate_sha` before playground testing or approval.

#### Changelog generation

Step 1 uses
`[ROKT/rokt-workflows/actions/generate-changelog](https://github.com/ROKT/rokt-workflows/tree/c5c93e92107c520fb8b8cf71070995abdf4c403f/actions/generate-changelog)`
pinned to reviewed immutable SHA
`c5c93e92107c520fb8b8cf71070995abdf4c403f`.

It runs from a full-history checkout detached at `source_sha`, with the reviewed
version, repository URL, `v` prefix, changelog path, commit exclusions, and kits
path. Step 1 verifies that the action-selected prior stable tag is the recorded
baseline and that the generated range ends at `source_sha`.

If repository tag topology cannot represent that exact range, extend the shared
action with explicit endpoints, review the extension, and pin its resulting
immutable SHA. Use a local fallback only if the shared action cannot be
extended, and document the incompatibility.

Both the updated `CHANGELOG.md` and release-notes output are frozen into
candidate identity; publication never regenerates them.

#### Approval and resumed publication

The same selected v3 Step 1 job waits at the protected environment. Playground
approval resumes that job with its recorded candidate and artifacts.

Before any irreversible mutation, resumed automation revalidates:

- the `main` freeze and release lock;
- `main == source_sha`;
- `v3-staging == candidate_sha`;
- first-parent ancestry and generated-path allowlist;
- exact approved lifecycle evidence with no rejection;
- the unexpired artifact ID and subject digests;
- the signed or attested inventory linkage;
- every tarball name, package name, version, digest, and size; and
- absence of target tag and package versions for first publication.

Any mismatch fails closed without tagging or publishing.

The publication order is:

1. Append `publishing`.
2. Create and push annotated stable tag `v${version}` at `candidate_sha`.
3. Publish the exact core and kit tarballs in the documented order with
  `--tag next --provenance`.
4. Audit all core and kit versions, registry integrity, provenance, and `next`
  dist-tags after propagation.
5. Create the GitHub Release from the existing stable tag, attaching the
  inventory and appropriate release assets.
6. Append `published` and expose the exact tag and candidate identity to Steps
  2 and 3.

The stable tag is the irreversible authority and is created before npm. It is
never deleted, moved, or reused. Publication never rebuilds, repacks, changes
the inventory, or regenerates release notes.

npm trusted publishing validates the top-level caller filename
`staging-step-1.yml`; byte parity between branch workflow files is not required.
The child reusable workflow filename or branch is not an npm authorization
boundary.

The caller validates track, ref, and SHAs. Branch and protected-environment
controls enforce authorization. `id-token: write` flows only through the
selected reusable-workflow job and its publishing job. Other jobs remain
least-privileged, and broad `secrets: inherit` is prohibited.

### Step 2: optional phased promotion

After Step 1 reaches `published`, Step 2 may fast-forward one selected
`v3-release-order-a/b/c` branch to the exact stable tag. It:

- proves the tag resolves to approved `candidate_sha`;
- verifies version, inventory, npm completeness, and branch expected SHA;
- requires a fast-forward update; and
- advances exactly one v3-prefixed release-order branch.

Step 2 is optional. A → B → C with observation is recommended but not enforced.
Skipping or failing Step 2 does not waive Step 3. Manual pushes, including
pre-approval pushes, are prohibited. Step 2 never updates `main`, publishes npm,
or needs OIDC permission.

### Step 3: required full promotion

Step 3 consumes the same published stable tag. It:

1. verifies tag, candidate, version, inventory, complete npm publication, and
  GitHub Release;
2. verifies `main` still equals `source_sha`;
3. verifies all v3 release-order branches equal recorded expected SHAs;
4. proves every destination can fast-forward; and
5. advances `main` plus all `v3-release-order-a/b/c` branches to
  `candidate_sha`.

All four destinations update or none do. `v3-development` is excluded.
`v3-staging` already equals the candidate and is not another destination.
Step 3 does not publish npm and needs no OIDC permission.

After the push, downstream validation confirms the approved served artifact. Only then does automation append `promoted` and end the merge freeze.
Cache busting remains deferred and is not part of this design.

## 4. Safety invariants

Each invariant below must hold at all times, and each is covered by the Phase C
contract tests. Step ordering, lifecycle vocabulary, and scope are defined
elsewhere and are deliberately not restated here.

1. The downstream production delivery system consumes only the approved
  distribution, and only after successful Step 3. Every other invariant exists
  to protect this one.
2. v2 is unchanged: its branches, versioning mechanism, semantic-release
  process, npm tag `latest`, and release workflow. v3 alone uses top-level
  `VERSION` and npm tag `next`.
3. `main` is the sole v3 development and release-intent authority.
4. `v3-development` remains fixed, read-only, and non-authoritative.
5. `v3-staging` is exactly one generated commit whose first parent is the
  frozen `main` source.
6. Core and every publishable kit form one versioned, built, published, and
  audited logical release.
7. Workflows act only on recorded full SHAs and never treat a moving ref as
  identity.
8. Candidate artifacts are built and packed once and are never substituted
  after approval.
9. Approval applies to one exact candidate. Approval scoped to a branch,
  version string, or superseded candidate is invalid, and a rejected candidate
  can never be revived by a later approval.
10. The stable tag precedes npm publication and is irreversible release
  authority. Partial publication resumes only missing, byte-identical
  artifacts.
11. The freeze lasts from merged intent PR through Step 3 and downstream
  validation. A reviewed release-fix PR is its only exception.
12. Promotion updates `main` and all v3 release-order branches atomically.



### Branch protection and concurrency

- `main` requires PRs, review, configured ownership, and required checks;
deletion and force-push are blocked.
- A required path-policy check rejects `dist/**` changes from normal,
release-intent, and release-fix PRs. Only Step 3 promotion may update them.
- The temporary release ruleset blocks normal merges and direct pushes without
weakening permanent protections.
- A release-fix still requires normal review and checks and uses only the
narrowly configured automation path.
- `v3-staging` blocks human direct pushes, deletion, and general force-push.
Candidate automation may perform only expected-SHA force-with-lease updates.
- v3 release-order branches block human direct and force pushes.
- `v3-development` blocks all updates, deletion, and force-push.
- One durable, non-cancelling lock prevents concurrent v3 cycles.
- Remote SHAs are rechecked immediately before every push. Lease or
fast-forward failure is a safe stop, never a reason to force.

Privileged reviewer identities, actor IDs, environment names, environment
configuration, recovery ownership, and production validation details are
maintained only in the access-controlled operational inventory.

## 5. Failure and recovery



### Pre-tag rejection, fix, and recreation

Before the stable tag exists, a version remains unconsumed if no core or kit npm
package exists at that version.

For a playground rejection:

1. A reviewer explicitly selects **Reject**, supplies a reason, and automation
  appends `rejected` for the exact candidate.
2. Step 1 confirms no target stable tag or npm package exists.
3. The rejected SHA, artifacts, logs, and test evidence remain audit records,
  but the candidate is never merged or tagged.
4. Any fix lands through a reviewed release-fix PR on frozen `main`.
  `VERSION` remains unchanged and the PR cannot modify `dist`.
5. `Recreate candidate` resets staging from the exact rejected SHA to corrected
  `main` using:

   ```bash
   git push --force-with-lease=refs/heads/v3-staging:${rejected_candidate_sha} origin ${corrected_main_sha}:refs/heads/v3-staging
   ```

   This succeeds only if remote `v3-staging` still equals
   `rejected_candidate_sha`. Any mismatch fails closed; plain force is
   forbidden.
6. Step 1 regenerates clean artifacts at the same unpublished `VERSION`,
  producing a new candidate SHA, artifact ID, digests, and approval deployment.

Missing or expired pre-tag artifacts follow the same explicit
Reject → reviewed fix if needed → Recreate path. The rejected or expired
candidate and its approval are never reused. The `main` freeze remains active
throughout.

Immediately before tagging, Step 1 independently checks source SHA, staging
SHA, lifecycle history, approval evidence, expiration, artifact identity,
inventory linkage, and every tarball digest. Stale approval or any mismatch
cannot publish.

### Stable tag or partial publication

After stable tagging, the version is consumed even if npm is empty. The tag
remains fixed at `candidate_sha`; automation never deletes, moves, or reuses it
and never rebuilds that version.

If npm publication is absent, partial, or uncertain:

- stop newer releases and allow registry propagation;
- verify every existing package against the immutable inventory;
- resume only missing packages from the same exact artifacts;
- audit all core and kit packages before GitHub Release or promotion; and
- retry GitHub Release creation from the existing tag if npm is complete.

If the original exact artifacts cannot be restored, do not rebuild under the
consumed version. Preserve the tag and move to a new forward version.

Step 1 recovery may resume through the same stable top-level caller. Its
preflight requires the existing tag to resolve to `candidate_sha` and every
already published package to be byte-identical to inventory.

### Promotion failures

A failed Step 2 leaves `main` unchanged and may be retried against the same tag.

A failed Step 3 preflight performs no push. An atomic-push rejection leaves all
four destinations unchanged. Keep the freeze active, correct the blocking
condition, and retry against the same approved candidate.

If the atomic push succeeds but downstream validation fails, `main` has already
advanced. Keep the freeze active, diagnose and retry validation, and never
reset or force-push `main`.

If an unauthorized merge prevents fast-forward promotion, preserve both
histories. Do not force, move the tag, or reuse the version. Use a reviewed
reconciliation and a forward version when exact promotion is no longer safe.

### Forward recovery

If a defect is found after the stable tag but before Step 3, leave `main`
unchanged and prepare a new forward version instead of promoting the defective
candidate.

After Step 3, rollback is a reviewed forward patch:

1. branch from current `main`;
2. merge a reviewed fix PR;
3. create and merge a new patch release-intent PR;
4. generate and approve a new candidate;
5. publish exact artifacts under a new stable tag; and
6. run required Step 3 and downstream validation.

Never reset production history or patch staging or release-order branches
directly. v2 recovery and hotfix behavior remain unchanged.

## 6. Migration implementation



### Phase A: prepare

- Announce cutover and retarget all v3 development to `main`.
- Inventory and migrate every `v3-development` consumer.
- Record and protect the fixed `v3-development` cutover SHA.
- Bootstrap `VERSION` from the latest stable v3 tag and package inventory.
- Inventory core/kits, trusted-publisher registrations, branch consumers, and
current protections.
- Store privileged operational configuration in the access-controlled
inventory and reference it from public implementation records.
- Plan removal of cross-track parity checks without altering v2 behavior.



### Phase B: build automation

- Add the v3-only release-intent workflow and active-cycle detection.
- Refactor release scripts to synchronize versions, build, test, and pack
without intermediate release commits or publication.
- Integrate the pinned changelog action and validate its exact range.
- Implement immutable 30-day artifacts, standard subject/provenance
attestations, and signed or attested inventory linkage.
- Implement append-only lifecycle statuses and one exact-candidate protected
publication job.
- Keep `staging-step-1.yml` stable and declare static, mutually exclusive v2 and
v3 reusable-workflow jobs.
- Implement caller-side validation, branch/environment controls, and
least-privilege OIDC.
- Implement temporary freeze enforcement and idempotent cleanup after
downstream validation.
- Adapt Steps 2 and 3 to exact tag/candidate identity and remove
`v3-development` from all mappings.



### Phase C: contract verification



#### Intent and isolation contracts

- Verify patch, minor, and major calculations from exact protected `main`.
- Reject invalid semver and active-cycle conflicts.
- Prove the intent PR changes only `VERSION` and creates no release side effect.
- Run complete v2 regression validation and prove v2 uses no v3 `VERSION`.



#### Candidate and identity contracts

- Verify baseline/package inventory, stale-main, existing-version, staging
lease, ancestry, generated-path allowlist, build, and test failures stop
before tagging.
- Verify core plus all kits are packed once and match inventory.
- Verify subject/provenance attestations and inventory-digest linkage.
- Verify changelog range and both frozen outputs.
- Verify missing, altered, or expired artifacts fail closed.



#### Approval and lifecycle contracts

- Verify only the two defined lifecycle paths are accepted.
- Verify the exact candidate remains eligible for up to 30 days and becomes
ineligible at expiration.
- Verify approval itself causes no repository or registry mutation.
- Verify explicit rejection is terminal and records non-sensitive audit
evidence.
- Verify a stale rejected deployment cannot publish even if later approved.
- Verify same-version recreation uses the exact lease command and new identity.



#### Publication and authorization contracts

- Perform an authorized pre-migration test publication to validate actual npm
OIDC exchange and provenance; dry runs alone cannot prove this.
- Verify npm recognizes `staging-step-1.yml` as top-level caller for each
statically selected track workflow.
- Verify static conditions are mutually exclusive and relative child calls use
the caller commit.
- Verify only publication receives `id-token: write`, no broad
`secrets: inherit` is used, and Steps 2/3 receive no OIDC permission.
- Force partial publication and prove only missing exact artifacts resume.
- Verify stable tag immutability and that GitHub Release waits for full audit.



#### Promotion and protection contracts

- Verify rejected, failed, or partial publication cannot invoke promotion.
- Verify skipped or failed Step 2 does not affect `main` or waive Step 3.
- Verify every Step 3 preflight or atomic-push failure moves no destination.
- Verify successful Step 3 advances only the approved candidate and downstream
validation completes promotion.
- Verify normal and release-fix PRs cannot modify `dist/**`.
- Verify freeze cleanup occurs only after full completion and preserves
permanent protections.
- Verify `v3-development` cannot move and no workflow targets it.



### Phase D: controlled cutover

1. Land permanent protections, freeze controls, and replacement workflows.
2. Remove the cross-track parity guard while retaining unchanged v2 behavior.
3. Fix `v3-development` at its recorded cutover SHA.
4. Generate and merge the first `VERSION`-only intent PR.
5. Execute Step 1 through exact publication and `published`.
6. Optionally exercise Step 2.
7. Run required atomic Step 3 and downstream validation.
8. Confirm `promoted`, remove the temporary freeze, and audit final refs, tag,
  registry inventory, provenance, and GitHub Release.



## 7. Acceptance criteria

The migration is accepted when:

- v2 regression tests pass and its branch, versioning, semantic-release,
workflow, and npm behavior are unchanged.
- All normal v3 work targets `main`, and `v3-development` remains fixed and
non-authoritative.
- v3 release intent is a reviewed top-level `VERSION`-only change with no
release side effects.
- Locked Step 1 rejects conflicting Git, npm, package, artifact, and lifecycle
state before irreversible mutation.
- `v3-staging` contains exactly one generated candidate commit over frozen
`main`, and the playground reviews that exact candidate.
- Core and every kit are built, tested, packed once, and linked by a verifiable
inventory to authenticated artifact subjects and workflow provenance.
- One protected-environment approval resumes the exact publication job;
approval alone mutates nothing.
- Explicit rejection prevents publication, and same-version recreation is safe
only while the version remains unconsumed.
- Approved artifacts remain usable for at most 30 days; missing or expired
artifacts cannot publish.
- Stable tag creation precedes npm and fixes the authority for all recovery.
- npm receives only exact approved tarballs under `next`, and the GitHub Release
follows a complete core-and-kits audit.
- Step 1 ends at `published`; optional Step 2 advances at most one v3
release-order branch; required Step 3 atomically advances all final
destinations without publishing npm.
- Failed or incomplete work leaves `main` at the previous approved
distribution, except after a successful atomic Step 3 push.
- Downstream validation confirms the approved served artifact before
`promoted` is recorded and the freeze ends.
- Fixed-SHA, lease, branch-protection, lifecycle, and least-privilege contracts
pass the grouped verification suite.



## 8. Open implementation details

No migration-blocking architecture decisions remain. Implementation must settle
these non-sensitive details:

- exact workflow and job names for static v2/v3 dispatch;
- release-state storage schema and Deployment status metadata;
- inventory format, signature or attestation mechanism, and verification
command;
- generated-path allowlist and package publication order;
- freeze-ruleset lifecycle and idempotent cleanup implementation;
- changelog action extension, only if exact range validation requires it;
- test package/version strategy for real OIDC validation; and
- canary migration plan that eventually replaces v3 release-order branches.

Concrete reviewer identities, actor IDs, environment names and configuration,
production URLs or checksums, and recovery ownership are intentionally excluded
from public implementation PRs. They belong in an access-controlled operational
inventory; public records should state only the invariant and link to that
inventory.