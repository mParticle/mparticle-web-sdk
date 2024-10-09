import Constants from '../../src/constants';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey,
    testMPID,
    MPConfig,
} from './config/constants';
import Utils from './config/utils';
const { waitForCondition, fetchMockSuccess } = Utils;

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
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
});