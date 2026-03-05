var optimizelyWebXEvents = require('./optimizely-x-defined-events');
var optimizelyFullStackEvents = require('./optimizely-fs-defined-events');
var helpers = require('./helpers');

var optimizelyFsSdkUrl = 'https://unpkg.com/@optimizely/optimizely-sdk@3.5.0/dist/optimizely.browser.umd.min.js',
    dataFilePrefix = 'https://cdn.optimizely.com/datafiles/',
    dataFileURLending = '.json/tag.js';

var initialization = {
    name: 'Optimizely',
    moduleId: 54,
    initForwarder: function(settings, testMode, userAttributes, userIdentities, processEvent, eventQueue, isInitialized, common, appVersion, appName, customFlags, clientId) {
        common.useFullStack = settings.useFullStack === 'True';

        if (!testMode) {
            if (!window.optimizely && !common.useFullStack) {
                var optimizelyScript = document.createElement('script');
                optimizelyScript.type = 'text/javascript';
                optimizelyScript.async = true;
                optimizelyScript.src = 'https://cdn.optimizely.com/js/' + settings.projectId + '.js';
                (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(optimizelyScript);
                optimizelyScript.onload = function() {
                    isInitialized = true;

                    loadWebXEventsAndPages();

                    if (window['optimizely'] && eventQueue.length > 0) {
                        for (var i = 0; i < eventQueue.length; i++) {
                            processEvent(eventQueue[i]);
                        }
                        eventQueue = [];
                    }
                };
            } else {
                isInitialized = true;
                loadWebXEventsAndPages();
            }

            if (!window.optimizelyClientInstance && common.useFullStack) {
                common.userIdField = settings.userIdField;
                common.userAttributes = userAttributes;
                var errorHandler = function() {};

                if (customFlags && customFlags['OptimizelyFullStack.ErrorHandler']) {
                    errorHandler = customFlags['OptimizelyFullStack.ErrorHandler'];
                }

                var instantiateFSClient = function() {
                    window.optimizelyClientInstance = window.optimizelySdk.createInstance({
                        datafile: window.optimizelyDatafile,
                        errorHandler: {handleError: errorHandler}
                    });

                    window.optimizelyClientInstance.onReady().then(function(){
                        isInitialized = true;
                        loadFullStackEvents();
                    });  
                }

                helpers.loadScript(optimizelyFsSdkUrl,
                    function() {
                        helpers.loadScript(
                          dataFilePrefix +
                            settings.projectId +
                            dataFileURLending,
                          instantiateFSClient
                        );
                    }
                );

            } else {
                isInitialized = true;
                common.userIdField = settings.userIdField;
                common.userAttributes = userAttributes;
                loadFullStackEvents();
            }            
        } else {
            isInitialized = true;
            if (!common.useFullStack) {
                loadWebXEventsAndPages();
            }
            if (common.useFullStack) {
                common.userIdField = settings.userIdField;
                common.userAttributes = userAttributes;
                loadFullStackEvents();
            }
        }
    }
};

function loadWebXEventsAndPages() {
    var data,
        events = {},
        pages = {};

    if (window.optimizely) {
        data = window.optimizely.get('data');

        for (var event in data.events) {
            events[data.events[event].apiName] = 1;
        }

        for (var page in data.pages) {
            pages[data.pages[page].apiName] = 1;
        }

        optimizelyWebXEvents.events = events;
        optimizelyWebXEvents.pages = pages;
    }
}

function loadFullStackEvents() {
    var fullStackData,
    fullStackEvents = {};


    if (window.optimizelyDatafile) {
        fullStackData = helpers.arrayToObject(window.optimizelyDatafile.events, 'id');

        for (var event in fullStackData) {
            fullStackEvents[fullStackData[event].key] = 1;
        }

        optimizelyFullStackEvents.events = fullStackEvents;
    }
}

module.exports = initialization;
