<img src="https://www.mparticle.com/assets/img/logo.svg" width="280">

# mParticle Javascript SDK

This is the initial open source release of the mParticle Javascript SDK.

## Documentation

Detailed documentation and other information about mParticle SDK can be found at: [http://docs.mparticle.com](http://docs.mparticle.com)

## Author

mParticle, Inc.

## Support

<support@mparticle.com>

## Usage

Once you have signed up to the mParticle platform and have a key for your App, you can begin to use the SDK by embedding the following
script tag in your web page, replacing "YOUR_API_KEY" with your key.

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

You can then log events as follows:

```groovy
mParticle.logEvent('Play Movie', mParticle.EventType.Navigation, {'movie_length':'127 minutes','rating':'PG'});
```

For more detailed usage examples, including integrating with our iOS and Android SDKs, please see documentation at [http://docs.mparticle.com](http://docs.mparticle.com)

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
