import sinon from 'sinon';
import { urls } from './config';
import { apiKey, MPConfig, testMPID } from './config';
import { expect } from 'chai';
import Constants from '../../src/constants';
import ConfigAPIClient, { IConfigResponse } from '../../src/configAPIClient';
import { MParticleWebSDK, SDKInitConfig } from '../../src/sdkRuntimeModels';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        // fetchMock: any;
    }
}

describe.only('ConfigAPIClient', () => {
    let mockServer;
    let sdkInitCompleteCallback;
    let configUrl;
    let dataPlan;

    beforeEach(() => {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;
        sdkInitCompleteCallback = sinon.spy();
        window.mParticle._resetForTests(MPConfig);
    });

    afterEach(() => {
        mockServer.reset();
        sinon.restore();
    });

    describe('#getSDKConfiguration', () => {
        describe('with defaults', () => {
            beforeEach(() => {});
            it('should fetch a config from the server', () => {
                const config = { requestConfig: true } as SDKInitConfig;

                mockServer.respondWith(urls.config, [
                    200,
                    {},
                    JSON.stringify({ appName: 'Test App', kitConfigs: [] }),
                ]);

                window.mParticle.init(apiKey, config);

                const configAPIClient = new ConfigAPIClient();
                configAPIClient.getSDKConfiguration(
                    apiKey,
                    config,
                    sdkInitCompleteCallback,
                    window.mParticle.getInstance()
                );

                expect(sdkInitCompleteCallback.getCalls().length).to.equal(1);
                expect(
                    sdkInitCompleteCallback.calledWithMatch(
                        apiKey,
                        MPConfig,
                        window.mParticle.getInstance()
                    )
                );
                expect(mockServer.lastRequest).to.haveOwnProperty('response');

                // TODO: Check mockServer
                expect(mockServer.lastRequest.url).to.equal(urls.config);

                const configResponse: IConfigResponse = JSON.parse(
                    mockServer.lastRequest.response
                );

                expect(configResponse).to.be.ok;
                expect(configResponse.appName).to.equal('Test App');
                expect(configResponse.kitConfigs).to.be.ok;
            });

            it('should continue sdk init if fetch fails', () => {
                const config = { requestConfig: true };

                mockServer.respondWith(urls.config, [400, {}, '']);

                window.mParticle.init(apiKey, window.mParticle.config);

                const configAPIClient = new ConfigAPIClient();
                configAPIClient.getSDKConfiguration(
                    apiKey,
                    config,
                    sdkInitCompleteCallback,
                    window.mParticle.getInstance()
                );

                expect(sdkInitCompleteCallback.getCalls().length).to.equal(1);
                expect(
                    sdkInitCompleteCallback.calledWithMatch(
                        apiKey,
                        MPConfig,
                        window.mParticle.getInstance()
                    )
                );
                expect(mockServer.lastRequest).to.haveOwnProperty('response');
                expect(mockServer.lastRequest.url).to.equal(urls.config);
            });
        });

        describe('with Data Plan', () => {
            beforeEach(() => {
                configUrl = `${urls.config}&plan_id=test_data_plan&plan_version=42`;

                dataPlan = {
                    planId: 'test_data_plan',
                    planVersion: 42,
                };

                mockServer.respondWith(configUrl, [
                    200,
                    {},
                    JSON.stringify({
                        appName: 'Test App',
                        kitConfigs: [],
                        dataPlan,
                    }),
                ]);
            });

            it('appends data plan information to url', () => {
                const config = { requestConfig: true, dataPlan: dataPlan };

                window.mParticle.init(apiKey, window.mParticle.config);

                const configAPIClient = new ConfigAPIClient();
                configAPIClient.getSDKConfiguration(
                    apiKey,
                    config,
                    sdkInitCompleteCallback,
                    window.mParticle.getInstance()
                );

                expect(sdkInitCompleteCallback.getCalls().length).to.equal(1);
                expect(
                    sdkInitCompleteCallback.calledWithMatch(
                        apiKey,
                        MPConfig,
                        window.mParticle.getInstance()
                    )
                );

                expect(mockServer.lastRequest).to.haveOwnProperty('url');
                expect(mockServer.lastRequest.url).to.equal(configUrl);
            });

            it('returns data plan information within the HTTP Response', () => {
                const configUrl = `${urls.config}&plan_id=test_data_plan&plan_version=42`;
                const config = { requestConfig: true, dataPlan: dataPlan };

                window.mParticle.init(apiKey, window.mParticle.config);

                const configAPIClient = new ConfigAPIClient();
                configAPIClient.getSDKConfiguration(
                    apiKey,
                    config,
                    sdkInitCompleteCallback,
                    window.mParticle.getInstance()
                );

                expect(mockServer.lastRequest).to.haveOwnProperty('method');
                expect(mockServer.lastRequest).to.haveOwnProperty('response');

                expect(mockServer.lastRequest.method).to.equal('get');
                expect(mockServer.lastRequest.url).to.equal(configUrl);

                const configResponse: IConfigResponse = JSON.parse(
                    mockServer.lastRequest.response
                );

                expect(configResponse).to.be.ok;
                expect(configResponse.appName).to.equal('Test App');
                expect(configResponse.kitConfigs).to.be.ok;
            });
        });
    });
});
