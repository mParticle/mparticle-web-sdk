let mParticle = {
    endSession: voidFunction,
    getAppName: returnString,
    getAppVersion: returnString,
    getDeviceId: returnString,
    getVersion: returnString,
    init: voidFunction,
    logError: voidFunction,
    logEvent: voidFunction,
    logForm: voidFunction,
    logLink: voidFunction,
    logPageView: voidFunction,
    ready: voidFunction,
    reset: voidFunction,
    _resetForTests: voidFunction,
    setAppName: voidFunction,
    setAppVersion: voidFunction,
    setLogLevel: voidFunction,
    setOptOut: voidFunction,
    setPosition: voidFunction,
    setSessionAttribute: voidFunction,
    startNewSession: voidFunction,
    startTrackingLocation: voidFunction,
    stopTrackingLocation: voidFunction,
    CommerceEventType: {},
    EventType: {},
    IdentityType: {},
    ProductActionType: {},
    PromotionType: {},
    eCommerce: {
        createImpression: returnImpression,
        createProduct: returnProduct,
        createPromotion: returnPromotion,
        createTransactionAttributes: returnTransactionAttributes,
        logCheckout: voidFunction,
        logImpression: voidFunction,
        logProductAction: voidFunction,
        logPromotion: voidFunction,
        logPurchase: voidFunction,
        logRefund: voidFunction,
        setCurrencyCode: voidFunction,
        Cart: new Cart(),
    },
    Consent: {
        createConsentState: createConsentState,
        createGDPRConsent: returnGDPRConsent,
    },
    Identity: {
        aliasUsers: voidFunction,
        createAliasRequest: createAliasRequest,
        getCurrentUser: returnUser,
        getUser: returnUser,
        getUsers: returnUsers,
        identify: voidFunction,
        login: voidFunction,
        logout: voidFunction,
        modify: voidFunction,
    },
};

function voidFunction() {}
function returnString() {
    return '';
}
function returnObject() {
    return {};
}
function returnThis() {
    return this;
}
function returnUser() {
    return {
        getUserIdentities: function() {
            return {
                userIdentities: {},
            };
        },
        getMPID: returnString,
        setUserTag: voidFunction,
        removeUserTag: voidFunction,
        setUserAttribute: voidFunction,
        setUserAttributes: voidFunction,
        removeUserAttribute: voidFunction,
        setUserAttributeList: voidFunction,
        removeAllUserAttributes: voidFunction,
        getUserAttributesLists: returnObject,
        getAllUserAttributes: returnObject,
        getCart: Cart,
        getConsentState: createConsentState,
        setConsentState: voidFunction,
    };
}

function returnUsers() {
    return [returnUser()];
}

function Cart() {
    return {
        add: voidFunction,
        clear: voidFunction,
        remove: voidFunction,
        getCartProducts: function() {
            return [returnProduct()];
        },
    };
}

function returnImpression() {
    return {
        Name: 'name',
        Product: returnProduct(),
    };
}

function returnProduct() {
    return {
        Name: 'name',
        Sku: 'sku',
        Price: 0,
        Quantity: 0,
        Brand: 'brand',
        Variant: 'variant',
        Category: 'category',
        Position: 'position',
        CouponCode: 'couponCode',
        TotalAmount: 0,
        Attributes: {},
    };
}

function returnPromotion() {
    return {
        Id: 'id',
        Creative: 'creative',
        Name: 'name',
        Position: 0,
    };
}

function returnTransactionAttributes() {
    return {
        Id: 'id',
        Affiliation: 'affiliation',
        CouponCode: 'couponCode',
        Revenue: 0,
        Shipping: 'shipping',
        Tax: 0,
    };
}

function returnGDPRConsent() {
    return {
        ConsentDocument: 'doc',
        Consented: false,
        HardwareId: 'id',
        Location: 'location',
        Timestamp: 1568648478988,
    };
}

function createAliasRequest() {
    return {
        sourceMpid: 'a',
        destinationMpid: 'b',
        startTime: new Date().getTime(),
        endTime: new Date().getTime(),
    };
}

function createConsentState() {
    return {
        addGDPRConsentState: returnThis,
        setGDPRConsentState: returnThis,
        getGDPRConsentState: returnGDPRConsent,
        removeGDPRConsentState: returnThis,
    };
}

export default mParticle;
