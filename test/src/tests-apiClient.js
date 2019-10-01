import ApiClient from '../../src/apiClient';
import ServerModel from '../../src/serverModel';
import Types from '../../src/types';
import Consent from '../../src/consent';
import Constants from '../../src/constants';

describe('Api Client', function () {
    it('Should enable batching for ramp percentages', function(done) {
        mParticle.Store.SDKConfig.flags[Constants.FeatureFlags.EventsV3] = 0;
        let result1 = ApiClient.shouldEnableBatching();
        result1.should.be.not.ok();

        mParticle.Store.SDKConfig.flags[Constants.FeatureFlags.EventsV3] = null;
        let nullResult = ApiClient.shouldEnableBatching();
        nullResult.should.be.not.ok();

        mParticle.Store.SDKConfig.flags[Constants.FeatureFlags.EventsV3] = 100;
        let result2 = ApiClient.shouldEnableBatching();
        result2.should.be.ok();

        var fakeDeviceId = '946cdc15-3179-41fe-b777-4f3bf1ac0ddc';
        mParticle.Store.deviceId = fakeDeviceId; //this will hash/ramp to 28
        mParticle.Store.SDKConfig.flags[Constants.FeatureFlags.EventsV3] = 28;
        let result3 = ApiClient.shouldEnableBatching();
        result3.should.be.ok();

        mParticle.Store.SDKConfig.flags[Constants.FeatureFlags.EventsV3] = 27;
        let result4 = ApiClient.shouldEnableBatching();
        result4.should.not.be.ok();

        done();
    });
    
    it('Should update queued events with latest user info', function(done) {
        
        mParticle.Store.should.be.ok();

        let sdkEvent1 = ServerModel.createEventObject(
            Types.MessageType.PageEvent, 
            'foo page', 
            {'foo-attr':'foo-val'}, 
            Types.EventType.Navigation, 
            {'foo-flag': 'foo-flag-val'});

        sdkEvent1.should.be.ok();
        Should(sdkEvent1.MPID).equal(null);
        Should(sdkEvent1.UserAttributes).equal(null);
        Should(sdkEvent1.UserIdentities).equal(null);
        Should(sdkEvent1.ConsentState).equal(null);

        let sdkEvent2 = ServerModel.createEventObject(
            Types.MessageType.PageEvent, 
            'foo page', 
            {'foo-attr':'foo-val'}, 
            Types.EventType.Navigation, 
            {'foo-flag': 'foo-flag-val'});

        sdkEvent2.should.be.ok();
        Should(sdkEvent2.MPID).equal(null);
        Should(sdkEvent2.UserAttributes).equal(null);
        Should(sdkEvent2.UserIdentities).equal(null);
        Should(sdkEvent2.ConsentState).equal(null);
        
        var consentState = Consent.createConsentState();
        consentState.addGDPRConsentState('foo', Consent.createGDPRConsent(
            true,
            10,
            'foo document',
            'foo location',
            'foo hardware id'));

        window.mParticle.Identity.getCurrentUser = () => {
            return {
                getUserIdentities: () => {
                    return {    
                        userIdentities: { 
                            customerid:'1234567',
                            email: 'foo-email',
                            other: 'foo-other',
                            other2: 'foo-other2',
                            other3: 'foo-other3',
                            other4: 'foo-other4'
                        }
                    };
                },
                getAllUserAttributes: () => {
                    return {    
                        'foo-user-attr':'foo-attr-value',
                        'foo-user-attr-list':['item1', 'item2']
                    };
                },
                getMPID: () => {
                    return '98765';
                },
                getConsentState: () => {
                    return consentState;
                }
            };
        };

        ApiClient.appendUserInfoToEvents(window.mParticle.Identity.getCurrentUser(), [sdkEvent1, sdkEvent2]);

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

});