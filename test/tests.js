/* eslint-disable no-undef */
describe('mParticle Core SDK', function() {
    var server,
        apiKey = 'test_key',
        testMPID = 'testMPID',
        key = 'mprtcl-api',
        pluses = /\+/g,
        ProductBag = 'my bag',
        decoded = function(s) {
            return decodeURIComponent(s.replace(pluses, ' '));
        },
        converted = function(s) {
            if (s.indexOf('"') === 0) {
                s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            }

            return s;
        },
        getRequests = function(path) {
            var requests = [],
                fullPath = '/v2/JS/' + apiKey + '/' + path;

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
        setCookie = function(data) {
            var date = new Date(),
                value = data,
                expires = new Date(date.getTime() +
                    (365 * 24 * 60 * 60 * 1000)).toGMTString();

            window.document.cookie =
                encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(value)) +
                ';expires=' + expires +
                ';path=/';
        },
        getCookie = function() {
            var cookies = window.document.cookie.split('; '),
                i,
                l,
                parts,
                name,
                cookie,
                result = key ? undefined : {};

            for (i = 0, l = cookies.length; i < l; i++) {
                parts = cookies[i].split('=');
                name = decoded(parts.shift());
                cookie = decoded(parts.join('='));

                if (key && key === name) {
                    result = converted(cookie);
                    break;
                }

                if (!key) {
                    result[name] = converted(cookie);
                }
            }
            if (result) {
                return result;
            } else {
                return null;
            }
        },
        expireCookie = function() {
            var date = new Date(),
                key = 'mprtcl-api',
                value = {expire: 'me'},
                expires = new Date(date.getTime() +
                    (-365 * 24 * 60 * 60 * 1000)).toGMTString();

            window.document.cookie =
                encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(value)) +
                ';expires=' + expires +
                ';path=/';
        },
        setLocalStorage = function(data) {
            localStorage.setItem(encodeURIComponent('mprtcl-api'), encodeURIComponent(JSON.stringify(data)));
        },

        removeLocalStorageFiles = function() {
            localStorage.removeItem('mprtcl-api');
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
                    pageViewFilters: [],
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
        expireCookie();
        removeLocalStorageFiles();
        mParticle.init(apiKey);
        window.mParticleAndroid = null;
        window.mParticle.isIOS = null;
    });

    it('should filter out any non string or number ids', function(done) {
        mParticle.reset();

        setLocalStorage({
            ui: [{Identity: 123, Type: 1}, {Identity: '123', Type: 2}, {Identity: [], Type: 1}, {Identity: {}, Type: 1}]
        });

        mParticle.init(apiKey);

        var localStorageData = mParticle.persistence.getLocalStorage();

        Object.keys(localStorageData[testMPID].ui).length.should.equal(2);

        done();
    });

    it('should filter out any multiple UIs with no IDs', function(done) {
        mParticle.reset();

        setLocalStorage({
            ui: [{Identity: 123, Type: 1}, {Type: 1}, {Type: 1}, {Type: 1}]
        });

        mParticle.init(apiKey);

        var localStorageData = mParticle.persistence.getLocalStorage();
        Object.keys(localStorageData[testMPID].ui).length.should.equal(1);

        done();
    });

    it('should log an event', function(done) {
        window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation, { mykey: 'myvalue' });
        var data = getEvent('Test Event');

        data.should.have.property('n', 'Test Event');
        data.should.have.property('et', mParticle.EventType.Navigation);
        data.should.have.property('attrs');
        data.should.have.property('mpid', testMPID);
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

        var lr = data.lr === null || data.lr === 'http://localhost:3000/test/index.html';
        Should(lr).be.ok();

        done();
    });

    it('should log an AST on init with firstRun = false when cookies already exist', function(done) {
        mParticle.reset();
        server.requests = [];

        setLocalStorage({cookie: 'test'});

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
            'Apple',
            'Plus',
            'Phones',
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
            'Apple',
            'Plus',
            'Phones',
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

    it('should remove products to cart', function(done) {
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
        cookiesAfterAdding1[testMPID].cp[0].should.have.properties(['Name', 'Sku', 'Price']);

        mParticle.eCommerce.Cart.remove(product);
        var cookiesAfterRemoving = mParticle.persistence.getLocalStorage();
        cookiesAfterRemoving[testMPID].cp.length.should.equal(0);

        mParticle.eCommerce.Cart.add(product);
        var cookiesAfterAdding2 = mParticle.persistence.getLocalStorage();
        cookiesAfterAdding2[testMPID].cp[0].should.have.properties(['Name', 'Sku', 'Price']);

        mParticle.eCommerce.Cart.clear(ProductBag);
        var cookiesAfterClearing = mParticle.persistence.getLocalStorage();
        cookiesAfterClearing[testMPID].cp.length.should.equal(0);

        done();
    });

    it('should not add the (mParticle.maxProducts + 1st) item to cookie cartItems, but still persist all items in memory for logging', function(done) {
        var product = mParticle.eCommerce.createProduct('Product', '12345', 400);
        for (var i = 0; i < mParticle.maxProducts; i++) {
            mParticle.eCommerce.Cart.add(product);
        }

        mParticle.eCommerce.Cart.add(mParticle.eCommerce.createProduct('Product21', '12345', 400));
        var cookiesAfterAdding = mParticle.persistence.getLocalStorage();

        var foundProductInCookies = cookiesAfterAdding[testMPID].cp.filter(function(product) {
            return product.Name === 'Product1';
        })[0];

        cookiesAfterAdding[testMPID].cp.length.should.equal(20);
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
        cookiesAfterAdding1[testMPID].pb[ProductBag][0].should.have.properties(['Name', 'Sku', 'Price']);

        mParticle.eCommerce.ProductBags.remove(ProductBag, product);
        var cookiesAfterRemoving = mParticle.persistence.getLocalStorage();
        Object.keys(cookiesAfterRemoving[testMPID].pb[ProductBag]).length.should.equal(0);

        mParticle.eCommerce.ProductBags.add(ProductBag, product);
        var cookiesAfterAdding2 = mParticle.persistence.getLocalStorage();
        cookiesAfterAdding2[testMPID].pb[ProductBag][0].should.have.properties(['Name', 'Sku', 'Price']);

        mParticle.eCommerce.ProductBags.clear(ProductBag);
        var cookiesAfterClearing = mParticle.persistence.getLocalStorage();
        Object.keys(cookiesAfterClearing[testMPID].pb[ProductBag]).length.should.equal(0);

        done();
    });

    it('should not add the (mParticle.maxProducts + 1st) item to productBags, but still persist all items in memory for logging', function(done) {
        var product = mParticle.eCommerce.createProduct('Product', '12345', 400);
        for (var i = 0; i < mParticle.maxProducts; i++) {
            mParticle.eCommerce.ProductBags.add(ProductBag, product);
        }
        mParticle.eCommerce.ProductBags.add(ProductBag, mParticle.eCommerce.createProduct('Product21', '54321', 100));
        var cookiesAfterAdding = mParticle.persistence.getLocalStorage();

        var foundProductInCookies = cookiesAfterAdding[testMPID].pb[ProductBag].filter(function(product) {
            return product.Name === 'Product1';
        })[0];

        cookiesAfterAdding[testMPID].pb[ProductBag].length.should.equal(20);
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

    it('should migrate previous user identity schema (array) to current schema (object)', function(done) {
        mParticle.reset();
        var userIdentities = [{Type: 1, Identity: 'id1'}, {Type: 7, Identity: 'email@domain.com'}];
        setLocalStorage({ui: userIdentities});

        mParticle.init({apiKey: apiKey});

        var localStorageData = mParticle.persistence.getLocalStorage();

        localStorageData.testMPID.should.have.property('ui');
        localStorageData.testMPID.ui['customerid'].should.equal('id1');
        localStorageData.testMPID.ui['email'].should.equal('email@domain.com');


        done();
    });

    // it('should add string or number user identities', function(done) {
    //     mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);
    //     mParticle.setUserIdentity(123456, mParticle.IdentityType.Email);
    //
    //     var identity = mParticle.getUserIdentity('test@mparticle.com');
    //
    //     identity.should.have.property('Identity', 'test@mparticle.com');
    //     identity.should.have.property('Type', mParticle.IdentityType.CustomerId);
    //
    //     identity = mParticle.getUserIdentity(123456);
    //
    //     identity.should.have.property('Identity', 123456);
    //     identity.should.have.property('Type', mParticle.IdentityType.Email);
    //
    //     done();
    // });

    // it('should remove user identities by id', function(done) {
    //     mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);
    //     mParticle.removeUserIdentity('test@mparticle.com');
    //
    //     var identity = mParticle.getUserIdentity('test@mparticle.com');
    //
    //     Should(identity).not.be.ok();
    //
    //     done();
    // });
    //
    // it('should replace existing userIdentities of the same type', function(done) {
    //     mParticle.reset();
    //
    //     setCookie({
    //         ui: [{Identity: 123, Type: 0}, {Identity:123, Type: 2}]
    //     });
    //
    //     mParticle.init(apiKey);
    //
    //     mParticle.setUserIdentity(123, mParticle.IdentityType.CustomerId);
    //
    //     var identity = mParticle.getUserIdentity(123);
    //
    //     identity.should.have.property('Type', 1);
    //     identity.should.have.property('Identity', 123);
    //
    //     done();
    // });
    //
    // it('should replace previous userIdentities when setting multiple identities of the same type', function(done) {
    //     mParticle.setUserIdentity('user1@mparticle.com', mParticle.IdentityType.CustomerId);
    //     mParticle.setUserIdentity('user2@mparticle.com', mParticle.IdentityType.CustomerId);
    //
    //     var identity1 = mParticle.getUserIdentity('user1@mparticle.com');
    //     var identity2 = mParticle.getUserIdentity('user2@mparticle.com');
    //
    //     Should(identity1).not.be.ok();
    //     Should(identity2).be.ok();
    //
    //     done();
    // });
    //
    // it('should remove userIdentity of specified type when null is passed in as id', function(done) {
    //     mParticle.reset();
    //
    //     mParticle.init(apiKey);
    //
    //     mParticle.setUserIdentity('facebookid', mParticle.IdentityType.Facebook);
    //     var identity1 = mParticle.getUserIdentity('facebook');
    //
    //     mParticle.setUserIdentity(null, mParticle.IdentityType.Facebook);
    //     var identity2 = mParticle.getUserIdentity('facebook');
    //
    //     Should(identity2).not.be.ok();
    //     Should(identity1).not.be.ok();
    //
    //     done();
    // });
    //
    // it('should not create a userIdentity when only an id is passed', function(done) {
    //     mParticle.setUserIdentity('test@mparticle.com');
    //     var identity = mParticle.getUserIdentity('test@mparticle.com');
    //
    //     Should(identity).not.be.ok();
    //
    //     done();
    // });
    //
    // it('should invoke forwarder setIdentity on initialized forwarders (debug = false)', function(done) {
    //     mParticle.reset();
    //     var mockForwarder = new MockForwarder();
    //     mParticle.addForwarder(mockForwarder);
    //     mockForwarder.configure();
    //     mParticle.init(apiKey);
    //
    //     mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);
    //
    //     mockForwarder.instance.should.have.property('setUserIdentityCalled', true);
    //
    //     done();
    // });

    it('starts new session', function(done) {
        mParticle.startNewSession();

        var data = getEvent(MessageType.SessionStart);

        Should(data).be.ok();

        data.should.have.property('sid');

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

    it('does not initialize a forwarder when forwarder\'s isDebug != mParticle.isDevelopment', function(done) {
        mParticle.reset();
        mParticle.isDevelopment = false;
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
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

    it('initializes forwarder with isDebug = false && mParticle.isDevelopment = false', function(done) {
        mParticle.reset();
        mParticle.isDevelopment = false;
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
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

    it('creates a forwarder when forwarder\'s isDebug = mParticle.isDevelopmentMode', function(done) {
        mParticle.reset();
        mParticle.isDevelopmentMode = true;
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
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

    it('sends events to forwarder when forwarder\'s isDebug = mParticle.isDevelopmentMode ', function(done) {
        mParticle.reset();
        mParticle.isDevelopmentMode = true;
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
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

    it('sends events to forwarder when mParticle.isDevelopmentMode = config.isDebug = false', function(done) {
        mParticle.reset();
        mParticle.isDevelopmentMode = false;
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
        event.should.have.property('dbg', mParticle.isDevelopmentMode);
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

    it('should log opt out', function(done) {
        mParticle.setOptOut(true);

        var event = getEvent(MessageType.OptOut);

        event.should.have.property('dt', MessageType.OptOut);
        event.should.have.property('o', true);

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

    it('should set user attribute', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');

        event.should.have.property('ua');
        event.ua.should.have.property('gender', 'male');

        done();
    });

    it('should set user attribute be case insensitive', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'female');

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');

        event.should.have.property('ua');
        event.ua.should.have.property('Gender', 'female');
        event.ua.should.not.have.property('gender');

        done();
    });

    it('should remove user attribute', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

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
        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');
        event.should.not.have.property('Gender');

        done();
    });

    it('should set session attribute', function(done) {
        mParticle.setSessionAttribute('name', 'test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('sa');
        event.sa.should.have.property('name', 'test');

        done();
    });

    it('should set session attribute case insensitive', function(done) {
        mParticle.setSessionAttribute('name', 'test');
        mParticle.setSessionAttribute('Name', 'test1');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('sa');
        event.sa.should.have.property('name', 'test1');
        event.sa.should.not.have.property('Name');

        done();
    });

    it('should not set a session attribute\'s key as an object or array)', function(done) {
        mParticle.setSessionAttribute({key: 'value'}, 'test');
        mParticle.logEvent('test event');
        var event1 = getEvent('test event');

        mParticle.setSessionAttribute(['test'], 'test');
        mParticle.logEvent('test event2');
        var event2 = getEvent('test event2');

        Object.keys(event1.sa).length.should.equal(0);
        Object.keys(event2.sa).length.should.equal(0);

        done();
    });

    it('should remove session attributes when session ends', function(done) {
        mParticle.startNewSession();
        mParticle.setSessionAttribute('name', 'test');
        mParticle.endSession();
        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('sa');
        event.sa.should.not.have.property('name');

        done();
    });

    it('should invoke forwarder setuserattribute', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        mockForwarder.instance.should.have.property('setUserAttributeCalled', true);

        done();
    });

    it('should invoke forwarder setuserattribute when calling setUserAttributeList', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttributeList('gender', ['male']);

        mockForwarder.instance.should.have.property('setUserAttributeCalled', true);

        done();
    });

    it('should invoke forwarder removeuserattribute', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

        mockForwarder.instance.should.have.property('removeUserAttributeCalled', true);

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
        mParticle.Identity.getCurrentUser().setUserTag('test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('ua');
        event.ua.should.have.property('test', null);

        done();
    });

    it('should remove user tag', function(done) {
        mParticle.Identity.getCurrentUser().setUserTag('test');
        mParticle.Identity.getCurrentUser().removeUserTag('test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('ua');
        event.ua.should.not.have.property('test');

        done();
    });

    it('should remove user tag case insensitive', function(done) {
        mParticle.Identity.getCurrentUser().setUserTag('Test');
        mParticle.Identity.getCurrentUser().removeUserTag('test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('ua');
        event.ua.should.not.have.property('Test');

        done();
    });

    it('should parse response after logging event', function(done) {
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {
                    testprop: {
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
        event.str.should.have.property('testprop');
        event.str.testprop.should.have.property('Value', 'blah');

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
            pageViewFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [mParticle.generateHash('gender')],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });

        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        mParticle.logEvent('test event');

        var event = mockForwarder.instance.receivedEvent;
        event.should.have.property('UserAttributes');
        event.UserAttributes.should.not.have.property('gender');

        done();
    });

    // TODO: Fix Test
    // it('should filter user identities from forwarder', function(done) {
    //     mParticle.reset();
    //     var mockForwarder = new MockForwarder();
    //     mParticle.addForwarder(mockForwarder);
    //
    //     server.handle = function(request) {
    //         request.setResponseHeader('Content-Type', 'application/json');
    //         request.receive(200, JSON.stringify({
    //             matched_identities: {
    //                 google: 'asdf@gmail.com',
    //                 microsoft: 'test123',
    //                 yahoo: 'foo@bar.com'
    //             },
    //             mpid: testMPID
    //         }));
    //     };
    //
    //     mParticle.configureForwarder({
    //         name: 'MockForwarder',
    //         settings: {},
    //         eventNameFilters: [],
    //         eventTypeFilters: [],
    //         attributeFilters: [],
    //         pageViewFilters: [],
    //         pageViewAttributeFilters: [],
    //         userIdentityFilters: [mParticle.IdentityType.Google],
    //         userAttributeFilters: [],
    //         moduleId: 1,
    //         isDebug: false,
    //         HasDebugString: 'false',
    //         isVisible: true
    //     });
    //     mParticle.init(apiKey);
    //     mParticle.logEvent('test event');
    //
    //     var event = mockForwarder.instance.receivedEvent;
    //
    //     (Object.keys(event.UserIdentities).length).should.equal(2);
    //     Should(event.UserIdentities[mParticle.IdentityType.Google]).not.be.ok();
    //
    //     done();
    // });

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
            pageViewFilters: [],
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
            pageViewFilters: [mParticle.generateHash(mParticle.EventType.Unknown + '/test/index.html')],
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
            pageViewFilters: [],
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
            pageViewFilters: [],
            pageViewAttributeFilters: [mParticle.generateHash(mParticle.EventType.Unknown + '/test/index.html' + 'hostname')],
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

    it('event type should return name', function(done) {
        mParticle.EventType.getName(mParticle.EventType.Navigation).should.equal('Navigation');
        mParticle.EventType.getName(mParticle.EventType.Location).should.equal('Location');
        mParticle.EventType.getName(mParticle.EventType.Search).should.equal('Search');
        mParticle.EventType.getName(mParticle.EventType.Transaction).should.equal('Transaction');
        mParticle.EventType.getName(mParticle.EventType.UserContent).should.equal('User Content');
        mParticle.EventType.getName(mParticle.EventType.UserPreference).should.equal('User Preference');
        mParticle.EventType.getName(mParticle.EventType.Social).should.equal('Social');
        mParticle.EventType.getName(mParticle.EventType.Media).should.equal('Media');
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
        // mParticle.IdentityType.getName(mParticle.IdentityType.Alias).should.equal('Alias ID');
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

    it('should process ready queue when initialized', function(done) {
        var readyFuncCalled = false;

        mParticle.reset();
        mParticle.ready(function() { readyFuncCalled = true; });
        mParticle.init(apiKey);

        Should(readyFuncCalled).equal(true);

        done();
    });

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

    it('should log logout event', function(done) {
        mParticle.Identity.logout();
        var data = getIdentityEvent('logout');
        data.should.have.properties('client_sdk', 'environment', 'previous_mpid', 'request_id', 'request_timestamp_ms', 'context');

        done();
    });

    it('should log login event', function(done) {
        mParticle.Identity.login();
        var data = getIdentityEvent('login');
        data.should.have.properties('client_sdk', 'environment', 'previous_mpid', 'request_id', 'request_timestamp_ms', 'context');

        done();
    });

    it('should log modify event', function(done) {
        mParticle.Identity.modify();
        var data = getIdentityEvent('modify');
        data.should.have.properties('client_sdk', 'environment', 'identity_changes', 'request_id', 'request_timestamp_ms', 'context');

        done();
    });

    it('should call logout on forwarder', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();

        mParticle.init(apiKey);
        mParticle.Identity.logout();

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

    it('should load cookie in initialize', function(done) {
        mParticle.reset();

        done();
    });

    it('should pass in user identities to forwarder on initialize', function(done) {
        mParticle.reset();

        setCookie({
            ui: [{
                Identity: 'testuser@mparticle.com',
                Type: 1
            }]
        });

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);

        Object.keys(mockForwarder.instance.userIdentities).length.should.equal(1);

        done();
    });

    it('should pass in user attributes to forwarder on initialize if copyUserAttributes is true', function(done) {
        mParticle.reset();

        setCookie({
            ua: {
                color: 'blue'
            }
        });

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        window.mParticle.identifyRequest.copyUserAttributes = true;

        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('userAttributes');
        mockForwarder.instance.userAttributes.should.have.property('color', 'blue');

        window.mParticle.identifyRequest.copyUserAttributes = false;
        done();
    });

    it('should not pass in user attributes to forwarder on initialize if copyUserAttributes is false', function(done) {
        mParticle.reset();

        setCookie({
            ua: {
                color: 'blue'
            }
        });

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();

        window.mParticle.identifyRequest.copyUserAttributes = false;
        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('userAttributes');
        mockForwarder.instance.userAttributes.should.not.have.property('color');

        window.mParticle.identifyRequest.copyUserAttributes = true;
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
            pageViewFilters: [],
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
            pageViewFilters: [],
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
            pageViewFilters: [],
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

    it('should set user attribute list', function(done) {
        mParticle.reset();

        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');

        event.should.have.property('ua');
        event.ua.should.have.property('numbers', [1, 2, 3, 4, 5]);

        done();
    });

    it('should set user attribute list case insensitive', function(done) {
        mParticle.reset();

        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);
        mParticle.Identity.getCurrentUser().setUserAttributeList('Numbers', [1, 2, 3, 4, 5, 6]);

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');

        event.should.have.property('ua');
        event.ua.should.have.property('numbers', [1, 2, 3, 4, 5, 6]);
        event.ua.should.not.have.property('Numbers');

        done();
    });

    it('should make a copy of user attribute list', function (done) {
        var list = [1, 2, 3, 4, 5];

        mParticle.reset();

        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', list);

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
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);
        mParticle.Identity.getCurrentUser().removeAllUserAttributes();

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');

        event.should.have.property('ua', {});

        done();
    });

    it('should get user attribute lists', function(done) {
        mParticle.reset();

        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

        var userAttributes = mParticle.Identity.getCurrentUser().getUserAttributesLists();

        userAttributes.should.have.property('numbers');
        userAttributes.should.not.have.property('gender');

        done();
    });

    it('should copy when calling get user attribute lists', function(done) {
        mParticle.reset();
        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

        var userAttributes = mParticle.Identity.getCurrentUser().getUserAttributesLists();

        userAttributes['numbers'].push(6);

        var userAttributes1 = mParticle.Identity.getCurrentUser().getUserAttributesLists();
        userAttributes1['numbers'].should.have.lengthOf(5);

        done();
    });

    it('should copy when calling get user attributes', function(done) {
        mParticle.reset();
        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

        var userAttributes = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        userAttributes.blah = 'test';
        userAttributes['numbers'].push(6);

        var userAttributes1 = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        userAttributes1['numbers'].should.have.lengthOf(5);
        userAttributes1.should.not.have.property('blah');

        done();
    });

    it('should get all user attributes', function(done) {
        mParticle.reset();

        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('test', '123');
        mParticle.Identity.getCurrentUser().setUserAttribute('another test', 'blah');

        var attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        attrs.should.have.property('test', '123');
        attrs.should.have.property('another test', 'blah');

        done();
    });

    it('should not set user attribute list if value is not array', function(done) {
        mParticle.reset();
        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttributeList('mykey', 1234);

        var attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        attrs.should.not.have.property('mykey');

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

    it('should set client id', function(done) {
        window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation);
        var data = getEvent('Test Event');

        data.should.have.property('cgid').with.lengthOf(36);

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
            pageViewFilters: [],
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
                    4, 'foo-brand', 'foo-variant', 'foo-category', 'foo-position', 'foo-productcouponcode', productAttributes);

        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('foo-transaction-id', 'foo-affiliation', 'foo-couponcode', 400, 10, 8);
        mParticle.eCommerce.logPurchase(transactionAttributes, product, false, eventAttributes);
        mockForwarder.instance.receivedEvent.should.have.property('ProductAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(2);

        var plusOneEvent = expandedEvents[0];
        plusOneEvent.should.have.property('EventName', 'eCommerce - purchase - Total');
        plusOneEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
        var attributes = plusOneEvent.EventAttributes;
        attributes.should.have.property('Transaction Id', 'foo-transaction-id');
        attributes.should.have.property('Affiliation', 'foo-affiliation');
        attributes.should.have.property('Coupon Code', 'foo-couponcode');
        attributes.should.have.property('Total Amount', 400);
        attributes.should.have.property('Shipping Amount', 10);
        attributes.should.have.property('Tax Amount', 8);
        attributes.should.have.property('Currency Code', 'foo-currency');
        attributes.should.have.property('foo-event-attribute-key', 'foo-event-attribute-value');

        var productEvent = expandedEvents[1];
        productEvent.should.have.property('EventName', 'eCommerce - purchase - Item');
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
            pageViewFilters: [],
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
        plusOneEvent.should.have.property('EventName', 'eCommerce - refund - Total');

        var productEvent = expandedEvents[1];
        productEvent.should.have.property('EventName', 'eCommerce - refund - Item');

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
            pageViewFilters: [],
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

        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.RemoveFromWishlist, product, eventAttributes);
        mockForwarder.instance.receivedEvent.should.have.property('ProductAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var productEvent = expandedEvents[0];
        productEvent.should.have.property('EventName', 'eCommerce - remove_from_wishlist - Item');
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
            pageViewFilters: [],
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
                    4, 'foo-brand', 'foo-variant', 'foo-category', 'foo-position', 'foo-productcouponcode', productAttributes);

        mParticle.eCommerce.Cart.add(product, true);
        mParticle.eCommerce.logCheckout('foo-step', 'foo-options', eventAttributes);
        mockForwarder.instance.receivedEvent.should.have.property('ProductAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var productEvent = expandedEvents[0];
        productEvent.should.have.property('EventName', 'eCommerce - checkout - Item');
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
            pageViewFilters: [],
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
            pageViewFilters: [],
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

    it('should not set bad session attribute value', function(done) {
        mParticle.setSessionAttribute('name', { bad: 'bad' });

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('sa');
        event.sa.should.not.have.property('name');

        done();
    });

    it('should not set a bad user attribute key or value', function(done) {
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', { bad: 'bad' });
        mParticle.logEvent('test bad user attributes1');
        var event1 = getEvent('test bad user attributes1');

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', ['bad', 'bad', 'bad']);
        mParticle.logEvent('test bad user attributes2');
        var event2 = getEvent('test bad user attributes2');

        mParticle.Identity.getCurrentUser().setUserAttribute({ bad: 'bad' }, 'male');
        mParticle.logEvent('test bad user attributes3');
        var event3 = getEvent('test bad user attributes3');

        mParticle.Identity.getCurrentUser().setUserAttribute(['bad', 'bad', 'bad'], 'female');
        mParticle.logEvent('test bad user attributes4');
        var event4 = getEvent('test bad user attributes4');

        mParticle.Identity.getCurrentUser().setUserAttribute(null, 'female');
        mParticle.logEvent('test bad user attributes5');
        var event5 = getEvent('test bad user attributes5');

        mParticle.Identity.getCurrentUser().setUserAttribute(undefined, 'female');
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

    it('should return false for an invalid identity type and true for a valid identity type', function(done) {
        var invalidResult1 = mParticle.IdentityType.isValid(11);
        var invalidResult2 = mParticle.IdentityType.isValid('5');
        var validResult = mParticle.IdentityType.isValid(1);

        invalidResult1.should.be.false;
        invalidResult2.should.be.false;
        validResult.should.be.true;

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
        setLocalStorage({das: guid});
        mParticle.init(apiKey);

        var deviceId = mParticle.getDeviceId();

        deviceId.should.equal(guid);
        done();
    });

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
            data[testMPID].csd.should.have.property('5');

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

        setLocalStorage({
            mpid: testMPID,
            csd: { 5: (new Date(500)).getTime() }
        });

        mParticle.init(apiKey);

        setTimeout(function() {
            var data = mParticle.persistence.getLocalStorage();
            var updated = data[testMPID].csd['5']>500;

            Should(updated).be.ok();

            done();
        }, 50);
    });

    it('should not sync cookies when last date is within frequencyCap', function(done) {
        //TODO: CHECK THIS TEST WITH CSD
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
        setLocalStorage({
            mpid: testMPID,
            csd: { 5: lastCookieSyncTime }
        });
        mParticle.init(apiKey);
        server.requests = [];

        var data = mParticle.persistence.getLocalStorage();

        data[testMPID].csd.should.have.property(5, lastCookieSyncTime);

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

        Object.keys(data1[testMPID].csd).length.should.equal(0);
        Object.keys(data2[testMPID].csd).length.should.equal(0);

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

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.modify();
        var data2 = mParticle.persistence.getLocalStorage();
        data1[testMPID].csd[5].should.be.ok();
        data2['otherMPID'].csd[5].should.be.ok();

        done();
    });

    it('should not sync cookies when pixelSettings.isDebug is false, pixelSettings.isProduction is true, and mParticle.isDevelopment is true', function(done) {
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
        mParticle.isDevelopment = true;
        mParticle.configurePixel(pixelSettings);

        mParticle.init(apiKey);

        var data1 = mParticle.persistence.getLocalStorage();

        Object.keys(data1[testMPID].csd).should.not.have.property(5);

        done();
    });

    it('should not sync cookies when pixelSettings.isDebug is true, pixelSettings.isProduction is false, and mParticle.isDevelopment is false', function(done) {
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
        mParticle.isDevelopment = false;
        mParticle.configurePixel(pixelSettings);

        mParticle.init(apiKey);

        var data1 = mParticle.persistence.getLocalStorage();

        data1[testMPID].csd.should.not.have.property(5);

        done();
    });

    it('should send das with each event logged', function(done) {
        window.mParticle.logEvent('Test Event');
        var data = getEvent('Test Event');

        data.should.have.property('das');
        (data.das.length).should.equal(36);
        done();
    });

    it('should replace mpID properly', function(done) {
        var result = mParticle.cookieSyncManager.replaceMPID('www.google.com?mpid=%%mpid%%?foo=bar', 123);

        result.should.equal('www.google.com?mpid=123?foo=bar');

        done();
    });

    it('should return the deviceId when requested', function(done) {
        var deviceId = mParticle.getDeviceId();

        Should(deviceId).be.ok();
        deviceId.length.should.equal(36);

        done();
    });

    it('should remove \'amp;\' from the URLs', function(done) {
        var result = mParticle.cookieSyncManager.replaceAmp('www.google.com?mpid=%%mpid%%&amp;foo=bar');

        result.should.equal('www.google.com?mpid=%%mpid%%&foo=bar');

        done();
    });

    it('should move old schema from cookies to localStorage with useCookieStorage = false', function(done) {
        mParticle.reset();
        setCookie({
            ui: [{Identity: '123', Type: 1}]
        });
        var beforeInitCookieData = JSON.parse(getCookie());

        mParticle.useCookieStorage = false;

        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        var localStorageData = mParticle.persistence.getLocalStorage();
        var afterInitCookieData = getCookie();
        beforeInitCookieData.ui[0].should.have.property('Identity', '123');
        localStorageData[testMPID].ua.should.have.property('gender', 'male');
        localStorageData[testMPID].ui.should.have.property('customerid', '123');
        Should(afterInitCookieData).not.be.ok();

        done();
    });

    it('should move new schema from cookies to localStorage with useCookieStorage = false', function(done) {
        mParticle.reset();
        setCookie({
            testMPID: {
                ui: { customerid: '123' }
            },
            currentUserMPID: testMPID
        });
        var beforeInitCookieData = JSON.parse(getCookie());

        mParticle.useCookieStorage = false;

        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        var localStorageData = mParticle.persistence.getLocalStorage();
        var afterInitCookieData = getCookie();
        beforeInitCookieData[testMPID].ui.should.have.property('customerid', '123');
        localStorageData[testMPID].ua.should.have.property('gender', 'male');
        localStorageData[testMPID].ui.should.have.property('customerid', '123');
        Should(afterInitCookieData).not.be.ok();

        done();
    });

    it('should move old schema from localStorage to cookies with useCookieStorage = true', function(done) {
        mParticle.reset();
        setLocalStorage({
            ui: [{Identity: 123, Type: 1}]
        });

        mParticle.useCookieStorage = true;
        apiKey.identifyRequest = { copyUserAttributes: true};
        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        var localStorageData = localStorage.getItem('mprtcl-api');
        var cookieData = JSON.parse(getCookie());

        Should(localStorageData).not.be.ok();

        cookieData[testMPID].ua.should.have.property('gender', 'male');
        cookieData[testMPID].ui.should.have.property('customerid', '123');

        window.mParticle.useCookieStorage = false;
        done();
    });

    it('should move new schema from localStorage to cookies with useCookieStorage = true', function(done) {
        mParticle.reset();
        setLocalStorage({
            testMPID: {
                ui: { customerid: '123' }
            },
            currentUserMPID: testMPID
        });

        mParticle.useCookieStorage = true;
        apiKey.identifyRequest = { copyUserAttributes: true};
        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        var localStorageData = localStorage.getItem('mprtcl-api');
        var cookieData = JSON.parse(getCookie());

        Should(localStorageData).not.be.ok();

        cookieData[testMPID].ua.should.have.property('gender', 'male');
        cookieData[testMPID].ui.should.have.property('customerid', '123');

        window.mParticle.useCookieStorage = false;
        done();
    });

    it('will create a cgid when no previous cgid exists after initializing storage, and no sid', function(done) {
        mParticle.reset();
        expireCookie();
        window.mParticle.useCookieStorage = true;

        mParticle.persistence.initializeStorage();
        mParticle.persistence.update();

        var cookieData = mParticle.persistence.getCookie();
        var parsedCookie = JSON.parse(cookieData);

        parsedCookie[testMPID].should.have.properties(['cgid']);
        parsedCookie[testMPID].should.have.property('sid', null);
        window.mParticle.useCookieStorage = false;

        done();
    });

    it('should not do an identity swap if there is no MPID change', function(done) {
        var cookiesBefore = mParticle.persistence.getLocalStorage();
        mParticle._Identity.checkIdentitySwap(testMPID, testMPID);

        mParticle.persistence.update();

        var cookiesAfter = mParticle.persistence.getLocalStorage();

        cookiesBefore.currentUserMPID.should.equal(cookiesAfter.currentUserMPID);

        done();
    });

    it('should do an identity swap if there is an MPID change', function(done) {
        var cookiesBefore = mParticle.persistence.getLocalStorage();

        mParticle._Identity.checkIdentitySwap(testMPID, 'currentMPID');

        var cookiesAfter = mParticle.persistence.getLocalStorage();
        cookiesBefore.currentUserMPID.should.equal(testMPID);

        cookiesAfter.currentUserMPID.should.equal('currentMPID');

        done();
    });

    it('should store all MPIDs associated with a sessionId, then clear sessionIds when a new session starts', function(done) {
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.login();
        var localStorageDataBeforeSessionEnd = mParticle.persistence.getLocalStorage();

        localStorageDataBeforeSessionEnd.currentSessionMPIDs.length.should.equal(2);

        mParticle.endSession();
        var localStorageDataAfterSessionEnd1 = mParticle.persistence.getLocalStorage();
        localStorageDataAfterSessionEnd1.currentSessionMPIDs.length.should.equal(0);

        mParticle.logEvent('hi');
        mParticle.Identity.login();

        var localStorageAfterLoggingEvent = mParticle.persistence.getLocalStorage();
        localStorageAfterLoggingEvent.currentSessionMPIDs.length.should.equal(1);

        done();
    });

    it('localStorage - should key cookies on mpid on first run', function(done) {
        var cookies1 = mParticle.persistence.getLocalStorage();

        cookies1.should.not.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        cookies1.should.have.property('currentUserMPID', testMPID);
        cookies1.should.have.property(testMPID);
        cookies1[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.login();
        var cookies2 = mParticle.persistence.getLocalStorage();

        cookies2.should.have.property('currentUserMPID', 'otherMPID');
        cookies2[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        cookies2.otherMPID.should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);

        done();
    });

    it('cookies - should key cookies on mpid when there are no cookies yet', function(done) {
        mParticle.reset();
        removeLocalStorageFiles();
        window.mParticle.useCookieStorage = true;
        mParticle.init(apiKey);

        var cookies1 = JSON.parse(getCookie());
        cookies1.should.not.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        cookies1.should.have.property('currentUserMPID', testMPID);
        cookies1.should.have.property(testMPID);
        cookies1[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.modify();
        var cookies2 = JSON.parse(getCookie());

        cookies2.should.have.property('currentUserMPID', 'otherMPID');
        cookies2[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        cookies2.otherMPID.should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        window.mParticle.useCookieStorage = false;

        done();
    });

    it('localStorage - should migrate previous cookies into new schema', function(done) {
        mParticle.reset();
        window.mParticle.useCookieStorage = false;
        removeLocalStorageFiles();
        var cookiesAfterReset = mParticle.persistence.getLocalStorage();
        Should(cookiesAfterReset).not.be.ok();

        setLocalStorage({
            mpid: testMPID,
            cgid: 'cgidTEST'
        });

        mParticle.init(apiKey);
        var cookiesAfterInit = mParticle.persistence.getLocalStorage();

        cookiesAfterInit.should.not.have.properties(['cgid', 'mpid']);
        cookiesAfterInit.should.have.properties([testMPID, 'currentUserMPID']);
        cookiesAfterInit.should.have.property(testMPID);
        cookiesAfterInit[testMPID].should.have.property('cgid', 'cgidTEST');
        cookiesAfterInit[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);

        done();
    });

    it('cookies - should migrate previous cookies into new schema', function(done) {
        mParticle.reset();
        removeLocalStorageFiles();
        window.mParticle.useCookieStorage = true;

        var cookiesAfterReset = JSON.parse(getCookie());
        Should(cookiesAfterReset).not.be.ok();

        setLocalStorage({
            mpid: testMPID,
            cgid: 'cgidTEST',
            ui: [{
                Identity: 'objData',
                Type: 1
            }]
        });
        mParticle.init(apiKey);

        var cookiesAfterInit = JSON.parse(getCookie());
        cookiesAfterInit.should.not.have.properties(['cgid', 'mpid']);
        cookiesAfterInit.should.have.properties([testMPID, 'currentUserMPID']);
        cookiesAfterInit[testMPID].should.have.property('cgid', 'cgidTEST');
        cookiesAfterInit[testMPID].ui.should.have.property('customerid', 'objData');
        cookiesAfterInit[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);

        done();
    });

    it('localStorage - should switch user cookies to new mpid details from cookies when a new mpid is provided', function(done) {
        mParticle.reset();
        removeLocalStorageFiles();
        window.mParticle.useCookieStorage = false;

        setLocalStorage({
            testMPID: {
                csd: { 10: 500 }
            },
            currentUserMPID: 'testMPID'
        });
        mParticle.init(apiKey);

        var cookies1 = mParticle.persistence.getLocalStorage();
        cookies1.currentUserMPID.should.equal(testMPID);
        cookies1[testMPID].should.have.property('csd');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.modify();
        var cookiesAfterMPIDChange = mParticle.persistence.getLocalStorage();
        cookiesAfterMPIDChange.should.have.properties(['currentUserMPID', 'otherMPID', testMPID]);
        cookiesAfterMPIDChange.should.have.property('currentUserMPID', 'otherMPID');
        cookiesAfterMPIDChange.otherMPID.should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        cookiesAfterMPIDChange[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);

        done();
    });

    it('cookies - should switch user cookies to new mpid details from cookies when a new mpid is provided', function(done) {
        mParticle.reset();
        removeLocalStorageFiles();
        window.mParticle.useCookieStorage = true;

        setLocalStorage({
            mpid: testMPID,
            cgid: 'cgidTEST'
        });
        mParticle.init(apiKey);

        var cookiesAfterInit = JSON.parse(getCookie());
        cookiesAfterInit.should.not.have.properties(['mpid', 'ui', 'ua', 'les', 'sid', 'ie', 'dt', 'sa', 'ss', 'pb', 'cp']);
        cookiesAfterInit.should.have.property(testMPID);
        cookiesAfterInit[testMPID].should.have.property('cgid', 'cgidTEST');
        cookiesAfterInit[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.modify();

        var cookiesAfterMPIDChange = JSON.parse(getCookie());
        cookiesAfterMPIDChange.should.have.properties(['currentUserMPID', 'otherMPID', testMPID]);
        cookiesAfterMPIDChange.should.have.property('currentUserMPID', 'otherMPID');
        cookiesAfterMPIDChange.otherMPID.should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        cookiesAfterMPIDChange[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        window.mParticle.useCookieStorage = false;


        done();
    });

    it('puts data into cookies when running initializeStorage with useCookieStorage = true', function(done) {
        window.mParticle.useCookieStorage = true;
        mParticle.persistence.initializeStorage();

        cookieData = mParticle.persistence.getCookie();

        var cookieDataType = typeof cookieData;
        var localStorageData = mParticle.persistence.getLocalStorage();
        var parsedCookie = JSON.parse(cookieData);

        cookieDataType.should.be.type('string');
        parsedCookie[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        Should(localStorageData).not.be.ok();

        window.mParticle.useCookieStorage = false;

        done();
    });

    it('puts data into localStorage when running initializeStorage with useCookieStorage = false', function(done) {
        window.mParticle.useCookieStorage = false;
        mParticle.persistence.initializeStorage();

        cookieData = mParticle.persistence.getCookie();

        var localStorageData = mParticle.persistence.getLocalStorage();
        localStorageData[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        Should(cookieData).not.be.ok();

        done();
    });

    it('puts data into cookies when updating persistence with useCookieStorage = true', function(done) {
        var cookieData, cookieDataType, parsedCookie, localStorageData;
        // Flush out anything in localStorage before updating in order to silo testing persistence.update()
        window.localStorage.removeItem('mprtcl-api');

        window.mParticle.useCookieStorage = true;
        mParticle.persistence.update();

        cookieData = mParticle.persistence.getCookie();
        cookieDataType = typeof cookieData;
        parsedCookie = JSON.parse(cookieData);
        localStorageData = mParticle.persistence.getLocalStorage();

        cookieDataType.should.be.type('string');
        parsedCookie[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        Should(localStorageData).not.be.ok();

        window.mParticle.useCookieStorage = false;

        done();
    });

    it('puts data into localStorage when updating persistence with useCookieStorage = false', function(done) {
        var localStorageData, cookieData;
        // Flush out anything in expire before updating in order to silo testing persistence.update()
        expireCookie();
        window.mParticle.useCookieStorage = false;
        mParticle.persistence.update();

        localStorageData = mParticle.persistence.getLocalStorage();
        cookieData = mParticle.persistence.getCookie();
        localStorageData[testMPID].should.have.properties(['ie', 'sa', 'ua', 'ui', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'csd', 'mpid', 'cp', 'pb', 'sid', 'c']);
        Should(cookieData).not.be.ok();

        done();
    });

    it('stores data in memory both when the result is passed in as a string or as an object', function(done) {
        var objData = {
            ui: [{
                Identity: 'objData',
                Type: 1
            }]
        };
        mParticle.persistence.storeDataInMemory(objData);

        var userIdentity1 = mParticle.Identity.getCurrentUser().getUserIdentities();
        userIdentity1.userIdentities.should.have.property('customerid', 'objData');
        var stringData = '{"ui":[{"Identity":"stringData","Type":2}]}';
        mParticle.persistence.storeDataInMemory(stringData);

        var userIdentity2 = mParticle.Identity.getCurrentUser().getUserIdentities();

        userIdentity2.userIdentities.should.have.property('facebook', 'stringData');

        done();
    });

    it('creates a new session when elapsed time between actions is greater than session timeout', function(done) {
        mParticle.reset();
        mParticle.init(apiKey, {SessionTimeout: .0000001});
        mParticle.logEvent('Test Event');
        var data = getEvent('Test Event');

        setTimeout(function() {
            mParticle.logEvent('Test Event2');
            data2 = getEvent('Test Event2');
            data.sid.should.not.equal(data2.sid);
            mParticle.sessionManager.clearSessionTimeout();
            done();
        }, 10);
    });

    it('should get sessionId', function(done) {
        mParticle.logEvent('Test Event');
        var data = getEvent('Test Event');

        var sessionId = mParticle.sessionManager.getSession();

        data.sid.should.equal(sessionId);

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

    it('should swap property identityType for identityName', function(done) {
        var data = {userIdentities: {}};
        data.userIdentities.other = 'id1';
        data.userIdentities.customerid = 'id2';
        data.userIdentities.facebook = 'id3';
        data.userIdentities.twitter = 'id4';
        data.userIdentities.google = 'id5';
        data.userIdentities.microsoft = 'id6';
        data.userIdentities.yahoo = 'id7';
        data.userIdentities.email = 'id8';
        data.userIdentities.facebookcustomaudienceid = 'id9';
        data.userIdentities.other1 = 'id10';
        data.userIdentities.other2 = 'id11';
        data.userIdentities.other3 = 'id12';
        data.userIdentities.other4 = 'id13';

        var count = 0;
        for (var key in data.userIdentities) {
            mParticle._IdentityRequest.getIdentityType(key).should.equal(count);
            count++;
            // 8 is alias, which was removed
            if (count === 8) {
                count = 9;
            }
        }

        done();
    });

    it('should create a proper identity request', function(done) {
        var data = {userIdentities: {}, copyUserAttributes: true};
        data.userIdentities.other = 'id1';
        data.userIdentities.customerid = 'id2';
        data.userIdentities.facebook = 'id3';
        data.userIdentities.twitter = 'id4';
        data.userIdentities.google = 'id5';
        data.userIdentities.microsoft = 'id6';
        data.userIdentities.yahoo = 'id7';
        data.userIdentities.email = 'id8';
        data.userIdentities.facebookcustomaudienceid = 'id9';
        data.userIdentities.other1 = 'id10';
        data.userIdentities.other2 = 'id11';
        data.userIdentities.other3 = 'id12';
        data.userIdentities.other4 = 'id13';

        var identityRequest = mParticle._IdentityRequest.createIdentityRequest(data);
        identityRequest.should.have.properties(['client_sdk', 'environment', 'context', 'known_identities', 'previous_mpid', 'request_id', 'request_timestamp_ms']);
        identityRequest.client_sdk.should.have.properties(['platform', 'sdk_vendor', 'sdk_version']);
        identityRequest.client_sdk.platform.should.equal('web');
        identityRequest.client_sdk.sdk_vendor.should.equal('mparticle');
        identityRequest.environment.should.equal('production');
        identityRequest.previous_mpid.should.equal(testMPID);
        identityRequest.known_identities.should.have.properties(['other', 'customerid', 'facebook', 'twitter', 'google', 'microsoft', 'yahoo', 'email', 'facebookcustomaudienceid', 'other1', 'other2', 'other3', 'other4', 'device_application_stamp']);
        identityRequest.known_identities.other.should.equal('id1');
        identityRequest.known_identities.customerid.should.equal('id2');
        identityRequest.known_identities.facebook.should.equal('id3');
        identityRequest.known_identities.twitter.should.equal('id4');
        identityRequest.known_identities.google.should.equal('id5');
        identityRequest.known_identities.microsoft.should.equal('id6');
        identityRequest.known_identities.yahoo.should.equal('id7');
        identityRequest.known_identities.email.should.equal('id8');
        identityRequest.known_identities.facebookcustomaudienceid.should.equal('id9');
        identityRequest.known_identities.other1.should.equal('id10');
        identityRequest.known_identities.other2.should.equal('id11');
        identityRequest.known_identities.other3.should.equal('id12');
        identityRequest.known_identities.other4.should.equal('id13');

        done();
    });

    it('should create a proper modify identity request', function(done) {
        var oldIdentities = {};
        oldIdentities.other = 'id1';
        oldIdentities.customerid = 'id2';
        oldIdentities.facebook = 'id3';
        oldIdentities.twitter = 'id4';
        oldIdentities.google = 'id5';
        oldIdentities.microsoft = 'id6';
        oldIdentities.yahoo = 'id7';
        oldIdentities.email = 'id8';
        oldIdentities.facebookcustomaudienceid = 'id9';
        oldIdentities.other1 = 'id10';
        oldIdentities.other2 = 'id11';
        oldIdentities.other3 = 'id12';
        oldIdentities.other4 = 'id13';
        var newIdentities = {};
        newIdentities.other = 'id14';
        newIdentities.customerid = 'id15';
        newIdentities.facebook = 'id16';
        newIdentities.twitter = 'id17';
        newIdentities.google = 'id18';
        newIdentities.microsoft = 'id19';
        newIdentities.yahoo = 'id20';
        newIdentities.email = 'id21';
        newIdentities.facebookcustomaudienceid = 'id22';
        newIdentities.other1 = 'id23';
        newIdentities.other2 = 'id24';
        newIdentities.other3 = 'id25';
        newIdentities.other4 = 'id26';

        var identityRequest = mParticle._IdentityRequest.createModifyIdentityRequest(oldIdentities, newIdentities);
        identityRequest.should.have.properties(['client_sdk', 'environment', 'identity_changes', 'request_id', 'request_timestamp_ms']);
        identityRequest.client_sdk.should.have.properties(['platform', 'sdk_vendor', 'sdk_version']);
        identityRequest.client_sdk.platform.should.equal('web');
        identityRequest.client_sdk.sdk_vendor.should.equal('mparticle');
        identityRequest.environment.should.equal('production');
        identityRequest.identity_changes[0].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[0].old_value.should.equal('id1');
        identityRequest.identity_changes[0].identity_type.should.equal('other');
        identityRequest.identity_changes[0].new_value.should.equal('id14');

        identityRequest.identity_changes[1].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[1].old_value.should.equal('id2');
        identityRequest.identity_changes[1].identity_type.should.equal('customerid');
        identityRequest.identity_changes[1].new_value.should.equal('id15');

        identityRequest.identity_changes[2].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[2].old_value.should.equal('id3');
        identityRequest.identity_changes[2].identity_type.should.equal('facebook');
        identityRequest.identity_changes[2].new_value.should.equal('id16');

        identityRequest.identity_changes[3].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[3].old_value.should.equal('id4');
        identityRequest.identity_changes[3].identity_type.should.equal('twitter');
        identityRequest.identity_changes[3].new_value.should.equal('id17');

        identityRequest.identity_changes[4].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[4].old_value.should.equal('id5');
        identityRequest.identity_changes[4].identity_type.should.equal('google');
        identityRequest.identity_changes[4].new_value.should.equal('id18');

        identityRequest.identity_changes[5].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[5].old_value.should.equal('id6');
        identityRequest.identity_changes[5].identity_type.should.equal('microsoft');
        identityRequest.identity_changes[5].new_value.should.equal('id19');

        identityRequest.identity_changes[6].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[6].old_value.should.equal('id7');
        identityRequest.identity_changes[6].identity_type.should.equal('yahoo');
        identityRequest.identity_changes[6].new_value.should.equal('id20');

        identityRequest.identity_changes[7].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[7].old_value.should.equal('id8');
        identityRequest.identity_changes[7].identity_type.should.equal('email');
        identityRequest.identity_changes[7].new_value.should.equal('id21');

        identityRequest.identity_changes[8].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[8].old_value.should.equal('id9');
        identityRequest.identity_changes[8].identity_type.should.equal('facebookcustomaudienceid');
        identityRequest.identity_changes[8].new_value.should.equal('id22');

        identityRequest.identity_changes[9].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[9].old_value.should.equal('id10');
        identityRequest.identity_changes[9].identity_type.should.equal('other1');
        identityRequest.identity_changes[9].new_value.should.equal('id23');

        identityRequest.identity_changes[10].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[10].old_value.should.equal('id11');
        identityRequest.identity_changes[10].identity_type.should.equal('other2');
        identityRequest.identity_changes[10].new_value.should.equal('id24');

        identityRequest.identity_changes[11].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[11].old_value.should.equal('id12');
        identityRequest.identity_changes[11].identity_type.should.equal('other3');
        identityRequest.identity_changes[11].new_value.should.equal('id25');

        identityRequest.identity_changes[12].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[12].old_value.should.equal('id13');
        identityRequest.identity_changes[12].identity_type.should.equal('other4');
        identityRequest.identity_changes[12].new_value.should.equal('id26');

        done();
    });

    it('should not make a request when an invalid request is sent to login', function(done) {
        var identityAPIRequest1 = {
            userIdentities: 'badUserIdentitiesString',
            copyUserAttributes: true
        };
        mParticle.Identity.login(identityAPIRequest1);

        var badData1 = getIdentityEvent('login');
        Should(badData1).not.be.ok();

        var identityAPIRequest2 = {
            userIdentities: ['bad', 'user', 'identities', 'array'],
            copyUserAttributes: true
        };
        mParticle.Identity.login(identityAPIRequest2);

        var badData2 = getIdentityEvent('login');
        Should(badData2).not.be.ok();

        var identityAPIRequest3 = {
            userIdentities: null,
            copyUserAttributes: true
        };
        mParticle.Identity.login(identityAPIRequest3);

        var badData3 = getIdentityEvent('login');
        Should(badData3).not.be.ok();

        var identityAPIRequest4 = {
            userIdentities: undefined,
            copyUserAttributes: true
        };
        mParticle.Identity.login(identityAPIRequest4);

        var badData4 = getIdentityEvent('login');
        Should(badData4).not.be.ok();

        var identityAPIRequest5 = {
            userIdentities: true,
            copyUserAttributes: true
        };
        mParticle.Identity.login(identityAPIRequest5);

        var badData5 = getIdentityEvent('login');
        Should(badData5).not.be.ok();

        done();
    });

    it('should not make a request when an invalid request is sent to logout', function(done) {
        var identityAPIRequest1 = {
            userIdentities: 'badUserIdentitiesString',
            copyUserAttributes: true
        };
        mParticle.Identity.logout(identityAPIRequest1);

        var badData1 = getIdentityEvent('logout');
        Should(badData1).not.be.ok();

        var identityAPIRequest2 = {
            userIdentities: ['bad', 'user', 'identities', 'array'],
            copyUserAttributes: true
        };
        mParticle.Identity.logout(identityAPIRequest2);

        var badData2 = getIdentityEvent('logout');
        Should(badData2).not.be.ok();

        var identityAPIRequest3 = {
            userIdentities: null,
            copyUserAttributes: true
        };
        mParticle.Identity.logout(identityAPIRequest3);

        var badData3 = getIdentityEvent('logout');
        Should(badData3).not.be.ok();

        var identityAPIRequest4 = {
            userIdentities: undefined,
            copyUserAttributes: true
        };
        mParticle.Identity.logout(identityAPIRequest4);

        var badData4 = getIdentityEvent('logout');
        Should(badData4).not.be.ok();

        var identityAPIRequest5 = {
            userIdentities: true,
            copyUserAttributes: true
        };

        mParticle.Identity.logout(identityAPIRequest5);
        var badData5 = getIdentityEvent('logout');
        Should(badData5).not.be.ok();

        done();
    });

    it('should not make a request when an invalid request is sent to modify', function(done) {
        var identityAPIRequest1 = {
            userIdentities: 'badUserIdentitiesString',
            copyUserAttributes: true
        };
        mParticle.Identity.modify(identityAPIRequest1);

        var badData1 = getIdentityEvent('modify');
        Should(badData1).not.be.ok();

        var identityAPIRequest2 = {
            userIdentities: ['bad', 'user', 'identities', 'array'],
            copyUserAttributes: true
        };
        mParticle.Identity.modify(identityAPIRequest2);

        var badData2 = getIdentityEvent('modify');
        Should(badData2).not.be.ok();

        var identityAPIRequest3 = {
            userIdentities: null,
            copyUserAttributes: true
        };
        mParticle.Identity.modify(identityAPIRequest3);

        var badData3 = getIdentityEvent('modify');
        Should(badData3).not.be.ok();

        var identityAPIRequest4 = {
            userIdentities: undefined,
            copyUserAttributes: true
        };
        mParticle.Identity.modify(identityAPIRequest4);

        var badData4 = getIdentityEvent('modify');
        Should(badData4).not.be.ok();

        var identityAPIRequest5 = {
            userIdentities: true,
            copyUserAttributes: true
        };
        mParticle.Identity.modify(identityAPIRequest5);
        var badData5 = getIdentityEvent('modify');
        Should(badData5).not.be.ok();

        done();
    });

    it('should have old_value === null when there is no previous identity of a certain type and a new identity of that type', function(done) {
        var oldIdentities = {};
        oldIdentities.facebook = 'old_facebook_id';
        var newIdentities = {};
        newIdentities.other = 'new_other_id';
        newIdentities.facebook = 'new_facebook_id';

        var identityRequest = mParticle._IdentityRequest.createModifyIdentityRequest(oldIdentities, newIdentities);

        identityRequest.identity_changes[0].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[0].should.have.property('old_value', null);
        identityRequest.identity_changes[0].identity_type.should.equal('other');
        identityRequest.identity_changes[0].new_value.should.equal('new_other_id');

        identityRequest.identity_changes[1].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[1].should.have.property('old_value', 'old_facebook_id');
        identityRequest.identity_changes[1].identity_type.should.equal('facebook');
        identityRequest.identity_changes[1].new_value.should.equal('new_facebook_id');

        done();
    });

    it('should have new_value === null when there is a previous identity of a certain type and no new identity of that type', function(done) {
        var oldIdentities = {};
        oldIdentities.other = 'old_other_id';
        oldIdentities.facebook = 'old_facebook_id';
        var newIdentities = {};
        newIdentities.facebook = 'new_facebook_id';

        var identityRequest = mParticle._IdentityRequest.createModifyIdentityRequest(oldIdentities, newIdentities);

        identityRequest.identity_changes[0].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[0].old_value.should.equal('old_facebook_id');
        identityRequest.identity_changes[0].identity_type.should.equal('facebook');
        identityRequest.identity_changes[0].new_value.should.equal('new_facebook_id');

        identityRequest.identity_changes.length.should.equal(1);

        done();
    });

    it('should create a proper send request when passing identities to modify', function(done) {
        var identityAPIData = {
            userIdentities: {
                email: 'rob@gmail.com'
            }
        };

        mParticle.Identity.modify(identityAPIData);
        var data = getIdentityEvent('modify');

        data.identity_changes.length.should.equal(1);
        data.identity_changes[0].should.have.properties('old_value', 'new_value', 'identity_type');
        data.identity_changes[0].should.have.properties('old_value', 'new_value', 'identity_type');

        done();
    });

    it('queue events when MPID is 0, and then flush events once MPID changes', function(done) {
        mParticle.reset();
        removeLocalStorageFiles();

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({}));
        };
        mParticle.init(apiKey);

        server.requests = [];
        mParticle.logEvent('Test1');
        var event1 = getEvent('Test1');
        Should(event1).not.be.ok();

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.login();

        mParticle.logEvent('Test2');
        // server requests will have AST, sessionStart, Test1, Test2, and login
        server.requests.length.should.equal(5);
        event1 = getEvent('Test1');
        var event2 = getEvent('Test2');
        var identityEvent1 = getIdentityEvent('login');
        var event3 = getEvent(10);
        var event4 = getEvent(1);
        Should(event1).be.ok();
        Should(event2).be.ok();
        Should(event3).be.ok();
        Should(event4).be.ok();
        Should(identityEvent1).be.ok();

        done();
    });

    it('should only update its own cookies, not any other mpids when initializing with a different set of credentials', function(done) {
        mParticle.reset();

        var user1 = {
            userIdentities: {
                customerid: '123',
                email: '123'
            }
        };

        var user2 = {
            userIdentities: {
                customerid: '123',
                email: '123'
            }
        };

        var user3 = {
            userIdentities: {
                customerid: '123',
                email: '123'
            }
        };

        // get user 1 into cookies
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'user1'
            }));
        };

        mParticle.init(user1);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user1');

        // get user 2 into cookies
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'user2'
            }));
        };

        mParticle.Identity.login(user2);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user2');

        // get user 3 into cookies
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'user3'
            }));
        };

        mParticle.Identity.login(user3);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user3');

        // init again using user 1
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'user1'
            }));
        };

        mParticle.init(user1);

        var localStorage = mParticle.persistence.getLocalStorage();
        localStorage.user1.ua.user.should.equal('user1');
        localStorage.user2.ua.user.should.equal('user2');
        localStorage.user3.ua.user.should.equal('user3');
        done();
    });

    it('should create a new modified user identity object', function(done) {
        var previousIdentities = { 1:1, 2:2, 3:3 };
        var newIdentities = { 2:3, 3:5 };

        var modifiedUserIdentities = mParticle._IdentityRequest.modifyUserIdentities(previousIdentities, newIdentities);

        modifiedUserIdentities.should.have.properties([1, 2, 3]);
        modifiedUserIdentities[1].should.equal(1);
        modifiedUserIdentities[2].should.equal(3);
        modifiedUserIdentities[3].should.equal(5);

        done();
    });

    it('should convert user identities object to an array if no identityRequest is passed through', function(done) {
        mParticle.reset();
        server.requests = [];
        mParticle.init(apiKey);

        var data = getEvent(1);

        Array.isArray(data.ui).should.equal(true);
        done();
    });

    it('should revert to cookie storage if localStorage is not available and useCookieStorage is set to false', function(done) {
        mParticle.reset();
        window.localStorage.setItem = null;

        mParticle.useCookieStorage = false;

        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        var cookieData = JSON.parse(getCookie());

        cookieData[testMPID].ua.should.have.property('gender', 'male');

        done();
    });

    it('should properly validate identityApiRequest values', function(done) {
        var badUserIdentitiesArray = {
            userIdentities: {
                customerid: []
            }
        };

        var badUserIdentitiesObject = {
            userIdentities: {
                customerid: {}
            }
        };

        var badUserIdentitiesBoolean = {
            userIdentities: {
                customerid: false
            }
        };

        var badUserIdentitiesUndefined = {
            userIdentities: {
                customerid: undefined
            }
        };

        var validUserIdentitiesString = {
            userIdentities: {
                customerid: '123'
            }
        };

        var validUserIdentitiesNull = {
            userIdentities: {
                customerid: null
            }
        };

        var invalidUserIdentitiesCombo = {
            userIdentities: {
                customerid: '123',
                email: undefined
            }
        };

        var badUserIdentitiesArrayResult = mParticle.Validators.validateIdentities(badUserIdentitiesArray);
        var badUserIdentitiesObjectResult = mParticle.Validators.validateIdentities(badUserIdentitiesObject);
        var badUserIdentitiesBooleanResult = mParticle.Validators.validateIdentities(badUserIdentitiesBoolean);
        var badUserIdentitiesUndefinedResult = mParticle.Validators.validateIdentities(badUserIdentitiesUndefined);
        var validUserIdentitiesNullResult = mParticle.Validators.validateIdentities(validUserIdentitiesNull);
        var validUserIdentitiesStringResult = mParticle.Validators.validateIdentities(validUserIdentitiesString);
        var invalidUserIdentitiesComboResult = mParticle.Validators.validateIdentities(invalidUserIdentitiesCombo);

        badUserIdentitiesArrayResult.valid.should.equal(false);
        badUserIdentitiesObjectResult.valid.should.equal(false);
        badUserIdentitiesBooleanResult.valid.should.equal(false);
        badUserIdentitiesUndefinedResult.valid.should.equal(false);
        validUserIdentitiesNullResult.valid.should.equal(true);
        validUserIdentitiesStringResult.valid.should.equal(true);
        invalidUserIdentitiesComboResult.valid.should.equal(false);

        done();
    });

    it('should not send requests to the server with invalid userIdentity values', function(done) {
        server.requests = [];
        var badUserIdentitiesArray = {
            userIdentities: {
                customerid: []
            }
        };

        var badUserIdentitiesObject = {
            userIdentities: {
                customerid: {}
            }
        };

        var badUserIdentitiesBoolean = {
            userIdentities: {
                customerid: false
            }
        };

        var badUserIdentitiesUndefined = {
            userIdentities: {
                customerid: undefined
            }
        };

        var validUserIdentitiesString = {
            userIdentities: {
                customerid: '123'
            }
        };

        var validUserIdentitiesNull = {
            userIdentities: {
                customerid: null
            }
        };

        mParticle.Identity.login(badUserIdentitiesArray);
        mParticle.Identity.login(badUserIdentitiesObject);
        mParticle.Identity.login(badUserIdentitiesBoolean);
        mParticle.Identity.login(badUserIdentitiesUndefined);
        mParticle.Identity.login(validUserIdentitiesString);
        mParticle.Identity.login(validUserIdentitiesNull);

        server.requests.length.should.equal(2);
        done();
    });

    after(function() {
        server.stop();
    });
});
