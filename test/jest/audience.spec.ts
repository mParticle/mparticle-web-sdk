import Audience from '../../src/audience';

describe('Audience', () => {
    it('should return an audience with an id and name', () => {
        const audience = new Audience(12345, 'foo-audience');

        expect(audience).toBeDefined();
        expect(audience.id).toEqual(12345);
        expect(audience.name).toEqual('foo-audience');
    });
});
