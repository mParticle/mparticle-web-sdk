import Utils from './config/utils';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';

import {
    urls,
    apiKey,
    testMPID,
    mParticle,
    MPConfig,
    localStorageProductsV4,
    LocalStorageProductsV4WithWorkSpaceName,
    workspaceCookieName,
    v4LSKey
} from './config/constants';
import { expect } from 'chai';
import {
    IGlobalStoreV2MinifiedKeys,
    IPersistence,
    IPersistenceMinified,
} from '../../src/persistence.interfaces';

const {
    findCookie,
    getLocalStorage,
    getLocalStorageProducts,
    setCookie,
    setLocalStorage,
    findBatch,
    fetchMockSuccess,
    hasIdentifyReturned,
    waitForCondition,
    hasIdentityCallInflightReturned,
} = Utils;

describe('persistence', () => {
    beforeEach(() => {
        fetchMock.post(urls.events, 200);

        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: false,
        });
    });

    afterEach(() => {
        fetchMock.restore();
    });

    describe('#setCookie', () => {
        it('should populate global storage attributes when setting cookie', async () => {
            mParticle.config.useCookieStorage = true;
            mParticle.init(apiKey, mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            // Set some test values in the store
            const store = mParticle.getInstance()._Store;
            store.sessionId = 'test-session-id';
            store.sessionAttributes = { testAttr: 'testValue' };
            store.localSessionAttributes = { cclick: true, segment: 'premium' };
            store.serverSettings = { testSetting: 'settingValue' };
            store.devToken = 'test-dev-token';
            store.clientId = 'test-client-id';
            store.deviceId = 'test-device-id';
            store.context = null;
            store.integrationAttributes = { 128: { MCID: 'test-integration-value' } };
            store.dateLastEventSent = new Date(1234567890);
            store.sessionStartDate = new Date(9876543210);
            store.SDKConfig.appVersion = '1.2.3';

            // Trigger cookie setting which calls setGlobalStorageAttributes
            mParticle.getInstance()._Persistence.setCookie();

            // Get the cookie and verify global storage attributes are set correctly
            const cookieData = findCookie();
            
            expect(cookieData.gs).to.be.ok;
            expect(cookieData.gs.sid, 'sid').to.equal('test-session-id');
            expect(cookieData.gs.sa, 'sa').to.deep.equal({ testAttr: 'testValue' });
            expect(cookieData.gs.lsa, 'lsa').to.deep.equal({ cclick: true, segment: 'premium' });
            expect(cookieData.gs.ss, 'ss').to.deep.equal({ testSetting: 'settingValue' });
            expect(cookieData.gs.dt, 'dt').to.equal('test-dev-token');
            expect(cookieData.gs.cgid, 'cgid').to.equal('test-client-id');
            expect(cookieData.gs.das, 'das').to.equal('test-device-id');
            expect(cookieData.gs.c, 'c').to.equal(undefined);
            expect(cookieData.gs.ia, 'ia').to.deep.equal({ 128: { MCID: 'test-integration-value' } });
            expect(cookieData.gs.les, 'les').to.equal(1234567890);
            expect(cookieData.gs.ssd, 'ssd').to.equal(9876543210);
            expect(cookieData.gs.av, 'av').to.equal('1.2.3');
            expect(cookieData.gs.ie, 'ie').to.equal(true);
        });
    });

    describe('#setLocalStorage', () => {
        it('should populate global storage attributes when setting localStorage', async () => {
            mParticle.config.useCookieStorage = false;
            mParticle.init(apiKey, mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            // Set some test values in the store
            const store = mParticle.getInstance()._Store;
            store.sessionId = 'test-session-id-ls';
            store.sessionAttributes = { testAttr: 'testValueLS' };
            store.localSessionAttributes = { cclick: false, segment: 'basic' };
            store.serverSettings = { testSetting: 'settingValueLS' };
            store.devToken = 'test-dev-token-ls';
            store.clientId = 'test-client-id-ls';
            store.deviceId = 'test-device-id-ls';
            store.context = null;
            store.integrationAttributes = { 256: { TestID: 'test-integration-ls' } };
            store.dateLastEventSent = new Date(1111111111);
            store.sessionStartDate = new Date(2222222222);
            store.SDKConfig.appVersion = '2.3.4';

            // Trigger localStorage setting which calls setGlobalStorageAttributes
            mParticle.getInstance()._Persistence.setLocalStorage();

            // Get the localStorage and verify global storage attributes are set correctly
            const localStorageData = mParticle.getInstance()._Persistence.getLocalStorage();
            
            expect(localStorageData.gs).to.be.ok;
            expect(localStorageData.gs.sid, 'sid').to.equal('test-session-id-ls');
            expect(localStorageData.gs.sa, 'sa').to.deep.equal({ testAttr: 'testValueLS' });
            expect(localStorageData.gs.lsa, 'lsa').to.deep.equal({ cclick: false, segment: 'basic' });
            expect(localStorageData.gs.ss, 'ss').to.deep.equal({ testSetting: 'settingValueLS' });
            expect(localStorageData.gs.dt, 'dt').to.equal('test-dev-token-ls');
            expect(localStorageData.gs.cgid, 'cgid').to.equal('test-client-id-ls');
            expect(localStorageData.gs.das, 'das').to.equal('test-device-id-ls');
            expect(localStorageData.gs.c, 'c').to.equal(undefined);
            expect(localStorageData.gs.ia, 'ia').to.deep.equal({ 256: { TestID: 'test-integration-ls' } });
            expect(localStorageData.gs.les, 'les').to.equal(1111111111);
            expect(localStorageData.gs.ssd, 'ssd').to.equal(2222222222);
            expect(localStorageData.gs.av, 'av').to.equal('2.3.4');
            expect(localStorageData.gs.ie, 'ie').to.equal(true);
        });
    });

    describe('#swapCurrentUser', () => {
        it('should not swap a user if there is no MPID change', async () => {
            mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
            const cookiesBefore = getLocalStorage();
            mParticle.getInstance()._Persistence.swapCurrentUser(testMPID, testMPID);
    
            const cookiesAfter = mParticle
                .getInstance()
                ._Persistence.getLocalStorage();
    
            cookiesBefore.cu.should.equal(cookiesAfter.cu);
    
        });
    
        it('should swap a user if there is an MPID change', async () => {
            mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
            const cookiesBefore = getLocalStorage();
    
            mParticle.getInstance()._Persistence.swapCurrentUser(testMPID, 'currentMPID');
    
            const cookiesAfter = mParticle
                .getInstance()
                ._Persistence.getLocalStorage();
            cookiesBefore.cu.should.equal(testMPID);
    
            cookiesAfter.cu.should.equal('currentMPID');
        });
    });

    it('should move new schema from cookies to localStorage with useCookieStorage = false', done => {
        mParticle._resetForTests(MPConfig);

        const cookies = JSON.stringify({
            gs: {
                sid: 'sid',
                les: new Date().getTime(),
            },
            testMPID: {
                ui: { 1: '123' },
            },
            cu: testMPID,
        });

        setCookie(workspaceCookieName, cookies);
        const beforeInitCookieData = findCookie(workspaceCookieName);
        mParticle.config.useCookieStorage = false;
        mParticle.init(apiKey, mParticle.config);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');
        const localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        const afterInitCookieData = findCookie();
        beforeInitCookieData[testMPID].ui.should.have.property('1', '123');
        localStorageData[testMPID].ua.should.have.property('gender', 'male');
        localStorageData[testMPID].ui.should.have.property('1', '123');
        expect(afterInitCookieData).to.not.be.ok;

        done();
    });

    it('should migrate localStorage to cookies with useCookieStorage = true', done => {
        mParticle._resetForTests(MPConfig);

        setLocalStorage();

        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, mParticle.config);

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');

        const localStorageData = localStorage.getItem('mprtcl-api');
        const cookieData = findCookie();

        expect(localStorageData).to.not.be.ok;
        cookieData[testMPID].ua.should.have.property('gender', 'male');
        cookieData[testMPID].ui.should.have.property(
            '1',
            'testuser@mparticle.com'
        );

        done();
    });

    it('localStorage - should key cookies on mpid on first run', async () => {
        mParticle.config.useCookieStorage = false;
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        const cookies1 = mParticle.getInstance()._Persistence.getLocalStorage();
        const props1 = [
            'ie',
            'sa',
            'lsa',
            'ua',
            'ui',
            'ss',
            'dt',
            'les',
            'av',
            'cgid',
            'das',
            'csd',
            'mpid',
            'cp',
            'sid',
            'c',
        ];
        props1.forEach(function(prop) {
            cookies1.should.not.have.property(prop);
        });
        cookies1.should.have.property('cu', testMPID, 'gs');
        cookies1.should.have.property(testMPID);

        const props2 = [
            'ie',
            'sa',
            'lsa',
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

        fetchMockSuccess(urls.login, {
            mpid: 'otherMPID', is_logged_in: false
        });

        mParticle.Identity.login();
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'otherMPID');

        const cookies2 = mParticle.getInstance()._Persistence.getLocalStorage();
        cookies2.should.have.property('cu', 'otherMPID', 'gs');
        props2.forEach(function(prop) {
            cookies1[testMPID].should.not.have.property(prop);
            cookies2[testMPID].should.not.have.property(prop);
            cookies2['otherMPID'].should.not.have.property(prop);
        });
    });

    it('cookies - should key cookies on mpid when there are no cookies yet', async () => {
        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        const cookies1 = findCookie();

        const props1 = [
            'ie',
            'sa',
            'ua',
            'ui',
            'ss',
            'dt',
            'les',
            'av',
            'cgid',
            'das',
            'csd',
            'mpid',
            'cp',
            'sid',
            'c',
        ];
        cookies1.should.have.property('cu', testMPID, 'gs');
        props1.forEach(function(prop) {
            cookies1.should.not.have.property(prop);
        });

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

        fetchMockSuccess(urls.login, {
            mpid: 'otherMPID', is_logged_in: false
        });

        mParticle.Identity.login();
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'otherMPID');

        const cookies2 = findCookie();

        cookies2.should.have.property('cu', 'otherMPID', testMPID);

        props2.forEach(function(prop) {
            cookies1[testMPID].should.not.have.property(prop);
            cookies2[testMPID].should.not.have.property(prop);
            cookies2['otherMPID'].should.not.have.property(prop);
        });
    });

    it('puts data into cookies when init-ing with useCookieStorage = true', async () => {
        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        const cookieData = findCookie();
        const localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        cookieData.should.have.properties(['gs', 'cu', testMPID]);

        const props = [
            'ie',
            'sa',
            'lsa',
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
            cookieData[testMPID].should.not.have.property(prop);
        });

        expect(localStorageData).to.not.be.ok;
    });

    it('puts data into localStorage when running initializeStorage with useCookieStorage = false', async () => {
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        const cookieData = mParticle.getInstance()._Persistence.getCookie();

        const localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        expect(localStorageData).to.include.keys(['gs', 'cu', testMPID]);

        const props = [
            'ie',
            'sa',
            'lsa',
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

        props.forEach(prop => {
            expect(localStorageData[testMPID]).to.not.have.property(prop);
        });

        expect(cookieData).to.not.be.ok;
    });

    it('puts data into cookies when updating persistence with useCookieStorage = true', async () => {
        let cookieData: Partial<IPersistenceMinified>;
        let localStorageData: Partial<IPersistenceMinified>;

        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        cookieData = findCookie();
        expect(cookieData).to.include.keys('gs', 'cu', testMPID);
        localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        const props = [
            'ie',
            'sa',
            'lsa',
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
            cookieData[testMPID].should.not.have.property(prop);
        });

        expect(localStorageData).to.not.be.ok;
    });

    it('puts data into localStorage when updating persistence with useCookieStorage = false', async () => {
        let cookieData: Partial<IPersistenceMinified>;
        let localStorageData: Partial<IPersistenceMinified>;

        // Flush out anything in expire before updating in order to silo testing persistence.update()
        // mParticle.config.useCookieStorage = false;
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        localStorageData = getLocalStorage();
        cookieData = findCookie();

        expect(localStorageData).to.have.include.keys('gs', 'cu', testMPID);

        const props = [
            'ie',
            'sa',
            'lsa',
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
            localStorageData[testMPID].should.not.have.property(prop);
        });

        expect(cookieData).to.not.be.ok;
    });

    it('should revert to cookie storage if localStorage is not available and useCookieStorage is set to false', async () => {
        mParticle._resetForTests(MPConfig);
        mParticle.getInstance()._Persistence.determineLocalStorageAvailability = () => {
            return false;
        };

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');

        const cookieData = findCookie();
        cookieData[testMPID].ua.should.have.property('gender', 'male');

        mParticle.getInstance()._Persistence.determineLocalStorageAvailability = () => {
            return true;
        };
    });

    it('should set certain attributes onto global localStorage, while setting user specific to the MPID', async () => {
        mParticle.config.useCookieStorage = false;
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');
        mParticle.setIntegrationAttribute(128, { MCID: 'abcedfg' });
        const data = getLocalStorage();

        data.cu.should.equal(testMPID);
        data.gs.should.have.properties([
            'sid',
            'ie',
            'dt',
            'cgid',
            'das',
            'les',
            'ia',
        ]);
        data.testMPID.ua.should.have.property('gender', 'male');
    });

    it('should save integration attributes properly on a page refresh', async () => {
        mParticle.setIntegrationAttribute(128, { MCID: 'abcedfg' });
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        mParticle.logEvent('Test Event');
        const testEvent = findBatch(fetchMock.calls(), 'Test Event');
        testEvent.integration_attributes.should.have.property('128');
        testEvent.integration_attributes['128'].should.have.property('MCID', 'abcedfg');
    });

    it('should set certain attributes onto global cookies, while setting user specific to the MPID', async () => {
        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');

        const data = findCookie();
        data.cu.should.equal(testMPID);

        data.gs.should.have.properties([
            'sid',
            'ie',
            'dt',
            'cgid',
            'das',
            'les',
        ]);
        data.testMPID.ua.should.have.property('gender', 'male');
    });

    it('should add new MPID to cookies when returned MPID does not match anything in cookies, and have empty UI and UA', async () => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        fetchMockSuccess(urls.login, {
            mpid: 'mpid1', is_logged_in: false
        });

        const user1 = { userIdentities: { customerid: 'customerid1' } };

        mParticle.Identity.login(user1);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'mpid1');
            
        const user1Result = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getUserIdentities();
        user1Result.userIdentities.customerid.should.equal('customerid1');

        fetchMockSuccess(urls.logout, {
            mpid: 'mpid2', is_logged_in: false
        });

        mParticle.Identity.logout();
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'mpid2');

        const user2Result = mParticle.getInstance().Identity.getCurrentUser();
        Object.keys(
            user2Result.getUserIdentities().userIdentities
        ).length.should.equal(0);

        const localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        localStorageData.cu.should.equal('mpid2');
        localStorageData.testMPID.should.not.have.property('ui');
        localStorageData.mpid1.ui[1].should.equal('customerid1');
        localStorageData.mpid2.should.not.have.property('ui');
    });

    it('should have the same currentUserMPID as the last browser session when a reload occurs and no identityRequest is provided', async () => {
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

        mParticle.init(apiKey, mParticle.config);

        await waitForCondition(hasIdentifyReturned);

        const data = mParticle.getInstance()._Persistence.getLocalStorage();
        data.cu.should.equal(testMPID);

        fetchMockSuccess(urls.login, {
            mpid: 'mpid1', is_logged_in: false
        });

        mParticle.Identity.login(user1);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'mpid1');
            
        const user1Data = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        user1Data.cu.should.equal('mpid1');

        fetchMockSuccess(urls.login, {
            mpid: 'mpid2', is_logged_in: false
        });

        mParticle.Identity.login(user2);

        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'mpid2');
            
        const user2Data = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        user2Data.cu.should.equal('mpid2');

        fetchMockSuccess(urls.login, {
            mpid: 'mpid3', is_logged_in: false
        });

        mParticle.Identity.login(user3);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'mpid3');
            
        const user3data = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        user3data.cu.should.equal('mpid3');

        mParticle.init(apiKey, mParticle.config);
        const data3 = mParticle.getInstance()._Persistence.getLocalStorage();
        data3.cu.should.equal('mpid3');

    });

    it('should transfer user attributes and revert to user identities properly', async () => {
        const user1 = { userIdentities: { customerid: 'customerid1' } };

        const user2 = { userIdentities: { customerid: 'customerid2' } };
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        // set user attributes on testMPID
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('test1', 'test1');

        const data = getLocalStorage();

        data.cu.should.equal(testMPID);
        data.testMPID.ua.should.have.property('test1', 'test1');
        
        fetchMockSuccess(urls.login, {
            mpid: 'mpid1', is_logged_in: false
        });

        fetchMockSuccess('https://identity.mparticle.com/v1/mpid1/modify', {
            mpid: 'mpid1', is_logged_in: false
        });
        

        mParticle.Identity.login(user1);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'mpid1');
                            
        // modify user1's identities
        mParticle.Identity.modify({
            userIdentities: { email: 'email@test.com' },
        });
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);

        // set user attributes on mpid1
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('test2', 'test2');
        const user1Data = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        user1Data.cu.should.equal('mpid1');
        user1Data.mpid1.ua.should.have.property('test2', 'test2');
        user1Data.mpid1.ui.should.have.property('7', 'email@test.com');
        user1Data.mpid1.ui.should.have.property('1', 'customerid1');

        fetchMockSuccess(urls.login, {
            mpid: 'mpid2', is_logged_in: false
        });

        mParticle.Identity.login(user2);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'mpid2');

        // set user attributes on user 2
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('test3', 'test3');
        const user2Data = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        user2Data.cu.should.equal('mpid2');
        user2Data.mpid2.ui.should.have.property('1', 'customerid2');
        user2Data.mpid2.ua.should.have.property('test3', 'test3');

        fetchMockSuccess(urls.login, {
            mpid: 'mpid1', is_logged_in: false
        });

        mParticle.Identity.login(user1);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'mpid1');
        const user1RelogInData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        user1RelogInData.cu.should.equal('mpid1');
        user1RelogInData.mpid1.ui.should.have.property('1', 'customerid1');
        user1RelogInData.mpid1.ui.should.have.property('7', 'email@test.com');

        Object.keys(user1RelogInData.mpid1.ui).length.should.equal(2);
        user1RelogInData.mpid1.ua.should.have.property('test2', 'test2');

    });

    it('should remove MPID as keys if the cookie size is beyond the setting', async () => {
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        mParticle.config.maxCookieSize = 700;

        const cookies: IPersistenceMinified = {
            gs: {
                csm: ['mpid1', 'mpid2', 'mpid3'],
                sid: 'abcd',
                ie: true,
                dt: apiKey,
                cgid: 'cgid1',
                das: 'das1',
            } as IGlobalStoreV2MinifiedKeys,
            cu: 'mpid3',
            l: false,
            mpid1: {
                ua: {
                    gender: 'female',
                    age: 29,
                    height: '65',
                    color: 'blue',
                    id: 'abcdefghijklmnopqrstuvwxyz',
                },
                ui: { 1: 'customerid123', 2: 'facebookid123' },
            },
            mpid2: {
                ua: { gender: 'male', age: 20, height: '68', color: 'red' },
                ui: {
                    1: 'customerid234',
                    2: 'facebookid234',
                    id: 'abcdefghijklmnopqrstuvwxyz',
                },
            },
            mpid3: {
                ua: { gender: 'male', age: 20, height: '68', color: 'red' },
                ui: {
                    1: 'customerid234',
                    2: 'facebookid234',
                    id: 'abcdefghijklmnopqrstuvwxyz',
                },
            },
        };
        const expires = new Date(
            new Date().getTime() + 365 * 24 * 60 * 60 * 1000
        ).toUTCString();
        const cookiesWithExpiration = mParticle
            .getInstance()
            ._Persistence.reduceAndEncodePersistence(
                cookies,
                expires,
                'testDomain',
                mParticle.config.maxCookieSize
            );
        const cookiesWithoutExpiration = cookiesWithExpiration.slice(
            0,
            cookiesWithExpiration.indexOf(';expires')
        );
        const cookiesResult = JSON.parse(
            mParticle
                .getInstance()
                // TODO: Refactor or rename this to highlight that it is
                //       a string function
                ._Persistence.decodePersistence(cookiesWithoutExpiration)
        );
        expect(cookiesResult['mpid1']).to.not.be.ok;
        expect(cookiesResult['mpid2']).be.ok;
        expect(cookiesResult['mpid3']).be.ok;
        cookiesResult.gs.csm.length.should.equal(3);
        cookiesResult.gs.csm[0].should.equal('mpid1');
        cookiesResult.gs.csm[1].should.equal('mpid2');
        cookiesResult.gs.csm[2].should.equal('mpid3');
    });

    it('integration test - will change the order of the CSM when a previous MPID logs in again', async () => {
        mParticle.config.useCookieStorage = true;
        mParticle.config.maxCookieSize = 1000;
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1'
            }
        }

        fetchMockSuccess(urls.login, {
            mpid: 'MPID1', is_logged_in: false
        });

        mParticle.Identity.login(userIdentities1);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1');

        let cookieData: Partial<IPersistenceMinified> = findCookie();
        cookieData.gs.csm[0].should.be.equal('testMPID');
        cookieData.gs.csm[1].should.be.equal('MPID1');

        fetchMockSuccess(urls.login, {
            mpid: 'MPID2', is_logged_in: false
        });

        const userIdentities2 = {
            userIdentities: {
                customerid: 'foo2',
            },
        };

        mParticle.Identity.login(userIdentities2);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID2');

        cookieData = findCookie();
        cookieData.gs.csm[0].should.be.equal('testMPID');
        cookieData.gs.csm[1].should.be.equal('MPID1');
        cookieData.gs.csm[2].should.be.equal('MPID2');

        fetchMockSuccess(urls.login, {
            mpid: 'testMPID', is_logged_in: true
        });

        const userIdentities3 = {
            userIdentities: {
                customerid: 'foo3',
            },
        };

        mParticle.Identity.login(userIdentities3);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'testMPID');

        cookieData = findCookie();
        cookieData.gs.csm[0].should.be.equal('MPID1');
        cookieData.gs.csm[1].should.be.equal('MPID2');
        cookieData.gs.csm[2].should.be.equal('testMPID');

    });

    it('integration test - should remove a previous MPID as a key from cookies if new user attribute added and exceeds the size of the max cookie size', async () => {
        mParticle.config.useCookieStorage = true;
        mParticle.config.maxCookieSize = 700;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'female');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 30);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '68');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'blue');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id1');

        fetchMockSuccess(urls.login, {
            mpid: 'MPID1', is_logged_in: false
        });

        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1',
            },
        };

        mParticle.Identity.login(userIdentities1);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1');

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 30);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '60');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'green');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id2');

        let cookieData: Partial<IPersistenceMinified> = findCookie();
        cookieData.gs.csm[0].should.equal('testMPID');
        cookieData.gs.csm[1].should.equal('MPID1');

        fetchMockSuccess(urls.login, {
            mpid: 'MPID2', is_logged_in: false
        });

        const userIdentities2 = {
            userIdentities: {
                customerid: 'foo2',
            },
        };

        mParticle.Identity.login(userIdentities2);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID2');

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'female');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 45);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '80');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'green');

        //this last one puts us over the maxcookiesize threshold and removes 'testMPID' from cookie
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id3');

        cookieData = findCookie();

        expect(cookieData['testMPID']).to.not.be.ok;
        cookieData['MPID1'].ua.should.have.property('id', 'id2');
        cookieData['MPID1'].ua.should.have.property('gender', 'male');
        cookieData['MPID1'].ua.should.have.property('age', 30);
        cookieData['MPID1'].ua.should.have.property('height', '60');
        cookieData['MPID1'].ua.should.have.property('color', 'green');
        cookieData['MPID2'].ua.should.have.property('id', 'id3');
        cookieData['MPID2'].ua.should.have.property('gender', 'female');
        cookieData['MPID2'].ua.should.have.property('age', 45);
        cookieData['MPID2'].ua.should.have.property('height', '80');
        cookieData['MPID2'].ua.should.have.property('color', 'green');
    });

    it('should remove a random MPID from storage if there is a new session and there are no other MPIDs in currentSessionMPIDs except for the currentUser mpid', async () => {
        mParticle.config.maxCookieSize = 400;

        mParticle.init(apiKey, window.mParticle.config);

        const cookies: IPersistenceMinified = {
            gs: {
                csm: ['mpid3'],
                sid: 'abcd',
                ie: true,
                dt: apiKey,
                cgid: 'cgid1',
                das: 'das1',
            } as IGlobalStoreV2MinifiedKeys,
            cu: 'mpid3',
            l: false,
            mpid1: {
                ua: {
                    gender: 'female',
                    age: 29,
                    height: '65',
                    color: 'blue',
                    id: 'abcdefghijklmnopqrstuvwxyz',
                },
                ui: { 1: 'customerid123', 2: 'facebookid123' },
            },
            mpid2: {
                ua: { gender: 'male', age: 20, height: '68', color: 'red' },
                ui: {
                    1: 'customerid234',
                    2: 'facebookid234',
                    id: 'abcdefghijklmnopqrstuvwxyz',
                },
            },
            mpid3: {
                ua: { gender: 'male', age: 20, height: '68', color: 'red' },
                ui: {
                    1: 'customerid234',
                    2: 'facebookid234',
                    id: 'abcdefghijklmnopqrstuvwxyz',
                },
            },
        };

        const expires = new Date(
            new Date().getTime() + 365 * 24 * 60 * 60 * 1000
        ).toString();

        const cookiesWithExpiration = mParticle
            .getInstance()
            ._Persistence.reduceAndEncodePersistence(
                cookies,
                expires,
                'testDomain',
                mParticle.config.maxCookieSize
            );
        const cookiesWithoutExpiration = cookiesWithExpiration.slice(
            0,
            cookiesWithExpiration.indexOf(';expires')
        );
        const cookiesResult = JSON.parse(
            mParticle
                .getInstance()
                ._Persistence.decodePersistence(cookiesWithoutExpiration)
        );

        expect(cookiesResult['mpid1']).to.not.be.ok;
        expect(cookiesResult['mpid2']).to.not.be.ok;
        expect(cookiesResult['mpid3']).be.ok;
        cookiesResult.gs.csm[0].should.equal('mpid3');
        cookiesResult.should.have.property('mpid3');

        // TODO: Refactor tests to include this in setup/teardown
        mParticle.config.maxCookieSize = 3000;
    });

    it('integration test - should remove a random MPID from storage if there is a new session and there are no MPIDs in currentSessionMPIDs', async () => {
        mParticle.config.useCookieStorage = true;
        mParticle.config.maxCookieSize = 600;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'female');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 30);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '68');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'blue');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id1');

        fetchMockSuccess(urls.login, {
            mpid: 'MPID1', is_logged_in: false
        });

        mParticle.Identity.login();
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1');

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 30);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '60');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'green');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id2');

        let cookieData: Partial<IPersistenceMinified> = findCookie();

        cookieData.gs.csm[0].should.equal('testMPID');
        cookieData.gs.csm[1].should.equal('MPID1');

        fetchMockSuccess(urls.login, {
            mpid: 'MPID2', is_logged_in: false
        });

        mParticle.endSession();
        mParticle.Identity.login();
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID2');

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'female');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 45);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '80');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'green');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id3');

        cookieData = findCookie();

        expect(cookieData['testMPID']).to.not.be.ok;
        expect(cookieData['MPID1'], 'MPID1 should have UA in the cookie').to.have.property('ua');
        cookieData['MPID1'].ua.should.have.property('id', 'id2');
        cookieData['MPID1'].ua.should.have.property('gender', 'male');
        cookieData['MPID1'].ua.should.have.property('age', 30);
        cookieData['MPID1'].ua.should.have.property('height', '60');
        cookieData['MPID1'].ua.should.have.property('color', 'green');

        expect(cookieData['MPID2'], 'MPID2 should have UA in the cookie').to.have.property('ua');
        cookieData['MPID2'].ua.should.have.property('id', 'id3');
        cookieData['MPID2'].ua.should.have.property('gender', 'female');
        cookieData['MPID2'].ua.should.have.property('age', 45);
        cookieData['MPID2'].ua.should.have.property('height', '80');
        cookieData['MPID2'].ua.should.have.property('color', 'green');
    });

    it('integration test - migrates a large localStorage cookie to cookies and properly remove MPIDs', async () => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;
        mParticle.config.maxCookieSize = 700;

        mParticle.init(apiKey, mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'female');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 30);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '68');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'blue');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id1');

        fetchMockSuccess(urls.login, {
            mpid: 'MPID1', is_logged_in: false
        });

        mParticle.Identity.login();
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1');

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 30);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '60');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'green');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id2');

            fetchMockSuccess(urls.login, {
                mpid: 'MPID2', is_logged_in: false
            });

        mParticle.Identity.login();
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID2');

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'female');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 45);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '80');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'green');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id3');

        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        
        const cookieData = findCookie();

        expect(cookieData['testMPID']).to.not.be.ok;
        cookieData['MPID1'].ua.should.have.property('id', 'id2');
        cookieData['MPID2'].ua.should.have.property('id');
    });

    it('integration test - migrates all cookie MPIDs to localStorage', async () => {
        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'female');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 30);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '68');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'blue');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id1');

            fetchMockSuccess(urls.login, {
                mpid: 'MPID1', is_logged_in: false
            });

        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1',
            },
        };
        mParticle.Identity.login(userIdentities1);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1');

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 30);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '60');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'green');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id2');

        fetchMockSuccess(urls.login, {
            mpid: 'MPID2', is_logged_in: false
        });

        const userIdentities2 = {
            userIdentities: {
                customerid: 'foo2',
            },
        };
        mParticle.Identity.login(userIdentities2);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID2');

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'female');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 45);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '80');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'green');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id3');

        mParticle.config.useCookieStorage = false;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        const lsData = getLocalStorage(v4LSKey);

        lsData.should.have.properties([
            'gs',
            'cu',
            'testMPID',
            'MPID1',
            'MPID2',
        ]);
        lsData['testMPID'].ua.should.have.properties([
            'gender',
            'age',
            'height',
            'color',
            'id',
        ]);
        lsData['MPID1'].ua.should.have.properties([
            'gender',
            'age',
            'height',
            'color',
            'id',
        ]);
        lsData['MPID2'].ua.should.have.properties([
            'gender',
            'age',
            'height',
            'color',
            'id',
        ]);
    });

    it('integration test - migrates all LS MPIDs to cookies', async () => {
        mParticle.config.useCookieStorage = false;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        // testMPID
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'female');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 30);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '68');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'blue');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id1');

        fetchMockSuccess(urls.login, {
            mpid: 'MPID1', is_logged_in: false
        });

        const userIdentities1 = {
            userIdentities: {
                customerid: 'foo1',
            },
        };

        mParticle.Identity.login(userIdentities1);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1');

        // MPID1
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 30);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '60');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'green');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id2');

        fetchMockSuccess(urls.login, {
            mpid: 'MPID2', is_logged_in: false
        });

        const userIdentities2 = {
            userIdentities: {
                customerid: 'foo2',
            },
        };

        mParticle.Identity.login(userIdentities2);
        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID2');

        // MPID2
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'female');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('age', 45);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('height', '80');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'green');
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('id', 'id3');

        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        const cookieData = findCookie();

        cookieData.should.have.properties([
            'gs',
            'cu',
            'testMPID',
            'MPID1',
            'MPID2',
        ]);
        cookieData['testMPID'].ua.should.have.properties([
            'gender',
            'age',
            'height',
            'color',
            'id',
        ]);
        cookieData['MPID1'].ua.should.have.properties([
            'gender',
            'age',
            'height',
            'color',
            'id',
        ]);
        cookieData['MPID2'].ua.should.have.properties([
            'gender',
            'age',
            'height',
            'color',
            'id',
        ]);
    });

    it('integration test - clears and creates new LS on reload if LS is corrupt', async () => {
        const les = new Date().getTime();

        //an extra apostrophe is added to ua here to force a corrupt cookie. On init, cookies will clear and there will be a new cgid, sid, and das to exist
        const LS =
            "{'sid':'1992BDBB-AD74-49DB-9B20-5EC8037E72DE'|'ie':1|'ua':'eyJ0ZXN'0Ijoiwq7igJkifQ=='|'ui':'eyIzIjoiwq7igJkifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjI6MjI6MTAuMjU0MDcyOVoiLCJWYWx1ZSI6Imc9NjhjMmJhMzktYzg2OS00MTZhLWE4MmMtODc4OWNhZjVmMWU3JnU9NDE3NjQyNTYyMTQ0MTEwODk2OCZjcj00NTgxOTgyIn19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537222930186|'cgid':'4ebad5b4-8ed1-4275-8455-838a2e3aa5c0'|'das':'68c2ba39-c869-416a-a82c-8789caf5f1e7'|'mpid':'4176425621441108968'}";
        setLocalStorage(v4LSKey, LS, true);

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        const sessionId = mParticle.sessionManager.getSession();
        const das = mParticle.getDeviceId();
        const cgid = mParticle.getInstance()._Persistence.getLocalStorage().gs
            .cgid;
        sessionId.should.not.equal('1992BDBB-AD74-49DB-9B20-5EC8037E72DE');
        das.should.not.equal('68c2ba39-c869-416a-a82c-8789caf5f1e7');
        cgid.should.not.equal('4ebad5b4-8ed1-4275-8455-838a2e3aa5c0');
    });

    it('integration test - clears and creates new cookies on reload if cookies is corrupt', async () => {
        const les = new Date().getTime();

        //an extra apostrophe is added to ua here to force a corrupt cookie. On init, cookies will clear and there will be a new cgid, sid, and das to exist
        const cookies =
            "{'sid':'1992BDBB-AD74-49DB-9B20-5EC8037E72DE'|'ie':1|'ua':'eyJ0ZXN'0Ijoiwq7igJkifQ=='|'ui':'eyIzIjoiwq7igJkifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjI6MjI6MTAuMjU0MDcyOVoiLCJWYWx1ZSI6Imc9NjhjMmJhMzktYzg2OS00MTZhLWE4MmMtODc4OWNhZjVmMWU3JnU9NDE3NjQyNTYyMTQ0MTEwODk2OCZjcj00NTgxOTgyIn19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537222930186|'cgid':'4ebad5b4-8ed1-4275-8455-838a2e3aa5c0'|'das':'68c2ba39-c869-416a-a82c-8789caf5f1e7'|'mpid':'4176425621441108968'}";
        setCookie(workspaceCookieName, cookies, true);

        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, mParticle.config);

        await waitForCondition(hasIdentifyReturned);

        const sessionId = mParticle.sessionManager.getSession();
        const das = mParticle.getDeviceId();
        const cgid = mParticle.getInstance()._Persistence.getCookie().gs.cgid;
        sessionId.should.not.equal('1992BDBB-AD74-49DB-9B20-5EC8037E72DE');
        das.should.not.equal('68c2ba39-c869-416a-a82c-8789caf5f1e7');
        cgid.should.not.equal('4ebad5b4-8ed1-4275-8455-838a2e3aa5c0');
    });

    it('integration test - clears LS products on reload if LS products are corrupt', async () => {
        // randomly added gibberish to a Base64 encoded cart product array to force a corrupt product array
        const products =
            'eyItOTE4MjY2NTAzNTA1ODg1NjAwMyI6eyasdjfiojasdifojfsdfJjcCI6W3siTmFtZSI6ImFuZHJvaWQiLCJTa3UiOiI1MTg3MDkiLCJQcmljZSI6MjM0LCJRdWFudGl0eSI6MSwiQnJhbmQiOm51bGwsIlZhcmlhbnQiOm51bGwsIkNhdGVnb3J5IjpudWxsLCJQb3NpdGlvbiI6bnVsbCwiQ291cG9uQ29kZSI6bnVsbCwiVG90YWxBbW91bnQiOjIzNCwiQXR0cmlidXRlcyI6eyJwcm9kYXR0cjEiOiJoaSJ9fSx7Ik5hbWUiOiJ3aW5kb3dzIiwiU2t1IjoiODMzODYwIiwiUHJpY2UiOjM0NSwiUXVhbnRpdHkiOjEsIlRvdGFsQW1vdW50IjozNDUsIkF0dHJpYnV0ZXMiOm51bGx9XX19';

        localStorage.setItem(localStorageProductsV4, products);
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        const productsAfterInit = getLocalStorageProducts().testMPID;
        expect(productsAfterInit.length).to.not.be.ok;
    });

    it('should save products to persistence correctly when adding and removing products', async () => {
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        const iphone = mParticle.eCommerce.createProduct(
            'iphone',
            'iphonesku',
            599,
            1,
            'iphone variant',
            'iphonecategory',
            'iphonebrand',
            null,
            'iphonecoupon',
            { iphoneattr1: 'value1', iphoneattr2: 'value2' }
        );
        mParticle.eCommerce.Cart.add(iphone, true);

        let ls = localStorage.getItem(LocalStorageProductsV4WithWorkSpaceName);
        const parsedProducts = JSON.parse(atob(ls));
        // parsedProducts should just have key of testMPID with value of cp with a single product
        Object.keys(parsedProducts).length.should.equal(1);
        parsedProducts['testMPID'].should.have.property('cp');
        parsedProducts['testMPID'].cp.length.should.equal(1);

        mParticle.eCommerce.Cart.remove(iphone, true);
        ls = localStorage.getItem(LocalStorageProductsV4WithWorkSpaceName);
        const parsedProductsAfter = JSON.parse(atob(ls));
        // parsedProducts should just have key of testMPID with value of cp with no products

        Object.keys(parsedProductsAfter).length.should.equal(1);
        parsedProductsAfter['testMPID'].should.have.property('cp');
        parsedProductsAfter['testMPID'].cp.length.should.equal(0);
    });

    it('should only set setFirstSeenTime() once', async () => {
        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            previous: {},
            previous_set: {
                fst: 100,
            },
            cu: 'current',
        });

        setCookie(workspaceCookieName, cookies);

        // TODO: Refactor this into setup/teardown
        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);

        mParticle.getInstance()._Persistence.setFirstSeenTime('current', 10000);
        const currentFirstSeenTime = mParticle
            .getInstance()
            ._Persistence.getFirstSeenTime('current');
        mParticle.getInstance()._Persistence.setFirstSeenTime('current', 2);
        mParticle
            .getInstance()
            ._Persistence.getFirstSeenTime('current')
            .should.equal(currentFirstSeenTime);

        mParticle.getInstance()._Persistence.setFirstSeenTime('previous', 10);
        mParticle
            .getInstance()
            ._Persistence.getFirstSeenTime('previous')
            .should.equal(10);
        mParticle.getInstance()._Persistence.setFirstSeenTime('previous', 20);
        mParticle
            .getInstance()
            ._Persistence.getFirstSeenTime('previous')
            .should.equal(10);

        mParticle
            .getInstance()
            ._Persistence.getFirstSeenTime('previous_set')
            .should.equal(100);
        mParticle
            .getInstance()
            ._Persistence.setFirstSeenTime('previous_set', 200);
        mParticle
            .getInstance()
            ._Persistence.getFirstSeenTime('previous_set')
            .should.equal(100);
    });

    it('should properly set setLastSeenTime()', async () => {
        mParticle._resetForTests(MPConfig);

        const cookies = JSON.stringify({
            gs: {
                sid: 'lst Test',
                les: new Date().getTime(),
            },
            previous: {},
            previous_set: {
                lst: 10,
            },
            cu: 'current',
        });

        setCookie(workspaceCookieName, cookies, true);

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);

        const clock = sinon.useFakeTimers();
        clock.tick(100);

        const persistence: IPersistence = mParticle.getInstance()._Persistence;

        persistence.setLastSeenTime('previous', 1);
        expect(persistence.getLastSeenTime('previous')).to.equal(1);

        persistence.setLastSeenTime('previous', 2);
        expect(persistence.getLastSeenTime('previous')).to.equal(2);

        expect(persistence.getLastSeenTime('previous_set')).to.equal(10);
        persistence.setLastSeenTime('previous_set', 20);
        expect(persistence.getLastSeenTime('previous_set')).to.equal(20);

        expect(persistence.getLastSeenTime('current')).to.equal(100);
        persistence.setLastSeenTime('current', 200);
        //lastSeenTime for the current user should always reflect the current time,
        //even if was set
        expect(persistence.getLastSeenTime('current')).to.equal(100);
        clock.tick(50);
        expect(persistence.getLastSeenTime('current')).to.equal(150);

        clock.restore();
    });

    it("should set firstSeenTime() for a user that doesn't have storage yet", done => {
        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            cu: 'test',
        });

        setCookie(workspaceCookieName, cookies, true);
        // FIXME: Should this be in configs or global?
        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, mParticle.config);

        mParticle.getInstance()._Persistence.setFirstSeenTime('1', 1);
        mParticle
            .getInstance()
            ._Persistence.getFirstSeenTime('1')
            .should.equal(1);
        //firstSeenTime should ignore subsiquent calls after it has been set
        mParticle.getInstance()._Persistence.setFirstSeenTime('2', 2);
        mParticle
            .getInstance()
            ._Persistence.getFirstSeenTime('1')
            .should.equal(1);

        done();
    });

    it('fst should be set when the user does not change, after an identify request', async () => {
        const cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            current: {},
            cu: 'current',
        });

        fetchMockSuccess(urls.identify, {
            mpid: 'current',
            is_logged_in: false,
        });


        setCookie(workspaceCookieName, cookies, true);
        // FIXME: Should this be in configs or global?
        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        expect(
            mParticle.getInstance()._Persistence.getFirstSeenTime('current')
        ).to.equal(null);

        mParticle.Identity.identify();
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);

        expect(
            mParticle.getInstance()._Persistence.getFirstSeenTime('current')
        ).to.not.equal(null);
    });

    it('lastSeenTime should be null for users in storage without an lst value', async () => {
        const cookies = JSON.stringify({
            gs: {
                sid: 'lst Test',
                les: new Date().getTime(),
            },
            previous: {},
            cu: 'current',
        });
        setCookie(workspaceCookieName, cookies, true);
        // FIXME: config or global?
        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);
        expect(
            mParticle.getInstance()._Persistence.getFirstSeenTime('previous')
        ).to.equal(null);

    });

    it('should save to persistence a device id set with setDeviceId', async () => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(hasIdentityCallInflightReturned);
        mParticle.setDeviceId('foo-guid');

        mParticle
            .getInstance()
            ._Persistence.getLocalStorage()
            .gs.das.should.equal('foo-guid');
    });

    it('should save to persistence a device id set via mParticle.config', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.deviceId = 'foo-guid';
        mParticle.init(apiKey, mParticle.config);

        mParticle
            .getInstance()
            ._Persistence.getLocalStorage()
            .gs.das.should.equal('foo-guid');

        done();
    });

    it('should prioritize device id set via mParticle.config instead of local storage', done => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, mParticle.config);

        const initialDeviceId = mParticle.getInstance().getDeviceId();

        expect(initialDeviceId).to.not.be.null;

        const expectedDeviceId = 'guid-via-config';

        mParticle.config.deviceId = expectedDeviceId;

        mParticle.init(apiKey, mParticle.config);

        expect(
            mParticle.getInstance().getDeviceId(),
            'Device ID should match guid passed in via config'
        ).to.equal(expectedDeviceId);

        expect(
            initialDeviceId,
            'New Device ID should not match Old Device Id'
        ).to.not.equal(expectedDeviceId);

        expect(
            mParticle.getInstance()._Persistence.getLocalStorage().gs.das,
            'Device ID stored in Local Storage should be the new Device ID'
        ).to.equal(expectedDeviceId);

        done();
    });

    // this test confirms a bug has been fixed where setting a user attribute, then user attribute list
    // with a special character in it results in a cookie decode error, which only happened
    // when config.useCookieStorage was true
    it('should save special characters to persistence when on cookies or local storage', async () => {
        fetchMockSuccess(urls.login, {
            mpid: testMPID,
            is_logged_in: false,
        });

        // first test local storage
        mParticle.config.useCookieStorage = false;

        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);

        const user = mParticle.Identity.getCurrentUser();

        user.setUserAttribute('ua-1', 'a');
        user.setUserAttributeList('ua-list', ['a\\', '<b>']);

        user.getAllUserAttributes()['ua-list'][0].should.equal('a\\');
        user.getAllUserAttributes()['ua-list'][1].should.equal('<b>');
        user.getAllUserAttributes()['ua-1'].should.equal('a');

        mParticle._resetForTests(MPConfig);

        // then test cookie storage
        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => window.mParticle.getInstance()?._Store?.identityCallInFlight === false);

        const user2 = mParticle.Identity.getCurrentUser();

        user2.setUserAttribute('ua-1', 'a');
        user2.setUserAttributeList('ua-list', ['a\\', '<b>']);

        user2.getAllUserAttributes()['ua-list'][0].should.equal('a\\');
        user2.getAllUserAttributes()['ua-list'][1].should.equal('<b>');
        user2.getAllUserAttributes()['ua-1'].should.equal('a');
    });

    describe('noFunctional privacy flag', () => {
        beforeEach(() => {
            mParticle._resetForTests(MPConfig);
        });

        describe('set to true', () => {
            beforeEach(() => {
                mParticle.config.launcherOptions = { noFunctional: true };
            });

            it('should NOT store cookie when useCookieStorage = true', async () => {
                mParticle.config.useCookieStorage = true;

                mParticle.init(apiKey, mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                mParticle.getInstance()._Persistence.update();

                expect(findCookie()).to.not.be.ok;
            });

            it('should NOT write localStorage when useCookieStorage = false', async () => {
                mParticle.config.useCookieStorage = false;

                mParticle.init(apiKey, mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                mParticle.getInstance()._Persistence.update();

                expect(getLocalStorage()).to.not.be.ok;
            });
        });

        describe('set to false', () => {
            beforeEach(() => {
                mParticle.config.launcherOptions = { noFunctional: false };
            });
            
            it('should store cookie when useCookieStorage = true', async () => {
                mParticle.config.useCookieStorage = true;

                mParticle.init(apiKey, mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                mParticle.getInstance()._Persistence.update();

                expect(findCookie()).to.be.ok;
            });

            it('should store localStorage when useCookieStorage = false', async () => {
                mParticle.config.useCookieStorage = false;

                mParticle.init(apiKey, mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                mParticle.getInstance()._Persistence.update();

                expect(getLocalStorage()).to.be.ok;
            });
        });

        describe('is false by default', () => {
            it('should store cookie when useCookieStorage = true', async () => {
                mParticle.config.useCookieStorage = true;

                mParticle.init(apiKey, mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                mParticle.getInstance()._Persistence.update();

                expect(findCookie()).to.be.ok;
            });

            it('should store localStorage when useCookieStorage = false', async () => {
                mParticle.config.useCookieStorage = false;

                mParticle.init(apiKey, mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                mParticle.getInstance()._Persistence.update();

                expect(getLocalStorage()).to.be.ok;
            });
        });
    });
});