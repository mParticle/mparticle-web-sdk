import sinon from 'sinon';
import { expect } from 'chai';
import Utils from './config/utils';
import Constants from '../../src/constants';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import {
    urls,
    apiKey,
    testMPID,
    MPConfig,
    workspaceCookieName,
} from './config/constants';
import { IAliasRequest } from '../../src/identity.interfaces';

const {
    setCookie,
    findRequestURL,
} = Utils;

const { HTTPCodes } = Constants;

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}    

const mParticle = window.mParticle as MParticleWebSDK;

describe('legacy Alias Requests', function() {
    let mockServer;
    let clock;
    const originalFetch = window.fetch;

    beforeEach(function() {
        delete window.fetch;
        delete mParticle.config.useCookieStorage;
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;
        localStorage.clear();

        clock = sinon.useFakeTimers({
            now: new Date().getTime(),
        });

        mockServer.respondWith(urls.events, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.restore();
        // fetchMock.restore();
        mParticle._resetForTests(MPConfig);
        clock.restore();
        window.fetch = originalFetch;
    });

    it('Alias request should be received when API is called validly', function(done) {
        mockServer.requests = [];
        mockServer.respondWith(urls.alias, [200, {}, JSON.stringify({})]);

        const aliasRequest: IAliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        };

        mParticle.Identity.aliasUsers(aliasRequest);

        mockServer.requests.length.should.equal(1);

        const request = mockServer.requests[0];
        request.url.should.equal(urls.alias);

        const requestBody = JSON.parse(request.requestBody);
        expect(requestBody['request_id']).to.not.equal(null);
        expect(requestBody['request_type']).to.equal('alias');
        expect(requestBody['environment']).to.equal('production');
        expect(requestBody['api_key']).to.equal(
            mParticle.getInstance()._Store.devToken
        );
        const dataBody = requestBody['data'];
        expect(dataBody).to.not.equal(null);
        expect(dataBody['destination_mpid']).to.equal('destinationMpid');
        expect(dataBody['source_mpid']).to.equal('sourceMpid');
        expect(dataBody['start_unixtime_ms']).to.equal(3);
        expect(dataBody['end_unixtime_ms']).to.equal(4);

        done();
    });

    it('Alias request should include scope if specified', function(done) {
        mockServer.requests = [];
        mockServer.respondWith(urls.alias, [200, {}, JSON.stringify({})]);

        const aliasRequest: IAliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
            scope: 'mpid',
        };

        mParticle.Identity.aliasUsers(aliasRequest);
        mockServer.requests.length.should.equal(1);

        const request = mockServer.requests[0];
        expect(request.url).to.equal(urls.alias);

        const requestBody = JSON.parse(request.requestBody);
        const dataBody = requestBody['data'];
        expect(dataBody['scope']).to.equal('mpid');

        done();
    });

    it('should reject malformed Alias Requests', function(done) {
        mParticle.config.logLevel = 'verbose';
        let warnMessage = null;

        mParticle.config.logger = {
            warning: function(msg) {
                warnMessage = msg;
            },
        };
        mParticle.init(apiKey, window.mParticle.config);
        let callbackResult;

        // intentionally missing sourceMpid
        let aliasRequest: IAliasRequest = ({
            destinationMpid: 'destinationMpid',
            startTime: 3,
            endTime: 4,
        } as unknown) as IAliasRequest;

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        expect(callbackResult.message).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        expect(warnMessage).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        callbackResult = null;
        warnMessage = null;

        // intentionally missing destinationMpid
        aliasRequest = ({
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        } as unknown) as IAliasRequest;

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        expect(callbackResult.message).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        expect(warnMessage).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        callbackResult = null;
        warnMessage = null;

        // same destinationMpid & sourceMpid
        aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'destinationMpid',
            startTime: 3,
            endTime: 4,
        };
        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });

        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        expect(callbackResult.message).to.equal(
            Constants.Messages.ValidationMessages.AliasNonUniqueMpid
        );
        expect(warnMessage).to.equal(
            Constants.Messages.ValidationMessages.AliasNonUniqueMpid
        );
        callbackResult = null;
        warnMessage = null;

        // endTime before startTime
        aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 4,
            endTime: 3,
        };
        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        expect(callbackResult.message).to.equal(
            Constants.Messages.ValidationMessages.AliasStartBeforeEndTime
        );
        expect(warnMessage).to.equal(
            Constants.Messages.ValidationMessages.AliasStartBeforeEndTime
        );
        callbackResult = null;
        warnMessage = null;

        // intentionally missing endTime and startTime
        aliasRequest = ({
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
        } as unknown) as IAliasRequest;

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        expect(callbackResult.message).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingTime
        );
        expect(warnMessage).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingTime
        );
        callbackResult = null;
        warnMessage = null;

        // sanity test, make sure properly formatted requests are accepted
        aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        };

        mockServer.respondWith(urls.alias, [200, {}, JSON.stringify({})]);

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
            callbackResult.httpCode.should.equal(200);
            expect(callbackResult.message).to.equal(undefined);
            expect(warnMessage).to.equal(null);
            callbackResult = null;
            done();
        });

    });

    it('should parse error info from Alias Requests', function(done) {
        clock.restore();
        mParticle.init(apiKey, window.mParticle.config);
        const errorMessage = 'this is a sample error message';
        let callbackResult;

        mockServer.respondWith(urls.alias, [
            400,
            {},
            JSON.stringify({
                message: errorMessage,
                code: 'ignored code',
            }),
        ]);

        const aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        };
        
        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            // debugger;
            callbackResult = callback;
            callbackResult.httpCode.should.equal(400);
            callbackResult.message.should.equal(errorMessage);
    
            done();
        });
    });

    it('should properly create AliasRequest', function(done) {
        mParticle._resetForTests(MPConfig);

        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
                lst: 400,
            },
            cu: '2',
        });

        setCookie(workspaceCookieName, cookies);

        mParticle.init(apiKey, window.mParticle.config);

        // Reset clock so we can use simple integers for time
        clock.restore();
        clock = sinon.useFakeTimers();
        clock.tick(1000);

        const destinationUser = mParticle.Identity.getCurrentUser();
        const sourceUser = mParticle.Identity.getUser('1');

        const aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        expect(aliasRequest.sourceMpid).to.equal('1');
        expect(aliasRequest.destinationMpid).to.equal('2');
        expect(aliasRequest.startTime).to.equal(200);
        expect(aliasRequest.endTime).to.equal(400);
        clock.restore();

        done();
    });

    it('should fill in missing fst and lst in createAliasRequest', function(done) {
        mParticle._resetForTests(MPConfig);

        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
                lst: 400,
            },
            2: {},
            cu: '3',
        });

        setCookie(workspaceCookieName, cookies);

        mParticle.init(apiKey, window.mParticle.config);

        // Reset clock so we can use simple integers for time
        clock.restore();
        clock = sinon.useFakeTimers();
        clock.tick(1000);

        const destinationUser = mParticle.Identity.getCurrentUser();
        const sourceUser = mParticle.Identity.getUser('2');

        const aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        expect(aliasRequest.sourceMpid).to.equal('2');
        expect(aliasRequest.destinationMpid).to.equal('3');
        //should grab the earliest fst out of any user if user does not have fst
        expect(aliasRequest.startTime).to.equal(200);
        //should grab currentTime if user does not have lst
        expect(aliasRequest.endTime).to.equal(1000);

        clock.restore();

        done();
    });

    it('should fix startTime when default is outside max window create AliasRequest', function(done) {
        mParticle._resetForTests(MPConfig);

        const millisPerDay = 24 * 60 * 60 * 1000;
        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
            },
            cu: '2',
        });

        setCookie(workspaceCookieName, cookies);

        //set max Alias startTime age to 1 day
        mParticle.config.aliasMaxWindow = 1;

        mParticle.init(apiKey, window.mParticle.config);

        clock.tick(millisPerDay * 2);

        const destinationUser = mParticle.Identity.getCurrentUser();
        const sourceUser = mParticle.Identity.getUser('1');

        const aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        expect(aliasRequest.sourceMpid).to.equal('1');
        expect(aliasRequest.destinationMpid).to.equal('2');
        const oldestAllowedStartTime =
            new Date().getTime() -
            mParticle.getInstance()._Store.SDKConfig.aliasMaxWindow *
                millisPerDay;
        expect(aliasRequest.startTime).to.equal(oldestAllowedStartTime);
        expect(aliasRequest.endTime).to.equal(new Date().getTime());
        clock.restore();

        done();
    });

    it('should warn if legal aliasRequest cannot be created with MParticleUser', function(done) {
        const millisPerDay = 24 * 60 * 60 * 1000;

        mParticle.config.logLevel = 'verbose';
        let warnMessage = null;

        mParticle.config.logger = {
            warning: function(msg) {
                warnMessage = msg;
            },
        };

        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
                lst: 300,
            },
            cu: '2',
        });
        setCookie(workspaceCookieName, cookies);

        //set max Alias startTime age to 1 day
        mParticle.config.aliasMaxWindow = 1;

        mParticle.init(apiKey, window.mParticle.config);

        clock.tick(millisPerDay * 2);

        const destinationUser = mParticle.Identity.getCurrentUser();
        const sourceUser = mParticle.Identity.getUser('1');

        const aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        expect(aliasRequest.sourceMpid).to.equal('1');
        expect(aliasRequest.destinationMpid).to.equal('2');
        const oldestAllowedStartTime =
            new Date().getTime() -
            mParticle.getInstance()._Store.SDKConfig.aliasMaxWindow *
                millisPerDay;
        expect(aliasRequest.startTime).to.equal(oldestAllowedStartTime);
        expect(aliasRequest.endTime).to.equal(300);
        expect(warnMessage).to.equal(
            'Source User has not been seen in the last ' +
                mParticle.getInstance()._Store.SDKConfig.maxAliasWindow +
                ' days, Alias Request will likely fail'
        );

        clock.restore();
        done();
    });

    it("alias request should have environment 'development' when isDevelopmentMode is true", function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.isDevelopmentMode = true;

        mockServer.respondWith(urls.alias, [202, {}, JSON.stringify({})]);

        mParticle.init(apiKey, window.mParticle.config);

        mockServer.requests = [];
        
        const aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        };

        mParticle.Identity.aliasUsers(aliasRequest);
        mockServer.requests.length.should.equal(1);

        const request = mockServer.requests[0];
        const requestBody = JSON.parse(request.requestBody);
        expect(requestBody['environment']).to.equal('development');expect(requestBody.environment).to.equal('development');
        done()
    });

    it('should have default urls if no custom urls are set in config object, but use custom urls when they are set', function(done) {
        window.mParticle.config.v3SecureServiceUrl =
            'testtesttest-custom-v3secureserviceurl/v3/JS/';
        window.mParticle.config.configUrl =
            'foo-custom-configUrl/v2/JS/';
        window.mParticle.config.identityUrl = 'custom-identityUrl/';
        window.mParticle.config.aliasUrl = 'custom-aliasUrl/';

        mockServer.respondWith('https://testtesttest-custom-v3secureserviceurl/v3/JS/test_key/events', 200, JSON.stringify({ mpid: testMPID, Store: {}}));

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(window.mParticle.config.v3SecureServiceUrl)
        mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(window.mParticle.config.configUrl)
        mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(window.mParticle.config.identityUrl)
        mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(window.mParticle.config.aliasUrl)

        mockServer.requests = [];
        // test events endpoint
        mParticle.logEvent('Test Event');

        // const testEventURL = findRequestURL(mockServer.requests, 'Test Event');
        mockServer.requests[0].responseURL.should.equal(
            'https://' +
                window.mParticle.config.v3SecureServiceUrl +
                'test_key/events'
        );
        // test Identity endpoint
        mockServer.requests = [];
        mParticle.Identity.login({ userIdentities: { customerid: 'test1' } });
        mockServer.requests[0].url.should.equal(
            'https://' + window.mParticle.config.identityUrl + 'login'
        );

        // test alias endpoint
        mockServer.requests = [];

        mParticle.Identity.aliasUsers({
            destinationMpid: '1',
            sourceMpid: '2',
            startTime: 3,
            endTime: 4,
        });

        mockServer.requests[0].url.should.equal(
            'https://' + window.mParticle.config.aliasUrl + 'test_key/Alias'
        );

        done();
    });

});
