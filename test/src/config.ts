import { SDKInitConfig } from "../../src/sdkRuntimeModels";

export const urls = {
    eventsV2: 'https://jssdks.mparticle.com/v2/JS/test_key/Events',
    eventsV3: 'https://jssdks.mparticle.com/v3/JS/test_key/events',
    identify: 'https://identity.mparticle.com/v1/identify',
    login: 'https://identity.mparticle.com/v1/login',
    logout: 'https://identity.mparticle.com/v1/logout',
    modify: 'https://identity.mparticle.com/v1/testMPID/modify',
    config: 'https://jssdkcdns.mparticle.com/JS/v2/test_key/config?env=0',
    alias: 'https://jssdks.mparticle.com/v1/identity/test_key/Alias',
    forwarding: 'https://jssdks.mparticle.com/v1/JS/test_key/Forwarding'
};

export const apiKey = 'test_key';
export const testMPID = 'testMPID';
export const v3CookieKey = 'mprtcl-v3';
export const v3LSKey = v3CookieKey;
export const localStorageProductsV4 = 'mprtcl-prodv4';
export const v4CookieKey = 'mprtcl-v4';
export const v4LSKey = 'mprtcl-v4';
export const workspaceToken = 'abcdef';
export const workspaceCookieName = 'mprtcl-v4' + '_' + workspaceToken;
export const das = 'das-test';
export const LocalStorageProductsV4WithWorkSpaceName =
    'mprtcl-prodv4' + '_' + workspaceToken;
export const MPConfig = {
    workspaceToken: workspaceToken,
} as SDKInitConfig;

export const MessageType = {
    SessionStart: 1,
    SessionEnd: 2,
    PageView: 3,
    PageEvent: 4,
    CrashReport: 5,
    OptOut: 6,
    AppStateTransition: 10,
    Profile: 14,
    Commerce: 16,
};
export const ProductActionType = {
    Unknown: 0,
    AddToCart: 1,
    RemoveFromCart: 2,
    Checkout: 3,
    CheckoutOption: 4,
    Click: 5,
    ViewDetail: 6,
    Purchase: 7,
    Refund: 8,
    AddToWishlist: 9,
    RemoveFromWishlist: 10,
};

export const PromotionActionType = {
    Unknown: 0,
    PromotionView: 1,
    PromotionClick: 2,
};

export const CommerceEventType = {
    ProductAddToCart: 10,
    ProductRemoveFromCart: 11,
    ProductCheckout: 12,
    ProductCheckoutOption: 13,
    ProductClick: 14,
    ProductViewDetail: 15,
    ProductPurchase: 16,
    ProductRefund: 17,
    PromotionView: 18,
    PromotionClick: 19,
    ProductAddToWishlist: 20,
    ProductRemoveFromWishlist: 21,
    ProductImpression: 22,
};