export declare const MessageType: {
    SessionStart: 1;
    SessionEnd: 2;
    PageView: 3;
    PageEvent: 4;
    CrashReport: 5;
    OptOut: 6;
    AppStateTransition: 10;
    Profile: 14;
    Commerce: 16;
    Media: 20;
    UserAttributeChange: 17;
    UserIdentityChange: 18;
};
export declare const EventType: {
    Unknown: 0;
    Navigation: 1;
    Location: 2;
    Search: 3;
    Transaction: 4;
    UserContent: 5;
    UserPreference: 6;
    Social: 7;
    Other: 8;
    Media: 9;
    getName(id: number): string;
};
export declare const CommerceEventType: {
    ProductAddToCart: 10;
    ProductRemoveFromCart: 11;
    ProductCheckout: 12;
    ProductCheckoutOption: 13;
    ProductClick: 14;
    ProductViewDetail: 15;
    ProductPurchase: 16;
    ProductRefund: 17;
    PromotionView: 18;
    PromotionClick: 19;
    ProductAddToWishlist: 20;
    ProductRemoveFromWishlist: 21;
    ProductImpression: 22;
};
export declare const IdentityType: any;
export declare const ProductActionType: {
    Unknown: 0;
    AddToCart: 1;
    RemoveFromCart: 2;
    Checkout: 3;
    CheckoutOption: 4;
    Click: 5;
    ViewDetail: 6;
    Purchase: 7;
    Refund: 8;
    AddToWishlist: 9;
    RemoveFromWishlist: 10;
    getName: (id: number) => string;
    getExpansionName: (id: number) => "add_to_cart" | "remove_from_cart" | "checkout" | "checkout_option" | "click" | "view_detail" | "purchase" | "refund" | "add_to_wishlist" | "remove_from_wishlist" | "unknown";
};
export declare const PromotionActionType: {
    Unknown: 0;
    PromotionView: 1;
    PromotionClick: 2;
    getName: (id: number) => string;
    getExpansionName: (id: number) => string;
};
export declare const ProfileMessageType: {
    Logout: 3;
};
export declare const ApplicationTransitionType: {
    AppInit: 1;
};
export declare const PerformanceMarkType: {
    SdkStart: "mp:sdkStart";
    JointSdkSelectPlacements: "mp:jointSdkSelectPlacements";
    JointSdkRoktKitInit: "mp:jointSdkRoktKitInit";
};
declare const _default: {
    readonly MessageType: {
        SessionStart: 1;
        SessionEnd: 2;
        PageView: 3;
        PageEvent: 4;
        CrashReport: 5;
        OptOut: 6;
        AppStateTransition: 10;
        Profile: 14;
        Commerce: 16;
        Media: 20;
        UserAttributeChange: 17;
        UserIdentityChange: 18;
    };
    readonly EventType: {
        Unknown: 0;
        Navigation: 1;
        Location: 2;
        Search: 3;
        Transaction: 4;
        UserContent: 5;
        UserPreference: 6;
        Social: 7;
        Other: 8;
        Media: 9;
        getName(id: number): string;
    };
    readonly CommerceEventType: {
        ProductAddToCart: 10;
        ProductRemoveFromCart: 11;
        ProductCheckout: 12;
        ProductCheckoutOption: 13;
        ProductClick: 14;
        ProductViewDetail: 15;
        ProductPurchase: 16;
        ProductRefund: 17;
        PromotionView: 18;
        PromotionClick: 19;
        ProductAddToWishlist: 20;
        ProductRemoveFromWishlist: 21;
        ProductImpression: 22;
    };
    readonly IdentityType: any;
    readonly ProfileMessageType: {
        Logout: 3;
    };
    readonly ApplicationTransitionType: {
        AppInit: 1;
    };
    readonly ProductActionType: {
        Unknown: 0;
        AddToCart: 1;
        RemoveFromCart: 2;
        Checkout: 3;
        CheckoutOption: 4;
        Click: 5;
        ViewDetail: 6;
        Purchase: 7;
        Refund: 8;
        AddToWishlist: 9;
        RemoveFromWishlist: 10;
        getName: (id: number) => string;
        getExpansionName: (id: number) => "add_to_cart" | "remove_from_cart" | "checkout" | "checkout_option" | "click" | "view_detail" | "purchase" | "refund" | "add_to_wishlist" | "remove_from_wishlist" | "unknown";
    };
    readonly PromotionActionType: {
        Unknown: 0;
        PromotionView: 1;
        PromotionClick: 2;
        getName: (id: number) => string;
        getExpansionName: (id: number) => string;
    };
    readonly Environment: {
        readonly Development: "development";
        readonly Production: "production";
    };
};
export default _default;
