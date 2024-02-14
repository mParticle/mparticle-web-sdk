import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import Constants from '../../src/constants';
import { MParticleWebSDK, SDKLoggerApi } from '../../src/sdkRuntimeModels';
import AudienceManager, {
    IMinifiedAudienceMembership,
    IAudienceServerResponse,
    AudienceMembershipChangeAction,
    IMPParsedAudienceMemberships,
    parseUserAudiences
} from '../../src/audienceManager';
import Logger from '../../src/logger.js';


declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

const userAudienceUrl = `https://${Constants.DefaultBaseUrls.userAudienceUrl}${apiKey}/audience?mpid=${testMPID}`

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

        const audienceMembership1: IMinifiedAudienceMembership = {
            'id': 7628,
            'n': 'foo-audience-1',
            'c': [{
                'ct': 0,
                'a': AudienceMembershipChangeAction.Drop
                }],
            's': []
        };

        const audienceMembership2: IMinifiedAudienceMembership = {
            'id': 13388,
            'n': 'foo-audience-2',
            'c': [
                {
                    'ct': 1706713126180,
                    'a': AudienceMembershipChangeAction.Add
                }
            ],
            's': []
        }
        const audiencePayloadResponse: IAudienceServerResponse = {
            'dt': 'ar', // audience response message
            'id': '399a6b02-6c38-4146-a7e2-144a2b803c24',
            'ct': 1706714266028,
            'm': [audienceMembership1, audienceMembership2]
        };

        const userAudienceResult: IMPParsedAudienceMemberships = {
            currentAudiences: [{
                id: 13388,
                name: 'foo-audience-2',
            },],
            pastAudiences: [{
                id: 7628,
                name: 'foo-audience-1',

            }]
        };

        it('should invoke a callback with user audiences of interface IMPParsedAudienceMemberships', async () => {
            const callback = sinon.spy();

            fetchMock.get(userAudienceUrl, {
                status: 200,
                body: JSON.stringify(audiencePayloadResponse)
            });

            await audienceManager.sendGetUserAudienceRequest(callback);

            expect(audienceManager.logger).to.be.ok;
            expect(audienceManager.url).to.equal(userAudienceUrl);
            expect(callback.called).to.eq(true);
            expect(callback.getCall(0).lastArg).to.deep.equal(
                userAudienceResult
            );
        });
        
        it('#parseUserAudiences', () => {
            const parsedAudienceResponse: IMPParsedAudienceMemberships = parseUserAudiences(audiencePayloadResponse)

            expect(parsedAudienceResponse).to.deep.equal(userAudienceResult);
        })
    });

});
