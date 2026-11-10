export declare const LEFTOVER_ESCAPE: RegExp;
export declare function hidesSegmentAfter(route: string, segment: string): boolean;
export declare function hidesNextSegment(route: string): boolean;
export declare function decodeFully(text: string): string | undefined;
export declare function routeSegment(segments: string[], i: number): string;
export declare function isTokenSegment(segment: string): boolean;
export declare function maskTokenSegment(segment: string, text: string, route: string | undefined): string | undefined;
export declare function pagePath(pathname: string): string;
export declare function pageUrlPath(pathname: string): string;
