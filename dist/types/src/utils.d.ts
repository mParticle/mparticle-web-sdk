import { MPID } from '@mparticle/web-sdk';
import Constants from './constants';
import { SDKInitConfig } from './sdkRuntimeModels';
import { IKitConfigs } from './configAPIClient';
type valueof<T> = T[keyof T];
type AttributeValue = string | number | boolean | null | undefined;
export type Dictionary<V = any> = Record<string, V>;
export type Environment = valueof<typeof Constants.Environment>;
declare const createCookieString: (value: string) => string;
declare const revertCookieString: (value: string) => string;
declare const inArray: (items: any[], name: any) => boolean;
declare const findKeyInObject: (obj: any, key: string) => string;
declare const generateDeprecationMessage: (methodName: string, isDeprecated?: boolean, alternateMethod?: string, docsUrl?: string) => string;
declare function generateHash(name: string): number;
declare const generateUniqueId: (a?: string) => string;
/**
 * Returns a value between 1-100 inclusive.
 */
declare const getRampNumber: (value?: string) => number;
declare const isObject: (value: any) => boolean;
declare const parseNumber: (value: string | number) => number;
declare const parseSettingsString: (settingsString: string) => Dictionary<string>[];
declare const parseStringOrNumber: (value: string | number) => string | number | null;
declare const replaceCommasWithPipes: (value: string) => string;
declare const replacePipesWithCommas: (value: string) => string;
declare const replaceApostrophesWithQuotes: (value: string) => string;
declare const replaceQuotesWithApostrophes: (value: string) => string;
declare const replaceMPID: (value: string, mpid: MPID) => string;
declare const replaceAmpWithAmpersand: (value: string) => string;
declare const createCookieSyncUrl: (mpid: MPID, pixelUrl: string, redirectUrl?: string, domain?: string) => string;
declare const returnConvertedBoolean: (data: string | boolean | number) => boolean;
declare const decoded: (s: string) => string;
declare const converted: (s: string) => string;
declare const isString: (value: any) => boolean;
declare const isNumber: (value: any) => boolean;
declare const isFunction: (fn: any) => boolean;
declare const isValidAttributeValue: (value: any) => boolean;
declare const isValidCustomFlagProperty: (value: any) => boolean;
declare const toDataPlanSlug: (value: any) => string;
declare const isDataPlanSlug: (str: string) => boolean;
declare const isStringOrNumber: (value: any) => boolean;
declare const isEmpty: (value: Dictionary<any> | string | null | undefined) => boolean;
declare const mergeObjects: <T extends object>(...objects: T[]) => T;
declare const moveElementToEnd: <T>(array: T[], index: number) => T[];
declare const queryStringParser: (url: string, keys?: string[]) => Dictionary<string>;
declare const getCookies: (keys?: string[]) => Dictionary<string>;
declare const getHref: () => string;
declare const filterDictionaryWithHash: <T>(dictionary: Dictionary<T>, filterList: any[], hashFn: (key: string) => any) => Dictionary<T>;
declare const parseConfig: (config: SDKInitConfig, moduleName: string, moduleId: number) => IKitConfigs | null;
/**
 * Obfuscates an object by replacing all primitive values with their type names,
 * while preserving the structure of nested objects and arrays.
 * This is useful for logging data structures without exposing PII.
 *
 * @param value - The value to obfuscate
 * @returns The obfuscated value with types instead of actual values
 *
 * @example
 * obfuscateData({ email: 'user@email.com', age: 30 })
 * // Returns: { email: 'string', age: 'number' }
 *
 * obfuscateData({ tags: ['premium', 'verified'] })
 * // Returns: { tags: ['string', 'string'] }
 */
declare const obfuscateData: (value: any) => any;
/**
 * For verbose logging: returns raw data when isDevelopmentMode is true, else obfuscated data.
 * Used when logging payloads so PII is not exposed in production.
 *
 * @param data - The value to log
 * @param isDevelopmentMode - When true, returns data unchanged, when false or undefined, returns obfuscated data
 * @returns Raw data when isDevelopmentMode is true, otherwise obfuscated structure
 *
 * @example
 * obfuscateDevData({ email: 'user@email.com' }, true)
 * // Returns: { email: 'user@email.com' }
 *
 * obfuscateDevData({ email: 'user@email.com' }, false)
 * // Returns: { email: 'string' }
 */
declare const obfuscateDevData: (data: any, isDevelopmentMode?: boolean) => any;
declare function extend(...args: any[]): any;
export { createCookieString, revertCookieString, createCookieSyncUrl, valueof, AttributeValue, converted, decoded, obfuscateDevData, filterDictionaryWithHash, findKeyInObject, generateDeprecationMessage, generateHash, generateUniqueId, getRampNumber, inArray, isObject, isStringOrNumber, obfuscateData, parseConfig, parseNumber, parseSettingsString, parseStringOrNumber, replaceCommasWithPipes, replacePipesWithCommas, replaceApostrophesWithQuotes, replaceQuotesWithApostrophes, returnConvertedBoolean, toDataPlanSlug, isString, isNumber, isFunction, isDataPlanSlug, isEmpty, isValidAttributeValue, isValidCustomFlagProperty, mergeObjects, moveElementToEnd, queryStringParser, getCookies, getHref, replaceMPID, replaceAmpWithAmpersand, extend, };
