var mpFacebookKit = (function (exports) {
  /*!
   * isobject <https://github.com/jonschlinkert/isobject>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */

  function isObject(val) {
    return val != null && typeof val === 'object' && Array.isArray(val) === false;
  }

  /* eslint-disable no-undef */
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


  var name = 'Facebook',
      moduleId = 45,
      MessageType = {
          SessionStart: 1,
          SessionEnd: 2,
          PageView: 3,
          PageEvent: 4,
          CrashReport: 5,
          OptOut: 6,
          Commerce: 16,
      },
      IdentityType = {
          Other: 0,
          CustomerId: 1,
          Facebook: 2,
          Twitter: 3,
          Google: 4,
          Microsoft: 5,
          Yahoo: 6,
          Email: 7,
          FacebookCustomAudienceId: 9,
          Other2: 10,
          Other3: 11,
          Other4: 12,
          Other5: 13,
          Other6: 14,
          Other7: 15,
          Other8: 16,
          Other9: 17,
          Other10: 18,
          MobileNumber: 19,
          PhoneNumber2: 20,
          PhoneNumber3: 21,
      },
      SupportedCommerceTypes = [],
      //  Standard FB Event Names from https://developers.facebook.com/docs/facebook-pixel/reference#standard-events
      ADD_TO_CART_EVENT_NAME = 'AddToCart',
      ADD_TO_WISHLIST_EVENT_NAME = 'AddToWishlist',
      CHECKOUT_EVENT_NAME = 'InitiateCheckout',
      PAGE_VIEW_EVENT_NAME = 'PageView',
      PURCHASE_EVENT_NAME = 'Purchase',
      REMOVE_FROM_CART_EVENT_NAME = 'RemoveFromCart',
      VIEW_CONTENT_EVENT_NAME = 'ViewContent',
      constructor = function() {
          var self = this,
              isInitialized = false,
              reportingService = null,
              settings,
              productAttributeMapping;

          self.name = name;

          function initForwarder(
              forwarderSettings,
              service,
              testMode,
              trackerId,
              userAttributes,
              userIdentities
          ) {
              settings = forwarderSettings;
              reportingService = service;

              SupportedCommerceTypes = [
                  mParticle.ProductActionType.Checkout,
                  mParticle.ProductActionType.Purchase,
                  mParticle.ProductActionType.AddToCart,
                  mParticle.ProductActionType.RemoveFromCart,
                  mParticle.ProductActionType.AddToWishlist,
                  mParticle.ProductActionType.ViewDetail,
              ];

              try {
                  if (!testMode) {
                      !(function(f, b, e, v, n, t, s) {
                          if (f.fbq) return;
                          n = f.fbq = function() {
                              n.callMethod
                                  ? n.callMethod.apply(n, arguments)
                                  : n.queue.push(arguments);
                          };
                          if (!f._fbq) f._fbq = n;
                          n.push = n;
                          n.loaded = !0;
                          n.version = '2.0';
                          n.queue = [];
                          t = b.createElement(e);
                          t.async = !0;
                          t.src = v;
                          s = b.getElementsByTagName(e)[0];
                          s.parentNode.insertBefore(t, s);
                      })(
                          window,
                          document,
                          'script',
                          'https://connect.facebook.net/en_US/fbevents.js'
                      );

                      var visitorData = {};

                      if (
                          settings.externalUserIdentityType &&
                          userIdentities &&
                          userIdentities.length > 0
                      ) {
                          var selectedType =
                              IdentityType[settings.externalUserIdentityType];
                          var selectedIdentity = userIdentities.filter(function(
                              identityElement
                          ) {
                              if (identityElement.Type === selectedType) {
                                  return identityElement.Identity;
                              }
                          });

                          if (selectedIdentity.length > 0) {
                              visitorData['external_id'] =
                                  selectedIdentity[0].Identity;
                          }
                      }
                  }

                  if (settings.disablePushState === 'True') {
                      // Facebook will automatically track page views whenever a new state is pushed to the HTML 5 History State API
                      // this option can be disabled to prevent duplicate page views
                      // https://developers.facebook.com/docs/facebook-pixel/implementation/tag_spa/#tagging-single-page-applications
                      fbq.disablePushState = true;
                  }
                  fbq('init', settings.pixelId, visitorData);

                  loadMappings();

                  isInitialized = true;

                  return 'Successfully initialized: ' + name;
              } catch (e) {
                  return "Can't initialize forwarder: " + name + ':' + e;
              }
          }

          function loadMappings() {
              productAttributeMapping = settings.productAttributeMapping
                  ? JSON.parse(
                        settings.productAttributeMapping.replace(/&quot;/g, '"')
                    )
                  : [];
          }

          function processEvent(event) {
              var reportEvent = false;

              if (!isInitialized) {
                  return "Can't send forwarder " + name + ', not initialized';
              }

              try {
                  if (event.EventDataType == MessageType.PageView) {
                      reportEvent = true;
                      logPageView(event);
                  } else if (event.EventDataType == MessageType.PageEvent) {
                      reportEvent = true;
                      logPageEvent(event);
                  } else if (event.EventDataType == MessageType.Commerce) {
                      reportEvent = logCommerceEvent(event);
                  }

                  if (reportEvent && reportingService) {
                      reportingService(self, event);
                  }

                  return 'Successfully sent to forwarder ' + name;
              } catch (error) {
                  return "Can't send to forwarder: " + name + ' ' + error;
              }
          }

          function logCommerceEvent(event) {
              if (
                  event.ProductAction &&
                  event.ProductAction.ProductList &&
                  event.ProductAction.ProductActionType &&
                  SupportedCommerceTypes.indexOf(
                      event.ProductAction.ProductActionType
                  ) > -1
              ) {
                  var eventName,
                      totalValue,
                      params = cloneEventAttributes(event),
                      eventID = createEventId(event),
                      sendProductNamesAsContents =
                          settings.sendProductNamesasContents || false;

                  params['currency'] = event.CurrencyCode || 'USD';

                  if (event.EventName) {
                      params['content_name'] = event.EventName;
                  }

                  var productSkus = event.ProductAction.ProductList.reduce(
                      function(arr, curr) {
                          if (curr.Sku) {
                              arr.push(curr.Sku);
                          }
                          return arr;
                      },
                      []
                  );

                  if (productSkus && productSkus.length > 0) {
                      params['content_ids'] = productSkus;
                  }

                  // Override content_name with product names array if setting enabled
                  if (sendProductNamesAsContents) {
                      var productNames = buildProductNames(
                          event.ProductAction.ProductList
                      );
                      if (productNames && productNames.length > 0) {
                          params['content_name'] = productNames;
                      }
                  }

                  // Set order_id if TransactionId exists
                  if (event.ProductAction.TransactionId) {
                      params['order_id'] = event.ProductAction.TransactionId;
                  }

                  // Build contents array
                  var contents = buildProductContents(
                      event.ProductAction.ProductList
                  );
                  if (contents && contents.length > 0) {
                      params['contents'] = contents;
                  }

                  if (
                      event.ProductAction.ProductActionType ==
                          mParticle.ProductActionType.AddToWishlist ||
                      event.ProductAction.ProductActionType ==
                          mParticle.ProductActionType.Checkout
                  ) {
                      var eventCategory = getEventCategoryString(event);
                      if (eventCategory) {
                          params['content_category'] = eventCategory;
                      }
                      if (
                          event.ProductAction.ProductActionType ==
                              mParticle.ProductActionType.Checkout &&
                          event.ProductAction.CheckoutStep
                      ) {
                          params['checkout_step'] =
                              event.ProductAction.CheckoutStep;
                      }
                  }

                  if (
                      event.ProductAction.ProductActionType ==
                          mParticle.ProductActionType.AddToCart ||
                      event.ProductAction.ProductActionType ==
                          mParticle.ProductActionType.AddToWishlist ||
                      event.ProductAction.ProductActionType ==
                          mParticle.ProductActionType.ViewDetail
                  ) {
                      totalValue = event.ProductAction.ProductList.reduce(
                          function(sum, product) {
                              if (
                                  isNumeric(product.Price) &&
                                  isNumeric(product.Quantity)
                              ) {
                                  sum += product.Price * product.Quantity;
                              }
                              return sum;
                          },
                          0
                      );

                      params['value'] = totalValue;

                      if (
                          event.ProductAction.ProductActionType ==
                          mParticle.ProductActionType.AddToWishlist
                      ) {
                          eventName = ADD_TO_WISHLIST_EVENT_NAME;
                      } else if (
                          event.ProductAction.ProductActionType ==
                          mParticle.ProductActionType.AddToCart
                      ) {
                          eventName = ADD_TO_CART_EVENT_NAME;
                      } else {
                          eventName = VIEW_CONTENT_EVENT_NAME;
                      }
                  } else if (
                      event.ProductAction.ProductActionType ==
                          mParticle.ProductActionType.Checkout ||
                      event.ProductAction.ProductActionType ==
                          mParticle.ProductActionType.Purchase
                  ) {
                      eventName =
                          event.ProductAction.ProductActionType ==
                          mParticle.ProductActionType.Checkout
                              ? CHECKOUT_EVENT_NAME
                              : PURCHASE_EVENT_NAME;

                      if (event.ProductAction.TotalAmount) {
                          params['value'] = event.ProductAction.TotalAmount;
                      }

                      var num_items = event.ProductAction.ProductList.reduce(
                          function(sum, product) {
                              if (isNumeric(product.Quantity)) {
                                  sum += product.Quantity;
                              }
                              return sum;
                          },
                          0
                      );
                      params['num_items'] = num_items;
                  } else if (
                      event.ProductAction.ProductActionType ==
                      mParticle.ProductActionType.RemoveFromCart
                  ) {
                      eventName = REMOVE_FROM_CART_EVENT_NAME;

                      // remove from cart can be performed in 1 of 2 ways:
                      // 1. mParticle.eCommerce.logProductEvent(), which contains event.ProductAction.TotalAmount
                      // 2. mParticle.eCommerce.Cart.remove(), which does not contain event.ProductAction.TotalAmount
                      // when there is no TotalAmount, a manual calculation must be done
                      if (event.ProductAction.TotalAmount) {
                          totalValue = event.ProductAction.TotalAmount;
                      } else {
                          totalValue = event.ProductAction.ProductList.reduce(
                              function(sum, product) {
                                  if (isNumeric(product.TotalAmount)) {
                                      sum += product.TotalAmount;
                                  }
                                  return sum;
                              },
                              0
                          );
                      }

                      params['value'] = totalValue;

                      fbq(
                          'trackCustom',
                          eventName || 'customEvent',
                          params,
                          eventID
                      );
                      return true;
                  }

                  if (eventName) {
                      fbq('track', eventName, params, eventID);
                  } else {
                      return false;
                  }

                  return true;
              }

              return false;
          }

          function logPageView(event) {
              logPageEvent(event, PAGE_VIEW_EVENT_NAME);
          }

          function logPageEvent(event, eventName) {
              var params = cloneEventAttributes(event);
              var eventID = createEventId(event);

              eventName = eventName || event.EventName;
              if (event.EventName) {
                  params['content_name'] = event.EventName;
              }

              fbq('trackCustom', eventName || 'customEvent', params, eventID);
          }

          function cloneEventAttributes(event) {
              var attr = {};
              if (event && event.EventAttributes) {
                  try {
                      attr = JSON.parse(JSON.stringify(event.EventAttributes));
                  } catch (e) {
                      //
                  }
              }
              return attr;
          }

          function isNumeric(n) {
              return !isNaN(parseFloat(n)) && isFinite(n);
          }

          function getEventCategoryString(event) {
              var enumTypeValues;
              var enumValue;
              if (event.EventDataType == MessageType.Commerce) {
                  enumTypeValues = event.EventCategory
                      ? mParticle.CommerceEventType
                      : mParticle.ProductActionType;
                  enumValue =
                      event.EventCategory ||
                      event.ProductAction.ProductActionType;
              } else {
                  enumTypeValues = mParticle.EventType;
                  enumValue = event.EventCategory;
              }

              if (enumTypeValues && enumValue) {
                  for (var category in enumTypeValues) {
                      if (enumValue == enumTypeValues[category]) {
                          return category;
                      }
                  }
              }

              return null;
          }

          /**
           * Builds contents array for Facebook Pixel commerce events.
           * Creates a nested array of content items with product details.
           *
           * @param {Array} productList - Array of products from event.ProductAction.ProductList
           * @returns {Array} Array of content objects for Facebook Pixel
           */
          function buildProductContents(productList) {
              if (!productList || productList.length === 0) {
                  return [];
              }

              return productList
                  .filter(function(product) {
                      return product && product.Sku;
                  })
                  .map(function(product) {
                      var contentItem = {
                          id: product.Sku,
                          quantity: isNumeric(product.Quantity)
                              ? product.Quantity
                              : 1,
                          name: product.Name,
                          brand: product.Brand,
                          category: product.Category,
                          variant: product.Variant,
                          item_price: isNumeric(product.Price)
                              ? product.Price
                              : null,
                      };

                      // Apply configured mappings to custom attributes
                      productAttributeMapping.forEach(function(productMapping) {
                          if (
                              !isObject(productMapping) ||
                              !productMapping.map ||
                              !productMapping.value
                          ) {
                              return;
                          }

                          var sourceField = productMapping.map;
                          var facebookFieldName = productMapping.value;
                          var value = null;

                          // Check for Product level field first
                          if (product.hasOwnProperty(sourceField)) {
                              value = product[sourceField];
                          }
                          // then check for Product.Attributes level field
                          else if (
                              product.Attributes &&
                              product.Attributes[sourceField]
                          ) {
                              value = product.Attributes[sourceField];
                          }

                          if (value !== null && value !== undefined) {
                              contentItem[facebookFieldName] = value;
                          }
                      });
                      return contentItem;
                  });
          }

          // https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events#event-deduplication-options
          function createEventId(event) {
              return {
                  eventID: event.SourceMessageId || null,
              };
          }

          /**
           * Builds array of product names from product list
           * @param {Array} productList - Array of products
           * @returns {Array} Array of product names
           */
          function buildProductNames(productList) {
              if (!productList || productList.length === 0) {
                  return [];
              }

              return productList
                  .filter(function(product) {
                      return product && product.Name;
                  })
                  .map(function(product) {
                      return product.Name;
                  });
          }

          this.init = initForwarder;
          this.process = processEvent;
      };

  function getId() {
      return moduleId;
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

  var FacebookEventForwarder = {
      register: register,
  };
  var FacebookEventForwarder_1 = FacebookEventForwarder.register;

  exports.default = FacebookEventForwarder;
  exports.register = FacebookEventForwarder_1;

  return exports;

}({}));
