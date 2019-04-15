var TestsCore = require('./tests-core'),
    setLocalStorage = TestsCore.setLocalStorage,
    testMPID = TestsCore.testMPID,
    MPConfig = TestsCore.MPConfig,
    v4LSKey = TestsCore.v4LSKey,
    apiKey = TestsCore.apiKey,
    server = TestsCore.server;

describe('cookie syncing', function() {
    it('should sync cookies when there was not a previous cookie-sync', function(done) {
        mParticle.reset(MPConfig);
        var pixelSettings = {
            name: 'AdobeEventForwarder',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl:'http://www.yahoo.com',
            redirectUrl:''
        };
        mParticle.configurePixel(pixelSettings);

        mParticle.init(apiKey);

        setTimeout(function() {
            var data = mParticle.persistence.getLocalStorage();
            data[testMPID].csd.should.have.property('5');

            done();
        }, 50);

        Should(mParticle.preInit.pixelConfigurations.length).equal(1);
    });

    it('should sync cookies when current date is beyond the frequency cap and the MPID has not changed', function(done) {
        mParticle.reset(MPConfig);
        var pixelSettings = {
            name: 'AdobeEventForwarder',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl:'http://www.yahoo.com',
            redirectUrl:''
        };
        mParticle.configurePixel(pixelSettings);

        setLocalStorage(v4LSKey, {
            cu: testMPID,
            testMPID: {
                csd: { 5: (new Date(500)).getTime() }
            },
            ie: true
        });
        mParticle.init(apiKey);

        setTimeout(function() {
            var data = mParticle.persistence.getLocalStorage();
            var updated = data[testMPID].csd['5']>500;

            Should(updated).be.ok();

            done();
        }, 50);

        Should(mParticle.preInit.pixelConfigurations.length).equal(1);
    });

    it('should not sync cookies when last date is within frequencyCap', function(done) {
        mParticle.reset(MPConfig);
        var pixelSettings = {
            name: 'AdobeEventForwarder',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl:'http://www.yahoo.com',
            redirectUrl:''
        };
        mParticle.configurePixel(pixelSettings);

        setLocalStorage();
        mParticle.init(apiKey);
        server.requests = [];

        var data = mParticle.persistence.getLocalStorage();

        data[testMPID].csd.should.have.property(5, mParticle.persistence.getLocalStorage().testMPID.csd['5']);
        Should(mParticle.preInit.pixelConfigurations.length).equal(1);

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
            pixelUrl:'http://www.yahoo.com',
            redirectUrl:''
        };
        mParticle.reset(MPConfig);
        mParticle.configurePixel(pixelSettings);

        mParticle.init(apiKey);
        var data1 = mParticle.persistence.getLocalStorage();

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.login();
        var data2 = mParticle.persistence.getLocalStorage();
        data1[testMPID].csd[5].should.be.ok();
        data2['otherMPID'].csd[5].should.be.ok();
        Should(mParticle.preInit.pixelConfigurations.length).equal(1);

        done();
    });

    it('should not sync cookies when pixelSettings.isDebug is false, pixelSettings.isProduction is true, and mParticle.preInit.isDevelopmentMode is true', function(done) {
        var pixelSettings = {
            name: 'AdobeEventForwarder',
            moduleId: 5,
            esId: 24053,
            isDebug: false,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl:'http://www.yahoo.com',
            redirectUrl:''
        };
        mParticle.reset(MPConfig);
        mParticle.preInit.isDevelopmentMode = true;
        mParticle.configurePixel(pixelSettings);

        mParticle.init(apiKey);

        var data1 = mParticle.persistence.getLocalStorage();

        Object.keys(data1[testMPID]).should.not.have.property('csd');
        Should(mParticle.preInit.pixelConfigurations.length).equal(0);

        done();
    });

    it('should not sync cookies when pixelSettings.isDebug is true, pixelSettings.isProduction is false, and mParticle.preInit.isDevelopmentMode is false', function(done) {
        var pixelSettings = {
            name: 'AdobeEventForwarder',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: false,
            settings: {},
            frequencyCap: 14,
            pixelUrl:'http://www.yahoo.com',
            redirectUrl:''
        };
        mParticle.reset(MPConfig);
        mParticle.preInit.isDevelopmentMode = false;
        mParticle.configurePixel(pixelSettings);

        mParticle.init(apiKey);

        var data1 = mParticle.persistence.getLocalStorage();
        data1[testMPID].should.not.have.property('csd');
        Should(mParticle.preInit.pixelConfigurations.length).equal(0);

        done();
    });

    it('should replace mpID properly', function(done) {
        var result = mParticle.cookieSyncManager.replaceMPID('www.google.com?mpid=%%mpid%%?foo=bar', 123);

        result.should.equal('www.google.com?mpid=123?foo=bar');

        done();
    });

    it('should remove \'amp;\' from the URLs', function(done) {
        var result = mParticle.cookieSyncManager.replaceAmp('www.google.com?mpid=%%mpid%%&amp;foo=bar');

        result.should.equal('www.google.com?mpid=%%mpid%%&foo=bar');

        done();
    });
});
