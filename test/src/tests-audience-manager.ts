import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import { urls, apiKey, testMPID, MPConfig } from './config/constants';
import Constants from '../../src/constants';
import { IMParticleInstanceManager, SDKLoggerApi } from '../../src/sdkRuntimeModels';
import AudienceManager, {
    IAudienceMemberships, IAudienceMembershipsServerResponse
} from '../../src/audienceManager';
import { Logger } from '../../src/logger';
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
    beforeEach(() => {    
        window.mParticle._resetForTests(MPConfig);
        fetchMockSuccess(urls.identify, {
            mpid: testMPID, is_logged_in: false
        });
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
        let newLogger: SDKLoggerApi;
        let audienceManager: AudienceManager;
        beforeEach(() => {
            newLogger = new Logger(window.mParticle.config);
            audienceManager = new AudienceManager(
                Constants.DefaultBaseUrls.userAudienceUrl,
                apiKey,
                newLogger
            );
        });

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

        it('should encode an MPID that contains query delimiters in the audience URL', async () => {
            const callback = sinon.spy();
            const unsafeMPID = '1&mpid=2#';

            fetchMock.get(`${userAudienceUrl}?mpid=1%26mpid%3D2%23`, {
                status: 200,
                body: JSON.stringify(audienceMembershipServerResponse)
            });

            await audienceManager.sendGetUserAudienceRequest(unsafeMPID, callback);

            expect(fetchMock.lastUrl()).to.equal(
                `${userAudienceUrl}?mpid=1%26mpid%3D2%23`
            );
            expect(callback.calledOnce).to.eq(true);
        });

        it('should still request audiences and call back when the MPID contains a lone UTF-16 surrogate', async () => {
            const callback = sinon.spy();

            fetchMock.get(`${userAudienceUrl}?mpid=1%EF%BF%BD`, {
                status: 200,
                body: JSON.stringify(audienceMembershipServerResponse)
            });

            await audienceManager.sendGetUserAudienceRequest('1\ud800', callback);

            expect(fetchMock.lastUrl()).to.equal(
                `${userAudienceUrl}?mpid=1%EF%BF%BD`
            );
            expect(callback.calledOnce).to.eq(true);
            expect(callback.getCall(0).lastArg).to.deep.equal(
                expectedAudienceMembership
            );
        });

        it('should encode an MPID of exactly "." or ".." in the audience URL', async () => {
            const callback = sinon.spy();

            fetchMock.get(`${userAudienceUrl}?mpid=%252E%252E`, {
                status: 200,
                body: JSON.stringify(audienceMembershipServerResponse)
            });

            await audienceManager.sendGetUserAudienceRequest('..', callback);

            expect(fetchMock.lastUrl()).to.equal(`${userAudienceUrl}?mpid=%252E%252E`);
            expect(callback.calledOnce).to.eq(true);
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