import {
    hasIdentityRequestChanged,
    normalizeUserIdentityKeys,
} from '../../src/identity-utils';
import { IMParticleUser } from '../../src/identity-user-interfaces';

const mockUserWithIdentities = (userIdentities: Record<string, unknown>) =>
    (({
        getUserIdentities: () => ({ userIdentities }),
    } as unknown) as IMParticleUser);

describe('normalizeUserIdentityKeys', () => {
    it('maps email_sha256 to other', () => {
        const result = normalizeUserIdentityKeys({ email_sha256: 'abc123hash' });
        expect(result).toEqual({ other: 'abc123hash' });
    });

    it('maps mobile_sha256 to other2', () => {
        const result = normalizeUserIdentityKeys({
            mobile_sha256: 'mobilehash456',
        });
        expect(result).toEqual({ other2: 'mobilehash456' });
    });

    it('maps both aliases to distinct canonical slots', () => {
        const result = normalizeUserIdentityKeys({
            email_sha256: 'emailhash',
            mobile_sha256: 'mobilehash',
        });
        expect(result).toEqual({
            other: 'emailhash',
            other2: 'mobilehash',
        });
    });

    it('preserves other canonical identity keys alongside sha256 aliases', () => {
        const result = normalizeUserIdentityKeys({
            email: 'user@example.com',
            customerid: 'cust123',
            email_sha256: 'sha256ofEmail',
        });
        expect(result).toEqual({
            email: 'user@example.com',
            customerid: 'cust123',
            other: 'sha256ofEmail',
        });
    });

    it('does not modify identities without sha256 aliases', () => {
        const input = { email: 'user@example.com', customerid: 'cust123' };
        const result = normalizeUserIdentityKeys(input);
        expect(result).toEqual({
            email: 'user@example.com',
            customerid: 'cust123',
        });
    });

    it('passes null on email_sha256 through to other (clears canonical slot)', () => {
        const result = normalizeUserIdentityKeys({ email_sha256: null });
        expect(result).toEqual({ other: null });
    });

    it('passes null on mobile_sha256 through to other2 (clears canonical slot)', () => {
        const result = normalizeUserIdentityKeys({ mobile_sha256: null });
        expect(result).toEqual({ other2: null });
    });

    it('alias overwrites a same-slot canonical value (silent last-write-wins)', () => {
        const result = normalizeUserIdentityKeys({
            other: 'preexisting',
            email_sha256: 'aliasvalue',
        });
        expect(result).toEqual({ other: 'aliasvalue' });
    });

    it('does not mutate the original object', () => {
        const input = { email_sha256: 'hash' };
        normalizeUserIdentityKeys(input);
        expect(input).toEqual({ email_sha256: 'hash' });
    });
});

describe('hasIdentityRequestChanged', () => {
    it('returns false when current user is null', () => {
        const result = hasIdentityRequestChanged(null, {
            userIdentities: { customerid: 'c' },
        });
        expect(result).toBe(false);
    });

    it('returns false when new request has no userIdentities', () => {
        const user = mockUserWithIdentities({ customerid: 'c' });
        expect(hasIdentityRequestChanged(user, null)).toBe(false);
        expect(hasIdentityRequestChanged(user, {} as any)).toBe(false);
    });

    it('returns false when identities match in value but differ in key order', () => {
        // Persisted side comes from numeric IdentityType iteration:
        // other(0), customerid(1)
        const user = mockUserWithIdentities({
            other: 'hash',
            customerid: 'cust123',
        });
        // Partner-supplied request in different (input) order
        const result = hasIdentityRequestChanged(user, {
            userIdentities: {
                customerid: 'cust123',
                other: 'hash',
            },
        });
        expect(result).toBe(false);
    });

    it('returns false when an alias normalizes to a canonical match (regression for bugbot finding)', () => {
        // Persisted user has `other` set to a sha256 value at IdentityType.Other(0),
        // alongside customerid at IdentityType.CustomerId(1) — so numeric iteration
        // order yields { other, customerid }.
        const user = mockUserWithIdentities({
            other: 'sha256ofEmail',
            customerid: 'cust123',
        });
        // Partner config supplies the alias form. After normalization the new
        // identities historically had `other` appended at the end, causing a
        // spurious mismatch. With order-independent comparison this should match.
        const result = hasIdentityRequestChanged(user, {
            userIdentities: {
                customerid: 'cust123',
                email_sha256: 'sha256ofEmail',
            } as any,
        });
        expect(result).toBe(false);
    });

    it('returns true when an identity value actually differs', () => {
        const user = mockUserWithIdentities({
            other: 'oldhash',
            customerid: 'cust123',
        });
        const result = hasIdentityRequestChanged(user, {
            userIdentities: {
                customerid: 'cust123',
                email_sha256: 'newhash',
            } as any,
        });
        expect(result).toBe(true);
    });

    it('returns true when the new request adds an identity', () => {
        const user = mockUserWithIdentities({ customerid: 'cust123' });
        const result = hasIdentityRequestChanged(user, {
            userIdentities: {
                customerid: 'cust123',
                email: 'user@example.com',
            },
        });
        expect(result).toBe(true);
    });

    it('returns true when the new request drops an identity', () => {
        const user = mockUserWithIdentities({
            customerid: 'cust123',
            email: 'user@example.com',
        });
        const result = hasIdentityRequestChanged(user, {
            userIdentities: { customerid: 'cust123' },
        });
        expect(result).toBe(true);
    });
});
