![Braze Logo](https://github.com/mparticle-integrations/mparticle-javascript-integration-appboy/blob/master/braze-logo.png) 

⚠️⚠️⚠️
# Notice! Opt in is now available for Braze Web SDK V5 - Action Required

You can now select what version of the Braze SDK you want to use when setting up a Braze connection in the mParticle UI.  Braze occasionally makes breaking changes to their SDK, so if you call `braze` directly in your code, you will have to update your code to ensure your website performs as expected when updating versions of Braze.

Please review the [Braze Changelog](https://www.braze.com/docs/developer_guide/platform_integration_guides/web/changelog#500) and [V5 migration guide](https://github.com/braze-inc/braze-web-sdk/blob/master/UPGRADE_GUIDE.md) to learn about the differences between V4 and V5 and what changes you will need to make in your code. The most significant breaking changes are the removal of the deprecated `enableHtmlInAppMessages` initialization option (replaced by `allowUserSuppliedJavascript`), in addition to the removal and renaming of several APIs.

You can opt into the latest major version of the Braze Web SDK whether you implement mParticle's Web SDK using npm or our snippet/CDN.
* Customers who self-host mParticle via npm - You should add @mparticle/web-braze-kit version 5.0.0 or greater in your package.json.  You must also select `Version 5` under `Braze Web SDK Version`  in the Braze connection settings.
* Customers who load mParticle via snippet/CDN - You must  select `Version 5` under `Braze Web SDK Version`  in the Braze connection settings.

Note that the following is only one example of migrating from V3 to V5.  Everywhere you manually call `appboy` needs to be updated similar to the below. If you are using NPM, you can skip to step 3.  Please be sure to test your site fully in development prior to releasing.


* Step 1: Legacy code sample. Find all the places where your code references the `appboy.display` namespace. Braze has removed all instances of the `display` namespace:
```javascript
window.appboy.display.destroyFeed();
```

Step 2: Roll out code changes prior to opting in to V5
```javascript
if (window.appboy) {
	window.appboy.display.destroyFeed();
} else if (window.braze) {
	window.braze.destroyFeed();
}
```
Step 3: Whether you are using the snippet or self hosting, you need to navigate to your Braze connection settings and select `Version 5` from the `Braze Web SDK Version` drop down.

Step 4: After you opt in, you can simplify your code. We recommend testing and waiting at least 24 hours between opting in and removing previous instances of `appboy` and doing thorough testing of your application in a development environment to ensure everything is working:
```javascript
window.braze.destroyFeed();
```

Step 5: Push Notifications via service-worker.js
If you use Push Notifications, we have updated the `service-worker.js` file.  In our testing, Braze’s push notifications work as expected regardless of what version of the service-worker is used, but we recommend updating this file to ensure future compatibility.  In your `service-worker.js` file, update the code to reference `https://static.mparticle.com/sdk/js/braze/service-worker-5.5.0.js` instead of `https://static.mparticle.com/sdk/js/braze/service-worker-4.2.0.js`.  Your `service-worker.js` file should now contain:

```javascript
self.importScripts('https://static.mparticle.com/sdk/js/braze/service-worker-5.5.0.js')
```


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