const s = "RoktPayPlus";
const c = {
  PageView: 3,
  PageEvent: 4
}, i = {
  INITIATED: "initiated",
  STEP_COMPLETE: "stepComplete",
  APPROVED: "approved",
  PENDING: "pending",
  LOGGED_IN: "loggedIn",
  ACCOUNT_CREATED: "accountCreated",
  OFFER_SAVED: "offerSaved",
  PURCHASE_COMPLETED: "purchaseCompleted",
  FORM_SUBMITTED: "formSubmitted",
  PENDING_SUCCESS: "pendingSuccess",
  CLOSE: "close",
  REMOVE_LOADING_OVERLAY: "removeLoadingOverlay",
  GWP_APPROVED: "gwpApproved"
}, f = "conversion", p = [
  { setting: "approvedEventName", signal: i.APPROVED },
  { setting: "pendingEventName", signal: i.PENDING },
  { setting: "loggedInEventName", signal: i.LOGGED_IN },
  { setting: "accountCreatedEventName", signal: i.ACCOUNT_CREATED },
  { setting: "offerSavedEventName", signal: i.OFFER_SAVED },
  { setting: "purchaseCompletedEventName", signal: i.PURCHASE_COMPLETED },
  { setting: "formSubmittedEventName", signal: i.FORM_SUBMITTED },
  { setting: "pendingSuccessEventName", signal: i.PENDING_SUCCESS },
  { setting: "closeEventName", signal: i.CLOSE },
  { setting: "removeLoadingOverlayEventName", signal: i.REMOVE_LOADING_OVERLAY },
  { setting: "gwpApprovedEventName", signal: i.GWP_APPROVED }
];
function E(e) {
  return !e || typeof e != "string" ? [] : e.split(",").map((t) => t.trim()).filter(Boolean);
}
function d(e) {
  const t = E(e.progressionScreenNames), n = {};
  for (const { setting: o, signal: r } of p)
    for (const l of E(e[o]))
      n[l] = r;
  return {
    progressionScreens: t,
    progressionConfigured: t.length > 0,
    eventNameToSignal: n,
    eventConfigured: Object.keys(n).length > 0,
    defaultConversionEventName: e.conversionEventName || f
  };
}
function m(e) {
  return e.EventAttributes && e.EventAttributes.screen_name || e.EventName;
}
function N() {
  return typeof window > "u" ? null : window.parent && window.parent !== window ? window.parent : null;
}
function a(e, t, n) {
  const o = N();
  if (!o || typeof o.postMessage != "function")
    return;
  const r = { source: "rokt-payplus-kit", type: e };
  t !== void 0 && (r.detail = t), n !== void 0 && (r.trigger = n), o.postMessage(r, "*");
}
function g(e) {
  return e != null && typeof e == "object" && Array.isArray(e) === !1;
}
class u {
  constructor() {
    this.name = s, this.id = 184, this.isInitialized = !1, this.config = d({});
  }
  init(t) {
    return this.config = d(t || {}), a(i.INITIATED, void 0, "SDK forwarder init (app loaded)"), this.isInitialized = !0, "Successfully initialized forwarder: " + s;
  }
  process(t) {
    if (!this.isInitialized)
      return "Kit not initialized: " + s;
    switch (t.EventDataType) {
      case c.PageView:
        this.handlePageView(t);
        break;
      case c.PageEvent:
        this.handleCustomEvent(t);
        break;
    }
    return "Successfully sent to forwarder: " + s;
  }
  // Page views are funnel progression only. A configured progression screen (or any page
  // view when none are configured) emits stepComplete. A page view is never the conversion.
  handlePageView(t) {
    const n = m(t);
    if (!n)
      return;
    (!this.config.progressionConfigured || this.config.progressionScreens.indexOf(n) !== -1) && a(i.STEP_COMPLETE, { step: n }, "logPageView('" + n + "')");
  }
  // Custom events carry the conversion and other outcomes, matched on the event name.
  handleCustomEvent(t) {
    const n = t.EventName;
    if (!n)
      return;
    const o = this.config.eventNameToSignal[n];
    if (o) {
      a(o, t.EventAttributes || {}, "logEvent('" + n + "')");
      return;
    }
    !this.config.eventConfigured && n === this.config.defaultConversionEventName && a(i.APPROVED, t.EventAttributes || {}, "logEvent('" + n + "', Transaction)");
  }
}
function v() {
  return 184;
}
function S(e) {
  if (!g(e)) {
    window.console.log("'config' must be an object. You passed in a " + typeof e);
    return;
  }
  g(e.kits) || (e.kits = {}), e.kits[s] = { constructor: u }, window.console.log("Successfully registered " + s + " to your mParticle configuration");
}
if (typeof window < "u") {
  const e = window;
  e.mParticle && typeof e.mParticle.addForwarder == "function" && e.mParticle.addForwarder({ name: s, constructor: u, getId: v });
}
export {
  u as RoktPayPlusKit,
  S as register
};
//# sourceMappingURL=RoktPayPlus-Kit.esm.js.map
