# integration-amplitude

Amplitude Javascript integration for mParticle

#License

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

# Usage

Javascript kits are automatically included with your mParticle.js file. Please refer to https://github.com/mParticle/mparticle-sdk-javascript.

# Testing

### Unit tests

1. `npm install` in the root
2. Open test/index.html in your browsers (all tests should pass)

### Adhoc Tests

1. Go to test/adhoc/index.html and input your mParticle and Amplitude API key
2. `npm install`
2. Run `python -m SimpleHTTPServer` or equivalent at the root
3. Go to localhost:8000/test/adhoc
4. Log some events
