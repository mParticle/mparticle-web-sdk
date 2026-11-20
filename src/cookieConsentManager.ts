import { NO_TARGETING_ATTRIBUTE } from './constants';
import { IMParticleUser } from './identity-user-interfaces';
import { hasOwnProp } from './utils';

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

    /**
     * When true, indicates the user has opted out of the sale or sharing of their data.
     * Default: false (sharing is allowed)
     */
    doNotShareOrSell?: boolean;
}

/**
 * @internal Called after a page or derived update changes any combined flag,
 * with the combined values from before the update.
 */
export type CookieConsentChangeListener = (previous: ICookieConsentFlags) => void;

export interface ICookieConsentManager {
    /**
     * Targeting is allowed when noTargeting is false (default)
     */
    getNoTargeting: () => boolean;

    /**
     * Functional tracking is allowed when noFunctional is false (default)
     */
    getNoFunctional: () => boolean;

    /**
     * Sharing is allowed when doNotShareOrSell is false (default)
     */
    getDoNotShareOrSell: () => boolean;

    /**
     * Syncs the $NoTargeting user attribute based on the current noTargeting flag.
     * Sets the attribute when noTargeting is true, removes it when false.
     */
    syncNoTargetingAttribute: (user: IMParticleUser | null) => void;

    /** @internal */
    setChangeListener?: (listener: CookieConsentChangeListener | null) => void;
}

/**
 * CookieConsentManager handles storage and access of consent flags (noFunctional, noTargeting,
 * doNotShareOrSell) that are passed via launcherOptions during SDK initialization.
 *
 * These flags allow Rokt integration to respect user privacy choices.
 *
 * Default behavior: All flags default to false, meaning all features are allowed
 * unless explicitly opted out by the user.
 */
export default class CookieConsentManager implements ICookieConsentManager {
    /** @internal */
    private pageFlags: Partial<ICookieConsentFlags> = {};
    /** @internal */
    private derivedFlags: Partial<ICookieConsentFlags> = {};
    /** @internal */
    private changeListener: CookieConsentChangeListener | null = null;

    constructor(private flags: ICookieConsentFlags) {
        this.flags = {
            noFunctional: flags.noFunctional === true,
            noTargeting: flags.noTargeting === true,
            doNotShareOrSell: flags.doNotShareOrSell === true,
        };
    }

    /** @internal */
    setChangeListener(listener: CookieConsentChangeListener | null): void {
        this.changeListener = listener;
    }

    /** @internal */
    setPageFlags(flags: Partial<ICookieConsentFlags>): void {
        const previous = this.getCombinedFlags();
        this.pageFlags = {
            noFunctional: flags.noFunctional === true,
            noTargeting: flags.noTargeting === true,
            doNotShareOrSell: flags.doNotShareOrSell === true,
        };
        this.notifyIfChanged(previous);
    }

    /** @internal */
    replaceDerivedFlags(flags: Partial<ICookieConsentFlags>): void {
        const previous = this.getCombinedFlags();
        this.derivedFlags = {
            noFunctional: flags.noFunctional === true,
            noTargeting: flags.noTargeting === true,
            doNotShareOrSell: flags.doNotShareOrSell === true,
        };
        this.notifyIfChanged(previous);
    }

    /** @internal */
    private getCombinedFlags(): ICookieConsentFlags {
        return {
            noFunctional: this.getNoFunctional(),
            noTargeting: this.getNoTargeting(),
            doNotShareOrSell: this.getDoNotShareOrSell(),
        };
    }

    /** @internal */
    private notifyIfChanged(previous: ICookieConsentFlags): void {
        if (!this.changeListener) {
            return;
        }
        const current = this.getCombinedFlags();
        if (
            current.noFunctional !== previous.noFunctional ||
            current.noTargeting !== previous.noTargeting ||
            current.doNotShareOrSell !== previous.doNotShareOrSell
        ) {
            this.changeListener(previous);
        }
    }

    /**
     * Returns true if third-party targeting is disabled.
     * Targeting is allowed when noTargeting is false (default).
     */
    getNoTargeting(): boolean {
        return this.flags.noTargeting ||
            this.pageFlags.noTargeting === true ||
            this.derivedFlags.noTargeting === true;
    }

    /**
     * Returns true if functional tracking is disabled.
     * Functional tracking is allowed when noFunctional is false (default).
     */
    getNoFunctional(): boolean {
        return this.flags.noFunctional ||
            this.pageFlags.noFunctional === true ||
            this.derivedFlags.noFunctional === true;
    }

    /**
     * Returns true if the user has opted out of the sale or sharing of their data.
     * Sharing is allowed when doNotShareOrSell is false (default).
     */
    getDoNotShareOrSell(): boolean {
        return this.flags.doNotShareOrSell ||
            this.pageFlags.doNotShareOrSell === true ||
            this.derivedFlags.doNotShareOrSell === true;
    }

    syncNoTargetingAttribute(user: IMParticleUser | null): void {
        if (!user) return;

        if (this.getNoTargeting()) {
            user.setUserAttribute(NO_TARGETING_ATTRIBUTE, true);
        } else if (
            hasOwnProp(user.getAllUserAttributes(), NO_TARGETING_ATTRIBUTE)
        ) {
            user.removeUserAttribute(NO_TARGETING_ATTRIBUTE);
        }
    }
}
