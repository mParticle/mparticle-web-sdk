import Types from '../../src/types';
import Constants from '../../src/constants';
import { apiKey, MPConfig } from './config';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import { expect } from 'chai';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

const mParticle = window.mParticle;

describe('Api Client', () => {
    beforeEach(() => {
        mParticle.init(apiKey, mParticle.config);
    });

    afterEach(() => {
        mParticle._resetForTests(MPConfig);
    });

    it('should enable batching for ramp percentages', done => {
        mParticle.getInstance()._Store.SDKConfig.flags[
            Constants.FeatureFlags.EventsV3
        ] = 0;
        let result1 = mParticle.getInstance()._APIClient.shouldEnableBatching();
        expect(result1).to.be.not.ok;

        mParticle.getInstance()._Store.SDKConfig.flags[
            Constants.FeatureFlags.EventsV3
        ] = null;
        let nullResult = mParticle
            .getInstance()
            ._APIClient.shouldEnableBatching();
        expect(nullResult).to.be.not.ok;

        mParticle.getInstance()._Store.SDKConfig.flags[
            Constants.FeatureFlags.EventsV3
        ] = '100';
        let result2 = mParticle.getInstance()._APIClient.shouldEnableBatching();
        expect(result2).to.be.ok;

        const fakeDeviceId = '946cdc15-3179-41fe-b777-4f3bf1ac0ddc';
        mParticle.getInstance()._Store.deviceId = fakeDeviceId; //this will hash/ramp to 28
        mParticle.getInstance()._Store.SDKConfig.flags[
            Constants.FeatureFlags.EventsV3
        ] = '28';

        let result3 = mParticle.getInstance()._APIClient.shouldEnableBatching();
        expect(result3).to.be.ok;

        mParticle.getInstance()._Store.SDKConfig.flags[
            Constants.FeatureFlags.EventsV3
        ] = '27';
        let result4 = mParticle.getInstance()._APIClient.shouldEnableBatching();
        expect(result4).to.not.be.ok;

        done();
    });

    it('should update queued events with latest user info', done => {
        const event = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: { 'foo-attr': 'foo-val' },
            eventType: Types.EventType.Navigation,
            customFlags: { 'foo-flag': 'foo-flag-val' },
        };

        expect(mParticle.getInstance()._Store).to.be.ok;
        let sdkEvent1 = mParticle
            .getInstance()
            ._ServerModel.createEventObject(event);

        expect(sdkEvent1).to.be.ok;
        expect(sdkEvent1.MPID).equal(null);
        expect(sdkEvent1.UserAttributes).equal(null);
        expect(sdkEvent1.UserIdentities).equal(null);
        expect(sdkEvent1.ConsentState).equal(null);

        let sdkEvent2 = mParticle
            .getInstance()
            ._ServerModel.createEventObject(event);

        expect(sdkEvent2).to.be.ok;
        expect(sdkEvent2.MPID).equal(null);
        expect(sdkEvent2.UserAttributes).equal(null);
        expect(sdkEvent2.UserIdentities).equal(null);
        expect(sdkEvent2.ConsentState).equal(null);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState();
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

        mParticle.getInstance().Identity.getCurrentUser = () => {
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
                mParticle.Identity.getCurrentUser(),
                [sdkEvent1, sdkEvent2]
            );

        expect(sdkEvent1.UserIdentities.length).to.equal(6);
        expect(Object.keys(sdkEvent2.UserAttributes).length).to.equal(2);
        expect(sdkEvent1.MPID).to.equal('98765');
        expect(sdkEvent1.ConsentState).to.not.equal(null);

        expect(sdkEvent2.UserIdentities.length).to.equal(6);
        expect(Object.keys(sdkEvent2.UserAttributes).length).to.equal(2);
        expect(sdkEvent2.MPID).to.equal('98765');
        expect(sdkEvent2.ConsentState).to.not.equal(null);

        done();
    });

    it('should return true when events v3 endpoint is "100"', done => {
        mParticle.getInstance()._Store.SDKConfig.flags = {
            eventBatchingIntervalMillis: '0',
            eventsV3: '100',
        };
        const batchingEnabled = mParticle
            .getInstance()
            ._APIClient.shouldEnableBatching();

        expect(batchingEnabled).to.equal(true);

        done();
    });
});
