import { expect } from 'chai';
import Utils from './config/utils';
import fetchMock from 'fetch-mock/esm/client';
import { urls, testMPID, MPConfig, v4LSKey, apiKey } from './config/constants';
import { IMParticleUser } from '../../src/identity-user-interfaces';
import { IPixelConfiguration } from '../../src/cookieSyncManager';
import { IConsentRules } from '../../src/consent';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
const {
    fetchMockSuccess,
    waitForCondition,
    hasIdentifyReturned,
    hasConfigurationReturned
} = Utils;

const { setLocalStorage, MockForwarder, getLocalStorage } = Utils;

const pixelSettings: IPixelConfiguration = {
    name: 'TestPixel',
    moduleId: 5,
    esId: 24053,
    isDebug: true,
    isProduction: true,
    settings: {},
    frequencyCap: 14,
    pixelUrl: 'https://test.com',
    redirectUrl: '?redirect=https://redirect.com&mpid=%%mpid%%',
};

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
        fetchMock: any;
    }
}

const mParticle = window.mParticle;

describe('cookie syncing', function() {
    // Have a reference to createElement function to reset after all cookie sync
    // tests have run
    const originalCreateElementFunction = window.document.createElement;

    const MockUser = function() {
        let consentState = null;
        return {
            setConsentState: function(state) {
                consentState = state;
            },
            getConsentState: function() {
                return consentState;
            },
        };
    };

    before(function() {
        // Mock the img create onload method
        // https://raminmousavi.medium.com/mock-img-element-in-jest-3341c495ca8b
        window.document.createElement = (function(create) {
            return function(this: Document) {
                const element = create.apply(this, arguments as unknown as [string, ElementCreationOptions?]);

                if (element.tagName === 'IMG') {
                    // Add an `onload` mock that simulates the browser loading the image
                    Object.defineProperty(element, 'onload', {
                        set(callback) {
                        // Automatically invoke the callback to simulate the `load` event
                            callback(new Event('load'));
                        },
                    });
                }

                return element;

            };
        })(document.createElement);
    });

    after(function() {
        // Reset the mock
        window.document.createElement = originalCreateElementFunction;
    });

    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
        fetchMock.config.overwriteRoutes = true;
        fetchMockSuccess(urls.identify, {
            mpid: testMPID, is_logged_in: false
        });
        fetchMock.post(urls.events, 200);
    });

    afterEach(function() {
        fetchMock.restore();
    });

    it('should sync cookies when there was not a previous cookie-sync', async () => {
        window.mParticle.config.pixelConfigs = [pixelSettings];
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        expect(
            mParticle.getInstance()._Store.pixelConfigurations.length
        ).to.equal(1);
        const data = mParticle.getInstance()._Persistence.getLocalStorage();
        data[testMPID].csd.should.have.property('5');
    });

    it('should sync cookies when current date is beyond the frequency cap and the MPID has not changed', async () => {
        window.mParticle.config.pixelConfigs = [pixelSettings];

        setLocalStorage(v4LSKey, {
            cu: testMPID,
            testMPID: {
                csd: { 5: new Date(500).getTime() },
            },
            ie: true,
        });
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        expect(
            mParticle.getInstance()._Store.pixelConfigurations.length
        ).to.equal(1);

        const data = mParticle.getInstance()._Persistence.getLocalStorage();
        const updated = data[testMPID].csd['5'] > 500;

        expect(updated).to.be.ok;
    });

    it('should not sync cookies when last date is within frequencyCap', async () => {
        window.mParticle.config.pixelConfigs = [pixelSettings];

        setLocalStorage();
        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        const data = mParticle.getInstance()._Persistence.getLocalStorage();

        data[testMPID].csd.should.have.property(
            5,
            mParticle.getInstance()._Persistence.getLocalStorage().testMPID
                .csd['5']
        );
        expect(
            mParticle.getInstance()._Store.pixelConfigurations.length
        ).to.equal(1);
    });

    it('should sync cookies when mpid changes', async () => {
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        const data1 = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        fetchMockSuccess(urls.login, {
            mpid: 'otherMPID', is_logged_in: false
        });
        
        mParticle.Identity.login();
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'otherMPID');
        await Promise.resolve();
        const data2 = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        expect(data1[testMPID].csd[5]).to.be.ok;
        expect(data2['otherMPID'].csd[5]).to.be.ok;
        expect( 
            mParticle.getInstance()._Store.pixelConfigurations.length
        ).to.equal(1);
    });

    it('should not sync cookies when pixelSettings.isDebug is false, pixelSettings.isProduction is true, and mParticle.config.isDevelopmentMode is true', async () => {
        const pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: false,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: '',
            redirectUrl: '',
        };

        mParticle.config.isDevelopmentMode = true;
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        const data1 = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        Object.keys(data1[testMPID]).should.not.have.property('csd');
        expect( 
            mParticle.getInstance()._Store.pixelConfigurations.length
        ).to.equal(0);
    });

    it('should not sync cookies when pixelSettings.isDebug is true, pixelSettings.isProduction is false, and mParticle.config.isDevelopmentMode is false', async () => {
        const pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: false,
            settings: {},
            frequencyCap: 14,
            pixelUrl: '',
            redirectUrl: '',
        };

        mParticle.config.isDevelopmentMode = false;
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        const data1 = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        data1[testMPID].should.not.have.property('csd');
        expect( 
            mParticle.getInstance()._Store.pixelConfigurations.length
        ).to.equal(0);
    })

    it('parse and capture pixel settings properly from backend', async () => {
        window.mParticle.config.requestConfig = true;
        // create some cookies
        mParticle.init(apiKey, window.mParticle.config);

        const mockForwarder = new MockForwarder('DynamicYield', 128);
        const mockForwarder2 = new MockForwarder('Adobe', 124);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        const forwarderConfigurationResult = {
            pixelConfigs: [
                {
                    name: 'TestPixel',
                    moduleId: 5,
                    esId: 24053,
                    isDebug: false,
                    isProduction: true,
                    settings: {},
                    frequencyCap: 14,
                    pixelUrl: 'https://test.com',
                    redirectUrl: '?redirect=https://redirect.com&mpid=%%mpid%%',
                },
            ],
        };

        fetchMock.get(urls.config, {
            status: 200,
            body: JSON.stringify(forwarderConfigurationResult),
        });

        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();
        // add pixels to preInitConfig
        mParticle.init(apiKey, window.mParticle.config);
        
        await waitForCondition(hasConfigurationReturned);
        await Promise.resolve();
        mParticle
            .getInstance()
            ._Store.pixelConfigurations.length.should.equal(1);

        fetchMockSuccess(urls.login, {
            mpid: 'MPID1', is_logged_in: false
        });            
        // force the preInit cookie configurations to fire
        mParticle.Identity.login({
            userIdentities: { customerid: 'abc' },
        });
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1');
        await Promise.resolve();
        const cookies = getLocalStorage();
        Object.keys(cookies['MPID1'].csd).length.should.equal(1);
    });

    it('should perform a cookiesync when consent is not configured on the cookiesync setting', async () => {
        pixelSettings.filteringConsentRuleValues = {} as unknown as IConsentRules;
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        expect( 
            mParticle.getInstance()._Store.pixelConfigurations.length
        ).to.equal(1);
        const data = mParticle.getInstance()._Persistence.getLocalStorage();
        data[testMPID].csd.should.have.property('5');
    });

    it('should return false for isEnabledForUserConsent when consent is configured but no user is passed', async () => {
        const enableCookieSync = true;
        const consented = false;

        const filteringConsentRuleValues = {
            includeOnMatch: enableCookieSync,
            values: [
                {
                    consentPurpose: '123',
                    hasConsented: consented,
                },
            ],
        };

        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, null);

        expect(enabled).to.not.be.ok;
    });

    it("should disable cookie sync if 'Do Not Forward' when 'Consent Rejected' is selected and user consent is rejected", function() {
        const includeOnMatch = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsent = false;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.not.be.ok;
    });

    it("should disable cookie sync if 'Do Not Forward' when 'Consent Accepted' is selected and user consent is given", function() {
        const includeOnMatch = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsent = true;
        mParticle.config.isDevelopmentMode = false;
        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);

        expect(enabled).to.not.be.ok;
    });

    it("should enable cookie sync if 'Only Forward' when 'Consent Rejected' is selected and user consent is rejected", function() {
        const includeOnMatch = true; // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsent = false;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);

        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.be.ok;
    });

    it("should enable cookie sync if 'Only Forward' when 'Consent Given'is selected and user consent is given", function() {
        const includeOnMatch = true; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsent = true;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.be.ok;
    });

    it("should disable cookie sync if 'Only Forward' on 'Consent Given' is selected and user consent is not given", function() {
        const includeOnMatch = true; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsented = false;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsented)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.not.be.ok;
    });

    it("should perform a cookie sync if 'Do Not Forward' when 'Consent Rejected' is selected and user consent is given", function() {
        const includeOnMatch = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsented = true;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsented)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.be.ok;
    });

    it("should perform a cookie sync if 'Do Not Forward' when 'Consent Given' is selected and user consent is rejected", function() {
        const includeOnMatch = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsented = false;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsented)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.be.ok;
    });

    it("should perform a cookie sync if 'Do Not Forward' when 'Consent Rejected' is selected and user consent is given", function() {
        const includeOnMatch = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsented = true;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsented)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.be.ok;
    });

    it("should not perform a cookie sync if 'Do Not Forward' if CCPA is 'Not Present' is selected and user CCPA is not present", function() {
        const includeOnMatch = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const ccpaPresent = false;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.not.be.ok;
    });

    it("should not perform a cookie sync if 'Do Not Forward' if CCPA is 'Present' is selected and user CCPA is present", function() {
        const includeOnMatch = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const ccpaPresent = true;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.not.be.ok;
    });

    it("should perform a cookie sync if 'Only Forward' if CCPA is 'Not Present' is selected and user CCPA is not present", function() {
        const includeOnMatch = true; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const ccpaPresent = false;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.be.ok;
    });

    it("should perform a cookie sync if 'Only Forward' when CCPA is 'Present' is selected and user CCPA is present", function() {
        const includeOnMatch = true; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const ccpaPresent = true;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.be.ok;
    });

    it("should not perform a cookie sync if 'Only Forward' when CCPA is 'Present' is selected and CCPA is not present", function() {
        const includeOnMatch = true; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const ccpaPresent = false;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.not.be.ok;
    });

    it("should perform a cookie sync if 'Do Not Forward' if CCPA is 'Present' is selected and user CCPA is not present", function() {
        const includeOnMatch = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const ccpaPresent = false;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.be.ok;
    });

    it("should perform a cookie sync if 'Do Not Forward' if CCPA is 'Not Present' is selected and user CCPA is present", function() {
        const includeOnMatch = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const ccpaPresent = true;
        mParticle.config.isDevelopmentMode = false;

        const filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
            );
        const user = MockUser() as IMParticleUser;
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(filteringConsentRuleValues, user);
        expect(enabled).to.be.ok;
    });

    it('should perform a cookie sync only after GDPR consent is given when consent is required - perform a cookie sync when accepting consent is required', async () => {
        const includeOnMatch = true; // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        mParticle.config.isDevelopmentMode = false;

        pixelSettings.filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        const localStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorage.testMPID.should.not.have.property('csd');

        const falseConsentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(false)
            );

        mParticle.Identity.getCurrentUser().setConsentState(
            falseConsentState
        );
        const noCookieSyncLS = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        noCookieSyncLS.testMPID.should.not.have.property('csd');

        const trueConsentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(true)
            );

        mParticle.Identity.getCurrentUser().setConsentState(
            trueConsentState
        );
        await Promise.resolve();

        const cookieSyncLS = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        cookieSyncLS.testMPID.should.have.property('csd');
        cookieSyncLS.testMPID.csd.should.have.property(5);
    });
    
    it('should perform a cookie sync only after GDPR consent is given when consent is required - perform a cookie sync when consent is rejected', async () => {        
        const includeOnMatch = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        mParticle.config.isDevelopmentMode = false;

        pixelSettings.filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        const localStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorage.testMPID.should.not.have.property('csd');
        const falseConsentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(false)
            );

        mParticle.Identity.getCurrentUser().setConsentState(
            falseConsentState
        );

        let newLocalStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        newLocalStorage.testMPID.should.not.have.property('csd');

        const trueConsentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(true)
            );

        mParticle.Identity.getCurrentUser().setConsentState(
            trueConsentState
        );
        await Promise.resolve();

        newLocalStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        newLocalStorage.testMPID.should.have.property('csd');
        newLocalStorage.testMPID.csd.should.have.property(5);
    });

    it('should perform a cookie sync only after CCPA consent is given when consent is required - perform a cookie sync when accepting consent is required', async () => {
        const includeOnMatch = true; // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        mParticle.config.isDevelopmentMode = false;

        pixelSettings.filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        const localStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorage.testMPID.should.not.have.property('csd');
        const falseConsentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                // false to show that it doesn't perform a cookie sync
                mParticle.getInstance().Consent.createCCPAConsent(false)
            );

        mParticle.Identity.getCurrentUser().setConsentState(
            falseConsentState
        );

        const noCookieSyncLS = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        noCookieSyncLS.testMPID.should.not.have.property('csd');

        const trueConsentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                // false to show that it doesn't perform a cookie sync
                mParticle.getInstance().Consent.createCCPAConsent(true)
            );

        mParticle.Identity.getCurrentUser().setConsentState(
            trueConsentState
        );
        await Promise.resolve();

        const cookieSyncLS = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        cookieSyncLS.testMPID.should.have.property('csd');
        cookieSyncLS.testMPID.csd.should.have.property(5);
    });

    it('should perform a cookie sync only after CCPA consent is given when consent is required - perform a cookie sync when consent is rejected', async () => {
        const includeOnMatch = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        mParticle.config.isDevelopmentMode = false;

        pixelSettings.filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();
        
        const localStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorage.testMPID.should.not.have.property('csd');
        const falseConsentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(false)
            );

        mParticle.Identity.getCurrentUser().setConsentState(
            falseConsentState
        );

        let newLocalStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        newLocalStorage.testMPID.should.not.have.property('csd');

        const trueConsentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(true)
            );

        mParticle.Identity.getCurrentUser().setConsentState(
            trueConsentState
        );
        await Promise.resolve();

        newLocalStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        newLocalStorage.testMPID.should.have.property('csd');
        newLocalStorage.testMPID.csd.should.have.property(5);
    });

    it('should allow some cookie syncs to occur and others to not occur if there are multiple pixels with varying consent levels', async () => {
        // This test has 2 pixelSettings. pixelSettings1 requires consent pixelSettings2 does not.  When mparticle initializes, the pixelSettings2 should fire and pixelSettings1 shouldn't.
        // After the appropriate consent is saved to the huser, pixelSettings1 will fire.

        const includeOnMatch = true; // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        mParticle.config.isDevelopmentMode = false;

        //  pixelSetting1 has consent required, and so should only perform a cookiesync after consent is saved to the user
        const pixelSettings1: IPixelConfiguration = {
            name: 'TestPixel',
            moduleId: 1,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: 'https://test.com',
            redirectUrl: '?redirect=https://redirect.com&mpid=%%mpid%%',
        };

        pixelSettings1.filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        //  pixelSetting2 does not have any consent required, and so should always perform a cookiesync
        const pixelSettings2 = {
            name: 'TestPixel2',
            moduleId: 2,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: 'https://test2.com',
            redirectUrl: '?redirect=https://redirect2.com&mpid=%%mpid%%',
        };

        window.mParticle.config.pixelConfigs = [pixelSettings1, pixelSettings2];

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        const localStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorage.testMPID.should.have.property('csd');

        // Performs a cookie sync for 2 but not 1
        localStorage.testMPID.csd.should.not.have.property(1);
        localStorage.testMPID.csd.should.have.property(2);

        const trueConsentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(true)
            );

        mParticle.Identity.getCurrentUser().setConsentState(
            trueConsentState
        );
        await Promise.resolve();

        const newLocalStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        newLocalStorage.testMPID.should.have.property('csd');
        // Now has both cookie syncs because the appropriate consent was added
        newLocalStorage.testMPID.csd.should.have.property(2);
        newLocalStorage.testMPID.csd.should.have.property(1);
    });
});