# mParticle Rokt Kit Integration

# Usage
JS kits are automatically included with your mParticle.js file when loading mParticle via the [snippet](https://docs.mparticle.com/developers/sdk/web/getting-started/#add-the-sdk-snippet).

If loading mParticle via [npm](https://docs.mparticle.com/developers/sdk/web/self-hosting/), you will have to manually include the Rokt kit via npm.

```
npm i @mparticle/web-rokt-kit
```

# Device storage

The kit keeps a small amount of state under one key, `mp-rokt-kit`, in `localStorage` and `sessionStorage`.

| Storage | Field | Contents | Lifetime |
| --- | --- | --- | --- |
| `localStorage` | `pageViews` | Up to 25 recent page views: URL and canonical URL with the query string removed (the fragment is kept), title, the mParticle message ID, timestamp and active time | Cleared at mParticle session end |
| `localStorage` | `utmParams` | The `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` and `utm_content` query parameters | Cleared at session end |
| `localStorage` | `preselectTriggerAnyTab:<accountId>:<targetPageIdentifier>` | When a preselection trigger was last seen in any tab, used only for a diagnostic flag | Ignored after 30 minutes; cleared at session end and logout |
| `sessionStorage` | `pendingPreselect:<accountId>` | A preselection call saved on one page to retry from the next: path, target page identifier, the attributes it will send, the MPID and an expiry time | Expires after 5 minutes and is removed when read after that; removed when the next page picks it up, whether or not it sends, and at session end and logout |
| `sessionStorage` | `activePreselect:<accountId>:<pathname or targetPageIdentifier>` | A hash of the last preselection call's attributes (never the values), whether a custom event fired it, and an expiry time, used to skip duplicate calls | Ignored after 60 seconds; cleared at session end and logout |
| `sessionStorage` | `preselectArrival:<accountId>:<targetPageIdentifier>` | Timestamps of the trigger, identity, call and arrival on the target page, used only for diagnostics. While checkout intent is active it also keeps `intentAt`, the time of the strongest checkout intent seen in the tab, and `intentKind`, one of `commit`, `wallet`, `frame` or `checkout_step`. Neither holds an identifier or an attribute value | Cleared at session end and logout; an intent older than 30 minutes is ignored |

While mParticle's automatic page view logging (`AutoLogPageView`) is on, the kit takes the title and the utm parameters only from the page view event, so it stores none that the Rokt connection's attribute filters or the data plan removed. With it off, a page view logged by hand that has no title records `document.title`, and the utm parameters come from the page URL, even when a filter removed them from the event.

When the launcher options set `noFunctional` (mParticle also sets it for `noDeviceId`), the kit keeps all of this in page memory and removes anything already stored. When `noTargeting` is set, the kit removes the stored key at startup and records nothing. When `doNotShareOrSell` is set or the browser sends Global Privacy Control, the kit makes no preselection call, so it writes no `pendingPreselect` or `activePreselect` record. It also removes any stored `pageViews` and `utmParams` at startup and on each page view, stores no new ones, and sends no page history on any placement call.

# License

Copyright 2025 mParticle, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
