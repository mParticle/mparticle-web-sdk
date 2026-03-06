![Braze Logo](https://github.com/mparticle-integrations/mparticle-javascript-integration-appboy/blob/master/braze-logo.png)

⚠️⚠️⚠️
# Notice! Timeline for Breaking Changes for mParticle Web Braze Kit- 10/15/2022 - 2/15/2023
Customers who use mParticle and Braze on their websites may require some code changes due to an update we are making to the mParticle Braze web kit.  The web kit, which previously used v3.5.0 of the Braze web SDK, will use Braze SDK 4.2.1 starting on 2/15/2023 on our CDN.

* <b>The Braze web SDK has several breaking changes and if you load mParticle via snippet/CDN, you should <a href="#update-to-braze-sdk-version-4-from-version-3---10152022---2152023">follow these instructions to ensure your code continues to work when our changes go live to the CDN on 2/15/2023</a>.  If you self-host mParticle and the Braze Web Kit via npm, you can update sooner. Follow the instructions below whether you self-host or load mParticle via snippet/CDN.</b>.
* <b>Note that if you are here looking at source code, the `master` branch will continue to contain Braze Web Kit version 3.X until 2/15/2023.  The `braze-v4-npm-master` branch currently contains the source code for v4.X, and this will be merged to `master` on 2/15/2023 to be available via CDN.  </b>
* If you are using version 2 of the @mparticle/web-appboy-kit, you will need to <a href="#transition-from-mparticleweb-appboy-kit-to-mparticleweb-braze-kit">transition to @mparticle/web-braze-kit per the instructions here</a> before following the below instructions as well.

## Braze Web Kit Citical Updates and Timelines

Braze occasionally makes breaking changes to their SDK, so if you call Braze directly in your code, you may have to update your code to ensure your website performs as expected after mParticle updates to the latest Braze SDKs.  This section communicates migration steps for customers to make to their codebase to ensure compatibility.

Customers who implement mParticle via NPM and self-host our SDK can choose when they want to update their code and [@mParticle/web-braze-kit version](https://www.npmjs.com/package/@mparticle/web-braze-kit), but customers who implement mParticle via our snippet/CDN must pay close attention to the following timelines and instructions.

| mParticle Braze Web Kit Version |  Braze SDK Version Supported | Deadline/Date of CDN Release  | Link to Description |
| ---|---|---|---|
| v4.0.0 | v4.2.1 | 2/15/2023 | [Link](#update-to-braze-sdk-version-4-from-version-3---10152022---2152023) |
| v3.0.4 | v3.5.0 | NA | [Link](#transition-from-mparticleweb-appboy-kit-to-mparticleweb-braze-kit) |

### Update to Braze SDK Version 4 from Version 3 - 10/15/2022 - 2/15/2023

Please review [Braze’s Changelog notes](https://www.braze.com/docs/developer_guide/platform_integration_guides/web/changelog#400) as well as Braze’s [migration guide](https://github.com/braze-inc/braze-web-sdk/blob/master/UPGRADE_GUIDE.md) between version 3 and 4 to understand these changes and what code updates are needed from your side.  The largest change is the move from class name `appboy` to `braze`. Braze also removed and renamed some APIs.  As a result, we are also updating our mParticle Braze web kit from 3.0.X to 4.0.X in order to support Braze’s Web SDK version 4.2.1.

We plan to release the updated mParticle Braze Kit on two different time frames depending on how you load mParticle:
* Customers who self-host mParticle via npm - You will be able to update manually from npm on 10/15/2022
* Customers who load mParticle via snippet/CDN - We will push an update to the CDN on 2/15/2023 to make it automatically available.

We want to allow our customers to take advantage of the latest from Braze, so we are releasing the kit update via npm earlier.  However, due to the sensitive nature of the breaking changes in Braze’s latest version, we want to give ample notice to all of our customers who are on the CDN since these customers will get the update automatically.  We want to respect the end-of-year code freezes that a lot of our customers have and allow plenty of time to make the required code changes.  Striking this balance is important for us, so if you are on the CDN but need the update sooner, you can [switch to self-hosting on npm](https://docs.mparticle.com/developers/sdk/web/self-hosting/).

If you load mParticle via snippet/CDN, you will have to make changes to your codebase before February 15, 2023 to be compatible with both version 3 and version 4 of the Braze SDK to ensure your code continues to work. We recommend a three-step approach. Here are some code samples of what this code could look like today (step 1), preparing for the update (step 2) and after the change is live (step 3). 

The following recommendations apply only to customers who load mParticle via snippet. Customers who self-host via npm can ignore step 1 and jump straight to step 3 after updating their mParticle Braze kit.  Note that this is only one example.  Everywhere you manually call `appboy` needs to be updated similar to the below, and please refer to the Braze Changelog and migration guide as referenced earlier:

* Step 1: Legacy code sample. Find all the places where your code references the `appboy.display` namespace.  Braze has removed all instances of the `display` namespace:
```javascript
window.appboy.display.destroyFeed();
```

Step 2: Roll out code changes to be used before February 15, 2023:
```javascript
	if (window.appboy) {
window.appboy.display.destroyFeed();
} else if (window.braze) {
	window.braze.destroyFeed();
}
```
Step 3: After February 1, 2023, you can simplify your code after the mParticle Braze Web kit, which includes Braze SDK V4, has been released to our CDN:
```javascript
window.braze.destroyFeed();
```

Step 4: Push Notifications via service-worker.js
If you use Push Notifications, we have updated the `service-worker.js` file.  In our testing, Braze’s push notifications work as expected regardless of what version of the service-worker is used, but we recommend updating this file to ensure future compatibility.  In your `service-worker.js` file, update the code to reference `https://static.mparticle.com/sdk/js/braze/service-worker-4.2.0.js` instead of `https://static.mparticle.com/sdk/js/braze/service-worker-3.5.0.js`.  Your `service-worker.js` file should now contain:

```javascript
self.imports('https://static.mparticle.com/sdk/js/braze/service-worker-4.2.0.js')
```

### Transition from @mparticle/web-appboy-kit to @mparticle/web-braze-kit

The legacy @mparticle/web-appboy-kit from npm includes version 2 of the Braze Web SDK.  As part of this update, we've created a new [Braze web kit repo](https://github.com/mparticle-integrations/mparticle-javascript-integration-braze) to replace our deprecated [Appboy web kit repo](https://github.com/mparticle-integrations/mparticle-javascript-integration-appboy).  If you are still using `@mparticle/web-appboy-kit`, you will need to consider the breaking changes Braze made between V2 and V3 of the Braze SDK (found [here](https://www.braze.com/docs/developer_guide/platform_integration_guides/web/changelog/#300)) as well as the instructions above to get from V2 to V4 of the Braze SDK.



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