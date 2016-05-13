<img src="https://www.mparticle.com/wp-content/themes/mparticle/images/logo.svg" width="280">

# mParticle Javascript SDK

Hello! This is the public repo of the mParticle Javascript SDK. We've built the mParticle platform to take a new approach to web and mobile app data and the platform has grown to support 50+ services and SDKs, including developer tools, analytics, attribution, messaging, and advertising services. mParticle is designed to serve as the connector between all of these services - check out [our site](http://mparticle.com), or hit us at dev@mparticle.com to learn more.

## Documentation
Detailed documentation and other information about mParticle SDK can be found at [http://docs.mparticle.com](http://docs.mparticle.com)

## Usage

Once you have signed up to the mParticle platform and have a key for your App, you can begin to use the SDK by embedding the following
script tag in your web page, replacing `"YOUR_API_KEY"` with your key.

```groovy
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
    mp.src = ('https:' == document.location.protocol ? 'https://jssdkcdns' : 'http://jssdkcdn') + '.mparticle.com/js/v1/' + apiKey + '/mparticle.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(mp, s);
})('YOUR_API_KEY');

</script>
```

You can then log events, for example, as follows:

```groovy
mParticle.logEvent('Play Movie', mParticle.EventType.Navigation, {'movie_length':'127 minutes','rating':'PG'});
```

## Creating an Integration

Similar to other mParticle SDKs, the Javascript SDK is able to automatically include, initialize, and delegate API calls to 3rd-party Javascript SDKs. If you would like to add your company as a new Javascript integration, reference the following integrations as examples:

- [AdChemix](https://github.com/mParticle/integration-adchemix)
- [Amplitude](https://github.com/mParticle/integration-amplitude)
- [Appboy](https://github.com/mParticle/integration-appboy)
- [Facebook](https://github.com/mParticle/integration-facebook)
- [Google Analytics](https://github.com/mParticle/integration-google-analytics)
- [Inspectlet](https://github.com/mParticle/integration-inspectlet)
- [Intercom](https://github.com/mParticle/integration-intercom)
- [Kahuna](https://github.com/mParticle/integration-kahuna)
- [KISSMetrics](https://github.com/mParticle/integration-kissmetrics)
- [Mixpanel](https://github.com/mParticle/integration-mixpanel)
- [Optimizely](https://github.com/mParticle/integration-optimizely)
- [SimpleReach](https://github.com/mParticle/integration-simplereach)
- [Twitter](https://github.com/mParticle/integration-twitter)

## Running the Tests

A suite of test cases can be run by serving the /test directory from a web server (such as [serve](https://www.npmjs.com/package/serve)),
and pointing a web browser to index.html. This will execute the tests and also display code coverage results. Note that serving the test
directory from the file system directly will not work.

## Support

<support@mparticle.com>

## License

Copyright 2015 mParticle, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
