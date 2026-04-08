declare namespace _default {
    export function forEach(callback: any, thisArg: any, ...args: any[]): void;
    export function map(callback: any, thisArg: any, ...args: any[]): any[];
    export function filter(fun: any, ...args: any[]): any[];
    export function isArray(arg: any): boolean;
    export { Base64 };
}
export default _default;
declare namespace Base64 {
    let _keyStr: string;
    function encode(input: any): string;
    function _encode(input: any): string;
    function decode(input: any): string;
    function _decode(input: any): string;
}
