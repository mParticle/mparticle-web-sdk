export default mParticle;
declare namespace mParticle {
    export { voidFunction as endSession };
    export { returnString as getAppName };
    export { returnString as getAppVersion };
    export { returnString as getDeviceId };
    export { returnString as getEnvironment };
    export { returnString as getVersion };
    export { voidFunction as init };
    export { voidFunction as logError };
    export { voidFunction as logEvent };
    export { voidFunction as logForm };
    export { voidFunction as logLink };
    export { voidFunction as logPageView };
    export { voidFunction as ready };
    export { voidFunction as reset };
    export { voidFunction as _resetForTests };
    export { voidFunction as setAppName };
    export { voidFunction as setAppVersion };
    export { voidFunction as setLogLevel };
    export { voidFunction as setOptOut };
    export { voidFunction as setPosition };
    export { voidFunction as setSessionAttribute };
    export { voidFunction as startNewSession };
    export { voidFunction as startTrackingLocation };
    export { voidFunction as stopTrackingLocation };
    export let CommerceEventType: {};
    export let EventType: {};
    export let IdentityType: {};
    export let ProductActionType: {};
    export let PromotionType: {};
    export namespace eCommerce {
        export { returnImpression as createImpression };
        export { returnProduct as createProduct };
        export { returnPromotion as createPromotion };
        export { returnTransactionAttributes as createTransactionAttributes };
        export { voidFunction as logCheckout };
        export { voidFunction as logImpression };
        export { voidFunction as logProductAction };
        export { voidFunction as logPromotion };
        export { voidFunction as logPurchase };
        export { voidFunction as logRefund };
        export { voidFunction as setCurrencyCode };
        export let Cart: any;
    }
    export namespace Consent {
        export { createConsentState };
        export { returnGDPRConsent as createGDPRConsent };
    }
    export namespace Identity {
        export { voidFunction as aliasUsers };
        export { createAliasRequest };
        export { returnUser as getCurrentUser };
        export { returnUser as getUser };
        export { returnUsers as getUsers };
        export { voidFunction as identify };
        export { voidFunction as login };
        export { voidFunction as logout };
        export { voidFunction as modify };
    }
}
declare function voidFunction(): void;
declare function returnString(): string;
declare function returnImpression(): {
    Name: string;
    Product: {
        Name: string;
        Sku: string;
        Price: number;
        Quantity: number;
        Brand: string;
        Variant: string;
        Category: string;
        Position: string;
        CouponCode: string;
        TotalAmount: number;
        Attributes: {};
    };
};
declare function returnProduct(): {
    Name: string;
    Sku: string;
    Price: number;
    Quantity: number;
    Brand: string;
    Variant: string;
    Category: string;
    Position: string;
    CouponCode: string;
    TotalAmount: number;
    Attributes: {};
};
declare function returnPromotion(): {
    Id: string;
    Creative: string;
    Name: string;
    Position: number;
};
declare function returnTransactionAttributes(): {
    Id: string;
    Affiliation: string;
    CouponCode: string;
    Revenue: number;
    Shipping: string;
    Tax: number;
};
declare function createConsentState(): {
    addGDPRConsentState: typeof returnThis;
    setGDPRConsentState: typeof returnThis;
    getGDPRConsentState: typeof returnGDPRConsent;
    removeGDPRConsentState: typeof returnThis;
};
declare function returnGDPRConsent(): {
    ConsentDocument: string;
    Consented: boolean;
    HardwareId: string;
    Location: string;
    Timestamp: number;
};
declare function createAliasRequest(): {
    sourceMpid: string;
    destinationMpid: string;
    startTime: number;
    endTime: number;
    scope: string;
};
declare function returnUser(): {
    getUserIdentities: () => {
        userIdentities: {};
    };
    getMPID: typeof returnString;
    setUserTag: typeof voidFunction;
    removeUserTag: typeof voidFunction;
    setUserAttribute: typeof voidFunction;
    setUserAttributes: typeof voidFunction;
    removeUserAttribute: typeof voidFunction;
    setUserAttributeList: typeof voidFunction;
    removeAllUserAttributes: typeof voidFunction;
    getUserAttributesLists: typeof returnObject;
    getAllUserAttributes: typeof returnObject;
    getCart: typeof Cart;
    getConsentState: typeof createConsentState;
    setConsentState: typeof voidFunction;
};
declare function returnUsers(): {
    getUserIdentities: () => {
        userIdentities: {};
    };
    getMPID: typeof returnString;
    setUserTag: typeof voidFunction;
    removeUserTag: typeof voidFunction;
    setUserAttribute: typeof voidFunction;
    setUserAttributes: typeof voidFunction;
    removeUserAttribute: typeof voidFunction;
    setUserAttributeList: typeof voidFunction;
    removeAllUserAttributes: typeof voidFunction;
    getUserAttributesLists: typeof returnObject;
    getAllUserAttributes: typeof returnObject;
    getCart: typeof Cart;
    getConsentState: typeof createConsentState;
    setConsentState: typeof voidFunction;
}[];
declare function returnThis(): any;
declare function returnObject(): {};
declare function Cart_1(): {
    add: typeof voidFunction;
    clear: typeof voidFunction;
    remove: typeof voidFunction;
    getCartProducts: () => {
        Name: string;
        Sku: string;
        Price: number;
        Quantity: number;
        Brand: string;
        Variant: string;
        Category: string;
        Position: string;
        CouponCode: string;
        TotalAmount: number;
        Attributes: {};
    }[];
};
