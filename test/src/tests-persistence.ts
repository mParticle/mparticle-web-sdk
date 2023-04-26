import Utils from './utils';
import sinon from 'sinon';

import {
    urls,
    apiKey,
    testMPID,
    mParticle,
    MPConfig,
    localStorageProductsV4,
    LocalStorageProductsV4WithWorkSpaceName,
    workspaceCookieName,
    v4LSKey,
} from './config';
import { expect } from 'chai';
import {
    IGlobalStoreV2MinifiedKeys,
    IPersistence,
    IPersistenceMinified,
} from '../../src/persistence.interfaces';
import { ConsentState } from '@mparticle/web-sdk';

const {
    findCookie,
    getLocalStorage,
    getLocalStorageProducts,
    setCookie,
    setLocalStorage,
    getEvent,
} = Utils;

let mockServer;

describe('migrations and persistence-related', () => {
    beforeEach(() => {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.eventsV2, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, Store: {} }),
        ]);
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.init(apiKey, mParticle.config);
    });

    afterEach(() => {
        mockServer.restore();
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

    it('localStorage - should key cookies on mpid on first run', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;
        mParticle.init(apiKey, mParticle.config);
        const cookies1 = mParticle.getInstance()._Persistence.getLocalStorage();
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
        props1.forEach(function(prop) {
            cookies1.should.not.have.property(prop);
        });
        cookies1.should.have.property('cu', testMPID, 'gs');
        cookies1.should.have.property(testMPID);

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

        const cookies2 = mParticle.getInstance()._Persistence.getLocalStorage();
        cookies2.should.have.property('cu', 'otherMPID', 'gs');
        props2.forEach(function(prop) {
            cookies1[testMPID].should.not.have.property(prop);
            cookies2[testMPID].should.not.have.property(prop);
            cookies2['otherMPID'].should.not.have.property(prop);
        });

        done();
    });

    it('cookies - should key cookies on mpid when there are no cookies yet', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, mParticle.config);

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login();
        const cookies2 = findCookie();

        cookies2.should.have.property('cu', 'otherMPID', testMPID);

        props2.forEach(function(prop) {
            cookies1[testMPID].should.not.have.property(prop);
            cookies2[testMPID].should.not.have.property(prop);
            cookies2['otherMPID'].should.not.have.property(prop);
        });

        done();
    });

    it('puts data into cookies when init-ing with useCookieStorage = true', done => {
        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, mParticle.config);

        const cookieData = findCookie();

        const localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        cookieData.should.have.properties(['gs', 'cu', testMPID]);

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
            cookieData[testMPID].should.not.have.property(prop);
        });

        expect(localStorageData).to.not.be.ok;

        done();
    });

    it('puts data into localStorage when running initializeStorage with useCookieStorage = false', done => {
        mParticle.init(apiKey, mParticle.config);

        const cookieData = mParticle.getInstance()._Persistence.getCookie();

        const localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        expect(localStorageData).to.include.keys(['gs', 'cu', testMPID]);

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

        props.forEach(prop => {
            expect(localStorageData[testMPID]).to.not.have.property(prop);
        });

        expect(cookieData).to.not.be.ok;

        done();
    });

    it('puts data into cookies when updating persistence with useCookieStorage = true', done => {
        let cookieData: Partial<IPersistenceMinified>;
        let localStorageData: Partial<IPersistenceMinified>;

        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, mParticle.config);

        cookieData = findCookie();
        expect(cookieData).to.include.keys('gs', 'cu', testMPID);
        localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

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
            cookieData[testMPID].should.not.have.property(prop);
        });

        expect(localStorageData).to.not.be.ok;

        done();
    });

    it('puts data into localStorage when updating persistence with useCookieStorage = false', done => {
        let cookieData: Partial<IPersistenceMinified>;
        let localStorageData: Partial<IPersistenceMinified>;

        // Flush out anything in expire before updating in order to silo testing persistence.update()
        // mParticle.config.useCookieStorage = false;
        mParticle.init(apiKey, mParticle.config);

        localStorageData = getLocalStorage();
        cookieData = findCookie();

        expect(localStorageData).to.have.include.keys('gs', 'cu', testMPID);

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
            localStorageData[testMPID].should.not.have.property(prop);
        });

        expect(cookieData).to.not.be.ok;

        done();
    });

    it('should revert to cookie storage if localStorage is not available and useCookieStorage is set to false', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.getInstance()._Persistence.determineLocalStorageAvailability = () => {
            return false;
        };

        mParticle.init(apiKey, mParticle.config);

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');

        const cookieData = findCookie();
        cookieData[testMPID].ua.should.have.property('gender', 'male');

        mParticle.getInstance()._Persistence.determineLocalStorageAvailability = () => {
            return true;
        };

        done();
    });

    it('should set certain attributes onto global localStorage, while setting user specific to the MPID', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;
        mParticle.init(apiKey, mParticle.config);
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

        done();
    });

    it('should save integration attributes properly on a page refresh', done => {
        mParticle.setIntegrationAttribute(128, { MCID: 'abcedfg' });
        mParticle.init(apiKey, mParticle.config);

        mParticle.logEvent('Test Event');
        const data = getEvent(mockServer.requests, 'Test Event');
        data.ia.should.have.property('128');
        data.ia['128'].should.have.property('MCID', 'abcedfg');

        done();
    });

    it('should set certain attributes onto global cookies, while setting user specific to the MPID', done => {
        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, mParticle.config);
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

        done();
    });

    it('should add new MPID to cookies when returned MPID does not match anything in cookies, and have empty UI and UA', done => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, mParticle.config);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid1', is_logged_in: false }),
        ]);

        const user1 = { userIdentities: { customerid: 'customerid1' } };

        mParticle.Identity.login(user1);
        const user1Result = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getUserIdentities();
        user1Result.userIdentities.customerid.should.equal('customerid1');

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid2', is_logged_in: false }),
        ]);

        mParticle.Identity.logout();

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

        done();
    });

    it('should have the same currentUserMPID as the last browser session when a reload occurs and no identityRequest is provided', done => {
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

        mParticle.init(apiKey, mParticle.config);

        const data = mParticle.getInstance()._Persistence.getLocalStorage();
        data.cu.should.equal(testMPID);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid1', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);
        const user1Data = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        user1Data.cu.should.equal('mpid1');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid2', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user2);
        const user2Data = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        user2Data.cu.should.equal('mpid2');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid3', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user3);
        const user3data = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        user3data.cu.should.equal('mpid3');

        mParticle.init(apiKey, mParticle.config);
        const data3 = mParticle.getInstance()._Persistence.getLocalStorage();
        data3.cu.should.equal('mpid3');

        done();
    });

    it('should transfer user attributes and revert to user identities properly', done => {
        mParticle._resetForTests(MPConfig);
        const user1 = { userIdentities: { customerid: 'customerid1' } };

        const user2 = { userIdentities: { customerid: 'customerid2' } };

        mParticle.init(apiKey, mParticle.config);

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('test1', 'test1');

        const data = getLocalStorage();

        data.cu.should.equal(testMPID);
        data.testMPID.ua.should.have.property('test1', 'test1');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid1', is_logged_in: false }),
        ]);

        mockServer.respondWith(
            'https://identity.mparticle.com/v1/mpid1/modify',
            [200, {}, JSON.stringify({ mpid: 'mpid1', is_logged_in: false })]
        );

        mParticle.Identity.login(user1);

        mParticle.Identity.modify({
            userIdentities: { email: 'email@test.com' },
        });

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid2', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user2);
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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid1', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);
        const user1RelogInData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        user1RelogInData.cu.should.equal('mpid1');
        user1RelogInData.mpid1.ui.should.have.property('1', 'customerid1');
        user1RelogInData.mpid1.ui.should.have.property('7', 'email@test.com');

        Object.keys(user1RelogInData.mpid1.ui).length.should.equal(2);
        user1RelogInData.mpid1.ua.should.have.property('test2', 'test2');

        done();
    });

    it('should replace commas with pipes, and pipes with commas', done => {
        const pipes =
            '{"cgid":"abc"|"das":"def"|"dt":"hij"|"ie":true|"les":1505932333024|"sid":"klm"}';
        const commas =
            '{"cgid":"abc","das":"def","dt":"hij","ie":true,"les":1505932333024,"sid":"klm"}';

        mParticle
            .getInstance()
            ._Persistence.replaceCommasWithPipes(commas)
            .should.equal(pipes);
        mParticle
            .getInstance()
            ._Persistence.replacePipesWithCommas(pipes)
            .should.equal(commas);

        done();
    });

    it('should replace apostrophes with quotes and quotes with apostrophes', done => {
        const quotes =
            '{"cgid":"abc"|"das":"def"|"dt":"hij"|"ie":true|"les":1505932333024|"sid":"klm"}';
        const apostrophes =
            "{'cgid':'abc'|'das':'def'|'dt':'hij'|'ie':true|'les':1505932333024|'sid':'klm'}";

        mParticle
            .getInstance()
            ._Persistence.replaceQuotesWithApostrophes(quotes)
            .should.equal(apostrophes);
        mParticle
            .getInstance()
            ._Persistence.replaceApostrophesWithQuotes(apostrophes)
            .should.equal(quotes);

        done();
    });

    it('should create valid cookie string and revert cookie string', done => {
        const before =
            '{"cgid":"abc","das":"def","dt":"hij","ie":true,"les":1505932333024,"sid":"klm"}';
        const after =
            "{'cgid':'abc'|'das':'def'|'dt':'hij'|'ie':true|'les':1505932333024|'sid':'klm'}";

        mParticle
            .getInstance()
            ._Persistence.createCookieString(before)
            .should.equal(after);
        mParticle
            .getInstance()
            ._Persistence.revertCookieString(after)
            .should.equal(before);

        done();
    });

    it('should remove MPID as keys if the cookie size is beyond the setting', done => {
        mParticle._resetForTests(MPConfig);
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

        done();
    });

    it('integration test - will change the order of the CSM when a previous MPID logs in again', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;
        mParticle.config.maxCookieSize = 1000;
        mParticle.init(apiKey, mParticle.config);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

        let cookieData: Partial<IPersistenceMinified> = findCookie();
        cookieData.gs.csm[0].should.be.equal('testMPID');
        cookieData.gs.csm[1].should.be.equal('MPID1');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID2', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

        cookieData = findCookie();
        cookieData.gs.csm[0].should.be.equal('testMPID');
        cookieData.gs.csm[1].should.be.equal('MPID1');
        cookieData.gs.csm[2].should.be.equal('MPID2');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'testMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

        cookieData = findCookie();
        cookieData.gs.csm[0].should.be.equal('MPID1');
        cookieData.gs.csm[1].should.be.equal('MPID2');
        cookieData.gs.csm[2].should.be.equal('testMPID');

        done();
    });

    it('integration test - should remove a previous MPID as a key from cookies if new user attribute added and exceeds the size of the max cookie size', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;
        mParticle.config.maxCookieSize = 650;

        mParticle.init(apiKey, mParticle.config);

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID2', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

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

        done();
    });

    it('should remove a random MPID from storage if there is a new session and there are no other MPIDs in currentSessionMPIDs except for the currentUser mpid', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.maxCookieSize = 400;

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

        done();
    });

    it('integration test - should remove a random MPID from storage if there is a new session and there are no MPIDs in currentSessionMPIDs', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;
        mParticle.config.maxCookieSize = 600;

        mParticle.init(apiKey, mParticle.config);

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID2', is_logged_in: false }),
        ]);

        mParticle.endSession();
        mParticle.Identity.login();

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

        done();
    });

    it('integration test - migrates a large localStorage cookie to cookies and properly remove MPIDs', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;
        mParticle.config.maxCookieSize = 700;

        mParticle.init(apiKey, mParticle.config);
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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID2', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

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
        const cookieData = findCookie();

        expect(cookieData['testMPID']).to.not.be.ok;
        cookieData['MPID1'].ua.should.have.property('id', 'id2');
        cookieData['MPID2'].ua.should.have.property('id');

        done();
    });

    it('integration test - migrates all cookie MPIDs to localStorage', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, mParticle.config);
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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID2', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

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

        done();
    });

    it('integration test - migrates all LS MPIDs to cookies', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;

        mParticle.init(apiKey, mParticle.config);
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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

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

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID2', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

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

        done();
    });

    it('get/set consent state for single user', done => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, mParticle.config);
        let consentState: ConsentState = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getConsentState();
        expect(consentState).to.equal(null);
        consentState = mParticle.Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo purpose',
            mParticle.Consent.createGDPRConsent(true, 10)
        );

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setConsentState(consentState);

        const storedConsentState = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getConsentState();
        storedConsentState.should.be.ok();
        storedConsentState
            .getGDPRConsentState()
            .should.have.property('foo purpose');
        storedConsentState
            .getGDPRConsentState()
            ['foo purpose'].should.have.property('Consented', true);
        storedConsentState
            .getGDPRConsentState()
            ['foo purpose'].should.have.property('Timestamp', 10);
        done();
    });

    it('get/set consent state for multiple users', done => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, mParticle.config);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.Identity.login();
        let user1StoredConsentState: ConsentState = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getConsentState();
        expect(user1StoredConsentState).to.equal(null);
        const consentState = mParticle.Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo purpose',
            mParticle.Consent.createGDPRConsent(true, 10)
        );

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setConsentState(consentState);

        mParticle._resetForTests(MPConfig, true);
        mParticle.init(apiKey, mParticle.config);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID2', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

        let user2StoredConsentState: ConsentState = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getConsentState();
        expect(user2StoredConsentState).to.equal(null);

        consentState.removeGDPRConsentState('foo purpose');

        consentState.addGDPRConsentState(
            'foo purpose 2',
            mParticle.Consent.createGDPRConsent(false, 11)
        );

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setConsentState(consentState);

        user1StoredConsentState = mParticle
            .getInstance()
            ._Persistence.getConsentState('MPID1');
        user2StoredConsentState = mParticle
            .getInstance()
            ._Persistence.getConsentState('MPID2');

        user1StoredConsentState
            .getGDPRConsentState()
            .should.have.property('foo purpose');
        user1StoredConsentState
            .getGDPRConsentState()
            .should.not.have.property('foo purpose 2');
        user1StoredConsentState
            .getGDPRConsentState()
            ['foo purpose'].should.have.property('Consented', true);
        user1StoredConsentState
            .getGDPRConsentState()
            ['foo purpose'].should.have.property('Timestamp', 10);

        user2StoredConsentState
            .getGDPRConsentState()
            .should.have.property('foo purpose 2');
        user1StoredConsentState
            .getGDPRConsentState()
            .should.not.have.property('foo purpose 1');
        user2StoredConsentState
            .getGDPRConsentState()
            ['foo purpose 2'].should.have.property('Consented', false);
        user2StoredConsentState
            .getGDPRConsentState()
            ['foo purpose 2'].should.have.property('Timestamp', 11);

        done();
    });

    it('integration test - clears and creates new LS on reload if LS is corrupt', done => {
        const les = new Date().getTime();

        mParticle._resetForTests(MPConfig);

        //an extra apostrophe is added to ua here to force a corrupt cookie. On init, cookies will clear and there will be a new cgid, sid, and das to exist
        const LS =
            "{'sid':'1992BDBB-AD74-49DB-9B20-5EC8037E72DE'|'ie':1|'ua':'eyJ0ZXN'0Ijoiwq7igJkifQ=='|'ui':'eyIzIjoiwq7igJkifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjI6MjI6MTAuMjU0MDcyOVoiLCJWYWx1ZSI6Imc9NjhjMmJhMzktYzg2OS00MTZhLWE4MmMtODc4OWNhZjVmMWU3JnU9NDE3NjQyNTYyMTQ0MTEwODk2OCZjcj00NTgxOTgyIn19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537222930186|'cgid':'4ebad5b4-8ed1-4275-8455-838a2e3aa5c0'|'das':'68c2ba39-c869-416a-a82c-8789caf5f1e7'|'mpid':'4176425621441108968'}";
        setLocalStorage(v4LSKey, LS, true);

        mParticle.init(apiKey, mParticle.config);

        const sessionId = mParticle.sessionManager.getSession();
        const das = mParticle.getDeviceId();
        const cgid = mParticle.getInstance()._Persistence.getLocalStorage().gs
            .cgid;
        sessionId.should.not.equal('1992BDBB-AD74-49DB-9B20-5EC8037E72DE');
        das.should.not.equal('68c2ba39-c869-416a-a82c-8789caf5f1e7');
        cgid.should.not.equal('4ebad5b4-8ed1-4275-8455-838a2e3aa5c0');

        done();
    });

    it('integration test - clears and creates new cookies on reload if cookies is corrupt', done => {
        const les = new Date().getTime();

        mParticle._resetForTests(MPConfig);

        //an extra apostrophe is added to ua here to force a corrupt cookie. On init, cookies will clear and there will be a new cgid, sid, and das to exist
        const cookies =
            "{'sid':'1992BDBB-AD74-49DB-9B20-5EC8037E72DE'|'ie':1|'ua':'eyJ0ZXN'0Ijoiwq7igJkifQ=='|'ui':'eyIzIjoiwq7igJkifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjI6MjI6MTAuMjU0MDcyOVoiLCJWYWx1ZSI6Imc9NjhjMmJhMzktYzg2OS00MTZhLWE4MmMtODc4OWNhZjVmMWU3JnU9NDE3NjQyNTYyMTQ0MTEwODk2OCZjcj00NTgxOTgyIn19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537222930186|'cgid':'4ebad5b4-8ed1-4275-8455-838a2e3aa5c0'|'das':'68c2ba39-c869-416a-a82c-8789caf5f1e7'|'mpid':'4176425621441108968'}";
        setCookie(workspaceCookieName, cookies, true);

        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, mParticle.config);

        const sessionId = mParticle.sessionManager.getSession();
        const das = mParticle.getDeviceId();
        const cgid = mParticle.getInstance()._Persistence.getCookie().gs.cgid;
        sessionId.should.not.equal('1992BDBB-AD74-49DB-9B20-5EC8037E72DE');
        das.should.not.equal('68c2ba39-c869-416a-a82c-8789caf5f1e7');
        cgid.should.not.equal('4ebad5b4-8ed1-4275-8455-838a2e3aa5c0');

        done();
    });

    it('integration test - clears LS products on reload if LS products are corrupt', done => {
        mParticle._resetForTests(MPConfig);

        // randomly added gibberish to a Base64 encoded cart product array to force a corrupt product array
        const products =
            'eyItOTE4MjY2NTAzNTA1ODg1NjAwMyI6eyasdjfiojasdifojfsdfJjcCI6W3siTmFtZSI6ImFuZHJvaWQiLCJTa3UiOiI1MTg3MDkiLCJQcmljZSI6MjM0LCJRdWFudGl0eSI6MSwiQnJhbmQiOm51bGwsIlZhcmlhbnQiOm51bGwsIkNhdGVnb3J5IjpudWxsLCJQb3NpdGlvbiI6bnVsbCwiQ291cG9uQ29kZSI6bnVsbCwiVG90YWxBbW91bnQiOjIzNCwiQXR0cmlidXRlcyI6eyJwcm9kYXR0cjEiOiJoaSJ9fSx7Ik5hbWUiOiJ3aW5kb3dzIiwiU2t1IjoiODMzODYwIiwiUHJpY2UiOjM0NSwiUXVhbnRpdHkiOjEsIlRvdGFsQW1vdW50IjozNDUsIkF0dHJpYnV0ZXMiOm51bGx9XX19';

        localStorage.setItem(localStorageProductsV4, products);
        mParticle.init(apiKey, mParticle.config);

        const productsAfterInit = getLocalStorageProducts().testMPID;
        expect(productsAfterInit.length).to.not.be.ok;

        done();
    });

    it('should save products to persistence correctly when adding and removing products', done => {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, mParticle.config);

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
        done();
    });

    it('should only set setFirstSeenTime() once', done => {
        mParticle._resetForTests(MPConfig);

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
        done();
    });

    it('should properly set setLastSeenTime()', done => {
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

        // TODO: https://go.mparticle.com/work/SQDSDKS-5339
        // @ts-ignore
        mParticle.useCookieStorage = true;

        mParticle.init(apiKey, mParticle.config);

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
        done();
    });

    it("should set firstSeenTime() for a user that doesn't have storage yet", done => {
        mParticle._resetForTests(MPConfig);

        const cookies = JSON.stringify({
            gs: {
                sid: 'lst Test',
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

    it('fst should be set when the user does not change, after an identify request', done => {
        mParticle._resetForTests(MPConfig);

        const cookies = JSON.stringify({
            gs: {
                sid: 'lst Test',
                les: new Date().getTime(),
            },
            current: {},
            cu: 'current',
        });

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'current', is_logged_in: false }),
        ]);

        setCookie(workspaceCookieName, cookies, true);
        // FIXME: Should this be in configs or global?
        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, mParticle.config);
        expect(
            mParticle.getInstance()._Persistence.getFirstSeenTime('current')
        ).to.equal(null);

        mParticle.Identity.identify();

        expect(
            mParticle.getInstance()._Persistence.getFirstSeenTime('current')
        ).to.not.equal(null);

        done();
    });

    it('lastSeenTime should be null for users in storage without an lst value', done => {
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
        expect(
            mParticle.getInstance()._Persistence.getFirstSeenTime('previous')
        ).to.equal(null);

        done();
    });

    it('should save to persistence a device id set with setDeviceId', done => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, mParticle.config);
        mParticle.setDeviceId('foo-guid');

        mParticle
            .getInstance()
            ._Persistence.getLocalStorage()
            .gs.das.should.equal('foo-guid');

        done();
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

    // this test confirms a bug has been fixed where setting a user attribute, then user attribute list
    // with a special character in it results in a cookie decode error, which only happened
    // when config.useCookieStorage was true
    it('should save special characters to persistence when on cookies or local storage', done => {
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        // first test local storage
        mParticle.config.useCookieStorage = false;

        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, mParticle.config);

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

        const user2 = mParticle.Identity.getCurrentUser();

        user2.setUserAttribute('ua-1', 'a');
        user2.setUserAttributeList('ua-list', ['a\\', '<b>']);

        user2.getAllUserAttributes()['ua-list'][0].should.equal('a\\');
        user2.getAllUserAttributes()['ua-list'][1].should.equal('<b>');
        user2.getAllUserAttributes()['ua-1'].should.equal('a');

        done();
    });
});
