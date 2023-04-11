import { apiKey, testMPID, v3CookieKey, v4CookieKey, v4LSKey, workspaceToken, workspaceCookieName, das } from './config';

var pluses = /\+/g,
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
    findEventFromBatch = function(batch, eventName) {
        if (batch.events.length) {
            return batch.events.find(function(event) {
                switch (event.event_type) {
                    case 'commerce_event':
                        if (event.data.product_action) {
                            return event.data.product_action.action === eventName;
                        }
                        else if (event.data.promotion_action) {
                            // return the promotion action
                            return true;
                        } else {
                            // all commerce_events that do not have product_action
                            // or promotion_action are impression actions
                            return true;
                        }
                    case 'custom_event':
                        return event.data.event_name === eventName;
                    case 'crash_report':
                        return true;
                    default:
                        // all other events are lifecycle events (session start, end, AST)
                        return event.event_type === eventName
                }
            })
        }
        return null;
    },
    getForwarderEvent = function(requests, eventName) {
        var url = `https://jssdks.mparticle.com/v2/JS/${apiKey}/Forwarding`
        var returnedReqs = [];
        if (requests.length) {
            requests.filter(function(request) {
                return (request.url === url)
            }).forEach(function(request) {
                JSON.parse(request.requestBody).data.forEach(function(internalRequest) {
                    if (internalRequest.n === eventName) {
                        returnedReqs.push(internalRequest)
                    }
                })
            });
        }
        if (returnedReqs.length) {
            return (returnedReqs[0]);
        } else {
            return null;
        }
    },
    findRequest = function(requests, eventName) {
        const matchingRequest;
        requests.forEach(function(request) {
            var batch = JSON.parse(request[1].body);
            for (var i = 0; i<batch.events.length; i++) {
                var foundEventFromBatch = findEventFromBatch(batch, eventName);
                if (foundEventFromBatch) {
                    matchingRequest = request;
                    break;
                }
            }
        })

        return matchingRequest;
    },
    findRequestURL = function(requests, eventName) {
        return findRequest(requests, eventName)[0]
    },
    findBatch = function(requests, eventName) {
        var request = findRequest(requests, eventName);
        if (request) {
            return JSON.parse(findRequest(requests, eventName)[1].body);
        } else {
            return null;
        }

    },
    findEventFromRequest= function(requests, eventName) {
        var batch = findBatch(requests, eventName);
        if (batch) {
            return findEventFromBatch(batch, eventName);
        } else {
            return null;
        }

    },
    getIdentityRequests = function(requests, path) {
        var returnedRequests = [],
            fullPath = 'https://identity.mparticle.com/v1/' + path;
        if (path !== 'modify') {
            requests.forEach(function(item) {
                if (item.url === fullPath) {
                    returnedRequests.push(item);
                }
            });
        } else {
            requests.forEach(function(item) {
                if (item.url.slice(-6) === 'modify') {
                    returnedRequests.push(item);
                }
            });
        }

        return returnedRequests;
    },
    getIdentityEvent = function(mockRequests, endpoint) {
        var returnedReqs = getIdentityRequests(mockRequests, endpoint);
        if (returnedReqs[0] && returnedReqs[0].requestBody) {
            return JSON.parse(returnedReqs[0].requestBody);
        }
    },
    forwarderDefaultConfiguration = function(
        forwarderName,
        forwarderId,
    ) {
        var config = {
            name: forwarderName || 'MockForwarder',
            moduleId: forwarderId || 1,
            isDebug: false,
            isVisible: true,
            isDebugString: 'false',
            hasDebugString: 'false',
            settings: {},
            screenNameFilters: [],
            screenAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            githubPath: null,
            filteringEventAttributeValue: null,
            filteringUserAttributeValue: null,
            filteringConsentRuleValues: null,
            consentRegulationFilters: [],
            consentRegulationPurposeFilters: [],
            messageTypeFilters: [],
            messageTypeStateFilters: [],
            eventSubscriptionId: 1234567890,
        };

        return config;
    },
    MockForwarder = function(forwarderName, forwarderId) {
        var constructor = function() {
            var self = this;
            this.id = forwarderId || 1;
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
                self.settings = settings;
                self.testMode = testMode;
            };

            this.process = function(event) {
                self.processCalled = true;
                this.receivedEvent = event;
                self.reportingService(self, event);
                self.logger.verbose(event.EventName + ' sent');
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

            this.removeUserAttribute = function(key) {
                this.removeUserAttributeCalled = true;
                delete this.userAttributes[key]
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
    MockSideloadedKit = MockForwarder,
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
        this.uploadCalled = false;

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
        this.upload = function() {
            self.uploadCalled = true;
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
    },
    deleteAllCookies = function() {
        var cookies = document.cookie.split(";");

        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var eqPos = cookie.indexOf("=");
            var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    }

var TestsCore = {
    getLocalStorageProducts: getLocalStorageProducts,
    findCookie: findCookie,
    setCookie: setCookie,
    setLocalStorage: setLocalStorage,
    getLocalStorage: getLocalStorage,
    findRequestURL: findRequestURL,
    findBatch: findBatch,
    findEventFromRequest: findEventFromRequest,
    findEventFromBatch: findEventFromBatch,
    getForwarderEvent: getForwarderEvent,
    findRequest: findRequest,
    getIdentityEvent: getIdentityEvent,
    MockForwarder: MockForwarder,
    MockSideloadedKit: MockSideloadedKit,
    mParticleAndroid: mParticleAndroid,
    mParticleIOS: mParticleIOS,
    v4CookieKey: v4CookieKey,
    v4LSKey: v4LSKey,
    workspaceToken: workspaceToken,
    workspaceCookieName: workspaceCookieName,
    forwarderDefaultConfiguration: forwarderDefaultConfiguration,
    deleteAllCookies: deleteAllCookies
};

export default TestsCore;
