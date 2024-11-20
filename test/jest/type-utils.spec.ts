import { getIdentityName, getName, getNewIdentitiesByName } from '../../src/type-utils';
import { CommerceEventType, EventTypeEnum, IdentityType } from '../../src/types.interfaces';

describe('getNewIdentitesByName', () => {
    it('returns an identity name when passing an identity type', () => {
        const { Email, CustomerId } = IdentityType;

        const newIdentitiesByType = {
            [CustomerId]: 'foo',
            [Email]: 'bar@gmail.com',
        };

        expect(getNewIdentitiesByName(newIdentitiesByType)).toEqual({
            customerid: 'foo',
            email: 'bar@gmail.com',
        });
    });
});

describe('getIdentityName', () => {
    it('returns an identity name when passing an identity type', () => {
        const {
            Other,
            CustomerId,
            Facebook,
            Twitter,
            Google,
            Microsoft,
            Yahoo,
            Email,
            FacebookCustomAudienceId,
            Other2,
            Other3,
            Other4,
            Other5,
            Other6,
            Other7,
            Other8,
            Other9,
            Other10,
            MobileNumber,
            PhoneNumber2,
            PhoneNumber3,
        } = IdentityType;

        expect(getIdentityName(Other)).toBe('other');
        expect(getIdentityName(CustomerId)).toBe('customerid');
        expect(getIdentityName(Facebook)).toBe('facebook');
        expect(getIdentityName(Twitter)).toBe('twitter');
        expect(getIdentityName(Google)).toBe('google');
        expect(getIdentityName(Microsoft)).toBe('microsoft');
        expect(getIdentityName(Yahoo)).toBe('yahoo');
        expect(getIdentityName(Email)).toBe('email');
        expect(getIdentityName(FacebookCustomAudienceId)).toBe('facebookcustomaudienceid');
        expect(getIdentityName(Other2)).toBe('other2');
        expect(getIdentityName(Other3)).toBe('other3');
        expect(getIdentityName(Other4)).toBe('other4');
        expect(getIdentityName(Other5)).toBe('other5');
        expect(getIdentityName(Other6)).toBe('other6');
        expect(getIdentityName(Other7)).toBe('other7');
        expect(getIdentityName(Other8)).toBe('other8');
        expect(getIdentityName(Other9)).toBe('other9');
        expect(getIdentityName(Other10)).toBe('other10');
        expect(getIdentityName(MobileNumber)).toBe('mobile_number');
        expect(getIdentityName(PhoneNumber2)).toBe('phone_number_2');
        expect(getIdentityName(PhoneNumber3)).toBe('phone_number_3');
    });

    it('returns null if the identity type is not found', () => {
        expect(getIdentityName('foo' as unknown as IdentityType)).toBe(null);
    });
});

describe('#getName', () => {
    it('returns the name of an Event Type', () => {
        const {
            Unknown,
            Navigation,
            Location,
            Search,
            Transaction,
            UserContent,
            UserPreference,
            Social,
            Other,
            Media,
        } = EventTypeEnum;

        expect(getName(Unknown)).toBe('Unknown');
        expect(getName(Navigation)).toBe('Navigation');
        expect(getName(Location)).toBe('Location');
        expect(getName(Search)).toBe('Search');
        expect(getName(Transaction)).toBe('Transaction');
        expect(getName(UserContent)).toBe('User Content');
        expect(getName(UserPreference)).toBe('User Preference');
        expect(getName(Social)).toBe('Social');
        expect(getName(Other)).toBe('Other');
        expect(getName(Media)).toBe('Other');
    });

    it('returns the name of a Commerce Event Type', () => {
        const {
            ProductAddToCart,
            ProductRemoveFromCart,
            ProductCheckout,
            ProductCheckoutOption,
            ProductClick,
            ProductViewDetail,
            ProductPurchase,
            ProductRefund,
            PromotionView,
            PromotionClick,
            ProductAddToWishlist,
            ProductRemoveFromWishlist,
            ProductImpression,
        } = CommerceEventType;

        expect(getName(ProductAddToCart)).toBe('Product Added to Cart');
        expect(getName(ProductRemoveFromCart)).toBe('Product Removed From Cart');
        expect(getName(ProductCheckout)).toBe('Product Checkout');
        expect(getName(ProductCheckoutOption)).toBe('Product Checkout Options');
        expect(getName(ProductClick)).toBe('Product Click');
        expect(getName(ProductViewDetail)).toBe('Product View Details');
        expect(getName(ProductPurchase)).toBe('Product Purchased');
        expect(getName(ProductRefund)).toBe('Product Refunded');
        expect(getName(PromotionView)).toBe('Promotion View');
        expect(getName(PromotionClick)).toBe('Promotion Click');
        expect(getName(ProductAddToWishlist)).toBe('Product Added to Wishlist');
        expect(getName(ProductRemoveFromWishlist)).toBe('Product Removed from Wishlist');
        expect(getName(ProductImpression)).toBe('Product Impression');
    });

    it('returns other if the event type is not found', () => {
        expect(getName('foo' as unknown as EventTypeEnum)).toBe('Other');
    });
});

describe('#isValid', () => {});