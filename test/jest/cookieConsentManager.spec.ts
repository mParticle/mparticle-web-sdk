import CookieConsentManager from '../../src/cookieConsentManager';

describe('CookieConsentManager', () => {
    describe('#constructor', () => {
        it('should default flags to false when not provided', () => {
            const cookieConsentManager = new CookieConsentManager();

            expect(cookieConsentManager.getNoFunctional()).toBe(false);
            expect(cookieConsentManager.getNoTargeting()).toBe(false);
        });

        it('should set flags when passed', () => {
            const cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: true });

            expect(cookieConsentManager.getNoFunctional()).toBe(true);
            expect(cookieConsentManager.getNoTargeting()).toBe(true);
        });

        it('should ignore non-boolean values', () => {
            const cookieConsentManager = new CookieConsentManager({
                noFunctional: 'true' as unknown as boolean,
                noTargeting: 1 as unknown as boolean,
            });

            expect(cookieConsentManager.getNoFunctional()).toBe(false);
            expect(cookieConsentManager.getNoTargeting()).toBe(false);
        });
    });

    describe('#getNoFunctional', () => {
        it('should return the noFunctional flag value', () => {
            const cookieConsentManager = new CookieConsentManager({ noFunctional: true });

            expect(cookieConsentManager.getNoFunctional()).toBe(true);
        });
    });

    describe('#getNoTargeting', () => {
        it('should return the noTargeting flag value', () => {
            const cookieConsentManager = new CookieConsentManager({ noTargeting: true });

            expect(cookieConsentManager.getNoTargeting()).toBe(true);
        });
    });
});
