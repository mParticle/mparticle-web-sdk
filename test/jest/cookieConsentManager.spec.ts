import CookieConsentManager from '../../src/cookieConsentManager';

describe('CookieConsentManager', () => {
    describe('#constructor', () => {
        it('should default flags to false when not provided', () => {
            const cookieConsentManager = new CookieConsentManager({ noFunctional: undefined, noTargeting: undefined });

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
            const cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: undefined });

            expect(cookieConsentManager.getNoFunctional()).toBe(true);
        });
    });

    describe('#getNoTargeting', () => {
        it('should return the noTargeting flag value', () => {
            const cookieConsentManager = new CookieConsentManager({ noTargeting: true, noFunctional: undefined });

            expect(cookieConsentManager.getNoTargeting()).toBe(true);
        });
    });

    describe('#syncNoTargetingAttribute', () => {
        function createMockUser(attributes: Record<string, any> = {}) {
            const attrs = { ...attributes };
            return {
                setUserAttribute: jest.fn((key, value) => { attrs[key] = value; }),
                removeUserAttribute: jest.fn((key) => { delete attrs[key]; }),
                getAllUserAttributes: jest.fn(() => attrs),
            };
        }

        it('should set $NoTargeting when noTargeting is true', () => {
            const manager = new CookieConsentManager({ noTargeting: true, noFunctional: false });
            const user = createMockUser();

            manager.syncNoTargetingAttribute(user);

            expect(user.setUserAttribute).toHaveBeenCalledWith('$NoTargeting', true);
        });

        it('should remove $NoTargeting when noTargeting is false and attribute exists', () => {
            const manager = new CookieConsentManager({ noTargeting: false, noFunctional: false });
            const user = createMockUser({ '$NoTargeting': true });

            manager.syncNoTargetingAttribute(user);

            expect(user.removeUserAttribute).toHaveBeenCalledWith('$NoTargeting');
        });

        it('should not remove $NoTargeting when noTargeting is false and attribute does not exist', () => {
            const manager = new CookieConsentManager({ noTargeting: false, noFunctional: false });
            const user = createMockUser();

            manager.syncNoTargetingAttribute(user);

            expect(user.removeUserAttribute).not.toHaveBeenCalled();
        });

        it('should do nothing when user is null', () => {
            const manager = new CookieConsentManager({ noTargeting: true, noFunctional: false });

            expect(() => manager.syncNoTargetingAttribute(null)).not.toThrow();
        });
    });
});
