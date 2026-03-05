//
//  Copyright 2015 mParticle, Inc.
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

    var isobject = require('isobject');

    var MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        CrashReport: 5,
        OptOut: 6,
        Commerce: 16
    },
    name = 'KISSmetricsForwarder',
    moduleId = 24;

    var constructor = function () {
        var self = this,
            isInitialized = false,
            forwarderSettings,
            reportingService,
            isTesting = false;

        self.name = name;

        function getEventTypeName(eventType) {
            return mParticle.EventType.getName(eventType);
        }

        function getIdentityTypeName(identityType) {
            return mParticle.IdentityType.getName(identityType);
        }

        function reportEvent(event) {
            if (reportingService) {
                reportingService(self, event);
            }
        }

        function processEvent(event) {
            if (isInitialized) {
                try {
                    if (event.EventDataType == MessageType.PageEvent || event.EventDataType == MessageType.PageView) {
                        if (event.EventCategory == window.mParticle.EventType.Transaction) {
                            logTransaction(event);
                        }
                        else {
                            logEvent(event);
                        }

                        reportEvent(event);
                    }
                    else if(event.EventDataType == MessageType.Commerce) {
                        logCommerceEvent(event);
                        reportEvent(event);
                    }

                    return 'Successfully sent to ' + name;
                }
                catch (e) {
                    return 'Failed to send to: ' + name + ' ' + e;
                }
            }

            return 'Can\'t send to forwarder ' + name + ', not initialized';
        }

        function setUserAttribute(key, value) {
            if (isInitialized) {
                if (forwarderSettings.includeUserAttributes.toLowerCase() == 'true') {
                    try {
                        var attributeDict = {};
                        attributeDict[key] = value;
                        _kmq.push(['set', attributeDict]);

                        return 'Successfully called SET API on ' + name;
                    }
                    catch (e) {
                        return 'Failed to call SET API on ' + name + ' ' + e;
                    }
                }
            } else {
                return 'Can\'t call setUserAttribute on forwarder ' + name + ', not initialized';
            }
        }

        function setUserIdentity(id, type) {
            if (isInitialized) {
                if (forwarderSettings.useCustomerId.toLowerCase() == 'true' &&
                    type == window.mParticle.IdentityType.CustomerId) {

                    try {
                        _kmq.push(['identify', id]);
                        return 'Successfull called IDENTITY API on ' + name;
                    }
                    catch (e) {
                        return 'Failed to call IDENTITY API on ' + name + ' ' + e;
                    }
                }
                else {
                    setUserAttribute(getIdentityTypeName(type), id);
                }
            }
            else {
                return 'Can\'t call setUserIdentity on forwarder ' + name + ', not initialized';
            }
        }

        function logEvent(data) {
            data.EventAttributes = data.EventAttributes || {};
            data.EventAttributes['MPEventType'] = getEventTypeName(data.EventCategory);

            _kmq.push(['record',
                data.EventName,
                data.EventAttributes]);
        }

        function logTransaction(data) {
            if (data.EventAttributes &&
                data.EventAttributes.$MethodName &&
                data.EventAttributes.$MethodName === 'LogEcommerceTransaction') {

                // User used logTransaction method, set the event name
                data.EventName = 'Purchased';
            }

            logEvent(data);
        }

        function logProductData(productList) {
            if(productList && productList.length > 0) {
                _kmq.push(function() {
                    productList.forEach(function(product) {
                        KM.set( {
                            'Product SKU': product.Sku,
                            'Product Name': product.Name,
                            'Category': product.Category,
                            'Quantity': product.Quantity,
                            'Price': product.Price,
                            '_t': KM.ts(),
                            '_d': 1
                        });
                    });
                });
            }
        }

        function logCommerceEvent(data) {
            var eventName,
                attributes;

            if(data.ProductAction) {
                eventName = 'Product ' + mParticle.ProductActionType.getName(
                    data.ProductAction.ProductActionType);

                if(data.ProductAction.TransactionId) {
                    attributes = {
                        'Order ID':data.ProductAction.TransactionId,
                        'Order Total':data.ProductAction.TotalAmount,
                        'Order Tax': data.ProductAction.TaxAmount,
                        'Order Shipping': data.ProductAction.ShippingAmount
                    }
                }
                else if(data.ProductAction.CheckoutStep) {
                    attributes = {
                        'Checkout Step': data.ProductAction.CheckoutStep,
                        'Checkout Options': data.ProductAction.CheckoutOptions
                    };
                }

                logProductData(data.ProductAction.ProductList);

                if(attributes) {
                    _kmq.push(['record', eventName, attributes]);
                }
                else {
                    _kmq.push(['record', eventName]);
                }
            }
            else if(data.PromotionAction) {
                eventName = mParticle.PromotionType.getName(
                    data.PromotionAction.PromotionActionType);

                if(data.PromotionAction.PromotionList) {
                    _kmq.push(function () {
                        data.PromotionAction.PromotionList.forEach(function(promotion) {
                            KM.set({
                                'Promotion Id': promotion.Id,
                                'Promotion Name': promotion.Name,
                                'Promotion Creative': promotion.Creative,
                                'Promotion Position': promotion.Position,
                                '_t':KM.ts(),
                                '_d':1
                            });
                        });
                    });
                }

                _kmq.push(['record', eventName]);
            }
            else if(data.ProductImpressions) {
                eventName = 'Product Impression';

                _kmq.push(function () {
                    data.ProductImpressions.forEach(function(impression) {
                        KM.set({
                            'Impression Name': impression.Name,
                            '_t': KM.ts(),
                            '_d': 1
                        });

                        logProductData(impression.ProductList);
                    });
                });

                _kmq.push(['record', eventName]);
            }
        }

        function initForwarder(settings, service, testMode) {
            forwarderSettings = settings;
            reportingService = service;
            isTesting = testMode;

            try {
                function _kms(u) {
                    setTimeout(function () {
                        var d = document, f = d.getElementsByTagName('script')[0],
                        s = d.createElement('script');
                        s.type = 'text/javascript'; s.async = true; s.src = u;
                        f.parentNode.insertBefore(s, f);
                    }, 1);
                }

                var protocol = forwarderSettings.useSecure == 'True' ? 'https:' : '';

                if(testMode !== true) {
                    _kms(protocol + '//i.kissmetrics.com/i.js');
                    _kms(protocol + '//doug1izaerwt3.cloudfront.net/' + forwarderSettings.apiKey + '.1.js');
                }

                isInitialized = true;

                return 'Successfully initialized: ' + name;
            }
            catch (e) {
                return 'Failed to initialize: ' + name;
            }
        }

        this.init = initForwarder;
        this.process = processEvent;
        this.setUserIdentity = setUserIdentity;
        this.setUserAttribute = setUserAttribute;
    };

    function getId() {
        return moduleId;
    }

    function register(config) {
        if (!config) {
            console.log('You must pass a config object to register the kit ' + name);
            return;
        }

        if (!isobject(config)) {
            console.log('\'config\' must be an object. You passed in a ' + typeof config);
            return;
        }

        if (isobject(config.kits)) {
            config.kits[name] = {
                constructor: constructor
            };
        } else {
            config.kits = {};
            config.kits[name] = {
                constructor: constructor
            };
        }
        console.log('Successfully registered ' + name + ' to your mParticle configuration');
    }

    if (typeof window !== 'undefined') {
        if (window && window.mParticle && window.mParticle.addForwarder) {
            window.mParticle.addForwarder({
                name: name,
                constructor: constructor,
                getId: getId
            });
        }
    }

    module.exports = {
        register: register
    };
