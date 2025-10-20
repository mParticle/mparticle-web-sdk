import Utils from './config/utils';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';

import {
    urls,
    apiKey,
    MPConfig,
    testMPID,
    MessageType,
} from './config/constants';
import { expect } from 'chai';
import { IMParticleInstanceManager, SDKEvent, SDKInitConfig } from '../../src/sdkRuntimeModels';
import { IMParticleUser, UserAttributes } from '../../src/identity-user-interfaces';
import { IdentityType } from '../../src/types';
import { IntegrationAttribute } from '../../src/store';
import { IConsentRules } from '../../src/consent';
import { UserIdentities } from '@mparticle/web-sdk';


const {
    findEventFromRequest,
    waitForCondition,
    fetchMockSuccess,
    getForwarderEvent,
    getIdentityEvent,
    setLocalStorage,
    forwarderDefaultConfiguration,
    MockForwarder,
    MockSideloadedKit,
    hasIdentifyReturned,
    hasIdentityCallInflightReturned,
} = Utils;

interface IMockForwarderInstance {
    filteringConsentRuleValues?: IConsentRules;
    isVisible?: boolean;
    onIdentifyCompleteCalled?: boolean;
    onIdentifyCompleteFilteredUserIdentities?: UserIdentities;
    onIdentifyCompleteUser?: IMParticleUser;
    onLoginCompleteCalled?: boolean;
    onLoginCompleteFilteredUserIdentities?: UserIdentities;
    onLoginCompleteUser?: IMParticleUser;
    onLogoutCompleteCalled?: boolean;
    onLogoutCompleteFilteredUserIdentities?: UserIdentities;
    onLogoutCompleteUser?: IMParticleUser;
    onModifyCompleteCalled?: boolean;
    onModifyCompleteFilteredUserIdentities?: UserIdentities;
    onModifyCompleteUser?: IMParticleUser;
    onUserIdentifiedUser?: IMParticleUser;
    receivedEvent?: SDKEvent;
    removeUserAttributeCalled?: boolean;
    userAttributes?: UserAttributes;
    userIdentities?: UserIdentities;
}

// https://go.mparticle.com/work/SQDSDKS-4475
export interface IMockForwarder {
    instance: IMockForwarderInstance
    register: (config?: SDKInitConfig) => void;
}

interface UserIdentitiesFilter {
    Identity: string;
    Type: typeof IdentityType;
}

interface MockMParticleForForwarders extends IMParticleInstanceManager{
    userIdentitiesFilterOnInitTest: UserIdentitiesFilter[]
    userAttributesFilterOnInitTest: UserAttributes;
};

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
        MockForwarder: IMockForwarder;
        MockForwarder1: IMockForwarder;
        SideloadedKit11: IMockForwarder;
        SideloadedKit22: IMockForwarder;
        fetchMock: any;
    }
}

const mParticle = window.mParticle as unknown as MockMParticleForForwarders;

let mockServer;

describe('forwarders', function() {
    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
        delete mParticle._instances['default_instance'];
        fetchMock.config.overwriteRoutes = true;
        fetchMock.post(urls.events, 200);
        mockServer = sinon.createFakeServer();

        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: false,
        });

        fetchMockSuccess(urls.login, {
            mpid: testMPID, is_logged_in: false
        });

        fetchMockSuccess(urls.logout, {
            mpid: testMPID, is_logged_in: true
        })

        fetchMockSuccess(urls.modify, {
            change_results: [
                    {
                        identity_type: 'email',
                        modified_mpid: testMPID,
                    },
                ],
        })

        fetchMockSuccess(urls.forwarding, { mpid: testMPID, is_logged_in: false })

        // https://go.mparticle.com/work/SQDSDKS-6850
        mockServer.respondWith(urls.forwarding, [
            202,
            {},
            JSON.stringify({}),
        ]);
    });

    afterEach(function() {
        fetchMock.restore();
        sinon.restore();
        delete window.MockForwarder1;
    });

    it('should add forwarders via dynamic script loading via the addForwarder method', () => {
        const mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        mParticle.init(apiKey, window.mParticle.config);

        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(1);
    });

    it('should invoke forwarder setIdentity on initialized forwarders (debug = false)', async () => {
        window.mParticle.config.identifyRequest = {
            userIdentities: {
                google: 'google123',
            },
        };

        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();


        window.MockForwarder1.instance.should.have.property(
            'setUserIdentityCalled',
            true
        );
        window.MockForwarder1.instance.userIdentities.should.have.property(
            '4',
            'google123'
        );
    });

    it('should permit forwarder if no consent configured.', () => {
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {};
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                null
            );
        expect(enabled).to.be.ok;
    });

    it('should not permit forwarder if consent configured but there is no user.', () => {
        const enableForwarder = true;
        const consented = false;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: '123',
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                null
            );
        expect(enabled).to.not.be.ok;
    });

    const MockUser = function() {
        let consentState = null;
        return {
            setConsentState: function(state) {
                consentState = state;
            },
            getConsentState: function() {
                return consentState;
            },
        } as IMParticleUser;
    };

    it("should disable forwarder if 'Do Not Forward' when 'Consent Rejected' is selected and user consent has been rejected", () => {
        const enableForwarder = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsent = false;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );

        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.not.be.ok;
    });

    it("should disable forwarder if 'Do Not Forward' when 'Consent Accepted' is selected and consent has been accepted", () => {
        const enableForwarder = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsent = true;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.not.be.ok;
    });

    it("should enable forwarder if 'Only Forward' when 'Consent Rejected' is selected and consent has been rejected", () => {
        const enableForwarder = true; // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsent = false;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.be.ok;
    });

    it("should enable forwarder if 'Only Forward' when 'Consent Accepted' is selected and consent has been accepted", () => {
        const enableForwarder = true; // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsent = true;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.be.ok;
    });

    it("should disable forwarder if 'Only Forward' when 'Consent Accepted' is selected and consent has been rejected", () => {
        const enableForwarder = true; // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsent = false;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.not.be.ok;
    });

    it("should enable forwarder if 'Do Not Forward' when 'Consent Rejected' is selected and consent has been accepted", () => {
        const enableForwarder = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsent = true;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.be.ok;
    });

    it("should enable forwarder if 'Do Not Forward' when 'Consent Accepted' is selected and consent has been rejected", () => {
        const enableForwarder = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsent = false;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.be.ok;
    });

    it("should enable forwarder if 'Do Not Forward' when 'Consent Rejected' is selected and consent has been accepted", () => {
        const enableForwarder = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsent = true;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.be.ok;
    });

    it("should disable forwarder if 'Do Not Forward' when CCPA is 'Not Present' is selected and user CCPA is not present", () => {
        const enableForwarder = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = false;
        const userConsentPresent = false;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consentPresent,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle
                    .getInstance()
                    .Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.not.be.ok;
    });

    it("should disable forwarder if 'Do Not Forward' when CCPA is 'Present' is selected and user CCPA is present", () => {
        const enableForwarder = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = true;
        const userConsentPresent = true;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consentPresent,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle
                    .getInstance()
                    .Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.not.be.ok;
    });

    it("should enable forwarder if 'Only Forward' when CCPA is 'Not Present' is selected and user CCPA is not present", () => {
        const enableForwarder = true; // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = false;
        const userConsentPresent = false;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consentPresent,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle
                    .getInstance()
                    .Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );

        expect(enabled).to.be.ok;
    });

    it("should enable forwarder if 'Only Forward' when CCPA data sale opt out is present is selected and user CCPA is present.", () => {
        const enableForwarder = true; // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = true;
        const userConsentPresent = true;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consentPresent,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle
                    .getInstance()
                    .Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.be.ok;
    });

    it("should disable forwarder if 'Only Forward' when CCPA is 'Present' is selected and user CCPA is not present", () => {
        const enableForwarder = true; // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = true;
        const userConsentPresent = false;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consentPresent,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle
                    .getInstance()
                    .Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.not.be.ok;
    });

    it("should enable forwarder if 'Do Not Forward' when CCPA is 'Not Present' is selected and user CCPA is present", () => {
        const enableForwarder = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = false;
        const userConsentPresent = true;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consentPresent,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle
                    .getInstance()
                    .Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.be.ok;
    });

    it("should enable forwarder if 'Do Not Forward' when CCPA is 'Present' is selected and user CCPA is not present", () => {
        const enableForwarder = false; // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = true;
        const userConsentPresent = false;
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consentPresent,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle
                    .getInstance()
                    .Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle
            .getInstance()
            ._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        expect(enabled).to.be.ok;
    });

    it("does not initialize a forwarder when forwarder's isDebug != mParticle.isDevelopmentMode", () => {
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration();
        config.isDebug = true;

        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        expect(window.MockForwarder1).not.be.ok;
        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(0);
    });

    it('initializes a forwarder with isDebug = false && mParticle.config.isDevelopmentMode = false', () => {
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config = forwarderDefaultConfiguration();
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.should.have.property('initCalled', true);
        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(1);
       expect( 
            mParticle.getInstance()._Store.configuredForwarders.length
        ).equal(1);
    });

    it('initializes a forwarder with isDebug = true && mParticle.config.isDevelopmentMode = true', () => {
        mParticle.config.isDevelopmentMode = true;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config = forwarderDefaultConfiguration();
        config.isDebug = true;

        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);
        window.MockForwarder1.instance.should.have.property('initCalled', true);
       expect( 
            mParticle.getInstance()._Store.configuredForwarders.length
        ).equal(1);
    });

    it('initializes forwarders when isDebug = mParticle.config.isDevelopmentMode', () => {
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.isDebug = true;

        const config2 = forwarderDefaultConfiguration('MockForwarder', 1);

        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(1);
       expect( 
            mParticle.getInstance()._Store.configuredForwarders.length
        ).equal(1);
    });

    it("sends events to forwarder when forwarder's isDebug = mParticle.config.isDevelopmentMode ", async () => {
        mParticle.config.isDevelopmentMode = true;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.isDebug = true;
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        mParticle.logEvent('send this event to forwarder');
        window.MockForwarder1.instance.should.have.property(
            'processCalled',
            true
        );
    });

    it('sends events to forwarder v1 endpoint when mParticle.config.isDevelopmentMode = config.isDebug = false', async () => {
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        fetchMock.resetHistory();

        mParticle.logEvent('send this event to forwarder');

        window.MockForwarder1.instance.should.have.property(
            'processCalled',
            true
        );

        fetchMock.lastCall().includes(
            '/v1/JS/test_key/Forwarding'
        );
    });

    // https://go.mparticle.com/work/SQDSDKS-6850
    it.skip('sends forwarding stats to v2 endpoint when featureFlag setting of batching is true', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        window.mParticle.config.dataPlan = {
            planVersion: 10,
            planId: 'plan_slug',
        };

        window.mParticle.config.flags = {
            reportBatching: true,
        };
        
        const clock = sinon.useFakeTimers();
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();
        fetchMock.resetHistory();
        mockServer.requests = [];

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            { 'my-key': 'my-value' }
        );

        clock.tick(10000);

        const event = getForwarderEvent(
            fetchMock.calls(),
            'send this event to forwarder',
            true
        );
        expect(event).should.be.ok;

        mockServer.requests[mockServer.requests.length - 1].url.includes(
            '/v2/JS/test_key/Forwarding'
        );
        event.should.have.property('mid', 1);
        event.should.have.property('esid', 1234567890);
        event.should.have.property('n', 'send this event to forwarder');
        event.should.have.property('attrs');
        event.should.have.property('dp');
        event.dp.should.have.property('PlanVersion', 10);
        event.dp.should.have.property('PlanId', 'plan_slug');
        event.should.have.property('dp');
        event.should.have.property('sdk', mParticle.getVersion());
        event.should.have.property('dt', MessageType.PageEvent);
        event.should.have.property('et', mParticle.EventType.Navigation);
        event.should.have.property(
            'dbg',
            mParticle.getInstance()._Store.SDKConfig.isDevelopmentMode
        );
        event.should.have.property('ct');
        event.should.have.property('eec', 0);
    });

    it('should not send forwarding stats to invisible forwarders', () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        window.MockForwarder1.instance.isVisible = false;

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            { 'my-key': 'my-value' }
        );

        const event = findEventFromRequest(
            fetchMock.calls(),
            'send this event to forwarder',
            true
        );

        expect(event).should.not.have.property('n');
    });

    it('should invoke forwarder opt out', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentityCallInflightReturned);
        await Promise.resolve();
        mParticle.setOptOut(true);

        window.MockForwarder1.instance.should.have.property(
            'setOptOutCalled',
            true
        );
    });

    it('should invoke forwarder setuserattribute', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        window.MockForwarder1.instance.should.have.property(
            'setUserAttributeCalled',
            true
        );
    });

    it('should invoke forwarder setuserattribute when calling setUserAttributeList', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        mParticle.Identity.getCurrentUser().setUserAttributeList('gender', [
            'male',
        ]);

        window.MockForwarder1.instance.should.have.property(
            'setUserAttributeCalled',
            true
        );
    });

    it('should invoke forwarder removeuserattribute', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

        window.MockForwarder1.instance.should.have.property(
            'removeUserAttributeCalled',
            true
        );
    });

    it('should filter user attributes from forwarder on log event', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userAttributeFilters = [mParticle.generateHash('gender')];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        mParticle.logEvent('test event');

        const event = window.MockForwarder1.instance.receivedEvent;
        event.should.have.property('UserAttributes');
        event.UserAttributes.should.not.have.property('gender');
    });

    it('should filter user identities from forwarder on init and bring customerid as first ID', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        await Promise.resolve();

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.Identity.modify({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.userIdentitiesFilterOnInitTest.length.should.equal(2);
        mParticle.userIdentitiesFilterOnInitTest[0].Type.should.equal(1);
        mParticle.userIdentitiesFilterOnInitTest[0].Identity.should.equal(
            '123'
        );
        mParticle.userIdentitiesFilterOnInitTest[1].Type.should.equal(7);
        mParticle.userIdentitiesFilterOnInitTest[1].Identity.should.equal(
            'test@gmail.com'
        );
        expect(mParticle.userIdentitiesFilterOnInitTest[2]).to.be.undefined;
    });

    it('should filter user identities from forwarder on log event and bring customerid as first ID', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.modify({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.logEvent('test event');
        const event = window.MockForwarder1.instance.receivedEvent;

        Object.keys(event.UserIdentities).length.should.equal(2);
        let googleUserIdentityExits = false;
        event.UserIdentities.forEach(function(identity) {
            if (identity.Type === mParticle.IdentityType.Google) {
                googleUserIdentityExits = true;
            }
        });
        expect(googleUserIdentityExits).to.be.false;

        expect(event.UserIdentities[0].Type).to.equal(
            mParticle.IdentityType.CustomerId
        );
    });

    it('should filter user attributes from forwarder on init, and on subsequent set attribute calls', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userAttributeFilters = [
            mParticle.generateHash('gender'),
            mParticle.generateHash('age'),
        ];
        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.userAttributesFilterOnInitTest.should.not.have.property(
            'gender'
        );

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.getCurrentUser().setUserAttribute('age', 32);
        mParticle.Identity.getCurrentUser().setUserAttribute('weight', 150);

        window.MockForwarder1.instance.userAttributes.should.have.property(
            'weight',
            150
        );
        window.MockForwarder1.instance.userAttributes.should.not.have.property(
            'age'
        );
    });

    it('should filter user attributes from forwarder on init, and on subsequent remove attribute calls', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);

        // filtered User Attributes that should should not call removeUserAttribute
        config1.userAttributeFilters = [
            mParticle.generateHash('weight'),
            mParticle.generateHash('age'),
        ];

        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        // force filtered UA in mock forwarder (due to filtering affecting setUserAttribute) and test init
        window.MockForwarder1.instance.userAttributes['weight'] = 150;
        mParticle.Identity.getCurrentUser().removeUserAttribute('weight');
        window.MockForwarder1.instance.removeUserAttributeCalled.should.equal(
            false
        );
        mParticle.userAttributesFilterOnInitTest.should.have.property('weight');

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        const dummyUserAttributes = {
            gender: 'male',
            age: 20,
        };

        // force filtered UA in mock forwarder (due to filtering affecting setUserAttribute) and non filtered UA
        for (let key of Object.keys(dummyUserAttributes)) {
            window.MockForwarder1.instance.userAttributes[key] =
                dummyUserAttributes[key];
        }

        // "age" is filtered and should not call removeUserAttribute on forwarder
        mParticle.Identity.getCurrentUser().removeUserAttribute('age');
        window.MockForwarder1.instance.removeUserAttributeCalled.should.equal(
            false
        );
        window.MockForwarder1.instance.userAttributes.should.have.property(
            'age',
            20
        );

        // "gender" is not filtered and should call removeUserAttribute on forwarder
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');
        window.MockForwarder1.instance.removeUserAttributeCalled.should.equal(
            true
        );
        window.MockForwarder1.instance.userAttributes.should.not.have.property(
            'gender'
        );
    });

    it('should filter event names', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.eventNameFilters = [
            mParticle.generateHash(
                mParticle.EventType.Navigation + 'test event'
            ),
        ];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.startNewSession();
        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent('test event', mParticle.EventType.Navigation);

        expect(window.MockForwarder1.instance.receivedEvent).to.not.be.ok;

        mParticle.logEvent('test event 2', mParticle.EventType.Navigation);

        expect(window.MockForwarder1.instance.receivedEvent).to.be.ok;
    });

    it('should filter page event names', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.screenNameFilters = [
            mParticle.generateHash(mParticle.EventType.Unknown + 'PageView'),
        ];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => hasIdentityCallInflightReturned);
        await Promise.resolve();
        mParticle.startNewSession();
        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logPageView();

        expect(window.MockForwarder1.instance.receivedEvent).to.not.be.ok;
    });

    it('should filter event attributes', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.attributeFilters = [
            mParticle.generateHash(
                mParticle.EventType.Navigation + 'test event' + 'test attribute'
            ),
        ];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });
        await Promise.resolve();

        mParticle.logEvent('test event', mParticle.EventType.Navigation, {
            'test attribute': 'test value',
            'test attribute 2': 'test value 2',
        });

        const event = window.MockForwarder1.instance.receivedEvent;

        event.EventAttributes.should.not.have.property('test attribute');
        event.EventAttributes.should.have.property('test attribute 2');
    });

    it('should filter pageview attributes', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.attributeFilters = [
            mParticle.generateHash(
                mParticle.EventType.Navigation + 'test event' + 'test attribute'
            ),
        ];
        config1.screenAttributeFilters = [
            mParticle.generateHash(
                mParticle.EventType.Unknown +
                    'ScreenA' +
                    'filteredScreenAttribute'
            ),
        ];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.logPageView('ScreenA', {
            filteredScreenAttribute: 'this will be filtered',
            unfilteredScreenAttribute: 'this will not be filtered',
        });

        const event = window.MockForwarder1.instance.receivedEvent;

        event.EventAttributes.should.not.have.property(
            'filteredScreenAttribute'
        );
        event.EventAttributes.should.have.property(
            'unfilteredScreenAttribute',
            'this will not be filtered'
        );
    });

    it('should call logout on forwarder', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.logout();
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        window.MockForwarder1.instance.should.have.property(
            'logOutCalled',
            true
        );

        window.MockForwarder1.instance.should.have.property(
            'onLogoutCompleteCalled',
            true
        );
    });

    it('should pass in app name to forwarder on initialize', async () => {
        mParticle.config.appName = 'Unit Tests';
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        window.MockForwarder1.instance.should.have.property(
            'appName',
            'Unit Tests'
        );
    });

    it('should pass in app version to forwarder on initialize', () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.config.appVersion = '3.0';
        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.should.have.property(
            'appVersion',
            '3.0'
        );
    });

    it('should pass in user identities to forwarder on initialize', () => {
        setLocalStorage();

        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);

        Object.keys(
            window.MockForwarder1.instance.userIdentities
        ).length.should.equal(1);
    });

    it('should pass in user attributes to forwarder on initialize', () => {
        setLocalStorage();

        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.should.have.property('userAttributes');
        window.MockForwarder1.instance.userAttributes.should.have.property(
            'color',
            'blue'
        );
    });

    it('should pass filteredUser and filteredUserIdentities to onIdentifyComplete methods', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);

        // This removes the Google User Identity
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });
        await Promise.resolve();

        mParticle.Identity.identify({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });
        await Promise.resolve();

        expect(window.MockForwarder1.instance.onIdentifyCompleteCalled).to.eq(
            true
        );
        expect(window.MockForwarder1.instance.onIdentifyCompleteUser).to.be.ok;
        expect(
            window.MockForwarder1.instance
                .onIdentifyCompleteFilteredUserIdentities
        ).to.deep.equal({
            userIdentities: {
                // Filtered Identity should no longer have `google` as an identity
                email: 'test@gmail.com',
                customerid: '123',
            },
        });
    });

    it('should pass filteredUser and filteredUserIdentities to onLoginComplete methods', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);

        // This removes the Google User Identity
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.login({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        expect(window.MockForwarder1.instance.onLoginCompleteCalled).to.eq(
            true
        );
        expect(window.MockForwarder1.instance.onLoginCompleteUser).to.be.ok;
        expect(
            window.MockForwarder1.instance.onLoginCompleteFilteredUserIdentities
        ).to.deep.equal({
            userIdentities: {
                // Filtered Identity should no longer have `google` as an identity
                email: 'test@gmail.com',
                customerid: '123',
            },
        });
    });

    it('should pass filteredUser and filteredUserIdentities to onLogoutComplete methods', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);

        // This removes the Google User Identity
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.logout({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        expect(window.MockForwarder1.instance.onLogoutCompleteCalled).to.eq(
            true
        );
        expect(window.MockForwarder1.instance.onLogoutCompleteUser).to.be.ok;
        expect(
            window.MockForwarder1.instance
                .onLogoutCompleteFilteredUserIdentities
        ).to.deep.equal({
            userIdentities: {
                // Filtered Identity should no longer have `google` as an identity
                email: 'test@gmail.com',
                customerid: '123',
            },
        });
    });

    it('should pass filteredUser and filteredUserIdentities to onModifyComplete methods', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);

        // This removes the Google User Identity
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.modify({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        expect(window.MockForwarder1.instance.onModifyCompleteCalled).to.eq(
            true
        );
        expect(window.MockForwarder1.instance.onModifyCompleteUser).to.be.ok;
        expect(
            window.MockForwarder1.instance
                .onModifyCompleteFilteredUserIdentities
        ).to.deep.equal({
            userIdentities: {
                // Filtered Identity should no longer have `google` as an identity
                email: 'test@gmail.com',
                customerid: '123',
            },
        });
    });

    it('should not forward event if attribute forwarding rule is set', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringEventAttributeValue = {
            eventAttributeName: mParticle
                .generateHash('ForwardingRule')
                .toString(),
            eventAttributeValue: mParticle.generateHash('Forward').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            {
                ForwardingRule: 'Forward',
            }
        );

        const event = window.MockForwarder1.instance.receivedEvent;

        event.should.not.have.property(
            'EventName',
            'send this event to forwarder'
        );
    });

    it('should forward event if event attribute forwarding rule is set and includeOnMatch is true', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringEventAttributeValue = {
            eventAttributeName: mParticle
                .generateHash('ForwardingRule')
                .toString(),
            eventAttributeValue: mParticle.generateHash('Forward').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            {
                Foo: 'Bar',
                ForwardingRule: 'Forward',
            }
        );

        const event = window.MockForwarder1.instance.receivedEvent;

        event.should.have.property('EventName', 'send this event to forwarder');
    });

    it('should not forward event if event attribute forwarding rule is set and includeOnMatch is true but attributes do not match', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringEventAttributeValue = {
            eventAttributeName: mParticle
                .generateHash('ForwardingRule')
                .toString(),
            eventAttributeValue: mParticle.generateHash('Forward').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            {
                Forwarding: 'Non-Matching',
            }
        );

        const event = window.MockForwarder1.instance.receivedEvent;

        event.should.not.have.property(
            'EventName',
            'send this event to forwarder'
        );
    });

    it('should not forward event if event attribute forwarding rule is set and includeOnMatch is false', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringEventAttributeValue = {
            eventAttributeName: mParticle
                .generateHash('ForwardingRule')
                .toString(),
            eventAttributeValue: mParticle.generateHash('Forward').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentityCallInflightReturned);
        await Promise.resolve();

        window.MockForwarder1.instance.receivedEvent.EventName.should.equal(1);
        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            {
                ForwardingRule: 'Forward',
            }
        );

        const event = window.MockForwarder1.instance.receivedEvent;

        expect(event).to.not.be.ok;

    });

    it('should forward event if event attribute forwarding rule is set and includeOnMatch is false but attributes do not match', async () => {
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringEventAttributeValue = {
            eventAttributeName: mParticle
                .generateHash('ForwardingRule')
                .toString(),
            eventAttributeValue: mParticle.generateHash('Forward').toString(),
            includeOnMatch: false,
        };

        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentityCallInflightReturned);
        await Promise.resolve();

        window.MockForwarder1.instance.receivedEvent.EventName.should.equal(1);
        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            {
                Test: 'does not match',
            }
        );

        const event = window.MockForwarder1.instance.receivedEvent;

        event.should.have.property('EventName', 'send this event to forwarder');
    });

    it('should send event to forwarder if filtering attribute and includingOnMatch is true', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');

        mParticle.logEvent('test event');

        const event = window.MockForwarder1.instance.receivedEvent;
        event.should.have.property('UserAttributes');
        event.UserAttributes.should.have.property('Gender', 'Male');
        event.EventName.should.equal('test event');
    });

    it('should not send event to forwarder if filtering attribute and includingOnMatch is false', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');
        //reset received event, which will have the initial session start event on it
        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent('test event');
        const event = window.MockForwarder1.instance.receivedEvent;

        expect(event).to.not.be.ok;
    });

    it('should permit forwarder if no user attribute value filters configured', async () => {
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        let enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserAttributes(null, null);
        expect(enabled).to.be.ok;

        enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserAttributes({}, null);
        expect(enabled).to.be.ok;
    });

    it('should send event to forwarder if there are no user attributes on event if includeOnMatch = false', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();
        mParticle.logEvent('test event');

        const event = window.MockForwarder1.instance.receivedEvent;
        window.MockForwarder1.instance.receivedEvent.EventName.should.equal(
            'test event'
        );
        expect(event).to.be.ok;
    });

    it('should not send event to forwarder if there are no user attributes on event if includeOnMatch = true', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.logEvent('test event');

        const event = window.MockForwarder1.instance.receivedEvent;
        expect(event).to.not.be.ok;
    });

    it('should send event to forwarder if there is no match and includeOnMatch = false', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.getCurrentUser().setUserAttribute(
            'gender',
            'female'
        );
        mParticle.logEvent('test event');

        const event = window.MockForwarder1.instance.receivedEvent;
        expect(event).to.be.ok;
        event.EventName.should.equal('test event');
    });

    it('should not send event to forwarder if there is no match and includeOnMatch = true', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.getCurrentUser().setUserAttribute(
            'gender',
            'female'
        );
        mParticle.logEvent('test event');

        const event = window.MockForwarder1.instance.receivedEvent;
        expect(event).to.not.be.ok;
    });

    it('should reinitialize forwarders when user attribute changes', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');

        let activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(0);

        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent('test event');
        let event = window.MockForwarder1.instance.receivedEvent;

        expect(event).to.not.be.ok;

        mParticle.Identity.getCurrentUser().setUserAttribute(
            'Gender',
            'famale'
        );

        activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(1);

        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent('test event');
        event = window.MockForwarder1.instance.receivedEvent;

        expect(event).to.be.ok;
    });

    it('should send event to forwarder if the filterinUserAttribute object is invalid', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = undefined;
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();
        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');

        mParticle.logEvent('test event');
        const event = window.MockForwarder1.instance.receivedEvent;

        expect(event).to.be.ok;
        window.MockForwarder1.instance.receivedEvent.EventName.should.equal(
            'test event'
        );
    });

    it('should call forwarder onUserIdentified method when identity is returned', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        window.MockForwarder1.instance.should.have.property(
            'onUserIdentifiedCalled',
            true
        );
    });

    // https://go.mparticle.com/work/SQDSDKS-6850
    it.skip('should queue forwarder stats reporting and send after 5 seconds if batching feature is true', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        window.mParticle.config.flags = {
            reportBatching: true,
        };

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => hasIdentityCallInflightReturned);
        await Promise.resolve();
        const clock = sinon.useFakeTimers();

        mParticle.logEvent('not in forwarder');
        const product = mParticle.eCommerce.createProduct(
            'iphone',
            'sku',
            123,
            1
        );
        mParticle.eCommerce.Cart.add(product, true);

        let result = getForwarderEvent(fetchMock.calls(), 'not in forwarder');

        expect(result).to.not.be.ok;
        clock.tick(5001);

        result = getForwarderEvent(fetchMock.calls(), 'not in forwarder');
        expect(result).to.be.ok;

        result = getForwarderEvent(
            fetchMock.calls(),
            'eCommerce - AddToCart'
        );
        expect(result).to.be.ok;

        clock.restore();
    });

    it('should initialize forwarders when a user is not logged in and excludeAnonymousUser=false', async () => {
        const mockForwarder = new MockForwarder();
        const mockForwarder2 = new MockForwarder('MockForwarder2', 2);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.excludeAnonymousUser = false;

        const config2 = forwarderDefaultConfiguration('MockForwarder', 2);
        config2.excludeAnonymousUser = true;
        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        const activeForwarders = mParticle.getInstance()._getActiveForwarders();

        activeForwarders.length.should.equal(1);
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(false);
    });

    it('should only initialize forwarders with excludeUnknownUser = false for non-logged-in users', async () => {
        const mockForwarder = new MockForwarder();
        const mockForwarder2 = new MockForwarder('MockForwarder2', 2);
        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.excludeAnonymousUser = false;

        const config2 = forwarderDefaultConfiguration('MockForwarder', 2);
        config2.excludeAnonymousUser = true;

        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        const activeForwarders = mParticle.getInstance()._getActiveForwarders();

        activeForwarders.length.should.equal(1);
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(false);
    });

    it('should initialize all forwarders when a user is logged in and the page reloads', async() => {
        const mockForwarder = new MockForwarder();
        const mockForwarder2 = new MockForwarder('MockForwarder2', 2);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.excludeAnonymousUser = false;

        const config2 = forwarderDefaultConfiguration('MockForwarder', 2);
        config2.excludeAnonymousUser = true;

        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(false);
        const user = {
            userIdentities: {
                customerid: 'customerid3',
                email: 'email3@test.com',
            },
        };

        fetchMockSuccess(urls.login, {
            mpid: 'MPID2',
            is_logged_in: true,
        });

        mParticle.Identity.login(user);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        expect(mParticle.Identity.getCurrentUser()
            .isLoggedIn())
            .to.equal(true);
        const activeForwarders = mParticle.getInstance()._getActiveForwarders();
        expect(activeForwarders.length).to.equal(2);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(true);
        const activeForwarders2 = mParticle
            .getInstance()
            ._getActiveForwarders();
        expect(activeForwarders2.length).to.equal(2);
    });

    it('should save logged in status of most recent user to cookies when logged in', async () => {
        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: true,
        });

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        const ls = mParticle.getInstance()._Persistence.getLocalStorage();
        ls.l.should.equal(true);
        
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();
        const ls2 = mParticle.getInstance()._Persistence.getLocalStorage();
        ls2.hasOwnProperty('l').should.equal(true);
        
        fetchMockSuccess(urls.logout, {
            mpid: 'MPID1', is_logged_in: false
        });
        
        mParticle.Identity.logout();
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();
        const ls3 = mParticle.getInstance()._Persistence.getLocalStorage();
        ls3.l.should.equal(false);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        const ls4 = mParticle.getInstance()._Persistence.getLocalStorage();
        ls4.l.should.equal(false);
    });

    it('should not set integration attributes on forwarders when a non-object attr is passed', () => {
        const invalidIntegrationAttribute = '123' as unknown as IntegrationAttribute;
        mParticle.init(apiKey, window.mParticle.config)
        mParticle.setIntegrationAttribute(128, invalidIntegrationAttribute);
        const adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
            128
        );
        expect(adobeIntegrationAttributes).to.eqls({});
    });

    it('should set integration attributes on forwarders', async () => {
        mParticle.init(apiKey, window.mParticle.config)

        await waitForCondition(hasIdentityCallInflightReturned);
        await Promise.resolve();
        mParticle.setIntegrationAttribute(128, { MCID: 'abcdefg' });
        const adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
            128
        );

        adobeIntegrationAttributes.MCID.should.equal('abcdefg');
    });

    it('should clear integration attributes when an empty object or a null is passed', async () => {
        mParticle.init(apiKey, window.mParticle.config)
        await waitForCondition(hasIdentityCallInflightReturned);
        await Promise.resolve();

        mParticle.setIntegrationAttribute(128, { MCID: 'abcdefg' });
        let adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
            128
        );
        Object.keys(adobeIntegrationAttributes).length.should.equal(1);

        mParticle.setIntegrationAttribute(128, {});
        adobeIntegrationAttributes = mParticle.getIntegrationAttributes(128);
        Object.keys(adobeIntegrationAttributes).length.should.equal(0);

        mParticle.setIntegrationAttribute(128, { MCID: 'abcdefg' });
        adobeIntegrationAttributes = mParticle.getIntegrationAttributes(128);
        Object.keys(adobeIntegrationAttributes).length.should.equal(1);

        mParticle.setIntegrationAttribute(128, null);
        adobeIntegrationAttributes = mParticle.getIntegrationAttributes(128);
        Object.keys(adobeIntegrationAttributes).length.should.equal(0);
    });

    it('should sanitize any non-strings from integration attributes', async () => {
        mParticle.init(apiKey, window.mParticle.config)
        await waitForCondition(hasIdentityCallInflightReturned);
        await Promise.resolve();

        mParticle.setIntegrationAttribute(128, {
            MCID: 'abcdefg',
            fail: { test: 'false' } as unknown as string,
            nullValue: null,
            undefinedValue: undefined,
        });

        const adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
            128
        );

        expect(adobeIntegrationAttributes).to.eqls({
            MCID: 'abcdefg',
        });
    });

    it('should add integration delays to the integrationDelays object', () => {
        mParticle.init(apiKey, window.mParticle.config)

        mParticle._setIntegrationDelay(128, true);
        mParticle._setIntegrationDelay(24, false);
        mParticle._setIntegrationDelay(10, true);

        const integrationDelays = mParticle._getIntegrationDelays();

        integrationDelays.should.have.property('128', true);
        integrationDelays.should.have.property('24', false);
        integrationDelays.should.have.property('10', true);
    });

    it('integration test - should not log events if there are any integrations delaying, then resume logging events once delays are gone', async () => {
        // this code will be put in each forwarder as each forwarder is initialized
        mParticle._setIntegrationDelay(128, true);
        mParticle._setIntegrationDelay(24, false);
        mParticle._setIntegrationDelay(10, true);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        fetchMock.resetHistory();
        mParticle.logEvent('Test Event1');
        fetchMock.calls().length.should.equal(0);

        mParticle._setIntegrationDelay(10, false);
        mParticle._setIntegrationDelay(128, false);
        mParticle.logEvent('Test Event2');
        fetchMock.calls().length.should.equal(4);

        const sessionStartEvent = findEventFromRequest(
            fetchMock.calls(),
            'session_start'
        );
        const ASTEvent = findEventFromRequest(
            fetchMock.calls(),
            'application_state_transition'
        );
        const testEvent1 = findEventFromRequest(
            fetchMock.calls(),
            'Test Event1'
        );
        const testEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'Test Event2'
        );

        sessionStartEvent.should.be.ok();
        ASTEvent.should.be.ok();
        testEvent1.should.be.ok();
        testEvent2.should.be.ok();
    });

    it('integration test - should send events after a configured delay, or 5 seconds by default if setIntegrationDelays are still true', async () => {
        // this code will be put in each forwarder as each forwarder is initialized
        mParticle._setIntegrationDelay(128, true);
        expect(
            Object.keys(mParticle.getInstance()._preInit.integrationDelays)
                .length
        ).equal(1);
        mParticle._setIntegrationDelay(24, false);
        expect(
            Object.keys(mParticle.getInstance()._preInit.integrationDelays)
                .length
        ).equal(2);
        mParticle._setIntegrationDelay(10, true);
        expect(
            Object.keys(mParticle.getInstance()._preInit.integrationDelays)
                .length
        ).equal(3);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.logEvent('Test Event1');

        // Only the identity is in the calls
        fetchMock.calls().length.should.equal(1);
        const identifyEvent = getIdentityEvent(
            fetchMock.calls(),
            'identify'
        );
        identifyEvent.should.be.ok()

        // Turn off delays manually because we cannot use sinon.useFakeTimers in the async identity paradigm
        mParticle._setIntegrationDelay(128, false);
        mParticle._setIntegrationDelay(24, false);
        mParticle._setIntegrationDelay(10, false);
        mParticle.logEvent('Test Event2');  // this manually logs all the queued events
        fetchMock.calls().length.should.equal(5);

        const sessionStartEvent = findEventFromRequest(
            fetchMock.calls(),
            'session_start'
        );
        const ASTEvent = findEventFromRequest(
            fetchMock.calls(),
            'application_state_transition'
        );
        const testEvent1 = findEventFromRequest(
            fetchMock.calls(),
            'Test Event1'
        );
        const testEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'Test Event2'
        );

        sessionStartEvent.should.be.ok();
        ASTEvent.should.be.ok();
        testEvent1.should.be.ok();
        testEvent2.should.be.ok();
    });

    // https://go.mparticle.com/work/SQDSDKS-6844
    it.skip('integration test - should allow the user to configure the integrationDelayTimeout', async () => {
        // testing user-configured integrationDelayTimeout
        let clock = sinon.useFakeTimers();
        mParticle.config.integrationDelayTimeout = 1000;
        mParticle._setIntegrationDelay(128, true);
        mParticle._setIntegrationDelay(24, false);
        mParticle._setIntegrationDelay(10, true);
        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        }, 200, 10, clock);
        await Promise.resolve();
        fetchMock.resetHistory();
        mParticle.logEvent('Test Event3');
        fetchMock.calls().length.should.equal(0);

        clock.tick(1001);

        mParticle.logEvent('Test Event4');
        fetchMock.calls().length.should.equal(4);

        const sessionStartEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'session_start'
        );
        const ASTEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'application_state_transition'
        );
        const testEvent3 = findEventFromRequest(
            fetchMock.calls(),
            'Test Event3'
        );
        const testEvent4 = findEventFromRequest(
            fetchMock.calls(),
            'Test Event4'
        );

        sessionStartEvent2.should.be.ok();
        ASTEvent2.should.be.ok();
        testEvent3.should.be.ok();
        testEvent4.should.be.ok();
        clock.restore();
    });

    it('integration test - after an integration delay is set to false, should fire an event after the event timeout', async () => {
        // this code will be put in each forwarder as each forwarder is initialized
        mParticle._setIntegrationDelay(128, true);
        mParticle._setIntegrationDelay(24, false);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        const clock = sinon.useFakeTimers();
        fetchMock.resetHistory();
        mParticle.logEvent('test1');
        fetchMock.calls().length.should.equal(0);
        // now that we set all integrations to false, the SDK should process queued events
        mParticle._setIntegrationDelay(128, false);

        clock.tick(5001);

        fetchMock.calls().length.should.equal(3);
        clock.restore();
    });

    it('parse and capture forwarderConfiguration properly from backend', async () => {
        mParticle.config.requestConfig = true;

        const mockForwarder = new MockForwarder('DynamicYield', 128);
        const mockForwarder2 = new MockForwarder('Adobe', 124);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        const config = {
            kitConfigs: [
                {
                    name: 'DynamicYield',
                    moduleId: 128,
                    isDebug: false,
                    isVisible: true,
                    isDebugString: false,
                    hasDebugString: true,
                    settings: { siteId: 8769977 },
                    screenNameFilters: [],
                    screenAttributeFilters: [],
                    userIdentityFilters: [],
                    userAttributeFilters: [],
                    eventNameFilters: [],
                    eventTypeFilters: [],
                    attributeFilters: [],
                    githubPath: null,
                    filteringEventAttributeValue: null,
                    filteringUserAttributeValue: null,
                    filteringConsentRuleValues: null,
                    consentRegulationFilters: [],
                    consentRegulationPurposeFilters: [],
                    messageTypeFilters: [],
                    messageTypeStateFilters: [],
                    eventSubscriptionId: 24884,
                    excludeAnonymousUser: false,
                },
                {
                    name: 'Adobe',
                    moduleId: 124,
                    isDebug: false,
                    isVisible: true,
                    isDebugString: false,
                    hasDebugString: true,
                    settings: { siteId: 8769977 },
                    screenNameFilters: [],
                    screenAttributeFilters: [],
                    userIdentityFilters: [],
                    userAttributeFilters: [],
                    eventNameFilters: [],
                    eventTypeFilters: [],
                    attributeFilters: [],
                    githubPath: null,
                    filteringEventAttributeValue: null,
                    filteringUserAttributeValue: null,
                    filteringConsentRuleValues: null,
                    consentRegulationFilters: [],
                    consentRegulationPurposeFilters: [],
                    messageTypeFilters: [],
                    messageTypeStateFilters: [],
                    eventSubscriptionId: 24884,
                    excludeAnonymousUser: false,
                },
            ],
        };

        fetchMock.get(urls.config, {
            status: 200,
            body: JSON.stringify(config),
        });

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => window.mParticle.getInstance()._Store.configurationLoaded === true && window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        const activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(2);
        const moduleIds = [124, 128];
        activeForwarders.forEach(function(forwarder) {
            moduleIds.indexOf(forwarder.id).should.be.greaterThanOrEqual(0);
        });
    });

    
    // This will pass when we add mpInstance._Store.isInitialized = true; to mp-instance before `processIdentityCallback`
    it('configures forwarders before events are logged via identify callback', async () => {
        window.mParticle.config.identifyRequest = {
            userIdentities: {
                google: 'google123',
            },
        };

        window.mParticle.config.identityCallback = function() {
            mParticle.logEvent('test event');
        };

        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );
        window.mParticle.config.rq = [];
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentityCallInflightReturned);
        await Promise.resolve();
        window.MockForwarder1.instance.should.have.property(
            'processCalled',
            true
        );

        //mock a page reload which has no configuredForwarders
        mParticle.getInstance()._Store.configuredForwarders = [];
        window.mParticle.config.rq = [];

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentityCallInflightReturned);
        await Promise.resolve();

        window.MockForwarder1.instance.should.have.property(
            'processCalled',
            true
        );

    });

    it('should retain preInit.forwarderConstructors, and reinitialize forwarders after calling reset, then init', async () => {
        const mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();
        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(1);

        // client calls reset
        mParticle.reset();

        // forwarderConstructors are still there
        mParticle
            .getInstance()
            ._preInit.forwarderConstructors.length.should.equal(1);

        // client reinitializes mParticle after a reset
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();
        // forwarderConstructors are still there
        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(1);

        mParticle.logEvent('send this event to forwarder');
        window.MockForwarder1.instance.should.have.property(
            'processCalled',
            true
        );
    });

    it('should send SourceMessageId as part of event sent to forwarders', async () => {
        const mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.logEvent('Test Event');
        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'SourceMessageId'
        );
    });

    it('should send user-defined SourceMessageId as part of event sent to forwarders via baseEvent', async () => {
        const mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.logBaseEvent({
            messageType: 4,
            name: 'Test Event',
            data: { key: 'value' },
            eventType: mParticle.EventType.Navigation,
            customFlags: { flagKey: 'flagValue' },
            sourceMessageId: 'abcdefg',
        });

        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'SourceMessageId',
            'abcdefg'
        );
    });

    it('should add a logger to forwarders', async () => {
        const mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        window.mParticle.config.logLevel = 'verbose';
        let infoMessage;

        window.mParticle.config.logger = {
            verbose: function(msg) {
                infoMessage = msg;
            },
        };
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        await Promise.resolve();

        mParticle.logEvent('Test Event');

        infoMessage.should.equal('Test Event sent');
    });

    describe('kits with suffixes', function() {
        it('should add forwarders with suffixes and initialize them accordingly if there is a coresponding kit config with the same suffix', () => {
            const mockForwarder = new MockForwarder(
                'ForwarderWithSuffixV3',
                1,
                'v3'
            );
            const mockForwarder2 = new MockForwarder(
                'ForwarderWithSuffixV4',
                1,
                'v4'
            );
            mParticle.addForwarder(mockForwarder);
            mParticle.addForwarder(mockForwarder2);

            window.mParticle.config.kitConfigs.push(
                forwarderDefaultConfiguration('ForwarderWithSuffixV3', 1, 'v3')
            );
            window.mParticle.config.kitConfigs.push(
                forwarderDefaultConfiguration('ForwarderWithSuffixV4', 1, 'v4')
            );

            mParticle.init(apiKey, window.mParticle.config);

            mParticle
                .getInstance()
                ._getActiveForwarders()
                .length.should.equal(2);
        });

        it('should not add a forwarder with suffix if there is not a corresponding kit config with the same suffix', () => {
            const mockForwarder = new MockForwarder(
                'ForwarderWithSuffix',
                1,
                'v3'
            );
            mParticle.addForwarder(mockForwarder);

            window.mParticle.config.kitConfigs.push(
                forwarderDefaultConfiguration('ForwarderWithSuffix', 1, 'v4')
            );

            mParticle.init(apiKey, window.mParticle.config);

            mParticle
                .getInstance()
                ._getActiveForwarders()
                .length.should.equal(0);
        });
    });

    describe('side loaded kits', function() {
        describe('initialization', function() {

            it('should add sideloaded kits to the active forwarders', function() {
                const sideloadedKit1 = new MockSideloadedKit(
                    'SideloadedKit1',
                    1
                );
                const sideloadedKit2 = new MockSideloadedKit(
                    'SideloadedKit2',
                    2
                );

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                    sideloadedKit1
                );
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                    sideloadedKit2
                );

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];
                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                const activeForwarders = mParticle
                    .getInstance()
                    ._getActiveForwarders();
                expect(
                    activeForwarders.length,
                    'active forwarders length'
                ).to.equal(sideloadedKits.length);
                expect(
                    activeForwarders[0].name,
                    '1st active forwarder '
                ).to.deep.equal(sideloadedKit1.name);
                expect(
                    activeForwarders[1].name,
                    '2nd active forwarder'
                ).to.deep.equal(sideloadedKit2.name);
            });

            it('should add sideloaded kits along with configured forwarders from server to the active forwarders', function() {
                const sideloadedKit1 = new MockSideloadedKit(
                    'SideloadedKit1',
                    1
                );
                const sideloadedKit2 = new MockSideloadedKit(
                    'SideloadedKit2',
                    2
                );

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                    sideloadedKit1
                );
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                    sideloadedKit2
                );

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                // This mockForwarder simulates a server configured forwarder
                const mockForwarder = new MockForwarder('fooForwarder', 1);
                mParticle.addForwarder(mockForwarder);

                window.mParticle.config.kitConfigs.push(
                    forwarderDefaultConfiguration('fooForwarder', 1)
                );

                mParticle.init(apiKey, window.mParticle.config);
                const activeForwarders = mParticle
                    .getInstance()
                    ._getActiveForwarders();

                expect(
                    activeForwarders.length,
                    'active forwarders length'
                ).to.equal(sideloadedKits.length + 1);
                expect(
                    activeForwarders[0].name,
                    '1st active forwarder name'
                ).to.equal('fooForwarder');
                expect(
                    activeForwarders[1].name,
                    '2nd active forwarder '
                ).to.deep.equal(sideloadedKit1.name);
                expect(
                    activeForwarders[2].name,
                    '3rd active forwarder'
                ).to.deep.equal(sideloadedKit2.name);
            });

            it('should add a flag in batches for reporting if sideloaded kits are used', async () => {
                const sideloadedKit1 = new MockSideloadedKit(
                    'SideloadedKit1',
                    1
                );
                const sideloadedKit2 = new MockSideloadedKit(
                    'SideloadedKit2',
                    2
                );

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                    sideloadedKit1
                );
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                    sideloadedKit2
                );

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                // This mockForwarder simulates a server configured forwarder
                const mockForwarder = new MockForwarder('fooForwarder', 1);
                mParticle.addForwarder(mockForwarder);

                window.mParticle.config.kitConfigs.push(
                    forwarderDefaultConfiguration('fooForwarder', 1)
                );

                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();
                
                const mpInstance = window.mParticle.getInstance();

                expect(mpInstance._Store.sideloadedKitsCount).to.equal(2);

                mParticle.logEvent('foo', mParticle.EventType.Navigation);

                expect(fetchMock.calls().length).to.greaterThan(1);

                const eventCall = fetchMock.calls()[1];
                expect(eventCall[0].split('/')[6]).to.equal('events');

                const batch = JSON.parse(fetchMock.calls()[1][1].body as string);
                expect(batch).to.be.ok;
                expect(batch).to.have.property('application_info');
                expect(batch.application_info).to.have.property(
                    'sideloaded_kits_count',
                    2
                );
            });

            it('should NOT add a flag in batches for reporting if sideloaded kits are not used', async () => {
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();

                mParticle.logEvent('foo', mParticle.EventType.Navigation);

                const batch = JSON.parse(fetchMock.lastCall()[1].body as string);

                expect(batch).to.have.property('application_info');
                expect(batch.application_info).not.to.have.property(
                    'sideloaded_kits_count'
                );
            });

            describe('filter dictionary integration tests', function() {
                let sideloadedKit1;
                let sideloadedKit2;
                let mpSideloadedKit1;
                let mpSideloadedKit2;

                beforeEach(function() {
                    sideloadedKit1 = new MockSideloadedKit('SideloadedKit1', 1);
                    sideloadedKit2 = new MockSideloadedKit('SideloadedKit2', 2);

                    mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                        sideloadedKit1
                    );
                    mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                        sideloadedKit2
                    );
                });

                it('should filter event names out properly when set', async () => {
                    mpSideloadedKit1.addEventNameFilter(
                        mParticle.EventType.Unknown,
                        'Test Event'
                    );
                    mpSideloadedKit2.addEventNameFilter(
                        mParticle.EventType.Unknown,
                        'Test Event2'
                    );

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);
                    await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                    await Promise.resolve();

                    mParticle.logEvent('Test Event');

                    // The received event gets replaced by the last event sent to the forwarder
                    // SideloadedKit11 has received the session start event, but not the Test Event
                    // SideloadedKit22 will receive the Test Event
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.not.equal(
                        'Test Event'
                    );
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.equal(
                        'Test Event'
                    );

                    mParticle.logEvent('Test Event2');

                    // SideloadedKit11 receives Test Event2, but SideloadedKit22 does not
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.equal(
                        'Test Event2'
                    );
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.not.equal(
                        'Test Event2'
                    );
                });

                it('should filter event types out properly when set', async () => {
                    mpSideloadedKit1.addEventTypeFilter(
                        mParticle.EventType.Unknown
                    );
                    mpSideloadedKit2.addEventTypeFilter(
                        mParticle.EventType.Navigation
                    );

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);
                    await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                    await Promise.resolve();

                    mParticle.logEvent(
                        'Test Event',
                        mParticle.EventType.Unknown
                    );

                    // The received event gets replaced by the last event sent to the forwarder
                    // SideloadedKit11 has received the session start event, but not the Test Event of EventType.Unknown
                    // SideloadedKit22 will receive the Test Event of EventType.Unknown
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.not.equal(
                        'Test Event'
                    );
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.equal(
                        'Test Event'
                    );

                    mParticle.logEvent(
                        'Test Event2',
                        mParticle.EventType.Navigation
                    );

                    // SideloadedKit11 receives the Navigation Event, SideloadedKit22 does not
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.equal(
                        'Test Event2'
                    );
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.not.equal(
                        'Test Event2'
                    );
                });

                it('should filter event attributes out properly when set', async () => {
                    mpSideloadedKit1.addEventAttributeFilter(
                        mParticle.EventType.Navigation,
                        'Test Event',
                        'testAttr1'
                    );
                    mpSideloadedKit2.addEventAttributeFilter(
                        mParticle.EventType.Navigation,
                        'Test Event',
                        'testAttr2'
                    );

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);
                    await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                    await Promise.resolve();

                    const attrs = {
                        testAttr1: 'foo',
                        testAttr2: 'bar',
                    };

                    mParticle.logEvent(
                        'Test Event',
                        mParticle.EventType.Navigation,
                        attrs
                    );

                    window.SideloadedKit11.instance.receivedEvent.EventAttributes.should.have.property(
                        'testAttr2',
                        'bar'
                    );
                    window.SideloadedKit11.instance.receivedEvent.EventAttributes.should.not.property(
                        'testAttr1'
                    );

                    window.SideloadedKit22.instance.receivedEvent.EventAttributes.should.have.property(
                        'testAttr1',
                        'foo'
                    );
                    window.SideloadedKit22.instance.receivedEvent.EventAttributes.should.not.property(
                        'testAttr2'
                    );
                });

                it('should filter screen names out properly when set', async () => {
                    mpSideloadedKit1.addScreenNameFilter('Test Screen Name 1');
                    mpSideloadedKit2.addScreenNameFilter('Test Screen Name 2');

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);
                    await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                    await Promise.resolve();

                    mParticle.logPageView('Test Screen Name 1');

                    // The received event gets replaced by the last event sent to the forwarder
                    // SideloadedKit11 has received the session start event, but not the Test Screen Name 1 event
                    // SideloadedKit22 does receive it
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.not.equal(
                        'Test Screen Name 1'
                    );
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.equal(
                        'Test Screen Name 1'
                    );

                    mParticle.logPageView('Test Screen Name 2');

                    // SideloadedKit11 will receive Test Screen Name 2, but SideloadedKit22 does not
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.equal(
                        'Test Screen Name 2'
                    );
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.not.equal(
                        'Test Screen Name 2'
                    );
                });

                it('should filter screen name attribute out properly when set', async () => {
                    mpSideloadedKit1.addScreenAttributeFilter(
                        'Test Screen Name 1',
                        'testAttr1'
                    );
                    mpSideloadedKit2.addScreenAttributeFilter(
                        'Test Screen Name 1',
                        'testAttr2'
                    );

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);
                    await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                    await Promise.resolve();

                    const attrs = {
                        testAttr1: 'foo',
                        testAttr2: 'bar',
                    };

                    mParticle.logPageView('Test Screen Name 1', attrs);

                    window.SideloadedKit11.instance.receivedEvent.EventAttributes.should.have.property(
                        'testAttr2',
                        'bar'
                    );
                    window.SideloadedKit11.instance.receivedEvent.EventAttributes.should.not.property(
                        'testAttr1'
                    );
                    window.SideloadedKit22.instance.receivedEvent.EventAttributes.should.have.property(
                        'testAttr1',
                        'foo'
                    );
                    window.SideloadedKit22.instance.receivedEvent.EventAttributes.should.not.property(
                        'testAttr2'
                    );
                });

                it('should filter user identities out properly when set', async () => {
                    mpSideloadedKit1.addUserIdentityFilter(
                        mParticle.IdentityType.Email
                    );
                    mpSideloadedKit2.addUserIdentityFilter(
                        mParticle.IdentityType.Other
                    );

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);
                    await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                    await Promise.resolve();

                    mParticle.Identity.login({
                        userIdentities: {
                            email: 'test@gmail.com',
                            other: 'test',
                        },
                    });

                    mParticle.logPageView('Test Screen Name 1');

                    await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                    await Promise.resolve();

                    // SideloadedKit11 will receive an event with only an Other identity type
                    window.SideloadedKit11.instance.receivedEvent.UserIdentities.length.should.equal(
                        1
                    );
                    window.SideloadedKit11.instance.receivedEvent.UserIdentities[0].Type.should.equal(
                        mParticle.IdentityType.Other
                    );
                    window.SideloadedKit11.instance.receivedEvent.UserIdentities[0].Identity.should.equal(
                        'test'
                    );
                    // SideloadedKit22 will receive an event with only an Email identity type
                    window.SideloadedKit22.instance.receivedEvent.UserIdentities.length.should.equal(
                        1
                    );
                    window.SideloadedKit22.instance.receivedEvent.UserIdentities[0].Type.should.equal(
                        mParticle.IdentityType.Email
                    );
                    window.SideloadedKit22.instance.receivedEvent.UserIdentities[0].Identity.should.equal(
                        'test@gmail.com'
                    );
                });

                it('should filter user attributes out properly when set', async () => {
                    mpSideloadedKit1.addUserAttributeFilter('testAttr1');
                    mpSideloadedKit2.addUserAttributeFilter('testAttr2');

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);
                    await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                    await Promise.resolve();

                    mParticle.Identity.getCurrentUser().setUserAttribute(
                        'testAttr1',
                        'foo'
                    );
                    mParticle.Identity.getCurrentUser().setUserAttribute(
                        'testAttr2',
                        'bar'
                    );

                    mParticle.logPageView('Test Screen Name 1');

                    window.SideloadedKit11.instance.receivedEvent.UserAttributes.should.have.property(
                        'testAttr2',
                        'bar'
                    );
                    window.SideloadedKit11.instance.receivedEvent.UserAttributes.should.not.have.property(
                        'testAttr1'
                    );

                    window.SideloadedKit22.instance.receivedEvent.UserAttributes.should.have.property(
                        'testAttr1',
                        'foo'
                    );
                    window.SideloadedKit22.instance.receivedEvent.UserAttributes.should.not.have.property(
                        'testAttr2'
                    );
                });
            });
        });

        describe('forwarding', function() {


            it('should send event to sideloaded kits', async () => {
                const sideloadedKit1 = new MockSideloadedKit(
                    'SideloadedKit1',
                    1
                );
                const sideloadedKit2 = new MockSideloadedKit(
                    'SideloadedKit2',
                    2
                );

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                    sideloadedKit1
                );
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                    sideloadedKit2
                );

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();

                mParticle.logEvent('foo', mParticle.EventType.Navigation);
                const sideloadedKit1Event =
                    window.SideloadedKit11.instance.receivedEvent;
                const sideloadedKit2Event =
                    window.SideloadedKit22.instance.receivedEvent;

                sideloadedKit1Event.should.have.property('EventName', 'foo');
                sideloadedKit2Event.should.have.property('EventName', 'foo');
            });

            it('should invoke sideloaded identify call', async () => {
                const sideloadedKit1 = new MockSideloadedKit(
                    'SideloadedKit1',
                    1
                );
                const sideloadedKit2 = new MockSideloadedKit(
                    'SideloadedKit2',
                    2
                );

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                    sideloadedKit1
                );
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                    sideloadedKit2
                );

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.identifyRequest = {
                    userIdentities: {
                        google: 'google123',
                    },
                };

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();

                window.SideloadedKit11.instance.should.have.property(
                    'setUserIdentityCalled',
                    true
                );
                window.SideloadedKit22.instance.should.have.property(
                    'setUserIdentityCalled',
                    true
                );

                window.SideloadedKit11.instance.should.have.property(
                    'onUserIdentifiedCalled',
                    true
                );
                window.SideloadedKit22.instance.should.have.property(
                    'onUserIdentifiedCalled',
                    true
                );
            });

            it('should invoke sideloaded set/removeUserAttribute call', async () => {
                const sideloadedKit1 = new MockSideloadedKit(
                    'SideloadedKit1',
                    1
                );
                const sideloadedKit2 = new MockSideloadedKit(
                    'SideloadedKit2',
                    2
                );

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                    sideloadedKit1
                );
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                    sideloadedKit2
                );

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();

                mParticle.Identity.getCurrentUser().setUserAttribute(
                    'gender',
                    'male'
                );
                mParticle.Identity.getCurrentUser().removeUserAttribute(
                    'gender'
                );

                window.SideloadedKit11.instance.should.have.property(
                    'setUserAttributeCalled',
                    true
                );
                window.SideloadedKit22.instance.should.have.property(
                    'setUserAttributeCalled',
                    true
                );

                window.SideloadedKit11.instance.should.have.property(
                    'removeUserAttributeCalled',
                    true
                );
                window.SideloadedKit22.instance.should.have.property(
                    'removeUserAttributeCalled',
                    true
                );
            });

            it('should invoke sideloaded logout call', async () => {
                const sideloadedKit1 = new MockSideloadedKit(
                    'SideloadedKit1',
                    1
                );
                const sideloadedKit2 = new MockSideloadedKit(
                    'SideloadedKit2',
                    2
                );

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                    sideloadedKit1
                );
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                    sideloadedKit2
                );

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();

                mParticle.Identity.logout();

                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();

                window.SideloadedKit11.instance.should.have.property(
                    'onLogoutCompleteCalled',
                    true
                );
                window.SideloadedKit22.instance.should.have.property(
                    'onLogoutCompleteCalled',
                    true
                );
            });

            it('should invoke sideloaded login call', async () => {
                const sideloadedKit1 = new MockSideloadedKit(
                    'SideloadedKit1',
                    1
                );
                const sideloadedKit2 = new MockSideloadedKit(
                    'SideloadedKit2',
                    2
                );

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                    sideloadedKit1
                );
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                    sideloadedKit2
                );

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();

                mParticle.Identity.login({
                    userIdentities: { customerid: 'abc' },
                });
                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();

                window.SideloadedKit11.instance.should.have.property(
                    'onLoginCompleteCalled',
                    true
                );
                window.SideloadedKit22.instance.should.have.property(
                    'onLoginCompleteCalled',
                    true
                );
            });

            it('should invoke sideloaded modify call', async () => {
                const sideloadedKit1 = new MockSideloadedKit(
                    'SideloadedKit1',
                    1
                );
                const sideloadedKit2 = new MockSideloadedKit(
                    'SideloadedKit2',
                    2
                );

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                    sideloadedKit1
                );
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                    sideloadedKit2
                );

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();

                mParticle.Identity.modify({
                    userIdentities: { customerid: 'abc' },
                });
                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();

                window.SideloadedKit11.instance.should.have.property(
                    'onModifyCompleteCalled',
                    true
                );
                window.SideloadedKit22.instance.should.have.property(
                    'onModifyCompleteCalled',
                    true
                );
            });

            it('should invoke sideloaded modify call', async () => {
                const sideloadedKit1 = new MockSideloadedKit(
                    'SideloadedKit1',
                    1
                );
                const sideloadedKit2 = new MockSideloadedKit(
                    'SideloadedKit2',
                    2
                );

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                    sideloadedKit1
                );
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                    sideloadedKit2
                );

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
                await Promise.resolve();

                mParticle.setOptOut(true);

                window.SideloadedKit11.instance.should.have.property(
                    'setOptOutCalled',
                    true
                );
                window.SideloadedKit22.instance.should.have.property(
                    'setOptOutCalled',
                    true
                );
            });
        });
    });
});