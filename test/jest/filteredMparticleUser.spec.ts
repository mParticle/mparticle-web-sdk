import filteredMparticleUser from '../../src/filteredMparticleUser';
import Helpers from '../../src/helpers';
import KitFilterHelper from '../../src/kitFilterHelper';
import KitBlocker from '../../src/kitBlocking';
import { IdentityType } from '../../src/types';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { MPForwarder } from '../../src/forwarders.interfaces';
import { Dictionary } from '../../src/utils';

const testMPID = 'test-mpid';

function createHelpers(mpInstance: IMParticleWebSDKInstance) {
    return new Helpers(mpInstance);
}

function createMpInstance(options?: {
    userAttributes?: Dictionary | null;
    userIdentities?: Dictionary<string>;
}): IMParticleWebSDKInstance {
    const mockMPInstance = {
        _Store: {
            getUserAttributes: jest.fn(
                () => options?.userAttributes ?? {}
            ),
            getUserIdentities: jest.fn(
                () =>
                    options?.userIdentities ?? {
                        [IdentityType.CustomerId]: 'cust-1',
                        [IdentityType.Email]: 'user@example.com',
                        [IdentityType.Google]: 'google-id',
                    }
            ),
        },
        Logger: {
            verbose: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
        },
    } as unknown as IMParticleWebSDKInstance;

    mockMPInstance._Helpers = createHelpers(mockMPInstance);
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

describe('filteredMparticleUser', () => {
    it('should return the MPID without constructing with new', () => {
        const mpInstance = createMpInstance();
        const user = filteredMparticleUser(
            testMPID,
            { userAttributeFilters: [] },
            mpInstance
        );

        expect(user.getMPID()).toBe(testMPID);
    });

    describe('#getAllUserAttributes', () => {
        it('should return an empty object when store attributes are missing', () => {
            const mpInstance = createMpInstance({ userAttributes: null });
            const user = filteredMparticleUser(
                testMPID,
                { userAttributeFilters: [] },
                mpInstance
            );

            expect(user.getAllUserAttributes()).toEqual({});
        });

        it('should copy list attributes so kits cannot mutate store values', () => {
            const tags = ['a', 'b'];
            const mpInstance = createMpInstance({
                userAttributes: { color: 'red', tags },
            });
            const user = filteredMparticleUser(
                testMPID,
                { userAttributeFilters: [] },
                mpInstance
            );

            const attrs = user.getAllUserAttributes();
            expect(attrs.color).toBe('red');
            expect(attrs.tags).toEqual(['a', 'b']);
            expect(attrs.tags).not.toBe(tags);

            (attrs.tags as string[]).push('c');
            expect(tags).toEqual(['a', 'b']);
        });

        it('should omit kit-blocked attribute keys and allow all when kitBlocker is omitted', () => {
            const mpInstance = createMpInstance({
                userAttributes: {
                    allowed: 'yes',
                    blocked_attr: 'no',
                },
            });
            const blockedUser = filteredMparticleUser(
                testMPID,
                { userAttributeFilters: [] },
                mpInstance,
                createKitBlocker({ blockedAttributes: ['blocked_attr'] })
            );
            const unblockedUser = filteredMparticleUser(
                testMPID,
                { userAttributeFilters: [] },
                mpInstance
            );

            expect(blockedUser.getAllUserAttributes()).toEqual({
                allowed: 'yes',
            });
            expect(unblockedUser.getAllUserAttributes()).toEqual({
                allowed: 'yes',
                blocked_attr: 'no',
            });
        });

        it('should apply forwarder userAttributeFilters after kit blocking', () => {
            const filteredKey = 'drop_me';
            const mpInstance = createMpInstance({
                userAttributes: {
                    keep_me: '1',
                    drop_me: '2',
                },
            });
            const user = filteredMparticleUser(
                testMPID,
                {
                    userAttributeFilters: [
                        KitFilterHelper.hashUserAttribute(filteredKey),
                    ],
                } as MPForwarder,
                mpInstance
            );

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
            const user = filteredMparticleUser(
                testMPID,
                { userAttributeFilters: [] },
                mpInstance
            );

            const lists = user.getUserAttributesLists({
                userAttributeFilters: [],
            } as MPForwarder);

            expect(lists).toEqual({ tags: ['x'], empty: [] });
            expect(lists.tags).not.toBe(tags);
        });

        it('should apply the method-argument forwarder filters to list keys', () => {
            const mpInstance = createMpInstance({
                userAttributes: {
                    tags: ['a'],
                    secrets: ['s'],
                },
            });
            const user = filteredMparticleUser(
                testMPID,
                { userAttributeFilters: [] },
                mpInstance
            );

            const lists = user.getUserAttributesLists({
                userAttributeFilters: [
                    KitFilterHelper.hashUserAttribute('secrets'),
                ],
            } as MPForwarder);

            expect(lists).toEqual({ tags: ['a'] });
        });

        it('should not include kit-blocked list attributes', () => {
            const mpInstance = createMpInstance({
                userAttributes: {
                    tags: ['a'],
                    blocked_list: ['b'],
                },
            });
            const user = filteredMparticleUser(
                testMPID,
                { userAttributeFilters: [] },
                mpInstance,
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
        it('should map store identity-type keys to names', () => {
            const mpInstance = createMpInstance();
            const user = filteredMparticleUser(
                testMPID,
                { userAttributeFilters: [], userIdentityFilters: [] } as MPForwarder,
                mpInstance
            );

            expect(user.getUserIdentities()).toEqual({
                userIdentities: {
                    customerid: 'cust-1',
                    email: 'user@example.com',
                    google: 'google-id',
                },
            });
        });

        it('should omit kit-blocked identities and forwarder identity filters', () => {
            const mpInstance = createMpInstance();
            const user = filteredMparticleUser(
                testMPID,
                {
                    userAttributeFilters: [],
                    userIdentityFilters: [IdentityType.Google],
                } as MPForwarder,
                mpInstance,
                createKitBlocker({ blockedIdentities: ['email'] })
            );

            expect(user.getUserIdentities()).toEqual({
                userIdentities: {
                    customerid: 'cust-1',
                },
            });
        });

        it('should allow all identities when kitBlocker is omitted', () => {
            const mpInstance = createMpInstance();
            const user = filteredMparticleUser(
                testMPID,
                { userAttributeFilters: [], userIdentityFilters: [] } as MPForwarder,
                mpInstance
            );

            expect(user.getUserIdentities().userIdentities).toEqual({
                customerid: 'cust-1',
                email: 'user@example.com',
                google: 'google-id',
            });
        });
    });
});
