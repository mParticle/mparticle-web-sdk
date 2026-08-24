import filteredMparticleUser from '../../src/filteredMparticleUser';
import Helpers from '../../src/helpers';
import KitFilterHelper from '../../src/kitFilterHelper';
import KitBlocker from '../../src/kitBlocking';
import { IdentityType } from '../../src/types';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { MPForwarder } from '../../src/forwarders.interfaces';
import { Dictionary } from '../../src/utils';

const testMPID = 'test-mpid';

const defaultIdentities: Dictionary<string> = {
    [IdentityType.CustomerId]: 'cust-1',
    [IdentityType.Email]: 'user@example.com',
    [IdentityType.Google]: 'google-id',
};

function createMpInstance(options?: {
    userAttributes?: Dictionary | null;
    userIdentities?: Dictionary<string>;
}): IMParticleWebSDKInstance {
    const mockMPInstance = {
        _Store: {
            getUserAttributes: jest.fn(
                () => (options && 'userAttributes' in options
                    ? options.userAttributes
                    : {})
            ),
            getUserIdentities: jest.fn(
                () => options?.userIdentities ?? defaultIdentities
            ),
        },
        Logger: {
            verbose: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
        },
    } as unknown as IMParticleWebSDKInstance;

    mockMPInstance._Helpers = new Helpers(mockMPInstance);
    return mockMPInstance;
}

function createKitBlocker(options: {
    blockedAttributes?: string[];
    blockedIdentities?: string[];
}): KitBlocker {
    const blockedAttributes = new Set(options.blockedAttributes ?? []);
    const blockedIdentities = new Set(options.blockedIdentities ?? []);

    return {
        isAttributeKeyBlocked: jest.fn((key: string) =>
            blockedAttributes.has(key)
        ),
        isIdentityBlocked: jest.fn((identityName: string) =>
            blockedIdentities.has(identityName)
        ),
    } as unknown as KitBlocker;
}

function createFilteredUser(
    mpInstance: IMParticleWebSDKInstance,
    forwarder: MPForwarder | { userAttributeFilters: number[] } = {
        userAttributeFilters: [],
    },
    kitBlocker?: KitBlocker
) {
    return filteredMparticleUser(
        testMPID,
        forwarder,
        mpInstance,
        kitBlocker
    );
}

describe('filteredMparticleUser', () => {
    it('should return the MPID without constructing with new', () => {
        const mpInstance = createMpInstance();
        const user = createFilteredUser(mpInstance);

        expect(user.getMPID()).toBe(testMPID);
        expect(mpInstance._Store.getUserAttributes).not.toHaveBeenCalled();
    });

    describe('#getAllUserAttributes', () => {
        it('should return an empty object when store attributes are missing', () => {
            const mpInstance = createMpInstance({ userAttributes: null });

            expect(
                createFilteredUser(mpInstance).getAllUserAttributes()
            ).toEqual({});
            expect(mpInstance._Store.getUserAttributes).toHaveBeenCalledWith(
                testMPID
            );
        });

        it('should copy list attributes so kits cannot mutate store values', () => {
            const tags = ['a', 'b'];
            const mpInstance = createMpInstance({
                userAttributes: { color: 'red', tags },
            });
            const attrs = createFilteredUser(mpInstance).getAllUserAttributes();

            expect(attrs.color).toBe('red');
            expect(attrs.tags).toEqual(['a', 'b']);
            expect(attrs.tags).not.toBe(tags);

            (attrs.tags as string[]).push('c');
            expect(tags).toEqual(['a', 'b']);
        });

        it('should omit kit-blocked attribute keys', () => {
            const mpInstance = createMpInstance({
                userAttributes: {
                    allowed: 'yes',
                    blocked_attr: 'no',
                },
            });
            const user = createFilteredUser(
                mpInstance,
                { userAttributeFilters: [] },
                createKitBlocker({ blockedAttributes: ['blocked_attr'] })
            );

            expect(user.getAllUserAttributes()).toEqual({ allowed: 'yes' });
        });

        it('should allow all attributes when kitBlocker is omitted', () => {
            const mpInstance = createMpInstance({
                userAttributes: {
                    allowed: 'yes',
                    blocked_attr: 'no',
                },
            });

            expect(
                createFilteredUser(mpInstance).getAllUserAttributes()
            ).toEqual({
                allowed: 'yes',
                blocked_attr: 'no',
            });
        });

        it('should apply factory forwarder userAttributeFilters', () => {
            const mpInstance = createMpInstance({
                userAttributes: {
                    keep_me: '1',
                    drop_me: '2',
                },
            });
            const user = createFilteredUser(mpInstance, {
                userAttributeFilters: [
                    KitFilterHelper.hashUserAttribute('drop_me'),
                ],
            } as MPForwarder);

            expect(user.getAllUserAttributes()).toEqual({ keep_me: '1' });
        });
    });

    describe('#getUserAttributesLists', () => {
        it('should return only array attributes and copy them', () => {
            const tags = ['x'];
            const mpInstance = createMpInstance({
                userAttributes: {
                    color: 'red',
                    tags,
                    empty: [],
                },
            });
            const lists = createFilteredUser(
                mpInstance
            ).getUserAttributesLists({
                userAttributeFilters: [],
            } as MPForwarder);

            expect(lists).toEqual({ tags: ['x'], empty: [] });
            expect(lists.tags).not.toBe(tags);
        });

        it('should apply factory filters then method-argument forwarder filters', () => {
            const mpInstance = createMpInstance({
                userAttributes: {
                    keep: ['a'],
                    factory_drop: ['b'],
                    method_drop: ['c'],
                },
            });
            const user = createFilteredUser(mpInstance, {
                userAttributeFilters: [
                    KitFilterHelper.hashUserAttribute('factory_drop'),
                ],
            } as MPForwarder);

            expect(
                user.getUserAttributesLists({
                    userAttributeFilters: [
                        KitFilterHelper.hashUserAttribute('method_drop'),
                    ],
                } as MPForwarder)
            ).toEqual({ keep: ['a'] });
        });

        it('should not include kit-blocked list attributes', () => {
            const mpInstance = createMpInstance({
                userAttributes: {
                    tags: ['a'],
                    blocked_list: ['b'],
                },
            });
            const user = createFilteredUser(
                mpInstance,
                { userAttributeFilters: [] },
                createKitBlocker({ blockedAttributes: ['blocked_list'] })
            );

            expect(
                user.getUserAttributesLists({
                    userAttributeFilters: [],
                } as MPForwarder)
            ).toEqual({ tags: ['a'] });
        });
    });

    describe('#getUserIdentities', () => {
        it('should map store identity-type keys to names when kitBlocker is omitted', () => {
            const mpInstance = createMpInstance();
            const user = createFilteredUser(mpInstance, {
                userAttributeFilters: [],
                userIdentityFilters: [],
            } as MPForwarder);

            expect(user.getUserIdentities()).toEqual({
                userIdentities: {
                    customerid: 'cust-1',
                    email: 'user@example.com',
                    google: 'google-id',
                },
            });
            expect(mpInstance._Store.getUserIdentities).toHaveBeenCalledWith(
                testMPID
            );
        });

        it('should return empty userIdentities when store identities are empty', () => {
            const mpInstance = createMpInstance({ userIdentities: {} });
            const user = createFilteredUser(mpInstance, {
                userAttributeFilters: [],
                userIdentityFilters: [],
            } as MPForwarder);

            expect(user.getUserIdentities()).toEqual({ userIdentities: {} });
        });

        it('should omit kit-blocked identities and forwarder identity filters', () => {
            const mpInstance = createMpInstance();
            const user = createFilteredUser(
                mpInstance,
                {
                    userAttributeFilters: [],
                    userIdentityFilters: [IdentityType.Google],
                } as MPForwarder,
                createKitBlocker({ blockedIdentities: ['email'] })
            );

            expect(user.getUserIdentities()).toEqual({
                userIdentities: {
                    customerid: 'cust-1',
                },
            });
        });

        it('should not apply identity filters when the factory forwarder omits userIdentityFilters', () => {
            const mpInstance = createMpInstance();
            const user = createFilteredUser(mpInstance, {
                userAttributeFilters: [],
            });

            expect(user.getUserIdentities().userIdentities).toEqual({
                customerid: 'cust-1',
                email: 'user@example.com',
                google: 'google-id',
            });
        });
    });
});
