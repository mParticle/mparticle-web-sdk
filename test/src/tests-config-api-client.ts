import sinon from 'sinon';
import { urls } from './config/constants';
import { apiKey, MPConfig } from './config/constants';
import { expect } from 'chai';
import ConfigAPIClient, {
    IConfigAPIClient,
    IConfigResponse,
} from '../../src/configAPIClient';
import {
    DataPlanConfig,
    DataPlanResult,
    MParticleWebSDK,
    SDKInitConfig,
} from '../../src/sdkRuntimeModels';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
    }
}

describe('ConfigAPIClient', () => {
    let mockServer;
    let sdkInitCompleteCallback;
    let configUrl;
    let dataPlan: DataPlanConfig;
    let dataPlanResult: DataPlanResult;

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

                dataPlanResult = {
                    dtpn: {
                        blok: {
                            ev: false,
                            ea: false,
                            ua: false,
                            id: false,
                        },
                        vers: {
                            version: 17,
                            data_plan_id: 'fake_data_plan',
                            last_modified_on: '2022-02-16T17:52:19.13Z',
                            version_document: {
                                data_points: [],
                            },
                        },
                    },
                };

                mockServer.respondWith(configUrl, [
                    200,
                    {},
                    JSON.stringify({
                        appName: 'Test App',
                        kitConfigs: [],
                        dataPlanResult,
                    }),
                ]);
            });

            it('appends data plan information to url', () => {
                const config: Partial<SDKInitConfig> = {
                    requestConfig: true,
                    dataPlan,
                };

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
                const config = ({
                    requestConfig: true,
                    dataPlan: dataPlan,
                } as unknown) as SDKInitConfig;

                window.mParticle.init(apiKey, window.mParticle.config);

                const configAPIClient: IConfigAPIClient = new ConfigAPIClient();
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
                expect(configResponse.dataPlanResult).to.be.ok;
            });
        });
    });
});
