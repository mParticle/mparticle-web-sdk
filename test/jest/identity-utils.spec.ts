import { normalizeUserIdentityKeys } from '../../src/identity-utils';

describe('normalizeUserIdentityKeys', () => {
    it('maps email_sha256 to other', () => {
        const result = normalizeUserIdentityKeys({ email_sha256: 'abc123hash' } as any);
        expect(result).toEqual({ other: 'abc123hash' });
    });

    it('maps mobile_sha256 to other', () => {
        const result = normalizeUserIdentityKeys({ mobile_sha256: 'mobilehash456' } as any);
        expect(result).toEqual({ other: 'mobilehash456' });
    });

    it('last sha256 alias wins when both are set (same slot)', () => {
        const result = normalizeUserIdentityKeys({
            email_sha256: 'emailhash',
            mobile_sha256: 'mobilehash',
        } as any);
        expect(result).toEqual({ other: 'mobilehash' });
    });

    it('preserves other canonical identity keys alongside sha256 aliases', () => {
        const result = normalizeUserIdentityKeys({
            email: 'user@example.com',
            customerid: 'cust123',
            email_sha256: 'sha256ofEmail',
        } as any);
        expect(result).toEqual({
            email: 'user@example.com',
            customerid: 'cust123',
            other: 'sha256ofEmail',
        });
    });

    it('does not modify identities without sha256 aliases', () => {
        const input = { email: 'user@example.com', customerid: 'cust123' };
        const result = normalizeUserIdentityKeys(input);
        expect(result).toEqual({ email: 'user@example.com', customerid: 'cust123' });
    });

    it('handles null values for sha256 aliases', () => {
        const result = normalizeUserIdentityKeys({ email_sha256: null } as any);
        expect(result).toEqual({ other: null });
    });

    it('does not mutate the original object', () => {
        const input = { email_sha256: 'hash' } as any;
        normalizeUserIdentityKeys(input);
        expect(input).toEqual({ email_sha256: 'hash' });
    });
});
