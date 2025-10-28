import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, MPConfig } from './config/constants';
import { expect } from 'chai';
import ConfigAPIClient  from '../../src/configAPIClient';
import {
    DataPlanConfig,
    DataPlanResult,
    IMParticleInstanceManager,
    SDKInitConfig,
} from '../../src/sdkRuntimeModels';

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

describe('ConfigAPIClient', () => {
    let mockServer;
    let sdkInitCompleteCallback;
    let configUrl;
    let dataPlan: DataPlanConfig;
    let dataPlanResult: DataPlanResult;

    beforeEach(() => {
        window.mParticle._resetForTests(MPConfig);
        fetchMock.config.overwriteRoutes = true;
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;
        sdkInitCompleteCallback = sinon.spy();
    });

    afterEach(() => {
        sinon.restore();
        fetchMock.restore();
        mockServer.reset();
    });

    describe('with FetchUploader', () => {
        describe('#getSDKConfiguration', () => {
            describe('with defaults', () => {
                it('should fetch a config from the server', async () => {
                    const config = { requestConfig: true } as SDKInitConfig;

                    const kitConfigs = [
                        { name: 'Test Kit 1', id: 1 },
                        { name: 'Test Kit 2', id: 2 },
                    ];

                    fetchMock.get(urls.config, {
                        status: 200,
                        body: JSON.stringify({
                            appName: 'Test App',
                            kitConfigs,
                        }),
                    });

                    const configAPIClient = new ConfigAPIClient(
                        apiKey,
                        config,
                        window.mParticle.getInstance()
                    );

                    const response =
                        await configAPIClient.getSDKConfiguration();

                    expect(fetchMock.calls().length).to.equal(1);
                    expect(fetchMock.calls()[0][0]).to.equal(urls.config);

                    expect(response).to.be.ok;
                    expect(response.appName).to.equal('Test App');
                    expect(response.kitConfigs).to.deep.equal(kitConfigs);
                });

                it('should return inital config fetch fails', async () => {
                    const config = { requestConfig: true } as SDKInitConfig;
                    fetchMock.get(urls.config, {
                        status: 400,
                    });

                    const configAPIClient = new ConfigAPIClient(
                        apiKey,
                        config,
                        window.mParticle.getInstance()
                    );

                    const response =
                        await configAPIClient.getSDKConfiguration();

                    expect(fetchMock.calls().length).to.equal(1);
                    expect(fetchMock.calls()[0][0]).to.equal(urls.config);

                    expect(response).to.be.ok;
                    expect(response).to.deep.equal({ requestConfig: true });
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

                    fetchMock.get(configUrl, {
                        status: 200,
                        body: JSON.stringify({
                            appName: 'Test App',
                            kitConfigs: [],
                            dataPlanResult,
                        }),
                    });
                });

                it('appends data plan information to url', async () => {
                    const config: Partial<SDKInitConfig> = {
                        requestConfig: true,
                        dataPlan,
                    };

                    const configAPIClient = new ConfigAPIClient(
                        apiKey,
                        config,
                        window.mParticle.getInstance()
                    );

                    const response =
                        await configAPIClient.getSDKConfiguration();

                    expect(fetchMock.calls().length).to.equal(1);
                    expect(fetchMock.calls()[0][0]).to.equal(configUrl);
                });

                it('returns data plan information within the response', async () => {
                    const config: Partial<SDKInitConfig> = {
                        requestConfig: true,
                        dataPlan,
                    };

                    const configAPIClient = new ConfigAPIClient(
                        apiKey,
                        config,
                        window.mParticle.getInstance()
                    );

                    const response =
                        await configAPIClient.getSDKConfiguration();

                    expect(response).to.be.ok;
                    expect(response.appName).to.equal('Test App');
                    expect(response.kitConfigs).to.deep.equal([]);
                    expect(response.dataPlanResult).to.deep.equal(
                        dataPlanResult
                    );
                });
            });
        });
    });


    describe('with XHRUploader', () => {
        let fetchHolder: typeof window.fetch;
        
        beforeEach(() => {
            fetchHolder = window.fetch;
            delete window.fetch;
        });

        afterEach(() => {
            window.fetch = fetchHolder;
        });

        describe('#getSDKConfiguration', () => {
            describe('with defaults', () => {
                it('should fetch a config from the server', async () => {
                    const config = { requestConfig: true } as SDKInitConfig;

                    const kitConfigs = [
                        { name: 'Test Kit 1', id: 1 },
                        { name: 'Test Kit 2', id: 2 },
                    ];

                    mockServer.respondWith(urls.config, [
                        200,
                        {},
                        JSON.stringify({ appName: 'Test App', kitConfigs }),
                    ]);

                    const configAPIClient = new ConfigAPIClient(
                        apiKey,
                        config,
                        window.mParticle.getInstance()
                    );

                    const response =
                        await configAPIClient.getSDKConfiguration();

                    expect(mockServer.requests.length).to.equal(1);
                    expect(mockServer.lastRequest).to.haveOwnProperty(
                        'response'
                    );
                    expect(mockServer.lastRequest.url).to.equal(urls.config);

                    expect(response).to.be.ok;
                    expect(response.appName).to.equal('Test App');
                    expect(response.kitConfigs).to.deep.equal(kitConfigs);
                });

                it('should return inital config fetch fails', async () => {
                    const config = { requestConfig: true } as SDKInitConfig;
                    mockServer.respondWith(urls.config, [400, {}, '']);

                    const configAPIClient = new ConfigAPIClient(
                        apiKey,
                        config,
                        window.mParticle.getInstance()
                    );

                    const response =
                        await configAPIClient.getSDKConfiguration();

                    expect(mockServer.requests.length).to.equal(1);
                    expect(mockServer.lastRequest).to.haveOwnProperty(
                        'response'
                    );
                    expect(mockServer.lastRequest.url).to.equal(urls.config);

                    expect(response).to.be.ok;
                    expect(response).to.deep.equal({ requestConfig: true });
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

                it('appends data plan information to url', async () => {
                    const config: Partial<SDKInitConfig> = {
                        requestConfig: true,
                        dataPlan,
                    };

                    const configAPIClient = new ConfigAPIClient(
                        apiKey,
                        config,
                        window.mParticle.getInstance()
                    );

                    const response =
                        await configAPIClient.getSDKConfiguration();

                    expect(mockServer.lastRequest).to.haveOwnProperty('url');
                    expect(mockServer.lastRequest.url).to.equal(configUrl);
                });

                it('returns data plan information within the response', async () => {
                    const config: Partial<SDKInitConfig> = {
                        requestConfig: true,
                        dataPlan,
                    };

                    const configAPIClient = new ConfigAPIClient(
                        apiKey,
                        config,
                        window.mParticle.getInstance()
                    );

                    const response =
                        await configAPIClient.getSDKConfiguration();

                    expect(mockServer.lastRequest.method).to.equal('get');

                    expect(response).to.be.ok;
                    expect(response.appName).to.equal('Test App');
                    expect(response.kitConfigs).to.deep.equal([]);
                    expect(response.dataPlanResult).to.deep.equal(
                        dataPlanResult
                    );
                });
            });
        });
    });
});
