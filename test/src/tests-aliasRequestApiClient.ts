import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import { expect } from 'chai';
import { sendAliasRequest } from '../../src/aliasRequestApiClient';
import { IAliasCallback, IAliasRequest } from '../../src/identity.interfaces';
import { HTTP_ACCEPTED, HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_OK } from '../../src/constants';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

let mockServer;
const mParticle = window.mParticle;

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

const aliasUrl = 'https://jssdks.mparticle.com/v1/identity/test_key/Alias';

describe('Alias Request Api Client', function() {
    beforeEach(function() {
        fetchMock.post(urls.events, 200);
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.restore();
        fetchMock.restore();
        mParticle._resetForTests(MPConfig);
    });

    it('should have just an httpCode on the result passed to the callback on a 200', async () => {
        const mpInstance: MParticleWebSDK = mParticle.getInstance();
        const aliasRequest: IAliasRequest = {
            destinationMpid: '123',
            sourceMpid: '456',
            startTime: 10001230123,
            endTime: 10001231123
        };

        const aliasCallback = sinon.spy()
        fetchMock.post(aliasUrl, HTTP_OK);

        await sendAliasRequest(mpInstance, aliasRequest, aliasCallback);
        expect(aliasCallback.calledOnce).to.eq(true);
        const callbackArgs = aliasCallback.getCall(0).args
        expect(callbackArgs[0]).to.deep.equal({httpCode: HTTP_OK});
    });

    it('should have just an httpCode on the result passed to the callback on a 202', async () => {
        const mpInstance: MParticleWebSDK = mParticle.getInstance();
        const aliasRequest: IAliasRequest = {
            destinationMpid: '123',
            sourceMpid: '456',
            startTime: 10001230123,
            endTime: 10001231123
        };

        const aliasCallback = sinon.spy()
        fetchMock.post(aliasUrl, HTTP_ACCEPTED);

        await sendAliasRequest(mpInstance, aliasRequest, aliasCallback);
        expect(aliasCallback.calledOnce).to.eq(true);
        const callbackArgs = aliasCallback.getCall(0).args
        expect(callbackArgs[0]).to.deep.equal({httpCode: HTTP_ACCEPTED});
    });

    it('should have just an httpCode on the result passed to the callback on a 400', async () => {
        const mpInstance: MParticleWebSDK = mParticle.getInstance();
        const aliasRequest: IAliasRequest = {
            destinationMpid: '123',
            sourceMpid: '456',
            startTime: 10001230123,
            endTime: 10001231123
        };

        const aliasCallback = sinon.spy()
        fetchMock.post(aliasUrl, HTTP_BAD_REQUEST);

        await sendAliasRequest(mpInstance, aliasRequest, aliasCallback);
        expect(aliasCallback.calledOnce).to.eq(true);
        const callbackArgs = aliasCallback.getCall(0).args
        expect(callbackArgs[0]).to.deep.equal({httpCode: HTTP_BAD_REQUEST});
    });


    // this needs to be updated.  why is it passing?
    it('should have an httpCode and an error message passed to the callback on a 403', async () => {
        const mpInstance: MParticleWebSDK = mParticle.getInstance();
        const aliasRequest: IAliasRequest = {
            destinationMpid: '123',
            sourceMpid: '456',
            startTime: 10001230123,
            endTime: 10001231123
        };

        const aliasCallback = sinon.spy()
        fetchMock.post(aliasUrl, {
            status: HTTP_FORBIDDEN,
            body: JSON.stringify({message: 'error'}),
        });

        await sendAliasRequest(mpInstance, aliasRequest, aliasCallback);
        expect(aliasCallback.calledOnce).to.eq(true);
        const callbackArgs = aliasCallback.getCall(0).args
        expect(callbackArgs[0]).to.deep.equal({httpCode: HTTP_FORBIDDEN, message: 'error'});
    });
});