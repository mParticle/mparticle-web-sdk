#!/usr/bin/env bash
# Maps the shadow pointer job's plan onto the promoter for one pod.
# Inputs arrive as environment variables (never interpolated into the script):
#   OPERATION        stage | promote-release-order | promote-ga | rollback | show
#   CHANNEL          target channel for promote-release-order, rollback and show
#   RELEASE_VERSION  V3 version (ignored by show)
#   BUILD_ID         build ID; required by stage and rollback, optional check otherwise
#   EXPECTED_METADATA_SHA256  optional metadata.json SHA-256 the candidate must have
#   REQUIRE_BRANCH_TIPS  optional comma-separated branches that must point at the
#                    candidate's source commit immediately before each write
#   ALLOW_DOWNGRADE  true to let rollback move a channel to an older release
#   ALLOW_REBUILD    true to replace a channel's build of the same version
#   DRY_RUN          true to verify without writing (ignored by show)
# Usage: promote-from-workflow.sh <pod>
set -euo pipefail

POD="$1"
case "$OPERATION" in
    stage)
        set -- stage --version "$RELEASE_VERSION" --build-id "$BUILD_ID"
        ;;
    promote-release-order)
        set -- promote --from v3-staging --to "$CHANNEL" \
            --version "$RELEASE_VERSION"
        ;;
    promote-ga)
        set -- promote-ga --version "$RELEASE_VERSION"
        ;;
    rollback)
        set -- rollback --channel "$CHANNEL" --version "$RELEASE_VERSION" \
            --build-id "$BUILD_ID"
        ;;
    show)
        set -- show --channel "$CHANNEL"
        ;;
    *)
        echo 'Unknown operation.'
        exit 1
        ;;
esac
if [ -n "$BUILD_ID" ]; then
    case "$OPERATION" in
        promote-release-order | promote-ga) set -- "$@" --build-id "$BUILD_ID" ;;
    esac
fi
if [ -n "${EXPECTED_METADATA_SHA256:-}" ]; then
    set -- "$@" --expected-metadata-sha256 "$EXPECTED_METADATA_SHA256"
fi
if [ -n "${REQUIRE_BRANCH_TIPS:-}" ]; then
    IFS=',' read -r -a TIP_BRANCHES <<< "$REQUIRE_BRANCH_TIPS"
    for BRANCH in "${TIP_BRANCHES[@]}"; do
        set -- "$@" --require-branch-tip "$BRANCH"
    done
fi
if [ "${ALLOW_DOWNGRADE:-false}" = 'true' ]; then
    set -- "$@" --allow-downgrade
fi
if [ "${ALLOW_REBUILD:-false}" = 'true' ]; then
    set -- "$@" --allow-rebuild
fi
if [ "$DRY_RUN" = 'true' ] && [ "$OPERATION" != 'show' ]; then
    set -- "$@" --dry-run
fi

exec node --experimental-strip-types scripts/v3-release/promote-v3-release.ts \
    "$@" --pod "$POD" --progress-file "$RUNNER_TEMP/v3-release-progress.jsonl"
