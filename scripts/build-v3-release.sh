#!/usr/bin/env sh
# Builds the core bundles and every publishable kit for a V3 release at
# VERSION. Shared by scripts/release.sh and the V3 candidate packaging CI
# check so both build exactly the same way. It does not commit anything.
set -eu

VERSION=${1:-}
if [ -z "$VERSION" ]; then
    echo "Error: VERSION argument required. Usage: ./scripts/build-v3-release.sh <version>" >&2
    exit 1
fi

KIT_BUILD_CONCURRENCY=${KIT_BUILD_CONCURRENCY:-6}
case "$KIT_BUILD_CONCURRENCY" in
    [1-9] | [1-9][0-9] | [1-9][0-9][0-9]) ;;
    *)
        echo "Error: KIT_BUILD_CONCURRENCY must be a whole number from 1 to 999, not '$KIT_BUILD_CONCURRENCY'" >&2
        exit 1
        ;;
esac

BUILD_PATHS_FILE=
KIT_LOG_DIR=
RUNNING_PIDS=

cleanup() {
    for PID in $RUNNING_PIDS; do
        kill "$PID" 2>/dev/null || :
    done
    if [ -n "$BUILD_PATHS_FILE" ]; then
        rm -f "$BUILD_PATHS_FILE"
    fi
    if [ -n "$KIT_LOG_DIR" ]; then
        rm -rf "$KIT_LOG_DIR"
    fi
}

# A shell runs a trap only once its foreground command ends, so npm runs in
# the background and the kit's trap can stop it at once.
run_kit_step() {
    "$@" 3>&- &
    STEP_PID=$!
    wait "$STEP_PID"
    STEP_PID=
}

build_kit() {
    STEP_PID=
    trap 'if [ -n "$STEP_PID" ]; then kill "$STEP_PID" 2>/dev/null || :; fi; exit 143' 15
    KIT_START=$(date +%s)
    echo "$1: npm ci" >&3
    echo "Installing dependencies for $1"
    run_kit_step npm ci --prefix "$1"
    rm -rf "$1/dist"
    echo "$1: build" >&3
    echo "Building $1"
    run_kit_step npm run build --prefix "$1"
    KIT_END=$(date +%s)
    echo "Built $1 in $(($KIT_END - $KIT_START))s"
}

# POSIX sh has no wait -n, so this waits for the oldest kit, which keeps the
# logs in inventory order.
finish_oldest_kit() {
    set -- $RUNNING_PIDS
    KITS_FINISHED=$(($KITS_FINISHED + 1))
    KIT_STATUS=0
    wait "$1" || KIT_STATUS=$?
    shift
    RUNNING_PIDS=$*
    RUNNING_COUNT=$(($RUNNING_COUNT - 1))
    FINISHED_PATH=$(cat "$KIT_LOG_DIR/$KITS_FINISHED.path")
    KIT_TITLE="Kit $FINISHED_PATH"
    if [ "$KIT_STATUS" -ne 0 ]; then
        KIT_TITLE="$KIT_TITLE failed (exit $KIT_STATUS)"
        FAILED_KITS="$FAILED_KITS $KITS_FINISHED"
        FAILED_COUNT=$(($FAILED_COUNT + 1))
    fi
    if [ "${GITHUB_ACTIONS:-}" = true ]; then
        echo "::group::$KIT_TITLE"
    else
        echo "---------- $KIT_TITLE ----------"
    fi
    cat "$KIT_LOG_DIR/$KITS_FINISHED.log"
    if [ "${GITHUB_ACTIONS:-}" = true ]; then
        echo '::endgroup::'
    fi
}

echo '---------- Begin validate kit release inventory ----------'
trap cleanup 0
trap 'exit 1' 1 2 15
BUILD_PATHS_FILE=$(mktemp)
KIT_LOG_DIR=$(mktemp -d)
node -e "
        const {
            loadReleaseInventory,
            serializeBuildPaths,
        } = require('./scripts/prepare-kit-release');
        const inventory = loadReleaseInventory();
        process.stdout.write(serializeBuildPaths(inventory.buildPaths));
    " > "$BUILD_PATHS_FILE"

echo '---------- Begin generate latest core bundle ----------'
rm -rf dist
npm run build

echo '---------- Begin update kit versions ----------'
node scripts/prepare-kit-release.js "$VERSION"

echo '---------- Begin generate kit bundles ----------'
# The step markers go to this saved stdout, so a kit's last step still shows
# if a kill or a runner timeout ends the job before its log prints.
exec 3>&1
KIT_LOOP_START=$(date +%s)
KIT_COUNT=0
KITS_FINISHED=0
RUNNING_COUNT=0
FAILED_KITS=
FAILED_COUNT=0
while IFS= read -r KIT_PATH; do
    [ -n "$KIT_PATH" ] || continue
    if [ "$RUNNING_COUNT" -ge "$KIT_BUILD_CONCURRENCY" ]; then
        finish_oldest_kit
    fi
    KIT_COUNT=$(($KIT_COUNT + 1))
    printf '%s\n' "$KIT_PATH" > "$KIT_LOG_DIR/$KIT_COUNT.path"
    echo "Starting $KIT_PATH"
    build_kit "$KIT_PATH" < /dev/null > "$KIT_LOG_DIR/$KIT_COUNT.log" 2>&1 &
    RUNNING_PIDS="$RUNNING_PIDS $!"
    RUNNING_COUNT=$(($RUNNING_COUNT + 1))
done < "$BUILD_PATHS_FILE"
while [ "$RUNNING_COUNT" -gt 0 ]; do
    finish_oldest_kit
done
KIT_LOOP_END=$(date +%s)
KIT_LOOP_SECONDS=$(($KIT_LOOP_END - $KIT_LOOP_START))

if [ "$FAILED_COUNT" -eq 0 ]; then
    echo "Kit bundles built in ${KIT_LOOP_SECONDS}s ($KIT_COUNT kits, concurrency $KIT_BUILD_CONCURRENCY)"
    exit 0
fi

# Every failed kit's log again, outside any group, so it shows in the log.
echo "Kit bundles failed in ${KIT_LOOP_SECONDS}s ($FAILED_COUNT of $KIT_COUNT kits failed, concurrency $KIT_BUILD_CONCURRENCY)"
FAILED_PATHS=
for INDEX in $FAILED_KITS; do
    FAILED_PATH=$(cat "$KIT_LOG_DIR/$INDEX.path")
    FAILED_PATHS="$FAILED_PATHS $FAILED_PATH"
    if [ "${GITHUB_ACTIONS:-}" = true ]; then
        echo "::error title=Kit build failed::$FAILED_PATH failed; its log follows."
    fi
    echo "---------- Failed kit $FAILED_PATH ----------"
    cat "$KIT_LOG_DIR/$INDEX.log"
done
echo "Error: these kits failed to build:$FAILED_PATHS" >&2
exit 1
