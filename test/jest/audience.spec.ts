import Audience from '../../src/audience';

describe('Audience', () => {
    it('should return an audience with just an audience_id', () => {
        const audience = new Audience(12345);

        expect(audience).toBeDefined();
        expect(audience.audience_id).toEqual(12345);
    });

    it('should return an audience with an audience_id and expiration_timestamp_ms', () => {
        const audience = new Audience(12345);

        expect(audience).toBeDefined();
        expect(audience.audience_id).toEqual(12345);
    });
});
