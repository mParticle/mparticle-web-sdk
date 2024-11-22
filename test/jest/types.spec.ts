import {
    ApplicationTransitionType,
    CommerceEventType,
    EventType,
    IdentityType,
    MessageType,
    ProductActionType,
    ProfileMessageType,
    PromotionActionType,
} from '../../src/types';



describe('MessageType', () => {
    it('returns a message type', () => {
        const {
            SessionStart,
            SessionEnd,
            PageView,
            PageEvent,
            CrashReport,
            AppStateTransition,
            Profile,
            Commerce,
            UserAttributeChange,
            UserIdentityChange,
        } = MessageType;

        expect(SessionStart).toEqual(1);
        expect(SessionEnd).toEqual(2);
        expect(PageView).toEqual(3);
        expect(PageEvent).toEqual(4);
        expect(CrashReport).toEqual(5);
        expect(AppStateTransition).toEqual(10);
        expect(Profile).toEqual(14);
        expect(Commerce).toEqual(16);
        expect(UserAttributeChange).toEqual(17);
        expect(UserIdentityChange).toEqual(18);
    });
});

describe('EventType', () => {
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
    } = EventType;

    it('returns an event type', () => {
        expect(Unknown).toEqual(0);
        expect(Navigation).toEqual(1);
        expect(Location).toEqual(2);
        expect(Search).toEqual(3);
        expect(Transaction).toEqual(4);
        expect(UserContent).toEqual(5);
        expect(UserPreference).toEqual(6);
        expect(Social).toEqual(7);
        expect(Other).toEqual(8);
        expect(Media).toEqual(9);
    });

    describe('#getName', () => {
        it('returns the name of an Event Type', () => {
            const { getName } = EventType;

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
            const { getName } = EventType;

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


            expect(EventType.getName(ProductAddToCart)).toBe(
                'Product Added to Cart'
            );
            expect(getName(ProductRemoveFromCart)).toBe(
                'Product Removed From Cart'
            );
            expect(getName(ProductCheckout)).toBe(
                'Product Checkout'
            );
            expect(getName(ProductCheckoutOption)).toBe(
                'Product Checkout Options'
            );
            expect(getName(ProductClick)).toBe('Product Click');
            expect(getName(ProductViewDetail)).toBe(
                'Product View Details'
            );
            expect(getName(ProductPurchase)).toBe(
                'Product Purchased'
            );
            expect(getName(ProductRefund)).toBe('Product Refunded');
            expect(getName(PromotionView)).toBe('Promotion View');
            expect(getName(PromotionClick)).toBe('Promotion Click');
            expect(getName(ProductAddToWishlist)).toBe(
                'Product Added to Wishlist'
            );
            expect(getName(ProductRemoveFromWishlist)).toBe(
                'Product Removed from Wishlist'
            );
            expect(getName(ProductImpression)).toBe('Product Impression');
        });
        

        it('returns other if the event type is not found', () => {
            const { getName } = EventType;

            expect(getName('foo' as unknown as number)).toBe('Other');
        });

        it('returns other if the commerce event type is not found', () => {
            const { getName } = EventType;

            expect(getName(NaN)).toBe('Other');
        });
    });
});

describe('CommerceEventType', () => {
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

    it('returns a commerce event type', () => {
        expect(ProductAddToCart).toEqual(10);
        expect(ProductRemoveFromCart).toEqual(11);
        expect(ProductCheckout).toEqual(12);
        expect(ProductCheckoutOption).toEqual(13);
        expect(ProductClick).toEqual(14);
        expect(ProductViewDetail).toEqual(15);
        expect(ProductPurchase).toEqual(16);
        expect(ProductRefund).toEqual(17);
        expect(PromotionView).toEqual(18);
        expect(PromotionClick).toEqual(19);
        expect(ProductAddToWishlist).toEqual(20);
        expect(ProductRemoveFromWishlist).toEqual(21);
        expect(ProductImpression).toEqual(22);
    });

    describe('#getName', () => {

    });
});

describe('IdentityType', () => {
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

    it('returns an identity type', () => {
        expect(Other).toEqual(0);
        expect(CustomerId).toEqual(1);
        expect(Facebook).toEqual(2);
        expect(Twitter).toEqual(3);
        expect(Google).toEqual(4);
        expect(Microsoft).toEqual(5);
        expect(Yahoo).toEqual(6);
        expect(Email).toEqual(7);

        // There is no value for 8

        expect(FacebookCustomAudienceId).toEqual(9);
        expect(Other2).toEqual(10);
        expect(Other3).toEqual(11);
        expect(Other4).toEqual(12);
        expect(Other5).toEqual(13);
        expect(Other6).toEqual(14);
        expect(Other7).toEqual(15);
        expect(Other8).toEqual(16);
        expect(Other9).toEqual(17);
        expect(Other10).toEqual(18);
        expect(MobileNumber).toEqual(19);
        expect(PhoneNumber2).toEqual(20);
        expect(PhoneNumber3).toEqual(21);
    });

    describe('#getValuesAsStrings', () => {
        it('returns an array of identity types values as an array of numbers as strings', () => {
            const { getValuesAsStrings } = IdentityType;

            expect(getValuesAsStrings()).toEqual([
                '0',
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '9',
                '10',
                '11',
                '12',
                '13',
                '14',
                '15',
                '16',
                '17',
                '18',
                '19',
                '20',
                '21',
            ]);
        });
    });

    describe('#isValid', () => {
        it('returns true if the identity type is valid', () => {
            const { isValid } = IdentityType;

            expect(isValid(Other)).toBe(true);
            expect(isValid(CustomerId)).toBe(true);
            expect(isValid(Facebook)).toBe(true);
            expect(isValid(Twitter)).toBe(true);
            expect(isValid(Google)).toBe(true);
            expect(isValid(Microsoft)).toBe(true);
            expect(isValid(Yahoo)).toBe(true);
            expect(isValid(Email)).toBe(true);
            expect(isValid(FacebookCustomAudienceId)).toBe(true);
            expect(isValid(Other2)).toBe(true);
            expect(isValid(Other3)).toBe(true);
            expect(isValid(Other4)).toBe(true);
            expect(isValid(Other5)).toBe(true);
            expect(isValid(Other6)).toBe(true);
            expect(isValid(Other7)).toBe(true);
            expect(isValid(Other8)).toBe(true);
            expect(isValid(Other9)).toBe(true);
            expect(isValid(Other10)).toBe(true);
            expect(isValid(MobileNumber)).toBe(true);
            expect(isValid(PhoneNumber2)).toBe(true);
            expect(isValid(PhoneNumber3)).toBe(true);
        });

        it('returns false if the identity type is not valid', () => {
            const { isValid } = IdentityType;

            expect(isValid(NaN)).toBe(false);
            expect(isValid('invalid' as unknown as number)).toBe(false);
        });
    });

    describe('#getNewIdentitesByName', () => {
        it('returns an identity name when passing an identity type', () => {
            const { getNewIdentitiesByName } = IdentityType;

            const newIdentitiesByType = {
                [CustomerId]: 'foo',
                [Email]: 'bar@gmail.com',
            };

            expect(getNewIdentitiesByName(newIdentitiesByType)).toEqual({
                customerid: 'foo',
                email: 'bar@gmail.com',
            });
        });

        it('returns an empty object if the identity type is not found', () => {
            const { getNewIdentitiesByName } = IdentityType;

            const newIdentitiesByType = {
                [NaN]: 'not-a-number',
                ['invalid']: 'not-valid',
            };

            expect(getNewIdentitiesByName(newIdentitiesByType)).toEqual({});
        });
    });

    describe('#getIdentityName', () => {
        it('returns an identity name when passing an identity type', () => {
            const { getIdentityName } = IdentityType;

            expect(getIdentityName(Other)).toBe('other');
            expect(getIdentityName(CustomerId)).toBe('customerid');
            expect(getIdentityName(Facebook)).toBe('facebook');
            expect(getIdentityName(Twitter)).toBe('twitter');
            expect(getIdentityName(Google)).toBe('google');
            expect(getIdentityName(Microsoft)).toBe('microsoft');
            expect(getIdentityName(Yahoo)).toBe('yahoo');
            expect(getIdentityName(Email)).toBe('email');
            expect(getIdentityName(FacebookCustomAudienceId)).toBe(
                'facebookcustomaudienceid'
            );
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
            const { getIdentityName } = IdentityType;

            expect(getIdentityName('foo')).toBe(null);
        });
    });

    describe('#getName', () => {
        it('returns the name of an Identity Type', () => {
            const { getName } = IdentityType;

            expect(getName(CustomerId)).toBe('Customer ID');
            expect(getName(Facebook)).toBe('Facebook ID');
            expect(getName(Twitter)).toBe('Twitter ID');
            expect(getName(Google)).toBe('Google ID');
            expect(getName(Microsoft)).toBe('Microsoft ID');
            expect(getName(Yahoo)).toBe('Yahoo ID');
            expect(getName(Email)).toBe('Email');
            expect(getName(FacebookCustomAudienceId)).toBe('Facebook App User ID');
        }); 

        it('returns other if the identity type is not found', () => {
            const { getName } = IdentityType;

            expect(getName(Other)).toBe('Other ID');
            expect(getName(Other2)).toBe('Other ID');
            expect(getName(Other3)).toBe('Other ID');
            expect(getName(Other4)).toBe('Other ID');
            expect(getName(Other5)).toBe('Other ID');
            expect(getName(Other6)).toBe('Other ID');
            expect(getName(Other7)).toBe('Other ID');
            expect(getName(Other8)).toBe('Other ID');
            expect(getName(Other9)).toBe('Other ID');
            expect(getName(Other10)).toBe('Other ID');
            expect(getName(MobileNumber)).toBe('Other ID');
            expect(getName(PhoneNumber2)).toBe('Other ID');
            expect(getName(PhoneNumber3)).toBe('Other ID');

            expect(getName(NaN)).toBe('Other ID');
        });
    });

    describe('#getIdentityType', () => {
        it('returns the identity type when passing an identity name', () => {
            const { getIdentityType } = IdentityType;

            expect(getIdentityType('other')).toBe(Other);
            expect(getIdentityType('customerid')).toBe(CustomerId);
            expect(getIdentityType('facebook')).toBe(Facebook);
            expect(getIdentityType('twitter')).toBe(Twitter);
            expect(getIdentityType('google')).toBe(Google);
            expect(getIdentityType('microsoft')).toBe(Microsoft);
            expect(getIdentityType('yahoo')).toBe(Yahoo);
            expect(getIdentityType('email')).toBe(Email);
            expect(getIdentityType('facebookcustomaudienceid')).toBe(
                FacebookCustomAudienceId
            );
            expect(getIdentityType('other2')).toBe(Other2);
            expect(getIdentityType('other3')).toBe(Other3);
            expect(getIdentityType('other4')).toBe(Other4);
            expect(getIdentityType('other5')).toBe(Other5);
            expect(getIdentityType('other6')).toBe(Other6);
            expect(getIdentityType('other7')).toBe(Other7);
            expect(getIdentityType('other8')).toBe(Other8);
            expect(getIdentityType('other9')).toBe(Other9);
            expect(getIdentityType('other10')).toBe(Other10);
            expect(getIdentityType('mobile_number')).toBe(MobileNumber);
            expect(getIdentityType('phone_number_2')).toBe(PhoneNumber2);
            expect(getIdentityType('phone_number_3')).toBe(PhoneNumber3);
        });

        it('returns false if the identity name is not found', () => {
            const { getIdentityType } = IdentityType;

            expect(getIdentityType('foo')).toBe(false);
        });
    });
});

describe('ProductActionType', () => {
    const {
        Unknown,
        AddToCart,
        RemoveFromCart,
        Checkout,
        CheckoutOption,
        Click,
        ViewDetail,
        Purchase,
        Refund,
        AddToWishlist,
        RemoveFromWishlist,
    } = ProductActionType;

    it('returns a product action type', () => {
        expect(Unknown).toEqual(0);
        expect(AddToCart).toEqual(1);
        expect(RemoveFromCart).toEqual(2);
        expect(Checkout).toEqual(3);
        expect(CheckoutOption).toEqual(4);
        expect(Click).toEqual(5);
        expect(ViewDetail).toEqual(6);
        expect(Purchase).toEqual(7);
        expect(Refund).toEqual(8);
        expect(AddToWishlist).toEqual(9);
        expect(RemoveFromWishlist).toEqual(10);
    });

    describe('#getName', () => {
        it('returns the name of a Product Action Type', () => {
            expect(ProductActionType.getName(Unknown)).toBe('Unknown');
            expect(ProductActionType.getName(AddToCart)).toBe('Add to Cart');
            expect(ProductActionType.getName(RemoveFromCart)).toBe(
                'Remove from Cart'
            );
            expect(ProductActionType.getName(Checkout)).toBe('Checkout');
            expect(ProductActionType.getName(CheckoutOption)).toBe(
                'Checkout Option'
            );
            expect(ProductActionType.getName(Click)).toBe('Click');
            expect(ProductActionType.getName(ViewDetail)).toBe('View Detail');
            expect(ProductActionType.getName(Purchase)).toBe('Purchase');
            expect(ProductActionType.getName(Refund)).toBe('Refund');
            expect(ProductActionType.getName(AddToWishlist)).toBe(
                'Add to Wishlist'
            );
            expect(ProductActionType.getName(RemoveFromWishlist)).toBe(
                'Remove from Wishlist'
            );
        });

        it('returns unknown if the product action type is not found', () => {
            expect(ProductActionType.getName(NaN)).toBe('Unknown');
        });
    });

    describe('#getExpansionName', () => {
        it('returns the expanded name of a Product Action Type', () => {
            expect(ProductActionType.getExpansionName(Unknown)).toBe('unknown');
            expect(ProductActionType.getExpansionName(AddToCart)).toBe(
                'add_to_cart'
            );
            expect(ProductActionType.getExpansionName(RemoveFromCart)).toBe(
                'remove_from_cart'
            );
            expect(ProductActionType.getExpansionName(Checkout)).toBe(
                'checkout'
            );
            expect(ProductActionType.getExpansionName(CheckoutOption)).toBe(
                'checkout_option'
            );
            expect(ProductActionType.getExpansionName(Click)).toBe('click');
            expect(ProductActionType.getExpansionName(ViewDetail)).toBe(
                'view_detail'
            );
            expect(ProductActionType.getExpansionName(Purchase)).toBe(
                'purchase'
            );
            expect(ProductActionType.getExpansionName(Refund)).toBe('refund');
            expect(ProductActionType.getExpansionName(AddToWishlist)).toBe(
                'add_to_wishlist'
            );
            expect(ProductActionType.getExpansionName(RemoveFromWishlist)).toBe(
                'remove_from_wishlist'
            );
        });

        it('returns unknown if the product action type is not found', () => {
            expect(ProductActionType.getExpansionName(NaN)).toBe('unknown');
        });
    });
});

describe('PromotionActionType', () => {
    it('returns a promotion action type', () => {
        const { Unknown, PromotionView, PromotionClick } = PromotionActionType;

        expect(Unknown).toEqual(0);
        expect(PromotionView).toEqual(1);
        expect(PromotionClick).toEqual(2);
    });

    describe('#getName', () => {
        it('returns the name of a Promotion Action Type', () => {
            const {
                PromotionView,
                PromotionClick,
                getName,
            } = PromotionActionType;

            expect(getName(PromotionView)).toBe('view');
            expect(getName(PromotionClick)).toBe('click');
        });

        it('returns unknown if the promotion action type is not found', () => {
            const { getName } = PromotionActionType;

            expect(getName(0)).toBe('unknown');
        });
    });

    describe('#getExpansionName', () => {
        it('returns the name of a Promotion Action Type', () => {
            const {
                PromotionView,
                PromotionClick,
                getExpansionName,
            } = PromotionActionType;

            expect(getExpansionName(PromotionView)).toBe('view');
            expect(getExpansionName(PromotionClick)).toBe('click');
        });

        it('returns unknown if the promotion action type is not found', () => {
            const { getExpansionName } = PromotionActionType;

            expect(getExpansionName(0)).toBe('unknown');
        });
    });
});

describe('ProfileMessageType', () => {
    it('returns a profile message type', () => {
        expect(ProfileMessageType.Logout).toEqual(3);
    });
});

describe('ApplicationTransitionType', () => {
    it('returns an application transition type', () => {
        expect(ApplicationTransitionType.AppInit).toEqual(1);
    });
});
