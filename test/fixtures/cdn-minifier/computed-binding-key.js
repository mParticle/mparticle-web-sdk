(function () {
    'use strict';
    const K = 'preselectFormEmail';
    function dispatch(options) {
        const { [K]: transient, ...rest } = options || {};
        return [transient, rest];
    }
    window.dispatch = dispatch;
})();
