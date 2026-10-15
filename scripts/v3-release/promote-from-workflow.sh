#!/usr/bin/env bash
# Maps the shadow pointer job's plan onto the promoter for one pod.
# Inputs arrive as environment variables (never interpolated into the script):
#   OPERATION        stage | promote-release-order | promote-ga | rollback |
#                    rollback-all | show | status
#   CHANNEL          target channel for promote-release-order, rollback and show
#   RELEASE_VERSION  V3 version (ignored by show; for status, the version every
#                    channel must serve, if set)
#   BUILD_ID         build ID; required by stage; rollback looks it up in the
#                    release index when empty; an optional check otherwise
#   EXPECTED_METADATA_SHA256  optional metadata.json SHA-256 the candidate must have
#   REQUIRE_BRANCH_TIPS  optional comma-separated branches that must point at the
#                    candidate's source commit immediately before each write
#   ALLOW_DOWNGRADE  true to let rollback and rollback-all move a channel to an
#                    older release
#   ALLOW_REBUILD    true to replace a channel's build of the same version
#   ALLOW_UPGRADE    true to let rollback move a channel to a newer release
#   WAIT_FOR_STAGING_SECONDS  optional; promote-release-order and promote-ga
#                    wait for v3-staging to serve RELEASE_VERSION, at most this
#                    long in total across every pod the job processes
#   DRY_RUN          true to verify without writing (ignored by show and status)
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
        set -- rollback --channel "$CHANNEL" --version "$RELEASE_VERSION"
        ;;
    rollback-all)
        set -- rollback-all --version "$RELEASE_VERSION"
        ;;
    show)
        set -- show --channel "$CHANNEL"
        ;;
    status)
        # Checks only the reader's required files, so verifying up to five
        # candidates per pod stays well inside the pod's credentials.
        set -- status --verify required
        if [ -n "$RELEASE_VERSION" ]; then
            set -- "$@" --version "$RELEASE_VERSION"
        fi
        ;;
    *)
        echo 'Unknown operation.'
        exit 1
        ;;
esac
if [ -n "$BUILD_ID" ]; then
    case "$OPERATION" in
        promote-release-order | promote-ga | rollback | rollback-all | status) set -- "$@" --build-id "$BUILD_ID" ;;
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
if [ -n "${WAIT_FOR_STAGING_SECONDS:-}" ]; then
    case "$OPERATION" in
        promote-release-order | promote-ga)
            # Pods run in turn in one job, so they share one deadline; the
            # first pod sets it.
            DEADLINE_FILE="$RUNNER_TEMP/v3-staging-wait-deadline"
            if [ ! -s "$DEADLINE_FILE" ]; then
                echo "$(($(date +%s) + WAIT_FOR_STAGING_SECONDS))" > "$DEADLINE_FILE"
            fi
            REMAINING="$(($(cat "$DEADLINE_FILE") - $(date +%s)))"
            if [ "$REMAINING" -gt 0 ]; then
                set -- "$@" --wait-for-staging "$REMAINING"
            fi
            ;;
    esac
fi
if [ "${ALLOW_DOWNGRADE:-false}" = 'true' ]; then
    set -- "$@" --allow-downgrade
fi
if [ "${ALLOW_REBUILD:-false}" = 'true' ]; then
    set -- "$@" --allow-rebuild
fi
if [ "${ALLOW_UPGRADE:-false}" = 'true' ]; then
    set -- "$@" --allow-upgrade
fi
if [ "$DRY_RUN" = 'true' ] && [ "$OPERATION" != 'show' ] && [ "$OPERATION" != 'status' ]; then
    set -- "$@" --dry-run
fi

exec node --experimental-strip-types scripts/v3-release/promote-v3-release.ts \
    "$@" --pod "$POD" --progress-file "$RUNNER_TEMP/v3-release-progress.jsonl"
