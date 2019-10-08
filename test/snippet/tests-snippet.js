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

        done();
    });

    it('mParticle object should proxy eCommerce methods', function(done) {
        mParticle.eCommerce.setCurrencyCode('usd');
        mParticle.eCommerce.logCheckout(
            1,
            { optionFoo: 'optionBar' },
            { attrFoo: 'attrBar' },
            { customFoo: 'customBar' }
        );
        mParticle.config.rq[0][0].should.equal('eCommerce.setCurrencyCode');
        mParticle.config.rq[0][1].should.equal('usd');
        mParticle.config.rq[1][0].should.equal('eCommerce.logCheckout');
        mParticle.config.rq[1][1].should.equal(1);
        mParticle.config.rq[1][2].optionFoo.should.equal('optionBar');
        mParticle.config.rq[1][3].attrFoo.should.equal('attrBar');
        mParticle.config.rq[1][4].customFoo.should.equal('customBar');

        done();
    });

    it('mParticle object should have EventTypes on it', function(done) {
        Object.keys(mParticle.EventType).length.should.equal(9);
        mParticle.EventType.Unknown.should.equal(0);
        mParticle.EventType.Navigation.should.equal(1);
        mParticle.EventType.Location.should.equal(2);
        mParticle.EventType.Search.should.equal(3);
        mParticle.EventType.Transaction.should.equal(4);
        mParticle.EventType.UserContent.should.equal(5);
        mParticle.EventType.UserPreference.should.equal(6);
        mParticle.EventType.Social.should.equal(7);
        mParticle.EventType.Other.should.equal(8);

        done();
    });
});
