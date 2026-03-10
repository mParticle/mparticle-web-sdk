Object.defineProperty(exports, '__esModule', { value: true });

function getAugmentedNamespace(n) {
  var f = n.default;
	if (typeof f == "function") {
		var a = function () {
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

const je = {
  Wn: function(t) {
    const r = (t + "=".repeat((4 - (t.length % 4)) % 4))
        .replace(/\-/g, "+")
        .replace(/_/g, "/"),
      n = atob(r),
      o = new Uint8Array(n.length);
    for (let t = 0; t < n.length; ++t) o[t] = n.charCodeAt(t);
    return o;
  }
};

const ve = {
    CustomEvent: "ce",
    Pr: "p",
    Rl: "pc",
    cc: "ca",
    ya: "i",
    Is: "ie",
    P: "cci",
    T: "ccic",
    $: "ccc",
    H: "ccd",
    Vh: "ss",
    Fh: "se",
    _i: "si",
    Ii: "sc",
    Mi: "sbc",
    Ze: "sfe",
    ro: "iec",
    Pl: "lr",
    Ll: "uae",
    R: "ci",
    B: "cc",
    Nl: "lcaa",
    Ml: "lcar",
    Rn: "inc",
    Bn: "add",
    Ln: "rem",
    Fn: "set",
    $n: "ncam",
    Ol: "sgu"
  },
  De = { Ar: "feed_displayed", dc: "content_cards_displayed" };

const Ie = {
  Y: () => {
    const t = t => {
      const e = (Math.random().toString(16) + "000000000").substr(2, 8);
      return t ? "-" + e.substr(0, 4) + "-" + e.substr(4, 4) : e;
    };
    return t() + t(!0) + t(!0) + t();
  }
};

class Be {
  constructor(t, e) {
    (this.td = "undefined" == typeof window ? self : window),
      (this.ed = t),
      (this.nd = e);
  }
  od() {
    if ("indexedDB" in this.td) return this.td.indexedDB;
  }
  rd() {
    try {
      if (null == this.od()) return !1;
      {
        const t = this.od().open("Braze IndexedDB Support Test");
        if (
          ((t.onupgradeneeded = () => t.result.close()),
          (t.onsuccess = () => t.result.close()),
          "undefined" != typeof window)
        ) {
          const t = window.chrome || window.browser || window.msBrowser;
          if (t && t.runtime && t.runtime.id)
            return (
              this.nd.info(
                "Not using IndexedDB for storage because we are running inside an extension"
              ),
              !1
            );
        }
        return !0;
      }
    } catch (t) {
      return (
        this.nd.info(
          "Not using IndexedDB for storage due to following error: " + t
        ),
        !1
      );
    }
  }
  sd(t, e) {
    const n = this.od().open(this.ed.dd, this.ed.VERSION);
    if (null == n) return "function" == typeof e && e(), !1;
    const o = this;
    return (
      (n.onupgradeneeded = t => {
        o.nd.info(
          "Upgrading indexedDB " + o.ed.dd + " to v" + o.ed.VERSION + "..."
        );
        const e = t.target.result;
        for (const t in o.ed.Jt)
          o.ed.Jt.hasOwnProperty(t) &&
            !e.objectStoreNames.contains(o.ed.Jt[t]) &&
            e.createObjectStore(o.ed.Jt[t]);
      }),
      (n.onsuccess = n => {
        const i = n.target.result;
        (i.onversionchange = () => {
          i.close(),
            "function" == typeof e && e(),
            o.nd.error(
              "Needed to close the database unexpectedly because of an upgrade in another tab"
            );
        }),
          t(i);
      }),
      (n.onerror = t => (
        o.nd.info(
          "Could not open indexedDB " +
            o.ed.dd +
            " v" +
            o.ed.VERSION +
            ": " +
            t.target.errorCode
        ),
        "function" == typeof e && e(),
        !0
      )),
      !0
    );
  }
  setItem(t, e, n, o, i) {
    if (!this.rd()) return "function" == typeof i && i(), !1;
    const r = this;
    return this.sd(s => {
      if (!s.objectStoreNames.contains(t))
        return (
          r.nd.error(
            "Could not store object " +
              e +
              " in " +
              t +
              " on indexedDB " +
              r.ed.dd +
              " - " +
              t +
              " is not a valid objectStore"
          ),
          "function" == typeof i && i(),
          void s.close()
        );
      const d = s.transaction([t], "readwrite");
      d.oncomplete = () => s.close();
      const u = d.objectStore(t).put(n, e);
      (u.onerror = () => {
        r.nd.error(
          "Could not store object " +
            e +
            " in " +
            t +
            " on indexedDB " +
            r.ed.dd
        ),
          "function" == typeof i && i();
      }),
        (u.onsuccess = () => {
          "function" == typeof o && o();
        });
    }, i);
  }
  getItem(t, e, n) {
    if (!this.rd()) return !1;
    const o = this;
    return this.sd(i => {
      if (!i.objectStoreNames.contains(t))
        return (
          o.nd.error(
            "Could not retrieve object " +
              e +
              " in " +
              t +
              " on indexedDB " +
              o.ed.dd +
              " - " +
              t +
              " is not a valid objectStore"
          ),
          void i.close()
        );
      const r = i.transaction([t], "readonly");
      r.oncomplete = () => i.close();
      const s = r.objectStore(t).get(e);
      (s.onerror = () => {
        o.nd.error(
          "Could not retrieve object " +
            e +
            " in " +
            t +
            " on indexedDB " +
            o.ed.dd
        );
      }),
        (s.onsuccess = t => {
          const e = t.target.result;
          null != e && n(e);
        });
    });
  }
  hr(t, e, n) {
    if (!this.rd()) return "function" == typeof n && n(), !1;
    const o = this;
    return this.sd(i => {
      if (!i.objectStoreNames.contains(t))
        return (
          o.nd.error(
            "Could not retrieve last record from " +
              t +
              " on indexedDB " +
              o.ed.dd +
              " - " +
              t +
              " is not a valid objectStore"
          ),
          "function" == typeof n && n(),
          void i.close()
        );
      const r = i.transaction([t], "readonly");
      r.oncomplete = () => i.close();
      const s = r.objectStore(t).openCursor(null, "prev");
      (s.onerror = () => {
        o.nd.error(
          "Could not open cursor for " + t + " on indexedDB " + o.ed.dd
        ),
          "function" == typeof n && n();
      }),
        (s.onsuccess = t => {
          const o = t.target.result;
          null != o && null != o.value && null != o.key
            ? e(o.key, o.value)
            : "function" == typeof n && n();
        });
    }, n);
  }
  br(t, e) {
    if (!this.rd()) return !1;
    const n = this;
    return this.sd(o => {
      if (!o.objectStoreNames.contains(t))
        return (
          n.nd.error(
            "Could not delete record " +
              e +
              " from " +
              t +
              " on indexedDB " +
              n.ed.dd +
              " - " +
              t +
              " is not a valid objectStore"
          ),
          void o.close()
        );
      const i = o.transaction([t], "readwrite");
      i.oncomplete = () => o.close();
      i.objectStore(t).delete(e).onerror = () => {
        n.nd.error(
          "Could not delete record " +
            e +
            " from " +
            t +
            " on indexedDB " +
            n.ed.dd
        );
      };
    });
  }
  Mt(t, e) {
    if (!this.rd()) return !1;
    const n = this;
    return this.sd(o => {
      if (!o.objectStoreNames.contains(t))
        return (
          n.nd.error(
            "Could not retrieve objects from " +
              t +
              " on indexedDB " +
              n.ed.dd +
              " - " +
              t +
              " is not a valid objectStore"
          ),
          void o.close()
        );
      const i = o.transaction([t], "readwrite");
      i.oncomplete = () => o.close();
      const r = i.objectStore(t),
        s = r.openCursor(),
        d = [];
      (s.onerror = () => {
        d.length > 0
          ? (n.nd.info(
              "Cursor closed midway through for " +
                t +
                " on indexedDB " +
                n.ed.dd
            ),
            e(d))
          : n.nd.error(
              "Could not open cursor for " + t + " on indexedDB " + n.ed.dd
            );
      }),
        (s.onsuccess = t => {
          const n = t.target.result;
          if (null != n) {
            if (null != n.value && null != n.key) {
              r.delete(n.key).onsuccess = () => {
                d.push(n.value);
              };
            }
            n.continue();
          } else d.length > 0 && e(d);
        });
    });
  }
  clearData() {
    if (!this.rd()) return !1;
    const t = [];
    for (const e in this.ed.Jt)
      this.ed.Jt.hasOwnProperty(e) &&
        this.ed.Jt[e] !== this.ed.Jt.oe &&
        t.push(this.ed.Jt[e]);
    const e = this;
    return this.sd(function(n) {
      const o = n.transaction(t, "readwrite");
      o.oncomplete = () => n.close();
      for (let n = 0; n < t.length; n++) {
        const i = t[n];
        o.objectStore(i).clear().onerror = function() {
          e.nd.error(
            "Could not clear " + this.source.name + " on indexedDB " + e.ed.dd
          );
        };
      }
      o.onerror = function() {
        e.nd.error("Could not clear object stores on indexedDB " + e.ed.dd);
      };
    });
  }
}
Be.ep = {
  Ft: {
    dd: "AppboyServiceWorkerAsyncStorage",
    VERSION: 6,
    Jt: {
      Xa: "data",
      kr: "pushClicks",
      cu: "pushSubscribed",
      ud: "fallbackDevice",
      qt: "cardUpdates",
      oe: "optOut",
      yr: "pendingData",
      gu: "sdkAuthenticationSignature"
    },
    se: 1
  }
};

const Ae = {
  init: function(n) {
    (void 0 === n && void 0 !== Ae.zg) || (Ae.zg = !!n), Ae.Eg || (Ae.Eg = !0);
  },
  destroy: function() {
    (Ae.Eg = !1), (Ae.zg = void 0), (Ae.nd = void 0);
  },
  setLogger: function(n) {
    "function" == typeof n
      ? (Ae.init(), (Ae.nd = n))
      : Ae.info("Ignoring setLogger call since logger is not a function");
  },
  toggleLogging: function() {
    Ae.init(),
      Ae.zg
        ? (console.log("Disabling Braze logging"), (Ae.zg = !1))
        : (console.log("Enabled Braze logging"), (Ae.zg = !0));
  },
  info: function(n) {
    if (Ae.zg) {
      const o = "Braze: " + n;
      null != Ae.nd ? Ae.nd(o) : console.log(o);
    }
  },
  warn: function(n) {
    if (Ae.zg) {
      const o = "Braze SDK Warning: " + n + " (v4.8.0)";
      null != Ae.nd ? Ae.nd(o) : console.warn(o);
    }
  },
  error: function(n) {
    if (Ae.zg) {
      const o = "Braze SDK Error: " + n + " (v4.8.0)";
      null != Ae.nd ? Ae.nd(o) : console.error(o);
    }
  }
};

var Ge = {
  ho: "allowCrawlerActivity",
  Eo: "baseUrl",
  _o: "noCookies",
  Io: "devicePropertyAllowlist",
  ia: "disablePushTokenMaintenance",
  Ao: "enableLogging",
  So: "enableSdkAuthentication",
  ta: "manageServiceWorkerExternally",
  No: "minimumIntervalBetweenTriggerActionsInSeconds",
  wo: "sessionTimeoutInSeconds",
  To: "appVersion",
  na: "serviceWorkerLocation",
  ra: "safariWebsitePushId",
  Mn: "localization",
  lo: "contentSecurityNonce",
  Oo: "enableHtmlInAppMessages",
  Co: "allowUserSuppliedJavascript",
  mo: "inAppMessageZIndex",
  po: "openInAppMessagesInNewTab",
  en: "openNewsFeedCardsInNewTab",
  Lh: "requireExplicitInAppMessageDismissal",
  Lo: "doNotLoadFontAwesome",
  Po: "sdkFlavor",
  tn: "openCardsInNewTab"
};

const r = { _n: je, q: ve, Cr: De, Z: Ie, xt: Be, zt: Be.ep, j: Ae, Jo: Ge };
var r$1 = r;

function values(t) {
  const e = [];
  for (let r in t)
    Object.prototype.hasOwnProperty.call(t, r) &&
      void 0 !== t[r] &&
      e.push(t[r]);
  return e;
}
function validateValueIsFromEnum(t, e, n, o) {
  const c = values(t);
  return (
    -1 !== c.indexOf(e) ||
    (r$1.j.error(`${n} Valid values from ${o} are "${c.join('"/"')}".`), !1)
  );
}
function isArray(t) {
  return Array.isArray
    ? Array.isArray(t)
    : "[object Array]" === Object.prototype.toString.call(t);
}
function isDate(t) {
  return "[object Date]" === Object.prototype.toString.call(t);
}
function isObject$1(t) {
  return "[object Object]" === Object.prototype.toString.call(t);
}
function intersection(t) {
  null == t && (t = []);
  const e = [],
    r = arguments.length;
  for (let n = 0, o = t.length; n < o; n++) {
    const o = t[n];
    if (-1 !== e.indexOf(o)) continue;
    let c = 1;
    for (c = 1; c < r && -1 !== arguments[c].indexOf(o); c++);
    c === r && e.push(o);
  }
  return e;
}
function keys(t) {
  const e = [];
  for (let r in t) Object.prototype.hasOwnProperty.call(t, r) && e.push(r);
  return e;
}
function isEqual(t, e) {
  if (t === e) return 0 !== t || 1 / t == 1 / e;
  if (null == t || null == e) return t === e;
  const r = t.toString();
  if (r !== e.toString()) return !1;
  switch (r) {
    case "[object RegExp]":
    case "[object String]":
      return "" + t == "" + e;
    case "[object Number]":
      return +t != +t ? +e != +e : 0 == +t ? 1 / +t == 1 / e : +t == +e;
    case "[object Date]":
    case "[object Boolean]":
      return +t == +e;
  }
  const n = "[object Array]" === r;
  if (!n) {
    if ("object" != typeof t || "object" != typeof e) return !1;
    const r = t.constructor,
      n = e.constructor;
    if (
      r !== n &&
      !(
        "function" == typeof r &&
        r instanceof r &&
        "function" == typeof n &&
        n instanceof n
      ) &&
      "constructor" in t &&
      "constructor" in e
    )
      return !1;
  }
  const o = [],
    c = [];
  let i = o.length;
  for (; i--; ) if (o[i] === t) return c[i] === e;
  if ((o.push(t), c.push(e), n)) {
    if (((i = t.length), i !== e.length)) return !1;
    for (; i--; ) if (!isEqual(t[i], e[i])) return !1;
  } else {
    let r,
      n = keys(t);
    if (((i = n.length), keys(e).length !== i)) return !1;
    for (; i--; )
      if (
        ((r = n[i]),
        !Object.prototype.hasOwnProperty.call(e, r) ||
          !isEqual(t[r], e[r]))
      )
        return !1;
  }
  return o.pop(), c.pop(), !0;
}

function convertMsToSeconds(e, n) {
  let t = e / 1e3;
  return n && (t = Math.floor(t)), t;
}
function convertSecondsToMs(e) {
  return 1e3 * e;
}
function dateFromUnixTimestamp(e) {
  const n = parseInt(e);
  return null == e || isNaN(n) ? null : new Date(1e3 * n);
}
function toValidBackendTimeString(e) {
  return null != e && isDate(e) ? e.toISOString().replace(/\.[0-9]{3}Z$/, "") : e;
}
function rehydrateDateAfterJsonization(e) {
  return null == e || "" === e ? null : new Date(e);
}
function timestampOrNow(e) {
  return null == e || "" === e ? new Date().valueOf() : e;
}
function secondsAgo(e) {
  return (new Date().valueOf() - e.valueOf()) / 1e3;
}
function secondsInTheFuture(e) {
  return (e.valueOf() - new Date().valueOf()) / 1e3;
}

const MAX_PURCHASE_QUANTITY = 100;
const MUST_BE_IN_APP_MESSAGE_WARNING =
  "inAppMessage must be an InAppMessage object";
const MUST_BE_CARD_WARNING_SUFFIX = "must be a Card object";
const FEED_ANIMATION_DURATION = 500;
const LOG_CUSTOM_EVENT_STRING = "logCustomEvent";
const SET_CUSTOM_USER_ATTRIBUTE_STRING = "setCustomUserAttribute";
const BRAZE_MUST_BE_INITIALIZED_ERROR =
  "Braze must be initialized before calling methods.";
const CONTENT_CARDS_RATE_LIMIT_CAPACITY_DEFAULT = 5;
const CONTENT_CARDS_RATE_LIMIT_REFILL_RATE_DEFAULT = 90;
const LAST_REQUEST_TO_ENDPOINT_MS_AGO_DEFAULT = 72e5;
const MAX_ERROR_RETRIES_CONTENT_CARDS = 3;

class E {
  constructor() {
    this.zo = {};
  }
  lt(t) {
    if ("function" != typeof t) return null;
    const i = r$1.Z.Y();
    return (this.zo[i] = t), i;
  }
  removeSubscription(t) {
    delete this.zo[t];
  }
  removeAllSubscriptions() {
    this.zo = {};
  }
  fu() {
    return Object.keys(this.zo).length;
  }
  Et(t) {
    const i = [];
    for (let r in this.zo) i.push(this.zo[r](t));
    return i;
  }
}

class Card {
  constructor(t, i, s, h, n, l, e, r, u, E, o, T, I, a, N, c) {
    (this.id = t),
      (this.viewed = i),
      (this.title = s),
      (this.imageUrl = h),
      (this.description = n),
      (this.created = l),
      (this.updated = e),
      (this.categories = r),
      (this.expiresAt = u),
      (this.url = E),
      (this.linkText = o),
      (this.aspectRatio = T),
      (this.extras = I),
      (this.pinned = a),
      (this.dismissible = N),
      (this.clicked = c),
      (this.id = t),
      (this.viewed = i || !1),
      (this.title = s || ""),
      (this.imageUrl = h),
      (this.description = n || ""),
      (this.created = l || null),
      (this.updated = e || null),
      (this.categories = r || []),
      (this.expiresAt = u || null),
      (this.url = E),
      (this.linkText = o),
      null == T
        ? (this.aspectRatio = null)
        : ((T = parseFloat(T.toString())),
          (this.aspectRatio = isNaN(T) ? null : T)),
      (this.extras = I || {}),
      (this.pinned = a || !1),
      (this.dismissible = N || !1),
      (this.dismissed = !1),
      (this.clicked = c || !1),
      (this.isControl = !1),
      (this.test = !1),
      (this.ht = null),
      (this.nt = null);
  }
  subscribeToClickedEvent(t) {
    return this.et().lt(t);
  }
  subscribeToDismissedEvent(t) {
    return this.rt().lt(t);
  }
  removeSubscription(t) {
    this.et().removeSubscription(t), this.rt().removeSubscription(t);
  }
  removeAllSubscriptions() {
    this.et().removeAllSubscriptions(), this.rt().removeAllSubscriptions();
  }
  dismissCard() {
    if (!this.dismissible || this.dismissed) return;
    "function" == typeof this.logCardDismissal && this.logCardDismissal();
    const t = this._;
    t &&
      ((t.style.height = t.offsetHeight + "px"),
      (t.className = t.className + " ab-hide"),
      setTimeout(function() {
        t &&
          t.parentNode &&
          ((t.style.height = "0"),
          (t.style.margin = "0"),
          setTimeout(function() {
            t && t.parentNode && t.parentNode.removeChild(t);
          }, Card.ut));
      }, FEED_ANIMATION_DURATION));
  }
  et() {
    return null == this.ht && (this.ht = new E()), this.ht;
  }
  rt() {
    return null == this.nt && (this.nt = new E()), this.nt;
  }
  M() {
    this.viewed = !0;
  }
  p() {
    (this.viewed = !0), (this.clicked = !0), this.et().Et();
  }
  F() {
    return (
      !(!this.dismissible || this.dismissed) &&
      ((this.dismissed = !0), this.rt().Et(), !0)
    );
  }
  ot(t) {
    if (null == t || t[Card.Tt.ns] !== this.id) return !0;
    if (t[Card.Tt.It]) return !1;
    if (
      null != t[Card.Tt.us] &&
      null != this.updated &&
      parseInt(t[Card.Tt.us]) < convertMsToSeconds(this.updated.valueOf())
    )
      return !0;
    if (
      (t[Card.Tt.ls] && !this.viewed && (this.viewed = !0),
      t[Card.Tt.gs] && !this.clicked && (this.clicked = t[Card.Tt.gs]),
      null != t[Card.Tt.st] && (this.title = t[Card.Tt.st]),
      null != t[Card.Tt.os] && (this.imageUrl = t[Card.Tt.os]),
      null != t[Card.Tt.it] && (this.description = t[Card.Tt.it]),
      null != t[Card.Tt.us])
    ) {
      const i = dateFromUnixTimestamp(t[Card.Tt.us]);
      null != i && (this.updated = i);
    }
    if (null != t[Card.Tt.ps]) {
      let i;
      (i = t[Card.Tt.ps] === Card.Nt ? null : dateFromUnixTimestamp(t[Card.Tt.ps])),
        (this.expiresAt = i);
    }
    if (
      (null != t[Card.Tt.URL] && (this.url = t[Card.Tt.URL]),
      null != t[Card.Tt.bs] && (this.linkText = t[Card.Tt.bs]),
      null != t[Card.Tt.fs])
    ) {
      const i = parseFloat(t[Card.Tt.fs].toString());
      this.aspectRatio = isNaN(i) ? null : i;
    }
    return (
      null != t[Card.Tt.xs] && (this.extras = t[Card.Tt.xs]),
      null != t[Card.Tt.js] && (this.pinned = t[Card.Tt.js]),
      null != t[Card.Tt.zs] && (this.dismissible = t[Card.Tt.zs]),
      null != t[Card.Tt.ks] && (this.test = t[Card.Tt.ks]),
      !0
    );
  }
  ss() {
    throw new Error("Must be implemented in a subclass");
  }
}
(Card.Nt = -1),
  (Card.Tt = {
    ns: "id",
    ls: "v",
    zs: "db",
    It: "r",
    us: "ca",
    js: "p",
    ps: "ea",
    xs: "e",
    ts: "tp",
    os: "i",
    st: "tt",
    it: "ds",
    URL: "u",
    bs: "dm",
    fs: "ar",
    gs: "cl",
    ks: "t"
  }),
  (Card.es = {
    tt: "captioned_image",
    ct: "text_announcement",
    St: "short_news",
    rs: "banner_image",
    At: "control"
  }),
  (Card.hs = {
    ns: "id",
    ls: "v",
    zs: "db",
    cs: "cr",
    us: "ca",
    js: "p",
    ds: "t",
    ps: "ea",
    xs: "e",
    ts: "tp",
    os: "i",
    st: "tt",
    it: "ds",
    URL: "u",
    bs: "dm",
    fs: "ar",
    gs: "cl",
    ks: "s"
  }),
  (Card.Dt = {
    dt: "ADVERTISING",
    Ct: "ANNOUNCEMENTS",
    Rt: "NEWS",
    bt: "SOCIAL"
  }),
  (Card.ut = 400);

class Banner extends Card {
  constructor(s, t, i, h, r, e, n, l, a, o, u, c, d, p) {
    super(s, t, null, i, null, h, r, e, n, l, a, o, u, c, d, p),
      (this.U = "ab-banner"),
      (this.V = !1),
      (this.test = !1);
  }
  ss() {
    const s = {};
    return (
      (s[Card.hs.ts] = Card.es.rs),
      (s[Card.hs.ns] = this.id),
      (s[Card.hs.ls] = this.viewed),
      (s[Card.hs.os] = this.imageUrl),
      (s[Card.hs.us] = this.updated),
      (s[Card.hs.cs] = this.created),
      (s[Card.hs.ds] = this.categories),
      (s[Card.hs.ps] = this.expiresAt),
      (s[Card.hs.URL] = this.url),
      (s[Card.hs.bs] = this.linkText),
      (s[Card.hs.fs] = this.aspectRatio),
      (s[Card.hs.xs] = this.extras),
      (s[Card.hs.js] = this.pinned),
      (s[Card.hs.zs] = this.dismissible),
      (s[Card.hs.gs] = this.clicked),
      (s[Card.hs.ks] = this.test),
      s
    );
  }
}

class CaptionedImage extends Card {
  constructor(t, s, i, h, e, r, a, o, c, n, d, p, u, l, m, f) {
    super(t, s, i, h, e, r, a, o, c, n, d, p, u, l, m, f),
      (this.U = "ab-captioned-image"),
      (this.V = !0),
      (this.test = !1);
  }
  ss() {
    const t = {};
    return (
      (t[Card.hs.ts] = Card.es.tt),
      (t[Card.hs.ns] = this.id),
      (t[Card.hs.ls] = this.viewed),
      (t[Card.hs.st] = this.title),
      (t[Card.hs.os] = this.imageUrl),
      (t[Card.hs.it] = this.description),
      (t[Card.hs.us] = this.updated),
      (t[Card.hs.cs] = this.created),
      (t[Card.hs.ds] = this.categories),
      (t[Card.hs.ps] = this.expiresAt),
      (t[Card.hs.URL] = this.url),
      (t[Card.hs.bs] = this.linkText),
      (t[Card.hs.fs] = this.aspectRatio),
      (t[Card.hs.xs] = this.extras),
      (t[Card.hs.js] = this.pinned),
      (t[Card.hs.zs] = this.dismissible),
      (t[Card.hs.gs] = this.clicked),
      (t[Card.hs.ks] = this.test),
      t
    );
  }
}

class ClassicCard extends Card {
  constructor(s, t, i, h, r, c, e, a, o, d, l, n, u, p, f, m) {
    super(s, t, i, h, r, c, e, a, o, d, l, n, u, p, f, m),
      (this.U = "ab-classic-card"),
      (this.V = !0);
  }
  ss() {
    const s = {};
    return (
      (s[Card.hs.ts] = Card.es.St),
      (s[Card.hs.ns] = this.id),
      (s[Card.hs.ls] = this.viewed),
      (s[Card.hs.st] = this.title),
      (s[Card.hs.os] = this.imageUrl),
      (s[Card.hs.it] = this.description),
      (s[Card.hs.us] = this.updated),
      (s[Card.hs.cs] = this.created),
      (s[Card.hs.ds] = this.categories),
      (s[Card.hs.ps] = this.expiresAt),
      (s[Card.hs.URL] = this.url),
      (s[Card.hs.bs] = this.linkText),
      (s[Card.hs.fs] = this.aspectRatio),
      (s[Card.hs.xs] = this.extras),
      (s[Card.hs.js] = this.pinned),
      (s[Card.hs.zs] = this.dismissible),
      (s[Card.hs.gs] = this.clicked),
      (s[Card.hs.ks] = this.test),
      s
    );
  }
}

class ControlCard extends Card {
  constructor(l, t, s, i, n, r) {
    super(l, t, null, null, null, null, s, null, i, null, null, null, n, r),
      (this.isControl = !0),
      (this.U = "ab-control-card"),
      (this.V = !1);
  }
  ss() {
    const l = {};
    return (
      (l[Card.hs.ts] = Card.es.At),
      (l[Card.hs.ns] = this.id),
      (l[Card.hs.ls] = this.viewed),
      (l[Card.hs.us] = this.updated),
      (l[Card.hs.ps] = this.expiresAt),
      (l[Card.hs.xs] = this.extras),
      (l[Card.hs.js] = this.pinned),
      (l[Card.hs.ks] = this.test),
      l
    );
  }
}

class Oe {
  constructor() {}
  tf() {}
  ef() {}
  ua(t) {}
  static rf(t, e) {
    if (t && e)
      if (((t = t.toLowerCase()), isArray(e.if))) {
        for (let r = 0; r < e.if.length; r++)
          if (-1 !== t.indexOf(e.if[r].toLowerCase())) return e.identity;
      } else if (-1 !== t.indexOf(e.if.toLowerCase())) return e.identity;
  }
}

const Browsers = {
  OE: "Chrome",
  RE: "Edge",
  Pg: "Internet Explorer",
  IE: "Opera",
  kg: "Safari",
  AE: "Firefox"
};
const OperatingSystems = {
  Fg: "Android",
  fe: "iOS",
  jg: "Mac",
  Dg: "Windows"
};

class ni extends Oe {
  constructor() {
    if (
      (super(),
      (this.userAgentData = navigator.userAgentData),
      this.userAgentData)
    ) {
      const t = this.ic();
      (this.browser = t.browser || "Unknown Browser"),
        (this.version = t.version || "Unknown Version");
    }
  }
  tf() {
    return this.browser;
  }
  ef() {
    return this.version;
  }
  ua(t) {
    if (this.OS) return Promise.resolve(this.OS);
    const r = r => {
      for (let s = 0; s < t.length; s++) {
        const e = ni.rf(r, t[s]);
        if (e) return (this.OS = e), this.OS;
      }
      return r;
    };
    return this.userAgentData.platform
      ? Promise.resolve(r(this.userAgentData.platform))
      : this.nc()
          .then(t => r(t.platform))
          .catch(() => navigator.platform);
  }
  ic() {
    const t = {},
      r = this.userAgentData.brands;
    if (r && r.length)
      for (const s of r) {
        const r = this.oc(Browsers),
          e = s.brand.match(r);
        if (e && e.length > 0) {
          (t.browser = e[0]), (t.version = s.version);
          break;
        }
      }
    return t;
  }
  oc(t) {
    const r = [];
    for (const s in t) t[s] !== Browsers.Pg && r.push(t[s]);
    return new RegExp("(" + r.join("|") + ")", "i");
  }
  nc() {
    return this.userAgentData.getHighEntropyValues
      ? this.userAgentData.getHighEntropyValues(["platform"])
      : Promise.reject();
  }
}

class ei extends Oe {
  constructor() {
    super(), (this.Vu = ei.Uu(navigator.userAgent || ""));
  }
  tf() {
    return this.Vu[0] || "Unknown Browser";
  }
  ef() {
    return this.Vu[1] || "Unknown Version";
  }
  ua(r) {
    for (let e = 0; e < r.length; e++) {
      let n = r[e].string,
        i = ei.rf(n, r[e]);
      if (i)
        return (
          i === OperatingSystems.jg && navigator.maxTouchPoints > 1 && (i = OperatingSystems.fe),
          Promise.resolve(i)
        );
    }
    return Promise.resolve(navigator.platform);
  }
  static Uu(r) {
    let e,
      n =
        r.match(
          /(samsungbrowser|tizen|roku|konqueror|icab|crios|opera|ucbrowser|chrome|safari|firefox|camino|msie|trident(?=\/))\/?\s*(\.?\d+(\.\d+)*)/i
        ) || [];
    if (/trident/i.test(n[1]))
      return (
        (e = /\brv[ :]+(\.?\d+(\.\d+)*)/g.exec(r) || []), [Browsers.Pg, e[1] || ""]
      );
    if (-1 !== r.indexOf("(Web0S; Linux/SmartTV)"))
      return ["LG Smart TV", null];
    if (-1 !== r.indexOf("CrKey")) return ["Chromecast", null];
    if (
      -1 !== r.indexOf("BRAVIA") ||
      -1 !== r.indexOf("SonyCEBrowser") ||
      -1 !== r.indexOf("SonyDTV")
    )
      return ["Sony Smart TV", null];
    if (-1 !== r.indexOf("PhilipsTV")) return ["Philips Smart TV", null];
    if (r.match(/\b(Roku)\b/)) return ["Roku", null];
    if (r.match(/\bAFTM\b/)) return ["Amazon Fire Stick", null];
    if (
      n[1] === Browsers.OE &&
      ((e = r.match(/\b(OPR|Edge|EdgA|Edg|UCBrowser)\/(\.?\d+(\.\d+)*)/)),
      null != e)
    )
      return (
        (e = e.slice(1)),
        (e[0] = e[0].replace("OPR", Browsers.IE)),
        (e[0] = e[0].replace("EdgA", Browsers.RE)),
        "Edg" === e[0] && (e[0] = Browsers.RE),
        [e[0], e[1]]
      );
    if (
      n[1] === Browsers.kg &&
      ((e = r.match(/\b(EdgiOS)\/(\.?\d+(\.\d+)*)/)), null != e)
    )
      return (
        (e = e.slice(1)), (e[0] = e[0].replace("EdgiOS", Browsers.RE)), [e[0], e[1]]
      );
    if (
      ((n = n[2] ? [n[1], n[2]] : [null, null]),
      n[0] === Browsers.kg &&
        null != (e = r.match(/version\/(\.?\d+(\.\d+)*)/i)) &&
        n.splice(1, 1, e[1]),
      null != (e = r.match(/\b(UCBrowser)\/(\.?\d+(\.\d+)*)/)) &&
        n.splice(1, 1, e[2]),
      n[0] === Browsers.IE && null != (e = r.match(/mini\/(\.?\d+(\.\d+)*)/i)))
    )
      return ["Opera Mini", e[1] || ""];
    if (n[0]) {
      const r = n[0].toLowerCase();
      "msie" === r && (n[0] = Browsers.Pg),
        "crios" === r && (n[0] = Browsers.OE),
        "tizen" === r && ((n[0] = "Samsung Smart TV"), (n[1] = null)),
        "samsungbrowser" === r && (n[0] = "Samsung Browser");
    }
    return n;
  }
}

class gi {
  constructor() {
    const t = navigator.userAgentData ? ni : ei;
    (this.Sg = new t()),
      (this.userAgent = navigator.userAgent),
      (this.browser = this.Sg.tf()),
      (this.version = this.Sg.ef()),
      this.ua().then(t => (this.OS = t)),
      (this.language = (
        navigator.userLanguage ||
        navigator.language ||
        navigator.browserLanguage ||
        navigator.systemLanguage ||
        ""
      ).toLowerCase()),
      (this.$o = gi.Bg(this.userAgent));
  }
  Og() {
    return this.browser !== Browsers.Pg || this.version > 8;
  }
  rE() {
    return this.browser === Browsers.kg;
  }
  la() {
    return this.OS || null;
  }
  ua() {
    return this.OS
      ? Promise.resolve(this.OS)
      : this.Sg.ua(gi.xg).then(t => ((this.OS = t), t));
  }
  static Bg(t) {
    t = t.toLowerCase();
    const i = [
      "googlebot",
      "bingbot",
      "slurp",
      "duckduckbot",
      "baiduspider",
      "yandex",
      "facebookexternalhit",
      "sogou",
      "ia_archiver",
      "https://github.com/prerender/prerender",
      "aolbuild",
      "bingpreview",
      "msnbot",
      "adsbot",
      "mediapartners-google",
      "teoma"
    ];
    for (let n = 0; n < i.length; n++) if (-1 !== t.indexOf(i[n])) return !0;
    return !1;
  }
}
gi.xg = [
  { string: navigator.platform, if: "Win", identity: OperatingSystems.Dg },
  { string: navigator.platform, if: "Mac", identity: OperatingSystems.jg },
  { string: navigator.platform, if: "BlackBerry", identity: "BlackBerry" },
  { string: navigator.platform, if: "FreeBSD", identity: "FreeBSD" },
  { string: navigator.platform, if: "OpenBSD", identity: "OpenBSD" },
  { string: navigator.platform, if: "Nintendo", identity: "Nintendo" },
  { string: navigator.platform, if: "SunOS", identity: "SunOS" },
  { string: navigator.platform, if: "PlayStation", identity: "PlayStation" },
  { string: navigator.platform, if: "X11", identity: "X11" },
  {
    string: navigator.userAgent,
    if: ["iPhone", "iPad", "iPod"],
    identity: OperatingSystems.fe
  },
  { string: navigator.platform, if: "Pike v", identity: OperatingSystems.fe },
  { string: navigator.userAgent, if: ["Web0S"], identity: "WebOS" },
  {
    string: navigator.platform,
    if: ["Linux armv7l", "Android"],
    identity: OperatingSystems.Fg
  },
  { string: navigator.userAgent, if: ["Android"], identity: OperatingSystems.Fg },
  { string: navigator.platform, if: "Linux", identity: "Linux" }
];
const V = new gi();

class ue {
  constructor(t, i, s, r, e) {
    (this.userId = t),
      (this.type = i),
      (this.time = timestampOrNow(s)),
      (this.sessionId = r),
      (this.data = e);
  }
  Wi() {
    const t = {
      name: this.type,
      time: convertMsToSeconds(this.time),
      data: this.data || {},
      session_id: this.sessionId
    };
    return null != this.userId && (t.user_id = this.userId), t;
  }
  ss() {
    return {
      u: this.userId,
      t: this.type,
      ts: this.time,
      s: this.sessionId,
      d: this.data
    };
  }
  static fromJson(t) {
    return new ue(t.user_id, t.name, t.time, t.session_id, t.data);
  }
  static Za(t) {
    return null != t && isObject$1(t) && null != t.t && "" !== t.t;
  }
  static Tn(t) {
    return new ue(t.u, t.t, t.ts, t.s, t.d);
  }
}

class _t {
  constructor(t, e, s) {
    null == t && (t = r$1.Z.Y()),
      (s = parseInt(s)),
      (isNaN(s) || 0 === s) && (s = new Date().valueOf()),
      (this.iu = t),
      (this.Hh = s),
      (this.Jh = new Date().valueOf()),
      (this.Bh = e);
  }
  ss() {
    return { g: this.iu, e: this.Bh, c: this.Hh, l: this.Jh };
  }
  static Tn(t) {
    if (null == t || null == t.g) return null;
    const e = new _t(t.g, t.e, t.c);
    return (e.Jh = t.l), e;
  }
}

function getByteLength(e) {
  let t = e.length;
  for (let r = e.length - 1; r >= 0; r--) {
    const n = e.charCodeAt(r);
    n > 127 && n <= 2047 ? t++ : n > 2047 && n <= 65535 && (t += 2),
      n >= 56320 && n <= 57343 && r--;
  }
  return t;
}
function decodeBrazeActions(e) {
  try {
    e = e.replace(/-/g, "+").replace(/_/g, "/");
    let t = window.atob(e),
      r = new Uint8Array(t.length);
    for (let e = 0; e < t.length; e++) r[e] = t.charCodeAt(e);
    let n = new Uint16Array(r.buffer);
    return String.fromCharCode(...n);
  } catch (e) {
    return r$1.j.error("Unable to decode Base64: " + e), null;
  }
}

const BRAZE_ACTIONS = {
  types: {
    le: "container",
    logCustomEvent: "logCustomEvent",
    setEmailNotificationSubscriptionType:
      "setEmailNotificationSubscriptionType",
    setPushNotificationSubscriptionType: "setPushNotificationSubscriptionType",
    setCustomUserAttribute: "setCustomUserAttribute",
    requestPushPermission: "requestPushPermission",
    addToSubscriptionGroup: "addToSubscriptionGroup",
    removeFromSubscriptionGroup: "removeFromSubscriptionGroup",
    addToCustomAttributeArray: "addToCustomAttributeArray",
    removeFromCustomAttributeArray: "removeFromCustomAttributeArray",
    de: "openLink",
    pe: "openLinkInWebView"
  },
  properties: { type: "type", ce: "steps", me: "args" }
};
const INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES = {
  Ji: "unknownBrazeAction",
  Li: "noPushPrompt"
};
const ineligibleBrazeActionURLErrorMessage = (t, o) => {
  switch (t) {
    case INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Ji:
      return `${o} contains an unknown braze action type and will not be displayed.`;
    case INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Li:
      return `${o} contains a push prompt braze action, but is not eligible for a push prompt. Ignoring.`;
    default:
      return "";
  }
};
function getDecodedBrazeAction(t) {
  try {
    let o = t.match(BRAZE_ACTION_URI_REGEX)[0].length;
    const e = t.substring(o);
    if (o > t.length - 1 || !e)
      return void r$1.j.error(
        `Did not find base64 encoded brazeAction in url to process : ${t}`
      );
    const n = decodeBrazeActions(e);
    return n
      ? JSON.parse(n)
      : void r$1.j.error(`Failed to decode base64 encoded brazeAction: ${e}`);
  } catch (o) {
    return void r$1.j.error(
      `Failed to process brazeAction URL ${t} : ${o.message}`
    );
  }
}
function eo(t, o) {
  let r = !1;
  for (const e of o) if (((r = r || t(e)), r)) return !0;
  return !1;
}
function containsUnknownBrazeAction(t) {
  try {
    const o = t[BRAZE_ACTIONS.properties.type];
    return o === BRAZE_ACTIONS.types.le
      ? eo(containsUnknownBrazeAction, t[BRAZE_ACTIONS.properties.ce])
      : !isValidBrazeActionType(o);
  } catch (t) {
    return !0;
  }
}
function containsPushPrimerBrazeAction(t) {
  if (!isValidBrazeActionJson(t)) return !1;
  const o = t[BRAZE_ACTIONS.properties.type];
  return o === BRAZE_ACTIONS.types.le
    ? eo(containsPushPrimerBrazeAction, t[BRAZE_ACTIONS.properties.ce])
    : o === BRAZE_ACTIONS.types.requestPushPermission;
}

const CUSTOM_DATA_REGEX = /^[^\x00-\x1F\x22]+$/;
const CUSTOM_ATTRIBUTE_SPECIAL_CHARS_REGEX = /[$.]/;
const CUSTOM_ATTRIBUTE_RESERVED_OPERATORS = [
  "$add",
  "$update",
  "$remove",
  "$identifier_key",
  "$identifier_value",
  "$new_object",
  "$time"
];
const EMAIL_ADDRESS_REGEX = new RegExp(/^.+@.+\..+$/);
const BRAZE_ACTION_URI_REGEX = /^brazeActions:\/\/v\d+\//;
function validateCustomString(t, e, n) {
  const o =
    null != t &&
    "string" == typeof t &&
    ("" === t || t.match(CUSTOM_DATA_REGEX));
  return o || r$1.j.error(`Cannot ${e} because ${n} "${t}" is invalid.`), o;
}
function validateCustomAttributeKey(t) {
  return (
    null != t &&
      t.match(CUSTOM_ATTRIBUTE_SPECIAL_CHARS_REGEX) &&
      -1 === CUSTOM_ATTRIBUTE_RESERVED_OPERATORS.indexOf(t) &&
      r$1.j.warn("Custom attribute keys cannot contain '$' or '.'"),
    validateCustomString(t, "set custom user attribute", "the given key")
  );
}
function validatePropertyType(t) {
  const e = typeof t;
  return (
    null == t || "number" === e || "boolean" === e || isDate(t) || "string" === e
  );
}
function _validateNestedProperties(t, e, n) {
  const o = -1 !== n;
  if (o && n > 50)
    return (
      r$1.j.error("Nested attributes cannot be more than 50 levels deep."), !1
    );
  const i = o ? n + 1 : -1;
  if (isArray(t) && isArray(e)) {
    for (let r = 0; r < t.length && r < e.length; r++)
      if (
        (isDate(t[r]) && (e[r] = toValidBackendTimeString(t[r])),
        !_validateNestedProperties(t[r], e[r], i))
      )
        return !1;
  } else {
    if (!isObject$1(t)) return validatePropertyType(t);
    for (const r of keys(t)) {
      if (o && !validateCustomAttributeKey(r)) return !1;
      if (
        (isDate(t[r]) && (e[r] = toValidBackendTimeString(t[r])),
        !_validateNestedProperties(t[r], e[r], i))
      )
        return !1;
    }
  }
  return !0;
}
function _validateEventPropertyValue(t, e, n, o, i) {
  let a;
  return (
    (a =
      isObject$1(t) || isArray(t)
        ? _validateNestedProperties(t, e, i ? 1 : -1)
        : validatePropertyType(t)),
    a || r$1.j.error(`Cannot ${n} because ${o} "${t}" is invalid.`),
    a
  );
}
function validateStandardString(t, e, n, o) {
  const i = "string" == typeof t || (null === t && o);
  return i || r$1.j.error(`Cannot ${e} because ${n} "${t}" is invalid.`), i;
}
function validateCustomProperties(t, e, n, o, i) {
  if ((null == t && (t = {}), "object" != typeof t || isArray(t)))
    return (
      r$1.j.error(`${e} requires that ${n} be an object. Ignoring ${i}.`),
      [!1, null]
    );
  let a, s;
  e === SET_CUSTOM_USER_ATTRIBUTE_STRING ? ((a = 76800), (s = "75KB")) : ((a = 51200), (s = "50KB"));
  const u = JSON.stringify(t);
  if (getByteLength(u) > a)
    return (
      r$1.j.error(
        `Could not ${o} because ${n} was greater than the max size of ${s}.`
      ),
      [!1, null]
    );
  let l;
  try {
    l = JSON.parse(u);
  } catch (t) {
    return (
      r$1.j.error(`Could not ${o} because ${n} did not contain valid JSON.`),
      [!1, null]
    );
  }
  for (let r in t) {
    if (e === SET_CUSTOM_USER_ATTRIBUTE_STRING && !validateCustomAttributeKey(r)) return [!1, null];
    if (!validateCustomString(r, o, `the ${i} property name`))
      return [!1, null];
    const n = t[r];
    if (e !== SET_CUSTOM_USER_ATTRIBUTE_STRING && null == n) {
      delete t[r], delete l[r];
      continue;
    }
    isDate(n) && (l[r] = toValidBackendTimeString(n));
    if (
      !_validateEventPropertyValue(
        n,
        l[r],
        o,
        `the ${i} property "${r}"`,
        e === SET_CUSTOM_USER_ATTRIBUTE_STRING
      )
    )
      return [!1, null];
  }
  return [!0, l];
}
function validateCustomAttributeArrayType(t, e) {
  let n = !1,
    o = !1;
  const i = () => {
    r$1.j.error(
      "Custom attribute arrays must be either string arrays or object arrays."
    );
  };
  for (const r of e)
    if ("string" == typeof r) {
      if (o) return i(), [!1, !1];
      if (
        !validateCustomString(
          r,
          `set custom user attribute "${t}"`,
          "the element in the given array"
        )
      )
        return [!1, !1];
      n = !0;
    } else {
      if (!isObject$1(r)) return i(), [!1, !1];
      if (n) return i(), [!1, !1];
      if (
        !validateCustomProperties(
          r,
          SET_CUSTOM_USER_ATTRIBUTE_STRING,
          "attribute value",
          `set custom user attribute "${t}"`,
          "custom user attribute"
        )
      )
        return [!1, !1];
      o = !0;
    }
  return [n, o];
}
function isValidEmail(t) {
  return (
    "string" == typeof t && null != t.toLowerCase().match(EMAIL_ADDRESS_REGEX)
  );
}
function isValidBrazeActionJson(t) {
  if (!(BRAZE_ACTIONS.properties.type in t)) return !1;
  switch (t[BRAZE_ACTIONS.properties.type]) {
    case BRAZE_ACTIONS.types.le:
      if (BRAZE_ACTIONS.properties.ce in t) return !0;
      break;
    case BRAZE_ACTIONS.types.logCustomEvent:
    case BRAZE_ACTIONS.types.setEmailNotificationSubscriptionType:
    case BRAZE_ACTIONS.types.setPushNotificationSubscriptionType:
    case BRAZE_ACTIONS.types.setCustomUserAttribute:
    case BRAZE_ACTIONS.types.addToSubscriptionGroup:
    case BRAZE_ACTIONS.types.removeFromSubscriptionGroup:
    case BRAZE_ACTIONS.types.addToCustomAttributeArray:
    case BRAZE_ACTIONS.types.removeFromCustomAttributeArray:
    case BRAZE_ACTIONS.types.de:
    case BRAZE_ACTIONS.types.pe:
      if (BRAZE_ACTIONS.properties.me in t) return !0;
      break;
    case BRAZE_ACTIONS.types.requestPushPermission:
      return !0;
    default:
      return !1;
  }
  return !1;
}
function isValidBrazeActionType(t) {
  let e = !1;
  return (
    Object.keys(BRAZE_ACTIONS.types).forEach(r => {
      BRAZE_ACTIONS.types[r] !== t.toString() || (e = !0);
    }),
    e
  );
}

class User {
  constructor(t, e) {
    (this.ft = t), (this.Ci = e), (this.ft = t), (this.Ci = e);
  }
  getUserId(t) {
    null == t &&
      r$1.j.error(
        "getUserId must be supplied with a callback. e.g., braze.getUser().getUserId(function(userId) {console.log('the user id is ' + userId)})"
      ),
      "function" == typeof t && t(this.ft.getUserId());
  }
  addAlias(t, e) {
    return !validateStandardString(t, "add alias", "the alias", !1) || t.length <= 0
      ? (r$1.j.error("addAlias requires a non-empty alias"), !1)
      : !validateStandardString(e, "add alias", "the label", !1) || e.length <= 0
      ? (r$1.j.error("addAlias requires a non-empty label"), !1)
      : this.Ci.Cn(t, e).O;
  }
  setFirstName(t) {
    return (
      !!validateStandardString(t, "set first name", "the firstName", !0) &&
      this.ft.nu("first_name", t)
    );
  }
  setLastName(t) {
    return (
      !!validateStandardString(t, "set last name", "the lastName", !0) && this.ft.nu("last_name", t)
    );
  }
  setEmail(t) {
    return null === t || isValidEmail(t)
      ? this.ft.nu("email", t)
      : (r$1.j.error(
          `Cannot set email address - "${t}" did not pass RFC-5322 validation.`
        ),
        !1);
  }
  setGender(t) {
    return (
      "string" == typeof t && (t = t.toLowerCase()),
      !(
        null !== t &&
        !validateValueIsFromEnum(
          User.Genders,
          t,
          `Gender "${t}" is not a valid gender.`,
          "User.Genders"
        )
      ) && this.ft.nu("gender", t)
    );
  }
  setDateOfBirth(t, e, s) {
    return null === t && null === e && null === s
      ? this.ft.nu("dob", null)
      : ((t = null != t ? parseInt(t.toString()) : null),
        (e = null != e ? parseInt(e.toString()) : null),
        (s = null != s ? parseInt(s.toString()) : null),
        null == t ||
        null == e ||
        null == s ||
        isNaN(t) ||
        isNaN(e) ||
        isNaN(s) ||
        e > 12 ||
        e < 1 ||
        s > 31 ||
        s < 1
          ? (r$1.j.error(
              "Cannot set date of birth - parameters should comprise a valid date e.g. setDateOfBirth(1776, 7, 4);"
            ),
            !1)
          : this.ft.nu("dob", `${t}-${e}-${s}`));
  }
  setCountry(t) {
    return !!validateStandardString(t, "set country", "the country", !0) && this.ft.nu("country", t);
  }
  setHomeCity(t) {
    return (
      !!validateStandardString(t, "set home city", "the homeCity", !0) && this.ft.nu("home_city", t)
    );
  }
  setLanguage(t) {
    return (
      !!validateStandardString(t, "set language", "the language", !0) && this.ft.nu("language", t)
    );
  }
  setEmailNotificationSubscriptionType(t) {
    return (
      !!validateValueIsFromEnum(
        User.NotificationSubscriptionTypes,
        t,
        `Email notification setting "${t}" is not a valid subscription type.`,
        "User.NotificationSubscriptionTypes"
      ) && this.ft.nu("email_subscribe", t)
    );
  }
  setPushNotificationSubscriptionType(t) {
    return (
      !!validateValueIsFromEnum(
        User.NotificationSubscriptionTypes,
        t,
        `Push notification setting "${t}" is not a valid subscription type.`,
        "User.NotificationSubscriptionTypes"
      ) && this.ft.nu("push_subscribe", t)
    );
  }
  setPhoneNumber(t) {
    return (
      !!validateStandardString(t, "set phone number", "the phoneNumber", !0) &&
      (null === t || t.match(User.In)
        ? this.ft.nu("phone", t)
        : (r$1.j.error(
            `Cannot set phone number - "${t}" did not pass validation.`
          ),
          !1))
    );
  }
  setLastKnownLocation(t, e, s, i, n) {
    return null == t || null == e
      ? (r$1.j.error(
          "Cannot set last-known location - latitude and longitude are required."
        ),
        !1)
      : ((t = parseFloat(t.toString())),
        (e = parseFloat(e.toString())),
        null != s && (s = parseFloat(s.toString())),
        null != i && (i = parseFloat(i.toString())),
        null != n && (n = parseFloat(n.toString())),
        isNaN(t) ||
        isNaN(e) ||
        (null != s && isNaN(s)) ||
        (null != i && isNaN(i)) ||
        (null != n && isNaN(n))
          ? (r$1.j.error(
              "Cannot set last-known location - all supplied parameters must be numeric."
            ),
            !1)
          : t > 90 || t < -90 || e > 180 || e < -180
          ? (r$1.j.error(
              "Cannot set last-known location - latitude and longitude are bounded by ±90 and ±180 respectively."
            ),
            !1)
          : (null != s && s < 0) || (null != n && n < 0)
          ? (r$1.j.error(
              "Cannot set last-known location - accuracy and altitudeAccuracy may not be negative."
            ),
            !1)
          : this.Ci.setLastKnownLocation(this.ft.getUserId(), t, e, i, s, n).O);
  }
  setCustomUserAttribute(t, e, s) {
    if (!validateCustomAttributeKey(t)) return !1;
    const i = e => {
      const [r] = validateCustomProperties(
        e,
        SET_CUSTOM_USER_ATTRIBUTE_STRING,
        "attribute value",
        `set custom user attribute "${t}"`,
        "custom user attribute"
      );
      return r;
    };
    if (isArray(e)) {
      const [s, n] = validateCustomAttributeArrayType(t, e);
      if (!s && !n && 0 !== e.length) return !1;
      if (s || 0 === e.length) return this.Ci.En(r$1.q.Fn, t, e).O;
      for (const t of e) if (!i(t)) return !1;
    } else if (isObject$1(e)) {
      if (!i(e)) return !1;
      if (s) return this.Ci.En(r$1.q.$n, t, e).O;
    } else {
      if (!(void 0 !== e && validatePropertyType(e))) return !1;
      if (
        (isDate(e) && (e = toValidBackendTimeString(e)),
        "string" == typeof e &&
          !validateCustomString(
            e,
            `set custom user attribute "${t}"`,
            "the element in the given array"
          ))
      )
        return !1;
    }
    return this.ft.setCustomUserAttribute(t, e);
  }
  addToCustomAttributeArray(t, e) {
    return (
      !!validateCustomString(t, "add to custom user attribute array", "the given key") &&
      !(
        null != e &&
        !validateCustomString(e, "add to custom user attribute array", "the given value")
      ) &&
        this.Ci.En(r$1.q.Bn, t, e).O
    );
  }
  removeFromCustomAttributeArray(t, e) {
    return (
      !!validateCustomString(t, "remove from custom user attribute array", "the given key") &&
      !(
        null != e &&
        !validateCustomString(e, "remove from custom user attribute array", "the given value")
      ) &&
        this.Ci.En(r$1.q.Ln, t, e).O
    );
  }
  incrementCustomUserAttribute(t, e) {
    if (!validateCustomString(t, "increment custom user attribute", "the given key")) return !1;
    null == e && (e = 1);
    const s = parseInt(e.toString());
    return isNaN(s) || s !== parseFloat(e.toString())
      ? (r$1.j.error(
          `Cannot increment custom user attribute because the given incrementValue "${e}" is not an integer.`
        ),
        !1)
      : this.Ci.En(r$1.q.Rn, t, s).O;
  }
  setCustomLocationAttribute(t, e, s) {
    return (
      !!validateCustomString(t, "set custom location attribute", "the given key") &&
      ((null !== e || null !== s) &&
      ((e = null != e ? parseFloat(e.toString()) : null),
      (s = null != s ? parseFloat(s.toString()) : null),
      (null == e && null != s) ||
        (null != e && null == s) ||
        (null != e && (isNaN(e) || e > 90 || e < -90)) ||
        (null != s && (isNaN(s) || s > 180 || s < -180)))
        ? (r$1.j.error(
            "Received invalid values for latitude and/or longitude. Latitude and longitude are bounded by ±90 and ±180 respectively, or must both be null for removal."
          ),
          !1)
        : this.Ci.On(t, e, s).O)
    );
  }
  addToSubscriptionGroup(t) {
    return !validateStandardString(
      t,
      "add user to subscription group",
      "subscription group ID",
      !1
    ) || t.length <= 0
      ? (r$1.j.error(
          "addToSubscriptionGroup requires a non-empty subscription group ID"
        ),
        !1)
      : this.Ci.Gn(t, User.qn.SUBSCRIBED).O;
  }
  removeFromSubscriptionGroup(t) {
    return !validateStandardString(
      t,
      "remove user from subscription group",
      "subscription group ID",
      !1
    ) || t.length <= 0
      ? (r$1.j.error(
          "removeFromSubscriptionGroup requires a non-empty subscription group ID"
        ),
        !1)
      : this.Ci.Gn(t, User.qn.UNSUBSCRIBED).O;
  }
  yn(t, e, r, s, i) {
    this.ft.yn(t, e, r, s, i), this.Ci.zn();
  }
  wn(t) {
    this.ft.wn(t);
  }
}
(User.Genders = {
  MALE: "m",
  FEMALE: "f",
  OTHER: "o",
  UNKNOWN: "u",
  NOT_APPLICABLE: "n",
  PREFER_NOT_TO_SAY: "p"
}),
  (User.NotificationSubscriptionTypes = {
    OPTED_IN: "opted_in",
    SUBSCRIBED: "subscribed",
    UNSUBSCRIBED: "unsubscribed"
  }),
  (User.In = /^[0-9 .\\(\\)\\+\\-]+$/),
  (User.qn = { SUBSCRIBED: "subscribed", UNSUBSCRIBED: "unsubscribed" }),
  (User.Hn = "user_id"),
  (User.lu = "custom"),
  (User.lr = 997);

const STORAGE_KEYS = {
  eu: {
    su: "ab.storage.userId",
    oa: "ab.storage.deviceId",
    Wh: "ab.storage.sessionId"
  },
  k: {
    _a: "ab.test",
    Ia: "ab.storage.events",
    Ka: "ab.storage.attributes",
    Ya: "ab.storage.attributes.anonymous_user",
    ma: "ab.storage.device",
    ga: "ab.storage.sdk_metadata",
    qa: "ab.storage.session_id_for_cached_metadata",
    xn: "ab.storage.pushToken",
    ki: "ab.storage.newsFeed",
    Ai: "ab.storage.lastNewsFeedRefresh",
    L: "ab.storage.cardImpressions",
    ll: "ab.storage.serverConfig",
    Na: "ab.storage.triggers",
    Ga: "ab.storage.triggers.ts",
    qh: "ab.storage.messagingSessionStart",
    Zt: "ab.storage.cc",
    vs: "ab.storage.ccLastFullSync",
    ys: "ab.storage.ccLastCardUpdated",
    Ws: "ab.storage.ccLastClientRequest",
    ui: "ab.storage.ccRateLimitCurrentTokenCount",
    C: "ab.storage.ccClicks",
    K: "ab.storage.ccImpressions",
    G: "ab.storage.ccDismissals",
    Ua: "ab.storage.lastDisplayedTriggerTimesById",
    La: "ab.storage.lastDisplayedTriggerTime",
    Fa: "ab.storage.triggerFireInstancesById",
    bu: "ab.storage.signature",
    Fs: "ab.storage.brazeSyncRetryCount",
    Ss: "ab.storage.sdkVersion",
    Di: "ab.storage.ff",
    $i: "ab.storage.ffLastRefreshAt",
    Pa: "ab.storage.lastReqToEndpoint"
  },
  re: "ab.optOut"
};
class O {
  constructor(t, e) {
    (this.Ja = t), (this.Va = e);
  }
  uu(t, e) {
    let s = e;
    null != e && e instanceof _t && (s = e.ss()), this.Ja.store(t, s);
  }
  Ha(t) {
    const e = this.tu(t);
    null != e && ((e.Jh = new Date().valueOf()), this.uu(t, e));
  }
  tu(t) {
    return _t.Tn(this.Ja.wr(t));
  }
  Yh(t) {
    this.Ja.remove(t);
  }
  co(t) {
    if (null == t || 0 === t.length) return !1;
    isArray(t) || (t = [t]);
    let e = this.Va.wr(STORAGE_KEYS.k.Ia);
    (null != e && isArray(e)) || (e = []);
    for (let s = 0; s < t.length; s++) e.push(t[s].ss());
    return this.Va.store(STORAGE_KEYS.k.Ia, e);
  }
  Qh(t) {
    return null != t && this.co([t]);
  }
  Wa() {
    let t = this.Va.wr(STORAGE_KEYS.k.Ia);
    this.Va.remove(STORAGE_KEYS.k.Ia), null == t && (t = []);
    const e = [];
    let s = !1,
      o = null;
    if (isArray(t))
      for (let s = 0; s < t.length; s++)
        ue.Za(t[s]) ? e.push(ue.Tn(t[s])) : (o = s);
    else s = !0;
    if (s || null != o) {
      let n = "Stored events could not be deserialized as Events";
      s &&
        (n += ", was " + Object.prototype.toString.call(t) + " not an array"),
        null != o &&
          (n += ", value at index " + o + " does not look like an event"),
        (n +=
          ", serialized values were of type " +
          typeof t +
          ": " +
          JSON.stringify(t)),
        e.push(new ue(null, r$1.q.Is, new Date().valueOf(), null, { e: n }));
    }
    return e;
  }
  D(t, e) {
    return (
      !!validateValueIsFromEnum(
        STORAGE_KEYS.k,
        t,
        "StorageManager cannot store object.",
        "STORAGE_KEYS.OBJECTS"
      ) && this.Va.store(t, e)
    );
  }
  v(t) {
    return (
      !!validateValueIsFromEnum(
        STORAGE_KEYS.k,
        t,
        "StorageManager cannot retrieve object.",
        "STORAGE_KEYS.OBJECTS"
      ) && this.Va.wr(t)
    );
  }
  ri(t) {
    return (
      !!validateValueIsFromEnum(
        STORAGE_KEYS.k,
        t,
        "StorageManager cannot remove object.",
        "STORAGE_KEYS.OBJECTS"
      ) && (this.Va.remove(t), !0)
    );
  }
  xo(t) {
    const e = keys(STORAGE_KEYS.eu),
      s = new O.ee(t);
    for (const t of e) s.remove(STORAGE_KEYS.eu[t]);
  }
  clearData() {
    const t = keys(STORAGE_KEYS.eu),
      e = keys(STORAGE_KEYS.k);
    for (let e = 0; e < t.length; e++) {
      const s = t[e];
      this.Ja.remove(STORAGE_KEYS.eu[s]);
    }
    for (let t = 0; t < e.length; t++) {
      const s = e[t];
      this.Va.remove(STORAGE_KEYS.k[s]);
    }
  }
  $a(t) {
    return t || STORAGE_KEYS.k.Ya;
  }
  wa(t) {
    let e = this.Va.wr(STORAGE_KEYS.k.Ka);
    null == e && (e = {});
    const s = this.$a(t[User.Hn]);
    for (let r in t)
      r === User.Hn ||
        (null != e[s] && null != e[s][r]) ||
        this.mu(t[User.Hn], r, t[r]);
  }
  mu(t, e, s) {
    let r = this.Va.wr(STORAGE_KEYS.k.Ka);
    null == r && (r = {});
    const o = this.$a(t);
    let n = r[o];
    if (
      (null == n && ((n = {}), null != t && (n[User.Hn] = t)), e === User.lu)
    ) {
      null == n[e] && (n[e] = {});
      for (let t in s) n[e][t] = s[t];
    } else n[e] = s;
    return (r[o] = n), this.Va.store(STORAGE_KEYS.k.Ka, r);
  }
  tE() {
    const t = this.Va.wr(STORAGE_KEYS.k.Ka);
    this.Va.remove(STORAGE_KEYS.k.Ka);
    const e = [];
    for (let s in t) null != t[s] && e.push(t[s]);
    return e;
  }
  ou(t) {
    const e = this.Va.wr(STORAGE_KEYS.k.Ka);
    if (null != e) {
      const s = this.$a(null),
        r = e[s];
      null != r &&
        ((e[s] = void 0),
        this.Va.store(STORAGE_KEYS.k.Ka, e),
        (r[User.Hn] = t),
        this.wa(r));
    }
    const s = this.tu(STORAGE_KEYS.eu.Wh);
    let r = null;
    null != s && (r = s.iu);
    const o = this.Wa();
    if (null != o)
      for (let e = 0; e < o.length; e++) {
        const s = o[e];
        null == s.userId && s.sessionId == r && (s.userId = t), this.Qh(s);
      }
  }
  eE() {
    return this.Va.sE;
  }
}
O.Ma = class {
  constructor(t) {
    (this.Ko = t), (this.sE = V.rE() ? 3 : 10);
  }
  oE(t) {
    return t + "." + this.Ko;
  }
  store(t, e) {
    const s = { v: e };
    try {
      return localStorage.setItem(this.oE(t), JSON.stringify(s)), !0;
    } catch (t) {
      return r$1.j.info("Storage failure: " + t.message), !1;
    }
  }
  wr(t) {
    try {
      const e = JSON.parse(localStorage.getItem(this.oE(t)));
      return null == e ? null : e.v;
    } catch (t) {
      return r$1.j.info("Storage retrieval failure: " + t.message), null;
    }
  }
  remove(t) {
    try {
      localStorage.removeItem(this.oE(t));
    } catch (t) {
      return r$1.j.info("Storage removal failure: " + t.message), !1;
    }
  }
};
O.ee = class {
  constructor(t, e) {
    (this.Ko = t), (this.nE = this.aE()), (this.iE = 576e3), (this.EE = !!e);
  }
  oE(t) {
    return null != this.Ko ? t + "." + this.Ko : t;
  }
  aE() {
    let t = 0,
      e = document.location.hostname;
    const s = e.split("."),
      r = "ab._gd";
    for (; t < s.length - 1 && -1 === document.cookie.indexOf(r + "=" + r); )
      t++,
        (e = "." + s.slice(-1 - t).join(".")),
        (document.cookie = r + "=" + r + ";domain=" + e + ";");
    return (
      (document.cookie =
        r + "=;expires=" + new Date(0).toGMTString() + ";domain=" + e + ";"),
      e
    );
  }
  ne() {
    const t = new Date();
    return t.setTime(t.getTime() + 60 * this.iE * 1e3), t.getFullYear();
  }
  lE() {
    const t = values(STORAGE_KEYS.eu),
      e = document.cookie.split(";");
    for (let s = 0; s < e.length; s++) {
      let r = e[s];
      for (; " " === r.charAt(0); ) r = r.substring(1);
      let o = !1;
      for (let e = 0; e < t.length; e++)
        if (0 === r.indexOf(t[e])) {
          o = !0;
          break;
        }
      if (o) {
        const t = r.split("=")[0];
        -1 === t.indexOf("." + this.Ko) && this.SE(t);
      }
    }
  }
  store(t, e) {
    this.lE();
    const s = new Date();
    s.setTime(s.getTime() + 60 * this.iE * 1e3);
    const o = "expires=" + s.toUTCString(),
      n = "domain=" + this.nE;
    let a;
    a = this.EE ? e : encodeURIComponent(JSON.stringify(e));
    const i = this.oE(t) + "=" + a + ";" + o + ";" + n + ";path=/";
    return i.length >= 4093
      ? (r$1.j.info(
          "Storage failure: string is " +
            i.length +
            " chars which is too large to store as a cookie."
        ),
        !1)
      : ((document.cookie = i), !0);
  }
  wr(t) {
    const e = [],
      s = this.oE(t) + "=",
      o = document.cookie.split(";");
    for (let n = 0; n < o.length; n++) {
      let a = o[n];
      for (; " " === a.charAt(0); ) a = a.substring(1);
      if (0 === a.indexOf(s))
        try {
          let t;
          (t = this.EE
            ? a.substring(s.length, a.length)
            : JSON.parse(decodeURIComponent(a.substring(s.length, a.length)))),
            e.push(t);
        } catch (e) {
          return (
            r$1.j.info("Storage retrieval failure: " + e.message),
            this.remove(t),
            null
          );
        }
    }
    return e.length > 0 ? e[e.length - 1] : null;
  }
  remove(t) {
    this.SE(this.oE(t));
  }
  SE(t) {
    const e = t + "=;expires=" + new Date(0).toGMTString();
    (document.cookie = e), (document.cookie = e + ";path=/");
    const s = e + ";domain=" + this.nE;
    (document.cookie = s), (document.cookie = s + ";path=/");
  }
};
O.Qa = class {
  constructor() {
    (this._E = {}), (this.uE = 5242880), (this.sE = 3);
  }
  store(t, e) {
    const s = { value: e },
      o = this.cE(e);
    return o > this.uE
      ? (r$1.j.info(
          "Storage failure: object is ≈" +
            o +
            " bytes which is greater than the max of " +
            this.uE
        ),
        !1)
      : ((this._E[t] = s), !0);
  }
  cE(t) {
    const e = [],
      s = [t];
    let r = 0;
    for (; s.length; ) {
      const t = s.pop();
      if ("boolean" == typeof t) r += 4;
      else if ("string" == typeof t) r += 2 * t.length;
      else if ("number" == typeof t) r += 8;
      else if ("object" == typeof t && -1 === e.indexOf(t)) {
        e.push(t);
        for (let e in t) s.push(t[e]);
      }
    }
    return r;
  }
  wr(t) {
    const e = this._E[t];
    return null == e ? null : e.value;
  }
  remove(t) {
    this._E[t] = null;
  }
};
O.xa = class {
  constructor(t, e, s) {
    (this.Ko = t),
      (this.TE = []),
      e && this.TE.push(new O.ee(t)),
      s && this.TE.push(new O.Ma(t)),
      this.TE.push(new O.Qa(t));
  }
  store(t, e) {
    let s = !0;
    for (let r = 0; r < this.TE.length; r++) s = this.TE[r].store(t, e) && s;
    return s;
  }
  wr(t) {
    for (let e = 0; e < this.TE.length; e++) {
      const s = this.TE[e].wr(t);
      if (null != s) return s;
    }
    return null;
  }
  remove(t) {
    new O.ee(this.Ko).remove(t);
    for (let e = 0; e < this.TE.length; e++) this.TE[e].remove(t);
  }
};

class jt {
  constructor(t, i, s) {
    (this.Jn = t),
      (this.Kn = i || !1),
      (this.Qn = s),
      (this.Vn = new E()),
      (this.Xn = 0),
      (this.Yn = 1);
  }
  Zn() {
    return this.Kn;
  }
  au() {
    return this.Jn.v(STORAGE_KEYS.k.bu);
  }
  setSdkAuthenticationSignature(t) {
    const s = this.au();
    this.Jn.D(STORAGE_KEYS.k.bu, t);
    const e = r$1.zt.Ft;
    new r$1.xt(e, r$1.j).setItem(e.Jt.gu, this.Yn, t), s !== t && this.si();
  }
  du() {
    this.Jn.ri(STORAGE_KEYS.k.bu);
    const t = r$1.zt.Ft;
    new r$1.xt(t, r$1.j).br(t.Jt.gu, this.Yn);
  }
  subscribeToSdkAuthenticationFailures(t) {
    return this.Qn.lt(t);
  }
  Su(t) {
    this.Qn.Et(t);
  }
  Au() {
    this.Vn.removeAllSubscriptions();
  }
  pu() {
    this.Xn += 1;
  }
  Fu() {
    return this.Xn;
  }
  si() {
    this.Xn = 0;
  }
}

class y {
  constructor() {}
  Ts(a) {}
  changeUser(a) {}
  clearData(a) {}
}

var DeviceProperties = {
  BROWSER: "browser",
  BROWSER_VERSION: "browserVersion",
  OS: "os",
  RESOLUTION: "resolution",
  LANGUAGE: "language",
  TIME_ZONE: "timeZone",
  USER_AGENT: "userAgent"
};

class ge {
  constructor(s) {
    this.id = s;
  }
  Wi() {
    const s = {};
    return (
      null != this[DeviceProperties.BROWSER] &&
        (s.browser = this[DeviceProperties.BROWSER]),
      null != this[DeviceProperties.BROWSER_VERSION] &&
        (s.browser_version = this[DeviceProperties.BROWSER_VERSION]),
      null != this[DeviceProperties.OS] &&
        (s.os_version = this[DeviceProperties.OS]),
      null != this[DeviceProperties.RESOLUTION] &&
        (s.resolution = this[DeviceProperties.RESOLUTION]),
      null != this[DeviceProperties.LANGUAGE] &&
        (s.locale = this[DeviceProperties.LANGUAGE]),
      null != this[DeviceProperties.TIME_ZONE] &&
        (s.time_zone = this[DeviceProperties.TIME_ZONE]),
      null != this[DeviceProperties.USER_AGENT] &&
        (s.user_agent = this[DeviceProperties.USER_AGENT]),
      s
    );
  }
}

class Ot {
  constructor(e, t) {
    (this.Jn = e), null == t && (t = values(DeviceProperties)), (this.sa = t);
  }
  te() {
    let e = this.Jn.tu(STORAGE_KEYS.eu.oa);
    null == e && ((e = new _t(r$1.Z.Y())), this.Jn.uu(STORAGE_KEYS.eu.oa, e));
    const t = new ge(e.iu);
    for (let e = 0; e < this.sa.length; e++) {
      const r = this.sa[e];
      switch (r) {
        case DeviceProperties.BROWSER:
          t[r] = V.browser;
          break;
        case DeviceProperties.BROWSER_VERSION:
          t[r] = V.version;
          break;
        case DeviceProperties.OS:
          t[r] = this.ca();
          break;
        case DeviceProperties.RESOLUTION:
          t[r] = screen.width + "x" + screen.height;
          break;
        case DeviceProperties.LANGUAGE:
          t[r] = V.language;
          break;
        case DeviceProperties.TIME_ZONE:
          t[r] = this.fa(new Date());
          break;
        case DeviceProperties.USER_AGENT:
          t[r] = V.userAgent;
      }
    }
    return t;
  }
  ca() {
    if (V.la()) return V.la();
    const e = this.Jn.v(STORAGE_KEYS.k.ma);
    return e && e.os_version ? e.os_version : V.ua();
  }
  fa(e) {
    if ("undefined" != typeof Intl && "function" == typeof Intl.DateTimeFormat)
      try {
        if ("function" == typeof Intl.DateTimeFormat().resolvedOptions) {
          const e = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (null != e && "" !== e) return e;
        }
      } catch (t) {
        r$1.j.info(
          "Intl.DateTimeFormat threw an error, cannot detect user's time zone:" +
            t.message
        ),
          (e = "");
      }
    if (!e) return e;
    const t = e.getTimezoneOffset();
    return this.ha(t);
  }
  ha(e) {
    const t = parseInt(e / 60),
      r = parseInt(e % 60);
    let s = "GMT";
    return (
      0 !== e &&
        ((s += e < 0 ? "+" : "-"),
        (s +=
          ("00" + Math.abs(t)).slice(-2) +
          ":" +
          ("00" + Math.abs(r)).slice(-2))),
      s
    );
  }
}

function logDeprecationWarning(e, a, i) {
  let s = `The '${e}' ${a} is deprecated.`;
  i && (s += ` Please use '${i}' instead.`), r$1.j.warn(s);
}

var qt = {
  Da: "invalid_api_key",
  Sa: "blacklisted",
  va: "no_device_identifier",
  Ba: "invalid_json_response",
  za: "empty_response",
  __: "sdk_auth_error"
};

const T = {
  Qs: { Xa: "d", Os: "cc", xi: "ff", Xi: "t" },
  Lu: e => {
    if (e) return e.v(STORAGE_KEYS.k.Pa);
  },
  qu: (e, t) => {
    e && e.D(STORAGE_KEYS.k.Pa, t);
  },
  Ea: (e, t) => {
    if (!e || !t) return -1;
    const r = T.Lu(e);
    if (null == r) return -1;
    const s = r[t];
    return null == s || isNaN(s) ? -1 : s;
  },
  Xs: (e, t, r) => {
    if (!e || !t) return;
    let s = T.Lu(e);
    null == s && (s = {}), (s[t] = r), T.qu(e, s);
  }
};

class Pt {
  constructor(t, e, s, i, r, o, n, a, u, h, c) {
    (this.Xo = t),
      (this.Jn = e),
      (this.gh = s),
      (this.Qo = i),
      (this.fh = r),
      (this.Zo = o),
      (this.Ko = n),
      (this.Ho = a),
      (this.Vo = u),
      (this.Yo = h),
      (this.pa = c),
      (this.Ra = ["npm"]);
  }
  Gs(t, e) {
    const s = this.Xo.te(),
      r = s.Wi(),
      o = this.Jn.v(STORAGE_KEYS.k.ma);
    isEqual(o, r) || (t.device = r),
      (t.api_key = this.Ko),
      (t.time = convertMsToSeconds(new Date().valueOf(), !0));
    const n = this.Jn.v(STORAGE_KEYS.k.ga) || [],
      a = this.Jn.v(STORAGE_KEYS.k.qa) || "";
    if (
      (this.Ra.length > 0 &&
        (!isEqual(n, this.Ra) || a !== this.fh.ba()) &&
        (t.sdk_metadata = this.Ra),
      (t.sdk_version = this.Vo),
      this.Yo && (t.sdk_flavor = this.Yo),
      (t.app_version = this.pa),
      (t.device_id = s.id),
      e)
    ) {
      const e = this.Qo.getUserId();
      null != e && (t.user_id = e);
    }
    return t;
  }
  ti(t, e, i) {
    const o = e.auth_error,
      n = e.error;
    if (!o && !n) return !0;
    if (o) {
      let e;
      this.gh.pu();
      const s = { errorCode: o.error_code };
      for (const t of i)
        isArray(t) && "X-Braze-Auth-Signature" === t[0] && (s.signature = t[1]);
      t.respond_with && t.respond_with.user_id
        ? (s.userId = t.respond_with.user_id)
        : t.user_id && (s.userId = t.user_id);
      const n = o.reason;
      return (
        n
          ? ((s.reason = n), (e = `due to ${n}`))
          : (e = `with error code ${o.error_code}.`),
        this.gh.Zn() ||
          (e +=
            ' Please use the "enableSdkAuthentication" initialization option to enable authentication.'),
        r$1.j.error(`SDK Authentication failed ${e}`),
        this.Aa(t.events, t.attributes),
        this.gh.Su(s),
        !1
      );
    }
    if (n) {
      let i,
        o = n;
      switch (o) {
        case qt.za:
          return (
            (i = "Received successful response with empty body."),
            s$1.N(r$1.q.Is, { e: i }),
            r$1.j.info(i),
            !1
          );
        case qt.Ba:
          return (
            (i = "Received successful response with invalid JSON"),
            s$1.N(r$1.q.Is, { e: i + ": " + e.response }),
            r$1.j.info(i),
            !1
          );
        case qt.Da:
          o = `The API key "${t.api_key}" is invalid for the baseUrl ${this.Ho}`;
          break;
        case qt.Sa:
          o =
            "Sorry, we are not currently accepting your requests. If you think this is in error, please contact us.";
          break;
        case qt.va:
          o = "No device identifier. Please contact support@braze.com";
      }
      r$1.j.error("Backend error: " + o);
    }
    return !1;
  }
  ka(t, e, s, i) {
    return !!((t && 0 !== t.length) || (e && 0 !== e.length) || s || i);
  }
  Ta(t, e, s, i) {
    const r = [],
      o = t => t || "",
      n = o(this.Qo.getUserId());
    let a,
      u,
      h,
      c,
      l = this.Vi(t, e);
    if (s.length > 0) {
      const t = [];
      for (const e of s) {
        if (((a = e.Wi()), this.gh.Zn())) {
          if (n && !a.user_id) {
            c || ((c = {}), (c.events = [])), c.events.push(a);
            continue;
          }
          if (o(a.user_id) !== n) {
            u || (u = []), u.push(a);
            continue;
          }
        }
        t.push(a);
      }
      t.length > 0 && (l.events = t);
    }
    if (i.length > 0) {
      const t = [];
      for (const e of i)
        this.gh.Zn() && o(e.user_id) !== n
          ? (h || (h = []), h.push(e))
          : t.push(e);
      t.length > 0 && (l.attributes = t);
    }
    if ((this.Aa(u, h), (l = this.Gs(l, !0)), c)) {
      c = this.Gs(c, !1);
      const t = { requestData: c, headers: this.Ks(c, T.Qs.Xa) };
      r.push(t);
    }
    if (l && !this.ka(l.events, l.attributes, t, e)) return c ? r : null;
    const f = { requestData: l, headers: this.Ks(l, T.Qs.Xa) };
    return r.push(f), r;
  }
  Aa(t, e) {
    if (t) {
      const e = [];
      for (const s of t) {
        const t = ue.fromJson(s);
        (t.time = convertSecondsToMs(t.time)), e.push(t);
      }
      this.Jn.co(e);
    }
    if (e) for (const t of e) this.Jn.wa(t);
  }
  ii(t, e) {
    let s = "HTTP error ";
    null != t && (s += t + " "), (s += e), r$1.j.error(s);
  }
  qr(t) {
    return s$1.N(r$1.q.ya, { n: t });
  }
  Vi(t, e, s) {
    const i = {};
    t && (i.feed = !0), e && (i.triggers = !0);
    const r = null != s ? s : this.Qo.getUserId();
    return (
      r && (i.user_id = r),
      (i.config = { config_time: this.Zo.oi() }),
      { respond_with: i }
    );
  }
  Ca(t) {
    const e = new Date().valueOf();
    let s = LAST_REQUEST_TO_ENDPOINT_MS_AGO_DEFAULT.toString(),
      i = T.Ea(this.Jn, t);
    if (-1 !== i) {
      s = (e - i).toString();
    }
    return s;
  }
  Ks(t, e, s) {
    const r = [["X-Braze-Api-Key", this.Ko]];
    let o = this.Ca(e);
    r.push(["X-Braze-Last-Req-Ms-Ago", o]);
    let n = !1;
    if (
      (null != t.respond_with &&
        t.respond_with.triggers &&
        (r.push(["X-Braze-TriggersRequest", "true"]), (n = !0)),
      null != t.respond_with &&
        t.respond_with.feed &&
        (r.push(["X-Braze-FeedRequest", "true"]), (n = !0)),
      e === T.Qs.Os)
    ) {
      r.push(["X-Braze-ContentCardsRequest", "true"]);
      let t = this.Jn.v(STORAGE_KEYS.k.Fs);
      (t && s) || ((t = 0), this.Jn.D(STORAGE_KEYS.k.Fs, t)),
        r.push(["BRAZE-SYNC-RETRY-COUNT", t.toString()]),
        (n = !0);
    }
    if (
      (e === T.Qs.xi &&
        (r.push(["X-Braze-FeatureFlagsRequest", "true"]), (n = !0)),
      n && r.push(["X-Braze-DataRequest", "true"]),
      this.gh.Zn())
    ) {
      const t = this.gh.au();
      null != t && r.push(["X-Braze-Auth-Signature", t]);
    }
    return r;
  }
  Vs(t, e) {
    const s = t.device;
    s && s.os_version instanceof Promise
      ? s.os_version.then(s => {
          (t.device.os_version = s), e();
        })
      : e();
  }
  si() {
    this.gh.si();
  }
  Zs() {
    return this.Ho;
  }
  addSdkMetadata(t) {
    for (const e of t) -1 === this.Ra.indexOf(e) && this.Ra.push(e);
  }
}

const C = {
  Ys: t => {
    let e, o;
    try {
      const n = () => {
        r$1.j.error("This browser does not have any supported ajax options!");
      };
      if (
        (window.XMLHttpRequest ? ((e = new XMLHttpRequest()), e || n()) : n(),
        null != e)
      ) {
        const r = () => {
          "function" == typeof t.error && t.error(e.status),
            "function" == typeof t.ei && t.ei(!1);
        };
        (e.onload = () => {
          let o = !1;
          if (4 === e.readyState)
            if (
              ((o = (e.status >= 200 && e.status < 300) || 304 === e.status), o)
            ) {
              if ("function" == typeof t.O) {
                let o, r;
                try {
                  (o = JSON.parse(e.responseText)),
                    (r = e.getAllResponseHeaders());
                } catch (o) {
                  const n = {
                    error: "" === e.responseText ? qt.za : qt.Ba,
                    response: e.responseText
                  };
                  t.O(n, r);
                }
                o && t.O(o, r);
              }
              "function" == typeof t.ei && t.ei(!0);
            } else r();
        }),
          (e.onerror = () => {
            r();
          }),
          (e.ontimeout = () => {
            r();
          }),
          (o = JSON.stringify(t.data)),
          e.open("POST", t.url, !0),
          e.setRequestHeader("Content-type", "application/json"),
          e.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        const n = t.headers || [];
        for (const t of n) e.setRequestHeader(t[0], t[1]);
        e.send(o);
      }
    } catch (t) {
      r$1.j.error(`Network request error: ${t.message}`);
    }
  }
};
const readResponseHeaders = t => {
  let e = {};
  const o = t.toString().split("\r\n");
  if (!o) return e;
  let r, n;
  for (const t of o)
    t &&
      ((r = t
        .slice(0, t.indexOf(":"))
        .toLowerCase()
        .trim()),
      (n = t.slice(t.indexOf(":") + 1).trim()),
      (e[r] = n));
  return e;
};

const randomInclusive = (t, a) => (
  (t = Math.ceil(t)),
  (a = Math.floor(a)),
  Math.floor(Math.random() * (a - t + 1)) + t
);

class t {
  constructor(t, s) {
    (this.O = !!t), (this.ve = s || []);
  }
  S(t) {
    (this.O = this.O && t.O), this.ve.push(...t.ve);
  }
}

const yt = {
  an: () =>
    "serviceWorker" in navigator &&
    "undefined" != typeof ServiceWorkerRegistration &&
    "showNotification" in ServiceWorkerRegistration.prototype &&
    "PushManager" in window,
  fn: () =>
    "safari" in window &&
    "pushNotification" in window.safari &&
    "function" == typeof window.safari.pushNotification.permission &&
    "function" == typeof window.safari.pushNotification.requestPermission,
  isPushSupported: () => yt.an() || yt.fn(),
  isPushBlocked: () => {
    const i =
        yt.isPushSupported() &&
        "Notification" in window &&
        null != window.Notification &&
        null != window.Notification.permission &&
        "denied" === window.Notification.permission,
      n =
        yt.isPushSupported() &&
        (!("Notification" in window) || null == window.Notification);
    return i || n;
  },
  isPushPermissionGranted: () =>
    yt.isPushSupported() &&
    "Notification" in window &&
    null != window.Notification &&
    null != window.Notification.permission &&
    "granted" === window.Notification.permission,
  Ki: () =>
    !yt.isPushBlocked() && yt.isPushSupported() && !yt.isPushPermissionGranted()
};
var yt$1 = yt;

class Rt {
  constructor(t, s, i, e, n, l, h, o, r, u) {
    (this.Ko = t),
      (this.Ho = s),
      (this.wl = 0),
      (this.kl = h.eE()),
      (this.yl = null),
      (this.fh = i),
      (this.Xo = e),
      (this.Qo = n),
      (this.Zo = l),
      (this.Jn = h),
      (this.gh = r),
      (this.wh = u),
      (this.vl = o),
      (this.jl = new E()),
      (this.Sl = 50);
  }
  $l(t, s) {
    return !t && !s && this.gh.Fu() >= this.Sl;
  }
  ql(t) {
    let s = this.fh.kh();
    if (t.length > 0) {
      const i = this.Qo.getUserId();
      for (const e of t) {
        const t = (!e.userId && !i) || e.userId === i;
        e.type === r$1.q.Vh && t && (s = !0);
      }
    }
    return s;
  }
  Al(t, s, e, n, l, h, o) {
    null == e && (e = !0), e && this.Cl();
    const u = this.Jn.Wa(),
      a = this.Jn.tE();
    let c = !1;
    const m = (t, s) => {
        let o = !1;
        T.Xs(this.Jn, T.Qs.Xa, new Date().valueOf()),
          C.Ys({
            url: this.Ho + "/data/",
            data: t,
            headers: s,
            O: e => {
              null != t.respond_with &&
                t.respond_with.triggers &&
                (this.wl = Math.max(this.wl - 1, 0)),
                this.wh.ti(t, e, s)
                  ? (this.gh.si(),
                    this.Zo.ol(e),
                    (null != t.respond_with &&
                      t.respond_with.user_id != this.Qo.getUserId()) ||
                      (null != t.device && this.Jn.D(STORAGE_KEYS.k.ma, t.device),
                      null != t.sdk_metadata &&
                        (this.Jn.D(STORAGE_KEYS.k.ga, t.sdk_metadata),
                        this.Jn.D(STORAGE_KEYS.k.qa, this.fh.ba())),
                      this.vl(e),
                      "function" == typeof n && n()))
                  : e.auth_error && (o = !0);
            },
            error: () => {
              null != t.respond_with &&
                t.respond_with.triggers &&
                (this.wl = Math.max(this.wl - 1, 0)),
                this.wh.Aa(t.events, t.attributes),
                "function" == typeof l && l();
            },
            ei: t => {
              if (("function" == typeof h && h(t), e && !c)) {
                if (t && !o) this.Tl();
                else {
                  let t = this.yl;
                  (null == t || t < 1e3 * this.kl) && (t = 1e3 * this.kl),
                    this.Tl(Math.min(3e5, randomInclusive(1e3 * this.kl, 3 * t)));
                }
                c = !0;
              }
            }
          });
      },
      d = this.ql(u),
      f = s || d;
    if (this.$l(o, d))
      return void r$1.j.info(
        "Declining to flush data due to 50 consecutive authentication failures"
      );
    if (e && !this.wh.ka(u, a, t, f))
      return this.Tl(), void ("function" == typeof h && h(!0));
    const g = this.wh.Ta(t, f, u, a);
    f && this.wl++;
    let p = !1;
    if (g)
      for (const t of g)
        this.wh.Vs(t.requestData, () => m(t.requestData, t.headers)), (p = !0);
    this.gh.Zn() && e && !p
      ? this.Tl()
      : d && (r$1.j.info("Invoking new session subscriptions"), this.jl.Et());
  }
  _l() {
    return this.wl > 0;
  }
  Tl(t) {
    this.Dl ||
      (null == t && (t = 1e3 * this.kl),
      this.Cl(),
      (this.Fl = setTimeout(() => {
        if (document.hidden) {
          const t = "visibilitychange",
            s = () => {
              document.hidden ||
                (document.removeEventListener(t, s, !1), this.Al());
            };
          document.addEventListener(t, s, !1);
        } else this.Al();
      }, t)),
      (this.yl = t));
  }
  Cl() {
    null != this.Fl && (clearTimeout(this.Fl), (this.Fl = null));
  }
  initialize() {
    (this.Dl = !1), this.Tl();
  }
  destroy() {
    this.jl.removeAllSubscriptions(),
      this.gh.Au(),
      this.Cl(),
      (this.Dl = !0),
      this.Al(null, null, !1),
      (this.Fl = null);
  }
  pr(t) {
    return this.jl.lt(t);
  }
  openSession() {
    const t = this.fh.ba() !== this.fh.bo();
    t && (this.Jn.Ha(STORAGE_KEYS.eu.oa), this.Jn.Ha(STORAGE_KEYS.eu.su)),
      this.Al(null, !1, null, null, null),
      this.zn(),
      t &&
        Promise.resolve().then(function () { return pushManagerFactory; }).then(t => {
          if (this.Dl) return;
          const s = t.default.m();
          if (
            null != s &&
            (yt$1.isPushPermissionGranted() || yt$1.isPushBlocked())
          ) {
            const t = () => {
                s.ln()
                  ? r$1.j.info(
                      "Push token maintenance is disabled, not refreshing token for backend."
                    )
                  : s.subscribe();
              },
              e = (s, i) => {
                i && t();
              },
              n = () => {
                const s = this.Jn.v(STORAGE_KEYS.k.xn);
                (null == s || s) && t();
              },
              l = r$1.zt.Ft;
            new r$1.xt(l, r$1.j).hr(l.Jt.cu, e, n);
          }
        });
  }
  changeUser(t, s, e) {
    const n = this.Qo.getUserId();
    if (n !== t) {
      this.fh.Xh(),
        null != n && this.Al(null, !1, null, null, null),
        this.Qo.ru(t),
        e ? this.gh.setSdkAuthenticationSignature(e) : this.gh.du();
      for (let t = 0; t < s.length; t++) s[t].changeUser(null == n);
      null != n && this.Jn.ri(STORAGE_KEYS.k.L),
        this.Jn.ri(STORAGE_KEYS.k.ma),
        this.openSession(),
        r$1.j.info('Changed user to "' + t + '".');
    } else {
      let s = "Doing nothing.";
      e &&
        this.gh.au() !== e &&
        (this.gh.setSdkAuthenticationSignature(e),
        (s = "Updated SDK authentication signature")),
        r$1.j.info(`Current user is already ${t}. ${s}`);
    }
  }
  requestImmediateDataFlush(t) {
    this.Cl(), this.fh.bo();
    this.Al(
      null,
      null,
      null,
      null,
      () => {
        r$1.j.error(
          "Failed to flush data, request will be retried automatically."
        );
      },
      t,
      !0
    );
  }
  requestFeedRefresh() {
    this.fh.bo(), this.Al(!0);
  }
  $r(t, s) {
    this.fh.bo(),
      r$1.j.info("Requesting explicit trigger refresh."),
      this.Al(null, !0, null, t, s);
  }
  Cn(t, i) {
    const e = r$1.q.Ll,
      n = { a: t, l: i },
      l = s$1.N(e, n);
    return l && r$1.j.info(`Logged alias ${t} with label ${i}`), l;
  }
  En(i, e, n) {
    if (this.Zo.hu(e))
      return (
        r$1.j.info(`Custom Attribute "${e}" is blocklisted, ignoring.`), new t()
      );
    const l = { key: e, value: n },
      h = s$1.N(i, l);
    if (h) {
      const t = "object" == typeof n ? JSON.stringify(n, null, 2) : n;
      r$1.j.info(`Logged custom attribute: ${e} with value: ${t}`);
    }
    return h;
  }
  setLastKnownLocation(t, i, e, n, l, h) {
    const o = { latitude: i, longitude: e };
    null != n && (o.altitude = n),
      null != l && (o.ll_accuracy = l),
      null != h && (o.alt_accuracy = h);
    const u = s$1.N(r$1.q.Pl, o, t);
    return (
      u &&
        r$1.j.info(
          `Set user last known location as ${JSON.stringify(o, null, 2)}`
        ),
      u
    );
  }
  vr(t, s) {
    const i = this.fh.bo();
    return new ue(this.Qo.getUserId(), r$1.q.Rl, t, i, { cid: s });
  }
  zn() {
    const t = r$1.zt.Ft;
    new r$1.xt(t, r$1.j).setItem(t.Jt.Xa, 1, {
      baseUrl: this.Ho,
      data: { api_key: this.Ko, device_id: this.Xo.te().id },
      userId: this.Qo.getUserId(),
      sdkAuthEnabled: this.gh.Zn()
    });
  }
  Fr(t) {
    for (const s of t)
      if (s.api_key === this.Ko) this.wh.Aa(s.events, s.attributes);
      else {
        const t = r$1.zt.Ft;
        new r$1.xt(t, r$1.j).setItem(t.Jt.yr, r$1.Z.Y(), s);
      }
  }
  On(i, e, n) {
    if (this.Zo.hu(i))
      return (
        r$1.j.info(`Custom Attribute "${i}" is blocklisted, ignoring.`), new t()
      );
    let l, h;
    return (
      null === e && null === n
        ? ((l = r$1.q.Ml), (h = { key: i }))
        : ((l = r$1.q.Nl), (h = { key: i, latitude: e, longitude: n })),
      s$1.N(l, h)
    );
  }
  Gn(t, i) {
    const e = { group_id: t, status: i };
    return s$1.N(r$1.q.Ol, e);
  }
}

class Kt {
  constructor(t, s, i, h, l, e, r, u) {
    (this.hl = t || 0),
      (this.cl = s || []),
      (this.gl = i || []),
      (this.fl = h || []),
      (this.bl = l),
      (null != l && "" !== l) || (this.bl = null),
      (this.al = e || null),
      (this.ul = r || {}),
      (this.mi = u || {});
  }
  ss() {
    return {
      s: "4.8.0",
      l: this.hl,
      e: this.cl,
      a: this.gl,
      p: this.fl,
      m: this.bl,
      v: this.al,
      c: this.ul,
      f: this.mi
    };
  }
  static Tn(t) {
    let s = t.l;
    return (
      "4.8.0" !== t.s && (s = 0), new Kt(s, t.e, t.a, t.p, t.m, t.v, t.c, t.f)
    );
  }
}

class Mt {
  constructor(t) {
    (this.Jn = t),
      (this.tl = new E()),
      (this.el = new E()),
      (this.sl = new E()),
      (this.il = null);
  }
  rl() {
    if (null == this.il) {
      const t = this.Jn.v(STORAGE_KEYS.k.ll);
      this.il = null != t ? Kt.Tn(t) : new Kt();
    }
    return this.il;
  }
  oi() {
    return this.rl().hl;
  }
  ol(t) {
    if (null != t && null != t.config) {
      const e = t.config;
      if (e.time > this.rl().hl) {
        const t = new Kt(
          e.time,
          e.events_blacklist,
          e.attributes_blacklist,
          e.purchases_blacklist,
          e.messaging_session_timeout,
          e.vapid_public_key,
          e.content_cards,
          e.feature_flags
        );
        let s = !1;
        null != t.al && this.jn() !== t.al && (s = !0);
        let r = !1;
        null != t.ul.enabled && this.ni() !== t.ul.enabled && (r = !0);
        let n = !1;
        null != t.mi.enabled && this.bi() !== t.mi.enabled && (n = !0),
          (this.il = t),
          this.Jn.D(STORAGE_KEYS.k.ll, t.ss()),
          s && this.tl.Et(),
          r && this.el.Et(),
          n && this.sl.Et();
      }
    }
  }
  Un(t) {
    let e = this.tl.lt(t);
    return this.ml && this.tl.removeSubscription(this.ml), (this.ml = e), e;
  }
  $s(t) {
    return this.el.lt(t);
  }
  Ni(t) {
    return this.sl.lt(t);
  }
  ge(t) {
    return -1 !== this.rl().cl.indexOf(t);
  }
  hu(t) {
    return -1 !== this.rl().gl.indexOf(t);
  }
  Dr(t) {
    return -1 !== this.rl().fl.indexOf(t);
  }
  dl() {
    return this.rl().bl;
  }
  jn() {
    return this.rl().al;
  }
  ni() {
    return this.rl().ul.enabled || !1;
  }
  _s() {
    const t = this.rl().ul.rate_limit;
    return !(!t || null == t.enabled) && t.enabled;
  }
  fi() {
    if (!this._s()) return -1;
    const t = this.rl().ul.rate_limit;
    return null == t.capacity ? CONTENT_CARDS_RATE_LIMIT_CAPACITY_DEFAULT : t.capacity <= 0 ? -1 : t.capacity;
  }
  di() {
    if (!this._s()) return -1;
    const t = this.rl().ul.rate_limit;
    return null == t.refill_rate ? CONTENT_CARDS_RATE_LIMIT_REFILL_RATE_DEFAULT : t.refill_rate <= 0 ? -1 : t.refill_rate;
  }
  bi() {
    return this.rl().mi.enabled && null == this.Si()
      ? (s$1.N(r$1.q.Is, { e: "Missing feature flag refresh_rate_limit." }), !1)
      : this.rl().mi.enabled || !1;
  }
  Si() {
    return this.rl().mi.refresh_rate_limit;
  }
}

class Dt {
  constructor(s, t, e, i) {
    (this.Jn = s),
      (this.Qo = t),
      (this.Zo = e),
      (this.jh = 1e3),
      (i = parseFloat(i)),
      isNaN(i) && (i = 1800),
      i < this.jh / 1e3 &&
        (r$1.j.info(
          "Specified session timeout of " +
            i +
            "s is too small, using the minimum session timeout of " +
            this.jh / 1e3 +
            "s instead."
        ),
        (i = this.jh / 1e3)),
      (this.xh = i);
  }
  Gh(s, t) {
    return new ue(this.Qo.getUserId(), r$1.q.Fh, s, t.iu, { d: convertMsToSeconds(s - t.Hh) });
  }
  ba() {
    const s = this.Jn.tu(STORAGE_KEYS.eu.Wh);
    return null == s ? null : s.iu;
  }
  kh() {
    const s = new Date().valueOf(),
      t = this.Zo.dl(),
      e = this.Jn.v(STORAGE_KEYS.k.qh);
    if (null != e && null == t) return !1;
    const n = null == e || s - e > 1e3 * t;
    return n && this.Jn.D(STORAGE_KEYS.k.qh, s), n;
  }
  yh(s, t) {
    return null == t || (!(s - t.Hh < this.jh) && t.Bh < s);
  }
  bo() {
    const s = new Date().valueOf(),
      t = s + 1e3 * this.xh,
      e = this.Jn.tu(STORAGE_KEYS.eu.Wh);
    if (this.yh(s, e)) {
      let n = "Generating session start event with time " + s;
      if (null != e) {
        let s = e.Jh;
        s - e.Hh < this.jh && (s = e.Hh + this.Kh),
          this.Jn.Qh(this.Gh(s, e)),
          (n += " (old session ended " + s + ")");
      }
      (n += ". Will expire " + t.valueOf()), r$1.j.info(n);
      const o = new _t(r$1.Z.Y(), t);
      this.Jn.Qh(new ue(this.Qo.getUserId(), r$1.q.Vh, s, o.iu)),
        this.Jn.uu(STORAGE_KEYS.eu.Wh, o);
      return null == this.Jn.v(STORAGE_KEYS.k.qh) && this.Jn.D(STORAGE_KEYS.k.qh, s), o.iu;
    }
    return (e.Jh = s), (e.Bh = t), this.Jn.uu(STORAGE_KEYS.eu.Wh, e), e.iu;
  }
  Xh() {
    const s = this.Jn.tu(STORAGE_KEYS.eu.Wh);
    null != s &&
      (this.Jn.Yh(STORAGE_KEYS.eu.Wh), this.Jn.Qh(this.Gh(new Date().valueOf(), s)));
  }
}

const Bt = {
  qo: (e, o) => {
    let t = !1;
    try {
      if (localStorage && localStorage.getItem)
        try {
          localStorage.setItem(STORAGE_KEYS.k._a, !0),
            localStorage.getItem(STORAGE_KEYS.k._a) &&
              (localStorage.removeItem(STORAGE_KEYS.k._a), (t = !0));
        } catch (e) {
          if (
            ("QuotaExceededError" !== e.name &&
              "NS_ERROR_DOM_QUOTA_REACHED" !== e.name) ||
            !(localStorage.length > 0)
          )
            throw e;
          t = !0;
        }
    } catch (e) {
      r$1.j.info("Local Storage not supported!");
    }
    const a = Bt.Oa(),
      l = new O.xa(e, a && !o, t);
    let c = null;
    return (c = t ? new O.Ma(e) : new O.Qa()), new O(l, c);
  },
  Oa: () =>
    navigator.cookieEnabled ||
    ("cookie" in document &&
      (document.cookie.length > 0 ||
        (document.cookie = "test").indexOf.call(document.cookie, "test") > -1))
};

class ControlMessage {
  constructor(t) {
    (this.triggerId = t),
      (this.triggerId = t),
      (this.extras = {}),
      (this.isControl = !0);
  }
  static fromJson(t) {
    return new ControlMessage(t.trigger_id);
  }
}

function _isInView(t, n, e, s) {
  if (null == t) return !1;
  (n = n || !1), (e = e || !1);
  const i = t.getBoundingClientRect();
  return (
    null != i &&
    ((i.top >= 0 &&
      i.top <= (window.innerHeight || document.documentElement.clientHeight)) ||
      !n) &&
      (i.left >= 0 || !s) &&
      ((i.bottom >= 0 &&
        i.bottom <=
          (window.innerHeight || document.documentElement.clientHeight)) ||
        !e) &&
      (i.right <= (window.innerWidth || document.documentElement.clientWidth) ||
        !s)
  );
}
const DOMUtils = { Ou: null, eo: _isInView };
const DIRECTIONS = { Je: "up", Ke: "down", W: "left", X: "right" };
function supportsPassive() {
  if (null == DOMUtils.Ou) {
    DOMUtils.Ou = !1;
    try {
      const t = Object.defineProperty({}, "passive", {
        get: () => {
          DOMUtils.Ou = !0;
        }
      });
      window.addEventListener("testPassive", null, t),
        window.removeEventListener("testPassive", null, t);
    } catch (t) {}
  }
  return DOMUtils.Ou;
}
function addPassiveEventListener(t, n, e = () => {}) {
  t.addEventListener(n, e, !!supportsPassive() && { passive: !0 });
}
function topIsInView(t) {
  return DOMUtils.eo(t, !0, !1, !1);
}
function bottomIsInView(t) {
  return DOMUtils.eo(t, !1, !0, !1);
}
function clickElement(t) {
  if (t.onclick) {
    const n = document.createEvent("MouseEvents");
    n.initEvent("click", !0, !0), t.onclick.apply(t, [n]);
  }
}
function detectSwipe(t, n, e) {
  let s = null,
    i = null;
  addPassiveEventListener(t, "touchstart", t => {
    (s = t.touches[0].clientX), (i = t.touches[0].clientY);
  }),
    addPassiveEventListener(t, "touchmove", o => {
      if (null == s || null == i) return;
      const l = s - o.touches[0].clientX,
        u = i - o.touches[0].clientY;
      Math.abs(l) > Math.abs(u) && Math.abs(l) >= 25
        ? (((l > 0 && n === DIRECTIONS.W) || (l < 0 && n === DIRECTIONS.X)) &&
            e(o),
          (s = null),
          (i = null))
        : Math.abs(u) >= 25 &&
          (((u > 0 &&
            n === DIRECTIONS.Je &&
            t.scrollTop === t.scrollHeight - t.offsetHeight) ||
            (u < 0 && n === DIRECTIONS.Ke && 0 === t.scrollTop)) &&
            e(o),
          (s = null),
          (i = null));
    });
}
function buildSvg(t, n, e) {
  const s = "http://www.w3.org/2000/svg",
    i = document.createElementNS(s, "svg");
  i.setAttribute("viewBox", t), i.setAttribute("xmlns", s);
  const o = document.createElementNS(s, "path");
  return (
    o.setAttribute("d", n),
    null != e && o.setAttribute("fill", e),
    i.appendChild(o),
    i
  );
}

const KeyCodes = { yo: 32, oo: 9, Fo: 13, Ih: 27 };

const isIFrame = e => null !== e && "IFRAME" === e.tagName;

class InAppMessage {
  constructor(
    t,
    s,
    i,
    h,
    e,
    n,
    o,
    r,
    l,
    u,
    T,
    a,
    m,
    c,
    I,
    L,
    A,
    N,
    d,
    _,
    O,
    S,
    D,
    M,
    R,
    b,
    p,
    U,
    P
  ) {
    (this.message = t),
      (this.messageAlignment = s),
      (this.slideFrom = i),
      (this.extras = h),
      (this.triggerId = e),
      (this.clickAction = n),
      (this.uri = o),
      (this.openTarget = r),
      (this.dismissType = l),
      (this.duration = u),
      (this.icon = T),
      (this.imageUrl = a),
      (this.imageStyle = m),
      (this.iconColor = c),
      (this.iconBackgroundColor = I),
      (this.backgroundColor = L),
      (this.textColor = A),
      (this.closeButtonColor = N),
      (this.animateIn = d),
      (this.animateOut = _),
      (this.header = O),
      (this.headerAlignment = S),
      (this.headerTextColor = D),
      (this.frameColor = M),
      (this.buttons = R),
      (this.cropType = b),
      (this.orientation = p),
      (this.htmlId = U),
      (this.css = P),
      (this.message = t),
      (this.messageAlignment = s || InAppMessage.TextAlignment.CENTER),
      (this.duration = u || 5e3),
      (this.slideFrom = i || InAppMessage.SlideFrom.BOTTOM),
      (this.extras = h || {}),
      (this.triggerId = e),
      (this.clickAction = n || InAppMessage.ClickAction.NONE),
      (this.uri = o),
      (this.openTarget = r || InAppMessage.OpenTarget.NONE),
      (this.dismissType = l || InAppMessage.DismissType.AUTO_DISMISS),
      (this.icon = T),
      (this.imageUrl = a),
      (this.imageStyle = m || InAppMessage.ImageStyle.TOP),
      (this.iconColor = c || InAppMessage.Ur.Vr),
      (this.iconBackgroundColor = I || InAppMessage.Ur.Qr),
      (this.backgroundColor = L || InAppMessage.Ur.Vr),
      (this.textColor = A || InAppMessage.Ur.th),
      (this.closeButtonColor = N || InAppMessage.Ur.sh),
      (this.animateIn = d),
      null == this.animateIn && (this.animateIn = !0),
      (this.animateOut = _),
      null == this.animateOut && (this.animateOut = !0),
      (this.header = O),
      (this.headerAlignment = S || InAppMessage.TextAlignment.CENTER),
      (this.headerTextColor = D || InAppMessage.Ur.th),
      (this.frameColor = M || InAppMessage.Ur.ih),
      (this.buttons = R || []),
      (this.cropType = b || InAppMessage.CropType.FIT_CENTER),
      (this.orientation = p),
      (this.htmlId = U),
      (this.css = P),
      (this.isControl = !1),
      (this.hh = !1),
      (this.eh = !1),
      (this.vo = !1),
      (this.nh = !1),
      (this.qe = null),
      (this.ke = null),
      (this.ht = new E()),
      (this.oh = new E()),
      (this.Le = InAppMessage.TextAlignment.CENTER);
  }
  subscribeToClickedEvent(t) {
    return this.ht.lt(t);
  }
  subscribeToDismissedEvent(t) {
    return this.oh.lt(t);
  }
  removeSubscription(t) {
    this.ht.removeSubscription(t), this.oh.removeSubscription(t);
  }
  removeAllSubscriptions() {
    this.ht.removeAllSubscriptions(), this.oh.removeAllSubscriptions();
  }
  closeMessage() {
    this.he(this.qe);
  }
  xe() {
    return !0;
  }
  io() {
    return this.xe();
  }
  $e() {
    return null != this.htmlId && this.htmlId.length > 4;
  }
  ye() {
    return this.$e() && null != this.css && this.css.length > 0;
  }
  Ae() {
    if (this.$e() && this.ye()) return this.htmlId + "-css";
  }
  M() {
    return !this.eh && ((this.eh = !0), !0);
  }
  Lr() {
    return this.eh;
  }
  p(t) {
    return !this.vo && ((this.vo = !0), this.ht.Et(), !0);
  }
  F() {
    return !this.nh && ((this.nh = !0), this.oh.Et(), !0);
  }
  hide(t) {
    if (t && t.parentNode) {
      let s = t.closest(".ab-iam-root");
      if ((null == s && (s = t), this.xe() && null != s.parentNode)) {
        const t = s.parentNode.classList;
        t && t.contains(InAppMessage.rh) && t.remove(InAppMessage.rh),
          document.body.removeEventListener("touchmove", InAppMessage.lh);
      }
      s.className = s.className.replace(InAppMessage.uh, InAppMessage.Eh);
    }
    return this.animateOut || !1;
  }
  he(t, s) {
    if (null == t) return;
    let i;
    (this.qe = null),
      (i =
        -1 === t.className.indexOf("ab-in-app-message")
          ? t.getElementsByClassName("ab-in-app-message")[0]
          : t);
    let h = !1;
    i && (h = this.hide(i));
    const e = document.body;
    let n;
    null != e && (n = e.scrollTop);
    const o = () => {
      if (t && t.parentNode) {
        let s = t.closest(".ab-iam-root");
        null == s && (s = t), s.parentNode && s.parentNode.removeChild(s);
      }
      const i = this.Ae();
      if (null != i) {
        const t = document.getElementById(i);
        t && t.parentNode && t.parentNode.removeChild(t);
      }
      null != e && "Safari" === V.browser && (e.scrollTop = n),
        s ? s() : this.F();
    };
    h ? setTimeout(o, InAppMessage.Th) : o(), this.ke && this.ke.focus();
  }
  Be() {
    return document.createTextNode(this.message || "");
  }
  Ie(t) {
    let s = "";
    this.message || this.header || !this.xe() || (s = "Modal Image"),
      t.setAttribute("alt", s);
  }
  static lh(t) {
    if (t.targetTouches && t.targetTouches.length > 1) return;
    const s = t.target;
    (s &&
      s.classList &&
      s.classList.contains("ab-message-text") &&
      s.scrollHeight > s.clientHeight) ||
      (document.querySelector(`.${InAppMessage.rh}`) && t.preventDefault());
  }
  ah(t) {
    const s = t.parentNode;
    this.xe() &&
      null != s &&
      this.orientation !== InAppMessage.Orientation.LANDSCAPE &&
      (null != s.classList && s.classList.add(InAppMessage.rh),
      document.body.addEventListener(
        "touchmove",
        InAppMessage.lh,
        !!supportsPassive() && { passive: !1 }
      )),
      (t.className += " " + InAppMessage.uh);
  }
  static mh(t) {
    if (
      t.keyCode === KeyCodes.Ih &&
      !e.nn(L.Lh) &&
      document.querySelectorAll(".ab-modal-interactions").length > 0
    ) {
      const t = document.getElementsByClassName("ab-html-message");
      let s = !1;
      for (const i of t) {
        let t = null;
        isIFrame(i) &&
          i.contentWindow &&
          (t = i.contentWindow.document.getElementsByClassName(
            "ab-programmatic-close-button"
          )[0]),
          null != t && (clickElement(t), (s = !0));
      }
      if (!s) {
        const t = document.querySelectorAll(
          ".ab-modal-interactions > .ab-close-button"
        )[0];
        null != t && clickElement(t);
      }
    }
  }
  Ah() {
    this.hh ||
      e.nn(L.Lh) ||
      (document.addEventListener("keydown", InAppMessage.mh, !1),
      e.Nh(() => {
        document.removeEventListener("keydown", InAppMessage.mh);
      }),
      (this.hh = !0));
  }
}
(InAppMessage.Ur = {
  th: 4281545523,
  Vr: 4294967295,
  Qr: 4278219733,
  dh: 4293914607,
  _h: 4283782485,
  ih: 3224580915,
  sh: 4288387995
}),
  (InAppMessage.Me = {
    Oh: "hd",
    ze: "ias",
    Sh: "of",
    Dh: "do",
    Gr: "umt",
    Yi: "tf",
    Mh: "te"
  }),
  (InAppMessage.SlideFrom = { TOP: "TOP", BOTTOM: "BOTTOM" }),
  (InAppMessage.ClickAction = {
    NEWS_FEED: "NEWS_FEED",
    URI: "URI",
    NONE: "NONE"
  }),
  (InAppMessage.DismissType = {
    AUTO_DISMISS: "AUTO_DISMISS",
    MANUAL: "SWIPE"
  }),
  (InAppMessage.OpenTarget = { NONE: "NONE", BLANK: "BLANK" }),
  (InAppMessage.ImageStyle = { TOP: "TOP", GRAPHIC: "GRAPHIC" }),
  (InAppMessage.Orientation = { PORTRAIT: "PORTRAIT", LANDSCAPE: "LANDSCAPE" }),
  (InAppMessage.TextAlignment = {
    START: "START",
    CENTER: "CENTER",
    END: "END"
  }),
  (InAppMessage.CropType = {
    CENTER_CROP: "CENTER_CROP",
    FIT_CENTER: "FIT_CENTER"
  }),
  (InAppMessage.Ee = {
    Rh: "SLIDEUP",
    bh: "MODAL",
    Ne: "MODAL_STYLED",
    so: "FULL",
    do: "WEB_HTML",
    Pe: "HTML",
    ph: "HTML_FULL"
  }),
  (InAppMessage.Th = 500),
  (InAppMessage.Uh = 200),
  (InAppMessage.uh = "ab-show"),
  (InAppMessage.Eh = "ab-hide"),
  (InAppMessage.rh = "ab-pause-scrolling");

class HtmlMessage extends InAppMessage {
  constructor(i, o, d, v, s, t, e, r, u, h, n) {
    super(
      i,
      void 0,
      void 0,
      o,
      d,
      void 0,
      void 0,
      void 0,
      (v = v || InAppMessage.DismissType.MANUAL),
      s,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      t,
      e,
      void 0,
      void 0,
      void 0,
      r,
      void 0,
      void 0,
      void 0,
      u,
      h
    ),
      (this.messageFields = n),
      (this.messageFields = n);
  }
  io() {
    return !1;
  }
  p(i) {
    if (this.Ce === InAppMessage.Ee.do) {
      if (this.vo) return !1;
      this.vo = !0;
    }
    return this.ht.Et(i), !0;
  }
}
HtmlMessage.es = InAppMessage.Ee.do;

class InAppMessageButton {
  constructor(s, t, i, r, h, e, n) {
    (this.text = s),
      (this.backgroundColor = t),
      (this.textColor = i),
      (this.borderColor = r),
      (this.clickAction = h),
      (this.uri = e),
      (this.id = n),
      (this.text = s || ""),
      (this.backgroundColor = t || InAppMessage.Ur.Qr),
      (this.textColor = i || InAppMessage.Ur.Vr),
      (this.borderColor = r || this.backgroundColor),
      (this.clickAction = h || InAppMessage.ClickAction.NONE),
      (this.uri = e),
      null == n && (n = InAppMessageButton.Pi),
      (this.id = n),
      (this.vo = !1),
      (this.ht = new E());
  }
  subscribeToClickedEvent(s) {
    return this.ht.lt(s);
  }
  removeSubscription(s) {
    this.ht.removeSubscription(s);
  }
  removeAllSubscriptions() {
    this.ht.removeAllSubscriptions();
  }
  p() {
    return !this.vo && ((this.vo = !0), this.ht.Et(), !0);
  }
  static fromJson(s) {
    return new InAppMessageButton(
      s.text,
      s.bg_color,
      s.text_color,
      s.border_color,
      s.click_action,
      s.uri,
      s.id
    );
  }
}
InAppMessageButton.Pi = -1;

class FullScreenMessage extends InAppMessage {
  constructor(
    s,
    e,
    t,
    o,
    r,
    p,
    a,
    i,
    c,
    d,
    m,
    n,
    u,
    f,
    l,
    x,
    g,
    h,
    j,
    v,
    b,
    k,
    q,
    w,
    y,
    z,
    A,
    B
  ) {
    (i = i || InAppMessage.DismissType.MANUAL),
      (z = z || InAppMessage.Orientation.PORTRAIT),
      super(
        s,
        e,
        void 0,
        t,
        o,
        r,
        p,
        a,
        i,
        c,
        d,
        m,
        n,
        u,
        f,
        l,
        x,
        g,
        h,
        j,
        v,
        b,
        k,
        q,
        w,
        (y = y || InAppMessage.CropType.CENTER_CROP),
        z,
        A,
        B
      ),
      (this.Le = InAppMessage.TextAlignment.CENTER);
  }
}
FullScreenMessage.es = InAppMessage.Ee.so;

class ModalMessage extends InAppMessage {
  constructor(
    s,
    e,
    o,
    t,
    r,
    i,
    p,
    a,
    d,
    c,
    m,
    n,
    u,
    f,
    l,
    v,
    x,
    g,
    h,
    j,
    b,
    k,
    q,
    w,
    y,
    z,
    A
  ) {
    super(
      s,
      e,
      void 0,
      o,
      t,
      r,
      i,
      p,
      (a = a || InAppMessage.DismissType.MANUAL),
      d,
      c,
      m,
      n,
      u,
      f,
      l,
      v,
      x,
      g,
      h,
      j,
      b,
      k,
      q,
      w,
      (y = y || InAppMessage.CropType.FIT_CENTER),
      void 0,
      z,
      A
    ),
      (this.Le = InAppMessage.TextAlignment.CENTER);
  }
}
ModalMessage.es = InAppMessage.Ee.bh;

class SlideUpMessage extends InAppMessage {
  constructor(o, s, t, e, i, d, n, r, a, p, u, m, c, v, l, x, h, f, g, I, M) {
    (x = x || InAppMessage.Ur._h),
      (l = l || InAppMessage.Ur.dh),
      super(
        o,
        (s = s || InAppMessage.TextAlignment.START),
        t,
        e,
        i,
        d,
        n,
        r,
        a,
        p,
        u,
        m,
        void 0,
        c,
        v,
        l,
        x,
        h,
        f,
        g,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        I,
        M
      ),
      (this.Le = InAppMessage.TextAlignment.START);
  }
  xe() {
    return !1;
  }
  Be() {
    const o = document.createElement("span");
    return o.appendChild(document.createTextNode(this.message || "")), o;
  }
  ah(o) {
    const s = o.getElementsByClassName("ab-in-app-message")[0];
    DOMUtils.eo(s, !0, !0) ||
      (this.slideFrom === InAppMessage.SlideFrom.TOP
        ? (s.style.top = "0px")
        : (s.style.bottom = "0px")),
      super.ah(o);
  }
}
SlideUpMessage.es = InAppMessage.Ee.Rh;

function newInAppMessageFromJson(e) {
  if (!e) return null;
  if (e.is_control) return ControlMessage.fromJson(e);
  let s = e.type;
  null != s && (s = s.toUpperCase());
  const o = e.message,
    m = e.text_align_message,
    l = e.slide_from,
    n = e.extras,
    t = e.trigger_id,
    i = e.click_action,
    f = e.uri,
    p = e.open_target,
    a = e.message_close,
    d = e.duration,
    u = e.icon,
    g = e.image_url,
    j = e.image_style,
    w = e.icon_color,
    c = e.icon_bg_color,
    b = e.bg_color,
    h = e.text_color,
    v = e.close_btn_color,
    I = e.header,
    k = e.text_align_header,
    x = e.header_text_color,
    y = e.frame_color,
    z = [];
  let A = e.btns;
  null == A && (A = []);
  for (let e = 0; e < A.length; e++) z.push(InAppMessageButton.fromJson(A[e]));
  const F = e.crop_type,
    J = e.orientation,
    M = e.animate_in,
    q = e.animate_out;
  let B,
    C = e.html_id,
    D = e.css;
  if (
    ((null != C && "" !== C && null != D && "" !== D) ||
      ((C = void 0), (D = void 0)),
    s === ModalMessage.es || s === InAppMessage.Ee.Ne)
  )
    B = new ModalMessage(
      o,
      m,
      n,
      t,
      i,
      f,
      p,
      a,
      d,
      u,
      g,
      j,
      w,
      c,
      b,
      h,
      v,
      M,
      q,
      I,
      k,
      x,
      y,
      z,
      F,
      C,
      D
    );
  else if (s === FullScreenMessage.es)
    B = new FullScreenMessage(
      o,
      m,
      n,
      t,
      i,
      f,
      p,
      a,
      d,
      u,
      g,
      j,
      w,
      c,
      b,
      h,
      v,
      M,
      q,
      I,
      k,
      x,
      y,
      z,
      F,
      J,
      C,
      D
    );
  else if (s === SlideUpMessage.es)
    B = new SlideUpMessage(
      o,
      m,
      l,
      n,
      t,
      i,
      f,
      p,
      a,
      d,
      u,
      g,
      w,
      c,
      b,
      h,
      v,
      M,
      q,
      C,
      D
    );
  else {
    if (s !== HtmlMessage.es && s !== InAppMessage.Ee.Pe)
      return void r$1.j.error("Ignoring message with unknown type " + s);
    {
      const s = e.message_fields;
      (B = new HtmlMessage(o, n, t, a, d, M, q, y, C, D, s)),
        (B.trusted = e.trusted || !1);
    }
  }
  return (B.Ce = s), B;
}

class Gt {
  constructor(t) {
    this.xl = t;
  }
  Bl(t) {
    return null == this.xl || this.xl === t[0];
  }
  static fromJson(t) {
    return new Gt(t ? t.event_name : null);
  }
  ss() {
    return this.xl;
  }
}

class Zt {
  constructor(t, s, e, i) {
    (this.El = t),
      (this.Hl = s),
      (this.comparator = e),
      (this.Il = i),
      this.Hl === Zt.Ql.Ul &&
        this.comparator !== Zt.Gl.Xl &&
        this.comparator !== Zt.Gl.Vl &&
        this.comparator !== Zt.Gl.Kl &&
        this.comparator !== Zt.Gl.Wl &&
        (this.Il = dateFromUnixTimestamp(this.Il));
  }
  Bl(t) {
    let s = null;
    switch ((null != t && (s = t[this.El]), this.comparator)) {
      case Zt.Gl.Yl:
        return null != s && s.valueOf() === this.Il.valueOf();
      case Zt.Gl.Zl:
        return null == s || s.valueOf() !== this.Il.valueOf();
      case Zt.Gl.Zh:
        return typeof s == typeof this.Il && s > this.Il;
      case Zt.Gl.Xl:
        return this.Hl === Zt.Ql.Ul
          ? null != s && isDate(s) && secondsAgo(s) <= this.Il
          : typeof s == typeof this.Il && s >= this.Il;
      case Zt.Gl.$h:
        return typeof s == typeof this.Il && s < this.Il;
      case Zt.Gl.Vl:
        return this.Hl === Zt.Ql.Ul
          ? null != s && isDate(s) && secondsAgo(s) >= this.Il
          : typeof s == typeof this.Il && s <= this.Il;
      case Zt.Gl.Eu:
        return (
          null != s &&
          "string" == typeof s &&
          typeof s == typeof this.Il &&
          null != s.match(this.Il)
        );
      case Zt.Gl.Tu:
        return null != s;
      case Zt.Gl._u:
        return null == s;
      case Zt.Gl.Kl:
        return null != s && isDate(s) && secondsInTheFuture(s) < this.Il;
      case Zt.Gl.Wl:
        return null != s && isDate(s) && secondsInTheFuture(s) > this.Il;
      case Zt.Gl.yu:
        return (
          null == s ||
          typeof s != typeof this.Il ||
          "string" != typeof s ||
          null == s.match(this.Il)
        );
    }
    return !1;
  }
  static fromJson(t) {
    return new Zt(
      t.property_key,
      t.property_type,
      t.comparator,
      t.property_value
    );
  }
  ss() {
    let t = this.Il;
    return (
      isDate(this.Il) && (t = convertMsToSeconds(t.valueOf())),
      { k: this.El, t: this.Hl, c: this.comparator, v: t }
    );
  }
  static Tn(t) {
    return new Zt(t.k, t.t, t.c, t.v);
  }
}
(Zt.Gl = {
  Yl: 1,
  Zl: 2,
  Zh: 3,
  Xl: 4,
  $h: 5,
  Vl: 6,
  Eu: 10,
  Tu: 11,
  _u: 12,
  Kl: 15,
  Wl: 16,
  yu: 17
}),
  (Zt.Ql = { Nu: "boolean", Mu: "number", Ru: "string", Ul: "date" });

class Qt {
  constructor(t) {
    this.filters = t;
  }
  Bl(t) {
    let r = !0;
    for (let e = 0; e < this.filters.length; e++) {
      const o = this.filters[e];
      let s = !1;
      for (let r = 0; r < o.length; r++)
        if (o[r].Bl(t)) {
          s = !0;
          break;
        }
      if (!s) {
        r = !1;
        break;
      }
    }
    return r;
  }
  static fromJson(t) {
    if (null == t || !isArray(t)) return null;
    const r = [];
    for (let e = 0; e < t.length; e++) {
      const o = [],
        s = t[e];
      for (let t = 0; t < s.length; t++) o.push(Zt.fromJson(s[t]));
      r.push(o);
    }
    return new Qt(r);
  }
  ss() {
    const t = [];
    for (let r = 0; r < this.filters.length; r++) {
      const e = this.filters[r],
        o = [];
      for (let t = 0; t < e.length; t++) o.push(e[t].ss());
      t.push(o);
    }
    return t;
  }
  static Tn(t) {
    const r = [];
    for (let e = 0; e < t.length; e++) {
      const o = [],
        s = t[e];
      for (let t = 0; t < s.length; t++) o.push(Zt.Tn(s[t]));
      r.push(o);
    }
    return new Qt(r);
  }
}

class Yt {
  constructor(t, s) {
    (this.xl = t), (this.Jl = s);
  }
  Bl(t) {
    if (null == this.xl || null == this.Jl) return !1;
    const s = t[0],
      r = t[1];
    return s === this.xl && this.Jl.Bl(r);
  }
  static fromJson(t) {
    return new Yt(
      t ? t.event_name : null,
      t ? Qt.fromJson(t.property_filters) : null
    );
  }
  ss() {
    return { e: this.xl, pf: this.Jl.ss() };
  }
}

class si {
  constructor(t, i) {
    (this.ju = t), (this.ku = i);
  }
  Bl(t) {
    if (null == this.ju) return !1;
    const i = ri.wu(t[0], this.ju);
    if (!i) return !1;
    let r = null == this.ku || 0 === this.ku.length;
    if (null != this.ku)
      for (let i = 0; i < this.ku.length; i++)
        if (this.ku[i] === t[1]) {
          r = !0;
          break;
        }
    return i && r;
  }
  static fromJson(t) {
    return new si(t ? t.id : null, t ? t.buttons : null);
  }
  ss() {
    return this.ju;
  }
}

class sr {
  constructor(t) {
    this.productId = t;
  }
  Bl(t) {
    return null == this.productId || t[0] === this.productId;
  }
  static fromJson(t) {
    return new sr(t ? t.product_id : null);
  }
  ss() {
    return this.productId;
  }
}

class is {
  constructor(t, s) {
    (this.productId = t), (this.Jl = s);
  }
  Bl(t) {
    if (null == this.productId || null == this.Jl) return !1;
    const s = t[0],
      i = t[1];
    return s === this.productId && this.Jl.Bl(i);
  }
  static fromJson(t) {
    return new is(
      t ? t.product_id : null,
      t ? Qt.fromJson(t.property_filters) : null
    );
  }
  ss() {
    return { id: this.productId, pf: this.Jl.ss() };
  }
}

class lr {
  constructor(t) {
    this.ju = t;
  }
  Bl(t) {
    return null == this.ju || ri.wu(t[0], this.ju);
  }
  static fromJson(t) {
    return new lr(t ? t.campaign_id : null);
  }
  ss() {
    return this.ju;
  }
}

var tt = {
  OPEN: "open",
  Rr: "purchase",
  zr: "push_click",
  be: "custom_event",
  Kr: "iam_click",
  ks: "test"
};

class ri {
  constructor(e, t) {
    (this.type = e), (this.data = t);
  }
  ec(e, t) {
    return ri.tc[this.type] === e && (null == this.data || this.data.Bl(t));
  }
  static wu(e, t) {
    let a = null;
    try {
      a = window.atob(e);
    } catch (t) {
      return (
        r$1.j.info("Failed to unencode analytics id " + e + ": " + t.message), !1
      );
    }
    return t === a.split("_")[0];
  }
  static fromJson(e) {
    const t = e.type;
    let r;
    switch (t) {
      case ri.rc.OPEN:
        r = null;
        break;
      case ri.rc.Rr:
        r = sr.fromJson(e.data);
        break;
      case ri.rc.ac:
        r = is.fromJson(e.data);
        break;
      case ri.rc.zr:
        r = lr.fromJson(e.data);
        break;
      case ri.rc.be:
        r = Gt.fromJson(e.data);
        break;
      case ri.rc.sc:
        r = Yt.fromJson(e.data);
        break;
      case ri.rc.Kr:
        r = si.fromJson(e.data);
        break;
      case ri.rc.ks:
        r = null;
    }
    return new ri(t, r);
  }
  ss() {
    return { t: this.type, d: this.data ? this.data.ss() : null };
  }
  static Tn(e) {
    let t, r;
    switch (e.t) {
      case ri.rc.OPEN:
        t = null;
        break;
      case ri.rc.Rr:
        t = new sr(e.d);
        break;
      case ri.rc.ac:
        (r = e.d || {}), (t = new is(r.id, Qt.Tn(r.pf || [])));
        break;
      case ri.rc.zr:
        t = new lr(e.d);
        break;
      case ri.rc.be:
        t = new Gt(e.d);
        break;
      case ri.rc.sc:
        (r = e.d || {}), (t = new Yt(r.e, Qt.Tn(r.pf || [])));
        break;
      case ri.rc.Kr:
        t = new si(e.d);
        break;
      case ri.rc.ks:
        t = null;
    }
    return new ri(e.t, t);
  }
}
(ri.rc = {
  OPEN: "open",
  Rr: "purchase",
  ac: "purchase_property",
  zr: "push_click",
  be: "custom_event",
  sc: "custom_event_property",
  Kr: "iam_click",
  ks: "test"
}),
  (ri.tc = {}),
  (ri.tc[ri.rc.OPEN] = tt.OPEN),
  (ri.tc[ri.rc.Rr] = tt.Rr),
  (ri.tc[ri.rc.ac] = tt.Rr),
  (ri.tc[ri.rc.zr] = tt.zr),
  (ri.tc[ri.rc.be] = tt.be),
  (ri.tc[ri.rc.sc] = tt.be),
  (ri.tc[ri.rc.Kr] = tt.Kr),
  (ri.tc[ri.rc.ks] = tt.ks);

class mt {
  constructor(t, i, s, e, r, l, o, n, h, a, u, d) {
    (this.id = t),
      (this.Du = i || []),
      void 0 === s && (s = null),
      (this.startTime = s),
      void 0 === e && (e = null),
      (this.endTime = e),
      (this.priority = r || 0),
      (this.type = l),
      (this.Pu = n || 0),
      null == a && (a = 1e3 * (this.Pu + 30)),
      (this.Jr = a),
      (this.data = o),
      null == h && (h = mt.vu),
      (this.zu = h),
      (this.Iu = u),
      (this.$u = d || null);
  }
  xu(t) {
    return (
      null == this.$u || (this.zu !== mt.vu && t - this.$u >= 1e3 * this.zu)
    );
  }
  Bu(t) {
    this.$u = t;
  }
  Cu(t) {
    const i = t + 1e3 * this.Pu;
    return Math.max(i - new Date().valueOf(), 0);
  }
  Hu(t) {
    const i = new Date().valueOf() - t,
      s = null == t || isNaN(i) || null == this.Jr || i < this.Jr;
    return (
      s ||
        r$1.j.info(
          `Trigger action ${this.type} is no longer eligible for display - fired ${i}ms ago and has a timeout of ${this.Jr}ms.`
        ),
      !s
    );
  }
  static fromJson(t) {
    const i = t.id,
      s = [];
    for (let i = 0; i < t.trigger_condition.length; i++)
      s.push(ri.fromJson(t.trigger_condition[i]));
    const e = dateFromUnixTimestamp(t.start_time),
      r = dateFromUnixTimestamp(t.end_time),
      o = t.priority,
      n = t.type,
      h = t.delay,
      a = t.re_eligibility,
      u = t.timeout,
      d = t.data,
      m = t.min_seconds_since_last_trigger;
    return validateValueIsFromEnum(
      mt._r,
      n,
      "Could not construct Trigger from server data",
      "Trigger.Types"
    )
      ? new mt(i, s, e, r, o, n, d, h, a, u, m)
      : null;
  }
  ss() {
    const t = [];
    for (let i = 0; i < this.Du.length; i++) t.push(this.Du[i].ss());
    return {
      i: this.id,
      c: t,
      s: this.startTime,
      e: this.endTime,
      p: this.priority,
      t: this.type,
      da: this.data,
      d: this.Pu,
      r: this.zu,
      tm: this.Jr,
      ss: this.Iu,
      ld: this.$u
    };
  }
  static Tn(t) {
    const i = [];
    for (let s = 0; s < t.c.length; s++) i.push(ri.Tn(t.c[s]));
    return new mt(
      t.i,
      i,
      rehydrateDateAfterJsonization(t.s),
      rehydrateDateAfterJsonization(t.e),
      t.p,
      t.t,
      t.da,
      t.d,
      t.r,
      t.tm,
      t.ss,
      t.ld
    );
  }
}
(mt.vu = -1), (mt._r = { Mr: "inapp", Ju: "templated_iam" });

class aa {
  constructor(t, s, i, r) {
    (this.gt = t),
      (this._e = s),
      (this.u = i),
      (this.ft = r),
      (this.gt = t),
      (this._e = s),
      (this.u = i),
      (this.ft = r),
      (this.Se = new E()),
      e.jt(this.Se),
      (this.Oe = 1e3),
      (this.Re = 6e4),
      (this.Qe = null);
  }
  Ue() {
    return this.Se;
  }
  Ve(t) {
    return this.Se.lt(t);
  }
  We() {
    return this.Qe;
  }
  Xe(t) {
    this.Qe = t;
  }
  Ye(e, i) {
    if (!e) return new t();
    if (
      !validateValueIsFromEnum(
        InAppMessage.Me,
        i,
        `${i} is not a valid in-app message display failure`,
        "InAppMessage.DisplayFailures"
      )
    )
      return new t();
    const n = { trigger_ids: [e], error_code: i };
    return s$1.N(r$1.q.Ze, n);
  }
  N(e, i, n, o) {
    const a = new t();
    let l;
    if (e instanceof ControlMessage) l = { trigger_ids: [e.triggerId] };
    else {
      if (i === r$1.q.Ii || (e instanceof HtmlMessage && i === r$1.q.Mi)) {
        if (!e.p(o))
          return (
            r$1.j.info(
              "This in-app message has already received a click. Ignoring analytics event."
            ),
            a
          );
      } else if (i === r$1.q._i) {
        if (!e.M())
          return (
            r$1.j.info(
              "This in-app message has already received an impression. Ignoring analytics event."
            ),
            a
          );
      }
      l = this.Gi(e);
    }
    return null == l ? a : (null != n && (l.bid = n), s$1.N(i, l));
  }
  Oi(e, i) {
    const n = new t();
    if (!e.p())
      return (
        r$1.j.info(
          "This in-app message button has already received a click. Ignoring analytics event."
        ),
        n
      );
    const o = this.Gi(i);
    return null == o
      ? n
      : e.id === InAppMessageButton.Pi
      ? (r$1.j.info(
          "This in-app message button does not have a tracking id. Not logging event to Braze servers."
        ),
        n)
      : (null != e.id && (o.bid = e.id), s$1.N(r$1.q.Mi, o));
  }
  Hi(t) {
    if (!(t instanceof InAppMessage)) return;
    const s = t => {
        if (!t) return;
        const s = getDecodedBrazeAction(t);
        return containsUnknownBrazeAction(s)
          ? ineligibleBrazeActionURLErrorMessage(INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Ji, "In-App Message")
          : containsPushPrimerBrazeAction(s) && !yt$1.Ki()
          ? ineligibleBrazeActionURLErrorMessage(INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Li, "In-App Message")
          : void 0;
      },
      e = t.buttons || [];
    let i;
    for (const t of e)
      if (
        t.clickAction === InAppMessage.ClickAction.URI &&
        t.uri &&
        BRAZE_ACTION_URI_REGEX.test(t.uri) &&
        ((i = s(t.uri)), i)
      )
        return i;
    return t.clickAction === InAppMessage.ClickAction.URI &&
      t.uri &&
      BRAZE_ACTION_URI_REGEX.test(t.uri)
      ? s(t.uri)
      : void 0;
  }
  Qi(t, s, e, i) {
    if (!this.gt) return;
    const n = this.gt.Vi(!1, !1),
      o = this.gt.Gs(n);
    (o.template = { trigger_id: t.triggerId, trigger_event_type: s }),
      null != e && (o.template.data = e.Wi());
    const a = this.gt.Ks(o, T.Qs.Xi);
    this.gt.Vs(o, () => {
      this.gt &&
        (T.Xs(this.u, T.Qs.Xi, new Date().valueOf()),
        C.Ys({
          url: `${this.gt.Zs()}/template/`,
          data: o,
          headers: a,
          O: s => {
            if (!this.gt.ti(o, s, a))
              return (
                this.Ye(t.triggerId, InAppMessage.Me.Yi),
                void ("function" == typeof t.Zi && t.Zi())
              );
            if ((this.gt.si(), null == s || null == s.templated_message))
              return void this.Ye(t.triggerId, InAppMessage.Me.Yi);
            const e = s.templated_message;
            if (e.type !== mt._r.Mr)
              return void this.Ye(t.triggerId, InAppMessage.Me.Gr);
            const i = newInAppMessageFromJson(e.data);
            if (null == i) return void this.Ye(t.triggerId, InAppMessage.Me.Gr);
            const n = this.Hi(i);
            if (n)
              return r$1.j.error(n), void ("function" == typeof t.Zi && t.Zi());
            "function" == typeof t.Or
              ? t.Or(i)
              : this.Ye(t.triggerId, InAppMessage.Me.Yi);
          },
          error: r => {
            let n = `getting user personalization for message ${t.triggerId}`;
            if (new Date().valueOf() - t.Hr > t.Jr)
              this.Ye(t.triggerId, InAppMessage.Me.Yi);
            else {
              const r = Math.min(t.Jr, this.Re),
                o = this.Oe;
              null == i && (i = o);
              const a = Math.min(r, randomInclusive(o, 3 * i));
              (n += `. Retrying in ${a} ms`),
                setTimeout(() => {
                  this.Qi(t, s, e, a);
                }, a);
            }
            this.gt.ii(r, n);
          }
        }));
    });
  }
  Gi(t) {
    if (null == t.triggerId)
      return (
        r$1.j.info(
          "The in-app message has no analytics id. Not logging event to Braze servers."
        ),
        null
      );
    const s = {};
    return null != t.triggerId && (s.trigger_ids = [t.triggerId]), s;
  }
}

const ea = {
  i: null,
  t: !1,
  m: () => (
    ea.o(), ea.i || (ea.i = new aa(e.ar(), e.aa(), e.l(), e.ir())), ea.i
  ),
  o: () => {
    ea.t || (e.g(ea), (ea.t = !0));
  },
  destroy: () => {
    (ea.i = null), (ea.t = !1);
  }
};
var ea$1 = ea;

function attachCSS(n, t, o) {
  const c = n || document.querySelector("head"),
    s = `ab-${t}-css-definitions-${"4.8.0".replace(/\./g, "-")}`,
    a = c.ownerDocument || document;
  if (null == a.getElementById(s)) {
    const n = a.createElement("style");
    (n.innerHTML = o), (n.id = s);
    const t = e.nn(L.lo);
    null != t && n.setAttribute("nonce", t), c.appendChild(n);
  }
}

function loadFontAwesome() {
  if (e.nn(L.Lo)) return;
  const t = "https://use.fontawesome.com/7f85a56ba4.css";
  if (
    !(null !== document.querySelector('link[rel=stylesheet][href="' + t + '"]'))
  ) {
    const e = document.createElement("link");
    e.setAttribute("rel", "stylesheet"),
      e.setAttribute("href", t),
      document.getElementsByTagName("head")[0].appendChild(e);
  }
}

function attachFeedCSS(t) {
  attachCSS(
    t,
    "feed",
    "body>.ab-feed{position:fixed;top:0;right:0;bottom:0;width:421px;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0}body>.ab-feed .ab-feed-body{position:absolute;top:0;left:0;right:0;border:none;border-left:1px solid #d0d0d0;padding-top:70px;min-height:100%}body>.ab-feed .ab-initial-spinner{float:none}body>.ab-feed .ab-no-cards-message{position:absolute;width:100%;margin-left:-20px;top:40%}.ab-feed{-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-box-shadow:0 1px 7px 1px rgba(66,82,113,.15);-moz-box-shadow:0 1px 7px 1px rgba(66,82,113,.15);box-shadow:0 1px 7px 1px rgba(66,82,113,.15);width:402px;background-color:#eee;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;font-size:13px;line-height:130%;letter-spacing:normal;overflow-y:auto;overflow-x:visible;z-index:9011;-webkit-overflow-scrolling:touch}.ab-feed :focus,.ab-feed:focus{outline:0}.ab-feed .ab-feed-body{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;border:1px solid #d0d0d0;border-top:none;padding:20px 20px 0 20px}.ab-feed.ab-effect-slide{-webkit-transform:translateX(450px);-moz-transform:translateX(450px);-ms-transform:translateX(450px);transform:translateX(450px);-webkit-transition:transform .5s ease-in-out;-moz-transition:transform .5s ease-in-out;-o-transition:transform .5s ease-in-out;transition:transform .5s ease-in-out}.ab-feed.ab-effect-slide.ab-show{-webkit-transform:translateX(0);-moz-transform:translateX(0);-ms-transform:translateX(0);transform:translateX(0)}.ab-feed.ab-effect-slide.ab-hide{-webkit-transform:translateX(450px);-moz-transform:translateX(450px);-ms-transform:translateX(450px);transform:translateX(450px)}.ab-feed .ab-card{position:relative;-webkit-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);-moz-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);box-shadow:0 2px 3px 0 rgba(178,178,178,.5);-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;width:100%;border:1px solid #d0d0d0;margin-bottom:20px;overflow:hidden;background-color:#fff;-webkit-transition:height .4s ease-in-out,margin .4s ease-in-out;-moz-transition:height .4s ease-in-out,margin .4s ease-in-out;-o-transition:height .4s ease-in-out,margin .4s ease-in-out;transition:height .4s ease-in-out,margin .4s ease-in-out}.ab-feed .ab-card .ab-pinned-indicator{position:absolute;right:0;top:0;margin-right:-1px;width:0;height:0;border-style:solid;border-width:0 24px 24px 0;border-color:transparent #1676d0 transparent transparent}.ab-feed .ab-card .ab-pinned-indicator .fa-star{position:absolute;right:-21px;top:2px;font-size:9px;color:#fff}.ab-feed .ab-card.ab-effect-card.ab-hide{-webkit-transition:all .5s ease-in-out;-moz-transition:all .5s ease-in-out;-o-transition:all .5s ease-in-out;transition:all .5s ease-in-out}.ab-feed .ab-card.ab-effect-card.ab-hide.ab-swiped-left{-webkit-transform:translateX(-450px);-moz-transform:translateX(-450px);-ms-transform:translateX(-450px);transform:translateX(-450px)}.ab-feed .ab-card.ab-effect-card.ab-hide.ab-swiped-right{-webkit-transform:translateX(450px);-moz-transform:translateX(450px);-ms-transform:translateX(450px);transform:translateX(450px)}.ab-feed .ab-card.ab-effect-card.ab-hide:not(.ab-swiped-left):not(.ab-swiped-right){opacity:0}.ab-feed .ab-card .ab-close-button{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;background-color:transparent;background-size:15px;border:none;width:15px;min-width:15px;height:15px;cursor:pointer;display:block;font-size:15px;line-height:0;padding-top:15px;padding-right:15px;padding-left:15px;padding-bottom:15px;position:absolute;right:0;top:0;z-index:9021;opacity:0;-webkit-transition:.5s;-moz-transition:.5s;-o-transition:.5s;transition:.5s}.ab-feed .ab-card .ab-close-button svg{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;fill:#9b9b9b;height:auto;width:100%}.ab-feed .ab-card .ab-close-button svg.ab-chevron{display:none}.ab-feed .ab-card .ab-close-button:active{background-color:transparent}.ab-feed .ab-card .ab-close-button:focus{background-color:transparent}.ab-feed .ab-card .ab-close-button:hover{background-color:transparent}.ab-feed .ab-card .ab-close-button:hover svg{fill-opacity:.8}.ab-feed .ab-card .ab-close-button:hover{opacity:1}.ab-feed .ab-card .ab-close-button:focus{opacity:1}.ab-feed .ab-card a{float:none;color:inherit;text-decoration:none}.ab-feed .ab-card a:hover{text-decoration:underline}.ab-feed .ab-card .ab-image-area{float:none;display:inline-block;vertical-align:top;line-height:0;overflow:hidden;width:100%;-webkit-box-sizing:initial;-moz-box-sizing:initial;box-sizing:initial}.ab-feed .ab-card .ab-image-area img{float:none;height:auto;width:100%}.ab-feed .ab-card.ab-banner .ab-card-body{display:none}.ab-feed .ab-card .ab-card-body{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:inline-block;width:100%;position:relative}.ab-feed .ab-card .ab-unread-indicator{position:absolute;bottom:0;margin-right:-1px;width:100%;height:5px;background-color:#1676d0}.ab-feed .ab-card .ab-unread-indicator.read{background-color:transparent}.ab-feed .ab-card .ab-title{float:none;letter-spacing:0;margin:0;font-weight:700;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;display:block;overflow:hidden;word-wrap:break-word;text-overflow:ellipsis;font-size:18px;line-height:130%;padding:20px 25px 0 25px}.ab-feed .ab-card .ab-description{float:none;color:#545454;padding:15px 25px 20px 25px;word-wrap:break-word;white-space:pre-wrap}.ab-feed .ab-card .ab-description.ab-no-title{padding-top:20px}.ab-feed .ab-card .ab-url-area{float:none;color:#1676d0;margin-top:12px;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif}.ab-feed .ab-card.ab-classic-card .ab-card-body{min-height:40px;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px}.ab-feed .ab-card.ab-classic-card.with-image .ab-card-body{min-height:100px;padding-left:72px}.ab-feed .ab-card.ab-classic-card.with-image .ab-image-area{width:60px;height:60px;padding:20px 0 25px 25px;position:absolute}.ab-feed .ab-card.ab-classic-card.with-image .ab-image-area img{-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;max-width:100%;max-height:100%;width:auto;height:auto}.ab-feed .ab-card.ab-classic-card.with-image .ab-title{background-color:transparent;font-size:16px}.ab-feed .ab-card.ab-classic-card.with-image .ab-description{padding-top:10px}.ab-feed .ab-card.ab-control-card{height:0;width:0;margin:0;border:0}.ab-feed .ab-feed-buttons-wrapper{float:none;position:relative;background-color:#282828;height:50px;-webkit-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);-moz-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);box-shadow:0 2px 3px 0 rgba(178,178,178,.5);z-index:1}.ab-feed .ab-feed-buttons-wrapper .ab-close-button,.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button{float:none;cursor:pointer;color:#fff;font-size:18px;padding:16px;-webkit-transition:.2s;-moz-transition:.2s;-o-transition:.2s;transition:.2s}.ab-feed .ab-feed-buttons-wrapper .ab-close-button:hover,.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button:hover{font-size:22px}.ab-feed .ab-feed-buttons-wrapper .ab-close-button{float:right}.ab-feed .ab-feed-buttons-wrapper .ab-close-button:hover{padding-top:12px;padding-right:14px}.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button{padding-left:17px}.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button:hover{padding-top:13px;padding-left:14px}.ab-feed .ab-no-cards-message{text-align:center;margin-bottom:20px}@media (max-width:600px){body>.ab-feed{width:100%}}"
  );
}
function setupFeedUI() {
  attachFeedCSS(), loadFontAwesome();
}

function attachInAppMessageCSS(t) {
  attachCSS(
    t,
    "iam",
    ".ab-pause-scrolling,body.ab-pause-scrolling,html.ab-pause-scrolling{overflow:hidden;touch-action:none}.ab-iam-root.v3{position:fixed;top:0;right:0;bottom:0;left:0;pointer-events:none;z-index:9011;-webkit-tap-highlight-color:transparent}.ab-iam-root.v3:focus{outline:0}.ab-iam-root.v3.ab-effect-fullscreen,.ab-iam-root.v3.ab-effect-html,.ab-iam-root.v3.ab-effect-modal{opacity:0}.ab-iam-root.v3.ab-effect-fullscreen.ab-show,.ab-iam-root.v3.ab-effect-html.ab-show,.ab-iam-root.v3.ab-effect-modal.ab-show{opacity:1}.ab-iam-root.v3.ab-effect-fullscreen.ab-show.ab-animate-in,.ab-iam-root.v3.ab-effect-html.ab-show.ab-animate-in,.ab-iam-root.v3.ab-effect-modal.ab-show.ab-animate-in{-webkit-transition:opacity .5s;-moz-transition:opacity .5s;-o-transition:opacity .5s;transition:opacity .5s}.ab-iam-root.v3.ab-effect-fullscreen.ab-hide,.ab-iam-root.v3.ab-effect-html.ab-hide,.ab-iam-root.v3.ab-effect-modal.ab-hide{opacity:0}.ab-iam-root.v3.ab-effect-fullscreen.ab-hide.ab-animate-out,.ab-iam-root.v3.ab-effect-html.ab-hide.ab-animate-out,.ab-iam-root.v3.ab-effect-modal.ab-hide.ab-animate-out{-webkit-transition:opacity .5s;-moz-transition:opacity .5s;-o-transition:opacity .5s;transition:opacity .5s}.ab-iam-root.v3.ab-effect-slide .ab-in-app-message{-webkit-transform:translateX(535px);-moz-transform:translateX(535px);-ms-transform:translateX(535px);transform:translateX(535px)}.ab-iam-root.v3.ab-effect-slide.ab-show .ab-in-app-message{-webkit-transform:translateX(0);-moz-transform:translateX(0);-ms-transform:translateX(0);transform:translateX(0)}.ab-iam-root.v3.ab-effect-slide.ab-show.ab-animate-in .ab-in-app-message{-webkit-transition:transform .5s ease-in-out;-moz-transition:transform .5s ease-in-out;-o-transition:transform .5s ease-in-out;transition:transform .5s ease-in-out}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message{-webkit-transform:translateX(535px);-moz-transform:translateX(535px);-ms-transform:translateX(535px);transform:translateX(535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message.ab-swiped-left{-webkit-transform:translateX(-535px);-moz-transform:translateX(-535px);-ms-transform:translateX(-535px);transform:translateX(-535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message.ab-swiped-up{-webkit-transform:translateY(-535px);-moz-transform:translateY(-535px);-ms-transform:translateY(-535px);transform:translateY(-535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message.ab-swiped-down{-webkit-transform:translateY(535px);-moz-transform:translateY(535px);-ms-transform:translateY(535px);transform:translateY(535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide.ab-animate-out .ab-in-app-message{-webkit-transition:transform .5s ease-in-out;-moz-transition:transform .5s ease-in-out;-o-transition:transform .5s ease-in-out;transition:transform .5s ease-in-out}.ab-iam-root.v3 .ab-ios-scroll-wrapper{position:fixed;top:0;right:0;bottom:0;left:0;overflow:auto;pointer-events:all;touch-action:auto;-webkit-overflow-scrolling:touch}.ab-iam-root.v3 .ab-in-app-message{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:fixed;text-align:center;-webkit-box-shadow:0 0 4px rgba(0,0,0,.3);-moz-box-shadow:0 0 4px rgba(0,0,0,.3);box-shadow:0 0 4px rgba(0,0,0,.3);line-height:normal;letter-spacing:normal;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;z-index:9011;max-width:100%;overflow:hidden;display:inline-block;pointer-events:all;color:#333}.ab-iam-root.v3 .ab-in-app-message.ab-no-shadow{-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none}.ab-iam-root.v3 .ab-in-app-message :focus,.ab-iam-root.v3 .ab-in-app-message:focus{outline:0}.ab-iam-root.v3 .ab-in-app-message.ab-clickable{cursor:pointer}.ab-iam-root.v3 .ab-in-app-message.ab-background{background-color:#fff}.ab-iam-root.v3 .ab-in-app-message .ab-close-button{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;background-color:transparent;background-size:15px;border:none;width:15px;min-width:15px;height:15px;cursor:pointer;display:block;font-size:15px;line-height:0;padding-top:15px;padding-right:15px;padding-left:15px;padding-bottom:15px;position:absolute;right:0;top:0;z-index:9021}.ab-iam-root.v3 .ab-in-app-message .ab-close-button svg{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;fill:#9b9b9b;height:auto;width:100%}.ab-iam-root.v3 .ab-in-app-message .ab-close-button svg.ab-chevron{display:none}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:active{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:focus{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:hover{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:hover svg{fill-opacity:.8}.ab-iam-root.v3 .ab-in-app-message .ab-message-text{float:none;line-height:1.5;margin:20px 25px;max-width:100%;overflow:hidden;overflow-y:auto;vertical-align:text-bottom;word-wrap:break-word;white-space:pre-wrap;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif}.ab-iam-root.v3 .ab-in-app-message .ab-message-text.start-aligned{text-align:start}.ab-iam-root.v3 .ab-in-app-message .ab-message-text.end-aligned{text-align:end}.ab-iam-root.v3 .ab-in-app-message .ab-message-text.center-aligned{text-align:center}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar{-webkit-appearance:none;width:14px}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar-thumb{-webkit-appearance:none;border:4px solid transparent;background-clip:padding-box;-webkit-border-radius:7px;-moz-border-radius:7px;border-radius:7px;background-color:rgba(0,0,0,.2)}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar-button{width:0;height:0;display:none}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar-corner{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-message-header{float:none;letter-spacing:0;margin:0;font-weight:700;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;display:block;font-size:20px;margin-bottom:10px;line-height:1.3}.ab-iam-root.v3 .ab-in-app-message .ab-message-header.start-aligned{text-align:start}.ab-iam-root.v3 .ab-in-app-message .ab-message-header.end-aligned{text-align:end}.ab-iam-root.v3 .ab-in-app-message .ab-message-header.center-aligned{text-align:center}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen,.ab-iam-root.v3 .ab-in-app-message.ab-modal,.ab-iam-root.v3 .ab-in-app-message.ab-slideup{-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;cursor:pointer;overflow:hidden;word-wrap:break-word;text-overflow:ellipsis;font-size:14px;font-weight:700;margin:20px;margin-top:calc(constant(safe-area-inset-top,0) + 20px);margin-right:calc(constant(safe-area-inset-right,0) + 20px);margin-bottom:calc(constant(safe-area-inset-bottom,0) + 20px);margin-left:calc(constant(safe-area-inset-left,0) + 20px);margin-top:calc(env(safe-area-inset-top,0) + 20px);margin-right:calc(env(safe-area-inset-right,0) + 20px);margin-bottom:calc(env(safe-area-inset-bottom,0) + 20px);margin-left:calc(env(safe-area-inset-left,0) + 20px);max-height:150px;padding:10px;right:0;background-color:#efefef}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone{max-height:66px;margin:10px;margin-top:calc(constant(safe-area-inset-top,0) + 10px);margin-right:calc(constant(safe-area-inset-right,0) + 10px);margin-bottom:calc(constant(safe-area-inset-bottom,0) + 10px);margin-left:calc(constant(safe-area-inset-left,0) + 10px);margin-top:calc(env(safe-area-inset-top,0) + 10px);margin-right:calc(env(safe-area-inset-right,0) + 10px);margin-bottom:calc(env(safe-area-inset-bottom,0) + 10px);margin-left:calc(env(safe-area-inset-left,0) + 10px);max-width:90%;max-width:calc(100% - 40px);min-width:90%;min-width:calc(100% - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-close-button{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-close-button svg:not(.ab-chevron){display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone.ab-clickable .ab-close-button{display:block;height:20px;padding:0 20px 0 18px;pointer-events:none;top:50%;-webkit-transform:translateY(-50%);-moz-transform:translateY(-50%);-ms-transform:translateY(-50%);transform:translateY(-50%);width:12px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone.ab-clickable .ab-close-button svg.ab-chevron{display:inline}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone.ab-clickable .ab-message-text{border-right-width:40px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text{max-width:100%;border-right-width:10px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text span{max-height:66px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text.ab-with-icon,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text.ab-with-image{max-width:80%;max-width:calc(100% - 50px - 5px - 10px - 25px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-image-area{width:50px;height:50px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-image-area img{max-width:100%;max-height:100%;width:auto;height:auto}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:active .ab-message-text,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:focus .ab-message-text,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:hover .ab-message-text{opacity:.8}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:active .ab-close-button svg.ab-chevron,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:focus .ab-close-button svg.ab-chevron,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:hover .ab-close-button svg.ab-chevron{fill-opacity:.8}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:table-cell;border-color:transparent;border-style:solid;border-width:5px 25px 5px 10px;max-width:430px;vertical-align:middle;margin:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text span{display:block;max-height:150px;overflow:auto}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-icon,.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-image{max-width:365px;border-top:0;border-bottom:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;background-color:transparent;background-size:15px;border:none;width:15px;min-width:15px;height:15px;cursor:pointer;display:block;font-size:15px;line-height:0;padding-top:15px;padding-right:15px;padding-left:15px;padding-bottom:15px;position:absolute;right:0;top:0;z-index:9021}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button svg{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;fill:#9b9b9b;height:auto;width:100%}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button svg.ab-chevron{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:active{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:focus{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:hover{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:hover svg{fill-opacity:.8}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area{float:none;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:table-cell;border-color:transparent;border-style:solid;border-width:5px 0 5px 5px;vertical-align:top;width:60px;margin:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area.ab-icon-area{width:auto}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area img{float:none;width:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen,.ab-iam-root.v3 .ab-in-app-message.ab-modal{font-size:14px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area{float:none;position:relative;display:block;overflow:hidden}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area .ab-center-cropped-img,.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area .ab-center-cropped-img{background-size:cover;background-repeat:no-repeat;background-position:50% 50%;position:absolute;top:0;right:0;bottom:0;left:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-icon,.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-icon{margin-top:20px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic{padding:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-message-text,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-message-text{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-message-buttons,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-message-buttons{bottom:0;left:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area{float:none;height:auto;margin:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-image-area img,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area img{display:block;top:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none}.ab-iam-root.v3 .ab-in-app-message.ab-modal{padding-top:20px;width:450px;max-width:450px;max-height:720px}.ab-iam-root.v3 .ab-in-app-message.ab-modal.simulate-phone{max-width:91%;max-width:calc(100% - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal.simulate-phone.graphic .ab-image-area img{max-width:91vw;max-width:calc(100vw - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text{max-height:660px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-image{max-height:524.82758621px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-icon{max-height:610px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-buttons{margin-bottom:93px;max-height:587px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-buttons.ab-with-image{max-height:451.82758621px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-buttons.ab-with-icon{max-height:537px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area{margin-top:-20px;max-height:155.17241379px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area img{max-width:100%;max-height:155.17241379px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area.ab-icon-area{height:auto}.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic{width:auto;overflow:hidden}.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area{display:inline}.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area img{width:auto;max-height:720px;max-width:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen{width:450px;max-height:720px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape{width:720px;max-height:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape .ab-image-area{height:225px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape.graphic .ab-image-area{height:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape .ab-message-text{max-height:112px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-message-text{max-height:247px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-message-text.ab-with-buttons{margin-bottom:93px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area{height:360px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-image-area{height:720px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone{-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone:not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone:not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-html-message{background-color:transparent;border:none;height:100%;overflow:auto;position:relative;touch-action:auto;width:100%}.ab-iam-root.v3 .ab-in-app-message .ab-message-buttons{position:absolute;bottom:0;width:100%;padding:17px 25px 30px 25px;z-index:inherit;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.ab-iam-root.v3 .ab-in-app-message .ab-message-button{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-border-radius:5px;-moz-border-radius:5px;border-radius:5px;-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none;cursor:pointer;display:inline-block;font-size:14px;font-weight:700;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;height:44px;line-height:normal;letter-spacing:normal;margin:0;max-width:100%;min-width:80px;padding:0 12px;position:relative;text-transform:none;width:48%;width:calc(50% - 5px);border:1px solid #1b78cf;-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;overflow:hidden;word-wrap:break-word;text-overflow:ellipsis;word-wrap:normal;white-space:nowrap}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:first-of-type{float:left;background-color:#fff;color:#1b78cf}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:last-of-type{float:right;background-color:#1b78cf;color:#fff}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:first-of-type:last-of-type{float:none;width:auto}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:after{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:hover{opacity:.8}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:active:after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.08)}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:focus:after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.15)}.ab-iam-root.v3 .ab-in-app-message .ab-message-button a{color:inherit;text-decoration:inherit}.ab-iam-root.v3 .ab-in-app-message img{float:none;display:inline-block}.ab-iam-root.v3 .ab-in-app-message .ab-icon{float:none;display:inline-block;padding:10px;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px}.ab-iam-root.v3 .ab-in-app-message .ab-icon .fa{float:none;font-size:30px;width:30px}.ab-iam-root.v3 .ab-start-hidden{visibility:hidden}.ab-iam-root.v3 .ab-centered{margin:auto;position:absolute;top:50%;left:50%;-webkit-transform:translate(-50%,-50%);-moz-transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);transform:translate(-50%,-50%)}.ab-iam-root.v3{-webkit-border-radius:0;-moz-border-radius:0;border-radius:0}.ab-iam-root.v3 .ab-page-blocker{position:fixed;top:0;left:0;width:100%;height:100%;z-index:9001;pointer-events:all;background-color:rgba(51,51,51,.75)}@media (max-width:600px){.ab-iam-root.v3 .ab-in-app-message.ab-slideup{max-height:66px;margin:10px;margin-top:calc(constant(safe-area-inset-top,0) + 10px);margin-right:calc(constant(safe-area-inset-right,0) + 10px);margin-bottom:calc(constant(safe-area-inset-bottom,0) + 10px);margin-left:calc(constant(safe-area-inset-left,0) + 10px);margin-top:calc(env(safe-area-inset-top,0) + 10px);margin-right:calc(env(safe-area-inset-right,0) + 10px);margin-bottom:calc(env(safe-area-inset-bottom,0) + 10px);margin-left:calc(env(safe-area-inset-left,0) + 10px);max-width:90%;max-width:calc(100% - 40px);min-width:90%;min-width:calc(100% - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button svg:not(.ab-chevron){display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable .ab-close-button{display:block;height:20px;padding:0 20px 0 18px;pointer-events:none;top:50%;-webkit-transform:translateY(-50%);-moz-transform:translateY(-50%);-ms-transform:translateY(-50%);transform:translateY(-50%);width:12px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable .ab-close-button svg.ab-chevron{display:inline}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable .ab-message-text{border-right-width:40px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text{max-width:100%;border-right-width:10px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text span{max-height:66px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-icon,.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-image{max-width:80%;max-width:calc(100% - 50px - 5px - 10px - 25px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area{width:50px;height:50px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area img{max-width:100%;max-height:100%;width:auto;height:auto}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape{-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-close-button,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen .ab-image-area,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-image-area,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen .ab-message-text,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen .ab-message-text.ab-with-buttons,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-message-text.ab-with-buttons,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape:not(.graphic),.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen:not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape:not(.graphic) .ab-message-buttons,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen:not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.graphic,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.graphic{display:block}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.graphic .ab-image-area,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.graphic .ab-message-button,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}@media (max-width:480px){.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop){max-width:91%;max-width:calc(100% - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop).graphic .ab-image-area img{max-width:91vw;max-width:calc(100vw - 30px)}}@media (max-height:750px){.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop){max-height:91%;max-height:calc(100% - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop).graphic .ab-image-area img{max-height:91vh;max-height:calc(100vh - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text{max-height:65vh;max-height:calc(100vh - 30px - 60px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-image{max-height:45vh;max-height:calc(100vh - 30px - 155.17241379310346px - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-icon{max-height:45vh;max-height:calc(100vh - 30px - 70px - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-buttons{max-height:50vh;max-height:calc(100vh - 30px - 93px - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-buttons.ab-with-image{max-height:30vh;max-height:calc(100vh - 30px - 155.17241379310346px - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-buttons.ab-with-icon{max-height:30vh;max-height:calc(100vh - 30px - 70px - 93px - 20px)}}@media (min-width:601px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area img{max-height:100%;max-width:100%}}@media (max-height:750px) and (min-width:601px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop){-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important;width:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop) .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop) .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop) .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop):not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop):not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}@media (max-height:480px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop){-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}@media (max-width:750px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop){-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}"
  );
}
function setupInAppMessageUI() {
  attachInAppMessageCSS(), loadFontAwesome();
}

function se(e) {
  let s = "";
  return (
    e.animateIn && (s += " ab-animate-in"),
    e.animateOut && (s += " ab-animate-out"),
    e instanceof FullScreenMessage
      ? (s += " ab-effect-fullscreen")
      : e instanceof HtmlMessage
      ? (s += " ab-effect-html")
      : e instanceof ModalMessage
      ? (s += " ab-effect-modal")
      : e instanceof SlideUpMessage && (s += " ab-effect-slide"),
    s
  );
}

function createCloseButton(t, o, e) {
  const n = document.createElement("button");
  n.setAttribute("aria-label", t),
    n.setAttribute("tabindex", "0"),
    n.setAttribute("role", "button"),
    addPassiveEventListener(n, "touchstart"),
    (n.className = "ab-close-button");
  const r = buildSvg(
    "0 0 15 15",
    "M15 1.5L13.5 0l-6 6-6-6L0 1.5l6 6-6 6L1.5 15l6-6 6 6 1.5-1.5-6-6 6-6z",
    o
  );
  return (
    n.appendChild(r),
    n.addEventListener("keydown", t => {
      (t.keyCode !== KeyCodes.yo && t.keyCode !== KeyCodes.Fo) ||
        (e(), t.stopPropagation());
    }),
    (n.onclick = t => {
      e(), t.stopPropagation();
    }),
    n
  );
}

function isTransparent(r) {
  return (r = parseInt(r)), !isNaN(r) && (4278190080 & r) >>> 24 == 0;
}
function toRgba(r, t) {
  if (((r = parseInt(r)), isNaN(r))) return "";
  (t = parseFloat(t)), isNaN(t) && (t = 1);
  const n = 255 & (r >>>= 0),
    e = (65280 & r) >>> 8,
    o = (16711680 & r) >>> 16,
    a = ((4278190080 & r) >>> 24) / 255;
  return V.Og()
    ? "rgba(" + [o, e, n, a * t].join(",") + ")"
    : "rgb(" + [o, e, n].join(",") + ")";
}

function logInAppMessageImpression(o) {
  if (!e.rr()) return !1;
  if (!(o instanceof InAppMessage || o instanceof ControlMessage))
    return r$1.j.error(MUST_BE_IN_APP_MESSAGE_WARNING), !1;
  const s = o instanceof ControlMessage ? r$1.q.ro : r$1.q._i;
  return ea$1.m().N(o, s).O;
}

function logInAppMessageClick(o) {
  if (!e.rr()) return !1;
  if (!(o instanceof InAppMessage)) return r$1.j.error(MUST_BE_IN_APP_MESSAGE_WARNING), !1;
  const s = ea$1.m().N(o, r$1.q.Ii);
  if (s) {
    o.Lr() || logInAppMessageImpression(o);
    for (let r = 0; r < s.ve.length; r++)
      TriggersProviderFactory.er().je(tt.Kr, [o.triggerId], s.ve[r]);
  }
  return s.O;
}

const ORIENTATION = { PORTRAIT: 0, LANDSCAPE: 1 };
function _isPhone() {
  return screen.width <= 600;
}
function _getOrientation() {
  if ("orientation" in window)
    return 90 === Math.abs(window.orientation) || 270 === window.orientation
      ? ORIENTATION.LANDSCAPE
      : ORIENTATION.PORTRAIT;
  if ("screen" in window) {
    let n =
      window.screen.orientation ||
      screen.mozOrientation ||
      screen.msOrientation;
    return (
      null != n && "object" == typeof n && (n = n.type),
      "landscape-primary" === n || "landscape-secondary" === n
        ? ORIENTATION.LANDSCAPE
        : ORIENTATION.PORTRAIT
    );
  }
  return ORIENTATION.PORTRAIT;
}
function _openUri(n, e, r) {
  e || (null != r && r.metaKey) ? window.open(n) : (window.location = n);
}
function _getCurrentUrl() {
  return window.location.href;
}
const WindowUtils = {
  openUri: _openUri,
  no: _isPhone,
  ao: _getOrientation,
  An: _getCurrentUrl
};

function getUser() {
  if (e.rr()) return e.jr();
}

function _handleBrazeAction(o, s, t) {
  if (e.rr())
    if (BRAZE_ACTION_URI_REGEX.test(o)) {
      const s = getDecodedBrazeAction(o);
      if (!s) return;
      const t = o => {
        if (!isValidBrazeActionJson(o))
          return void r$1.j.error(
            `Decoded Braze Action json is invalid: ${JSON.stringify(
              o,
              null,
              2
            )}`
          );
        const s = BRAZE_ACTIONS.properties.type,
          i = BRAZE_ACTIONS.properties.ce,
          n = BRAZE_ACTIONS.properties.me,
          a = o[s];
        if (a === BRAZE_ACTIONS.types.le) {
          const e = o[i];
          for (const o of e) t(o);
        } else {
          const s = o[n];
          let t, i;
          switch (a) {
            case BRAZE_ACTIONS.types.logCustomEvent:
              Promise.resolve().then(function () { return logCustomEvent$1; }).then(
                ({ logCustomEvent: logCustomEvent }) => {
                  e.ue()
                    ? ((i = Array.prototype.slice.call(s)),
                      logCustomEvent(...i))
                    : r$1.j.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
                }
              );
              break;
            case BRAZE_ACTIONS.types.requestPushPermission:
              Promise.resolve().then(function () { return requestPushPermission$1; }).then(
                ({ requestPushPermission: requestPushPermission }) => {
                  e.ue()
                    ? "Safari" === V.browser && V.OS === OperatingSystems.fe
                      ? window.navigator.standalone && requestPushPermission()
                      : requestPushPermission()
                    : r$1.j.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
                }
              );
              break;
            case BRAZE_ACTIONS.types.setEmailNotificationSubscriptionType:
            case BRAZE_ACTIONS.types.setPushNotificationSubscriptionType:
            case BRAZE_ACTIONS.types.setCustomUserAttribute:
            case BRAZE_ACTIONS.types.addToSubscriptionGroup:
            case BRAZE_ACTIONS.types.removeFromSubscriptionGroup:
            case BRAZE_ACTIONS.types.addToCustomAttributeArray:
            case BRAZE_ACTIONS.types.removeFromCustomAttributeArray:
              if (((t = getUser()), t)) {
                t[a](...Array.prototype.slice.call(s));
              }
              break;
            case BRAZE_ACTIONS.types.de:
            case BRAZE_ACTIONS.types.pe:
              (i = Array.prototype.slice.call(s)), WindowUtils.openUri(...i);
              break;
            default:
              r$1.j.info(`Ignoring unknown Braze Action: ${a}`);
          }
        }
      };
      t(s);
    } else WindowUtils.openUri(o, s, t);
}
function handleBrazeAction(e, o) {
  _handleBrazeAction(e, o);
}

function logInAppMessageHtmlClick(s, t, o) {
  if (!e.rr()) return !1;
  if (!(s instanceof HtmlMessage))
    return (
      r$1.j.error(
        "inAppMessage argument to logInAppMessageHtmlClick must be an HtmlMessage object."
      ),
      !1
    );
  let m = r$1.q.Ii;
  null != t && (m = r$1.q.Mi);
  const i = ea$1.m().N(s, m, t, o);
  if (i.O)
    for (let r = 0; r < i.ve.length; r++)
      TriggersProviderFactory.er().je(tt.Kr, [s.triggerId, t], i.ve[r]);
  return i.O;
}

function parseQueryStringKeyValues(t) {
  null == t && (t = "");
  const r = t
      .split("?")
      .slice(1)
      .join("?"),
    n = {};
  if (null != r) {
    const t = r.split("&");
    for (let r = 0; r < t.length; r++) {
      const a = t[r].split("=");
      "" !== a[0] && (n[a[0]] = a[1]);
    }
  }
  return n;
}
function isURIJavascriptOrData(t) {
  return !(
    !t ||
    (0 !== (t = t.toString().toLowerCase()).lastIndexOf("javascript:", 0) &&
      0 !== t.lastIndexOf("data:", 0))
  );
}

function at(t, o, n, s, i, u) {
  const c = document.createElement("iframe");
  c.setAttribute("title", "Modal Message"),
    i && (c.style.zIndex = (i + 1).toString());
  const a = e => {
      const o = e.getAttribute("href"),
        r = e.onclick;
      return n => {
        if (null != r && "function" == typeof r && !1 === r.bind(e)(n)) return;
        let i = parseQueryStringKeyValues(o).abButtonId;
        if (
          ((null != i && "" !== i) || (i = e.getAttribute("id") || void 0),
          null != o && "" !== o && 0 !== o.indexOf("#"))
        ) {
          const r =
              "blank" ===
              (e.getAttribute("target") || "").toLowerCase().replace("_", ""),
            u = s || t.openTarget === InAppMessage.OpenTarget.BLANK || r,
            a = () => {
              logInAppMessageHtmlClick(t, i, o), WindowUtils.openUri(o, u, n);
            };
          u ? a() : t.he(c, a);
        } else logInAppMessageHtmlClick(t, i, o || void 0);
        return n.stopPropagation(), !1;
      };
    },
    m = (t, e, o) => {
      const r = `([\\w]+)\\s*=\\s*document.createElement\\(['"]${o}['"]\\)`,
        n = t.match(new RegExp(r));
      if (n) {
        const o = `${n[1]}.setAttribute("nonce", "${e}")`;
        return `${t.slice(0, n.index + n[0].length)};${o};${t.slice(
          n.index + n[0].length
        )}`;
      }
      return null;
    };
  if (
    ((c.onload = () => {
      let s = null;
      if (null != u) {
        (s = document.createElement("html")), (s.innerHTML = t.message || "");
        const e = s.getElementsByTagName("style");
        for (let t = 0; t < e.length; t++) e[t].setAttribute("nonce", u);
        const o = s.getElementsByTagName("script");
        for (let t = 0; t < o.length; t++) {
          o[t].setAttribute("nonce", u),
            (o[t].innerHTML = o[t].innerHTML.replace(
              /<style>/g,
              `<style nonce='${u}'>`
            ));
          const e = m(o[t].innerHTML, u, "script");
          e && (o[t].innerHTML = e);
          const r = m(o[t].innerHTML, u, "style");
          r && (o[t].innerHTML = r);
        }
      }
      const i = c.contentWindow;
      i.focus(), i.document.write(s ? s.innerHTML : t.message || "");
      const l = i.document.getElementsByTagName("head")[0];
      if (null != l) {
        if ((attachInAppMessageCSS(l), t.ye())) {
          const e = document.createElement("style");
          (e.innerHTML = t.css || ""),
            (e.id = t.Ae() || ""),
            null != u && e.setAttribute("nonce", u),
            l.appendChild(e);
        }
        const e = i.document.createElement("base");
        null != e && (e.setAttribute("target", "_parent"), l.appendChild(e));
      }
      const f = i.document.getElementsByTagName("title");
      f && f.length > 0 && c.setAttribute("title", f[0].textContent || "");
      const d = {
          closeMessage: function() {
            t.he(c);
          },
          logClick: function() {
            logInAppMessageHtmlClick(t, ...arguments);
          },
          display: {},
          web: {}
        },
        requestPushPermission = function() {
          return function() {
            const t = arguments;
            Promise.resolve().then(function () { return requestPushPermission$1; }).then(o => {
              e.ue()
                ? o.requestPushPermission(...Array.prototype.slice.call(t))
                : r$1.j.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
            });
          };
        },
        p = {
          requestImmediateDataFlush: function() {
            const t = arguments;
            Promise.resolve().then(function () { return requestImmediateDataFlush$1; }).then(
              ({ requestImmediateDataFlush: requestImmediateDataFlush }) => {
                e.ue()
                  ? requestImmediateDataFlush(...Array.prototype.slice.call(t))
                  : r$1.j.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
              }
            );
          },
          logCustomEvent: function() {
            const t = arguments;
            Promise.resolve().then(function () { return logCustomEvent$1; }).then(
              ({ logCustomEvent: logCustomEvent }) => {
                if (!e.ue()) return void r$1.j.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
                logCustomEvent(...Array.prototype.slice.call(t));
              }
            );
          },
          logPurchase: function() {
            const t = arguments;
            Promise.resolve().then(function () { return logPurchase$1; }).then(
              ({ logPurchase: logPurchase }) => {
                if (!e.ue()) return void r$1.j.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
                logPurchase(...Array.prototype.slice.call(t));
              }
            );
          },
          unregisterPush: function() {
            const t = arguments;
            Promise.resolve().then(function () { return unregisterPush$1; }).then(
              ({ unregisterPush: unregisterPush }) => {
                e.ue()
                  ? unregisterPush(...Array.prototype.slice.call(t))
                  : r$1.j.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
              }
            );
          },
          requestPushPermission: requestPushPermission(),
          changeUser: function() {
            const t = arguments;
            Promise.resolve().then(function () { return changeUser$1; }).then(
              ({ changeUser: changeUser }) => {
                if (!e.ue()) return void r$1.j.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
                changeUser(...Array.prototype.slice.call(t));
              }
            );
          }
        },
        h = function(t) {
          return function() {
            p[t](...Array.prototype.slice.call(arguments));
          };
        };
      for (const t of keys(p)) d[t] = h(t);
      const b = [
          "setFirstName",
          "setLastName",
          "setEmail",
          "setGender",
          "setDateOfBirth",
          "setCountry",
          "setHomeCity",
          "setEmailNotificationSubscriptionType",
          "setLanguage",
          "addAlias",
          "setPushNotificationSubscriptionType",
          "setPhoneNumber",
          "setCustomUserAttribute",
          "addToCustomAttributeArray",
          "removeFromCustomAttributeArray",
          "incrementCustomUserAttribute",
          "setCustomLocationAttribute",
          "addToSubscriptionGroup",
          "removeFromSubscriptionGroup"
        ],
        g = function(t) {
          return function() {
            const e = getUser();
            e && e[t](...Array.prototype.slice.call(arguments));
          };
        },
        y = {};
      for (let t = 0; t < b.length; t++) y[b[t]] = g(b[t]);
      d.getUser = function() {
        return y;
      };
      const A = { showFeed: o },
        j = function(e) {
          return function() {
            const o = arguments;
            t.he(c, function() {
              A[e](...Array.prototype.slice.call(o));
            });
          };
        },
        C = d.display;
      for (const t of keys(A)) C[t] = j(t);
      const v = { registerAppboyPushMessages: requestPushPermission() },
        w = function(t) {
          return function() {
            v[t](...Array.prototype.slice.call(arguments));
          };
        },
        E = d.web;
      for (const t of keys(v)) E[t] = w(t);
      if (
        ((i.appboyBridge = d), (i.brazeBridge = d), t.Ce !== InAppMessage.Ee.Pe)
      ) {
        const t = i.document.getElementsByTagName("a");
        for (let e = 0; e < t.length; e++) t[e].onclick = a(t[e]);
        const e = i.document.getElementsByTagName("button");
        for (let t = 0; t < e.length; t++) e[t].onclick = a(e[t]);
      }
      const $ = i.document.body;
      if (null != $) {
        t.$e() && ($.id = t.htmlId || "");
        const e = document.createElement("hidden");
        (e.onclick = d.closeMessage),
          (e.className = "ab-programmatic-close-button"),
          $.appendChild(e);
      }
      i.dispatchEvent(new CustomEvent("ab.BridgeReady")),
        -1 !== c.className.indexOf("ab-start-hidden") &&
          ((c.className = c.className.replace("ab-start-hidden", "")), n(c)),
        document.activeElement !== c && c.focus();
    }),
    (c.className =
      "ab-in-app-message ab-start-hidden ab-html-message ab-modal-interactions"),
    V.OS === OperatingSystems.fe)
  ) {
    const e = document.createElement("div");
    return (
      (e.className = "ab-ios-scroll-wrapper"), e.appendChild(c), (t.qe = e), e
    );
  }
  return (t.qe = c), c;
}

function logInAppMessageButtonClick(t, o) {
  if (!e.rr()) return !1;
  if (!(t instanceof InAppMessageButton))
    return r$1.j.error("button must be an InAppMessageButton object"), !1;
  if (!(o instanceof InAppMessage)) return r$1.j.error(MUST_BE_IN_APP_MESSAGE_WARNING), !1;
  const s = ea$1.m().Oi(t, o);
  if (s.O)
    for (let r = 0; r < s.ve.length; r++)
      TriggersProviderFactory.er().je(tt.Kr, [o.triggerId, t.id], s.ve[r]);
  return s.O;
}

const le = {
  Ge: t => {
    const o = t.querySelectorAll(
      ".ab-close-button, .ab-message-text, .ab-message-button"
    );
    let e;
    for (let t = 0; t < o.length; t++) (e = o[t]), (e.tabIndex = 0);
    if (o.length > 0) {
      const e = o[0],
        s = o[o.length - 1];
      t.addEventListener("keydown", o => {
        const a = document.activeElement;
        o.keyCode === KeyCodes.oo &&
          (o.shiftKey || (a !== s && a !== t)
            ? !o.shiftKey ||
              (a !== e && a !== t) ||
              (o.preventDefault(), s.focus())
            : (o.preventDefault(), e.focus()));
      });
    }
  },
  He: (t, o) => {
    o.setAttribute("role", "dialog"),
      o.setAttribute("aria-modal", "true"),
      o.setAttribute("aria-label", "Modal Message"),
      t && o.setAttribute("aria-labelledby", t);
  },
  De: (t, o, e, s) => {
    if (t.buttons && t.buttons.length > 0) {
      const a = document.createElement("div");
      (a.className = "ab-message-buttons"), e.appendChild(a);
      const l = e.getElementsByClassName("ab-message-text")[0];
      null != l && (l.className += " ab-with-buttons");
      const n = a => l => (
        t.he(e, () => {
          logInAppMessageButtonClick(a, t),
            a.clickAction === InAppMessage.ClickAction.URI
              ? _handleBrazeAction(
                  a.uri || "",
                  s || t.openTarget === InAppMessage.OpenTarget.BLANK,
                  l
                )
              : a.clickAction === InAppMessage.ClickAction.NEWS_FEED && o();
        }),
        l.stopPropagation(),
        !1
      );
      for (let o = 0; o < t.buttons.length; o++) {
        const e = t.buttons[o],
          s = document.createElement("button");
        (s.className = "ab-message-button"),
          s.setAttribute("type", "button"),
          addPassiveEventListener(s, "touchstart");
        let l = e.text;
        "" === e.text && (l = " "),
          s.appendChild(document.createTextNode(l)),
          t.ye() ||
            ((s.style.backgroundColor = toRgba(e.backgroundColor)),
            (s.style.color = toRgba(e.textColor)),
            (s.style.borderColor = toRgba(e.borderColor))),
          (s.onclick = n(e)),
          a.appendChild(s);
      }
    }
  }
};

function ce(e, a, s, t, n, i, l) {
  if (((e.ke = document.activeElement), e instanceof HtmlMessage))
    return at(e, a, s, n, i, l);
  const u = (function(e, a, s, t, n, i) {
    const l = document.createElement("div");
    (l.className = "ab-in-app-message ab-start-hidden ab-background"),
      i && (l.style.zIndex = (i + 1).toString()),
      e.xe() &&
        ((l.className += " ab-modal-interactions"),
        l.setAttribute("tabindex", "-1")),
      e.ye() ||
        ((l.style.color = toRgba(e.textColor)),
        (l.style.backgroundColor = toRgba(e.backgroundColor)),
        isTransparent(e.backgroundColor) && (l.className += " ab-no-shadow"));
    const c = () => {
        -1 !== l.className.indexOf("ab-start-hidden") &&
          ((l.className = l.className.replace("ab-start-hidden", "")),
          document.querySelectorAll(".ab-iam-img-loading").length > 0
            ? t(
                `Cannot show in-app message ${e.message} because another message is being shown.`,
                InAppMessage.Me.ze
              )
            : s(l));
      },
      d = () => {
        const e = document.querySelectorAll(".ab-iam-root");
        e && e.length > 0 && (e[0].classList.remove("ab-iam-img-loading"), c());
      };
    e.imageStyle === InAppMessage.ImageStyle.GRAPHIC &&
      (l.className += " graphic"),
      e.orientation === InAppMessage.Orientation.LANDSCAPE &&
        (l.className += " landscape"),
      null != e.buttons &&
        0 === e.buttons.length &&
        (e.clickAction !== InAppMessage.ClickAction.NONE &&
          (l.className += " ab-clickable"),
        (l.onclick = o => (
          e.he(l, () => {
            logInAppMessageClick(e),
              e.clickAction === InAppMessage.ClickAction.URI
                ? _handleBrazeAction(
                    e.uri || "",
                    n || e.openTarget === InAppMessage.OpenTarget.BLANK,
                    o
                  )
                : e.clickAction === InAppMessage.ClickAction.NEWS_FEED && a();
          }),
          o.stopPropagation(),
          !1
        )));
    const u = createCloseButton(
      "Close Message",
      e.ye() ? void 0 : toRgba(e.closeButtonColor),
      () => {
        e.he(l);
      }
    );
    l.appendChild(u), i && (u.style.zIndex = (i + 2).toString());
    const b = document.createElement("div");
    b.className = "ab-message-text";
    const p = (e.messageAlignment || e.Le).toLowerCase();
    b.className += " " + p + "-aligned";
    let f = !1;
    const g = document.createElement("div");
    if (((g.className = "ab-image-area"), e.imageUrl)) {
      if (e.cropType === InAppMessage.CropType.CENTER_CROP) {
        const o = document.createElement("span");
        (o.className = "ab-center-cropped-img"),
          (o.style.backgroundImage = "url(" + e.imageUrl + ")"),
          o.setAttribute("role", "img"),
          o.setAttribute("aria-label", "Modal Image"),
          e.Ie(o),
          g.appendChild(o);
      } else {
        const o = document.createElement("img");
        if (
          (o.setAttribute("src", e.imageUrl),
          e.Ie(o),
          0 === document.querySelectorAll(".ab-iam-img-loading").length)
        ) {
          f = !0;
          const e = document.querySelectorAll(".ab-iam-root");
          e && e.length > 0 && e[0].classList.add("ab-iam-img-loading"),
            (o.onload = d);
        }
        setTimeout(c, 1e3), g.appendChild(o);
      }
      l.appendChild(g), (b.className += " ab-with-image");
    } else if (e.icon) {
      g.className += " ab-icon-area";
      const o = document.createElement("span");
      (o.className = "ab-icon"),
        e.ye() ||
          ((o.style.backgroundColor = toRgba(e.iconBackgroundColor)),
          (o.style.color = toRgba(e.iconColor)));
      const a = document.createElement("i");
      (a.className = "fa"),
        a.appendChild(document.createTextNode(e.icon)),
        a.setAttribute("aria-hidden", "true"),
        o.appendChild(a),
        g.appendChild(o),
        l.appendChild(g),
        (b.className += " ab-with-icon");
    }
    if ((addPassiveEventListener(b, "touchstart"), e.header && e.header.length > 0)) {
      const o = document.createElement("h1");
      (o.className = "ab-message-header"), (e.Te = r$1.Z.Y()), (o.id = e.Te);
      const a = (
        e.headerAlignment || InAppMessage.TextAlignment.CENTER
      ).toLowerCase();
      (o.className += " " + a + "-aligned"),
        e.ye() || (o.style.color = toRgba(e.headerTextColor)),
        o.appendChild(document.createTextNode(e.header)),
        b.appendChild(o);
    }
    return b.appendChild(e.Be()), l.appendChild(b), f || c(), (e.qe = l), l;
  })(e, a, s, t, n, i);
  if (e instanceof FullScreenMessage || e instanceof ModalMessage) {
    const o = e instanceof FullScreenMessage ? "ab-fullscreen" : "ab-modal";
    (u.className += ` ${o} ab-centered`),
      le.De(e, a, u, n),
      le.Ge(u),
      le.He(e.Te, u);
  } else if (e instanceof SlideUpMessage) {
    u.className += " ab-slideup";
    const o = u.getElementsByClassName("ab-close-button")[0];
    if (null != o) {
      const a = buildSvg(
        "0 0 11.38 19.44",
        "M11.38 9.72l-9.33 9.72L0 17.3l7.27-7.58L0 2.14 2.05 0l9.33 9.72z",
        e.ye() ? void 0 : toRgba(e.closeButtonColor)
      );
      a.setAttribute("class", "ab-chevron"), o.appendChild(a);
    }
    let a, s;
    detectSwipe(u, DIRECTIONS.W, e => {
      (u.className += " ab-swiped-left"),
        null != o && null != o.onclick && o.onclick(e);
    }),
      detectSwipe(u, DIRECTIONS.X, e => {
        (u.className += " ab-swiped-right"),
          null != o && null != o.onclick && o.onclick(e);
      }),
      e.slideFrom === InAppMessage.SlideFrom.TOP
        ? ((a = DIRECTIONS.Je), (s = " ab-swiped-up"))
        : ((a = DIRECTIONS.Ke), (s = " ab-swiped-down")),
      detectSwipe(u, a, e => {
        (u.className += s), null != o && null != o.onclick && o.onclick(e);
      });
  }
  return u;
}

function showInAppMessage(s, t, o) {
  if (!e.rr()) return;
  if ((setupInAppMessageUI(), null == s)) return !1;
  if (s instanceof ControlMessage)
    return (
      r$1.j.info(
        "User received control for a multivariate test, logging to Braze servers."
      ),
      logInAppMessageImpression(s),
      !0
    );
  if (!(s instanceof InAppMessage)) return !1;
  const i = ea$1.m();
  s.Ah();
  const n = s instanceof HtmlMessage;
  if (n && !s.trusted && !e.nr())
    return (
      r$1.j.error(
        'HTML in-app messages are disabled. Use the "allowUserSuppliedJavascript" option for braze.initialize to enable these messages.'
      ),
      i.Ye(s.triggerId, InAppMessage.Me.Oh),
      !1
    );
  if ((null == t && (t = document.body), s.xe())) {
    if (t.querySelectorAll(".ab-modal-interactions").length > 0)
      return (
        r$1.j.info(
          `Cannot show in-app message ${s.message} because another message is being shown.`
        ),
        i.Ye(s.triggerId, InAppMessage.Me.ze),
        !1
      );
  }
  if (WindowUtils.no()) {
    const e = WindowUtils.ao();
    if (
      (e === ORIENTATION.PORTRAIT &&
        s.orientation === InAppMessage.Orientation.LANDSCAPE) ||
      (e === ORIENTATION.LANDSCAPE &&
        s.orientation === InAppMessage.Orientation.PORTRAIT)
    ) {
      const t = e === ORIENTATION.PORTRAIT ? "portrait" : "landscape",
        o =
          s.orientation === InAppMessage.Orientation.PORTRAIT
            ? "portrait"
            : "landscape";
      return (
        r$1.j.info(
          `Not showing ${o} in-app message ${s.message} because the screen is currently ${t}`
        ),
        i.Ye(s.triggerId, InAppMessage.Me.Sh),
        !1
      );
    }
  }
  if (!e.nr()) {
    let e = !1;
    if (s.buttons && s.buttons.length > 0) {
      const t = s.buttons;
      for (let s = 0; s < t.length; s++)
        if (t[s].clickAction === InAppMessage.ClickAction.URI) {
          const o = t[s].uri;
          e = isURIJavascriptOrData(o);
        }
    } else s.clickAction === InAppMessage.ClickAction.URI && (e = isURIJavascriptOrData(s.uri));
    if (e)
      return (
        r$1.j.error(
          'Javascript click actions are disabled. Use the "allowUserSuppliedJavascript" option for braze.initialize to enable these actions.'
        ),
        i.Ye(s.triggerId, InAppMessage.Me.Oh),
        !1
      );
  }
  const a = document.createElement("div");
  if (
    ((a.className = "ab-iam-root v3"),
    (a.className += se(s)),
    a.setAttribute("role", "complementary"),
    s.$e() && (a.id = s.htmlId),
    e.nn(L.mo) && (a.style.zIndex = e.nn(L.mo) + 1),
    t.appendChild(a),
    s.ye())
  ) {
    const t = document.createElement("style");
    (t.innerHTML = s.css),
      (t.id = s.Ae()),
      null != e.nn(L.lo) && t.setAttribute("nonce", e.nn(L.lo)),
      document.getElementsByTagName("head")[0].appendChild(t);
  }
  const m = s instanceof SlideUpMessage,
    l = ce(
      s,
      () => {
        Promise.resolve().then(function () { return showFeed$1; }).then(s => {
          e.ue() ? s.showFeed() : r$1.j.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
        });
      },
      t => {
        if (s.xe() && s.io()) {
          const o = document.createElement("div");
          if (
            ((o.className = "ab-page-blocker"),
            s.ye() || (o.style.backgroundColor = toRgba(s.frameColor)),
            e.nn(L.mo) && (o.style.zIndex = e.nn(L.mo)),
            a.appendChild(o),
            !e.nn(L.Lh))
          ) {
            const e = new Date().valueOf();
            o.onclick = o => {
              new Date().valueOf() - e > InAppMessage.Uh &&
                (s.he(t), o.stopPropagation());
            };
          }
          a.appendChild(t), t.focus(), s.ah(a);
        } else if (m) {
          const e = document.querySelectorAll(".ab-slideup");
          let o = null;
          for (let s = e.length - 1; s >= 0; s--)
            if (e[s] !== t) {
              o = e[s];
              break;
            }
          if (s.slideFrom === InAppMessage.SlideFrom.TOP) {
            let e = 0;
            null != o && (e = o.offsetTop + o.offsetHeight),
              (t.style.top = Math.max(e, 0) + "px");
          } else {
            let e = 0;
            null != o &&
              (e =
                (window.innerHeight || document.documentElement.clientHeight) -
                o.offsetTop),
              (t.style.bottom = Math.max(e, 0) + "px");
          }
        } else if (n && !e.nn(L.Lh)) {
          const e = s;
          isIFrame(t) &&
            t.contentWindow &&
            t.contentWindow.addEventListener("keydown", function(s) {
              s.keyCode === KeyCodes.Ih && e.closeMessage();
            });
        }
        logInAppMessageImpression(s),
          s.dismissType === InAppMessage.DismissType.AUTO_DISMISS &&
            setTimeout(() => {
              a.contains(t) && s.he(t);
            }, s.duration),
          "function" == typeof o && o();
      },
      (e, t) => {
        r$1.j.info(e), i.Ye(s.triggerId, t);
      },
      e.nn(L.po),
      e.nn(L.mo),
      e.nn(L.lo)
    );
  return (n || m) && (a.appendChild(l), s.ah(a)), !0;
}

function subscribeToInAppMessage(n) {
  if (e.rr())
    return "function" != typeof n
      ? null
      : ea$1.m().Ve(function(r) {
          return n(r[0]), r.slice(1);
        });
}

function automaticallyShowInAppMessages() {
  if (!e.rr()) return;
  setupInAppMessageUI();
  const s = ea$1.m();
  if (null == s.We()) {
    const r = subscribeToInAppMessage(s => showInAppMessage(s));
    s.Xe(r);
  }
  return s.We();
}

class wt {
  constructor(t, s, i, h, l) {
    (this.triggerId = t),
      (this.Or = s),
      (this.Zi = i),
      (this.Hr = h),
      (this.Jr = l),
      (this.triggerId = t),
      (this.Or = s),
      (this.Zi = i),
      (this.Hr = h),
      (this.Jr = l);
  }
  static fromJson(t, s, i, h, l) {
    return null == t || null == t.trigger_id
      ? null
      : new wt(t.trigger_id, s, i, h, l);
  }
}

class gr extends y {
  constructor(t, i, s, e, r) {
    super(),
      (this.tg = t),
      (this.ig = i),
      (this.Jn = s),
      (this.Ch = e),
      (this.sg = r),
      (this.eg = []),
      (this.hg = []),
      (this.og = null),
      (this.ng = {}),
      (this.lg = {}),
      this.ag(),
      this.gg();
  }
  fg() {
    (this.og = this.Jn.v(STORAGE_KEYS.k.La) || this.og),
      (this.ng = this.Jn.v(STORAGE_KEYS.k.Fa) || this.ng),
      (this.lg = this.Jn.v(STORAGE_KEYS.k.Ua) || this.lg);
    for (let t = 0; t < this.cg.length; t++) {
      const i = this.cg[t];
      null != this.lg[i.id] && i.Bu(this.lg[i.id]);
    }
  }
  ag() {
    this.ug = this.Jn.v(STORAGE_KEYS.k.Ga) || 0;
    const t = this.Jn.v(STORAGE_KEYS.k.Na) || [],
      s = [];
    for (let i = 0; i < t.length; i++) s.push(mt.Tn(t[i]));
    (this.cg = s), this.fg();
  }
  gg() {
    const t = this,
      s = function(i, s, e, r, h) {
        return function() {
          t.dg(i, s, e, r, h);
        };
      },
      e = {};
    for (let t = 0; t < this.cg.length; t++) e[this.cg[t].id] = this.cg[t];
    let r = !1;
    for (let t = 0; t < this.cg.length; t++) {
      const i = this.cg[t];
      if (null != this.ng[i.id]) {
        const t = this.ng[i.id],
          h = [];
        for (let r = 0; r < t.length; r++) {
          const o = t[r],
            n = i.Cu(o.Hr);
          if (n > 0) {
            let t, r;
            h.push(o),
              null != o.mg && (t = o.mg),
              null != o.pg && ue.Za(o.pg) && (r = ue.Tn(o.pg));
            const l = [];
            if (isArray(o.bg))
              for (let t = 0; t < o.bg.length; t++) {
                const i = e[o.bg[t]];
                null != i && l.push(i);
              }
            this.hg.push(setTimeout(s(i, o.Hr, t, r, l), n));
          }
        }
        this.ng[i.id].length > h.length &&
          ((this.ng[i.id] = h),
          (r = !0),
          0 === this.ng[i.id].length && delete this.ng[i.id]);
      }
    }
    r && this.Jn.D(STORAGE_KEYS.k.Fa, this.ng);
  }
  Tg() {
    const t = [];
    for (let i = 0; i < this.cg.length; i++) t.push(this.cg[i].ss());
    (this.ug = new Date().valueOf()),
      this.Jn.D(STORAGE_KEYS.k.Na, t),
      this.Jn.D(STORAGE_KEYS.k.Ga, this.ug);
  }
  yg() {
    (this.Jn.v(STORAGE_KEYS.k.Ga) || 0) > this.ug ? this.ag() : this.fg();
  }
  Ts(t) {
    let s = !1;
    if (null != t && t.triggers) {
      this.fg();
      const e = {},
        h = {};
      this.cg = [];
      for (let i = 0; i < t.triggers.length; i++) {
        const r = mt.fromJson(t.triggers[i]);
        null != this.lg[r.id] &&
          (r.Bu(this.lg[r.id]), (e[r.id] = this.lg[r.id])),
          null != this.ng[r.id] && (h[r.id] = this.ng[r.id]);
        for (let t = 0; t < r.Du.length; t++)
          if (r.Du[t].ec(tt.ks, null)) {
            s = !0;
            break;
          }
        null != r && this.cg.push(r);
      }
      isEqual(this.lg, e) || ((this.lg = e), this.Jn.D(STORAGE_KEYS.k.Ua, this.lg)),
        isEqual(this.ng, h) || ((this.ng = h), this.Jn.D(STORAGE_KEYS.k.Fa, this.ng)),
        this.Tg(),
        s &&
          (r$1.j.info("Trigger with test condition found, firing test."),
          this.je(tt.ks)),
        this.je(tt.OPEN);
      const o = this.eg;
      this.eg = [];
      for (let t = 0; t < o.length; t++) this.je.apply(this, o[t]);
    }
  }
  dg(t, i, s, e, h) {
    const o = e => {
        this.fg();
        const h = new Date().valueOf();
        if (!t.Hu(i))
          return !1 === navigator.onLine && t.type === mt._r.Mr && e.imageUrl
            ? (r$1.j.info(
                `Not showing ${t.type} trigger action ${t.id} due to offline state.`
              ),
              void this.sg.Ye(t.id, InAppMessage.Me.Dh))
            : void (t.xu(h) && this.vg(t, h, s)
                ? 0 === this.ig.fu()
                  ? r$1.j.info(
                      `Not displaying trigger ${t.id} because neither automaticallyShowInAppMessages() nor subscribeToInAppMessage() were called.`
                    )
                  : (this.ig.Et([e]), this.wg(t, h))
                : r$1.j.info(
                    `Not displaying trigger ${t.id} because display time fell outside of the acceptable time window.`
                  ));
        t.type === mt._r.Ju
          ? this.sg.Ye(t.id, InAppMessage.Me.Yi)
          : this.sg.Ye(t.id, InAppMessage.Me.Mh);
      },
      n = () => {
        this.fg();
        const o = h.pop();
        if (null != o)
          if ((this.$g(o, i, s, e, h), o.Hu(i))) {
            let t = `Server aborted in-app message display, but the timeout on fallback trigger ${o.id} has already elapsed.`;
            h.length > 0 && (t += " Continuing to fall back."),
              r$1.j.info(t),
              this.sg.Ye(o.id, InAppMessage.Me.Mh),
              n();
          } else {
            r$1.j.info(
              `Server aborted in-app message display. Falling back to lower priority ${o.type} trigger action ${t.id}.`
            );
            const n = 1e3 * o.Pu - (new Date().valueOf() - i);
            n > 0
              ? this.hg.push(
                  setTimeout(() => {
                    this.dg(o, i, s, e, h);
                  }, n)
                )
              : this.dg(o, i, s, e, h);
          }
      };
    let l, a, g;
    switch (t.type) {
      case mt._r.Mr:
        if (((l = newInAppMessageFromJson(t.data)), null == l)) {
          r$1.j.error(
            `Could not parse trigger data for trigger ${t.id}, ignoring.`
          ),
            this.sg.Ye(t.id, InAppMessage.Me.Gr);
          break;
        }
        if (((a = this.sg.Hi(l)), a)) {
          r$1.j.error(a), n();
          break;
        }
        o(l);
        break;
      case mt._r.Ju:
        if (((g = wt.fromJson(t.data, o, n, i, t.Jr)), null == g)) {
          r$1.j.error(
            `Could not parse trigger data for trigger ${t.id}, ignoring.`
          ),
            this.sg.Ye(t.id, InAppMessage.Me.Gr);
          break;
        }
        this.sg.Qi(g, s, e);
        break;
      default:
        r$1.j.error(
          `Trigger ${t.id} was of unexpected type ${t.type}, ignoring.`
        ),
          this.sg.Ye(t.id, InAppMessage.Me.Gr);
    }
  }
  je(t, i, s) {
    if (!validateValueIsFromEnum(tt, t, "Cannot fire trigger action.", "TriggerEvents")) return;
    if (this.Ch._l())
      return (
        r$1.j.info(
          "Trigger sync is currently in progress, awaiting sync completion before firing trigger event."
        ),
        void this.eg.push(arguments)
      );
    this.yg();
    const e = new Date().valueOf(),
      h = e - this.og;
    let o = !0,
      n = !0;
    const l = [];
    for (let s = 0; s < this.cg.length; s++) {
      const r = this.cg[s],
        h = e + 1e3 * r.Pu;
      if (
        r.xu(h) &&
        (null == r.startTime || r.startTime <= e) &&
        (null == r.endTime || r.endTime >= e)
      ) {
        let s = !1;
        for (let e = 0; e < r.Du.length; e++)
          if (r.Du[e].ec(t, i)) {
            s = !0;
            break;
          }
        s && ((o = !1), this.vg(r, h, t) && ((n = !1), l.push(r)));
      }
    }
    if (o)
      return void r$1.j.info(
        `Trigger event ${t} did not match any trigger conditions.`
      );
    if (n)
      return void r$1.j.info(
        `Ignoring ${t} trigger event because a trigger was displayed ${h /
          1e3}s ago.`
      );
    l.sort((t, i) => t.priority - i.priority);
    const a = l.pop();
    null != a &&
      (r$1.j.info(
        `Firing ${a.type} trigger action ${a.id} from trigger event ${t}.`
      ),
      this.$g(a, e, t, s, l),
      0 === a.Pu
        ? this.dg(a, e, t, s, l)
        : this.hg.push(
            setTimeout(() => {
              this.dg(a, e, t, s, l);
            }, 1e3 * a.Pu)
          ));
  }
  changeUser(t) {
    if (((this.cg = []), this.Jn.ri(STORAGE_KEYS.k.Na), !t)) {
      (this.eg = []), (this.og = null), (this.lg = {}), (this.ng = {});
      for (let t = 0; t < this.hg.length; t++) clearTimeout(this.hg[t]);
      (this.hg = []),
        this.Jn.ri(STORAGE_KEYS.k.La),
        this.Jn.ri(STORAGE_KEYS.k.Ua),
        this.Jn.ri(STORAGE_KEYS.k.Fa);
    }
  }
  clearData() {
    (this.cg = []), (this.og = null), (this.lg = {}), (this.ng = {});
    for (let t = 0; t < this.hg.length; t++) clearTimeout(this.hg[t]);
    this.hg = [];
  }
  vg(t, i, s) {
    if (null == this.og) return !0;
    if (s === tt.ks)
      return (
        r$1.j.info(
          "Ignoring minimum interval between trigger because it is a test type."
        ),
        !0
      );
    let e = t.Iu;
    return null == e && (e = this.tg), i - this.og >= 1e3 * e;
  }
  $g(t, s, e, r, h) {
    this.fg(), (this.ng[t.id] = this.ng[t.id] || []);
    const o = {};
    let n;
    (o.Hr = s), (o.mg = e), null != r && (n = r.ss()), (o.pg = n);
    const l = [];
    for (let t = 0; t < h.length; t++) l.push(h[t].id);
    (o.bg = l), this.ng[t.id].push(o), this.Jn.D(STORAGE_KEYS.k.Fa, this.ng);
  }
  wg(t, s) {
    this.fg(),
      t.Bu(s),
      (this.og = s),
      this.Jn.D(STORAGE_KEYS.k.La, s),
      (this.lg[t.id] = s),
      this.Jn.D(STORAGE_KEYS.k.Ua, this.lg);
  }
}

const TriggersProviderFactory = {
  t: !1,
  provider: null,
  er: () => (TriggersProviderFactory.init(), TriggersProviderFactory.provider),
  rg: () => {
    if (!TriggersProviderFactory.provider) {
      const r = e.nn(L.No);
      (TriggersProviderFactory.provider = new gr(
        null != r ? r : 30,
        ea$1.m().Ue(),
        e.l(),
        e.cr(),
        ea$1.m()
      )),
        e.dr(TriggersProviderFactory.provider);
    }
  },
  init: () => {
    TriggersProviderFactory.t ||
      (TriggersProviderFactory.rg(),
      e.g(TriggersProviderFactory),
      (TriggersProviderFactory.t = !0));
  },
  destroy: () => {
    (TriggersProviderFactory.provider = null), (TriggersProviderFactory.t = !1);
  }
};

class ti {
  constructor(t, i, l, s, u) {
    (this.endpoint = t || null),
      (this.Nn = i || null),
      (this.publicKey = l || null),
      (this.zl = s || null),
      (this.al = u || null);
  }
  ss() {
    return {
      e: this.endpoint,
      c: this.Nn,
      p: this.publicKey,
      u: this.zl,
      v: this.al
    };
  }
  static Tn(t) {
    return new ti(t.e, rehydrateDateAfterJsonization(t.c), t.p, t.u, t.v);
  }
}

class bt {
  constructor(t, s) {
    (this.wt = t), (this.u = s), (this.wt = t), (this.u = s);
  }
  getUserId() {
    const t = this.u.tu(STORAGE_KEYS.eu.su);
    if (null == t) return null;
    let s = t.iu,
      e = getByteLength(s);
    if (e > User.lr) {
      for (; e > User.lr; ) (s = s.slice(0, s.length - 1)), (e = getByteLength(s));
      (t.iu = s), this.u.uu(STORAGE_KEYS.eu.su, t);
    }
    return s;
  }
  ru(t) {
    const s = null == this.getUserId();
    this.u.uu(STORAGE_KEYS.eu.su, new _t(t)), s && this.u.ou(t);
  }
  setCustomUserAttribute(t, s) {
    if (this.wt.hu(t))
      return (
        r$1.j.info('Custom Attribute "' + t + '" is blocklisted, ignoring.'), !1
      );
    const e = {};
    return (e[t] = s), this.nu(User.lu, e, !0);
  }
  nu(t, s, e = !1, i = !1) {
    const u = this.u.mu(this.getUserId(), t, s);
    let o = "",
      h = t,
      n = s;
    return (
      e &&
        ((o = " custom"),
        "object" == typeof s &&
          ((h = Object.keys(s)[0]),
          (n = s[h]),
          "object" == typeof n && (n = JSON.stringify(n, null, 2)))),
      !i && u && r$1.j.info(`Logged${o} attribute ${h} with value ${n}`),
      u
    );
  }
  yn(t, s, e, u, o) {
    this.nu("push_token", t, !1, !0),
      this.nu("custom_push_public_key", e, !1, !0),
      this.nu("custom_push_user_auth", u, !1, !0),
      this.nu("custom_push_vapid_public_key", o, !1, !0);
    const h = r$1.zt.Ft,
      n = new r$1.xt(h, r$1.j),
      l = new ti(t, s, e, u, o);
    this.u.D(STORAGE_KEYS.k.xn, l.ss()), n.setItem(h.Jt.cu, h.se, !0);
  }
  wn(t) {
    if (
      (this.nu("push_token", null, !1, !0),
      this.nu("custom_push_public_key", null, !1, !0),
      this.nu("custom_push_user_auth", null, !1, !0),
      this.nu("custom_push_vapid_public_key", null, !1, !0),
      t)
    ) {
      const t = r$1.zt.Ft,
        s = new r$1.xt(t, r$1.j);
      this.u.D(STORAGE_KEYS.k.xn, !1), s.setItem(t.Jt.cu, t.se, !1);
    }
  }
}

const L = {
  ho: "allowCrawlerActivity",
  Eo: "baseUrl",
  _o: "noCookies",
  Io: "devicePropertyAllowlist",
  ia: "disablePushTokenMaintenance",
  Ao: "enableLogging",
  So: "enableSdkAuthentication",
  ta: "manageServiceWorkerExternally",
  No: "minimumIntervalBetweenTriggerActionsInSeconds",
  wo: "sessionTimeoutInSeconds",
  To: "appVersion",
  na: "serviceWorkerLocation",
  ra: "safariWebsitePushId",
  Mn: "localization",
  lo: "contentSecurityNonce",
  Oo: "enableHtmlInAppMessages",
  Co: "allowUserSuppliedJavascript",
  mo: "inAppMessageZIndex",
  po: "openInAppMessagesInNewTab",
  tn: "openCardsInNewTab",
  en: "openNewsFeedCardsInNewTab",
  Lh: "requireExplicitInAppMessageDismissal",
  Lo: "doNotLoadFontAwesome",
  Po: "sdkFlavor"
};
class Wt {
  constructor() {
    (this.Ro = !1),
      (this.Mo = !1),
      (this.jo = new E()),
      (this.Do = new E()),
      (this.Uo = {}),
      (this.Bo = []),
      (this.Wo = []),
      (this.zo = []),
      (this.Vo = "4.8.0");
  }
  Go(t) {
    this.jo.lt(t);
  }
  Nh(t) {
    this.Do.lt(t);
  }
  initialize(t, s) {
    if (this.ue())
      return (
        r$1.j.info("Braze has already been initialized with an API key."), !0
      );
    this.Uo = s || {};
    let e = this.nn(L.Ao);
    const n = parseQueryStringKeyValues(WindowUtils.An());
    if (
      (n && "true" === n.brazeLogging && (e = !0),
      r$1.j.init(e),
      r$1.j.info(`Initialization Options: ${JSON.stringify(this.Uo, null, 2)}`),
      null == t || "" === t || "string" != typeof t)
    )
      return r$1.j.error("Braze requires a valid API key to be initialized."), !1;
    this.Ko = t;
    let o = this.nn(L.Eo);
    if (null == o || "" === o || "string" != typeof o)
      return r$1.j.error("Braze requires a valid baseUrl to be initialized."), !1;
    !1 === /^https?:/.test(o) && (o = `https://${o}`);
    let h = o;
    if (
      ((o = document.createElement("a")),
      (o.href = h),
      "/" === o.pathname && (o = `${o}api/v3`),
      (this.Ho = o.toString()),
      V.$o && !this.nn(L.ho))
    )
      return (
        r$1.j.info("Ignoring activity from crawler bot " + navigator.userAgent),
        (this.Mo = !0),
        !1
      );
    const a = this.nn(L._o) || !1;
    if (
      ((this.Jn = Bt.qo(t, a)), a && this.Jn.xo(t), new O.ee(null, !0).wr(STORAGE_KEYS.re))
    )
      return (
        r$1.j.info("Ignoring all activity due to previous opt out"),
        (this.Mo = !0),
        !1
      );
    for (const t of keys(this.Uo))
      -1 === values(r$1.Jo).indexOf(t) &&
        r$1.j.warn(`Ignoring unknown initialization option '${t}'.`);
    const l = ["mparticle", "wordpress", "tealium"];
    if (null != this.nn(L.Po)) {
      const t = this.nn(L.Po);
      -1 !== l.indexOf(t)
        ? (this.Yo = t)
        : r$1.j.error("Invalid sdk flavor passed: " + t);
    }
    let u = this.nn(r$1.Jo.Io);
    if (null != u)
      if (isArray(u)) {
        const t = [];
        for (let i = 0; i < u.length; i++)
          validateValueIsFromEnum(
            DeviceProperties,
            u[i],
            "devicePropertyAllowlist contained an invalid value.",
            "DeviceProperties"
          ) && t.push(u[i]);
        u = t;
      } else
        r$1.j.error(
          "devicePropertyAllowlist must be an array. Defaulting to all properties."
        ),
          (u = null);
    (this.Xo = new Ot(this.Jn, u)),
      (this.Zo = new Mt(this.Jn)),
      (this.Qo = new bt(this.Zo, this.Jn)),
      (this.fh = new Dt(this.Jn, this.Qo, this.Zo, this.nn(L.wo)));
    const f = new E();
    return (
      (this.gh = new jt(this.Jn, this.nn(L.So), f)),
      this.jt(f),
      (this.wh = new Pt(
        this.Xo,
        this.Jn,
        this.gh,
        this.Qo,
        this.fh,
        this.Zo,
        this.Ko,
        this.Ho,
        this.Vo,
        this.Yo,
        this.nn(L.To)
      )),
      (this.Ch = new Rt(
        this.Ko,
        this.Ho,
        this.fh,
        this.Xo,
        this.Qo,
        this.Zo,
        this.Jn,
        t => {
          if (this.ue()) for (const i of this.gr()) i.Ts(t);
        },
        this.gh,
        this.wh
      )),
      this.Ch.initialize(),
      r$1.j.info(
        `Initialized for the Braze backend at "${this.nn(
          L.Eo
        )}" with API key "${this.Ko}".`
      ),
      null != this.nn(L.Oo) &&
        logDeprecationWarning(
          "enableHtmlInAppMessages",
          "initialization option",
          "allowUserSuppliedJavascript"
        ),
      TriggersProviderFactory.init(),
      this.Zo.Ni(() => {
        this.Ro &&
          this.Zo.bi() &&
          Promise.resolve().then(function () { return refreshFeatureFlags$1; }).then(t => {
            if (!this.Ro) return;
            (0, t.default)();
          });
      }),
      this.Ch.pr(() => {
        this.Ro &&
          this.Zo.bi() &&
          Promise.resolve().then(function () { return refreshFeatureFlags$1; }).then(t => {
            if (!this.Ro) return;
            (0, t.default)(null, null, !0);
          });
      }),
      this.jo.Et(this.Uo),
      (this.Ro = !0),
      !0
    );
  }
  destroy(t) {
    if ((r$1.j.destroy(), this.ue())) {
      this.Do.Et(), this.Do.removeAllSubscriptions();
      for (const t of this.Bo) t.destroy();
      this.Bo = [];
      for (const t of this.Wo) t.clearData(!1);
      (this.Wo = []),
        this.removeAllSubscriptions(),
        (this.zo = []),
        this.Ch.destroy(),
        (this.Ch = null),
        (this.gh = null),
        (this.Xo = null),
        (this.wh = null),
        (this.Zo = null),
        (this.fh = null),
        (this.Qo = null),
        (this.Uo = {}),
        (this.Yo = void 0),
        (this.Ro = !1),
        (this.Mo = !1),
        t && (this.Jn = null);
    }
  }
  rr() {
    if (this.Ph()) return !1;
    if (!this.ue()) throw new Error(BRAZE_MUST_BE_INITIALIZED_ERROR);
    return !0;
  }
  ea() {
    return this.Ko;
  }
  Sr() {
    return this.gh;
  }
  Zs() {
    return this.Ho;
  }
  ie() {
    return this.Xo;
  }
  ar() {
    return this.wh;
  }
  nn(t) {
    return this.Uo[t];
  }
  gr() {
    return this.Wo;
  }
  cr() {
    return this.Ch;
  }
  tr() {
    return this.Zo;
  }
  aa() {
    return this.fh;
  }
  l() {
    return this.Jn;
  }
  jr() {
    if (this.Qo && this.Ch) return new User(this.Qo, this.Ch);
  }
  ir() {
    return this.Qo;
  }
  nr() {
    return !0 === this.nn(L.Co) || !0 === this.nn(L.Oo);
  }
  g(t) {
    let i = !1;
    for (const s of this.Bo) s === t && (i = !0);
    i || this.Bo.push(t);
  }
  dr(t) {
    let i = !1;
    for (const s of this.Wo) s.constructor === t.constructor && (i = !0);
    t instanceof y && !i && this.Wo.push(t);
  }
  jt(t) {
    t instanceof E && this.zo.push(t);
  }
  removeAllSubscriptions() {
    if (this.rr()) for (const t of this.zo) t.removeAllSubscriptions();
  }
  removeSubscription(t) {
    if (this.rr()) for (const i of this.zo) i.removeSubscription(t);
  }
  ae(t) {
    this.Mo = t;
  }
  ue() {
    return this.Ro;
  }
  Ph() {
    return this.Mo;
  }
  Us() {
    return this.Vo;
  }
}
const e = new Wt();

const s = {
  N: (o, n, s) => {
    const a = new t(),
      i = e.aa();
    if (!i)
      return (
        r$1.j.info(
          `Not logging event with type "${o}" because the current session ID could not be found.`
        ),
        a
      );
    const m = i.bo();
    return (
      a.ve.push(new ue(s || e.ir().getUserId(), o, new Date().valueOf(), m, n)),
      (a.O = e.l().co(a.ve)),
      a
    );
  }
};
var s$1 = s;

class a {
  constructor(s) {
    (this.u = s), (this.u = s);
  }
  h(n, o) {
    const e = new t();
    if ((n.p(), null == n.url || "" === n.url))
      return (
        r$1.j.info(
          `Card ${n.id} has no url. Not logging click to Braze servers.`
        ),
        e
      );
    if (o && n.id && this.u) {
      const s = this.u.v(STORAGE_KEYS.k.C) || {};
      (s[n.id] = !0), this.u.D(STORAGE_KEYS.k.C, s);
    }
    const l = this.I([n]);
    if (null == l) return e;
    const u = o ? r$1.q.$ : r$1.q.B;
    return s$1.N(u, l);
  }
  A(n) {
    const o = new t();
    if (!n.F())
      return (
        r$1.j.info(
          `Card ${n.id} refused this dismissal. Ignoring analytics event.`
        ),
        o
      );
    if (n.id && this.u) {
      const s = this.u.v(STORAGE_KEYS.k.G) || {};
      (s[n.id] = !0), this.u.D(STORAGE_KEYS.k.G, s);
    }
    const e = this.I([n]);
    return null == e ? o : s$1.N(r$1.q.H, e);
  }
  J(n, o) {
    const e = new t(!0),
      l = [],
      u = [];
    let a;
    this.u && (a = o ? this.u.v(STORAGE_KEYS.k.K) || {} : this.u.v(STORAGE_KEYS.k.L) || {});
    for (const s of n)
      s.M(),
        s instanceof ControlCard ? u.push(s) : l.push(s),
        s.id && (a[s.id] = !0);
    const h = this.I(l),
      c = this.I(u);
    if (null == h && null == c) return (e.O = !1), e;
    if ((this.u && (o ? this.u.D(STORAGE_KEYS.k.K, a) : this.u.D(STORAGE_KEYS.k.L, a)), null != h)) {
      const t = o ? r$1.q.P : r$1.q.R,
        n = s$1.N(t, h);
      e.S(n);
    }
    if (null != c && o) {
      const t = s$1.N(r$1.q.T, c);
      e.S(t);
    }
    return e;
  }
  I(s) {
    let t,
      r = null;
    for (let n = 0; n < s.length; n++)
      (t = s[n].id),
        null != t &&
          "" !== t &&
          ((r = r || {}), (r.ids = r.ids || []), r.ids.push(t));
    return r;
  }
}

const n = {
  t: !1,
  i: null,
  m: () => (n.o(), n.i || (n.i = new a(e.l())), n.i),
  o: () => {
    n.t || (e.g(n), (n.t = !0));
  },
  destroy: () => {
    (n.i = null), (n.t = !1);
  }
};
var n$1 = n;

function logCardClick(o, a) {
  return (
    !!e.rr() &&
    (o instanceof Card ? n$1.m().h(o, a).O : (r$1.j.error("card " + MUST_BE_CARD_WARNING_SUFFIX), !1))
  );
}

function logCardDismissal(o) {
  return (
    !!e.rr() &&
    (o instanceof Card ? n$1.m().A(o).O : (r$1.j.error("card " + MUST_BE_CARD_WARNING_SUFFIX), !1))
  );
}

function logCardImpressions(o, s) {
  if (!e.rr()) return !1;
  if (!isArray(o)) return r$1.j.error("cards must be an array"), !1;
  for (const s of o)
    if (!(s instanceof Card)) return r$1.j.error(`Each card in cards ${MUST_BE_CARD_WARNING_SUFFIX}`), !1;
  return n$1.m().J(o, s).O;
}

function logContentCardImpressions(o) {
  return logCardImpressions(o, !0);
}

function logContentCardClick(o) {
  return logCardClick(o, !0);
}

class x {
  constructor(e, r) {
    (this.cards = e), (this.lastUpdated = r);
  }
  getUnreadCardCount() {
    let e = 0;
    for (const r of this.cards) r.viewed || r instanceof ControlCard || e++;
    return e;
  }
  ur() {
    throw new Error("Must be implemented in a subclass");
  }
  logCardImpressions(e) {
    throw new Error("Must be implemented in a subclass");
  }
  logCardClick(e) {
    throw new Error("Must be implemented in a subclass");
  }
  sr() {
    throw new Error("Must be implemented in a subclass");
  }
}
(x.mr = 6e4), (x.Th = 500), (x.uo = 1e4);

function newCard(e, n, t, o, i, l, u, d, a, s, w, f, m, C, p, c, x, F) {
  let b;
  if (n === Card.es.ct || n === Card.es.St)
    b = new ClassicCard(e, t, o, i, l, u, d, a, s, w, f, m, C, p, c, x);
  else if (n === Card.es.tt)
    b = new CaptionedImage(e, t, o, i, l, u, d, a, s, w, f, m, C, p, c, x);
  else if (n === Card.es.rs)
    b = new Banner(e, t, i, u, d, a, s, w, f, m, C, p, c, x);
  else {
    if (n !== Card.es.At)
      return r$1.j.error("Ignoring card with unknown type " + n), null;
    b = new ControlCard(e, t, d, s, C, p);
  }
  return F && (b.test = F), b;
}
function newCardFromContentCardsJson(e) {
  if (e[Card.Tt.It]) return null;
  const n = e[Card.Tt.ns],
    r = e[Card.Tt.ts],
    t = e[Card.Tt.ls],
    o = e[Card.Tt.st],
    i = e[Card.Tt.os],
    u = e[Card.Tt.it],
    d = dateFromUnixTimestamp(e[Card.Tt.us]),
    a = d;
  let s;
  s = e[Card.Tt.ps] === Card.Nt ? null : dateFromUnixTimestamp(e[Card.Tt.ps]);
  return newCard(
    n,
    r,
    t,
    o,
    i,
    u,
    a,
    d,
    null,
    s,
    e[Card.Tt.URL],
    e[Card.Tt.bs],
    e[Card.Tt.fs],
    e[Card.Tt.xs],
    e[Card.Tt.js],
    e[Card.Tt.zs],
    e[Card.Tt.gs],
    e[Card.Tt.ks] || !1
  );
}
function newCardFromFeedJson(e) {
  return newCard(
    e.id,
    e.type,
    e.viewed,
    e.title,
    e.image,
    e.description,
    dateFromUnixTimestamp(e.created),
    dateFromUnixTimestamp(e.updated),
    e.categories,
    dateFromUnixTimestamp(e.expires_at),
    e.url,
    e.domain,
    e.aspect_ratio,
    e.extras,
    !1,
    !1
  );
}
function newCardFromSerializedValue(e) {
  return (
    newCard(
      e[Card.hs.ns],
      e[Card.hs.ts],
      e[Card.hs.ls],
      e[Card.hs.st],
      e[Card.hs.os],
      e[Card.hs.it],
      rehydrateDateAfterJsonization(e[Card.hs.cs]),
      rehydrateDateAfterJsonization(e[Card.hs.us]),
      e[Card.hs.ds],
      rehydrateDateAfterJsonization(e[Card.hs.ps]),
      e[Card.hs.URL],
      e[Card.hs.bs],
      e[Card.hs.fs],
      e[Card.hs.xs],
      e[Card.hs.js],
      e[Card.hs.zs],
      e[Card.hs.gs],
      e[Card.hs.ks] || !1
    ) || void 0
  );
}

class v extends y {
  constructor(t, s, i, h, n) {
    super(),
      (this.ft = t),
      (this.u = s),
      (this.wt = i),
      (this.vt = h),
      (this.gt = n),
      (this.ft = t),
      (this.u = s),
      (this.wt = i),
      (this.vt = h),
      (this.gt = n),
      (this.yt = new E()),
      e.jt(this.yt),
      (this.kt = 0),
      (this.Ut = 0),
      (this.cards = []),
      this.Lt();
    const o = r$1.zt.Ft;
    new r$1.xt(o, r$1.j).Mt(o.Jt.qt, t => {
      this.Pt(t);
    }),
      (this.$t = null),
      (this._t = null),
      (this.Bt = null),
      (this.Gt = null),
      (this.Ht = null),
      (this.Kt = null),
      (this.Ot = 10),
      (this.Qt = 0);
  }
  Vt() {
    return this._t;
  }
  Wt(t) {
    this._t = t;
  }
  Xt() {
    return this.Bt;
  }
  Yt(t) {
    this.Bt = t;
  }
  Lt() {
    if (!this.u) return;
    const t = this.u.v(STORAGE_KEYS.k.Zt) || [],
      s = [];
    for (let i = 0; i < t.length; i++) {
      const e = newCardFromSerializedValue(t[i]);
      null != e && s.push(e);
    }
    (this.cards = this.Cs(this.ws(s, !1))),
      (this.kt = this.u.v(STORAGE_KEYS.k.vs) || this.kt),
      (this.Ut = this.u.v(STORAGE_KEYS.k.ys) || this.Ut);
  }
  Ns(t, s = !1, e = 0, h = 0) {
    let r;
    if (s) {
      r = [];
      for (const t of this.cards) t.test && r.push(t);
    } else r = this.cards.slice();
    for (let i = 0; i < t.length; i++) {
      const e = t[i];
      let h = null;
      for (let t = 0; t < this.cards.length; t++)
        if (e.id === this.cards[t].id) {
          h = this.cards[t];
          break;
        }
      if (s) {
        const t = newCardFromContentCardsJson(e);
        null != h && h.viewed && t && (t.viewed = !0), null != t && r.push(t);
      } else if (null == h) {
        const t = newCardFromContentCardsJson(e);
        null != t && r.push(t);
      } else {
        if (!h.ot(e))
          for (let t = 0; t < r.length; t++)
            if (e.id === r[t].id) {
              r.splice(t, 1);
              break;
            }
      }
    }
    (this.cards = this.Cs(this.ws(r, s))),
      this.Rs(),
      (this.kt = e),
      (this.Ut = h),
      this.u && (this.u.D(STORAGE_KEYS.k.vs, this.kt), this.u.D(STORAGE_KEYS.k.ys, this.Ut));
  }
  Ts(t) {
    if (this.Ds() && null != t && t.cards) {
      this.u && this.u.D(STORAGE_KEYS.k.Ss, e.Us());
      const s = t.full_sync;
      s || this.Lt(),
        this.Ns(t.cards, s, t.last_full_sync_at, t.last_card_updated_at),
        this.yt.Et(this.As(!0));
    }
  }
  Ls(t) {
    this.u && this.u.D(STORAGE_KEYS.k.Fs, t);
  }
  Ms(t, e, h) {
    const n = () => {
        this.Es(e, h, !0);
      },
      o = readResponseHeaders(t);
    let l;
    if ((this.qs(), !o["retry-after"])) return void this.Ls(0);
    const a = o["retry-after"];
    if (isNaN(a) && !isNaN(Date.parse(a)))
      (l = Date.parse(a) - new Date().getTime()), l < 0 && n();
    else {
      if (isNaN(parseFloat(a.toString()))) {
        const t =
          "Received unexpected value for retry-after header in /sync response";
        return s$1.N(r$1.q.Is, { e: t + ": " + a }), void this.Ls(0);
      }
      l = 1e3 * parseFloat(a.toString());
    }
    this.Gt = window.setTimeout(() => {
      n();
    }, l);
    let u = 0;
    this.u && (u = this.u.v(STORAGE_KEYS.k.Fs)),
      (null == u || isNaN(parseInt(u.toString()))) && (u = 0),
      this.Ls(parseInt(u.toString()) + 1);
  }
  Pt(t) {
    if (!this.Ds()) return;
    this.Lt();
    const s = this.cards.slice();
    let i = null;
    this.ft && (i = this.ft.getUserId());
    for (let e = 0; e < t.length; e++)
      if (i === t[e].userId || (null == i && null == t[e].userId)) {
        const i = t[e].card;
        let h = null;
        for (let t = 0; t < this.cards.length; t++)
          if (i.id === this.cards[t].id) {
            h = this.cards[t];
            break;
          }
        if (null == h) {
          const t = newCardFromContentCardsJson(i);
          null != t && s.push(t);
        } else {
          if (!h.ot(i))
            for (let t = 0; t < s.length; t++)
              if (i.id === s[t].id) {
                s.splice(t, 1);
                break;
              }
        }
      }
    (this.cards = this.Cs(this.ws(s, !1))), this.Rs(), this.yt.Et(this.As(!0));
  }
  ws(t, s) {
    let e = {},
      h = {},
      r = {};
    this.u &&
      ((e = this.u.v(STORAGE_KEYS.k.C) || {}),
      (h = this.u.v(STORAGE_KEYS.k.K) || {}),
      (r = this.u.v(STORAGE_KEYS.k.G) || {}));
    const n = {},
      o = {},
      l = {};
    for (let s = 0; s < t.length; s++) {
      const i = t[s].id;
      i &&
        (e[i] && ((t[s].clicked = !0), (n[i] = !0)),
        h[i] && ((t[s].viewed = !0), (o[i] = !0)),
        r[i] && ((t[s].dismissed = !0), (l[i] = !0)));
    }
    return (
      s &&
        this.u &&
        (this.u.D(STORAGE_KEYS.k.C, n), this.u.D(STORAGE_KEYS.k.K, o), this.u.D(STORAGE_KEYS.k.G, l)),
      t
    );
  }
  Cs(t) {
    const s = [],
      e = new Date();
    let h = {};
    this.u && (h = this.u.v(STORAGE_KEYS.k.G) || {});
    let n = !1;
    for (let i = 0; i < t.length; i++) {
      const o = t[i].url;
      if (!this.vt && o && isURIJavascriptOrData(o)) {
        r$1.j.error(
          `Card with url ${o} will not be displayed because Javascript URLs are disabled. Use the "allowUserSuppliedJavascript" option for braze.initialize to enable this card.`
        );
        continue;
      }
      const l = t[i].expiresAt;
      let a = !0;
      if ((null != l && (a = l >= e), (a = a && !t[i].dismissed), a))
        s.push(t[i]);
      else {
        const s = t[i].id;
        s && (h[s] = !0), (n = !0);
      }
    }
    return n && this.u && this.u.D(STORAGE_KEYS.k.G, h), s;
  }
  Rs() {
    if (!this.u) return;
    const t = [];
    for (let s = 0; s < this.cards.length; s++) t.push(this.cards[s].ss());
    this.u.D(STORAGE_KEYS.k.Zt, t);
  }
  qs() {
    this.Gt && (clearTimeout(this.Gt), (this.Gt = null));
  }
  Js() {
    null != this.Ht && (clearTimeout(this.Ht), (this.Ht = null));
  }
  Ps(t = 1e3 * this.Ot, s, i) {
    this.Js(),
      (this.Ht = window.setTimeout(() => {
        this.Es(s, i, !0);
      }, t)),
      (this.Kt = t);
  }
  Es(t, s, h = !1, n = !0) {
    var o;
    const l = this.gt,
      a = this.u;
    if (!l || !a) return void ("function" == typeof s && s());
    const u = !h;
    if ((u && (this.qs(), this.Ls(0)), !this.Ds()))
      return void (
        !this.$t &&
        this.wt &&
        (this.$t = this.wt.$s(() => {
          this.Es(t, s);
        }))
      );
    let c = !0;
    if (
      (u &&
        (null === (o = this.wt) || void 0 === o ? void 0 : o._s()) &&
        (c = this.Bs()),
      !c)
    )
      return void r$1.j.info("Content card sync being throttled.");
    n && this.Js();
    const f = l.Gs({}, !0);
    a.v(STORAGE_KEYS.k.Ss) !== e.Us() && this.Hs(),
      (f.last_full_sync_at = this.kt),
      (f.last_card_updated_at = this.Ut);
    const d = l.Ks(f, T.Qs.Os, h);
    let m = !1;
    l.Vs(f, () => {
      if (this.u) {
        const t = new Date().valueOf();
        u && this.u.D(STORAGE_KEYS.k.Ws, t), T.Xs(this.u, T.Qs.Os, t);
      }
      C.Ys({
        url: l.Zs() + "/content_cards/sync",
        data: f,
        headers: d,
        O: (i, e) => {
          if (!l.ti(f, i, d))
            return (m = !0), void ("function" == typeof s && s());
          l.si(),
            this.Ms(e, t, s),
            this.Ts(i),
            (m = !1),
            "function" == typeof t && t();
        },
        error: t => {
          l.ii(t, "retrieving content cards"),
            (m = !0),
            "function" == typeof s && s();
        },
        ei: () => {
          if (m && n && !this.Ht && this.Qt + 1 < MAX_ERROR_RETRIES_CONTENT_CARDS) {
            let i = this.Kt;
            (null == i || i < 1e3 * this.Ot) && (i = 1e3 * this.Ot),
              this.Ps(Math.min(3e5, randomInclusive(1e3 * this.Ot, 3 * i)), t, s),
              (this.Qt = this.Qt + 1);
          }
        }
      });
    });
  }
  As(t) {
    t || this.Lt();
    const s = this.Cs(this.cards);
    s.sort((t, s) =>
      t.pinned && !s.pinned
        ? -1
        : s.pinned && !t.pinned
        ? 1
        : t.updated && s.updated && t.updated > s.updated
        ? -1
        : t.updated && s.updated && s.updated > t.updated
        ? 1
        : 0
    );
    let e = Math.max(this.Ut || 0, this.kt || 0);
    return (
      0 === e && (e = void 0),
      this.u && this.u.v(STORAGE_KEYS.k.ys) === this.Ut && void 0 === e && (e = this.Ut),
      new ContentCards(s, dateFromUnixTimestamp(e))
    );
  }
  hi(t) {
    return this.yt.lt(t);
  }
  Hs() {
    (this.kt = 0),
      (this.Ut = 0),
      this.u && (this.u.ri(STORAGE_KEYS.k.vs), this.u.ri(STORAGE_KEYS.k.ys));
  }
  changeUser(t) {
    t ||
      ((this.cards = []),
      this.yt.Et(new ContentCards(this.cards.slice(), null)),
      this.u &&
        (this.u.ri(STORAGE_KEYS.k.Zt),
        this.u.ri(STORAGE_KEYS.k.C),
        this.u.ri(STORAGE_KEYS.k.K),
        this.u.ri(STORAGE_KEYS.k.G))),
      this.Hs();
  }
  clearData(t) {
    (this.kt = 0),
      (this.Ut = 0),
      (this.cards = []),
      this.yt.Et(new ContentCards(this.cards.slice(), null)),
      t &&
        this.u &&
        (this.u.ri(STORAGE_KEYS.k.Zt),
        this.u.ri(STORAGE_KEYS.k.C),
        this.u.ri(STORAGE_KEYS.k.K),
        this.u.ri(STORAGE_KEYS.k.G),
        this.u.ri(STORAGE_KEYS.k.vs),
        this.u.ri(STORAGE_KEYS.k.ys));
  }
  Ds() {
    return !(this.wt && !this.wt.ni()) || (0 !== this.wt.oi() && this.li(), !1);
  }
  ai(t) {
    this.u && this.u.D(STORAGE_KEYS.k.ui, t);
  }
  ci() {
    return this.u ? this.u.v(STORAGE_KEYS.k.ui) : null;
  }
  Bs() {
    const t = this.u,
      s = this.wt;
    if (!t || !s) return !0;
    const e = t.v(STORAGE_KEYS.k.Ws);
    if (null == e || isNaN(e)) return !0;
    const h = s.fi(),
      r = s.di();
    if (-1 === h || -1 === r) return !0;
    let n = this.ci();
    (null == n || isNaN(n)) && (n = h);
    const o = (new Date().valueOf() - e) / 1e3;
    return (
      (n = Math.min(n + o / r, h)),
      !(n < 1) && ((n = Math.trunc(n) - 1), this.ai(n), !0)
    );
  }
  li() {
    this.yt.Et(new ContentCards([], new Date())), this.u && this.u.ri(STORAGE_KEYS.k.Zt);
  }
}

const g = {
  t: !1,
  provider: null,
  er: () => (
    g.o(),
    g.provider ||
      ((g.provider = new v(e.ir(), e.l(), e.tr(), e.nr(), e.ar())),
      e.dr(g.provider)),
    g.provider
  ),
  o: () => {
    g.t || (e.g(g), (g.t = !0));
  },
  destroy: () => {
    (g.provider = null), (g.t = !1);
  }
};
var g$1 = g;

function requestContentCardsRefresh(r, t) {
  if (e.rr()) return g$1.er().Es(r, t);
}

class ContentCards extends x {
  constructor(r, e) {
    super(r, e);
  }
  getUnviewedCardCount() {
    return super.getUnreadCardCount();
  }
  logCardImpressions(r) {
    logCardImpressions(r, !0);
  }
  logCardClick(r) {
    logCardClick(r, !0);
  }
  sr() {
    requestContentCardsRefresh();
  }
  ur() {
    return !0;
  }
}
ContentCards.mr = 6e4;

function getCachedContentCards() {
  if (e.rr()) return g$1.er().As(!1);
}

function topHadImpression(t) {
  return null != t && !!t.getAttribute("data-ab-had-top-impression");
}
function impressOnTop(t) {
  null != t && t.setAttribute("data-ab-had-top-impression", "true");
}
function bottomHadImpression(t) {
  return null != t && !!t.getAttribute("data-ab-had-bottom-impression");
}
function impressOnBottom(t) {
  null != t && t.setAttribute("data-ab-had-bottom-impression", "true");
}
function markCardAsRead(t) {
  if (null != t) {
    const o = t.querySelectorAll(".ab-unread-indicator")[0];
    null != o && (o.className += " read");
  }
}
function getCardId(t) {
  return t.getAttribute("data-ab-card-id");
}
function _setImageAltText(t, o) {
  let e = "";
  t.title || t.description || (e = "Feed Image"), o.setAttribute("alt", e);
}
function setCardHeight(t, o) {
  const e = o.querySelectorAll(".ab-image-area");
  let a,
    n = 0;
  e.length > 0 && (n = e[0].offsetWidth);
  for (const o of t)
    if (((a = o._), a && o.imageUrl && "number" == typeof o.aspectRatio)) {
      const t = n / o.aspectRatio;
      t && (a.style.height = `${t}px`);
    }
}
function cardToHtml(t, logCardClick, e) {
  const a = document.createElement("div");
  (a.className = "ab-card ab-effect-card " + t.U),
    t.id && a.setAttribute("data-ab-card-id", t.id),
    a.setAttribute("role", "article"),
    a.setAttribute("tabindex", "0");
  let n = "",
    i = !1;
  t.url && "" !== t.url && ((n = t.url), (i = !0));
  const s = o => (markCardAsRead(a), i && (logCardClick(t), _handleBrazeAction(n, e, o)), !1);
  if (t.pinned) {
    const t = document.createElement("div");
    t.className = "ab-pinned-indicator";
    const o = document.createElement("i");
    (o.className = "fa fa-star"), t.appendChild(o), a.appendChild(t);
  }
  if (t.imageUrl && "" !== t.imageUrl) {
    const o = document.createElement("div");
    o.className = "ab-image-area";
    const e = document.createElement("img");
    if (
      (e.setAttribute("src", t.imageUrl),
      (e.onload = () => {
        a.style.height = "auto";
      }),
      _setImageAltText(t, e),
      o.appendChild(e),
      (a.className += " with-image"),
      i && !t.V)
    ) {
      const t = document.createElement("a");
      t.setAttribute("href", n),
        (t.onclick = s),
        t.appendChild(o),
        a.appendChild(t);
    } else a.appendChild(o);
  }
  const u = document.createElement("div");
  if (((u.className = "ab-card-body"), t.dismissible)) {
    t.logCardDismissal = () => logCardDismissal(t);
    const e = createCloseButton("Dismiss Card", void 0, t.dismissCard.bind(t));
    a.appendChild(e),
      detectSwipe(u, DIRECTIONS.W, t => {
        (a.className += " ab-swiped-left"), e.onclick(t);
      }),
      detectSwipe(u, DIRECTIONS.X, t => {
        (a.className += " ab-swiped-right"), e.onclick(t);
      });
  }
  let p = "",
    b = !1;
  if ((t.title && "" !== t.title && ((p = t.title), (b = !0)), b)) {
    const t = document.createElement("h1");
    if (
      ((t.className = "ab-title"),
      (t.id = r$1.Z.Y()),
      a.setAttribute("aria-labelledby", t.id),
      i)
    ) {
      const o = document.createElement("a");
      o.setAttribute("href", n),
        (o.onclick = s),
        o.appendChild(document.createTextNode(p)),
        t.appendChild(o);
    } else t.appendChild(document.createTextNode(p));
    u.appendChild(t);
  }
  const l = document.createElement("div");
  if (
    ((l.className = b ? "ab-description" : "ab-description ab-no-title"),
    (l.id = r$1.Z.Y()),
    a.setAttribute("aria-describedby", l.id),
    t.description && l.appendChild(document.createTextNode(t.description)),
    i)
  ) {
    const o = document.createElement("div");
    o.className = "ab-url-area";
    const e = document.createElement("a");
    e.setAttribute("href", n),
      t.linkText && e.appendChild(document.createTextNode(t.linkText)),
      (e.onclick = s),
      o.appendChild(e),
      l.appendChild(o);
  }
  u.appendChild(l), a.appendChild(u);
  const f = document.createElement("div");
  return (
    (f.className = "ab-unread-indicator"),
    t.viewed && (f.className += " read"),
    a.appendChild(f),
    (t._ = a),
    a
  );
}

var zt = {
  en: {
    NO_CARDS_MESSAGE:
      "We have no updates for you at this time.<br/>Please check again later.",
    FEED_TIMEOUT_MESSAGE:
      "Sorry, this refresh timed out.<br/>Please try again later."
  },
  ar: {
    NO_CARDS_MESSAGE: "ليس لدينا أي تحديث. يرجى التحقق مرة أخرى لاحقاً",
    FEED_TIMEOUT_MESSAGE: "يرجى تكرار المحاولة لاحقا"
  },
  cs: {
    NO_CARDS_MESSAGE:
      "V tuto chvíli pro vás nemáme žádné aktualizace.<br/>Zkontrolujte prosím znovu později.",
    FEED_TIMEOUT_MESSAGE: "Prosím zkuste to znovu později."
  },
  da: {
    NO_CARDS_MESSAGE: "Vi har ingen updates.<br/>Prøv venligst senere.",
    FEED_TIMEOUT_MESSAGE: "Prøv venligst senere."
  },
  de: {
    NO_CARDS_MESSAGE:
      "Derzeit sind keine Updates verfügbar.<br/>Bitte später noch einmal versuchen.",
    FEED_TIMEOUT_MESSAGE: "Bitte später noch einmal versuchen."
  },
  es: {
    NO_CARDS_MESSAGE:
      "No tenemos actualizaciones.<br/>Por favor compruébelo más tarde.",
    FEED_TIMEOUT_MESSAGE: "Por favor inténtelo más tarde."
  },
  "es-mx": {
    NO_CARDS_MESSAGE:
      "No tenemos ninguna actualización.<br/>Vuelva a verificar más tarde.",
    FEED_TIMEOUT_MESSAGE: "Por favor, vuelva a intentarlo más tarde."
  },
  et: {
    NO_CARDS_MESSAGE:
      "Uuendusi pole praegu saadaval.<br/>Proovige hiljem uuesti.",
    FEED_TIMEOUT_MESSAGE: "Palun proovige hiljem uuesti."
  },
  fi: {
    NO_CARDS_MESSAGE:
      "Päivityksiä ei ole saatavilla.<br/>Tarkista myöhemmin uudelleen.",
    FEED_TIMEOUT_MESSAGE: "Yritä myöhemmin uudelleen."
  },
  fr: {
    NO_CARDS_MESSAGE:
      "Aucune mise à jour disponible.<br/>Veuillez vérifier ultérieurement.",
    FEED_TIMEOUT_MESSAGE: "Veuillez réessayer ultérieurement."
  },
  he: {
    NO_CARDS_MESSAGE: ".אין לנו עדכונים. בבקשה בדוק שוב בקרוב",
    FEED_TIMEOUT_MESSAGE: ".בבקשה נסה שוב בקרוב"
  },
  hi: {
    NO_CARDS_MESSAGE:
      "हमारे पास कोई अपडेट नहीं हैं। कृपया बाद में फिर से जाँच करें.।",
    FEED_TIMEOUT_MESSAGE: "कृपया बाद में दोबारा प्रयास करें।."
  },
  id: {
    NO_CARDS_MESSAGE: "Kami tidak memiliki pembaruan. Coba lagi nanti.",
    FEED_TIMEOUT_MESSAGE: "Coba lagi nanti."
  },
  it: {
    NO_CARDS_MESSAGE: "Non ci sono aggiornamenti.<br/>Ricontrollare più tardi.",
    FEED_TIMEOUT_MESSAGE: "Riprovare più tardi."
  },
  ja: {
    NO_CARDS_MESSAGE:
      "アップデートはありません。<br/>後でもう一度確認してください。",
    FEED_TIMEOUT_MESSAGE: "後でもう一度試してください。"
  },
  ko: {
    NO_CARDS_MESSAGE: "업데이트가 없습니다. 다음에 다시 확인해 주십시오.",
    FEED_TIMEOUT_MESSAGE: "나중에 다시 시도해 주십시오."
  },
  ms: {
    NO_CARDS_MESSAGE: "Tiada kemas kini. Sila periksa kemudian.",
    FEED_TIMEOUT_MESSAGE: "Sila cuba kemudian."
  },
  nl: {
    NO_CARDS_MESSAGE: "Er zijn geen updates.<br/>Probeer het later opnieuw.",
    FEED_TIMEOUT_MESSAGE: "Probeer het later opnieuw."
  },
  no: {
    NO_CARDS_MESSAGE:
      "Vi har ingen oppdateringer.<br/>Vennligst sjekk igjen senere.",
    FEED_TIMEOUT_MESSAGE: "Vennligst prøv igjen senere."
  },
  pl: {
    NO_CARDS_MESSAGE:
      "Brak aktualizacji.<br/>Proszę sprawdzić ponownie później.",
    FEED_TIMEOUT_MESSAGE: "Proszę spróbować ponownie później."
  },
  pt: {
    NO_CARDS_MESSAGE:
      "Não temos atualizações.<br/>Por favor, verifique mais tarde.",
    FEED_TIMEOUT_MESSAGE: "Por favor, tente mais tarde."
  },
  "pt-br": {
    NO_CARDS_MESSAGE:
      "Não temos nenhuma atualização.<br/>Verifique novamente mais tarde.",
    FEED_TIMEOUT_MESSAGE: "Tente novamente mais tarde."
  },
  ru: {
    NO_CARDS_MESSAGE:
      "Обновления недоступны.<br/>Пожалуйста, проверьте снова позже.",
    FEED_TIMEOUT_MESSAGE: "Пожалуйста, повторите попытку позже."
  },
  sv: {
    NO_CARDS_MESSAGE: "Det finns inga uppdateringar.<br/>Försök igen senare.",
    FEED_TIMEOUT_MESSAGE: "Försök igen senare."
  },
  th: {
    NO_CARDS_MESSAGE: "เราไม่มีการอัพเดต กรุณาตรวจสอบภายหลัง.",
    FEED_TIMEOUT_MESSAGE: "กรุณาลองใหม่ภายหลัง."
  },
  uk: {
    NO_CARDS_MESSAGE:
      "Оновлення недоступні.<br/>ласка, перевірте знову пізніше.",
    FEED_TIMEOUT_MESSAGE: "Будь ласка, спробуйте ще раз пізніше."
  },
  vi: {
    NO_CARDS_MESSAGE:
      "Chúng tôi không có cập nhật nào.<br/>Vui lòng kiểm tra lại sau.",
    FEED_TIMEOUT_MESSAGE: "Vui lòng thử lại sau."
  },
  "zh-hk": {
    NO_CARDS_MESSAGE: "暫時沒有更新.<br/>請稍候再試.",
    FEED_TIMEOUT_MESSAGE: "請稍候再試."
  },
  "zh-hans": {
    NO_CARDS_MESSAGE: "暂时没有更新.<br/>请稍后再试.",
    FEED_TIMEOUT_MESSAGE: "请稍候再试."
  },
  "zh-hant": {
    NO_CARDS_MESSAGE: "暫時沒有更新.<br/>請稍候再試.",
    FEED_TIMEOUT_MESSAGE: "請稍候再試."
  },
  "zh-tw": {
    NO_CARDS_MESSAGE: "暫時沒有更新.<br/>請稍候再試.",
    FEED_TIMEOUT_MESSAGE: "請稍候再試."
  },
  zh: {
    NO_CARDS_MESSAGE: "暂时没有更新.<br/>请稍后再试.",
    FEED_TIMEOUT_MESSAGE: "请稍候再试."
  }
};

class nr {
  constructor(t, l) {
    if ((null != t && (t = t.toLowerCase()), null != t && null == zt[t])) {
      const l = t.indexOf("-");
      l > 0 && (t = t.substring(0, l));
    }
    if (null == zt[t]) {
      const a =
        "Braze does not yet have a localization for language " +
        t +
        ", defaulting to English. Please contact us if you are willing and able to help us translate our SDK into this language.";
      l ? r$1.j.error(a) : r$1.j.info(a), (t = "en");
    }
    this.language = t;
  }
  get(t) {
    return zt[this.language][t];
  }
}

const Ee = {
  t: !1,
  i: null,
  m: () => {
    if ((Ee.o(), !Ee.i)) {
      let r = V.language,
        t = !1;
      e.nn(L.Mn) && ((r = e.nn(L.Mn)), (t = !0)), (Ee.i = new nr(r, t));
    }
    return Ee.i;
  },
  o: () => {
    Ee.t || (e.g(Ee), (Ee.t = !0));
  },
  destroy: () => {
    (Ee.i = null), (Ee.t = !1);
  }
};

function removeSubscription(r) {
  e.rr() && e.removeSubscription(r);
}

const LAST_REQUESTED_REFRESH_DATA_ATTRIBUTE =
  "data-last-requested-refresh";
function destroyFeedHtml(e) {
  e &&
    ((e.className = e.className.replace("ab-show", "ab-hide")),
    setTimeout(() => {
      e && e.parentNode && e.parentNode.removeChild(e);
    }, x.Th));
  const t = e.getAttribute("data-update-subscription-id");
  null != t && removeSubscription(t);
}
function _generateFeedBody(e, t) {
  const o = document.createElement("div");
  if (
    ((o.className = "ab-feed-body"),
    o.setAttribute("aria-label", "Feed"),
    o.setAttribute("role", "feed"),
    null == e.lastUpdated)
  ) {
    const e = document.createElement("div");
    e.className = "ab-no-cards-message";
    const t = document.createElement("i");
    (t.className = "fa fa-spinner fa-spin fa-4x ab-initial-spinner"),
      e.appendChild(t),
      o.appendChild(e);
  } else {
    let s = !1;
    const logCardClick = t => {
      e.logCardClick(t);
    };
    for (const n of e.cards) {
      const a = n instanceof ControlCard;
      !a || e.ur()
        ? (o.appendChild(cardToHtml(n, logCardClick, t)), (s = s || !a))
        : r$1.j.error(
            "Received a control card for a legacy news feed. Control cards are only supported with content cards."
          );
    }
    if (!s) {
      const e = document.createElement("div");
      (e.className = "ab-no-cards-message"),
        (e.innerHTML = Ee.m().get("NO_CARDS_MESSAGE")),
        e.setAttribute("role", "article"),
        o.appendChild(e);
    }
  }
  return o;
}
function detectFeedImpressions(e, t) {
  if (null != t) {
    const o = [],
      r = t.querySelectorAll(".ab-card");
    e.fo || (e.fo = {});
    for (let t = 0; t < r.length; t++) {
      const s = getCardId(r[t]);
      if (e.fo[s]) continue;
      let n = topHadImpression(r[t]),
        a = bottomHadImpression(r[t]);
      const i = n,
        d = a,
        f = topIsInView(r[t]),
        c = bottomIsInView(r[t]);
      if (
        (!n && f && ((n = !0), impressOnTop(r[t])),
        !a && c && ((a = !0), impressOnBottom(r[t])),
        n && a)
      ) {
        if ((f || c || markCardAsRead(r[t]), i && d)) continue;
        for (const t of e.cards)
          if (t.id === s) {
            (e.fo[t.id] = !0), o.push(t);
            break;
          }
      }
    }
    o.length > 0 && e.logCardImpressions(o);
  }
}
function refreshFeed(e, t) {
  t.setAttribute("aria-busy", "true");
  const o = t.querySelectorAll(".ab-refresh-button")[0];
  null != o && (o.className += " fa-spin");
  const r = new Date().valueOf().toString();
  t.setAttribute("data-last-requested-refresh", r),
    setTimeout(() => {
      if (t.getAttribute("data-last-requested-refresh") === r) {
        const e = t.querySelectorAll(".fa-spin");
        for (let t = 0; t < e.length; t++)
          e[t].className = e[t].className.replace(/fa-spin/g, "");
        const o = t.querySelectorAll(".ab-initial-spinner")[0];
        if (null != o) {
          const e = document.createElement("span");
          (e.innerHTML = Ee.m().get("FEED_TIMEOUT_MESSAGE")),
            o.parentNode.appendChild(e),
            o.parentNode.removeChild(o);
        }
        "true" === t.getAttribute("aria-busy") &&
          t.setAttribute("aria-busy", "false");
      }
    }, x.uo),
    e.sr();
}
function feedToHtml(e, t) {
  const o = document.createElement("div");
  (o.className = "ab-feed ab-hide ab-effect-slide"),
    o.setAttribute("role", "dialog"),
    o.setAttribute("aria-label", "Feed"),
    o.setAttribute("tabindex", "-1");
  const r = document.createElement("div");
  (r.className = "ab-feed-buttons-wrapper"),
    r.setAttribute("role", "group"),
    o.appendChild(r);
  const s = document.createElement("i");
  (s.className = "fa fa-times ab-close-button"),
    s.setAttribute("aria-label", "Close Feed"),
    s.setAttribute("tabindex", "0"),
    s.setAttribute("role", "button");
  const n = e => {
    destroyFeedHtml(o), e.stopPropagation();
  };
  s.addEventListener("keydown", e => {
    (e.keyCode !== KeyCodes.yo && e.keyCode !== KeyCodes.Fo) || n(e);
  }),
    (s.onclick = n);
  const a = document.createElement("i");
  (a.className = "fa fa-refresh ab-refresh-button"),
    null == e.lastUpdated && (a.className += " fa-spin"),
    a.setAttribute("aria-label", "Refresh Feed"),
    a.setAttribute("tabindex", "0"),
    a.setAttribute("role", "button");
  const i = t => {
    refreshFeed(e, o), t.stopPropagation();
  };
  return (
    a.addEventListener("keydown", e => {
      (e.keyCode !== KeyCodes.yo && e.keyCode !== KeyCodes.Fo) || i(e);
    }),
    (a.onclick = i),
    r.appendChild(a),
    r.appendChild(s),
    o.appendChild(_generateFeedBody(e, t)),
    (o.onscroll = () => {
      detectFeedImpressions(e, o);
    }),
    o
  );
}
function updateFeedCards(e, t, o, s, n) {
  if (!isArray(t)) return;
  const a = [];
  for (const e of t)
    if (e instanceof Card) {
      if (e.url && BRAZE_ACTION_URI_REGEX.test(e.url)) {
        let t = getDecodedBrazeAction(e.url);
        if (containsUnknownBrazeAction(t)) {
          r$1.j.error(ineligibleBrazeActionURLErrorMessage(INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Ji, "Content Card"));
          continue;
        }
      }
      a.push(e);
    }
  if (((e.cards = a), (e.lastUpdated = o), null != s))
    if ((s.setAttribute("aria-busy", "false"), null == e.lastUpdated))
      destroyFeedHtml(s);
    else {
      const t = s.querySelectorAll(".ab-feed-body")[0];
      if (null != t) {
        const o = _generateFeedBody(e, n);
        t.parentNode.replaceChild(o, t), detectFeedImpressions(e, o.parentNode);
      }
    }
}
function registerFeedSubscriptionId(e, t) {
  t.setAttribute("data-update-subscription-id", e);
}

function hideContentCards(n) {
  if (!e.rr()) return;
  const o = document.querySelectorAll(".ab-feed");
  for (let e = 0; e < o.length; e++)
    (null == n || (null != n && o[e].parentNode === n)) && destroyFeedHtml(o[e]);
}

function logContentCardsDisplayed() {
  if (e.rr()) return logDeprecationWarning("logContentCardsDisplayed", "method"), !0;
}

function showContentCards(n, t) {
  if (!e.rr()) return;
  setupFeedUI();
  let o = !1;
  null == n && ((n = document.body), (o = !0));
  const a = e.nn(L.tn) || e.nn(L.en) || !1,
    i = g$1.er().As(!1);
  "function" == typeof t && updateFeedCards(i, t(i.cards.slice()), i.lastUpdated, null, a);
  const s = feedToHtml(i, a),
    l = g$1.er(),
    f = l.Vt();
  (null == i.lastUpdated ||
    new Date().valueOf() - i.lastUpdated.valueOf() > ContentCards.mr) &&
    (null == f || new Date().valueOf() - f > ContentCards.mr) &&
    (r$1.j.info(
      `Cached content cards were older than max TTL of ${ContentCards.mr} ms, requesting an update from the server.`
    ),
    refreshFeed(i, s),
    l.Wt(new Date().valueOf()));
  const c = new Date().valueOf(),
    u = subscribeToContentCardsUpdates(function(n) {
      const e = s.querySelectorAll(".ab-refresh-button")[0];
      if (null != e) {
        let n = 500,
          t = (n -= new Date().valueOf() - c);
        const o = s.getAttribute(LAST_REQUESTED_REFRESH_DATA_ATTRIBUTE);
        o && ((t = parseInt(o)), isNaN(t) || (n -= new Date().valueOf() - t)),
          setTimeout(function() {
            e.className = e.className.replace(/fa-spin/g, "");
          }, Math.max(n, 0));
      }
      let o = n.cards;
      "function" == typeof t && (o = t(o.slice())),
        updateFeedCards(i, o, n.lastUpdated, s, a);
    });
  registerFeedSubscriptionId(u, s);
  const d = function(n) {
    const t = n.querySelectorAll(".ab-feed");
    let e = null;
    for (let o = 0; o < t.length; o++) t[o].parentNode === n && (e = t[o]);
    null != e
      ? (destroyFeedHtml(e), null != e.parentNode && e.parentNode.replaceChild(s, e))
      : n.appendChild(s),
      setTimeout(function() {
        s.className = s.className.replace("ab-hide", "ab-show");
      }, 0),
      o && s.focus(),
      detectFeedImpressions(i, s),
      setCardHeight(i.cards, n);
  };
  var m;
  null != n
    ? d(n)
    : (window.onload =
        ((m = window.onload),
        function() {
          "function" == typeof m && m(new Event("oldLoad")), d(document.body);
        }));
}

function subscribeToContentCardsUpdates(r) {
  if (!e.rr()) return;
  const t = g$1.er(),
    n = t.hi(r);
  if (!t.Xt()) {
    const r = e.cr();
    if (r) {
      const n = r.pr(() => {
        t.Es();
      });
      n && t.Yt(n);
    }
  }
  return n;
}

function toggleContentCards(n, o) {
  e.rr() &&
    (document.querySelectorAll(".ab-feed").length > 0
      ? hideContentCards()
      : showContentCards(n, o));
}

var BrazeSdkMetadata = {
  GOOGLE_TAG_MANAGER: "gg",
  MPARTICLE: "mp",
  SEGMENT: "sg",
  TEALIUM: "tl",
  MANUAL: "manu",
  NPM: "npm",
  CDN: "wcd",
  SHOPIFY: "shp"
};

function addSdkMetadata(a) {
  if (!e.rr()) return;
  if (!isArray(a))
    return (
      r$1.j.error("Cannot set SDK metadata because metadata is not an array."), !1
    );
  for (const t of a)
    if (
      !validateValueIsFromEnum(
        BrazeSdkMetadata,
        t,
        "sdkMetadata contained an invalid value.",
        "BrazeSdkMetadata"
      )
    )
      return !1;
  const t = e.ar();
  return t && t.addSdkMetadata(a), !0;
}

function changeUser(i, t) {
  if (!e.rr()) return;
  if (null == i || 0 === i.length || i != i)
    return void r$1.j.error("changeUser requires a non-empty userId.");
  if (getByteLength(i) > User.lr)
    return void r$1.j.error(
      `Rejected user id "${i}" because it is longer than ${User.lr} bytes.`
    );
  if (null != t && !validateStandardString(t, "set signature for new user", "signature")) return;
  const s = e.cr();
  s && s.changeUser(i.toString(), e.gr(), t);
}

var changeUser$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	changeUser: changeUser
});

function destroy() {
  r$1.j.info("Destroying Braze instance"), e.destroy(!0);
}

function disableSDK() {
  const n = e.cr();
  n && n.requestImmediateDataFlush();
  const o = new O.ee(null, !0);
  o.store(STORAGE_KEYS.re, "This-cookie-will-expire-in-" + o.ne());
  const s = r$1.zt.Ft;
  new r$1.xt(s, r$1.j).setItem(s.Jt.oe, s.se, !0), e.destroy(!1), e.ae(!0);
}

function enableSDK() {
  new O.ee(null, !0).remove(STORAGE_KEYS.re);
  const a = r$1.zt.Ft;
  new r$1.xt(a, r$1.j).br(a.Jt.oe, a.se), e.destroy(!1), e.ae(!1);
}

function getDeviceId(i) {
  if (!e.rr()) return;
  null == i &&
    r$1.j.error(
      "getDeviceId must be supplied with a callback. e.g., braze.getDeviceId(function(deviceId) {console.log('the device id is ' + deviceId)})"
    );
  const t = e.ie();
  "function" == typeof i && t && i(t.te().id);
}

function initialize(i, n) {
  return e.initialize(i, n);
}

function isDisabled() {
  return !!new O.ee(null, !0).wr(STORAGE_KEYS.re);
}

function logCustomEvent(t, o) {
  if (!e.rr()) return !1;
  if (null == t || t.length <= 0)
    return (
      r$1.j.error(
        `logCustomEvent requires a non-empty eventName, got "${t}". Ignoring event.`
      ),
      !1
    );
  if (!validateCustomString(t, "log custom event", "the event name")) return !1;
  const [n, i] = validateCustomProperties(
    o,
    LOG_CUSTOM_EVENT_STRING,
    "eventProperties",
    `log custom event "${t}"`,
    "event"
  );
  if (!n) return !1;
  const m = e.tr();
  if (m && m.ge(t))
    return r$1.j.info(`Custom Event "${t}" is blocklisted, ignoring.`), !1;
  const g = s$1.N(r$1.q.CustomEvent, { n: t, p: i });
  if (g.O) {
    r$1.j.info(`Logged custom event "${t}".`);
    for (const e of g.ve) TriggersProviderFactory.er().je(tt.be, [t, o], e);
  }
  return g.O;
}

var logCustomEvent$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	logCustomEvent: logCustomEvent
});

function logPurchase(o, i, n, t, D) {
  if (!e.rr()) return !1;
  if (
    (null == n && (n = "USD"), null == t && (t = 1), null == o || o.length <= 0)
  )
    return (
      r$1.j.error(
        `logPurchase requires a non-empty productId, got "${o}", ignoring.`
      ),
      !1
    );
  if (!validateCustomString(o, "log purchase", "the purchase name")) return !1;
  if (null == i || isNaN(parseFloat(i.toString())))
    return (
      r$1.j.error(`logPurchase requires a numeric price, got ${i}, ignoring.`), !1
    );
  const a = parseFloat(i.toString()).toFixed(2);
  if (null == t || isNaN(parseInt(t.toString())))
    return (
      r$1.j.error(
        `logPurchase requires an integer quantity, got ${t}, ignoring.`
      ),
      !1
    );
  const u = parseInt(t.toString());
  if (u < 1 || u > MAX_PURCHASE_QUANTITY)
    return (
      r$1.j.error(
        `logPurchase requires a quantity >1 and <${MAX_PURCHASE_QUANTITY}, got ${u}, ignoring.`
      ),
      !1
    );
  n = null != n ? n.toUpperCase() : n;
  if (
    -1 ===
    [
      "AED",
      "AFN",
      "ALL",
      "AMD",
      "ANG",
      "AOA",
      "ARS",
      "AUD",
      "AWG",
      "AZN",
      "BAM",
      "BBD",
      "BDT",
      "BGN",
      "BHD",
      "BIF",
      "BMD",
      "BND",
      "BOB",
      "BRL",
      "BSD",
      "BTC",
      "BTN",
      "BWP",
      "BYR",
      "BZD",
      "CAD",
      "CDF",
      "CHF",
      "CLF",
      "CLP",
      "CNY",
      "COP",
      "CRC",
      "CUC",
      "CUP",
      "CVE",
      "CZK",
      "DJF",
      "DKK",
      "DOP",
      "DZD",
      "EEK",
      "EGP",
      "ERN",
      "ETB",
      "EUR",
      "FJD",
      "FKP",
      "GBP",
      "GEL",
      "GGP",
      "GHS",
      "GIP",
      "GMD",
      "GNF",
      "GTQ",
      "GYD",
      "HKD",
      "HNL",
      "HRK",
      "HTG",
      "HUF",
      "IDR",
      "ILS",
      "IMP",
      "INR",
      "IQD",
      "IRR",
      "ISK",
      "JEP",
      "JMD",
      "JOD",
      "JPY",
      "KES",
      "KGS",
      "KHR",
      "KMF",
      "KPW",
      "KRW",
      "KWD",
      "KYD",
      "KZT",
      "LAK",
      "LBP",
      "LKR",
      "LRD",
      "LSL",
      "LTL",
      "LVL",
      "LYD",
      "MAD",
      "MDL",
      "MGA",
      "MKD",
      "MMK",
      "MNT",
      "MOP",
      "MRO",
      "MTL",
      "MUR",
      "MVR",
      "MWK",
      "MXN",
      "MYR",
      "MZN",
      "NAD",
      "NGN",
      "NIO",
      "NOK",
      "NPR",
      "NZD",
      "OMR",
      "PAB",
      "PEN",
      "PGK",
      "PHP",
      "PKR",
      "PLN",
      "PYG",
      "QAR",
      "RON",
      "RSD",
      "RUB",
      "RWF",
      "SAR",
      "SBD",
      "SCR",
      "SDG",
      "SEK",
      "SGD",
      "SHP",
      "SLL",
      "SOS",
      "SRD",
      "STD",
      "SVC",
      "SYP",
      "SZL",
      "THB",
      "TJS",
      "TMT",
      "TND",
      "TOP",
      "TRY",
      "TTD",
      "TWD",
      "TZS",
      "UAH",
      "UGX",
      "USD",
      "UYU",
      "UZS",
      "VEF",
      "VND",
      "VUV",
      "WST",
      "XAF",
      "XAG",
      "XAU",
      "XCD",
      "XDR",
      "XOF",
      "XPD",
      "XPF",
      "XPT",
      "YER",
      "ZAR",
      "ZMK",
      "ZMW",
      "ZWL"
    ].indexOf(n)
  )
    return (
      r$1.j.error(
        `logPurchase requires a valid currencyCode, got ${n}, ignoring.`
      ),
      !1
    );
  const [g, P] = validateCustomProperties(
    D,
    "logPurchase",
    "purchaseProperties",
    `log purchase "${o}"`,
    "purchase"
  );
  if (!g) return !1;
  const R = e.tr();
  if (R && R.Dr(o))
    return r$1.j.info(`Purchase "${o}" is blocklisted, ignoring.`), !1;
  const c = s$1.N(r$1.q.Pr, { pid: o, c: n, p: a, q: u, pr: P });
  if (c.O) {
    r$1.j.info(
      `Logged ${u} purchase${u > 1 ? "s" : ""} of "${o}" for ${n} ${a}.`
    );
    for (const r of c.ve) TriggersProviderFactory.er().je(tt.Rr, [o, D], r);
  }
  return c.O;
}

var logPurchase$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	logPurchase: logPurchase
});

function openSession() {
  if (!e.rr()) return;
  const i = e.cr();
  if (!i) return;
  i.openSession();
  const t = r$1.zt.Ft,
    o = new r$1.xt(t, r$1.j);
  o.hr(t.Jt.kr, function(n, e) {
    const s = e.lastClick,
      c = e.trackingString;
    r$1.j.info(`Firing push click trigger from ${c} push click at ${s}`);
    const f = i.vr(s, c),
      g = function() {
        TriggersProviderFactory.er().je(tt.zr, [c], f);
      };
    i.$r(g, g), o.br(t.Jt.kr, n);
  }),
    o.Mt(t.Jt.yr, function(r) {
      i.Fr(r);
    });
}

function removeAllSubscriptions() {
  e.rr() && e.removeAllSubscriptions();
}

function requestImmediateDataFlush(t) {
  if (!e.rr()) return;
  const r = e.cr();
  r && r.requestImmediateDataFlush(t);
}

var requestImmediateDataFlush$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	requestImmediateDataFlush: requestImmediateDataFlush
});

function setLogger(e) {
  r$1.j.setLogger(e);
}

function setSdkAuthenticationSignature(t) {
  if (!e.rr()) return !1;
  if ("" === t || !validateStandardString(t, "set signature", "signature", !1)) return !1;
  const r = e.Sr();
  return !!r && (r.setSdkAuthenticationSignature(t), !0);
}

function subscribeToSdkAuthenticationFailures(r) {
  if (!e.rr()) return;
  const n = e.Sr();
  return n ? n.subscribeToSdkAuthenticationFailures(r) : void 0;
}

function toggleLogging() {
  r$1.j.toggleLogging();
}

function wipeData() {
  if (null == e.l()) throw new Error(BRAZE_MUST_BE_INITIALIZED_ERROR);
  const o = e.l();
  o && o.clearData();
  const t = keys(r$1.zt);
  for (let o = 0; o < t.length; o++) {
    const n = t[o],
      s = r$1.zt[n];
    new r$1.xt(s, r$1.j).clearData();
  }
  if (e.rr()) for (const o of e.gr()) o.clearData(!0);
}

class re extends y {
  constructor(t, s) {
    super(),
      (this.u = t),
      (this.Ci = s),
      (this.cards = []),
      (this.Ui = null),
      (this.u = t),
      (this.Ci = s),
      (this.yt = new E()),
      e.jt(this.yt),
      this.Lt();
  }
  Lt() {
    let t = [];
    this.u && (t = this.u.v(STORAGE_KEYS.k.ki) || []);
    const s = [];
    for (let i = 0; i < t.length; i++) {
      const e = newCardFromSerializedValue(t[i]);
      null != e && s.push(e);
    }
    (this.cards = s), this.u && (this.Ui = rehydrateDateAfterJsonization(this.u.v(STORAGE_KEYS.k.Ai)));
  }
  Bi(t) {
    const s = [];
    let e = null,
      r = {};
    this.u && (r = this.u.v(STORAGE_KEYS.k.L) || {});
    const h = {};
    for (let i = 0; i < t.length; i++) {
      e = t[i];
      const o = newCardFromFeedJson(e);
      if (null != o) {
        const t = o.id;
        t && r[t] && ((o.viewed = !0), (h[t] = !0)), s.push(o);
      }
    }
    (this.cards = s),
      this.Rs(),
      (this.Ui = new Date()),
      this.u && (this.u.D(STORAGE_KEYS.k.L, h), this.u.D(STORAGE_KEYS.k.Ai, this.Ui));
  }
  Rs() {
    if (!this.u) return;
    const t = [];
    for (let s = 0; s < this.cards.length; s++) t.push(this.cards[s].ss());
    this.u.D(STORAGE_KEYS.k.ki, t);
  }
  Ts(t) {
    null != t &&
      t.feed &&
      (this.Lt(),
      this.Bi(t.feed),
      this.yt.Et(new Feed(this.cards.slice(), this.Ui)));
  }
  Ei() {
    this.Lt();
    const t = [],
      s = new Date();
    for (let i = 0; i < this.cards.length; i++) {
      const e = this.cards[i].expiresAt;
      let r = !0;
      null != e && (r = e >= s), r && t.push(this.cards[i]);
    }
    return new Feed(t, this.Ui);
  }
  Es() {
    this.Ci && this.Ci.requestFeedRefresh();
  }
  hi(t) {
    return this.yt.lt(t);
  }
  clearData(t) {
    null == t && (t = !1),
      (this.cards = []),
      (this.Ui = null),
      t && this.u && (this.u.ri(STORAGE_KEYS.k.ki), this.u.ri(STORAGE_KEYS.k.Ai)),
      this.yt.Et(new Feed(this.cards.slice(), this.Ui));
  }
}

const ie = {
  t: !1,
  provider: null,
  er: () => (
    ie.o(),
    ie.provider || ((ie.provider = new re(e.l(), e.cr())), e.dr(ie.provider)),
    ie.provider
  ),
  o: () => {
    ie.t || (e.g(ie), (ie.t = !0));
  },
  destroy: () => {
    (ie.provider = null), (ie.t = !1);
  }
};
var ie$1 = ie;

function requestFeedRefresh() {
  if (e.rr()) return ie$1.er().Es();
}

class Feed extends x {
  constructor(r, e) {
    super(r, e);
  }
  logCardImpressions(r) {
    logCardImpressions(r, !1);
  }
  logCardClick(r) {
    logCardClick(r, !1);
  }
  sr() {
    requestFeedRefresh();
  }
  ur() {
    return !1;
  }
}

function getCachedFeed() {
  if (e.rr()) return ie$1.er().Ei();
}

function destroyFeed() {
  if (!e.rr()) return;
  const o = document.querySelectorAll(".ab-feed");
  for (let e = 0; e < o.length; e++) destroyFeedHtml(o[e]);
}

function logFeedDisplayed() {
  if (!e.rr()) return;
  const i = e.ar();
  return i ? i.qr(r$1.Cr.Ar).O : void 0;
}

function showFeed(t, n, o) {
  if (!e.rr()) return;
  setupFeedUI();
  const s = (e, t) => {
      if (null == t) return e;
      const n = [];
      for (let e = 0; e < t.length; e++) n.push(t[e].toLowerCase());
      const o = [];
      for (let t = 0; t < e.length; t++) {
        const r = [],
          s = e[t].categories || [];
        for (let e = 0; e < s.length; e++) r.push(s[e].toLowerCase());
        intersection(r, n).length > 0 && o.push(e[t]);
      }
      return o;
    },
    i = e.nn(L.tn) || e.nn(L.en) || !1;
  let l = !1;
  null == t && ((t = document.body), (l = !0));
  let a = !1,
    f = null;
  null == n
    ? ((f = ie$1.er().Ei()),
      updateFeedCards(f, s(f.cards, o), f.lastUpdated, null, i),
      (a = !0))
    : (f = new Feed(s(n, o), new Date()));
  const u = feedToHtml(f, i);
  if (a) {
    (null == f.lastUpdated ||
      new Date().valueOf() - f.lastUpdated.valueOf() > Feed.mr) &&
      (r$1.j.info(
        `Cached feed was older than max TTL of ${Feed.mr} ms, requesting an update from the server.`
      ),
      refreshFeed(f, u));
    const e = new Date().valueOf(),
      t = subscribeToFeedUpdates(function(t) {
        const n = u.querySelectorAll(".ab-refresh-button")[0];
        if (null != n) {
          let t = 500;
          t -= new Date().valueOf() - e;
          const o = u.getAttribute(LAST_REQUESTED_REFRESH_DATA_ATTRIBUTE);
          if (o) {
            const e = parseInt(o);
            isNaN(e) || (t -= new Date().valueOf() - e);
          }
          setTimeout(function() {
            n.className = n.className.replace(/fa-spin/g, "");
          }, Math.max(t, 0));
        }
        updateFeedCards(f, s(t.cards, o), t.lastUpdated, u, i);
      });
    registerFeedSubscriptionId(t, u);
  }
  const d = e => {
    const t = e.querySelectorAll(".ab-feed");
    let n = null;
    for (let o = 0; o < t.length; o++) t[o].parentNode === e && (n = t[o]);
    null != n
      ? (destroyFeedHtml(n), n.parentNode && n.parentNode.replaceChild(u, n))
      : e.appendChild(u),
      setTimeout(function() {
        u.className = u.className.replace("ab-hide", "ab-show");
      }, 0),
      l && u.focus(),
      logFeedDisplayed(),
      detectFeedImpressions(f, u),
      f && setCardHeight(f.cards, e);
  };
  var m;
  null != t
    ? d(t)
    : (window.onload =
        ((m = window.onload),
        function() {
          "function" == typeof m && m(new Event("oldLoad")), d(document.body);
        }));
}

var showFeed$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	showFeed: showFeed
});

function subscribeToFeedUpdates(r) {
  if (e.rr()) return ie$1.er().hi(r);
}

function toggleFeed(o, n, r) {
  e.rr() &&
    (document.querySelectorAll(".ab-feed").length > 0
      ? destroyFeed()
      : showFeed(o, n, r));
}

function isPushBlocked() {
  if (e.rr()) return yt$1.isPushBlocked();
}

function isPushPermissionGranted() {
  if (e.rr()) return yt$1.isPushPermissionGranted();
}

function isPushSupported() {
  if (e.rr()) return yt$1.isPushSupported();
}

class na {
  constructor(i, t, e, s, r, n, o, u, h, a) {
    (this.Wr = i),
      (this.Yr = t),
      (this.Xr = e),
      (this.Zr = r),
      (this.sn = n),
      (this.wt = o),
      (this.rn = u),
      (this.on = h),
      (this.u = a),
      (this.Wr = i),
      (this.Yr = t),
      (this.Xr = e),
      (this.un = s + "/safari/" + t),
      (this.Zr = r || "/service-worker.js"),
      (this.sn = n),
      (this.wt = o),
      (this.rn = u || !1),
      (this.on = h || !1),
      (this.u = a),
      (this.hn = yt$1.an()),
      (this.cn = yt$1.fn());
  }
  ln() {
    return this.on;
  }
  dn(i, t, e, s, n) {
    i.unsubscribe()
      .then(i => {
        i
          ? this.pn(t, e, s, n)
          : (r$1.j.error("Failed to unsubscribe device from push."),
            "function" == typeof n && n(!1));
      })
      .catch(i => {
        r$1.j.error("Push unsubscription error: " + i),
          "function" == typeof n && n(!1);
      });
  }
  bn(i, t, e) {
    const s = (i => {
      if ("string" == typeof i) return i;
      if (0 !== i.endpoint.indexOf("https://android.googleapis.com/gcm/send"))
        return i.endpoint;
      let t = i.endpoint;
      const e = i;
      return (
        e.mn &&
          -1 === i.endpoint.indexOf(e.mn) &&
          (t = i.endpoint + "/" + e.mn),
        t
      );
    })(i);
    let r = null,
      n = null;
    if (i instanceof PushSubscription && null != i.getKey)
      try {
        const t = Array.from(new Uint8Array(i.getKey("p256dh"))),
          e = Array.from(new Uint8Array(i.getKey("auth")));
        (r = btoa(String.fromCharCode.apply(null, t))),
          (n = btoa(String.fromCharCode.apply(null, e)));
      } catch (i) {
        if (i instanceof Error && "invalid arguments" !== i.message) throw i;
      }
    const o = (i => {
      let t;
      return i.options &&
        (t = i.options.applicationServerKey) &&
        t.byteLength &&
        t.byteLength > 0
        ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(t))))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
        : null;
    })(i);
    this.Wr && this.Wr.yn(s, t, r, n, o),
      s && "function" == typeof e && e(s, r, n);
  }
  gn() {
    this.Wr && this.Wr.wn(!0);
  }
  vn(i, t) {
    this.Wr && this.Wr.wn(!1), r$1.j.info(i), "function" == typeof t && t(!1);
  }
  kn(i, t, e, s) {
    var n;
    if ("default" === t.permission)
      try {
        window.safari.pushNotification.requestPermission(
          this.un,
          i,
          {
            api_key: this.Yr,
            device_id:
              (null === (n = this.Xr) || void 0 === n ? void 0 : n.te().id) ||
              ""
          },
          t => {
            "granted" === t.permission &&
              this.Wr &&
              this.Wr.setPushNotificationSubscriptionType(
                User.NotificationSubscriptionTypes.OPTED_IN
              ),
              this.kn(i, t, e, s);
          }
        );
      } catch (i) {
        this.vn("Could not request permission for push: " + i, s);
      }
    else
      "denied" === t.permission
        ? this.vn(
            "The user has blocked notifications from this site, or Safari push is not configured in the Braze dashboard.",
            s
          )
        : "granted" === t.permission &&
          (r$1.j.info("Device successfully subscribed to push."),
          this.bn(t.deviceToken, new Date(), e));
  }
  requestPermission(i, t, e) {
    const s = s => {
      switch (s) {
        case "granted":
          return void ("function" == typeof i && i());
        case "default":
          return void ("function" == typeof t && t());
        case "denied":
          return void ("function" == typeof e && e());
        default:
          r$1.j.error("Received unexpected permission result " + s);
      }
    };
    let n = !1;
    const o = window.Notification.requestPermission(i => {
      n && s(i);
    });
    o
      ? o.then(i => {
          s(i);
        })
      : (n = !0);
  }
  pn(i, t, e, s) {
    const n = { userVisibleOnly: !0 };
    null != t && (n.applicationServerKey = t),
      i.pushManager
        .subscribe(n)
        .then(i => {
          r$1.j.info("Device successfully subscribed to push."),
            this.bn(i, new Date(), e);
        })
        .catch(i => {
          yt$1.isPushBlocked()
            ? (r$1.j.info("Permission for push notifications was denied."),
              "function" == typeof s && s(!1))
            : (r$1.j.error("Push subscription failed: " + i),
              "function" == typeof s && s(!0));
        });
  }
  Pn() {
    return this.rn
      ? navigator.serviceWorker.getRegistration()
      : navigator.serviceWorker.register(this.Zr).then(() =>
          navigator.serviceWorker.ready.then(
            i => (
              i &&
                "function" == typeof i.update &&
                i.update().catch(i => {
                  r$1.j.info("ServiceWorker update failed: " + i);
                }),
              i
            )
          )
        );
  }
  Dn(i) {
    this.rn ||
      (i.unregister(), r$1.j.info("Service worker successfully unregistered."));
  }
  subscribe(t, e) {
    if (!yt$1.isPushSupported())
      return r$1.j.info(na.Sn), void ("function" == typeof e && e(!1));
    if (this.hn) {
      if (!this.rn && null != window.location) {
        let i = this.Zr;
        -1 === i.indexOf(window.location.host) &&
          (i = window.location.host + i),
          -1 === i.indexOf(window.location.protocol) &&
            (i = window.location.protocol + "//" + i);
        const t = i.substr(0, i.lastIndexOf("/") + 1);
        if (0 !== WindowUtils.An().indexOf(t))
          return (
            r$1.j.error(
              "Cannot subscribe to push from a path higher than the service worker location (tried to subscribe from " +
                window.location.pathname +
                " but service worker is at " +
                i +
                ")"
            ),
            void ("function" == typeof e && e(!0))
          );
      }
      if (yt$1.isPushBlocked())
        return void this.vn(
          "Notifications from this site are blocked. This may be a temporary embargo or a permanent denial.",
          e
        );
      if (this.wt && !this.wt.jn() && 0 === this.wt.oi())
        return (
          r$1.j.info(
            "Waiting for VAPID key from server config before subscribing to push."
          ),
          void this.wt.Un(() => {
            this.subscribe(t, e);
          })
        );
      const s = () => {
          r$1.j.info("Permission for push notifications was denied."),
            "function" == typeof e && e(!1);
        },
        n = () => {
          let i = "Permission for push notifications was ignored.";
          yt$1.isPushBlocked() &&
            (i +=
              " The browser has automatically blocked further permission requests for a period (probably 1 week)."),
            r$1.j.info(i),
            "function" == typeof e && e(!0);
        },
        o = yt$1.isPushPermissionGranted(),
        u = () => {
          !o &&
            this.Wr &&
            this.Wr.setPushNotificationSubscriptionType(
              User.NotificationSubscriptionTypes.OPTED_IN
            ),
            this.Pn()
              .then(s => {
                if (null == s)
                  return (
                    r$1.j.error(
                      "No service worker registration. Set the `manageServiceWorkerExternally` initialization option to false or ensure that your service worker is registered before calling registerPush."
                    ),
                    void ("function" == typeof e && e(!0))
                  );
                s.pushManager
                  .getSubscription()
                  .then(n => {
                    let o = null;
                    if (
                      (this.wt &&
                        null != this.wt.jn() &&
                        (o = r$1._n.Wn(this.wt.jn())),
                      n)
                    ) {
                      let u,
                        h = null,
                        a = null;
                      if ((this.u && (u = this.u.v(STORAGE_KEYS.k.xn)), u && !isArray(u))) {
                        let i;
                        try {
                          i = ti.Tn(u).Nn;
                        } catch (t) {
                          i = null;
                        }
                        null == i ||
                          isNaN(i.getTime()) ||
                          0 === i.getTime() ||
                          ((h = i),
                          (a = new Date(h)),
                          a.setMonth(h.getMonth() + 6));
                      }
                      null != o &&
                      n.options &&
                      n.options.applicationServerKey &&
                      n.options.applicationServerKey.byteLength &&
                      n.options.applicationServerKey.byteLength > 0 &&
                      !isEqual(o, new Uint8Array(n.options.applicationServerKey))
                        ? (n.options.applicationServerKey.byteLength > 12
                            ? r$1.j.info(
                                "Device was already subscribed to push using a different VAPID provider, creating new subscription."
                              )
                            : r$1.j.info(
                                "Attempting to upgrade a gcm_sender_id-based push registration to VAPID - depending on the browser this may or may not result in the same gcm_sender_id-based subscription."
                              ),
                          this.dn(n, s, o, t, e))
                        : n.expirationTime &&
                          new Date(n.expirationTime).valueOf() <=
                            new Date().valueOf()
                        ? (r$1.j.info(
                            "Push subscription is expired, creating new subscription."
                          ),
                          this.dn(n, s, o, t, e))
                        : u && isArray(u)
                        ? this.dn(n, s, o, t, e)
                        : null == a
                        ? (r$1.j.info(
                            "No push subscription creation date found, creating new subscription."
                          ),
                          this.dn(n, s, o, t, e))
                        : a.valueOf() <= new Date().valueOf()
                        ? (r$1.j.info(
                            "Push subscription older than 6 months, creating new subscription."
                          ),
                          this.dn(n, s, o, t, e))
                        : (r$1.j.info(
                            "Device already subscribed to push, sending existing subscription to backend."
                          ),
                          this.bn(n, h, t));
                    } else this.pn(s, o, t, e);
                  })
                  .catch(i => {
                    r$1.j.error(
                      "Error checking current push subscriptions: " + i
                    );
                  });
              })
              .catch(i => {
                r$1.j.error("ServiceWorker registration failed: " + i);
              });
        };
      this.requestPermission(u, n, s);
    } else if (this.cn) {
      if (null == this.sn || "" === this.sn)
        return (
          r$1.j.error(
            "You must supply the safariWebsitePushId initialization option in order to use registerPush on Safari"
          ),
          void ("function" == typeof e && e(!0))
        );
      const i = window.safari.pushNotification.permission(this.sn);
      this.kn(this.sn, i, t, e);
    }
  }
  unsubscribe(i, t) {
    if (!yt$1.isPushSupported())
      return r$1.j.info(na.Sn), void ("function" == typeof t && t());
    this.hn
      ? navigator.serviceWorker.getRegistration().then(e => {
          e
            ? e.pushManager
                .getSubscription()
                .then(s => {
                  s &&
                    (this.gn(),
                    s
                      .unsubscribe()
                      .then(s => {
                        s
                          ? (r$1.j.info(
                              "Device successfully unsubscribed from push."
                            ),
                            "function" == typeof i && i())
                          : (r$1.j.error(
                              "Failed to unsubscribe device from push."
                            ),
                            "function" == typeof t && t()),
                          this.Dn(e);
                      })
                      .catch(i => {
                        r$1.j.error("Push unsubscription error: " + i),
                          "function" == typeof t && t();
                      }));
                })
                .catch(i => {
                  r$1.j.error("Error unsubscribing from push: " + i),
                    "function" == typeof t && t();
                })
            : (r$1.j.info("Device already unsubscribed from push."),
              "function" == typeof i && i());
        })
      : this.cn &&
        (this.gn(),
        r$1.j.info("Device unsubscribed from push."),
        "function" == typeof i && i());
  }
}
na.Sn = "Push notifications are not supported in this browser.";

const ra = {
  t: !1,
  i: null,
  m: () => (
    ra.o(),
    ra.i ||
      (ra.i = new na(
        e.jr(),
        e.ea(),
        e.ie(),
        e.Zs(),
        e.nn(L.na),
        e.nn(L.ra),
        e.tr(),
        e.nn(L.ta),
        e.nn(L.ia),
        e.l()
      )),
    ra.i
  ),
  o: () => {
    ra.t || (e.g(ra), (ra.t = !0));
  },
  destroy: () => {
    (ra.i = null), (ra.t = !1);
  }
};
var ra$1 = ra;

var pushManagerFactory = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': ra$1
});

function requestPushPermission(r, n) {
  if (e.rr())
    return ra$1.m().subscribe((n, o, t) => {
      const s = e.cr();
      s && s.requestImmediateDataFlush(), "function" == typeof r && r(n, o, t);
    }, n);
}

var requestPushPermission$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	requestPushPermission: requestPushPermission
});

function unregisterPush(r, n) {
  if (e.rr()) return ra$1.m().unsubscribe(r, n);
}

var unregisterPush$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	unregisterPush: unregisterPush
});

class FeatureFlag {
  constructor(t, r = !1, e = {}) {
    (this.id = t),
      (this.enabled = r),
      (this.properties = e),
      (this.id = t),
      (this.enabled = r),
      (this.properties = e);
  }
  getStringProperty(t) {
    const r = this.properties[t];
    return null == r
      ? (this.Er(t), null)
      : this.Br(r)
      ? r.value
      : (this.Ir("string"), null);
  }
  getNumberProperty(t) {
    const r = this.properties[t];
    return null == r
      ? (this.Er(t), null)
      : this.Nr(r)
      ? r.value
      : (this.Ir("number"), null);
  }
  getBooleanProperty(t) {
    const r = this.properties[t];
    return null == r
      ? (this.Er(t), null)
      : this.Tr(r)
      ? r.value
      : (this.Ir("boolean"), null);
  }
  ss() {
    const t = {};
    return (
      (t[FeatureFlag.hs.ns] = this.id),
      (t[FeatureFlag.hs.Fe] = this.enabled),
      (t[FeatureFlag.hs.we] = this.properties),
      t
    );
  }
  Ir(t) {
    r$1.j.info(`Property is not of type ${t}.`);
  }
  Er(t) {
    r$1.j.info(`${t} not found in feature flag properties.`);
  }
  Br(t) {
    return "string" === t.type && "string" == typeof t.value;
  }
  Nr(t) {
    return "number" === t.type && "number" == typeof t.value;
  }
  Tr(t) {
    return "boolean" === t.type && "boolean" == typeof t.value;
  }
}
(FeatureFlag.hs = { ns: "id", Fe: "e", we: "pr" }),
  (FeatureFlag.Tt = { ns: "id", Fe: "enabled", we: "properties" });

function newFeatureFlagFromJson(e) {
  if (e[FeatureFlag.Tt.ns] && "boolean" == typeof e[FeatureFlag.Tt.Fe])
    return new FeatureFlag(
      e[FeatureFlag.Tt.ns],
      e[FeatureFlag.Tt.Fe],
      e[FeatureFlag.Tt.we]
    );
  r$1.j.info(`Unable to create feature flag from ${JSON.stringify(e, null, 2)}`);
}
function newFeatureFlagFromSerializedValue(e) {
  if (e[FeatureFlag.hs.ns] && "boolean" == typeof e[FeatureFlag.hs.Fe])
    return new FeatureFlag(
      e[FeatureFlag.hs.ns],
      e[FeatureFlag.hs.Fe],
      e[FeatureFlag.hs.we]
    );
  r$1.j.info(
    `Unable to deserialize feature flag from ${JSON.stringify(e, null, 2)}`
  );
}

class er extends y {
  constructor(t, s, i) {
    super(),
      (this.wt = t),
      (this.gt = s),
      (this.u = i),
      (this.mi = []),
      (this.pi = 0),
      (this.wt = t),
      (this.gt = s),
      (this.u = i),
      (this.gi = null),
      (this.Fi = new E()),
      (this.wi = 10),
      (this.yi = null),
      (this.ji = null),
      e.jt(this.Fi);
  }
  Ts(t) {
    if ((!this.wt || this.wt.bi()) && null != t && t.feature_flags) {
      this.mi = [];
      for (const s of t.feature_flags) {
        const t = newFeatureFlagFromJson(s);
        t && this.mi.push(t);
      }
      (this.pi = new Date().getTime()), this.vi(), this.Fi.Et(this.mi);
    }
  }
  Ti() {
    let t = {};
    this.u && (t = this.u.v(STORAGE_KEYS.k.Di));
    const s = {};
    for (const i in t) {
      const e = newFeatureFlagFromSerializedValue(t[i]);
      e && (s[e.id] = e);
    }
    return s;
  }
  hi(t) {
    return this.Fi.lt(t);
  }
  refreshFeatureFlags(t, s, i = !1, e = !0) {
    if (!this.Ri(i))
      return (
        !this.gi &&
          this.wt &&
          (this.gi = this.wt.Ni(() => {
            this.refreshFeatureFlags(t, s);
          })),
        void ("function" == typeof s && s())
      );
    if ((e && this.qi(), !this.gt)) return void ("function" == typeof s && s());
    const r = this.gt.Gs({}, !0),
      h = this.gt.Ks(r, T.Qs.xi);
    let o = !1;
    this.gt.Vs(r, () => {
      this.gt
        ? (T.Xs(this.u, T.Qs.xi, new Date().valueOf()),
          C.Ys({
            url: `${this.gt.Zs()}/feature_flags/sync`,
            headers: h,
            data: r,
            O: i => {
              if (!this.gt.ti(r, i, h))
                return (o = !0), void ("function" == typeof s && s());
              this.gt.si(), this.Ts(i), (o = !1), "function" == typeof t && t();
            },
            error: t => {
              this.gt.ii(t, "retrieving feature flags"),
                (o = !0),
                "function" == typeof s && s();
            },
            ei: () => {
              if (e && o && !this.ji) {
                let e = this.yi;
                (null == e || e < 1e3 * this.wi) && (e = 1e3 * this.wi),
                  this.zi(Math.min(3e5, randomInclusive(1e3 * this.wi, 3 * e)), t, s, i);
              }
            }
          }))
        : "function" == typeof s && s();
    });
  }
  qi() {
    null != this.ji && (clearTimeout(this.ji), (this.ji = null));
  }
  zi(t = 1e3 * this.wi, s, i, e) {
    this.qi(),
      (this.ji = window.setTimeout(() => {
        this.refreshFeatureFlags(s, i, e);
      }, t)),
      (this.yi = t);
  }
  Ri(t) {
    if (!this.wt) return !1;
    if (!t) {
      const t = parseFloat(this.wt.Si());
      let s = !1;
      if (!isNaN(t)) {
        if (-1 === t) return r$1.j.info("Feature flag refreshes not allowed"), !1;
        s = new Date().getTime() >= (this.pi || 0) + 1e3 * t;
      }
      if (!s)
        return (
          r$1.j.info(`Feature flag refreshes were rate limited to ${t} seconds`),
          !1
        );
    }
    return this.wt.bi();
  }
  vi() {
    if (!this.u) return;
    const t = {};
    for (const s of this.mi) {
      const i = s.ss();
      t[s.id] = i;
    }
    this.u.D(STORAGE_KEYS.k.Di, t), this.u.D(STORAGE_KEYS.k.$i, this.pi);
  }
}

const ir = {
  t: !1,
  provider: null,
  er: () => (
    ir.o(),
    ir.provider ||
      ((ir.provider = new er(e.tr(), e.ar(), e.l())), e.dr(ir.provider)),
    ir.provider
  ),
  o: () => {
    ir.t || (e.g(ir), (ir.t = !0));
  },
  destroy: () => {
    (ir.provider = null), (ir.t = !1);
  }
};
var ir$1 = ir;

function tr(r, t, a = !1) {
  if (e.rr()) return ir$1.er().refreshFeatureFlags(r, t, a);
}
function refreshFeatureFlags(r, e) {
  tr(r, e);
}

var refreshFeatureFlags$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	refreshFeatureFlags: refreshFeatureFlags,
	'default': tr
});

function getFeatureFlag(t) {
  if (!e.rr()) return;
  const a = e.tr();
  if (a && !a.bi())
    return r$1.j.info("Feature flags are not enabled."), new FeatureFlag(t);
  const o = ir$1.er().Ti();
  return o[t] ? o[t] : new FeatureFlag(t);
}

function getAllFeatureFlags() {
  if (!e.rr()) return;
  const t = [],
    a = e.tr();
  if (a && !a.bi()) return r$1.j.info("Feature flags are not enabled."), t;
  const o = ir$1.er().Ti();
  for (const r in o) t.push(o[r]);
  return t;
}

function subscribeToFeatureFlagsUpdates(r) {
  if (!e.rr()) return;
  const t = getAllFeatureFlags();
  t && "function" == typeof r && r(t);
  return ir$1.er().hi(r);
}

var src = /*#__PURE__*/Object.freeze({
	__proto__: null,
	WindowUtils: WindowUtils,
	logCardClick: logCardClick,
	logCardDismissal: logCardDismissal,
	logCardImpressions: logCardImpressions,
	logContentCardImpressions: logContentCardImpressions,
	logContentCardClick: logContentCardClick,
	Card: Card,
	Banner: Banner,
	CaptionedImage: CaptionedImage,
	ClassicCard: ClassicCard,
	ControlCard: ControlCard,
	ContentCards: ContentCards,
	getCachedContentCards: getCachedContentCards,
	hideContentCards: hideContentCards,
	logContentCardsDisplayed: logContentCardsDisplayed,
	requestContentCardsRefresh: requestContentCardsRefresh,
	showContentCards: showContentCards,
	subscribeToContentCardsUpdates: subscribeToContentCardsUpdates,
	toggleContentCards: toggleContentCards,
	addSdkMetadata: addSdkMetadata,
	changeUser: changeUser,
	destroy: destroy,
	BrazeSdkMetadata: BrazeSdkMetadata,
	DeviceProperties: DeviceProperties,
	disableSDK: disableSDK,
	enableSDK: enableSDK,
	getDeviceId: getDeviceId,
	getUser: getUser,
	initialize: initialize,
	isDisabled: isDisabled,
	logCustomEvent: logCustomEvent,
	logPurchase: logPurchase,
	openSession: openSession,
	removeAllSubscriptions: removeAllSubscriptions,
	removeSubscription: removeSubscription,
	requestImmediateDataFlush: requestImmediateDataFlush,
	setLogger: setLogger,
	setSdkAuthenticationSignature: setSdkAuthenticationSignature,
	subscribeToSdkAuthenticationFailures: subscribeToSdkAuthenticationFailures,
	toggleLogging: toggleLogging,
	wipeData: wipeData,
	handleBrazeAction: handleBrazeAction,
	Feed: Feed,
	getCachedFeed: getCachedFeed,
	destroyFeed: destroyFeed,
	logFeedDisplayed: logFeedDisplayed,
	requestFeedRefresh: requestFeedRefresh,
	showFeed: showFeed,
	subscribeToFeedUpdates: subscribeToFeedUpdates,
	toggleFeed: toggleFeed,
	InAppMessage: InAppMessage,
	InAppMessageButton: InAppMessageButton,
	ControlMessage: ControlMessage,
	FullScreenMessage: FullScreenMessage,
	HtmlMessage: HtmlMessage,
	ModalMessage: ModalMessage,
	SlideUpMessage: SlideUpMessage,
	automaticallyShowInAppMessages: automaticallyShowInAppMessages,
	logInAppMessageButtonClick: logInAppMessageButtonClick,
	logInAppMessageClick: logInAppMessageClick,
	logInAppMessageHtmlClick: logInAppMessageHtmlClick,
	logInAppMessageImpression: logInAppMessageImpression,
	showInAppMessage: showInAppMessage,
	subscribeToInAppMessage: subscribeToInAppMessage,
	isPushBlocked: isPushBlocked,
	isPushPermissionGranted: isPushPermissionGranted,
	isPushSupported: isPushSupported,
	requestPushPermission: requestPushPermission,
	unregisterPush: unregisterPush,
	User: User,
	FeatureFlag: FeatureFlag,
	refreshFeatureFlags: refreshFeatureFlags,
	getFeatureFlag: getFeatureFlag,
	subscribeToFeatureFlagsUpdates: subscribeToFeatureFlagsUpdates,
	getAllFeatureFlags: getAllFeatureFlags
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(src);

window.braze = require$$0;
//  Copyright 2015 mParticle, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

// This should remain Appboy and not Braze until the core SDK is able to parse the moduleID and not the name (go.mparticle.com/work/SQDSDKS-4655)
var name = 'Appboy',
    suffix = 'v4',
    moduleId = 28,
    version = '4.2.2',
    MessageType = {
        PageView: 3,
        PageEvent: 4,
        Commerce: 16,
    },
    CommerceEventType = mParticle.CommerceEventType;

var clusterMapping = {
    '01': 'sdk.iad-01.braze.com',
    '02': 'sdk.iad-02.braze.com',
    '03': 'sdk.iad-03.braze.com',
    '04': 'sdk.iad-04.braze.com',
    '05': 'sdk.iad-05.braze.com',
    '06': 'sdk.iad-06.braze.com',
    '08': 'sdk.iad-08.braze.com',
    EU: 'sdk.fra-01.braze.eu',
    EU02: 'sdk.fra-02.braze.eu',
};

var constructor = function() {
    var self = this,
        forwarderSettings,
        options = {},
        reportingService,
        hasConsentMappings,
        parsedConsentMappings,
        mpCustomFlags;

    self.name = name;
    self.suffix = suffix;

    var DefaultAttributeMethods = {
        $LastName: 'setLastName',
        $FirstName: 'setFirstName',
        Email: 'setEmail',
        $Gender: 'setGender',
        $Country: 'setCountry',
        $City: 'setHomeCity',
        $Mobile: 'setPhoneNumber',
        $Age: 'setDateOfBirth',
        last_name: 'setLastName',
        first_name: 'setFirstName',
        email: 'setEmail',
        gender: 'setGender',
        country: 'setCountry',
        home_city: 'setHomeCity',
        email_subscribe: 'setEmailNotificationSubscriptionType',
        push_subscribe: 'setPushNotificationSubscriptionType',
        phone: 'setPhoneNumber',
        dob: 'setDateOfBirth',
    };

    var bundleCommerceEventData = false;
    var forwardSkuAsProductName = false;

    var brazeConsentKeys = [
        '$google_ad_user_data',
        '$google_ad_personalization',
    ];

    var latestUserBrazeConsentString;

    // A purchase event can either log a single event with all products
    // or multiple purchase events (one per product)
    function logPurchaseEvent(event) {
        var reportEvent = false;

        if (bundleCommerceEventData) {
            reportEvent = logSinglePurchaseEventWithProducts(event);
        } else {
            reportEvent = logPurchaseEventPerProduct(event);
        }
        return reportEvent === true;
    }

    function logSinglePurchaseEventWithProducts(event) {
        var quantity = 1;
        var eventAttributes = mergeObjects(event.EventAttributes, {
            products: [],
        });
        var eventName = getCommerceEventName(event.EventCategory);

        // All commerce events except for promotion/impression events will have a
        // ProductAction property, but if this ever changes in the future, this
        // check will prevent errors
        if (!event.ProductAction) {
            return false;
        }

        if (event.ProductAction.TransactionId) {
            eventAttributes['Transaction Id'] =
                event.ProductAction.TransactionId;
        }

        if (
            event.ProductAction.ProductList &&
            event.ProductAction.ProductList.length
        ) {
            eventAttributes.products = addProducts(
                event.ProductAction.ProductList
            );
        }

        kitLogger(
            'braze.logPurchase',
            eventName,
            event.ProductAction.TotalAmount,
            event.CurrencyCode,
            quantity,
            eventAttributes
        );

        var reportEvent = braze.logPurchase(
            eventName,
            event.ProductAction.TotalAmount,
            event.CurrencyCode,
            quantity,
            eventAttributes
        );

        return reportEvent === true;
    }

    function logPurchaseEventPerProduct(event) {
        var reportEvent = false;
        if (event.ProductAction.ProductList) {
            event.ProductAction.ProductList.forEach(function(product) {
                var productName;

                if (forwardSkuAsProductName) {
                    productName = product.Sku;
                } else {
                    productName = product.Name;
                }
                var sanitizedProductName = getSanitizedValueForBraze(
                    productName
                );

                if (product.Attributes == null) {
                    product.Attributes = {};
                }

                product.Attributes['Sku'] = product.Sku;

                var productAttributes = mergeObjects(product.Attributes, {
                    'Transaction Id': event.ProductAction.TransactionId,
                });

                var sanitizedProperties = getSanitizedCustomProperties(
                    productAttributes
                );

                if (sanitizedProperties == null) {
                    return (
                        'Properties did not pass validation for ' +
                        sanitizedProductName
                    );
                }
                var price = parseFloat(product.Price);

                kitLogger(
                    'braze.logPurchase',
                    sanitizedProductName,
                    price,
                    event.CurrencyCode,
                    product.Quantity,
                    sanitizedProperties
                );

                reportEvent = braze.logPurchase(
                    sanitizedProductName,
                    price,
                    event.CurrencyCode,
                    product.Quantity,
                    sanitizedProperties
                );
            });
        }
        return reportEvent === true;
    }

    function getCommerceEventName(eventType) {
        const eventNamePrefix = 'eCommerce';
        let eventName;

        switch (eventType) {
            case CommerceEventType.ProductAddToCart:
                eventName = 'add_to_cart';
                break;
            case CommerceEventType.ProductRemoveFromCart:
                eventName = 'remove_from_cart';
                break;
            case CommerceEventType.ProductCheckout:
                eventName = 'checkout';
                break;
            case CommerceEventType.ProductCheckoutOption:
                eventName = 'checkout_option';
                break;
            case CommerceEventType.ProductClick:
                eventName = 'click';
                break;
            case CommerceEventType.ProductViewDetail:
                eventName = 'view_detail';
                break;
            case CommerceEventType.ProductPurchase:
                eventName = 'purchase';
                break;
            case CommerceEventType.ProductRefund:
                eventName = 'refund';
                break;
            case CommerceEventType.ProductAddToWishlist:
                eventName = 'add_to_wishlist';
                break;
            case CommerceEventType.ProductRemoveFromWishlist:
                eventName = 'remove_from_wishlist';
                break;
            case CommerceEventType.PromotionView:
                eventName = 'view';
                break;
            case CommerceEventType.PromotionClick:
                eventName = 'click';
                break;
            case CommerceEventType.ProductImpression:
                eventName = 'Impression';
                break;
            default:
                eventName = 'unknown';
                break;
        }
        return [eventNamePrefix, eventName].join(' - ');
    }

    function logBrazePageViewEvent(event) {
        var sanitizedEventName,
            sanitizedAttrs,
            eventName,
            attrs = event.EventAttributes || {};

        attrs.hostname = window.location.hostname;
        attrs.title = window.document.title;

        if (forwarderSettings.setEventNameForPageView === 'True') {
            eventName = event.EventName;
        } else {
            eventName = window.location.pathname;
        }
        sanitizedEventName = getSanitizedValueForBraze(eventName);
        sanitizedAttrs = getSanitizedCustomProperties(attrs);

        kitLogger('braze.logCustomEvent', sanitizedEventName, sanitizedAttrs);

        var reportEvent = braze.logCustomEvent(
            sanitizedEventName,
            sanitizedAttrs
        );
        return reportEvent === true;
    }

    function setDefaultAttribute(key, value) {
        if (key === 'dob') {
            if (!(value instanceof Date)) {
                return (
                    "Can't call removeUserAttribute or setUserAttribute on forwarder " +
                    name +
                    ", removeUserAttribute or setUserAttribute must set 'dob' to a date"
                );
            } else {
                kitLogger(
                    'braze.getUser().setDateOfBirth',
                    value.getFullYear(),
                    value.getMonth() + 1,
                    value.getDate()
                );

                braze
                    .getUser()
                    .setDateOfBirth(
                        value.getFullYear(),
                        value.getMonth() + 1,
                        value.getDate()
                    );
            }
        } else if (key === '$Age') {
            if (typeof value === 'number') {
                var year = new Date().getFullYear() - value;

                kitLogger('braze.getUser().setDateOfBirth', year, 1, 1);

                braze.getUser().setDateOfBirth(year, 1, 1);
            } else {
                return '$Age must be a number';
            }
        } else {
            if (value == null) {
                value = '';
            }
            if (!(typeof value === 'string')) {
                return (
                    "Can't call removeUserAttribute or setUserAttribute on forwarder " +
                    name +
                    ', removeUserAttribute or setUserAttribute must set this value to a string'
                );
            }
            var params = [];
            params.push(value);

            kitLogger(
                'braze.getUser().' + DefaultAttributeMethods[key],
                params
            );

            var u = braze.getUser();

            //This method uses the setLastName, setFirstName, setEmail, setCountry, setHomeCity, setPhoneNumber, setAvatarImageUrl, setDateOfBirth, setGender, setEmailNotificationSubscriptionType, and setPushNotificationSubscriptionType methods
            if (!u[DefaultAttributeMethods[key]].apply(u, params)) {
                return (
                    'removeUserAttribute or setUserAttribute on forwarder ' +
                    name +
                    ' failed to call, an invalid attribute value was passed in'
                );
            }
        }
    }

    function logBrazeEvent(event) {
        var sanitizedEventName = getSanitizedValueForBraze(event.EventName);
        var sanitizedProperties = getSanitizedCustomProperties(
            event.EventAttributes
        );

        if (sanitizedProperties == null) {
            return (
                'Properties did not pass validation for ' + sanitizedEventName
            );
        }

        kitLogger(
            'braze.logCustomEvent',
            sanitizedEventName,
            sanitizedProperties
        );

        var reportEvent = braze.logCustomEvent(
            sanitizedEventName,
            sanitizedProperties
        );

        return reportEvent === true;
    }

    /**************************/
    /** Begin mParticle API **/
    /**************************/
    function processEvent(event) {
        var reportEvent = false;
        maybeSetConsentBeforeEventLogged(event);

        if (event.EventDataType == MessageType.Commerce) {
            reportEvent = logCommerceEvent(event);
        } else if (event.EventDataType == MessageType.PageEvent) {
            reportEvent = logBrazeEvent(event);
        } else if (event.EventDataType == MessageType.PageView) {
            if (forwarderSettings.forwardScreenViews == 'True') {
                reportEvent = logBrazePageViewEvent(event);
            }
        } else {
            return (
                "Can't send event type to forwarder " +
                name +
                ', event type is not supported'
            );
        }

        if (reportEvent === true && reportingService) {
            reportingService(self, event);
        }
    }

    // mParticle commerce events use different Braze methods depending on if they are
    // a purchase event or a non-purchase commerce event
    function logCommerceEvent(event) {
        var reportEvent = false;
        if (event.EventCategory === CommerceEventType.ProductPurchase) {
            reportEvent = logPurchaseEvent(event);
            return reportEvent === true;
        } else {
            reportEvent = logNonPurchaseCommerceEvent(event);
            return reportEvent === true;
        }
    }

    // A non-purchase commerce event can either log a single event with all products
    // or one event per product when the commerce event is expanded
    function logNonPurchaseCommerceEvent(event) {
        if (bundleCommerceEventData) {
            return logNonPurchaseCommerceEventWithProducts(event);
        } else {
            return logExpandedNonPurchaseCommerceEvents(event);
        }
    }

    function logNonPurchaseCommerceEventWithProducts(mpEvent) {
        const commerceEventAttrs = {};
        const eventName = getCommerceEventName(mpEvent.EventCategory);

        try {
            switch (mpEvent.EventCategory) {
                case CommerceEventType.PromotionClick:
                case CommerceEventType.PromotionView:
                    commerceEventAttrs.promotions = addPromotions(
                        mpEvent.PromotionAction
                    );
                    break;
                case CommerceEventType.ProductImpression:
                    commerceEventAttrs.impressions = addImpressions(
                        mpEvent.ProductImpressions
                    );
                    break;
                default:
                    if (mpEvent.ProductAction.ProductList) {
                        commerceEventAttrs.products = addProducts(
                            mpEvent.ProductAction.ProductList
                        );
                    }
                    var transactionId = mpEvent.ProductAction.TransactionId;
                    var totalAmount = mpEvent.ProductAction.TotalAmount;
                    var taxAmount = mpEvent.ProductAction.TaxAmount;
                    var shippingAmount = mpEvent.ProductAction.ShippingAmount;
                    var affiliation = mpEvent.ProductAction.Affiliation;

                    if (transactionId) {
                        commerceEventAttrs['Transaction Id'] = transactionId;
                    }
                    if (totalAmount) {
                        commerceEventAttrs['Total Amount'] = totalAmount;
                    }
                    if (taxAmount) {
                        commerceEventAttrs['Tax Amount'] = taxAmount;
                    }
                    if (shippingAmount) {
                        commerceEventAttrs['Shipping Amount'] = shippingAmount;
                    }
                    if (affiliation) {
                        commerceEventAttrs['Affiliation'] = affiliation;
                    }
            }

            var sanitizedProperties = getSanitizedCustomProperties(
                mpEvent.EventAttributes
            );

            const brazeEvent = {
                EventName: eventName,
                EventAttributes: mergeObjects(
                    commerceEventAttrs,
                    sanitizedProperties
                ),
            };

            var reportEvent = logBrazeEvent(brazeEvent);
            return reportEvent;
        } catch (err) {
            return 'Error logging commerce event' + err.message;
        }
    }

    function addPromotions(promotionAction) {
        if (promotionAction && promotionAction.PromotionList) {
            return promotionAction.PromotionList;
        }
        return [];
    }

    function addImpressions(productImpressions) {
        if (productImpressions.length) {
            return productImpressions.map(function(impression) {
                return {
                    'Product Impression List': impression.ProductImpressionList,
                    products: addProducts(impression.ProductList),
                };
            });
        } else {
            return [];
        }
    }

    function addProducts(productList) {
        const productArray = [];
        if (!productList || productList.length === 0) {
            return productArray;
        }

        productList.forEach(function(product) {
            {
                var sanitizedProduct = parseProduct(
                    getSanitizedCustomProperties(product)
                );
                productArray.push(sanitizedProduct);
            }
        });

        return productArray;
    }

    function parseProduct(_product) {
        var product = {};
        for (var key in _product) {
            switch (key) {
                case 'Sku':
                    product.Id = _product[key];
                    break;
                case 'Name':
                    product.Name = forwardSkuAsProductName
                        ? _product.Sku
                        : _product.Name;
                    break;
                case 'CouponCode':
                    product['Coupon Code'] = _product[key];
                    break;
                case 'TotalAmount':
                    product['Total Product Amount'] = _product[key];
                    break;
                default:
                    product[key] = _product[key];
            }
        }

        return product;
    }

    function logExpandedNonPurchaseCommerceEvents(event) {
        var reportEvent = false;
        var listOfPageEvents = mParticle.eCommerce.expandCommerceEvent(event);
        if (listOfPageEvents !== null) {
            for (var i = 0; i < listOfPageEvents.length; i++) {
                // finalLoopResult keeps track of if any logBrazeEvent in this loop returns true or not
                var finalLoopResult = false;
                try {
                    reportEvent = logBrazeEvent(listOfPageEvents[i]);
                    if (reportEvent === true) {
                        finalLoopResult = true;
                    }
                } catch (err) {
                    return 'Error logging page event' + err.message;
                }
            }
            reportEvent = finalLoopResult === true;
        }
        return reportEvent;
    }

    function removeUserAttribute(key) {
        if (!(key in DefaultAttributeMethods)) {
            var sanitizedKey = getSanitizedValueForBraze(key);

            kitLogger(
                'braze.getUser().setCustomUserAttribute',
                sanitizedKey,
                null
            );

            braze.getUser().setCustomUserAttribute(sanitizedKey, null);
        } else {
            return setDefaultAttribute(key, null);
        }
    }

    function setUserAttribute(key, value) {
        if (!(key in DefaultAttributeMethods)) {
            var sanitizedKey = getSanitizedValueForBraze(key);
            var sanitizedValue = getSanitizedValueForBraze(value);
            if (value != null && sanitizedValue == null) {
                return 'Value did not pass validation for ' + key;
            }

            kitLogger(
                'braze.getUser().setCustomUserAttribute',
                sanitizedKey,
                sanitizedValue
            );

            braze
                .getUser()
                .setCustomUserAttribute(sanitizedKey, sanitizedValue);
        } else {
            return setDefaultAttribute(key, value);
        }
    }

    function setUserIdentity(id, type) {
        // Only use this method when mParicle core SDK is version 1
        // Other versions use onUserIdentified, which is called after setUserIdentity from core SDK
        if (window.mParticle.getVersion().split('.')[0] === '1') {
            if (type == window.mParticle.IdentityType.CustomerId) {
                kitLogger('braze.changeUser', id);

                braze.changeUser(id);
            } else if (type == window.mParticle.IdentityType.Email) {
                kitLogger('braze.getUser().setEmail', id);

                braze.getUser().setEmail(id);
            } else {
                return (
                    "Can't call setUserIdentity on forwarder " +
                    name +
                    ', identity type not supported.'
                );
            }
        }
    }

    // onUserIdentified is not used in version 1 so there is no need to check for version number
    function onUserIdentified(user) {
        kitLogger('calling MpBrazeKit.onUserIdentified');

        try {
            var brazeUserIDType,
                userIdentities = user.getUserIdentities().userIdentities;

            if (forwarderSettings.userIdentificationType === 'MPID') {
                brazeUserIDType = user.getMPID();
            } else {
                brazeUserIDType =
                    userIdentities[
                        forwarderSettings.userIdentificationType.toLowerCase()
                    ];
            }

            if (brazeUserIDType) {
                kitLogger('braze.changeUser', brazeUserIDType);

                braze.changeUser(brazeUserIDType);
            }

            if (userIdentities.email) {
                kitLogger('braze.getUser().setEmail', userIdentities.email);

                braze.getUser().setEmail(userIdentities.email);
            }
        } catch (e) {
            kitLogger(
                'Error in calling MpBrazeKit.onUserIdentified',
                e.message
            );
        }
    }

    function primeBrazeWebPush() {
        // The following code block is based on Braze's best practice for implementing
        // their push primer.  We only modify it to include pushPrimer and register_inapp settings.
        // https://www.braze.com/docs/developer_guide/platform_integration_guides/web/push_notifications/integration/#soft-push-prompts
        braze.subscribeToInAppMessage(function(inAppMessage) {
            var shouldDisplay = true;
            var pushPrimer = false;
            if (inAppMessage instanceof braze.InAppMessage) {
                // Read the key-value pair for msg-id
                var msgId = inAppMessage.extras['msg-id'];

                // If this is our push primer message
                if (msgId == 'push-primer') {
                    pushPrimer = true;
                    // We don't want to display the soft push prompt to users on browsers that don't support push, or if the user
                    // has already granted/blocked permission
                    if (
                        !braze.isPushSupported() ||
                        braze.isPushPermissionGranted() ||
                        braze.isPushBlocked()
                    ) {
                        shouldDisplay = false;
                    }
                    if (inAppMessage.buttons[0] != null) {
                        // Prompt the user when the first button is clicked
                        inAppMessage.buttons[0].subscribeToClickedEvent(
                            function() {
                                braze.requestPushPermission();
                            }
                        );
                    }
                }
            }

            // Display the message if it's a push primer message and shouldDisplay is true
            if (
                (pushPrimer && shouldDisplay) ||
                (!pushPrimer && forwarderSettings.register_inapp === 'True')
            ) {
                braze.showInAppMessage(inAppMessage);
            }
        });
    }

    function openSession(forwarderSettings) {
        braze.openSession();
        if (forwarderSettings.softPushCustomEventName) {
            kitLogger(
                'braze.logCustomEvent',
                forwarderSettings.softPushCustomEventName
            );

            braze.logCustomEvent(forwarderSettings.softPushCustomEventName);
        }
    }

    function prepareInitialConsent(user) {
        var userConsentState = getUserConsentState(user);

        var currentConsentPayload = generateBrazeConsentStatePayload(
            userConsentState
        );

        if (!isEmpty(currentConsentPayload)) {
            latestUserBrazeConsentString = JSON.stringify(
                currentConsentPayload
            );

            setConsentOnBraze(currentConsentPayload);
        }
    }

    function setConsentOnBraze(currentConsentPayload) {
        for (var key in currentConsentPayload) {
            braze
                .getUser()
                .setCustomUserAttribute(key, currentConsentPayload[key]);
        }
    }

    function maybeSetConsentBeforeEventLogged(event) {
        if (latestUserBrazeConsentString && !isEmpty(parsedConsentMappings)) {
            var eventConsentState = getEventConsentState(event.ConsentState);

            if (!isEmpty(eventConsentState)) {
                var eventBrazeConsent = generateBrazeConsentStatePayload(
                    eventConsentState
                );
                var eventBrazeConsentAsString = JSON.stringify(
                    eventBrazeConsent
                );

                if (
                    eventBrazeConsentAsString !== latestUserBrazeConsentString
                ) {
                    setConsentOnBraze(eventBrazeConsent);
                    latestUserBrazeConsentString = eventBrazeConsentAsString;
                }
            }
        }
    }

    function getEventConsentState(eventConsentState) {
        return eventConsentState && eventConsentState.getGDPRConsentState
            ? eventConsentState.getGDPRConsentState()
            : {};
    }

    function generateBrazeConsentStatePayload(consentState) {
        if (!parsedConsentMappings) return {};

        var payload = {};

        // These are Braze's consent constants for Braze's Audience Sync to Google
        // https://www.braze.com/docs/partners/canvas_steps/google_audience_sync

        var googleToBrazeConsentMap = {
            google_ad_user_data: '$google_ad_user_data',
            google_ad_personalization: '$google_ad_personalization',
        };

        for (var i = 0; i <= parsedConsentMappings.length - 1; i++) {
            var mappingEntry = parsedConsentMappings[i];
            // Although consent purposes can be inputted into the UI in any casing
            // the SDK will automatically lowercase them to prevent pseudo-duplicate
            // consent purposes, so we call `toLowerCase` on the consentMapping purposes here
            var mpMappedConsentName = mappingEntry.map.toLowerCase();
            // that mappingEntry.value returned from the server does not have a $ appended, so we have to add it
            var brazeMappedConsentName =
                googleToBrazeConsentMap[mappingEntry.value];

            if (
                consentState[mpMappedConsentName] &&
                brazeMappedConsentName &&
                brazeConsentKeys.indexOf(brazeMappedConsentName) !== -1
            ) {
                payload[brazeMappedConsentName] =
                    consentState[mpMappedConsentName].Consented;
            }
        }

        return payload;
    }

    function getUserConsentState(user) {
        var userConsentState = {};

        var consentState = user.getConsentState();

        if (consentState && consentState.getGDPRConsentState) {
            userConsentState = consentState.getGDPRConsentState();
        }

        return userConsentState;
    }

    function parseConsentSettingsString(consentMappingString) {
        return JSON.parse(consentMappingString.replace(/&quot;/g, '"'));
    }

    function initForwarder(
        settings,
        service,
        testMode,
        trackerId,
        userAttributes,
        userIdentities,
        appVersion,
        appName,
        customFlags
    ) {
        // check to see if there is a logger for backwards compatibility, and if not, mock one to avoid errors
        if (!self.logger) {
            // create a logger
            self.logger = {
                verbose: function() {},
            };
        }
        // eslint-disable-line no-unused-vars
        mpCustomFlags = customFlags;
        try {
            forwarderSettings = settings;
            bundleCommerceEventData =
                forwarderSettings.bundleCommerceEventData === 'True';
            forwardSkuAsProductName =
                forwarderSettings.forwardSkuAsProductName === 'True';
            reportingService = service;
            // 30 min is Braze default
            options.sessionTimeoutInSeconds =
                forwarderSettings.ABKSessionTimeoutKey || 1800;
            options.sdkFlavor = 'mparticle';
            options.allowUserSuppliedJavascript =
                forwarderSettings.enableHtmlInAppMessages == 'True';
            options.doNotLoadFontAwesome =
                forwarderSettings.doNotLoadFontAwesome == 'True';

            if (forwarderSettings.safariWebsitePushId) {
                options.safariWebsitePushId =
                    forwarderSettings.safariWebsitePushId;
            }

            if (forwarderSettings.serviceWorkerLocation) {
                options.serviceWorkerLocation =
                    forwarderSettings.serviceWorkerLocation;
            }

            if (forwarderSettings.consentMappingSDK) {
                parsedConsentMappings = parseConsentSettingsString(
                    forwarderSettings.consentMappingSDK
                );
                if (parsedConsentMappings.length) {
                    hasConsentMappings = true;
                }
            }

            var cluster =
                forwarderSettings.cluster ||
                forwarderSettings.dataCenterLocation;

            if (clusterMapping.hasOwnProperty(cluster)) {
                options.baseUrl = clusterMapping[cluster];
            } else {
                var customUrl = decodeClusterSetting(cluster);
                if (customUrl) {
                    options.baseUrl = customUrl;
                }
            }

            if (mpCustomFlags && mpCustomFlags[moduleId.toString()]) {
                var brazeFlags = mpCustomFlags[moduleId.toString()];
                if (typeof brazeFlags.initOptions === 'function') {
                    brazeFlags.initOptions(options);
                }
            }

            if (testMode !== true) {
                braze.initialize(forwarderSettings.apiKey, options);
                finishBrazeInitialization(forwarderSettings);
            } else {
                if (!braze.initialize(forwarderSettings.apiKey, options)) {
                    return 'Failed to initialize: ' + name;
                }
                finishBrazeInitialization(forwarderSettings);
            }
            return 'Successfully initialized: ' + name;
        } catch (e) {
            return (
                'Failed to initialize: ' + name + ' with error: ' + e.message
            );
        }
    }

    function finishBrazeInitialization(forwarderSettings) {
        braze.addSdkMetadata(['mp']);
        primeBrazeWebPush();

        const currentUser =
            mParticle.Identity !== null
                ? mParticle.Identity.getCurrentUser()
                : null;
        const mpid = currentUser ? currentUser.getMPID() : null;

        if (currentUser && mpid) {
            onUserIdentified(currentUser);
            if (hasConsentMappings) {
                prepareInitialConsent(currentUser);
            }
        }

        openSession(forwarderSettings);
    }

    /**************************/
    /** End mParticle API **/
    /**************************/

    function decodeClusterSetting(clusterSetting) {
        if (clusterSetting) {
            var decodedSetting = clusterSetting.replace(/&amp;/g, '&');
            decodedSetting = clusterSetting.replace(/&quot;/g, '"');
            try {
                var clusterSettingObject = JSON.parse(decodedSetting);
                if (clusterSettingObject && clusterSettingObject.JS) {
                    return 'https://' + clusterSettingObject.JS + '/api/v3';
                }
            } catch (e) {
                console.log(
                    'Unable to configure custom Braze cluster: ' + e.toString()
                );
            }
        }
    }

    function getSanitizedStringForBraze(value) {
        if (typeof value === 'string') {
            if (value.substr(0, 1) === '$') {
                return value.replace(/^\$+/g, '');
            } else {
                return value;
            }
        }
        return null;
    }

    function getSanitizedValueForBraze(value) {
        if (typeof value === 'string') {
            return getSanitizedStringForBraze(value);
        }

        if (Array.isArray(value)) {
            var sanitizedArray = [];
            for (var i in value) {
                var element = value[i];
                var sanitizedElement = getSanitizedStringForBraze(element);
                if (sanitizedElement == null) {
                    return null;
                }
                sanitizedArray.push(sanitizedElement);
            }
            return sanitizedArray;
        }
        return value;
    }

    function getSanitizedCustomProperties(customProperties) {
        var sanitizedProperties = {},
            value,
            sanitizedPropertyName,
            sanitizedValue;

        if (customProperties == null) {
            customProperties = {};
        }

        if (typeof customProperties !== 'object') {
            return null;
        }

        for (var propertyName in customProperties) {
            value = customProperties[propertyName];
            sanitizedPropertyName = getSanitizedValueForBraze(propertyName);
            sanitizedValue =
                typeof value === 'string'
                    ? getSanitizedValueForBraze(value)
                    : value;
            sanitizedProperties[sanitizedPropertyName] = sanitizedValue;
        }
        return sanitizedProperties;
    }

    this.init = initForwarder;
    this.process = processEvent;
    this.setUserIdentity = setUserIdentity;
    this.setUserAttribute = setUserAttribute;
    this.onUserIdentified = onUserIdentified;
    this.removeUserAttribute = removeUserAttribute;
    this.decodeClusterSetting = decodeClusterSetting;

    /* An example output of this logger if we pass in a purchase event for 1 iPhone
     with a SKU of iphoneSku that cost $999 with a product attribute of 
     color: blue would be:
     mParticle - Braze Web Kit log:
     braze.logPurchase:
     iphone,
     999,
     USD,
     1,
     {\"color\":\"blue\",\"Sku":"iphoneSKU"},\n`;
     */
    function kitLogger(method) {
        var msg = 'mParticle - Braze Web Kit log:';

        var nonMethodArguments = Array.prototype.slice.call(arguments, 1);
        msg += '\n' + method + ':\n';

        nonMethodArguments.forEach(function(arg) {
            if (isObject(arg) || Array.isArray(arg)) {
                msg += JSON.stringify(arg);
            } else {
                msg += arg;
            }
            msg += ',\n';
        });

        self.logger.verbose(msg);
    }
};

function getId() {
    return moduleId;
}

function register(config) {
    var forwarderNameWithSuffix = [name, suffix].join('-');
    if (!config) {
        window.console.log(
            'You must pass a config object to register the kit ' +
                forwarderNameWithSuffix
        );
        return;
    }

    if (!isObject(config)) {
        window.console.log(
            "'config' must be an object. You passed in a " + typeof config
        );
        return;
    }

    if (isObject(config.kits)) {
        config.kits[forwarderNameWithSuffix] = {
            constructor: constructor,
        };
    } else {
        config.kits = {};
        config.kits[forwarderNameWithSuffix] = {
            constructor: constructor,
        };
    }
    window.console.log(
        'Successfully registered ' +
            forwarderNameWithSuffix +
            ' to your mParticle configuration'
    );
}

if (window && window.mParticle && window.mParticle.addForwarder) {
    window.mParticle.addForwarder({
        name: name,
        constructor: constructor,
        getId: getId,
        // A suffix is added if there are multiple different versions of
        // a client kit.  This matches the suffix in the DB.
        suffix: suffix,
    });
}

function mergeObjects() {
    var resObj = {};
    for (var i = 0; i < arguments.length; i += 1) {
        var obj = arguments[i],
            keys = Object.keys(obj);
        for (var j = 0; j < keys.length; j += 1) {
            resObj[keys[j]] = obj[keys[j]];
        }
    }
    return resObj;
}

function isObject(val) {
    return (
        val != null && typeof val === 'object' && Array.isArray(val) === false
    );
}

function isEmpty(value) {
    return value == null || !(Object.keys(value) || value).length;
}

var BrazeKitDev = {
    register: register,
    getVersion: function() {
        return version;
    },
};

exports["default"] = BrazeKitDev;
