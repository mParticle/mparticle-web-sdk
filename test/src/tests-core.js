var server = new MockHttpServer(),
    v1localStorageKey,
    apiKey = 'test_key',
    testMPID = 'testMPID',
    v1CookieKey = v1localStorageKey = 'mprtcl-api',
    v2CookieKey = 'mprtcl-v2',
    v3CookieKey = 'mprtcl-v3',
    v3LSKey = v3CookieKey,
    LocalStorageProductsV4 = 'mprtcl-prodv4',
    v4CookieKey = 'mprtcl-v4',
    v4LSKey = 'mprtcl-v4',
    pluses = /\+/g,
    getLocalStorageProducts = function getLocalStorageProducts() {
        return JSON.parse(atob(localStorage.getItem(LocalStorageProductsV4)));
    },
    decoded = function decoded(s) {
        return decodeURIComponent(s.replace(pluses, ' '));
    },
    converted = function (s) {
        if (s.indexOf('"') === 0) {
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        return s;
    },
    getCookieDomain = function() {
        var rootDomain = getDomain(document, location.hostname);
        if (rootDomain === '') {
            return '';
        } else {
            return '.' + rootDomain;
        }
    },
    getDomain = function(doc, locationHostname) {
        var i,
            testParts,
            mpTest = 'mptest=cookie',
            hostname = locationHostname.split('.');
        for (i = hostname.length - 1; i >= 0; i--) {
            testParts = hostname.slice(i).join('.');
            doc.cookie = mpTest + ';domain=.' + testParts + ';';
            if (doc.cookie.indexOf(mpTest) > -1){
                doc.cookie = mpTest.split('=')[0] + '=;domain=.' + testParts + ';expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                return testParts;
            }
        }
        return '';
    },
    findCookie = function(cookieName) {
        var cookie;
        if (cookieName === v4CookieKey || !cookieName) {
            cookie = mParticle.persistence.getCookie();
        } else if (cookieName === v3CookieKey) {
            cookie = JSON.parse(mParticle.persistence.replacePipesWithCommas(findEncodedCookie(cookieName)));
        } else {
            cookie = JSON.parse(findEncodedCookie(cookieName));
        }
        if (cookie) {
            return cookie;
        } else {
            return null;
        }
    },
    findEncodedCookie = function(cookieName) {
        var cookies = document.cookie.split('; ');
        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decoded(parts.shift());
            var cookie = decoded(parts.join('='));
            if (cookieName === name) {
                return mParticle.persistence.replacePipesWithCommas(converted(cookie));
            }
        }
    },
    setCookie = function(cname, data, raw) {
        var date = new Date(),
            expires = new Date(date.getTime() +
            (365 * 24 * 60 * 60 * 1000)).toGMTString(),
            domain, cookieDomain,
            value;
        if (cname === v4CookieKey) {
            value = mParticle.persistence.replaceCommasWithPipes(data);
        } else if (cname === v3CookieKey) {
            value = data;
        } else {
            value = JSON.stringify(data);
        }

        if (raw) {
            value = data;
        }

        cookieDomain = getCookieDomain();

        if (cookieDomain === '') {
            domain = '';
        } else {
            domain = ';domain=' + cookieDomain;
        }

        window.document.cookie =
            encodeURIComponent(cname) + '=' + value +
            ';expires=' + expires +
            ';path=/' + domain;
    },
    setLocalStorage = function(name, data, raw) {
        var value;
        if (name === v1localStorageKey) {
            value = encodeURIComponent(JSON.stringify(data));
        } else if (name === v4LSKey) {
            value = mParticle.persistence.createCookieString(JSON.stringify(data));
        }

        if (raw) {
            value = data;
        }

        localStorage.setItem(encodeURIComponent(name), value);
    },
    getLocalStorage = function(name) {
        if (name === v1localStorageKey) {
            return findEncodedLocalStorage(name);
        } else if (name === v4LSKey || !name) {
            return mParticle.persistence.getLocalStorage();
        }
    },
    findEncodedLocalStorage = function(name) {
        return JSON.parse(mParticle.persistence.replacePipesWithCommas(decodeURIComponent(localStorage.getItem(encodeURIComponent(name)))));
    },
    getEvent = function(eventName, isForwarding) {
        var requests = getRequests(isForwarding ? 'Forwarding' : 'Events'),
            matchedEvent = null;
        requests.forEach(function(item) {
            var data = JSON.parse(item.requestText);
            if (data.n === eventName) {
                matchedEvent = data;
            }
        });

        return matchedEvent;
    },
    getRequests = function(path) {
        var requests = [];
        var version = path === 'Forwarding' ? 'v1' : 'v2',
            fullPath = '/' + version+ '/JS/' + apiKey + '/' + path;

        server.requests.forEach(function(item) {
            if (item.urlParts.path == fullPath) {
                requests.push(item);
            }
        });

        return requests;
    },
    getIdentityRequests = function(path) {
        var requests = [],
            fullPath = '/v1/' + path;

        if (path !== 'modify') {
            server.requests.forEach(function(item) {
                if (item.urlParts.path === fullPath) {
                    requests.push(item);
                }
            });
        } else {
            server.requests.forEach(function(item) {
                if (item.urlParts.path.slice(-6) === 'modify') {
                    requests.push(item);
                }
            });
        }

        return requests;
    },
    getIdentityEvent = function(endpoint) {
        var requests = getIdentityRequests(endpoint);
        if (requests[0] && requests[0].requestText) {
            return JSON.parse(requests[0].requestText);
        }
    },
    MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        CrashReport: 5,
        OptOut: 6,
        AppStateTransition: 10,
        Profile: 14,
        Commerce: 16
    },
    ProductActionType = {
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
        RemoveFromWishlist: 10
    },
    PromotionActionType = {
        Unknown: 0,
        PromotionView: 1,
        PromotionClick: 2
    },
    CommerceEventType = {
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
        ProductImpression: 22
    },
    MockForwarder = function() {
        var mockforwarder = this;

        var constructor = function() {
            var self = this;

            this.id = 1;
            this.isDebug = false;
            this.isSandbox = false;
            this.initCalled = false;
            this.processCalled = false;
            this.setUserIdentityCalled = false;
            this.onUserIdentifiedCalled = false;
            this.setOptOutCalled = false;
            this.setUserAttributeCalled = false;
            this.reportingService = null;
            this.name = 'MockForwarder';
            this.userAttributeFilters = [];
            this.setUserIdentityCalled = false;
            this.removeUserAttributeCalled = false;
            this.receivedEvent = null;
            this.isVisible = false;
            this.logOutCalled = false;

            this.trackerId = null;
            this.userAttributes = null;
            this.userIdentities = null;
            this.appVersion = null;
            this.appName = null;

            this.logOut = function() {
                this.logOutCalled = true;
            };

            this.init = function(settings, reportingService, testMode, id, userAttributes, userIdentities, appVersion, appName) {
                self.reportingService = reportingService;
                self.initCalled = true;

                self.trackerId = id;
                self.userAttributes = userAttributes;
                self.userIdentities = userIdentities;
                self.appVersion = appVersion;
                self.appName = appName;
            };

            this.process = function(event) {
                self.processCalled = true;
                this.receivedEvent = event;
                self.reportingService(self, event);
            };

            this.setUserIdentity = function(a, b) {
                this.userIdentities = {};
                this.userIdentities[b] = a;
                self.setUserIdentityCalled = true;
            };

            this.settings = {
                PriorityValue: 1
            };

            this.setOptOut = function() {
                this.setOptOutCalled = true;
            };

            this.onUserIdentified = function() {
                this.onUserIdentifiedCalled = true;
            };

            this.setUserAttribute = function() {
                this.setUserAttributeCalled = true;
            };

            this.removeUserAttribute = function () {
                this.removeUserAttributeCalled = true;
            };

            mockforwarder.instance = this;
        };

        this.name = 'MockForwarder';
        this.constructor = constructor;

        this.configureDebugAndSandbox = function() {
            mParticle.configureForwarder();
        };

        this.configure = function(filteringEventAttributeRule) {
            var config = {
                name: 'MockForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                eventSubscriptionId: 1234567890,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true,
                filteringEventAttributeRule: filteringEventAttributeRule
            };

            mParticle.configureForwarder(config);
        };
    },
    mParticleAndroid = function() {
        var self = this;

        this.logEventCalled = false;
        this.setUserIdentityCalled = false;
        this.removeUserIdentityCalled = false;
        this.setUserTagCalled = false;
        this.removeUserTagCalled = false;
        this.setUserAttributeCalled = false;
        this.removeUserAttributeCalled = false;
        this.setSessionAttributeCalled = false;
        this.addToCartCalled = false;
        this.removeFromCartCalled = false;
        this.clearCartCalled = false;
        this.loginData = null;
        this.logoutData = null;
        this.modifyData = null;
        this.login = function(data) {
            self.loginData = data;
        };
        this.logout = function(data) {
            self.logoutData = data;
        };
        this.modify = function(data) {
            self.modifyData = data;
        };

        this.logEvent = function() {
            self.logEventCalled = true;
        };
        this.setUserIdentity = function() {
            self.setUserIdentityCalled = true;
        };
        this.removeUserIdentity = function() {
            self.removeUserIdentityCalled = true;
        };
        this.setUserTag = function() {
            self.setUserTagCalled = true;
        };
        this.removeUserTag = function() {
            self.removeUserTagCalled = true;
        };
        this.setUserAttribute = function() {
            self.setUserAttributeCalled = true;
        };
        this.removeUserAttribute = function() {
            self.removeUserAttributeCalled = true;
        };
        this.setSessionAttribute = function() {
            self.setSessionAttributeCalled = true;
        };
        this.addToCart = function() {
            self.addToCartCalled = true;
        };
        this.removeFromCart = function() {
            self.removeFromCartCalled = true;
        };
        this.clearCart = function() {
            self.clearCartCalled = true;
        };
    };

module.exports = {
    apiKey: apiKey,
    testMPID: testMPID,
    v1CookieKey: v1CookieKey,
    v1localStorageKey: v1localStorageKey,
    v2CookieKey: v2CookieKey,
    getLocalStorageProducts: getLocalStorageProducts,
    findCookie: findCookie,
    setCookie: setCookie,
    setLocalStorage: setLocalStorage,
    getLocalStorage: getLocalStorage,
    getEvent: getEvent,
    getIdentityEvent: getIdentityEvent,
    MessageType: MessageType,
    ProductActionType: ProductActionType,
    PromotionActionType: PromotionActionType,
    CommerceEventType: CommerceEventType,
    MockForwarder: MockForwarder,
    mParticleAndroid: mParticleAndroid,
    v3LSKey: v3LSKey,
    v3CookieKey: v3CookieKey,
    v4CookieKey: v4CookieKey,
    v4LSKey: v4LSKey,
    server: server
};
