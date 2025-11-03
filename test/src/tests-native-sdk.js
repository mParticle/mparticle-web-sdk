import Utils from './config/utils';
import { apiKey, MPConfig } from './config/constants';
import Constants from '../../src/constants';

const getLocalStorage = Utils.getLocalStorage,
    mParticleIOS = Utils.mParticleIOS,
    mParticleAndroid = Utils.mParticleAndroid,
    HTTPCodes = Constants.HTTPCodes;

describe('native-sdk methods', function() {
    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
    });

    describe('Helper methods', function() {
        beforeEach(function() {
            delete window.mParticleAndroid_bridgeName_v2;
            delete window.webkit;
            delete window.mParticle.uiwebviewBridgeName;
            delete mParticle.requiredWebviewBridgeName;
            delete mParticle.minWebviewBridgeVersion;
            delete mParticle.isIOS;

            mParticle.init(apiKey, window.mParticle.config);
            mParticle.config = {};
            window.mParticleAndroid = null;
            window.mParticle.isIOS = null;
        });

        after(function() {
            delete window.mParticleAndroid_bridgeName_v2;
            delete window.webkit;
            delete window.mParticle.uiwebviewBridgeName;
            delete mParticle.requiredWebviewBridgeName;
            delete mParticle.minWebviewBridgeVersion;
            delete mParticle.isIOS;
        });

        it('isBridgeV2Available returns false if no bridges exist on window', () => {
            mParticle
                .getInstance()
                ._NativeSdkHelpers.isBridgeV2Available('bridgeName')
                .should.equal(false);
        });

        it('isBridgeV2Available returns true if iOS bridge messageHandler bridge exists on window', () => {
            mParticle
                .getInstance()
                ._NativeSdkHelpers.isBridgeV2Available('bridgeName')
                .should.equal(false);
            window.webkit = {
                messageHandlers: {
                    mParticle_bridgeName_v2: { postMessage: null },
                },
            };

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isBridgeV2Available('bridgeName')
                .should.equal(true);
            delete window.webkit;
        });

        it('isBridgeV2Available returns true if iOS bridge nonMessageHandler bridge exists on window', () => {
            mParticle
                .getInstance()
                ._NativeSdkHelpers.isBridgeV2Available('bridgeName')
                .should.equal(false);
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isBridgeV2Available('bridgeName')
                .should.equal(true);
            delete window.webkit;
        });

        it('isBridgeV2Available returns true if Android bridge exists on window', () => {
            mParticle
                .getInstance()
                ._NativeSdkHelpers.isBridgeV2Available('bridgeName')
                .should.equal(false);
            window.mParticleAndroid_bridgeName_v2 = new mParticleAndroid();
            mParticle
                .getInstance()
                ._NativeSdkHelpers.isBridgeV2Available('bridgeName')
                .should.equal(true);
            delete window.mParticleAndroid_bridgeName_v2;
        });

        it('isWebviewEnabled returns true if there is no v2Bridge, and minWebviewBridgeVersion is 1, and v1 bridge is available', () => {
            window.mParticle.config.minWebviewBridgeVersion = 1;
            mParticle.config.isIOS = true;
            mParticle.init(apiKey, window.mParticle.config);

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    window.mParticle.config.minWebviewBridgeVersion
                )
                .should.equal(true);
        });

        it('isWebviewEnabled returns true if there is an Android bridge, minWebviewBridgeVersion is 2', () => {
            window.mParticle.config.minWebviewBridgeVersion = 2;
            mParticle.init(apiKey, window.mParticle.config);

            // window.mParticle.config.minWebviewBridgeVersion = 2;
            window.mParticleAndroid_bridgeName_v2 = new mParticleAndroid();

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    window.mParticle.config.minWebviewBridgeVersion
                )
                .should.equal(true);
        });

        it('isWebviewEnabled returns true if there is an iOS bridge, minWebviewBridgeVersion is 2', () => {
            window.mParticle.config.minWebviewBridgeVersion = 2;
            window.webkit = {
                messageHandlers: {
                    mParticle_bridgeName_v2: { postMessage: null },
                },
            };
            mParticle.init(apiKey, window.mParticle.config);

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    window.mParticle.config.minWebviewBridgeVersion
                )
                .should.equal(true);
        });

        it('isWebviewEnabled returns true if there is an iOS nonMessageHandler bridge and minWebviewBridgeVersion is 2', () => {
            mParticle.minWebviewBridgeVersion = 2;
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    mParticle.minWebviewBridgeVersion
                )
                .should.equal(true);
        });

        it('isWebviewEnabled returns true if there is an iOS nonMessageHandler bridge and minWebviewBridgeVersion is 2', () => {
            mParticle.minWebviewBridgeVersion = 2;
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    mParticle.minWebviewBridgeVersion
                )
                .should.equal(true);
        });

        it('isWebviewEnabled returns false if there is a v1 Android bridge, and minWebviewBridgeVersion is 2', () => {
            window.mParticle.config.minWebviewBridgeVersion = 2;
            mParticle.init(apiKey, window.mParticle.config);
            window.mParticleAndroid = new mParticleAndroid();

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    window.mParticle.config.minWebviewBridgeVersion
                )
                .should.equal(false);
        });

        it('isWebviewEnabled returns false if there is a v1 iOS bridge, and minWebviewBridgeVersion is 2', () => {
            window.mParticle.config.minWebviewBridgeVersion = 2;
            mParticle.init(apiKey, window.mParticle.config);
            mParticle.isIOS = true;

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    window.mParticle.config.minWebviewBridgeVersion
                )
                .should.equal(false);

            delete mParticle.isIOS;
        });

        it('isWebviewEnabled returns true if there is a v2 Android bridge, and minWebviewBridgeVersion is 1, and no v1 Android bridge exists', () => {
            mParticle.minWebviewBridgeVersion = 1;
            window.mParticleAndroid_bridgeName_v2 = new mParticleAndroid();

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    mParticle.minWebviewBridgeVersion
                )
                .should.equal(true);
        });

        it('isWebviewEnabled returns true if there is a v2 iOS messageHandler bridge, and minWebviewBridgeVersion is 1, and no v1 ios bridge exists', () => {
            mParticle.minWebviewBridgeVersion = 1;
            window.webkit = {
                messageHandlers: {
                    mParticle_bridgeName_v2: { postMessage: null },
                },
            };

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    mParticle.minWebviewBridgeVersion
                )
                .should.equal(true);
        });

        it('isWebviewEnabled returns true if there is a v2 iOS nonMessageHandler bridge, and minWebviewBridgeVersion is 1, and no v1 ios bridge exists', () => {
            mParticle.minWebviewBridgeVersion = 1;
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    mParticle.minWebviewBridgeVersion
                )
                .should.equal(true);

            delete mParticle.isIOS;
        });

        it('isWebviewEnabled returns true if there is a v2 Android bridge, and minWebviewBridgeVersion is 1, and no v1 Android bridge exists', () => {
            mParticle.minWebviewBridgeVersion = 1;
            window.mParticleAndroid_bridgeName_v2 = new mParticleAndroid();

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    mParticle.minWebviewBridgeVersion
                )
                .should.equal(true);
        });

        it('isWebviewEnabled returns true if there is a v2 iOS messageHandler bridge, and minWebviewBridgeVersion is 1, and no v1 ios bridge exists', () => {
            mParticle.minWebviewBridgeVersion = 1;
            window.webkit = {
                messageHandlers: {
                    mParticle_bridgeName_v2: { postMessage: null },
                },
            };

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    mParticle.minWebviewBridgeVersion
                )
                .should.equal(true);
        });

        it('isWebviewEnabled returns true if there is a v2 iOS nonMessageHandler bridge, and minWebviewBridgeVersion is 1, and no v1 ios bridge exists', () => {
            mParticle.minWebviewBridgeVersion = 1;
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';

            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    'bridgeName',
                    mParticle.minWebviewBridgeVersion
                )
                .should.equal(true);
        });

        it('isWebviewEnabled returns false if there is an unmatched requiredWebviewBridgeName, even if bridge 1 exists and min version is 1', () => {
            mParticle.minWebviewBridgeVersion = 1;
            mParticle.requiredWebviewBridgeName = 'nonmatching';
            window.mParticle.uiwebviewBridgeName = 'mParticle_bridgeName_v2';
            mParticle.isIOS = true;
            mParticle
                .getInstance()
                ._NativeSdkHelpers.isWebviewEnabled(
                    mParticle.requiredWebviewBridgeName,
                    mParticle.minWebviewBridgeVersion
                )
                .should.equal(false);
            delete mParticle.isIOS;
        });
    });

    describe('bridge version 1', function() {
        beforeEach(function() {
            window.mParticleAndroid = null;
            window.mParticle.isIOS = null;
            window.mParticleAndroid = new mParticleAndroid();
            window.mParticle.config.minWebviewBridgeVersion = 1;
            mParticle.init(apiKey, window.mParticle.config);
        });

        it('should set mParitcle._Store.SDKConfig.isIOS to true when mParticle.isIOS is true', () => {
            mParticle.isIOS = true;
            mParticle.init(apiKey, window.mParticle.config);

            mParticle.getInstance()._Store.SDKConfig.isIOS.should.equal(true);
        });

        it('invoke setSessionAttributes of $src_key/$src_env of apikey/\'webview\' to the Android\'s on init if apiKey is available', () => {
            window.mParticleAndroid = new mParticleAndroid();
            window.mParticle.init(apiKey, window.mParticle.config);

            window.mParticleAndroid.sessionAttrData.length.should.equal(2);
            JSON.parse(
                window.mParticleAndroid.sessionAttrData[0]
            ).should.have.property('key', '$src_env');
            JSON.parse(
                window.mParticleAndroid.sessionAttrData[0]
            ).should.have.property('value', 'webview');
            JSON.parse(
                window.mParticleAndroid.sessionAttrData[1]
            ).should.have.property('key', '$src_key');
            JSON.parse(
                window.mParticleAndroid.sessionAttrData[1]
            ).should.have.property('value', apiKey);
        });

        it('invoke only setSessionAttributes of $src_key/$src_env if apikey is missing from webview', () => {
            window.mParticleAndroid = new mParticleAndroid();
            window.mParticle.init(null, window.mParticle.config);

            window.mParticleAndroid.sessionAttrData.length.should.equal(1);
            JSON.parse(
                window.mParticleAndroid.sessionAttrData[0]
            ).should.have.property('key', '$src_env');
            JSON.parse(
                window.mParticleAndroid.sessionAttrData[0]
            ).should.have.property('value', 'webview');
        });

        it('should invoke setSessionAttributes on Android and pass through proper data', () => {
            window.mParticleAndroid.resetSessionAttrData();

            mParticle.setSessionAttribute('key', 'value');

            window.mParticleAndroid.setSessionAttributeCalled.should.equal(
                true
            );
            window.mParticleAndroid.sessionAttrData[0].should.equal(
                JSON.stringify({ key: 'key', value: 'value' })
            );
        });

        it('should invoke logEvent on Android and pass through proper event', () => {
            mParticle.logEvent('testEvent');

            window.mParticleAndroid.logEventCalled.should.equal(true);
            (typeof window.mParticleAndroid.event).should.equal('string');
            JSON.parse(window.mParticleAndroid.event).should.have.properties([
                'EventName',
                'EventCategory',
                'EventAttributes',
                'EventDataType',
                'OptOut',
            ]);
        });

        it('should invoke setAttribute on Android and pass through proper data', () => {
            mParticle.Identity.getCurrentUser().setUserAttribute(
                'key',
                'value'
            );

            window.mParticleAndroid.setUserAttributeCalled.should.equal(true);

            window.mParticleAndroid.userAttrData[0].should.equal(
                JSON.stringify({ key: 'key', value: 'value' })
            );
            window.mParticleAndroid.resetUserAttributes();
        });

        it('should invoke setAttribute on Android and pass through proper data when invoking setUserAttributes', () => {
            mParticle.Identity.getCurrentUser().setUserAttributes({
                gender: 'male',
                age: 21,
            });
            window.mParticleAndroid.setUserAttributeCalled.should.equal(true);
            window.mParticleAndroid.userAttrData[0].should.equal(
                JSON.stringify({ key: 'gender', value: 'male' })
            );
            window.mParticleAndroid.userAttrData[1].should.equal(
                JSON.stringify({ key: 'age', value: 21 })
            );
        });

        it('should invoke removeAttributes on native SDK', () => {
            mParticle.Identity.getCurrentUser().setUserAttribute(
                'key',
                'value'
            );
            mParticle.Identity.getCurrentUser().removeUserAttribute('key');

            window.mParticleAndroid.setUserAttributeCalled.should.equal(true);
            window.mParticleAndroid.removeUserAttributeCalled.should.equal(
                true
            );
        });

        it('should not sync cookies when in a mobile web view for Android', () => {
            const pixelSettings = {
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
            mParticle.configurePixel(pixelSettings);

            mParticle.init(apiKey, window.mParticle.config);
            const data = getLocalStorage();

            Should(data).not.be.ok();
        });

        it('should send a JSON object to the native SDK\'s Identity methods', () => {
            let result,
                identityAPIRequest = {
                    userIdentities: {
                        customerid: '123',
                        email: 'test@gmail.com',
                    },
                };

            const callback = function(resp) {
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

            const JSONData = JSON.stringify(
                mParticle
                    .getInstance()
                    ._Identity.IdentityRequest.convertToNative(
                        identityAPIRequest
                    )
            );

            window.mParticleAndroid.loginData.should.equal(JSONData);
            window.mParticleAndroid.logoutData.should.equal(JSONData);
            window.mParticleAndroid.modifyData.should.equal(JSONData);
        });

        it('should send events via the mParticle.ready method ', () => {
            mParticle.ready(function() {
                mParticle.logEvent('test');
            });

            window.mParticleAndroid.logEventCalled.should.equal(true);
            JSON.parse(window.mParticleAndroid.event).EventName.should.equal(
                'test'
            );
        });
    });

    describe('bridge version 2', function() {
        describe('android', function() {
            let mParticleAndroidV2Bridge;
            beforeEach(function() {
                window.mParticleAndroid = null;
                window.mParticle.isIOS = null;
                window.mParticle.config.minWebviewBridgeVersion = 2;
                window.mParticle.config.requiredWebviewBridgeName =
                    'bridgeName';
                window.mParticleAndroid_bridgeName_v2 = new mParticleAndroid();
                mParticleAndroidV2Bridge =
                    window.mParticleAndroid_bridgeName_v2;

                window.mParticle.init(apiKey, window.mParticle.config);
                mParticle.config = {};
            });

            afterEach(function() {
                delete window.mParticle.config;
                delete window.mParticleAndroid_bridgeName_v2;
            });

            it('should invoke logEvent on Android and pass through proper event', () => {
                mParticle.logEvent('testEvent');

                mParticleAndroidV2Bridge.logEventCalled.should.equal(true);
                (typeof mParticleAndroidV2Bridge.event).should.equal('string');
                JSON.parse(
                    mParticleAndroidV2Bridge.event
                ).should.have.properties([
                    'EventName',
                    'EventCategory',
                    'EventAttributes',
                    'EventDataType',
                    'OptOut',
                ]);
            });

            it('should invoke setAttribute on Android and pass through proper data', () => {
                mParticle.Identity.getCurrentUser().setUserAttribute(
                    'key',
                    'value'
                );

                mParticleAndroidV2Bridge.setUserAttributeCalled.should.equal(
                    true
                );
                mParticleAndroidV2Bridge.userAttrData[0].should.equal(
                    JSON.stringify({ key: 'key', value: 'value' })
                );
                mParticleAndroidV2Bridge.resetUserAttributes();
            });

            it('should invoke setAttribute on Android and pass through proper data when invoking setUserAttributes', () => {
                mParticle.Identity.getCurrentUser().setUserAttributes({
                    gender: 'male',
                    age: 21,
                });
                mParticleAndroidV2Bridge.setUserAttributeCalled.should.equal(
                    true
                );
                mParticleAndroidV2Bridge.userAttrData[0].should.equal(
                    JSON.stringify({ key: 'gender', value: 'male' })
                );
                mParticleAndroidV2Bridge.userAttrData[1].should.equal(
                    JSON.stringify({ key: 'age', value: 21 })
                );
                mParticleAndroidV2Bridge.resetUserAttributes();
            });

            it('should invoke removeAttributes on Android', () => {
                mParticle.Identity.getCurrentUser().setUserAttribute(
                    'key',
                    'value'
                );
                mParticle.Identity.getCurrentUser().removeUserAttribute('key');

                mParticleAndroidV2Bridge.setUserAttributeCalled.should.equal(
                    true
                );
                mParticleAndroidV2Bridge.removeUserAttributeCalled.should.equal(
                    true
                );
            });

            it('should invoke setSessionAttributes on Android and pass through proper data', () => {
                mParticle.setSessionAttribute('key', 'value');

                mParticleAndroidV2Bridge.setSessionAttributeCalled.should.equal(
                    true
                );
                mParticleAndroidV2Bridge.sessionAttrData[2].should.equal(
                    JSON.stringify({ key: 'key', value: 'value' })
                );
            });

            it('should not sync cookies when in a mobile web view for Android', () => {
                const pixelSettings = {
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
                mParticle.configurePixel(pixelSettings);

                const data = getLocalStorage();

                Should(data).not.be.ok();
            });

            it('should send a JSON object to the Android\'s Identity methods', () => {
                let result,
                    identityAPIRequest = {
                        userIdentities: {
                            customerid: '123',
                            email: 'test@gmail.com',
                        },
                    };

                const callback = function(resp) {
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

                const JSONData = JSON.stringify(
                    mParticle
                        .getInstance()
                        ._Identity.IdentityRequest.convertToNative(
                            identityAPIRequest
                        )
                );

                mParticleAndroidV2Bridge.loginData.should.equal(JSONData);
                mParticleAndroidV2Bridge.logoutData.should.equal(JSONData);
                mParticleAndroidV2Bridge.modifyData.should.equal(JSONData);
            });

            it('should send a JSON object to the Android\'s Alias method', () => {
                let callbackResult;
                const aliasRequest = {
                    destinationMpid: '101',
                    sourceMpid: '202',
                    startTime: 300,
                    endTime: 400,
                };

                mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
                    callbackResult = callback;
                });
                mParticleAndroidV2Bridge.aliasUsers.should.equal(
                    '{"DestinationMpid":"101","SourceMpid":"202","StartUnixtimeMs":300,"EndUnixtimeMs":400}'
                );

                callbackResult.httpCode.should.equal(
                    HTTPCodes.nativeIdentityRequest
                );
                callbackResult.message.should.equal(
                    'Alias request sent to native sdk'
                );
            });

            it('should send events via the mParticle.ready method ', () => {
                mParticle.ready(function() {
                    mParticle.logEvent('test');
                });

                mParticleAndroidV2Bridge.logEventCalled.should.equal(true);
                JSON.parse(
                    mParticleAndroidV2Bridge.event
                ).EventName.should.equal('test');
            });

            it('should send an event with a product list when calling logPurchase', () => {
                const product = mParticle.eCommerce.createProduct(
                    'product1',
                    'sku',
                    10,
                    1
                );
                const product2 = mParticle.eCommerce.createProduct(
                    'product2',
                    'sku',
                    10,
                    1
                );

                mParticle.eCommerce.Cart.add([product, product2]);

                const transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                    'TAid1',
                    'aff1',
                    'coupon',
                    1798,
                    10,
                    5
                );
                const clearCartBoolean = true;
                const customAttributes = { value: 10 };
                const customFlags = { foo: 'bar' };
                mParticleAndroidV2Bridge.data = [];
                mParticle.eCommerce.logPurchase(
                    transactionAttributes,
                    [product, product2],
                    clearCartBoolean,
                    customAttributes,
                    customFlags
                );

                JSON.parse(
                    mParticleAndroidV2Bridge.event
                ).ProductAction.ProductList[0].Name.should.equal('product1');
                JSON.parse(
                    mParticleAndroidV2Bridge.event
                ).ProductAction.ProductList[1].Name.should.equal('product2');
            });

            it('should invoke upload on native SDK', () => {
                mParticle.upload();

                mParticleAndroidV2Bridge.uploadCalled.should.equal(true);
            });
        });

        describe('iOS', function() {
            let mParticleIOSV2Bridge;
            beforeEach(function() {
                window.mParticleAndroid = null;
                window.mParticle.isIOS = null;
                window.mParticle.config.minWebviewBridgeVersion = 2;
                window.mParticle.config.requiredWebviewBridgeName =
                    'bridgeName';
                window.webkit = {
                    messageHandlers: {
                        mParticle_bridgeName_v2: new mParticleIOS(),
                    },
                };
                mParticleIOSV2Bridge =
                    window.webkit.messageHandlers.mParticle_bridgeName_v2;

                mParticle.enableWebviewBridge = true;
                window.mParticle.init(apiKey, window.mParticle.config);
                mParticle.config = {};
                mParticleIOSV2Bridge.reset();
            });

            afterEach(function() {
                delete window.webkit;
                delete mParticle.requiredWebviewBridgeName;
                delete mParticle.enableWebviewBridge;
            });

            it('should invoke logEvent on iOS SDK and pass through proper event', () => {
                mParticle.logEvent('testEvent');

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(
                    ['path', 'value']
                );
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal(
                    'logEvent'
                );
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.should.have.properties([
                    'EventName',
                    'EventCategory',
                    'EventAttributes',
                    'EventDataType',
                    'OptOut',
                ]);
            });

            it('should invoke setAttribute on iOS SDK and pass through proper data', () => {
                mParticle.Identity.getCurrentUser().setUserAttribute(
                    'key',
                    'value'
                );
                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(
                    ['path', 'value']
                );
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal(
                    'setUserAttribute'
                );
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.should.have.property('key', 'key');
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.should.have.property('value', 'value');
            });

            it('should invoke setAttribute on iOS SDK and pass through proper data when invoking setUserAttributes', () => {
                mParticle.Identity.getCurrentUser().setUserAttributes({
                    gender: 'male',
                    age: 21,
                });

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(
                    ['path', 'value']
                );
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal(
                    'setUserAttribute'
                );
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.should.have.property('key', 'gender');
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.should.have.property('value', 'male');
                JSON.parse(mParticleIOSV2Bridge.data[1]).should.have.properties(
                    ['path', 'value']
                );
                JSON.parse(mParticleIOSV2Bridge.data[1]).path.should.equal(
                    'setUserAttribute'
                );
                JSON.parse(
                    mParticleIOSV2Bridge.data[1]
                ).value.should.have.property('key', 'age');
                JSON.parse(
                    mParticleIOSV2Bridge.data[1]
                ).value.should.have.property('value', 21);
            });

            it('should invoke removeAttributes on iOS SDK', () => {
                mParticle.Identity.getCurrentUser().setUserAttribute(
                    'key',
                    'value'
                );
                mParticle.Identity.getCurrentUser().removeUserAttribute('key');

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(
                    ['path', 'value']
                );
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal(
                    'setUserAttribute'
                );
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.should.have.property('key', 'key');
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.should.have.property('value', 'value');
                JSON.parse(mParticleIOSV2Bridge.data[1]).should.have.properties(
                    ['path', 'value']
                );
                JSON.parse(mParticleIOSV2Bridge.data[1]).path.should.equal(
                    'removeUserAttribute'
                );
                JSON.parse(
                    mParticleIOSV2Bridge.data[1]
                ).value.should.have.property('key', 'key');
                JSON.parse(
                    mParticleIOSV2Bridge.data[1]
                ).value.should.have.property('value', null);
            });

            it('should invoke setSessionAttributes on ios SDK and pass through proper data', () => {
                mParticle.setSessionAttribute('key', 'value');

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(
                    ['path', 'value']
                );
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal(
                    'setSessionAttribute'
                );
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.should.have.property('key', 'key');
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.should.have.property('value', 'value');                
            });

            it('should not sync cookies when in a mobile web view', () => {
                const pixelSettings = {
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
                mParticle.configurePixel(pixelSettings);

                const data = getLocalStorage();

                Should(data).not.be.ok();
            });

            it('should send a JSON object to the ios SDK\'s Identity methods', () => {
                let result,
                    identityAPIRequest = {
                        userIdentities: {
                            customerid: '123',
                            email: 'test@gmail.com',
                        },
                    };

                const callback = function(resp) {
                    result = resp;
                };

                const JSONData = JSON.stringify(
                    mParticle
                        .getInstance()
                        ._Identity.IdentityRequest.convertToNative(
                            identityAPIRequest
                        )
                );

                mParticle.Identity.login(identityAPIRequest, callback);
                result.body.should.equal('Login request sent to native sdk');
                result.httpCode.should.equal(-5);
                result = null;
                JSON.stringify(
                    JSON.parse(mParticleIOSV2Bridge.data[0]).value
                ).should.equal(JSONData);
                mParticleIOSV2Bridge.reset();

                mParticle.Identity.logout(identityAPIRequest, callback);
                result.body.should.equal('Logout request sent to native sdk');
                result.httpCode.should.equal(-5);
                result = null;
                JSON.stringify(
                    JSON.parse(mParticleIOSV2Bridge.data[0]).value
                ).should.equal(JSONData);
                mParticleIOSV2Bridge.reset();

                mParticle.Identity.modify(identityAPIRequest, callback);
                result.body.should.equal('Modify request sent to native sdk');
                result.httpCode.should.equal(-5);
                result = null;
                JSON.stringify(
                    JSON.parse(mParticleIOSV2Bridge.data[0]).value
                ).should.equal(JSONData);
                mParticleIOSV2Bridge.reset();

                mParticle.Identity.identify(identityAPIRequest, callback);
                result.body.should.equal('Identify request sent to native sdk');
                result.httpCode.should.equal(-5);
                JSON.stringify(
                    JSON.parse(mParticleIOSV2Bridge.data[0]).value
                ).should.equal(JSONData);
                mParticleIOSV2Bridge.reset();
            });

            it('should send a JSON object to the iOS SDK\'s Alias method', () => {
                let callbackResult;
                const aliasRequest = {
                    destinationMpid: '101',
                    sourceMpid: '202',
                    startTime: 300,
                    endTime: 400,
                };

                mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
                    callbackResult = callback;
                });

                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(
                    ['path', 'value']
                );
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal(
                    'aliasUsers'
                );
                JSON.stringify(
                    JSON.parse(mParticleIOSV2Bridge.data[0]).value
                ).should.equal(
                    '{"DestinationMpid":"101","SourceMpid":"202","StartUnixtimeMs":300,"EndUnixtimeMs":400}'
                );
                mParticleIOSV2Bridge.reset();

                callbackResult.httpCode.should.equal(
                    HTTPCodes.nativeIdentityRequest
                );
                callbackResult.message.should.equal(
                    'Alias request sent to native sdk'
                );
            });

            it('should send events via the mParticle.ready method ', () => {
                mParticle.ready(function() {
                    mParticle.logEvent('test');
                });
                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(
                    ['path', 'value']
                );
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.should.have.property('EventName', 'test');

            });

            it('should send an event with a product list when calling logPurchase', () => {
                const product = mParticle.eCommerce.createProduct(
                    'product1',
                    'sku',
                    10,
                    1
                );
                const product2 = mParticle.eCommerce.createProduct(
                    'product2',
                    'sku',
                    10,
                    1
                );
                mParticle.eCommerce.logProductAction(mParticle.ProductActionType.AddToCart, [product, product2]);

                const transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                    'TAid1',
                    'aff1',
                    'coupon',
                    1798,
                    10,
                    5
                );
                const clearCartBoolean = true;
                const customAttributes = { value: 10 };
                const customFlags = { foo: 'bar' };
                mParticleIOSV2Bridge.data = [];
                mParticle.eCommerce.logPurchase(
                    transactionAttributes,
                    [product, product2],
                    clearCartBoolean,
                    customAttributes,
                    customFlags
                );

                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal(
                    'logEvent'
                );
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.ProductAction.ProductList.length.should.equal(2);
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.ProductAction.ProductList[0].Name.should.equal(
                    'product1'
                );
                JSON.parse(
                    mParticleIOSV2Bridge.data[0]
                ).value.ProductAction.ProductList[1].Name.should.equal(
                    'product2'
                );
            });

            it('should invoke upload on iOS SDK', () => {
                mParticle.upload();


                JSON.parse(mParticleIOSV2Bridge.data[0]).should.have.properties(
                    ['path', 'value']
                );
                JSON.parse(mParticleIOSV2Bridge.data[0]).path.should.equal(
                    'upload'
                );
                
                (JSON.parse(mParticleIOSV2Bridge.data[0]).value === null).should.equal(true);
            });
        });
    });
});