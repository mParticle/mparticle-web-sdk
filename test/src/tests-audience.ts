import { expect } from 'chai';
import Audience from '../../src/audience';


describe('Audience', () => {
    it('should return an audience with an id and name', () => {
        const audience = new Audience(12345, 'foo-audience');

        expect(audience).to.be.ok;
        expect(audience.id).to.equal(12345);
        expect(audience.name).to.equal('foo-audience');
    });
});
