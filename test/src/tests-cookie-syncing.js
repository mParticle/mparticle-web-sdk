import Utils from './utils';
import sinon from 'sinon';
import { urls, testMPID, MPConfig, v4LSKey, apiKey } from './config';

var setLocalStorage = Utils.setLocalStorage,
    MockForwarder = Utils.MockForwarder,
    getLocalStorage = Utils.getLocalStorage,
    mockServer;

describe('cookie syncing', function() {
    beforeEach(function() {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.eventsV2, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, Store: {}})
        ])
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.restore();
        mParticle._resetForTests(MPConfig);
    });

    it('should sync cookies when there was not a previous cookie-sync', function(done) {
        mParticle._resetForTests(MPConfig);
        var pixelSettings = {
            name: 'AdobeEventForwarder',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: 'http://www.yahoo.com',
            redirectUrl: '',
        };

        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(function() {
            var data = mParticle.getInstance()._Persistence.getLocalStorage();
            data[testMPID].csd.should.have.property('5');

            done();
        }, 50);

        Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(
            1
        );
    });

    it('should sync cookies when current date is beyond the frequency cap and the MPID has not changed', function(done) {
        mParticle._resetForTests(MPConfig);
        var pixelSettings = {
            name: 'AdobeEventForwarder',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: 'http://www.yahoo.com',
            redirectUrl: '',
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        setLocalStorage(v4LSKey, {
            cu: testMPID,
            testMPID: {
                csd: { 5: new Date(500).getTime() },
            },
            ie: true,
        });
        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(function() {
            var data = mParticle.getInstance()._Persistence.getLocalStorage();
            var updated = data[testMPID].csd['5'] > 500;

            Should(updated).be.ok();

            done();
        }, 50);

        Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(
            1
        );
    });

    it('should not sync cookies when last date is within frequencyCap', function(done) {
        mParticle._resetForTests(MPConfig);
        var pixelSettings = {
            name: 'AdobeEventForwarder',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: 'http://www.yahoo.com',
            redirectUrl: '',
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        setLocalStorage();
        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];

        var data = mParticle.getInstance()._Persistence.getLocalStorage();

        data[testMPID].csd.should.have.property(
            5,
            mParticle.getInstance()._Persistence.getLocalStorage().testMPID.csd[
                '5'
            ]
        );
        Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(
            1
        );

        done();
    });

    it('should sync cookies when mpid changes', function(done) {
        var pixelSettings = {
            name: 'AdobeEventForwarder',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: 'http://www.yahoo.com',
            redirectUrl: '',
        };
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);
        var data1 = mParticle.getInstance()._Persistence.getLocalStorage();

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login();
        var data2 = mParticle.getInstance()._Persistence.getLocalStorage();
        data1[testMPID].csd[5].should.be.ok();
        data2['otherMPID'].csd[5].should.be.ok();
        Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(
            1
        );

        done();
    });

    it('should not sync cookies when pixelSettings.isDebug is false, pixelSettings.isProduction is true, and mParticle.config.isDevelopmentMode is true', function(done) {
        var pixelSettings = {
            name: 'AdobeEventForwarder',
            moduleId: 5,
            esId: 24053,
            isDebug: false,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: 'http://www.yahoo.com',
            redirectUrl: '',
        };
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = true;
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        var data1 = mParticle.getInstance()._Persistence.getLocalStorage();

        Object.keys(data1[testMPID]).should.not.have.property('csd');
        Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(
            0
        );

        done();
    });

    it('should not sync cookies when pixelSettings.isDebug is true, pixelSettings.isProduction is false, and mParticle.config.isDevelopmentMode is false', function(done) {
        var pixelSettings = {
            name: 'AdobeEventForwarder',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: false,
            settings: {},
            frequencyCap: 14,
            pixelUrl: 'http://www.yahoo.com',
            redirectUrl: '',
        };
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        var data1 = mParticle.getInstance()._Persistence.getLocalStorage();
        data1[testMPID].should.not.have.property('csd');
        Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(
            0
        );

        done();
    });

    it('should replace mpID properly', function(done) {
        var result = mParticle
            .getInstance()
            ._CookieSyncManager.replaceMPID(
                'www.google.com?mpid=%%mpid%%?foo=bar',
                123
            );

        result.should.equal('www.google.com?mpid=123?foo=bar');

        done();
    });

    it("should remove 'amp;' from the URLs", function(done) {
        var result = mParticle
            .getInstance()
            ._CookieSyncManager.replaceAmp(
                'www.google.com?mpid=%%mpid%%&amp;foo=bar'
            );

        result.should.equal('www.google.com?mpid=%%mpid%%&foo=bar');

        done();
    });

    it('parse and capture pixel settings properly from backend', function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.requestConfig = true;
        // create some cookies
        mParticle.init(apiKey, window.mParticle.config);

        var mockForwarder = new MockForwarder('DynamicYield', 128);
        var mockForwarder2 = new MockForwarder('Adobe', 124);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        var forwarderConfigurationResult = {
            pixelConfigs: [
                {
                    name: 'AdobeEventForwarder',
                    moduleId: 5,
                    esId: 24053,
                    isDebug: false,
                    isProduction: true,
                    settings: {},
                    frequencyCap: 14,
                    pixelUrl: 'http://www.yahoo.com',
                    redirectUrl: '',
                },
            ],
        };

        mockServer.respondWith(urls.config, [
            200,
            {},
            JSON.stringify(forwarderConfigurationResult),
        ]);

        mockServer.requests = [];
        // add pixels to preInitConfig
        mParticle.init(apiKey, window.mParticle.config);

        mParticle
            .getInstance()
            ._Store.pixelConfigurations.length.should.equal(1);

            mockServer.respondWith(urls.login, [
                200,
                {},
                JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
            ]);

        // force the preInit cookie configurations to fire
        mParticle.Identity.login({ userIdentities: { customerid: 'abc' } });

        var cookies = getLocalStorage();
        Object.keys(cookies['MPID1'].csd).length.should.equal(1);

        done();
    });
});
