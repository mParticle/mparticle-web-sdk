import { SDKLoggerApi } from './sdkRuntimeModels';

/**
 * Privacy flags control SDK behavior based on user consent preferences for Rokt integration.
 * @see https://docs.rokt.com/developers/integration-guides/web/cookie-consent-flags/
 */
export interface IPrivacyFlags {
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

export interface IPrivacyManager {
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
 * PrivacyManager handles storage and access of privacy flags (noFunctional, noTargeting)
 * that are passed via launcherOptions during SDK initialization.
 *
 * These flags allow Rokt integration to respect user privacy choices.
 *
 * Default behavior: Both flags default to false, meaning all features are allowed
 * unless explicitly opted out by the user.
 */
export default class PrivacyManager implements IPrivacyManager {
    private privacyFlags: IPrivacyFlags = {
        noFunctional: false,
        noTargeting: false,
    };

    constructor(flags?: Partial<IPrivacyFlags>, logger?: SDKLoggerApi) {
        if (!flags) {
            logger?.verbose('PrivacyManager: No privacy flags provided, using defaults');
            return;
        }

        const { noFunctional, noTargeting } = flags;

        if (typeof noFunctional === 'boolean') {
            this.privacyFlags.noFunctional = noFunctional;
            logger?.verbose(`PrivacyManager: noFunctional set to ${noFunctional}`);
        }

        if (typeof noTargeting === 'boolean') {
            this.privacyFlags.noTargeting = noTargeting;
            logger?.verbose(`PrivacyManager: noTargeting set to ${noTargeting}`);
        }
    }

    /**
     * Returns true if third-party targeting is disabled.
     * Targeting is allowed when noTargeting is false (default).
     */
    getNoTargeting(): boolean {
        return this.privacyFlags.noTargeting;
    }

    /**
     * Returns true if functional tracking is disabled.
     * Functional tracking is allowed when noFunctional is false (default).
     */
    getNoFunctional(): boolean {
        return this.privacyFlags.noFunctional;
    }
}
