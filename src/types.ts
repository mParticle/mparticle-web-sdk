import Constants from './constants';
import { isNumber, parseNumber, valueof } from './utils';

interface IdentitiesByType {
    [key: number]: string;
}

export const MessageType = {
    SessionStart: 1 as const,
    SessionEnd: 2 as const,
    PageView: 3 as const,
    PageEvent: 4 as const,
    CrashReport: 5 as const,
    OptOut: 6 as const,
    AppStateTransition: 10 as const,
    Profile: 14 as const,
    Commerce: 16 as const,
    Media: 20 as const,
    UserAttributeChange: 17 as const,
    UserIdentityChange: 18 as const,
};

export const EventType = {
    Unknown: 0 as const,
    Navigation: 1 as const,
    Location: 2 as const,
    Search: 3 as const,
    Transaction: 4 as const,
    UserContent: 5 as const,
    UserPreference: 6 as const,
    Social: 7 as const,
    Other: 8 as const,
    Media: 9 as const,

    getName(id: number): string {
        switch (id) {
            case EventType.Unknown:
                return 'Unknown';
            case EventType.Navigation:
                return 'Navigation';
            case EventType.Location:
                return 'Location';
            case EventType.Search:
                return 'Search';
            case EventType.Transaction:
                return 'Transaction';
            case EventType.UserContent:
                return 'User Content';
            case EventType.UserPreference:
                return 'User Preference';
            case EventType.Social:
                return 'Social';
            case CommerceEventType.ProductAddToCart:
                return 'Product Added to Cart';
            case CommerceEventType.ProductAddToWishlist:
                return 'Product Added to Wishlist';
            case CommerceEventType.ProductCheckout:
                return 'Product Checkout';
            case CommerceEventType.ProductCheckoutOption:
                return 'Product Checkout Options';
            case CommerceEventType.ProductClick:
                return 'Product Click';
            case CommerceEventType.ProductImpression:
                return 'Product Impression';
            case CommerceEventType.ProductPurchase:
                return 'Product Purchased';
            case CommerceEventType.ProductRefund:
                return 'Product Refunded';
            case CommerceEventType.ProductRemoveFromCart:
                return 'Product Removed From Cart';
            case CommerceEventType.ProductRemoveFromWishlist:
                return 'Product Removed from Wishlist';
            case CommerceEventType.ProductViewDetail:
                return 'Product View Details';
            case CommerceEventType.PromotionClick:
                return 'Promotion Click';
            case CommerceEventType.PromotionView:
                return 'Promotion View';
            default:
                return 'Other';
        }
    },
};

// Continuation of EventType enum above, but in seperate object since we don't expose these to end user
export const CommerceEventType = {
    ProductAddToCart: 10 as const,
    ProductRemoveFromCart: 11 as const,
    ProductCheckout: 12 as const,
    ProductCheckoutOption: 13 as const,
    ProductClick: 14 as const,
    ProductViewDetail: 15 as const,
    ProductPurchase: 16 as const,
    ProductRefund: 17 as const,
    PromotionView: 18 as const,
    PromotionClick: 19 as const,
    ProductAddToWishlist: 20 as const,
    ProductRemoveFromWishlist: 21 as const,
    ProductImpression: 22 as const,
};

export const IdentityType = {
    Other: 0 as const,
    CustomerId: 1 as const,
    Facebook: 2 as const,
    Twitter: 3 as const,
    Google: 4 as const,
    Microsoft: 5 as const,
    Yahoo: 6 as const,
    Email: 7 as const,
    FacebookCustomAudienceId: 9 as const,
    Other2: 10 as const,
    Other3: 11 as const,
    Other4: 12 as const,
    Other5: 13 as const,
    Other6: 14 as const,
    Other7: 15 as const,
    Other8: 16 as const,
    Other9: 17 as const,
    Other10: 18 as const,
    MobileNumber: 19 as const,
    PhoneNumber2: 20 as const,
    PhoneNumber3: 21 as const,

    isValid(identityType: number): boolean {
        if (typeof identityType === 'number') {
            for (const prop in IdentityType) {
                if (IdentityType.hasOwnProperty(prop)) {
                    if (IdentityType[prop] === identityType) {
                        return true;
                    }
                }
            }
        }

        return false;
    },

    getName: (identityType: number): string => {
        switch (identityType) {
            case window.mParticle.IdentityType.CustomerId:
                return 'Customer ID';
            case window.mParticle.IdentityType.Facebook:
                return 'Facebook ID';
            case window.mParticle.IdentityType.Twitter:
                return 'Twitter ID';
            case window.mParticle.IdentityType.Google:
                return 'Google ID';
            case window.mParticle.IdentityType.Microsoft:
                return 'Microsoft ID';
            case window.mParticle.IdentityType.Yahoo:
                return 'Yahoo ID';
            case window.mParticle.IdentityType.Email:
                return 'Email';
            case window.mParticle.IdentityType.FacebookCustomAudienceId:
                return 'Facebook App User ID';
            default:
                return 'Other ID';
        }
    },

    getIdentityType: (
        identityName: string,
    ): valueof<typeof IdentityType> | boolean => {
        switch (identityName) {
            case 'other':
                return IdentityType.Other;
            case 'customerid':
                return IdentityType.CustomerId;
            case 'facebook':
                return IdentityType.Facebook;
            case 'twitter':
                return IdentityType.Twitter;
            case 'google':
                return IdentityType.Google;
            case 'microsoft':
                return IdentityType.Microsoft;
            case 'yahoo':
                return IdentityType.Yahoo;
            case 'email':
                return IdentityType.Email;
            case 'facebookcustomaudienceid':
                return IdentityType.FacebookCustomAudienceId;
            case 'other2':
                return IdentityType.Other2;
            case 'other3':
                return IdentityType.Other3;
            case 'other4':
                return IdentityType.Other4;
            case 'other5':
                return IdentityType.Other5;
            case 'other6':
                return IdentityType.Other6;
            case 'other7':
                return IdentityType.Other7;
            case 'other8':
                return IdentityType.Other8;
            case 'other9':
                return IdentityType.Other9;
            case 'other10':
                return IdentityType.Other10;
            case 'mobile_number':
                return IdentityType.MobileNumber;
            case 'phone_number_2':
                return IdentityType.PhoneNumber2;
            case 'phone_number_3':
                return IdentityType.PhoneNumber3;
            default:
                return false;
        }
    },

    getIdentityName: (identityType: number): string | null => {
        switch (identityType) {
            case IdentityType.Other:
                return 'other';
            case IdentityType.CustomerId:
                return 'customerid';
            case IdentityType.Facebook:
                return 'facebook';
            case IdentityType.Twitter:
                return 'twitter';
            case IdentityType.Google:
                return 'google';
            case IdentityType.Microsoft:
                return 'microsoft';
            case IdentityType.Yahoo:
                return 'yahoo';
            case IdentityType.Email:
                return 'email';
            case IdentityType.FacebookCustomAudienceId:
                return 'facebookcustomaudienceid';
            case IdentityType.Other2:
                return 'other2';
            case IdentityType.Other3:
                return 'other3';
            case IdentityType.Other4:
                return 'other4';
            case IdentityType.Other5:
                return 'other5';
            case IdentityType.Other6:
                return 'other6';
            case IdentityType.Other7:
                return 'other7';
            case IdentityType.Other8:
                return 'other8';
            case IdentityType.Other9:
                return 'other9';
            case IdentityType.Other10:
                return 'other10';
            case IdentityType.MobileNumber:
                return 'mobile_number';
            case IdentityType.PhoneNumber2:
                return 'phone_number_2';
            case IdentityType.PhoneNumber3:
                return 'phone_number_3';
            default:
                return null;
        }
    },

    // Strips out functions from Identity Types for easier lookups
    getValuesAsStrings: (): string[] =>
        Object.values(IdentityType)
            .map((value) => (isNumber(value) ? value.toString() : undefined))
            .filter((value) => value !== undefined) as string[],

    getNewIdentitiesByName: (
        newIdentitiesByType: IdentitiesByType,
    ): IdentitiesByType => {
        const newIdentitiesByName: IdentitiesByType = {};
        const identityTypeValuesAsStrings: string[] =
            IdentityType.getValuesAsStrings();

        for (const key in newIdentitiesByType) {
            // IdentityTypes are stored as numbers but are passed in as strings
            if (identityTypeValuesAsStrings.includes(key)) {
                const identityNameKey = IdentityType.getIdentityName(
                    parseNumber(key),
                );
                newIdentitiesByName[identityNameKey] = newIdentitiesByType[key];
            }
        }

        return newIdentitiesByName;
    },
};

export const ProductActionType = {
    Unknown: 0 as const,
    AddToCart: 1 as const,
    RemoveFromCart: 2 as const,
    Checkout: 3 as const,
    CheckoutOption: 4 as const,
    Click: 5 as const,
    ViewDetail: 6 as const,
    Purchase: 7 as const,
    Refund: 8 as const,
    AddToWishlist: 9 as const,
    RemoveFromWishlist: 10 as const,

    getName: (id: number): string => {
        switch (id) {
            case ProductActionType.AddToCart:
                return 'Add to Cart';
            case ProductActionType.RemoveFromCart:
                return 'Remove from Cart';
            case ProductActionType.Checkout:
                return 'Checkout';
            case ProductActionType.CheckoutOption:
                return 'Checkout Option';
            case ProductActionType.Click:
                return 'Click';
            case ProductActionType.ViewDetail:
                return 'View Detail';
            case ProductActionType.Purchase:
                return 'Purchase';
            case ProductActionType.Refund:
                return 'Refund';
            case ProductActionType.AddToWishlist:
                return 'Add to Wishlist';
            case ProductActionType.RemoveFromWishlist:
                return 'Remove from Wishlist';
            default:
                return 'Unknown';
        }
    },

    // these are the action names used by server and mobile SDKs when expanding a CommerceEvent
    getExpansionName: (id: number) => {
        switch (id) {
            case ProductActionType.AddToCart:
                return 'add_to_cart';
            case ProductActionType.RemoveFromCart:
                return 'remove_from_cart';
            case ProductActionType.Checkout:
                return 'checkout';
            case ProductActionType.CheckoutOption:
                return 'checkout_option';
            case ProductActionType.Click:
                return 'click';
            case ProductActionType.ViewDetail:
                return 'view_detail';
            case ProductActionType.Purchase:
                return 'purchase';
            case ProductActionType.Refund:
                return 'refund';
            case ProductActionType.AddToWishlist:
                return 'add_to_wishlist';
            case ProductActionType.RemoveFromWishlist:
                return 'remove_from_wishlist';
            default:
                return 'unknown';
        }
    },
};

export const PromotionActionType = {
    Unknown: 0 as const,
    PromotionView: 1 as const,
    PromotionClick: 2 as const,

    getName: (id: number): string => {
        switch (id) {
            case PromotionActionType.PromotionView:
                return 'view';
            case PromotionActionType.PromotionClick:
                return 'click';
            default:
                return 'unknown';
        }
    },

    // these are the names that the server and mobile SDKs use while expanding CommerceEvent
    getExpansionName: (id: number): string => {
        switch (id) {
            case PromotionActionType.PromotionView:
                return 'view';
            case PromotionActionType.PromotionClick:
                return 'click';
            default:
                return 'unknown';
        }
    },
};

export const ProfileMessageType = {
    Logout: 3 as const,
};

export const ApplicationTransitionType = {
    AppInit: 1 as const,
};

export default {
    MessageType,
    EventType,
    CommerceEventType,
    IdentityType,
    ProfileMessageType,
    ApplicationTransitionType,
    ProductActionType,
    PromotionActionType,
    Environment: Constants.Environment,
} as const;
