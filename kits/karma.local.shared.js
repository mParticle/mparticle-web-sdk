'use strict';

// Local headless browser timeouts for kit Karma runs in CI.
// - captureTimeout: 120000 raises per-attempt browser capture from Karma's 60 s
//   default to 120 s (with Karma's default retryLimit: 2, up to 3 attempts /
//   ~6 minutes worst case if a browser never starts).
// - browserNoActivityTimeout: 120000 raises the no-activity window from Karma's
//   30 s default to 120 s so a fast browser (such as FirefoxHeadless) does not
//   disconnect while waiting for a slow ChromeHeadless cold start.
// - browserDisconnectTolerance: 1 allows one reconnect after a disconnect.
// Local and DEBUG runs return {} so interactive browser sessions are unchanged.
const CI_LOCAL_KARMA_SETTINGS = {
    captureTimeout: 120000,
    browserNoActivityTimeout: 120000,
    browserDisconnectTolerance: 1,
};

function isCiKarmaRun(env = process.env) {
    if (!env || env.DEBUG === 'true') {
        return false;
    }

    const { CI } = env;
    return Boolean(CI && CI !== 'false' && CI !== '0');
}

function getLocalKarmaSettings(env = process.env) {
    if (!isCiKarmaRun(env)) {
        return {};
    }

    return {
        ...CI_LOCAL_KARMA_SETTINGS,
    };
}

module.exports = {
    CI_LOCAL_KARMA_SETTINGS,
    getLocalKarmaSettings,
};
