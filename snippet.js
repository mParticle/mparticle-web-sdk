(function(apiKey) {
    window.mParticle = window.mParticle || {};
    window.mParticle.EventType = {
        Unknown: 0,
        Navigation: 1,
        Location: 2,
        Search: 3,
        Transaction: 4,
        UserContent: 5,
        UserPreference: 6,
        Social: 7,
        Other: 8,
    };
    window.mParticle.eCommerce = { Cart: {} };
    window.mParticle.Identity = {};
    window.mParticle.config = window.mParticle.config || {};
    window.mParticle.config.rq = [];
    window.mParticle.config.snippetVersion = 2.1;
    window.mParticle.ready = function(f) {
        window.mParticle.config.rq.push(f);
    };

    function preloadMethod(method, base) {
        return function() {
            if (base) {
                method = base + '.' + method;
            }
            var args = Array.prototype.slice.call(arguments);
            args.unshift(method);
            window.mParticle.config.rq.push(args);
        };
    }

    var mainMethods = [
        'endSession',
        'logError',
        'logEvent',
        'logForm',
        'logLink',
        'logPageView',
        'setSessionAttribute',
        'setAppName',
        'setAppVersion',
        'setOptOut',
        'setPosition',
        'startNewSession',
        'startTrackingLocation',
        'stopTrackingLocation',
    ];
    var ecommerceMethods = ['setCurrencyCode', 'logCheckout'];
    var IdentityMethods = ['identify', 'login', 'logout', 'modify'];

    mainMethods.forEach(function(method) {
        window.mParticle[method] = preloadMethod(method);
    });
    ecommerceMethods.forEach(function(method) {
        window.mParticle.eCommerce[method] = preloadMethod(method, 'eCommerce');
    });
    IdentityMethods.forEach(function(method) {
        window.mParticle.Identity[method] = preloadMethod(method, 'Identity');
    });

    var mp = document.createElement('script');
    mp.type = 'text/javascript';
    mp.async = true;
    mp.src =
        ('https:' == document.location.protocol
            ? 'https://jssdkcdns'
            : 'http://jssdkcdn') +
        '.mparticle.com/js/v2/' +
        apiKey +
        '/mparticle.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(mp, s);
})('REPLACE WITH API KEY');
