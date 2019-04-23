var should = require('should'),
    Consent = require('../../src/consent');

describe('Consent', function() {
    it('Should not create consent object without consented boolean', function(done) {
        var consent = Consent.createGDPRConsent();
        should.not.exist(consent);

        consent = Consent.createGDPRConsent(0);
        should.not.exist(consent);

        consent = Consent.createGDPRConsent('foo bar');
        should.not.exist(consent);

        done();
    });

    it('Should create basic consent object with only consented boolean', function(done) {
        var consent = Consent.createGDPRConsent(true);
        should.exist(consent);

        consent.Consented.should.equal(true);


        consent = Consent.createGDPRConsent(false);
        should.exist(consent);
        consent.Consented.should.equal(false);
        done();
    });

    it('Should not create consent object with invalid document', function(done) {
        var badDocument = 123;
        var consent = Consent.createGDPRConsent(true, 123, badDocument);
        should.not.exist(consent);

        done();
    });

    it('Should not create consent object with invalid location', function(done) {
        var badLocation = 123;
        var consent = Consent.createGDPRConsent(true, 123, 'foo document', badLocation);
        should.not.exist(consent);

        done();
    });

    it('Should not create consent object with invalid hardware id', function(done) {
        var badHardwareId = 123;
        var consent = Consent.createGDPRConsent(true, 123, 'foo document', 'foo location', badHardwareId);
        should.not.exist(consent);

        done();
    });

    it('Should set current timestamp if none given', function(done) {
        var date = Date.now();
        var consent = Consent.createGDPRConsent(true);
        consent.Timestamp.should.be.aboveOrEqual(date);
        done();
    });

    it('Should create complete object', function(done) {
        var consent = Consent.createGDPRConsent(
            true,
            10,
            'foo document',
            'foo location',
            'foo hardware id');
        should.exist(consent);
        consent.should.have.property('Consented', true);
        consent.should.have.property('Timestamp', 10);
        consent.should.have.property('ConsentDocument', 'foo document');
        consent.should.have.property('Location', 'foo location');
        consent.should.have.property('HardwareId', 'foo hardware id');
        done();
    });

    it('Should create basic ConsentState object', function(done) {
        var consentState = Consent.createConsentState();
        should.exist(consentState);
        done();
    });

    it('Should add GDPR ConsentState object', function(done) {
        var consentState = Consent.createConsentState();
        should.exist(consentState);

        consentState
            .addGDPRConsentState('foo', Consent.createGDPRConsent(true))
            .addGDPRConsentState('bar', Consent.createGDPRConsent(false));

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState.getGDPRConsentState().foo.should.have.property('Consented', true);
        should.not.exist(consentState.GDPR);

        consentState.getGDPRConsentState().should.have.property('bar');
        consentState.getGDPRConsentState().bar.should.have.property('Consented', false);

        done();
    });

    it('Should replace GDPR ConsentState object', function(done) {
        var consentState = Consent.createConsentState();
        var consentState2 = Consent.createConsentState();

        consentState
            .addGDPRConsentState('foo', Consent.createGDPRConsent(true));

        consentState2
            .addGDPRConsentState('bar', Consent.createGDPRConsent(false));
        consentState2
            .addGDPRConsentState('baz', Consent.createGDPRConsent(false));

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState2.getGDPRConsentState().should.have.property('bar');
        consentState2.getGDPRConsentState().should.have.property('baz');

        consentState.setGDPRConsentState(consentState2.getGDPRConsentState());

        consentState.getGDPRConsentState().should.not.have.property('foo');
        consentState.getGDPRConsentState().should.have.property('bar');
        consentState.getGDPRConsentState().should.have.property('baz');

        done();
    });

    it('Can\'t modify GDPR ConsentState object', function(done) {
        var consentState = Consent.createConsentState();
        should.exist(consentState);

        consentState
            .addGDPRConsentState('foo', Consent.createGDPRConsent(true))
            .addGDPRConsentState('bar', Consent.createGDPRConsent(false));

        consentState.getGDPRConsentState().should.have.property('foo');

        delete consentState.getGDPRConsentState().foo;

        consentState.getGDPRConsentState().should.have.property('foo');

        done();
    });

    it('Should copy GDPR ConsentState object', function(done) {
        var consentState = Consent.createConsentState();
        should.exist(consentState);

        consentState
            .addGDPRConsentState('foo', Consent.createGDPRConsent(true))
            .addGDPRConsentState('bar', Consent.createGDPRConsent(false));

        var consentState2 = Consent.createConsentState(consentState);

        consentState2.addGDPRConsentState('baz', Consent.createGDPRConsent(false));

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState.getGDPRConsentState().foo.should.have.property('Consented', true);
        consentState.getGDPRConsentState().should.have.property('bar');
        consentState.getGDPRConsentState().bar.should.have.property('Consented', false);
        consentState.getGDPRConsentState().should.not.have.property('baz');

        consentState2.getGDPRConsentState().should.have.property('foo');
        consentState2.getGDPRConsentState().foo.should.have.property('Consented', true);
        consentState2.getGDPRConsentState().should.have.property('bar');
        consentState2.getGDPRConsentState().bar.should.have.property('Consented', false);
        consentState2.getGDPRConsentState().should.have.property('baz');
        consentState2.getGDPRConsentState().baz.should.have.property('Consented', false);

        done();
    });

    it('Should remove GDPR ConsentState object', function(done) {
        var consentState = Consent.createConsentState();
        should.exist(consentState);

        consentState
            .addGDPRConsentState('foo', Consent.createGDPRConsent(true))
            .addGDPRConsentState('bar', Consent.createGDPRConsent(false));

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState.getGDPRConsentState().should.have.property('bar');

        consentState.removeGDPRConsentState('bar');

        consentState.getGDPRConsentState().should.not.have.property('bar');
        consentState.getGDPRConsentState().should.have.property('foo');
        done();
    });

    it('Should normalize GDPR consent purposes on add', function(done) {
        var consentState = Consent.createConsentState();
        should.exist(consentState);

        consentState
            .addGDPRConsentState('foo', Consent.createGDPRConsent(true, 1))
            .addGDPRConsentState('bar ', Consent.createGDPRConsent(true, 2))
            .addGDPRConsentState('BAZ ', Consent.createGDPRConsent(false, 3))
            .addGDPRConsentState('  ', Consent.createGDPRConsent(false, 4));

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState.getGDPRConsentState().should.have.property('bar');
        consentState.getGDPRConsentState().should.have.property('baz');
        consentState.getGDPRConsentState().should.not.have.property('  ');
        consentState.getGDPRConsentState().foo.should.have.property('Timestamp', 1);
        consentState.getGDPRConsentState().should.not.have.property('bar ');
        consentState.getGDPRConsentState().bar.should.have.property('Timestamp', 2);
        consentState.getGDPRConsentState().should.not.have.property('BAZ ');
        consentState.getGDPRConsentState().baz.should.have.property('Timestamp', 3);

        done();
    });

    it('Should normalize GDPR consent purposes on remove', function(done) {
        var consentState = Consent.createConsentState();
        should.exist(consentState);

        consentState
            .addGDPRConsentState('foo', Consent.createGDPRConsent(true, 1))
            .addGDPRConsentState('bar ', Consent.createGDPRConsent(true, 2))
            .addGDPRConsentState('BAZ ', Consent.createGDPRConsent(false, 3));

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState.getGDPRConsentState().should.have.property('bar');
        consentState.getGDPRConsentState().should.have.property('baz');

        consentState.removeGDPRConsentState('FOO');
        consentState.removeGDPRConsentState('bAr   ');
        consentState.removeGDPRConsentState(' bAz ');

        consentState.getGDPRConsentState().should.not.have.property('foo');
        consentState.getGDPRConsentState().should.not.have.property('bar');
        consentState.getGDPRConsentState().should.not.have.property('baz');

        done();
    });

    it('Should not set junk GDPR object', function(done) {
        var consentState = Consent.createConsentState();
        should.exist(consentState);

        consentState
            .addGDPRConsentState('foo', Consent.createGDPRConsent(true))
            .addGDPRConsentState('bar', {})
            .addGDPRConsentState('baz', '')
            .addGDPRConsentState(10, {});

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState.getGDPRConsentState().should.not.have.property('bar');
        consentState.getGDPRConsentState().should.not.have.property('baz');
        consentState.getGDPRConsentState().should.not.have.property(10);

        done();
    });

    it('Should toJson/fromJson complete Consent State object', function(done) {
        var consent1 = Consent.createGDPRConsent(
            true,
            10,
            'foo document',
            'foo location',
            'foo hardware id');


        var consent2 = Consent.createGDPRConsent(
            false,
            5,
            'foo document 2',
            'foo location 2',
            'foo hardware id 2');

        var consentState = Consent.createConsentState();
        consentState.addGDPRConsentState('foo', consent1);
        consentState.addGDPRConsentState('bar', consent2);

        var consentStateCopy = Consent.Serialization.fromMinifiedJsonObject(
            Consent.Serialization.toMinifiedJsonObject(consentState)
        );

        consentStateCopy.getGDPRConsentState().should.have.property('foo');
        var consentCopy1 = consentStateCopy.getGDPRConsentState().foo;

        consentCopy1.should.have.property('Consented', true);
        consentCopy1.should.have.property('Timestamp', 10);
        consentCopy1.should.have.property('ConsentDocument', 'foo document');
        consentCopy1.should.have.property('Location', 'foo location');
        consentCopy1.should.have.property('HardwareId', 'foo hardware id');

        consentStateCopy.getGDPRConsentState().should.have.property('bar');
        var consentCopy2 = consentStateCopy.getGDPRConsentState().bar;
        
        consentCopy2.should.have.property('Consented', false);
        consentCopy2.should.have.property('Timestamp', 5);
        consentCopy2.should.have.property('ConsentDocument', 'foo document 2');
        consentCopy2.should.have.property('Location', 'foo location 2');
        consentCopy2.should.have.property('HardwareId', 'foo hardware id 2');

        done();
    });

});
