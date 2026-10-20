// Cleans a URL with the core SDK's rule, so GA4 receives the same page URL as
// mParticle events. A core without mParticle._cleanUrl predates that rule; the
// kit then sends a 'full' URL unchanged, as it did before, and cuts a 'path' URL
// at the first ? or #.
function cleanUrl(href, mode) {
    if (window.mParticle && typeof window.mParticle._cleanUrl === 'function') {
        return window.mParticle._cleanUrl(href, mode);
    }
    if (!href) {
        return '';
    }
    return mode === 'path' ? href.split(/[?#]/)[0] : href;
}

module.exports = cleanUrl;
