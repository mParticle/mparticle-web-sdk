import CookieConsentManager from '../../src/cookieConsentManager';
import RoktManager from '../../src/roktManager';
import { IStore } from '../../src/store';
import Constants from '../../src/constants';

// Core-only Ads integrations must not need a kit or RoktManager.init().
describe('Rokt Ads page privacy control', () => {
    const noFlags = () => new CookieConsentManager({ noFunctional: false, noTargeting: false });

    it('keeps existing defaults without a setter call', () => {
        const manager = new RoktManager();
        const consent = noFlags();
        manager._bindCookieConsentManager(consent);
        expect(consent.getNoFunctional()).toBe(false);
        expect(consent.getNoTargeting()).toBe(false);
        expect(consent.getDoNotShareOrSell()).toBe(false);
        expect(manager.isInitialized).toBe(false);
        expect(manager.kit).toBeNull();
    });

    it('preserves initialization opt-outs without a setter call', () => {
        const manager = new RoktManager();
        const consent = new CookieConsentManager({ noFunctional: true, noTargeting: true, doNotShareOrSell: true });
        manager._bindCookieConsentManager(consent);
        expect(consent.getNoFunctional()).toBe(true);
        expect(consent.getNoTargeting()).toBe(true);
        expect(consent.getDoNotShareOrSell()).toBe(true);
        expect(manager.hasTargetingOptOut()).toBe(true);
    });

    it('updates only the supplied page flags before kit init', () => {
        const manager = new RoktManager();
        const consent = noFlags();
        manager._bindCookieConsentManager(consent);
        const flags = { noTargeting: true };
        manager.setPrivacyControl(flags);
        flags.noTargeting = false;
        expect(consent.getNoTargeting()).toBe(true);
        expect(consent.getNoFunctional()).toBe(false);
        manager.setPrivacyControl({ noFunctional: true });
        expect(consent.getNoTargeting()).toBe(true);
        expect(consent.getNoFunctional()).toBe(true);
        manager.setPrivacyControl({ noFunctional: false });
        expect(consent.getNoTargeting()).toBe(true);
        expect(consent.getNoFunctional()).toBe(false);
        manager.setPrivacyControl({ noTargeting: false });
        expect(consent.getNoTargeting()).toBe(false);
        expect(manager.kit).toBeNull();
    });

    it('retains a pre-init call across core initialization and reinitialization', () => {
        const manager = new RoktManager();
        manager.setPrivacyControl({ noTargeting: true });
        const first = noFlags();
        const second = noFlags();
        manager._bindCookieConsentManager(first);
        expect(first.getNoTargeting()).toBe(true);
        manager._bindCookieConsentManager(second);
        expect(second.getNoTargeting()).toBe(true);
        manager.setPrivacyControl({ noTargeting: false });
        expect(second.getNoTargeting()).toBe(false);
        expect(first.getNoTargeting()).toBe(true);
        expect(manager.isInitialized).toBe(false);
    });

    it('cannot clear init or derived opt-outs when the page grants consent', () => {
        const manager = new RoktManager();
        const consent = new CookieConsentManager({ noFunctional: true, noTargeting: true, doNotShareOrSell: true });
        manager._bindCookieConsentManager(consent);
        manager.setPrivacyControl({ noFunctional: false, noTargeting: false, doNotShareOrSell: false });
        expect(consent.getNoFunctional()).toBe(true);
        expect(consent.getNoTargeting()).toBe(true);
        expect(consent.getDoNotShareOrSell()).toBe(true);
        const derived = noFlags();
        derived.replaceDerivedFlags({ noFunctional: true, noTargeting: true, doNotShareOrSell: true });
        manager._bindCookieConsentManager(derived);
        manager.setPrivacyControl({});
        expect(derived.getNoFunctional()).toBe(true);
        expect(derived.getNoTargeting()).toBe(true);
        expect(derived.getDoNotShareOrSell()).toBe(true);
    });

    it('accepts only strict boolean opt-outs', () => {
        const manager = new RoktManager();
        const consent = noFlags();
        manager._bindCookieConsentManager(consent);
        manager.setPrivacyControl({ noTargeting: true });
        manager.setPrivacyControl({ noTargeting: 'true', noFunctional: 1 } as any);
        expect(consent.getNoTargeting()).toBe(true);
        expect(consent.getNoFunctional()).toBe(false);
        [null, undefined, {}, [], 'invalid'].forEach(value => manager.setPrivacyControl(value as any));
        expect(consent.getNoTargeting()).toBe(true);
    });

    it('notifies the change listener only when the combined flags change', () => {
        const manager = new RoktManager();
        const consent = noFlags();
        const listener = jest.fn();
        consent.setChangeListener(listener);
        manager._bindCookieConsentManager(consent);
        expect(listener).not.toHaveBeenCalled();
        manager.setPrivacyControl({ noTargeting: true });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({
            noFunctional: false,
            noTargeting: false,
            doNotShareOrSell: false,
        });
        manager.setPrivacyControl({ noTargeting: true });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('applies calls queued before load when core privacy is bound', () => {
        const manager = new RoktManager();
        const consent = noFlags();
        const queued = jest.fn();
        const readyQueue: any[] = [
            ['Rokt.setPrivacyControl', { noFunctional: true }],
            queued,
            ['Rokt.setPrivacyControl', { noTargeting: true }],
        ];
        manager._bindCookieConsentManager(consent, readyQueue);
        expect(consent.getNoFunctional()).toBe(true);
        expect(consent.getNoTargeting()).toBe(true);
        expect(readyQueue).toEqual([queued]);
    });

    it('isolates page contributions between instances', () => {
        const first = new RoktManager('first');
        const second = new RoktManager('second');
        const firstConsent = noFlags();
        const secondConsent = noFlags();
        first._bindCookieConsentManager(firstConsent);
        second._bindCookieConsentManager(secondConsent);
        first.setPrivacyControl({ noTargeting: true });
        expect(firstConsent.getNoTargeting()).toBe(true);
        expect(secondConsent.getNoTargeting()).toBe(false);
    });

    it('updates targeting and checkout gates without loading a kit', () => {
        const manager = new RoktManager();
        const consent = noFlags();
        manager._bindCookieConsentManager(consent);
        manager['store'] = {
            isEnabled: true,
            SDKConfig: { flags: { [Constants.FeatureFlags.AutoButtonTracking]: true } },
        } as unknown as IStore;
        manager.setAutoButtonClicksForwarded(true);
        expect(manager.hasTargetingOptOut()).toBe(false);
        expect(manager.isCheckoutIntentSuppressed()).toBe(false);
        manager.notifyCheckoutIntent({ kind: 'commit', t: Date.now(), source: 'label' } as any);
        expect(manager['pendingCheckoutIntents']).toHaveLength(1);
        manager.setPrivacyControl({ noFunctional: true });
        expect(manager.hasTargetingOptOut()).toBe(false);
        expect(manager.isCheckoutIntentSuppressed()).toBe(true);
        expect(manager['pendingCheckoutIntents']).toHaveLength(0);
        manager.setPrivacyControl({ noTargeting: true });
        expect(manager.hasTargetingOptOut()).toBe(true);
        manager.setPrivacyControl({ doNotShareOrSell: true });
        expect(manager.hasTargetingOptOut()).toBe(true);
        manager.setPrivacyControl({ noFunctional: false, noTargeting: false, doNotShareOrSell: false });
        expect(manager.hasTargetingOptOut()).toBe(false);
        expect(manager.isCheckoutIntentSuppressed()).toBe(false);
    });

    it.each(['noTargeting', 'doNotShareOrSell', 'noFunctional'])(
        'keeps a truthy initialization flag for %s when core privacy is bound',
        flag => {
            const manager = new RoktManager();
            manager['store'] = {
                isEnabled: true,
                SDKConfig: { flags: { [Constants.FeatureFlags.AutoButtonTracking]: true } },
            } as unknown as IStore;
            manager.setAutoButtonClicksForwarded(true);
            const initialization = { noFunctional: false, noTargeting: false, [flag]: 'true' };
            manager['launcherOptions'] = initialization;
            expect(manager.isCheckoutIntentSuppressed()).toBe(true);
            manager._bindCookieConsentManager(new CookieConsentManager(initialization));
            expect(manager.hasTargetingOptOut()).toBe(flag !== 'noFunctional');
            expect(manager.isCheckoutIntentSuppressed()).toBe(true);
        }
    );
});
