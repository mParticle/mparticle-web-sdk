import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import Constants from '../../src/constants';
import { MParticleWebSDK, SDKLoggerApi } from '../../src/sdkRuntimeModels';
import AudienceManager, {
    IAudienceMemberships
} from '../../src/audienceManager';
import Logger from '../../src/logger.js';


declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

const userAudienceUrl = `https://${Constants.DefaultBaseUrls.userAudienceUrl}${apiKey}/audience?mpid=${testMPID}`

describe.only('AudienceManager', () => {
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
            testMPID
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
            newLogger,
            testMPID
        );

        const audienceMembership: IAudienceMemberships = {
            audience_memberships: [
                {
                    audience_id: 7628,
                    expiration_timestamp_ms: 1234
                },
                {
                    audience_id: 13388,
                    expiration_timestamp_ms: null
                },
            ]
        };

        it('should invoke a callback with user audiences of interface IMPParsedAudienceMemberships', async () => {
            const callback = sinon.spy();

            fetchMock.get(userAudienceUrl, {
                status: 200,
                body: JSON.stringify(audienceMembership)
            });

            await audienceManager.sendGetUserAudienceRequest(callback);

            expect(audienceManager.logger).to.be.ok;
            expect(audienceManager.url).to.equal(userAudienceUrl);
            expect(callback.called).to.eq(true);
            expect(callback.getCall(0).lastArg).to.deep.equal(
                audienceMembership
            );
        });
    });

});
