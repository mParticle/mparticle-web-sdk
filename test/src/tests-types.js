import Types from '../../src/types';

const EventType = Types.EventType,
    CommerceEventType = Types.CommerceEventType,
    ProductActionType = Types.ProductActionType,
    PromotionType = Types.PromotionActionType,
    IdentityType = Types.IdentityType;

describe('Types', function () {
    describe('Environment', function () {
        it('should return `production`', function () {
            mParticle.Types.Environment.Production.should.equal('production');
        });

        it('should return `development`', function () {
            mParticle.Types.Environment.Development.should.equal('development');
        });
    });

    it('event type should return name', function (done) {
        mParticle.EventType.getName(EventType.Navigation).should.equal(
            'Navigation',
        );
        mParticle.EventType.getName(EventType.Location).should.equal(
            'Location',
        );
        mParticle.EventType.getName(EventType.Search).should.equal('Search');
        mParticle.EventType.getName(EventType.Transaction).should.equal(
            'Transaction',
        );
        mParticle.EventType.getName(EventType.UserContent).should.equal(
            'User Content',
        );
        mParticle.EventType.getName(EventType.UserPreference).should.equal(
            'User Preference',
        );
        mParticle.EventType.getName(EventType.Social).should.equal('Social');
        mParticle.EventType.getName(
            CommerceEventType.ProductAddToCart,
        ).should.equal('Product Added to Cart');
        mParticle.EventType.getName(
            CommerceEventType.ProductAddToWishlist,
        ).should.equal('Product Added to Wishlist');
        mParticle.EventType.getName(
            CommerceEventType.ProductCheckout,
        ).should.equal('Product Checkout');
        mParticle.EventType.getName(
            CommerceEventType.ProductCheckoutOption,
        ).should.equal('Product Checkout Options');
        mParticle.EventType.getName(
            CommerceEventType.ProductClick,
        ).should.equal('Product Click');
        mParticle.EventType.getName(
            CommerceEventType.ProductImpression,
        ).should.equal('Product Impression');
        mParticle.EventType.getName(
            CommerceEventType.ProductPurchase,
        ).should.equal('Product Purchased');
        mParticle.EventType.getName(
            CommerceEventType.ProductRefund,
        ).should.equal('Product Refunded');
        mParticle.EventType.getName(
            CommerceEventType.ProductRemoveFromCart,
        ).should.equal('Product Removed From Cart');
        mParticle.EventType.getName(
            CommerceEventType.ProductRemoveFromWishlist,
        ).should.equal('Product Removed from Wishlist');
        mParticle.EventType.getName(
            CommerceEventType.ProductViewDetail,
        ).should.equal('Product View Details');
        mParticle.EventType.getName(
            CommerceEventType.PromotionClick,
        ).should.equal('Promotion Click');
        mParticle.EventType.getName(
            CommerceEventType.PromotionView,
        ).should.equal('Promotion View');
        mParticle.EventType.getName(null).should.equal('Other');

        done();
    });

    it('identity type should return name', function (done) {
        mParticle.IdentityType.getName(IdentityType.CustomerId).should.equal(
            'Customer ID',
        );
        mParticle.IdentityType.getName(IdentityType.Facebook).should.equal(
            'Facebook ID',
        );
        mParticle.IdentityType.getName(IdentityType.Twitter).should.equal(
            'Twitter ID',
        );
        mParticle.IdentityType.getName(IdentityType.Google).should.equal(
            'Google ID',
        );
        mParticle.IdentityType.getName(IdentityType.Microsoft).should.equal(
            'Microsoft ID',
        );
        mParticle.IdentityType.getName(IdentityType.Yahoo).should.equal(
            'Yahoo ID',
        );
        mParticle.IdentityType.getName(IdentityType.Email).should.equal(
            'Email',
        );
        mParticle.IdentityType.getName(
            IdentityType.FacebookCustomAudienceId,
        ).should.equal('Facebook App User ID');
        mParticle.IdentityType.getName(null).should.equal('Other ID');

        done();
    });

    it('product action type should return name', function (done) {
        mParticle.ProductActionType.getName(
            ProductActionType.AddToCart,
        ).should.equal('Add to Cart');
        mParticle.ProductActionType.getName(
            ProductActionType.RemoveFromCart,
        ).should.equal('Remove from Cart');
        mParticle.ProductActionType.getName(
            ProductActionType.Checkout,
        ).should.equal('Checkout');
        mParticle.ProductActionType.getName(
            ProductActionType.CheckoutOption,
        ).should.equal('Checkout Option');
        mParticle.ProductActionType.getName(
            ProductActionType.Click,
        ).should.equal('Click');
        mParticle.ProductActionType.getName(
            ProductActionType.ViewDetail,
        ).should.equal('View Detail');
        mParticle.ProductActionType.getName(
            ProductActionType.Purchase,
        ).should.equal('Purchase');
        mParticle.ProductActionType.getName(
            ProductActionType.Refund,
        ).should.equal('Refund');
        mParticle.ProductActionType.getName(
            ProductActionType.AddToWishlist,
        ).should.equal('Add to Wishlist');
        mParticle.ProductActionType.getName(
            ProductActionType.RemoveFromWishlist,
        ).should.equal('Remove from Wishlist');
        mParticle.ProductActionType.getName(null).should.equal('Unknown');

        done();
    });

    it('promotion action type should return name', function (done) {
        mParticle.PromotionType.getName(
            PromotionType.PromotionView,
        ).should.equal('Promotion View');
        mParticle.PromotionType.getName(
            PromotionType.PromotionClick,
        ).should.equal('Promotion Click');
        mParticle.PromotionType.getName(null).should.equal('Unknown');

        done();
    });

    it('should return false for an invalid identity type and true for a valid identity type', function (done) {
        const invalidResult1 = IdentityType.isValid(11);
        const invalidResult2 = IdentityType.isValid('5');
        const validResult = IdentityType.isValid(1);

        invalidResult1.should.be.false;
        invalidResult2.should.be.false;
        validResult.should.be.true;

        done();
    });
});