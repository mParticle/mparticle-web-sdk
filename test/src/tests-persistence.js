import TestsCore from './tests-core';
import sinon from 'sinon';

/* eslint-disable quotes*/
var apiKey = TestsCore.apiKey,
    testMPID = TestsCore.testMPID,
    findCookie = TestsCore.findCookie,
    MPConfig = TestsCore.MPConfig,
    localStorageProductsV4 = TestsCore.localStorageProductsV4,
    LocalStorageProductsV4WithWorkSpaceName =
        TestsCore.LocalStorageProductsV4WithWorkSpaceName,
    workspaceCookieName = TestsCore.workspaceCookieName,
    getLocalStorage = TestsCore.getLocalStorage,
    getLocalStorageProducts = TestsCore.getLocalStorageProducts,
    setCookie = TestsCore.setCookie,
    setLocalStorage = TestsCore.setLocalStorage,
    server = TestsCore.server,
    v4LSKey = 'mprtcl-v4',
    getEvent = TestsCore.getEvent;

describe('migrations and persistence-related', function() {
    beforeEach(function() {
        delete mParticle.config.useCookieStorage;
    });

    it('should move new schema from cookies to localStorage with useCookieStorage = false', function(done) {
        mParticle.reset(MPConfig);

        var cookies = JSON.stringify({
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
        var beforeInitCookieData = findCookie(workspaceCookieName);
        mParticle.config.useCookieStorage = false;
        mParticle.init(apiKey, window.mParticle.config);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');
        var localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        var afterInitCookieData = findCookie();
        beforeInitCookieData[testMPID].ui.should.have.property('1', '123');
        localStorageData[testMPID].ua.should.have.property('gender', 'male');
        localStorageData[testMPID].ui.should.have.property('1', '123');
        Should(afterInitCookieData).not.be.ok();

        done();
    });

    it('should migrate localStorage to cookies with useCookieStorage = true', function(done) {
        mParticle.reset(MPConfig);

        setLocalStorage();

        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, window.mParticle.config);

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');

        var localStorageData = localStorage.getItem('mprtcl-api');
        var cookieData = findCookie();

        Should(localStorageData).not.be.ok();
        cookieData[testMPID].ua.should.have.property('gender', 'male');
        cookieData[testMPID].ui.should.have.property(
            '1',
            'testuser@mparticle.com'
        );

        done();
    });

    it('localStorage - should key cookies on mpid on first run', function(done) {
        mParticle.reset(MPConfig);
        mParticle.config.useCookieStorage = false;
        mParticle.init(apiKey, window.mParticle.config);
        var cookies1 = mParticle.getInstance()._Persistence.getLocalStorage();
        var props1 = [
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

        var props2 = [
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

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'otherMPID',
                })
            );
        };

        mParticle.Identity.login();

        var cookies2 = mParticle.getInstance()._Persistence.getLocalStorage();
        cookies2.should.have.property('cu', 'otherMPID', 'gs');
        props2.forEach(function(prop) {
            cookies1[testMPID].should.not.have.property(prop);
            cookies2[testMPID].should.not.have.property(prop);
            cookies2['otherMPID'].should.not.have.property(prop);
        });

        done();
    });

    it('cookies - should key cookies on mpid when there are no cookies yet', function(done) {
        mParticle.reset(MPConfig);
        window.mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, window.mParticle.config);

        var cookies1 = findCookie();

        var props1 = [
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

        var props2 = [
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

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'otherMPID',
                })
            );
        };

        mParticle.Identity.login();
        var cookies2 = findCookie();

        cookies2.should.have.property('cu', 'otherMPID', testMPID);

        props2.forEach(function(prop) {
            cookies1[testMPID].should.not.have.property(prop);
            cookies2[testMPID].should.not.have.property(prop);
            cookies2['otherMPID'].should.not.have.property(prop);
        });

        done();
    });

    it('puts data into cookies when init-ing with useCookieStorage = true', function(done) {
        window.mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, window.mParticle.config);

        var cookieData = findCookie();

        var localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        cookieData.should.have.properties(['gs', 'cu', testMPID]);

        var props = [
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

        Should(localStorageData).not.be.ok();

        done();
    });

    it('puts data into localStorage when running initializeStorage with useCookieStorage = false', function(done) {
        mParticle.init(apiKey, window.mParticle.config);

        var cookieData = mParticle.getInstance()._Persistence.getCookie();

        var localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        localStorageData.should.have.properties(['gs', 'cu', testMPID]);

        var props = [
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

        Should(cookieData).not.be.ok();

        done();
    });

    it('puts data into cookies when updating persistence with useCookieStorage = true', function(done) {
        var cookieData, localStorageData;

        window.mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, window.mParticle.config);

        cookieData = findCookie();
        cookieData.should.have.properties(['gs', 'cu', testMPID]);
        localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        var props = [
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

        Should(localStorageData).not.be.ok();

        done();
    });

    it('puts data into localStorage when updating persistence with useCookieStorage = false', function(done) {
        var localStorageData, cookieData;
        // Flush out anything in expire before updating in order to silo testing persistence.update()
        // window.mParticle.config.useCookieStorage = false;
        mParticle.init(apiKey, window.mParticle.config);

        localStorageData = getLocalStorage();
        cookieData = findCookie();

        localStorageData.should.have.properties(['gs', 'cu', testMPID]);

        var props = [
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

        Should(cookieData).not.be.ok();

        done();
    });

    it('should revert to cookie storage if localStorage is not available and useCookieStorage is set to false', function(done) {
        mParticle.reset(MPConfig);
        mParticle.getInstance()._Persistence.determineLocalStorageAvailability = function() {
            return false;
        };

        mParticle.init(apiKey, window.mParticle.config);

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');

        var cookieData = findCookie();
        cookieData[testMPID].ua.should.have.property('gender', 'male');

        mParticle.getInstance()._Persistence.determineLocalStorageAvailability = function() {
            return true;
        };

        done();
    });

    it('should set certain attributes onto global localStorage, while setting user specific to the MPID', function(done) {
        mParticle.reset(MPConfig);
        mParticle.config.useCookieStorage = false;
        mParticle.init(apiKey, window.mParticle.config);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');
        mParticle.setIntegrationAttribute(128, { MCID: 'abcedfg' });
        var data = getLocalStorage();

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

    it('should save integration attributes properly on a page refresh', function(done) {
        mParticle.setIntegrationAttribute(128, { MCID: 'abcedfg' });

        mParticle.logEvent('Test Event');
        var data = getEvent('Test Event');

        data.ia.should.have.property('128');
        data.ia['128'].should.have.property('MCID', 'abcedfg');

        done();
    });

    it('should set certain attributes onto global cookies, while setting user specific to the MPID', function(done) {
        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, window.mParticle.config);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('gender', 'male');

        var data = findCookie();
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

    it('should add new MPID to cookies when returned MPID does not match anything in cookies, and have empty UI and UA', function(done) {
        mParticle.reset(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);
        var user1 = { userIdentities: { customerid: 'customerid1' } };

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'mpid1',
                })
            );
        };

        mParticle.Identity.login(user1);
        var user1Result = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getUserIdentities();
        user1Result.userIdentities.customerid.should.equal('customerid1');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'mpid2',
                })
            );
        };

        mParticle.Identity.logout();

        var user2Result = mParticle
            .getInstance()
            .Identity.getCurrentUser();
        Object.keys(
            user2Result.getUserIdentities().userIdentities
        ).length.should.equal(0);

        var localStorageData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        localStorageData.cu.should.equal('mpid2');
        localStorageData.testMPID.should.not.have.property('ui');
        localStorageData.mpid1.ui[1].should.equal('customerid1');
        localStorageData.mpid2.should.not.have.property('ui');

        done();
    });

    it('should have the same currentUserMPID as the last browser session when a reload occurs and no identityRequest is provided', function(done) {
        mParticle.reset(MPConfig);
        var user1 = {
            userIdentities: {
                customerid: '1',
            },
        };

        var user2 = {
            userIdentities: {
                customerid: '2',
            },
        };

        var user3 = {
            userIdentities: {
                customerid: '3',
            },
        };

        mParticle.init(apiKey, window.mParticle.config);

        var data = mParticle.getInstance()._Persistence.getLocalStorage();
        data.cu.should.equal(testMPID);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'mpid1',
                })
            );
        };

        mParticle.Identity.login(user1);
        var user1Data = mParticle.getInstance()._Persistence.getLocalStorage();

        user1Data.cu.should.equal('mpid1');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'mpid2',
                })
            );
        };

        mParticle.Identity.login(user2);
        var user2Data = mParticle.getInstance()._Persistence.getLocalStorage();

        user2Data.cu.should.equal('mpid2');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'mpid3',
                })
            );
        };

        mParticle.Identity.login(user3);
        var user3data = mParticle.getInstance()._Persistence.getLocalStorage();
        user3data.cu.should.equal('mpid3');

        mParticle.init(apiKey, window.mParticle.config);
        var data3 = mParticle.getInstance()._Persistence.getLocalStorage();
        data3.cu.should.equal('mpid3');

        done();
    });

    it('should transfer user attributes and revert to user identities properly', function(done) {
        mParticle.reset(MPConfig);
        var user1 = { userIdentities: { customerid: 'customerid1' } };

        var user2 = { userIdentities: { customerid: 'customerid2' } };

        mParticle.init(apiKey, window.mParticle.config);

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('test1', 'test1');

        var data = getLocalStorage();

        data.cu.should.equal(testMPID);
        data.testMPID.ua.should.have.property('test1', 'test1');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'mpid1',
                })
            );
        };

        mParticle.Identity.login(user1);

        mParticle.Identity.modify({
            userIdentities: { email: 'email@test.com' },
        });

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('test2', 'test2');
        var user1Data = mParticle.getInstance()._Persistence.getLocalStorage();
        user1Data.cu.should.equal('mpid1');
        user1Data.mpid1.ua.should.have.property('test2', 'test2');
        user1Data.mpid1.ui.should.have.property('7', 'email@test.com');
        user1Data.mpid1.ui.should.have.property('1', 'customerid1');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'mpid2',
                })
            );
        };

        mParticle.Identity.login(user2);
        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setUserAttribute('test3', 'test3');
        var user2Data = mParticle.getInstance()._Persistence.getLocalStorage();

        user2Data.cu.should.equal('mpid2');
        user2Data.mpid2.ui.should.have.property('1', 'customerid2');
        user2Data.mpid2.ua.should.have.property('test3', 'test3');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'mpid1',
                })
            );
        };

        mParticle.Identity.login(user1);
        var user1RelogInData = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        user1RelogInData.cu.should.equal('mpid1');
        user1RelogInData.mpid1.ui.should.have.property('1', 'customerid1');
        user1RelogInData.mpid1.ui.should.have.property('7', 'email@test.com');

        Object.keys(user1RelogInData.mpid1.ui).length.should.equal(2);
        user1RelogInData.mpid1.ua.should.have.property('test2', 'test2');

        done();
    });

    it('should replace commas with pipes, and pipes with commas', function(done) {
        var pipes =
            '{"cgid":"abc"|"das":"def"|"dt":"hij"|"ie":true|"les":1505932333024|"sid":"klm"}';
        var commas =
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

    it('should replace apostrophes with quotes and quotes with apostrophes', function(done) {
        var quotes =
            '{"cgid":"abc"|"das":"def"|"dt":"hij"|"ie":true|"les":1505932333024|"sid":"klm"}';
        var apostrophes =
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

    it('should create valid cookie string and revert cookie string', function(done) {
        var before =
            '{"cgid":"abc","das":"def","dt":"hij","ie":true,"les":1505932333024,"sid":"klm"}';
        var after =
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

    it('should remove MPID as keys if the cookie size is beyond the setting', function(done) {
        mParticle.reset(MPConfig);
        mParticle.config.maxCookieSize = 700;

        var cookies = {
            gs: {
                csm: ['mpid1', 'mpid2', 'mpid3'],
                sid: 'abcd',
                ie: true,
                dt: apiKey,
                cgid: 'cgid1',
                das: 'das1',
            },
            cu: 'mpid3',
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
        var expires = new Date(
            new Date().getTime() + 365 * 24 * 60 * 60 * 1000
        ).toGMTString();
        var cookiesWithExpiration = mParticle
            .getInstance()
            ._Persistence.reduceAndEncodePersistence(
                cookies,
                expires,
                'testDomain',
                mParticle.config.maxCookieSize
            );
        var cookiesWithoutExpiration = cookiesWithExpiration.slice(
            0,
            cookiesWithExpiration.indexOf(';expires')
        );
        var cookiesResult = JSON.parse(
            mParticle
                .getInstance()
                ._Persistence.decodePersistence(cookiesWithoutExpiration)
        );
        Should(cookiesResult['mpid1']).not.be.ok();
        Should(cookiesResult['mpid2']).be.ok();
        Should(cookiesResult['mpid3']).be.ok();
        cookiesResult.gs.csm.length.should.equal(3);
        cookiesResult.gs.csm[0].should.equal('mpid1');
        cookiesResult.gs.csm[1].should.equal('mpid2');
        cookiesResult.gs.csm[2].should.equal('mpid3');

        done();
    });

    it('integration test - will change the order of the CSM when a previous MPID logs in again', function(done) {
        mParticle.reset(MPConfig);
        mParticle.config.useCookieStorage = true;
        mParticle.config.maxCookieSize = 1000;
        mParticle.init(apiKey, window.mParticle.config);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID1',
                })
            );
        };

        mParticle.Identity.login();

        var cookieData = findCookie();
        cookieData.gs.csm[0].should.be.equal('testMPID');
        cookieData.gs.csm[1].should.be.equal('MPID1');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID2',
                })
            );
        };

        mParticle.Identity.login();

        cookieData = findCookie();
        cookieData.gs.csm[0].should.be.equal('testMPID');
        cookieData.gs.csm[1].should.be.equal('MPID1');
        cookieData.gs.csm[2].should.be.equal('MPID2');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'testMPID',
                })
            );
        };

        mParticle.Identity.login();

        cookieData = findCookie();
        cookieData.gs.csm[0].should.be.equal('MPID1');
        cookieData.gs.csm[1].should.be.equal('MPID2');
        cookieData.gs.csm[2].should.be.equal('testMPID');

        done();
    });

    it('integration test - should remove a previous MPID as a key from cookies if new user attribute added and exceeds the size of the max cookie size', function(done) {
        mParticle.reset(MPConfig);
        mParticle.config.useCookieStorage = true;
        mParticle.config.maxCookieSize = 650;

        mParticle.init(apiKey, window.mParticle.config);

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

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID1',
                })
            );
        };

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

        var cookieData = findCookie();
        cookieData.gs.csm[0].should.equal('testMPID');
        cookieData.gs.csm[1].should.equal('MPID1');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID2',
                })
            );
        };
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

        Should(cookieData['testMPID']).not.be.ok();
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

    it('should remove a random MPID from storage if there is a new session and there are no other MPIDs in currentSessionMPIDs except for the currentUser mpid', function(done) {
        mParticle.reset(MPConfig);
        mParticle.config.maxCookieSize = 400;

        var cookies = {
            gs: {
                csm: ['mpid3'],
                sid: 'abcd',
                ie: true,
                dt: apiKey,
                cgid: 'cgid1',
                das: 'das1',
            },
            cu: 'mpid3',
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

        var expires = new Date(
            new Date().getTime() + 365 * 24 * 60 * 60 * 1000
        ).toGMTString();

        var cookiesWithExpiration = mParticle
            .getInstance()
            ._Persistence.reduceAndEncodePersistence(
                cookies,
                expires,
                'testDomain',
                mParticle.config.maxCookieSize
            );
        var cookiesWithoutExpiration = cookiesWithExpiration.slice(
            0,
            cookiesWithExpiration.indexOf(';expires')
        );
        var cookiesResult = JSON.parse(
            mParticle
                .getInstance()
                ._Persistence.decodePersistence(cookiesWithoutExpiration)
        );

        Should(cookiesResult['mpid1']).not.be.ok();
        Should(cookiesResult['mpid2']).not.be.ok();
        Should(cookiesResult['mpid3']).be.ok();
        cookiesResult.gs.csm[0].should.equal('mpid3');
        cookiesResult.should.have.property('mpid3');
        mParticle.maxCookieSize = 3000;

        done();
    });

    it('integration test - should remove a random MPID from storage if there is a new session and there are no MPIDs in currentSessionMPIDs', function(done) {
        mParticle.reset(MPConfig);
        mParticle.config.useCookieStorage = true;
        mParticle.config.maxCookieSize = 600;

        mParticle.init(apiKey, window.mParticle.config);

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

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID1',
                })
            );
        };

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

        var cookieData = findCookie();

        cookieData.gs.csm[0].should.equal('testMPID');
        cookieData.gs.csm[1].should.equal('MPID1');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID2',
                })
            );
        };

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

        Should(cookieData['testMPID']).not.be.ok();
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

    it('integration test - migrates a large localStorage cookie to cookies and properly remove MPIDs', function(done) {
        mParticle.reset(MPConfig);
        mParticle.config.useCookieStorage = false;
        mParticle.config.maxCookieSize = 700;

        mParticle.init(apiKey, window.mParticle.config);
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

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID1',
                })
            );
        };

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

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID2',
                })
            );
        };

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

        mParticle.init(apiKey, window.mParticle.config);
        var cookieData = findCookie();

        Should(cookieData['testMPID']).not.be.ok();
        cookieData['MPID1'].ua.should.have.property('id', 'id2');
        cookieData['MPID2'].ua.should.have.property('id');

        done();
    });

    it('integration test - migrates all cookie MPIDs to localStorage', function(done) {
        mParticle.reset(MPConfig);
        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);
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

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID1',
                })
            );
        };

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

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID2',
                })
            );
        };

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

        mParticle.init(apiKey, window.mParticle.config);
        var lsData = getLocalStorage(v4LSKey);

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

    it('integration test - migrates all LS MPIDs to cookies', function(done) {
        mParticle.reset(MPConfig);
        mParticle.config.useCookieStorage = false;

        mParticle.init(apiKey, window.mParticle.config);
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

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID1',
                })
            );
        };

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

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID2',
                })
            );
        };

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

        mParticle.init(apiKey, window.mParticle.config);
        var cookieData = findCookie();

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

    it('get/set consent state for single user', function(done) {
        mParticle.reset(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);
        var consentState = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getConsentState();
        (consentState === null).should.be.ok();
        consentState = mParticle.Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo purpose',
            mParticle.Consent.createGDPRConsent(true, 10)
        );

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setConsentState(consentState);

        var storedConsentState = mParticle
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

    it('get/set consent state for multiple users', function(done) {
        mParticle.reset(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID1',
                })
            );
        };

        mParticle.Identity.login();
        var user1StoredConsentState = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getConsentState();
        (user1StoredConsentState === null).should.be.ok();
        var consentState = mParticle.Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo purpose',
            mParticle.Consent.createGDPRConsent(true, 10)
        );

        mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .setConsentState(consentState);

        mParticle.reset(MPConfig, true);
        mParticle.init(apiKey, window.mParticle.config);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'MPID2',
                })
            );
        };
        mParticle.Identity.login();

        var user2StoredConsentState = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getConsentState();
        (user2StoredConsentState === null).should.be.ok();

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

    it('integration test - clears and creates new LS on reload if LS is corrupt', function(done) {
        var les = new Date().getTime();

        mParticle.reset(MPConfig);

        //an extra apostrophe is added to ua here to force a corrupt cookie. On init, cookies will clear and there will be a new cgid, sid, and das to exist
        var LS =
            "{'sid':'1992BDBB-AD74-49DB-9B20-5EC8037E72DE'|'ie':1|'ua':'eyJ0ZXN'0Ijoiwq7igJkifQ=='|'ui':'eyIzIjoiwq7igJkifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjI6MjI6MTAuMjU0MDcyOVoiLCJWYWx1ZSI6Imc9NjhjMmJhMzktYzg2OS00MTZhLWE4MmMtODc4OWNhZjVmMWU3JnU9NDE3NjQyNTYyMTQ0MTEwODk2OCZjcj00NTgxOTgyIn19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537222930186|'cgid':'4ebad5b4-8ed1-4275-8455-838a2e3aa5c0'|'das':'68c2ba39-c869-416a-a82c-8789caf5f1e7'|'mpid':'4176425621441108968'}";
        setLocalStorage(v4LSKey, LS, true);

        mParticle.init(apiKey, window.mParticle.config);

        var sessionId = mParticle.sessionManager.getSession();
        var das = mParticle.getDeviceId();
        var cgid = mParticle.getInstance()._Persistence.getLocalStorage().gs
            .cgid;
        sessionId.should.not.equal('1992BDBB-AD74-49DB-9B20-5EC8037E72DE');
        das.should.not.equal('68c2ba39-c869-416a-a82c-8789caf5f1e7');
        cgid.should.not.equal('4ebad5b4-8ed1-4275-8455-838a2e3aa5c0');

        done();
    });

    it('integration test - clears and creates new cookies on reload if cookies is corrupt', function(done) {
        var les = new Date().getTime();

        mParticle.reset(MPConfig);

        //an extra apostrophe is added to ua here to force a corrupt cookie. On init, cookies will clear and there will be a new cgid, sid, and das to exist
        var cookies =
            "{'sid':'1992BDBB-AD74-49DB-9B20-5EC8037E72DE'|'ie':1|'ua':'eyJ0ZXN'0Ijoiwq7igJkifQ=='|'ui':'eyIzIjoiwq7igJkifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjI6MjI6MTAuMjU0MDcyOVoiLCJWYWx1ZSI6Imc9NjhjMmJhMzktYzg2OS00MTZhLWE4MmMtODc4OWNhZjVmMWU3JnU9NDE3NjQyNTYyMTQ0MTEwODk2OCZjcj00NTgxOTgyIn19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537222930186|'cgid':'4ebad5b4-8ed1-4275-8455-838a2e3aa5c0'|'das':'68c2ba39-c869-416a-a82c-8789caf5f1e7'|'mpid':'4176425621441108968'}";
        setCookie(workspaceCookieName, cookies, true);

        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, window.mParticle.config);

        var sessionId = mParticle.sessionManager.getSession();
        var das = mParticle.getDeviceId();
        var cgid = mParticle.getInstance()._Persistence.getCookie().gs.cgid;
        sessionId.should.not.equal('1992BDBB-AD74-49DB-9B20-5EC8037E72DE');
        das.should.not.equal('68c2ba39-c869-416a-a82c-8789caf5f1e7');
        cgid.should.not.equal('4ebad5b4-8ed1-4275-8455-838a2e3aa5c0');

        done();
    });

    it('integration test - clears LS products on reload if LS products are corrupt', function(done) {
        mParticle.reset(MPConfig);

        // randomly added gibberish to a Base64 encoded cart product array to force a corrupt product array
        var products =
            'eyItOTE4MjY2NTAzNTA1ODg1NjAwMyI6eyasdjfiojasdifojfsdfJjcCI6W3siTmFtZSI6ImFuZHJvaWQiLCJTa3UiOiI1MTg3MDkiLCJQcmljZSI6MjM0LCJRdWFudGl0eSI6MSwiQnJhbmQiOm51bGwsIlZhcmlhbnQiOm51bGwsIkNhdGVnb3J5IjpudWxsLCJQb3NpdGlvbiI6bnVsbCwiQ291cG9uQ29kZSI6bnVsbCwiVG90YWxBbW91bnQiOjIzNCwiQXR0cmlidXRlcyI6eyJwcm9kYXR0cjEiOiJoaSJ9fSx7Ik5hbWUiOiJ3aW5kb3dzIiwiU2t1IjoiODMzODYwIiwiUHJpY2UiOjM0NSwiUXVhbnRpdHkiOjEsIlRvdGFsQW1vdW50IjozNDUsIkF0dHJpYnV0ZXMiOm51bGx9XX19';

        localStorage.setItem(localStorageProductsV4, products);
        mParticle.init(apiKey, window.mParticle.config);

        var productsAfterInit = getLocalStorageProducts().testMPID;
        Should(productsAfterInit.length).not.be.ok();

        done();
    });

    it('should save products to persistence correctly when adding and removing products', function(done) {
        mParticle.reset(MPConfig);
        mParticle.init(apiKey, window.mParticle.config);

        var iphone = mParticle.eCommerce.createProduct(
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

        var ls = window.localStorage.getItem(
            LocalStorageProductsV4WithWorkSpaceName
        );
        var parsedProducts = JSON.parse(atob(ls));
        // parsedProducts should just have key of testMPID with value of cp with a single product
        Object.keys(parsedProducts).length.should.equal(1);
        parsedProducts['testMPID'].should.have.property('cp');
        parsedProducts['testMPID'].cp.length.should.equal(1);

        mParticle.eCommerce.Cart.remove(iphone, true);
        ls = window.localStorage.getItem(
            LocalStorageProductsV4WithWorkSpaceName
        );
        var parsedProductsAfter = JSON.parse(atob(ls));
        // parsedProducts should just have key of testMPID with value of cp with no products

        Object.keys(parsedProductsAfter).length.should.equal(1);
        parsedProductsAfter['testMPID'].should.have.property('cp');
        parsedProductsAfter['testMPID'].cp.length.should.equal(0);
        done();
    });

    it('should only set setFirstSeenTime() once', function(done) {
        mParticle.reset(MPConfig);

        var cookies = JSON.stringify({
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
        mParticle.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getInstance()._Persistence.setFirstSeenTime('current', 10000);
        var currentFirstSeenTime = mParticle
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

    it('should properly set setLastSeenTime()', function(done) {
        mParticle.reset(MPConfig);

        var cookies = JSON.stringify({
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
        mParticle.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);

        var clock = sinon.useFakeTimers();
        clock.tick(100);

        mParticle.getInstance()._Persistence.setLastSeenTime('previous', 1);
        mParticle
            .getInstance()
            ._Persistence.getLastSeenTime('previous')
            .should.equal(1);

        mParticle.getInstance()._Persistence.setLastSeenTime('previous', 2);
        mParticle
            .getInstance()
            ._Persistence.getLastSeenTime('previous')
            .should.equal(2);

        mParticle
            .getInstance()
            ._Persistence.getLastSeenTime('previous_set')
            .should.equal(10);
        mParticle.getInstance()._Persistence.setLastSeenTime('previous_set', 20);
        mParticle
            .getInstance()
            ._Persistence.getLastSeenTime('previous_set')
            .should.equal(20);

        mParticle
            .getInstance()
            ._Persistence.getLastSeenTime('current')
            .should.equal(100);
        mParticle.getInstance()._Persistence.setLastSeenTime('current', 200);
        //lastSeenTime for the current user should always reflect the current time,
        //even if was set
        mParticle
            .getInstance()
            ._Persistence.getLastSeenTime('current')
            .should.equal(100);
        clock.tick(50);
        mParticle
            .getInstance()
            ._Persistence.getLastSeenTime('current')
            .should.equal(150);

        clock.restore();
        done();
    });

    it("should set firstSeenTime() for a user that doesn't have storage yet", function(done) {
        mParticle.reset(MPConfig);

        var cookies = JSON.stringify({
            gs: {
                sid: 'lst Test',
                les: new Date().getTime(),
            },
            cu: 'test',
        });

        setCookie(workspaceCookieName, cookies, true);
        mParticle.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);

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

    it('fst should be set when the user does not change, after an identify request', function(done) {
        mParticle.reset(MPConfig);

        var cookies = JSON.stringify({
            gs: {
                sid: 'lst Test',
                les: new Date().getTime(),
            },
            current: {},
            cu: 'current',
        });

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    mpid: 'current',
                })
            );
        };

        setCookie(workspaceCookieName, cookies, true);
        mParticle.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);

        Should(
            mParticle.getInstance()._Persistence.getFirstSeenTime('current')
        ).equal(null);

        mParticle.Identity.identify();

        Should(
            mParticle.getInstance()._Persistence.getFirstSeenTime('current')
        ).not.equal(null);

        done();
    });

    it('lastSeenTime should be null for users in storage without an lst value', function(done) {
        var cookies = JSON.stringify({
            gs: {
                sid: 'lst Test',
                les: new Date().getTime(),
            },
            previous: {},
            cu: 'current',
        });
        setCookie(workspaceCookieName, cookies, true);
        mParticle.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);
        Should(
            mParticle.getInstance()._Persistence.getFirstSeenTime('previous')
        ).equal(null);

        done();
    });
});
