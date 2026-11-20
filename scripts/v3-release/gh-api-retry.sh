# Sourced by the V3 release workflows' bash steps; defines gh_api_retry.
#
# gh_api_retry ARGS... runs `gh api ARGS...` and prints its output only when
# the call succeeds, so a --paginate read that fails part way prints nothing
# and a pipe into jq never sees a partial or error reply.
#
# A transient failure is retried: a 5xx reply, or a network error with no HTTP
# reply at all (a dropped or refused connection, a timeout, a failed DNS or TLS
# handshake). Any other failure, a 4xx reply among them, fails on the first
# try. gh reports a reply's status in one of two forms and both are read:
# "gh: <message> (HTTP 502)" when the error body is JSON, and a bare
# "gh: HTTP 502" when it is not, as with an HTML error page from a proxy.
#
# The caller's own checks of the reply stay its own, so a reply that does not
# validate still fails at once.
#
# Settings (environment):
#   GH_API_ATTEMPTS       tries in all, default 4
#   GH_API_RETRY_SECONDS  wait before the first retry, doubled each time,
#                         default 5 (so 5s, 10s and 20s with the defaults)
#
# When it gives up it prints an ::error:: annotation naming the call and the
# tries made, and returns gh's exit status.

gh_api_retry() {
    local attempts="${GH_API_ATTEMPTS:-4}"
    local delay="${GH_API_RETRY_SECONDS:-5}"
    case "$attempts" in
        '' | *[!0-9]* | 0)
            echo '::error::GH_API_ATTEMPTS must be a positive integer.' >&2
            return 2
            ;;
    esac
    case "$delay" in
        '' | *[!0-9]*)
            echo '::error::GH_API_RETRY_SECONDS must be a whole number of seconds.' >&2
            return 2
            ;;
    esac

    local out err status reason attempt=1
    out="$(mktemp)"
    err="$(mktemp)"
    while :; do
        status=0
        gh api "$@" >"$out" 2>"$err" || status=$?
        if [ "$status" -eq 0 ]; then
            cat "$out"
            cat "$err" >&2
            rm -f "$out" "$err"
            return 0
        fi

        reason="$(tail -n 1 "$err")"
        if grep -Eq '\(HTTP 5[0-9]{2}\)|^gh: HTTP 5[0-9]{2}$' "$err"; then
            : # a server error: retry
        elif ! grep -Eq '\(HTTP [0-9]{3}\)|^gh: HTTP [0-9]{3}$' "$err" &&
            grep -Eiq 'error connecting to|dial tcp|connection (reset|refused)|i/o timeout|timeout awaiting|tls handshake|unexpected eof|no such host|network is unreachable|context deadline exceeded|client\.timeout exceeded' "$err"; then
            : # a network error with no HTTP reply: retry
        else
            echo "::error::gh api $* failed and is not retried: ${reason:-exit status ${status}}" >&2
            rm -f "$out" "$err"
            return "$status"
        fi

        if [ "$attempt" -ge "$attempts" ]; then
            echo "::error::gh api $* failed after ${attempts} attempts: ${reason:-exit status ${status}}" >&2
            rm -f "$out" "$err"
            return "$status"
        fi
        echo "gh api $* failed (attempt ${attempt} of ${attempts}): ${reason}; retrying in ${delay}s." >&2
        sleep "$delay"
        delay=$((delay * 2))
        attempt=$((attempt + 1))
    done
}
