var TestsCore = require('./tests-core'),
    setLocalStorage = TestsCore.setLocalStorage,
    getLocalStorage = TestsCore.getLocalStorage,
    testMPID = TestsCore.testMPID,
    v1localStorageKey = TestsCore.v1localStorageKey,
    apiKey = TestsCore.apiKey,
    server = TestsCore.server;

describe('cookie syncing', function() {
    it('should sync cookies when there was not a previous cookie-sync', function(done) {
        mParticle.reset();
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
    });

    it('should sync cookies when current date is beyond the frequency cap and the MPID has not changed', function(done) {
        mParticle.reset();
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

        setLocalStorage(v1localStorageKey, {
            mpid: testMPID,
            csd: { 5: (new Date(500)).getTime() }
        });

        mParticle.init(apiKey);

        setTimeout(function() {
            var data = mParticle.persistence.getLocalStorage();
            var updated = data[testMPID].csd['5']>500;

            Should(updated).be.ok();

            done();
        }, 50);
    });

    it('should not sync cookies when last date is within frequencyCap', function(done) {
        mParticle.reset();
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

        var lastCookieSyncTime = (new Date().getTime())-5000;
        setLocalStorage(v1localStorageKey, {
            mpid: testMPID,
            csd: { 5: lastCookieSyncTime }
        });
        mParticle.init(apiKey);
        server.requests = [];

        var data = mParticle.persistence.getLocalStorage();

        data[testMPID].csd.should.have.property(5, lastCookieSyncTime);

        done();
    });

    it('should not sync cookies when in a mobile web view for Android', function(done) {
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
        mParticle.reset();
        mParticle.configurePixel(pixelSettings);

        window.mParticleAndroid = true;

        mParticle.init(apiKey);
        var data = getLocalStorage();

        Should(data).not.be.ok();
        done();
    });

    it('should not sync cookies when in a mobile web view', function(done) {
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
        mParticle.reset();
        mParticle.configurePixel(pixelSettings);

        window.mParticle.isIOS = true;
        mParticle.init(apiKey);
        var data = getLocalStorage();

        Should(data).not.be.ok();

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
        mParticle.reset();
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

        done();
    });

    it('should not sync cookies when pixelSettings.isDebug is false, pixelSettings.isProduction is true, and mParticle.isDevelopment is true', function(done) {
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
        mParticle.reset();
        mParticle.isDevelopment = true;
        mParticle.configurePixel(pixelSettings);

        mParticle.init(apiKey);

        var data1 = mParticle.persistence.getLocalStorage();

        Object.keys(data1[testMPID].csd).should.not.have.property(5);

        done();
    });

    it('should not sync cookies when pixelSettings.isDebug is true, pixelSettings.isProduction is false, and mParticle.isDevelopment is false', function(done) {
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
        mParticle.reset();
        mParticle.isDevelopment = false;
        mParticle.configurePixel(pixelSettings);

        mParticle.init(apiKey);

        var data1 = mParticle.persistence.getLocalStorage();
        data1[testMPID].should.not.have.property('csd');

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
