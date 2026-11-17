import CookieConsentManager from '../../src/cookieConsentManager';
import { IMParticleUser } from '../../src/identity-user-interfaces';

describe('CookieConsentManager', () => {
    describe('#constructor', () => {
        it('should default flags to false when not provided', () => {
            const cookieConsentManager = new CookieConsentManager({ noFunctional: undefined, noTargeting: undefined });

            expect(cookieConsentManager.getNoFunctional()).toBe(false);
            expect(cookieConsentManager.getNoTargeting()).toBe(false);
            expect(cookieConsentManager.getDoNotShareOrSell()).toBe(false);
        });

        it('should set flags when passed', () => {
            const cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: true, doNotShareOrSell: true });

            expect(cookieConsentManager.getNoFunctional()).toBe(true);
            expect(cookieConsentManager.getNoTargeting()).toBe(true);
            expect(cookieConsentManager.getDoNotShareOrSell()).toBe(true);
        });

        it('should ignore non-boolean values', () => {
            const cookieConsentManager = new CookieConsentManager({
                noFunctional: 'true' as unknown as boolean,
                noTargeting: 1 as unknown as boolean,
                doNotShareOrSell: 'true' as unknown as boolean,
            });

            expect(cookieConsentManager.getNoFunctional()).toBe(false);
            expect(cookieConsentManager.getNoTargeting()).toBe(false);
            expect(cookieConsentManager.getDoNotShareOrSell()).toBe(false);
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

    describe('#getDoNotShareOrSell', () => {
        it('should return the doNotShareOrSell flag value', () => {
            const cookieConsentManager = new CookieConsentManager({ noFunctional: undefined, noTargeting: undefined, doNotShareOrSell: true });

            expect(cookieConsentManager.getDoNotShareOrSell()).toBe(true);
            expect(cookieConsentManager.getNoTargeting()).toBe(false);
        });
    });

    describe('source-separated flags', () => {
        const allFlags = { noFunctional: true, noTargeting: true, doNotShareOrSell: true };
        const noFlags = { noFunctional: false, noTargeting: false, doNotShareOrSell: false };
        const readFlags = (manager: CookieConsentManager) => ({
            noFunctional: manager.getNoFunctional(),
            noTargeting: manager.getNoTargeting(),
            doNotShareOrSell: manager.getDoNotShareOrSell(),
        });

        it('keeps init opt-outs when both other sources grant consent or disappear', () => {
            const manager = new CookieConsentManager(allFlags);
            manager.setPageFlags(noFlags);
            manager.replaceDerivedFlags(noFlags);
            expect(readFlags(manager)).toEqual(allFlags);

            manager.setPageFlags({});
            manager.replaceDerivedFlags({});
            expect(readFlags(manager)).toEqual(allFlags);
        });

        it('clears a derived decline when it is replaced with a grant', () => {
            const manager = new CookieConsentManager(noFlags);
            manager.replaceDerivedFlags(allFlags);
            expect(readFlags(manager)).toEqual(allFlags);

            manager.replaceDerivedFlags(noFlags);
            expect(readFlags(manager)).toEqual(noFlags);
        });

        it('clears only the derived contribution when mappings disappear', () => {
            const manager = new CookieConsentManager(noFlags);
            manager.setPageFlags({ noTargeting: true });
            manager.replaceDerivedFlags(allFlags);
            manager.replaceDerivedFlags({});

            expect(readFlags(manager)).toEqual({ ...noFlags, noTargeting: true });
        });

        it('does not let page grants override a derived decline', () => {
            const manager = new CookieConsentManager(noFlags);
            manager.replaceDerivedFlags(allFlags);
            manager.setPageFlags(noFlags);
            expect(readFlags(manager)).toEqual(allFlags);

            manager.setPageFlags({});
            expect(readFlags(manager)).toEqual(allFlags);
        });

        it('replaces page flags instead of latching an old opt-out', () => {
            const manager = new CookieConsentManager(noFlags);
            manager.setPageFlags(allFlags);
            expect(readFlags(manager)).toEqual(allFlags);

            manager.setPageFlags({ noFunctional: true });
            expect(readFlags(manager)).toEqual({ ...noFlags, noFunctional: true });

            manager.setPageFlags({});
            expect(readFlags(manager)).toEqual(noFlags);
        });

        it('keeps the three flags independent across sources', () => {
            const manager = new CookieConsentManager({ ...noFlags, noFunctional: true });
            manager.setPageFlags({ noTargeting: true });
            manager.replaceDerivedFlags({ doNotShareOrSell: true });
            expect(readFlags(manager)).toEqual(allFlags);

            manager.replaceDerivedFlags({});
            expect(readFlags(manager)).toEqual({ ...allFlags, doNotShareOrSell: false });
        });

        (['setPageFlags', 'replaceDerivedFlags'] as const).forEach((method) => {
            it(method + ' accepts only boolean true', () => {
                const manager = new CookieConsentManager(noFlags);
                manager[method]({
                    noFunctional: 'true' as unknown as boolean,
                    noTargeting: 1 as unknown as boolean,
                    doNotShareOrSell: 'false' as unknown as boolean,
                });
                expect(readFlags(manager)).toEqual(noFlags);
            });

            it(method + ' copies flags and is idempotent', () => {
                const manager = new CookieConsentManager(noFlags);
                const flags = { ...allFlags };
                manager[method](flags);
                manager[method](flags);
                flags.noFunctional = false;
                flags.noTargeting = false;
                flags.doNotShareOrSell = false;
                expect(readFlags(manager)).toEqual(allFlags);
            });
        });
    });

    describe('#syncNoTargetingAttribute', () => {
        function createMockUser(attributes: Record<string, any> = {}) {
            const attrs = { ...attributes };
            return {
                setUserAttribute: jest.fn((key, value) => { attrs[key] = value; }),
                removeUserAttribute: jest.fn((key) => { delete attrs[key]; }),
                getAllUserAttributes: jest.fn(() => attrs),
            } as unknown as IMParticleUser;
        }

        it('synchronizes effective targeting after a derived update and removal', () => {
            const manager = new CookieConsentManager({ noTargeting: false, noFunctional: false });
            const user = createMockUser();
            manager.replaceDerivedFlags({ noTargeting: true });
            manager.syncNoTargetingAttribute(user);
            expect(user.setUserAttribute).toHaveBeenCalledWith('$NoTargeting', true);

            manager.replaceDerivedFlags({});
            manager.syncNoTargetingAttribute(user);
            expect(user.removeUserAttribute).toHaveBeenCalledWith('$NoTargeting');
            expect(user.setUserAttribute).toHaveBeenCalledTimes(1);
        });

        it('keeps the targeting attribute when an explicit opt-out remains', () => {
            const manager = new CookieConsentManager({ noTargeting: false, noFunctional: false });
            const user = createMockUser();
            manager.setPageFlags({ noTargeting: true });
            manager.replaceDerivedFlags({ noTargeting: true });
            manager.replaceDerivedFlags({});
            manager.syncNoTargetingAttribute(user);

            expect(user.setUserAttribute).toHaveBeenCalledWith('$NoTargeting', true);
            expect(user.removeUserAttribute).not.toHaveBeenCalled();
        });

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

        it('should not set $NoTargeting when only doNotShareOrSell is true', () => {
            const manager = new CookieConsentManager({ noTargeting: false, noFunctional: false, doNotShareOrSell: true });
            const user = createMockUser();

            manager.syncNoTargetingAttribute(user);

            expect(user.setUserAttribute).not.toHaveBeenCalled();
        });

        it('should do nothing when user is null', () => {
            const manager = new CookieConsentManager({ noTargeting: true, noFunctional: false });

            expect(() => manager.syncNoTargetingAttribute(null)).not.toThrow();
        });

        it('should remove $NoTargeting when another attribute is named after an Object.prototype member', () => {
            const manager = new CookieConsentManager({ noTargeting: false, noFunctional: false });
            const user = createMockUser(
                JSON.parse('{"hasOwnProperty":"stored","$NoTargeting":true}')
            );

            manager.syncNoTargetingAttribute(user);

            expect(user.removeUserAttribute).toHaveBeenCalledWith('$NoTargeting');
        });

        it('should leave $NoTargeting alone when it is absent and another attribute is named after an Object.prototype member', () => {
            const manager = new CookieConsentManager({ noTargeting: false, noFunctional: false });
            const user = createMockUser(JSON.parse('{"hasOwnProperty":"stored"}'));

            manager.syncNoTargetingAttribute(user);

            expect(user.removeUserAttribute).not.toHaveBeenCalled();
        });
    });
});
