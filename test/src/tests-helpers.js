var Validators = require('../../src/helpers').Validators;

describe('helpers', function() {
    it('event type should return name', function(done) {
        mParticle.EventType.getName(mParticle.EventType.Navigation).should.equal('Navigation');
        mParticle.EventType.getName(mParticle.EventType.Location).should.equal('Location');
        mParticle.EventType.getName(mParticle.EventType.Search).should.equal('Search');
        mParticle.EventType.getName(mParticle.EventType.Transaction).should.equal('Transaction');
        mParticle.EventType.getName(mParticle.EventType.UserContent).should.equal('User Content');
        mParticle.EventType.getName(mParticle.EventType.UserPreference).should.equal('User Preference');
        mParticle.EventType.getName(mParticle.EventType.Social).should.equal('Social');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductAddToCart).should.equal('Product Added to Cart');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductAddToWishlist).should.equal('Product Added to Wishlist');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductCheckout).should.equal('Product Checkout');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductCheckoutOption).should.equal('Product Checkout Options');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductClick).should.equal('Product Click');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductImpression).should.equal('Product Impression');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductPurchase).should.equal('Product Purchased');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductRefund).should.equal('Product Refunded');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductRemoveFromCart).should.equal('Product Removed From Cart');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductRemoveFromWishlist).should.equal('Product Removed from Wishlist');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductViewDetail).should.equal('Product View Details');
        mParticle.EventType.getName(mParticle.CommerceEventType.PromotionClick).should.equal('Promotion Click');
        mParticle.EventType.getName(mParticle.CommerceEventType.PromotionView).should.equal('Promotion View');
        mParticle.EventType.getName(null).should.equal('Other');

        done();
    });

    it('identity type should return name', function(done) {
        mParticle.IdentityType.getName(mParticle.IdentityType.CustomerId).should.equal('Customer ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Facebook).should.equal('Facebook ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Twitter).should.equal('Twitter ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Google).should.equal('Google ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Microsoft).should.equal('Microsoft ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Yahoo).should.equal('Yahoo ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Email).should.equal('Email');
        mParticle.IdentityType.getName(mParticle.IdentityType.FacebookCustomAudienceId).should.equal('Facebook App User ID');
        mParticle.IdentityType.getName(null).should.equal('Other ID');

        done();
    });

    it('product action type should return name', function(done) {
        mParticle.ProductActionType.getName(mParticle.ProductActionType.AddToCart).should.equal('Add to Cart');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.RemoveFromCart).should.equal('Remove from Cart');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.Checkout).should.equal('Checkout');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.CheckoutOption).should.equal('Checkout Option');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.Click).should.equal('Click');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.ViewDetail).should.equal('View Detail');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.Purchase).should.equal('Purchase');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.Refund).should.equal('Refund');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.AddToWishlist).should.equal('Add to Wishlist');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.RemoveFromWishlist).should.equal('Remove from Wishlist');
        mParticle.ProductActionType.getName(null).should.equal('Unknown');

        done();
    });

    it('promotion action type should return name', function(done) {
        mParticle.PromotionType.getName(mParticle.PromotionType.PromotionView).should.equal('Promotion View');
        mParticle.PromotionType.getName(mParticle.PromotionType.PromotionClick).should.equal('Promotion Click');
        mParticle.PromotionType.getName(null).should.equal('Unknown');

        done();
    });

    it('should return false for an invalid identity type and true for a valid identity type', function(done) {
        var invalidResult1 = mParticle.IdentityType.isValid(11);
        var invalidResult2 = mParticle.IdentityType.isValid('5');
        var validResult = mParticle.IdentityType.isValid(1);

        invalidResult1.should.be.false;
        invalidResult2.should.be.false;
        validResult.should.be.true;

        done();
    });

    it('should correctly validate an attribute value', function(done) {
        var validatedString = Validators.isValidAttributeValue('testValue1');
        var validatedNumber = Validators.isValidAttributeValue(1);
        var validatedNull = Validators.isValidAttributeValue(null);
        var validatedObject = Validators.isValidAttributeValue({});
        var validatedArray = Validators.isValidAttributeValue([]);
        var validatedUndefined = Validators.isValidAttributeValue(undefined);

        validatedString.should.be.ok();
        validatedNumber.should.be.ok();
        validatedNull.should.be.ok();
        validatedObject.should.not.be.ok();
        validatedArray.should.not.be.ok();
        validatedUndefined.should.not.be.ok();

        done();
    });

    it('should correctly validate a key value', function(done) {
        var validatedString = Validators.isValidKeyValue('testValue1');
        var validatedNumber = Validators.isValidKeyValue(1);
        var validatedNull = Validators.isValidKeyValue(null);
        var validatedObject = Validators.isValidKeyValue({});
        var validatedArray = Validators.isValidKeyValue([]);
        var validatedUndefined = Validators.isValidKeyValue(undefined);

        validatedString.should.be.ok();
        validatedNumber.should.be.ok();
        validatedNull.should.not.be.ok();
        validatedObject.should.not.be.ok();
        validatedArray.should.not.be.ok();
        validatedUndefined.should.not.be.ok();

        done();
    });

    it('should correctly validate a string or number', function(done) {
        var validatedString = Validators.isStringOrNumber('testValue1');
        var validatedNumber = Validators.isStringOrNumber(1);
        var validatedNull = Validators.isStringOrNumber(null);
        var validatedObject = Validators.isStringOrNumber({});
        var validatedArray = Validators.isStringOrNumber([]);
        var validatedUndefined = Validators.isStringOrNumber(undefined);

        validatedString.should.be.ok();
        validatedNumber.should.be.ok();
        validatedNull.should.not.be.ok();
        validatedObject.should.not.be.ok();
        validatedArray.should.not.be.ok();
        validatedUndefined.should.not.be.ok();

        done();
    });

    it('should correctly validate an identity request with copyUserAttribute as a key using any identify method', function(done) {
        var identityApiData = {
            userIdentities: {
                customerid: '123'
            },
            copyUserAttributes: true
        };
        var identifyResult = Validators.validateIdentities(identityApiData, 'identify');
        var logoutResult = Validators.validateIdentities(identityApiData, 'logout');
        var loginResult = Validators.validateIdentities(identityApiData, 'login');
        var modifyResult = Validators.validateIdentities(identityApiData, 'modify');

        identifyResult.valid.should.equal(true);
        logoutResult.valid.should.equal(true);
        loginResult.valid.should.equal(true);
        modifyResult.valid.should.equal(true);

        done();
    });
});
