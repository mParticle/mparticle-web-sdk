var renderSnippet = function (appId) {
    window.heapReadyCb=window.heapReadyCb||[],window.heap=window.heap||[],heap.load=function(e,t){window.heap.envId=e,window.heap.clientConfig=t=t||{},window.heap.clientConfig.shouldFetchServerConfig=!1;var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src="https://cdn.us.heap-api.com/config/"+e+"/heap_config.js";var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(a,r);var n=["init","startTracking","stopTracking","track","resetIdentity","identify","getSessionId","getUserId","getIdentity","addUserProperties","addEventProperties","removeEventProperty","clearEventProperties","addAccountProperties","addAdapter","addTransformer","addTransformerFn","onReady","addPageviewProperties","removePageviewProperty","clearPageviewProperties","trackPageview"],i=function(e){return function(){var t=Array.prototype.slice.call(arguments,0);window.heapReadyCb.push({name:e,fn:function(){heap[e]&&heap[e].apply(heap,t)}})}};for(var p=0;p<n.length;p++)heap[n[p]]=i(n[p])};
    heap.load(appId);
}
var initialization = {
    name: 'Heap',
    moduleId: 31,
    /*  ****** Fill out initForwarder to load your SDK ******
        Note that not all arguments may apply to your SDK initialization.
        These are passed from mParticle, but leave them even if they are not being used.
        forwarderSettings contain settings that your SDK requires in order to initialize
        userAttributes example: {gender: 'male', age: 25}
        userIdentities example: { 1: 'customerId', 2: 'facebookId', 7: 'emailid@email.com' }
        additional identityTypes can be found at https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L88-L101
    */
    initForwarder: function (
        forwarderSettings,
        testMode,
        userAttributes,
        userIdentities,
        processEvent,
        eventQueue,
        isInitialized,
        common,
        appVersion,
        appName,
        customFlags,
        clientId
    ) {
        /* `forwarderSettings` contains your SDK specific settings such as apiKey that your customer needs in order to initialize your SDK properly */
        if (!testMode) {
            /* Load your Web SDK here using a variant of your snippet from your readme that your customers would generally put into their <head> tags
               Generally, our integrations create script tags and append them to the <head>. Please follow the following format as a guide:
            */
            common.userIdentificationType = forwarderSettings.userIdentificationType

            var forwardWebRequestsServerSide = forwarderSettings.forwardWebRequestsServerSide === 'True';
            common.forwardWebRequestsServerSide = forwardWebRequestsServerSide;
            if (!forwardWebRequestsServerSide) {
                if (!window.heap) {
                    renderSnippet(forwarderSettings.applicationId);
                } else {
                    isInitialized = true;
                }
            }
        } else {
            // For testing, you should fill out this section in order to ensure any required initialization calls are made,
            // window.heap.initialize(forwarderSettings.apiKey)
        }
    },
};

module.exports = initialization;
