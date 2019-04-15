var TestsCore = require('./tests-core'),
    NativeSdkHelpers = require('../../src/nativeSdkHelpers'),
    apiKey = TestsCore.apiKey,
    getLocalStorage = TestsCore.getLocalStorage,
    mParticleIOS = TestsCore.mParticleIOS,
    MPConfig = TestsCore.MPConfig,
    mParticleAndroid = TestsCore.mParticleAndroid;

describe('native-sdk methods', function() {
    describe('Helper methods', function() {
        beforeEach(function() {
            mParticle.reset(MPConfig);
            delete window.mParticleAndroid_bridgeName_v2;
            delete window.webkit;
            delete window.mParticle.uiwebviewBridgeName;
            delete mParticle.requiredWebviewBridgeName;
            delete mParticle.minWebviewBridgeVersion;
            delete mParticle.isIOS;

            mParticle.init(apiKey);
            mParticle.config = {};
        });

        after(function() {
            delete window.mParticleAndroid_bridgeName_v2;
            delete window.webkit;
            delete window.mParticle.uiwebviewBridgeName;
            delete mParticle.requiredWebviewBridgeName;
            delete mParticle.minWebviewBridgeVersion;
            delete mParticle.isIOS;
        });

        it('isBridgeV2Available returns false if no bridges exist on window', function(done) {
            NativeSdkHelpers.isBridgeV2Available('bridgeName').should.equal(false);

            done();
        });

        it('isBridgeV2Available returns true if iOS bridge messageHandler bridge exists on window', function(done) {
            NativeSdkHelpers.isBridgeV2Available('bridgeName').should.equal(false);
            window.webkit = {
                messageHandlers: {
                    mParticle_bridgeName_v2: { postMessage: null }
                }
            };

            NativeSdkHelpers.isBridgeV2Available('bridgeName').should.equal(true);
            delete window.webkit;

            done();
        });

        it('isBridgeV2Available returns true if iOS bridge nonMessageHandler bridge exists on window', function(done) {
            NativeSdkHelpers.isBridgeV2Available('bridgeName').should.equal(false);
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';

            NativeSdkHelpers.isBridgeV2Available('bridgeName').should.equal(true);
            delete window.webkit;

            done();
        });

        it('isBridgeV2Available returns true if Android bridge exists on window', function(done) {
            NativeSdkHelpers.isBridgeV2Available('bridgeName').should.equal(false);
            window.mParticleAndroid_bridgeName_v2 = new mParticleAndroid();
            NativeSdkHelpers.isBridgeV2Available('bridgeName').should.equal(true);
            delete window.mParticleAndroid_bridgeName_v2;

            done();
        });

        it('isWebviewEnabled returns true if there is no v2Bridge, and minWebviewBridgeVersion is 1, and v1 bridge is available', function(done) {
            mParticle.reset(MPConfig);
            window.mParticle.config.minWebviewBridgeVersion = 1;
            mParticle.config.isIOS = true;
            mParticle.init(apiKey);

            NativeSdkHelpers.isWebviewEnabled('bridgeName', window.mParticle.config.minWebviewBridgeVersion).should.equal(true);

            done();
        });

        it('isWebviewEnabled returns true if there is an Android bridge, minWebviewBridgeVersion is 2', function(done) {
            mParticle.reset(MPConfig);
            window.mParticle.config.minWebviewBridgeVersion = 2;
            mParticle.init(apiKey);

            // window.mParticle.config.minWebviewBridgeVersion = 2;
            window.mParticleAndroid_bridgeName_v2 = new mParticleAndroid();

            NativeSdkHelpers.isWebviewEnabled('bridgeName', window.mParticle.config.minWebviewBridgeVersion).should.equal(true);

            done();
        });

        it('isWebviewEnabled returns true if there is an iOS bridge, minWebviewBridgeVersion is 2', function(done) {
            mParticle.reset(MPConfig);
            window.mParticle.config.minWebviewBridgeVersion = 2;
            window.webkit = {
                messageHandlers: {
                    mParticle_bridgeName_v2: { postMessage: null }
                }
            };
            mParticle.init(apiKey);

            NativeSdkHelpers.isWebviewEnabled('bridgeName', window.mParticle.config.minWebviewBridgeVersion).should.equal(true);

            done();
        });

        it('isWebviewEnabled returns true if there is an iOS nonMessageHandler bridge and minWebviewBridgeVersion is 2', function(done) {
            mParticle.minWebviewBridgeVersion = 2;
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';

            NativeSdkHelpers.isWebviewEnabled('bridgeName', mParticle.minWebviewBridgeVersion).should.equal(true);

            done();
        });

        it('isWebviewEnabled returns true if there is an iOS nonMessageHandler bridge and minWebviewBridgeVersion is 2', function(done) {
            mParticle.minWebviewBridgeVersion = 2;
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';

            NativeSdkHelpers.isWebviewEnabled('bridgeName', mParticle.minWebviewBridgeVersion).should.equal(true);

            done();
        });

        it('isWebviewEnabled returns false if there is a v1 Android bridge, and minWebviewBridgeVersion is 2', function(done) {
            mParticle.reset(MPConfig);
            window.mParticle.config.minWebviewBridgeVersion = 2;
            mParticle.init(apiKey);
            window.mParticleAndroid = new mParticleAndroid();

            NativeSdkHelpers.isWebviewEnabled('bridgeName', window.mParticle.config.minWebviewBridgeVersion).should.equal(false);

            done();
        });

        it('isWebviewEnabled returns false if there is a v1 iOS bridge, and minWebviewBridgeVersion is 2', function(done) {
            mParticle.reset(MPConfig);
            window.mParticle.config.minWebviewBridgeVersion = 2;
            mParticle.init(apiKey);
            mParticle.isIOS = true;

            NativeSdkHelpers.isWebviewEnabled('bridgeName', window.mParticle.config.minWebviewBridgeVersion).should.equal(false);

            delete mParticle.isIOS;

            done();
        });

        it('isWebviewEnabled returns true if there is a v2 Android bridge, and minWebviewBridgeVersion is 1, and no v1 Android bridge exists', function(done) {
            mParticle.minWebviewBridgeVersion = 1;
            window.mParticleAndroid_bridgeName_v2 = new mParticleAndroid();

            NativeSdkHelpers.isWebviewEnabled('bridgeName', mParticle.minWebviewBridgeVersion).should.equal(true);

            done();
        });

        it('isWebviewEnabled returns true if there is a v2 iOS messageHandler bridge, and minWebviewBridgeVersion is 1, and no v1 ios bridge exists', function(done) {
            mParticle.minWebviewBridgeVersion = 1;
            window.webkit = {
                messageHandlers: {
                    mParticle_bridgeName_v2: { postMessage: null }
                }
            };

            NativeSdkHelpers.isWebviewEnabled('bridgeName', mParticle.minWebviewBridgeVersion).should.equal(true);

            done();
        });

        it('isWebviewEnabled returns true if there is a v2 iOS nonMessageHandler bridge, and minWebviewBridgeVersion is 1, and no v1 ios bridge exists', function(done) {
            mParticle.minWebviewBridgeVersion = 1;
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';

            NativeSdkHelpers.isWebviewEnabled('bridgeName', mParticle.minWebviewBridgeVersion).should.equal(true);

            delete mParticle.isIOS;

            done();
        });

        it('isWebviewEnabled returns true if there is a v2 Android bridge, and minWebviewBridgeVersion is 1, and no v1 Android bridge exists', function(done) {
            mParticle.minWebviewBridgeVersion = 1;
            window.mParticleAndroid_bridgeName_v2 = new mParticleAndroid();

            NativeSdkHelpers.isWebviewEnabled('bridgeName', mParticle.minWebviewBridgeVersion).should.equal(true);

            done();
        });

        it('isWebviewEnabled returns true if there is a v2 iOS messageHandler bridge, and minWebviewBridgeVersion is 1, and no v1 ios bridge exists', function(done) {
            mParticle.minWebviewBridgeVersion = 1;
            window.webkit = {
                messageHandlers: {
                    mParticle_bridgeName_v2: { postMessage: null }
                }
            };

            NativeSdkHelpers.isWebviewEnabled('bridgeName', mParticle.minWebviewBridgeVersion).should.equal(true);

            done();
        });

        it('isWebviewEnabled returns true if there is a v2 iOS nonMessageHandler bridge, and minWebviewBridgeVersion is 1, and no v1 ios bridge exists', function(done) {
            mParticle.minWebviewBridgeVersion = 1;
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';

            NativeSdkHelpers.isWebviewEnabled('bridgeName', mParticle.minWebviewBridgeVersion).should.equal(true);

            done();
        });

        it('isWebviewEnabled returns false if there is an unmatched requiredWebviewBridgeName, even if bridge 1 exists and min version is 1', function(done) {
            mParticle.minWebviewBridgeVersion = 1;
            mParticle.requiredWebviewBridgeName = 'nonmatching';
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';
            mParticle.isIOS = true;

            NativeSdkHelpers.isWebviewEnabled(mParticle.requiredWebviewBridgeName, mParticle.minWebviewBridgeVersion).should.equal(false);
            delete mParticle.isIOS;
            done();
        });
    });

    describe('bridge version 1', function() {
        beforeEach(function() {
            mParticle.reset(MPConfig);
            window.mParticleAndroid = new mParticleAndroid();
            window.mParticle.config.minWebviewBridgeVersion = 1;
            mParticle.init(apiKey);
        });

        it('invoke setSessionAttributes of $src_key/$src_env of apikey/\'webview\' to the native SDK\'s on init if apiKey is available', function(done) {
            mParticle.reset(MPConfig);
            window.mParticleAndroid = new mParticleAndroid();
            window.mParticle.init(apiKey);

            window.mParticleAndroid.sessionAttrData.length.should.equal(2);
            JSON.parse(window.mParticleAndroid.sessionAttrData[0]).should.have.property('key', '$src_env');
            JSON.parse(window.mParticleAndroid.sessionAttrData[0]).should.have.property('value', 'webview');
            JSON.parse(window.mParticleAndroid.sessionAttrData[1]).should.have.property('key', '$src_key');
            JSON.parse(window.mParticleAndroid.sessionAttrData[1]).should.have.property('value', apiKey);

            window.mParticleAndroid.resetSessionAttrData();

            window.mParticle.init();

            window.mParticleAndroid.sessionAttrData.length.should.equal(1);
            JSON.parse(window.mParticleAndroid.sessionAttrData[0]).should.have.property('key', '$src_env');
            JSON.parse(window.mParticleAndroid.sessionAttrData[0]).should.have.property('value', 'webview');

            done();
        });

        it('should invoke setSessionAttributes on native SDK and pass through proper data', function(done) {
            window.mParticleAndroid.resetSessionAttrData();

            mParticle.setSessionAttribute('key', 'value');

            window.mParticleAndroid.setSessionAttributeCalled.should.equal(true);
            window.mParticleAndroid.sessionAttrData[0].should.equal(JSON.stringify({key: 'key', value: 'value'}));
            done();
        });

        it('should invoke logEvent on native SDK and pass through proper event', function(done) {
            mParticle.logEvent('testEvent');

            window.mParticleAndroid.logEventCalled.should.equal(true);
            (typeof window.mParticleAndroid.event).should.equal('string');
            JSON.parse(window.mParticleAndroid.event).should.have.properties(['EventName', 'EventCategory', 'EventAttributes', 'EventDataType', 'OptOut']);

            done();
        });

        it('should invoke setAttribute on native SDK and pass through proper data', function(done) {
            mParticle.Identity.getCurrentUser().setUserAttribute('key', 'value');

            window.mParticleAndroid.setUserAttributeCalled.should.equal(true);

            window.mParticleAndroid.userAttrData[0].should.equal(JSON.stringify({key: 'key', value: 'value'}));
            window.mParticleAndroid.resetUserAttributes();

            done();
        });

        it('should invoke setAttribute on native SDK and pass through proper data when invoking setUserAttributes', function(done) {
            mParticle.Identity.getCurrentUser().setUserAttributes({gender: 'male', age: 21});
            window.mParticleAndroid.setUserAttributeCalled.should.equal(true);
            window.mParticleAndroid.userAttrData[0].should.equal(JSON.stringify({key: 'gender', value: 'male'}));
            window.mParticleAndroid.userAttrData[1].should.equal(JSON.stringify({key: 'age', value: 21}));

            done();
        });

        it('should invoke removeAttributes on native SDK', function(done) {
            mParticle.Identity.getCurrentUser().setUserAttribute('key', 'value');
            mParticle.Identity.getCurrentUser().removeUserAttribute('key');

            window.mParticleAndroid.setUserAttributeCalled.should.equal(true);
            window.mParticleAndroid.removeUserAttributeCalled.should.equal(true);

            done();
        });

        // TBD _ ask will/peter about add to cart array vs product?
        it('should invoke native sdk method addToCart', function(done) {
            var product = mParticle.eCommerce.createProduct('name', 'sku', 10, 1);
            var product2 = mParticle.eCommerce.createProduct('name', 'sku', 10, 1);

            mParticle.eCommerce.Cart.add(product);

            window.mParticleAndroid.should.have.property('addToCartCalled', true);
            window.mParticleAndroid.addedToCartItem.should.equal(JSON.stringify([product]));
            window.mParticleAndroid.clearCart();

            mParticle.eCommerce.Cart.add([product, product2]);

            window.mParticleAndroid.addedToCartItem.should.equal(JSON.stringify([product, product2]));

            done();
        });

        it('should invoke native sdk method removeFromCart', function(done) {
            var product = mParticle.eCommerce.createProduct('name', 'sku', 10, 1);

            mParticle.eCommerce.Cart.add(product);
            mParticle.eCommerce.Cart.remove(product);

            window.mParticleAndroid.should.have.property('removeFromCartCalled', true);
            window.mParticleAndroid.removedFromCartItem.should.equal(JSON.stringify(product));

            done();
        });

        it('should invoke native sdk method clearCart', function(done) {
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
            mParticle.configurePixel(pixelSettings);

            mParticle.init(apiKey);
            var data = getLocalStorage();

            Should(data).not.be.ok();
            done();
        });

        it('should send a JSON object to the native SDK\'s Identity methods', function(done) {
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

    describe('bridge version 2', function() {
        describe('android', function() {
            var mParticleAndroidV2Bridge;
            beforeEach(function() {
                mParticle.reset(MPConfig);
                window.mParticle.config.minWebviewBridgeVersion = 2;
                window.mParticle.config.requiredWebviewBridgeName = 'bridgeName';
                window.mParticleAndroid_bridgeName_v2 = new mParticleAndroid();
                mParticleAndroidV2Bridge = window.mParticleAndroid_bridgeName_v2;

                window.mParticle.init(apiKey);
                mParticle.config = {};
            });

            afterEach(function() {
                delete window.mParticle.config;
                delete window.mParticleAndroid_bridgeName_v2;
            });

            it('should invoke logEvent on native SDK and pass through proper event', function(done) {
                mParticle.logEvent('testEvent');

                mParticleAndroidV2Bridge.logEventCalled.should.equal(true);
                (typeof mParticleAndroidV2Bridge.event).should.equal('string');
                JSON.parse(mParticleAndroidV2Bridge.event).should.have.properties(['EventName', 'EventCategory', 'EventAttributes', 'EventDataType', 'OptOut']);

                done();
            });

            it('should invoke setAttribute on native SDK and pass through proper data', function(done) {
                mParticle.Identity.getCurrentUser().setUserAttribute('key', 'value');

                mParticleAndroidV2Bridge.setUserAttributeCalled.should.equal(true);
                mParticleAndroidV2Bridge.userAttrData[0].should.equal(JSON.stringify({key: 'key', value: 'value'}));
                mParticleAndroidV2Bridge.resetUserAttributes();
                done();
            });

            it('should invoke setAttribute on native SDK and pass through proper data when invoking setUserAttributes', function(done) {
                mParticle.Identity.getCurrentUser().setUserAttributes({gender: 'male', age: 21});
                mParticleAndroidV2Bridge.setUserAttributeCalled.should.equal(true);
                mParticleAndroidV2Bridge.userAttrData[0].should.equal(JSON.stringify({key: 'gender', value: 'male'}));
                mParticleAndroidV2Bridge.userAttrData[1].should.equal(JSON.stringify({key: 'age', value: 21}));
                mParticleAndroidV2Bridge.resetUserAttributes();

                done();
            });

            it('should invoke removeAttributes on native SDK', function(done) {
                mParticle.Identity.getCurrentUser().setUserAttribute('key', 'value');
                mParticle.Identity.getCurrentUser().removeUserAttribute('key');

                mParticleAndroidV2Bridge.setUserAttributeCalled.should.equal(true);
                mParticleAndroidV2Bridge.removeUserAttributeCalled.should.equal(true);

                done();
            });

            it('should invoke setSessionAttributes on native SDK and pass through proper data', function(done) {
                mParticle.setSessionAttribute('key', 'value');

                mParticleAndroidV2Bridge.setSessionAttributeCalled.should.equal(true);
                mParticleAndroidV2Bridge.sessionAttrData[2].should.equal(JSON.stringify({key: 'key', value: 'value'}));

                done();
            });

            it('should invoke native sdk method addToCart', function(done) {
                var product = mParticle.eCommerce.createProduct('name', 'sku', 10, 1);
                var product2 = mParticle.eCommerce.createProduct('name', 'sku', 10, 1);

                mParticle.eCommerce.Cart.add(product);

                mParticleAndroidV2Bridge.should.have.property('addToCartCalled', true);
                mParticleAndroidV2Bridge.addedToCartItem.should.equal(JSON.stringify([product]));

                mParticleAndroidV2Bridge.clearCart();

                mParticle.eCommerce.Cart.add([product, product2]);

                mParticleAndroidV2Bridge.addedToCartItem.should.equal(JSON.stringify([product, product2]));

                done();
            });

            it('should invoke native sdk method removeFromCart', function(done) {
                var product = mParticle.eCommerce.createProduct('name', 'sku', 10, 1);

                mParticle.eCommerce.Cart.add(product);
                mParticle.eCommerce.Cart.remove(product);

                mParticleAndroidV2Bridge.should.have.property('removeFromCartCalled', true);
                mParticleAndroidV2Bridge.removedFromCartItem.should.equal(JSON.stringify(product));

                mParticleAndroidV2Bridge.should.have.property('removeFromCartCalled', true);

                done();
            });

            it('should invoke native sdk method clearCart', function(done) {
                mParticle.eCommerce.Cart.clear();

                mParticleAndroidV2Bridge.should.have.property('clearCartCalled', true);

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
                mParticle.configurePixel(pixelSettings);

                var data = getLocalStorage();

                Should(data).not.be.ok();
                done();
            });

            it('should send a JSON object to the native SDK\'s Identity methods', function(done) {
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

                mParticleAndroidV2Bridge.loginData.should.equal(JSONData);
                mParticleAndroidV2Bridge.logoutData.should.equal(JSONData);
                mParticleAndroidV2Bridge.modifyData.should.equal(JSONData);

                done();
            });
        });

        describe('iOS', function() {
            var mParticleIOSV2Bridge;
            beforeEach(function() {
                mParticle.reset(MPConfig);
                window.mParticle.config.minWebviewBridgeVersion = 2;
                window.mParticle.config.requiredWebviewBridgeName = 'bridgeName';
                window.webkit = {
                    messageHandlers: {
                        mParticle_bridgeName_v2: new mParticleIOS()
                    }
                };
                mParticleIOSV2Bridge = window.webkit.messageHandlers.mParticle_bridgeName_v2;

                mParticle.enableWebviewBridge = true;
                window.mParticle.init(apiKey);
                mParticle.config = {};
                mParticleIOSV2Bridge.reset();
            });

            afterEach(function() {
                delete window.webkit;
                delete mParticle.requiredWebviewBridgeName;
                delete mParticle.enableWebviewBridge;
            });

            it('should invoke logEvent on native SDK and pass through proper event', function(done) {
                mParticle.logEvent('testEvent');

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(['path', 'value']);
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal('logEvent');
                JSON.parse(mParticleIOSV2Bridge.data[0]).value.should.have.properties(['EventName', 'EventCategory', 'EventAttributes', 'EventDataType', 'OptOut']);

                done();
            });

            it('should invoke setAttribute on native SDK and pass through proper data', function(done) {
                mParticle.Identity.getCurrentUser().setUserAttribute('key', 'value');
                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(['path', 'value']);
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal('setUserAttribute');
                JSON.parse(mParticleIOSV2Bridge.data[0]).value.should.have.property('key', 'key');
                JSON.parse(mParticleIOSV2Bridge.data[0]).value.should.have.property('value', 'value');

                done();
            });

            it('should invoke setAttribute on native SDK and pass through proper data when invoking setUserAttributes', function(done) {
                mParticle.Identity.getCurrentUser().setUserAttributes({gender: 'male', age: 21});

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(['path', 'value']);
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal('setUserAttribute');
                JSON.parse(mParticleIOSV2Bridge.data[0]).value.should.have.property('key', 'gender');
                JSON.parse(mParticleIOSV2Bridge.data[0]).value.should.have.property('value', 'male');
                JSON.parse(mParticleIOSV2Bridge.data[1]).should.have.properties(['path', 'value']);
                JSON.parse(mParticleIOSV2Bridge.data[1]).path.should.equal('setUserAttribute');
                JSON.parse(mParticleIOSV2Bridge.data[1]).value.should.have.property('key', 'age');
                JSON.parse(mParticleIOSV2Bridge.data[1]).value.should.have.property('value', 21);

                done();
            });

            it('should invoke removeAttributes on native SDK', function(done) {
                mParticle.Identity.getCurrentUser().setUserAttribute('key', 'value');
                mParticle.Identity.getCurrentUser().removeUserAttribute('key');

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(['path', 'value']);
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal('setUserAttribute');
                JSON.parse(mParticleIOSV2Bridge.data[0]).value.should.have.property('key', 'key');
                JSON.parse(mParticleIOSV2Bridge.data[0]).value.should.have.property('value', 'value');
                JSON.parse(mParticleIOSV2Bridge.data[1]).should.have.properties(['path', 'value']);
                JSON.parse(mParticleIOSV2Bridge.data[1]).path.should.equal('removeUserAttribute');
                JSON.parse(mParticleIOSV2Bridge.data[1]).value.should.have.property('key', 'key');
                JSON.parse(mParticleIOSV2Bridge.data[1]).value.should.have.property('value', null);


                done();
            });

            it('should invoke setSessionAttributes on native SDK and pass through proper data', function(done) {
                mParticle.setSessionAttribute('key', 'value');

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(['path', 'value']);
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal('setSessionAttribute');
                JSON.parse(mParticleIOSV2Bridge.data[0]).value.should.have.property('key', 'key');
                JSON.parse(mParticleIOSV2Bridge.data[0]).value.should.have.property('value', 'value');

                done();
            });

            it('should invoke native sdk method addToCart', function(done) {
                var product = mParticle.eCommerce.createProduct('name', 'sku', 10, 1);
                var product2 = mParticle.eCommerce.createProduct('name', 'sku', 10, 1);

                mParticle.eCommerce.Cart.add(product);

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(['path', 'value']);
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal('addToCart');
                JSON.stringify(JSON.parse(mParticleIOSV2Bridge.data[0]).value).should.equal(JSON.stringify([product]));
                mParticleIOSV2Bridge.reset();

                mParticle.eCommerce.Cart.add([product, product2]);
                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(['path', 'value']);
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal('addToCart');
                JSON.stringify(JSON.parse(mParticleIOSV2Bridge.data[0]).value).should.equal(JSON.stringify([product, product2]));

                done();
            });

            it('should invoke native sdk method removeFromCart', function(done) {
                var product = mParticle.eCommerce.createProduct('name', 'sku', 10, 1);

                mParticle.eCommerce.Cart.remove(product);

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(['path', 'value']);
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal('removeFromCart');
                JSON.stringify(JSON.parse(mParticleIOSV2Bridge.data[0]).value).should.equal(JSON.stringify(product));

                done();
            });

            it('should invoke native sdk method clearCart', function(done) {
                mParticle.eCommerce.Cart.clear();

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(['path', 'value']);
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal('clearCart');

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
                mParticle.configurePixel(pixelSettings);

                var data = getLocalStorage();

                Should(data).not.be.ok();
                done();
            });

            it('should send a JSON object to the native SDK\'s Identity methods', function(done) {
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

                var JSONData = JSON.stringify(mParticle._IdentityRequest.convertToNative(identityAPIRequest));

                mParticle.Identity.login(identityAPIRequest, callback);
                result.body.should.equal('Login request sent to native sdk');
                result.httpCode.should.equal(-5);
                result = null;
                JSON.stringify(JSON.parse(mParticleIOSV2Bridge.data[0]).value).should.equal(JSONData);
                mParticleIOSV2Bridge.reset();

                mParticle.Identity.logout(identityAPIRequest, callback);
                result.body.should.equal('Logout request sent to native sdk');
                result.httpCode.should.equal(-5);
                result = null;
                JSON.stringify(JSON.parse(mParticleIOSV2Bridge.data[0]).value).should.equal(JSONData);
                mParticleIOSV2Bridge.reset();

                mParticle.Identity.modify(identityAPIRequest, callback);
                result.body.should.equal('Modify request sent to native sdk');
                result.httpCode.should.equal(-5);
                result = null;
                JSON.stringify(JSON.parse(mParticleIOSV2Bridge.data[0]).value).should.equal(JSONData);
                mParticleIOSV2Bridge.reset();


                mParticle.Identity.identify(identityAPIRequest, callback);
                result.body.should.equal('Identify request sent to native sdk');
                result.httpCode.should.equal(-5);
                JSON.stringify(JSON.parse(mParticleIOSV2Bridge.data[0]).value).should.equal(JSONData);
                mParticleIOSV2Bridge.reset();

                done();
            });
        });
    });
});
