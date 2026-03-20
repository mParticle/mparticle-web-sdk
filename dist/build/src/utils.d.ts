declare type valueof<T> = T[keyof T];
declare const inArray: (items: any[], name: string) => boolean;
declare const findKeyInObject: (obj: any, key: string) => string;
declare const isObject: (value: any) => boolean;
declare const parseNumber: (value: string | number) => number;
declare const returnConvertedBoolean: (data: string | boolean | number) => boolean;
declare const decoded: (s: string) => string;
declare const converted: (s: string) => string;
export { valueof, converted, decoded, findKeyInObject, inArray, isObject, parseNumber, returnConvertedBoolean, };
