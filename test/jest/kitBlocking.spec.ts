import KitBlocker from '../../src/kitBlocking';
import Helpers from '../../src/helpers';
import Types from '../../src/types';
import { convertEvent } from '../../src/sdkToEventsApiConverter';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { ISDKUserIdentity } from '../../src/identity-user-interfaces';
import {
    KitBlockerDataPlan,
    SDKEvent,
    SDKProduct,
    SDKProductActionType,
} from '../../src/sdkRuntimeModels';

function createMpInstance(): IMParticleWebSDKInstance {
    const mpInstance = ({
        Logger: {
            verbose: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
        },
    } as unknown) as IMParticleWebSDKInstance;
    mpInstance._Helpers = new Helpers(mpInstance);
    return mpInstance;
}

function createDataPlan(
    dataPoints: unknown[],
    blok = { ev: false, ea: false, ua: true, id: true }
): KitBlockerDataPlan {
    return ({
        document: {
            dtpn: {
                blok,
                vers: { version_document: { data_points: dataPoints } },
            },
        },
    } as unknown) as KitBlockerDataPlan;
}

const restrictiveIdentityDataPoint = {
    match: { type: 'user_identities' },
    validator: {
        type: 'json_schema',
        definition: {
            additionalProperties: false,
            properties: { customerid: {}, email: {} },
        },
    },
};

const permissiveIdentityDataPoint = {
    match: { type: 'user_identities' },
    validator: {
        type: 'json_schema',
        definition: {
            additionalProperties: true,
            properties: { customerid: {}, email: {} },
        },
    },
};

describe('KitBlocker.isIdentityBlocked', () => {
    it('should block an unplanned identity and allow a planned one when the data point is restrictive', () => {
        const kitBlocker = new KitBlocker(
            createDataPlan([restrictiveIdentityDataPoint]),
            createMpInstance()
        );

        expect(kitBlocker.isIdentityBlocked('google')).toBe(true);
        expect(kitBlocker.isIdentityBlocked('email')).toBe(false);
    });

    it('should allow any identity when the data point allows additional properties', () => {
        const kitBlocker = new KitBlocker(
            createDataPlan([permissiveIdentityDataPoint]),
            createMpInstance()
        );

        expect(kitBlocker.isIdentityBlocked('google')).toBe(false);
        expect(kitBlocker.isIdentityBlocked('email')).toBe(false);
    });

    it('should allow any identity, and not throw, when the plan has no user_identities data point', () => {
        const planWithNoIdentityDataPoint = createDataPlan([]);
        const kitBlocker = new KitBlocker(
            planWithNoIdentityDataPoint,
            createMpInstance()
        );

        expect(kitBlocker.blockUserIdentities).toBe(true);
        expect(
            kitBlocker.dataPlanMatchLookups['user_identities']
        ).toBeUndefined();

        expect(() => kitBlocker.isIdentityBlocked('email')).not.toThrow();
        expect(kitBlocker.isIdentityBlocked('email')).toBe(false);
        expect(kitBlocker.isIdentityBlocked('google')).toBe(false);
    });

    it('should allow any identity when blockUserIdentities is off', () => {
        const kitBlocker = new KitBlocker(
            createDataPlan([restrictiveIdentityDataPoint]),
            createMpInstance()
        );
        kitBlocker.blockUserIdentities = false;

        expect(kitBlocker.isIdentityBlocked('google')).toBe(false);
    });
});

function userIdentitiesNamed(identityNames: string[]): ISDKUserIdentity[] {
    return identityNames.map(identityName => ({
        Type: Types.IdentityType.getIdentityType(identityName) as number,
        Identity: identityName + '-value',
    }));
}

function eventWithUserIdentities(userIdentities: unknown): SDKEvent {
    return ({
        EventName: 'Identity Event',
        EventCategory: Types.EventType.Navigation,
        EventDataType: Types.MessageType.PageEvent,
        EventAttributes: null,
        UserAttributes: {},
        UserIdentities: userIdentities,
    } as unknown) as SDKEvent;
}

const identityArrangements: [string, string[], string[]][] = [
    ['one blocked identity last', ['email', 'customerid', 'google'], ['email', 'customerid']],
    ['two blocked identities first', ['google', 'yahoo', 'customerid', 'email'], ['customerid', 'email']],
    ['three blocked identities first', ['other', 'facebook', 'twitter', 'customerid', 'email'], ['customerid', 'email']],
    ['two blocked identities between planned ones', ['customerid', 'google', 'yahoo', 'email'], ['customerid', 'email']],
    ['three blocked identities between planned ones', ['customerid', 'facebook', 'twitter', 'google', 'email'], ['customerid', 'email']],
    ['two blocked identities last', ['customerid', 'email', 'mobile_number', 'phone_number_2'], ['customerid', 'email']],
    ['three blocked identities last', ['customerid', 'email', 'mobile_number', 'phone_number_2', 'phone_number_3'], ['customerid', 'email']],
    ['only blocked identities', ['other2', 'other3', 'other4'], []],
];

const identitiesWithAdjacentUnplannedOnes = [
    'customerid',
    'facebook',
    'twitter',
    'google',
    'email',
    'mobile_number',
    'phone_number_2',
];

describe('KitBlocker user identity blocking', () => {
    it.each(identityArrangements)(
        'should forward only planned user identities, and leave the logged event unchanged, for an event with %s',
        (_arrangement, loggedIdentityNames, plannedIdentityNames) => {
            const kitBlocker = new KitBlocker(
                createDataPlan([restrictiveIdentityDataPoint]),
                createMpInstance()
            );
            const loggedIdentities = userIdentitiesNamed(loggedIdentityNames);
            const event = eventWithUserIdentities(loggedIdentities);

            const blockedEvent = kitBlocker.createBlockedEvent(event);

            expect(blockedEvent.UserIdentities).toEqual(
                userIdentitiesNamed(plannedIdentityNames)
            );
            expect(event.UserIdentities).toBe(loggedIdentities);
            expect(event.UserIdentities).toEqual(
                userIdentitiesNamed(loggedIdentityNames)
            );
        }
    );

    it.each([
        ['an empty array', []],
        ['an empty string', ''],
        ['null', null],
        ['undefined', undefined],
    ])(
        'should forward user identities that are %s as they are',
        (_description, userIdentities) => {
            const kitBlocker = new KitBlocker(
                createDataPlan([restrictiveIdentityDataPoint]),
                createMpInstance()
            );
            const event = eventWithUserIdentities(userIdentities);

            expect(kitBlocker.isIdentityBlocked('google')).toBe(true);
            expect(() => kitBlocker.transformUserIdentities(event)).not.toThrow();
            expect(
                kitBlocker.transformUserIdentities(event).UserIdentities
            ).toStrictEqual(userIdentities);
        }
    );

    it('should forward an event without user identities without adding them', () => {
        const kitBlocker = new KitBlocker(
            createDataPlan([restrictiveIdentityDataPoint]),
            createMpInstance()
        );
        const event = eventWithUserIdentities(undefined);
        delete event.UserIdentities;

        expect(kitBlocker.isIdentityBlocked('google')).toBe(true);
        expect(() => kitBlocker.transformUserIdentities(event)).not.toThrow();
        expect(kitBlocker.transformUserIdentities(event)).not.toHaveProperty(
            'UserIdentities'
        );
    });

    it.each([
        ['the plan allows unplanned identities', createDataPlan([permissiveIdentityDataPoint])],
        ['the plan has no user_identities data point', createDataPlan([])],
        [
            'blocking unplanned identities is off',
            createDataPlan([restrictiveIdentityDataPoint], { ev: false, ea: false, ua: false, id: false }),
        ],
    ])(
        'should forward every user identity when %s',
        (_configuration, dataPlan) => {
            const kitBlocker = new KitBlocker(dataPlan, createMpInstance());
            const event = eventWithUserIdentities(
                userIdentitiesNamed(identitiesWithAdjacentUnplannedOnes)
            );

            const blockedEvent = kitBlocker.createBlockedEvent(event);

            expect(blockedEvent.UserIdentities).toEqual(
                userIdentitiesNamed(identitiesWithAdjacentUnplannedOnes)
            );
            expect(event.UserIdentities).toEqual(
                userIdentitiesNamed(identitiesWithAdjacentUnplannedOnes)
            );
        }
    );
});

const plannedProductAttributesOnly = {
    additionalProperties: false,
    properties: { plannedAttr: {} },
};

const anyProductAttributes = {
    additionalProperties: true,
    properties: { plannedAttr: {} },
};

const plannedEventAttributesOnly = {
    additionalProperties: false,
    properties: { plannedEventAttr: {} },
};

function productActionDataPoint(
    action: string,
    productCustomAttributes: unknown,
    eventCustomAttributes?: unknown
): unknown {
    return {
        match: { type: 'product_action', criteria: { action } },
        validator: {
            type: 'json_schema',
            definition: {
                properties: {
                    data: {
                        properties: {
                            custom_attributes: eventCustomAttributes,
                            product_action: {
                                properties: {
                                    products: {
                                        items: {
                                            properties: {
                                                custom_attributes: productCustomAttributes,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    };
}

function productImpressionDataPoint(productCustomAttributes: unknown): unknown {
    return {
        match: { type: 'product_impression', criteria: {} },
        validator: {
            type: 'json_schema',
            definition: {
                properties: {
                    data: {
                        properties: {
                            product_impressions: {
                                items: {
                                    properties: {
                                        products: {
                                            items: {
                                                properties: {
                                                    custom_attributes: productCustomAttributes,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    };
}

const restrictiveUserAttributesDataPoint = {
    match: { type: 'user_attributes' },
    validator: {
        type: 'json_schema',
        definition: {
            additionalProperties: false,
            properties: { planned_user_attr: {} },
        },
    },
};

const productActions: [string, SDKProductActionType, number][] = [
    ['add_to_cart', SDKProductActionType.AddToCart, Types.CommerceEventType.ProductAddToCart],
    ['remove_from_cart', SDKProductActionType.RemoveFromCart, Types.CommerceEventType.ProductRemoveFromCart],
    ['checkout', SDKProductActionType.Checkout, Types.CommerceEventType.ProductCheckout],
    ['checkout_option', SDKProductActionType.CheckoutOption, Types.CommerceEventType.ProductCheckoutOption],
    ['click', SDKProductActionType.Click, Types.CommerceEventType.ProductClick],
    ['view_detail', SDKProductActionType.ViewDetail, Types.CommerceEventType.ProductViewDetail],
    ['purchase', SDKProductActionType.Purchase, Types.CommerceEventType.ProductPurchase],
    ['refund', SDKProductActionType.Refund, Types.CommerceEventType.ProductRefund],
    ['add_to_wishlist', SDKProductActionType.AddToWishlist, Types.CommerceEventType.ProductAddToWishlist],
    ['remove_from_wish_list', SDKProductActionType.RemoveFromWishlist, Types.CommerceEventType.ProductRemoveFromWishlist],
];

function sdkEvent(eventCategory: number, eventData: Partial<SDKEvent>): SDKEvent {
    return ({
        EventName: 'eCommerce - test',
        EventCategory: eventCategory,
        EventDataType: Types.MessageType.Commerce,
        EventAttributes: null,
        UserAttributes: {
            planned_user_attr: 'kept',
            unplanned_user_attr: 'withheld',
        },
        UserIdentities: [],
        ...eventData,
    } as unknown) as SDKEvent;
}

interface ICommerceCase {
    name: string;
    matchKey: string;
    build: (products: SDKProduct[]) => SDKEvent;
    productsOf: (event: SDKEvent) => SDKProduct[];
}

const productActionCases: ICommerceCase[] = productActions.map(
    ([action, productActionType, eventCategory]) => ({
        name: action,
        matchKey: `product_action:${action}:ProductAttributes`,
        build: products =>
            sdkEvent(eventCategory, {
                ProductAction: {
                    ProductActionType: productActionType,
                    ProductList: products,
                },
            }),
        productsOf: event => event.ProductAction.ProductList,
    })
);

const productImpressionCase: ICommerceCase = {
    name: 'product_impression',
    matchKey: 'product_impression:ProductAttributes',
    build: products =>
        sdkEvent(Types.CommerceEventType.ProductImpression, {
            ProductImpressions: products.map((product, index) => ({
                ProductImpressionList: `impression list ${index}`,
                ProductList: [product],
            })),
        }),
    productsOf: event =>
        event.ProductImpressions.map(impression => impression.ProductList[0]),
};

const commerceCases = [...productActionCases, productImpressionCase];

function productWithAttributes(sku: string): SDKProduct {
    return {
        Name: 'Product ' + sku,
        Sku: sku,
        Price: 10,
        Attributes: { plannedAttr: 'planned', unplannedAttr: 'unplanned' },
    };
}

function productCreatedWithoutAttributes(sku: string): SDKProduct {
    return { Name: 'Product ' + sku, Sku: sku, Price: 10, Attributes: null };
}

const blockEventAndUserAttributes = { ev: false, ea: true, ua: true, id: false };

function planForEveryCommerceEvent(
    productCustomAttributes: unknown,
    eventCustomAttributes?: unknown
): KitBlockerDataPlan {
    return createDataPlan(
        [
            ...productActions.map(([action]) =>
                productActionDataPoint(
                    action,
                    productCustomAttributes,
                    eventCustomAttributes
                )
            ),
            productImpressionDataPoint(productCustomAttributes),
            restrictiveUserAttributesDataPoint,
        ],
        blockEventAndUserAttributes
    );
}

function attributesOf(products: SDKProduct[]): unknown[] {
    return products.map(product => product.Attributes);
}

describe('KitBlocker product attribute blocking', () => {
    it.each(commerceCases)(
        'should forward only planned product attributes for a $name event',
        ({ matchKey, build, productsOf }) => {
            const kitBlocker = new KitBlocker(
                planForEveryCommerceEvent(plannedProductAttributesOnly),
                createMpInstance()
            );
            const event = build([
                productWithAttributes('first'),
                productWithAttributes('second'),
            ]);

            expect(
                kitBlocker.getProductAttributeMatchKey(convertEvent(event))
            ).toBe(matchKey);
            expect(kitBlocker.dataPlanMatchLookups[matchKey]).toEqual({
                plannedAttr: true,
            });

            const blockedEvent = kitBlocker.createBlockedEvent(event);

            expect(attributesOf(productsOf(blockedEvent))).toEqual([
                { plannedAttr: 'planned' },
                { plannedAttr: 'planned' },
            ]);
        }
    );

    it.each(commerceCases)(
        'should leave the products of the logged $name event unchanged',
        ({ build, productsOf }) => {
            const kitBlocker = new KitBlocker(
                planForEveryCommerceEvent(plannedProductAttributesOnly),
                createMpInstance()
            );
            const event = build([productWithAttributes('first')]);

            const blockedEvent = kitBlocker.createBlockedEvent(event);

            expect(attributesOf(productsOf(blockedEvent))).toEqual([
                { plannedAttr: 'planned' },
            ]);
            expect(attributesOf(productsOf(event))).toEqual([
                { plannedAttr: 'planned', unplannedAttr: 'unplanned' },
            ]);
        }
    );

    it.each(commerceCases)(
        'should keep blocking the rest of a $name event that includes a product without attributes',
        ({ build, productsOf }) => {
            const kitBlocker = new KitBlocker(
                planForEveryCommerceEvent(plannedProductAttributesOnly),
                createMpInstance()
            );
            const event = build([
                productCreatedWithoutAttributes('bare'),
                productWithAttributes('second'),
            ]);

            expect(() => kitBlocker.transformProductAttributes(event)).not.toThrow();

            const blockedEvent = kitBlocker.createBlockedEvent(event);

            expect(attributesOf(productsOf(blockedEvent))).toEqual([
                null,
                { plannedAttr: 'planned' },
            ]);
            expect(blockedEvent.UserAttributes).toEqual({
                planned_user_attr: 'kept',
            });
        }
    );

    it.each(commerceCases)(
        'should block an unplanned product attribute named constructor for a $name event',
        ({ build, productsOf }) => {
            const kitBlocker = new KitBlocker(
                planForEveryCommerceEvent(plannedProductAttributesOnly),
                createMpInstance()
            );
            const event = build([
                {
                    Name: 'Product',
                    Sku: 'sku',
                    Price: 10,
                    Attributes: { plannedAttr: 'planned', constructor: 'unplanned' },
                },
            ]);

            const blockedEvent = kitBlocker.createBlockedEvent(event);

            expect(attributesOf(productsOf(blockedEvent))).toEqual([
                { plannedAttr: 'planned' },
            ]);
        }
    );

    it.each(productActionCases)(
        'should forward only planned product attributes for a $name event logged without event attributes when the plan also restricts event attributes',
        ({ build, productsOf }) => {
            const kitBlocker = new KitBlocker(
                planForEveryCommerceEvent(
                    plannedProductAttributesOnly,
                    plannedEventAttributesOnly
                ),
                createMpInstance()
            );
            const event = build([productWithAttributes('first')]);

            expect(event.EventAttributes).toBeNull();
            expect(
                kitBlocker.dataPlanMatchLookups[
                    kitBlocker.getMatchKey(convertEvent(event))
                ]
            ).toEqual({ plannedEventAttr: true });

            const blockedEvent = kitBlocker.createBlockedEvent(event);

            expect(attributesOf(productsOf(blockedEvent))).toEqual([
                { plannedAttr: 'planned' },
            ]);
            expect(blockedEvent.UserAttributes).toEqual({
                planned_user_attr: 'kept',
            });
        }
    );

    it.each(commerceCases)(
        'should forward every product attribute for a $name event when the plan allows additional product attributes',
        ({ matchKey, build, productsOf }) => {
            const kitBlocker = new KitBlocker(
                planForEveryCommerceEvent(anyProductAttributes),
                createMpInstance()
            );
            const event = build([productWithAttributes('first')]);

            expect(kitBlocker.dataPlanMatchLookups[matchKey]).toBe(true);

            const blockedEvent = kitBlocker.createBlockedEvent(event);

            expect(attributesOf(productsOf(blockedEvent))).toEqual([
                { plannedAttr: 'planned', unplannedAttr: 'unplanned' },
            ]);
            expect(blockedEvent.UserAttributes).toEqual({
                planned_user_attr: 'kept',
            });
        }
    );

    it.each(commerceCases)(
        'should forward every product attribute for a $name event when the plan has no data point for it',
        ({ matchKey, build, productsOf }) => {
            const kitBlocker = new KitBlocker(
                createDataPlan(
                    [restrictiveUserAttributesDataPoint],
                    blockEventAndUserAttributes
                ),
                createMpInstance()
            );
            const event = build([productWithAttributes('first')]);

            expect(kitBlocker.dataPlanMatchLookups).not.toHaveProperty(matchKey);

            const blockedEvent = kitBlocker.createBlockedEvent(event);

            expect(attributesOf(productsOf(blockedEvent))).toEqual([
                { plannedAttr: 'planned', unplannedAttr: 'unplanned' },
            ]);
            expect(blockedEvent.UserAttributes).toEqual({
                planned_user_attr: 'kept',
            });
        }
    );

    it.each(commerceCases)(
        'should forward every product attribute for a $name event when blocking unplanned event attributes is off',
        ({ matchKey, build, productsOf }) => {
            const kitBlocker = new KitBlocker(
                planForEveryCommerceEvent(plannedProductAttributesOnly),
                createMpInstance()
            );
            kitBlocker.blockEventAttributes = false;
            const event = build([productWithAttributes('first')]);

            expect(kitBlocker.dataPlanMatchLookups[matchKey]).toEqual({
                plannedAttr: true,
            });

            const blockedEvent = kitBlocker.createBlockedEvent(event);

            expect(attributesOf(productsOf(blockedEvent))).toEqual([
                { plannedAttr: 'planned', unplannedAttr: 'unplanned' },
            ]);
            expect(blockedEvent.UserAttributes).toEqual({
                planned_user_attr: 'kept',
            });
        }
    );

    it('should block unplanned user attributes of a custom event logged without attributes when its plan restricts event attributes', () => {
        const customEventDataPoint = {
            match: {
                type: 'custom_event',
                criteria: { event_name: 'Search Event', custom_event_type: 'search' },
            },
            validator: {
                type: 'json_schema',
                definition: {
                    properties: {
                        data: {
                            properties: { custom_attributes: plannedEventAttributesOnly },
                        },
                    },
                },
            },
        };
        const kitBlocker = new KitBlocker(
            createDataPlan(
                [customEventDataPoint, restrictiveUserAttributesDataPoint],
                blockEventAndUserAttributes
            ),
            createMpInstance()
        );
        const event = sdkEvent(Types.EventType.Search, {
            EventName: 'Search Event',
            EventDataType: Types.MessageType.PageEvent,
        });

        expect(event.EventAttributes).toBeNull();
        expect(
            kitBlocker.dataPlanMatchLookups[
                kitBlocker.getMatchKey(convertEvent(event))
            ]
        ).toEqual({ plannedEventAttr: true });

        const blockedEvent = kitBlocker.createBlockedEvent(event);

        expect(blockedEvent.UserAttributes).toEqual({
            planned_user_attr: 'kept',
        });
    });

    it('should warn and forward a promotion event unchanged when its plan restricts product attributes', () => {
        const promotionDataPoint = {
            ...(productActionDataPoint('click', plannedProductAttributesOnly) as object),
            match: { type: 'promotion_action', criteria: { action: 'click' } },
        };
        const mpInstance = createMpInstance();
        const kitBlocker = new KitBlocker(
            createDataPlan([promotionDataPoint], blockEventAndUserAttributes),
            mpInstance
        );
        const promotionAction = {
            PromotionActionType: 'click',
            PromotionList: [{ Id: 'promo-1', Name: 'Promotion' }],
        };
        const event = sdkEvent(Types.CommerceEventType.PromotionClick, {
            PromotionAction: promotionAction,
        });

        expect(
            kitBlocker.dataPlanMatchLookups['promotion_action:click:ProductAttributes']
        ).toEqual({ plannedAttr: true });

        const blockedEvent = kitBlocker.transformProductAttributes(event);

        expect(mpInstance.Logger.warning).toHaveBeenCalledWith('Product Not Supported ');
        expect(blockedEvent.PromotionAction).toBe(promotionAction);
    });
});
