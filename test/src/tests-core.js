var server = new window.MockHttpServer(),
    apiKey = 'test_key',
    testMPID = 'testMPID',
    v3CookieKey = 'mprtcl-v3',
    v3LSKey = v3CookieKey,
    localStorageProductsV4 = 'mprtcl-prodv4',
    v4CookieKey = 'mprtcl-v4',
    v4LSKey = 'mprtcl-v4',
    workspaceToken = 'abcdef',
    workspaceCookieName = 'mprtcl-v4' + '_' + workspaceToken,
    LocalStorageProductsV4WithWorkSpaceName =
        'mprtcl-prodv4' + '_' + workspaceToken,
    pluses = /\+/g,
    MPConfig = {
        workspaceToken: workspaceToken,
    },
    das = 'das-test',
    getLocalStorageProducts = function getLocalStorageProducts() {
        return JSON.parse(
            atob(
                localStorage.getItem(
                    mParticle
                        .getInstance()
                        ._Helpers.createProductStorageName(workspaceToken)
                )
            )
        );
    },
    decoded = function decoded(s) {
        return decodeURIComponent(s.replace(pluses, ' '));
    },
    converted = function(s) {
        if (s.indexOf('"') === 0) {
            s = s
                .slice(1, -1)
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
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
            if (doc.cookie.indexOf(mpTest) > -1) {
                doc.cookie =
                    mpTest.split('=')[0] +
                    '=;domain=.' +
                    testParts +
                    ';expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                return testParts;
            }
        }
        return '';
    },
    findCookie = function(cookieName) {
        var cookie;
        if (cookieName === v4CookieKey || !cookieName) {
            cookie = mParticle.getInstance()._Persistence.getCookie();
        } else if (cookieName === v3CookieKey) {
            cookie = JSON.parse(
                mParticle
                    .getInstance()
                    ._Persistence.replacePipesWithCommas(
                        findEncodedCookie(cookieName)
                    )
            );
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
                return mParticle
                    .getInstance()
                    ._Persistence.replacePipesWithCommas(converted(cookie));
            }
        }
    },
    setCookie = function(cname, data, raw) {
        var date = new Date(),
            expires = new Date(
                date.getTime() + 365 * 24 * 60 * 60 * 1000
            ).toGMTString(),
            domain,
            cookieDomain,
            value;
        if (cname === v4CookieKey || cname === workspaceCookieName) {
            value = mParticle
                .getInstance()
                ._Persistence.replaceCommasWithPipes(data);
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
            encodeURIComponent(cname) +
            '=' +
            value +
            ';expires=' +
            expires +
            ';path=/' +
            domain;
    },
    setLocalStorage = function(name, data, raw) {
        var value;
        //if we just set setLocalStorage(), we put a valid full length LS into localStorage
        if (arguments.length === 0) {
            data = {
                cu: testMPID,
                gs: {
                    csm: btoa(JSON.stringify([testMPID])),
                    cgid: '606d4dbd-123f-4a9c-9729-d6b6f42db743',
                    das: das,
                    dt: apiKey,
                    ie: 1,
                    les: new Date().getTime(),
                    sid: '826ECC8F-9FCC-49C2-A3D3-4FC4F21D052C',
                    ssd: new Date().getTime(),
                },
                l: false,
                testMPID: {
                    ua: btoa(JSON.stringify({ color: 'blue' })),
                    ui: btoa(JSON.stringify({ 1: 'testuser@mparticle.com' })),
                    csd: btoa(JSON.stringify({ 5: 500 })),
                },
            };
            value = mParticle
                .getInstance()
                ._Persistence.createCookieString(JSON.stringify(data));
            name = workspaceCookieName;
        } else {
            if (name === v4LSKey) {
                value = mParticle
                    .getInstance()
                    ._Persistence.createCookieString(JSON.stringify(data));
            }

            if (raw) {
                value = data;
            }
        }

        localStorage.setItem(encodeURIComponent(name), value);
    },
    getLocalStorage = function(name) {
        if (name === v4LSKey || !name) {
            return mParticle.getInstance()._Persistence.getLocalStorage();
        }
    },
    getEvent = function(eventName, isForwarding, server, apiKey) {
        var requests = getRequests(
                isForwarding ? 'Forwarding' : 'Events',
                server, apiKey
            ),
            matchedEvent = null,
            data;
        requests.forEach(function(item) {
            if (item.requestText) {
                data = JSON.parse(item.requestText);
            } else if (item.requestBody) {
                data = JSON.parse(item.requestBody);
            }
            if (data.n === eventName) {
                matchedEvent = data;
            }
        });

        return matchedEvent;
    },
    getForwarderEvent = function(eventName) {
        var requests = [];
        if (getForwarderRequests().length) {
            getForwarderRequests().forEach(function(request) {
                JSON.parse(request.requestText).data.forEach(function(
                    internalRequest
                ) {
                    if (internalRequest.n === eventName) {
                        requests.push(internalRequest);
                    }
                });
            });
        }

        if (requests.length) {
            return requests[0];
        } else {
            return null;
        }
    },
    getRequests = function(path, mockServer, token) {
        apiKey = token || apiKey;
        var requests = [];
        var version = path === 'Forwarding' ? 'v1' : 'v2',
            fullPath = '/' + version + '/JS/' + apiKey + '/' + path;
        mockServer = mockServer || server;
        mockServer.requests.forEach(function(item) {
            if (item.urlParts) {
                if (item.urlParts.path == fullPath) {
                    requests.push(item);
                }
            } else if (item.url) {
                if (item.url.includes(fullPath)) {
                    requests.push(item);
                }
            }
        });

        return requests;
    },
    getForwarderRequests = function() {
        var requests = [];
        var version = 'v2',
            fullPath = '/' + version + '/JS/' + apiKey + '/' + 'Forwarding';

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
        Commerce: 16,
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
        RemoveFromWishlist: 10,
    },
    PromotionActionType = {
        Unknown: 0,
        PromotionView: 1,
        PromotionClick: 2,
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
        ProductImpression: 22,
    },
    forwarderDefaultConfiguration = function(
        forwarderName,
        forwarderId,
        filteringEventAttributeRule
    ) {
        var config = {
            name: forwarderName || 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            filteringEventAttributeValue: {},
            filteringUserAttributeValue: {},
            moduleId: forwarderId || 1,
            eventSubscriptionId: 1234567890,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true,
            filteringEventAttributeRule: filteringEventAttributeRule,
        };

        return config;
    },
    MockForwarder = function(forwarderName, forwarderId) {
        var constructor = function() {
            var self = this;

            this.id = forwarderId || 1;
            this.isDebug = false;
            this.initCalled = false;
            this.processCalled = false;
            this.setUserIdentityCalled = false;
            this.onUserIdentifiedCalled = false;
            this.setOptOutCalled = false;
            this.setUserAttributeCalled = false;
            this.reportingService = null;
            this.name = forwarderName || 'MockForwarder';
            this.userAttributeFilters = [];
            this.setUserIdentityCalled = false;
            this.removeUserAttributeCalled = false;
            this.receivedEvent = null;
            this.isVisible = false;
            this.logOutCalled = false;

            this.trackerId = null;
            this.userAttributes = {};
            this.userIdentities = null;
            this.appVersion = null;
            this.appName = null;

            this.logOut = function() {
                this.logOutCalled = true;
            };

            this.init = function(
                settings,
                reportingService,
                testMode,
                id,
                userAttributes,
                userIdentities,
                appVersion,
                appName
            ) {
                self.reportingService = reportingService;
                self.initCalled = true;

                self.trackerId = id;
                self.userAttributes = userAttributes;
                mParticle.userAttributesFilterOnInitTest = userAttributes;
                mParticle.userIdentitiesFilterOnInitTest = userIdentities;
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
                PriorityValue: 1,
            };

            this.setOptOut = function() {
                this.setOptOutCalled = true;
            };

            this.onUserIdentified = function(user) {
                this.onUserIdentifiedCalled = true;
                this.onUserIdentifiedUser = user;
            };

            this.onIdentifyComplete = function(user) {
                this.onIdentifyCompleteCalled = true;
                this.onIdentifyCompleteUser = user;
            };

            this.onLoginComplete = function(user) {
                this.onLoginCompleteCalled = true;
                this.onLoginCompleteUser = user;
            };

            this.onLogoutComplete = function(user) {
                this.onLogoutCompleteCalled = true;
                this.onLogoutCompleteUser = user;
            };

            this.onModifyComplete = function(user) {
                this.onModifyCompleteCalled = true;
                this.onModifyCompleteUser = user;
            };

            this.setUserAttribute = function(key, value) {
                this.setUserAttributeCalled = true;
                this.userAttributes[key] = value;
            };

            this.removeUserAttribute = function() {
                this.removeUserAttributeCalled = true;
            };

            window[this.name + this.id] = {
                instance: this,
            };
        };

        this.name = forwarderName || 'MockForwarder';
        this.moduleId = forwarderId || 1;
        this.constructor = constructor;

        function register(config) {
            if (!config.kits) {
                config.kits = {};
            }
            config.kits[this.name] = {
                constructor: constructor,
            };
        }
        function getId() {
            return forwarderId || 1;
        }

        return {
            register: register,
            getId: getId,
            constructor: constructor,
            name: this.name,
        };
    },
    mParticleAndroid = function() {
        var self = this;

        this.addedToCartItem = null;
        this.logEventCalled = false;
        this.setUserAttributeCalled = false;
        this.removeUserAttributeCalled = false;
        this.setSessionAttributeCalled = false;
        this.addToCartCalled = false;
        this.removeFromCartCalled = false;
        this.clearCartCalled = false;
        this.loginData = null;
        this.logoutData = null;
        this.modifyData = null;
        this.event = null;
        this.userAttrData = [];
        this.sessionAttrData = [];
        this.aliasUsers = null;

        this.resetSessionAttrData = function() {
            self.sessionAttrData = [];
        };

        this.login = function(data) {
            self.loginData = data;
        };
        this.logout = function(data) {
            self.logoutData = data;
        };
        this.modify = function(data) {
            self.modifyData = data;
        };
        this.identify = function(data) {
            self.modifyData = data;
        };

        this.logEvent = function(event) {
            self.logEventCalled = true;
            self.event = event;
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
        this.resetUserAttributes = function() {
            self.userAttrData = [];
        };
        this.setUserAttribute = function(data) {
            self.setUserAttributeCalled = true;
            self.userAttrData.push(data);
        };
        this.removeUserAttribute = function() {
            self.removeUserAttributeCalled = true;
        };
        this.setSessionAttribute = function(data) {
            self.setSessionAttributeCalled = true;
            self.sessionAttrData.push(data);
        };
        this.addToCart = function(item) {
            self.addToCartCalled = true;
            self.addedToCartItem = item;
        };
        this.removeFromCart = function(item) {
            self.removeFromCartCalled = true;
            self.removedFromCartItem = item;
        };
        this.clearCart = function() {
            self.addedToCartItem = null;
            self.clearCartCalled = true;
        };
        this.aliasUsers = function(item) {
            self.aliasUsers = item;
        };
    },
    mParticleIOS = function() {
        var self = this;
        this.data = [];
        this.postMessage = function(data) {
            self.data.push(data);
        };
        this.reset = function() {
            self.data = [];
        };
    };

var TestsCore = {
    apiKey: apiKey,
    testMPID: testMPID,
    getLocalStorageProducts: getLocalStorageProducts,
    findCookie: findCookie,
    setCookie: setCookie,
    setLocalStorage: setLocalStorage,
    getLocalStorage: getLocalStorage,
    getEvent: getEvent,
    getForwarderEvent: getForwarderEvent,
    getIdentityEvent: getIdentityEvent,
    MessageType: MessageType,
    ProductActionType: ProductActionType,
    PromotionActionType: PromotionActionType,
    CommerceEventType: CommerceEventType,
    MockForwarder: MockForwarder,
    mParticleAndroid: mParticleAndroid,
    mParticleIOS: mParticleIOS,
    v3LSKey: v3LSKey,
    v3CookieKey: v3CookieKey,
    v4CookieKey: v4CookieKey,
    v4LSKey: v4LSKey,
    das: das,
    localStorageProductsV4: localStorageProductsV4,
    LocalStorageProductsV4WithWorkSpaceName: LocalStorageProductsV4WithWorkSpaceName,
    workspaceToken: workspaceToken,
    workspaceCookieName: workspaceCookieName,
    forwarderDefaultConfiguration: forwarderDefaultConfiguration,
    MPConfig: MPConfig,
    server: server,
};

export default TestsCore;
