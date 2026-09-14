describe('snippet', function() {
    beforeEach(function() {
        mParticle.config.rq = [];
    });

    it('mParticle object and proxied methods should exist should exist', function(done) {
        (typeof window.mParticle).should.equal('object');
        (typeof window.mParticle.Identity).should.equal('object');
        (typeof window.mParticle.eCommerce).should.equal('object');
        done();
    });

    it('mParticle object should proxy main methods', function(done) {
        mParticle.endSession();
        mParticle.startNewSession();
        mParticle.startTrackingLocation();
        mParticle.stopTrackingLocation();
        mParticle.setOptOut();
        mParticle.logError('error');
        mParticle.logEvent(
            'test event',
            mParticle.EventType.Other,
            { attrFoo: 'attrBar' },
            { customFoo: 'customBar' }
        );
        mParticle.logPageView('test pageView', { attrFoo: 'attrBar' });
        mParticle.setSessionAttribute('sessionAttrFoo', 'sessionAttrBar');
        mParticle.setAppName('testAppName');
        mParticle.setPosition(50, 100);
        mParticle.logForm('div', 'testForm', mParticle.EventType.Other, {
            attrFoo: 'attrBar',
        });
        mParticle.logLink('div', 'testLink', mParticle.EventType.Navigation, {
            attrFoo: 'attrBar',
        });
        mParticle.config.rq.length.should.equal(13);
        mParticle.config.rq[0][0].should.equal('endSession');
        mParticle.config.rq[1][0].should.equal('startNewSession');
        mParticle.config.rq[2][0].should.equal('startTrackingLocation');
        mParticle.config.rq[3][0].should.equal('stopTrackingLocation');
        mParticle.config.rq[4][0].should.equal('setOptOut');
        mParticle.config.rq[5][0].should.equal('logError');
        mParticle.config.rq[5][1].should.equal('error');
        mParticle.config.rq[6][0].should.equal('logEvent');
        mParticle.config.rq[6][1].should.equal('test event');
        mParticle.config.rq[6][2].should.equal(mParticle.EventType.Other);
        mParticle.config.rq[6][3].attrFoo.should.equal('attrBar');
        mParticle.config.rq[6][4].customFoo.should.equal('customBar');
        mParticle.config.rq[7][0].should.equal('logPageView');
        mParticle.config.rq[7][1].should.equal('test pageView');
        mParticle.config.rq[7][2].attrFoo.should.equal('attrBar');
        mParticle.config.rq[8][0].should.equal('setSessionAttribute');
        mParticle.config.rq[8][1].should.equal('sessionAttrFoo');
        mParticle.config.rq[8][2].should.equal('sessionAttrBar');
        mParticle.config.rq[9][0].should.equal('setAppName');
        mParticle.config.rq[9][1].should.equal('testAppName');
        mParticle.config.rq[10][0].should.equal('setPosition');
        mParticle.config.rq[10][1].should.equal(50);
        mParticle.config.rq[10][2].should.equal(100);
        mParticle.config.rq[11][0].should.equal('logForm');
        mParticle.config.rq[11][1].should.equal('div');
        mParticle.config.rq[11][2].should.equal('testForm');
        mParticle.config.rq[11][3].should.equal(mParticle.EventType.Other);
        mParticle.config.rq[11][4].attrFoo.should.equal('attrBar');
        mParticle.config.rq[12][0].should.equal('logLink');
        mParticle.config.rq[12][1].should.equal('div');
        mParticle.config.rq[12][2].should.equal('testLink');
        mParticle.config.rq[12][3].should.equal(mParticle.EventType.Navigation);
        mParticle.config.rq[12][4].attrFoo.should.equal('attrBar');

        done();
    });

    it('mParticle object should proxy Identity methods', function(done) {
        var userIdentities = {
            userIdentities: {
                customerid: 'test',
            },
        };
        mParticle.Identity.login(userIdentities);
        mParticle.Identity.logout(userIdentities);
        mParticle.Identity.modify(userIdentities);
        mParticle.Identity.identify(userIdentities);
        mParticle.Identity.search(
            'workspace_api_key',
            { email: 'user@example.com' },
            function() {}
        );
        mParticle.config.rq[0][0].should.equal('Identity.login');
        mParticle.config.rq[0][1].userIdentities.customerid.should.equal(
            'test'
        );
        mParticle.config.rq[1][0].should.equal('Identity.logout');
        mParticle.config.rq[1][1].userIdentities.customerid.should.equal(
            'test'
        );
        mParticle.config.rq[2][0].should.equal('Identity.modify');
        mParticle.config.rq[2][1].userIdentities.customerid.should.equal(
            'test'
        );
        mParticle.config.rq[3][0].should.equal('Identity.identify');
        mParticle.config.rq[3][1].userIdentities.customerid.should.equal(
            'test'
        );
        mParticle.config.rq[4][0].should.equal('Identity.search');
        mParticle.config.rq[4][1].should.equal('workspace_api_key');
        mParticle.config.rq[4][2].email.should.equal('user@example.com');
        (typeof mParticle.config.rq[4][3]).should.equal('function');

        done();
    });

    it('mParticle object should proxy eCommerce methods', function(done) {
        mParticle.eCommerce.setCurrencyCode('usd');
        mParticle.config.rq[0][0].should.equal('eCommerce.setCurrencyCode');
        mParticle.config.rq[0][1].should.equal('usd');

        done();
    });

    it('mParticle object should have EventTypes on it', function(done) {
        Object.keys(mParticle.EventType).length.should.equal(10);
        mParticle.EventType.Unknown.should.equal(0);
        mParticle.EventType.Navigation.should.equal(1);
        mParticle.EventType.Location.should.equal(2);
        mParticle.EventType.Search.should.equal(3);
        mParticle.EventType.Transaction.should.equal(4);
        mParticle.EventType.UserContent.should.equal(5);
        mParticle.EventType.UserPreference.should.equal(6);
        mParticle.EventType.Social.should.equal(7);
        mParticle.EventType.Other.should.equal(8);
        mParticle.EventType.Media.should.equal(9);

        done();
    });

    it('mParticle object should proxy Rokt methods', function(done) {
        mParticle.Rokt.hashAttributes();
        mParticle.Rokt.selectPlacements();
        mParticle.Rokt.setExtensionData();
        mParticle.Rokt.use();
        mParticle.Rokt.hashSha256();
        mParticle.Rokt.getVersion();
        mParticle.Rokt.terminate();
        mParticle.Rokt.onShoppableAdsReady();
        mParticle.config.rq[0][0].should.equal('Rokt.hashAttributes');
        mParticle.config.rq[1][0].should.equal('Rokt.selectPlacements');
        mParticle.config.rq[2][0].should.equal('Rokt.setExtensionData');
        mParticle.config.rq[3][0].should.equal('Rokt.use');
        mParticle.config.rq[4][0].should.equal('Rokt.hashSha256');
        mParticle.config.rq[5][0].should.equal('Rokt.getVersion');
        mParticle.config.rq[6][0].should.equal('Rokt.terminate');
        mParticle.config.rq[7][0].should.equal('Rokt.onShoppableAdsReady');
        done();
    });
});

// snippet.rokt.min.js ends with })(API_KEY) and reads ROKT_DOMAIN as a free
// identifier. Those must be globals (window.API_KEY / window.ROKT_DOMAIN, or
// page-level var/const) before the loader runs. A const inside this it() would
// not be visible to a subsequently loaded classic script.
describe('snippet.rokt loader', function() {
    function primaryScript() {
        return document.querySelector(
            'script[src*="apps.rokt-api.com/js/v3/abc/app.js"]'
        );
    }

    function fallbackScript() {
        return document.querySelector(
            'script[src*="apps.roktecommerce.com/js/v3/abc/app.js"]'
        );
    }

    before(function(done) {
        window.API_KEY = 'abc';
        window.ROKT_DOMAIN = 'https://apps.rokt-api.com';
        window.mParticle.config.isDevelopmentMode = true;
        window.mParticle.config.dataPlan = {
            planId: 'my_plan',
            planVersion: 2,
        };
        window.mParticle.config.versions = { core: '3.0.0' };

        var loader = document.createElement('script');
        loader.src = '../../snippet.rokt.min.js';
        loader.onload = function() {
            done();
        };
        loader.onerror = function() {
            done(new Error('failed to load snippet.rokt.min.js'));
        };
        document.body.appendChild(loader);
    });

    it('loads v3 app.js with the page API key, query params, and ROKT_DOMAIN', function() {
        var script = primaryScript();
        (script === null).should.equal(false);
        script.src.should.containEql(
            'https://apps.rokt-api.com/js/v3/abc/app.js'
        );
        script.src.should.containEql('env=1');
        script.src.should.containEql('plan_id=my_plan');
        script.src.should.containEql('plan_version=2');
        script.src.should.containEql('core=3.0.0');
        window.ROKT_DOMAIN.should.equal('https://apps.rokt-api.com');
        window.mParticle.config.domain.should.equal('apps.rokt-api.com');
    });

    it('retries from the fallback host on primary script error', function() {
        primaryScript().onerror();

        var script = fallbackScript();
        (script === null).should.equal(false);
        script.src.should.containEql(
            'https://apps.roktecommerce.com/js/v3/abc/app.js'
        );
        script.src.should.containEql('env=1');
        script.src.should.containEql('plan_id=my_plan');
        script.src.should.containEql('plan_version=2');
        script.src.should.containEql('core=3.0.0');
        window.ROKT_DOMAIN.should.equal('https://apps.roktecommerce.com');
        window.mParticle.config.domain.should.equal('apps.roktecommerce.com');
    });
});
