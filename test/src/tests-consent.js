import Utils from './utils';
import sinon from 'sinon';
import { urls } from './config';
import { apiKey, MPConfig, testMPID } from './config';

var getEvent = Utils.getEvent,
    mockServer;

describe('Consent', function() {
    beforeEach(function() {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.events, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, Store: {}})
        ]);
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.restore();
        mParticle._resetForTests(MPConfig);
    });

    it('Should not create consent object without consented boolean', function(done) {
        var consent = mParticle.Consent.createGDPRConsent();
        (consent === null).should.be.ok();

        consent = mParticle.Consent.createGDPRConsent(0);

        consent = mParticle.Consent.createGDPRConsent('foo bar');
        (consent === null).should.be.ok();

        done();
    });

    it('Should create basic consent object with only consented boolean', function(done) {
        var consent = mParticle.Consent.createGDPRConsent(true);
        consent.should.be.ok();

        consent.Consented.should.equal(true);

        consent = mParticle.Consent.createGDPRConsent(false);
        consent.should.be.ok();
        consent.Consented.should.equal(false);
        done();
    });

    it('Should not create consent object with invalid document', function(done) {
        var badDocument = 123;
        var consent = mParticle
            .getInstance()
            .Consent.createGDPRConsent(true, 123, badDocument);
        (consent === null).should.be.ok();

        done();
    });

    it('Should not create consent object with invalid location', function(done) {
        var badLocation = 123;
        var consent = mParticle
            .getInstance()
            .Consent.createGDPRConsent(true, 123, 'foo document', badLocation);
        (consent === null).should.be.ok();

        done();
    });

    it('Should not create consent object with invalid hardware id', function(done) {
        var badHardwareId = 123;
        var consent = mParticle
            .getInstance()
            .Consent.createGDPRConsent(
                true,
                123,
                'foo document',
                'foo location',
                badHardwareId
            );
        (consent === null).should.be.ok();

        done();
    });

    it('Should set current timestamp if none given', function(done) {
        var date = Date.now();
        var consent = mParticle.Consent.createGDPRConsent(true);
        consent.Timestamp.should.be.aboveOrEqual(date);
        done();
    });

    it('Should create complete object', function(done) {
        var consent = mParticle
            .getInstance()
            .Consent.createGDPRConsent(
                true,
                10,
                'foo document',
                'foo location',
                'foo hardware id'
            );
        consent.should.be.ok();
        consent.should.have.property('Consented', true);
        consent.should.have.property('Timestamp', 10);
        consent.should.have.property('ConsentDocument', 'foo document');
        consent.should.have.property('Location', 'foo location');
        consent.should.have.property('HardwareId', 'foo hardware id');
        done();
    });
    // to here
    it('Should create basic ConsentState object', function(done) {
        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.should.be.ok();
        done();
    });

    it('Should add GDPR ConsentState object', function(done) {
        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.should.be.ok();

        consentState
            .addGDPRConsentState(
                'foo',
                mParticle.Consent.createGDPRConsent(true)
            )
            .addGDPRConsentState(
                'bar',
                mParticle.Consent.createGDPRConsent(false)
            );

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState
            .getGDPRConsentState()
            .foo.should.have.property('Consented', true);
        (consentState.GDPR === undefined).should.be.ok();

        consentState.getGDPRConsentState().should.have.property('bar');
        consentState
            .getGDPRConsentState()
            .bar.should.have.property('Consented', false);

        done();
    });

    it('Should replace GDPR ConsentState object', function(done) {
        var consentState = mParticle.getInstance().Consent.createConsentState();
        var consentState2 = mParticle
            .getInstance()
            .Consent.createConsentState();

        consentState.addGDPRConsentState(
            'foo',
            mParticle.Consent.createGDPRConsent(true)
        );

        consentState2.addGDPRConsentState(
            'bar',
            mParticle.Consent.createGDPRConsent(false)
        );
        consentState2.addGDPRConsentState(
            'baz',
            mParticle.Consent.createGDPRConsent(false)
        );

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState2.getGDPRConsentState().should.have.property('bar');
        consentState2.getGDPRConsentState().should.have.property('baz');

        consentState.setGDPRConsentState(consentState2.getGDPRConsentState());

        consentState.getGDPRConsentState().should.not.have.property('foo');
        consentState.getGDPRConsentState().should.have.property('bar');
        consentState.getGDPRConsentState().should.have.property('baz');

        done();
    });

    it("Can't modify GDPR ConsentState object", function(done) {
        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.should.be.ok();

        consentState
            .addGDPRConsentState(
                'foo',
                mParticle.Consent.createGDPRConsent(true)
            )
            .addGDPRConsentState(
                'bar',
                mParticle.Consent.createGDPRConsent(false)
            );

        consentState.getGDPRConsentState().should.have.property('foo');

        delete consentState.getGDPRConsentState().foo;

        consentState.getGDPRConsentState().should.have.property('foo');

        done();
    });

    it('Should copy GDPR ConsentState object', function(done) {
        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.should.be.ok();

        consentState
            .addGDPRConsentState(
                'foo',
                mParticle.Consent.createGDPRConsent(true)
            )
            .addGDPRConsentState(
                'bar',
                mParticle.Consent.createGDPRConsent(false)
            );

        var consentState2 = mParticle
            .getInstance()
            .Consent.createConsentState(consentState);

        consentState2.addGDPRConsentState(
            'baz',
            mParticle.Consent.createGDPRConsent(false)
        );

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState
            .getGDPRConsentState()
            .foo.should.have.property('Consented', true);
        consentState.getGDPRConsentState().should.have.property('bar');
        consentState
            .getGDPRConsentState()
            .bar.should.have.property('Consented', false);
        consentState.getGDPRConsentState().should.not.have.property('baz');

        consentState2.getGDPRConsentState().should.have.property('foo');
        consentState2
            .getGDPRConsentState()
            .foo.should.have.property('Consented', true);
        consentState2.getGDPRConsentState().should.have.property('bar');
        consentState2
            .getGDPRConsentState()
            .bar.should.have.property('Consented', false);
        consentState2.getGDPRConsentState().should.have.property('baz');
        consentState2
            .getGDPRConsentState()
            .baz.should.have.property('Consented', false);

        done();
    });

    it('Should remove GDPR ConsentState object', function(done) {
        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.should.be.ok();

        consentState
            .addGDPRConsentState(
                'foo',
                mParticle.Consent.createGDPRConsent(true)
            )
            .addGDPRConsentState(
                'bar',
                mParticle.Consent.createGDPRConsent(false)
            );

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState.getGDPRConsentState().should.have.property('bar');

        consentState.removeGDPRConsentState('bar');

        consentState.getGDPRConsentState().should.not.have.property('bar');
        consentState.getGDPRConsentState().should.have.property('foo');
        done();
    });

    it('Should normalize GDPR consent purposes on add', function(done) {
        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.should.be.ok();

        consentState
            .addGDPRConsentState(
                'foo',
                mParticle.Consent.createGDPRConsent(true, 1)
            )
            .addGDPRConsentState(
                'bar ',
                mParticle.Consent.createGDPRConsent(true, 2)
            )
            .addGDPRConsentState(
                'BAZ ',
                mParticle.Consent.createGDPRConsent(false, 3)
            )
            .addGDPRConsentState(
                '  ',
                mParticle.Consent.createGDPRConsent(false, 4)
            );

        consentState.getGDPRConsentState().should.have.property('foo');
        consentState.getGDPRConsentState().should.have.property('bar');
        consentState.getGDPRConsentState().should.have.property('baz');
        consentState.getGDPRConsentState().should.not.have.property('  ');
        consentState
            .getGDPRConsentState()
            .foo.should.have.property('Timestamp', 1);
        consentState.getGDPRConsentState().should.not.have.property('bar ');
        consentState
            .getGDPRConsentState()
            .bar.should.have.property('Timestamp', 2);
        consentState.getGDPRConsentState().should.not.have.property('BAZ ');
        consentState
            .getGDPRConsentState()
            .baz.should.have.property('Timestamp', 3);

        done();
    });

    it('Should normalize GDPR consent purposes on remove', function(done) {
        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.should.be.ok();

        consentState
            .addGDPRConsentState(
                'foo',
                mParticle.Consent.createGDPRConsent(true, 1)
            )
            .addGDPRConsentState(
                'bar ',
                mParticle.Consent.createGDPRConsent(true, 2)
            )
            .addGDPRConsentState(
                'BAZ ',
                mParticle.Consent.createGDPRConsent(false, 3)
            );

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
        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.should.be.ok();

        consentState
            .addGDPRConsentState(
                'foo',
                mParticle.Consent.createGDPRConsent(true)
            )
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
        var consent1 = mParticle
            .getInstance()
            .Consent.createGDPRConsent(
                true,
                10,
                'foo document',
                'foo location',
                'foo hardware id'
            );

        var consent2 = mParticle
            .getInstance()
            .Consent.createGDPRConsent(
                false,
                5,
                'foo document 2',
                'foo location 2',
                'foo hardware id 2'
            );

        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.addGDPRConsentState('foo', consent1);
        consentState.addGDPRConsentState('bar', consent2);

        var consentStateCopy = mParticle
            .getInstance()
            ._Consent.ConsentSerialization.fromMinifiedJsonObject(
                mParticle
                    .getInstance()
                    ._Consent.ConsentSerialization.toMinifiedJsonObject(
                        consentState
                    )
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

    it('Should not create a CCPA consent object without consented boolean', function (done) {
        var consent = mParticle.Consent.createCCPAConsent();
        (consent === null).should.be.ok();

        consent = mParticle.Consent.createCCPAConsent(0);

        consent = mParticle.Consent.createCCPAConsent('foo bar');
        (consent === null).should.be.ok();

        done();
    });

    it('Should create basic consent object with only consented boolean', function (done) {
        var consent = mParticle.Consent.createCCPAConsent(true);
        consent.should.be.ok();

        consent.Consented.should.equal(true);

        consent = mParticle.Consent.createCCPAConsent(false);
        consent.should.be.ok();
        consent.Consented.should.equal(false);
        done();
    });

    it('Should not create consent object with invalid document', function (done) {
        var badDocument = 123;
        var consent = mParticle
            .getInstance()
            .Consent.createCCPAConsent(true, 123, badDocument);
        (consent === null).should.be.ok();

        done();
    });

    it('Should not create consent object with invalid location', function (done) {
        var badLocation = 123;
        var consent = mParticle
            .getInstance()
            .Consent.createCCPAConsent(true, 123, 'foo document', badLocation);
        (consent === null).should.be.ok();

        done();
    });

    it('Should not create consent object with invalid hardware id', function (done) {
        var badHardwareId = 123;
        var consent = mParticle
            .getInstance()
            .Consent.createCCPAConsent(
                true,
                123,
                'foo document',
                'foo location',
                badHardwareId
            );
        (consent === null).should.be.ok();

        done();
    });

    it('Should set current timestamp if none given', function (done) {
        var date = Date.now();
        var consent = mParticle.Consent.createCCPAConsent(true);
        consent.Timestamp.should.be.aboveOrEqual(date);
        done();
    });

    it('Should create complete CCPA consent object', function (done) {
        var consent = mParticle
            .getInstance()
            .Consent.createCCPAConsent(
                true,
                10,
                'foo document',
                'foo location',
                'foo hardware id'
            );
        consent.should.be.ok();
        consent.should.have.property('Consented', true);
        consent.should.have.property('Timestamp', 10);
        consent.should.have.property('ConsentDocument', 'foo document');
        consent.should.have.property('Location', 'foo location');
        consent.should.have.property('HardwareId', 'foo hardware id');

        done();
    });

    it('Should set CCPA ConsentState object', function (done) {
        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.should.be.ok();

        consentState
            .setCCPAConsentState(
                mParticle.Consent.createCCPAConsent(false)
            );

        consentState.getCCPAConsentState().should.have.properties('Consented', 'ConsentDocument', 'HardwareId', 'Location', 'Timestamp');

        done();
    });

    it('Should remove CCPA ConsentState object', function (done) {
        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.should.be.ok();

        consentState
            .setCCPAConsentState(
                mParticle.Consent.createCCPAConsent(false)
            );

        consentState.getCCPAConsentState().should.have.properties('Consented', 'ConsentDocument', 'HardwareId', 'Location', 'Timestamp');
        consentState.removeCCPAState();
        (consentState.getCCPAConsentState() === undefined).should.equal(true);

        done();
    });

    it('should have CCPA in payload', function(done) {
        var consentState = mParticle.Consent.createConsentState();
        var timestamp = new Date().getTime();
        var ccpaConsent = mParticle.Consent.createCCPAConsent(true, timestamp, 'consentDoc', 'location', 'hardware');
        consentState.setCCPAConsentState(ccpaConsent);
        var user = mParticle.Identity.getCurrentUser()
        user.setConsentState(consentState)

        mParticle.logEvent('test');
        var event = getEvent(mockServer.requests, 'test')

        event.should.have.property('con');
        event.con.should.have.property('ccpa');
        event.con.ccpa.should.have.property('data_sale_opt_out');
        event.con.ccpa.data_sale_opt_out.should.have.property('c', true);
        event.con.ccpa.data_sale_opt_out.should.have.property('ts', timestamp);
        event.con.ccpa.data_sale_opt_out.should.have.property('d', 'consentDoc');
        event.con.ccpa.data_sale_opt_out.should.have.property('l', 'location');
        event.con.ccpa.data_sale_opt_out.should.have.property('h', 'hardware');

        done();
    })

    it('should have CCPA and GDPR in payload', function(done) {
        var consentState = mParticle.Consent.createConsentState();
        var timestamp = new Date().getTime();
        var ccpaConsent = mParticle.Consent.createCCPAConsent(true, timestamp, 'consentDoc', 'location', 'hardware');
        var gdprConsent = mParticle.Consent.createGDPRConsent(false, timestamp, 'consentDoc', 'location', 'hardware');
        consentState.setCCPAConsentState(ccpaConsent);
        consentState.addGDPRConsentState('test purpose', gdprConsent);
        var user = mParticle.Identity.getCurrentUser()
        user.setConsentState(consentState)

        mParticle.logEvent('test');
        var event = getEvent(mockServer.requests, 'test')

        event.should.have.property('con');
        event.con.should.have.property('ccpa');
        event.con.ccpa.should.have.property('data_sale_opt_out');
        event.con.ccpa.data_sale_opt_out.should.have.property('c', true);
        event.con.ccpa.data_sale_opt_out.should.have.property('ts', timestamp);
        event.con.ccpa.data_sale_opt_out.should.have.property('d', 'consentDoc');
        event.con.ccpa.data_sale_opt_out.should.have.property('l', 'location');
        event.con.ccpa.data_sale_opt_out.should.have.property('h', 'hardware');

        event.con.should.have.property('gdpr');
        event.con.gdpr.should.have.property('test purpose');
        event.con.gdpr['test purpose'].should.have.property('c', false);
        event.con.gdpr['test purpose'].should.have.property('ts', timestamp);
        event.con.gdpr['test purpose'].should.have.property('d', 'consentDoc');
        event.con.gdpr['test purpose'].should.have.property('l', 'location');
        event.con.gdpr['test purpose'].should.have.property('h', 'hardware');

        done();
    })
});
