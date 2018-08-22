/* eslint-disable no-undef */
describe('mParticle', function() {
    var server,
        apiKey = 'test_key',
        testMPID = 'testMPID',
        v1CookieKey = v1localStorageKey = 'mprtcl-api',
        v2CookieKey = 'mprtcl-v2',
        currentCookieVersion = 'mprtcl-v3',
        currentLSKey = 'mprtcl-v3',
        ProductBag = 'my bag',
        pluses = /\+/g,
        decoded = function decoded(s) {
            return decodeURIComponent(s.replace(pluses, ' '));
        },
        converted = function (s) {
            if (s.indexOf('"') === 0) {
                s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            }

            return s;
        },
        getRequests = function(path) {
            var requests = [],
                fullPath = '/v1/JS/' + apiKey + '/' + path;

            server.requests.forEach(function(item) {
                if (item.urlParts.path == fullPath) {
                    requests.push(item);
                }
            });

            return requests;
        },
        getCookie = function(cookieName) {
            if (cookieName === currentCookieVersion) {
                return mParticle.persistence.getCookie();
            } else {
                return getEncodedCookie(cookieName);
            }
        },
        getEncodedCookie = function(cookieName) {
            var cookies = document.cookie.split('; ');
            for (i = 0, l = cookies.length; i < l; i++) {
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
                value = JSON.stringify(data),
                expires = new Date(date.getTime() +
                    (365 * 24 * 60 * 60 * 1000)).toGMTString();

            if (raw) {
                value = data;
            } else if (cname === currentCookieVersion) {
                value = mParticle.replaceCommasWithPipes(value);
            }


            window.document.cookie =
                encodeURIComponent(cname) + '=' + value +
                ';expires=' + expires +
                ';path=/';
        },
        setLocalStorage = function(name, data) {
            if (name === v1localStorageKey) {
                localStorage.setItem(encodeURIComponent(name), encodeURIComponent(JSON.stringify(data)));
            } else if (name === currentLSKey) {
                localStorage.setItem(encodeURIComponent(name), mParticle.persistence.replaceCommasWithPipes(mParticle.persistence.replaceQuotesWithApostrophes(JSON.stringify(data))));
            }
        },
        getLocalStorage = function(name) {
            if (name === v1localStorageKey) {
                return getEncodedLocalStorage(name);
            } else if (name === currentLSKey) {
                return mParticle.persistence.getLocalStorage();
            }
        },
        getEncodedLocalStorage = function(name) {
            var mp = mParticle.persistence;
            return JSON.parse(mp.replaceApostrophesWithQuotes(mp.replacePipesWithCommas(decodeURIComponent(localStorage.getItem(encodeURIComponent(name))))));
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
        ProfileMessageType = {
            Logout: 3
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

                this.setUserIdentity = function() {
                    self.setUserIdentityCalled = true;
                };

                this.settings = {
                    PriorityValue: 1
                };

                this.setOptOut = function() {
                    this.setOptOutCalled = true;
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
            this.addToProductBagCalled = false;
            this.removeFromProductBagCalled = false;
            this.clearProductBagCalled = false;
            this.addToCartCalled = false;
            this.removeFromCartCalled = false;
            this.clearCartCalled = false;

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
            this.addToProductBag = function() {
                self.addToProductBagCalled = true;
            };
            this.removeFromProductBag = function() {
                self.removeFromProductBagCalled = true;
            };
            this.clearProductBag = function() {
                self.clearProductBagCalled = true;
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

    before(function() {
        server = new MockHttpServer();
        server.start();
    });

    beforeEach(function() {
        server.requests = [];
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: testMPID
            }));
        };
        mParticle.reset();
        mParticle.init(apiKey);
        window.mParticleAndroid = null;
        window.mParticle.isIOS = null;
        window.mParticle.useCookieStorage = false;
    });

    describe('migrations and persistence-related', function() {
        it('removes v1 cookie if v3 cookie is found', function(done) {
            mParticle.reset();
            var v1Cookies = {
                cgid:   'a99cd390-ac20-4cc8-989a-1c8752400eba',
                das:    '4a9f015a-b23e-4d21-94cf-604c6aecc5f2',
                dt:     'beab3f4d34281d45bfcdbbd7eb21c083',
                ie:     true,
                les:    1505932333024,
                sid:    '490d3ac1-7959-48fe-9aee-92f5893370e1'
            };
            setCookie(v1CookieKey, v1Cookies);
            var v1CookiesBeforeInit = getCookie('mprtcl-api');

            var v3CookiesBeforeInit = getCookie('mprtcl-v3');
            v1CookiesBeforeInit.should.be.ok();
            Should(v3CookiesBeforeInit).not.be.ok();

            mParticle.useCookieStorage = true;
            mParticle.init(apiKey);

            var v1CookiesAfterInit = getCookie('mprtcl-v1');
            var v3CookiesAfterInit = getCookie('mprtcl-v3');

            Should(v1CookiesAfterInit).not.be.ok();
            v3CookiesAfterInit.should.be.ok();
            done();
        });

        it('removes v2 cookie if v3 cookie is found', function(done) {
            mParticle.reset();
            mParticle.useCookieStorage = true;

            var v2Cookies = {
                cgid:   'a99cd390-ac20-4cc8-989a-1c8752400eba',
                das:    '4a9f015a-b23e-4d21-94cf-604c6aecc5f2',
                dt:     'beab3f4d34281d45bfcdbbd7eb21c083',
                ie:     true,
                les:    1505932333024,
                sid:    '490d3ac1-7959-48fe-9aee-92f5893370e1',
                ua:     {gender: 'male', age: 31},
                ui:     [{Identity: 'test@test.com', Type: 5}, {Identity: '123', Type: 3}]
            };
            setCookie(v2CookieKey, v2Cookies);

            var v2CookiesBeforeInit = getCookie('mprtcl-v2');
            var v3CookiesBeforeInit = getCookie('mprtcl-v3');

            v2CookiesBeforeInit.should.be.ok();
            Should(v3CookiesBeforeInit).not.be.ok();

            mParticle.init(apiKey);

            var v2CookiesAfterInit = getCookie('mprtcl-v2');
            var v3CookiesAfterInit = getCookie('mprtcl-v3');

            Should(v2CookiesAfterInit).not.be.ok();
            v3CookiesAfterInit.should.be.ok();

            done();
        });

        it('migrates cookies from v1 to current version', function(done) {
            mParticle.reset();
            mParticle.useCookieStorage = true;

            var ss = { uid: {
                Expires:'2027-09-11T20:53:40.544516Z',
                Value:'u=-2968710958423250133&cr=4050533&ls=4050534&lbe=4050534'
            }};

            var v1Cookies = {
                cgid:   'a99cd390-ac20-4cc8-989a-1c8752400eba',
                das:    '4a9f015a-b23e-4d21-94cf-604c6aecc5f2',
                dt:     'beab3f4d34281d45bfcdbbd7eb21c083',
                ss:     ss,
                sa:     {},
                ie:     true,
                les:    1505932333024,
                sid:    '490d3ac1-7959-48fe-9aee-92f5893370e1',
                ua:     {gender: 'male', age: 31},
                ui:     [{Identity: 'test@test.com', Type: 5}, {Identity: '123', Type: 3}]
            };

            setCookie(v1CookieKey, v1Cookies);

            var v1CookiesBefore = JSON.parse(getCookie(v1CookieKey));
            mParticle.persistence.migrateCookies();

            var v1CookiesAfter = getCookie(v1CookieKey);
            var currentCookies = JSON.parse(getCookie(currentCookieVersion));
            Should(v1CookiesAfter).not.be.ok();
            currentCookies.cgid.should.equal(v1Cookies.cgid);
            currentCookies.das.should.equal(v1Cookies.das);
            currentCookies.dt.should.equal(v1Cookies.dt);
            currentCookies.ie.should.equal(v1Cookies.ie);
            currentCookies.les.should.equal(v1Cookies.les);
            currentCookies.sid.should.equal(v1Cookies.sid);
            Should(currentCookies.sa).not.be.ok();
            currentCookies.ua.gender.should.equal(v1Cookies.ua.gender);
            currentCookies.ua.age.should.equal(v1Cookies.ua.age);
            currentCookies.ss.uid.Expires.should.equal(v1Cookies.ss.uid.Expires);
            currentCookies.ss.uid.Value.should.equal(v1Cookies.ss.uid.Value);
            Array.isArray(currentCookies.ui).should.equal(true);

            // test empty object
            mParticle.reset();
            v1Cookies = {};
            setCookie(v1CookieKey, v1Cookies);

            v1CookiesBefore = JSON.parse(getCookie(v1CookieKey));
            Object.keys(v1CookiesBefore).length.should.equal(0);
            mParticle.persistence.migrateCookies();

            v1CookiesAfter = getCookie(v1CookieKey);
            currentCookies = JSON.parse(getCookie(currentCookieVersion));

            Should(v1CookiesAfter).not.be.ok();
            Object.keys(currentCookies).length.should.equal(0);

            // test with null
            mParticle.reset();
            v1Cookies = null;
            setCookie(v1CookieKey, v1Cookies);

            v1CookiesBefore = JSON.parse(getCookie(v1CookieKey));
            (v1CookiesBefore === null).should.equal(true);

            mParticle.persistence.migrateCookies();

            v1CookiesAfter = getCookie(v1CookieKey);
            currentCookies = JSON.parse(getCookie(currentCookieVersion));

            Should(v1CookiesAfter).not.be.ok();
            (currentCookies === null).should.equal(true);

            done();
        });

        it('migrates cookies from v2 to current version', function(done) {
            mParticle.reset();
            mParticle.useCookieStorage = true;
            var ss = { uid: {
                Expires:'2027-09-11T20:53:40.544516Z',
                Value:'u=-2968710958423250133&cr=4050533&ls=4050534&lbe=4050534'
            }};

            var v2Cookies = {
                cgid:   'a99cd390-ac20-4cc8-989a-1c8752400eba',
                das:    '4a9f015a-b23e-4d21-94cf-604c6aecc5f2',
                dt:     'beab3f4d34281d45bfcdbbd7eb21c083',
                ss:     ss,
                ie:     true,
                les:    1505932333024,
                sid:    '490d3ac1-7959-48fe-9aee-92f5893370e1',
                ua:     {gender: 'male', age: 31},
                ui:     [{Identity: 'test@test.com', Type: 5}, {Identity: '123', Type: 3}]
            };
            setCookie(v2CookieKey, v2Cookies);

            var v2CookiesBefore = JSON.parse(getCookie(v2CookieKey));
            v2CookiesBefore.cgid.should.equal(v2Cookies.cgid);

            mParticle.persistence.migrateCookies();

            var v2CookiesAfter = getCookie(v2CookieKey);
            var currentCookies = JSON.parse(getCookie(currentCookieVersion));

            Should(v2CookiesAfter).not.be.ok();
            currentCookies.cgid.should.equal(v2Cookies.cgid);
            currentCookies.das.should.equal(v2Cookies.das);
            currentCookies.dt.should.equal(v2Cookies.dt);
            currentCookies.ie.should.equal(v2Cookies.ie);
            currentCookies.les.should.equal(v2Cookies.les);
            currentCookies.sid.should.equal(v2Cookies.sid);
            currentCookies.ua.gender.should.equal(v2Cookies.ua.gender);
            currentCookies.ua.age.should.equal(v2Cookies.ua.age);
            currentCookies.ss.uid.Expires.should.equal(v2Cookies.ss.uid.Expires);
            currentCookies.ss.uid.Value.should.equal(v2Cookies.ss.uid.Value);
            Array.isArray(currentCookies.ui).should.equal(true);

            // test with empty object
            mParticle.reset();
            v2Cookies = {};
            setCookie(v2CookieKey, v2Cookies);

            v2CookiesBefore = JSON.parse(getCookie(v2CookieKey));
            Object.keys(v2CookiesBefore).length.should.equal(0);

            mParticle.persistence.migrateCookies();

            v2CookiesAfter = getCookie(v2CookieKey);
            currentCookies = JSON.parse(getCookie(currentCookieVersion));

            Should(v2CookiesAfter).not.be.ok();
            Object.keys(currentCookies).length.should.equal(0);

            // test with null
            mParticle.reset();
            v2Cookies = null;
            setCookie(v2CookieKey, v2Cookies);

            v2CookiesBefore = JSON.parse(getCookie(v2CookieKey));
            (v2CookiesBefore === null).should.equal(true);

            mParticle.persistence.migrateCookies();

            v2CookiesAfter = getCookie(v2CookieKey);
            currentCookies = JSON.parse(getCookie(currentCookieVersion));

            Should(v2CookiesAfter).not.be.ok();
            (currentCookies === null).should.equal(true);

            done();
        });

        it('removes v1 localStorage if currentVersion is found', function(done) {
            mParticle.reset();
            var ss = { uid: {
                Expires:'2027-09-11T20:53:40.544516Z',
                Value:'u=-2968710958423250133&cr=4050533&ls=4050534&lbe=4050534'
            }};

            var v1LS = {
                cgid:   'a99cd390-ac20-4cc8-989a-1c8752400eba',
                das:    '4a9f015a-b23e-4d21-94cf-604c6aecc5f2',
                dt:     'beab3f4d34281d45bfcdbbd7eb21c083',
                ss:     ss,
                ie:     true,
                les:    1505932333024,
                sid:    '490d3ac1-7959-48fe-9aee-92f5893370e1',
                ua:     {gender: 'male', age: 31},
                ui:     [{Identity: 'test@test.com', Type: 5}, {Identity: '123', Type: 3}]
            };
            setLocalStorage(v1localStorageKey, v1LS);

            var v1localStorageBefore = getLocalStorage(v1localStorageKey);
            var currentVersionLSBefore = getLocalStorage(currentLSKey);
            v1localStorageBefore.should.be.ok();
            Should(currentVersionLSBefore).not.be.ok();

            mParticle.useCookieStorage = false;
            mParticle.persistence.migrateLocalStorage();

            var v1LSAfterInit = getLocalStorage(v1localStorageKey);
            var currentLSAfterInit = getLocalStorage(currentLSKey);

            Should(v1LSAfterInit).not.be.ok();
            currentLSAfterInit.should.be.ok();

            done();
        });

        it('migrates localStorage from v1 to current version', function(done) {
            mParticle.reset();
            var ss = { uid: {
                Expires:'2027-09-11T20:53:40.544516Z',
                Value:'u=-2968710958423250133&cr=4050533&ls=4050534&lbe=4050534'
            }};

            var v1LS = {
                cgid:   'a99cd390-ac20-4cc8-989a-1c8752400eba',
                das:    '4a9f015a-b23e-4d21-94cf-604c6aecc5f2',
                dt:     'beab3f4d34281d45bfcdbbd7eb21c083',
                ss:     ss,
                ie:     true,
                les:    1505932333024,
                sid:    '490d3ac1-7959-48fe-9aee-92f5893370e1',
                ua:     {gender: 'male', age: 31},
                ui:     [{Identity: 'test@test.com', Type: 5}, {Identity: '123', Type: 3}]
            };
            setLocalStorage(v1localStorageKey, v1LS);

            var v1localStorageBefore = getLocalStorage(v1localStorageKey);
            mParticle.persistence.migrateLocalStorage();

            var v1localStorageAfter = getLocalStorage(v1localStorageKey);
            var currentLS = getLocalStorage(currentLSKey);

            Should(v1localStorageAfter).not.be.ok();
            currentLS.cgid.should.equal(v1LS.cgid);
            currentLS.das.should.equal(v1LS.das);
            currentLS.dt.should.equal(v1LS.dt);
            currentLS.ie.should.equal(v1LS.ie);
            currentLS.les.should.equal(v1LS.les);
            currentLS.sid.should.equal(v1LS.sid);
            currentLS.ua.gender.should.equal(v1LS.ua.gender);
            currentLS.ua.age.should.equal(v1LS.ua.age);
            currentLS.ss.uid.Expires.should.equal(v1LS.ss.uid.Expires);
            currentLS.ss.uid.Value.should.equal(v1LS.ss.uid.Value);
            Array.isArray(currentLS.ui).should.equal(true);

            // test with empty object
            mParticle.reset();
            v1LS = {};
            setLocalStorage(v1localStorageKey, v1LS);

            v1localStorageBefore = getLocalStorage(v1localStorageKey);
            Object.keys(v1localStorageBefore).length.should.equal(0);

            mParticle.persistence.migrateLocalStorage();

            v1localStorageAfter = getLocalStorage(v1localStorageKey);
            currentLS = getLocalStorage(currentLSKey);

            Should(v1localStorageAfter).not.be.ok();
            Should(currentLS).not.be.ok();

            // test with null
            mParticle.reset();
            v1LS = null;

            setLocalStorage(v1localStorageKey, v1LS);

            v1localStorageBefore = getLocalStorage(v1localStorageKey);
            (v1localStorageBefore === null).should.equal(true);

            mParticle.persistence.migrateLocalStorage();

            v1localStorageAfter = getLocalStorage(v1localStorageKey);
            currentLS = getLocalStorage(currentLSKey);

            Should(v1localStorageAfter).not.be.ok();
            (currentLS === null).should.equal(true);

            done();
        });

        it('migrates cart products and product bags to localStorage and remaining items to cookies when useCookieStorage is true', function(done) {
            var product = mParticle.eCommerce.createProduct('Product', '1', 100);
            var product2 = mParticle.eCommerce.createProduct('Product2', '2', 200);
            var product3 = mParticle.eCommerce.createProduct('Product3', '3', 300);
            mParticle.reset();
            mParticle.useCookieStorage = true;

            setLocalStorage(v1localStorageKey, {
                ui: [{Identity: 123, Type: 1}, {Identity: '123', Type: 2}],
                cp: [product, product2],
                pb: {default: [product3]},
                ie: true
            });

            mParticle.init(apiKey);

            var cookies = JSON.parse(getCookie(currentCookieVersion));

            var localStorage = mParticle.persistence.getLocalStorage();

            localStorage.should.have.properties('cp', 'pb');
            localStorage.should.not.have.properties(['ui', 'les', 'sid', 'ie', 'dt']);
            localStorage.cp.should.have.length(2);
            localStorage.pb.should.have.property('default');

            localStorage.pb.default[0].Name.should.equal('Product3');
            localStorage.pb.default[0].Sku.should.equal('3');
            localStorage.pb.default[0].Price.should.equal(300);

            localStorage.should.not.have.properties(['ui', 'ua', 'les', 'sid', 'ie', 'dt', 'sa', 'ss']);
            cookies.should.have.properties(['ui', 'les', 'sid', 'ie', 'dt']);
            cookies.should.not.have.properties(['pb', 'cp']);

            Object.keys(cookies.ui).should.have.length(2);

            done();
        });

        it('migrate v1 cookie to v2 cookies and products to localStorage if useCookieStorage is true', function(done) {
            var product = mParticle.eCommerce.createProduct('Product', '1', 100);
            var product2 = mParticle.eCommerce.createProduct('Product2', '2', 200);
            var product3 = mParticle.eCommerce.createProduct('Product3', '3', 300);
            mParticle.reset();
            mParticle.useCookieStorage = true;

            setCookie(v1CookieKey, {
                ui: [{Identity: 123, Type: 1}, {Identity: '123', Type: 2}],
                cp: [product, product2],
                pb: {default: [product3]},
                ie: true
            });

            mParticle.init(apiKey);

            var cookies = JSON.parse(getCookie(currentCookieVersion));

            var localStorage = mParticle.persistence.getLocalStorage();

            localStorage.should.have.properties('cp', 'pb');
            localStorage.should.not.have.properties(['ui', 'les', 'sid', 'ie', 'dt']);
            localStorage.cp.should.have.length(2);
            localStorage.pb.should.have.property('default');

            localStorage.pb.default[0].Name.should.equal('Product3');
            localStorage.pb.default[0].Sku.should.equal('3');
            localStorage.pb.default[0].Price.should.equal(300);

            localStorage.should.not.have.properties(['ui', 'ua', 'les', 'sid', 'ie', 'dt', 'sa', 'ss']);
            cookies.should.have.properties(['ui', 'les', 'sid', 'ie', 'dt']);
            cookies.should.not.have.properties(['pb', 'cp']);

            done();
        });

        it('migrate localStorage to cookies except for cart products and product bags when useCookieStorage is true', function(done) {
            var product = mParticle.eCommerce.createProduct('Product', '1', 100);
            var product2 = mParticle.eCommerce.createProduct('Product2', '2', 200);
            var product3 = mParticle.eCommerce.createProduct('Product3', '3', 300);

            mParticle.reset();
            mParticle.useCookieStorage = true;

            setLocalStorage(v1localStorageKey, {
                ui: [{Identity: 123, Type: 1}, {Identity: '123', Type: 2}],
                cp: [product, product2],
                pb: {default: [product3]},
                ie: true
            });

            mParticle.init(apiKey);

            var cookies = JSON.parse(getCookie(currentCookieVersion));

            var localStorage = mParticle.persistence.getLocalStorage();

            localStorage.should.have.properties('cp', 'pb');
            localStorage.should.not.have.properties(['ui', 'les', 'sid', 'ie', 'dt']);
            localStorage.cp.should.have.length(2);
            localStorage.pb.should.have.property('default');

            localStorage.pb.default[0].Name.should.equal('Product3');
            localStorage.pb.default[0].Sku.should.equal('3');
            localStorage.pb.default[0].Price.should.equal(300);

            localStorage.should.not.have.properties(['ui', 'ua', 'les', 'sid', 'ie', 'dt', 'sa', 'ss']);
            cookies.should.have.properties(['ui', 'les', 'sid', 'ie', 'dt']);
            cookies.should.not.have.properties(['pb', 'cp']);

            done();
        });

        it('localstorage is properly base64 encoded', function(done) {
            var ss = { uid: {
                Expires:'2027-09-11T20:53:40.544516Z',
                Value:'u=-2968710958423250133&cr=4050533&ls=4050534&lbe=4050534'
            }};
            mParticle.reset();

            var cookies = {
                cgid:   'a99cd390-ac20-4cc8-989a-1c8752400eba',
                das:    '4a9f015a-b23e-4d21-94cf-604c6aecc5f2',
                dt:     'test_key',
                ie:     true,
                les:    new Date().getTime(),
                sid:    '490d3ac1-7959-48fe-9aee-92f5893370e1',
                ua:     {gender: 'male', age: 31},
                ui:     [{Identity: 'test@test.com', Type: 5}, {Identity: '123', Type: 3}, {Identity: 'abc', Type: 7}]
            };
            setLocalStorage(v1localStorageKey, cookies);

            server.handle = function(request) {
                request.setResponseHeader('Content-Type', 'application/json');
                request.receive(200, JSON.stringify({
                    mpid: apiKey,
                    Store: ss
                }));
            };

            mParticle.init(apiKey);

            var parsedV3CookiesAfterInit = getEncodedLocalStorage(currentLSKey);
            parsedV3CookiesAfterInit.cgid.should.equal(cookies.cgid);
            parsedV3CookiesAfterInit.das.should.equal(cookies.das);
            parsedV3CookiesAfterInit.dt.should.equal(cookies.dt);
            parsedV3CookiesAfterInit.ie.should.equal(1);
            parsedV3CookiesAfterInit.dt.should.equal(cookies.dt);
            parsedV3CookiesAfterInit.sid.should.equal(cookies.sid);
            atob(parsedV3CookiesAfterInit.ua).should.equal(JSON.stringify(cookies.ua));
            Object.keys(JSON.parse(atob(parsedV3CookiesAfterInit.ui))).length.should.equal(3);
            (Array.isArray(JSON.parse(atob(parsedV3CookiesAfterInit.ui)))).should.equal(false);
            atob(parsedV3CookiesAfterInit.ss).should.equal(JSON.stringify(ss));

            (typeof JSON.parse(atob(parsedV3CookiesAfterInit.ua))).should.equal('object');
            (typeof JSON.parse(atob(parsedV3CookiesAfterInit.ss))).should.equal('object');
            done();
        });

        it('should encode cookie values to base64 properly', function(done) {
            var ss = { uid: {
                Expires:'2027-09-11T20:53:40.544516Z',
                Value:'u=-2968710958423250133&cr=4050533&ls=4050534&lbe=4050534'
            }};

            var cookies = {
                cgid:   'a99cd390-ac20-4cc8-989a-1c8752400eba',
                das:    '4a9f015a-b23e-4d21-94cf-604c6aecc5f2',
                dt:     'beab3f4d34281d45bfcdbbd7eb21c083',
                ie:     true,
                les:    1505932333024,
                sid:    '490d3ac1-7959-48fe-9aee-92f5893370e1',
                ua:     {gender: 'male', age: 31},
                ui:     [{Identity: 'test@test.com', Type: 5}, {Identity: '123', Type: 3}],
                uid:    {
                    Expires:'2027-09-11T20:53:40.544516Z',
                    Value:'u=-2968710958423250133&cr=4050533&ls=4050534&lbe=4050534'
                },
                ss:     ss
            };

            var mp = mParticle.persistence;
            encodedCookieResult = JSON.parse(mp.replaceApostrophesWithQuotes(mp.replacePipesWithCommas(mp.encodeCookies(JSON.stringify(cookies)))));
            encodedCookieResult.cgid.should.equal(cookies.cgid);
            encodedCookieResult.das.should.equal(cookies.das);
            encodedCookieResult.dt.should.equal(cookies.dt);
            encodedCookieResult.ie.should.equal(1);
            encodedCookieResult.les.should.equal(cookies.les);
            encodedCookieResult.sid.should.equal(cookies.sid);

            atob(encodedCookieResult.ua).should.equal(JSON.stringify(cookies.ua));
            Object.keys(JSON.parse(atob(encodedCookieResult.ui))).length.should.equal(2);
            (Array.isArray(JSON.parse(atob(encodedCookieResult.ui)))).should.equal(false);
            atob(encodedCookieResult.ss).should.equal(JSON.stringify(ss));

            (typeof JSON.parse(atob(encodedCookieResult.ua))).should.equal('object');
            (typeof JSON.parse(atob(encodedCookieResult.ss))).should.equal('object');
            done();
        });

        it('should decode cookie values from base64 properly', function(done) {
            var encodedCookie = {
                cgid:   'a99cd390-ac20-4cc8-989a-1c8752400eba',
                das:    '4a9f015a-b23e-4d21-94cf-604c6aecc5f2',
                dt:     'beab3f4d34281d45bfcdbbd7eb21c083',
                ie:     1,
                les:    1505932333024,
                sid:    '490d3ac1-7959-48fe-9aee-92f5893370e1',
                ua:     btoa(JSON.stringify({gender: 'male', age: 31})),
                ui:     btoa(JSON.stringify([{Identity: 'test@test.com', Type: 5}, {Identity: '123', Type: 3}])),
                ss:     btoa(JSON.stringify({
                    uid:{
                        Expires:'2027-09-11T20:53:40.544516Z',
                        Value:'u=-2968710958423250133&cr=4050533&ls=4050534&lbe=4050534'
                    }
                }))
            };

            var cookieExpected = {
                cgid:   'a99cd390-ac20-4cc8-989a-1c8752400eba',
                das:    '4a9f015a-b23e-4d21-94cf-604c6aecc5f2',
                dt:     'beab3f4d34281d45bfcdbbd7eb21c083',
                ie:     true,
                les:    1505932333024,
                sid:    '490d3ac1-7959-48fe-9aee-92f5893370e1',
                ua:     {gender: 'male', age: 31},
                ui:     [{Identity: 'test@test.com', Type: 5}, {Identity: '123', Type: 3}],
                ss:     {
                    uid:{
                        Expires:'2027-09-11T20:53:40.544516Z',
                        Value:'u=-2968710958423250133&cr=4050533&ls=4050534&lbe=4050534'
                    }
                }
            };

            decodedCookieResult = JSON.parse(mParticle.persistence.decodeCookies(JSON.stringify(encodedCookie)));

            decodedCookieResult.cgid.should.equal(cookieExpected.cgid);
            decodedCookieResult.das.should.equal(cookieExpected.das);
            decodedCookieResult.dt.should.equal(cookieExpected.dt);
            decodedCookieResult.ie.should.equal(true);
            decodedCookieResult.les.should.equal(cookieExpected.les);
            decodedCookieResult.sid.should.equal(cookieExpected.sid);
            decodedCookieResult.ua.gender.should.equal('male');
            decodedCookieResult.ua.age.should.equal(31);
            decodedCookieResult.ui[0].Identity.should.equal(cookieExpected.ui[0].Identity);
            decodedCookieResult.ui[0].Type.should.equal(cookieExpected.ui[0].Type);
            decodedCookieResult.ui[1].Identity.should.equal(cookieExpected.ui[1].Identity);
            decodedCookieResult.ui[1].Type.should.equal(cookieExpected.ui[1].Type);
            Object.keys(decodedCookieResult.ui).length.should.equal(2);

            done();
        });

        it('should remove all server settings except for uid', function(done) {
            server.handle = function(request) {
                request.setResponseHeader('Content-Type', 'application/json');
                request.receive(200, JSON.stringify({
                    Store: {
                        uid:{
                            Expires:'date1',
                            Value:'value1'
                        },
                        uddif:{
                            Expires:'date2',
                            Value:'value2'
                        },
                        rpl:{
                            Expires:'date3',
                            Value:'value3'
                        }
                    }
                }));
            };
            mParticle.logEvent('test');
            mParticle.logEvent('test2');
            var event2 = getEvent('test2');
            event2.str.should.have.property('uid');
            event2.str.uid.should.have.properties('Expires', 'Value');
            event2.str.uid.Expires.should.equal('date1');
            event2.str.uid.Value.should.equal('value1');
            event2.str.should.not.have.properties('uddif', 'rpl');
            done();
        });

        it('keep all items in localStorage when useCookieStorage is false', function(done) {
            var product = mParticle.eCommerce.createProduct('Product', '1', 100);
            var product2 = mParticle.eCommerce.createProduct('Product2', '2', 200);
            var product3 = mParticle.eCommerce.createProduct('Product3', '3', 300);
            mParticle.reset();

            setLocalStorage(v1localStorageKey, {
                ui: [{Identity: 123, Type: 1}, {Identity: '123', Type: 2}],
                cp: [product, product2],
                pb: {default: [product3]},
                ie: true
            });

            mParticle.init(apiKey);

            var localStorage = getLocalStorage(currentLSKey);

            localStorage.should.have.properties(['ui', 'les', 'sid', 'ie', 'dt', 'cp', 'pb']);
            localStorage.cp.should.have.length(2);
            localStorage.pb.should.have.property('default');

            localStorage.pb.default[0].Name.should.equal('Product3');
            localStorage.pb.default[0].Sku.should.equal('3');
            localStorage.pb.default[0].Price.should.equal(300);

            done();
        });

        it('should filter out any non string or number ids', function(done) {
            mParticle.reset();

            setLocalStorage(v1localStorageKey, {
                ui: [{Identity: 123, Type: 1}, {Identity: '123', Type: 2}, {Identity: [], Type: 1}, {Identity: {}, Type: 1}]
            });
            mParticle.init(apiKey);

            var localStorageData = mParticle.persistence.getLocalStorage();

            Object.keys(localStorageData.ui).length.should.equal(2);

            done();
        });

        it('should filter out any multiple UIs with no IDs', function(done) {
            mParticle.reset();

            setLocalStorage(v1localStorageKey, {
                ui: [{Identity: 123, Type: 1}, {Type: 1}, {Type: 1}, {Type: 1}]
            });

            mParticle.init(apiKey);

            var localStorageData = mParticle.persistence.getLocalStorage();
            Object.keys(localStorageData.ui).length.should.equal(1);

            done();
        });

        it('properly converts userIdentities from an array to an object', function(done) {
            var data = {ui: [{Identity: 'test@test.com', Type: 5}, {Identity: '123', Type: 3}, {Identity: 'abc', Type: 7}]};

            var UIObject = mParticle.persistence.convertUIFromArrayToObject(data);

            UIObject.ui.should.have.property('5', 'test@test.com');
            UIObject.ui.should.have.property('7', 'abc');
            UIObject.ui.should.have.property('3', '123');

            done();
        });

        it('removes any keys from persistence that do not have data', function(done) {
            var data = mParticle.persistence.getLocalStorage();
            data.should.not.have.properties(['ui', 'ua', 'av', 'pb', 'cp']);

            done();
        });

        it('puts data into cookies when running initializeStorage with useCookieStorage = true', function(done) {
            window.mParticle.useCookieStorage = true;
            mParticle.persistence.initializeStorage();

            cookieData = mParticle.persistence.getCookie();

            var cookieDataType = typeof cookieData;
            var parsedCookie = JSON.parse(cookieData);

            cookieDataType.should.be.type('string');
            parsedCookie.should.have.properties(['les', 'sid', 'ie', 'dt']);

            done();
        });

        it('puts data into localStorage when running initializeStorage with useCookieStorage = false', function(done) {
            mParticle.persistence.initializeStorage();

            cookieData = mParticle.persistence.getCookie();

            var localStorageData = mParticle.persistence.getLocalStorage();

            localStorageData.should.have.property('dt', 'test_key');
            Should(cookieData).not.be.ok();

            done();
        });

        it('puts data into cookies when updating persistence with useCookieStorage = true', function(done) {
            var cookieData, cookieDataType, parsedCookie;
            // Flush out anything in localStorage before updating in order to silo testing persistence.update()
            window.localStorage.removeItem('mprtcl-api');

            window.mParticle.useCookieStorage = true;
            mParticle.persistence.update();

            cookieData = mParticle.persistence.getCookie();
            cookieDataType = typeof cookieData;
            parsedCookie = JSON.parse(cookieData);
            localStorageData = mParticle.persistence.getLocalStorage();

            cookieDataType.should.be.type('string');
            parsedCookie.should.have.properties(['les', 'sid', 'ie', 'dt']);
            parsedCookie.should.not.have.properties(['cp', 'pb']);

            window.mParticle.useCookieStorage = false;

            done();
        });

        it('puts data into localStorage when updating persistence with useCookieStorage = false', function(done) {
            var localStorageData, cookieData;
            mParticle.persistence.update();

            localStorageData = mParticle.persistence.getLocalStorage();
            cookieData = mParticle.persistence.getCookie();
            localStorageData.should.have.property('dt', 'test_key');
            Should(cookieData).not.be.ok();

            done();
        });

        it('stores data in memory both when the result is passed in as an object', function(done) {
            var objData = {
                ui: [{
                    Identity: 'objData',
                    Type: 1
                }]
            };
            mParticle.persistence.storeDataInMemory(objData);

            var userIdentity1 = mParticle.getUserIdentity('objData');

            userIdentity1.should.have.property('Type', 1);
            userIdentity1.should.have.property('Identity', 'objData');

            done();
        });

        it('should move data from localStorage to cookies with useCookieStorage = true', function(done) {
            mParticle.reset();
            setLocalStorage(v1localStorageKey, {
                ui: [{Identity: 123, Type: 1}],
                ie: true
            });

            mParticle.useCookieStorage = true;

            mParticle.init(apiKey);

            mParticle.setUserAttribute('gender', 'male');

            var localStorageData = mParticle.persistence.getLocalStorage();
            var cookieData = JSON.parse(getCookie(currentCookieVersion));

            Should(localStorageData).not.be.ok();

            cookieData.ua.should.have.property('gender', 'male');
            cookieData.ui[0].should.have.property('Identity', 123);

            done();
        });

        it('should move data from cookies to localStorage with useCookieStorage = false', function(done) {
            mParticle.reset();
            setCookie(v1CookieKey, {ui: [{Identity: 123, Type: 1}], ie: true});
            var beforeInitCookieData = JSON.parse(getCookie(v1CookieKey));
            mParticle.init(apiKey);

            mParticle.setUserAttribute('gender', 'male');

            var localStorageData = mParticle.persistence.getLocalStorage();
            var afterInitCookieData = getCookie(currentCookieVersion);

            beforeInitCookieData.ui[0].should.have.property('Identity', 123);
            localStorageData.ua.should.have.property('gender', 'male');
            localStorageData.ui[0].should.have.property('Identity', 123);

            Should(afterInitCookieData).not.be.ok();

            done();
        });

        it('should revert to cookie storage if localStorage is not available and useCookieStorage is set to false', function(done) {
            mParticle.reset();
            mParticle.persistence.determineLocalStorageAvailability = function() { return false; };

            mParticle.useCookieStorage = false;

            mParticle.init(apiKey);

            mParticle.setUserAttribute('gender', 'male');

            var cookieData = JSON.parse(getCookie(currentCookieVersion));

            cookieData.ua.should.have.property('gender', 'male');

            mParticle.persistence.determineLocalStorageAvailability = function() { return true; };

            done();
        });

        it('properly replaces quotes with apostrophes, and apostrophes with quotes', function(done) {
            var quotes = '{"cgid":"abc"|"das":"def"|"dt":"hij"|"ie":true|"les":1505932333024|"sid":"klm"}';
            var apostrophes = '{\'cgid\':\'abc\'|\'das\':\'def\'|\'dt\':\'hij\'|\'ie\':true|\'les\':1505932333024|\'sid\':\'klm\'}';

            mParticle.persistence.replaceApostrophesWithQuotes(apostrophes).should.equal(quotes);
            mParticle.persistence.replaceQuotesWithApostrophes(quotes).should.equal(apostrophes);

            done();
        });

        it('should properly migrate cookies with quotes to cookies with apostrophes', function(done) {
            mParticle.reset();
            mParticle.useCookieStorage = true;
            var ss = JSON.parse('{"uid":{"Expires":"2027-10-18T15:46:16.050348Z","Value":"g=6fec7bbe-49d6-4f7c-a55e-3928e10cb88a&u=-6701723382044991600&cr=4103506"}}');

            server.handle = function(request) {
                request.setResponseHeader('Content-Type', 'application/json');
                request.receive(200, JSON.stringify({
                    mpid: apiKey,
                    Store: ss
                }));
            };

            var cookie = {
                sid:'af559317-7e88-491f-9e4a-2d493dedcefc',
                ie:1,
                ss:'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTAtMThUMTU6NDY6MTYuMDUwMzQ4WiIsIlZhbHVlIjoiZz02ZmVjN2JiZS00OWQ2LTRmN2MtYTU1ZS0zOTI4ZTEwY2I4OGEmdT0tNjcwMTcyMzM4MjA0NDk5MTYwMCZjcj00MTAzNTA2In19',
                dt:'test_key',
                les:new Date().getTime(),
                cgid:'17e7ab9e-8e13-4481-a3a0-ca85fb8189a1',
                das:'6fec7bbe-49d6-4f7c-a55e-3928e10cb88a',
                mpid:'test_key'
            };

            window.document.cookie = 'mprtcl-v3=' + mParticle.persistence.replaceCommasWithPipes(JSON.stringify(cookie)) + ';path=/;domain=;';

            // set cookies with quotes directly on window.  should not have apostrophes.
            var cookiesBefore = getEncodedCookie(currentCookieVersion);
            cookiesBefore.indexOf('"').should.equal(1);
            cookiesBefore.indexOf('\'').should.equal(-1);
            mParticle.init(apiKey);

            // after init, quotes should be turned into apostrophes
            var cookiesAfter = getEncodedCookie(currentCookieVersion);
            cookiesAfter.indexOf('"').should.equal(-1);
            cookiesAfter.indexOf('\'').should.equal(1);
            var cookiesAfterParsed = JSON.parse(getCookie(currentCookieVersion));
            cookiesAfterParsed.sid.should.equal(cookie.sid);
            cookiesAfterParsed.ie.should.equal(true);
            btoa(JSON.stringify(cookiesAfterParsed.ss)).should.equal(cookie.ss);
            cookiesAfterParsed.dt.should.equal(cookie.dt);
            cookiesAfterParsed.cgid.should.equal(cookie.cgid);
            cookiesAfterParsed.das.should.equal(cookie.das);
            cookiesAfterParsed.mpid.should.equal(cookie.mpid);
            done();
        });

        it('should properly encode and decode cookies with quotes or apostrophes in them', function(done) {
            mParticle.reset();
            mParticle.useCookieStorage = true;
            var ss = JSON.parse('{"uid":{"Expires":"2027-10-18T15:46:16.050348Z","Value":"g=6fec7bbe-49d6-4f7c-a55e-3928e10cb88a&u=-6701723382044991600&cr=4103506"}}');

            server.handle = function(request) {
                request.setResponseHeader('Content-Type', 'application/json');
                request.receive(200, JSON.stringify({
                    mpid: apiKey,
                    Store: ss
                }));
            };

            var cookie = {
                sid:'af559317-7e88-491f-9e4a-2d493dedcefc',
                ie:1,
                ss:'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTAtMThUMTU6NDY6MTYuMDUwMzQ4WiIsIlZhbHVlIjoiZz02ZmVjN2JiZS00OWQ2LTRmN2MtYTU1ZS0zOTI4ZTEwY2I4OGEmdT0tNjcwMTcyMzM4MjA0NDk5MTYwMCZjcj00MTAzNTA2In19',
                dt:'test_key',
                les:new Date().getTime(),
                cgid:'17e7ab9e-8e13-4481-a3a0-ca85fb8189a1',
                das:'6fec7bbe-49d6-4f7c-a55e-3928e10cb88a',
                mpid:'test_key'
            };

            window.document.cookie = 'mprtcl-v3=' + mParticle.persistence.replaceCommasWithPipes(JSON.stringify(cookie)) + ';path=/;domain=".localhost";';

            mParticle.init(apiKey);
            mParticle.setUserAttribute('motto', '\"great!');
            mParticle.setUserIdentity('\'bob', 1);
            mParticle.setSessionAttribute('color', '\'green');
            var cookies = JSON.parse(mParticle.persistence.getCookie());
            cookies.ua.motto.should.equal('\"great!');
            cookies.ui[0].Identity.should.equal('\'bob');
            cookies.sa.color.should.equal('\'green');

            done();
        });

        it('should retain all cookie and local storage data when refreshing with localStorage data', function(done) {
            mParticle.reset();
            mParticle.useCookieStorage = true;
            mParticle.init(apiKey);

            var cookies1 = JSON.parse(mParticle.persistence.getCookie());

            var localStorage1 = mParticle.persistence.getLocalStorage();

            Should(cookies1).be.ok();
            Should(localStorage1).not.be.ok();
            var product = mParticle.eCommerce.createProduct('Product', '1', 100);
            mParticle.setUserAttribute('gender', 'female');
            mParticle.setUserIdentity('asdf', 1);
            mParticle.eCommerce.Cart.add(product);
            mParticle.init(apiKey);

            var cookies2 = JSON.parse(mParticle.persistence.getCookie());
            var localStorage2 = mParticle.persistence.getLocalStorage();

            cookies2.sid.should.equal(cookies1.sid);
            cookies2.dt.should.equal(cookies1.dt);
            cookies2.cgid.should.equal(cookies1.cgid);
            cookies2.das.should.equal(cookies1.das);
            cookies2.mpid.should.equal(cookies1.mpid);
            cookies2.ie.should.equal(cookies1.ie);
            localStorage2.cp[0].Name.should.equal(product.Name);

            done();
        });

        it('should load local storage products that have quotes/apostrophes', function(done) {
            var product1 = mParticle.eCommerce.createProduct('Extra apostrophe \' \' in name', 'SKU1', 123);
            var product2 = mParticle.eCommerce.createProduct('Extra quotes \'\" \" \" in name', 'SKU1', 123);
            mParticle.eCommerce.Cart.add([product1, product2]);

            mParticle.init(apiKey);
            server.requests = [];
            mParticle.eCommerce.logCheckout(1);
            var event = getEvent('eCommerce - Checkout');

            event.pd.pl.length.should.equal(2);
            event.pd.pl[0].nm.should.equal(product1.Name);
            event.pd.pl[0].id.should.equal(product1.Sku);
            event.pd.pl[0].pr.should.equal(product1.Price);
            event.pd.pl[1].nm.should.equal(product2.Name);
            event.pd.pl[1].id.should.equal(product2.Sku);
            event.pd.pl[1].pr.should.equal(product2.Price);

            done();
        });

        it('should bypass previously corrupt cookies that have quotes/apostrophes', function(done) {
            var product1 = mParticle.eCommerce.createProduct('invalid \' product', 'SKU123', 123);
            var cookies = {
                cp: [product1],
                sid:'dda2564f-850b-435e-90b5-ffa506dc767c',
                ie:1,
                ss:'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTItMTZUMTg6MDQ6MTkuMzY1NDM1WiIsIlZhbHVlIjoiZz1hNWI1MTE1Zi02MDM1LTQ3NDEtOTRlOC0wMTQ2NzcwMGU5ZmMmdT0xNTA1Nzg4MDI1MzA4MzI2OTQyJmNyPTQxODg2MDQifX0=',
                dt:'beab3f4d34281d45bfcdbbd7eb21c083',
                les:1513620354877,
                ssd:1513620255927,
                cgid:'cgid13',
                das:'das123',
                mpid: testMPID
            };
            setLocalStorage(currentCookieVersion, cookies);

            mParticle.init(apiKey);

            server.requests = [];
            mParticle.logEvent('test');
            var event = getEvent('test');
            event.n.should.equal('test');

            done();
        });

        it('should decode previously non-encoded products ok', function(done) {
            var product1 = mParticle.eCommerce.createProduct('valid product', 'SKU123', 123);

            var cookies = {
                cp: [product1],
                sid:'dda2564f-850b-435e-90b5-ffa506dc767c',
                ie:1,
                ss:'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTItMTZUMTg6MDQ6MTkuMzY1NDM1WiIsIlZhbHVlIjoiZz1hNWI1MTE1Zi02MDM1LTQ3NDEtOTRlOC0wMTQ2NzcwMGU5ZmMmdT0xNTA1Nzg4MDI1MzA4MzI2OTQyJmNyPTQxODg2MDQifX0=',
                dt:'beab3f4d34281d45bfcdbbd7eb21c083',
                les:1513620354877,
                ssd:1513620255927,
                cgid:'472f0689-88fd-4d85-8908-49f3e47592cf',
                das:'a5b5115f-6035-4741-94e8-01467700e9fc',
                mpid: testMPID
            };
            setLocalStorage(currentCookieVersion, cookies);
            var data = localStorage.getItem('mprtcl-v3');

            var product = JSON.parse(mParticle.persistence.decodeCookies(data)).cp[0];
            product.Name.should.equal(product1.Name);
            product.Sku.should.equal(product1.Sku);
            product.Price.should.equal(product1.Price);

            done();
        });

        it('should base-64 encode previously non-encoded products', function(done) {
            var product1 = mParticle.eCommerce.createProduct('valid product', 'SKU123', 123);
            var cookies = {
                cp: [product1],
                sid:'dda2564f-850b-435e-90b5-ffa506dc767c',
                ie:1,
                ss:'eyJ1aWQiOnsiRXhwaXJlcyI6IjIwMjctMTItMTZUMTg6MDQ6MTkuMzY1NDM1WiIsIlZhbHVlIjoiZz1hNWI1MTE1Zi02MDM1LTQ3NDEtOTRlOC0wMTQ2NzcwMGU5ZmMmdT0xNTA1Nzg4MDI1MzA4MzI2OTQyJmNyPTQxODg2MDQifX0=',
                dt:'beab3f4d34281d45bfcdbbd7eb21c083',
                les:1513620354877,
                ssd:1513620255927,
                cgid:'472f0689-88fd-4d85-8908-49f3e47592cf',
                das:'a5b5115f-6035-4741-94e8-01467700e9fc',
                mpid: testMPID
            };
            setLocalStorage(currentCookieVersion, cookies);

            mParticle.init(apiKey);
            var product = JSON.parse(mParticle.persistence.decodeCookies(localStorage.getItem('mprtcl-v3'))).cp[0];
            product.Name.should.equal(product1.Name);
            product.Sku.should.equal(product1.Sku);
            product.Price.should.equal(product1.Price);

            done();
        });
    });

    describe('forwarders', function() {
        it('does not initialize a forwarder when forwarder\'s isDebug != mParticle.isSandbox', function(done) {
            mParticle.reset();
            mParticle.isSandbox = false;
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mParticle.configureForwarder({
                name: 'MockForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                id: 1,
                isDebug: true,
                hasDebugString: false,
                isVisible: true
            });

            mParticle.init(apiKey);
            Should(mockForwarder.instance).not.be.ok();

            done();
        });

        it('initializes forwarder with isDebug = false && mParticle.isSandbox = false', function(done) {
            mParticle.reset();
            mParticle.isSandbox = false;
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mParticle.configureForwarder({
                name: 'MockForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                id: 1,
                isDebug: false,
                hasDebugString: 'false',
                isVisible: true
            });

            mParticle.init(apiKey);

            mockForwarder.instance.should.have.property('initCalled', true);

            done();
        });

        it('creates a forwarder when forwarder\'s isDebug = mParticle.isSandbox', function(done) {
            mParticle.reset();
            mParticle.isSandbox = true;
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mParticle.configureForwarder({
                name: 'MockForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                id: 1,
                isDebug: true,
                hasDebugString: false,
                isVisible: true
            });

            mParticle.init(apiKey);
            mockForwarder.instance.should.have.property('initCalled', true);

            done();
        });

        it('sends events to forwarder when forwarder\'s isDebug = mParticle.isSandbox ', function(done) {
            mParticle.reset();
            mParticle.isSandbox = true;
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mParticle.configureForwarder({
                name: 'MockForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                id: 1,
                isDebug: true,
                hasDebugString: false,
                isVisible: true
            });

            mParticle.init(apiKey);
            mParticle.logEvent('send this event to forwarder');
            mockForwarder.instance.should.have.property('processCalled', true);

            done();
        });

        it('sends events to forwarder when mParticle.isSandbox = config.isDebug = false', function(done) {
            mParticle.reset();
            mParticle.isSandbox = false;
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();
            mParticle.init(apiKey);

            mParticle.logEvent('send this event to forwarder');

            mockForwarder.instance.should.have.property('processCalled', true);

            done();
        });

        it('sends forwarding stats', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();
            mParticle.init(apiKey);

            mParticle.logEvent('send this event to forwarder',
                mParticle.EventType.Navigation,
                { 'my-key': 'my-value' });

            var event = getEvent('send this event to forwarder', true);

            Should(event).should.be.ok();

            event.should.have.property('mid', 1);
            event.should.have.property('n', 'send this event to forwarder');
            event.should.have.property('attrs');
            event.should.have.property('sdk', mParticle.getVersion());
            event.should.have.property('dt', MessageType.PageEvent);
            event.should.have.property('et', mParticle.EventType.Navigation);
            event.should.have.property('dbg', mParticle.isSandbox);
            event.should.have.property('ct');
            event.should.have.property('eec', 0);

            done();
        });

        it('should not send forwarding stats to invisible forwarders', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();
            mParticle.init(apiKey);
            mockForwarder.instance.isVisible = false;

            mParticle.logEvent('send this event to forwarder',
                mParticle.EventType.Navigation,
                { 'my-key': 'my-value' });

            var event = getEvent('send this event to forwarder', true);

            Should(event).should.not.have.property('n');

            done();
        });

        it('should invoke forwarder opt out', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();
            mParticle.init(apiKey);
            mParticle.setOptOut(true);

            mockForwarder.instance.should.have.property('setOptOutCalled', true);

            done();
        });

        it('should invoke forwarder setuserattribute', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();
            mParticle.init(apiKey);
            mParticle.setUserAttribute('gender', 'male');

            mockForwarder.instance.should.have.property('setUserAttributeCalled', true);

            done();
        });

        it('should invoke forwarder setuserattribute when calling setUserAttributeList', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();
            mParticle.init(apiKey);
            mParticle.setUserAttributeList('gender', ['male']);

            mockForwarder.instance.should.have.property('setUserAttributeCalled', true);

            done();
        });

        it('should invoke forwarder removeuserattribute', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();
            mParticle.init(apiKey);
            mParticle.setUserAttribute('gender', 'male');
            mParticle.removeUserAttribute('gender');

            mockForwarder.instance.should.have.property('removeUserAttributeCalled', true);

            done();
        });
        it('should filter user attributes from forwarder', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            mParticle.configureForwarder({
                name: 'MockForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [mParticle.generateHash('gender')],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });

            mParticle.init(apiKey);
            mParticle.setUserAttribute('gender', 'male');

            mParticle.logEvent('test event');

            var event = mockForwarder.instance.receivedEvent;
            event.should.have.property('UserAttributes');
            event.UserAttributes.should.not.have.property('gender');

            done();
        });

        it('should filter user identities from forwarder', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);

            mParticle.configureForwarder({
                name: 'MockForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [mParticle.IdentityType.Google],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });

            mParticle.init(apiKey);
            mParticle.setUserIdentity('test@gmail.com', mParticle.IdentityType.Google);

            mParticle.logEvent('test event');

            var event = mockForwarder.instance.receivedEvent;
            event.should.have.property('UserIdentities').with.lengthOf(0);

            done();
        });

        it('should filter event names', function(done) {
            mParticle.reset();

            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);

            mParticle.configureForwarder({
                name: 'MockForwarder',
                settings: {},
                eventNameFilters: [mParticle.generateHash(mParticle.EventType.Navigation + 'test event')],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });

            mParticle.init(apiKey);

            mParticle.startNewSession();
            mockForwarder.instance.receivedEvent = null;

            mParticle.logEvent('test event', mParticle.EventType.Navigation);

            Should(mockForwarder.instance.receivedEvent).not.be.ok();

            mParticle.logEvent('test event 2', mParticle.EventType.Navigation);

            Should(mockForwarder.instance.receivedEvent).be.ok();

            done();
        });

        it('should filter page event names', function(done) {
            mParticle.reset();

            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);

            mParticle.configureForwarder({
                name: 'MockForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [mParticle.generateHash(mParticle.EventType.Unknown + window.location.pathname)],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });

            mParticle.init(apiKey);

            mParticle.startNewSession();
            mockForwarder.instance.receivedEvent = null;

            mParticle.logPageView();

            Should(mockForwarder.instance.receivedEvent).not.be.ok();

            done();
        });

        it('should filter event attributes', function(done) {
            mParticle.reset();

            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);

            mParticle.configureForwarder({
                name: 'MockForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [mParticle.generateHash(mParticle.EventType.Navigation + 'test event' + 'test attribute')],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });

            mParticle.init(apiKey);

            mParticle.logEvent('test event', mParticle.EventType.Navigation, {
                'test attribute': 'test value',
                'test attribute 2': 'test value 2'
            });

            var event = mockForwarder.instance.receivedEvent;

            event.EventAttributes.should.not.have.property('test attribute');
            event.EventAttributes.should.have.property('test attribute 2');

            done();
        });

        it('should filter page event attributes', function(done) {
            mParticle.reset();

            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);

            mParticle.configureForwarder({
                name: 'MockForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [mParticle.generateHash(mParticle.EventType.Navigation + 'test event' + 'test attribute')],
                screenNameFilters: [],
                pageViewAttributeFilters: [mParticle.generateHash(mParticle.EventType.Unknown + window.location.pathname + 'hostname')],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });

            mParticle.init(apiKey);

            mParticle.logPageView();

            var event = mockForwarder.instance.receivedEvent;

            event.EventAttributes.should.not.have.property('hostname');
            event.EventAttributes.should.have.property('title');

            done();
        });

        it('should call logout on forwarder', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();

            mParticle.init(apiKey);
            mParticle.logOut();

            mockForwarder.instance.should.have.property('logOutCalled', true);

            done();
        });

        it('should pass in app name to forwarder on initialize', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();

            mParticle.setAppName('Unit Tests');
            mParticle.init(apiKey);

            mockForwarder.instance.should.have.property('appName', 'Unit Tests');

            done();
        });

        it('should pass in app version to forwarder on initialize', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();

            mParticle.setAppVersion('3.0');
            mParticle.init(apiKey);

            mockForwarder.instance.should.have.property('appVersion', '3.0');

            done();
        });

        it('should pass in user identities to forwarder on initialize', function(done) {
            mParticle.reset();

            setCookie(v1CookieKey, {
                ui: [{
                    Identity: 'testuser@mparticle.com',
                    Type: 1
                }]
            });

            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();
            mParticle.init(apiKey);

            mockForwarder.instance.should.have.property('userIdentities').with.lengthOf(1);

            done();
        });

        it('should pass in user attributes to forwarder on initialize', function(done) {
            mParticle.reset();

            setCookie(v1CookieKey, {
                ua: {
                    color: 'blue'
                }
            });

            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();
            mParticle.init(apiKey);

            mockForwarder.instance.should.have.property('userAttributes');
            mockForwarder.instance.userAttributes.should.have.property('color', 'blue');

            done();
        });

        it('should not forward event if attribute forwarding rule is set', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);

            mParticle.configureForwarder({
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
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true,
                filteringEventAttributeValue: {
                    eventAttributeName: mParticle.generateHash('ForwardingRule'),
                    eventAttributeValue: mParticle.generateHash('Forward'),
                    includeOnMatch: false
                }
            });

            mParticle.init(apiKey);

            mParticle.logEvent('send this event to forwarder', mParticle.EventType.Navigation, {
                ForwardingRule: 'Forward'
            });

            var event = mockForwarder.instance.receivedEvent;

            event.should.not.have.property('EventName', 'send this event to forwarder');

            done();
        });

        it('should forward event if attribute forwarding rule is set', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);

            mParticle.configureForwarder({
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
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true,
                filteringEventAttributeValue: {
                    eventAttributeName: mParticle.generateHash('ForwardingRule'),
                    eventAttributeValue: mParticle.generateHash('Forward'),
                    includeOnMatch: true
                }
            });

            mParticle.init(apiKey);

            mParticle.logEvent('send this event to forwarder', mParticle.EventType.Navigation, {
                ForwardingRule: 'Forward'
            });

            var event = mockForwarder.instance.receivedEvent;

            event.should.have.property('EventName', 'send this event to forwarder');

            done();
        });

        it('should not forward event if attribute forwarding true rule is set', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);

            mParticle.configureForwarder({
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
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true,
                filteringEventAttributeValue: {
                    eventAttributeName: mParticle.generateHash('ForwardingRule'),
                    eventAttributeValue: mParticle.generateHash('Forward'),
                    includeOnMatch: true
                }
            });

            mParticle.init(apiKey);

            mParticle.logEvent('send this event to forwarder', mParticle.EventType.Navigation, {
                Test: 'Non-Matching'
            });

            var event = mockForwarder.instance.receivedEvent;

            event.should.not.have.property('EventName', 'send this event to forwarder');

            done();
        });

        it('should send event to forwarder if filtering attribute and includingOnMatch is true', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            var filteringUserAttributeValue = {
                userAttributeName: mParticle.generateHash('gender'),
                userAttributeValue: mParticle.generateHash('male'),
                includeOnMatch: true
            };

            var forwarder = {
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
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            };

            forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

            mParticle.configureForwarder(forwarder);

            mParticle.init(apiKey);

            mParticle.setUserAttribute('Gender', 'Male');

            mParticle.logEvent('test event');

            var event = mockForwarder.instance.receivedEvent;
            event.should.have.property('UserAttributes');
            event.UserAttributes.should.have.property('Gender', 'Male');
            event.EventName.should.equal('test event');

            done();
        });

        it('should not send event to forwarder if filtering attribute and includingOnMatch is false', function(done) {
            mParticle.reset();

            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            var filteringUserAttributeValue = {
                userAttributeName: mParticle.generateHash('gender'),
                userAttributeValue: mParticle.generateHash('male'),
                includeOnMatch: false
            };

            var forwarder = {
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
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            };

            forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

            mParticle.configureForwarder(forwarder);

            mParticle.init(apiKey);

            mParticle.setUserAttribute('Gender', 'Male');
            //reset received event, which will have the initial session start event on it
            mockForwarder.instance.receivedEvent = null;

            mParticle.logEvent('test event');
            var event = mockForwarder.instance.receivedEvent;
            Should(event).not.be.ok();

            done();
        });

        it('should send event to forwarder if there are no user attributes on event if includeOnMatch = false', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            var filteringUserAttributeValue = {
                userAttributeName: mParticle.generateHash('gender'),
                userAttributeValue: mParticle.generateHash('male'),
                includeOnMatch: false
            };

            var forwarder = {
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
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            };

            forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

            mParticle.configureForwarder(forwarder);

            mParticle.init(apiKey);

            mParticle.logEvent('test event');

            var event = mockForwarder.instance.receivedEvent;
            mockForwarder.instance.receivedEvent.EventName.should.equal('test event');
            Should(event).be.ok();

            done();
        });

        it('should not send event to forwarder if there are no user attributes on event if includeOnMatch = true', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            var filteringUserAttributeValue = {
                userAttributeName: mParticle.generateHash('gender'),
                userAttributeValue: mParticle.generateHash('male'),
                includeOnMatch: true
            };

            var forwarder = {
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
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            };

            forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

            mParticle.configureForwarder(forwarder);

            mParticle.init(apiKey);

            mParticle.logEvent('test event');

            var event = mockForwarder.instance.receivedEvent;
            Should(event).not.be.ok();

            done();
        });

        it('should send event to forwarder if there is no match and includeOnMatch = false', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            var filteringUserAttributeValue = {
                userAttributeName: mParticle.generateHash('gender'),
                userAttributeValue: mParticle.generateHash('male'),
                includeOnMatch: false
            };

            var forwarder = {
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
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            };

            forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

            mParticle.configureForwarder(forwarder);

            mParticle.init(apiKey);
            mParticle.setUserAttribute('gender', 'female');
            mParticle.logEvent('test event');

            var event = mockForwarder.instance.receivedEvent;
            Should(event).be.ok();
            event.EventName.should.equal('test event');

            done();
        });

        it('should not send event to forwarder if there is no match and includeOnMatch = true', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            var filteringUserAttributeValue = {
                userAttributeName: mParticle.generateHash('gender'),
                userAttributeValue: mParticle.generateHash('male'),
                includeOnMatch: true
            };

            var forwarder = {
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
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            };

            forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

            mParticle.configureForwarder(forwarder);

            mParticle.init(apiKey);
            mParticle.setUserAttribute('gender', 'female');
            mParticle.logEvent('test event');

            var event = mockForwarder.instance.receivedEvent;
            Should(event).not.be.ok();

            done();
        });

        it('should send event to forwarder if the filterinUserAttribute object is invalid', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            var filteringUserAttributeValue = undefined;

            var forwarder = {
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
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            };

            forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

            mParticle.configureForwarder(forwarder);

            mParticle.init(apiKey);
            mParticle.setUserAttribute('Gender', 'Male');

            mParticle.logEvent('test event');
            var event = mockForwarder.instance.receivedEvent;

            Should(event).be.ok();
            mockForwarder.instance.receivedEvent.EventName.should.equal('test event');

            done();
        });

        it('should support old configureForwarder function signature', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            mParticle.configureForwarder('MockForwarder', {}, [], [], [], [], [], [], [mParticle.generateHash('gender')], 1, false, false);
            mParticle.init(apiKey);
            mParticle.setUserAttribute('gender', 'male');
            mParticle.logEvent('test event');

            var event = mockForwarder.instance.receivedEvent;
            event.should.have.property('UserAttributes');
            event.UserAttributes.should.not.have.property('gender');

            done();
        });
    });

    describe('helper methods', function() {
        it('properly replaces commas with pipes, and pipes with commas', function(done) {
            var pipes = '{"cgid":"abc"|"das":"def"|"dt":"hij"|"ie":true|"les":1505932333024|"sid":"klm"}';
            var commas = '{"cgid":"abc","das":"def","dt":"hij","ie":true,"les":1505932333024,"sid":"klm"}';

            mParticle.persistence.replaceCommasWithPipes(commas).should.equal(pipes);
            mParticle.persistence.replacePipesWithCommas(pipes).should.equal(commas);

            done();
        });

        it('should get the proper top level domain', function(done) {
            var rejectionItems1 = [
                'mptest=cookie;domain=.com;',
                'mptest=cookie;domain=.uk;',
                'mptest=cookie;domain=.co.uk;',
                'mptest=cookie;domain=.localhost;'
            ];
            var mockCookie = {
                value_: '',

                get cookie() {
                    return this.value_;
                },

                set cookie(str) {
                    if (rejectionItems1.indexOf(str) === -1) {
                        this.value_ += str;
                    }
                }
            };

            var urls = [
                'https://app.mparticle.com',
                'https://www.google.com',
                'https://subdomain.domain.com',
                'http://www.google.co.uk',
                'https://gist.github.com/test123/file.js',
                'http://google.com:443/stuff',
                'localhost:3000',
                '0:0:0:0'
            ];

            var expectedRootDomains = [
                'mparticle.com',
                'google.com',
                'domain.com',
                'google.co.uk',
                'github.com',
                'google.com',
                '',
                ''
            ];

            for (var i = 0; i < urls.length; i++) {
                var link = document.createElement('a');
                link.href = urls[i];
                mParticle.persistence.getDomain(mockCookie, link.hostname).should.equal(expectedRootDomains[i]);
                mockCookie.value_= '';
            }

            done();
        });

        it('should correctly validate an attribute value', function(done) {
            var validatedString = mParticle.Validators.isValidAttributeValue('testValue1');
            var validatedNumber = mParticle.Validators.isValidAttributeValue(1);
            var validatedNull = mParticle.Validators.isValidAttributeValue(null);
            var validatedObject = mParticle.Validators.isValidAttributeValue({});
            var validatedArray = mParticle.Validators.isValidAttributeValue([]);
            var validatedUndefined = mParticle.Validators.isValidAttributeValue(undefined);

            validatedString.should.be.ok();
            validatedNumber.should.be.ok();
            validatedNull.should.be.ok();
            validatedObject.should.not.be.ok();
            validatedArray.should.not.be.ok();
            validatedUndefined.should.not.be.ok();

            done();
        });

        it('should correctly validate a key value', function(done) {
            var validatedString = mParticle.Validators.isValidKeyValue('testValue1');
            var validatedNumber = mParticle.Validators.isValidKeyValue(1);
            var validatedNull = mParticle.Validators.isValidKeyValue(null);
            var validatedObject = mParticle.Validators.isValidKeyValue({});
            var validatedArray = mParticle.Validators.isValidKeyValue([]);
            var validatedUndefined = mParticle.Validators.isValidKeyValue(undefined);

            validatedString.should.be.ok();
            validatedNumber.should.be.ok();
            validatedNull.should.not.be.ok();
            validatedObject.should.not.be.ok();
            validatedArray.should.not.be.ok();
            validatedUndefined.should.not.be.ok();

            done();
        });

        it('should correctly validate a string or number', function(done) {
            var validatedString = mParticle.Validators.isStringOrNumber('testValue1');
            var validatedNumber = mParticle.Validators.isStringOrNumber(1);
            var validatedNull = mParticle.Validators.isStringOrNumber(null);
            var validatedObject = mParticle.Validators.isStringOrNumber({});
            var validatedArray = mParticle.Validators.isStringOrNumber([]);
            var validatedUndefined = mParticle.Validators.isStringOrNumber(undefined);

            validatedString.should.be.ok();
            validatedNumber.should.be.ok();
            validatedNull.should.not.be.ok();
            validatedObject.should.not.be.ok();
            validatedArray.should.not.be.ok();
            validatedUndefined.should.not.be.ok();

            done();
        });

        it('event type should return name', function(done) {
            mParticle.EventType.getName(mParticle.EventType.Navigation).should.equal('Navigation');
            mParticle.EventType.getName(mParticle.EventType.Location).should.equal('Location');
            mParticle.EventType.getName(mParticle.EventType.Search).should.equal('Search');
            mParticle.EventType.getName(mParticle.EventType.Transaction).should.equal('Transaction');
            mParticle.EventType.getName(mParticle.EventType.UserContent).should.equal('User Content');
            mParticle.EventType.getName(mParticle.EventType.UserPreference).should.equal('User Preference');
            mParticle.EventType.getName(mParticle.EventType.Social).should.equal('Social');
            mParticle.EventType.getName(mParticle.EventType.Media).should.equal('Other');
            mParticle.EventType.getName(mParticle.CommerceEventType.ProductAddToCart).should.equal('Product Added to Cart');
            mParticle.EventType.getName(mParticle.CommerceEventType.ProductAddToWishlist).should.equal('Product Added to Wishlist');
            mParticle.EventType.getName(mParticle.CommerceEventType.ProductCheckout).should.equal('Product Checkout');
            mParticle.EventType.getName(mParticle.CommerceEventType.ProductCheckoutOption).should.equal('Product Checkout Options');
            mParticle.EventType.getName(mParticle.CommerceEventType.ProductClick).should.equal('Product Click');
            mParticle.EventType.getName(mParticle.CommerceEventType.ProductImpression).should.equal('Product Impression');
            mParticle.EventType.getName(mParticle.CommerceEventType.ProductPurchase).should.equal('Product Purchased');
            mParticle.EventType.getName(mParticle.CommerceEventType.ProductRefund).should.equal('Product Refunded');
            mParticle.EventType.getName(mParticle.CommerceEventType.ProductRemoveFromCart).should.equal('Product Removed From Cart');
            mParticle.EventType.getName(mParticle.CommerceEventType.ProductRemoveFromWishlist).should.equal('Product Removed from Wishlist');
            mParticle.EventType.getName(mParticle.CommerceEventType.ProductViewDetail).should.equal('Product View Details');
            mParticle.EventType.getName(mParticle.CommerceEventType.PromotionClick).should.equal('Promotion Click');
            mParticle.EventType.getName(mParticle.CommerceEventType.PromotionView).should.equal('Promotion View');
            mParticle.EventType.getName(null).should.equal('Other');

            done();
        });

        it('identity type should return name', function(done) {
            mParticle.IdentityType.getName(mParticle.IdentityType.CustomerId).should.equal('Customer ID');
            mParticle.IdentityType.getName(mParticle.IdentityType.Facebook).should.equal('Facebook ID');
            mParticle.IdentityType.getName(mParticle.IdentityType.Twitter).should.equal('Twitter ID');
            mParticle.IdentityType.getName(mParticle.IdentityType.Google).should.equal('Google ID');
            mParticle.IdentityType.getName(mParticle.IdentityType.Microsoft).should.equal('Microsoft ID');
            mParticle.IdentityType.getName(mParticle.IdentityType.Yahoo).should.equal('Yahoo ID');
            mParticle.IdentityType.getName(mParticle.IdentityType.Email).should.equal('Email');
            mParticle.IdentityType.getName(mParticle.IdentityType.Alias).should.equal('Alias ID');
            mParticle.IdentityType.getName(mParticle.IdentityType.FacebookCustomAudienceId).should.equal('Facebook App User ID');
            mParticle.IdentityType.getName(null).should.equal('Other ID');

            done();
        });

        it('product action type should return name', function(done) {
            mParticle.ProductActionType.getName(mParticle.ProductActionType.AddToCart).should.equal('Add to Cart');
            mParticle.ProductActionType.getName(mParticle.ProductActionType.RemoveFromCart).should.equal('Remove from Cart');
            mParticle.ProductActionType.getName(mParticle.ProductActionType.Checkout).should.equal('Checkout');
            mParticle.ProductActionType.getName(mParticle.ProductActionType.CheckoutOption).should.equal('Checkout Option');
            mParticle.ProductActionType.getName(mParticle.ProductActionType.Click).should.equal('Click');
            mParticle.ProductActionType.getName(mParticle.ProductActionType.ViewDetail).should.equal('View Detail');
            mParticle.ProductActionType.getName(mParticle.ProductActionType.Purchase).should.equal('Purchase');
            mParticle.ProductActionType.getName(mParticle.ProductActionType.Refund).should.equal('Refund');
            mParticle.ProductActionType.getName(mParticle.ProductActionType.AddToWishlist).should.equal('Add to Wishlist');
            mParticle.ProductActionType.getName(mParticle.ProductActionType.RemoveFromWishlist).should.equal('Remove from Wishlist');
            mParticle.ProductActionType.getName(null).should.equal('Unknown');

            done();
        });

        it('promotion action type should return name', function(done) {
            mParticle.PromotionType.getName(mParticle.PromotionType.PromotionView).should.equal('Promotion View');
            mParticle.PromotionType.getName(mParticle.PromotionType.PromotionClick).should.equal('Promotion Click');
            mParticle.PromotionType.getName(null).should.equal('Unknown');

            done();
        });

        it('should return false for an invalid identity type and true for a valid identity type', function(done) {
            var invalidResult1 = mParticle.IdentityType.isValid(11);
            var invalidResult2 = mParticle.IdentityType.isValid('5');
            var validResult = mParticle.IdentityType.isValid(1);

            invalidResult1.should.be.false;
            invalidResult2.should.be.false;
            validResult.should.be.true;

            done();
        });
    });

    describe('event logging', function() {
        it('log event requires name', function(done) {
            server.requests = [];
            mParticle.logEvent();


            Should(server.requests).have.lengthOf(0);

            done();
        });

        it('log event requires valid event type', function(done) {
            server.requests = [];
            mParticle.logEvent('test', 100);

            Should(server.requests).have.lengthOf(0);

            done();
        });

        it('event attributes must be object', function(done) {
            mParticle.logEvent('test', null, 1);

            var data = getEvent('test');

            data.should.have.property('attrs', null);

            done();
        });

        it('opting out should prevent events being sent', function(done) {
            mParticle.setOptOut(true);
            server.requests = [];

            mParticle.logEvent('test');
            server.requests.should.have.lengthOf(0);

            done();
        });

        it('should log an event', function(done) {
            window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation, { mykey: 'myvalue' });
            var data = getEvent('Test Event');

            data.should.have.property('n', 'Test Event');
            data.should.have.property('et', mParticle.EventType.Navigation);
            data.should.have.property('attrs');
            data.attrs.should.have.property('mykey', 'myvalue');

            done();
        });

        it('should log an error', function(done) {
            mParticle.logError('my error');

            var data = getEvent('Error');

            Should(data).be.ok();

            data.should.have.property('n', 'Error');
            data.should.have.property('attrs');
            data.attrs.should.have.property('m', 'my error');

            done();
        });

        it('should log an AST with firstRun = true when first visiting a page', function(done) {
            var data = getEvent(MessageType.AppStateTransition);
            data.should.have.property('at', 1);
            data.should.have.property('fr', true);
            data.should.have.property('iu', false);
            if (document.referrer && document.referrer.length > 0) {
                data.should.have.property('lr', window.location.href);
            }

            done();
        });

        it('should log an AST on init with firstRun = false when cookies already exist', function(done) {
            mParticle.reset();
            server.requests = [];

            setLocalStorage(v1localStorageKey, {cookie: 'test', ie: true});

            mParticle.init(apiKey);

            var data2 = getEvent(MessageType.AppStateTransition);
            data2.should.have.property('fr', false);

            done();
        });

        it('should log a page view', function(done) {
            mParticle.logPageView();

            var event = getEvent(window.location.pathname);

            Should(event).be.ok();

            event.should.have.property('attrs');
            event.attrs.should.have.property('hostname', window.location.hostname);
            event.attrs.should.have.property('title', window.document.title);

            done();
        });

        it('should log custom page view', function(done) {
            mParticle.logPageView('My Page View', { testattr: 1 }, {
                'MyCustom.Flag': 'Test'
            });

            var event = getEvent('My Page View');

            event.should.have.property('attrs');
            event.attrs.should.have.property('testattr', 1);

            event.should.have.property('flags');
            event.flags.should.have.property('MyCustom.Flag', ['Test']);

            done();
        });

        it('should parse response after logging event', function(done) {
            server.handle = function(request) {
                request.setResponseHeader('Content-Type', 'application/json');
                request.receive(200, JSON.stringify({
                    Store: {
                        uid: {
                            Expires: new Date(2040, 1, 1),
                            Value: 'blah'
                        }
                    }
                }));
            };

            mParticle.logEvent('test event2');
            mParticle.logEvent('test event');

            var event = getEvent('test event');

            event.should.have.property('str');
            event.str.should.have.property('uid');
            event.str.uid.should.have.property('Value', 'blah');

            done();
        });

        it('should send das with each event logged', function(done) {
            window.mParticle.logEvent('Test Event');
            var data = getEvent('Test Event');

            data.should.have.property('das');
            (data.das.length).should.equal(36);
            done();
        });

        it('should log opt out', function(done) {
            mParticle.setOptOut(true);

            var event = getEvent(MessageType.OptOut);

            event.should.have.property('dt', MessageType.OptOut);
            event.should.have.property('o', true);

            done();
        });

        it('should log log out event', function(done) {
            mParticle.logOut();

            var data = getEvent(MessageType.Profile);

            data.should.have.property('dt', MessageType.Profile);
            data.should.have.property('pet', ProfileMessageType.Logout);

            done();
        });
    });

    describe('eCommerce', function() {
        it('should create ecommerce product', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400, 2);

            product.should.have.property('Name', 'iPhone');
            product.should.have.property('Sku', '12345');
            product.should.have.property('Price', 400);
            product.should.have.property('Quantity', 2);

            done();
        });

        it('should create transaction attributes', function(done) {
            var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345',
                'test-affiliation',
                'coupon-code',
                44334,
                600,
                200);

            transactionAttributes.should.have.property('Id', '12345');
            transactionAttributes.should.have.property('Affiliation', 'test-affiliation');
            transactionAttributes.should.have.property('CouponCode', 'coupon-code');
            transactionAttributes.should.have.property('Revenue', 44334);
            transactionAttributes.should.have.property('Shipping', 600);
            transactionAttributes.should.have.property('Tax', 200);

            done();
        });

        it('should log ecommerce event', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone',
                '12345',
                '400',
                2,
                'Plus',
                'Phones',
                'Apple',
                1,
                'my-coupon-code',
                { customkey: 'customvalue' }),
                transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345',
                    'test-affiliation',
                    'coupon-code',
                    44334,
                    600,
                    200);

            mParticle.eCommerce.logPurchase(transactionAttributes, product);
            var data = getEvent('eCommerce - Purchase');

            data.should.have.property('pd');
            data.pd.should.have.property('an', ProductActionType.Purchase);
            data.pd.should.have.property('ti', '12345');
            data.pd.should.have.property('ta', 'test-affiliation');
            data.pd.should.have.property('tcc', 'coupon-code');
            data.pd.should.have.property('tr', 44334);
            data.pd.should.have.property('ts', 600);
            data.pd.should.have.property('tt', 200);
            data.pd.should.have.property('pl').with.lengthOf(1);

            data.pd.pl[0].should.have.property('id', '12345');
            data.pd.pl[0].should.have.property('nm', 'iPhone');
            data.pd.pl[0].should.have.property('pr', 400);
            data.pd.pl[0].should.have.property('qt', 2);
            data.pd.pl[0].should.have.property('br', 'Apple');
            data.pd.pl[0].should.have.property('va', 'Plus');
            data.pd.pl[0].should.have.property('ca', 'Phones');
            data.pd.pl[0].should.have.property('ps', 1);
            data.pd.pl[0].should.have.property('cc', 'my-coupon-code');
            data.pd.pl[0].should.have.property('tpa', 800);
            data.pd.pl[0].should.have.property('attrs');

            data.pd.pl[0].attrs.should.have.property('customkey', 'customvalue');

            done();
        });

        it('should log badly formed ecommerce event', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone',
                '12345',
                Infinity,
                '2-foo',
                'Plus',
                'Phones',
                'Apple',
                '1-foo',
                'my-coupon-code',
                { customkey: 'customvalue' }),
                transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345',
                    'test-affiliation',
                    'coupon-code',
                    '44334-foo',
                    '600-foo',
                    '200-foo');

            mParticle.eCommerce.logPurchase(transactionAttributes, product);
            var data = getEvent('eCommerce - Purchase');

            data.should.have.property('pd');
            data.pd.should.have.property('an', ProductActionType.Purchase);
            data.pd.should.have.property('ti', '12345');
            data.pd.should.have.property('ta', 'test-affiliation');
            data.pd.should.have.property('tcc', 'coupon-code');
            data.pd.should.have.property('tr', 0);
            data.pd.should.have.property('ts', 0);
            data.pd.should.have.property('tt', 0);
            data.pd.should.have.property('pl').with.lengthOf(1);

            data.pd.pl[0].should.have.property('id', '12345');
            data.pd.pl[0].should.have.property('nm', 'iPhone');
            data.pd.pl[0].should.have.property('pr', 0);
            data.pd.pl[0].should.have.property('qt', 0);
            data.pd.pl[0].should.have.property('br', 'Apple');
            data.pd.pl[0].should.have.property('va', 'Plus');
            data.pd.pl[0].should.have.property('ca', 'Phones');
            data.pd.pl[0].should.have.property('ps', 0);
            data.pd.pl[0].should.have.property('cc', 'my-coupon-code');
            data.pd.pl[0].should.have.property('tpa', 0);
            data.pd.pl[0].should.have.property('attrs');

            data.pd.pl[0].attrs.should.have.property('customkey', 'customvalue');

            done();
        });

        it('logPurchase should support array of products', function(done) {
            var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
                product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1),
                transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345');

            mParticle.eCommerce.logPurchase(transactionAttributes, [product1, product2]);
            var data = getEvent('eCommerce - Purchase');

            data.should.have.property('pd');
            data.pd.should.have.property('pl').with.lengthOf(2);
            data.pd.pl[0].should.have.property('nm', 'iPhone');
            data.pd.pl[1].should.have.property('nm', 'Android');

            done();
        });

        it('logRefund should support array of products', function(done) {
            var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
                product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1),
                transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345');

            mParticle.eCommerce.logRefund(transactionAttributes, [product1, product2]);
            var data = getEvent('eCommerce - Refund');

            data.should.have.property('pd');
            data.pd.should.have.property('an', ProductActionType.Refund);
            data.pd.should.have.property('pl').with.lengthOf(2);
            data.pd.pl[0].should.have.property('nm', 'iPhone');
            data.pd.pl[1].should.have.property('nm', 'Android');

            done();
        });

        it('should create promotion', function(done) {
            var promotion = mParticle.eCommerce.createPromotion('12345', 'my-creative', 'creative-name', 1);

            Should(promotion).be.ok();

            promotion.should.have.property('Id', '12345');
            promotion.should.have.property('Creative', 'my-creative');
            promotion.should.have.property('Name', 'creative-name');
            promotion.should.have.property('Position', 1);

            done();
        });

        it('should log promotion click', function(done) {
            var promotion = mParticle.eCommerce.createPromotion('12345', 'my-creative', 'creative-name', 1);

            mParticle.eCommerce.logPromotion(mParticle.PromotionType.PromotionClick, promotion);

            var event = getEvent('eCommerce - PromotionClick');

            Should(event).be.ok();

            event.should.have.property('et', CommerceEventType.PromotionClick);
            event.should.have.property('pm');
            event.pm.should.have.property('an', PromotionActionType.PromotionClick);
            event.pm.should.have.property('pl');
            event.pm.pl[0].should.have.property('id', '12345');
            event.pm.pl[0].should.have.property('nm', 'creative-name');
            event.pm.pl[0].should.have.property('cr', 'my-creative');
            event.pm.pl[0].should.have.property('ps', 1);

            done();
        });

        it('should create impression', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
                impression = mParticle.eCommerce.createImpression('impression-name', product);

            impression.should.have.property('Name', 'impression-name');
            impression.should.have.property('Product');
            impression.Product.should.have.property('Sku', '12345');

            done();
        });

        it('should log impression event', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
                impression = mParticle.eCommerce.createImpression('impression-name', product);

            mParticle.eCommerce.logImpression(impression);

            var event = getEvent('eCommerce - Impression');

            Should(event).be.ok();

            event.should.have.property('pi').with.lengthOf(1);
            event.pi[0].should.have.property('pil', 'impression-name');
            event.pi[0].should.have.property('pl').with.lengthOf(1);
            event.pi[0].pl[0].should.have.property('id', '12345');

            done();
        });

        it('should log multiple impression when an array of impressions is passed', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
                impression = mParticle.eCommerce.createImpression('impression-name1', product),
                product2 = mParticle.eCommerce.createProduct('Android', '23456', 200),
                impression2 = mParticle.eCommerce.createImpression('impression-name2', product2);

            mParticle.eCommerce.logImpression([impression, impression2]);
            var event1 = getEvent('eCommerce - Impression');

            event1.should.have.property('pi').with.lengthOf(2);
            event1.pi[0].should.have.property('pil', 'impression-name1');
            event1.pi[0].should.have.property('pl').with.lengthOf(1);
            event1.pi[0].pl[0].should.have.property('id', '12345');

            event1.pi[1].should.have.property('pil', 'impression-name2');
            event1.pi[1].should.have.property('pl').with.lengthOf(1);
            event1.pi[1].pl[0].should.have.property('id', '23456');

            done();
        });

        it('should log ecommerce refund', function(done) {
            var transaction = mParticle.eCommerce.createTransactionAttributes('12345');

            mParticle.eCommerce.logRefund(transaction);

            var event = getEvent('eCommerce - Refund');

            Should(event).be.ok();

            event.should.have.property('pd');
            event.pd.should.have.property('an', ProductActionType.Refund);
            event.pd.should.have.property('ti', '12345');

            done();
        });

        it('should add products to cart', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

            mParticle.eCommerce.Cart.add(product, true);

            var data = getEvent('eCommerce - AddToCart');

            data.should.have.property('pd');
            data.pd.should.have.property('an', ProductActionType.AddToCart);
            data.pd.should.have.property('pl').with.lengthOf(1);
            data.pd.pl[0].should.have.property('id', '12345');

            done();
        });

        it('should remove products from cart', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

            mParticle.eCommerce.Cart.add(product);
            mParticle.eCommerce.Cart.remove({ Sku: '12345' }, true);

            var data = getEvent('eCommerce - RemoveFromCart');

            data.should.have.property('pd');
            data.pd.should.have.property('an', ProductActionType.RemoveFromCart);
            data.pd.should.have.property('pl').with.lengthOf(1);
            data.pd.pl[0].should.have.property('id', '12345');

            done();
        });

        it('should update cart products in cookies after adding/removing product to/from a cart and clearing cart', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
            mParticle.eCommerce.Cart.add(product);
            var cookiesAfterAdding1 = mParticle.persistence.getLocalStorage();

            cookiesAfterAdding1.cp[0].should.have.properties(['Name', 'Sku', 'Price']);

            mParticle.eCommerce.Cart.remove(product);
            var cookiesAfterRemoving = mParticle.persistence.getLocalStorage();

            cookiesAfterRemoving.should.not.have.property('cp');

            mParticle.eCommerce.Cart.add(product);
            var cookiesAfterAdding2 = mParticle.persistence.getLocalStorage();

            cookiesAfterAdding2.cp[0].should.have.properties(['Name', 'Sku', 'Price']);

            mParticle.eCommerce.Cart.clear();
            var cookiesAfterClearing = mParticle.persistence.getLocalStorage();

            cookiesAfterClearing.should.not.have.property('cp');

            done();
        });

        it('should update cookies properly after each product add/removal from cart', function(done) {
            mParticle.reset();
            mParticle.useCookieStorage = true;
            mParticle.init(apiKey);
            var product1 = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
            var product2 = mParticle.eCommerce.createProduct('Android', '12345', 400);
            var product3 = mParticle.eCommerce.createProduct('Windows', '12345', 400);

            mParticle.eCommerce.Cart.add(product1);
            mParticle.eCommerce.Cart.add(product2);
            mParticle.eCommerce.Cart.add(product3);

            var cartProducts1 = getLocalStorage(currentLSKey).cp;
            cartProducts1.length.should.equal(3);

            mParticle.eCommerce.Cart.remove(product3);
            var cartProducts2 = getLocalStorage(currentLSKey).cp;
            cartProducts2.length.should.equal(2);

            mParticle.eCommerce.Cart.remove(product3);
            var cartProducts3 = getLocalStorage(currentLSKey).cp;
            cartProducts3.length.should.equal(1);

            mParticle.eCommerce.Cart.remove(product3);
            Should(getLocalStorage(currentLSKey)).not.be.ok();

            mParticle.reset();
            mParticle.useCookieStorage = false;

            mParticle.init(apiKey);

            mParticle.eCommerce.Cart.add(product1);
            mParticle.eCommerce.Cart.add(product2);
            mParticle.eCommerce.Cart.add(product3);

            cartProducts1 = getLocalStorage(currentCookieVersion).cp;
            cartProducts1.length.should.equal(3);

            mParticle.eCommerce.Cart.remove(product3);
            cartProducts2 = getLocalStorage(currentCookieVersion).cp;
            cartProducts2.length.should.equal(2);

            mParticle.eCommerce.Cart.remove(product3);
            cartProducts3 = getLocalStorage(currentCookieVersion).cp;
            cartProducts3.length.should.equal(1);

            mParticle.eCommerce.Cart.remove(product3);
            getLocalStorage(currentLSKey).should.not.have.property('cp');

            done();
        });

        it('should not add the (mParticle.maxProducts + 1st) item to cookie cartItems, but still persist all items in memory for logging', function(done) {
            var product = mParticle.eCommerce.createProduct('Product', '12345', 400);
            for (var i = 0; i < mParticle.maxProducts; i++) {
                mParticle.eCommerce.Cart.add(product);
            }

            mParticle.eCommerce.Cart.add(mParticle.eCommerce.createProduct('Product21', '12345', 400));
            var cookiesAfterAdding = mParticle.persistence.getLocalStorage();
            var foundProductInCookies = cookiesAfterAdding.cp.filter(function(product) {
                return product.Name === 'Product21';
            })[0];

            cookiesAfterAdding.cp.length.should.equal(20);
            Should(foundProductInCookies).not.be.ok();

            // Events log with in memory data, so product bag has 21 and product is found in memory
            mParticle.eCommerce.logCheckout();
            var event = getEvent('eCommerce - Checkout');
            var foundProductInMemory = event.pd.pl.filter(function(product) {
                return product.nm === 'Product21';
            })[0];

            event.pd.pl.length.should.equal(21);
            foundProductInMemory.nm.should.equal('Product21');

            done();
        });

        it('should add product to product bag', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

            mParticle.eCommerce.ProductBags.add(ProductBag, product);

            mParticle.logEvent('my event');

            var event = getEvent('my event');

            Should(event).be.ok();

            event.should.have.property('pb');

            event.pb.should.have.property(ProductBag);
            event.pb[ProductBag].should.have.property('pl').with.lengthOf(1);
            event.pb[ProductBag].pl[0].should.have.property('id', '12345');

            done();
        });

        it('should remove product from product bag', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
            mParticle.eCommerce.ProductBags.add(ProductBag, product);
            mParticle.eCommerce.ProductBags.remove(ProductBag, product);

            mParticle.logEvent('my event');

            var event = getEvent('my event');

            Should(event).be.ok();

            event.should.have.property('pb');

            event.pb.should.have.property(ProductBag);
            event.pb[ProductBag].should.have.property('pl').with.lengthOf(0);

            done();
        });

        it('should clear product bag', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
            mParticle.eCommerce.ProductBags.add(ProductBag, product);
            mParticle.eCommerce.ProductBags.clear(ProductBag);

            mParticle.logEvent('my event');

            var event = getEvent('my event');

            Should(event).be.ok();

            event.should.have.property('pb');

            event.pb.should.have.property(ProductBag);
            event.pb[ProductBag].should.have.property('pl').with.lengthOf(0);

            done();
        });

        it('should update product bags in storage after adding/removing product to/from a product bag and clearing product bag', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
            mParticle.eCommerce.ProductBags.add(ProductBag, product);
            var cookiesAfterAdding1 = mParticle.persistence.getLocalStorage();

            cookiesAfterAdding1.pb[ProductBag][0].should.have.properties(['Name', 'Sku', 'Price']);

            mParticle.eCommerce.ProductBags.remove(ProductBag, product);
            var cookiesAfterRemoving = mParticle.persistence.getLocalStorage();

            Object.keys(cookiesAfterRemoving.pb[ProductBag]).length.should.equal(0);

            mParticle.eCommerce.ProductBags.add(ProductBag, product);
            var cookiesAfterAdding2 = mParticle.persistence.getLocalStorage();

            cookiesAfterAdding2.pb[ProductBag][0].should.have.properties(['Name', 'Sku', 'Price']);

            mParticle.eCommerce.ProductBags.clear(ProductBag);
            var cookiesAfterClearing = mParticle.persistence.getLocalStorage();

            Object.keys(cookiesAfterClearing.pb[ProductBag]).length.should.equal(0);

            done();
        });

        it('should not add the (mParticle.maxProducts + 1st) item to productBags, but still persist all items in memory for logging', function(done) {
            var product = mParticle.eCommerce.createProduct('Product', '12345', 400);
            for (var i = 0; i < mParticle.maxProducts; i++) {
                mParticle.eCommerce.ProductBags.add(ProductBag, product);
            }
            mParticle.eCommerce.ProductBags.add(ProductBag, mParticle.eCommerce.createProduct('Product21', '54321', 100));
            var cookiesAfterAdding = mParticle.persistence.getLocalStorage();
            var foundProductInCookies = cookiesAfterAdding.pb[ProductBag].filter(function(product) {
                return product.Name === 'Product21';
            })[0];

            cookiesAfterAdding.pb[ProductBag].length.should.equal(20);
            Should(foundProductInCookies).not.be.ok();

            // Events log with in memory data, so in memory productBag should have 21 and product is found in memory
            mParticle.eCommerce.logCheckout();
            var event = getEvent('eCommerce - Checkout');
            var foundProductInMemory = event.pb[ProductBag].pl.filter(function(product) {
                return product.nm === 'Product21';
            })[0];

            event.pb[ProductBag].pl.length.should.equal(21);
            foundProductInMemory.nm.should.equal('Product21');

            done();
        });

        it('should not add products to invalid productBags', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
            mParticle.eCommerce.ProductBags.add(null, product);
            mParticle.eCommerce.ProductBags.add(undefined, product);
            mParticle.eCommerce.ProductBags.add({key: 'value'}, product);
            mParticle.eCommerce.ProductBags.add([1, 2, 3], product);

            mParticle.logEvent('my event');

            var event = getEvent('my event');

            Should(event).be.ok();

            event.should.have.property('pb');
            Object.keys(event.pb).length.should.equal(0);

            done();
        });

        it('should log checkout', function(done) {
            mParticle.eCommerce.logCheckout(1, 'Visa');

            var event = getEvent('eCommerce - Checkout');

            Should(event).be.ok();

            event.should.have.property('et', CommerceEventType.ProductCheckout);
            event.should.have.property('pd');

            event.pd.should.have.property('an', ProductActionType.Checkout);
            event.pd.should.have.property('cs', 1);
            event.pd.should.have.property('co', 'Visa');

            done();
        });

        it('should log checkout option', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
            server.requests = [];
            mParticle.eCommerce.logProductAction(ProductActionType.CheckoutOption, product, {color: 'blue'});

            var event = getEvent('eCommerce - CheckoutOption');

            Should(event).be.ok();

            event.should.have.property('et', CommerceEventType.ProductCheckoutOption);
            event.should.have.property('pd');

            event.pd.should.have.property('an', ProductActionType.CheckoutOption);
            event.attrs.should.have.property('color', 'blue');
            done();
        });

        it('should log product action', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

            mParticle.eCommerce.logProductAction(ProductActionType.ViewDetail, product);

            var event = getEvent('eCommerce - ViewDetail');

            event.should.have.property('et', CommerceEventType.ProductViewDetail);
            event.should.have.property('pd');
            event.pd.should.have.property('an', ProductActionType.ViewDetail);
            event.pd.should.have.property('pl').with.lengthOf(1);
            event.pd.pl[0].should.have.property('id', '12345');

            Should(event).be.ok();

            done();
        });

        it('should log legacy ecommerce transaction', function(done) {
            mParticle.logEcommerceTransaction('iPhone',
                '12345',
                400,
                1,
                'Phone',
                500,
                50,
                50,
                'USD',
                'affiliation',
                '11223344');

            var event = getEvent('Ecommerce');

            event.should.have.property('dt', MessageType.PageEvent);
            event.should.have.property('et', mParticle.EventType.Transaction);

            event.attrs.should.have.property('$MethodName', 'LogEcommerceTransaction');
            event.attrs.should.have.property('ProductName', 'iPhone');
            event.attrs.should.have.property('ProductSKU', '12345');
            event.attrs.should.have.property('ProductUnitPrice', 400);
            event.attrs.should.have.property('ProductQuantity', 1);
            event.attrs.should.have.property('ProductCategory', 'Phone');
            event.attrs.should.have.property('RevenueAmount', 500);
            event.attrs.should.have.property('TaxAmount', 50);
            event.attrs.should.have.property('ShippingAmount', 50);
            event.attrs.should.have.property('CurrencyCode', 'USD');
            event.attrs.should.have.property('TransactionAffiliation', 'affiliation');
            event.attrs.should.have.property('TransactionID', '11223344');

            done();
        });

        it('should invoke native sdk method addToCart', function(done) {
            mParticle.reset();
            window.mParticleAndroid = new mParticleAndroid();

            mParticle.eCommerce.Cart.add({});

            window.mParticleAndroid.should.have.property('addToCartCalled', true);

            done();
        });

        it('should invoke native sdk method removeFromCart', function(done) {
            mParticle.reset();
            window.mParticleAndroid = new mParticleAndroid();

            mParticle.eCommerce.Cart.add({ Sku: '12345' });
            mParticle.eCommerce.Cart.remove({ Sku: '12345' });

            window.mParticleAndroid.should.have.property('removeFromCartCalled', true);

            done();
        });

        it('should invoke native sdk method clearCart', function(done) {
            mParticle.reset();
            window.mParticleAndroid = new mParticleAndroid();

            mParticle.eCommerce.Cart.clear();

            window.mParticleAndroid.should.have.property('clearCartCalled', true);

            done();
        });

        it('should invoke native sdk method addToProductBag', function(done) {
            mParticle.reset();
            window.mParticleAndroid = new mParticleAndroid();

            mParticle.eCommerce.ProductBags.add(ProductBag, {});

            window.mParticleAndroid.should.have.property('addToProductBagCalled', true);

            done();
        });

        it('should invoke native sdk method removeFromProductBag', function(done) {
            mParticle.reset();
            window.mParticleAndroid = new mParticleAndroid();

            mParticle.eCommerce.ProductBags.remove(ProductBag, {});

            window.mParticleAndroid.should.have.property('removeFromProductBagCalled', true);

            done();
        });

        it('should invoke native sdk method clearProductBag', function(done) {
            mParticle.reset();
            window.mParticleAndroid = new mParticleAndroid();

            mParticle.eCommerce.ProductBags.clear(ProductBag);

            window.mParticleAndroid.should.have.property('clearProductBagCalled', true);

            done();
        });

        it('should fail to create product if name not a string', function(done) {
            var product = mParticle.eCommerce.createProduct(null);
            var product2 = mParticle.eCommerce.createProduct(undefined);
            var product3 = mParticle.eCommerce.createProduct(['product']);
            var product4 = mParticle.eCommerce.createProduct(123);
            var product5 = mParticle.eCommerce.createProduct({key: 'value'});

            Should(product).not.be.ok();
            Should(product2).not.be.ok();
            Should(product3).not.be.ok();
            Should(product4).not.be.ok();
            Should(product5).not.be.ok();

            done();
        });

        it('should fail to create product if sku not a string or a number', function(done) {
            var product = mParticle.eCommerce.createProduct('test', null);
            var product2 = mParticle.eCommerce.createProduct('test', {key: 'value'});
            var product3 = mParticle.eCommerce.createProduct('test', []);
            var product4 = mParticle.eCommerce.createProduct('test', undefined);

            Should(product).not.be.ok();
            Should(product2).not.be.ok();
            Should(product3).not.be.ok();
            Should(product4).not.be.ok();

            done();
        });

        it('should fail to create product if price not a string or number', function(done) {
            var product = mParticle.eCommerce.createProduct('test', 'sku', null);
            var product2 = mParticle.eCommerce.createProduct('test', 'sku', null);
            var product3 = mParticle.eCommerce.createProduct('test', 'sku', null);
            var product4 = mParticle.eCommerce.createProduct('test', 'sku', null);

            Should(product).not.be.ok();
            Should(product2).not.be.ok();
            Should(product3).not.be.ok();
            Should(product4).not.be.ok();

            done();
        });

        it('should fail to create impression if name is not specified', function(done) {
            var impression = mParticle.eCommerce.createImpression(null);

            Should(impression).not.be.ok();

            done();
        });

        it('should fail to create impression if product is not specified', function(done) {
            var impression = mParticle.eCommerce.createImpression('name', null);

            Should(impression).not.be.ok();

            done();
        });

        it('should support logLTVIncrease function', function(done) {
            mParticle.logLTVIncrease(100, 'Bought Something');

            var event = getEvent('Bought Something');

            Should(event).be.ok();

            event.should.have.property('dt', MessageType.PageEvent);
            event.should.have.property('et', mParticle.EventType.Transaction);

            event.should.have.property('attrs');
            event.attrs.should.have.property('$Amount', 100);
            event.attrs.should.have.property('$MethodName', 'LogLTVIncrease');

            done();
        });

        it('should default logLTVIncrease event name', function(done) {
            mParticle.logLTVIncrease(100);

            var event = getEvent('Increase LTV');

            Should(event).be.ok();

            event.should.have.property('attrs');
            event.attrs.should.have.property('$Amount', 100);

            done();
        });

        it('should not logLTVIncrease when no amount or an invalid amount is passed', function(done) {
            mParticle.logLTVIncrease();
            var event = getEvent('Increase LTV');

            mParticle.logLTVIncrease('error');
            var event2 = getEvent('Increase LTV');

            Should(event).not.be.ok();
            Should(event2).not.be.ok();

            done();
        });

        it('expand product purchase commerce event', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure({
                name: 'MockCommerceForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });
            mParticle.init(apiKey);
            mParticle.eCommerce.setCurrencyCode('foo-currency');
            var productAttributes = {};
            productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

            var eventAttributes = {};
            eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

            var product = mParticle.eCommerce.createProduct('Foo name',
                        'Foo sku',
                        100.00,
                        4, 'foo-variant', 'foo-category', 'foo-brand', 'foo-position', 'foo-productcouponcode', productAttributes);

            var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('foo-transaction-id', 'foo-affiliation', 'foo-couponcode', 400, 10, 8);
            mParticle.eCommerce.logPurchase(transactionAttributes, product, false, eventAttributes);
            mockForwarder.instance.receivedEvent.should.have.property('ProductAction');
            var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
            expandedEvents.should.be.instanceof(Array).and.have.lengthOf(2);

            var plusOneEvent = expandedEvents[0];
            plusOneEvent.should.have.property('EventName', 'eCommerce - Purchase - Total');
            plusOneEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
            var attributes = plusOneEvent.EventAttributes;
            attributes.should.have.property('Transaction Id', 'foo-transaction-id');
            attributes.should.have.property('Affiliation', 'foo-affiliation');
            attributes.should.have.property('Coupon Code', 'foo-couponcode');
            attributes.should.have.property('Total Amount', 400);
            attributes.should.have.property('Shipping Amount', 10);
            attributes.should.have.property('Product Count', 1);
            attributes.should.have.property('Tax Amount', 8);
            attributes.should.have.property('Currency Code', 'foo-currency');
            attributes.should.have.property('foo-event-attribute-key', 'foo-event-attribute-value');

            var productEvent = expandedEvents[1];
            productEvent.should.have.property('EventName', 'eCommerce - Purchase - Item');
            productEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
            attributes = productEvent.EventAttributes;
            attributes.should.not.have.property('Affiliation');
            attributes.should.not.have.property('Total Amount');
            attributes.should.not.have.property('Shipping Amount');
            attributes.should.not.have.property('Tax Amount');
            attributes.should.have.property('foo-event-attribute-key');
            attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
            attributes.should.have.property('Brand', 'foo-brand');
            attributes.should.have.property('Category', 'foo-category');
            attributes.should.have.property('Name', 'Foo name');
            attributes.should.have.property('Id', 'Foo sku');
            attributes.should.have.property('Item Price', 100.00);
            attributes.should.have.property('Quantity', 4);
            attributes.should.have.property('Position', 'foo-position');
            attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');

            done();
        });

        it('expand product refund commerce event', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure({
                name: 'MockCommerceForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });
            mParticle.init(apiKey);

            var productAttributes = {};
            productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

            var eventAttributes = {};
            eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

            var product = mParticle.eCommerce.createProduct('Foo name',
                        'Foo sku',
                        100.00,
                        4, 'foo-brand', 'foo-variant', 'foo-category', 'foo-position', 'foo-productcouponcode', productAttributes);

            var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('foo-transaction-id', 'foo-affiliation', 'foo-couponcode', 400, 10, 8);
            mParticle.eCommerce.logRefund(transactionAttributes, product, false, eventAttributes);
            mockForwarder.instance.receivedEvent.should.have.property('ProductAction');
            var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
            expandedEvents.should.be.instanceof(Array).and.have.lengthOf(2);

            var plusOneEvent = expandedEvents[0];
            plusOneEvent.should.have.property('EventName', 'eCommerce - Refund - Total');
            var attributes = plusOneEvent.EventAttributes;
            attributes.should.have.property('Product Count', 1);

            var productEvent = expandedEvents[1];
            productEvent.should.have.property('EventName', 'eCommerce - Refund - Item');

            done();
        });

        it('expand non-plus-one-product commerce event', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure({
                name: 'MockCommerceForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });
            mParticle.init(apiKey);
            var productAttributes = {};
            productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

            var eventAttributes = {};
            eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

            var product = mParticle.eCommerce.createProduct('Foo name',
                        'Foo sku',
                        100.00,
                        4, 'foo-variant', 'foo-category', 'foo-brand', 'foo-position', 'foo-productcouponcode', productAttributes);

            mParticle.eCommerce.logProductAction(mParticle.ProductActionType.RemoveFromWishlist, product, eventAttributes);
            mockForwarder.instance.receivedEvent.should.have.property('ProductAction');
            var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
            expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

            var productEvent = expandedEvents[0];
            productEvent.should.have.property('EventName', 'eCommerce - RemoveFromWishlist - Item');
            productEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
            var attributes = productEvent.EventAttributes;

            attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
            attributes.should.have.property('Brand', 'foo-brand');
            attributes.should.have.property('Category', 'foo-category');
            attributes.should.have.property('Name', 'Foo name');
            attributes.should.have.property('Id', 'Foo sku');
            attributes.should.have.property('Item Price', 100.00);
            attributes.should.have.property('Quantity', 4);
            attributes.should.have.property('Position', 'foo-position');
            attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');

            done();
        });

        it('expand checkout commerce event', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure({
                name: 'MockCommerceForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });
            mParticle.init(apiKey);

            var eventAttributes = {};
            eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

            var productAttributes = {};
            productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

            var product = mParticle.eCommerce.createProduct('Foo name',
                        'Foo sku',
                        100.00,
                        4, 'foo-variant', 'foo-category', 'foo-brand', 'foo-position', 'foo-productcouponcode', productAttributes);

            mParticle.eCommerce.Cart.add(product, true);
            mParticle.eCommerce.logCheckout('foo-step', 'foo-options', eventAttributes);
            mockForwarder.instance.receivedEvent.should.have.property('ProductAction');
            var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
            expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

            var productEvent = expandedEvents[0];
            productEvent.should.have.property('EventName', 'eCommerce - Checkout - Item');
            productEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
            var attributes = productEvent.EventAttributes;

            attributes.should.have.property('Checkout Step', 'foo-step');
            attributes.should.have.property('Checkout Options', 'foo-options');
            attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
            attributes.should.have.property('Brand', 'foo-brand');
            attributes.should.have.property('Category', 'foo-category');
            attributes.should.have.property('Name', 'Foo name');
            attributes.should.have.property('Id', 'Foo sku');
            attributes.should.have.property('Item Price', 100.00);
            attributes.should.have.property('Quantity', 4);
            attributes.should.have.property('Position', 'foo-position');
            attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');

            done();
        });

        it('expand promotion commerce event', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure({
                name: 'MockCommerceForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });
            mParticle.init(apiKey);

            var eventAttributes = {};
            eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

            var promotion = mParticle.eCommerce.createPromotion('foo-id', 'foo-creative', 'foo-name', 'foo-position');
            mParticle.eCommerce.logPromotion(mParticle.PromotionType.PromotionClick, promotion, eventAttributes);
            mockForwarder.instance.receivedEvent.should.have.property('PromotionAction');
            var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
            expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

            var promotionEvent = expandedEvents[0];
            promotionEvent.should.have.property('EventName', 'eCommerce - click - Item');
            promotionEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
            var attributes = promotionEvent.EventAttributes;

            attributes.should.have.property('Id', 'foo-id');
            attributes.should.have.property('Creative', 'foo-creative');
            attributes.should.have.property('Name', 'foo-name');
            attributes.should.have.property('Position', 'foo-position');
            attributes.should.have.property('foo-event-attribute-key', 'foo-event-attribute-value');

            done();
        });


        it('expand null commerce event', function(done) {
            var expandedEvents = mParticle.eCommerce.expandCommerceEvent(null);
            (expandedEvents == null).should.be.true;

            done();
        });

        it('expand impression commerce event', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure({
                name: 'MockCommerceForwarder',
                settings: {},
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true
            });
            mParticle.init(apiKey);

            var productAttributes = {};
            productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

            var eventAttributes = {};
            eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

            var product = mParticle.eCommerce.createProduct('Foo name',
                        'Foo sku',
                        100.00,
                        4, 'foo-variant', 'foo-category', 'foo-brand', 'foo-position', 'foo-productcouponcode', productAttributes);

            var impression = mParticle.eCommerce.createImpression('suggested products list', product);

            mParticle.eCommerce.logImpression(impression, eventAttributes);
            mockForwarder.instance.receivedEvent.should.have.property('ProductImpressions');
            var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);

            expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

            var impressionEvent = expandedEvents[0];
            impressionEvent.should.have.property('EventName', 'eCommerce - Impression - Item');
            impressionEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
            var attributes = impressionEvent.EventAttributes;

            attributes.should.have.property('Product Impression List', 'suggested products list');
            attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
            attributes.should.have.property('Brand', 'foo-brand');
            attributes.should.have.property('Category', 'foo-category');
            attributes.should.have.property('Name', 'Foo name');
            attributes.should.have.property('Id', 'Foo sku');
            attributes.should.have.property('Item Price', 100.00);
            attributes.should.have.property('Quantity', 4);
            attributes.should.have.property('Position', 'foo-position');
            attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');
            attributes.should.have.property('foo-event-attribute-key', 'foo-event-attribute-value');

            done();
        });

        it('should set product position to 0 if null', function(done) {
            var product = mParticle.eCommerce.createProduct('iPhone',
                '12345',
                400,
                2,
                'Apple',
                'Plus',
                'Phones'),
                transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345',
                    'test-affiliation',
                    'coupon-code',
                    44334,
                    600,
                    200);

            mParticle.eCommerce.logPurchase(transactionAttributes, product);
            var data = getEvent('eCommerce - Purchase');

            data.pd.pl[0].should.have.property('ps', 0);

            done();
        });

        it('should support array of products when adding to cart', function(done) {
            mParticle.reset();
            mParticle.init(apiKey);

            var product1 = mParticle.eCommerce.createProduct('iPhone', '12345', 400, 2),
                product2 = mParticle.eCommerce.createProduct('Nexus', '67890', 300, 1);

            mParticle.eCommerce.Cart.add([product1, product2], true);

            var event = getEvent('eCommerce - AddToCart');

            Should(event).be.ok();

            event.should.have.property('pd');
            event.pd.should.have.property('an', ProductActionType.AddToCart);
            event.pd.should.have.property('pl').with.lengthOf(2);

            event.pd.pl[0].should.have.property('id', '12345');
            event.pd.pl[0].should.have.property('nm', 'iPhone');

            event.pd.pl[1].should.have.property('id', '67890');
            event.pd.pl[1].should.have.property('nm', 'Nexus');

            done();
        });

        it('should support a single product when adding to cart', function(done) {
            mParticle.reset();
            mParticle.init(apiKey);

            var product1 = mParticle.eCommerce.createProduct('iPhone', '12345', 400, 2);

            mParticle.eCommerce.Cart.add(product1, true);

            var event = getEvent('eCommerce - AddToCart');

            Should(event).be.ok();

            event.should.have.property('pd');
            event.pd.should.have.property('an', ProductActionType.AddToCart);
            event.pd.should.have.property('pl').with.lengthOf(1);

            event.pd.pl[0].should.have.property('id', '12345');
            event.pd.pl[0].should.have.property('nm', 'iPhone');

            done();
        });
    });

    describe('identities and attributes', function() {
        it('should trigger UIC while setting user identity', function(done) {
            mParticle.reset();
            mParticle.init(apiKey);
            var changed = mParticle.setUserIdentity('foo', mParticle.IdentityType.CustomerId);
            changed.should.be.ok();

            changed = mParticle.setUserIdentity('foo', mParticle.IdentityType.CustomerId);
            changed.should.not.be.ok();

            changed = mParticle.setUserIdentity('bar', mParticle.IdentityType.CustomerId);
            changed.should.be.ok();

            changed = mParticle.setUserIdentity(null, mParticle.IdentityType.CustomerId);
            changed.should.be.ok();

            changed = mParticle.setUserIdentity(null, mParticle.IdentityType.CustomerId);
            changed.should.not.be.ok();

            done();
        });

        it('should trigger UIC while removing user identity', function(done) {
            mParticle.reset();
            mParticle.init(apiKey);

            var changed = mParticle.setUserIdentity('foo customer id', mParticle.IdentityType.CustomerId);
            changed.should.be.ok();

            changed = mParticle.setUserIdentity('foo email', mParticle.IdentityType.Email);
            changed.should.be.ok();

            changed = mParticle.removeUserIdentity(null, mParticle.IdentityType.CustomerId);
            changed.should.be.ok();

            changed = mParticle.removeUserIdentity(null, mParticle.IdentityType.CustomerId);
            changed.should.not.be.ok();

            changed = mParticle.removeUserIdentity('foo email');
            changed.should.be.ok();

            done();
        });

        it('should add string or number user identities', function(done) {
            mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);
            mParticle.setUserIdentity(123456, mParticle.IdentityType.Email);

            var identity = mParticle.getUserIdentity('test@mparticle.com');

            identity.should.have.property('Identity', 'test@mparticle.com');
            identity.should.have.property('Type', mParticle.IdentityType.CustomerId);

            identity = mParticle.getUserIdentity(123456);

            identity.should.have.property('Identity', 123456);
            identity.should.have.property('Type', mParticle.IdentityType.Email);

            done();
        });

        it('should ignore object user identities', function(done) {
            mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);

            var identity = mParticle.getUserIdentity('test@mparticle.com');

            identity.should.have.property('Identity', 'test@mparticle.com');
            identity.should.have.property('Type', mParticle.IdentityType.CustomerId);

            mParticle.setUserIdentity({}, mParticle.IdentityType.CustomerId);
            identity = mParticle.getUserIdentity('test@mparticle.com');

            identity.should.have.property('Identity', 'test@mparticle.com');

            done();
        });

        it('should ignore array user identities', function(done) {
            mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);

            var identity = mParticle.getUserIdentity('test@mparticle.com');

            identity.should.have.property('Identity', 'test@mparticle.com');
            identity.should.have.property('Type', mParticle.IdentityType.CustomerId);

            mParticle.setUserIdentity([], mParticle.IdentityType.CustomerId);
            identity = mParticle.getUserIdentity('test@mparticle.com');

            identity.should.have.property('Identity', 'test@mparticle.com');

            done();
        });

        it('should ignore boolean user identities', function(done) {
            mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);

            var identity = mParticle.getUserIdentity('test@mparticle.com');

            identity.should.have.property('Identity', 'test@mparticle.com');
            identity.should.have.property('Type', mParticle.IdentityType.CustomerId);

            mParticle.setUserIdentity(false, mParticle.IdentityType.CustomerId);
            identity = mParticle.getUserIdentity('test@mparticle.com');

            identity.should.have.property('Identity', 'test@mparticle.com');

            done();
        });

        it('should remove user identities by id', function(done) {
            mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);
            mParticle.removeUserIdentity('test@mparticle.com');

            var identity = mParticle.getUserIdentity('test@mparticle.com');

            Should(identity).not.be.ok();

            done();
        });

        it('should replace existing userIdentities of the same type', function(done) {
            mParticle.reset();

            setCookie(v1CookieKey, {
                ui: [{Identity: 123, Type: 0}, {Identity:123, Type: 2}],
                ie: true
            });
            mParticle.init(apiKey);

            mParticle.setUserIdentity(123, mParticle.IdentityType.CustomerId);

            var identity = mParticle.getUserIdentity(123);

            identity.should.have.property('Type', 1);
            identity.should.have.property('Identity', 123);

            done();
        });

        it('should replace previous userIdentities when setting multiple identities of the same type', function(done) {
            mParticle.setUserIdentity('user1@mparticle.com', mParticle.IdentityType.CustomerId);
            mParticle.setUserIdentity('user2@mparticle.com', mParticle.IdentityType.CustomerId);

            var identity1 = mParticle.getUserIdentity('user1@mparticle.com');
            var identity2 = mParticle.getUserIdentity('user2@mparticle.com');

            Should(identity1).not.be.ok();
            Should(identity2).be.ok();

            done();
        });

        it('should remove userIdentity of specified type when null is passed in as id', function(done) {
            mParticle.reset();

            mParticle.init(apiKey);

            mParticle.setUserIdentity('facebookid', mParticle.IdentityType.Facebook);
            var identity1 = mParticle.getUserIdentity('facebook');

            mParticle.setUserIdentity(null, mParticle.IdentityType.Facebook);
            var identity2 = mParticle.getUserIdentity('facebook');

            Should(identity2).not.be.ok();
            Should(identity1).not.be.ok();

            done();
        });

        it('should not create a userIdentity when only an id is passed', function(done) {
            mParticle.setUserIdentity('test@mparticle.com');
            var identity = mParticle.getUserIdentity('test@mparticle.com');

            Should(identity).not.be.ok();

            done();
        });

        it('should invoke forwarder setIdentity on initialized forwarders (debug = false)', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();
            mParticle.addForwarder(mockForwarder);
            mockForwarder.configure();
            mParticle.init(apiKey);

            mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);

            mockForwarder.instance.should.have.property('setUserIdentityCalled', true);

            done();
        });

        it('should set user attribute', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            mParticle.init(apiKey);
            mParticle.setUserAttribute('gender', 'male');

            mParticle.logEvent('test user attributes');

            var event = getEvent('test user attributes');

            event.should.have.property('ua');
            event.ua.should.have.property('gender', 'male');

            done();
        });

        it('should preserve most recent casing when a differently cased user attribute key is used', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            mParticle.init(apiKey);
            mParticle.setUserAttribute('Gender', 'male');
            mParticle.setUserAttribute('gender', 'female');

            mParticle.logEvent('test user attributes');

            var event = getEvent('test user attributes');
            mParticle.setUserAttribute('Gender', 'male');

            mParticle.logEvent('test user attributes2');

            var event2 = getEvent('test user attributes2');

            event.should.have.property('ua');
            event.ua.should.have.property('gender', 'female');
            event.ua.should.not.have.property('Gender');

            event2.ua.should.have.property('Gender', 'male');
            event2.ua.should.not.have.property('gender');

            done();
        });

        it('should remove user attribute', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            mParticle.init(apiKey);
            mParticle.setUserAttribute('gender', 'male');
            mParticle.removeUserAttribute('gender');

            mParticle.logEvent('test user attributes');

            var event = getEvent('test user attributes');
            event.should.not.have.property('gender');

            done();
        });

        it('should remove user attribute case insensitive', function(done) {
            mParticle.reset();
            var mockForwarder = new MockForwarder();

            mParticle.addForwarder(mockForwarder);
            mParticle.init(apiKey);
            mParticle.setUserAttribute('Gender', 'male');
            mParticle.removeUserAttribute('gender');

            mParticle.logEvent('test user attributes');

            var event = getEvent('test user attributes');
            event.should.not.have.property('Gender');

            done();
        });

        it('should set session attribute', function(done) {
            mParticle.setSessionAttribute('name', 'test');

            mParticle.logEvent('test event');

            var event = getEvent('test event');

            event.should.not.have.property('sa');

            mParticle.endSession();
            var sessionEndEvent = getEvent(2);
            sessionEndEvent.attrs.should.have.property('name', 'test');

            done();
        });

        it('should set session attribute case insensitive', function(done) {
            mParticle.setSessionAttribute('name', 'test');
            mParticle.setSessionAttribute('Name', 'test1');

            mParticle.endSession();
            var sessionEndEvent = getEvent(2);

            sessionEndEvent.attrs.should.have.property('name', 'test1');
            sessionEndEvent.attrs.should.not.have.property('Name');

            done();
        });

        it('should not set a session attribute\'s key as an object or array)', function(done) {
            mParticle.setSessionAttribute({key: 'value'}, 'test');
            mParticle.endSession();
            var sessionEndEvent1 = getEvent(2);

            mParticle.startNewSession();
            server.requests = [];
            mParticle.setSessionAttribute(['test'], 'test');
            mParticle.endSession();
            var sessionEndEvent2 = getEvent(2);

            Object.keys(sessionEndEvent1.attrs).length.should.equal(0);
            Object.keys(sessionEndEvent2.attrs).length.should.equal(0);

            done();
        });

        it('should remove session attributes when session ends', function(done) {
            mParticle.startNewSession();
            mParticle.setSessionAttribute('name', 'test');
            mParticle.endSession();

            server.requests = [];
            mParticle.startNewSession();
            mParticle.endSession();
            var sessionEndEvent = getEvent(2);

            sessionEndEvent.attrs.should.not.have.property('name');

            done();
        });

        it('should set and log position', function(done) {
            mParticle.setPosition(34.134103, -118.321694);
            mParticle.logEvent('test event');

            var event = getEvent('test event');

            event.should.have.property('lc');
            event.lc.should.have.property('lat', 34.134103);
            event.lc.should.have.property('lng', -118.321694);

            done();
        });

        it('should set user tag', function(done) {
            mParticle.setUserTag('test');

            mParticle.logEvent('test event');

            var event = getEvent('test event');

            event.should.have.property('ua');
            event.ua.should.have.property('test', null);

            done();
        });

        it('should set user tag case insensitive', function(done) {
            mParticle.setUserTag('Test');
            mParticle.setUserTag('test');

            mParticle.logEvent('test event');

            var event = getEvent('test event');

            event.should.have.property('ua');
            event.ua.should.not.have.property('Test');
            event.ua.should.have.property('test');

            done();
        });

        it('should remove user tag', function(done) {
            mParticle.setUserTag('test');
            mParticle.removeUserTag('test');

            mParticle.logEvent('test event');

            var event = getEvent('test event');

            event.should.have.property('ua');
            event.ua.should.not.have.property('test');

            done();
        });

        it('should remove user tag case insensitive', function(done) {
            mParticle.setUserTag('Test');
            mParticle.removeUserTag('test');

            mParticle.logEvent('test event');

            var event = getEvent('test event');

            event.should.have.property('ua');
            event.ua.should.not.have.property('Test');

            done();
        });

        it('should set user attribute list', function(done) {
            mParticle.reset();

            mParticle.init(apiKey);
            mParticle.setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

            mParticle.logEvent('test user attributes');

            var event = getEvent('test user attributes');

            event.should.have.property('ua');
            event.ua.should.have.property('numbers', [1, 2, 3, 4, 5]);

            done();
        });

        it('should set user attribute list case insensitive', function(done) {
            mParticle.reset();

            mParticle.init(apiKey);
            mParticle.setUserAttributeList('numbers', [1, 2, 3, 4, 5]);
            mParticle.setUserAttributeList('Numbers', [1, 2, 3, 4, 5, 6]);

            mParticle.logEvent('test user attributes');

            var event = getEvent('test user attributes');
            event.should.have.property('ua');
            event.ua.should.have.property('Numbers', [1, 2, 3, 4, 5, 6]);
            event.ua.should.not.have.property('numbers');

            mParticle.setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

            mParticle.logEvent('test user attributes2');
            var event2 = getEvent('test user attributes2');

            event2.should.have.property('ua');
            event2.ua.should.have.property('numbers', [1, 2, 3, 4, 5]);
            event2.ua.should.not.have.property('Numbers');

            done();
        });

        it('should make a copy of user attribute list', function (done) {
            var list = [1, 2, 3, 4, 5];

            mParticle.reset();

            mParticle.init(apiKey);
            mParticle.setUserAttributeList('numbers', list);

            list.push(6);

            mParticle.logEvent('test user attributes');

            var event = getEvent('test user attributes');

            event.should.have.property('ua');
            event.ua.should.have.property('numbers').with.lengthOf(5);

            done();
        });

        it('should remove all user attributes', function(done) {
            mParticle.reset();

            mParticle.init(apiKey);
            mParticle.setUserAttributeList('numbers', [1, 2, 3, 4, 5]);
            mParticle.removeAllUserAttributes();

            mParticle.logEvent('test user attributes');

            var event = getEvent('test user attributes');

            event.should.have.property('ua', {});

            done();
        });

        it('should get user attribute lists', function(done) {
            mParticle.reset();

            mParticle.init(apiKey);

            mParticle.setUserAttribute('gender', 'male');
            mParticle.setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

            var userAttributes = mParticle.getUserAttributesLists();

            userAttributes.should.have.property('numbers');
            userAttributes.should.not.have.property('gender');

            done();
        });

        it('should copy when calling get user attribute lists', function(done) {
            mParticle.reset();
            mParticle.init(apiKey);

            mParticle.setUserAttribute('gender', 'male');
            mParticle.setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

            var userAttributes = mParticle.getUserAttributesLists();

            userAttributes['numbers'].push(6);

            var userAttributes1 = mParticle.getUserAttributesLists();
            userAttributes1['numbers'].should.have.lengthOf(5);

            done();
        });

        it('should copy when calling get user attributes', function(done) {
            mParticle.reset();
            mParticle.init(apiKey);

            mParticle.setUserAttribute('gender', 'male');
            mParticle.setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

            var userAttributes = mParticle.getAllUserAttributes();

            userAttributes.blah = 'test';
            userAttributes['numbers'].push(6);

            var userAttributes1 = mParticle.getAllUserAttributes();

            userAttributes1['numbers'].should.have.lengthOf(5);
            userAttributes1.should.not.have.property('blah');

            done();
        });

        it('should get all user attributes', function(done) {
            mParticle.reset();

            mParticle.init(apiKey);

            mParticle.setUserAttribute('test', '123');
            mParticle.setUserAttribute('another test', 'blah');

            var attrs = mParticle.getAllUserAttributes();

            attrs.should.have.property('test', '123');
            attrs.should.have.property('another test', 'blah');

            done();
        });

        it('should not set user attribute list if value is not array', function(done) {
            mParticle.reset();
            mParticle.init(apiKey);

            mParticle.setUserAttributeList('mykey', 1234);

            var attrs = mParticle.getAllUserAttributes();

            attrs.should.not.have.property('mykey');

            done();
        });

        it('should not set bad session attribute value', function(done) {
            mParticle.setSessionAttribute('name', { bad: 'bad' });

            mParticle.endSession();

            var sessionEndEvent = getEvent(2);

            sessionEndEvent.attrs.should.not.have.property('name');

            done();
        });

        it('should not set a bad user attribute key or value', function(done) {
            mParticle.setUserAttribute('gender', { bad: 'bad' });
            mParticle.logEvent('test bad user attributes1');
            var event1 = getEvent('test bad user attributes1');

            mParticle.setUserAttribute('gender', ['bad', 'bad', 'bad']);
            mParticle.logEvent('test bad user attributes2');
            var event2 = getEvent('test bad user attributes2');

            mParticle.setUserAttribute({ bad: 'bad' }, 'male');
            mParticle.logEvent('test bad user attributes3');
            var event3 = getEvent('test bad user attributes3');

            mParticle.setUserAttribute(['bad', 'bad', 'bad'], 'female');
            mParticle.logEvent('test bad user attributes4');
            var event4 = getEvent('test bad user attributes4');

            mParticle.setUserAttribute(null, 'female');
            mParticle.logEvent('test bad user attributes5');
            var event5 = getEvent('test bad user attributes5');

            mParticle.setUserAttribute(undefined, 'female');
            mParticle.logEvent('test bad user attributes6');
            var event6 = getEvent('test bad user attributes6');

            event1.should.have.property('ua');
            event1.ua.should.not.have.property('gender');

            event2.should.have.property('ua');
            event2.ua.should.not.have.property('gender');

            event3.should.have.property('ua');
            event3.ua.should.not.have.property('gender');

            event4.should.have.property('ua');
            event4.ua.should.not.have.property('gender');

            event5.should.have.property('ua');
            event5.ua.should.not.have.property('gender');

            event6.should.have.property('ua');
            event6.ua.should.not.have.property('gender');

            done();
        });
    });

    describe('cookie syncing', function() {
        it('should sync cookies when there was not a previous cookie-sync', function(done) {
            mParticle.reset();
            var pixelSettings = {
                name: 'AdobeEventForwarder',
                moduleId: 5,
                esId: 24053,
                isDebug: true,
                isProduction: true,
                settings: {},
                frequencyCap: 14,
                pixelUrl:'http://www.yahoo.com',
                redirectUrl:''
            };
            mParticle.configurePixel(pixelSettings);
            mParticle.init(apiKey);

            setTimeout(function() {
                var data = mParticle.persistence.getLocalStorage();
                data.csd.should.have.property('5');

                done();
            }, 50);
        });

        it('should sync cookies when current date is beyond the frequency cap and the MPID has not changed', function(done) {
            mParticle.reset();
            var pixelSettings = {
                name: 'AdobeEventForwarder',
                moduleId: 5,
                esId: 24053,
                isDebug: true,
                isProduction: true,
                settings: {},
                frequencyCap: 14,
                pixelUrl:'http://www.yahoo.com',
                redirectUrl:''
            };
            mParticle.configurePixel(pixelSettings);

            setLocalStorage(v1localStorageKey, {
                mpid: testMPID,
                csd: { 5: (new Date(500)).getTime() },
                ie: true
            });

            mParticle.init(apiKey);

            setTimeout(function() {
                var data = mParticle.persistence.getLocalStorage();
                var updated = data.csd['5']>500;
                Should(updated).be.ok();

                done();
            }, 50);
        });

        it('should not sync cookies when last date is within frequencyCap', function(done) {
            mParticle.reset();
            var pixelSettings = {
                name: 'AdobeEventForwarder',
                moduleId: 5,
                esId: 24053,
                isDebug: true,
                isProduction: true,
                settings: {},
                frequencyCap: 14,
                pixelUrl:'http://www.yahoo.com',
                redirectUrl:''
            };
            mParticle.configurePixel(pixelSettings);

            var lastCookieSyncTime = (new Date().getTime())-5000;
            setLocalStorage(v1localStorageKey, {
                mpid: testMPID,
                csd: { 5: lastCookieSyncTime }
            });
            mParticle.init(apiKey);
            server.requests = [];

            var data = mParticle.persistence.getLocalStorage();

            data.csd.should.have.property(5, lastCookieSyncTime);

            done();
        });

        it('should not sync cookies when in a mobile web view', function(done) {
            var pixelSettings = {
                name: 'AdobeEventForwarder',
                moduleId: 5,
                esId: 24053,
                isDebug: true,
                isProduction: true,
                settings: {},
                frequencyCap: 14,
                pixelUrl:'http://www.yahoo.com',
                redirectUrl:''
            };
            mParticle.reset();
            mParticle.configurePixel(pixelSettings);

            window.mParticleAndroid = true;
            mParticle.init(apiKey);

            var data1 = mParticle.persistence.getLocalStorage();

            mParticle.reset();

            window.mParticleAndroid = null;
            window.mParticle.isIOS = true;
            mParticle.init(apiKey);

            var data2 = mParticle.persistence.getLocalStorage();

            data1.should.not.have.property('csd');
            data2.should.not.have.property('csd');

            done();
        });

        it('should sync cookies when mpid changes', function(done) {
            var pixelSettings = {
                name: 'AdobeEventForwarder',
                moduleId: 5,
                esId: 24053,
                isDebug: true,
                isProduction: true,
                settings: {},
                frequencyCap: 14,
                pixelUrl:'http://www.yahoo.com',
                redirectUrl:''
            };
            mParticle.reset();
            mParticle.configurePixel(pixelSettings);

            mParticle.init(apiKey);
            var data1 = mParticle.persistence.getLocalStorage();

            setLocalStorage(currentLSKey, {
                mpid: 'differentMPID',
                ie: true
            });

            mParticle.init(apiKey);
            var data2 = mParticle.persistence.getLocalStorage(currentLSKey);

            data1.csd[5].should.not.equal(data2.csd[5]);

            done();
        });

        it('should not sync cookies when pixelSettings.isDebug is false, pixelSettings.isProduction is true, and mParticle.isSandbox is true', function(done) {
            var pixelSettings = {
                name: 'AdobeEventForwarder',
                moduleId: 5,
                esId: 24053,
                isDebug: false,
                isProduction: true,
                settings: {},
                frequencyCap: 14,
                pixelUrl:'http://www.yahoo.com',
                redirectUrl:''
            };
            mParticle.reset();
            mParticle.isSandbox = true;

            mParticle.configurePixel(pixelSettings);

            mParticle.init(apiKey);

            var data1 = mParticle.persistence.getLocalStorage();

            mParticle.init(apiKey);

            data1.should.not.have.property('csd');

            done();
        });

        it('should not sync cookies when pixelSettings.isDebug is true, pixelSettings.isProduction is false, and mParticle.isSandbox is false', function(done) {
            var pixelSettings = {
                name: 'AdobeEventForwarder',
                moduleId: 5,
                esId: 24053,
                isDebug: true,
                isProduction: false,
                settings: {},
                frequencyCap: 14,
                pixelUrl:'http://www.yahoo.com',
                redirectUrl:''
            };
            mParticle.reset();
            mParticle.isSandbox = false;
            mParticle.configurePixel(pixelSettings);

            mParticle.init(apiKey);

            var data1 = mParticle.persistence.getLocalStorage();

            mParticle.init(apiKey);

            data1.should.not.have.property('csd');

            done();
        });

        it('should replace mpID properly', function(done) {
            var result = mParticle.cookieSyncManager.replaceMPID('www.google.com?mpid=%%mpid%%?foo=bar', 123);

            result.should.equal('www.google.com?mpid=123?foo=bar');

            done();
        });

        it('should remove \'amp;\' from the URLs', function(done) {
            var result = mParticle.cookieSyncManager.replaceAmp('www.google.com?mpid=%%mpid%%&amp;foo=bar');

            result.should.equal('www.google.com?mpid=%%mpid%%&foo=bar');

            done();
        });
    });

    describe('core SDK', function() {
        it('sanitizes attributes when attrs are provided', function(done) {
            var attrs = {
                valid: '123',
                invalid: ['123', '345']
            };
            var product = mParticle.eCommerce.createProduct('name', 'sku', 100, 1, 'variant', 'category', 'brand', 'position', 'coupon', attrs);
            product.Attributes.should.not.have.property('invalid');
            product.Attributes.should.have.property('valid');

            mParticle.eCommerce.logCheckout(1, 'visa', attrs);
            var event = getEvent('eCommerce - Checkout');
            event.attrs.should.not.have.property('invalid');
            event.attrs.should.have.property('valid');

            server.requests = [];
            mParticle.eCommerce.logProductAction(1, product, attrs);
            event = getEvent('eCommerce - AddToCart');
            event.attrs.should.not.have.property('invalid');
            event.attrs.should.have.property('valid');

            var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345',
                'test-affiliation',
                'coupon-code',
                44334,
                600,
                200);

            server.requests = [];
            mParticle.eCommerce.logPurchase(transactionAttributes, product, false, attrs);
            event = getEvent('eCommerce - Purchase');
            event.attrs.should.not.have.property('invalid');
            event.attrs.should.have.property('valid');

            var promotion = mParticle.eCommerce.createPromotion('id', 'creative', 'name', 'position');

            server.requests = [];
            mParticle.eCommerce.logPromotion(1, promotion, attrs);
            event = getEvent('eCommerce - PromotionView');
            event.attrs.should.not.have.property('invalid');
            event.attrs.should.have.property('valid');

            server.requests = [];
            mParticle.eCommerce.logRefund(transactionAttributes, product, false, attrs);
            event = getEvent('eCommerce - Refund');
            event.attrs.should.not.have.property('invalid');
            event.attrs.should.have.property('valid');

            server.requests = [];
            mParticle.logLTVIncrease(100, 'logLTVIncrease', attrs);
            event = getEvent('logLTVIncrease');
            event.attrs.should.not.have.property('invalid');
            event.attrs.should.have.property('valid');

            done();
        });

        it('should sanitize event attributes', function(done) {
            mParticle.logEvent('sanitized event', 1, {
                key1: 'value1',
                mydate: new Date(),
                ishouldberemoved: {
                    test: 'test'
                },
                ishouldalsoberemoved: ['test'],
                removeme: new Error()
            });

            var event = getEvent('sanitized event');

            event.attrs.should.have.property('key1', 'value1');
            event.attrs.should.have.property('mydate');
            event.attrs.should.not.have.property('ishouldberemoved');
            event.attrs.should.not.have.property('ishouldalsoberemoved');
            event.attrs.should.not.have.property('removeme');

            done();
        });

        it('starts new session', function(done) {
            mParticle.startNewSession();

            var data = getEvent(MessageType.SessionStart);

            Should(data).be.ok();

            data.should.have.property('sid');

            done();
        });

        it('sessionIds are all capital letters', function(done) {
            var lowercaseLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

            var sessionId = mParticle.sessionManager.getSession();
            var lowercaseLetterExists;
            sessionId.split('').forEach(function(letter) {
                if (lowercaseLetters.indexOf(letter) > -1) {
                    lowercaseLetterExists = true;
                }
            });

            Should(lowercaseLetterExists).not.be.ok();

            done();
        });

        it('ends existing session with an event that includes SessionLength', function(done) {
            mParticle.startNewSession();
            mParticle.endSession();

            var data = getEvent(MessageType.SessionEnd);

            Should(data).be.ok();
            data.should.have.property('sl');

            done();
        });

        it('creates a new dateLastEventSent when logging an event, and retains the previous one when ending session', function(done) {
            mParticle.logEvent('Test Event1');
            var data1 = getEvent('Test Event1');

            setTimeout(function() {
                mParticle.logEvent('Test Event2');
                var data2 = getEvent('Test Event2');

                mParticle.endSession();
                var data3 = getEvent(MessageType.SessionEnd);

                var result1 = data1.ct === data2.ct;
                var result2 = data2.ct === data3.ct;

                Should(result1).not.be.ok();
                Should(result2).be.ok();
                done();
            }, 5);
        });

        it('should process ready queue when initialized', function(done) {
            var readyFuncCalled = false;

            mParticle.reset();
            mParticle.ready(function() { readyFuncCalled = true; });
            mParticle.init(apiKey);

            Should(readyFuncCalled).equal(true);

            done();
        });

        it('should set app version', function(done) {
            mParticle.setAppVersion('1.0');

            window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation);
            var data = getEvent('Test Event');

            data.should.have.property('av', '1.0');

            done();
        });

        it('should get app version', function(done) {
            mParticle.setAppVersion('2.0');

            var appVersion = mParticle.getAppVersion();

            appVersion.should.equal('2.0');

            done();
        });

        it('should pass custom flags in page views', function(done) {
            mParticle.logPageView({
                'MyCustom.Flag': 'Test'
            });

            var event = getEvent(window.location.pathname);

            Should(event).be.ok();

            event.should.have.property('flags');
            event.flags.should.have.property('MyCustom.Flag', ['Test']);

            done();
        });

        it('should convert custom flag dictionary values to array', function(done) {
            mParticle.logPageView({
                'MyCustom.String': 'Test',
                'MyCustom.Number': 1,
                'MyCustom.Boolean': true,
                'MyCustom.Object': {},
                'MyCustom.Array': ['Blah', 'Hello', {}]
            });

            var event = getEvent(window.location.pathname);

            Should(event).be.ok();

            event.should.have.property('flags');
            event.flags.should.have.property('MyCustom.String', ['Test']);
            event.flags.should.have.property('MyCustom.Number', ['1']);
            event.flags.should.have.property('MyCustom.Boolean', ['true']);
            event.flags.should.not.have.property('MyCustom.Object');
            event.flags.should.have.property('MyCustom.Array', ['Blah', 'Hello']);

            done();
        });

        it('should set client id', function(done) {
            window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation);
            var data = getEvent('Test Event');

            data.should.have.property('cgid').with.lengthOf(36);

            done();
        });

        it('should return the deviceId when provided with serverSettings', function(done) {
            var serverSettings = {
                uid: {
                    Expires: '2027-05-09T02:03:06.368056Z',
                    Value: 'u=6100647832327797727&cr=3869403&g=7b0a8d4e-b144-4259-b491-1b3cf76af453&ls=3870112&lbe=3870112'
                }
            };

            var deviceId = mParticle.persistence.parseDeviceId(serverSettings);
            deviceId.should.equal('7b0a8d4e-b144-4259-b491-1b3cf76af453');

            done();
        });

        it('should create a deviceId when there are no serverSettings', function(done) {
            var serverSettings = null;

            var deviceId = mParticle.persistence.parseDeviceId(serverSettings);

            Should(deviceId).be.ok();

            done();
        });

        it('should not generate a new device ID if a deviceId exists in localStorage', function(done) {
            mParticle.reset();
            var guid = '7b0a8d4e-b144-4259-b491-1b3cf76af453';
            setLocalStorage(v1localStorageKey, {das: guid});
            mParticle.init(apiKey);

            var deviceId = mParticle.getDeviceId();

            deviceId.should.equal(guid);
            done();
        });

        it('should return the deviceId when requested', function(done) {
            var deviceId = mParticle.getDeviceId();

            Should(deviceId).be.ok();
            deviceId.length.should.equal(36);

            done();
        });

        it('will create a cgid when no previous cgid exists after initializing storage, and no sid', function(done) {
            mParticle.reset();
            window.mParticle.useCookieStorage = true;

            mParticle.persistence.initializeStorage();
            mParticle.persistence.update();

            var cookieData = mParticle.persistence.getCookie();
            var parsedCookie = JSON.parse(cookieData);

            parsedCookie.should.have.properties(['cgid']);
            parsedCookie.should.not.have.property('sid');

            done();
        });

        it('creates a new session when elapsed time between actions is greater than session timeout', function(done) {
            mParticle.reset();
            var clock = sinon.useFakeTimers();
            mParticle.init(apiKey, {SessionTimeout: 1});
            clock.tick(100);
            mParticle.logEvent('Test Event');
            var data = getEvent('Test Event');

            clock.tick(70000);

            mParticle.logEvent('Test Event2');
            data2 = getEvent('Test Event2');
            data.sid.should.not.equal(data2.sid);
            mParticle.sessionManager.clearSessionTimeout();
            done();
        });

        it('should end session when last event sent is outside of sessionTimeout', function(done) {
            mParticle.reset();
            var clock = sinon.useFakeTimers();

            mParticle.init(apiKey, {SessionTimeout: 1});
            clock.tick(100);
            mParticle.logEvent('Test Event');

            clock.tick(10000);
            mParticle.logEvent('Test Event2');

            clock.tick(120000);
            mParticle.logEvent('Test Event3');

            clock.tick(150000);

            var data1 = getEvent('Test Event');
            var data2 = getEvent('Test Event2');
            var data3 = getEvent('Test Event3');

            data2.sid.should.equal(data1.sid);
            data3.sid.should.not.equal(data1.sid);
            clock.restore();
            done();
        });

        it('should not end session when end session is called within sessionTimeout timeframe', function(done) {
            // This test mimics if another tab is open and events are sent, but previous tab's sessionTimeout is still ongoing
            mParticle.reset();
            var clock = sinon.useFakeTimers();

            mParticle.init(apiKey, {SessionTimeout: 1});

            server.requests = [];
            clock.tick(100);
            mParticle.logEvent('Test Event');

            // This clock tick initiates a session end event that is successful
            clock.tick(70000);

            var data1 = getEvent(2);
            Should(data1).be.ok();

            server.requests = [];

            clock.tick(100);
            mParticle.logEvent('Test Event2');

            var sid = mParticle.persistence.getLocalStorage().sid;

            setLocalStorage(currentLSKey, {
                sid: sid,
                ie: true,
                les: 150000
            });

            // This clock tick initiates a session end event that is not successful
            clock.tick(70000);
            var noData = getEvent(2);
            Should(noData).not.be.ok();
            var data2 = getEvent('Test Event2');

            mParticle.logEvent('Test Event3');

            var data3 = getEvent('Test Event3');
            data3.sid.should.equal(data2.sid);

            clock.restore();
            done();
        });

        it('should get sessionId', function(done) {
            mParticle.logEvent('Test Event');
            var data = getEvent('Test Event');

            var sessionId = mParticle.sessionManager.getSession();

            data.sid.should.equal(sessionId);

            done();
        });

        it('should use https when mParticle.forceHttps is true', function(done) {
            mParticle.forceHttps = true;
            server.requests = [];
            mParticle.logEvent('Test Event');
            server.requests[0].url.should.equal('https://jssdks.mparticle.com/v1/JS/test_key/Events');

            done();
        });
    });

    after(function() {
        server.stop();
    });
});
