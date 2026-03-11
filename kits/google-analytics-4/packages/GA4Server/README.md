# mParticle Google Analytis 4 Server Side Kit Integration

Google's server side API for GA4 requires a `client_id` which still necessitates loading Google's SDK. In this kit, mParticle loads the SDK, collects the `client_id`, and sends this as an integration attribute to our server to include it on events sent to GA4.

# Usage
JS kits are automatically included with your mParticle.js file when loading mParticle via the [snippet](https://docs.mparticle.com/developers/sdk/web/getting-started/#add-the-sdk-snippet).

If loading mParticle via [npm](https://docs.mparticle.com/developers/sdk/web/self-hosting/), you will have to manually include the server side GA4 kit via npm:

```
npm i @mparticle/web-google-analytics-4-server-kit
```

Full documentation on usage can be found [here](https://docs.mparticle.com/integrations/google-analytics-4/event/).

# License

Copyright 2022 mParticle, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
