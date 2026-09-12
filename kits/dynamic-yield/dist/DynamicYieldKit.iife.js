var mpDynamicYieldKit = (function (exports) {

    /* eslint-disable no-undef */

    //
    //  Copyright 2018 mParticle, Inc.
    //
    //  Licensed under the Apache License, Version 2.0 (the "License");
    //  you may not use this file except in compliance with the License.
    //  You may obtain a copy of the License at
    //
    //      http://www.apache.org/licenses/LICENSE-2.0
    //
    //  Unless required by applicable law or agreed to in writing, software
    //  distributed under the License is distributed on an "AS IS" BASIS,
    //  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    //  See the License for the specific language governing permissions and
    //  limitations under the License.
    var name = 'DynamicYield',
        moduleId = 128,
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16,
        };

    var constructor = function() {
        var self = this,
            isInitialized = false,
            reportingService,
            settings,
            eventQueue = [];

        self.name = name;

        function initForwarder(forwarderSettings, service, testMode) {
            reportingService = service;
            settings = forwarderSettings;
            try {
                // DY is an AB testing tool. It is likely that clients will manually put AB testing tool scripts in the header already
                // If that is the case, do not load
                if (testMode || (window.DY && window.DY.API)) {
                    isInitialized = true;
                    processQueue(eventQueue);
                } else {
                    // DY has 2 scripts, a "dynamic.js" and a "static.js"
                    // static.js has the API method on it
                    var DYdynamic = document.createElement('script');
                    DYdynamic.type = 'text/javascript';
                    DYdynamic.async = false;
                    DYdynamic.src =
                        'https://cdn.dynamicyield.com/api/' +
                        settings.siteId +
                        '/api_dynamic.js';
                    DYdynamic.setAttribute('id', 'DYdynamic');
                    (
                        document.getElementsByTagName('head')[0] ||
                        document.getElementsByTagName('body')[0]
                    ).appendChild(DYdynamic);
                    var DYStatic = document.createElement('script');
                    DYStatic.type = 'text/javascript';
                    DYStatic.async = false;
                    DYStatic.src =
                        'https://cdn.dynamicyield.com/api/' +
                        settings.siteId +
                        '/api_static.js';
                    (
                        document.getElementsByTagName('head')[0] ||
                        document.getElementsByTagName('body')[0]
                    ).appendChild(DYStatic);
                    DYStatic.onload = function() {
                        isInitialized = true;
                        processQueue(eventQueue);
                    };
                }

                return name + ' successfully loaded';
            } catch (e) {
                return 'Failed to initialize: ' + e;
            }
        }

        function processQueue(queue) {
            var item;
            if (DY && DY.API && queue.length > 0) {
                try {
                    while (queue.length > 0) {
                        item = queue.shift();
                        item.action(item.data);
                    }
                } catch (e) {
                    console.log('Error on Dynamic Yield Kit ' + e);
                }
            }
        }

        function processEvent(event) {
            var reportEvent = false;
            if (isInitialized) {
                // first process anything from eventQueue
                processQueue(eventQueue);
                try {
                    if (
                        event.EventDataType === MessageType.Commerce &&
                        event.EventCategory ===
                            mParticle.CommerceEventType.ProductPurchase
                    ) {
                        reportEvent = logPurchase(event);
                    } else if (
                        event.EventDataType === MessageType.Commerce &&
                        event.EventCategory ===
                            mParticle.CommerceEventType.ProductAddToCart
                    ) {
                        reportEvent = logAddToCart(event);
                    } else if (
                        event.EventDataType === MessageType.Commerce &&
                        event.EventCategory ===
                            mParticle.CommerceEventType.ProductRemoveFromCart
                    ) {
                        reportEvent = logRemoveFromCart(event);
                    } else if (
                        event.EventDataType === MessageType.Commerce &&
                        event.EventCategory ===
                            mParticle.CommerceEventType.ProductAddToWishlist
                    ) {
                        reportEvent = logAddToWishlist(event);
                    } else if (
                        event.EventDataType === MessageType.PageEvent &&
                        event.EventCategory === mParticle.EventType.Search
                    ) {
                        reportEvent = logSearch(event);
                    } else if (event.EventDataType === MessageType.PageEvent) {
                        reportEvent = logEvent(event);
                    }

                    if (reportEvent === true && reportingService) {
                        reportingService(self, event);
                        return 'Successfully sent to ' + name;
                    } else {
                        return (
                            'Error logging event or event type not supported - ' +
                            reportEvent.error
                        );
                    }
                } catch (e) {
                    return 'Failed to send to: ' + name + ' ' + e;
                }
            } else {
                eventQueue.push({ action: processEvent, data: event });
            }

            return (
                "Can't send to forwarder " +
                name +
                ', not initialized. Event added to queue.'
            );
        }

        function logPurchase(event) {
            var products = mapMPProductListToDYCart(
                event.ProductAction.ProductList
            );
            var properties = {
                uniqueTransactionId: event.ProductAction.TransactionId,
                dyType: 'purchase-v1',
                value: event.ProductAction.TotalAmount,
                cart: products,
            };

            if (event.CurrencyCode) {
                properties.currency = event.CurrencyCode;
            }

            for (var key in event.EventAttributes) {
                properties[key] = event.EventAttributes[key];
            }

            DY.API('event', {
                name: 'Purchase',
                properties: properties,
            });

            return true;
        }

        function logEvent(event) {
            var properties = {};
            for (var key in event.EventAttributes) {
                properties[key] = event.EventAttributes[key];
            }

            DY.API('event', {
                name: event.EventName,
                properties: properties,
            });

            return true;
        }

        function mapMPProductListToDYCart(productList) {
            var ignoredKeys = {
                Sku: 1,
                Quantity: 1,
                Price: 1,
            };

            return productList.map(function(product) {
                var attrs = {
                    productId: product.Sku,
                    quantity: Number(product.Quantity),
                    itemPrice: Number(product.Price),
                };
                for (var key in product.Attributes) {
                    if (!ignoredKeys[key]) {
                        attrs[key] = product.Attributes[key];
                    }
                }
                return attrs;
            });
        }

        function logAddToCart(event) {
            var ignoredKeys = {
                quantity: 1,
                productId: 1,
                currency: 1,
                itemPrice: 1,
            };
            var products = mapMPProductListToDYCart(
                event.ProductAction.ProductList
            );

            products.forEach(function(product) {
                var properties = {
                    dyType: 'add-to-cart-v1',
                    value: product.quantity * product.itemPrice,
                    productId: product.productId,
                    quantity: Number(product.quantity),
                };
                if (event.CurrencyCode) {
                    properties.currency = event.CurrencyCode;
                }

                for (var key in product) {
                    if (!ignoredKeys[key]) {
                        properties[key] = product[key];
                    }
                }

                DY.API('event', {
                    name: 'Add to Cart',
                    properties: properties,
                });
            });

            return true;
        }

        function onUserIdentified(mpUser) {
            if (!isInitialized) {
                eventQueue.push({ action: onUserIdentified, data: mpUser });
                return;
            }

            var properties = { dyType: 'login-v1' },
                userIdentities = mpUser.getUserIdentities().userIdentities;

            if (userIdentities.customerid || userIdentities.email) {
                if (userIdentities.customerid) {
                    properties.cuid = userIdentities.customerid;
                    properties.cuidType = 'customerid';
                }

                if (
                    userIdentities.email &&
                    window.crypto &&
                    window.crypto.subtle &&
                    window.crypto.subtle.digest
                ) {
                    sha256(userIdentities.email.toLowerCase()).then(function(
                        result
                    ) {
                        properties.hashedEmail = result;
                        sendLoginEvent(properties);
                    });
                } else {
                    sendLoginEvent(properties);
                }
            }

            function sendLoginEvent(properties) {
                DY.API('event', {
                    name: 'Login',
                    properties: properties,
                });
            }

            // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
            function sha256(str) {
                // We transform the string into an arraybuffer.
                var buffer = new TextEncoder('utf-8').encode(str);
                return crypto.subtle.digest('SHA-256', buffer).then(function(hash) {
                    return hex(hash);
                });
            }

            function hex(buffer) {
                var hexCodes = [];
                var view = new DataView(buffer);
                for (var i = 0; i < view.byteLength; i += 4) {
                    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
                    var value = view.getUint32(i);
                    // toString(16) will give the hex representation of the number without padding
                    var stringValue = value.toString(16);
                    // We use concatenation and slice for padding
                    var padding = '00000000';
                    var paddedValue = (padding + stringValue).slice(
                        -padding.length
                    );
                    hexCodes.push(paddedValue);
                }

                // Join all the hex strings into one
                return hexCodes.join('');
            }
        }

        function logAddToWishlist(event) {
            if (event.ProductAction && event.ProductAction.ProductList) {
                event.ProductAction.ProductList.forEach(function(product) {
                    var properties = {
                        dyType: 'add-to-wishlist-v1',
                        productId: product.Sku,
                    };
                    for (var key in product.Attributes) {
                        if (key !== 'Sku') {
                            properties[key] = product.Attributes[key];
                        }
                    }

                    DY.API('event', {
                        name: 'Add to Wishlist',
                        properties: properties,
                    });
                });

                return true;
            }
        }

        function logRemoveFromCart(event) {
            var ignoredKeys = {
                quantity: 1,
                productId: 1,
                currency: 1,
            };

            var removedProduct = event.ProductAction.ProductList[0];

            var properties = {
                dyType: 'remove-from-cart-v1',
                value: removedProduct.Quantity * removedProduct.Price,
                productId: removedProduct.Sku,
                quantity: Number(removedProduct.Quantity),
            };

            if (event.CurrencyCode) {
                properties.currency = event.CurrencyCode;
            }

            for (var key in removedProduct.Attributes) {
                if (!ignoredKeys[key]) {
                    properties[key] = removedProduct.Attributes[key];
                }
            }

            DY.API('event', {
                name: 'Remove from Cart',
                properties: properties,
            });

            return true;
        }

        function logSearch(event) {
            var properties = {
                dyType: 'keyword-search-v1',
            };

            for (key in event.EventAttributes) {
                properties[key] = event.EventAttributes[key];
            }

            DY.API('event', {
                name: 'Keyword Search',
                properties: properties,
            });

            return true;
        }

        this.init = initForwarder;
        this.process = processEvent;
        this.onUserIdentified = onUserIdentified;
    };

    function getId() {
        return moduleId;
    }

    function isObject(val) {
        return (
            val != null && typeof val === 'object' && Array.isArray(val) === false
        );
    }

    function register(config) {
        if (!config) {
            console.log(
                'You must pass a config object to register the kit ' + name
            );
            return;
        }

        if (!isObject(config)) {
            console.log(
                "'config' must be an object. You passed in a " + typeof config
            );
            return;
        }

        if (isObject(config.kits)) {
            config.kits[name] = {
                constructor: constructor,
            };
        } else {
            config.kits = {};
            config.kits[name] = {
                constructor: constructor,
            };
        }
        console.log(
            'Successfully registered ' + name + ' to your mParticle configuration'
        );
    }

    if (typeof window !== 'undefined') {
        if (window && window.mParticle && window.mParticle.addForwarder) {
            window.mParticle.addForwarder({
                name: name,
                constructor: constructor,
                getId: getId,
            });
        }
    }

    var DynamicYieldKit = {
        register: register,
    };
    var DynamicYieldKit_1 = DynamicYieldKit.register;

    exports.default = DynamicYieldKit;
    exports.register = DynamicYieldKit_1;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
