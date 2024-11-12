import Types from '../../src/types';
import { apiKey, MPConfig } from './config/constants';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import { expect } from 'chai';
import { IMParticleUser } from '../../src/identity-user-interfaces';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
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
            } as IMParticleUser;
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

    [undefined, null, new Date().getTime()].forEach(
        (batchTimestampUnixtimeMsOverride) => {
            it("sendEventToServer should update batchTimestampUnixtimeMsOverride", (done) => {
                const event = {
                    messageType: Types.MessageType.PageEvent,
                    name: "foo page",
                    data: { "foo-attr": "foo-val" },
                    eventType: Types.EventType.Navigation,
                    customFlags: { "foo-flag": "foo-flag-val" },
                };

                const options = { batchTimestampUnixtimeMsOverride };

                expect(mParticle.getInstance()._Store).to.be.ok;

                mParticle
                    .getInstance()
                    ._APIClient.sendEventToServer(event, options);

                expect(
                    mParticle.getInstance()._Store.batchTimestampUnixtimeMsOverride,
                ).to.equal(batchTimestampUnixtimeMsOverride);

                done();
            });
        },
    );


});