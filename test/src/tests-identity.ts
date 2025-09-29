import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import Utils from './config/utils';
import Constants, { HTTP_ACCEPTED, HTTP_BAD_REQUEST } from '../../src/constants';
import {
    urls,
    apiKey,
    testMPID,
    MPConfig,
    workspaceCookieName,
} from './config/constants';
import {
    Callback,
    IdentityApiData,
    UserIdentities,
} from '@mparticle/web-sdk';
import { IdentityCache } from '../../src/identity-utils';
import {
    IAliasRequest,
    IIdentityAPIModifyRequestData,
    IIdentityAPIRequestData,
} from '../../src/identity.interfaces';
import {
    IdentityModifyResultBody,
    IdentityResult,
    IdentityResultBody,
} from '../../src/identity-user-interfaces';
import { IMParticleInstanceManager, SDKProduct } from '../../src/sdkRuntimeModels';
import { IRoktKit } from '../../src/roktManager';
import { IKitConfigs } from '../../src/configAPIClient';

const {
    setLocalStorage,
    findCookie,
    forwarderDefaultConfiguration,
    findEventFromRequest,
    findBatch,
    setCookie,
    MockForwarder,
    waitForCondition,
    hasIdentityCallInflightReturned,
} = Utils;

const { HTTPCodes } = Constants;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
        fetchMock: any;
    }
}

const mParticle = window.mParticle as IMParticleInstanceManager;

const BAD_USER_IDENTITIES_AS_STRING = ({
    userIdentities: 'badUserIdentitiesString',
} as unknown) as IdentityApiData;

const BAD_USER_IDENTITIES_AS_ARRAY = ({
    userIdentities: ['bad', 'user', 'identities', 'array'],
} as unknown) as IdentityApiData;

const BAD_USER_IDENTITIES_AS_NULL = ({
    userIdentities: null,
} as unknown) as IdentityApiData;

const BAD_USER_IDENTITIES_AS_UNDEFINED = ({
    userIdentities: undefined,
} as unknown) as IdentityApiData;

const BAD_USER_IDENTITIES_AS_BOOLEAN = ({
    userIdentities: true,
} as unknown) as IdentityApiData;

const BadCallbackAsString = ('badCallbackString' as unknown) as Callback;

const EmptyUserIdentities = ({} as unknown) as IdentityApiData;

const fetchMockSuccess = (url: string, body: any = {}, headers: any = {}) => {
    fetchMock.post(
        url,
        {
            status: 200,
            body: JSON.stringify(body),
            headers,
        },
        { overwriteRoutes: true }
    );
};

describe('identity', function() {
    let clock;
    let hasIdentifyReturned;
    let hasIdentifyReturnedWithEmail;
    let hasLoginReturned;
    let hasLogOutReturned;
    let beforeEachCallbackCalled = false;
    let hasBeforeEachCallbackReturned

    beforeEach(function() {
        delete mParticle.config.useCookieStorage;
        fetchMockSuccess(urls.events);
        fetchMockSuccess(urls.identify, {
            context: null,
            matched_identities: {
                device_application_stamp: 'my-das',
            },
            is_ephemeral: true,
            mpid: testMPID,
            is_logged_in: false,
        });
        localStorage.clear();

        mParticle.config.identityCallback = function() {
            // There are some tests that need to verify that the initial init
            // call within the beforeEach method has completed before they
            // can introduce a new identityCallback for their specific assertions.
            beforeEachCallbackCalled = true;
        };

        mParticle.init(apiKey, window.mParticle.config);

        hasIdentifyReturned = (mpid = testMPID) => {
            return mParticle.Identity.getCurrentUser()?.getMPID() === mpid;
        };

        hasIdentifyReturnedWithEmail = (email = 'test@email.com') => {
            return mParticle.Identity.getCurrentUser()?.getUserIdentities()?.userIdentities?.email === email;
        };

        hasLoginReturned = () => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() ===
                'logged-in-user'
            );
        };

        hasLogOutReturned = () => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() ===
                'logged-out-user'
            );
        };

        hasBeforeEachCallbackReturned = () => beforeEachCallbackCalled;
        
    });

    afterEach(function () {
        fetchMock.restore();
        beforeEachCallbackCalled = false;
        mParticle._resetForTests(MPConfig);
        if (clock && clock) {
            clock.runAll(); // ensures all timers are complete from previous tests
        }
    });

    describe('requests', function() {
        it('should contain identify request', async () => {
            fetchMockSuccess(urls.logout, {
                    context: null,
                    matched_identities: {
                        device_application_stamp: 'my-das',
                    },
                    is_ephemeral: true,
                    mpid: testMPID,
                    is_logged_in: false,
            });

            mParticle.Identity.identify({
                userIdentities: {
                    email: 'test@email.com',
                },
            });

            await waitForCondition(hasIdentifyReturned)

            // Calls should be expected
            // 1. Identify
            // 2. Session Start
            // 3. AST
            expect(fetchMock.calls().length).to.equal(3);

            const firstCall = fetchMock.calls()[0];
            expect(firstCall[0].split('/')[4]).to.equal('identify');

            const data = JSON.parse(firstCall[1].body as unknown as string) as IIdentityAPIRequestData;

            expect(data).to.have.keys(
                'client_sdk',
                'environment',
                'known_identities',
                'previous_mpid',
                'request_id',
                'request_timestamp_ms',
                'context'
            );

            expect(data.previous_mpid).to.equal(null);

            expect(data.known_identities).to.have.property(
                'device_application_stamp'
            );
        });


        it('should contain logout request', async () => {
            fetchMockSuccess(urls.logout, {
                context: null,
                matched_identities: {
                    device_application_stamp: 'my-das',
                },
                is_ephemeral: true,
                mpid: testMPID,
                is_logged_in: false,
            });

            await waitForCondition(hasIdentifyReturned)

            mParticle.Identity.logout();

            // 4 Calls should be expected
            // 1. Identify
            // 2. Session Start
            // 3. AST
            // 4. Logout
            expect(fetchMock.calls().length).to.equal(4);

            const lastCall = fetchMock.lastCall();
            expect(lastCall[0].split('/')[4]).to.equal('logout');

            const data: IIdentityAPIRequestData = JSON.parse(lastCall[1].body as unknown as string);

            expect(data).to.have.keys(
                'client_sdk',
                'environment',
                'known_identities',
                'previous_mpid',
                'request_id',
                'request_timestamp_ms',
                'context'
            );

            expect(data.previous_mpid).to.equal(testMPID);

            expect(data.known_identities).to.have.property(
                'device_application_stamp'
            );
        });

        it('should contain login request', async () => {
            await waitForCondition(hasIdentifyReturned)

            fetchMockSuccess(urls.login, {
                    mpid: testMPID,
                    is_logged_in: false,
                    context: null,
                    matched_identities: {
                        email: 'abc@gmail.com',
                    },
                    is_ephemeral: false,
            });

            mParticle.Identity.login({
                userIdentities: {
                    email: 'test@email.com',
                },
            });

            await waitForCondition(hasIdentityCallInflightReturned)

            // Calls that should be expected:
            // 1. Identify
            // 2. Session Start
            // 3. AST
            // 4. Login 
            // 5. UIC
            expect(fetchMock.calls().length).to.equal(5);

            const loginCall = fetchMock.calls()[3];
            expect(loginCall[0].split('/')[4]).to.equal('login');

            const data: IIdentityAPIRequestData = JSON.parse(loginCall[1].body as unknown as string); 

            expect(data).to.have.keys(
                'client_sdk',
                'environment',
                'known_identities',
                'previous_mpid',
                'request_id',
                'request_timestamp_ms',
                'context'
            );

            expect(data.previous_mpid).to.equal(testMPID);

            expect(data.known_identities).to.have.property(
                'email',
                'test@email.com'
            );

            expect(data.known_identities).to.have.property(
                'device_application_stamp'
            );
        });


        it('should contain modify request', async () => {
            fetchMockSuccess(urls.modify, {
                    change_results: [
                        {
                            identity_type: 'email',
                            modified_mpid: testMPID,
                        },
                    ],
            });

            await waitForCondition(hasIdentifyReturned)
            mParticle.Identity.modify({
                userIdentities: {
                    email: 'test@email.com',
                },
            });

            // 4 Calls should be expected
            // 1. Identify
            // 2. Session Start
            // 3. AST
            // 4. Modify
            expect(fetchMock.calls().length).to.equal(4);

            const lastCall = fetchMock.lastCall();
            expect(lastCall[0].split('/')[5]).to.equal('modify');

            const data: IIdentityAPIModifyRequestData = JSON.parse(lastCall[1].body as unknown as string);

            expect(data).to.have.keys(
                'client_sdk',
                'environment',
                'identity_changes',
                'request_id',
                'request_timestamp_ms',
                'context'
            );

            expect(data.identity_changes).to.deep.equal([
                {
                    old_value: null,
                    new_value: 'test@email.com',
                    identity_type: 'email',
                },
            ]);
        });

        it('should contain previous mpid in a repeated identify request', async function () {
            fetchMockSuccess(urls.identify, {
                context: null,
                matched_identities: {
                    device_application_stamp: 'my-das',
                },
                is_ephemeral: true,
                // This should be a new mpid, since we identified earlier
                // in the beforeEach method
                mpid: 'new-mpid',
                is_logged_in: false,
            });

            let data: IIdentityAPIRequestData;

            await waitForCondition(hasIdentifyReturned)

            mParticle.Identity.identify({
                userIdentities: {
                    email: 'test@email.com',
                },
            });

            await waitForCondition(hasIdentifyReturned)

            // 4 Calls should be expected
            // 1. Identify
            // 2. Session Start
            // 3. AST
            // 4. Identify
            // expect(fetchMock.calls().length).to.equal(4);

            const lastCall = fetchMock.lastCall();
            expect(lastCall[0].split('/')[4]).to.equal('identify');

            data = JSON.parse(
                lastCall[1].body as unknown as string
            ) as IIdentityAPIRequestData;

            expect(data).to.have.keys(
                'client_sdk',
                'environment',
                'known_identities',
                'previous_mpid',
                'request_id',
                'request_timestamp_ms',
                'context'
            );

            expect(data.previous_mpid).to.equal(testMPID);

            expect(data.known_identities).to.have.property(
                'device_application_stamp'
            );
        });

        it('should strip falsey values from identify request', async () => {
            await waitForCondition(hasIdentifyReturned)

            const identityApiData = {
                userIdentities: {
                    customerid: 'valid-customer-id',
                    email: undefined,
                    facebook: false,
                    twitter: '',
                    google: 0,
                    microsoft: null, // null should be preserved
                },
            };

            fetchMock.resetHistory();

            mParticle.Identity.identify(identityApiData as unknown as IdentityApiData);

            await waitForCondition(hasIdentifyReturned)

            const firstCall = fetchMock.calls()[0];
            expect(firstCall[0].split('/')[4]).to.equal('identify');

            const data = JSON.parse(firstCall[1].body as unknown as string) as IIdentityAPIRequestData;

            expect(data).to.have.keys(
                'client_sdk',
                'environment',
                'known_identities',
                'previous_mpid',
                'request_id',
                'request_timestamp_ms',
                'context'
            );

            expect(data.known_identities).to.have.property(
                'device_application_stamp',
            );
            expect(data.known_identities).to.have.property(
                'customerid',
            );
            expect(data.known_identities).to.have.property(
                'microsoft',
            );
            expect(data.known_identities).to.not.have.property(
                'email',
            );
            expect(data.known_identities).to.not.have.property(
                'facebook',
            );
            expect(data.known_identities).to.not.have.property(
                'twitter',
            );
            expect(data.known_identities).to.not.have.property(
                'google',
            );
        });

        it('should strip falsey values from login request', async () => {
            await waitForCondition(hasIdentifyReturned)

            const identityApiData = {
                    userIdentities: {
                    customerid: 'valid-customer-id',
                    email: undefined,
                    facebook: false,
                    twitter: '',
                    google: 0,
                    microsoft: null, // null should be preserved
                },
            };

            fetchMockSuccess(urls.login, {
                context: null,
                matched_identities: {
                    device_application_stamp: 'my-das',
                },
                is_ephemeral: true,
                mpid: testMPID,
                is_logged_in: false,
            });

            fetchMock.resetHistory();

            mParticle.Identity.login(identityApiData as unknown as IdentityApiData);

            await waitForCondition(hasIdentityCallInflightReturned)

            const firstCall = fetchMock.calls()[0];
            expect(firstCall[0].split('/')[4]).to.equal('login');

            const data = JSON.parse(firstCall[1].body as unknown as string) as IIdentityAPIRequestData;

            expect(data.known_identities).to.have.property(
                'device_application_stamp',
            );
            expect(data.known_identities).to.have.property(
                'customerid',
            );
            expect(data.known_identities).to.have.property(
                'microsoft',
            );
            expect(data.known_identities).to.not.have.property(
                'email',
            );
            expect(data.known_identities).to.not.have.property(
                'facebook',
            );
            expect(data.known_identities).to.not.have.property(
                'twitter',
            );
            expect(data.known_identities).to.not.have.property(
                'google',
            );
        });

        it('should strip falsey values from logout request', async () => {
            await waitForCondition(hasIdentifyReturned)

            const identityApiData = {
                    userIdentities: {
                    customerid: 'valid-customer-id',
                    email: undefined,
                    facebook: false,
                    twitter: '',
                    google: 0,
                    microsoft: null, // null should be preserved
                },
            };

            fetchMockSuccess(urls.logout, {
                context: null,
                matched_identities: {
                    device_application_stamp: 'my-das',
                },
                is_ephemeral: true,
                mpid: testMPID,
                is_logged_in: false,
            });

            fetchMock.resetHistory();

            mParticle.Identity.logout(identityApiData as unknown as IdentityApiData);

            await waitForCondition(hasIdentityCallInflightReturned)

            const firstCall = fetchMock.calls()[0];
            expect(firstCall[0].split('/')[4]).to.equal('logout');

            const data = JSON.parse(firstCall[1].body as unknown as string) as IIdentityAPIRequestData;

            expect(data.known_identities).to.have.property(
                'device_application_stamp',
            );
            expect(data.known_identities).to.have.property(
                'customerid',
            );
            expect(data.known_identities).to.have.property(
                'microsoft',
            );
            expect(data.known_identities).to.not.have.property(
                'email',
            );
            expect(data.known_identities).to.not.have.property(
                'facebook',
            );
            expect(data.known_identities).to.not.have.property(
                'twitter',
            );
            expect(data.known_identities).to.not.have.property(
                'google',
            );
        });

        it('should strip falsey values from modify request', async () => {
            await waitForCondition(hasIdentifyReturned)

            const identityApiData = {
                    userIdentities: {
                    customerid: 'valid-customer-id',
                    email: undefined,
                    facebook: false,
                    twitter: '',
                    google: 0,
                    microsoft: null, // null should be preserved
                },
            };

            fetchMock.resetHistory();

            fetchMockSuccess(urls.modify, {
                change_results: [
                    {
                        identity_type: 'email',
                        modified_mpid: testMPID,
                    },
                ],
            });

            mParticle.Identity.modify(identityApiData as unknown as IdentityApiData);

            await waitForCondition(hasIdentityCallInflightReturned)

            const firstCall = fetchMock.calls()[0];
            debugger
            expect(firstCall[0].split('/')[5]).to.equal('modify');

            const data = JSON.parse(firstCall[1].body as unknown as string) as IIdentityAPIModifyRequestData;

            expect(data).to.have.keys(
                'client_sdk',
                'environment',
                'identity_changes',
                'request_id',
                'request_timestamp_ms',
                'context'
            );

            // For modify requests, we check identity_changes instead of known_identities
            expect(data.identity_changes).to.be.an('array');
            expect(data.identity_changes).to.have.length(2); // customerid and microsoft (null preserved)

            const identityTypes = data.identity_changes.map(change => change.identity_type);
            expect(identityTypes).to.include('customerid');
            expect(identityTypes).to.include('microsoft');
            expect(identityTypes).to.not.include('email');
            expect(identityTypes).to.not.include('facebook');
            expect(identityTypes).to.not.include('twitter');
            expect(identityTypes).to.not.include('google');
        });
    });

    describe('privacy flags', function() {
        beforeEach(function() {
            mParticle._resetForTests(MPConfig);
            mParticle.config.flags.cacheIdentity = 'True';
            localStorage.clear();
        });

        describe('#createIdentityCache', function() {
            it('should save id cache to local storage when noFunctional is false by default', async () => {
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                expect(localStorage.getItem('mprtcl-v4_abcdef-id-cache')).to.be.ok;
            });

            it('should NOT save id cache to local storage when noFunctional is true', async () => {
                mParticle.config.launcherOptions = { noFunctional: true };
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                expect(localStorage.getItem('mprtcl-v4_abcdef-id-cache')).not.to.be.ok;
            });

            it('should save id cache to local storage when noFunctional is false', async () => {
                mParticle.config.launcherOptions = { noFunctional: false };
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                expect(localStorage.getItem('mprtcl-v4_abcdef-id-cache')).to.be.ok;
            });
        });
    });

    // https://go.mparticle.com/work/SQDSDKS-6849
    // This test passes with no issue when it is run on its own, but fails when tests-forwarders.js are also ran.
    it('should respect consent rules on consent-change', async () => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder('MockForwarder1');
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder1', 1);
        config1.filteringConsentRuleValues = {
            includeOnMatch: true,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: true,
                },
            ],
        };

        const mockForwarder2 = new MockForwarder('MockForwarder2', 2);
        mockForwarder2.register(window.mParticle.config);

        const config2 = forwarderDefaultConfiguration('MockForwarder2', 2);
        config2.filteringConsentRuleValues = {
            includeOnMatch: true,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 2'
                    ),
                    hasConsented: true,
                },
            ],
        };

        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition( () => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1')

        let activeForwarders = mParticle.getInstance()._getActiveForwarders();
        expect(activeForwarders.length).to.equal(0);

        let consentState = mParticle.Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo purpose 1',
            mParticle.Consent.createGDPRConsent(true)
        );
        mParticle.Identity.getCurrentUser().setConsentState(consentState);

        activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(1);
        activeForwarders[0].name.should.equal('MockForwarder1');

        fetchMockSuccess(urls.login, {
            mpid: 'MPID2',
            is_logged_in: false,
        });

        mParticle.Identity.login();

        await waitForCondition(hasIdentityCallInflightReturned)

        activeForwarders = mParticle.getInstance()._getActiveForwarders();
        expect(activeForwarders.length).to.equal(0);

        consentState = mParticle.Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo purpose 2',
            mParticle.Consent.createGDPRConsent(true)
        );
        mParticle.Identity.getCurrentUser().setConsentState(consentState);

        activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(1);
        activeForwarders[0].name.should.equal('MockForwarder2');
    });

    describe('cookies', function () {
    it('should store all MPIDs associated with a sessionId, then clear MPIDs from currentSessionMPIDs when a new session starts', async () => {
        await waitForCondition(hasIdentifyReturned)

        fetchMockSuccess(urls.login, {
            mpid: 'logged-in-user',
            is_logged_in: true,
        });

        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1',
            },
        };

        mParticle.Identity.login(userIdentities1);
        await waitForCondition(hasLoginReturned)

        const localStorageDataBeforeSessionEnd = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        localStorageDataBeforeSessionEnd.gs.csm.length.should.equal(2);

        mParticle.endSession();
        const localStorageDataAfterSessionEnd1 = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorageDataAfterSessionEnd1.gs.should.not.have.property('csm');

        mParticle.logEvent('hi');
        mParticle.Identity.login(userIdentities1);

        await waitForCondition(hasIdentityCallInflightReturned)

        const localStorageAfterLoggingEvent = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorageAfterLoggingEvent.gs.csm.length.should.equal(1);
    });

    it('localStorage - should switch user cookies to new mpid details from cookies when a new mpid is provided', async () => {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.useCookieStorage = false;

        setLocalStorage();

        mParticle.init(apiKey, window.mParticle.config);

        const cookies1 = mParticle.getInstance()._Persistence.getLocalStorage();
        cookies1.cu.should.equal(testMPID);
        cookies1[testMPID].should.have.property('csd');

        fetchMockSuccess(urls.login, {
            mpid: 'logged-in-user',
            is_logged_in: true,
        });

        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1',
            },
        };

        mParticle.Identity.login(userIdentities1);
        await waitForCondition(hasLoginReturned)
        const cookiesAfterMPIDChange = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        expect(cookiesAfterMPIDChange).to.have.all.keys([
            'l',
            'cu',
            'logged-in-user',
            testMPID,
            'gs',
        ]);
        expect(cookiesAfterMPIDChange).to.have.property('cu', 'logged-in-user');
        expect(cookiesAfterMPIDChange[testMPID]).to.have.property('csd');

        const props = [
            'ie',
            'sa',
            'ss',
            'dt',
            'les',
            'av',
            'cgid',
            'das',
            'sid',
            'c',
            'mpid',
            'cp',
        ];

        props.forEach(function(prop) {
            expect(cookiesAfterMPIDChange[testMPID]).to.not.have.property(prop);
            expect(cookiesAfterMPIDChange['logged-in-user']).to.not.have.property(
                prop
            );
        });
    });

    it('cookies - should switch user cookies to new mpid details from cookies when a new mpid is provided', async () => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;

        setLocalStorage();

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned)

        const cookiesAfterInit = findCookie();
        cookiesAfterInit.should.have.properties('gs', 'cu', testMPID);

        const props1 = [
            'mpid',
            'ui',
            'ua',
            'les',
            'sid',
            'ie',
            'dt',
            'sa',
            'ss',
            'cp',
        ];

        props1.forEach(function(prop) {
            cookiesAfterInit.should.not.have.property(prop);
        });

        fetchMockSuccess(urls.login, {
            mpid: 'logged-in-user',
            is_logged_in: true,
        });

        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1',
            },
        };

        mParticle.Identity.login(userIdentities1);

        await waitForCondition(hasLoginReturned)

        const cookiesAfterMPIDChange = findCookie();
        cookiesAfterMPIDChange.should.have.properties([
            'cu',
            'gs',
            'logged-in-user',
            testMPID,
        ]);
        cookiesAfterMPIDChange.should.have.property('cu', 'logged-in-user');

        const props2 = [
            'ie',
            'sa',
            'ss',
            'dt',
            'les',
            'av',
            'cgid',
            'das',
            'sid',
            'c',
            'mpid',
            'cp',
        ];

        props2.forEach(function(prop) {
            cookiesAfterMPIDChange[testMPID].should.not.have.property(prop);
            cookiesAfterMPIDChange['logged-in-user'].should.not.have.property(prop);
        });
    });
});


    describe('identity request validation', function () {
    it('should swap property identityType for identityName', function (done) {
        const data: IdentityApiData = { userIdentities: {} };
        data.userIdentities.other = 'id1';
        data.userIdentities.customerid = 'id2';
        data.userIdentities.facebook = 'id3';
        data.userIdentities.twitter = 'id4';
        data.userIdentities.google = 'id5';
        data.userIdentities.microsoft = 'id6';
        data.userIdentities.yahoo = 'id7';
        data.userIdentities.email = 'id8';
        data.userIdentities.facebookcustomaudienceid = 'id9';
        data.userIdentities.other2 = 'id10';
        data.userIdentities.other3 = 'id11';
        data.userIdentities.other4 = 'id12';

        let count = 0;
        for (const key in data.userIdentities) {
            // https://go.mparticle.com/work/SQDSDKS-6473
            expect(mParticle.IdentityType.getIdentityType(key)).to.equal(count);
            count++;
            // 8 is alias, which was removed
            if (count === 8) {
                count = 9;
            }
        }

        done();
    });

    it('should create a proper identity request', async (done) => {
        const data: IdentityApiData = { userIdentities: {} },
            platform = 'web',
            sdkVendor = 'mparticle',
            sdkVersion = '1.0.0',
            deviceId = 'abc',
            context = null;

        data.userIdentities.other = 'id1';
        data.userIdentities.customerid = 'id2';
        data.userIdentities.facebook = 'id3';
        data.userIdentities.twitter = 'id4';
        data.userIdentities.google = 'id5';
        data.userIdentities.microsoft = 'id6';
        data.userIdentities.yahoo = 'id7';
        data.userIdentities.email = 'id8';
        data.userIdentities.facebookcustomaudienceid = 'id9';
        data.userIdentities.other2 = 'id10';
        data.userIdentities.other3 = 'id11';
        data.userIdentities.other4 = 'id12';
        data.userIdentities.other5 = 'id13';
        data.userIdentities.other6 = 'id14';
        data.userIdentities.other7 = 'id15';
        data.userIdentities.other8 = 'id16';
        data.userIdentities.other9 = 'id17';
        data.userIdentities.other10 = 'id18';
        data.userIdentities.mobile_number = 'id19';
        data.userIdentities.phone_number_2 = 'id20';
        data.userIdentities.phone_number_3 = 'id21';

        const identityRequest = mParticle
            .getInstance()
            ._Identity.IdentityRequest.createIdentityRequest(
                data,
                platform,
                sdkVendor,
                sdkVersion,
                deviceId,
                context,
                testMPID
            );

        expect(identityRequest).to.have.all.keys([
            'client_sdk',
            'context',
            'environment',
            'known_identities',
            'previous_mpid',
            'request_id',
            'request_timestamp_ms',
        ]);

        expect(identityRequest.client_sdk).to.have.all.keys([
            'platform',
            'sdk_vendor',
            'sdk_version',
        ]);

        expect(identityRequest.client_sdk.platform).to.equal(platform);
        expect(identityRequest.client_sdk.sdk_vendor).to.equal(sdkVendor);
        expect(identityRequest.environment).to.equal('production');
        expect(identityRequest.previous_mpid).to.equal(testMPID);

        expect(identityRequest.known_identities).to.have.all.keys([
            'other',
            'customerid',
            'facebook',
            'twitter',
            'google',
            'microsoft',
            'yahoo',
            'email',
            'facebookcustomaudienceid',
            'other2',
            'other3',
            'other4',
            'other5',
            'other6',
            'other7',
            'other8',
            'other9',
            'other10',
            'phone_number_2',
            'phone_number_3',
            'mobile_number',
            'device_application_stamp',
        ]);

        expect(identityRequest.known_identities.other).to.equal('id1');
        expect(identityRequest.known_identities.customerid).to.equal('id2');
        expect(identityRequest.known_identities.facebook).to.equal('id3');
        expect(identityRequest.known_identities.twitter).to.equal('id4');
        expect(identityRequest.known_identities.google).to.equal('id5');
        expect(identityRequest.known_identities.microsoft).to.equal('id6');
        expect(identityRequest.known_identities.yahoo).to.equal('id7');
        expect(identityRequest.known_identities.email).to.equal('id8');
        expect(
            identityRequest.known_identities.facebookcustomaudienceid
        ).to.equal('id9');
        expect(identityRequest.known_identities.other2).to.equal('id10');
        expect(identityRequest.known_identities.other3).to.equal('id11');
        expect(identityRequest.known_identities.other4).to.equal('id12');
        expect(identityRequest.known_identities.other5).to.equal('id13');
        expect(identityRequest.known_identities.other6).to.equal('id14');
        expect(identityRequest.known_identities.other7).to.equal('id15');
        expect(identityRequest.known_identities.other8).to.equal('id16');
        expect(identityRequest.known_identities.other9).to.equal('id17');
        expect(identityRequest.known_identities.other10).to.equal('id18');
        expect(identityRequest.known_identities.mobile_number).to.equal('id19');
        expect(identityRequest.known_identities.phone_number_2).to.equal(
            'id20'
        );
        expect(identityRequest.known_identities.phone_number_3).to.equal(
            'id21'
        );

        done();
    });

    it('should create a proper modify identity request', async (done) => {
        const platform = 'web';
        const sdkVendor = 'mparticle';
        const sdkVersion = '1.0.0';
        const context = null;

        const oldIdentities: UserIdentities = {};
        oldIdentities['other'] = 'id1';
        oldIdentities['customerid'] = 'id2';
        oldIdentities['facebook'] = 'id3';
        oldIdentities['twitter'] = 'id4';
        oldIdentities['google'] = 'id5';
        oldIdentities['microsoft'] = 'id6';
        oldIdentities['yahoo'] = 'id7';
        oldIdentities['email'] = 'id8';
        oldIdentities['facebookcustomaudienceid'] = 'id9';
        oldIdentities['other2'] = 'id11';
        oldIdentities['other3'] = 'id12';
        oldIdentities['other4'] = 'id13';
        oldIdentities['other5'] = 'id14';
        oldIdentities['other6'] = 'id15';
        oldIdentities['other7'] = 'id16';
        oldIdentities['other8'] = 'id17';
        oldIdentities['other9'] = 'id18';
        oldIdentities['other10'] = 'id19';
        oldIdentities['mobile_number'] = 'id20';
        oldIdentities['phone_number_2'] = 'id21';
        oldIdentities['phone_number_3'] = 'id22';

        const newIdentities: UserIdentities = {};
        newIdentities.other = 'id14';
        newIdentities.customerid = 'id15';
        newIdentities.facebook = 'id16';
        newIdentities.twitter = 'id17';
        newIdentities.google = 'id18';
        newIdentities.microsoft = 'id19';
        newIdentities.yahoo = 'id20';
        newIdentities.email = 'id21';
        newIdentities.facebookcustomaudienceid = 'id22';
        newIdentities.other2 = 'id23';
        newIdentities.other3 = 'id24';
        newIdentities.other4 = 'id25';
        newIdentities.other5 = 'id26';
        newIdentities.other6 = 'id27';
        newIdentities.other7 = 'id28';
        newIdentities.other8 = 'id29';
        newIdentities.other9 = 'id30';
        newIdentities.other10 = 'id31';
        newIdentities.mobile_number = 'id32';
        newIdentities.phone_number_2 = 'id33';
        newIdentities.phone_number_3 = 'id34';

        const identityRequest = mParticle
            .getInstance()
            ._Identity.IdentityRequest.createModifyIdentityRequest(
                oldIdentities,
                newIdentities,
                platform,
                sdkVendor,
                sdkVersion,
                context
            );

        expect(identityRequest).to.have.all.keys([
            'client_sdk',
            'context',
            'environment',
            'identity_changes',
            'request_id',
            'request_timestamp_ms',
        ]);
        expect(identityRequest.client_sdk).to.have.all.keys([
            'platform',
            'sdk_vendor',
            'sdk_version',
        ]);
        expect(identityRequest.client_sdk.platform).to.equal('web');
        expect(identityRequest.client_sdk.sdk_vendor).to.equal('mparticle');
        expect(identityRequest.environment).to.equal('production');
        expect(identityRequest.identity_changes.length).to.equal(21);

        expect(identityRequest.identity_changes[0]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[0].old_value).to.equal('id1');
        expect(identityRequest.identity_changes[0].identity_type).to.equal(
            'other'
        );
        expect(identityRequest.identity_changes[0].new_value).to.equal('id14');

        expect(identityRequest.identity_changes[1]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[1].old_value).to.equal('id2');
        expect(identityRequest.identity_changes[1].identity_type).to.equal(
            'customerid'
        );
        expect(identityRequest.identity_changes[1].new_value).to.equal('id15');

        expect(identityRequest.identity_changes[2]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[2].old_value).to.equal('id3');
        expect(identityRequest.identity_changes[2].identity_type).to.equal(
            'facebook'
        );
        expect(identityRequest.identity_changes[2].new_value).to.equal('id16');

        expect(identityRequest.identity_changes[3]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[3].old_value).to.equal('id4');
        expect(identityRequest.identity_changes[3].identity_type).to.equal(
            'twitter'
        );
        expect(identityRequest.identity_changes[3].new_value).to.equal('id17');

        expect(identityRequest.identity_changes[4]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[4].old_value).to.equal('id5');
        expect(identityRequest.identity_changes[4].identity_type).to.equal(
            'google'
        );
        expect(identityRequest.identity_changes[4].new_value).to.equal('id18');

        expect(identityRequest.identity_changes[5]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[5].old_value).to.equal('id6');
        expect(identityRequest.identity_changes[5].identity_type).to.equal(
            'microsoft'
        );
        expect(identityRequest.identity_changes[5].new_value).to.equal('id19');

        expect(identityRequest.identity_changes[6]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[6].old_value).to.equal('id7');
        expect(identityRequest.identity_changes[6].identity_type).to.equal(
            'yahoo'
        );
        expect(identityRequest.identity_changes[6].new_value).to.equal('id20');

        expect(identityRequest.identity_changes[7]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[7].old_value).to.equal('id8');
        expect(identityRequest.identity_changes[7].identity_type).to.equal(
            'email'
        );
        expect(identityRequest.identity_changes[7].new_value).to.equal('id21');

        expect(identityRequest.identity_changes[8]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[8].old_value).to.equal('id9');
        expect(identityRequest.identity_changes[8].identity_type).to.equal(
            'facebookcustomaudienceid'
        );
        expect(identityRequest.identity_changes[8].new_value).to.equal('id22');

        expect(identityRequest.identity_changes[9]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[9].old_value).to.equal('id11');
        expect(identityRequest.identity_changes[9].identity_type).to.equal(
            'other2'
        );
        expect(identityRequest.identity_changes[9].new_value).to.equal('id23');

        expect(identityRequest.identity_changes[10]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[10].old_value).to.equal('id12');
        expect(identityRequest.identity_changes[10].identity_type).to.equal(
            'other3'
        );
        expect(identityRequest.identity_changes[10].new_value).to.equal('id24');

        expect(identityRequest.identity_changes[11]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[11].old_value).to.equal('id13');
        expect(identityRequest.identity_changes[11].identity_type).to.equal(
            'other4'
        );
        expect(identityRequest.identity_changes[11].new_value).to.equal('id25');

        expect(identityRequest.identity_changes[12]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[12].old_value).to.equal('id14');
        expect(identityRequest.identity_changes[12].identity_type).to.equal(
            'other5'
        );
        expect(identityRequest.identity_changes[12].new_value).to.equal('id26');

        expect(identityRequest.identity_changes[13].old_value).to.equal('id15');
        expect(identityRequest.identity_changes[13].identity_type).to.equal(
            'other6'
        );
        expect(identityRequest.identity_changes[13].new_value).to.equal('id27');

        expect(identityRequest.identity_changes[14].old_value).to.equal('id16');
        expect(identityRequest.identity_changes[14].identity_type).to.equal(
            'other7'
        );
        expect(identityRequest.identity_changes[14].new_value).to.equal('id28');

        expect(identityRequest.identity_changes[15].old_value).to.equal('id17');
        expect(identityRequest.identity_changes[15].identity_type).to.equal(
            'other8'
        );
        expect(identityRequest.identity_changes[15].new_value).to.equal('id29');

        expect(identityRequest.identity_changes[16].old_value).to.equal('id18');
        expect(identityRequest.identity_changes[16].identity_type).to.equal(
            'other9'
        );
        expect(identityRequest.identity_changes[16].new_value).to.equal('id30');

        expect(identityRequest.identity_changes[17].old_value).to.equal('id19');
        expect(identityRequest.identity_changes[17].identity_type).to.equal(
            'other10'
        );
        expect(identityRequest.identity_changes[17].new_value).to.equal('id31');

        expect(identityRequest.identity_changes[18].old_value).to.equal('id20');
        expect(identityRequest.identity_changes[18].identity_type).to.equal(
            'mobile_number'
        );
        expect(identityRequest.identity_changes[18].new_value).to.equal('id32');

        expect(identityRequest.identity_changes[19].old_value).to.equal('id21');
        expect(identityRequest.identity_changes[19].identity_type).to.equal(
            'phone_number_2'
        );
        expect(identityRequest.identity_changes[19].new_value).to.equal('id33');

        expect(identityRequest.identity_changes[20].old_value).to.equal('id22');
        expect(identityRequest.identity_changes[20].identity_type).to.equal(
            'phone_number_3'
        );
        expect(identityRequest.identity_changes[20].new_value).to.equal('id34');

        done();
        });
    });

    describe('#login', function () {
        beforeEach(function () {
            // Resets fetchMock so we can isolate calls for this tests
            fetchMock.restore();
        });

    it('should not make a request when an invalid request is sent as a string', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_STRING;
        mParticle.Identity.login(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as an array', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_ARRAY;
        mParticle.Identity.login(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as a null', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_NULL;
        mParticle.Identity.login(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as undefined', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_UNDEFINED;
        mParticle.Identity.login(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as a boolean', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_BOOLEAN;
        mParticle.Identity.login(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid callback is set', async () => {
        const identityRequest: IdentityApiData = {
            userIdentities: {
                customerid: '123',
            },
        };
        const badCallback = BadCallbackAsString;

        mParticle.Identity.login(identityRequest, badCallback);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });
    });

    describe('#logout', function () {
        beforeEach(function () {
            // Resets fetchMock so we can isolate calls for this tests
            fetchMock.restore();
        });

    it('should not make a request when an invalid request is sent as string', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_STRING;
        mParticle.Identity.logout(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as array', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_ARRAY;
        mParticle.Identity.logout(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as a null', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_NULL;
        mParticle.Identity.logout(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as undefined', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_UNDEFINED;
        mParticle.Identity.logout(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as boolean', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_BOOLEAN;
        mParticle.Identity.logout(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid callback is sent', async () => {
        const identityRequest: IdentityApiData = {
            userIdentities: {
                customerid: '123',
            },
        };
        const badCallback = BadCallbackAsString;

        mParticle.Identity.logout(identityRequest, badCallback);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });
    });

    describe('#modify', function () {
        beforeEach(function () {
            // Resets fetchMock so we can isolate calls for this tests
            fetchMock.restore();
        });

    it('should not make a request when an invalid request is sent as a string', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_STRING;
        debugger
        mParticle.Identity.modify(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as an array', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_ARRAY;
        mParticle.Identity.modify(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as a null', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_NULL;
        mParticle.Identity.modify(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as a undefined', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_UNDEFINED;
        mParticle.Identity.modify(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as a boolean', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_BOOLEAN;
        mParticle.Identity.modify(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
        });

    it('should not make a request when an invalid callback is set', async () => {
        const identityRequest: IdentityApiData = {
            userIdentities: {
                customerid: '123',
            },
        };
        const badCallback = BadCallbackAsString;

        mParticle.Identity.modify(identityRequest, badCallback);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });
    });

    describe('#identify', function () {
        beforeEach(function () {
            // Resets fetchMock so we can isolate calls for this tests
            fetchMock.restore();
        });

    it('should not make a request when an invalid request is sent as a string', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_STRING;
        mParticle.Identity.identify(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as an array', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_ARRAY;
        mParticle.Identity.identify(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as a null', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_NULL;
        mParticle.Identity.identify(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as a undefined', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_UNDEFINED;
        mParticle.Identity.identify(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid request is sent as a boolean', async () => {
        const identityAPIRequest = BAD_USER_IDENTITIES_AS_BOOLEAN;
        mParticle.Identity.identify(identityAPIRequest);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not make a request when an invalid callback is set', async () => {
        const identityRequest: IdentityApiData = {
            userIdentities: {
                customerid: '123',
            },
        };
        const badCallback = BadCallbackAsString;

        mParticle.Identity.identify(identityRequest, badCallback);

        await waitForCondition(hasIdentityCallInflightReturned)
                expect(fetchMock.calls().length).to.equal(0);
    });
    });

    it('should have old_value === null when there is no previous identity of a certain type and a new identity of that type', function (done) {
        const oldIdentities: UserIdentities = {};
        oldIdentities['facebook'] = 'old_facebook_id';

        const newIdentities: UserIdentities = {};
        newIdentities.other = 'new_other_id';
        newIdentities.facebook = 'new_facebook_id';

        const identityRequest = mParticle
            .getInstance()
            ._Identity.IdentityRequest.createModifyIdentityRequest(
                oldIdentities,
                newIdentities,
                'test-platform',
                'test-sdk-vendor',
                'test-sdk-version',
                'test-context'
            );

        expect(identityRequest.identity_changes[0]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[0]).to.have.property(
            'old_value',
            null
        );
        expect(identityRequest.identity_changes[0].identity_type).to.equal(
            'other'
        );
        expect(identityRequest.identity_changes[0].new_value).to.equal(
            'new_other_id'
        );

        expect(identityRequest.identity_changes[1]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[1]).to.have.property(
            'old_value',
            'old_facebook_id'
        );
        expect(identityRequest.identity_changes[1].identity_type).to.equal(
            'facebook'
        );
        expect(identityRequest.identity_changes[1].new_value).to.equal(
            'new_facebook_id'
        );

        done();
    });

    it('should have new_value === null when there is a previous identity of a certain type and no new identity of that type', async (done) => {
        const oldIdentities: UserIdentities = {};
        oldIdentities['other'] = 'old_other_id';
        oldIdentities['facebook'] = 'old_facebook_id';
        const newIdentities: UserIdentities = {};
        newIdentities.facebook = 'new_facebook_id';

        const identityRequest = mParticle
            .getInstance()
            ._Identity.IdentityRequest.createModifyIdentityRequest(
                oldIdentities,
                newIdentities,
                'test-platform',
                'test-sdk-vendor',
                'test-sdk-version',
                'test-context'
            );

        expect(identityRequest.identity_changes[0]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[0].old_value).to.equal(
            'old_facebook_id'
        );
        expect(identityRequest.identity_changes[0].identity_type).to.equal(
            'facebook'
        );
        expect(identityRequest.identity_changes[0].new_value).to.equal(
            'new_facebook_id'
        );

        expect(identityRequest.identity_changes.length).to.equal(1);

        done();
    });

    // https://go.mparticle.com/work/SQDSDKS-6568
    it('should create a proper send request when passing identities to modify', async () => {
        await waitForCondition(hasIdentifyReturned)
        const identityAPIData: IdentityApiData = {
            userIdentities: {
                email: 'rob@gmail.com',
            },
        };
        mParticle.init(apiKey, window.mParticle.config);

        fetchMockSuccess(urls.modify, {
                change_results: [
                    {
                        identity_type: 'email',
                        modified_mpid: testMPID,
                    },
                ],
        });

        await waitForCondition(hasIdentityCallInflightReturned)

        fetchMock.resetHistory();
        mParticle.Identity.modify(identityAPIData);

        await waitForCondition(hasIdentityCallInflightReturned)
            // 1st call is modify, 2nd call is the UIC event
            console.log('fetchMock.calls()', fetchMock.calls());
            expect(fetchMock.calls().length).to.equal(2);

            const modifyCall = fetchMock.calls()[0];
            expect(modifyCall[0].split('/')[5]).to.equal('modify');

            const data: IIdentityAPIModifyRequestData = JSON.parse(modifyCall[1].body as unknown as string);

            expect(data.identity_changes.length).to.equal(1);
            expect(data.identity_changes[0]).to.have.keys(
                'old_value',
                'new_value',
                'identity_type'
            );
            expect(data.identity_changes[0]).to.have.keys(
                'old_value',
                'new_value',
                'identity_type'
            );
    });

    it('ensure that automatic identify is not called more than once.', async () => {
        mParticle._resetForTests(MPConfig);
        const spy = sinon.spy();

        await waitForCondition(hasIdentifyReturned)
        mParticle.config.identityCallback = spy;

        fetchMockSuccess(urls.identify, {
            mpid: 'otherMPID',
            is_logged_in: false,
        });

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => {
            return mParticle.Identity.getCurrentUser()?.getMPID() === 'otherMPID';
        })

        spy.calledOnce.should.be.ok();
        mParticle.startNewSession();
        await waitForCondition(hasIdentityCallInflightReturned)
        spy.calledOnce.should.be.ok();
    });

    it('queue events when MPID is 0, and then flush events once MPID changes', async () => {
        mParticle._resetForTests(MPConfig);
        fetchMock.resetHistory();

        fetchMockSuccess(
            urls.identify,
            {
                status: 400,
                body: JSON.stringify({}),
            }
        );

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)
        mParticle.logEvent('Test Event 1');

        // There should be 3 calls here:
        // 1. Identify (from init)
        // 2. AST
        // 3. Session start
        // The event should not be sent because the MPID is 0
        expect(fetchMock.calls().length).to.equal(3);

        let testEvent1 = findEventFromRequest(
            fetchMock.calls(),
            'Test Event 1'
        );

        expect(testEvent1).to.not.be.ok;

        fetchMockSuccess(urls.login, {
            mpid: 'logged-in-user',
            is_logged_in: false,
        });

        mParticle.logEvent('Test Event 2');
        mParticle.Identity.login();

        await waitForCondition(hasLoginReturned)

        // server requests will now have the following events:
        // 1. Identify (from init)
        // 2. AST
        // 3. Session start
        // 4. Test1,
        // 5. Login 
        // 6. Test2
        expect(fetchMock.calls().length).to.equal(6);

        testEvent1 = findEventFromRequest(
            fetchMock.calls(),
            'Test Event 1'
        );

        const testEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'Test Event 2'
        );

        const ASTEvent = findEventFromRequest(
            fetchMock.calls(),
            'application_state_transition'
        );

        const sessionStartEvent = findEventFromRequest(
            fetchMock.calls(),
            'session_start'
        );

        const loginCall = fetchMock.calls()[3];

        expect(testEvent1).to.be.ok;
        expect(testEvent2).to.be.ok;
        expect(ASTEvent).to.be.ok;
        expect(sessionStartEvent).to.be.ok;
        expect(loginCall[0].split('/')[4]).to.equal('login');
    });

    it('getUsers should return all mpids available in local storage', async () => {
        mParticle._resetForTests(MPConfig);

        const userIdentities1: IdentityApiData = {
            userIdentities: {
                customerid: 'foo1',
            },
        };

        const userIdentities2: IdentityApiData = {
            userIdentities: {
                customerid: 'foo2',
            },
        };

        const userIdentities3: IdentityApiData = {
            userIdentities: {
                customerid: 'foo3',
            },
        };

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        // get user 1 into cookies
        fetchMockSuccess(urls.login, {
            mpid: 'user1',
            is_logged_in: false,
        });

        mParticle.Identity.login(userIdentities1);

        await waitForCondition(hasIdentityCallInflightReturned)

        // get user 2 into cookies
        fetchMockSuccess(urls.login, {
            mpid: 'user2',
            is_logged_in: false,
        });

        mParticle.Identity.login(userIdentities2);

        await waitForCondition(hasIdentityCallInflightReturned)

        // get user 3 into cookies
        fetchMockSuccess(urls.login, {
            mpid: 'user3',
            is_logged_in: false,
        });

        mParticle.Identity.login(userIdentities3);

        await waitForCondition(hasIdentityCallInflightReturned)

        // init again using user 1
        fetchMockSuccess(urls.login, {
            mpid: 'user1',
            is_logged_in: false,
        });

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => mParticle.Identity?.getUsers().length === 4)
        const users = mParticle.Identity.getUsers();
        // This includes the original, starting user, in addition to the 3 added above
        expect(users.length).to.equal(4);

        for (let i of users) {
            const mpid = i.getMPID();
            expect(mParticle.Identity.getUser(mpid)).to.exist;
        }
        expect(mParticle.Identity.getUser('gs')).to.not.exist;
        expect(mParticle.Identity.getUser('cu')).to.not.exist;
        expect(mParticle.Identity.getUser('0')).to.not.exist;
        expect(mParticle.Identity.getUser('user4')).to.not.exist;
    });

    it('should update its own cookies, not any other mpids when initializing with a different set of credentials', async () => {
        mParticle._resetForTests(MPConfig);

        const user1 = {
            userIdentities: {
                customerid: 'customerid1',
                email: 'email1@test.com',
            },
        };

        const user2 = {
            userIdentities: {
                customerid: 'customerid2',
                email: 'email2@test.com',
            },
        };

        const user3 = {
            userIdentities: {
                customerid: 'customerid3',
                email: 'email3@test.com',
            },
        };

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        // get user 1 into cookies
        fetchMockSuccess(urls.login, {
            mpid: 'user1',
            is_logged_in: false,
        });

        mParticle.Identity.login(user1);

        await waitForCondition(hasIdentityCallInflightReturned)

        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user1');

        // get user 2 into cookies
        fetchMockSuccess(urls.login, {
            mpid: 'user2',
            is_logged_in: false,
        });

        mParticle.Identity.login(user2);

        await waitForCondition(hasIdentityCallInflightReturned)

        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user2');

        // get user 3 into cookies
        fetchMockSuccess(urls.login, {
            mpid: 'user3',
            is_logged_in: false,
        });

        mParticle.Identity.login(user3);

        await waitForCondition(hasIdentityCallInflightReturned)

        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user3');

        // init again using user 1
        fetchMockSuccess(urls.login, {
            mpid: 'user1',
            is_logged_in: false,
        });

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        const localStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();


        expect(localStorage.user1, 'Local Storage User 1').to.be.ok;
        expect(localStorage.user2, 'Local Storage User 2').to.be.ok;
        expect(localStorage.user3, 'Local Storage User 3').to.be.ok;

        localStorage.user1.ua.user.should.equal('user1');
        localStorage.user1.ui.should.have.property('1', 'customerid1');
        localStorage.user1.ui.should.have.property('7', 'email1@test.com');
        
        localStorage.user2.ua.user.should.equal('user2');
        localStorage.user2.ui.should.have.property('1', 'customerid2');
        localStorage.user2.ui.should.have.property('7', 'email2@test.com');

        localStorage.user3.ua.user.should.equal('user3');
        localStorage.user3.ui.should.have.property('1', 'customerid3');
        localStorage.user3.ui.should.have.property('7', 'email3@test.com');
    });

    it('should create a new modified user identity object, removing any invalid identity types', async (done) => {
        const previousUIByName = {
            customerid: 'customerid1',
            email: 'email2@test.com',
            twitter: 'test3',
            device_application_stamp: 'das-test',
        };
        const newUIByName = {
            google: 'google4',
            twitter: 'twitter5',
            invalidKey: 'test',
        };

        const combinedUIsByType = mParticle
            .getInstance()
            ._Identity.IdentityRequest.combineUserIdentities(
                previousUIByName,
                newUIByName
            );

        // if an invalid identity type is added to the identity call,
        // it will be removed from the combinedUIsByType,
        // in this case, 'invalidKey' which is in `newUIByName`
        expect(combinedUIsByType).to.have.all.keys([1, 3, 4, 7]);
        expect(combinedUIsByType[1]).to.equal('customerid1');
        expect(combinedUIsByType[3]).to.equal('twitter5');
        expect(combinedUIsByType[4]).to.equal('google4');
        expect(combinedUIsByType[7]).to.equal('email2@test.com');

        expect(Object.keys(combinedUIsByType).length).to.equal(4);

        done();
    });

    it('should add new MPIDs to cookie structure when initializing new identity requests, returning an existing mpid when reinitializing with a previous identity', async () => {
        mParticle._resetForTests(MPConfig);

        const user1 = {
            userIdentities: {
                customerid: '1',
            },
        };

        const user2 = {
            userIdentities: {
                customerid: '2',
            },
        };

        const user3 = {
            userIdentities: {
                customerid: '3',
            },
        };

        const user4 = {
            userIdentities: {
                customerid: '4',
            },
        };

        mParticle.config.identifyRequest = user1;

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        const user1UIs = mParticle.Identity.getCurrentUser().getUserIdentities();

        user1UIs.userIdentities.customerid.should.equal('1');

        fetchMockSuccess(urls.login, {
            mpid: 'mpid2',
            is_logged_in: true,
        });

        mParticle.Identity.login(user2);

        await waitForCondition(hasIdentityCallInflightReturned)

        const user2UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user2UIs.userIdentities.customerid.should.equal('2');

        fetchMockSuccess(urls.login, {
            mpid: 'mpid3',
            is_logged_in: true,
        });

        mParticle.Identity.login(user3);

        await waitForCondition(hasIdentityCallInflightReturned)

        const user3UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user3UIs.userIdentities.customerid.should.equal('3');

        fetchMockSuccess(urls.login, {
            mpid: 'mpid4',
            is_logged_in: true,
        });

        mParticle.Identity.login(user4);

        await waitForCondition(hasIdentityCallInflightReturned)

        const user4UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user4UIs.userIdentities.customerid.should.equal('4');

        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: true,
        });

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        const user5 = mParticle.Identity.getCurrentUser();
        user5.getUserIdentities().userIdentities.customerid.should.equal('1');
        user5.getMPID().should.equal('testMPID');

        const data = mParticle.getInstance()._Persistence.getLocalStorage();

        data.cu.should.equal('testMPID');
        data.testMPID.ui[1].should.equal('1');
        data.mpid2.ui[1].should.equal('2');
        data.mpid3.ui[1].should.equal('3');
        data.mpid4.ui[1].should.equal('4');
    });

    it('should not send requests to the server with invalid userIdentity values', async () => {
        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        fetchMock.resetHistory();

        let result: IdentityResult;

        const badUserIdentitiesArray = {
            userIdentities: {
                customerid: [],
            },
        };

        const badUserIdentitiesObject = {
            userIdentities: {
                customerid: {},
            },
        };

        const badUserIdentitiesBoolean = {
            userIdentities: {
                customerid: false,
            },
        };

        const badUserIdentitiesUndefined = {
            userIdentities: {
                customerid: undefined,
            },
        };

        const validUserIdentitiesString = {
            userIdentities: {
                customerid: '123',
            },
        };

        const validUserIdentitiesNull = {
            userIdentities: {
                customerid: null,
            },
        };

        const callback = function(resp) {
            result = resp;
        };

        const invalidUserIdentitiesArray = [
            badUserIdentitiesArray,
            badUserIdentitiesObject,
            badUserIdentitiesBoolean,
            badUserIdentitiesUndefined,
        ];
        const validUserIdentities = [
            validUserIdentitiesString,
            validUserIdentitiesNull,
        ];
        const identityMethods = ['login', 'logout', 'identify', 'modify'];

        fetchMockSuccess(urls.login, {
            mpid: testMPID,
            is_logged_in: true,
        });

        fetchMockSuccess(urls.logout, {
            mpid: testMPID,
            is_logged_in: false,
        });

        fetchMockSuccess(urls.modify, {
            change_results: [
                {
                    identity_type: 'valid-identity-type',
                    modified_mpid: testMPID,
                },
            ],
        });

        identityMethods.forEach(async (identityMethod) => {
            invalidUserIdentitiesArray.forEach(async (badIdentities) => {
                mParticle.Identity[identityMethod](badIdentities, callback);
                expect(result, `${identityMethod} - ${badIdentities}`).to.be.ok;
                result.httpCode.should.equal(-4);
                result.body.should.equal(
                    Constants.Messages.ValidationMessages
                        .UserIdentitiesInvalidValues
                );

                // Reset result for next iteration of the loop
                result = null;
            });

            // modify request have a unique signature but the same validation
            // for invalid values
            if (identityMethod !== 'modify') {
                // for some reason this is returning -4 for a good identity.
                validUserIdentities.forEach(async(goodIdentities) => {
                    mParticle.Identity[identityMethod](
                        goodIdentities,
                        callback
                    );

                    await waitForCondition(hasIdentityCallInflightReturned)
                    expect(result, identityMethod).to.be.ok;
                    expect(
                        result.httpCode,
                        `valid ${identityMethod} httpCode`
                    ).to.equal(200);

                    const body = result.body as IdentityResultBody;
                    expect(body.mpid, `valid ${identityMethod} mpid `).to.be.ok;
                    expect(body.mpid, `valid ${identityMethod} mpid`).to.equal(
                        testMPID
                    );

                    // Reset result for next iteration of the loop
                    result = null;
                });
            } else {
                validUserIdentities.forEach(async(goodIdentities) => {
                    mParticle.Identity.modify(goodIdentities, callback);

                    await waitForCondition(hasIdentityCallInflightReturned)

                    expect(result, identityMethod).to.be.ok;

                    expect(result.httpCode, `valid modify httpCode`).to.equal(
                        200
                    );
                    const body = result.body as IdentityModifyResultBody;

                    expect(
                        body.change_results[0].modified_mpid,
                        `valid modify change_results modified_mpid`
                    ).to.equal(testMPID);
                    expect(
                        body.change_results[0].identity_type,
                        `valid modify change_results identity_type`
                    ).to.be.ok;

                    // Reset result for next iteration of the loop
                    result = null;
                });
            }
        });
    });

    it('should have no user identities when logging out or in with no object', async () => {
        mParticle.init(apiKey, window.mParticle.config);

        const user = {
            userIdentities: {
                customerid: '123',
            },
        };

        fetchMockSuccess(urls.login, {
            mpid: 'logged-in-user',
            is_logged_in: true,
        });

        // We are changing the mpid so we can catch the logout event
        // asyncronously
        fetchMockSuccess(urls.logout, {
            mpid: 'logged-out-user',
            is_logged_in: false,
        });

        await waitForCondition(hasIdentifyReturned)

        mParticle.Identity.login(user);

        await waitForCondition(hasLoginReturned)

        const userIdentities1 = mParticle.Identity.getCurrentUser().getUserIdentities();

        expect(userIdentities1.userIdentities).to.deep.equal({ customerid: '123' });

        mParticle.Identity.logout();

        await waitForCondition(hasLogOutReturned)

        const userIdentities2 = mParticle.Identity.getCurrentUser().getUserIdentities();

        expect(userIdentities2.userIdentities).to.deep.equal({});
    });

    it('should update cookies after modifying identities', async () => {
        mParticle.init(apiKey, window.mParticle.config);
        const user = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        const modifiedUser = {
            userIdentities: {
                customerid: 'customerId2',
            },
        };

        fetchMockSuccess(urls.login, {
            mpid: 'logged-in-user',
            is_logged_in: true,
        });

        fetchMockSuccess(
            'https://identity.mparticle.com/v1/logged-in-user/modify',
            {
                change_results: [
                    {
                        identity_type: 'customerid',
                        modified_mpid: 'modified-mpid',
                    },
                ],
            }
        );

        await waitForCondition(hasIdentifyReturned)
        mParticle.Identity.login(user);

        await waitForCondition(hasLoginReturned)
        mParticle.Identity.modify(modifiedUser);

        await waitForCondition(() => {
            return mParticle.Identity.getCurrentUser()?.getUserIdentities().userIdentities['customerid'] === 'customerId2';
        })
        const cookie = mParticle.getInstance()._Persistence.getLocalStorage();

        cookie['logged-in-user'].ui[1].should.equal('customerId2');
    });

    describe.skip('#onUserAlias', function() {
    // https://go.mparticle.com/work/SQDSDKS-6854
    it('does not run onUserAlias if it is not a function', async (done) => {
        mParticle.init(apiKey, window.mParticle.config);

        waitForCondition(hasIdentifyReturned)
        .then(() => {

        const user1 = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        const user2 = {
            userIdentities: {
                customerid: 'customerId2',
            },
            onUserAlias: null,
        };

        const product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1);

        mParticle.eCommerce.Cart.add([product1, product2]);

        fetchMockSuccess(urls.login, {
            mpid: testMPID,
            is_logged_in: true,
        });
    
        mParticle.Identity.login(user1);

        waitForCondition(hasIdentifyReturned)
        .then(() => {

        fetchMockSuccess(urls.login, {
            mpid: 'otherMPID',
            is_logged_in: true,
        });

        fetchMock.resetHistory();
        mParticle.Identity.login(user2);

        waitForCondition(hasIdentityCallInflightReturned)
        .then(() => {

        // This should have a call for the UIC that will occur because
        // we are logging in as two different users
        fetchMock.calls().length.should.equal(1);
        expect(fetchMock.lastCall()[0]).to.equal(urls.events);


        done();
        }).catch(done);
        }).catch(done);
        }).catch(done);
    });

    it('should run onUserAlias if it is a function', async (done) => {
        mParticle.init(apiKey, window.mParticle.config);

        waitForCondition(hasIdentifyReturned)
        .then(() => {

        let hasBeenRun = false;
        const user1 = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        const user2 = {
            userIdentities: {
                customerid: 'customerId2',
            },
            onUserAlias: function() {
                hasBeenRun = true;
            },
        };

        fetchMockSuccess(urls.login, {
            mpid: testMPID,
            is_logged_in: true,
        });

        mParticle.Identity.login(user1);

        waitForCondition(hasIdentityCallInflightReturned)
        .then(() => {

        fetchMockSuccess(urls.login, {
            mpid: 'otherMPID',
            is_logged_in: true,
        });

        mParticle.Identity.login(user2);

        waitForCondition(hasIdentityCallInflightReturned)
        .then(() => {

        expect(hasBeenRun).to.be.true;

        done();
        }).catch(done);
        }).catch(done);
        }).catch(done);
    });

    it('should setUserAttributes, setUserAttributeLists, removeUserAttributes, and removeUserAttributeLists properly in onUserAlias', async (done) => {
        mParticle.init(apiKey, window.mParticle.config);

        waitForCondition(hasIdentifyReturned)
        .then(() => {

        const user1 = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        fetchMockSuccess(urls.login, {
            mpid: testMPID,
            is_logged_in: true,
        });

        mParticle.Identity.login(user1);

        waitForCondition(hasIdentityCallInflightReturned)
        .then(() => {
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttribute('age', 27);

        const user1Attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();
        user1Attrs.should.have.property('gender', 'male');
        user1Attrs.should.have.property('age', 27);


        fetchMockSuccess(urls.login, {
            mpid: 'otherMPID',
            is_logged_in: true,
        });

        let user1Object, user2Object;

        const user2 = {
            userIdentities: {
                customerid: 'customerId2',
            },
            onUserAlias: function(user1, user2) {
                const user1Attributes = user1.getAllUserAttributes();
                for (const key in user1Attributes) {
                    if (key !== 'gender') {
                        user2.setUserAttribute(key, user1Attributes[key]);
                    }
                }
                user2.setUserAttributeList('list', [1, 2, 3, 4, 5]);
                user1.removeUserAttribute('age');

                user1Object = user1;
                user2Object = user2;
            },
        };

        mParticle.Identity.login(user2);

        waitForCondition(() => mParticle.Identity.getCurrentUser().getMPID() === 'otherMPID')
        .then(() => {

        const user1ObjectAttrs = user1Object.getAllUserAttributes();
        user1ObjectAttrs.should.not.have.property('age');
        user1ObjectAttrs.should.have.property('gender', 'male');

        const user2Attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();
        user2Attrs.should.not.have.property('gender');
        user2Attrs.should.have.property('age', 27);
        const user2ObjectAttrs = user2Object.getAllUserAttributes();
        user2ObjectAttrs.should.not.have.property('gender');
        user2ObjectAttrs.should.have.property('age', 27);

        fetchMockSuccess(urls.login, {
            mpid: 'otherMPID2',
            is_logged_in: true,
        });

        let user2AttributeListsBeforeRemoving,
            user3UserAttributeListsBeforeAdding,
            user2AttributeListsAfterRemoving,
            user3UserAttributeListsAfterAdding;

        const user3 = {
            userIdentities: {
                customerid: 'customerId3',
            },
            onUserAlias: function(user2, user3) {
                user2AttributeListsBeforeRemoving = user2.getUserAttributesLists();
                user3UserAttributeListsBeforeAdding = user3.getUserAttributesLists();
                user2.removeAllUserAttributes();
                user3.setUserAttributeList('list', [1, 2, 3, 4, 5]);
                user2AttributeListsAfterRemoving = user2.getUserAttributesLists();
                user3UserAttributeListsAfterAdding = user3.getUserAttributesLists();
            },
        };

        mParticle.Identity.login(user3);

        waitForCondition(() => mParticle.Identity.getCurrentUser().getMPID() === 'otherMPID2')
        .then(() => {


        expect(user2AttributeListsBeforeRemoving.list.length).to.equal(5);
        expect(Object.keys(user3UserAttributeListsBeforeAdding).length).to.not
            .be.ok;

        expect(Object.keys(user2AttributeListsAfterRemoving).length).to.not.be
            .ok;
        expect(user3UserAttributeListsAfterAdding.list.length).to.equal(5);

        done();
        }).catch(done);
        }).catch(done);
        }).catch(done);
        }).catch(done);
    });
    });

    it('should return an empty array when no cart products exist', async () => {
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned)
        const user1 = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        fetchMockSuccess(urls.login, {
            mpid: testMPID,
            is_logged_in: true,
        });

        mParticle.Identity.login(user1);

        await waitForCondition(hasIdentityCallInflightReturned)

        const products = mParticle.Identity.getCurrentUser()
            .getCart()
            .getCartProducts();

        expect(products.length).to.not.be.ok;
    });

    it('should make a request when copyUserAttributes is included on the identity request', async () => {
        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned)

        const identityAPIRequest1 = {
            userIdentities: {
                customerid: '123',
            },
            copyUserAttributes: true,
        };


        fetchMockSuccess(urls.logout, {
            mpid: testMPID,
            is_logged_in: true,
        });

        fetchMock.resetHistory();

        mParticle.Identity.logout(identityAPIRequest1);

        await waitForCondition(hasIdentityCallInflightReturned)

        // This should have a call for the logout and UIC
        expect(fetchMock.calls().length).to.equal(2);

        const logoutCall = fetchMock.calls()[0];
        expect(logoutCall[0].split('/')[4]).to.equal('logout');

        const logoutData = JSON.parse(logoutCall[1].body as string);
        expect(logoutData).to.be.ok;

        fetchMockSuccess(urls.login, {
            mpid: testMPID,
            is_logged_in: false,
        });

        fetchMock.resetHistory();

        mParticle.Identity.login(identityAPIRequest1);

        await waitForCondition(hasIdentityCallInflightReturned)

        expect(fetchMock.calls().length).to.equal(1);

        const loginCall = fetchMock.calls()[0];
        expect(loginCall[0].split('/')[4]).to.equal('login');

        const loginData = JSON.parse(loginCall[1].body as string);
        expect(loginData).to.be.ok;

        fetchMockSuccess(urls.modify, {
            mpid: testMPID,
            is_logged_in: false,
        });

        fetchMock.resetHistory();

        mParticle.Identity.modify(identityAPIRequest1);

        await waitForCondition(hasIdentityCallInflightReturned)

        expect(fetchMock.calls().length).to.equal(1);

        const modifyCall = fetchMock.calls()[0];
        expect(modifyCall[0].split('/')[5]).to.equal('modify');
        const modifyData = JSON.parse(modifyCall[1].body as string);
        expect(modifyData).to.be.ok;
    });

    it('should trigger the identifyCallback when a successful identify call is sent', async () => {
        // MP.sessionID does not exist yet because we perform an mParticle._resetForTests(MPConfig);
        mParticle._resetForTests(MPConfig);

        let mpid;

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        // https://go.mparticle.com/work/SQDSDKS-6460
        mParticle.config.identityCallback = function({ body }) {
            mpid = (body as IdentityResultBody).mpid;
        };

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        expect(mpid).to.equal('MPID1');
    });

    it('should trigger the identityCallback before eventQueue is flushed', async () => {
        mParticle._resetForTests(MPConfig);

        await waitForCondition(hasBeforeEachCallbackReturned)

        fetchMock.resetHistory();

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        let callbackCalled = false;

        mParticle.config.identityCallback = function() {
            mParticle.Identity.getCurrentUser().setUserAttribute('foo', 'bar');
            callbackCalled = true;
        };

        fetchMock.resetHistory();

        mParticle.init(apiKey, window.mParticle.config);

        // Identify call from init should have been made
        // but the AST and Session Start should not fire until
        // after the identity call
        expect(fetchMock.calls().length).to.equal(1);
        const identifyCall = fetchMock.lastCall();
        expect(identifyCall[0].split('/')[4]).to.equal('identify');

        await waitForCondition(() => callbackCalled)

        // Force an upload so we can verify the correct events have fired
        mParticle.upload();

        // We should now have the follwoing requests:
        // 1. Identify Request
        // 2. Session Start
        // 3. AST Event
        // 4. UAC Event
        expect(fetchMock.calls().length).to.equal(4);

        const sessionStartEventBatch = findBatch(
            fetchMock.calls(),
            'session_start'
        );
        const ASTEventBatch = findBatch(
            fetchMock.calls(),
            'application_state_transition'
        );

        sessionStartEventBatch.user_attributes.should.have.property(
            'foo',
            'bar'
        );
        ASTEventBatch.user_attributes.should.have.property('foo', 'bar');
    });

    it('should still trigger the identifyCallback when no identify request is sent because there are already cookies', async () => {
        mParticle._resetForTests(MPConfig);
        const les = new Date().getTime();
        const cookies =
            "{'gs':{'ie':1|'dt':'test_key'|'cgid':'886e874b-862b-4822-a24a-1146cd057101'|'das':'62c91b8d-fef6-44ea-b2cc-b55714b0d827'|'csm':'WyJ0ZXN0TVBJRCJd'|'sid':'2535f9ed-ab19-4a7c-9eeb-ce4e41e0cb06'|'les': " +
            les +
            "|'ssd':1518536950916}|'testMPID':{'ui':'eyIxIjoiY3VzdG9tZXJpZDEifQ=='}|'cu':'testMPID'}";
        setCookie(workspaceCookieName, cookies, true);
        //does not actually hit the server because identity request is not sent
        let result;
        mParticle.config.identityCallback = function(resp) {
            resp.getUser().setUserAttribute('attr', 'value');
            result = resp;
        };

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned)
        // Should contain:
        // 1 for the Identify Request
        // 1 for the AST
        // 1 for the UAC
        
        expect(fetchMock.calls().length).to.equal(3);

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false ,
        });

        fetchMock.resetHistory();

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        // the server request is the AST, there is no request to Identity
        fetchMock.calls().length.should.equal(1);
        const eventCall = fetchMock.calls()[0];
        const eventData = JSON.parse(eventCall[1].body as string);
        expect(eventData.events.length).to.equal(1);
        expect(eventData.events[0].event_type).to.equal('application_state_transition');

        result.should.have.properties('body', 'httpCode', 'getUser');

        result.httpCode.should.equal(-3);
        result.body.should.have.properties(
            'context',
            'is_ephemeral',
            'matched_identities',
            'mpid'
        );
        expect(result.body.context).to.not.be.ok;
        expect(result.body.is_ephemeral).to.not.be.ok;
        result.body.matched_identities.should.have.property(
            'customerid',
            'customerid1'
        );
        result.body.mpid.should.equal('testMPID');
        result
            .getUser()
            .getMPID()
            .should.equal('testMPID');
        result
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');
    });

    it('identifyCallback response should have a getUser function on the result object', async () => {
        let result;
        mParticle._resetForTests(MPConfig);

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });    

        mParticle.config.identityCallback = function(resp) {
            result = resp;
            resp.getUser().setUserAttribute('test', 'value');
        };

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        result.should.have.property('getUser');

        mParticle.Identity.getCurrentUser()
            .getAllUserAttributes()
            .should.have.property('test', 'value');
    });

    describe('identityCallback responses', function () {
    it('should have a getUser function on identify result object', async () => {
        let result;

        mParticle._resetForTests(MPConfig);

        mParticle.config.identityCallback = function(resp) {
            resp.getUser().setUserAttribute('attr', 'value');
            result = resp;
        };

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        // Init fires an identify call
        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => {
            return mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1';
        })

        result.should.have.properties('body', 'httpCode', 'getUser');
        result.httpCode.should.equal(200);
        result.body.should.have.properties('mpid', 'is_logged_in');
        result.body.mpid.should.equal('MPID1');
        result
            .getUser()
            .getMPID()
            .should.equal('MPID1');
        result
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');
    });

    it('should have a getUser function on login result object', async () => {
        let result
        let loginResult;

        mParticle._resetForTests(MPConfig);

        mParticle.config.identityCallback = function(resp) {
            resp.getUser().setUserAttribute('attr', 'value');
            result = resp;
        };

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        fetchMockSuccess(urls.login, {
            mpid: 'MPID1',
            is_logged_in: true,
        });

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => {
            return mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1';
        })

        const identityRequest = { userIdentities: { customerid: 'test123' } };
        function loginCallback(result) {
            loginResult = result;
        }

        mParticle.Identity.login(identityRequest, loginCallback);

        await waitForCondition(hasIdentityCallInflightReturned)

        loginResult
            .getUser()
            .getMPID()
            .should.equal('MPID1');

        loginResult
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');
    });

    it('should have a getUser function on logout result object', async () => {
        let result;
        let logoutResult;

        mParticle._resetForTests(MPConfig);

        mParticle.config.identityCallback = function(resp) {
            resp.getUser().setUserAttribute('attr', 'value');
            result = resp;
        };

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        fetchMockSuccess(urls.logout, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => {
            return mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1';
        })

        const identityRequest = { userIdentities: { customerid: 'test123' } };
        function logoutCallback(result) {
            logoutResult = result;
        }

        mParticle.Identity.logout(identityRequest, logoutCallback);

        await waitForCondition(hasIdentityCallInflightReturned)

        logoutResult
            .getUser()
            .getMPID()
            .should.equal('MPID1');

        logoutResult
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');
    });

    it('should have a getUser function on modify result object', async () => {
        let result
        let modifyResult;

        mParticle._resetForTests(MPConfig);

        mParticle.config.identityCallback = function(resp) {
            resp.getUser().setUserAttribute('attr', 'value');
            result = resp;
        };

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        fetchMockSuccess(urls.modify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => {
            return mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1';
        })

        const identityRequest = { userIdentities: { customerid: 'test123' } };
        function modifyCallback(result) {
            modifyResult = result;
        }

        mParticle.Identity.modify(identityRequest, modifyCallback);

        await waitForCondition(hasIdentityCallInflightReturned)

        modifyResult
            .getUser()
            .getMPID()
            .should.equal('MPID1');

        modifyResult
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');
    });
    });

    it('should call identify when there is an active session but no current user', async () => {
        // this broken cookie state occurs when an initial identify request is made, fails, and the
        // client had no programmatic handling of a failed identify request
        mParticle._resetForTests(MPConfig);

        await waitForCondition(hasIdentityCallInflightReturned)

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        // invalid customerid of type number, so mParticle.init(apiKey, window.mParticle.config) will fail, but create cookies
        // without a current user
        mParticle.config.identifyRequest = {
            userIdentities: {
                customerid: (123 as unknown) as string,
            },
        };
        fetchMock.resetHistory();
        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        let cookies = mParticle.getInstance()._Persistence.getPersistence();
        cookies.should.have.property('gs');
        cookies.should.not.have.property('cu');
        (mParticle.Identity.getCurrentUser() === null).should.equal(true);

        // change to a valid customerid
        mParticle.config.identifyRequest = {
            userIdentities: {
                customerid: '123',
            },
        };
        fetchMock.resetHistory();

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1')
            
        cookies = mParticle.getInstance()._Persistence.getPersistence(); 
        cookies.should.have.property('gs');
        cookies.should.have.have.property('cu', 'MPID1');
        mParticle.Identity.getCurrentUser().should.not.equal(null);
    });

    it('Users should have firstSeenTime and lastSeenTime', async () => {
        mParticle._resetForTests(MPConfig);

        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        fetchMock.resetHistory();

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)
        
        // NOTE: Use sinon to "lock" in the current time for testing purposes
        const now = new Date();
        clock = sinon.useFakeTimers(now.getTime());

        const currentUser = mParticle.Identity.getCurrentUser();
        expect(currentUser).to.not.equal(null);

        expect(currentUser.getFirstSeenTime()).to.not.equal(null);
        expect(currentUser.getLastSeenTime()).to.not.equal(null);

        // The expecation is that firstSeenTime should be some time in the past
        // and lastSeenTime should be the closer to the current time

        expect(currentUser.getFirstSeenTime(), 'First Seen Time').to.lessThan(now.getTime());
        expect(currentUser.getLastSeenTime(), 'Last Seen Time').to.equal(now.getTime());

        clock.restore();
    });

    it('firstSeenTime should stay the same for a user', async () => {
        mParticle._resetForTests(MPConfig);

        // We can't use sinon.useFakeTimers() because it will affect the async
        // nature of the tests, so we will just save a timestamp to compare for
        // later
        const nowTestStart = new Date();

        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: false,
        });

        fetchMock.resetHistory();

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        let currentUser = mParticle.Identity.getCurrentUser();
        currentUser.should.not.equal(null);

        const user1FirstSeen = currentUser.getFirstSeenTime();
        const user1LastSeen = currentUser.getLastSeenTime();

        fetchMockSuccess(urls.login, {
            mpid: 'MPID1',
            is_logged_in: true,
        });

        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1',
            },
        };

        fetchMock.resetHistory();

        mParticle.Identity.login(userIdentities1);

        await waitForCondition(() => mParticle.Identity.getCurrentUser().getMPID() === 'MPID1')

        const nowAfterLogin = new Date();

        currentUser = mParticle.Identity.getCurrentUser();
        currentUser.getMPID().should.equal('MPID1');

        // new user's firstSeenTime should be greater than or equal to the preceeding user's lastSeenTime
        expect(currentUser.getFirstSeenTime()).to.greaterThanOrEqual(user1LastSeen);

        // We should expect the FirstSeenTime to be between the time the test started
        // the logged in request completed
        expect(currentUser.getFirstSeenTime()).to.greaterThan(nowTestStart.getTime());
        expect(currentUser.getFirstSeenTime()).to.lessThan(nowAfterLogin.getTime());

        const user1 = mParticle.Identity.getUser(testMPID);
        user1.getFirstSeenTime().should.equal(user1FirstSeen);

        // Log in as the same user again to verify expected behavior
        fetchMockSuccess(urls.login, {
            mpid: testMPID,
            is_logged_in: true,
        });

        fetchMock.resetHistory();

        mParticle.Identity.login();

        await waitForCondition(() => mParticle.Identity.getCurrentUser().getMPID() === testMPID)

        currentUser = mParticle.Identity.getCurrentUser();
        expect(currentUser.getMPID()).to.equal(testMPID);
        expect(currentUser.getFirstSeenTime()).to.equal(user1FirstSeen);
        expect(currentUser.getLastSeenTime()).to.greaterThan(user1LastSeen);
    });

    it('list returned by Identity.getUsers() should be sorted by lastSeenTime, with nulls last', async () => {
        mParticle._resetForTests(MPConfig);

        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                lst: 200,
            },
            2: {
                lst: 400,
            },
            3: {
                lst: 300,
            },
            4: {},
            5: {
                lst: 700,
            },
            cu: '1',
        });

        setCookie(workspaceCookieName, cookies);

        mParticle.init(apiKey, window.mParticle.config);

        const users = mParticle.Identity.getUsers();

        expect(users.length).to.equal(5);

        expect(users[0].getMPID()).to.equal('1');
        expect(users[1].getMPID()).to.equal('5');
        expect(users[2].getMPID()).to.equal('2');
        expect(users[3].getMPID()).to.equal('3');
        expect(users[4].getMPID()).to.equal('4');
        expect(users[4].getLastSeenTime()).to.equal(null);
    });

    it('does not error when simultaneous identity calls are out', async (done) => {
        const errorMessages = [];
        mParticle._resetForTests(MPConfig);
        mParticle.config.logger = {
            error: function(msg) {
                errorMessages.push(msg);
            },
        };
        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getInstance()._Store.identityCallInFlight = true;

        mParticle.setLogLevel('warning');

        // Fire a second identity method (without waitForCondition) to confirm that it does not error
        mParticle.Identity.login({ userIdentities: { customerid: 'test' } });
        errorMessages.length.should.equal(0);

        done();
    });

    it('Startup identity callback should include getPreviousUser()', async () => {
        mParticle._resetForTests(MPConfig);

        const cookies = JSON.stringify({
            gs: {
                sid: 'test',
                les: new Date().getTime(),
            },
            testMPID: {
                lst: 100,
            },
            testMPID2: {
                lst: 200,
            },
            cu: 'testMPID',
        });
        setCookie(workspaceCookieName, cookies);

        let identityResult;

        function identityCallback(result) {
            identityResult = result;
        }

        mParticle.config.identityCallback = identityCallback;

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        expect(identityResult.getUser().getMPID()).to.equal('testMPID');
        expect(identityResult.getPreviousUser()).to.not.equal(null);
        expect(identityResult.getPreviousUser().getMPID()).to.equal(
            'testMPID2'
        );
    });

    it('Identity callback should include getPreviousUser()', async () => {
        mParticle._resetForTests(MPConfig);

        const cookies = JSON.stringify({
            testMPID: {
                lst: 200,
            },
            testMPID2: {
                lst: 100,
            },
            cu: 'testMPID',
        });

        setCookie(workspaceCookieName, cookies);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned)

        fetchMockSuccess(urls.login, {
            mpid: testMPID,
            is_logged_in: true,
        });

        let loginResult;

        function identityCallback(result) {
            loginResult = result;
        }
        mParticle.Identity.login(EmptyUserIdentities, identityCallback);

        expect(mParticle.Identity.getCurrentUser().getMPID()).to.equal(
            'testMPID'
        );
        expect(loginResult.getUser().getMPID()).to.equal('testMPID');
        expect(loginResult.getPreviousUser()).to.not.be.null;
        expect(loginResult.getPreviousUser().getMPID()).to.equal('testMPID2');
    });

    it('should return the correct user for Previous User', async () => {
        mParticle._resetForTests(MPConfig);
        let callbackCalled = false;

        await waitForCondition(hasBeforeEachCallbackReturned)

        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                lst: 200,
            },
            2: {
                lst: 400,
            },
            3: {
                lst: 300,
            },
            4: {
                lst: 600,
            },
            5: {
                lst: 100,
            },
            cu: '1',
        });

        setCookie(workspaceCookieName, cookies);

        mParticle.init(apiKey, window.mParticle.config);

        fetchMockSuccess(urls.identify, {
            mpid: '1',
            is_logged_in: false,
        });

        let identityResult;

        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === '1')

        mParticle.Identity.identify(EmptyUserIdentities, function(result) {
            identityResult = result;
            callbackCalled = true;
        });

        await waitForCondition(() => callbackCalled)
        identityResult
            .getUser()
            .getMPID()
            .should.equal('1');
        identityResult
            .getPreviousUser()
            .getMPID()
            .should.equal('4');
    });

    it('Alias request should be received when API is called validly', async (done) => {
        fetchMock.post(urls.alias, HTTP_ACCEPTED);
        fetchMock.resetHistory();

        const aliasRequest: IAliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        };

        mParticle.Identity.aliasUsers(aliasRequest);
        expect(fetchMock.calls().length).to.equal(1);

        const lastCall = fetchMock.lastCall();
        const url = lastCall[0];
        url.should.equal(urls.alias);

        const requestBody = JSON.parse(lastCall[1].body as string);
        expect(requestBody['request_id']).to.not.equal(null);
        expect(requestBody['request_type']).to.equal('alias');
        expect(requestBody['environment']).to.equal('production');
        expect(requestBody['api_key']).to.equal(
            mParticle.getInstance()._Store.devToken
        );
        const dataBody = requestBody['data'];
        expect(dataBody).to.not.equal(null);
        expect(dataBody['destination_mpid']).to.equal('destinationMpid');
        expect(dataBody['source_mpid']).to.equal('sourceMpid');
        expect(dataBody['start_unixtime_ms']).to.equal(3);
        expect(dataBody['end_unixtime_ms']).to.equal(4);

        done();
    });

    it('Alias request should include scope if specified', async (done) => {
        fetchMock.post(urls.alias, HTTP_ACCEPTED);
        fetchMock.resetHistory();

        const aliasRequest: IAliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
            scope: 'mpid',
        };

        mParticle.Identity.aliasUsers(aliasRequest);
        expect(fetchMock.calls().length).to.equal(1);

        const lastCall = fetchMock.lastCall();
        const url = lastCall[0];
        url.should.equal(urls.alias);

        const requestBody = JSON.parse(lastCall[1].body as string);
        const dataBody = requestBody['data'];
        expect(dataBody['scope']).to.equal('mpid');

        done();
    });

    it('should reject malformed Alias Requests', async () => {
        mParticle.config.logLevel = 'verbose';
        let warnMessage = null;

        mParticle.config.logger = {
            warning: function(msg) {
                warnMessage = msg;
            },
        };
        mParticle.init(apiKey, window.mParticle.config);
        let callbackResult;

        // intentionally missing sourceMpid
        let aliasRequest: IAliasRequest = ({
            destinationMpid: 'destinationMpid',
            startTime: 3,
            endTime: 4,
        } as unknown) as IAliasRequest;

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        expect(callbackResult.message).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        expect(warnMessage).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        callbackResult = null;
        warnMessage = null;

        // intentionally missing destinationMpid
        aliasRequest = ({
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        } as unknown) as IAliasRequest;

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        expect(callbackResult.message).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        expect(warnMessage).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        callbackResult = null;
        warnMessage = null;

        // same destinationMpid & sourceMpid
        aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'destinationMpid',
            startTime: 3,
            endTime: 4,
        };
        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });

        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        expect(callbackResult.message).to.equal(
            Constants.Messages.ValidationMessages.AliasNonUniqueMpid
        );
        expect(warnMessage).to.equal(
            Constants.Messages.ValidationMessages.AliasNonUniqueMpid
        );
        callbackResult = null;
        warnMessage = null;

        // endTime before startTime
        aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 4,
            endTime: 3,
        };
        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        expect(callbackResult.message).to.equal(
            Constants.Messages.ValidationMessages.AliasStartBeforeEndTime
        );
        expect(warnMessage).to.equal(
            Constants.Messages.ValidationMessages.AliasStartBeforeEndTime
        );
        callbackResult = null;
        warnMessage = null;

        // intentionally missing endTime and startTime
        aliasRequest = ({
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
        } as unknown) as IAliasRequest;

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        expect(callbackResult.message).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingTime
        );
        expect(warnMessage).to.equal(
            Constants.Messages.ValidationMessages.AliasMissingTime
        );
        callbackResult = null;
        warnMessage = null;

        // sanity test, make sure properly formatted requests are accepted
        aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        };

        fetchMock.post(urls.alias, {
            status: HTTP_ACCEPTED,
            body: JSON.stringify({}),
        });

        fetchMock.resetHistory();

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
            callbackResult.httpCode.should.equal(HTTP_ACCEPTED);
            expect(callbackResult.message).to.equal(undefined);
            expect(warnMessage).to.equal(null);
            callbackResult = null;
        });
    });

    it('should parse error info from Alias Requests', async () => {
        mParticle.init(apiKey, window.mParticle.config);
        const errorMessage = 'this is a sample error message';
        let callbackResult;
        fetchMock.post(
            urls.alias, 
            {
                status: 400,
                body: JSON.stringify({
                    message: errorMessage,
                    code: 'ignored code',
                }),
            }
        );

        const aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        };

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
            callbackResult.httpCode.should.equal(400);
            callbackResult.message.should.equal(errorMessage);
        });
    });

    it('should properly create AliasRequest', async () => {
        mParticle._resetForTests(MPConfig);

        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
                lst: 400,
            },
            cu: '2',
        });

        setCookie(workspaceCookieName, cookies);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        // Mock clock so we can use simple integers for time
        clock = sinon.useFakeTimers();
        clock.tick(1000);

        const destinationUser = mParticle.Identity.getCurrentUser();
        const sourceUser = mParticle.Identity.getUser('1');

        const aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        expect(aliasRequest.sourceMpid).to.equal('1');
        expect(aliasRequest.destinationMpid).to.equal('2');
        expect(aliasRequest.startTime).to.equal(200);
        expect(aliasRequest.endTime).to.equal(400);
        clock.restore();
    });

    it('should fill in missing fst and lst in createAliasRequest', async () => {
        mParticle._resetForTests(MPConfig);

        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
                lst: 400,
            },
            2: {},
            cu: '3',
        });

        setCookie(workspaceCookieName, cookies);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentityCallInflightReturned)

        // Mock clock so we can use simple integers for time
        clock = sinon.useFakeTimers();
        clock.tick(1000);

        const destinationUser = mParticle.Identity.getCurrentUser();
        const sourceUser = mParticle.Identity.getUser('2');

        const aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        expect(aliasRequest.sourceMpid).to.equal('2');
        expect(aliasRequest.destinationMpid).to.equal('3');
        //should grab the earliest fst out of any user if user does not have fst
        expect(aliasRequest.startTime).to.equal(200);
        //should grab currentTime if user does not have lst
        expect(aliasRequest.endTime).to.equal(1000);

        clock.restore();
    });

    it('should fix startTime when default is outside max window create AliasRequest', async () => {
        mParticle._resetForTests(MPConfig);

        const millisPerDay = 24 * 60 * 60 * 1000;
        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
            },
            cu: '2',
        });

        setCookie(workspaceCookieName, cookies);

        //set max Alias startTime age to 1 day
        mParticle.config.aliasMaxWindow = 1;

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        clock = sinon.useFakeTimers();
        clock.tick(millisPerDay * 2);

        const destinationUser = mParticle.Identity.getCurrentUser();
        const sourceUser = mParticle.Identity.getUser('1');

        const aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        expect(aliasRequest.sourceMpid).to.equal('1');
        expect(aliasRequest.destinationMpid).to.equal('2');
        const oldestAllowedStartTime =
            new Date().getTime() -
            mParticle.getInstance()._Store.SDKConfig.aliasMaxWindow *
                millisPerDay;
        expect(aliasRequest.startTime).to.equal(oldestAllowedStartTime);
        expect(aliasRequest.endTime).to.equal(new Date().getTime());

        clock.restore();
    });

    it('should warn if legal aliasRequest cannot be created with MParticleUser', async () => {
        const millisPerDay = 24 * 60 * 60 * 1000;

        mParticle.config.logLevel = 'verbose';
        let warnMessage = null;

        mParticle.config.logger = {
            warning: function(msg) {
                warnMessage = msg;
            },
        };

        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
                lst: 300,
            },
            cu: '2',
        });
        setCookie(workspaceCookieName, cookies);

        //set max Alias startTime age to 1 day
        mParticle.config.aliasMaxWindow = 1;

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        // Mock clock so we can use simple integers for time
        clock = sinon.useFakeTimers();
        clock.tick(millisPerDay * 2);

        const destinationUser = mParticle.Identity.getCurrentUser();
        const sourceUser = mParticle.Identity.getUser('1');

        const aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        expect(aliasRequest.sourceMpid).to.equal('1');
        expect(aliasRequest.destinationMpid).to.equal('2');
        const oldestAllowedStartTime =
            new Date().getTime() -
            mParticle.getInstance()._Store.SDKConfig.aliasMaxWindow *
                millisPerDay;
        expect(aliasRequest.startTime).to.equal(oldestAllowedStartTime);
        expect(aliasRequest.endTime).to.equal(300);
        expect(warnMessage).to.equal(
            'Source User has not been seen in the last ' +
                mParticle.getInstance()._Store.SDKConfig.maxAliasWindow +
                ' days, Alias Request will likely fail'
        );

        clock.restore();
    });

    it("alias request should have environment 'development' when isDevelopmentMode is true", async () => {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.isDevelopmentMode = true;

        fetchMock.post(urls.alias, HTTP_ACCEPTED);

        mParticle.init(apiKey, window.mParticle.config);
        
        const aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        };

        // reset history to remove all calls from fetchMock.calls so that after alias-ing users, it will have a single call
        fetchMock.resetHistory();
        mParticle.Identity.aliasUsers(aliasRequest)

        expect(fetchMock.calls().length).to.equal(1);

        const requestBody = JSON.parse(fetchMock.lastCall()[1].body as string);
        expect(requestBody.environment).to.equal('development');
    });

    it('should set isFirtRun to false after an app is initialized', async () => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        mParticle.getInstance()._Store.isFirstRun.should.equal(false);

        fetchMockSuccess(urls.login, {
            mpid: 'otherMPID1',
            is_logged_in: true,
        });

        mParticle.Identity.login({ userIdentities: { customerid: 'abc' } });

        await waitForCondition(hasIdentityCallInflightReturned)

        const ls = mParticle.getInstance()._Persistence.getLocalStorage();
        ls['testMPID'].lst.should.not.equal(null);
    });

    it('should send back an httpCode of -1 when there is a no coverage (http code returns 0)', async () => {
        mParticle._resetForTests(MPConfig);

        let result;

        function identityCallback(response) {
            result = response;
        }

        fetchMock.post(urls.identify, {
            status: '0', 
            body: JSON.stringify({ body: null }),
        }, {
            overwriteRoutes: true
        });

        mParticle.config.identityCallback = identityCallback;

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)

        result.httpCode.should.equal(-1);

    });

    describe('custom device', function () {
        beforeEach(function () {
            fetchMock.restore();
        });

    it('should use the custom device id in known_identities when passed via setDeviceId', async () => {
        mParticle._resetForTests(MPConfig);

        fetchMockSuccess(urls.identify, {
            body: null
        });

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned)
        expect(fetchMock.calls().length).to.equal(1);
        const firstCall = fetchMock.calls()[0];
        expect(firstCall[0].split('/')[4]).to.equal('identify');
        const data = JSON.parse(firstCall[1].body as unknown as string) as IIdentityAPIRequestData;
        
        // Should be a 36 character guid
        expect(data.known_identities).to.have.keys('device_application_stamp');
        expect(data.known_identities.device_application_stamp.length).to.equal(36);

        mParticle.setDeviceId('foo-guid');

        fetchMockSuccess(urls.login, {
            mpid: 'logged-in-user',
        });

        mParticle.Identity.login({ userIdentities: { customerid: 'test' } });

        await waitForCondition(hasLoginReturned)

        // Should include two more calls: Login and UIC
        expect(fetchMock.calls().length).to.equal(2);
        const nextCall = fetchMock.calls()[1];
        expect(nextCall[0].split('/')[4]).to.equal('login');

        const data2 = JSON.parse(nextCall[1].body as unknown as string) as IIdentityAPIRequestData;
        expect(data2.known_identities.device_application_stamp).to.equal('foo-guid');
    });

    it('should use the custom device id in known_identities when set via mParticle.config', async (done) => {
        mParticle._resetForTests(MPConfig);

        // Resets fetchMock so we can isolate calls for this tests
        fetchMock.restore();

        fetchMockSuccess(urls.identify, { body: null });

        window.mParticle.config.deviceId = 'foo-guid';
        mParticle.init(apiKey, window.mParticle.config);

        expect(fetchMock.calls().length).to.equal(1);

        const lastCall = fetchMock.lastCall();
        const data = JSON.parse(
            lastCall[1].body as unknown as string
        ) as IIdentityAPIRequestData;

        expect(data.known_identities).to.have.keys('device_application_stamp');
        expect(data.known_identities.device_application_stamp).to.equal('foo-guid');

        done();
    });
    });

    describe('identity caching', function() {
        beforeEach(function () {
            fetchMock.restore();
        });

        it('should use header `x-mp-max-age` as expiration date for cache', async () => {
            // Set the Max Age to be 1 second in the future for testing
            const X_MP_MAX_AGE = '1';

            mParticle._resetForTests(MPConfig);
            fetchMock.resetHistory();

            await waitForCondition(hasIdentifyReturned)
            fetchMockSuccess(
                urls.identify,
                {
                    mpid: testMPID,
                    is_logged_in: false,
                },
                { 'x-mp-max-age': X_MP_MAX_AGE }
            );

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;

            localStorage.clear();
            mParticle.config.flags.cacheIdentity = 'True';

            mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(() => {
                return (
                    mParticle.Identity.getCurrentUser()?.getUserIdentities()
                        ?.userIdentities?.email === 'test@gmail.com'
                );
            })
            const now = new Date();
            const idCache: IdentityCache = JSON.parse(
                localStorage.getItem('mprtcl-v4_abcdef-id-cache')
            );

            // a single identify cache key will be on the idCache
            expect(Object.keys(idCache).length).to.equal(1);
            for (let key in idCache) {
                // X_MP_MAX_AGE is a header value, which is a string,
                // We want to make sure that the expireTimestamp is evaluated
                // as a number.
                const expectedExpiredTimestamp =
                    parseInt(X_MP_MAX_AGE) * 1000 + 1;

                // Because identity is async, we cannot use sinon.useFakeTimers
                // to tick the clock forward or be exact in our timing.
                // Instead, we can expect the expireTimestamp to be within 1 second
                // of the max age
                expect(
                    idCache[key].expireTimestamp
                ).to.greaterThan(expectedExpiredTimestamp);
                expect(
                    idCache[key].expireTimestamp - now.getTime()
                ).to.lessThan(1000);
            }
        });

        it('should not call identify if no identities have changed within the expiration time', async () => {
            const X_MP_MAX_AGE = '1';

            mParticle._resetForTests(MPConfig);

            fetchMockSuccess(urls.identify, {
                mpid: testMPID,
                is_logged_in: false,
            }, {
                'x-mp-max-age': X_MP_MAX_AGE,
            });

            fetchMock.resetHistory();

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';
            mParticle.init(apiKey, window.mParticle.config);


            await waitForCondition(hasIdentityCallInflightReturned)

            // Just make sure calls were actually made
            expect(fetchMock.calls().length).to.greaterThanOrEqual(1);
            const initialIdentityCall = fetchMock.calls()[0];
            expect(initialIdentityCall[0].split('/')[4]).to.equal('identify');

            fetchMock.resetHistory();

            const callback = sinon.spy();
            mParticle.Identity.identify(identities, callback);

            await waitForCondition(hasIdentifyReturned)
            expect(fetchMock.calls().length).to.equal(0);

            // callback still gets called even if the identity call is not made`
            expect(callback.called).to.equal(true);
        });

        it('should call identify if no identities have changed but we are outside the expiration time', async () => {
            const X_MP_MAX_AGE = '1';

            let callbackCalled = false;

            mParticle._resetForTests(MPConfig);

            fetchMockSuccess(urls.identify, {
                mpid: testMPID,
                is_logged_in: false,
            }, {
                'x-mp-max-age': X_MP_MAX_AGE,
            });

            fetchMock.resetHistory();

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';
            mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentityCallInflightReturned)

            const initialIdentityCall = fetchMock.calls()[0];
            expect(initialIdentityCall[0].split('/')[4]).to.equal('identify');

            fetchMock.resetHistory();

            const callback = () => {
                callbackCalled = true;
            };

            // cached time will be 1000 if header returns '1'
            const now = new Date();
            clock = sinon.useFakeTimers(now.getTime() + 1000);

            mParticle.Identity.identify(identities, callback);

            clock.restore();

            await waitForCondition(() => callbackCalled)
            expect(fetchMock.calls().length).to.equal(1);

            const duplicateIdentityCall = fetchMock.calls()[0];
            expect(duplicateIdentityCall[0].split('/')[4]).to.equal('identify');

            expect(callbackCalled).to.equal(true);
        });

        it('should not call login if previously cached within the expiration time', async () => {
            const X_MP_MAX_AGE = '1';

            let callbackCalled = false;

            mParticle._resetForTests(MPConfig);

            fetchMockSuccess(urls.identify, {
                mpid: testMPID,
                is_logged_in: true,
            }, {
                'x-mp-max-age': X_MP_MAX_AGE,
            });

            fetchMockSuccess(urls.login, {
                mpid: testMPID,
                is_logged_in: true,
            }, {
                'x-mp-max-age': X_MP_MAX_AGE,
            });

            fetchMock.resetHistory();

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';
            mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentityCallInflightReturned)

            fetchMock.resetHistory();

            const callback = () => {
                callbackCalled = true;
            };

            mParticle.Identity.login(identities, callback);

            await waitForCondition(() => mParticle.Identity?.getCurrentUser()?.getMPID() === testMPID)

            // Just make sure calls were actually made
            expect(fetchMock.calls().length).to.greaterThanOrEqual(1);
            const firstLoginCall = fetchMock.calls()[0];
            expect(firstLoginCall[0].split('/')[4]).to.equal('login');

            // Reset for next async call
            fetchMock.resetHistory();
            callbackCalled = false;

            mParticle.Identity.login(identities, callback);

            await waitForCondition(() => {
                return callbackCalled;
            })

            expect(fetchMock.calls().length).to.equal(0);

            // callback still gets called even if the identity call is not made`
            expect(callbackCalled).to.equal(true);
        });

        it('should call login if duplicate login happens after expiration time', async () => {
            const X_MP_MAX_AGE = '1';

            let callbackCalled = false;

            mParticle._resetForTests(MPConfig);

            fetchMockSuccess(urls.identify, {
                mpid: testMPID,
                is_logged_in: true,
            }, {
                'x-mp-max-age': X_MP_MAX_AGE,
            });

            fetchMockSuccess(urls.login, {
                mpid: testMPID,
                is_logged_in: true,
            }, {
                'x-mp-max-age': X_MP_MAX_AGE,
            });


            fetchMock.resetHistory();

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';
            mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentityCallInflightReturned)

            const initialIdentityCall = fetchMock.calls()[0];
            expect(initialIdentityCall[0].split('/')[4]).to.equal('identify');

            const callback = () => {
                callbackCalled = true;
            };

            fetchMock.resetHistory();

            mParticle.Identity.login(identities, callback);

            await waitForCondition(() => callbackCalled)

            // Just make sure calls were actually made
            expect(fetchMock.calls().length).to.greaterThanOrEqual(1);
            const firstLoginCall = fetchMock.calls()[0];
            expect(firstLoginCall[0].split('/')[4]).to.equal('login');

            // Reset for next async call
            callbackCalled = false;
            fetchMock.resetHistory();

            // cached time will be 1000 if header returns '1'
            const now = new Date();
            clock = sinon.useFakeTimers(now.getTime() + 1000);

            mParticle.Identity.login(identities, callback);

            clock.restore();

            await waitForCondition(() => callbackCalled)
            expect(fetchMock.calls().length).to.equal(1);

            const secondLoginCall = fetchMock.calls()[0];
            expect(secondLoginCall[0].split('/')[4]).to.equal('login');

            expect(callbackCalled).to.equal(true);
        });

        it('should clear cache when modify is called', async () => {
            const X_MP_MAX_AGE = '1';
            mParticle._resetForTests(MPConfig);

            fetchMockSuccess(urls.identify, {
                mpid: testMPID,
                is_logged_in: true,
            }, {
                'x-mp-max-age': X_MP_MAX_AGE,
            });

            fetchMockSuccess(urls.modify, {
                change_results: [
                    {
                        identity_type: 'customerid',
                        modified_mpid: testMPID,
                    },
                ],
            }, {
                'x-mp-max-age': X_MP_MAX_AGE,
            });

            fetchMock.resetHistory();

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';

            mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentityCallInflightReturned)

            const idCache = localStorage.getItem('mprtcl-v4_abcdef-id-cache');
            expect(idCache).to.be.ok;

            mParticle.Identity.modify({
                userIdentities: {
                    customerid: 'abc1',
                },
            });

            await waitForCondition(hasIdentityCallInflightReturned)
            const secondIdCache = localStorage.getItem(
                'mprtcl-v4_abcdef-id-cache'
            );

            expect(secondIdCache).to.not.be.ok;
        });

        it('should clear cache when logout is called', async () => {
            const X_MP_MAX_AGE = '1';
            mParticle._resetForTests(MPConfig);

            fetchMockSuccess(urls.identify, {
                mpid: testMPID,
                is_logged_in: true,
            }, {
                'x-mp-max-age': X_MP_MAX_AGE,
            });

            fetchMockSuccess(urls.logout, {
                mpid: 'otherMPID',
                is_logged_in: false
            }, {
                'x-mp-max-age': X_MP_MAX_AGE,
            });

            fetchMock.resetHistory();

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';

            mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentityCallInflightReturned)

            let idCache = localStorage.getItem('mprtcl-v4_abcdef-id-cache');
            expect(idCache).to.be.ok;

            mParticle.Identity.logout();

            await waitForCondition(hasIdentityCallInflightReturned)

            let secondIdCache = localStorage.getItem(
                'mprtcl-v4_abcdef-id-cache'
            );
            expect(secondIdCache).to.not.be.ok;
        });
    });

    describe('Rokt Manager', function() {
        let roktConfig: IKitConfigs;
        let roktKit: IRoktKit;
        const testRoktEmail = 'test@rokt.com';
        const testRoktMPID = 'rokt-user';

        beforeEach(function() {
            mParticle._resetForTests(MPConfig);
            fetchMock.resetHistory();

            roktConfig = {
                name: 'Rokt',
                moduleId: 181,
            } as IKitConfigs;

            roktKit = {
                filters: {
                    userAttributeFilters: [],
                    filterUserAttributes: () => ({}),
                    filteredUser: null,
                },
                launcher: () => {},
            } as unknown as IRoktKit;
        });

        it('should set currentUser once the email is positively identified', async () => {
            fetchMockSuccess(urls.identify, {
                mpid: testRoktMPID,
                is_logged_in: false,
                matched_identities: {
                    email: testRoktEmail,
                },
            });

            mParticle.init(apiKey, { ...window.mParticle.config, kitConfigs: [roktConfig] });

            await waitForCondition(() => hasIdentifyReturned(testRoktMPID));

            const mpInstance = mParticle.getInstance();

            mpInstance._RoktManager.attachKit(roktKit);
            
            mParticle.Identity.identify({
                userIdentities: {
                    email: testRoktEmail,
                },
            });

            await waitForCondition(() => hasIdentifyReturnedWithEmail(testRoktEmail));

            expect(mpInstance._RoktManager['currentUser']).to.not.be.null;
            expect(mpInstance._RoktManager['currentUser'].getUserIdentities().userIdentities.email).to.equal(testRoktEmail);
        });

        it('should not set currentUser if the initial identify call is not successful', async () => {
            fetchMock.post(urls.identify, {
                status: HTTP_BAD_REQUEST,
                body: {
                    Errors: [
                        {
                            message: 'knownIdentities is empty.',
                            code: 'LOOKUP_ERROR'
                        },
                    ],
                    ErrorCode: 'LOOKUP_ERROR',
                    StatusCode: HTTP_BAD_REQUEST,
                    RequestId: '123',
                },
            }, {
                overwriteRoutes: true,
            });

            mParticle.init(apiKey, { ...window.mParticle.config, kitConfigs: [roktConfig] });

            await waitForCondition(hasIdentityCallInflightReturned);

            const mpInstance = mParticle.getInstance();

            mpInstance._RoktManager.attachKit(roktKit);

            await waitForCondition(hasIdentityCallInflightReturned);

            expect(mpInstance._RoktManager['currentUser']).be.null;
        })

        it('should not set currentUser if the email is not positively identified', async () => {
            fetchMockSuccess(urls.identify, {
                context: null,
                matched_identities: {
                    device_application_stamp: 'my-das',
                },
                is_ephemeral: true,
                mpid: testMPID,
                is_logged_in: false,
            });

            mParticle.init(apiKey, { ...window.mParticle.config, kitConfigs: [roktConfig] });

            await waitForCondition(() => hasIdentifyReturned('testMPID'));

            fetchMock.post(urls.identify, {
                status: HTTP_BAD_REQUEST,
                body: {
                    Errors: [
                        {
                            message: 'knownIdentities is empty.',
                            code: 'LOOKUP_ERROR'
                        },
                    ],
                    ErrorCode: 'LOOKUP_ERROR',
                    StatusCode: HTTP_BAD_REQUEST,
                    RequestId: '123',
                },
            }, {
                overwriteRoutes: true,
            });

            const mpInstance = mParticle.getInstance();

            mpInstance._RoktManager.attachKit(roktKit);

            mParticle.Identity.identify({
                userIdentities: {
                    email: testRoktEmail,
                },
            });

            await waitForCondition(hasIdentityCallInflightReturned);

            // Current user will be the initial anonymous user from the initial identify call via mParticle.init
            // but should not have an email
            expect(mpInstance._RoktManager['currentUser']).to.not.be.null;
            expect(mpInstance._RoktManager['currentUser'].getUserIdentities().userIdentities.email).to.equal(undefined);
        })
    });

    describe('Deprecate Cart', function() {
        afterEach(function() {
            sinon.restore();
        });

        it("should deprecate the user's cart", async () => {
            mParticle.init(apiKey, window.mParticle.config);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');
            await waitForCondition(hasIdentifyReturned)
            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getCart();
            mParticle.Identity.getCurrentUser().getCart();

            bond.called.should.eql(true);
            bond.callCount.should.equal(2);

            bond.getCalls()[0].args[0].should.eql(
                'Deprecated function Identity.getCurrentUser().getCart() will be removed in future releases'
            );
        });

        it('should deprecate add', async () => {
            mParticle.init(apiKey, window.mParticle.config);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            await waitForCondition(hasIdentifyReturned)

            const product: SDKProduct = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400
            );
            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getCart()
                .add(product);

            mParticle.Identity.getCurrentUser()
                .getCart()
                .add(product);

            bond.called.should.eql(true);
            // deprecates on both .getCart, then .add
            bond.callCount.should.equal(4);
            bond.getCalls()[1].args[0].should.eql(
                'Deprecated function Identity.getCurrentUser().getCart().add()'
            );
        });

        it('should deprecate remove', async () => {
            mParticle.init(apiKey, window.mParticle.config);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            await waitForCondition(hasIdentifyReturned)

            const product: SDKProduct = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400
            );

            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getCart()
                .remove(product, true);
            mParticle.Identity.getCurrentUser()
                .getCart()
                .remove(product, true);

            bond.called.should.eql(true);
            // deprecates on both .getCart, then .add
            bond.callCount.should.equal(4);
            bond.getCalls()[1].args[0].should.eql(
                'Deprecated function Identity.getCurrentUser().getCart().remove()'
            );
        });

        it('should deprecate clear', async () => {
            mParticle.init(apiKey, window.mParticle.config);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');
            await waitForCondition(hasIdentifyReturned)
            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getCart()
                .clear();
            mParticle
                .Identity.getCurrentUser()
                .getCart()
                .clear();

            bond.called.should.eql(true);
            // deprecates on both .getCart, then .add
            bond.callCount.should.equal(4);
            bond.getCalls()[1].args[0].should.eql(
                'Deprecated function Identity.getCurrentUser().getCart().clear()'
            );
        });
        
        it('should deprecate getCartProducts', async () => {
            mParticle.init(apiKey, window.mParticle.config);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            await waitForCondition(hasIdentifyReturned)

            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getCart()
                .getCartProducts();
            mParticle.Identity.getCurrentUser()
                .getCart()
                .getCartProducts();

                    bond.called.should.eql(true);
                    // deprecates on both .getCart, then .add
                    bond.callCount.should.equal(4);
                    bond.getCalls()[1].args[0].should.eql(
                        'Deprecated function Identity.getCurrentUser().getCart().getCartProducts()'
                    );
        });
    });
});
