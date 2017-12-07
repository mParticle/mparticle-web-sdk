var TestsCore = require('./tests-core'),
    apiKey = TestsCore.apiKey,
    testMPID = TestsCore.testMPID,
    v1CookieKey = TestsCore.v1CookieKey,
    v1localStorageKey = TestsCore.v1localStorageKey,
    v2CookieKey = TestsCore.v2CookieKey,
    v3CookieKey = TestsCore.v3CookieKey,
    getLocalStorageProducts = TestsCore.getLocalStorageProducts,
    setCookie = TestsCore.setCookie,
    setLocalStorage = TestsCore.setLocalStorage,
    getEvent = TestsCore.getEvent,
    v3LSKey = TestsCore.v3LSKey,
    server = TestsCore.server;

describe('persistence migrations from SDKv1 to SDKv2', function() {
    var mP = mParticle.persistence;
    var les = new Date().getTime();

    var SDKv1CookieV1 = '%7B%22sid%22%3A%22e46162ec-6aec-406e-a8ba-919cacb2ec2e%22%2C%22ie%22%3Atrue%2C%22sa%22%3A%7B%22sa1%22%3A%22value1%22%7D%2C%22ua%22%3A%7B%22attr1%22%3A%22value1%22%7D%2C%22ui%22%3A%5B%7B%22Identity%22%3A%22test%40email.com%22%2C%22Type%22%3A7%7D%2C%7B%22Identity%22%3A%22customerid1%22%2C%22Type%22%3A1%7D%5D%2C%22ss%22%3A%7B%22uid%22%3A%7B%22Expires%22%3A%222027-10-31T16%3A35%3A16.119943Z%22%2C%22Value%22%3A%22g%3Dced3bf8b-feb3-4e11-9ad3-8bc9060d5f37%26u%3D1621014208195017243%26cr%3D4122275%22%7D%7D%2C%22dt%22%3A%22' + apiKey + '%22%2C%22les%22%3A' + les + '%2C%22av%22%3A%221.5.0%22%2C%22cgid%22%3A%223645bd15-6790-435e-9a85-2a6cb28d3a0b%22%2C%22das%22%3A%22ced3bf8b-feb3-4e11-9ad3-8bc9060d5f37%22%2C%22csd%22%3A%7B%2211%22%3A1509640513335%7D%2C%22mpid%22%3A%22' + testMPID + '%22%2C%22cp%22%3A%5B%7B%22Name%22%3A%22iPhone%22%2C%22Sku%22%3A%22SKU1%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%2C%22Attributes%22%3Anull%7D%2C%7B%22Name%22%3A%22Android%22%2C%22Sku%22%3A%22SKU2%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%2C%22Attributes%22%3Anull%7D%2C%7B%22Name%22%3A%22iPhone%22%2C%22Sku%22%3A%22SKU1%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%2C%7B%22Name%22%3A%22Android%22%2C%22Sku%22%3A%22SKU2%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%2C%22pb%22%3A%7B%22pb1%22%3A%5B%7B%22Name%22%3A%22iPhone%22%2C%22Sku%22%3A%22SKU1%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%7D%7D';

    var SDKv1CookieV2 =
    '%7B%22sid%22%3A%22cebf1fa5-0e90-42dc-bd68-f9d4f9556c97%22%2C%22ie%22%3Atrue%2C%22sa%22%3A%7B%22sa1%22%3A%22value1%22%7D%2C%22ua%22%3A%7B%22attr1%22%3A%22value1%22%7D%2C%22ui%22%3A%5B%7B%22Identity%22%3A%22customerid1%22%2C%22Type%22%3A1%7D%2C%7B%22Identity%22%3A%22test%40email.com%22%2C%22Type%22%3A7%7D%5D%2C%22ss%22%3A%7B%22uid%22%3A%7B%22Expires%22%3A%222027-10-31T17%3A43%3A24.385099Z%22%2C%22Value%22%3A%22g%3Dd9daebb0-46bd-457e-a510-f5b38434d013%26u%3D-6879874738958367199%26cr%3D4122343%22%7D%7D%2C%22dt%22%3A%22' + apiKey + '%22%2C%22les%22%3A' + les + '%2C%22av%22%3Anull%2C%22cgid%22%3A%2215997eed-a6e8-4b5d-9ff0-692a5b6601cf%22%2C%22das%22%3A%22d9daebb0-46bd-457e-a510-f5b38434d013%22%2C%22csd%22%3A%7B%2211%22%3A1509644604385%7D%2C%22mpid%22%3A%22' + testMPID + '%22%7D';

    var SDKv1CookieV3 = '{"sid":"cc3e7de7-67d0-4581-b4ae-242e8773f0a4"|"ie":1|"sa":"eyJzYTEiOiJ2YWx1ZTEifQ=="|"ua":"eyJhdHRyMSI6InZhbHVlMSJ9"|"ui":"eyIxIjoiY3VzdG9tZXJpZDEiLCI3IjoidGVzdEBlbWFpbC5jb20ifQ=="|"ss":"eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTAtMzFUMTk6MzI6NTguNjA1NzkxWiIsIlZhbHVlIjoiZz1iMTNjNmZkNS05ZjBiLTQ3NGEtODQzZi1jY2RlZDAxZmY5ZDgmdT0tODI2NDc2MDM5ODIzNzQwNTMzMyZjcj00MTIyNDUyIn19"|"dt":"' + apiKey + '"|"les":' + les + '|"av":"1.5.0"|"cgid":"63781306-983e-4bec-8b0c-2c58b14f6d4e"|"das":"b13c6fd5-9f0b-474a-843f-ccded01ff9d8"|"csd":"eyIxMSI6MTUwOTY1MTE3ODYwNX0="|"mpid":"' + testMPID + '"}';

    var SDKv1CookieV3Full = '{"cp":[{"Name":"iPhone"|"Sku":"SKU1"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}|{"Name":"Android"|"Sku":"SKU2"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}]|"pb":{"pb1":[{"Name":"HTC"|"Sku":"SKU3"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}]}|"sid":"045af0fa-8f05-43fa-a076-28bdc1d5ec3e"|"ie":1|"sa":"eyJzYTEiOiJ2YWx1ZTEifQ=="|"ua":"eyJ1YTEiOiJ2YWx1ZTEifQ=="|"ui":"eyI3IjoidGVzdEBlbWFpbC5jb20ifQ=="|"ss":"eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTEtMDFUMTk6NDI6NDkuNjc5NDQyWiIsIlZhbHVlIjoiZz02ZmZmZDNmNC0yY2UxLTQ3NDYtODU3ZS05OTE4ZGY3ZDRjNWQmdT0zNDgyMDExODE1OTQ5MDc5MDc0JmNyPTQxMjM5MDIifX0="|"dt":"' + apiKey + '"|"les":' + les + '|"av":"1.5.0"|"cgid":"76bd51b3-7dad-491f-9620-0c57223a4e9f"|"das":"6fffd3f4-2ce1-4746-857e-9918df7d4c5d"|"csd":"eyIxMSI6MTUwOTczODE2ODI0NX0="|"mpid":"' + testMPID + '"}';

    var SDKv1CookieV3LSProdOnly = '{"cp":[{"Name":"iPhone"|"Sku":"SKU1"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}|{"Name":"Android"|"Sku":"SKU2"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}]|"pb":{"pb1":[{"Name":"iPhone"|"Sku":"SKU1"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}]}|"sid":"d41941c3-2f0a-40fb-b292-60de73a7f913"|"ie":1|"sa":"eyJzYTEiOiJ2YWx1ZTEifQ=="|"ua":"eyJhdHRyMSI6InZhbHVlMSJ9"|"ui":"eyIxIjoiY3VzdG9tZXJpZDEiLCI3IjoidGVzdEBlbWFpbC5jb20ifQ=="|"ss":"eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTAtMzFUMjE6MjI6NTIuMTY2MjJaIiwiVmFsdWUiOiJnPWZjYjIzYmIyLTljM2UtNGNjNC1iOGQ1LTFhNTNkMjc2OGUwMSZ1PTMxMTEyODg1MzY5MjI5MjQ2NiZjcj00MTIyNTYyIn19"|"dt":"' + apiKey + '"|"les":' + les + '|"av":"1.5.0"|"cgid":"8b899cc3-e823-4b48-afc7-2f59469f1ae3"|"das":"fcb23bb2-9c3e-4cc4-b8d5-1a53d2768e01"|"csd":"eyIxMSI6MTUwOTY1Nzc3MjE0OX0="|"mpid":"' + testMPID + '"}';

    var SDKv2CookieV1 = '%7B%22globalSettings%22%3A%7B%22currentSessionMPIDs%22%3A%5B%228179891178059554209%22%2C%224573473690267104222%22%5D%2C%22sid%22%3A%22294c8c34-328a-4285-9590-9014af35c843%22%2C%22ie%22%3Atrue%2C%22sa%22%3A%7B%22sa1%22%3A%22value1%22%7D%2C%22ss%22%3A%7B%7D%2C%22dt%22%3A%22' + apiKey + '%22%2C%22les%22%3A' + les + '%2C%22av%22%3Anull%2C%22cgid%22%3A%22d19cf18e-fda3-4e75-976d-a9a7028f33bc%22%2C%22das%22%3A%229c9ddd32-5873-4dfd-8221-0d31a16f6a27%22%2C%22c%22%3A%22%22%7D%2C%228179891178059554209%22%3A%7B%22ua%22%3A%7B%22ua1%22%3A%22value1%22%7D%2C%22ui%22%3A%7B%22email%22%3A%22test%40email.com%22%2C%22customerid%22%3A%22customerid1%22%7D%2C%22csd%22%3A%7B%225%22%3A123123%7D%2C%22mpid%22%3A%228179891178059554209%22%2C%22cp%22%3A%5B%7B%22Name%22%3A%22iPhone%22%2C%22Sku%22%3A%22SKU1%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%2C%7B%22Name%22%3A%22Android%22%2C%22Sku%22%3A%22SKU2%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%2C%22pb%22%3A%7B%22pbtest%22%3A%5B%7B%22Name%22%3A%22HTC%22%2C%22Sku%22%3A%22SKU3%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%7D%7D%2C%22currentUserMPID%22%3A%224573473690267104222%22%2C%224573473690267104222%22%3A%7B%22ua%22%3A%7B%22ua1%22%3A%22value2%22%7D%2C%22ui%22%3A%7B%22email%22%3A%22test2%40email.com%22%2C%22customerid%22%3A%22customerid2%22%7D%2C%22csd%22%3A%7B%225%22%3A123123%7D%2C%22mpid%22%3A%224573473690267104222%22%2C%22cp%22%3A%5B%7B%22Name%22%3A%22iPhone%22%2C%22Sku%22%3A%22SKU1%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%2C%7B%22Name%22%3A%22Android%22%2C%22Sku%22%3A%22SKU2%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%2C%22pb%22%3A%7B%22pbtest%22%3A%5B%7B%22Name%22%3A%22HTC%22%2C%22Sku%22%3A%22SKU3%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%7D%7D%7D';

    var SDKv1CookieV3FullLSApostrophes = "{'cp':[{'Name':'iPhone'|'Sku':'SKU1'|'Price':1|'Quantity':1|'TotalAmount':1|'Attributes':null}|{'Name':'Android'|'Sku':'SKU2'|'Price':1|'Quantity':1|'TotalAmount':1|'Attributes':null}]|'pb':{'pb1':[{'Name':'HTC'|'Sku':'SKU3'|'Price':1|'Quantity':1|'TotalAmount':1|'Attributes':null}|{'Name':'Windows'|'Sku':'SKU4'|'Price':1|'Quantity':1|'TotalAmount':1|'Attributes':null}]}|'sid':'ed937016-a06f-4275-9af4-c1830cfe951f'|'ie':1|'sa':'eyJzYTEiOiJ2YWx1ZTEifQ=='|'ua':'eyJ1YTEiOiJ2YWx1ZTEifQ=='|'ui':'eyIxIjoiY3VzdG9tZXJpZDEiLCI3IjoidGVzdEBlbWFpbC5jb20ifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTEtMDZUMTg6MTE6NDMuMjU2MDY2WiIsIlZhbHVlIjoiZz02ODFlNDMyNC0yYmFjLTQwMzYtODNkOC02MTNlZDRlYzNkY2MmdT02MjI3NDUxOTA2MTg2MDU1MDUmY3I9NDEzMTAxMSJ9fQ=='|'dt':'" + apiKey + "'|'les':" + les + "|'av':'1.5.0'|'cgid':'20f258e9-13cb-4751-ac7a-b2c66ef18db4'|'das':'681e4324-2bac-4036-83d8-613ed4ec3dcc'|'csd':'eyIxMSI6MTUxMDE2NDcwMzI0N30='|'mpid':'" + testMPID + "'}";

    var SDKv1CookieV3NoProdLSApostrophes = "{'sid':'ed937016-a06f-4275-9af4-c1830cfe951f'|'ie':1|'sa':'eyJzYTEiOiJ2YWx1ZTEifQ=='|'ua':'eyJ1YTEiOiJ2YWx1ZTEifQ=='|'ui':'eyIxIjoiY3VzdG9tZXJpZDEiLCI3IjoidGVzdEBlbWFpbC5jb20ifQ=='|'ss':'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTEtMDZUMTg6MTE6NDMuMjU2MDY2WiIsIlZhbHVlIjoiZz02ODFlNDMyNC0yYmFjLTQwMzYtODNkOC02MTNlZDRlYzNkY2MmdT02MjI3NDUxOTA2MTg2MDU1MDUmY3I9NDEzMTAxMSJ9fQ=='|'dt':'" + apiKey + "'|'les':" + les + "|'av':'1.5.0'|'cgid':'20f258e9-13cb-4751-ac7a-b2c66ef18db4'|'das':'681e4324-2bac-4036-83d8-613ed4ec3dcc'|'csd':'eyIxMSI6MTUxMDE2NDcwMzI0N30='|'mpid':'" + testMPID + "'}";

    var SDKv1CookieV1Parsed = JSON.parse(decodeURIComponent(SDKv1CookieV1));
    var SDKv1CookieV2Parsed = JSON.parse(decodeURIComponent(SDKv1CookieV2));
    var SDKv1CookieV3Parsed = JSON.parse(mP.replacePipesWithCommas(SDKv1CookieV3));
    var SDKv1CookieV3FullParsed = JSON.parse(mP.replacePipesWithCommas(SDKv1CookieV3Full));
    var SDKv1CookieV3LSProdOnlyParsed = JSON.parse(mP.replacePipesWithCommas(SDKv1CookieV3LSProdOnly));
    var SDKv2CookieV1Parsed = JSON.parse(decodeURIComponent(SDKv2CookieV1));

    var SDKv1CookieV3FullLSApostrophesParsed = JSON.parse(mP.replacePipesWithCommas(mP.replaceApostrophesWithQuotes(SDKv1CookieV3FullLSApostrophes)));
    var SDKv1CookieV3NoProdLSApostrophesParsed = JSON.parse(mP.replacePipesWithCommas(mP.replaceApostrophesWithQuotes(SDKv1CookieV3NoProdLSApostrophes)));

    it('unit test - convertSDKv1CookiesV1ToSDKv2CookiesV4', function(done) {
        mParticle.reset();

        var v4Cookies = JSON.parse(mParticle.migrations.convertSDKv1CookiesV1ToSDKv2CookiesV4(SDKv1CookieV1));

        v4Cookies.should.have.properties('gs', SDKv1CookieV1Parsed.mpid, 'cu');
        v4Cookies.cu.should.equal(SDKv1CookieV1Parsed.mpid);
        v4Cookies.gs.should.have.properties('csm', 'sid', 'ie', 'sa', 'ss', 'dt', 'les', 'av', 'cgid', 'das');
        v4Cookies.gs.sid.should.equal(SDKv1CookieV1Parsed.sid);
        v4Cookies.gs.ie.should.equal(SDKv1CookieV1Parsed.ie);
        v4Cookies.gs.sa.sa1.should.equal(SDKv1CookieV1Parsed.sa.sa1);
        v4Cookies.gs.ss.uid.Expires.should.equal(SDKv1CookieV1Parsed.ss.uid.Expires);
        v4Cookies.gs.ss.uid.Value.should.equal(SDKv1CookieV1Parsed.ss.uid.Value);
        v4Cookies.gs.dt.should.equal(SDKv1CookieV1Parsed.dt);
        v4Cookies.gs.les.should.equal(SDKv1CookieV1Parsed.les);
        v4Cookies.gs.av.should.equal(SDKv1CookieV1Parsed.av);
        v4Cookies.gs.cgid.should.equal(SDKv1CookieV1Parsed.cgid);
        v4Cookies.gs.das.should.equal(SDKv1CookieV1Parsed.das);
        JSON.stringify(v4Cookies.gs.csm).should.equal(JSON.stringify([SDKv1CookieV1Parsed.mpid]));
        v4Cookies[SDKv1CookieV1Parsed.mpid].should.have.properties('ua', 'ui', 'csd');
        v4Cookies[SDKv1CookieV1Parsed.mpid].should.not.have.property('mpid');
        v4Cookies[SDKv1CookieV1Parsed.mpid].should.not.have.property('cp');
        v4Cookies[SDKv1CookieV1Parsed.mpid].should.not.have.property('pb');
        v4Cookies[SDKv1CookieV1Parsed.mpid].ua.attr1.should.equal(SDKv1CookieV1Parsed.ua.attr1);
        v4Cookies[SDKv1CookieV1Parsed.mpid].ua.attr1.should.equal('value1');
        v4Cookies[SDKv1CookieV1Parsed.mpid].ui.should.have.property('7', SDKv1CookieV1Parsed.ui[0].Identity);
        v4Cookies[SDKv1CookieV1Parsed.mpid].ui.should.have.property('1', SDKv1CookieV1Parsed.ui[1].Identity);
        v4Cookies[SDKv1CookieV1Parsed.mpid].csd['11'].should.equal(SDKv1CookieV1Parsed.csd['11']);

        var localStorageProducts = getLocalStorageProducts();
        JSON.stringify(localStorageProducts[SDKv1CookieV1Parsed.mpid].cp).should.equal(JSON.stringify(SDKv1CookieV1Parsed.cp));
        JSON.stringify(localStorageProducts[SDKv1CookieV1Parsed.mpid].pb).should.equal(JSON.stringify(SDKv1CookieV1Parsed.pb));

        done();
    });

    it('integration test - should migrate from SDKv1CookieV1 to SDKv2CookieV4 and function properly when using cookie storage', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = true;
        setCookie(v1CookieKey, SDKv1CookieV1, true);

        mParticle.init(apiKey);
        server.requests = [];
        mParticle.eCommerce.logCheckout(1);
        var event = getEvent('eCommerce - Checkout');

        event.ua.should.have.property('attr1', SDKv1CookieV1Parsed.ua.attr1);
        event.ui[0].should.have.property('Identity', 'customerid1');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test@email.com');
        event.ui[1].should.have.property('Type', 7);
        event.sa.should.have.property('sa1', SDKv1CookieV1Parsed.sa.sa1);
        event.cgid.should.equal(SDKv1CookieV1Parsed.cgid);
        event.av.should.equal(SDKv1CookieV1Parsed.av);
        event.sc.pl[0].should.have.property('id', 'SKU1');
        event.sc.pl[0].should.have.property('nm', 'iPhone');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl[1].should.have.property('id', 'SKU2');
        event.sc.pl[1].should.have.property('nm', 'Android');
        event.sc.pl[1].should.have.property('pr', 1);

        done();
    });

    it('integration test - should migrate from SDKv1CookieV1 to SDKv2CookieV4 and function properly when using local storage', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = false;

        setLocalStorage(v1localStorageKey, SDKv1CookieV1, true);

        mParticle.init(apiKey);
        server.requests = [];
        mParticle.eCommerce.logCheckout(1);
        var event = getEvent('eCommerce - Checkout');

        event.ua.should.have.property('attr1', SDKv1CookieV1Parsed.ua.attr1);
        event.ui[0].should.have.property('Identity', 'customerid1');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test@email.com');
        event.ui[1].should.have.property('Type', 7);

        event.sa.should.have.property('sa1', SDKv1CookieV1Parsed.sa.sa1);
        event.cgid.should.equal(SDKv1CookieV1Parsed.cgid);
        event.av.should.equal(SDKv1CookieV1Parsed.av);
        event.sc.pl[0].should.have.property('id', 'SKU1');
        event.sc.pl[0].should.have.property('nm', 'iPhone');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl[1].should.have.property('id', 'SKU2');
        event.sc.pl[1].should.have.property('nm', 'Android');
        event.sc.pl[1].should.have.property('pr', 1);

        done();
    });

    it('unit test - convertSDKv1CookiesV2ToSDKv2CookiesV4', function(done) {
        mParticle.reset();
        var v4Cookies = JSON.parse(mParticle.migrations.convertSDKv1CookiesV2ToSDKv2CookiesV4(SDKv1CookieV2));
        var productsRawCookie = '%7B%22cp%22%3A%5B%7B%22Name%22%3A%22iPhone%22%2C%22Sku%22%3A%22SKU1%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%2C%7B%22Name%22%3A%22Android%22%2C%22Sku%22%3A%22SKU2%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%2C%22pb%22%3A%7B%22pb1%22%3A%5B%7B%22Name%22%3A%22iPhone%22%2C%22Sku%22%3A%22SKU1%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%7D%7D';
        localStorage.setItem('mprtcl-api', productsRawCookie);
        v4Cookies.should.have.properties('gs', SDKv1CookieV2Parsed.mpid, 'cu');
        v4Cookies.cu.should.equal(SDKv1CookieV2Parsed.mpid);

        v4Cookies.gs.should.have.properties('csm', 'sid', 'ie', 'ss', 'dt', 'les', 'cgid', 'das');
        v4Cookies.gs.sid.should.equal(SDKv1CookieV2Parsed.sid);
        v4Cookies.gs.ie.should.equal(SDKv1CookieV2Parsed.ie);
        v4Cookies.gs.ss.uid.Expires.should.equal(SDKv1CookieV2Parsed.ss.uid.Expires);
        v4Cookies.gs.ss.uid.Value.should.equal(SDKv1CookieV2Parsed.ss.uid.Value);
        v4Cookies.gs.dt.should.equal(SDKv1CookieV2Parsed.dt);
        v4Cookies.gs.les.should.equal(SDKv1CookieV2Parsed.les);
        v4Cookies.gs.cgid.should.equal(SDKv1CookieV2Parsed.cgid);
        v4Cookies.gs.das.should.equal(SDKv1CookieV2Parsed.das);
        JSON.stringify(v4Cookies.gs.csm).should.equal(JSON.stringify([SDKv1CookieV2Parsed.mpid]));

        v4Cookies[SDKv1CookieV2Parsed.mpid].should.have.properties('ua', 'ui', 'csd');
        v4Cookies[SDKv1CookieV2Parsed.mpid].should.not.have.property('mpid');
        v4Cookies[SDKv1CookieV2Parsed.mpid].should.not.have.property('cp');
        v4Cookies[SDKv1CookieV2Parsed.mpid].should.not.have.property('pb');
        v4Cookies[SDKv1CookieV2Parsed.mpid].ua.attr1.should.equal(SDKv1CookieV2Parsed.ua.attr1);
        v4Cookies[SDKv1CookieV2Parsed.mpid].ua.attr1.should.equal('value1');
        v4Cookies[SDKv1CookieV2Parsed.mpid].ui.should.have.property('7', SDKv1CookieV2Parsed.ui[1].Identity);
        v4Cookies[SDKv1CookieV2Parsed.mpid].ui.should.have.property('1', SDKv1CookieV2Parsed.ui[0].Identity);
        v4Cookies[SDKv1CookieV2Parsed.mpid].csd['11'].should.equal(SDKv1CookieV2Parsed.csd['11']);

        done();
    });

    it('integration test - should migrate from SDKv1CookieV2 to SDKv2CookieV4 and function properly when using cookies', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = true;
        setCookie(v2CookieKey, SDKv1CookieV2, true);
        var productsRawCookie = '%7B%22cp%22%3A%5B%7B%22Name%22%3A%22iPhone%22%2C%22Sku%22%3A%22SKU1%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%2C%7B%22Name%22%3A%22Android%22%2C%22Sku%22%3A%22SKU2%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%2C%22pb%22%3A%7B%22pb1%22%3A%5B%7B%22Name%22%3A%22iPhone%22%2C%22Sku%22%3A%22SKU1%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%7D%7D';
        localStorage.setItem('mprtcl-api', productsRawCookie);

        mParticle.init(apiKey);
        server.requests = [];
        mParticle.eCommerce.logCheckout(1);
        var event = getEvent('eCommerce - Checkout');

        event.ua.should.have.property('attr1', SDKv1CookieV2Parsed.ua.attr1);
        event.ui[0].should.have.property('Identity', 'customerid1');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test@email.com');
        event.ui[1].should.have.property('Type', 7);

        event.sa.should.have.property('sa1', SDKv1CookieV2Parsed.sa.sa1);
        event.cgid.should.equal(SDKv1CookieV2Parsed.cgid);
        event.sc.pl[0].should.have.property('id', 'SKU1');
        event.sc.pl[0].should.have.property('nm', 'iPhone');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl[1].should.have.property('id', 'SKU2');
        event.sc.pl[1].should.have.property('nm', 'Android');
        event.sc.pl[1].should.have.property('pr', 1);

        done();
    });

    it('integration test - should migrate from SDKv1CookieV2 to SDKv2CookieV4 and function properly when using local storage', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = false;
        setCookie(v2CookieKey, SDKv1CookieV2, true);
        var productsRawCookie = '%7B%22cp%22%3A%5B%7B%22Name%22%3A%22iPhone%22%2C%22Sku%22%3A%22SKU1%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%2C%7B%22Name%22%3A%22Android%22%2C%22Sku%22%3A%22SKU2%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%2C%22pb%22%3A%7B%22pb1%22%3A%5B%7B%22Name%22%3A%22iPhone%22%2C%22Sku%22%3A%22SKU1%22%2C%22Price%22%3A1%2C%22Quantity%22%3A1%2C%22TotalAmount%22%3A1%7D%5D%7D%7D';
        localStorage.setItem('mprtcl-api', productsRawCookie);

        mParticle.init(apiKey);
        server.requests = [];
        mParticle.eCommerce.logCheckout(1);
        var event = getEvent('eCommerce - Checkout');

        event.ua.should.have.property('attr1', SDKv1CookieV2Parsed.ua.attr1);
        event.ui[0].should.have.property('Identity', 'customerid1');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test@email.com');
        event.ui[1].should.have.property('Type', 7);

        event.sa.should.have.property('sa1', SDKv1CookieV2Parsed.sa.sa1);
        event.cgid.should.equal(SDKv1CookieV2Parsed.cgid);
        event.sc.pl[0].should.have.property('id', 'SKU1');
        event.sc.pl[0].should.have.property('nm', 'iPhone');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl[1].should.have.property('id', 'SKU2');
        event.sc.pl[1].should.have.property('nm', 'Android');
        event.sc.pl[1].should.have.property('pr', 1);

        done();
    });

    it('unit test - should migrate from SDKv1CookieV3 to SDKv2CookieV4 using convertSDKv1CookiesV3ToSDKv2CookiesV4', function(done) {
        mParticle.reset();
        var v4Cookies = JSON.parse(mParticle.migrations.convertSDKv1CookiesV3ToSDKv2CookiesV4(SDKv1CookieV3));

        v4Cookies.should.have.properties('gs', SDKv1CookieV3Parsed.mpid, 'cu');
        v4Cookies.cu.should.equal(SDKv1CookieV3Parsed.mpid);
        v4Cookies.gs.should.have.properties('csm', 'sid', 'ie', 'sa', 'ss', 'dt', 'les', 'av', 'cgid', 'das');
        v4Cookies.gs.sid.should.equal(SDKv1CookieV3Parsed.sid);
        v4Cookies.gs.ie.should.equal(SDKv1CookieV3Parsed.ie);

        atob(v4Cookies.gs.sa).should.equal(atob(SDKv1CookieV3Parsed.sa));
        atob(v4Cookies.gs.ss).should.equal(atob(SDKv1CookieV3Parsed.ss));
        v4Cookies.gs.dt.should.equal(SDKv1CookieV3Parsed.dt);
        v4Cookies.gs.les.should.equal(SDKv1CookieV3Parsed.les);
        v4Cookies.gs.av.should.equal(SDKv1CookieV3Parsed.av);
        v4Cookies.gs.cgid.should.equal(SDKv1CookieV3Parsed.cgid);
        v4Cookies.gs.das.should.equal(SDKv1CookieV3Parsed.das);
        atob(v4Cookies.gs.csm).should.equal(JSON.stringify([SDKv1CookieV3Parsed.mpid]));
        v4Cookies[SDKv1CookieV3Parsed.mpid].should.have.properties('ua', 'ui', 'csd');
        v4Cookies[SDKv1CookieV3Parsed.mpid].should.not.have.property('mpid');
        v4Cookies[SDKv1CookieV3Parsed.mpid].should.not.have.property('cp');
        v4Cookies[SDKv1CookieV3Parsed.mpid].should.not.have.property('pb');
        atob(v4Cookies[SDKv1CookieV3Parsed.mpid].ua).should.equal(atob(SDKv1CookieV3Parsed.ua));
        atob(v4Cookies[SDKv1CookieV3Parsed.mpid].ui).should.equal(atob(SDKv1CookieV3Parsed.ui));
        v4Cookies[SDKv1CookieV3Parsed.mpid].csd['11'].should.equal(SDKv1CookieV3Parsed.csd['11']);

        done();
    });

    it('integration test - should migrate from SDKv1CookieV3 to SDKv2CookieV4 and function properly when using cookie storage', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = true;

        var lsProductsRaw = '{"cp":[{"Name":"iPhone"|"Sku":"SKU1"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}|{"Name":"Android"|"Sku":"SKU2"|"Price":1|"Quantity":1|"TotalAmount":1|"Attributes":null}]}';
        setCookie(v3CookieKey, SDKv1CookieV3, true);
        localStorage.setItem(v3LSKey, lsProductsRaw);
        mParticle.init(apiKey);

        server.requests = [];
        mParticle.eCommerce.logCheckout(1);

        var event = getEvent('eCommerce - Checkout');
        event.ua.should.have.property('attr1', JSON.parse(atob(SDKv1CookieV3Parsed.ua)).attr1);
        event.ui[0].should.have.property('Identity', 'customerid1');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test@email.com');
        event.ui[1].should.have.property('Type', 7);

        event.sa.should.have.property('sa1', SDKv1CookieV1Parsed.sa.sa1);
        event.cgid.should.equal(SDKv1CookieV3Parsed.cgid);
        event.av.should.equal(SDKv1CookieV3Parsed.av);
        event.sc.pl[0].should.have.property('id', 'SKU1');
        event.sc.pl[0].should.have.property('nm', 'iPhone');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl[1].should.have.property('id', 'SKU2');
        event.sc.pl[1].should.have.property('nm', 'Android');
        event.sc.pl[1].should.have.property('pr', 1);

        done();
    });

    it('integration test - should migrate from SDKv1CookieV3 to SDKv2CookieV4 and function properly when using localStorage', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = false;

        setLocalStorage(v3LSKey, SDKv1CookieV3Full, true);

        mParticle.init(apiKey);
        server.requests = [];
        mParticle.eCommerce.logCheckout(1);

        var event = getEvent('eCommerce - Checkout');
        event.ua.should.have.property('ua1', JSON.parse(atob(SDKv1CookieV3FullParsed.ua)).ua1);
        event.ui[0].should.have.property('Identity', 'test@email.com');
        event.ui[0].should.have.property('Type', 7);

        event.sa.should.have.property('sa1', JSON.parse(atob(SDKv1CookieV3FullParsed.sa)).sa1);
        event.cgid.should.equal(SDKv1CookieV3FullParsed.cgid);
        event.av.should.equal(SDKv1CookieV3FullParsed.av);
        event.sc.pl[0].should.have.property('id', 'SKU1');
        event.sc.pl[0].should.have.property('nm', 'iPhone');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl[1].should.have.property('id', 'SKU2');
        event.sc.pl[1].should.have.property('nm', 'Android');
        event.sc.pl[1].should.have.property('pr', 1);

        done();
    });

    it('unit test - should migrate from SDKv1CookieV3 with apostrophes to SDKv2CookieV4 using convertSDKv1CookiesV3ToSDKv2CookiesV4', function(done) {
        mParticle.reset();

        var v4Cookies = JSON.parse(mParticle.migrations.convertSDKv1CookiesV3ToSDKv2CookiesV4(SDKv1CookieV3FullLSApostrophes));

        v4Cookies.should.have.properties('gs', SDKv1CookieV3FullLSApostrophesParsed.mpid, 'cu');
        v4Cookies.cu.should.equal(SDKv1CookieV3FullLSApostrophesParsed.mpid);
        v4Cookies.gs.should.have.properties('csm', 'sid', 'ie', 'sa', 'ss', 'dt', 'les', 'av', 'cgid', 'das');
        v4Cookies.gs.sid.should.equal(SDKv1CookieV3FullLSApostrophesParsed.sid);
        v4Cookies.gs.ie.should.equal(SDKv1CookieV3FullLSApostrophesParsed.ie);

        atob(v4Cookies.gs.sa).should.equal(atob(SDKv1CookieV3FullLSApostrophesParsed.sa));
        atob(v4Cookies.gs.ss).should.equal(atob(SDKv1CookieV3FullLSApostrophesParsed.ss));
        v4Cookies.gs.dt.should.equal(SDKv1CookieV3FullLSApostrophesParsed.dt);
        v4Cookies.gs.les.should.equal(SDKv1CookieV3FullLSApostrophesParsed.les);
        v4Cookies.gs.av.should.equal(SDKv1CookieV3FullLSApostrophesParsed.av);
        v4Cookies.gs.cgid.should.equal(SDKv1CookieV3FullLSApostrophesParsed.cgid);
        v4Cookies.gs.das.should.equal(SDKv1CookieV3FullLSApostrophesParsed.das);
        atob(v4Cookies.gs.csm).should.equal(JSON.stringify([SDKv1CookieV3FullLSApostrophesParsed.mpid]));
        v4Cookies[SDKv1CookieV3FullLSApostrophesParsed.mpid].should.have.properties('ua', 'ui', 'csd');
        v4Cookies[SDKv1CookieV3FullLSApostrophesParsed.mpid].should.not.have.property('mpid');
        v4Cookies[SDKv1CookieV3FullLSApostrophesParsed.mpid].should.not.have.property('cp');
        v4Cookies[SDKv1CookieV3FullLSApostrophesParsed.mpid].should.not.have.property('pb');
        atob(v4Cookies[SDKv1CookieV3FullLSApostrophesParsed.mpid].ua).should.equal(atob(SDKv1CookieV3FullLSApostrophesParsed.ua));
        atob(v4Cookies[SDKv1CookieV3FullLSApostrophesParsed.mpid].ui).should.equal(atob(SDKv1CookieV3FullLSApostrophesParsed.ui));
        v4Cookies[SDKv1CookieV3FullLSApostrophesParsed.mpid].csd['11'].should.equal(SDKv1CookieV3FullLSApostrophesParsed.csd['11']);

        done();
    });

    it('integration test - should migrate from SDKv1CookieV3 with apostrophes to SDKv2CookieV4 and function properly when using cookie storage', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = true;

        setCookie(v3CookieKey, SDKv1CookieV3FullLSApostrophes, true);

        mParticle.init(apiKey);

        server.requests = [];
        mParticle.eCommerce.logCheckout(1);

        var event = getEvent('eCommerce - Checkout');
        event.ua.should.have.property('ua1', JSON.parse(atob(SDKv1CookieV3FullLSApostrophesParsed.ua)).ua1);
        event.ui[0].should.have.property('Identity', 'customerid1');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test@email.com');
        event.ui[1].should.have.property('Type', 7);
        event.sa.should.have.property('sa1', JSON.parse(atob(SDKv1CookieV3FullLSApostrophesParsed.sa)).sa1);
        event.cgid.should.equal(SDKv1CookieV3FullLSApostrophesParsed.cgid);
        event.av.should.equal(SDKv1CookieV3FullLSApostrophesParsed.av);
        event.sc.pl[0].should.have.property('id', 'SKU1');
        event.sc.pl[0].should.have.property('nm', 'iPhone');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl[1].should.have.property('id', 'SKU2');
        event.sc.pl[1].should.have.property('nm', 'Android');
        event.sc.pl[1].should.have.property('pr', 1);

        done();
    });

    it('integration test - should migrate from SDKv1CookieV3 with apostrophes to SDKv2CookieV4 and function properly when using local storage', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = false;

        setLocalStorage(v3LSKey, SDKv1CookieV3FullLSApostrophes, true);
        mParticle.init(apiKey);

        server.requests = [];
        mParticle.eCommerce.logCheckout(1);

        var event = getEvent('eCommerce - Checkout');
        event.ua.should.have.property('ua1', JSON.parse(atob(SDKv1CookieV3FullLSApostrophesParsed.ua)).ua1);
        event.ui[0].should.have.property('Identity', 'customerid1');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test@email.com');
        event.ui[1].should.have.property('Type', 7);
        event.sa.should.have.property('sa1', JSON.parse(atob(SDKv1CookieV3FullLSApostrophesParsed.sa)).sa1);
        event.cgid.should.equal(SDKv1CookieV3FullLSApostrophesParsed.cgid);
        event.av.should.equal(SDKv1CookieV3FullLSApostrophesParsed.av);
        event.sc.pl[0].should.have.property('id', 'SKU1');
        event.sc.pl[0].should.have.property('nm', 'iPhone');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl[1].should.have.property('id', 'SKU2');
        event.sc.pl[1].should.have.property('nm', 'Android');
        event.sc.pl[1].should.have.property('pr', 1);

        done();
    });

    it('unit test - should migrate from SDKv2CookieV1 to SDKv2CookieV4 decoded', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = true;

        var v4Cookies = JSON.parse(mParticle.migrations.convertSDKv2CookiesV1ToSDKv2DecodedCookiesV4(decodeURIComponent(SDKv2CookieV1)));
        v4Cookies.should.have.properties('8179891178059554209', '4573473690267104222', 'gs', 'cu');

        v4Cookies.cu.should.equal(SDKv2CookieV1Parsed.currentUserMPID);

        v4Cookies.gs.should.have.properties('csm', 'sid', 'ie', 'sa', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'c');
        v4Cookies.gs.csm[0].should.equal(SDKv2CookieV1Parsed.globalSettings.currentSessionMPIDs[0]);
        v4Cookies.gs.csm[1].should.equal(SDKv2CookieV1Parsed.globalSettings.currentSessionMPIDs[1]);
        v4Cookies.gs.sid.should.equal(SDKv2CookieV1Parsed.globalSettings.sid);
        v4Cookies.gs.ie.should.equal(SDKv2CookieV1Parsed.globalSettings.ie);
        v4Cookies.gs.dt.should.equal(SDKv2CookieV1Parsed.globalSettings.dt);
        v4Cookies.gs.les.should.equal(SDKv2CookieV1Parsed.globalSettings.les);
        v4Cookies.gs.cgid.should.equal(SDKv2CookieV1Parsed.globalSettings.cgid);
        v4Cookies.gs.das.should.equal(SDKv2CookieV1Parsed.globalSettings.das);
        v4Cookies.gs.c.should.equal(SDKv2CookieV1Parsed.globalSettings.c);
        v4Cookies.gs.sa.sa1.should.equal(SDKv2CookieV1Parsed.globalSettings.sa.sa1);
        v4Cookies['8179891178059554209'].ua.ua1.should.equal(SDKv2CookieV1Parsed['8179891178059554209'].ua.ua1);
        v4Cookies['8179891178059554209'].ui[1].should.equal(SDKv2CookieV1Parsed['8179891178059554209'].ui.customerid);
        v4Cookies['8179891178059554209'].ui[7].should.equal(SDKv2CookieV1Parsed['8179891178059554209'].ui.email);
        v4Cookies['8179891178059554209'].csd['5'].should.equal(SDKv2CookieV1Parsed['8179891178059554209'].csd['5']);
        v4Cookies['8179891178059554209'].should.not.have.property('mpid');
        v4Cookies['8179891178059554209'].should.not.have.property('pb');
        v4Cookies['8179891178059554209'].should.not.have.property('cp');

        v4Cookies['4573473690267104222'].ua.ua1.should.equal(SDKv2CookieV1Parsed['4573473690267104222'].ua.ua1);
        v4Cookies['4573473690267104222'].ui[1].should.equal(SDKv2CookieV1Parsed['4573473690267104222'].ui.customerid);
        v4Cookies['4573473690267104222'].ui[7].should.equal(SDKv2CookieV1Parsed['4573473690267104222'].ui.email);
        v4Cookies['4573473690267104222'].csd['5'].should.equal(SDKv2CookieV1Parsed['4573473690267104222'].csd['5']);
        v4Cookies['4573473690267104222'].should.not.have.property('mpid');
        v4Cookies['4573473690267104222'].should.not.have.property('pb');
        v4Cookies['4573473690267104222'].should.not.have.property('cp');

        var localStorageProducts = getLocalStorageProducts();
        JSON.stringify(localStorageProducts['8179891178059554209'].cp).should.equal(JSON.stringify(SDKv2CookieV1Parsed['8179891178059554209'].cp));
        JSON.stringify(localStorageProducts['8179891178059554209'].pb).should.equal(JSON.stringify(SDKv2CookieV1Parsed['8179891178059554209'].pb));

        JSON.stringify(localStorageProducts['4573473690267104222'].cp).should.equal(JSON.stringify(SDKv2CookieV1Parsed['4573473690267104222'].cp));
        JSON.stringify(localStorageProducts['4573473690267104222'].pb).should.equal(JSON.stringify(SDKv2CookieV1Parsed['4573473690267104222'].pb));

        done();
    });

    it('integration test - should migrate from SDKv2CookieV1 to SDKv2CookieV4 and function properly when using cookie storage', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = true;

        setCookie(v1CookieKey, SDKv2CookieV1, true);
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: '4573473690267104222'
            }));
        };

        mParticle.init(apiKey);

        server.requests = [];

        mParticle.eCommerce.logCheckout(1);

        var event = getEvent('eCommerce - Checkout');

        event.ua.should.have.property('ua1', SDKv2CookieV1Parsed[SDKv2CookieV1Parsed.currentUserMPID].ua.ua1);
        event.ui[0].should.have.property('Identity', 'customerid2');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test2@email.com');
        event.ui[1].should.have.property('Type', 7);

        event.sa.should.have.property('sa1', SDKv2CookieV1Parsed.globalSettings.sa.sa1);
        event.cgid.should.equal(SDKv2CookieV1Parsed.globalSettings.cgid);
        event.sc.pl[0].should.have.property('id', 'SKU1');
        event.sc.pl[0].should.have.property('nm', 'iPhone');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl[1].should.have.property('id', 'SKU2');
        event.sc.pl[1].should.have.property('nm', 'Android');
        event.sc.pl[1].should.have.property('pr', 1);

        done();
    });

    it('integration test - should migrate from SDKv2CookieV1 to SDKv2CookieV4 and function properly when using localStorage', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = false;

        setLocalStorage(v1localStorageKey, SDKv2CookieV1, true);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: '4573473690267104222'
            }));
        };

        mParticle.init(apiKey);
        server.requests = [];
        mParticle.eCommerce.logCheckout(1);

        var event = getEvent('eCommerce - Checkout');

        event.ua.should.have.property('ua1', SDKv2CookieV1Parsed[SDKv2CookieV1Parsed.currentUserMPID].ua.ua1);
        event.ui[0].should.have.property('Identity', 'customerid2');
        event.ui[0].should.have.property('Type', 1);
        event.ui[1].should.have.property('Identity', 'test2@email.com');
        event.ui[1].should.have.property('Type', 7);

        event.sa.should.have.property('sa1', SDKv2CookieV1Parsed.globalSettings.sa.sa1);
        event.cgid.should.equal(SDKv2CookieV1Parsed.globalSettings.cgid);
        event.sc.pl[0].should.have.property('id', 'SKU1');
        event.sc.pl[0].should.have.property('nm', 'iPhone');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl[1].should.have.property('id', 'SKU2');
        event.sc.pl[1].should.have.property('nm', 'Android');
        event.sc.pl[1].should.have.property('pr', 1);

        done();
    });

    it('unit test - should migrate products from SDKv1CookieV3 to SDKv2CookieV4 local storage', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = false;

        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1);

        var SDKv1CookieV3 = {
            sid:    '77b95bfb-4749-4678-8bff-6ee959e2904d',
            ie:     true,
            ss: btoa(JSON.stringify({ uid: {
                Expires:'2027-10-07T14:59:30.656542Z',
                Value:'exampleValue' }
            })),
            dt:     'beab3f4d34281d45bfcdbbd7eb21c083',
            les:    1507647418774,
            cgid:   'a5845924-b4a2-4756-a127-beafd5606305',
            das:    '36fe23d2-ee96-4d58-93b0-51c6f98fca20',
            mpid:   '-4321945503088905200',
            sa:     btoa(JSON.stringify({ key: 'value' })),
            csd:    btoa(JSON.stringify({ 5: 1507647418774 })),
            av:     '1.5.0',
            ua:     btoa(JSON.stringify({ gender: 'female' })),
            ui:     btoa(JSON.stringify([{ Identity: 'abc', Type: 1 }])),
            cp:     [product1, product2],
            pb:     {productBag1: [product1, product2]}
        };

        mParticle.migrations.convertSDKv1CookiesV3ToSDKv2CookiesV4(JSON.stringify(SDKv1CookieV3));

        var localStorageProducts = getLocalStorageProducts();

        JSON.stringify(localStorageProducts[SDKv1CookieV3.mpid].cp).should.equal(JSON.stringify(SDKv1CookieV3.cp));
        JSON.stringify(localStorageProducts[SDKv1CookieV3.mpid].pb).should.equal(JSON.stringify(SDKv1CookieV3.pb));

        done();
    });

    it('testing modify', function(done) {
        mParticle.reset();
        mParticle.useCookieStorage = true;

        setCookie(v3CookieKey, SDKv1CookieV3FullLSApostrophes, true);

        mParticle.init(apiKey);

        var cookies = mParticle.persistence.getCookie();
        console.log(cookies);

        done();
    });

});
