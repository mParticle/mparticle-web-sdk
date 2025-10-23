import Types from '../../src/types';
import { apiKey, MPConfig } from './config/constants';
import { expect } from 'chai';
import { IMParticleUser } from '../../src/identity-user-interfaces';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

const mParticle = window.mParticle;

describe.only('Api Client', () => {
    beforeEach(() => {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, mParticle.config);
    });

    it('should update queued events with latest user info', () => {
        const event = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: { 'foo-attr': 'foo-val' },
            eventType: Types.EventType.Navigation,
            customFlags: { 'foo-flag': 'foo-flag-val' },
        };

        const mpInstance = mParticle.getInstance();
        expect(mpInstance._Store).to.be.ok;
        
        const sdkEvent1 = mpInstance._ServerModel.createEventObject(event);
        const sdkEvent2 = mpInstance._ServerModel.createEventObject(event);

        expect(sdkEvent1).to.be.ok;
        expect(sdkEvent1.MPID).equal(null);
        expect(sdkEvent1.UserAttributes).equal(null);
        expect(sdkEvent1.UserIdentities).equal(null);
        expect(sdkEvent1.ConsentState).equal(null);

        expect(sdkEvent2).to.be.ok;
        expect(sdkEvent2.MPID).equal(null);
        expect(sdkEvent2.UserAttributes).equal(null);
        expect(sdkEvent2.UserIdentities).equal(null);
        expect(sdkEvent2.ConsentState).equal(null);

        const consentState = mpInstance.Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo',
            mpInstance.Consent.createGDPRConsent(
                true,
                10,
                'foo document',
                'foo location',
                'foo hardware id'
            )
        );

        const mockUser = {
            getUserIdentities: () => ({
                userIdentities: {
                    customerid: '1234567',
                    email: 'foo-email',
                    other: 'foo-other',
                    other2: 'foo-other2',
                    other3: 'foo-other3',
                    other4: 'foo-other4',
                },
            }),
            getAllUserAttributes: () => ({
                'foo-user-attr': 'foo-attr-value',
                'foo-user-attr-list': ['item1', 'item2'],
            }),
            getMPID: () => '98765',
            getConsentState: () => consentState,
        } as IMParticleUser;


        mpInstance._APIClient.appendUserInfoToEvents(mockUser, [sdkEvent1, sdkEvent2]);

        expect(sdkEvent1.UserIdentities.length).to.equal(6);
        expect(Object.keys(sdkEvent1.UserAttributes).length).to.equal(2);
        expect(sdkEvent1.MPID).to.equal('98765');
        expect(sdkEvent1.ConsentState).to.not.equal(null);

        expect(sdkEvent2.UserIdentities.length).to.equal(6);
        expect(Object.keys(sdkEvent2.UserAttributes).length).to.equal(2);
        expect(sdkEvent2.MPID).to.equal('98765');
        expect(sdkEvent2.ConsentState).to.not.equal(null);
    });
});