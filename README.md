<img src="https://www.mparticle.com/wp-content/themes/mparticle/images/logo.svg" width="280">

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
    window.mParticle = window.mParticle || {};
    window.mParticle.config = window.mParticle.config || {};
    window.mParticle.config.rq = [];
    window.mParticle.ready = function (f) {
        window.mParticle.config.rq.push(f);
    };
    var mp = document.createElement('script');
    mp.type = 'text/javascript';
    mp.async = true;
    mp.src = ('https:' == document.location.protocol ? 'https://jssdkcdns' : 'http://jssdkcdn') + '.mparticle.com/js/v2/' + apiKey + '/mparticle.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(mp, s);
})('YOUR_API_KEY');
</script>
```

You can then log events, for example, as follows:

```javascript
mParticle.logEvent('Play Movie', mParticle.EventType.Navigation, {'movie_length':'127 minutes','rating':'PG'});
```

## Creating an Integration

Similar to other mParticle SDKs, the Javascript SDK is able to automatically include, initialize, and delegate API calls to 3rd-party Javascript SDKs. If you would like to add your company as a new Javascript integration, reference the following integrations as examples:

- [AdChemix](https://github.com/mParticle/integration-adchemix)
- [Amplitude](https://github.com/mParticle/integration-amplitude)
- [Appboy](https://github.com/mParticle/integration-appboy)
- [BingAds](https://github.com/mParticle/integration-bingads)
- [Device Match](https://github.com/mParticle/integration-device-match)
- [Facebook](https://github.com/mParticle/integration-facebook)
- [Google Analytics](https://github.com/mParticle/integration-google-analytics)
- [Inspectlet](https://github.com/mParticle/integration-inspectlet)
- [Intercom](https://github.com/mParticle/integration-intercom)
- [Kahuna](https://github.com/mParticle/integration-kahuna)
- [Kissmetrics](https://github.com/mParticle/integration-kissmetrics)
- [Localytics](https://github.com/mParticle/integration-localytics)
- [Mixpanel](https://github.com/mParticle/integration-mixpanel)
- [Optimizely](https://github.com/mParticle/integration-optimizely)
- [SimpleReach](https://github.com/mParticle/integration-simplereach)
- [Twitter](https://github.com/mParticle/integration-twitter)

## Running the Tests

Prior to running the tests please install all dev dependencies via an npm install:

```bash
$ npm install
```

A suite of test cases can be run by serving the `/test` directory from a web server (such as [serve](https://www.npmjs.com/package/serve)),
and pointing a web browser to `index.html`. This will execute the tests and also display code coverage results. Note that serving the test
directory from the file system directly will not work.

You can also run the tests by executing the npm test script:

```bash
$ npm test
```
The test script will run all tests using Karma and ChromeHeadless by default. To run tests using a different browser, use the command:

```
$ BROWSER=[browserBrand] npm run testBrowser
```
where browserBrand can be Safari, Firefox, Edge, or IE.

## Development Notes
This package comes with the NPM package [pre-commit](https://www.npmjs.com/package/pre-commit), which will run [ESLint](http://eslint.org/) when you try to commit.

## Support

<support@mparticle.com>

## License

The mParticle Javascript SDK is available under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0). See the LICENSE file for more info.
