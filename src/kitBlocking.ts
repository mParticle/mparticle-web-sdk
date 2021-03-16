import { convertEvent } from './sdkToEventsApiConverter';
import { SDKEvent, MParticleWebSDK, KitBlockerDataPlan, SDKProduct } from './sdkRuntimeModels';
import { BaseEvent, EventTypeEnum, CommerceEvent, ScreenViewEvent, CustomEvent } from '@mparticle/event-models';
import Types from './types'
import { DataPlanPoint } from '@mparticle/data-planning-models';

/*  
    TODO: Including this as a workaround because attempting to import it from
    @mparticle/data-planning-models directly creates a build error.
 */
const DataPlanMatchType = {
    ScreenView: "screen_view",
    CustomEvent: "custom_event",
    Commerce: "commerce",
    UserAttributes: "user_attributes",
    UserIdentities: "user_identities",
    ProductAction: "product_action",
    PromotionAction: "promotion_action",
    ProductImpression: "product_impression"
}

/*  
    inspiration from https://github.com/mParticle/data-planning-node/blob/master/src/data_planning/data_plan_event_validator.ts
    but modified to only include commerce events, custom events, screen views, and removes validation

    The purpose of the KitBlocker class is to parse a data plan and determine what events, event/user/product attributes, and user identities should be blocked from downstream forwarders.

    KitBlocker is instantiated with a data plan on mParticle initialization. KitBlocker.kitBlockingEnabled is false if no data plan is passed.
    It parses the data plan by creating a `dataPlanMatchLookups` object in the following manner:
        1. For all events and user attributes/identities, it generates a `matchKey` in the shape of `typeOfEvent:eventType:nameOfEvent`
            a. The matchKeys' value will return `true` if additionalProperties for the custom attributes/identities is `true`, otherwise it will return an object of planned attribute/identities
        2. For commerce events, after step 1 and 1a, a second `matchKey` is included that appends `Products`. This is used to determine productAttributes blocked
    
    When an event is logged in mParticle, it is sent to our server and then calls `KitBlocker.createBlockedEvent` before passing the event to each forwarder.
    If the event is blocked, it will not send to the forwarder. If the event is not blocked, event/user/product attributes and user identities will be removed from the returned event if blocked.
*/
export default class KitBlocker {
    dataPlanMatchLookups: { [key: string]: {} } = {};
    blockEvents = false;
    blockEventAttributes = false;
    blockUserAttributes = false;
    blockUserIdentities = false;
    kitBlockingEnabled = false;
    mpInstance: MParticleWebSDK;

    constructor(dataPlan: KitBlockerDataPlan, mpInstance: MParticleWebSDK) {
        // if data plan is not requested, the data plan is {document: null}
        if (dataPlan && !dataPlan.document) {
            this.kitBlockingEnabled = false;
            return;
        }
        this.kitBlockingEnabled = true;
        this.mpInstance = mpInstance;
        this.blockEvents = dataPlan?.document?.dtpn?.blok?.ev;
        this.blockEventAttributes = dataPlan?.document?.dtpn?.blok?.ea;
        this.blockUserAttributes = dataPlan?.document?.dtpn?.blok?.ua;
        this.blockUserIdentities = dataPlan?.document?.dtpn?.blok?.id;

        const versionDocument = dataPlan?.document?.dtpn?.vers?.version_document;
        const dataPoints = versionDocument?.data_points;
        if (versionDocument) {
            try {
                if (dataPoints?.length > 0) {
                    dataPoints.forEach(point => this.addToMatchLookups(point));
                }
            }
            catch(e) {
                this.mpInstance.Logger.error('There was an issue with the data plan: ' + e);
            }
        }
    }

    addToMatchLookups(point: DataPlanPoint) {
        if (!point.match || !point.validator) {
            this.mpInstance.Logger.warning(`Data Plan Point is not valid' + ${point}`);
            return;
        }

        // match keys for non product custom attribute related data points
        let matchKey: string = this.generateMatchKey(point.match);
        let properties: null | boolean | {[key: string]: true}  = this.getPlannedProperties(point.match.type, point.validator)
        
        this.dataPlanMatchLookups[matchKey] = properties;

        // match keys for product custom attribute related data points
        if (point?.match?.type === DataPlanMatchType.ProductImpression ||
            point?.match?.type === DataPlanMatchType.ProductAction ||
            point?.match?.type === DataPlanMatchType.PromotionAction) {

            matchKey = this.generateProductAttributeMatchKey(point.match);
            properties = this.getProductProperties(point.match.type, point.validator)
        
            this.dataPlanMatchLookups[matchKey] = properties;
        }
    }

    generateMatchKey(match): string | null {
        const criteria = match.criteria || '';
        switch (match.type) {
            case DataPlanMatchType.CustomEvent:
                const customEventCriteria = criteria;

                return [
                    DataPlanMatchType.CustomEvent,
                    customEventCriteria.custom_event_type,
                    customEventCriteria.event_name,
                ].join(':');

            case DataPlanMatchType.ScreenView:
                const screenViewCriteria = criteria;
                return [
                    DataPlanMatchType.ScreenView,
                    '',
                    screenViewCriteria.screen_name,
                ].join(':');

            case DataPlanMatchType.ProductAction:
                const productActionMatch = criteria;
                return [match.type as string, productActionMatch.action].join(':');

            case DataPlanMatchType.PromotionAction:
                const promoActionMatch = criteria;
                return [match.type as string, promoActionMatch.action].join(':');

            case DataPlanMatchType.ProductImpression:
                const productImpressionActionMatch = criteria;
                return [match.type as string, productImpressionActionMatch.action].join(':');

            case DataPlanMatchType.UserIdentities:
            case DataPlanMatchType.UserAttributes:
                return [match.type].join(':');

            default:
                return null;
        }
    }

    generateProductAttributeMatchKey(match): string | null {
        const criteria = match.criteria || '';

        switch (match.type) {
            case DataPlanMatchType.ProductAction:
                const productActionMatch = criteria;
                return [match.type as string, productActionMatch.action, 'ProductAttributes'].join(':');

            case DataPlanMatchType.PromotionAction:
                const promoActionMatch = criteria;
                return [match.type as string, promoActionMatch.action, 'ProductAttributes'].join(':');

            case DataPlanMatchType.ProductImpression:
                return [match.type as string, 'ProductAttributes'].join(':');

            default:
                return null;
        }
    }

    getPlannedProperties(type, validator): boolean | {[key: string]: true} | null {
        let customAttributes;
        let userAdditionalProperties;
        switch (type) {
            case DataPlanMatchType.CustomEvent:
            case DataPlanMatchType.ScreenView:
            case DataPlanMatchType.ProductAction:
            case DataPlanMatchType.PromotionAction:
            case DataPlanMatchType.ProductImpression:
                customAttributes = validator?.definition?.properties?.data?.properties?.custom_attributes;
                if (customAttributes) {
                    if (customAttributes.additionalProperties === true || customAttributes.additionalProperties === undefined) {
                        return true;
                    } else {
                        const properties = {};
                        for (const property of Object.keys(customAttributes.properties)) {
                            properties[property] = true;
                        }
                        return properties;
                    }
                } else {
                    if (validator?.definition?.properties?.data?.additionalProperties === false) {
                        return {};
                    } else {
                        return true;
                    }
                }
            case DataPlanMatchType.UserAttributes:
            case DataPlanMatchType.UserIdentities:
                userAdditionalProperties = validator?.definition?.additionalProperties;
                if (userAdditionalProperties === true || userAdditionalProperties === undefined) {
                    return true;
                } else {
                    const properties = {};
                    const userProperties = validator.definition.properties
                    for (const property of Object.keys(userProperties)) {
                        properties[property] = true;
                    }
                    return properties;
                }
            default:
                return null;
        }
    }

    getProductProperties(type, validator): boolean | {[key: string]: true} | null {
        let productCustomAttributes;
        switch (type) {
            case DataPlanMatchType.ProductImpression:
                productCustomAttributes = validator?.definition?.properties?.data?.properties?.product_impressions?.items?.properties?.products?.items?.properties?.custom_attributes
                //product item attributes
                if (productCustomAttributes?.additionalProperties === false) {
                    const properties = {};
                    for (const property of Object.keys(productCustomAttributes?.properties)) {
                        properties[property] = true;
                    }
                    return properties;
                }
                return true;
            case DataPlanMatchType.ProductAction:
            case DataPlanMatchType.PromotionAction:
                productCustomAttributes = validator?.definition?.properties?.data?.properties?.product_action?.properties?.products?.items?.properties?.custom_attributes
                //product item attributes
                if (productCustomAttributes) {
                    if (productCustomAttributes.additionalProperties === false) {
                        const properties = {};
                        for (const property of Object.keys(productCustomAttributes?.properties)) {
                            properties[property] = true;
                        }
                        return properties;
                    }
                }
                return true;
            default:
                return null;
        }
    }

    getMatchKey(eventToMatch: BaseEvent): string | null {
        switch (eventToMatch.event_type) {
            case EventTypeEnum.screenView:
                const screenViewEvent = eventToMatch as ScreenViewEvent;
                if (screenViewEvent.data) {
                    return [
                        'screen_view',
                        '',
                        screenViewEvent.data.screen_name,
                    ].join(':');
                }
                return null;
            case EventTypeEnum.commerceEvent:
                const commerceEvent = eventToMatch as CommerceEvent;
                const matchKey: string[] = [];

                if (commerceEvent && commerceEvent.data) {
                    const {
                        product_action,
                        product_impressions,
                        promotion_action,
                    } = commerceEvent.data;

                    if (product_action) {
                        matchKey.push(DataPlanMatchType.ProductAction);
                        matchKey.push(product_action.action);
                    } else if (promotion_action) {
                        matchKey.push(DataPlanMatchType.PromotionAction);
                        matchKey.push(promotion_action.action);
                    } else if (product_impressions) {
                        matchKey.push(DataPlanMatchType.ProductImpression);
                    }
                }
                return matchKey.join(':');
            case EventTypeEnum.customEvent:
                const customEvent = eventToMatch as CustomEvent;
                if (customEvent.data) {
                    return [
                        'custom_event',
                        customEvent.data.custom_event_type,
                        customEvent.data.event_name,
                    ].join(':');
                }
                return null;
            default:
                return null;
        }
    }

    getProductAttributeMatchKey(eventToMatch: BaseEvent): string | null {
        switch (eventToMatch.event_type) {
            case EventTypeEnum.commerceEvent:
                const commerceEvent = eventToMatch as CommerceEvent;
                const matchKey: string[] = [];
                const {
                    product_action,
                    product_impressions,
                    promotion_action,
                } = commerceEvent.data;

                if (product_action) {
                    matchKey.push(DataPlanMatchType.ProductAction);
                    matchKey.push(product_action.action);
                    matchKey.push('ProductAttributes');
                } else if (promotion_action) {
                    matchKey.push(DataPlanMatchType.PromotionAction);
                    matchKey.push(promotion_action.action);
                    matchKey.push('ProductAttributes');
                } else if (product_impressions) {
                    matchKey.push(DataPlanMatchType.ProductImpression);
                    matchKey.push('ProductAttributes');
                }
                return matchKey.join(':');
            default:
                return null;
        }
    }

    createBlockedEvent(event: SDKEvent): SDKEvent {
        /* 
            return a transformed event based on event/event attributes, 
            then product attributes if applicable, then user attributes, 
            then the user identities
        */
       try {
           if (event) {
               event = this.transformEventAndEventAttributes(event)
           }
       
           if (event && event.EventDataType === Types.MessageType.Commerce) {
               event = this.transformProductAttributes(event);
           }
   
           if (event) {
               event = this.transformUserAttributes(event);
               event = this.transformUserIdentities(event);
           }

           return event;
       } catch(e) {
        return event;
       }
    }

    transformEventAndEventAttributes(event: SDKEvent): SDKEvent {
        const clonedEvent = {...event};
        const baseEvent: BaseEvent = convertEvent(clonedEvent);
        const matchKey: string = this.getMatchKey(baseEvent);
        const matchedEvent = this.dataPlanMatchLookups[matchKey];

        if (this.blockEvents) {
            /* 
                If the event is not planned, it doesn't exist in dataPlanMatchLookups
                and should be blocked (return null to not send anything to forwarders)
            */
            if (!matchedEvent) {
                return null;
            }
        }

        if (this.blockEventAttributes) {
            /* 
                matchedEvent is set to `true` if additionalProperties is `true`
                otherwise, delete attributes that exist on event.EventAttributes
                that aren't on 
            */
            if (matchedEvent === true) {
                return clonedEvent;
            }
            if (matchedEvent) {
                for (const key of Object.keys(clonedEvent.EventAttributes)) {
                    if (!matchedEvent[key]) {
                        delete clonedEvent.EventAttributes[key];
                    }
                }
                return clonedEvent;
            } else {
                return clonedEvent;
            }
        }

        return clonedEvent;
    }

    transformProductAttributes(event: SDKEvent): SDKEvent {
        const clonedEvent = {...event};
        const baseEvent: BaseEvent = convertEvent(clonedEvent);
        const matchKey: string = this.getProductAttributeMatchKey(baseEvent);
        const matchedEvent = this.dataPlanMatchLookups[matchKey];

        function removeAttribute(matchedEvent: { [key: string]: string }, productList: SDKProduct[]): void {
            productList.forEach(product => { 
                for (const productKey of Object.keys(product.Attributes)) {
                    if (!matchedEvent[productKey]) {
                        delete product.Attributes[productKey];
                    }
                }
            });
        }

        if (this.blockEvents) {
            /* 
                If the event is not planned, it doesn't exist in dataPlanMatchLookups
                and should be blocked (return null to not send anything to forwarders)
            */
            if (!matchedEvent) {
                return null;
            }
        }

        if (this.blockEventAttributes) {
            /* 
                matchedEvent is set to `true` if additionalProperties is `true`
                otherwise, delete attributes that exist on event.EventAttributes
                that aren't on 
            */
            if (matchedEvent === true) {
                return clonedEvent;
            }
            if (matchedEvent) {
                switch (event.EventCategory) {
                    case Types.CommerceEventType.ProductImpression:
                        clonedEvent.ProductImpressions.forEach(impression=> {
                            removeAttribute(matchedEvent, impression?.ProductList)
                        });
                        break;
                    case Types.CommerceEventType.ProductPurchase:
                        removeAttribute(matchedEvent, clonedEvent.ProductAction?.ProductList)
                        break;
                    default: 
                        this.mpInstance.Logger.warning('Product Not Supported ')
                }
                
                return clonedEvent;
            } else {
                return clonedEvent;
            }
        }

        return clonedEvent;
    }

    transformUserAttributes(event: SDKEvent) {
        const clonedEvent = {...event};
        if (this.blockUserAttributes) {
            /* 
                If the user attribute is not found in the matchedAttributes
                then remove it from event.UserAttributes as it is blocked
            */
            const matchedAttributes = this.dataPlanMatchLookups['user_attributes'];
            if (this.mpInstance._Helpers.isObject(matchedAttributes)) {
                for (const ua of Object.keys(clonedEvent.UserAttributes)) {
                    if (!matchedAttributes[ua]) {
                        delete clonedEvent.UserAttributes[ua]
                    }
                }
            }
        }
    
        return clonedEvent
    }

    isAttributeKeyBlocked(key: string) {
        /* used when an attribute is added to the user */
        if (!this.blockUserAttributes) {
            return false
        }
        if (this.blockUserAttributes) {
            const matchedAttributes = this.dataPlanMatchLookups['user_attributes'];
            if (matchedAttributes === true) {
                return false
            }
            if (!matchedAttributes[key]) {
                return true
            }
        }

        return false
    }

    isIdentityBlocked(key: string) {
        /* used when an attribute is added to the user */
        if (!this.blockUserIdentities) {
            return false
        }

        if (this.blockUserIdentities) {
            const matchedIdentities = this.dataPlanMatchLookups['user_identities'];
            if (matchedIdentities === true) {
                return false
            }
            if (!matchedIdentities[key]) {
                return true
            }
        } else {
            return false
        }
        return false
    }

    transformUserIdentities(event: SDKEvent) {
            /* 
                If the user identity is not found in matchedIdentities
                then remove it from event.UserIdentities as it is blocked.
                event.UserIdentities is of type [{Identity: 'id1', Type: 7}, ...]
                and so to compare properly in matchedIdentities, each Type needs 
                to be converted to an identityName
            */
        const clonedEvent = {...event};

        if (this.blockUserIdentities) {
            const matchedIdentities = this.dataPlanMatchLookups['user_identities'];
            if (this.mpInstance._Helpers.isObject(matchedIdentities)) {
                if (clonedEvent?.UserIdentities?.length) {
                    clonedEvent.UserIdentities.forEach((uiByType, i) => {
                        const identityName = Types.IdentityType.getIdentityName(
                            this.mpInstance._Helpers.parseNumber(uiByType.Type)
                        );
    
                        if (!matchedIdentities[identityName]) {
                            clonedEvent.UserIdentities.splice(i, 1);
                        }
                    });
                }
            }
        }
        return clonedEvent;
    }
}