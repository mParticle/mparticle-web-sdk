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
import { IKitConfigs } from '../../src/configAPIClient';

const { waitForCondition, fetchMockSuccess, deleteAllCookies } = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

const hasIdentifyReturned = () => {
    return window.mParticle.Identity.getCurrentUser()?.getMPID() === testMPID;
};

describe('feature-flags', () => {
    describe('user audiences', () => {
        beforeEach(() => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.config.overwriteRoutes = true;
            fetchMock.post(urls.events, 200);
            fetchMockSuccess(urls.identify, {
                mpid: testMPID, is_logged_in: false
            });
            window.mParticle.init(apiKey, window.mParticle.config);
        });

        afterEach(() => {
            fetchMock.restore();
            sinon.restore();
        });

        it('should not be able to access user audience API if feature flag is false', async () => {
            window.mParticle.config.flags = {
                audienceAPI: 'False'
            };

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            const bond = sinon.spy(window.mParticle.getInstance().Logger, 'error');
            window.mParticle.Identity.getCurrentUser().getUserAudiences();

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                Constants.Messages.ErrorMessages.AudienceAPINotEnabled
            );
        });

        it('should be able to call user audience API if feature flag is false', async () => {
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

            window.mParticle.config.flags = {
                audienceAPI: 'True'
            };

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            const bond = sinon.spy(window.mParticle.getInstance().Logger, 'error');

            window.mParticle.Identity.getCurrentUser().getUserAudiences((result) => {
                    console.log(result);   
            });
            bond.called.should.eql(false);
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

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned)

            const integrationCapture = window.mParticle.getInstance()._IntegrationCapture;
            sinon.stub(integrationCapture, 'getQueryParams').returns({ fbclid: '1234' });
            const captureSpy = sinon.spy(integrationCapture, 'capture');
            const clickIdSpy = sinon.spy(integrationCapture, 'getClickIdsAsCustomFlags');

            integrationCapture.capture();
            integrationCapture.getClickIdsAsCustomFlags();

            const initialTimestamp = integrationCapture.initialTimestamp;

            expect(initialTimestamp).to.be.a('number');
            expect(integrationCapture.clickIds).to.deep.equal({
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

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned)

            const integrationCapture = window.mParticle.getInstance()._IntegrationCapture;
            let captureCalled = false;
            let clickIdCalled = false;
            if (integrationCapture) {
                const captureSpy = sinon.spy(integrationCapture, 'capture');
                const clickIdSpy = sinon.spy(integrationCapture, 'getClickIdsAsCustomFlags');
                captureCalled = captureSpy.called;
                clickIdCalled = clickIdSpy.called;
            }

            expect(integrationCapture && integrationCapture.clickIds).not.be.ok;
            expect(captureCalled, 'capture()').to.equal(false);
            expect(clickIdCalled, 'getClickIdsAsCustomFlags').to.equal(false);
        });
    });

    describe('checkout intent', () => {
        const roktConfig = { name: 'Rokt', moduleId: 181 } as IKitConfigs;
        const activeTracker = () => {
            const state = (window as any).__mpCit__;
            return state ? state.tracker : undefined;
        };

        beforeEach(() => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.config.overwriteRoutes = true;
            fetchMock.post(urls.events, 200);
            fetchMockSuccess(urls.identify, {
                mpid: testMPID, is_logged_in: false
            });
        });

        afterEach(() => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.restore();
            sinon.restore();
        });

        it('listens when the flag is True and a Rokt kit is configured', async () => {
            window.mParticle.init(apiKey, {
                ...window.mParticle.config,
                flags: { checkoutIntent: 'True' },
                kitConfigs: [roktConfig],
            });
            await waitForCondition(hasIdentifyReturned);

            expect(activeTracker() && activeTracker().isActive).to.equal(true);
        });

        it('does not listen when the flag is off', async () => {
            window.mParticle.init(apiKey, {
                ...window.mParticle.config,
                kitConfigs: [roktConfig],
            });
            await waitForCondition(hasIdentifyReturned);

            expect(activeTracker()).to.equal(undefined);
        });

        it('does not listen without a Rokt kit', async () => {
            window.mParticle.init(
                apiKey,
                { ...window.mParticle.config, flags: { checkoutIntent: 'True' } },
                'checkout-intent-no-rokt'
            );
            await waitForCondition(() =>
                window.mParticle.getInstance('checkout-intent-no-rokt')._Store.isInitialized
            );

            expect(activeTracker()).to.equal(undefined);
        });

        // An earlier bundle load leaves a tracker the new instance has no reference to.
        it('stops a tracker from an earlier bundle load when re-init turns the flag off', async () => {
            window.mParticle.init(apiKey, {
                ...window.mParticle.config,
                flags: { checkoutIntent: 'True' },
                kitConfigs: [roktConfig],
            });
            await waitForCondition(hasIdentifyReturned);
            const earlier = activeTracker();
            window.mParticle.getInstance()._CheckoutIntentTracker = undefined;

            window.mParticle.init(apiKey, {
                ...window.mParticle.config,
                flags: { checkoutIntent: 'False' },
                kitConfigs: [roktConfig],
            });
            await waitForCondition(hasIdentifyReturned);

            expect(earlier.isActive).to.equal(false);
            expect(activeTracker()).to.equal(undefined);
        });
    });
});
