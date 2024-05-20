import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import Utils from './config/utils';
import Constants from '../../src/constants';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import {
    urls,
    apiKey,
    testMPID,
    MPConfig,
    workspaceCookieName,
} from './config/constants';
import { Callback, IdentityApiData, Product } from '@mparticle/web-sdk';
import { IdentityCache } from '../../src/identity-utils';
import { UserIdentities, IAliasRequest } from '../../src/identity.interfaces';

const {
    getLocalStorage,
    setLocalStorage,
    findCookie,
    forwarderDefaultConfiguration,
    getLocalStorageProducts,
    findEventFromRequest,
    findBatch,
    getIdentityEvent,
    setCookie,
    MockForwarder,
} = Utils;

const { HTTPCodes } = Constants;

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

const mParticle = window.mParticle as MParticleWebSDK;

const BadUserIdentitiesAsString = ({
    userIdentities: 'badUserIdentitiesString',
} as unknown) as IdentityApiData;

const BadUserIdentitiesAsArray = ({
    userIdentities: ['bad', 'user', 'identities', 'array'],
} as unknown) as IdentityApiData;

const BadUserIdentitiesAsNull = ({
    userIdentities: null,
} as unknown) as IdentityApiData;

const BadUserIdentitiesAsUndefined = ({
    userIdentities: undefined,
} as unknown) as IdentityApiData;

const BadUserIdentitiesAsBoolean = ({
    userIdentities: true,
} as unknown) as IdentityApiData;

const BadCallbackAsString = ('badCallbackString' as unknown) as Callback;

const EmptyUserIdentities = ({} as unknown) as IdentityApiData;

describe('identity', function() {
    let mockServer;
    let clock;

    beforeEach(function() {
        delete mParticle.config.useCookieStorage;
        fetchMock.post(urls.events, 200);
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;
        localStorage.clear();

        clock = sinon.useFakeTimers({
            now: new Date().getTime(),
        });

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.restore();
        fetchMock.restore();
        mParticle._resetForTests(MPConfig);
        clock.restore();
    });

    describe('requests', function() {
        it('should contain identify request', function(done) {
            mockServer.respondWith(urls.logout, [
                200,
                {},
                JSON.stringify({
                    context: null,
                    matched_identities: {
                        device_application_stamp: 'my-das',
                    },
                    is_ephemeral: true,
                    mpid: testMPID,
                    is_logged_in: false,
                }),
            ]);

            mParticle.Identity.identify({
                userIdentities: {
                    email: 'test@email.com',
                },
            });
            const data = getIdentityEvent(mockServer.requests, 'identify');

            data.should.have.properties(
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

            done();
        });

        it('should contain logout request', function(done) {
            mockServer.respondWith(urls.logout, [
                200,
                {},
                JSON.stringify({
                    context: null,
                    matched_identities: {
                        device_application_stamp: 'my-das',
                    },
                    is_ephemeral: true,
                    mpid: testMPID,
                    is_logged_in: false,
                }),
            ]);

            mParticle.Identity.logout();
            const data = getIdentityEvent(mockServer.requests, 'logout');

            data.should.have.properties(
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

            done();
        });

        it('should contain login request', function(done) {
            mockServer.respondWith(urls.login, [
                200,
                {},
                JSON.stringify({
                    mpid: testMPID,
                    is_logged_in: false,
                    context: null,
                    matched_identities: {
                        email: 'abc@gmail.com',
                    },
                    is_ephemeral: false,
                }),
            ]);

            mParticle.Identity.login({
                userIdentities: {
                    email: 'test@email.com',
                },
            });
            const data = getIdentityEvent(mockServer.requests, 'login');

            data.should.have.properties(
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

            done();
        });

        it('should contain modify request', function(done) {
            mockServer.respondWith(urls.modify, [
                200,
                {},
                JSON.stringify({
                    change_results: [
                        {
                            identity_type: 'email',
                            modified_mpid: testMPID,
                        },
                    ],
                }),
            ]);

            mParticle.Identity.modify({
                userIdentities: {
                    email: 'test@email.com',
                },
            });

            const data = getIdentityEvent(mockServer.requests, 'modify');

            data.should.have.properties(
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

            done();
        });
    });

    it('should respect consent rules on consent-change', function(done) {
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

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID2', is_logged_in: false }),
        ]);

        mParticle.Identity.login();
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

        done();
    });

    it('should not do an identity swap if there is no MPID change', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        const cookiesBefore = getLocalStorage();
        mParticle.getInstance()._Identity.checkIdentitySwap(testMPID, testMPID);

        const cookiesAfter = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        cookiesBefore.cu.should.equal(cookiesAfter.cu);

        done();
    });

    it('should do an identity swap if there is an MPID change', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        const cookiesBefore = getLocalStorage();

        mParticle
            .getInstance()
            ._Identity.checkIdentitySwap(testMPID, 'currentMPID');

        const cookiesAfter = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        cookiesBefore.cu.should.equal(testMPID);

        cookiesAfter.cu.should.equal('currentMPID');

        done();
    });

    it('should store all MPIDs associated with a sessionId, then clear MPIDs from currentSessionMPIDs when a new session starts', function(done) {
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1',
            },
        };

        mParticle.Identity.login(userIdentities1);
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

        const localStorageAfterLoggingEvent = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorageAfterLoggingEvent.gs.csm.length.should.equal(1);

        done();
    });

    it('localStorage - should switch user cookies to new mpid details from cookies when a new mpid is provided', function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.useCookieStorage = false;

        setLocalStorage();

        mParticle.init(apiKey, window.mParticle.config);

        const cookies1 = mParticle.getInstance()._Persistence.getLocalStorage();
        cookies1.cu.should.equal(testMPID);
        cookies1[testMPID].should.have.property('csd');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1',
            },
        };

        mParticle.Identity.login(userIdentities1);
        const cookiesAfterMPIDChange = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        expect(cookiesAfterMPIDChange).to.have.all.keys([
            'l',
            'cu',
            'otherMPID',
            testMPID,
            'gs',
        ]);
        expect(cookiesAfterMPIDChange).to.have.property('cu', 'otherMPID');
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
            expect(cookiesAfterMPIDChange['otherMPID']).to.not.have.property(
                prop
            );
        });

        done();
    });

    it('cookies - should switch user cookies to new mpid details from cookies when a new mpid is provided', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;

        setLocalStorage();

        mParticle.init(apiKey, window.mParticle.config);

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1',
            },
        };

        mParticle.Identity.login(userIdentities1);

        const cookiesAfterMPIDChange = findCookie();
        cookiesAfterMPIDChange.should.have.properties([
            'cu',
            'gs',
            'otherMPID',
            testMPID,
        ]);
        cookiesAfterMPIDChange.should.have.property('cu', 'otherMPID');

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
            cookiesAfterMPIDChange['otherMPID'].should.not.have.property(prop);
        });

        done();
    });

    it('should swap property identityType for identityName', function(done) {
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

    it('should create a proper identity request', function(done) {
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

    it('should create a proper modify identity request', function(done) {
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
        oldIdentities['other1'] = 'id10';
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
        newIdentities.other1 = 'id23';
        newIdentities.other2 = 'id24';
        newIdentities.other3 = 'id25';
        newIdentities.other4 = 'id26';
        newIdentities.other5 = 'id27';
        newIdentities.other6 = 'id28';
        newIdentities.other7 = 'id29';
        newIdentities.other8 = 'id30';
        newIdentities.other9 = 'id31';
        newIdentities.other10 = 'id32';
        newIdentities.mobile_number = 'id33';
        newIdentities.phone_number_2 = 'id34';
        newIdentities.phone_number_3 = 'id35';

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
        expect(identityRequest.identity_changes[9].old_value).to.equal('id10');
        expect(identityRequest.identity_changes[9].identity_type).to.equal(
            'other1'
        );
        expect(identityRequest.identity_changes[9].new_value).to.equal('id23');

        expect(identityRequest.identity_changes[10]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[10].old_value).to.equal('id11');
        expect(identityRequest.identity_changes[10].identity_type).to.equal(
            'other2'
        );
        expect(identityRequest.identity_changes[10].new_value).to.equal('id24');

        expect(identityRequest.identity_changes[11]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[11].old_value).to.equal('id12');
        expect(identityRequest.identity_changes[11].identity_type).to.equal(
            'other3'
        );
        expect(identityRequest.identity_changes[11].new_value).to.equal('id25');

        expect(identityRequest.identity_changes[12]).to.have.all.keys([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        expect(identityRequest.identity_changes[12].old_value).to.equal('id13');
        expect(identityRequest.identity_changes[12].identity_type).to.equal(
            'other4'
        );
        expect(identityRequest.identity_changes[12].new_value).to.equal('id26');

        expect(identityRequest.identity_changes[13].old_value).to.equal('id14');
        expect(identityRequest.identity_changes[13].identity_type).to.equal(
            'other5'
        );
        expect(identityRequest.identity_changes[13].new_value).to.equal('id27');

        expect(identityRequest.identity_changes[14].old_value).to.equal('id15');
        expect(identityRequest.identity_changes[14].identity_type).to.equal(
            'other6'
        );
        expect(identityRequest.identity_changes[14].new_value).to.equal('id28');

        expect(identityRequest.identity_changes[15].old_value).to.equal('id16');
        expect(identityRequest.identity_changes[15].identity_type).to.equal(
            'other7'
        );
        expect(identityRequest.identity_changes[15].new_value).to.equal('id29');

        expect(identityRequest.identity_changes[16].old_value).to.equal('id17');
        expect(identityRequest.identity_changes[16].identity_type).to.equal(
            'other8'
        );
        expect(identityRequest.identity_changes[16].new_value).to.equal('id30');

        expect(identityRequest.identity_changes[17].old_value).to.equal('id18');
        expect(identityRequest.identity_changes[17].identity_type).to.equal(
            'other9'
        );
        expect(identityRequest.identity_changes[17].new_value).to.equal('id31');

        expect(identityRequest.identity_changes[18].old_value).to.equal('id19');
        expect(identityRequest.identity_changes[18].identity_type).to.equal(
            'other10'
        );
        expect(identityRequest.identity_changes[18].new_value).to.equal('id32');

        expect(identityRequest.identity_changes[19].old_value).to.equal('id20');
        expect(identityRequest.identity_changes[19].identity_type).to.equal(
            'mobile_number'
        );
        expect(identityRequest.identity_changes[19].new_value).to.equal('id33');

        expect(identityRequest.identity_changes[20].old_value).to.equal('id21');
        expect(identityRequest.identity_changes[20].identity_type).to.equal(
            'phone_number_2'
        );
        expect(identityRequest.identity_changes[20].new_value).to.equal('id34');

        expect(identityRequest.identity_changes[21].old_value).to.equal('id22');
        expect(identityRequest.identity_changes[21].identity_type).to.equal(
            'phone_number_3'
        );
        expect(identityRequest.identity_changes[21].new_value).to.equal('id35');

        done();
    });

    it('should not make a request when an invalid request is sent to login', function(done) {
        const identityAPIRequest1 = BadUserIdentitiesAsString;
        mParticle.Identity.login(identityAPIRequest1);

        const badData1 = getIdentityEvent(mockServer.requests, 'login');
        expect(badData1).to.not.be.ok;

        const identityAPIRequest2 = BadUserIdentitiesAsArray;
        mParticle.Identity.login(identityAPIRequest2);

        const badData2 = getIdentityEvent(mockServer.requests, 'login');
        expect(badData2).to.not.be.ok;

        const identityAPIRequest3 = BadUserIdentitiesAsUndefined;
        mParticle.Identity.login(identityAPIRequest3);

        const badData3 = getIdentityEvent(mockServer.requests, 'login');
        expect(badData3).to.not.be.ok;

        const identityAPIRequest4 = BadUserIdentitiesAsBoolean;
        mParticle.Identity.login(identityAPIRequest4);

        const badData4 = getIdentityEvent(mockServer.requests, 'login');
        expect(badData4).to.not.be.ok;

        done();
    });

    it('should not make a request when an invalid request is sent to logout', function(done) {
        const identityAPIRequest1 = BadUserIdentitiesAsString;
        mParticle.Identity.logout(identityAPIRequest1);

        const badData1 = getIdentityEvent(mockServer.requests, 'logout');
        expect(badData1).to.not.be.ok;

        const identityAPIRequest2 = BadUserIdentitiesAsArray;
        mParticle.Identity.logout(identityAPIRequest2);

        const badData2 = getIdentityEvent(mockServer.requests, 'logout');
        expect(badData2).to.not.be.ok;

        const identityAPIRequest3 = BadUserIdentitiesAsUndefined;
        mParticle.Identity.logout(identityAPIRequest3);

        const badData3 = getIdentityEvent(mockServer.requests, 'logout');
        expect(badData3).to.not.be.ok;

        const identityAPIRequest4 = BadUserIdentitiesAsBoolean;
        mParticle.Identity.logout(identityAPIRequest4);

        const badData4 = getIdentityEvent(mockServer.requests, 'logout');
        expect(badData4).to.not.be.ok;

        done();
    });

    it('should not make a request when an invalid request is sent to modify', function(done) {
        const identityAPIRequest1 = BadUserIdentitiesAsString;
        mParticle.Identity.modify(identityAPIRequest1);

        const badData1 = getIdentityEvent(mockServer.requests, 'modify');
        expect(badData1).to.not.be.ok;

        const identityAPIRequest2 = BadUserIdentitiesAsArray;
        mParticle.Identity.modify(identityAPIRequest2);

        const badData2 = getIdentityEvent(mockServer.requests, 'modify');
        expect(badData2).to.not.be.ok;

        const identityAPIRequest3 = BadUserIdentitiesAsNull;
        mParticle.Identity.modify(identityAPIRequest3);

        const badData3 = getIdentityEvent(mockServer.requests, 'modify');
        expect(badData3).to.not.be.ok;

        const identityAPIRequest4 = BadUserIdentitiesAsUndefined;
        mParticle.Identity.modify(identityAPIRequest4);

        const badData4 = getIdentityEvent(mockServer.requests, 'modify');
        expect(badData4).to.not.be.ok;

        const identityAPIRequest5 = BadUserIdentitiesAsBoolean;
        mParticle.Identity.modify(identityAPIRequest5);

        const badData5 = getIdentityEvent(mockServer.requests, 'modify');
        expect(badData5).to.not.be.ok;

        done();
    });

    it('should not make a request when an invalid request is sent to identify', function(done) {
        mockServer.requests = [];
        const identityAPIRequest1 = BadUserIdentitiesAsString;
        mParticle.Identity.identify(identityAPIRequest1);

        const badData1 = getIdentityEvent(mockServer.requests, 'identify');
        expect(badData1).to.not.be.ok;

        const identityAPIRequest2 = BadUserIdentitiesAsArray;
        mParticle.Identity.identify(identityAPIRequest2);

        const badData2 = getIdentityEvent(mockServer.requests, 'identify');
        expect(badData2).to.not.be.ok;

        const identityAPIRequest3 = BadUserIdentitiesAsUndefined;
        mParticle.Identity.identify(identityAPIRequest3);

        const badData3 = getIdentityEvent(mockServer.requests, 'identify');
        expect(badData3).to.not.be.ok;

        const identityAPIRequest4 = BadUserIdentitiesAsBoolean;
        mParticle.Identity.identify(identityAPIRequest4);

        const badData4 = getIdentityEvent(mockServer.requests, 'identify');
        expect(badData4).to.not.be.ok;

        done();
    });

    it('should have old_value === null when there is no previous identity of a certain type and a new identity of that type', function(done) {
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

    it('should have new_value === null when there is a previous identity of a certain type and no new identity of that type', function(done) {
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

    it('should create a proper send request when passing identities to modify', function(done) {
        const identityAPIData: IdentityApiData = {
            userIdentities: {
                email: 'rob@gmail.com',
            },
        };
        mParticle.init(apiKey, window.mParticle.config);
        mockServer.respondWith(urls.modify, [
            200,
            {},
            JSON.stringify({
                change_results: [
                    {
                        identity_type: 'email',
                        modified_mpid: testMPID,
                    },
                ],
            }),
        ]);

        mParticle.Identity.modify(identityAPIData);
        const data = getIdentityEvent(mockServer.requests, 'modify');

        data.identity_changes.length.should.equal(1);
        data.identity_changes[0].should.have.properties(
            'old_value',
            'new_value',
            'identity_type'
        );
        data.identity_changes[0].should.have.properties(
            'old_value',
            'new_value',
            'identity_type'
        );

        done();
    });

    it('ensure that automatic identify is not called more than once.', function(done) {
        mParticle._resetForTests(MPConfig);
        const spy = sinon.spy();
        mParticle.config.identityCallback = spy;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);
        spy.calledOnce.should.be.ok();
        mParticle.startNewSession();
        spy.calledOnce.should.be.ok();

        done();
    });

    it('queue events when MPID is 0, and then flush events once MPID changes', function(done) {
        mParticle._resetForTests(MPConfig);

        mockServer.respondWith(urls.identify, [0, {}, JSON.stringify({})]);

        mParticle.init(apiKey, window.mParticle.config);

        fetchMock.resetHistory();
        mParticle.logEvent('Test Event1');

        let testEvent1 = findEventFromRequest(fetchMock.calls(), 'Test Event1');

        expect(testEvent1).to.not.be.ok;

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.logEvent('Test Event2');
        mParticle.Identity.login();
        // server requests will have AST, sessionStart, Test1, Test2, and login
        testEvent1 = findEventFromRequest(fetchMock.calls(), 'Test Event1');
        expect(fetchMock.calls().length).to.equal(4);

        const testEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'Test Event2'
        );
        const ASTEvent = findEventFromRequest(
            fetchMock.calls(),
            'application_state_transition'
        );
        const sessionStartEvent = findEventFromRequest(
            fetchMock.calls(),
            'session_start'
        );
        const loginEvent = getIdentityEvent(mockServer.requests, 'login');

        expect(testEvent1).to.be.ok;
        expect(testEvent2).to.be.ok;
        expect(ASTEvent).to.be.ok;
        expect(sessionStartEvent).to.be.ok;
        expect(loginEvent).to.be.ok;

        done();
    });

    it('getUsers should return all mpids available in local storage', function(done) {
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

        // get user 1 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user1', is_logged_in: false }),
        ]);

        mParticle.Identity.login(userIdentities1);

        // get user 2 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user2', is_logged_in: false }),
        ]);

        mParticle.Identity.login(userIdentities2);

        // get user 3 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user3', is_logged_in: false }),
        ]);

        mParticle.Identity.login(userIdentities3);

        // init again using user 1
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user1', is_logged_in: false }),
        ]);

        mParticle.identifyRequest = userIdentities1;

        mParticle.init(apiKey, window.mParticle.config);
        const users = mParticle.Identity.getUsers();
        //this includes the original, starting user, in addition to the 3 added above
        expect(users.length).to.equal(4);
        for (let i of users) {
            const mpid = i.getMPID();
            expect(mParticle.Identity.getUser(mpid)).to.exist;
        }
        expect(mParticle.Identity.getUser('gs')).to.not.exist;
        expect(mParticle.Identity.getUser('cu')).to.not.exist;
        expect(mParticle.Identity.getUser('0')).to.not.exist;
        expect(mParticle.Identity.getUser('user4')).to.not.exist;

        done();
    });

    it('should only update its own cookies, not any other mpids when initializing with a different set of credentials', function(done) {
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

        // get user 1 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user1', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user1');

        // get user 2 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user2', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user2);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user2');

        // get user 3 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user3', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user3);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user3');

        // init again using user 1
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'user1', is_logged_in: false }),
        ]);

        mParticle.identifyRequest = user1;

        mParticle.init(apiKey, window.mParticle.config);

        const localStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        localStorage.user1.ua.user.should.equal('user1');
        localStorage.user1.ui.should.have.property('1', 'customerid1');
        localStorage.user1.ui.should.have.property('7', 'email1@test.com');
        localStorage.user2.ua.user.should.equal('user2');
        localStorage.user2.ui.should.have.property('1', 'customerid2');
        localStorage.user2.ui.should.have.property('7', 'email2@test.com');
        localStorage.user3.ua.user.should.equal('user3');
        localStorage.user3.ui.should.have.property('1', 'customerid3');
        localStorage.user3.ui.should.have.property('7', 'email3@test.com');

        done();
    });

    it('should create a new modified user identity object, removing any invalid identity types', function(done) {
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

        expect(combinedUIsByType).to.have.all.keys([1, 3, 4, 7]);
        expect(combinedUIsByType[1]).to.equal('customerid1');
        expect(combinedUIsByType[3]).to.equal('twitter5');
        expect(combinedUIsByType[4]).to.equal('google4');
        expect(combinedUIsByType[7]).to.equal('email2@test.com');

        // if an invalid identity type is added to the identity call,
        // it will be removed from the combinedUIsByType
        // FIXME: What is the actual test case this is trying to test?
        // expect(combinedUIsByType).to.not.have.property(false);
        expect(Object.keys(combinedUIsByType).length).to.equal(4);

        done();
    });

    it('should reject a callback that is not a function', function(done) {
        const identityRequest: IdentityApiData = {
            userIdentities: {
                customerid: '123',
            },
        };
        const badCallback = BadCallbackAsString;

        mockServer.requests = [];

        mParticle.Identity.login(identityRequest, badCallback);
        mParticle.Identity.logout(identityRequest, badCallback);
        mParticle.Identity.modify(identityRequest, badCallback);
        mParticle.Identity.identify(identityRequest, badCallback);

        mockServer.requests.length.should.equal(0);

        done();
    });

    it("should find the related MPID's cookies when given a UI with fewer IDs when passed to login, logout, and identify, and then log events with updated cookies", function(done) {
        mParticle._resetForTests(MPConfig);
        const user1: IdentityApiData = {
            userIdentities: {
                customerid: 'customerid1',
            },
        };

        const user1modified: IdentityApiData = {
            userIdentities: {
                email: 'email2@test.com',
            },
        };

        mParticle.config.identifyRequest = user1;

        mParticle.init(apiKey, window.mParticle.config);

        mockServer.respondWith(urls.modify, [
            200,
            {},
            JSON.stringify({
                change_results: [
                    {
                        identity_type: 'email',
                        modified_mpid: testMPID,
                    },
                ],
            }),
        ]);

        mParticle.Identity.modify(user1modified);
        mParticle.Identity.getCurrentUser().setUserAttribute('foo1', 'bar1');

        const product1: Product = mParticle.eCommerce.createProduct(
            'iPhone',
            '12345',
            '1000',
            2
        );
        mParticle.eCommerce.Cart.add(product1);

        mParticle.logEvent('Test Event1');

        const testEvent1Batch = findBatch(fetchMock.calls(), 'Test Event1');

        testEvent1Batch.user_attributes.should.have.property('foo1', 'bar1');
        testEvent1Batch.user_identities.should.have.property(
            'customer_id',
            'customerid1'
        );
        testEvent1Batch.user_identities.should.have.property(
            'email',
            'email2@test.com'
        );

        const products = getLocalStorageProducts();

        products.testMPID.cp[0].should.have.property(
            'Name',
            'iPhone',
            'sku',
            'quantity'
        );
        products.testMPID.cp[0].should.have.property('Sku', '12345');
        products.testMPID.cp[0].should.have.property('Price', 1000);
        products.testMPID.cp[0].should.have.property('Quantity', 2);

        const user2 = {
            userIdentities: {
                customerid: 'customerid2',
            },
        };

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.logout(user2);
        mParticle.logEvent('Test Event2');

        const testEvent2Batch = findBatch(fetchMock.calls(), 'Test Event2');

        Object.keys(testEvent2Batch.user_attributes).length.should.equal(0);
        testEvent2Batch.user_identities.should.have.property(
            'customer_id',
            'customerid2'
        );

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'testMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);
        mParticle.logEvent('Test Event3');
        const testEvent3Batch = findBatch(fetchMock.calls(), 'Test Event3');

        testEvent3Batch.user_attributes.should.have.property('foo1', 'bar1');
        Object.keys(testEvent3Batch.user_identities).length.should.equal(2);
        testEvent3Batch.user_identities.should.have.property(
            'customer_id',
            'customerid1'
        );
        testEvent3Batch.user_identities.should.have.property(
            'email',
            'email2@test.com'
        );

        const products2 = getLocalStorageProducts();

        products2.testMPID.cp[0].should.have.property(
            'Name',
            'iPhone',
            'sku',
            'quantity'
        );
        products2.testMPID.cp[0].should.have.property('Sku', '12345');
        products2.testMPID.cp[0].should.have.property('Price', 1000);
        products2.testMPID.cp[0].should.have.property('Quantity', 2);

        done();
    });

    it('Should maintain cookie structure when initializing multiple identity requests, and reinitializing with a previous one will keep the last MPID ', function(done) {
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
        const user1UIs = mParticle.Identity.getCurrentUser().getUserIdentities();

        user1UIs.userIdentities.customerid.should.equal('1');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid2', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user2);
        const user2UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user2UIs.userIdentities.customerid.should.equal('2');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid3', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user3);
        const user3UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user3UIs.userIdentities.customerid.should.equal('3');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid4', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user4);
        const user4UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user4UIs.userIdentities.customerid.should.equal('4');

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

        const user5 = mParticle.Identity.getCurrentUser();
        user5.getUserIdentities().userIdentities.customerid.should.equal('4');
        user5.getMPID().should.equal('mpid4');

        const data = mParticle.getInstance()._Persistence.getLocalStorage();

        data.cu.should.equal('mpid4');
        data.testMPID.ui[1].should.equal('1');
        data.mpid2.ui[1].should.equal('2');
        data.mpid3.ui[1].should.equal('3');
        data.mpid4.ui[1].should.equal('4');

        mParticle.identifyRequest = null;
        done();
    });

    it('should not send requests to the server with invalid userIdentity values', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];
        let result;

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mockServer.respondWith(urls.modify, [
            200,
            {},
            JSON.stringify({
                change_results: [
                    {
                        identity_type: 'valid-identity-type',
                        modified_mpid: testMPID,
                    },
                ],
            }),
        ]);

        identityMethods.forEach(function(identityMethod) {
            invalidUserIdentitiesArray.forEach(function(badIdentities) {
                mParticle.Identity[identityMethod](badIdentities, callback);
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
                validUserIdentities.forEach(function(goodIdentities) {
                    mParticle.Identity[identityMethod](
                        goodIdentities,
                        callback
                    );
                    expect(
                        result.httpCode,
                        `valid ${identityMethod} httpCode`
                    ).to.equal(200);
                    expect(
                        result.body.mpid,
                        `valid ${identityMethod} mpid `
                    ).to.be.ok;
                    expect(
                        result.body.mpid,
                        `valid ${identityMethod} mpid`
                    ).to.equal(testMPID);

                    // Reset result for next iteration of the loop
                    result = null;
                });
            } else {
                validUserIdentities.forEach(function(goodIdentities) {
                    mParticle.Identity.modify(goodIdentities, callback);
                    expect(result.httpCode, `valid modify httpCode`).to.equal(
                        200
                    );
                    expect(
                        result.body.change_results[0].modified_mpid,
                        `valid modify change_results modified_mpid`
                    ).to.equal(testMPID);
                    expect(
                        result.body.change_results[0].identity_type,
                        `valid modify change_results identity_type`
                    ).to.be.ok;

                    // Reset result for next iteration of the loop
                    result = null;
                });
            }
        });

        done();
    });

    it('should have no user identities when logging out or in with no object', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        const user = {
            userIdentities: {
                customerid: '123',
            },
        };

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid1', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user);
        const userIdentities1 = mParticle.Identity.getCurrentUser().getUserIdentities();

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid1', is_logged_in: false }),
        ]);

        mParticle.Identity.logout();
        const userIdentities2 = mParticle.Identity.getCurrentUser().getUserIdentities();

        userIdentities1.userIdentities.should.have.property(
            'customerid',
            '123'
        );
        Object.keys(userIdentities2.userIdentities).length.should.equal(0);

        done();
    });

    it("saves proper cookies for each user's products, and purchases record cartProducts correctly", function(done) {
        mParticle._resetForTests(MPConfig);

        const identityAPIRequest1 = {
            userIdentities: {
                customerid: '123',
            },
        };
        mParticle.identifyRequest = identityAPIRequest1;
        mParticle.init(apiKey, window.mParticle.config);

        const product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 2),
            product3 = mParticle.eCommerce.createProduct('Windows', 'SKU3', 3),
            product4 = mParticle.eCommerce.createProduct('HTC', 'SKU4', 4);

        mParticle.eCommerce.Cart.add([product1, product2]);

        const identityAPIRequest2 = {
            userIdentities: {
                customerid: '234',
            },
        };

        const products = getLocalStorageProducts();
        const cartProducts = products[testMPID].cp;

        cartProducts[0].Name.should.equal('iPhone');
        cartProducts[1].Name.should.equal('Android');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login(identityAPIRequest2);

        mParticle.eCommerce.Cart.add([product3, product4]);

        const products2 = getLocalStorageProducts();
        const cartProducts2 = products2['otherMPID'].cp;

        cartProducts2[0].Name.should.equal('Windows');
        cartProducts2[1].Name.should.equal('HTC');

        mParticle.eCommerce.logCheckout(1);

        const checkoutEvent = findEventFromRequest(
            fetchMock.calls(),
            'checkout'
        );

        checkoutEvent.data.product_action.should.have.property(
            'products',
            null
        );

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.login(identityAPIRequest1);
        fetchMock.resetHistory();
        mParticle.eCommerce.logCheckout(1);

        const checkoutEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'checkout'
        );

        checkoutEvent2.data.product_action.should.have.property(
            'products',
            null
        );

        done();
    });

    it('should update cookies after modifying identities', function(done) {
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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mockServer.respondWith(urls.modify, [
            200,
            {},
            JSON.stringify({
                change_results: [
                    { identity_type: 'customerid', modified_mpid: testMPID },
                ],
            }),
        ]);

        mParticle.Identity.login(user);
        mParticle.Identity.modify(modifiedUser);

        const cookie = mParticle.getInstance()._Persistence.getLocalStorage();
        cookie.testMPID.ui[1].should.equal('customerId2');

        done();
    });

    it('does not run onUserAlias if it is not a function', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mockServer.requests = [];
        mParticle.Identity.login(user2);

        mockServer.requests.length.should.equal(0);

        done();
    });

    it('should run onUserAlias if it is a function', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user2);
        hasBeenRun.should.equal(true);

        done();
    });

    it('should setUserAttributes, setUserAttributeLists, removeUserAttributes, and removeUserAttributeLists properly in onUserAlias', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        const user1 = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttribute('age', 27);

        const user1Attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();
        user1Attrs.should.have.property('gender', 'male');
        user1Attrs.should.have.property('age', 27);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

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

        const user1ObjectAttrs = user1Object.getAllUserAttributes();
        user1ObjectAttrs.should.not.have.property('age');
        user1ObjectAttrs.should.have.property('gender', 'male');

        const user2Attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();
        user2Attrs.should.not.have.property('gender');
        user2Attrs.should.have.property('age', 27);
        const user2ObjectAttrs = user2Object.getAllUserAttributes();
        user2ObjectAttrs.should.not.have.property('gender');
        user2ObjectAttrs.should.have.property('age', 27);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID2', is_logged_in: false }),
        ]);

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
        expect(user2AttributeListsBeforeRemoving.list.length).to.equal(5);
        expect(Object.keys(user3UserAttributeListsBeforeAdding).length).to.not
            .be.ok;

        expect(Object.keys(user2AttributeListsAfterRemoving).length).to.not.be
            .ok;
        expect(user3UserAttributeListsAfterAdding.list.length).to.equal(5);

        done();
    });

    it('should return an empty array when no cart products exist', function(done) {
        mParticle.init(apiKey, window.mParticle.config);

        const user1 = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);
        const products = mParticle.Identity.getCurrentUser()
            .getCart()
            .getCartProducts();

        expect(products.length).to.not.be.ok;

        done();
    });

    it('should make a request when copyUserAttributes is included on the identity request', function(done) {
        mParticle.init(apiKey, window.mParticle.config);

        const identityAPIRequest1 = {
            userIdentities: {
                customerid: '123',
            },
            copyUserAttributes: true,
        };

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.logout(identityAPIRequest1);

        const logoutData = getIdentityEvent(mockServer.requests, 'logout');
        expect(logoutData).to.be.ok;

        mParticle.Identity.login(identityAPIRequest1);

        const loginData = getIdentityEvent(mockServer.requests, 'login');
        expect(loginData).to.be.ok;

        mParticle.Identity.modify(identityAPIRequest1);

        const modifyData = getIdentityEvent(mockServer.requests, 'login');
        expect(modifyData).to.be.ok;

        done();
    });

    it('should trigger the identifyCallback when a successful identify call is sent', function(done) {
        // MP.sessionID does not exist yet because we perform an mParticle._resetForTests(MPConfig);
        mParticle._resetForTests(MPConfig);

        let mpid;
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        // https://go.mparticle.com/work/SQDSDKS-6460
        mParticle.config.identityCallback = function(resp) {
            mpid = resp.body.mpid;
        };

        mParticle.init(apiKey, window.mParticle.config);

        mpid.should.equal('MPID1');
        done();
    });

    it('should trigger the identityCallback before eventQueue is flushed', function(done) {
        mParticle._resetForTests(MPConfig);

        mockServer.respondImmediately = false;
        mockServer.autoRespond = true;
        mockServer.autoRespondAfter = 500;
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.config.identityCallback = function() {
            mParticle.Identity.getCurrentUser().setUserAttribute('foo', 'bar');
        };

        fetchMock.resetHistory();
        mParticle.init(apiKey, window.mParticle.config);

        expect(fetchMock.calls().length).to.equal(0);
        clock.tick(1000);

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
        clock.restore();

        done();
    });

    it('should still trigger the identifyCallback when no identify request is sent because there are already cookies', function(done) {
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

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        fetchMock.resetHistory();
        mParticle.init(apiKey, window.mParticle.config);
        //the only server request is the AST, there is no request to Identity
        fetchMock.calls().length.should.equal(1);
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

        done();
    });

    it('identifyCallback response should have a getUser function on the result object', function(done) {
        let result;
        mParticle._resetForTests(MPConfig);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.config.identityCallback = function(resp) {
            result = resp;
            resp.getUser().setUserAttribute('test', 'value');
        };

        mParticle.init(apiKey, window.mParticle.config);

        result.should.have.property('getUser');

        mParticle.Identity.getCurrentUser()
            .getAllUserAttributes()
            .should.have.property('test', 'value');

        done();
    });

    it('identityCallback responses should all have a getUser function on their result objects', function(done) {
        let result, loginResult, logoutResult, modifyResult;

        mParticle._resetForTests(MPConfig);

        mParticle.config.identityCallback = function(resp) {
            resp.getUser().setUserAttribute('attr', 'value');
            result = resp;
        };

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false, status: 200 }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

        const identityRequest = { userIdentities: { customerid: 'test123' } };
        function loginCallback(result) {
            loginResult = result;
        }
        function logoutCallback(result) {
            logoutResult = result;
        }
        function modifyCallback(result) {
            modifyResult = result;
        }

        mParticle.Identity.login(identityRequest, loginCallback);
        mParticle.Identity.logout(identityRequest, logoutCallback);
        mParticle.Identity.modify(identityRequest, modifyCallback);

        result.should.have.properties('body', 'httpCode', 'getUser');
        result.httpCode.should.equal(200);
        result.body.should.have.properties('mpid', 'status');
        result.body.mpid.should.equal('MPID1');
        result
            .getUser()
            .getMPID()
            .should.equal('MPID1');
        result
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');
        loginResult
            .getUser()
            .getMPID()
            .should.equal('MPID1');
        logoutResult
            .getUser()
            .getMPID()
            .should.equal('MPID1');
        modifyResult
            .getUser()
            .getMPID()
            .should.equal('MPID1');

        loginResult
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');
        logoutResult
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');
        modifyResult
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');

        done();
    });

    it('should call identify when there is an active session but no current user', function(done) {
        // this broken cookie state occurs when an initial identify request is made, fails, and the
        // client had no programmatic handling of a failed identify request
        mParticle._resetForTests(MPConfig);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        // invalid customerid of type number, so mParticle.init(apiKey, window.mParticle.config) will fail, but create cookies
        // without a current user
        mParticle.config.identifyRequest = {
            userIdentities: {
                customerid: (123 as unknown) as string,
            },
        };
        mockServer.requests = [];
        mParticle.init(apiKey, window.mParticle.config);

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
        mockServer.requests = [];

        mParticle.init(apiKey, window.mParticle.config);

        cookies = mParticle.getInstance()._Persistence.getPersistence();
        cookies.should.have.property('gs');
        cookies.should.have.have.property('cu', 'MPID1');
        mParticle.Identity.getCurrentUser().should.not.equal(null);

        done();
    });

    it('Users should have firstSeenTime and lastSeenTime', function(done) {
        mParticle._resetForTests(MPConfig);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mockServer.requests = [];

        // Reset clock so we can use simple integers for time
        clock.restore();
        clock = sinon.useFakeTimers();
        clock.tick(100);

        mParticle.init(apiKey, window.mParticle.config);

        const currentUser = mParticle.Identity.getCurrentUser();
        expect(currentUser).to.not.equal(null);

        expect(currentUser.getFirstSeenTime()).to.not.equal(null);
        expect(currentUser.getLastSeenTime()).to.not.equal(null);

        clock.tick(100);

        expect(currentUser.getFirstSeenTime()).to.equal(100);
        expect(currentUser.getLastSeenTime()).to.equal(200);

        clock.restore();
        done();
    });

    it('firstSeenTime should stay the same for a user', function(done) {
        mParticle._resetForTests(MPConfig);

        // Reset clock so we can use simple integers for time
        clock.restore();
        clock = sinon.useFakeTimers();
        clock.tick(100);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mockServer.requests = [];

        mParticle.init(apiKey, window.mParticle.config);

        let currentUser = mParticle.Identity.getCurrentUser();
        currentUser.should.not.equal(null);
        const user1FirstSeen = currentUser.getFirstSeenTime();

        clock.tick(20);

        const user1LastSeen = currentUser.getLastSeenTime();

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1',
            },
        };

        mockServer.requests = [];
        mParticle.Identity.login(userIdentities1);

        currentUser = mParticle.Identity.getCurrentUser();
        currentUser.getMPID().should.equal('MPID1');

        // new user's firstSeenTime should be greater than or equal to the preceeding user's lastSeenTime
        (currentUser.getFirstSeenTime() >= user1LastSeen).should.equal(true);
        currentUser.getFirstSeenTime().should.equal(120);

        clock.tick(20);

        const user1 = mParticle.Identity.getUser(testMPID);
        user1.getFirstSeenTime().should.equal(user1FirstSeen);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mockServer.requests = [];

        mParticle.Identity.login();

        currentUser = mParticle.Identity.getCurrentUser();
        currentUser.getMPID().should.equal(testMPID);
        currentUser.getFirstSeenTime().should.equal(user1FirstSeen);
        (currentUser.getLastSeenTime() > user1LastSeen).should.equal(true);

        clock.restore();
        done();
    });

    it('list returned by Identity.getUsers() should be sorted by lastSeenTime, with nulls last', function(done) {
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

        done();
    });

    it('does not error when simultaneous identity calls are out', function(done) {
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

        mParticle.Identity.login({ userIdentities: { customerid: 'test' } });
        errorMessages.length.should.equal(0);

        done();
    });

    it('Startup identity callback should include getPreviousUser()', function(done) {
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

        expect(identityResult.getUser().getMPID()).to.equal('testMPID');
        expect(identityResult.getPreviousUser()).to.not.equal(null);
        expect(identityResult.getPreviousUser().getMPID()).to.equal(
            'testMPID2'
        );
        done();
    });

    it('Identity callback should include getPreviousUser()', function(done) {
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
        done();
    });

    it('should return the correct user for Previous User', function(done) {
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

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: '1', is_logged_in: false }),
        ]);

        let identityResult;
        mParticle.Identity.identify(EmptyUserIdentities, function(result) {
            identityResult = result;
        });

        identityResult
            .getUser()
            .getMPID()
            .should.equal('1');
        identityResult
            .getPreviousUser()
            .getMPID()
            .should.equal('4');

        done();
    });

    it('Alias request should be received when API is called validly', function(done) {
        mockServer.requests = [];
        const aliasRequest: IAliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        };
        mockServer.respondWith(urls.alias, [200, {}, JSON.stringify({})]);

        mParticle.Identity.aliasUsers(aliasRequest);
        mockServer.requests.length.should.equal(1);

        const request = mockServer.requests[0];
        request.url.should.equal(urls.alias);

        const requestBody = JSON.parse(request.requestBody);
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

    it('Alias request should include scope if specified', function(done) {
        mockServer.requests = [];
        const aliasRequest: IAliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
            scope: 'mpid',
        };
        mockServer.respondWith(urls.alias, [200, {}, JSON.stringify({})]);

        mParticle.Identity.aliasUsers(aliasRequest);
        mockServer.requests.length.should.equal(1);

        const request = mockServer.requests[0];
        expect(request.url).to.equal(urls.alias);

        const requestBody = JSON.parse(request.requestBody);
        const dataBody = requestBody['data'];
        expect(dataBody['scope']).to.equal('mpid');

        done();
    });

    it('Should reject malformed Alias Requests', function(done) {
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

        mockServer.respondWith(urls.alias, [200, {}, JSON.stringify({})]);

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(200);
        expect(callbackResult.message).to.equal(undefined);
        expect(warnMessage).to.equal(null);
        callbackResult = null;

        done();
    });

    it('should parse error info from Alias Requests', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        const errorMessage = 'this is a sample error message';
        let callbackResult;

        mockServer.respondWith(urls.alias, [
            400,
            {},
            JSON.stringify({
                message: errorMessage,
                code: 'ignored code',
            }),
        ]);

        const aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        };

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });

        callbackResult.httpCode.should.equal(400);
        callbackResult.message.should.equal(errorMessage);

        done();
    });

    it('should properly create AliasRequest', function(done) {
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

        // Reset clock so we can use simple integers for time
        clock.restore();
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

        done();
    });

    it('should fill in missing fst and lst in createAliasRequest', function(done) {
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

        // Reset clock so we can use simple integers for time
        clock.restore();
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

        done();
    });

    it('should fix startTime when default is outside max window create AliasRequest', function(done) {
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

        done();
    });

    it('should warn if legal aliasRequest cannot be created with MParticleUser', function(done) {
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
        done();
    });

    it("alias request should have environment 'development' when isDevelopmentMode is true", function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.isDevelopmentMode = true;

        mParticle.init(apiKey, window.mParticle.config);

        mockServer.requests = [];
        const aliasRequest = {
            destinationMpid: 'destinationMpid',
            sourceMpid: 'sourceMpid',
            startTime: 3,
            endTime: 4,
        };
        mParticle.Identity.aliasUsers(aliasRequest);
        mockServer.requests.length.should.equal(1);

        const request = mockServer.requests[0];
        const requestBody = JSON.parse(request.requestBody);
        expect(requestBody['environment']).to.equal('development');

        done();
    });

    it('should set isFirtRun to false after an app is initialized', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getInstance()._Store.isFirstRun.should.equal(false);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID1', is_logged_in: false }),
        ]);

        mParticle.Identity.login({ userIdentities: { customerid: 'abc' } });

        const ls = mParticle.getInstance()._Persistence.getLocalStorage();
        ls['testMPID'].lst.should.not.equal(null);

        done();
    });

    it('should send back an httpCode of -1 when there is a no coverage (http code returns 0)', function(done) {
        mParticle._resetForTests(MPConfig);

        let result;

        function identityCallback(response) {
            result = response;
        }
        mockServer.respondWith(urls.identify, [
            0,
            {},
            JSON.stringify({ body: null }),
        ]);

        mParticle.config.identityCallback = identityCallback;

        mParticle.init(apiKey, window.mParticle.config);

        result.httpCode.should.equal(-1);

        done();
    });

    it('should use the custom device id in known_identities when passed via setDeviceId', function(done) {
        mParticle._resetForTests(MPConfig);
        mockServer.requests = [];

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ body: null }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

        const data = getIdentityEvent(mockServer.requests, 'identify');
        data.known_identities.device_application_stamp.length.should.equal(36);

        mParticle.setDeviceId('foo-guid');
        mParticle.Identity.login({ userIdentities: { customerid: 'test' } });
        const data2 = getIdentityEvent(mockServer.requests, 'login');

        data2.known_identities.device_application_stamp.should.equal(
            'foo-guid'
        );

        done();
    });

    it('should use the custom device id in known_identities when set via mParticle.config', function(done) {
        mParticle._resetForTests(MPConfig);
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ body: null }),
        ]);
        mockServer.requests = [];
        window.mParticle.config.deviceId = 'foo-guid';
        mParticle.init(apiKey, window.mParticle.config);

        const data = getIdentityEvent(mockServer.requests, 'identify');
        data.known_identities.device_application_stamp.should.equal('foo-guid');

        done();
    });

    describe('identity caching', function() {
        beforeEach(function() {
            // Reset clock so we can use simple integers for time
            clock.restore();
            clock = sinon.useFakeTimers();
        });

        afterEach(function() {
            clock.restore();
            sinon.restore();
        });

        it('should use header `x-mp-max-age` as expiration date for cache', function() {
            // tick forward 1 second
            clock.tick(1);

            const X_MP_MAX_AGE = '1';

            mParticle._resetForTests(MPConfig);
            mockServer.respondWith(urls.identify, [
                200,
                { 'x-mp-max-age': X_MP_MAX_AGE },
                JSON.stringify({ mpid: testMPID, is_logged_in: false }),
            ]);

            mockServer.requests = [];

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

                // we previously ticked forward 1 second, so the expire timestamp
                // should be 1 second more than the X_MP_MAX_AGE
                expect(idCache[key].expireTimestamp).to.equal(
                    expectedExpiredTimestamp
                );
            }
        });

        it('should not call identify if no identities have changed within the expiration time', function() {
            mParticle._resetForTests(MPConfig);
            mockServer.respondWith(urls.identify, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, is_logged_in: false }),
            ]);

            mockServer.requests = [];

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';
            mParticle.init(apiKey, window.mParticle.config);

            const initialIdentityCall = getIdentityEvent(
                mockServer.requests,
                'identify'
            );

            initialIdentityCall.should.be.ok();
            mockServer.requests = [];
            const callback = sinon.spy();
            mParticle.Identity.identify(identities, callback);

            const duplicateIdentityCall = getIdentityEvent(
                mockServer.requests,
                'identify'
            );

            expect(duplicateIdentityCall).to.not.be.ok;

            // callback still gets called even if the identity call is not made`
            expect(callback.called).to.equal(true);
        });

        it('should call identify if no identities have changed but we are outside the expiration time', function() {
            const X_MP_MAX_AGE = '1';
            mParticle._resetForTests(MPConfig);
            mockServer.respondWith(urls.identify, [
                200,
                { 'x-mp-max-age': X_MP_MAX_AGE },
                JSON.stringify({ mpid: testMPID, is_logged_in: false }),
            ]);

            mockServer.requests = [];

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';
            mParticle.init(apiKey, window.mParticle.config);

            const initialIdentityCall = getIdentityEvent(
                mockServer.requests,
                'identify'
            );
            initialIdentityCall.should.be.ok();
            mockServer.requests = [];
            const callback = sinon.spy();

            // cached time will be 1000 if header returns '1'
            clock.tick(1001);
            mParticle.Identity.identify(identities, callback);
            const duplicateIdentityCall = getIdentityEvent(
                mockServer.requests,
                'identify'
            );

            expect(duplicateIdentityCall).to.be.ok;
            expect(callback.called).to.equal(true);
        });

        it('should not call login if previously cached within the expiration time', function() {
            mParticle._resetForTests(MPConfig);
            mockServer.respondWith(urls.identify, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, is_logged_in: false }),
            ]);

            mockServer.respondWith(urls.login, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, is_logged_in: false }),
            ]);

            mockServer.requests = [];

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';
            mParticle.init(apiKey, window.mParticle.config);

            const callback = sinon.spy();

            mParticle.Identity.login(identities, callback);
            const firstLoginCall = getIdentityEvent(
                mockServer.requests,
                'login'
            );

            expect(firstLoginCall).to.be.ok;
            mockServer.requests = [];

            mParticle.Identity.login(identities);
            const secondLoginCall = getIdentityEvent(
                mockServer.requests,
                'login'
            );

            expect(secondLoginCall).to.not.be.ok;
            expect(callback.called).to.equal(true);
        });

        it('should call login if duplicate login happens after expiration time', function() {
            const X_MP_MAX_AGE = '1';
            mParticle._resetForTests(MPConfig);

            mockServer.respondWith(urls.login, [
                200,
                { 'x-mp-max-age': X_MP_MAX_AGE },
                JSON.stringify({ mpid: testMPID, is_logged_in: false }),
            ]);

            mockServer.requests = [];

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';
            mParticle.init(apiKey, window.mParticle.config);

            const callback = sinon.spy();

            mParticle.Identity.login(identities);
            const firstLoginCall = getIdentityEvent(
                mockServer.requests,
                'login'
            );

            expect(firstLoginCall).to.be.ok;
            mockServer.requests = [];

            // cached time will be 1000 if header returns '1'
            clock.tick(1001);
            mParticle.Identity.login(identities, callback);
            const secondLoginCall = getIdentityEvent(
                mockServer.requests,
                'login'
            );

            expect(secondLoginCall).to.be.ok;
            expect(callback.called).to.equal(true);
        });

        it('should clear cache when modify is called', function() {
            mParticle._resetForTests(MPConfig);

            mockServer.respondWith(urls.identify, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, is_logged_in: false }),
            ]);
            mockServer.respondWith(urls.modify, [
                200,
                {},
                JSON.stringify({
                    change_results: [
                        {
                            identity_type: 'customerid',
                            modified_mpid: testMPID,
                        },
                    ],
                }),
            ]);

            mockServer.requests = [];

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';

            mParticle.init(apiKey, window.mParticle.config);

            let idCache = localStorage.getItem('mprtcl-v4_abcdef-id-cache');
            expect(idCache).to.be.ok;

            mParticle.Identity.modify({
                userIdentities: {
                    customerid: 'abc1',
                },
            });
            let secondIdCache = localStorage.getItem(
                'mprtcl-v4_abcdef-id-cache'
            );
            expect(secondIdCache).to.not.be.ok;
        });

        it('should clear cache when logout is called', function() {
            mParticle._resetForTests(MPConfig);

            mockServer.respondWith(urls.identify, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, is_logged_in: false }),
            ]);
            mockServer.respondWith(urls.logout, [
                200,
                {},
                JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
            ]);

            mockServer.requests = [];

            const identities = {
                userIdentities: {
                    customerid: 'abc',
                    email: 'test@gmail.com',
                },
            };

            mParticle.config.identifyRequest = identities;
            mParticle.config.flags.cacheIdentity = 'True';

            mParticle.init(apiKey, window.mParticle.config);

            let idCache = localStorage.getItem('mprtcl-v4_abcdef-id-cache');
            expect(idCache).to.be.ok;

            mParticle.Identity.logout();
            let secondIdCache = localStorage.getItem(
                'mprtcl-v4_abcdef-id-cache'
            );
            expect(secondIdCache).to.not.be.ok;
        });
    });

    describe('Deprecate Cart', function() {
        afterEach(function() {
            sinon.restore();
        });
        it("should deprecate the user's cart", function() {
            mParticle.init(apiKey, window.mParticle.config);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

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
        it('should deprecate add', function() {
            mParticle.init(apiKey, window.mParticle.config);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            const product = mParticle.eCommerce.createProduct(
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
                'Deprecated function Identity.getCurrentUser().getCart().add() will be removed in future releases'
            );
        });
        it('should deprecate remove', function() {
            mParticle.init(apiKey, window.mParticle.config);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            const product = mParticle.eCommerce.createProduct(
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
                'Deprecated function Identity.getCurrentUser().getCart().remove() will be removed in future releases'
            );
        });
        it('should deprecate clear', function() {
            mParticle.init(apiKey, window.mParticle.config);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getCart()
                .clear();
            mParticle.Identity.getCurrentUser()
                .getCart()
                .clear();

            bond.called.should.eql(true);
            // deprecates on both .getCart, then .add
            bond.callCount.should.equal(4);
            bond.getCalls()[1].args[0].should.eql(
                'Deprecated function Identity.getCurrentUser().getCart().clear() will be removed in future releases'
            );
        });

        it('should deprecate getCartProducts', function() {
            mParticle.init(apiKey, window.mParticle.config);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

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
                'Deprecated function Identity.getCurrentUser().getCart().getCartProducts() will be removed in future releases'
            );
        });
    });
});
