// TODO: Rename to Event Type?
// TODO: Add actual values for each enum
export enum EventTypeEnum {
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
}

export enum EventType {
    Unknown = 0,
    Navigation = 1,
    Location = 2,
    Search = 3,
    Transaction = 4,
    UserContent = 5,
    UserPreference = 6,
    Social = 7,
    Other = 8,
    Media = 9,
}

// TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5403
export enum MessageType {
    SessionStart = 1,
    SessionEnd = 2,
    PageView = 3,
    PageEvent = 4,
    CrashReport = 5,
    OptOut = 6,
    AppStateTransition = 10,
    Profile = 14,
    Commerce = 16,
    UserAttributeChange = 17,
    UserIdentityChange = 18,
    Media = 20,
};

export enum IdentityType {
    Other = 0,
    CustomerId = 1,
    Facebook = 2,
    Twitter = 3,
    Google = 4,
    Microsoft = 5,
    Yahoo = 6,
    Email = 7,
    FacebookCustomAudienceId = 9,
    Other2 = 10,
    Other3 = 11,
    Other4 = 12,
    Other5 = 13,
    Other6 = 14,
    Other7 = 15,
    Other8 = 16,
    Other9 = 17,
    Other10 = 18,
    MobileNumber = 19,
    PhoneNumber2 = 20,
    PhoneNumber3 = 21,
}

export enum CommerceEventType {
    ProductAddToCart = 10,
    ProductRemoveFromCart = 11,
    ProductCheckout = 12,
    ProductCheckoutOption = 13,
    ProductClick = 14,
    ProductViewDetail = 15,
    ProductPurchase = 16,
    ProductRefund = 17,
    PromotionView = 18,
    PromotionClick = 19,
    ProductAddToWishlist = 20,
    ProductRemoveFromWishlist = 21,
    ProductImpression = 22,
}

export interface IIdentityType {
    getIdentityType(identityType: string): IdentityType | null;
}
