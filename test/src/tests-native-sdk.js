var TestsCore = require('./tests-core'),
    apiKey = TestsCore.apiKey,
    getLocalStorage = TestsCore.getLocalStorage,
    mParticleAndroid = TestsCore.mParticleAndroid;

describe('native-sdk methods', function() {
    it('should invoke logEvent on native SDK and pass through proper event', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        window.mParticle.init(apiKey);

        mParticle.logEvent('testEvent');

        window.mParticleAndroid.logEventCalled.should.equal(true);
        (typeof window.mParticleAndroid.event).should.equal('string');
        JSON.parse(window.mParticleAndroid.event).should.have.properties(['EventName', 'EventCategory', 'EventAttributes', 'EventDataType', 'OptOut']);

        done();
    });

    it('should invoke setAttribute on native SDK and pass through proper data', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        window.mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('key', 'value');

        window.mParticleAndroid.setUserAttributeCalled.should.equal(true);
        window.mParticleAndroid.userAttrData.should.equal(JSON.stringify({key: 'key', value: 'value'}));

        done();
    });

    it('should invoke setAttribute on native SDK and pass through proper data when invoking setUserAttributes', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        window.mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttributes({gender: 'male', age: 21});
        window.mParticleAndroid.setUserAttributeCalled.should.equal(true);
        window.mParticleAndroid.timesSetUserAttributeCalled.should.equal(2);
        window.mParticleAndroid.userAttrData.should.equal(JSON.stringify({key: 'age', value: 21}));

        done();
    });

    it('should invoke removeAttributes on native SDK', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        window.mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('key', 'value');
        mParticle.Identity.getCurrentUser().removeUserAttribute('key');

        window.mParticleAndroid.setUserAttributeCalled.should.equal(true);
        window.mParticleAndroid.removeUserAttributeCalled.should.equal(true);

        done();
    });

    it('should invoke setSessionAttributes on native SDK and pass through proper data', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        window.mParticle.init(apiKey);

        mParticle.setSessionAttribute('key', 'value');

        window.mParticleAndroid.setSessionAttributeCalled.should.equal(true);
        window.mParticleAndroid.sessionAttrData.should.equal(JSON.stringify({key: 'key', value: 'value'}));

        done();
    });

    it('should invoke native sdk method addToCart', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        mParticle.init(apiKey);

        mParticle.eCommerce.Cart.add({});

        window.mParticleAndroid.should.have.property('addToCartCalled', true);

        done();
    });

    it('should invoke native sdk method removeFromCart', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        mParticle.init(apiKey);

        mParticle.eCommerce.Cart.add({ Sku: '12345' });
        mParticle.eCommerce.Cart.remove({ Sku: '12345' });

        window.mParticleAndroid.should.have.property('removeFromCartCalled', true);

        done();
    });

    it('should invoke native sdk method clearCart', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        mParticle.init(apiKey);

        mParticle.eCommerce.Cart.clear();

        window.mParticleAndroid.should.have.property('clearCartCalled', true);

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

    it('should send a JSON object to the native SDK\'s Identity methods', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        window.mParticle.init(apiKey);


        var result,
            identityAPIRequest = {
                userIdentities: {
                    customerid: '123',
                    email: 'test@gmail.com'
                }
            };


        var callback = function(resp) {
            result = resp;
        };

        mParticle.Identity.login(identityAPIRequest, callback);
        result.body.should.equal('Login request sent to native sdk');
        result.httpCode.should.equal(-5);
        result = null;

        mParticle.Identity.logout(identityAPIRequest, callback);
        result.body.should.equal('Logout request sent to native sdk');
        result.httpCode.should.equal(-5);
        result = null;

        mParticle.Identity.modify(identityAPIRequest, callback);
        result.body.should.equal('Modify request sent to native sdk');
        result.httpCode.should.equal(-5);
        result = null;

        mParticle.Identity.identify(identityAPIRequest, callback);
        result.body.should.equal('Identify request sent to native sdk');
        result.httpCode.should.equal(-5);

        var JSONData = JSON.stringify(mParticle._IdentityRequest.convertToNative(identityAPIRequest));

        window.mParticleAndroid.loginData.should.equal(JSONData);
        window.mParticleAndroid.logoutData.should.equal(JSONData);
        window.mParticleAndroid.modifyData.should.equal(JSONData);


        done();
    });
});
