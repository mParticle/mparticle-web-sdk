const { introducedUndeclaredNames } = require('../../scripts/check-cdn-minifier');

describe('introducedUndeclaredNames', () => {
    const original =
        '(function(){const K="k";function f(o){const{[K]:t,...r}=o||{};return[t,r]}window.f=f})();';

    it('reports a name the minifier left undeclared', () => {
        const nuglified =
            '(function(){function n(n){const{[K]:t,...r}=n||{};return[t,r]}window.f=n})()';

        expect(introducedUndeclaredNames(original, nuglified)).toEqual(['K']);
    });

    it('passes when every reference was renamed with its declaration', () => {
        const renamed =
            '(function(){const n="k";function t(t){const{[n]:i,...r}=t||{};return[i,r]}window.f=t})()';

        expect(introducedUndeclaredNames(original, renamed)).toEqual([]);
    });

    it('ignores global comments, which the minifier strips', () => {
        const withGlobalComment =
            '/* global Suppressed */\n(function(){return typeof Suppressed=="function"?Suppressed:null})();';
        const stripped =
            '(function(){return typeof Suppressed=="function"?Suppressed:null})()';

        expect(introducedUndeclaredNames(withGlobalComment, stripped)).toEqual([]);
    });

    it('throws when the minified bundle does not parse', () => {
        expect(() => introducedUndeclaredNames(original, '(function(){')).toThrow(
            'does not parse'
        );
    });
});
