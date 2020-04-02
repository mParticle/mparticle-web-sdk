import Types from '../../src/types';
import Constants from '../../src/constants';
import { apiKey, MPConfig } from './config';

describe('Api Client', function() {
    beforeEach(function() {
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mParticle._resetForTests(MPConfig);
    });

    it('Should enable batching for ramp percentages', function(done) {
        mParticle.getInstance()._Store.SDKConfig.flags[
            Constants.FeatureFlags.EventsV3
        ] = 0;
        let result1 = mParticle.getInstance()._APIClient.shouldEnableBatching();
        result1.should.be.not.ok();

        mParticle.getInstance()._Store.SDKConfig.flags[
            Constants.FeatureFlags.EventsV3
        ] = null;
        let nullResult = mParticle
            .getInstance()
            ._APIClient.shouldEnableBatching();
        nullResult.should.be.not.ok();

        mParticle.getInstance()._Store.SDKConfig.flags[
            Constants.FeatureFlags.EventsV3
        ] = '100';
        let result2 = mParticle.getInstance()._APIClient.shouldEnableBatching();
        result2.should.be.ok();

        var fakeDeviceId = '946cdc15-3179-41fe-b777-4f3bf1ac0ddc';
        mParticle.getInstance()._Store.deviceId = fakeDeviceId; //this will hash/ramp to 28
        mParticle.getInstance()._Store.SDKConfig.flags[
            Constants.FeatureFlags.EventsV3
        ] = '28';

        let result3 = mParticle.getInstance()._APIClient.shouldEnableBatching();
        result3.should.be.ok();

        mParticle.getInstance()._Store.SDKConfig.flags[
            Constants.FeatureFlags.EventsV3
        ] = '27';
        let result4 = mParticle.getInstance()._APIClient.shouldEnableBatching();
        result4.should.not.be.ok();

        done();
    });

    it('Should update queued events with latest user info', function(done) {
        var event = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: { 'foo-attr': 'foo-val' },
            eventType: Types.EventType.Navigation,
            customFlags:{ 'foo-flag': 'foo-flag-val' }
        };

        mParticle.getInstance()._Store.should.be.ok();
        let sdkEvent1 = mParticle
            .getInstance()
            ._ServerModel.createEventObject(event);

        sdkEvent1.should.be.ok();
        Should(sdkEvent1.MPID).equal(null);
        Should(sdkEvent1.UserAttributes).equal(null);
        Should(sdkEvent1.UserIdentities).equal(null);
        Should(sdkEvent1.ConsentState).equal(null);

        let sdkEvent2 = mParticle
            .getInstance()
            ._ServerModel.createEventObject(event);

        sdkEvent2.should.be.ok();
        Should(sdkEvent2.MPID).equal(null);
        Should(sdkEvent2.UserAttributes).equal(null);
        Should(sdkEvent2.UserIdentities).equal(null);
        Should(sdkEvent2.ConsentState).equal(null);

        var consentState = mParticle.getInstance().Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo',
            mParticle
                .getInstance()
                .Consent.createGDPRConsent(
                    true,
                    10,
                    'foo document',
                    'foo location',
                    'foo hardware id'
                )
        );

        window.mParticle.getInstance().Identity.getCurrentUser = () => {
            return {
                getUserIdentities: () => {
                    return {
                        userIdentities: {
                            customerid: '1234567',
                            email: 'foo-email',
                            other: 'foo-other',
                            other2: 'foo-other2',
                            other3: 'foo-other3',
                            other4: 'foo-other4',
                        },
                    };
                },
                getAllUserAttributes: () => {
                    return {
                        'foo-user-attr': 'foo-attr-value',
                        'foo-user-attr-list': ['item1', 'item2'],
                    };
                },
                getMPID: () => {
                    return '98765';
                },
                getConsentState: () => {
                    return consentState;
                },
            };
        };

        mParticle
            .getInstance()
            ._APIClient.appendUserInfoToEvents(
                window.mParticle.Identity.getCurrentUser(),
                [sdkEvent1, sdkEvent2]
            );

        sdkEvent1.UserIdentities.length.should.equal(6);
        Object.keys(sdkEvent2.UserAttributes).length.should.equal(2);
        sdkEvent1.MPID.should.equal('98765');
        sdkEvent1.ConsentState.should.not.equal(null);

        sdkEvent2.UserIdentities.length.should.equal(6);
        Object.keys(sdkEvent2.UserAttributes).length.should.equal(2);
        sdkEvent2.MPID.should.equal('98765');
        sdkEvent2.ConsentState.should.not.equal(null);

        done();
    });

    it('should return true when events v3 endpoing is "100"', function(done) {
        mParticle.getInstance()._Store.SDKConfig.flags = {
            eventBatchingIntervalMillis: '0',
            eventsV3: '100',
        };
        var batchingEnabled = mParticle.getInstance()._APIClient.shouldEnableBatching();

        batchingEnabled.should.equal(true);

        done();
    });
});
