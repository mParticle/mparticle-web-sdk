<img src="https://static.mparticle.com/sdk/mp_logo_black.svg" width="280">

# mParticle Javascript SDK

Hello! This is the public repo of the mParticle Javascript SDK. We've built the mParticle platform to take a new approach to web and mobile app data and the platform has grown to support 50+ services and SDKs, including developer tools, analytics, attribution, messaging, and advertising services. mParticle is designed to serve as the connector between all of these services - check out [our site](http://mparticle.com), or hit us at dev@mparticle.com to learn more.

## Documentation
Detailed documentation and other information about mParticle SDK can be found at [http://docs.mparticle.com](http://docs.mparticle.com)

## Include and Initialize the SDK

### 1. Customize the SDK

You can customize the SDK by setting the `mParticle.config` object prior to the SDK-download snippet.

```javascript
mParticle.config = {
   isDevelopmentMode: true,
   identifyRequest: {
      userIdentities: { email: 'email@example.com', customerid: '123456' }
   },
   identityCallback: myIdentityCallback
}
```

### 2. Include the SDK

To integrate the SDK add the following snippet to your site after customizing `mParticle.config`, ideally in the `<head>` element. Replace `YOUR_API_KEY` with the API key for your mParticle Web workspace.

```javascript
<script type="text/javascript">
    (function (apiKey) {
        window.mParticle = window.mParticle || {EventType:{ Unknown:0,Navigation:1,Location:2,Search:3,Transaction:4,UserContent:5,UserPreference:6,Social:7,Other:8}};
        window.mParticle.eCommerce = { Cart: {} };
        window.mParticle.Identity = {};
        window.mParticle.config = window.mParticle.config || {};
        window.mParticle.config.rq = [];
        window.mParticle.ready = function (f) {
            window.mParticle.config.rq.push(f);
        };

        function a(o,t){return function(){t&&(o=t+'.'+o);var e=Array.prototype.slice.call(arguments);e.unshift(o),window.mParticle.config.rq.push(e)}}var x=['endSession','logError','logEvent','logForm','logLink','logPageView','setSessionAttribute','setAppName','setAppVersion','setOptOut','setPosition','startNewSession','startTrackingLocation','stopTrackingLocation'],y=['setCurrencyCode','logCheckout'],z=['identify','login','logout','modify'];x.forEach(function(o){window.mParticle[o]=a(o)}),y.forEach(function(o){window.mParticle.eCommerce[o]=a(o,'eCommerce')}),z.forEach(function(o){window.mParticle.Identity[o]=a(o,'Identity')});

       var mp = document.createElement('script');
       mp.type = 'text/javascript';
       mp.async = true;
       mp.src = ('https:' == document.location.protocol ? 'https://jssdkcdns' : 'http://jssdkcdn') + '.mparticle.com/js/v2/' + apiKey + '/mparticle.js';
       var s = document.getElementsByTagName('script')[0];
       s.parentNode.insertBefore(mp, s);
   })('REPLACE WITH API KEY');
</script>
```

You can then log events, for example, as follows:

```javascript
mParticle.logEvent('Play Movie', mParticle.EventType.Navigation, {'movie_length':'127 minutes','rating':'PG'});
```

## Creating an Integration

Similar to other mParticle SDKs, the Javascript SDK is able to automatically include, initialize, and delegate API calls to 3rd-party Javascript SDKs. If you would like to add your company as a new Javascript integration, reference the following integrations as examples:

- [Amplitude](https://github.com/mparticle-integrations/mparticle-javascript-integration-amplitude)
- [Appboy](https://github.com/mparticle-integrations/mparticle-javascript-integration-appboy)
- [BingAds](https://github.com/mparticle-integrations/mparticle-javascript-integration-bingads)
- [Device Match](https://github.com/mparticle-integrations/mparticle-javascript-integration-device-match)
- [Facebook](https://github.com/mparticle-integrations/mparticle-javascript-integration-facebook)
- [Google Analytics](https://github.com/mparticle-integrations/mparticle-javascript-integration-google-analytics)
- [Inspectlet](https://github.com/mparticle-integrations/mparticle-javascript-integration-inspectlet)
- [Intercom](https://github.com/mparticle-integrations/mparticle-javascript-integration-intercom)
- [Kahuna](https://github.com/mparticle-integrations/mparticle-javascript-integration-kahuna)
- [Kissmetrics](https://github.com/mparticle-integrations/mparticle-javascript-integration-kissmetrics)
- [Localytics](https://github.com/mparticle-integrations/mparticle-javascript-integration-localytics)
- [Mixpanel](https://github.com/mparticle-integrations/mparticle-javascript-integration-mixpanel)
- [Optimizely](https://github.com/mparticle-integrations/mparticle-javascript-integration-optimizely)
- [SimpleReach](https://github.com/mparticle-integrations/mparticle-javascript-integration-simplereach)
- [Twitter](https://github.com/mparticle-integrations/mparticle-javascript-integration-twitter)

## Running the Tests

Prior to running the tests please install all dev dependencies via an `npm install`, and build the mParticle.js file as well as the test file by running `npm run build`:

```bash
$ npm install
$ npm run build
$ npm run testKarma
```

The test script will run all tests using Karma and ChromeHeadless, Firefox, and Safari by default. To run tests using a different browser, use the command:

```
$ BROWSER=[browserBrand] npm run testBrowser
```
where browserBrand can be Edge or IE.

## Development Notes
This package comes with the NPM package [pre-commit](https://www.npmjs.com/package/pre-commit), which will run [ESLint](http://eslint.org/) when you try to commit.

## Support

<support@mparticle.com>

## License

The mParticle Javascript SDK is available under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0). See the LICENSE file for more info.
