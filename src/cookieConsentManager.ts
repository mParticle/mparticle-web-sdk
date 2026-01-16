/**
 * Cookie consent flags control SDK behavior based on user consent preferences for Rokt integration.
 * @see https://docs.rokt.com/developers/integration-guides/web/cookie-consent-flags/
 */
export interface ICookieConsentFlags {
    /**
     * When true, indicates the user has opted out of functional cookies/tracking.
     * Default: false (functional tracking is allowed)
     */
    noFunctional: boolean;

    /**
     * When true, indicates the user has opted out of targeting cookies/tracking.
     * This flag is used to block cookie syncs and other targeting-related features.
     * Default: false (targeting is allowed)
     */
    noTargeting: boolean;
}

export interface ICookieConsentManager {
    /**
     * Targeting is allowed when noTargeting is false (default)
     */
    getNoTargeting: () => boolean;

    /**
     * Functional tracking is allowed when noFunctional is false (default)
     */
    getNoFunctional: () => boolean;
}

/**
 * CookieConsentManager handles storage and access of consent flags (noFunctional, noTargeting)
 * that are passed via launcherOptions during SDK initialization.
 *
 * These flags allow Rokt integration to respect user privacy choices.
 *
 * Default behavior: Both flags default to false, meaning all features are allowed
 * unless explicitly opted out by the user.
 */
export default class CookieConsentManager implements ICookieConsentManager {
    private flags: ICookieConsentFlags = {
        noFunctional: false,
        noTargeting: false,
    };

    constructor(flags?: Partial<ICookieConsentFlags>) {
        if (!flags) {
            return;
        }

        const { noFunctional, noTargeting } = flags;
        this.flags.noFunctional = noFunctional === true;
        this.flags.noTargeting = noTargeting === true;
    }

    /**
     * Returns true if third-party targeting is disabled.
     * Targeting is allowed when noTargeting is false (default).
     */
    getNoTargeting(): boolean {
        return this.flags.noTargeting;
    }

    /**
     * Returns true if functional tracking is disabled.
     * Functional tracking is allowed when noFunctional is false (default).
     */
    getNoFunctional(): boolean {
        return this.flags.noFunctional;
    }
}
