var initialization = {
    name: 'ID5',
    moduleId: 248,
    vendors: [ '131', 'ID5-1747' ],
    /*  ****** Fill out initForwarder to load your SDK ******
    Note that not all arguments may apply to your SDK initialization.
    These are passed from mParticle, but leave them even if they are not being used.
    forwarderSettings contain settings that your SDK requires in order to initialize
    userAttributes example: {gender: 'male', age: 25}
    userIdentities example: { 1: 'customerId', 2: 'facebookId', 7: 'emailid@email.com' }
    additional identityTypes can be found at https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L88-L101
*/
    initForwarder: function(forwarderSettings, testMode, userAttributes, userIdentities, processEvent, eventQueue, isInitialized, common) {
        /* `forwarderSettings` contains your SDK specific settings such as apiKey that your customer needs in order to initialize your SDK properly */
        common.partnerId = forwarderSettings.partnerId;
        common.id5IdType = forwarderSettings.id5IdType;
        common.moduleId = this.moduleId;
        common.allowedVendors = this.vendors;

        if (!testMode) {
            /* Load your Web SDK here using a variant of your snippet from your readme that your customers would generally put into their <head> tags
               Generally, our integrations create script tags and append them to the <head>. Please follow the following format as a guide:
            */
            //ID5 docs on initialization can be found here: https://github.com/id5io/id5-api.js/blob/master/README.md
            var id5Script = document.createElement('script');
            id5Script.src = 'https://cdn.id5-sync.com/api/1.0/id5-api.js';
            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(id5Script);

            id5Script.onload = function() {
                isInitialized = true;

                var id5Instance = window.ID5.init({
                    partnerId: common.partnerId,
                    consentData: {
                        allowedVendors: common.allowedVendors
                    }
                })

                id5Instance.onAvailable(function(status){
                    common.logId5Id(status.getUserId());
                }.bind(common));
            };
        } else {
            isInitialized = true;

            var id5Instance = window.ID5.init({partnerId: common.partnerId})

            id5Instance.onAvailable(function(status){
                common.logId5Id(status.getUserId());
            }.bind(common));
        }
    }
};

module.exports = initialization;
