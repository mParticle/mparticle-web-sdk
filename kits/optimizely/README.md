# integration-optimizely

## Overview

This integration contains code that maps to both [Optimizely Web](https://docs.developers.optimizely.com/web/docs/introduction/) and [Optimizely Full Stack](https://docs.developers.optimizely.com/full-stack/docs/javascript-sdk). Depending on your use case, the kit is flexible enough so that you can either use 1 of these products in isolation or both at the same time. To use both concurrently, simply add 2 Optimizely connections in the [mParticle UI](https://app.mparticle.com), and check `Use Full Stack` in one of them.

## Documentation

Please view the [Optimizely Integration docs](https://docs.mparticle.com/integrations/optimizely/event/) for full set up instructions.

### Development Notes

Normally, mParticle kit code maps mParticle events to a single product/SDK. However, as mentioned above, this mParticle Optimizely kit enables mapping an mParticle event to 2 Optimizely products/SDKs. As such, all mapping code must follow 2 different code paths. In each module under `src/`, you'll find that code is split between products with code that looks something like the following:

```
if (window.optimizely && !common.useFullStack`) {
    // Perform mapping for Optimizely Web
    // window.optimizely checks for existence of Optimizely Web's API
    // common.useFullStack is an explicit check for if the connection is for Full Stack
}

// OR

if (window.optimizelyClientInstance && this.common.useFullStack) {
    // Perform mapping for Optimizely Full Stack
    // window.optimizelyClientInstance checks for existence of Optimizely Full Stack's API
    // common.useFullStack is an explicit check for if the connection is for Full Stack
}
```

When updating this kit, be sure to follow the correct code paths where appropriate.

# License

Copyright 2020 mParticle, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
