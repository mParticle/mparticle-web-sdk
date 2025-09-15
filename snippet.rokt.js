(function(apiKey) {
    // stub mParticle and major mParticle classes EventType, eCommerce, and Identity to exist before full
    // mParticle object is initialized
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
        Media: 9,
    };
    window.mParticle.eCommerce = { Cart: {} };
    window.mParticle.Identity = {};
    window.mParticle.Rokt = {};
    window.mParticle.config = window.mParticle.config || {};
    window.mParticle.config.rq = [];
    window.mParticle.config.snippetVersion = 2.7;
    window.mParticle.ready = function(f) {
        window.mParticle.config.rq.push(f);
    };

    // methods to be stubbed from the main mParticle object, mParticle.eCommerce, mParticle.Identity, and mParticle.Rokt
    // methods that return objects are not stubbed
    var mainMethods = [
        'endSession',
        'logError',
        'logBaseEvent',
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
    var identityMethods = ['identify', 'login', 'logout', 'modify'];
    var roktMethods = [
        'selectPlacements',
        'hashAttributes',
        'setExtensionData',
        'use',
    ];

    // iterates through methods above to create stubs
    mainMethods.forEach(function(method) {
        window.mParticle[method] = preloadMethod(method);
    });
    ecommerceMethods.forEach(function(method) {
        window.mParticle.eCommerce[method] = preloadMethod(method, 'eCommerce');
    });
    identityMethods.forEach(function(method) {
        window.mParticle.Identity[method] = preloadMethod(method, 'Identity');
    });
    roktMethods.forEach(function(method) {
        window.mParticle.Rokt[method] = preloadMethod(method, 'Rokt');
    });

    // stubbing function
    // pushes an array of 2 arguments into readyQueue: 1. the method, and 2. the arguments passed to the method
    // if the method is on the eCommerce, identity, or rokt object, then the 1st argument is base concatenated with "." and the method name
    // ie: Identity.login, eCommerce.setCurrencyCode, Rokt.selectPlacements
    // in main.js, the function "processPreloadedItem" will parse and run stubbed methods stored in the readyQueue (config.rq)
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

    // set data planning query parameters
    var config = window.mParticle.config,
        env = config.isDevelopmentMode ? 1 : 0,
        dbUrl = '?env=' + env,
        dataPlan = config.dataPlan;

    if (dataPlan) {
        var dpId = dataPlan.planId,
            dpV = dataPlan.planVersion;
        if (dpId) {
            if (dpV && (dpV < 1 || dpV > 1000)) {
                dpV = null;
            }
            dbUrl += '&plan_id=' + dpId + (dpV ? '&plan_version=' + dpV : '');
        }
    }

    // set version query parameters
    var versions = config.versions;
    var versionQueryArray = [];
    if (versions) {
        Object.keys(versions).forEach(function(name) {
            versionQueryArray.push(name + '=' + versions[name]);
        });
    }

    // add Rokt script dynamically to the page, insert before the first script tag
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    window.ROKT_DOMAIN = ROKT_DOMAIN || 'https://apps.rokt-api.com';
    window.mParticle.config.domain = ROKT_DOMAIN.split('//')[1];
    script.src =
        ROKT_DOMAIN +
        '/js/v2/' +
        apiKey +
        '/app.js' +
        dbUrl +
        '&' +
        versionQueryArray.join('&');
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
})('REPLACE WITH API KEY');
