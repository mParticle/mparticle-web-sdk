import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import Constants from '../../src/constants';
import { MParticleWebSDK, SDKLoggerApi } from '../../src/sdkRuntimeModels';
import AudienceManager, {
    IAudienceMemberships, IAudienceMembershipsServerResponse
} from '../../src/audienceManager';
import Logger from '../../src/logger.js';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

const userAudienceUrl = `https://${Constants.DefaultBaseUrls.userAudienceUrl}${apiKey}/audience`;

describe('AudienceManager', () => {
    let mockServer;
    before(function() {
        fetchMock.restore();
        sinon.restore();
    });

    beforeEach(function() {
        fetchMock.restore();
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        window.mParticle.config.flags = {
            eventBatchingIntervalMillis: 1000,
        };
    });

    afterEach(() => {
        sinon.restore();
        mockServer.reset();
        fetchMock.restore();
    });

    it('should have proper properties on AudienceManager initialization', () => {
        const newLogger: SDKLoggerApi = new Logger(window.mParticle.config);
        const audienceManager = new AudienceManager(
            Constants.DefaultBaseUrls.userAudienceUrl,
            apiKey,
            newLogger,
        );

        expect(audienceManager.logger).to.be.ok;
        expect(audienceManager.url).to.equal(userAudienceUrl);
        expect(audienceManager.userAudienceAPI).to.be.ok;
    });

    describe('#sendGetUserAudienceRequest', () => {
        const newLogger = new Logger(window.mParticle.config);
        const audienceManager = new AudienceManager(
            Constants.DefaultBaseUrls.userAudienceUrl,
            apiKey,
            newLogger
        );

        const audienceMembershipServerResponse: IAudienceMembershipsServerResponse = {
            ct: 1710441407914,
            dt: 'cam',
            id: 'foo-id',
            current_audience_memberships: [
                {
                    audience_id: 7628,
                },
                {
                    audience_id: 13388,
                },
            ]
        };

        const expectedAudienceMembership: IAudienceMemberships = {
            currentAudienceMemberships: [
                {
                    audience_id: 7628,
                },
                {
                    audience_id: 13388,
                },
            ]
        };

        it('should invoke a callback with user audiences of interface IMPParsedAudienceMemberships', async () => {
            const callback = sinon.spy();

            fetchMock.get(`${userAudienceUrl}?mpid=${testMPID}`, {
                status: 200,
                body: JSON.stringify(audienceMembershipServerResponse)
            });

            await audienceManager.sendGetUserAudienceRequest(testMPID, callback);

            expect(audienceManager.logger).to.be.ok;
            expect(audienceManager.url).to.equal(userAudienceUrl);
            expect(callback.calledOnce).to.eq(true);
            expect(callback.getCall(0).lastArg).to.deep.equal(
                expectedAudienceMembership
            );
        });

        it('should change the URL endpoint to a new MPID when switching users and attempting to retrieve audiences', async () => {
            const callback = sinon.spy();
            const newMPID = 'newMPID';
            const testMPIDAudienceEndpoint = `${userAudienceUrl}?mpid=${testMPID}`;
            const newMPIDAudienceEndpoint = `${userAudienceUrl}?mpid=${newMPID}`;

            fetchMock.get(testMPIDAudienceEndpoint, {
                status: 200,
                body: JSON.stringify(audienceMembershipServerResponse)
            });

            const audienceMembershipServerResponse2: IAudienceMembershipsServerResponse = {
                ct: 1710441407915,
                dt: 'cam',
                id: 'foo-id-2',
                current_audience_memberships: [
                    {
                        audience_id: 9876,
                    },
                    {
                        audience_id: 5432,
                    },
                ]
            };

            const expectedAudienceMembership2: IAudienceMemberships = {
            currentAudienceMemberships: [
                {
                    audience_id: 9876,
                },
                {
                    audience_id: 5432,
                },
            ]
        };

            fetchMock.get(newMPIDAudienceEndpoint, {
                status: 200,
                body: JSON.stringify(audienceMembershipServerResponse2)
            });

            await audienceManager.sendGetUserAudienceRequest(testMPID, callback);

            expect(audienceManager.logger).to.be.ok;
            expect(audienceManager.url).to.equal(userAudienceUrl);
            expect(callback.calledOnce).to.eq(true);
            expect(callback.getCall(0).lastArg).to.deep.equal(
                expectedAudienceMembership
            );

            await audienceManager.sendGetUserAudienceRequest(newMPID, callback);

            expect(callback.calledTwice).to.eq(true);
            expect(callback.getCall(1).lastArg).to.deep.equal(
                expectedAudienceMembership2
            );
        });
    });
});
