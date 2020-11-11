import _Persistence from '../../src/persistence';
import Migrations from '../../src/migrations';
import Utils from './utils';
import sinon from 'sinon';
import { urls, apiKey, testMPID, MPConfig, v3CookieKey, workspaceCookieName, v3LSKey, localStorageProductsV4, LocalStorageProductsV4WithWorkSpaceName } from './config';

/* eslint-disable quotes */
var getLocalStorageProducts = Utils.getLocalStorageProducts,
    setCookie = Utils.setCookie,
    setLocalStorage = Utils.setLocalStorage,
    getEvent = Utils.getEvent,
    findCookie = Utils.findCookie,
    v4CookieKey = Utils.v4CookieKey,
    deleteAllCookies = Utils.deleteAllCookies,
    mockServer;

describe('persistence migrations from SDKv1 to SDKv2', function() {
    beforeEach(function() {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.eventsV2, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, Store: {}})
        ]);
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
    });

    afterEach(function() {
        deleteAllCookies();
        mockServer.restore();
    });

    var mP = new _Persistence(mParticle.getInstance());
    var les = new Date().getTime();

    var SDKv1CookieV3 =
        '{"sid":"cc3e7de7-67d0-4581-b4ae-242e8773f0a4"|"ie":1|"sa":"eyJzYTEiOiJ2YWx1ZTEifQ=="|"ua":"eyJhdHRyMSI6InZhbHVlMSJ9"|"ui":"eyIxIjoiY3VzdG9tZXJpZDEiLCI3IjoidGVzdEBlbWFpbC5jb20ifQ=="|"ss":"eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTAtMzFUMTk6MzI6NTguNjA1NzkxWiIsIlZhbHVlIjoiZz1iMTNjNmZkNS05ZjBiLTQ3NGEtODQzZi1jY2RlZDAxZmY5ZDgmdT0tODI2NDc2MDM5ODIzNzQwNTMzMyZjcj00MTIyNDUyIn19"|"dt":"' +
        apiKey +
        '"|"les":' +
        les +
        '|"av":"1.5.0"|"cgid":"63781306-983e-4bec-8b0c-2c58b14f6d4e"|"das":"b13c6fd5-9f0b-474a-843f-ccded01ff9d8"|"csd":"eyIxMSI6MTUwOTY1MTE3ODYwNX0="|"mpid":"' +
        testMPID +
        '"}';

    var SDKv1CookieV3Full =
        '{"cp":[{"Name":"iPhone"|"Sku":"SKU1"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}|{"Name":"Android"|"Sku":"SKU2"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}]|"pb":{"pb1":[{"Name":"HTC"|"Sku":"SKU3"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}]}|"sid":"045af0fa-8f05-43fa-a076-28bdc1d5ec3e"|"ie":1|"sa":"eyJzYTEiOiJ2YWx1ZTEifQ=="|"ua":"eyJ1YTEiOiJ2YWx1ZTEifQ=="|"ui":"eyI3IjoidGVzdEBlbWFpbC5jb20ifQ=="|"ss":"eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTEtMDFUMTk6NDI6NDkuNjc5NDQyWiIsIlZhbHVlIjoiZz02ZmZmZDNmNC0yY2UxLTQ3NDYtODU3ZS05OTE4ZGY3ZDRjNWQmdT0zNDgyMDExODE1OTQ5MDc5MDc0JmNyPTQxMjM5MDIifX0="|"dt":"' +
        apiKey +
        '"|"les":' +
        les +
        '|"av":"1.5.0"|"cgid":"76bd51b3-7dad-491f-9620-0c57223a4e9f"|"das":"6fffd3f4-2ce1-4746-857e-9918df7d4c5d"|"csd":"eyIxMSI6MTUwOTczODE2ODI0NX0="|"mpid":"' +
        testMPID +
        '"}';

    var SDKv1CookieV3FullLSApostrophes =
        "{'cp':[{'Name':'iPhone'|'Sku':'SKU1'|'Price':1|'Quantity':1|'TotalAmount':1|'Attributes':null}|{'Name':'Android'|'Sku':'SKU2'|'Price':1|'Quantity':1|'TotalAmount':1|'Attributes':null}]|'pb':{'pb1':[{'Name':'HTC'|'Sku':'SKU3'|'Price':1|'Quantity':1|'TotalAmount':1|'Attributes':null}|{'Name':'Windows'|'Sku':'SKU4'|'Price':1|'Quantity':1|'TotalAmount':1|'Attributes':null}]}|'sid':'ed937016-a06f-4275-9af4-c1830cfe951f'|'ie':1|'sa':'eyJzYTEiOiJ2YWx1ZTEifQ=='|'ua':'eyJ1YTEiOiJ2YWx1ZTEifQ=='|'ui':'eyIxIjoiY3VzdG9tZXJpZDEiLCI3IjoidGVzdEBlbWFpbC5jb20ifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTEtMDZUMTg6MTE6NDMuMjU2MDY2WiIsIlZhbHVlIjoiZz02ODFlNDMyNC0yYmFjLTQwMzYtODNkOC02MTNlZDRlYzNkY2MmdT02MjI3NDUxOTA2MTg2MDU1MDUmY3I9NDEzMTAxMSJ9fQ=='|'dt':'" +
        apiKey +
        "'|'les':" +
        les +
        "|'av':'1.5.0'|'cgid':'20f258e9-13cb-4751-ac7a-b2c66ef18db4'|'das':'681e4324-2bac-4036-83d8-613ed4ec3dcc'|'csd':'eyIxMSI6MTUxMDE2NDcwMzI0N30='|'mpid':'" +
        testMPID +
        "'}";

    var SDKv1CookieV3WithEncodedProducts =
        "{'cp':'W3siTmFtZSI6IidhcG9zdHJvcGhlcyBpbicnJyBuYW1lIiwiU2t1IjoiU0tVMSIsIlByaWNlIjoxMjMsIlF1YW50aXR5IjoxLCJUb3RhbEFtb3VudCI6MTIzLCJBdHRyaWJ1dGVzIjpudWxsfV0'|'sid':'d3b6bb27-838f-49a0-bbba-407da48ac366'|'ie':1|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDEtMDFUMTU6MTk6NDAuNTM5NTYxWiIsIlZhbHVlIjoiZz1kNmM5YzY5Zi1kYjAxLTQ4YWQtYjk0OS1hZTYxNzk5ZWE1OWEmdT0tNDE4MzA5MTg5MDM3OTM2ODIxNCZjcj00MjExNDc5In19'|'dt':'" +
        apiKey +
        "'|'les':" +
        les +
        " |'ssd':1514992777026|'cgid':'2efa7a16-971d-400e-9849-704559fd8891'|'das':'d6c9c69f-db01-48ad-b949-ae61799ea59a'|'mpid': '" +
        testMPID +
        "'}";

    var SDKv1CookieV3Parsed = JSON.parse(
        mP.replacePipesWithCommas(SDKv1CookieV3)
    );

    var SDKv1CookieV3FullLSApostrophesParsed = JSON.parse(
        mP.replacePipesWithCommas(
            mP.replaceApostrophesWithQuotes(SDKv1CookieV3FullLSApostrophes)
        )
    );
    var SDKv1CookieV3WithEncodedProductsParsed = JSON.parse(
        mP.replacePipesWithCommas(
            mP.replaceApostrophesWithQuotes(SDKv1CookieV3WithEncodedProducts)
        )
    );

    it('unit test - should migrate from SDKv1CookieV3 to SDKv2CookieV4 using convertSDKv1CookiesV3ToSDKv2CookiesV4', function(done) {
        mParticle._resetForTests(MPConfig);
        var v4Cookies = JSON.parse(
            new Migrations(
                mParticle.getInstance()
            ).convertSDKv1CookiesV3ToSDKv2CookiesV4(SDKv1CookieV3)
        );

        v4Cookies.should.have.properties('gs', SDKv1CookieV3Parsed.mpid, 'cu');
        v4Cookies.cu.should.equal(SDKv1CookieV3Parsed.mpid);
        v4Cookies.gs.should.have.properties('csm', 'das');

        v4Cookies.gs.das.should.equal(SDKv1CookieV3Parsed.das);
        atob(v4Cookies.gs.csm).should.equal(
            JSON.stringify([SDKv1CookieV3Parsed.mpid])
        );
        v4Cookies[SDKv1CookieV3Parsed.mpid].should.have.properties('ui');
        v4Cookies[SDKv1CookieV3Parsed.mpid].should.not.have.property('mpid');
        v4Cookies[SDKv1CookieV3Parsed.mpid].should.not.have.property('cp');
        v4Cookies[SDKv1CookieV3Parsed.mpid].should.not.have.property('pb');
        atob(v4Cookies[SDKv1CookieV3Parsed.mpid].ui).should.equal(
            atob(SDKv1CookieV3Parsed.ui)
        );

        done();
    });

    it('integration test - should migrate from SDKv1CookieV3 to SDKv2CookieV4 and function properly when using cookie storage', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;
        var lsProductsRaw =
            '{"cp":[{"Name":"iPhone"|"Sku":"SKU1"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}|{"Name":"Android"|"Sku":"SKU2"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}]}';
        setCookie(v3CookieKey, SDKv1CookieV3, true);
        localStorage.setItem(v3LSKey, lsProductsRaw);
        mParticle.init(apiKey, window.mParticle.config);

        mockServer.requests = [];
        mParticle.eCommerce.logCheckout(1);

        var event = getEvent(mockServer.requests, 'eCommerce - Checkout');
        event.ui[0].should.have.property('Identity', 'customerid1');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test@email.com');
        event.ui[1].should.have.property('Type', 7);

        done();
    });

    it('integration test - should migrate from SDKv1CookieV3 to SDKv2CookieV4 and function properly when using localStorage', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;

        setLocalStorage(v3LSKey, SDKv1CookieV3Full, true);

        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];
        mParticle.eCommerce.logCheckout(1);

        var event = getEvent(mockServer.requests, 'eCommerce - Checkout');
        event.ui[0].should.have.property('Identity', 'test@email.com');
        event.ui[0].should.have.property('Type', 7);

        done();
    });

    it('unit test - should migrate from SDKv1CookieV3 with apostrophes to SDKv2CookieV4 using convertSDKv1CookiesV3ToSDKv2CookiesV4', function(done) {
        mParticle._resetForTests(MPConfig);

        var v4Cookies = JSON.parse(
            new Migrations(
                mParticle.getInstance()
            ).convertSDKv1CookiesV3ToSDKv2CookiesV4(
                SDKv1CookieV3FullLSApostrophes
            )
        );

        v4Cookies.should.have.properties(
            'gs',
            SDKv1CookieV3FullLSApostrophesParsed.mpid,
            'cu'
        );
        v4Cookies.cu.should.equal(SDKv1CookieV3FullLSApostrophesParsed.mpid);
        v4Cookies.gs.should.have.properties('csm', 'das');
        v4Cookies.gs.das.should.equal(SDKv1CookieV3FullLSApostrophesParsed.das);
        atob(v4Cookies.gs.csm).should.equal(
            JSON.stringify([SDKv1CookieV3FullLSApostrophesParsed.mpid])
        );
        v4Cookies[
            SDKv1CookieV3FullLSApostrophesParsed.mpid
        ].should.have.properties('ui');
        v4Cookies[
            SDKv1CookieV3FullLSApostrophesParsed.mpid
        ].should.not.have.property('mpid');
        v4Cookies[
            SDKv1CookieV3FullLSApostrophesParsed.mpid
        ].should.not.have.property('cp');
        v4Cookies[
            SDKv1CookieV3FullLSApostrophesParsed.mpid
        ].should.not.have.property('pb');
        atob(
            v4Cookies[SDKv1CookieV3FullLSApostrophesParsed.mpid].ui
        ).should.equal(atob(SDKv1CookieV3FullLSApostrophesParsed.ui));

        done();
    });

    it('integration test - should migrate from SDKv1CookieV3 with apostrophes to SDKv2CookieV4 and function properly when using cookie storage', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;

        setCookie(v3CookieKey, SDKv1CookieV3FullLSApostrophes, true);

        mParticle.init(apiKey, window.mParticle.config);

        mockServer.requests = [];
        mParticle.eCommerce.logCheckout(1);

        var event = getEvent(mockServer.requests, 'eCommerce - Checkout');
        event.ui[0].should.have.property('Identity', 'customerid1');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test@email.com');
        event.ui[1].should.have.property('Type', 7);

        done();
    });

    it('integration test - should migrate from SDKv1CookieV3 with apostrophes to SDKv2CookieV4 and function properly when using local storage', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;

        setLocalStorage(v3LSKey, SDKv1CookieV3FullLSApostrophes, true);
        mParticle.init(apiKey, window.mParticle.config);

        mockServer.requests = [];
        mParticle.eCommerce.logCheckout(1);

        var event = getEvent(mockServer.requests, 'eCommerce - Checkout');
        event.ui[0].should.have.property('Identity', 'customerid1');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test@email.com');
        event.ui[1].should.have.property('Type', 7);

        done();
    });

    it('unit test - should migrate products from SDKv1CookieV3 to SDKv2CookieV4 local storage', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;

        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1);

        var SDKv1CookieV3 = {
            sid: '77b95bfb-4749-4678-8bff-6ee959e2904d',
            ie: true,
            ss: btoa(
                JSON.stringify({
                    uid: {
                        Expires: '2027-10-07T14:59:30.656542Z',
                        Value: 'exampleValue',
                    },
                })
            ),
            dt: 'beab3f4d34281d45bfcdbbd7eb21c083',
            les: 1507647418774,
            cgid: 'a5845924-b4a2-4756-a127-beafd5606305',
            das: '36fe23d2-ee96-4d58-93b0-51c6f98fca20',
            mpid: '-4321945503088905200',
            sa: btoa(JSON.stringify({ key: 'value' })),
            csd: btoa(JSON.stringify({ 5: 1507647418774 })),
            av: '1.5.0',
            ua: btoa(JSON.stringify({ gender: 'female' })),
            ui: btoa(JSON.stringify([{ Identity: 'abc', Type: 1 }])),
            cp: [product1, product2],
            pb: { productBag1: [product1, product2] },
        };

        mParticle.getInstance()._Store.prodStorageName = LocalStorageProductsV4WithWorkSpaceName;
        new Migrations(
            mParticle.getInstance()
        ).convertSDKv1CookiesV3ToSDKv2CookiesV4(JSON.stringify(SDKv1CookieV3));

        var localStorageProducts = getLocalStorageProducts();

        JSON.stringify(
            localStorageProducts[SDKv1CookieV3.mpid].cp
        ).should.equal(JSON.stringify(SDKv1CookieV3.cp));

        done();
    });

    it('unit test - should migrate from SDKv1CookieV3WithEncodedProducts to SDKv2CookieV4 decoded', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;
        mParticle.getInstance()._Store.prodStorageName =
            LocalStorageProductsV4WithWorkSpaceName;

        var v4Cookies = JSON.parse(
            new Migrations(
                mParticle.getInstance()
            ).convertSDKv1CookiesV3ToSDKv2CookiesV4(
                decodeURIComponent(SDKv1CookieV3WithEncodedProducts)
            )
        );
        v4Cookies.should.have.properties(testMPID, 'gs', 'cu');

        v4Cookies.cu.should.equal(SDKv1CookieV3WithEncodedProductsParsed.mpid);

        v4Cookies.gs.should.have.properties('csm', 'das');
        atob(v4Cookies.gs.csm).should.equal(
            JSON.stringify([SDKv1CookieV3WithEncodedProductsParsed.mpid])
        );
        v4Cookies.gs.das.should.equal(
            SDKv1CookieV3WithEncodedProductsParsed.das
        );

        v4Cookies[testMPID].should.not.have.property('mpid');
        v4Cookies[testMPID].should.not.have.property('pb');
        v4Cookies[testMPID].should.not.have.property('cp');

        var localStorageProducts = getLocalStorageProducts();

        JSON.stringify(localStorageProducts[testMPID].cp).should.equal(
            atob(SDKv1CookieV3WithEncodedProductsParsed.cp)
        );

        done();
    });

    it('integration test - should migrate from SDKv1CookieV3WithEncodedProducts to SDKv2CookieV4 and function properly when using cookie storage', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;

        setCookie(v3CookieKey, SDKv1CookieV3WithEncodedProducts, true);

        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];
        var testName = "' ' test name ' with apostrophes";
        mParticle.eCommerce.Cart.add(
            mParticle.eCommerce.createProduct(testName, 'sku123', 1)
        );
        mParticle.eCommerce.logCheckout(1);

        var event = getEvent(mockServer.requests, 'eCommerce - Checkout');
        event.sc.pl.length.should.equal(0);

        done();
    });

    it('integration test - should remove local storage products when in a broken state', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;
        var corruptLS =
            'eyItODg4OTA3MDIxNTMwMzU2MDYyNyI6eyJjcCI6W3siTmFtZSI6IkRvdWJsZSBDaGVlc2VidXJnZXIiLCJTa3UiOiI4YzdiMDVjZS02NTc3LTU3ZDAtOGEyZi03M2JhN2E1MzA3N2EiLCJQcmljZSI6MTguOTksIlF1YW50aXR5IjoxLCJCcmFuZCI6IiIsIlZhcmlhbnQiOiIiLCJDYXRlZ29yeSI6IiIsIlBvc2l0aW9uIjoiIiwiQ291cG9uQ29kZSI6IiIsIlRvdGFsQW1vdW50IjoxOC45OSwiQXR0cmlidXRlcyI6eyJDYXRhbG9ndWUgTmFtZSI6IjEwMCUgQmVlZiBCdXJnZXJzICIsIkNhdGFsb2d1ZSBVVUlEIjoiNzEzZDY2OWItNzQyNy01NjRkLWE4ZTQtNDA3YjAzYmMzYWFiIiwiZGVzY3JpcHRpb24gYXZhaWxhYmxlIjp0cnVlLCJNYXJrZXQgU2hvcnQgQ29kZSI6InNhbi1mcmFuY2lzY28iLCJQbGFjZSBDYXRlZ29yeSI6ImFtZXJpY2FuIiwiUGxhY2UgTmFtZSI6IkRlbm55JTI3cyIsIlBsYWNlIFVVSUQiOiI3YWU2Y2MzNC02YzcyLTRkYzctODIzZS02MWRjNzEyMzUzMmEiLCJUb3RhbCBQcm9kdWN0IEFtb3VudCI6MTguOTl9fSx7Ik5hbWUiOiJBbGwtQW1lcmljYW4gU2xhba4iLCJTa3UiOiIxNGQyMzA0MS1mZjc4LTVhMzQtYWViYi1kNGZkMzlhZjkzNjEiLCJQcmljZSI6MTYuMjksIlF1YW50aXR5IjoxLCJCcmFuZCI6IiIsIlZhcmlhbnQiOiIiLCJDYXRlZ29yeSI6IiIsIlBvc2l0aW9uIjoiIiwiQ291cG9uQ29kZSI6IiIsIlRvdGFsQW1vdW50IjoxNi4yOSwiQXR0cmlidXRlcyI6eyJDYXRhbG9ndWUgTmFtZSI6IlNsYW1zIiwiQ2F0YWxvZ3VlIFVVSUQiOiI5NWFlMDcxNi05NTM1LTUxNjgtODFmYy02NzA5YWM5OTRkNmIiLCJkZXNjcmlwdGlvbiBhdmFpbGFibGUiOnRydWUsIk1hcmtldCBTaG9ydCBDb2RlIjoic2FuLWZyYW5jaXNjbyIsIlBsYWNlIENhdGVnb3J5IjoiYW1lcmljYW4iLCJQbGFjZSBOYW1lIjoiRGVubnklMjdzIiwiUGxhY2UgVVVJRCI6IjdhZTZjYzM0LTZjNzItNGRjNy04MjNlLTYxZGM3MTIzNTMyYSIsIlRvdGFsIFByb2R1Y3QgQW1vdW50IjoxNi4yOX19XX19';

        setLocalStorage('mprtcl-prodv4', corruptLS, true);
        var LSBefore = localStorage.getItem('mprtcl-prodv4');
        LSBefore.should.equal(corruptLS);

        mParticle.init(apiKey, window.mParticle.config);

        var cartProducts = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getCart()
            .getCartProducts();
        cartProducts.length.should.equal(0);
        var LS = localStorage.getItem(LocalStorageProductsV4WithWorkSpaceName);

        LS.should.equal('eyJ0ZXN0TVBJRCI6eyJjcCI6W119fQ==');
        
        done();
    });

    it('integration test - should migrate from SDKv1CookieV3WithEncodedProducts to SDKv2CookieV4 and function properly when using local storage', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;

        setLocalStorage(v3LSKey, SDKv1CookieV3WithEncodedProducts, true);
        mParticle.init(apiKey, window.mParticle.config);

        mockServer.requests = [];
        var testName = "' ' test name ' with apostrophes";
        mParticle.eCommerce.Cart.add(
            mParticle.eCommerce.createProduct(testName, 'sku123', 1)
        );
        mParticle.eCommerce.logCheckout(1);

        var event = getEvent(mockServer.requests, 'eCommerce - Checkout');
        event.sc.pl.length.should.equal(0);

        done();
    });

    it('integration test - should add products with special characters to the cart without any errors', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;

        mParticle.init(apiKey, window.mParticle.config);
        var product1 = mParticle.eCommerce.createProduct(
            'asdfadsf’’’’',
            'asdf',
            123,
            1
        );
        var product2 = mParticle.eCommerce.createProduct(
            'asdfads®®®®',
            'asdf',
            123,
            1
        );
        mParticle.eCommerce.Cart.add([product1, product2]);

        var products = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getCart()
            .getCartProducts();
        products[0].Name.should.equal(product1.Name);
        products[1].Name.should.equal(product2.Name);

        var LS = localStorage.getItem(LocalStorageProductsV4WithWorkSpaceName);

        LS.should.equal(
            'eyJ0ZXN0TVBJRCI6eyJjcCI6W3siTmFtZSI6ImFzZGZhZHNm4oCZ4oCZ4oCZ4oCZIiwiU2t1IjoiYXNkZiIsIlByaWNlIjoxMjMsIlF1YW50aXR5IjoxLCJUb3RhbEFtb3VudCI6MTIzLCJBdHRyaWJ1dGVzIjpudWxsfSx7Ik5hbWUiOiJhc2RmYWRzwq7CrsKuwq4iLCJTa3UiOiJhc2RmIiwiUHJpY2UiOjEyMywiUXVhbnRpdHkiOjEsIlRvdGFsQW1vdW50IjoxMjMsIkF0dHJpYnV0ZXMiOm51bGx9XX19'
        );

        JSON.parse(atob(LS)).testMPID.cp[0].Name.should.equal('asdfadsfââââ');
        JSON.parse(atob(LS)).testMPID.cp[1].Name.should.equal(
            'asdfadsÂ®Â®Â®Â®'
        );

        var decoded = JSON.parse(decodeURIComponent(escape(atob(LS))));
        decoded.testMPID.cp[0].Name.should.equal(product1.Name);
        decoded.testMPID.cp[1].Name.should.equal(product2.Name);

        done();
    });

    it('integration test - should migrate from local storage with no products', function(done) {
        var les = new Date().getTime();
        mParticle._resetForTests(MPConfig);

        var cookieWithoutProducts =
            "{'sid':'234B3BA6-7BC2-4142-9CCD-015D7C4D0597'|'ie':1|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjE6MjQ6MDcuNzQ4OTU4MVoiLCJWYWx1ZSI6Imc9NGQzYzE0YmUtNDY3NC00MzY0LWJlOTAtZjBjYmI3ZGI4MTNhJnU9ODE2OTg0NjE2MjM0NjA2NDk0NiZjcj00NTgxOTI0In19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537219447486|'cgid':'429d1e42-5883-4296-91e6-8157765914d5'|'das':'4d3c14be-4674-4364-be90-f0cbb7db813a'|'mpid':'8169846162346064946'}";

        setLocalStorage(v3LSKey, cookieWithoutProducts, true);
        mParticle.init(apiKey, window.mParticle.config);

        var deviceId = mParticle.getDeviceId();
        deviceId.should.equal('4d3c14be-4674-4364-be90-f0cbb7db813a');

        done();
    });

    it('integration test - should migrate from cookies with no products', function(done) {
        var les = new Date().getTime();
        mParticle._resetForTests(MPConfig);

        var cookieWithoutProducts =
            "{'sid':'234B3BA6-7BC2-4142-9CCD-015D7C4D0597'|'ie':1|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjE6MjQ6MDcuNzQ4OTU4MVoiLCJWYWx1ZSI6Imc9NGQzYzE0YmUtNDY3NC00MzY0LWJlOTAtZjBjYmI3ZGI4MTNhJnU9ODE2OTg0NjE2MjM0NjA2NDk0NiZjcj00NTgxOTI0In19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537219447486|'cgid':'429d1e42-5883-4296-91e6-8157765914d5'|'das':'4d3c14be-4674-4364-be90-f0cbb7db813a'|'mpid':'8169846162346064946'}";
        setCookie(v3CookieKey, cookieWithoutProducts, true);
        mParticle.init(apiKey, window.mParticle.config);

        var deviceId = mParticle.getDeviceId();
        deviceId.should.equal('4d3c14be-4674-4364-be90-f0cbb7db813a');

        done();
    });

    it('integration test - migrates from local storage that have special characters in user attributes and user identities', function(done) {
        var les = new Date().getTime();

        mParticle._resetForTests(MPConfig);

        var cookieWithoutProducts =
            "{'sid':'1992BDBB-AD74-49DB-9B20-5EC8037E72DE'|'ie':1|'ua':'eyJ0ZXN0Ijoiwq7igJkifQ=='|'ui':'eyIzIjoiwq7igJkifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjI6MjI6MTAuMjU0MDcyOVoiLCJWYWx1ZSI6Imc9NjhjMmJhMzktYzg2OS00MTZhLWE4MmMtODc4OWNhZjVmMWU3JnU9NDE3NjQyNTYyMTQ0MTEwODk2OCZjcj00NTgxOTgyIn19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537222930186|'cgid':'4ebad5b4-8ed1-4275-8455-838a2e3aa5c0'|'das':'68c2ba39-c869-416a-a82c-8789caf5f1e7'|'mpid':'testMPID'}";
        setLocalStorage(v3LSKey, cookieWithoutProducts, true);

        mParticle.init(apiKey, window.mParticle.config);

        var currentUser = mParticle
            .getInstance()
            .Identity.getCurrentUser();
        var ui = currentUser.getUserIdentities();

        ui.userIdentities.twitter.should.equal('®’');

        done();
    });

    it('integration test - migrates from cookies that have special characters in user attributes and user identities', function(done) {
        var les = new Date().getTime();

        mParticle._resetForTests(MPConfig);

        var cookieWithoutProducts =
            "{'sid':'1992BDBB-AD74-49DB-9B20-5EC8037E72DE'|'ie':1|'ua':'eyJ0ZXN0Ijoiwq7igJkifQ=='|'ui':'eyIzIjoiwq7igJkifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjI6MjI6MTAuMjU0MDcyOVoiLCJWYWx1ZSI6Imc9NjhjMmJhMzktYzg2OS00MTZhLWE4MmMtODc4OWNhZjVmMWU3JnU9NDE3NjQyNTYyMTQ0MTEwODk2OCZjcj00NTgxOTgyIn19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537222930186|'cgid':'4ebad5b4-8ed1-4275-8455-838a2e3aa5c0'|'das':'68c2ba39-c869-416a-a82c-8789caf5f1e7'|'mpid':'testMPID'}";
        setCookie(v3CookieKey, cookieWithoutProducts, true);

        mParticle.init(apiKey, window.mParticle.config);

        var currentUser = mParticle
            .getInstance()
            .Identity.getCurrentUser();
        var ui = currentUser.getUserIdentities();

        ui.userIdentities.twitter.should.equal('®’');
        done();
    });

    it('integration test - saves user attributes with special characters ® and ’', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        var currentUser = mParticle
            .getInstance()
            .Identity.getCurrentUser();
        currentUser.setUserAttribute('test', '®’');
        mParticle.init(apiKey, window.mParticle.config);

        var ua = mParticle
            .getInstance()
            .Identity.getCurrentUser()
            .getAllUserAttributes();

        ua.test.should.equal('®’');

        done();
    });

    it('integration test - clears and creates new LS when LS is corrupt when migrating', function(done) {
        var les = new Date().getTime();

        mParticle._resetForTests(MPConfig);

        //an extra apostrophe is added to ua here to force a corrupt cookie. On init, cookies will clear and there will be a new cgid, sid, and das to exist
        var rawLS =
            "{'sid':'1992BDBB-AD74-49DB-9B20-5EC8037E72DE'|'ie':1|'ua':'eyJ0ZXN'0Ijoiwq7igJkifQ=='|'ui':'eyIzIjoiwq7igJkifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjI6MjI6MTAuMjU0MDcyOVoiLCJWYWx1ZSI6Imc9NjhjMmJhMzktYzg2OS00MTZhLWE4MmMtODc4OWNhZjVmMWU3JnU9NDE3NjQyNTYyMTQ0MTEwODk2OCZjcj00NTgxOTgyIn19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537222930186|'cgid':'4ebad5b4-8ed1-4275-8455-838a2e3aa5c0'|'das':'68c2ba39-c869-416a-a82c-8789caf5f1e7'|'mpid':'testMPID'}";
        setLocalStorage(v3LSKey, rawLS, true);

        mParticle.init(apiKey, window.mParticle.config);

        var sessionId = mParticle.getInstance()._SessionManager.getSession();
        var das = mParticle.getDeviceId();
        var cgid = mParticle.getInstance()._Persistence.getLocalStorage().gs
            .cgid;
        sessionId.should.not.equal('1992BDBB-AD74-49DB-9B20-5EC8037E72DE');
        das.should.not.equal('68c2ba39-c869-416a-a82c-8789caf5f1e7');
        cgid.should.not.equal('4ebad5b4-8ed1-4275-8455-838a2e3aa5c0');

        done();
    });

    it('integration test - clears and creates new cookies when cookies is corrupt when migrating', function(done) {
        var les = new Date().getTime();

        mParticle._resetForTests(MPConfig);

        //an extra apostrophe is added to ua here to force a corrupt cookie. On init, cookies will clear and there will be a new cgid, sid, and das to exist
        var cookies =
            "{'sid':'1992BDBB-AD74-49DB-9B20-5EC8037E72DE'|'ie':1|'ua':'eyJ0ZXN'0Ijoiwq7igJkifQ=='|'ui':'eyIzIjoiwq7igJkifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMTRUMjI6MjI6MTAuMjU0MDcyOVoiLCJWYWx1ZSI6Imc9NjhjMmJhMzktYzg2OS00MTZhLWE4MmMtODc4OWNhZjVmMWU3JnU9NDE3NjQyNTYyMTQ0MTEwODk2OCZjcj00NTgxOTgyIn19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537222930186|'cgid':'4ebad5b4-8ed1-4275-8455-838a2e3aa5c0'|'das':'68c2ba39-c869-416a-a82c-8789caf5f1e7'|'mpid':'testMPID'}";
        setCookie(v3CookieKey, cookies, true);

        mParticle.init(apiKey, window.mParticle.config);

        var sessionId = mParticle.getInstance()._SessionManager.getSession();
        var das = mParticle.getDeviceId();
        var cgid = mParticle.getInstance()._Persistence.getLocalStorage().gs
            .cgid;
        sessionId.should.not.equal('1992BDBB-AD74-49DB-9B20-5EC8037E72DE');
        das.should.not.equal('68c2ba39-c869-416a-a82c-8789caf5f1e7');
        cgid.should.not.equal('4ebad5b4-8ed1-4275-8455-838a2e3aa5c0');

        done();
    });

    it('integration test - clears products if when migrating they are corrupt', function(done) {
        var les = new Date().getTime();

        mParticle._resetForTests(MPConfig);

        // CP of mParticle.eCommerce.createProduct('iPhone®’ 8', 'iPhoneSKU123', 699, 1, '8 Plus 64GB', 'Phones', 'Apple', null, 'CouponCode1', {discount: 5, searchTerm: 'apple'});, and mParticle.eCommerce.createProduct('Galaxy®’ S9', 'AndroidSKU123', 699, 1, 'S9 Plus 64GB', 'Phones', 'Samsung', null, 'CouponCode2', {discount: 10, searchTerm: 'samsung'});
        // corrupt CP by adding a few characters to bas64 string
        var cookies =
            "{'cp':'111W3siTmFtZSI6ImlQaG9uasdfZcKu4oCZIDgiLCJTa3UiOiJpUGhvbmVTS1UxMjMiLCJQcmljZSI6Njk5LCJRdWFudGl0eSI6MSwiQnJhbmQiOiJBcHBsZSIsIlZhcmlhbnQiOiI4IFBsdXMgNjRHQiIsIkNhdGVnb3J5IjoiUGhvbmVzIiwiUG9zaXRpb24iOm51bGwsIkNvdXBvbkNvZGUiOiJDb3Vwb25Db2RlMSIsIlRvdGFsQW1vdW50Ijo2OTksIkF0dHJpYnV0ZXMiOnsiZGlzY291bnQiOjUsInNlYXJjaFRlcm0iOiJhcHBsZSJ9fSx7Ik5hbWUiOiJHYWxheHnCruKAmSBTOSIsIlNrdSI6IkFuZHJvaWRTS1UxMjMiLCJQcmljZSI6Njk5LCJRdWFudGl0eSI6MSwiQnJhbmQiOiJTYW1zdW5nIiwiVmFyaWFudCI6IlM5IFBsdXMgNjRHQiIsIkNhdGVnb3J5IjoiUGhvbmVzIiwiUG9zaXRpb24iOm51bGwsIkNvdXBvbkNvZGUiOiJDb3Vwb25Db2RlMiIsIlRvdGFsQW1vdW50Ijo2OTksIkF0dHJpYnV0ZXMiOnsiZGlzY291bnQiOjEwLCJzZWFyY2hUZXJtIjoic2Ftc3VuZyJ9fV0='|'sid':'5FB9CD47-CCC5-4897-B901-61059E9C5A0C'|'ie':1|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMjNUMTg6NDQ6MjUuMDg5OTk2NVoiLCJWYWx1ZSI6Imc9YTY3ZWZmZDAtY2UyMC00Y2M4LTg5MzgtNzc3MWY0YzQ2ZmZiJnU9MjA3Mzk0MTkzMjk4OTgyMzA5OSZjcj00NTk0NzI0In19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537987465067|'cgid':'d1ce6cb1-5f28-4520-8ce7-f67288590944'|'das':'a67effd0-ce20-4cc8-8938-7771f4c46ffb'|'mpid':'2073941932989823099'}";

        setCookie(v3CookieKey, cookies, true);
        mParticle.init(apiKey, window.mParticle.config);

        Should(
            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getCart()
                .getCartProducts().length
        ).not.be.ok();

        done();
    });

    it('does not throw error during migration step when local storage does not exist', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = false;
        var cookies =
            "{'cp':'111W3siTmFtZSI6ImlQaG9uasdfZcKu4oCZIDgiLCJTa3UiOiJpUGhvbmVTS1UxMjMiLCJQcmljZSI6Njk5LCJRdWFudGl0eSI6MSwiQnJhbmQiOiJBcHBsZSIsIlZhcmlhbnQiOiI4IFBsdXMgNjRHQiIsIkNhdGVnb3J5IjoiUGhvbmVzIiwiUG9zaXRpb24iOm51bGwsIkNvdXBvbkNvZGUiOiJDb3Vwb25Db2RlMSIsIlRvdGFsQW1vdW50Ijo2OTksIkF0dHJpYnV0ZXMiOnsiZGlzY291bnQiOjUsInNlYXJjaFRlcm0iOiJhcHBsZSJ9fSx7Ik5hbWUiOiJHYWxheHnCruKAmSBTOSIsIlNrdSI6IkFuZHJvaWRTS1UxMjMiLCJQcmljZSI6Njk5LCJRdWFudGl0eSI6MSwiQnJhbmQiOiJTYW1zdW5nIiwiVmFyaWFudCI6IlM5IFBsdXMgNjRHQiIsIkNhdGVnb3J5IjoiUGhvbmVzIiwiUG9zaXRpb24iOm51bGwsIkNvdXBvbkNvZGUiOiJDb3Vwb25Db2RlMiIsIlRvdGFsQW1vdW50Ijo2OTksIkF0dHJpYnV0ZXMiOnsiZGlzY291bnQiOjEwLCJzZWFyY2hUZXJtIjoic2Ftc3VuZyJ9fV0='|'sid':'5FB9CD47-CCC5-4897-B901-61059E9C5A0C'|'ie':1|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjgtMDktMjNUMTg6NDQ6MjUuMDg5OTk2NVoiLCJWYWx1ZSI6Imc9YTY3ZWZmZDAtY2UyMC00Y2M4LTg5MzgtNzc3MWY0YzQ2ZmZiJnU9MjA3Mzk0MTkzMjk4OTgyMzA5OSZjcj00NTk0NzI0In19'|'dt':'e207c24e36a7a8478ba0fcb3707a616b'|'les':" +
            les +
            "|'ssd':1537987465067|'cgid':'d1ce6cb1-5f28-4520-8ce7-f67288590944'|'das':'a67effd0-ce20-4cc8-8938-7771f4c46ffb'|'mpid':'testMPID'}";

        setCookie(v3CookieKey, cookies, true);

        mParticle._forceNoLocalStorage = true;

        mParticle.init(apiKey, window.mParticle.config);
        (window.localStorage.getItem('mprtclv4') === null).should.equal(true);
        findCookie(v4CookieKey).cu.should.equal('testMPID');
        delete mParticle._forceNoLocalStorage;

        done();
    });

    it('migrates from v4cookie to name spaced cookie', function(done) {
        mParticle.workspaceToken = 'abcdef';
        mParticle._resetForTests(MPConfig);
        var date = new Date().getTime();
        setCookie(
            v4CookieKey,
            JSON.stringify({
                gs: {
                    les: date,
                    dt: apiKey,
                    cgid: 'testCGID',
                    das: 'testDAS',
                    ssd: date,
                },
                testMPID: {
                    ui: btoa(JSON.stringify({ 1: 'customerid' })),
                    ua: btoa(JSON.stringify({ age: 30 })),
                    csd: btoa(JSON.stringify({ 5: date })),
                },
                cu: testMPID,
            })
        );

        mParticle.config.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.workspaceToken = null;

        var newCookies = findCookie(v4CookieKey);
        newCookies.gs.les.should.aboveOrEqual(date);
        newCookies.gs.should.have.property('dt', apiKey);
        newCookies.gs.should.have.property('cgid', 'testCGID');
        newCookies.gs.should.have.property('das', 'testDAS');
        newCookies.should.have.property('testMPID');
        newCookies.testMPID.ui.should.have.property('1', 'customerid');
        newCookies.testMPID.ua.should.have.property('age', 30);
        newCookies.testMPID.csd.should.have.property('5', date);

        done();
    });

    it('migrates from v4cookie to name spaced localStorage', function(done) {
        mParticle.workspaceToken = 'abcdef';
        mParticle._resetForTests(MPConfig);
        var date = new Date().getTime();
        setLocalStorage(v4CookieKey, {
            gs: {
                les: date,
                dt: apiKey,
                cgid: 'testCGID',
                das: 'testDAS',
                ssd: date,
            },
            testMPID: {
                ui: btoa(JSON.stringify({ 1: 'customerid' })),
                ua: btoa(JSON.stringify({ age: 30 })),
                csd: btoa(JSON.stringify({ 5: date })),
            },
            cu: testMPID,
        });

        mParticle.config.useCookieStorage = false;

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.workspaceToken = null;

        var oldLS = localStorage.getItem(v4CookieKey);
        Should(oldLS).not.be.ok();

        var newLS = localStorage.getItem(workspaceCookieName);
        Should(newLS).be.ok();

        var data = mParticle.getInstance()._Persistence.getLocalStorage();
        data.gs.les.should.aboveOrEqual(date);
        data.gs.should.have.property('dt', apiKey);
        data.gs.should.have.property('cgid', 'testCGID');
        data.gs.should.have.property('das', 'testDAS');
        data.should.have.property('testMPID');
        data.testMPID.ui.should.have.property('1', 'customerid');
        data.testMPID.ua.should.have.property('age', 30);
        data.testMPID.csd.should.have.property('5', date);

        done();
    });

    it('migrates from nonNameSpaced products to nameSpacedProducts on localStorage', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, window.mParticle.config);
        var product1 = mParticle.eCommerce.createProduct(
            'iphone',
            'iphoneSKU',
            999
        );
        var product2 = mParticle.eCommerce.createProduct(
            'galaxy',
            'galaxySKU',
            799
        );
        mParticle.eCommerce.Cart.add([product1, product2]);

        var oldLS = localStorage.getItem(localStorageProductsV4);
        Should(oldLS).not.be.ok();

        mParticle.workspaceToken = 'abcdef';
        mParticle.init(apiKey, window.mParticle.config);

        var newLS = JSON.parse(
            atob(localStorage.getItem(LocalStorageProductsV4WithWorkSpaceName))
        );
        var products = newLS.testMPID.cp;
        products.should.have.length(2);
        products[0].should.have.property('Name', 'iphone');
        products[0].should.have.property('Sku', 'iphoneSKU');
        products[0].should.have.property('Price', 999);
        products[1].should.have.property('Name', 'galaxy');
        products[1].should.have.property('Sku', 'galaxySKU');
        products[1].should.have.property('Price', 799);

        done();
    });

    it('should ignore cookies it cannot parse', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, window.mParticle.config);

        setCookie('abc', 'x%DA%D336566%07%00%04%23%014', true);
        var noError = mParticle.getInstance()._Persistence.getCookie();
        (noError === null).should.equal(true);

        mParticle.init(apiKey, window.mParticle.config);
        //set to be valid to avoid disrupting other tests
        setCookie('abc', '', true);

        done();
    });
});
