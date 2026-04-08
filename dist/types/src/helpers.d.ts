export default function Helpers(mpInstance: any): void;
export default class Helpers {
    constructor(mpInstance: any);
    canLog: () => boolean;
    getFeatureFlag: (feature: any) => any;
    invokeCallback: (callback: any, code: any, body: any, mParticleUser: any, previousMpid: any) => void;
    invokeAliasCallback: (callback: any, code: any, message: any) => void;
    extend: (...args: any[]) => any;
    createServiceUrl: (secureServiceUrl: any, devToken: any) => string;
    createXHR: (cb: any) => any;
    filterUserIdentities: (userIdentitiesObject: any, filterList: any) => {
        Type: any;
        Identity: any;
    }[];
    filterUserIdentitiesForForwarders: (userIdentities: utils.Dictionary<string>, filterList: number[]) => utils.Dictionary<string>;
    filterUserAttributes: (userAttributes: utils.Dictionary<string>, filterList: number[]) => utils.Dictionary<string>;
    isEventType: (type: any) => boolean;
    sanitizeAttributes: (attrs: any, name: any) => {};
    isDelayedByIntegration: (delayedIntegrations: any, timeoutStart: any, now: any) => boolean;
    createMainStorageName: (workspaceToken: any) => string;
    converted: (s: string) => string;
    findKeyInObject: (obj: any, key: string) => string;
    parseNumber: (value: string | number) => number;
    inArray: (items: any[], name: any) => boolean;
    isObject: (value: any) => boolean;
    decoded: (s: string) => string;
    parseStringOrNumber: (value: string | number) => string | number;
    generateHash: typeof utils.generateHash;
    generateUniqueId: (a?: string) => string;
    Validators: {
        isNumber: (value: any) => boolean;
        isFunction: (fn: any) => boolean;
        isStringOrNumber: (value: any) => boolean;
        isValidAttributeValue: (value: any) => boolean;
        isValidKeyValue: (key: any) => boolean;
        removeFalsyIdentityValues: (identityApiData: import("@mparticle/web-sdk").IdentityApiData, logger: any) => import("@mparticle/web-sdk").IdentityApiData;
        validateIdentities: (identityApiData: import("@mparticle/web-sdk").IdentityApiData, method?: import("./identity.interfaces").IdentityAPIMethod) => {
            valid: boolean;
            error?: utils.valueof<{
                readonly ModifyIdentityRequestUserIdentitiesPresent: "identityRequests to modify require userIdentities to be present. Request not sent to server. Please fix and try again";
                readonly IdentityRequesetInvalidKey: "There is an invalid key on your identityRequest object. It can only contain a `userIdentities` object and a `onUserAlias` function. Request not sent to server. Please fix and try again.";
                readonly OnUserAliasType: "The onUserAlias value must be a function.";
                readonly UserIdentities: "The userIdentities key must be an object with keys of identityTypes and values of strings. Request not sent to server. Please fix and try again.";
                readonly UserIdentitiesInvalidKey: "There is an invalid identity key on your `userIdentities` object within the identityRequest. Request not sent to server. Please fix and try again.";
                readonly UserIdentitiesInvalidValues: "All user identity values must be strings or null. Request not sent to server. Please fix and try again.";
                readonly AliasMissingMpid: "Alias Request must contain both a destinationMpid and a sourceMpid";
                readonly AliasNonUniqueMpid: "Alias Request's destinationMpid and sourceMpid must be unique";
                readonly AliasMissingTime: "Alias Request must have both a startTime and an endTime";
                readonly AliasStartBeforeEndTime: "Alias Request's endTime must be later than its startTime";
            }>;
        };
    };
}
import * as utils from './utils';
