# V3 release-control integration contract

Stable top-level dispatchers authenticate events and exact refs before calling
the reusable implementations. V3 Steps 1–3 additionally require repository
variable `V3_RELEASE_ACTIVATED=true`; v2 does not read that variable.

## Release intent and cycle

The intent caller supplies an authenticated full `main` SHA and one of `patch`,
`minor`, or `major`. The reusable workflow creates a deterministic branch from
exactly that SHA, changes only top-level `VERSION`, uses a create-only
force-with-lease, and opens a PR carrying the `v3-release-intent` label plus a
machine-readable body marker. A retry authenticates and reuses only the exact
branch, commit parent, VERSION patch, and open PR identity. Labels and body
markers are supporting hints rather than authority.

After GitHub reports that exact PR merged, the merge/push caller supplies the
merged `main` SHA and PR number to the cycle workflow. It reloads the PR and
changed files and commit objects through fully paginated authenticated GitHub
APIs, proves the automation-authored PR was an exact supported VERSION bump,
authenticates base ancestry plus base/head/result trees and VERSION blobs, and
accepts the repository's one-parent squash result (or a safely authenticated
two-parent merge) without requiring the PR head to be a result parent. It then creates one
deterministic `v3-release-cycle`
deployment. Creation is idempotent for the same source/version and fails closed
for a different active cycle or duplicate deterministic records.

Repository ruleset activation is external. The dispatcher must arrange that
the durable cycle becomes a required freeze check before another merge can
complete. A failure to create or enforce that rule must block release
activation.

## Freeze and release fixes

During an active cycle, ordinary PRs targeting `main` fail the reusable freeze
check. A release fix is accepted only when all of these are true:

-   authenticated API data matches the caller's exact base and head SHAs;
-   the body contains `<!-- mparticle-v3-release-fix:schema=1 -->`;
-   the PR has the `v3-release-fix` label;
-   an approval applies to the exact current head SHA;
-   `VERSION` is unchanged; and
-   every changed path is in `src/**`, `test/**`, `kits/*/src/**`,
    `kits/*/test/**`, or `kits/*/tests/**`.

Both sides of a rename are checked. The authenticated recursive base and head
Git trees must contain the expected changed entries as regular blobs with mode
`100644` or `100755`; copied paths, symlinks, gitlinks, trees, missing entries,
unsafe renames, and truncated trees fail closed.

`VERSION`, every `dist` tree, `.release/**`, release scripts, workflows,
package manifests, and lockfiles are denied even if a broad allowlist would
otherwise match. Permanent protections and normal required reviews/checks stay
enabled. After an accepted release-fix merge, the source-update
workflow may append an authenticated ordered source transition to the durable
cycle. It proves the exact PR, approval, unchanged VERSION, old source parent,
new protected-main squash/merge result, actor/run/workflow identity, and that
every prior candidate for the cycle is terminally rejected. Step 1 and later
promotion reconstruct and require this latest effective source.

## Explicit rejection fallback

The candidate lifecycle CLI supports:

```text
node scripts/release/lifecycle-record.js reject \
  --deployment <authenticated-deployment.json> \
  --statuses <authenticated-statuses.json> \
  --repository <owner/repo> \
  --candidate-sha <full-sha> \
  --cycle-deployment-id <cycle-deployment-id> \
  --cycle-id <cycle-id> \
  --manifest <authenticated-candidate-manifest.json> \
  --manifest-sha256 <digest> \
  --version <stable-version> \
  --actor <github-login> \
  --run-id <observer-run-id> \
  --reason <non-sensitive-reason>
```

GitHub's public Actions and Deployments APIs do not expose sufficiently reliable
environment-denial evidence containing both the denying actor and supplied
reason. The implementation therefore does not infer rejection from a generic
cancelled or failed Step 1 run and does not install a `workflow_run` observer.
An authorized operator must run `v3-release-reject.yml` from protected `main`,
supplying the exact lifecycle deployment ID, version, and a non-sensitive
reason. The dispatcher authenticates the caller, Step 1 run, deployment payload,
candidate manifest, tag absence, and npm absence before invoking this command.
It records actor, run identity, and reason in an append-only terminal status and
is idempotent only for an exact replay.
The durable lifecycle is exactly `prepared -> awaiting_approval -> approved ->
publishing -> published -> promoted`. `awaiting_approval` is recorded
immediately before the protected environment gate, `approved` immediately
after it opens, and `publishing` immediately before stable-tag/npm operations.
Stable-tag existence remains an immutable recovery fact, not a lifecycle state.
The corresponding GitHub Deployment states are `queued -> pending -> success ->
in_progress -> success -> success`. In particular, `approved` is `success`;
the subsequent `publishing` transition back to `in_progress` is appended with
`auto_inactive:false`, as are all lifecycle transitions.

Fresh candidate creation is authorized only when the exact active cycle has no
candidate deployments, or every prior candidate has a valid ordered lifecycle
ending in explicit `rejected`. Step 1 performs this authenticated check before
building and repeats it immediately before the leased staging push. Recovery is
not candidate recreation and may resume only its exact recorded lifecycle
deployment under the existing recovery-state rules.

Rejection is allowed only from the exact `awaiting_approval` state, after
authenticated checks show that neither the stable tag nor any package version
has been published. Approval, tagging, publication, promotion, and rejection
after that point fail closed.

Rejecting only in the environment review UI does not currently create the
durable terminal lifecycle record. The reviewer must also run the explicit
rejection workflow before any retry. Publication re-reads lifecycle state
immediately before tagging, and rejection shares immutable-version concurrency
with Step 1 publication and Steps 2–3.

The `v3` name identifies the release-control topology, not a semver major.
Stable patch, minor, and major versions remain supported, including `4.0.0`
with stable tag `v4.0.0` while the `v3-*` branches and environments remain in
use.

## Completion

Step 3 first performs atomic promotion, then validates the exact served
artifact, then appends candidate `promoted`, and only then marks the bound cycle
`completed`. The cycle status is the durable freeze authority. Actual temporary
ruleset removal requires private/admin repository configuration and must happen
only after observing this completion; inability to remove it must not weaken or
silently disable permanent protections.

Repository rulesets and required checks, protected environment reviewers, the
private downstream validator secrets, trusted-publisher registration, and a
disposable live npm OIDC/provenance smoke test remain external activation
prerequisites. Only after those are verified may an administrator set
`V3_RELEASE_ACTIVATED=true`. Freeze/ruleset removal remains an authenticated
external operation after the durable cycle reaches `completed`.
