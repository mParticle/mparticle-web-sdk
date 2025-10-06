import Utils from './config/utils';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import { expect } from 'chai';
import { GDPRConsentState, PrivacyConsentState } from '@mparticle/web-sdk';
import { Dictionary } from '../../src/utils';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
const { hasIdentifyReturned, waitForCondition, fetchMockSuccess } = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
        fetchMock: any;
    }
}

type GDPRConsentStateDictionary = Dictionary<GDPRConsentState>;

const BadBoolean = (0 as unknown) as boolean;
const BadNumberAsString = (10 as unknown) as string;
const BadStringBoolean = ('foo bar' as unknown) as boolean;
const EmptyObjectAsPrivacyConsentState = ({} as unknown) as PrivacyConsentState;
const EmptyStringAsPrivacyConsentState = ('' as unknown) as PrivacyConsentState;

const findBatch = Utils.findBatch;

const mParticle = window.mParticle;

describe('Consent', function() {
    beforeEach(function() {
        fetchMock.post(urls.events, 200);
        fetchMockSuccess(urls.identify, {
            mpid: testMPID, is_logged_in: false
        });

        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        fetchMock.restore();
        mParticle._resetForTests(MPConfig);
    });

    it('Should not create consent object without consented boolean', done => {
        let consent = mParticle.Consent.createGDPRConsent(null);
        expect(consent === null).to.be.ok;

        consent = mParticle.Consent.createGDPRConsent(BadBoolean);

        consent = mParticle.Consent.createGDPRConsent(BadStringBoolean);
        expect(consent === null).to.be.ok;

        done();
    });

    it('Should create basic consent object with only consented boolean', done => {
        let consent = mParticle.Consent.createGDPRConsent(true);
        expect(consent).to.be.ok;

        consent.Consented.should.equal(true);

        consent = mParticle.Consent.createGDPRConsent(false);
        expect(consent).to.be.ok;
        consent.Consented.should.equal(false);
        done();
    });

    it('Should not create consent object with invalid document', done => {
        const badDocument = (123 as unknown) as string;
        const consent = mParticle
            .getInstance()
            .Consent.createGDPRConsent(true, 123, badDocument);
        expect(consent === null).to.be.ok;

        done();
    });

    it('Should not create consent object with invalid location', done => {
        const badLocation = (123 as unknown) as string;
        const consent = mParticle
            .getInstance()
            .Consent.createGDPRConsent(true, 123, 'foo document', badLocation);
        expect(consent === null).to.be.ok;

        done();
    });

    it('Should not create consent object with invalid hardware id', done => {
        const badHardwareId = (123 as unknown) as string;
        const consent = mParticle
            .getInstance()
            .Consent.createGDPRConsent(
                true,
                123,
                'foo document',
                'foo location',
                badHardwareId
            );
        expect(consent === null).to.be.ok;

        done();
    });

    it('Should set current timestamp if none given', done => {
        const date = Date.now();
        const consent = mParticle.Consent.createGDPRConsent(true);
        expect(consent.Timestamp).to.be.greaterThanOrEqual(date);
        done();
    });

    it('Should create complete object', done => {
        const consent = mParticle
            .getInstance()
            .Consent.createGDPRConsent(
                true,
                10,
                'foo document',
                'foo location',
                'foo hardware id'
            );
        expect(consent).to.be.ok;
        consent.should.have.property('Consented', true);
        consent.should.have.property('Timestamp', 10);
        consent.should.have.property('ConsentDocument', 'foo document');
        consent.should.have.property('Location', 'foo location');
        consent.should.have.property('HardwareId', 'foo hardware id');
        done();
    });

    it('Should create basic ConsentState object', done => {
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        expect(consentState).to.be.ok;
        done();
    });

    it('Should add GDPR ConsentState object', done => {
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        expect(consentState).to.be.ok;

        consentState
            .addGDPRConsentState(
                'foo',
                mParticle.Consent.createGDPRConsent(true)
            )
            .addGDPRConsentState(
                'bar',
                mParticle.Consent.createGDPRConsent(false)
            );

        expect(consentState.getGDPRConsentState()).to.have.property('foo');

        // FIXME: getGDPRConsentState should return a dictionary of consent states
        //        rather than a consent state
        expect(consentState.getGDPRConsentState().foo).to.have.property(
            'Consented',
            true
        );

        // Test is verifying that attribute GDPR does not exist in ConsentState
        // but this makes TypeScript mad.
        expect((consentState as any).GDPR === undefined).to.be.ok;

        expect(consentState.getGDPRConsentState()).to.have.property('bar');
        expect(consentState.getGDPRConsentState().bar).to.have.property(
            'Consented',
            false
        );

        done();
    });

    it('Should replace GDPR ConsentState object', done => {
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        const consentState2 = mParticle
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

    it('should not be able to modify GDPR ConsentState object', done => {
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        expect(consentState).to.be.ok;

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

    it('Should copy GDPR ConsentState object', done => {
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        expect(consentState).to.be.ok;

        consentState
            .addGDPRConsentState(
                'foo',
                mParticle.Consent.createGDPRConsent(true)
            )
            .addGDPRConsentState(
                'bar',
                mParticle.Consent.createGDPRConsent(false)
            );

        const consentState2 = mParticle
            .getInstance()
            .Consent.createConsentState(consentState);

        consentState2.addGDPRConsentState(
            'baz',
            mParticle.Consent.createGDPRConsent(false)
        );

        expect(consentState.getGDPRConsentState()).to.have.property('foo');
        expect(consentState.getGDPRConsentState().foo).to.have.property(
            'Consented',
            true
        );
        consentState.getGDPRConsentState().should.have.property('bar');
        expect(consentState.getGDPRConsentState().bar).to.have.property(
            'Consented',
            false
        );
        consentState.getGDPRConsentState().should.not.have.property('baz');

        consentState2.getGDPRConsentState().should.have.property('foo');
        expect(consentState2.getGDPRConsentState().foo).to.have.property(
            'Consented',
            true
        );
        consentState2.getGDPRConsentState().should.have.property('bar');
        expect(consentState2.getGDPRConsentState().bar).to.have.property(
            'Consented',
            false
        );
        consentState2.getGDPRConsentState().should.have.property('baz');
        expect(consentState2.getGDPRConsentState().baz).to.have.property(
            'Consented',
            false
        );

        done();
    });

    it('Should remove GDPR ConsentState object', done => {
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        expect(consentState).to.be.ok;

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

    it('Should normalize GDPR consent purposes on add', done => {
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        expect(consentState).to.be.ok;

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

        const gdprConsentState = consentState.getGDPRConsentState();

        expect(gdprConsentState).to.have.property('foo');
        expect(gdprConsentState).to.have.property('bar');
        expect(gdprConsentState).to.have.property('baz');
        expect(gdprConsentState).to.not.have.property('  ');
        expect(gdprConsentState.foo).to.have.property('Timestamp', 1);
        expect(gdprConsentState).to.not.have.property('bar ');
        expect(gdprConsentState.bar).to.have.property('Timestamp', 2);
        expect(gdprConsentState).to.not.have.property('BAZ ');
        expect(gdprConsentState.baz).to.have.property('Timestamp', 3);

        done();
    });

    it('Should normalize GDPR consent purposes on remove', done => {
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        expect(consentState).to.be.ok;

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

        const gdprConsentState = consentState.getGDPRConsentState();

        expect(gdprConsentState).to.have.property('foo');
        expect(gdprConsentState).to.have.property('bar');
        expect(gdprConsentState).to.have.property('baz');

        consentState.removeGDPRConsentState('FOO');
        consentState.removeGDPRConsentState('bAr   ');
        consentState.removeGDPRConsentState(' bAz ');

        // Fetch an updated version of the consent state to verify attributes were removed
        const gdprConsentStateUpdate = consentState.getGDPRConsentState();

        expect(gdprConsentStateUpdate).to.not.have.property('foo');
        expect(gdprConsentStateUpdate).to.not.have.property('bar');
        expect(gdprConsentStateUpdate).to.not.have.property('baz');

        done();
    });

    it('Should not set junk GDPR object', done => {
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        expect(consentState).to.be.ok;

        consentState
            .addGDPRConsentState(
                'foo',
                mParticle.Consent.createGDPRConsent(true)
            )
            .addGDPRConsentState('bar', EmptyObjectAsPrivacyConsentState)
            .addGDPRConsentState('baz', EmptyStringAsPrivacyConsentState)
            .addGDPRConsentState(
                BadNumberAsString,
                EmptyObjectAsPrivacyConsentState
            );

        expect(consentState.getGDPRConsentState()).to.have.property('foo');
        expect(consentState.getGDPRConsentState()).to.not.have.property('bar');
        expect(consentState.getGDPRConsentState()).to.not.have.property('baz');
        expect(consentState.getGDPRConsentState()).to.not.have.property(
            (10 as unknown) as string
        );

        done();
    });

    it('Should toJson/fromJson complete Consent State object', done => {
        const consent1 = mParticle
            .getInstance()
            .Consent.createGDPRConsent(
                true,
                10,
                'foo document',
                'foo location',
                'foo hardware id'
            );

        const consent2 = mParticle
            .getInstance()
            .Consent.createGDPRConsent(
                false,
                5,
                'foo document 2',
                'foo location 2',
                'foo hardware id 2'
            );

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        consentState.addGDPRConsentState('foo', consent1);
        consentState.addGDPRConsentState('bar', consent2);

        const consentStateCopy = mParticle
            .getInstance()
            ._Consent.ConsentSerialization.fromMinifiedJsonObject(
                mParticle
                    .getInstance()
                    ._Consent.ConsentSerialization.toMinifiedJsonObject(
                        consentState
                    )
            );

        consentStateCopy.getGDPRConsentState().should.have.property('foo');
        const consentCopy1 = ((consentStateCopy.getGDPRConsentState() as unknown) as GDPRConsentStateDictionary)
            .foo;

        consentCopy1.should.have.property('Consented', true);
        consentCopy1.should.have.property('Timestamp', 10);
        consentCopy1.should.have.property('ConsentDocument', 'foo document');
        consentCopy1.should.have.property('Location', 'foo location');
        consentCopy1.should.have.property('HardwareId', 'foo hardware id');

        consentStateCopy.getGDPRConsentState().should.have.property('bar');
        const consentCopy2 = ((consentStateCopy.getGDPRConsentState() as unknown) as GDPRConsentStateDictionary)
            .bar;

        consentCopy2.should.have.property('Consented', false);
        consentCopy2.should.have.property('Timestamp', 5);
        consentCopy2.should.have.property('ConsentDocument', 'foo document 2');
        consentCopy2.should.have.property('Location', 'foo location 2');
        consentCopy2.should.have.property('HardwareId', 'foo hardware id 2');

        done();
    });

    it('Should not create a CCPA consent object without consented boolean', done => {
        let consent = mParticle.Consent.createCCPAConsent(null);
        expect(consent === null).to.be.ok;

        consent = mParticle.Consent.createCCPAConsent(BadBoolean);

        consent = mParticle.Consent.createCCPAConsent(BadStringBoolean);
        expect(consent === null).to.be.ok;

        done();
    });

    it('Should create basic consent object with only consented boolean', done => {
        let consent = mParticle.Consent.createCCPAConsent(true);
        expect(consent).to.be.ok;

        consent.Consented.should.equal(true);

        consent = mParticle.Consent.createCCPAConsent(false);
        expect(consent).to.be.ok;
        consent.Consented.should.equal(false);
        done();
    });

    it('Should not create consent object with invalid document', done => {
        const badDocument = (123 as unknown) as string;
        const consent = mParticle
            .getInstance()
            .Consent.createCCPAConsent(true, 123, badDocument);
        expect(consent === null).to.be.ok;

        done();
    });

    it('Should not create consent object with invalid location', done => {
        const badLocation = (123 as unknown) as string;
        const consent = mParticle
            .getInstance()
            .Consent.createCCPAConsent(true, 123, 'foo document', badLocation);
        expect(consent === null).to.be.ok;

        done();
    });

    it('Should not create consent object with invalid hardware id', done => {
        const badHardwareId = (123 as unknown) as string;
        const consent = mParticle
            .getInstance()
            .Consent.createCCPAConsent(
                true,
                123,
                'foo document',
                'foo location',
                badHardwareId
            );
        expect(consent === null).to.be.ok;

        done();
    });

    it('Should set current timestamp if none given', done => {
        const date = Date.now();
        const consent = mParticle.Consent.createCCPAConsent(true);
        expect(consent.Timestamp).to.be.greaterThanOrEqual(date);
        done();
    });

    it('Should create complete CCPA consent object', done => {
        const consent = mParticle
            .getInstance()
            .Consent.createCCPAConsent(
                true,
                10,
                'foo document',
                'foo location',
                'foo hardware id'
            );
        expect(consent).to.be.ok;
        consent.should.have.property('Consented', true);
        consent.should.have.property('Timestamp', 10);
        consent.should.have.property('ConsentDocument', 'foo document');
        consent.should.have.property('Location', 'foo location');
        consent.should.have.property('HardwareId', 'foo hardware id');

        done();
    });

    it('Should set CCPA ConsentState object', done => {
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        expect(consentState).to.be.ok;

        consentState.setCCPAConsentState(
            mParticle.Consent.createCCPAConsent(false)
        );

        expect(consentState.getCCPAConsentState()).to.have.property(
            'Consented'
        );
        expect(consentState.getCCPAConsentState()).to.have.property(
            'ConsentDocument'
        );
        expect(consentState.getCCPAConsentState()).to.have.property(
            'HardwareId'
        );
        expect(consentState.getCCPAConsentState()).to.have.property('Location');
        expect(consentState.getCCPAConsentState()).to.have.property(
            'Timestamp'
        );

        done();
    });

    it('Should remove CCPA ConsentState object', done => {
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        expect(consentState).to.be.ok;

        consentState.setCCPAConsentState(
            mParticle.Consent.createCCPAConsent(false)
        );

        expect(consentState.getCCPAConsentState()).to.have.property(
            'Consented'
        );
        expect(consentState.getCCPAConsentState()).to.have.property(
            'ConsentDocument'
        );
        expect(consentState.getCCPAConsentState()).to.have.property(
            'HardwareId'
        );
        expect(consentState.getCCPAConsentState()).to.have.property('Location');
        expect(consentState.getCCPAConsentState()).to.have.property(
            'Timestamp'
        );

        consentState.removeCCPAConsentState();
        expect(consentState.getCCPAConsentState() === undefined).to.equal(true);

        done();
    });

    it('should have CCPA in payload', async () => {
        const consentState = mParticle.Consent.createConsentState();
        const timestamp = new Date().getTime();
        const ccpaConsent = mParticle.Consent.createCCPAConsent(
            true,
            timestamp,
            'consentDoc',
            'location',
            'hardware'
        );
        consentState.setCCPAConsentState(ccpaConsent);

        await waitForCondition(hasIdentifyReturned);
        const user = mParticle.Identity.getCurrentUser();
        user.setConsentState(consentState);

        mParticle.logEvent('Test Event');
        const testEvent = findBatch(fetchMock.calls(), 'Test Event');

        testEvent.should.have.property('consent_state');
        testEvent.consent_state.should.have.property('ccpa');
        testEvent.consent_state.ccpa.should.have.property('data_sale_opt_out');
        testEvent.consent_state.ccpa.data_sale_opt_out.should.have.property('consented', true);
        testEvent.consent_state.ccpa.data_sale_opt_out.should.have.property('timestamp_unixtime_ms', timestamp);
        testEvent.consent_state.ccpa.data_sale_opt_out.should.have.property('document', 'consentDoc');
        testEvent.consent_state.ccpa.data_sale_opt_out.should.have.property('location', 'location');
        testEvent.consent_state.ccpa.data_sale_opt_out.should.have.property('hardware_id', 'hardware');
    });

    it('should have CCPA and GDPR in payload', async () => {
        const consentState = mParticle.Consent.createConsentState();
        const timestamp = new Date().getTime();
        const ccpaConsent = mParticle.Consent.createCCPAConsent(
            true,
            timestamp,
            'consentDoc',
            'location',
            'hardware'
        );
        const gdprConsent = mParticle.Consent.createGDPRConsent(
            false,
            timestamp,
            'consentDoc',
            'location',
            'hardware'
        );
        consentState.setCCPAConsentState(ccpaConsent);
        consentState.addGDPRConsentState('test purpose', gdprConsent);
        await waitForCondition(hasIdentifyReturned);

        const user = mParticle.Identity.getCurrentUser();
        user.setConsentState(consentState);
        
        
        mParticle.logEvent('Test Event');
        
        const testEvent = findBatch(fetchMock.calls(), 'Test Event');
        
        testEvent.should.have.property('consent_state');
        testEvent.consent_state.should.have.property('ccpa');
        testEvent.consent_state.ccpa.should.have.property('data_sale_opt_out');
        testEvent.consent_state.ccpa.data_sale_opt_out.should.have.property('consented', true);
        testEvent.consent_state.ccpa.data_sale_opt_out.should.have.property('timestamp_unixtime_ms', timestamp);
        testEvent.consent_state.ccpa.data_sale_opt_out.should.have.property('document', 'consentDoc');
        testEvent.consent_state.ccpa.data_sale_opt_out.should.have.property('location', 'location');
        testEvent.consent_state.ccpa.data_sale_opt_out.should.have.property('hardware_id', 'hardware');
        
        testEvent.consent_state.should.have.property('gdpr');
        testEvent.consent_state.gdpr.should.have.property('test purpose');
        testEvent.consent_state.gdpr['test purpose'].should.have.property('consented', false);
        testEvent.consent_state.gdpr['test purpose'].should.have.property('timestamp_unixtime_ms', timestamp);
        testEvent.consent_state.gdpr['test purpose'].should.have.property('document', 'consentDoc');
        testEvent.consent_state.gdpr['test purpose'].should.have.property('location', 'location');
        testEvent.consent_state.gdpr['test purpose'].should.have.property('hardware_id', 'hardware');
    });

    // TODO: Deprecate in next major version
    it('Should log deprecated message when using removeCCPAState', done => {
        const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');
        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
        expect(consentState).to.be.ok;

        consentState.setCCPAConsentState(
            mParticle.Consent.createCCPAConsent(false)
        );

        expect(consentState.getCCPAConsentState()).to.have.property(
            'Consented'
        );
        expect(consentState.getCCPAConsentState()).to.have.property(
            'ConsentDocument'
        );
        expect(consentState.getCCPAConsentState()).to.have.property(
            'HardwareId'
        );
        expect(consentState.getCCPAConsentState()).to.have.property('Location');
        expect(consentState.getCCPAConsentState()).to.have.property(
            'Timestamp'
        );

        // FIXME: Remove when deprecating removeCCPAState
        ((consentState as unknown) as any).removeCCPAState();
        (consentState.getCCPAConsentState() === undefined).should.equal(true);

        bond.called.should.eql(true);
        bond.getCalls()[0].args[0].should.eql(
            'removeCCPAState is deprecated and will be removed in a future release; use removeCCPAConsentState instead'
        );

        done();
    });
});