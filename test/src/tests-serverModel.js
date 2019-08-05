import ServerModel from '../../src/serverModel';
import Consent from '../../src/consent';

describe('Server Model', function() {
    it('Should convert complete consent object', function(done) {
        var consentState = Consent.createConsentState();
        consentState.addGDPRConsentState('foo', Consent.createGDPRConsent(
            true,
            10,
            'foo document',
            'foo location',
            'foo hardware id'));
        var consent = ServerModel.convertToConsentStateDTO(consentState);
        consent.should.be.ok();

        consent.should.have.property('gdpr');
        consent.gdpr.should.have.property('foo');
        consent.gdpr.foo.should.have.property('c', true);
        consent.gdpr.foo.should.have.property('ts', 10);
        consent.gdpr.foo.should.have.property('d', 'foo document');
        consent.gdpr.foo.should.have.property('l', 'foo location');
        consent.gdpr.foo.should.have.property('h', 'foo hardware id');
        done();
    });
});