import Constants from '../../src/constants';
import sinon from 'sinon';
import { expect } from 'chai';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey,
    testMPID,
    MPConfig,
} from './config/constants';
import Utils from './config/utils';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';

const { waitForCondition, fetchMockSuccess, deleteAllCookies } = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

const hasIdentifyReturned = () => {
    return window.mParticle.Identity.getCurrentUser()?.getMPID() === testMPID;
};

describe('feature-flags', function() {
    describe('user audiences', function() {
        beforeEach(function() {
            fetchMock.post(urls.events, 200);

            fetchMockSuccess(urls.identify, {
                mpid: testMPID, is_logged_in: false
            });

            window.mParticle.init(apiKey, window.mParticle.config);
        });

        afterEach(() => {
            sinon.restore();
            fetchMock.restore();
        });

        it('should not be able to access user audience API if feature flag is false', function() {
            window.mParticle.config.flags = {
                audienceAPI: 'False'
            };

            window.mParticle._resetForTests(MPConfig);

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then(() => {
            const bond = sinon.spy(window.mParticle.getInstance().Logger, 'error');
            window.mParticle.Identity.getCurrentUser().getUserAudiences();

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                Constants.Messages.ErrorMessages.AudienceAPINotEnabled
            );
            })
        });

        it('should be able to call user audience API if feature flag is false', function() {
            const userAudienceUrl = `https://${Constants.DefaultBaseUrls.userAudienceUrl}${apiKey}/audience`;
            const audienceMembershipServerResponse = {
                ct: 1710441407915,
                dt: 'cam',
                id: 'foo-id-2',
                audience_memberships: [
                    {
                        audience_id: 9876,
                    },
                    {
                        audience_id: 5432,
                    },
                ]
            };

            fetchMock.get(`${userAudienceUrl}?mpid=${testMPID}`, {
                status: 200,
                body: JSON.stringify(audienceMembershipServerResponse)
            });
            
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.config.flags = {
                audienceAPI: 'True'
            };

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then(() => {
            const bond = sinon.spy(window.mParticle.getInstance().Logger, 'error');

            window.mParticle.Identity.getCurrentUser().getUserAudiences((result) => {
                    console.log(result);   
            });
            bond.called.should.eql(false);
            })
        });
    });

    describe('capture integration specific ids', () => {
        beforeEach(() => {
            fetchMock.post(urls.events, 200);

            fetchMockSuccess(urls.identify, {
                mpid: testMPID, is_logged_in: false
            });

            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = 'foo=bar';
            window.document.cookie = '_fbp=54321';
            window.document.cookie = 'baz=qux';
        });

        afterEach(() => {
            fetchMock.restore();
            deleteAllCookies();
            sinon.restore(); // Restore all stubs and spies
            deleteAllCookies();
        });

        it('should capture click ids when feature flag is true', async () => {
            window.mParticle.config.flags = {
                captureIntegrationSpecificIds: 'True',
                'captureIntegrationSpecificIds.V2': 'all'
            };
            window.mParticle._resetForTests(MPConfig);

            sinon.stub(window.mParticle.getInstance()._IntegrationCapture, 'getQueryParams').returns({
                fbclid: '1234',
            });

            const captureSpy = sinon.spy(window.mParticle.getInstance()._IntegrationCapture, 'capture');
            const clickIdSpy = sinon.spy(window.mParticle.getInstance()._IntegrationCapture, 'getClickIdsAsCustomFlags');

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned)

            const initialTimestamp = window.mParticle.getInstance()._IntegrationCapture.initialTimestamp;

            expect(initialTimestamp).to.be.a('number');
            expect(window.mParticle.getInstance()._IntegrationCapture.clickIds).to.deep.equal({
                fbclid: `fb.1.${initialTimestamp}.1234`,
                '_fbp': '54321',
            });
            expect(captureSpy.called, 'capture()').to.equal(true);
            expect(clickIdSpy.called, 'getClickIdsAsCustomFlags').to.equal(true);
        });

        it('should NOT capture click ids when feature flag is false', async () => {
            window.mParticle.config.flags = {
                captureIntegrationSpecificIds: 'False',
                'captureIntegrationSpecificIds.V2': 'none'
            };
            window.mParticle._resetForTests(MPConfig);

            const captureSpy = sinon.spy(window.mParticle.getInstance()._IntegrationCapture, 'capture');
            const clickIdSpy = sinon.spy(window.mParticle.getInstance()._IntegrationCapture, 'getClickIdsAsCustomFlags');

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned)

            expect(window.mParticle.getInstance()._IntegrationCapture.clickIds).not.be.ok;
            expect(captureSpy.called, 'capture()').to.equal(false);
            expect(clickIdSpy.called, 'getClickIdsAsCustomFlags').to.equal(false);
        });
    });
});