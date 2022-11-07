import mParticle from '../../src/stub/mparticle.stub.js';

describe('mParticle stubs', function() {
    it('should invoke all mParticle root methods without errors', function(done) {
        mParticle.endSession();
        mParticle.getAppName();
        mParticle.getAppVersion();
        mParticle.getDeviceId();
        mParticle.getEnvironment();
        mParticle.getVersion();
        mParticle.init();
        mParticle.logError();
        mParticle.logEvent();
        mParticle.logForm();
        mParticle.logLink();
        mParticle.logPageView();
        mParticle.ready();
        mParticle.reset();
        mParticle._resetForTests();
        mParticle.setAppName();
        mParticle.setAppVersion();
        mParticle.setLogLevel();
        mParticle.setOptOut();
        mParticle.setPosition();
        mParticle.setSessionAttribute();
        mParticle.startNewSession();
        mParticle.startTrackingLocation();
        mParticle.stopTrackingLocation();

        done();
    });

    it('should invoke all eCommerce stubbed methods without errors', function(done) {
        var impression = mParticle.eCommerce.createImpression();
        (typeof impression.Name).should.equal('string');
        (typeof impression.Product).should.equal('object');
        checkProduct(impression.Product);

        var product = mParticle.eCommerce.createProduct();
        checkProduct(product);

        var promotion = mParticle.eCommerce.createPromotion();
        promotion.Id.should.equal('id');
        promotion.Creative.should.equal('creative');
        promotion.Name.should.equal('name');
        promotion.Position.should.equal(0);

        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes();
        transactionAttributes.Id.should.equal('id');
        transactionAttributes.Affiliation.should.equal('affiliation');
        transactionAttributes.CouponCode.should.equal('couponCode');
        transactionAttributes.Revenue.should.equal(0);
        transactionAttributes.Shipping.should.equal('shipping');
        transactionAttributes.Tax.should.equal(0);

        mParticle.eCommerce.logCheckout();
        mParticle.eCommerce.logImpression();
        mParticle.eCommerce.logProductAction();
        mParticle.eCommerce.logPromotion();
        mParticle.eCommerce.logPurchase();
        mParticle.eCommerce.logRefund();
        mParticle.eCommerce.setCurrencyCode();

        var product1 = mParticle.eCommerce.createProduct(
            'iphone',
            'iphoneSKU',
            999
        );

        mParticle.eCommerce.Cart.add(product1);
        mParticle.eCommerce.Cart.remove(product1);
        mParticle.eCommerce.Cart.clear(product1);
        var products = mParticle.eCommerce.Cart.getCartProducts();
        checkProduct(products[0]);

        done();
    });

    it('should invoke all Consent stubbed methods without errors', function(done) {
        var consent = mParticle.Consent.createConsentState();
        consent.addGDPRConsentState();
        consent.setGDPRConsentState();
        consent.removeGDPRConsentState();
        var GDPRConsentState = consent.getGDPRConsentState();

        consent
            .addGDPRConsentState()
            .should.have.properties(
                'addGDPRConsentState',
                'setGDPRConsentState',
                'removeGDPRConsentState',
                'getGDPRConsentState'
            );
        consent
            .setGDPRConsentState()
            .should.have.properties(
                'addGDPRConsentState',
                'setGDPRConsentState',
                'removeGDPRConsentState',
                'getGDPRConsentState'
            );
        consent
            .removeGDPRConsentState()
            .should.have.properties(
                'addGDPRConsentState',
                'setGDPRConsentState',
                'removeGDPRConsentState',
                'getGDPRConsentState'
            );

        GDPRConsentState.ConsentDocument.should.equal('doc');
        GDPRConsentState.Consented.should.equal(false);
        GDPRConsentState.HardwareId.should.equal('id');
        GDPRConsentState.Location.should.equal('location');
        (typeof GDPRConsentState.Timestamp).should.equal('number');

        done();
    });

    it('should invoke all Identity stubbed methods without errors', function(done) {
        mParticle.Identity.aliasUsers();
        var aliasRequest = mParticle.Identity.createAliasRequest();
        aliasRequest.sourceMpid.should.equal('a');
        aliasRequest.destinationMpid.should.equal('b');
        (typeof aliasRequest.startTime).should.equal('number');
        (typeof aliasRequest.endTime).should.equal('number');

        done();
    });

    it('should invoke all Identity stubbed methods without errors', function(done) {
        mParticle.Identity.aliasUsers();
        var aliasRequest = mParticle.Identity.createAliasRequest();

        aliasRequest.sourceMpid.should.equal('a');
        aliasRequest.destinationMpid.should.equal('b');
        (typeof aliasRequest.startTime).should.equal('number');
        (typeof aliasRequest.endTime).should.equal('number');

        var user = mParticle.Identity.getCurrentUser();

        (typeof user.getMPID()).should.equal('string');
        user.setUserTag();
        user.removeUserTag();
        user.setUserAttribute();
        user.setUserAttributes();
        user.removeUserAttribute();
        user.setUserAttributeList();
        user.removeAllUserAttributes();
        (typeof user.getUserAttributesLists()).should.equal('object');
        (typeof user.getAllUserAttributes()).should.equal('object');
        var userCart = user.getCart();
        (typeof userCart).should.equal('object');
        userCart.add();
        userCart.clear();
        userCart.remove();
        var cartProducts = userCart.getCartProducts();
        checkProduct(cartProducts[0]);

        user.setConsentState();

        user.getConsentState().should.have.properties(
            'addGDPRConsentState',
            'setGDPRConsentState',
            'removeGDPRConsentState',
            'getGDPRConsentState'
        );

        done();
    });
});

function checkProduct(product) {
    product.Name.should.equal('name');
    product.Sku.should.equal('sku');
    product.Price.should.equal(0);
    product.Quantity.should.equal(0);
    product.Brand.should.equal('brand');
    product.Variant.should.equal('variant');
    product.Category.should.equal('category');
    product.Position.should.equal('position');
    product.CouponCode.should.equal('couponCode');
    product.TotalAmount.should.equal(0);
    product.Attributes.should.be.ok();
}
