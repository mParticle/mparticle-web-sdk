import sinon from 'sinon';
import * as fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import { urls, apiKey, testMPID } from './config/constants';
import Constants from '../../src/constants';
import { IMParticleInstanceManager, SDKLoggerApi } from '../../src/sdkRuntimeModels';
import AudienceManager, {
    IAudienceMemberships, IAudienceMembershipsServerResponse
} from '../../src/audienceManager';
import Logger from '../../src/logger.js';
import Utils from './config/utils';
const { fetchMockSuccess } = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
        fetchMock: any;
    }
}

const userAudienceUrl = `https://${Constants.DefaultBaseUrls.userAudienceUrl}${apiKey}/audience`;

describe('AudienceManager', () => {
    before(function() {
        fetchMock.restore();
        sinon.restore();
    });

    beforeEach(function() {
        fetchMock.restore();

        fetchMockSuccess(urls.identify, {
            mpid: testMPID, is_logged_in: false
        });

        window.mParticle.config.flags = {
            eventBatchingIntervalMillis: 1000,
        };
    });

    afterEach(() => {
        sinon.restore();
        fetchMock.restore();
    });

    describe('initialization', () => {
        it('should have proper properties on AudienceManager', () => {
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
            audience_memberships: [
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
                audience_memberships: [
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
