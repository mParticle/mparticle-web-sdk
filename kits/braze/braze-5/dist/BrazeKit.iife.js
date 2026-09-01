var mpBrazeKitV5 = (function (exports) {

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

	const r = {
	  init: function (n) {
	    (void 0 === n && void 0 !== r.zg) || (r.zg = !!n), r.t || (r.t = !0);
	  },
	  destroy: function () {
	    (r.t = !1), (r.zg = void 0), (r.vd = void 0);
	  },
	  setLogger: function (n) {
	    "function" == typeof n
	      ? (r.init(), (r.vd = n))
	      : r.info("Ignoring setLogger call since logger is not a function");
	  },
	  toggleLogging: function () {
	    r.init(),
	      r.zg
	        ? (console.log("Disabling Braze logging"), (r.zg = !1))
	        : (console.log("Enabled Braze logging"), (r.zg = !0));
	  },
	  info: function (n) {
	    if (r.zg) {
	      const o = "Braze: " + n;
	      null != r.vd ? r.vd(o) : console.log(o);
	    }
	  },
	  warn: function (n) {
	    if (r.zg) {
	      const o = "Braze SDK Warning: " + n + " (v5.5.0)";
	      null != r.vd ? r.vd(o) : console.warn(o);
	    }
	  },
	  error: function (n) {
	    if (r.zg) {
	      const o = "Braze SDK Error: " + n + " (v5.5.0)";
	      null != r.vd ? r.vd(o) : console.error(o);
	    }
	  },
	};
	var r$1 = r;

	const ei = {
	  Tn: function (t) {
	    const r = (t + "=".repeat((4 - (t.length % 4)) % 4))
	        .replace(/\-/g, "+")
	        .replace(/_/g, "/"),
	      n = atob(r),
	      o = new Uint8Array(n.length);
	    for (let t = 0; t < n.length; ++t) o[t] = n.charCodeAt(t);
	    return o;
	  },
	};

	const i = {
	    CustomEvent: "ce",
	    Pr: "p",
	    Ku: "pc",
	    vc: "ca",
	    Ua: "i",
	    Ls: "ie",
	    M: "cci",
	    R: "ccic",
	    k: "ccc",
	    F: "ccd",
	    ql: "ss",
	    xl: "se",
	    Xi: "si",
	    $i: "sc",
	    Oi: "sbc",
	    Cc: "sfe",
	    mo: "iec",
	    Ju: "lr",
	    Eu: "uae",
	    O: "ci",
	    D: "cc",
	    Xu: "lcaa",
	    Gu: "lcar",
	    On: "inc",
	    Ln: "add",
	    Rn: "rem",
	    $n: "set",
	    Bn: "ncam",
	    Hu: "sgu",
	    Fr: "ffi",
	  },
	  or = { Ar: "feed_displayed", Ec: "content_cards_displayed" };

	const p = {
	  W: function () {
	    const t = (t = !1) => {
	      const n = (Math.random().toString(16) + "000000000").substr(2, 8);
	      return t ? "-" + n.substr(0, 4) + "-" + n.substr(4, 4) : n;
	    };
	    return t() + t(!0) + t(!0) + t();
	  },
	};
	var p$1 = p;

	class A {
	  constructor(t, e) {
	    (this.database = t),
	      (this.vd = e),
	      (this.parent = "undefined" == typeof window ? self : window),
	      (this.database = t),
	      (this.vd = e);
	  }
	  Dd() {
	    if ("indexedDB" in this.parent) return this.parent.indexedDB;
	  }
	  isSupported() {
	    var t;
	    try {
	      if (null == this.Dd()) return !1;
	      {
	        const e =
	          null === (t = this.Dd()) || void 0 === t
	            ? void 0
	            : t.open("Braze IndexedDB Support Test");
	        if (
	          (e &&
	            ((e.onupgradeneeded = () => e.result.close()),
	            (e.onsuccess = () => e.result.close())),
	          "undefined" != typeof window)
	        ) {
	          const t = window,
	            e = t.chrome || t.browser || t.pd;
	          if (e && e.runtime && e.runtime.id)
	            return (
	              this.vd.info(
	                "Not using IndexedDB for storage because we are running inside an extension",
	              ),
	              !1
	            );
	        }
	        return !0;
	      }
	    } catch (t) {
	      return (
	        this.vd.info(
	          "Not using IndexedDB for storage due to following error: " + t,
	        ),
	        !1
	      );
	    }
	  }
	  Bd(t, e) {
	    var n;
	    const o =
	      null === (n = this.Dd()) || void 0 === n
	        ? void 0
	        : n.open(this.database.Sd, this.database.VERSION);
	    if (null == o) return "function" == typeof e && e(), !1;
	    const i = this;
	    return (
	      (o.onupgradeneeded = (t) => {
	        var e;
	        i.vd.info(
	          "Upgrading indexedDB " +
	            i.database.Sd +
	            " to v" +
	            i.database.VERSION +
	            "...",
	        );
	        const n = null === (e = t.target) || void 0 === e ? void 0 : e.result;
	        for (const t in i.database.hs) {
	          const e = t;
	          i.database.hs.hasOwnProperty(t) &&
	            !n.objectStoreNames.contains(i.database.hs[e]) &&
	            n.createObjectStore(i.database.hs[e]);
	        }
	      }),
	      (o.onsuccess = (n) => {
	        var o;
	        const r = null === (o = n.target) || void 0 === o ? void 0 : o.result;
	        (r.onversionchange = () => {
	          r.close(),
	            "function" == typeof e && e(),
	            i.vd.error(
	              "Needed to close the database unexpectedly because of an upgrade in another tab",
	            );
	        }),
	          t(r);
	      }),
	      (o.onerror = (t) => {
	        var n;
	        const o = t;
	        return (
	          i.vd.info(
	            "Could not open indexedDB " +
	              i.database.Sd +
	              " v" +
	              i.database.VERSION +
	              ": " +
	              (null === (n = o.target) || void 0 === n ? void 0 : n.errorCode),
	          ),
	          "function" == typeof e && e(),
	          !0
	        );
	      }),
	      !0
	    );
	  }
	  setItem(t, e, n, o, i) {
	    if (!this.isSupported()) return "function" == typeof i && i(), !1;
	    const r = this;
	    return this.Bd((d) => {
	      if (!d.objectStoreNames.contains(t))
	        return (
	          r.vd.error(
	            "Could not store object " +
	              e +
	              " in " +
	              t +
	              " on indexedDB " +
	              r.database.Sd +
	              " - " +
	              t +
	              " is not a valid objectStore",
	          ),
	          "function" == typeof i && i(),
	          void d.close()
	        );
	      const s = d.transaction([t], "readwrite");
	      s.oncomplete = () => d.close();
	      const u = s.objectStore(t).put(n, e);
	      (u.onerror = () => {
	        r.vd.error(
	          "Could not store object " +
	            e +
	            " in " +
	            t +
	            " on indexedDB " +
	            r.database.Sd,
	        ),
	          "function" == typeof i && i();
	      }),
	        (u.onsuccess = () => {
	          "function" == typeof o && o();
	        });
	    }, i);
	  }
	  getItem(t, e, n) {
	    if (!this.isSupported()) return !1;
	    const o = this;
	    return this.Bd((i) => {
	      if (!i.objectStoreNames.contains(t))
	        return (
	          o.vd.error(
	            "Could not retrieve object " +
	              e +
	              " in " +
	              t +
	              " on indexedDB " +
	              o.database.Sd +
	              " - " +
	              t +
	              " is not a valid objectStore",
	          ),
	          void i.close()
	        );
	      const r = i.transaction([t], "readonly");
	      r.oncomplete = () => i.close();
	      const d = r.objectStore(t).get(e);
	      (d.onerror = () => {
	        o.vd.error(
	          "Could not retrieve object " +
	            e +
	            " in " +
	            t +
	            " on indexedDB " +
	            o.database.Sd,
	        );
	      }),
	        (d.onsuccess = (t) => {
	          var e;
	          const o = null === (e = t.target) || void 0 === e ? void 0 : e.result;
	          null != o && n(o);
	        });
	    });
	  }
	  jr(t, e, n) {
	    if (!this.isSupported()) return "function" == typeof n && n(), !1;
	    const o = this;
	    return this.Bd((i) => {
	      if (!i.objectStoreNames.contains(t))
	        return (
	          o.vd.error(
	            "Could not retrieve last record from " +
	              t +
	              " on indexedDB " +
	              o.database.Sd +
	              " - " +
	              t +
	              " is not a valid objectStore",
	          ),
	          "function" == typeof n && n(),
	          void i.close()
	        );
	      const r = i.transaction([t], "readonly");
	      r.oncomplete = () => i.close();
	      const d = r.objectStore(t).openCursor(null, "prev");
	      (d.onerror = () => {
	        o.vd.error(
	          "Could not open cursor for " + t + " on indexedDB " + o.database.Sd,
	        ),
	          "function" == typeof n && n();
	      }),
	        (d.onsuccess = (t) => {
	          var o;
	          const i = null === (o = t.target) || void 0 === o ? void 0 : o.result;
	          null != i && null != i.value && null != i.key
	            ? e(i.key, i.value)
	            : "function" == typeof n && n();
	        });
	    }, n);
	  }
	  re(t, e) {
	    if (!this.isSupported()) return !1;
	    const n = this;
	    return this.Bd((o) => {
	      if (!o.objectStoreNames.contains(t))
	        return (
	          n.vd.error(
	            "Could not delete record " +
	              e +
	              " from " +
	              t +
	              " on indexedDB " +
	              n.database.Sd +
	              " - " +
	              t +
	              " is not a valid objectStore",
	          ),
	          void o.close()
	        );
	      const i = o.transaction([t], "readwrite");
	      i.oncomplete = () => o.close();
	      i.objectStore(t).delete(e).onerror = () => {
	        n.vd.error(
	          "Could not delete record " +
	            e +
	            " from " +
	            t +
	            " on indexedDB " +
	            n.database.Sd,
	        );
	      };
	    });
	  }
	  ss(t, e) {
	    if (!this.isSupported()) return !1;
	    const n = this;
	    return this.Bd((o) => {
	      if (!o.objectStoreNames.contains(t))
	        return (
	          n.vd.error(
	            "Could not retrieve objects from " +
	              t +
	              " on indexedDB " +
	              n.database.Sd +
	              " - " +
	              t +
	              " is not a valid objectStore",
	          ),
	          void o.close()
	        );
	      const i = o.transaction([t], "readwrite");
	      i.oncomplete = () => o.close();
	      const r = i.objectStore(t),
	        d = r.openCursor(),
	        s = [];
	      (d.onerror = () => {
	        s.length > 0
	          ? (n.vd.info(
	              "Cursor closed midway through for " +
	                t +
	                " on indexedDB " +
	                n.database.Sd,
	            ),
	            e(s))
	          : n.vd.error(
	              "Could not open cursor for " +
	                t +
	                " on indexedDB " +
	                n.database.Sd,
	            );
	      }),
	        (d.onsuccess = (t) => {
	          var n;
	          const o = null === (n = t.target) || void 0 === n ? void 0 : n.result;
	          if (null != o) {
	            if (null != o.value && null != o.key) {
	              r.delete(o.key).onsuccess = () => {
	                s.push(o.value);
	              };
	            }
	            "function" == typeof o.continue && o.continue();
	          } else s.length > 0 && e(s);
	        });
	    });
	  }
	  clearData() {
	    if (!this.isSupported()) return !1;
	    const t = [];
	    for (const e in this.database.hs) {
	      const n = e;
	      this.database.hs.hasOwnProperty(e) &&
	        this.database.hs[n] !== this.database.hs.ae &&
	        t.push(this.database.hs[n]);
	    }
	    const e = this;
	    return this.Bd(function (n) {
	      const o = n.transaction(t, "readwrite");
	      o.oncomplete = () => n.close();
	      for (let n = 0; n < t.length; n++) {
	        const i = t[n];
	        o.objectStore(i).clear().onerror = function () {
	          e.vd.error(
	            "Could not clear " +
	              this.source.name +
	              " on indexedDB " +
	              e.database.Sd,
	          );
	        };
	      }
	      o.onerror = function () {
	        e.vd.error(
	          "Could not clear object stores on indexedDB " + e.database.Sd,
	        );
	      };
	    });
	  }
	}
	A.ts = {
	  Zt: {
	    Sd: "AppboyServiceWorkerAsyncStorage",
	    VERSION: 6,
	    hs: {
	      Ka: "data",
	      hr: "pushClicks",
	      cu: "pushSubscribed",
	      Cd: "fallbackDevice",
	      es: "cardUpdates",
	      ae: "optOut",
	      wr: "pendingData",
	      jh: "sdkAuthenticationSignature",
	    },
	    ie: 1,
	  },
	};

	var zt = {
	  Eo: "allowCrawlerActivity",
	  _o: "baseUrl",
	  Io: "noCookies",
	  So: "devicePropertyAllowlist",
	  Aa: "disablePushTokenMaintenance",
	  Ao: "enableLogging",
	  No: "enableSdkAuthentication",
	  qa: "manageServiceWorkerExternally",
	  Oo: "minimumIntervalBetweenTriggerActionsInSeconds",
	  Ro: "sessionTimeoutInSeconds",
	  Po: "appVersion",
	  Lo: "appVersionNumber",
	  Ma: "serviceWorkerLocation",
	  ka: "safariWebsitePushId",
	  zn: "localization",
	  bo: "contentSecurityNonce",
	  Do: "allowUserSuppliedJavascript",
	  jo: "inAppMessageZIndex",
	  ho: "openInAppMessagesInNewTab",
	  en: "openNewsFeedCardsInNewTab",
	  Lh: "requireExplicitInAppMessageDismissal",
	  Mo: "doNotLoadFontAwesome",
	  Uo: "deviceId",
	  _a: "serviceWorkerScope",
	  Wo: "sdkFlavor",
	  tn: "openCardsInNewTab",
	};

	function values(t) {
	  const e = [];
	  let r;
	  for (const n in t)
	    (r = n),
	      Object.prototype.hasOwnProperty.call(t, r) &&
	        void 0 !== t[r] &&
	        e.push(t[r]);
	  return e;
	}
	function validateValueIsFromEnum(t, e, n, o) {
	  const c = values(t);
	  return (
	    -1 !== c.indexOf(e) ||
	    (r$1.error(`${n} Valid values from ${o} are "${c.join('"/"')}".`), !1)
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
	function intersection(t, ...e) {
	  null == t && (t = []);
	  const r = [],
	    n = arguments.length;
	  for (let e = 0, o = t.length; e < o; e++) {
	    const o = t[e];
	    if (-1 !== r.indexOf(o)) continue;
	    let c = 1;
	    for (c = 1; c < n && -1 !== arguments[c].indexOf(o); c++);
	    c === n && r.push(o);
	  }
	  return r;
	}
	function keys(t) {
	  const e = [];
	  for (const r in t) Object.prototype.hasOwnProperty.call(t, r) && e.push(r);
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
	    const r = keys(t);
	    let n;
	    if (((i = r.length), keys(e).length !== i)) return !1;
	    for (; i--; )
	      if (
	        ((n = r[i]),
	        !Object.prototype.hasOwnProperty.call(e, n) || !isEqual(t[n], e[n]))
	      )
	        return !1;
	  }
	  return o.pop(), c.pop(), !0;
	}

	function convertMsToSeconds(e, n = !1) {
	  let t = e / 1e3;
	  return n && (t = Math.floor(t)), t;
	}
	function convertSecondsToMs(e) {
	  return 1e3 * e;
	}
	function dateFromUnixTimestamp(e) {
	  if (null == e) return null;
	  const n = parseInt(e.toString());
	  return isNaN(n) ? null : new Date(1e3 * n);
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
	const GLOBAL_RATE_LIMIT_CAPACITY_DEFAULT = 30;
	const GLOBAL_RATE_LIMIT_REFILL_RATE_DEFAULT = 30;
	const LAST_REQUEST_TO_ENDPOINT_MS_AGO_DEFAULT = 72e5;
	const MAX_ERROR_RETRIES_CONTENT_CARDS = 3;
	const REQUEST_ATTEMPT_DEFAULT = 1;

	class T {
	  constructor() {
	    this._e = {};
	  }
	  Nt(t) {
	    if ("function" != typeof t) return null;
	    const i = p$1.W();
	    return (this._e[i] = t), i;
	  }
	  removeSubscription(t) {
	    delete this._e[t];
	  }
	  removeAllSubscriptions() {
	    this._e = {};
	  }
	  ic() {
	    return Object.keys(this._e).length;
	  }
	  Rt(t) {
	    const i = [];
	    for (const s in this._e) {
	      const r = this._e[s];
	      i.push(r(t));
	    }
	    return i;
	  }
	}

	class Card {
	  constructor(t, i, s, h, n, l, e, r, u, E, o, T, I, a, c, N) {
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
	      (this.dismissible = c),
	      (this.clicked = N),
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
	      (this.dismissible = c || !1),
	      (this.dismissed = !1),
	      (this.clicked = N || !1),
	      (this.isControl = !1),
	      (this.test = !1),
	      (this.Et = null),
	      (this.Tt = null),
	      (this.It = null);
	  }
	  subscribeToClickedEvent(t) {
	    return this.St().Nt(t);
	  }
	  subscribeToDismissedEvent(t) {
	    return this.At().Nt(t);
	  }
	  removeSubscription(t) {
	    this.St().removeSubscription(t), this.At().removeSubscription(t);
	  }
	  removeAllSubscriptions() {
	    this.St().removeAllSubscriptions(), this.At().removeAllSubscriptions();
	  }
	  dismissCard() {
	    if (!this.dismissible || this.dismissed) return;
	    "function" == typeof this.logCardDismissal && this.logCardDismissal();
	    let t = this.T;
	    !t && this.id && (t = document.getElementById(this.id)),
	      t &&
	        ((t.style.height = t.offsetHeight + "px"),
	        (t.className = t.className + " ab-hide"),
	        setTimeout(function () {
	          t &&
	            t.parentNode &&
	            ((t.style.height = "0"),
	            (t.style.margin = "0"),
	            setTimeout(function () {
	              t && t.parentNode && t.parentNode.removeChild(t);
	            }, Card.Dt));
	        }, FEED_ANIMATION_DURATION));
	  }
	  St() {
	    return null == this.Et && (this.Et = new T()), this.Et;
	  }
	  At() {
	    return null == this.Tt && (this.Tt = new T()), this.Tt;
	  }
	  K() {
	    const t = new Date().valueOf();
	    return (
	      !(null != this.It && t - this.It < Card.Ct) &&
	      ((this.It = t), (this.viewed = !0), !0)
	    );
	  }
	  p() {
	    (this.viewed = !0), (this.clicked = !0), this.St().Rt();
	  }
	  N() {
	    return (
	      !(!this.dismissible || this.dismissed) &&
	      ((this.dismissed = !0), this.At().Rt(), !0)
	    );
	  }
	  Lt(t) {
	    if (null == t || t[Card._t.ht] !== this.id) return !0;
	    if (t[Card._t.Ot]) return !1;
	    if (
	      null != t[Card._t.nt] &&
	      null != this.updated &&
	      parseInt(t[Card._t.nt]) < convertMsToSeconds(this.updated.valueOf())
	    )
	      return !0;
	    if (
	      (t[Card._t.et] && !this.viewed && (this.viewed = !0),
	      t[Card._t.zt] && !this.clicked && (this.clicked = t[Card._t.zt]),
	      null != t[Card._t.rt] && (this.title = t[Card._t.rt]),
	      null != t[Card._t.ot] && (this.imageUrl = t[Card._t.ot]),
	      null != t[Card._t.ct] && (this.description = t[Card._t.ct]),
	      null != t[Card._t.nt])
	    ) {
	      const i = dateFromUnixTimestamp(t[Card._t.nt]);
	      null != i && (this.updated = i);
	    }
	    if (null != t[Card._t.lt]) {
	      let i;
	      (i = t[Card._t.lt] === Card.Mt ? null : dateFromUnixTimestamp(t[Card._t.lt])),
	        (this.expiresAt = i);
	    }
	    if (
	      (null != t[Card._t.URL] && (this.url = t[Card._t.URL]),
	      null != t[Card._t.ft] && (this.linkText = t[Card._t.ft]),
	      null != t[Card._t.xt])
	    ) {
	      const i = parseFloat(t[Card._t.xt].toString());
	      this.aspectRatio = isNaN(i) ? null : i;
	    }
	    return (
	      null != t[Card._t.bt] && (this.extras = t[Card._t.bt]),
	      null != t[Card._t.gt] && (this.pinned = t[Card._t.gt]),
	      null != t[Card._t.jt] && (this.dismissible = t[Card._t.jt]),
	      null != t[Card._t.kt] && (this.test = t[Card._t.kt]),
	      !0
	    );
	  }
	  Y() {
	    r$1.error("Must be implemented in a subclass");
	  }
	}
	(Card.Mt = -1),
	  (Card._t = {
	    ht: "id",
	    et: "v",
	    jt: "db",
	    Ot: "r",
	    nt: "ca",
	    gt: "p",
	    lt: "ea",
	    bt: "e",
	    Z: "tp",
	    ot: "i",
	    rt: "tt",
	    ct: "ds",
	    URL: "u",
	    ft: "dm",
	    xt: "ar",
	    zt: "cl",
	    kt: "t",
	  }),
	  (Card.it = {
	    st: "captioned_image",
	    Pt: "text_announcement",
	    Ut: "short_news",
	    Gt: "banner_image",
	    Xt: "control",
	  }),
	  (Card.tt = {
	    ht: "id",
	    et: "v",
	    jt: "db",
	    dt: "cr",
	    nt: "ca",
	    gt: "p",
	    ut: "t",
	    lt: "ea",
	    bt: "e",
	    Z: "tp",
	    ot: "i",
	    rt: "tt",
	    ct: "ds",
	    URL: "u",
	    ft: "dm",
	    xt: "ar",
	    zt: "cl",
	    kt: "s",
	  }),
	  (Card.vt = {
	    Vt: "ADVERTISING",
	    Wt: "ANNOUNCEMENTS",
	    wt: "NEWS",
	    Ft: "SOCIAL",
	  }),
	  (Card.Dt = 400),
	  (Card.Ct = 1e4);

	class ImageOnly extends Card {
	  constructor(s, t, i, h, r, e, l, n, o, a, u, c, d, m) {
	    super(s, t, null, i, null, h, r, e, l, n, o, a, u, c, d, m),
	      (this._ = "ab-image-only"),
	      (this.S = !1),
	      (this.test = !1);
	  }
	  Y() {
	    const s = {};
	    return (
	      (s[Card.tt.Z] = Card.it.Gt),
	      (s[Card.tt.ht] = this.id),
	      (s[Card.tt.et] = this.viewed),
	      (s[Card.tt.ot] = this.imageUrl),
	      (s[Card.tt.nt] = this.updated),
	      (s[Card.tt.dt] = this.created),
	      (s[Card.tt.ut] = this.categories),
	      (s[Card.tt.lt] = this.expiresAt),
	      (s[Card.tt.URL] = this.url),
	      (s[Card.tt.ft] = this.linkText),
	      (s[Card.tt.xt] = this.aspectRatio),
	      (s[Card.tt.bt] = this.extras),
	      (s[Card.tt.gt] = this.pinned),
	      (s[Card.tt.jt] = this.dismissible),
	      (s[Card.tt.zt] = this.clicked),
	      (s[Card.tt.kt] = this.test),
	      s
	    );
	  }
	}

	class CaptionedImage extends Card {
	  constructor(t, s, i, h, e, r, a, o, c, n, d, p, u, l, m, f) {
	    super(t, s, i, h, e, r, a, o, c, n, d, p, u, l, m, f),
	      (this._ = "ab-captioned-image"),
	      (this.S = !0),
	      (this.test = !1);
	  }
	  Y() {
	    const t = {};
	    return (
	      (t[Card.tt.Z] = Card.it.st),
	      (t[Card.tt.ht] = this.id),
	      (t[Card.tt.et] = this.viewed),
	      (t[Card.tt.rt] = this.title),
	      (t[Card.tt.ot] = this.imageUrl),
	      (t[Card.tt.ct] = this.description),
	      (t[Card.tt.nt] = this.updated),
	      (t[Card.tt.dt] = this.created),
	      (t[Card.tt.ut] = this.categories),
	      (t[Card.tt.lt] = this.expiresAt),
	      (t[Card.tt.URL] = this.url),
	      (t[Card.tt.ft] = this.linkText),
	      (t[Card.tt.xt] = this.aspectRatio),
	      (t[Card.tt.bt] = this.extras),
	      (t[Card.tt.gt] = this.pinned),
	      (t[Card.tt.jt] = this.dismissible),
	      (t[Card.tt.zt] = this.clicked),
	      (t[Card.tt.kt] = this.test),
	      t
	    );
	  }
	}

	class ClassicCard extends Card {
	  constructor(s, t, i, h, r, c, e, a, o, d, l, n, u, p, f, m) {
	    super(s, t, i, h, r, c, e, a, o, d, l, n, u, p, f, m),
	      (this._ = "ab-classic-card"),
	      (this.S = !0);
	  }
	  Y() {
	    const s = {};
	    return (
	      (s[Card.tt.Z] = Card.it.Ut),
	      (s[Card.tt.ht] = this.id),
	      (s[Card.tt.et] = this.viewed),
	      (s[Card.tt.rt] = this.title),
	      (s[Card.tt.ot] = this.imageUrl),
	      (s[Card.tt.ct] = this.description),
	      (s[Card.tt.nt] = this.updated),
	      (s[Card.tt.dt] = this.created),
	      (s[Card.tt.ut] = this.categories),
	      (s[Card.tt.lt] = this.expiresAt),
	      (s[Card.tt.URL] = this.url),
	      (s[Card.tt.ft] = this.linkText),
	      (s[Card.tt.xt] = this.aspectRatio),
	      (s[Card.tt.bt] = this.extras),
	      (s[Card.tt.gt] = this.pinned),
	      (s[Card.tt.jt] = this.dismissible),
	      (s[Card.tt.zt] = this.clicked),
	      (s[Card.tt.kt] = this.test),
	      s
	    );
	  }
	}

	class ControlCard extends Card {
	  constructor(l, t, s, i, n, r) {
	    super(l, t, null, null, null, null, s, null, i, null, null, null, n, r),
	      (this.isControl = !0),
	      (this._ = "ab-control-card"),
	      (this.S = !1);
	  }
	  Y() {
	    const l = {};
	    return (
	      (l[Card.tt.Z] = Card.it.Xt),
	      (l[Card.tt.ht] = this.id),
	      (l[Card.tt.et] = this.viewed),
	      (l[Card.tt.nt] = this.updated),
	      (l[Card.tt.lt] = this.expiresAt),
	      (l[Card.tt.bt] = this.extras),
	      (l[Card.tt.gt] = this.pinned),
	      (l[Card.tt.kt] = this.test),
	      l
	    );
	  }
	}

	function getAlias(e) {
	  const t = null == e ? void 0 : e.j(STORAGE_KEYS.C._E);
	  let n;
	  return t && (n = { label: t.l, name: t.a }), n;
	}

	class ve {
	  constructor(t, s, i, r, e) {
	    (this.userId = t),
	      (this.type = s),
	      (this.time = i),
	      (this.sessionId = r),
	      (this.data = e),
	      (this.userId = t),
	      (this.type = s),
	      (this.time = timestampOrNow(i)),
	      (this.sessionId = r),
	      (this.data = e);
	  }
	  Mr() {
	    var t;
	    const s = {
	      name: this.type,
	      time: convertMsToSeconds(this.time),
	      data: this.data || {},
	      session_id: this.sessionId,
	    };
	    null != this.userId && (s.user_id = this.userId);
	    const i = (null === (t = e.Sr()) || void 0 === t ? void 0 : t.Fh()) || !1;
	    if (!s.user_id && !i) {
	      const t = getAlias(e.l());
	      t && (s.alias = t);
	    }
	    return s;
	  }
	  Y() {
	    return {
	      u: this.userId,
	      t: this.type,
	      ts: this.time,
	      s: this.sessionId,
	      d: this.data,
	    };
	  }
	  static fromJson(t) {
	    return new ve(t.user_id, t.name, t.time, t.session_id, t.data);
	  }
	  static RE(t) {
	    return null != t && isObject$1(t) && null != t.t && "" !== t.t;
	  }
	  static qn(t) {
	    return new ve(t.u, t.t, t.ts, t.s, t.d);
	  }
	}

	const getErrorMessage = (r) =>
	  r instanceof Error ? r.message : String(r);

	class _t {
	  constructor(t, e, i) {
	    (this.eu = t),
	      null == t && (t = p$1.W()),
	      !i || isNaN(i) ? (this.Dl = new Date().valueOf()) : (this.Dl = i),
	      (this.eu = t),
	      (this.Wl = new Date().valueOf()),
	      (this.Hl = e);
	  }
	  Y() {
	    return `g:${encodeURIComponent(this.eu)}|e:${this.Hl}|c:${this.Dl}|l:${
      this.Wl
    }`;
	  }
	  static hE(t) {
	    if ("string" != typeof t) return null;
	    const e = t.lastIndexOf("|e:"),
	      i = t.substring(0, e),
	      r = i.split("g:")[1];
	    let n;
	    return (
	      (n = /[|:]/.test(r) ? encodeURIComponent(r) : r),
	      (t = t.replace(i, `g:${n}`))
	    );
	  }
	  static qn(t) {
	    let e;
	    if ("string" == typeof t)
	      try {
	        const i = t.split("|");
	        if (!isArray(i) || 4 !== i.length) return null;
	        const r = (t) => t.split(":")[1],
	          n = (t) => {
	            const e = parseInt(r(t));
	            if (!isNaN(e)) return e;
	          };
	        (e = new _t(decodeURIComponent(r(i[0])), n(i[1]), n(i[2]))),
	          (e.Wl = n(i[3]));
	      } catch (e) {
	        r$1.info(
	          `Unable to parse cookie string ${t}, failed with error: ${getErrorMessage(e)}`,
	        );
	      }
	    else {
	      if (null == t || null == t.g) return null;
	      (e = new _t(t.g, t.e, t.c)), (e.Wl = t.l);
	    }
	    return e;
	  }
	}

	function getByteLength(t) {
	  let e = t.length;
	  for (let n = t.length - 1; n >= 0; n--) {
	    const r = t.charCodeAt(n);
	    r > 127 && r <= 2047 ? e++ : r > 2047 && r <= 65535 && (e += 2),
	      r >= 56320 && r <= 57343 && n--;
	  }
	  return e;
	}
	function decodeBrazeActions(t) {
	  try {
	    t = t.replace(/-/g, "+").replace(/_/g, "/");
	    const e = window.atob(t),
	      n = new Uint8Array(e.length);
	    for (let t = 0; t < e.length; t++) n[t] = e.charCodeAt(t);
	    const r = new Uint16Array(n.buffer);
	    return String.fromCharCode(...r);
	  } catch (t) {
	    return r$1.error("Unable to decode Base64: " + t), null;
	  }
	}

	const BRAZE_ACTIONS = {
	  types: {
	    ro: "container",
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
	    no: "openLink",
	    ao: "openLinkInWebView",
	  },
	  properties: { type: "type", oo: "steps", eo: "args" },
	};
	const INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES = {
	  Vi: "unknownBrazeAction",
	  Yi: "noPushPrompt",
	};
	const ineligibleBrazeActionURLErrorMessage = (t, o) => {
	  switch (t) {
	    case INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Vi:
	      return `${o} contains an unknown braze action type and will not be displayed.`;
	    case INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Yi:
	      return `${o} contains a push prompt braze action, but is not eligible for a push prompt. Ignoring.`;
	    default:
	      return "";
	  }
	};
	function getDecodedBrazeAction(t) {
	  try {
	    const o = t.match(BRAZE_ACTION_URI_REGEX),
	      n = o ? o[0].length : null,
	      e = n ? t.substring(n) : null;
	    if (null == n || n > t.length - 1 || !e)
	      return void r$1.error(
	        `Did not find base64 encoded brazeAction in url to process : ${t}`,
	      );
	    const i = decodeBrazeActions(e);
	    return i
	      ? JSON.parse(i)
	      : void r$1.error(`Failed to decode base64 encoded brazeAction: ${e}`);
	  } catch (o) {
	    return void r$1.error(`Failed to process brazeAction URL ${t} : ${getErrorMessage(o)}`);
	  }
	}
	function so(t, o) {
	  let r = !1;
	  if (o) for (const n of o) if (((r = r || t(n)), r)) return !0;
	  return !1;
	}
	function containsUnknownBrazeAction(t) {
	  const o = BRAZE_ACTIONS.properties.type,
	    r = BRAZE_ACTIONS.properties.oo;
	  try {
	    if (null == t) return !0;
	    const n = t[o];
	    return n === BRAZE_ACTIONS.types.ro
	      ? so(containsUnknownBrazeAction, t[r])
	      : !isValidBrazeActionType(n);
	  } catch (t) {
	    return !0;
	  }
	}
	function containsPushPrimerBrazeAction(t) {
	  if (!t || !isValidBrazeActionJson(t)) return !1;
	  const o = BRAZE_ACTIONS.properties.type,
	    r = BRAZE_ACTIONS.properties.oo,
	    n = t[o];
	  return n === BRAZE_ACTIONS.types.ro
	    ? so(containsPushPrimerBrazeAction, t[r])
	    : n === BRAZE_ACTIONS.types.requestPushPermission;
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
	  "$time",
	  "$google_ad_personalization",
	  "$google_ad_user_data",
	];
	const EMAIL_ADDRESS_REGEX = new RegExp(/^.+@.+\..+$/);
	const BRAZE_ACTION_URI_REGEX = /^brazeActions:\/\/v\d+\//;
	function validateCustomString(t, e, n) {
	  const o =
	    null != t &&
	    "string" == typeof t &&
	    ("" === t || null != t.match(CUSTOM_DATA_REGEX));
	  return o || r$1.error(`Cannot ${e} because ${n} "${t}" is invalid.`), o;
	}
	function validateCustomAttributeKey(t) {
	  return (
	    null != t &&
	      t.match(CUSTOM_ATTRIBUTE_SPECIAL_CHARS_REGEX) &&
	      -1 === CUSTOM_ATTRIBUTE_RESERVED_OPERATORS.indexOf(t) &&
	      r$1.warn("Custom attribute keys cannot contain '$' or '.'"),
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
	    return r$1.error("Nested attributes cannot be more than 50 levels deep."), !1;
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
	      const n = t[r];
	      if (o && !validateCustomAttributeKey(r)) return !1;
	      if (isDate(n)) {
	        e[r] = toValidBackendTimeString(n);
	      }
	      if (!_validateNestedProperties(n, e[r], i)) return !1;
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
	    a || r$1.error(`Cannot ${n} because ${o} "${t}" is invalid.`),
	    a
	  );
	}
	function validateStandardString(t, e, n, o = !1) {
	  const i = "string" == typeof t || (null === t && o);
	  return i || r$1.error(`Cannot ${e} because ${n} "${t}" is invalid.`), i;
	}
	function validateCustomProperties(t, e, n, o, i) {
	  if ((null == t && (t = {}), "object" != typeof t || isArray(t)))
	    return (
	      r$1.error(`${e} requires that ${n} be an object. Ignoring ${i}.`),
	      [!1, null]
	    );
	  let a, s;
	  e === SET_CUSTOM_USER_ATTRIBUTE_STRING ? ((a = 76800), (s = "75KB")) : ((a = 51200), (s = "50KB"));
	  const u = JSON.stringify(t);
	  if (getByteLength(u) > a)
	    return (
	      r$1.error(
	        `Could not ${o} because ${n} was greater than the max size of ${s}.`,
	      ),
	      [!1, null]
	    );
	  let l;
	  try {
	    l = JSON.parse(u);
	  } catch (t) {
	    return (
	      r$1.error(`Could not ${o} because ${n} did not contain valid JSON.`),
	      [!1, null]
	    );
	  }
	  for (const r in t) {
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
	        e === SET_CUSTOM_USER_ATTRIBUTE_STRING,
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
	    r$1.error(
	      "Custom attribute arrays must be either string arrays or object arrays.",
	    );
	  };
	  for (const r of e)
	    if ("string" == typeof r) {
	      if (o) return i(), [!1, !1];
	      if (
	        !validateCustomString(
	          r,
	          `set custom user attribute "${t}"`,
	          "the element in the given array",
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
	          "custom user attribute",
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
	    case BRAZE_ACTIONS.types.ro:
	      if (BRAZE_ACTIONS.properties.oo in t) return !0;
	      break;
	    case BRAZE_ACTIONS.types.logCustomEvent:
	    case BRAZE_ACTIONS.types.setEmailNotificationSubscriptionType:
	    case BRAZE_ACTIONS.types.setPushNotificationSubscriptionType:
	    case BRAZE_ACTIONS.types.setCustomUserAttribute:
	    case BRAZE_ACTIONS.types.addToSubscriptionGroup:
	    case BRAZE_ACTIONS.types.removeFromSubscriptionGroup:
	    case BRAZE_ACTIONS.types.addToCustomAttributeArray:
	    case BRAZE_ACTIONS.types.removeFromCustomAttributeArray:
	    case BRAZE_ACTIONS.types.no:
	    case BRAZE_ACTIONS.types.ao:
	      if (BRAZE_ACTIONS.properties.eo in t) return !0;
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
	    Object.keys(BRAZE_ACTIONS.types).forEach((r) => {
	      BRAZE_ACTIONS.types[r] !== t.toString() || (e = !0);
	    }),
	    e
	  );
	}

	class User {
	  constructor(t, e) {
	    (this.yt = t), (this.Ui = e), (this.yt = t), (this.Ui = e);
	  }
	  getUserId(t) {
	    const e = this.yt.getUserId();
	    if ("function" != typeof t) return e;
	    r$1.warn(
	      "The callback for getUserId is deprecated. You can access its return value directly instead (e.g. `const id = braze.getUser().getUserId()`)",
	    ),
	      t(e);
	  }
	  addAlias(t, e) {
	    return !validateStandardString(t, "add alias", "the alias", !1) || t.length <= 0
	      ? (r$1.error("addAlias requires a non-empty alias"), !1)
	      : !validateStandardString(e, "add alias", "the label", !1) || e.length <= 0
	      ? (r$1.error("addAlias requires a non-empty label"), !1)
	      : this.Ui.Cn(t, e).L;
	  }
	  setFirstName(t) {
	    return (
	      !!validateStandardString(t, "set first name", "the firstName", !0) &&
	      this.yt.nu("first_name", t)
	    );
	  }
	  setLastName(t) {
	    return (
	      !!validateStandardString(t, "set last name", "the lastName", !0) && this.yt.nu("last_name", t)
	    );
	  }
	  setEmail(t) {
	    return null === t || isValidEmail(t)
	      ? this.yt.nu("email", t)
	      : (r$1.error(
	          `Cannot set email address - "${t}" did not pass RFC-5322 validation.`,
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
	          "User.Genders",
	        )
	      ) && this.yt.nu("gender", t)
	    );
	  }
	  setDateOfBirth(t, e, s) {
	    return null === t && null === e && null === s
	      ? this.yt.nu("dob", null)
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
	          ? (r$1.error(
	              "Cannot set date of birth - parameters should comprise a valid date e.g. setDateOfBirth(1776, 7, 4);",
	            ),
	            !1)
	          : this.yt.nu("dob", `${t}-${e}-${s}`));
	  }
	  setCountry(t) {
	    return !!validateStandardString(t, "set country", "the country", !0) && this.yt.nu("country", t);
	  }
	  setHomeCity(t) {
	    return (
	      !!validateStandardString(t, "set home city", "the homeCity", !0) && this.yt.nu("home_city", t)
	    );
	  }
	  setLanguage(t) {
	    return (
	      !!validateStandardString(t, "set language", "the language", !0) && this.yt.nu("language", t)
	    );
	  }
	  setEmailNotificationSubscriptionType(t) {
	    return (
	      !!validateValueIsFromEnum(
	        User.NotificationSubscriptionTypes,
	        t,
	        `Email notification setting "${t}" is not a valid subscription type.`,
	        "User.NotificationSubscriptionTypes",
	      ) && this.yt.nu("email_subscribe", t)
	    );
	  }
	  setPushNotificationSubscriptionType(t) {
	    return (
	      !!validateValueIsFromEnum(
	        User.NotificationSubscriptionTypes,
	        t,
	        `Push notification setting "${t}" is not a valid subscription type.`,
	        "User.NotificationSubscriptionTypes",
	      ) && this.yt.nu("push_subscribe", t)
	    );
	  }
	  setPhoneNumber(t) {
	    return (
	      !!validateStandardString(t, "set phone number", "the phoneNumber", !0) &&
	      (null === t || t.match(User.En)
	        ? this.yt.nu("phone", t)
	        : (r$1.error(`Cannot set phone number - "${t}" did not pass validation.`),
	          !1))
	    );
	  }
	  setLastKnownLocation(t, e, s, n, i) {
	    return null == t || null == e
	      ? (r$1.error(
	          "Cannot set last-known location - latitude and longitude are required.",
	        ),
	        !1)
	      : ((t = parseFloat(t.toString())),
	        (e = parseFloat(e.toString())),
	        null != s && (s = parseFloat(s.toString())),
	        null != n && (n = parseFloat(n.toString())),
	        null != i && (i = parseFloat(i.toString())),
	        isNaN(t) ||
	        isNaN(e) ||
	        (null != s && isNaN(s)) ||
	        (null != n && isNaN(n)) ||
	        (null != i && isNaN(i))
	          ? (r$1.error(
	              "Cannot set last-known location - all supplied parameters must be numeric.",
	            ),
	            !1)
	          : t > 90 || t < -90 || e > 180 || e < -180
	          ? (r$1.error(
	              "Cannot set last-known location - latitude and longitude are bounded by ±90 and ±180 respectively.",
	            ),
	            !1)
	          : (null != s && s < 0) || (null != i && i < 0)
	          ? (r$1.error(
	              "Cannot set last-known location - accuracy and altitudeAccuracy may not be negative.",
	            ),
	            !1)
	          : this.Ui.setLastKnownLocation(this.yt.getUserId(), t, e, n, s, i).L);
	  }
	  setCustomUserAttribute(t, e, r) {
	    if (!validateCustomAttributeKey(t)) return !1;
	    const s = (e) => {
	      const [r] = validateCustomProperties(
	        e,
	        SET_CUSTOM_USER_ATTRIBUTE_STRING,
	        "attribute value",
	        `set custom user attribute "${t}"`,
	        "custom user attribute",
	      );
	      return r;
	    };
	    if (isArray(e)) {
	      const [r, n] = validateCustomAttributeArrayType(t, e);
	      if (!r && !n && 0 !== e.length) return !1;
	      if (r || 0 === e.length) return this.Ui.Fn(i.$n, t, e).L;
	      for (const t of e) if (!s(t)) return !1;
	    } else if (isObject$1(e)) {
	      if (!s(e)) return !1;
	      if (r) return this.Ui.Fn(i.Bn, t, e).L;
	    } else {
	      if (!(void 0 !== e && validatePropertyType(e))) return !1;
	      if (
	        (isDate(e) && (e = toValidBackendTimeString(e)),
	        "string" == typeof e &&
	          !validateCustomString(
	            e,
	            `set custom user attribute "${t}"`,
	            "the element in the given array",
	          ))
	      )
	        return !1;
	    }
	    return this.yt.setCustomUserAttribute(t, e);
	  }
	  addToCustomAttributeArray(t, e) {
	    return (
	      !!validateCustomString(t, "add to custom user attribute array", "the given key") &&
	      !(
	        null != e &&
	        !validateCustomString(e, "add to custom user attribute array", "the given value")
	      ) &&
	      this.Ui.Fn(i.Ln, t, e).L
	    );
	  }
	  removeFromCustomAttributeArray(t, e) {
	    return (
	      !!validateCustomString(t, "remove from custom user attribute array", "the given key") &&
	      !(
	        null != e &&
	        !validateCustomString(e, "remove from custom user attribute array", "the given value")
	      ) &&
	      this.Ui.Fn(i.Rn, t, e).L
	    );
	  }
	  incrementCustomUserAttribute(t, e) {
	    if (!validateCustomString(t, "increment custom user attribute", "the given key")) return !1;
	    null == e && (e = 1);
	    const s = parseInt(e.toString());
	    return isNaN(s) || s !== parseFloat(e.toString())
	      ? (r$1.error(
	          `Cannot increment custom user attribute because the given incrementValue "${e}" is not an integer.`,
	        ),
	        !1)
	      : this.Ui.Fn(i.On, t, s).L;
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
	        ? (r$1.error(
	            "Received invalid values for latitude and/or longitude. Latitude and longitude are bounded by ±90 and ±180 respectively, or must both be null for removal.",
	          ),
	          !1)
	        : this.Ui.Gn(t, e, s).L)
	    );
	  }
	  addToSubscriptionGroup(t) {
	    return !validateStandardString(
	      t,
	      "add user to subscription group",
	      "subscription group ID",
	      !1,
	    ) || t.length <= 0
	      ? (r$1.error(
	          "addToSubscriptionGroup requires a non-empty subscription group ID",
	        ),
	        !1)
	      : this.Ui.Hn(t, User.Kn.SUBSCRIBED).L;
	  }
	  removeFromSubscriptionGroup(t) {
	    return !validateStandardString(
	      t,
	      "remove user from subscription group",
	      "subscription group ID",
	      !1,
	    ) || t.length <= 0
	      ? (r$1.error(
	          "removeFromSubscriptionGroup requires a non-empty subscription group ID",
	        ),
	        !1)
	      : this.Ui.Hn(t, User.Kn.UNSUBSCRIBED).L;
	  }
	  Pn(t, e, r, s, n) {
	    this.yt.Pn(t, e, r, s, n), this.Ui.Mn();
	  }
	  Sn(t) {
	    this.yt.Sn(t);
	  }
	}
	(User.Genders = {
	  MALE: "m",
	  FEMALE: "f",
	  OTHER: "o",
	  UNKNOWN: "u",
	  NOT_APPLICABLE: "n",
	  PREFER_NOT_TO_SAY: "p",
	}),
	  (User.NotificationSubscriptionTypes = {
	    OPTED_IN: "opted_in",
	    SUBSCRIBED: "subscribed",
	    UNSUBSCRIBED: "unsubscribed",
	  }),
	  (User.En = /^[0-9 .\\(\\)\\+\\-]+$/),
	  (User.Kn = { SUBSCRIBED: "subscribed", UNSUBSCRIBED: "unsubscribed" }),
	  (User.Yn = "user_id"),
	  (User.lu = "custom"),
	  (User.lr = 997);

	class ge {
	  constructor() {}
	  ef() {}
	  sf() {}
	  Da(t) {}
	  static ff(t, e) {
	    if (t && e)
	      if (((t = t.toLowerCase()), isArray(e.nf))) {
	        for (let r = 0; r < e.nf.length; r++)
	          if (-1 !== t.indexOf(e.nf[r].toLowerCase())) return e.identity;
	      } else if (-1 !== t.indexOf(e.nf.toLowerCase())) return e.identity;
	  }
	}

	const Browsers = {
	  rO: "Chrome",
	  eO: "Edge",
	  oO: "Opera",
	  Bg: "Safari",
	  OO: "Firefox",
	};
	const OperatingSystems = {
	  xg: "Android",
	  io: "iOS",
	  Pg: "Mac",
	  Og: "Windows",
	};

	class ai extends ge {
	  constructor() {
	    if (
	      (super(),
	      (this.userAgentData = navigator.userAgentData),
	      (this.browser = null),
	      (this.version = null),
	      this.userAgentData)
	    ) {
	      const t = this.hc();
	      (this.browser = t.browser || "Unknown Browser"),
	        (this.version = t.version || "Unknown Version");
	    }
	    this.OS = null;
	  }
	  ef() {
	    return this.browser;
	  }
	  sf() {
	    return this.version;
	  }
	  Da(t) {
	    if (this.OS) return Promise.resolve(this.OS);
	    const s = (s) => {
	      for (let r = 0; r < t.length; r++) {
	        const i = ai.ff(s, t[r]);
	        if (i) return (this.OS = i), this.OS;
	      }
	      return s;
	    };
	    return this.userAgentData.platform
	      ? Promise.resolve(s(this.userAgentData.platform))
	      : this.getHighEntropyValues()
	          .then((t) => (t.platform ? s(t.platform) : navigator.platform))
	          .catch(() => navigator.platform);
	  }
	  hc() {
	    const t = {},
	      s = this.userAgentData.brands;
	    if (s && s.length)
	      for (const r of s) {
	        const s = this.uc(Browsers),
	          i = r.brand.match(s);
	        if (i && i.length > 0) {
	          (t.browser = i[0]), (t.version = r.version);
	          break;
	        }
	      }
	    return t;
	  }
	  uc(t) {
	    const s = [];
	    for (const r in t) {
	      const i = r;
	      s.push(t[i]);
	    }
	    return new RegExp("(" + s.join("|") + ")", "i");
	  }
	  getHighEntropyValues() {
	    return this.userAgentData.getHighEntropyValues
	      ? this.userAgentData.getHighEntropyValues(["platform"])
	      : Promise.reject();
	  }
	}

	class oi extends ge {
	  constructor() {
	    super(), (this.fd = oi.hc(navigator.userAgent || ""));
	  }
	  ef() {
	    return this.fd[0] || "Unknown Browser";
	  }
	  sf() {
	    return this.fd[1] || "Unknown Version";
	  }
	  Da(r) {
	    for (let n = 0; n < r.length; n++) {
	      const e = r[n].string;
	      let i = oi.ff(e, r[n]);
	      if (i)
	        return (
	          i === OperatingSystems.Pg && navigator.maxTouchPoints > 1 && (i = OperatingSystems.io),
	          Promise.resolve(i)
	        );
	    }
	    return Promise.resolve(navigator.platform);
	  }
	  static hc(r) {
	    let n,
	      e =
	        r.match(
	          /(samsungbrowser|tizen|roku|konqueror|icab|crios|opera|ucbrowser|chrome|safari|firefox|camino|msie|trident(?=\/))\/?\s*(\.?\d+(\.\d+)*)/i,
	        ) || [];
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
	      e[1] === Browsers.rO &&
	      ((n = r.match(/\b(OPR|Edge|EdgA|Edg|UCBrowser)\/(\.?\d+(\.\d+)*)/)),
	      null != n)
	    )
	      return (
	        (n = n.slice(1)),
	        (n[0] = n[0].replace("OPR", Browsers.oO)),
	        (n[0] = n[0].replace("EdgA", Browsers.eO)),
	        "Edg" === n[0] && (n[0] = Browsers.eO),
	        [n[0], n[1]]
	      );
	    if (
	      e[1] === Browsers.Bg &&
	      ((n = r.match(/\b(EdgiOS)\/(\.?\d+(\.\d+)*)/)), null != n)
	    )
	      return (
	        (n = n.slice(1)), (n[0] = n[0].replace("EdgiOS", Browsers.eO)), [n[0], n[1]]
	      );
	    if (
	      ((e = e[2] ? [e[1], e[2]] : [null, null]),
	      e[0] === Browsers.Bg &&
	        null != (n = r.match(/version\/(\.?\d+(\.\d+)*)/i)) &&
	        e.splice(1, 1, n[1]),
	      null != (n = r.match(/\b(UCBrowser)\/(\.?\d+(\.\d+)*)/)) &&
	        e.splice(1, 1, n[2]),
	      e[0] === Browsers.oO && null != (n = r.match(/mini\/(\.?\d+(\.\d+)*)/i)))
	    )
	      return ["Opera Mini", n[1] || ""];
	    if (e[0]) {
	      const r = e[0].toLowerCase();
	      "crios" === r && (e[0] = Browsers.rO),
	        "tizen" === r && ((e[0] = "Samsung Smart TV"), (e[1] = null)),
	        "samsungbrowser" === r && (e[0] = "Samsung Browser");
	    }
	    return e;
	  }
	}

	class ui {
	  constructor() {
	    const t = navigator.userAgentData ? ai : oi;
	    (this.Sg = new t()),
	      (this.userAgent = navigator.userAgent),
	      (this.browser = this.Sg.ef()),
	      (this.version = this.Sg.sf()),
	      (this.OS = null),
	      this.Da().then((t) => (this.OS = t));
	    const i = navigator;
	    (this.language = (
	      i.userLanguage ||
	      i.language ||
	      i.browserLanguage ||
	      i.systemLanguage ||
	      ""
	    ).toLowerCase()),
	      (this.Qo = ui.vg(this.userAgent));
	  }
	  IE() {
	    return this.browser === Browsers.Bg;
	  }
	  Ca() {
	    return this.OS || null;
	  }
	  Da() {
	    return this.OS
	      ? Promise.resolve(this.OS)
	      : this.Sg.Da(ui.kg).then((t) => ((this.OS = t), t));
	  }
	  static vg(t) {
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
	      "teoma",
	      "taiko",
	    ];
	    for (let n = 0; n < i.length; n++) if (-1 !== t.indexOf(i[n])) return !0;
	    return !1;
	  }
	}
	ui.kg = [
	  { string: navigator.platform, nf: "Win", identity: OperatingSystems.Og },
	  { string: navigator.platform, nf: "Mac", identity: OperatingSystems.Pg },
	  { string: navigator.platform, nf: "BlackBerry", identity: "BlackBerry" },
	  { string: navigator.platform, nf: "FreeBSD", identity: "FreeBSD" },
	  { string: navigator.platform, nf: "OpenBSD", identity: "OpenBSD" },
	  { string: navigator.platform, nf: "Nintendo", identity: "Nintendo" },
	  { string: navigator.platform, nf: "SunOS", identity: "SunOS" },
	  { string: navigator.platform, nf: "PlayStation", identity: "PlayStation" },
	  { string: navigator.platform, nf: "X11", identity: "X11" },
	  {
	    string: navigator.userAgent,
	    nf: ["iPhone", "iPad", "iPod"],
	    identity: OperatingSystems.io,
	  },
	  { string: navigator.platform, nf: "Pike v", identity: OperatingSystems.io },
	  { string: navigator.userAgent, nf: ["Web0S"], identity: "WebOS" },
	  {
	    string: navigator.platform,
	    nf: ["Linux armv7l", "Android"],
	    identity: OperatingSystems.xg,
	  },
	  { string: navigator.userAgent, nf: ["Android"], identity: OperatingSystems.xg },
	  { string: navigator.platform, nf: "Linux", identity: "Linux" },
	];
	const X = new ui();

	const STORAGE_KEYS = {
	  iu: {
	    su: "ab.storage.userId",
	    Uo: "ab.storage.deviceId",
	    El: "ab.storage.sessionId",
	  },
	  C: {
	    ec: "ab.test",
	    tE: "ab.storage.events",
	    eE: "ab.storage.attributes",
	    sE: "ab.storage.attributes.anonymous_user",
	    Fa: "ab.storage.device",
	    Jh: "ab.storage.sdk_metadata",
	    Qh: "ab.storage.session_id_for_cached_metadata",
	    In: "ab.storage.pushToken",
	    Ai: "ab.storage.newsFeed",
	    Bi: "ab.storage.lastNewsFeedRefresh",
	    J: "ab.storage.cardImpressions",
	    ul: "ab.storage.serverConfig",
	    rE: "ab.storage.triggers",
	    oE: "ab.storage.triggers.ts",
	    Nl: "ab.storage.messagingSessionStart",
	    bs: "ab.storage.cc",
	    js: "ab.storage.ccLastFullSync",
	    Rs: "ab.storage.ccLastCardUpdated",
	    nE: "ab.storage.ccRateLimitCurrentTokenCount",
	    Ru: "ab.storage.globalRateLimitCurrentTokenCount",
	    bu: "ab.storage.dynamicRateLimitCurrentTokenCount",
	    v: "ab.storage.ccClicks",
	    H: "ab.storage.ccImpressions",
	    A: "ab.storage.ccDismissals",
	    aE: "ab.storage.lastDisplayedTriggerTimesById",
	    iE: "ab.storage.lastDisplayedTriggerTime",
	    EE: "ab.storage.triggerFireInstancesById",
	    wh: "ab.storage.signature",
	    xs: "ab.storage.brazeSyncRetryCount",
	    Us: "ab.storage.sdkVersion",
	    vi: "ab.storage.ff",
	    wi: "ab.storage.ffImpressions",
	    zi: "ab.storage.ffLastRefreshAt",
	    Si: "ab.storage.ff.sessionId",
	    lE: "ab.storage.lastReqToEndpoint",
	    SE: "ab.storage.requestAttempts",
	    Xr: "ab.storage.deferredIam",
	    du: "ab.storage.lastSdkReq",
	    _E: "ab.storage.alias",
	  },
	  se: "ab.optOut",
	};
	class Q {
	  constructor(t, e) {
	    (this.uE = t), (this.TE = e), (this.uE = t), (this.TE = e);
	  }
	  Vh(t) {
	    const e = keys(STORAGE_KEYS.iu),
	      s = new Q.ee(t);
	    for (const t of e) s.remove(STORAGE_KEYS.iu[t]);
	  }
	  uu(t, e) {
	    let s = null;
	    null != e && e instanceof _t && (s = e.Y()), this.uE.store(t, s);
	  }
	  cE(t) {
	    const e = this.tu(t);
	    null != e && ((e.Wl = new Date().valueOf()), this.uu(t, e));
	  }
	  tu(t) {
	    const e = this.uE.br(t),
	      s = ((t) => {
	        let e;
	        try {
	          e = JSON.parse(t);
	        } catch (t) {
	          e = null;
	        }
	        return e;
	      })(e);
	    let r;
	    if (s) (r = _t.qn(s) || null), r && this.uu(t, r);
	    else {
	      const s = _t.hE(e);
	      (r = _t.qn(s) || null), s !== e && r && this.uu(t, r);
	    }
	    return r;
	  }
	  Al(t) {
	    this.uE.remove(t);
	  }
	  Kh() {
	    const t = keys(STORAGE_KEYS.iu);
	    let e;
	    for (const s of t)
	      (e = this.tu(STORAGE_KEYS.iu[s])),
	        null != e && this.uu(STORAGE_KEYS.iu[s], e);
	  }
	  zo(t) {
	    let e;
	    if (null == t || 0 === t.length) return !1;
	    e = isArray(t) ? t : [t];
	    let s = this.TE.br(STORAGE_KEYS.C.tE);
	    (null != s && isArray(s)) || (s = []);
	    for (let t = 0; t < e.length; t++) s.push(e[t].Y());
	    return this.TE.store(STORAGE_KEYS.C.tE, s);
	  }
	  kl(t) {
	    return null != t && this.zo([t]);
	  }
	  AE() {
	    let t = this.TE.br(STORAGE_KEYS.C.tE);
	    this.TE.remove(STORAGE_KEYS.C.tE), null == t && (t = []);
	    const e = [];
	    let s = !1,
	      r = null;
	    if (isArray(t))
	      for (let s = 0; s < t.length; s++)
	        ve.RE(t[s]) ? e.push(ve.qn(t[s])) : (r = s);
	    else s = !0;
	    if (s || null != r) {
	      let o = "Stored events could not be deserialized as Events";
	      s &&
	        (o += ", was " + Object.prototype.toString.call(t) + " not an array"),
	        null != r &&
	          (o += ", value at index " + r + " does not look like an event"),
	        (o +=
	          ", serialized values were of type " +
	          typeof t +
	          ": " +
	          JSON.stringify(t)),
	        e.push(new ve(null, i.Ls, new Date().valueOf(), null, { e: o }));
	    }
	    return e;
	  }
	  I(t, e) {
	    return (
	      !!validateValueIsFromEnum(
	        STORAGE_KEYS.C,
	        t,
	        "StorageManager cannot store object.",
	        "STORAGE_KEYS.OBJECTS",
	      ) && this.TE.store(t, e)
	    );
	  }
	  j(t) {
	    return (
	      !!validateValueIsFromEnum(
	        STORAGE_KEYS.C,
	        t,
	        "StorageManager cannot retrieve object.",
	        "STORAGE_KEYS.OBJECTS",
	      ) && this.TE.br(t)
	    );
	  }
	  ii(t) {
	    return (
	      !!validateValueIsFromEnum(
	        STORAGE_KEYS.C,
	        t,
	        "StorageManager cannot remove object.",
	        "STORAGE_KEYS.OBJECTS",
	      ) && (this.TE.remove(t), !0)
	    );
	  }
	  clearData() {
	    const t = keys(STORAGE_KEYS.iu),
	      e = keys(STORAGE_KEYS.C);
	    for (let e = 0; e < t.length; e++) {
	      const s = t[e];
	      this.uE.remove(STORAGE_KEYS.iu[s]);
	    }
	    for (let t = 0; t < e.length; t++) {
	      const s = e[t];
	      this.TE.remove(STORAGE_KEYS.C[s]);
	    }
	  }
	  gE(t) {
	    return t || STORAGE_KEYS.C.sE;
	  }
	  Pa(t) {
	    let e = this.TE.br(STORAGE_KEYS.C.eE);
	    null == e && (e = {});
	    const s = this.gE(t[User.Yn]),
	      r = e[s];
	    for (const o in t)
	      o !== User.Yn &&
	        (null == e[s] || (r && null == r[o])) &&
	        this.mu(t[User.Yn], o, t[o]);
	  }
	  mu(t, e, s) {
	    let r = this.TE.br(STORAGE_KEYS.C.eE);
	    null == r && (r = {});
	    const o = this.gE(t);
	    let n = r[o];
	    if (
	      (null == n && ((n = {}), null != t && (n[User.Yn] = t)), e === User.lu)
	    ) {
	      null == n[e] && (n[e] = {});
	      for (const t in s) n[e][t] = s[t];
	    } else n[e] = s;
	    return (r[o] = n), this.TE.store(STORAGE_KEYS.C.eE, r);
	  }
	  OE() {
	    const t = this.TE.br(STORAGE_KEYS.C.eE);
	    this.TE.remove(STORAGE_KEYS.C.eE);
	    const e = [];
	    for (const s in t) null != t[s] && e.push(t[s]);
	    return e;
	  }
	  ru(t) {
	    const e = this.TE.br(STORAGE_KEYS.C.eE);
	    if (null != e) {
	      const s = this.gE(null),
	        r = e[s];
	      null != r &&
	        ((e[s] = void 0),
	        this.TE.store(STORAGE_KEYS.C.eE, e),
	        (r[User.Yn] = t),
	        this.Pa(r));
	    }
	    const s = this.tu(STORAGE_KEYS.iu.El);
	    let r = null;
	    null != s && (r = s.eu);
	    const o = this.AE();
	    if (null != o)
	      for (let e = 0; e < o.length; e++) {
	        const s = o[e];
	        null == s.userId && s.sessionId == r && (s.userId = t), this.kl(s);
	      }
	  }
	  dE() {
	    return this.TE.fE;
	  }
	}
	(Q.rc = class {
	  constructor(t) {
	    (this.rn = t), (this.rn = t), (this.fE = X.IE() ? 3 : 10);
	  }
	  bE(t) {
	    return t + "." + this.rn;
	  }
	  store(t, e) {
	    const s = { v: e };
	    try {
	      return localStorage.setItem(this.bE(t), JSON.stringify(s)), !0;
	    } catch (t) {
	      return r$1.info("Storage failure: " + getErrorMessage(t)), !1;
	    }
	  }
	  br(t) {
	    try {
	      let e = null;
	      const s = localStorage.getItem(this.bE(t));
	      return null != s && (e = JSON.parse(s)), null == e ? null : e.v;
	    } catch (t) {
	      return r$1.info("Storage retrieval failure: " + getErrorMessage(t)), null;
	    }
	  }
	  remove(t) {
	    try {
	      localStorage.removeItem(this.bE(t));
	    } catch (t) {
	      return r$1.info("Storage removal failure: " + getErrorMessage(t)), !1;
	    }
	  }
	}),
	  (Q.ac = class {
	    constructor() {
	      (this.mE = {}), (this.KE = 5242880), (this.fE = 3);
	    }
	    store(t, e) {
	      const s = { value: e },
	        o = this.YE(e);
	      return o > this.KE
	        ? (r$1.info(
	            "Storage failure: object is ≈" +
	              o +
	              " bytes which is greater than the max of " +
	              this.KE,
	          ),
	          !1)
	        : ((this.mE[t] = s), !0);
	    }
	    YE(t) {
	      const e = [],
	        s = [t];
	      let r = 0;
	      for (; s.length; ) {
	        const t = s.pop();
	        if ("boolean" == typeof t) r += 4;
	        else if ("string" == typeof t) r += 2 * t.length;
	        else if ("number" == typeof t) r += 8;
	        else if ("object" == typeof t && -1 === e.indexOf(t)) {
	          let r, o;
	          e.push(t);
	          for (const e in t) (o = t), (r = e), s.push(o[r]);
	        }
	      }
	      return r;
	    }
	    br(t) {
	      const e = this.mE[t];
	      return null == e ? null : e.value;
	    }
	    remove(t) {
	      this.mE[t] = null;
	    }
	  }),
	  (Q.ee = class {
	    constructor(t, e) {
	      (this.rn = t),
	        (this.NE = e),
	        (this.rn = t),
	        (this.CE = this.GE()),
	        (this.DE = 576e3),
	        (this.NE = !!e);
	    }
	    bE(t) {
	      return null != this.rn ? t + "." + this.rn : t;
	    }
	    GE() {
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
	          r + "=;expires=" + new Date(0).toUTCString() + ";domain=" + e + ";"),
	        e
	      );
	    }
	    ne() {
	      const t = new Date();
	      return t.setTime(t.getTime() + 60 * this.DE * 1e3), t.getFullYear();
	    }
	    ME() {
	      const t = values(STORAGE_KEYS.iu),
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
	          -1 === t.indexOf("." + this.rn) && this.pE(t);
	        }
	      }
	    }
	    store(t, e) {
	      this.ME();
	      const s = new Date();
	      s.setTime(s.getTime() + 60 * this.DE * 1e3);
	      const o = "expires=" + s.toUTCString(),
	        n = "domain=" + this.CE;
	      let a;
	      a = this.NE ? e : encodeURIComponent(e);
	      const i = this.bE(t) + "=" + a + ";" + o + ";" + n + ";path=/";
	      return i.length >= 4093
	        ? (r$1.info(
	            "Storage failure: string is " +
	              i.length +
	              " chars which is too large to store as a cookie.",
	          ),
	          !1)
	        : ((document.cookie = i), !0);
	    }
	    br(t) {
	      const e = [],
	        s = this.bE(t) + "=",
	        o = document.cookie.split(";");
	      for (let n = 0; n < o.length; n++) {
	        let a = o[n];
	        for (; " " === a.charAt(0); ) a = a.substring(1);
	        if (0 === a.indexOf(s))
	          try {
	            let t;
	            (t = this.NE
	              ? a.substring(s.length, a.length)
	              : decodeURIComponent(a.substring(s.length, a.length))),
	              e.push(t);
	          } catch (e) {
	            return (
	              r$1.info("Storage retrieval failure: " + getErrorMessage(e)),
	              this.remove(t),
	              null
	            );
	          }
	      }
	      return e.length > 0 ? e[e.length - 1] : null;
	    }
	    remove(t) {
	      this.pE(this.bE(t));
	    }
	    pE(t) {
	      const e = t + "=;expires=" + new Date(0).toUTCString();
	      (document.cookie = e), (document.cookie = e + ";path=/");
	      const s = e + ";domain=" + this.CE;
	      (document.cookie = s), (document.cookie = s + ";path=/");
	    }
	  }),
	  (Q.tc = class {
	    constructor(t, e, s) {
	      (this.rn = t),
	        (this.vE = []),
	        e && this.vE.push(new Q.ee(t)),
	        s && this.vE.push(new Q.rc(t)),
	        this.vE.push(new Q.ac());
	    }
	    store(t, e) {
	      let s = !0;
	      for (let r = 0; r < this.vE.length; r++) s = this.vE[r].store(t, e) && s;
	      return s;
	    }
	    br(t) {
	      for (let e = 0; e < this.vE.length; e++) {
	        const s = this.vE[e].br(t);
	        if (null != s) return s;
	      }
	      return null;
	    }
	    remove(t) {
	      new Q.ee(this.rn).remove(t);
	      for (let e = 0; e < this.vE.length; e++) this.vE[e].remove(t);
	    }
	  });

	class qt {
	  constructor(t, i, s) {
	    (this.u = t),
	      (this.Jn = i),
	      (this.Qn = s),
	      (this.u = t),
	      (this.Jn = i || !1),
	      (this.Qn = s),
	      (this.Xn = new T()),
	      (this.Zn = 0),
	      (this.gh = 1);
	  }
	  Fh() {
	    return this.Jn;
	  }
	  kh() {
	    return this.u.j(STORAGE_KEYS.C.wh);
	  }
	  setSdkAuthenticationSignature(t) {
	    const i = this.kh();
	    this.u.I(STORAGE_KEYS.C.wh, t);
	    const s = A.ts.Zt;
	    new A(s, r$1).setItem(s.hs.jh, this.gh, t), i !== t && this.Vs();
	  }
	  xh() {
	    this.u.ii(STORAGE_KEYS.C.wh);
	    const t = A.ts.Zt;
	    new A(t, r$1).re(t.hs.jh, this.gh);
	  }
	  subscribeToSdkAuthenticationFailures(t) {
	    return this.Qn.Nt(t);
	  }
	  qh(t) {
	    this.Qn.Rt(t);
	  }
	  yh() {
	    this.Xn.removeAllSubscriptions();
	  }
	  Bh() {
	    this.Zn += 1;
	  }
	  Gh() {
	    return this.Zn;
	  }
	  Vs() {
	    this.Zn = 0;
	  }
	}

	class y {
	  constructor() {}
	  Ss(a) {}
	  changeUser(a = !1) {}
	  clearData(a = !1) {}
	}

	class Gt {
	  constructor(s) {
	    (this.id = s), (this.id = s);
	  }
	  Mr() {
	    const s = {};
	    return (
	      null != this.browser && (s.browser = this.browser),
	      null != this.Ta && (s.browser_version = this.Ta),
	      null != this.os && (s.os_version = this.os),
	      null != this.resolution && (s.resolution = this.resolution),
	      null != this.language && (s.locale = this.language),
	      null != this.timeZone && (s.time_zone = this.timeZone),
	      null != this.userAgent && (s.user_agent = this.userAgent),
	      s
	    );
	  }
	}

	var DeviceProperties = {
	  BROWSER: "browser",
	  BROWSER_VERSION: "browserVersion",
	  OS: "os",
	  RESOLUTION: "resolution",
	  LANGUAGE: "language",
	  TIME_ZONE: "timeZone",
	  USER_AGENT: "userAgent",
	};

	class Ot {
	  constructor(t, e) {
	    (this.u = t),
	      (this.Ia = e),
	      (this.u = t),
	      null == e && (e = values(DeviceProperties)),
	      (this.Ia = e);
	  }
	  ce(t = !0) {
	    let e = this.u.tu(STORAGE_KEYS.iu.Uo);
	    null == e && ((e = new _t(p$1.W())), t && this.u.uu(STORAGE_KEYS.iu.Uo, e));
	    const r = new Gt(e.eu);
	    for (let t = 0; t < this.Ia.length; t++) {
	      switch (this.Ia[t]) {
	        case DeviceProperties.BROWSER:
	          r.browser = X.browser;
	          break;
	        case DeviceProperties.BROWSER_VERSION:
	          r.Ta = X.version;
	          break;
	        case DeviceProperties.OS:
	          r.os = this.Da();
	          break;
	        case DeviceProperties.RESOLUTION:
	          r.Sa = screen.width + "x" + screen.height;
	          break;
	        case DeviceProperties.LANGUAGE:
	          r.language = X.language;
	          break;
	        case DeviceProperties.TIME_ZONE:
	          r.timeZone = this.Oa(new Date());
	          break;
	        case DeviceProperties.USER_AGENT:
	          r.userAgent = X.userAgent;
	      }
	    }
	    return r;
	  }
	  Da() {
	    if (X.Ca()) return X.Ca();
	    const t = this.u.j(STORAGE_KEYS.C.Fa);
	    return t && t.os_version ? t.os_version : X.Da();
	  }
	  Oa(t) {
	    let e = !1;
	    if ("undefined" != typeof Intl && "function" == typeof Intl.DateTimeFormat)
	      try {
	        if ("function" == typeof Intl.DateTimeFormat().resolvedOptions) {
	          const t = Intl.DateTimeFormat().resolvedOptions().timeZone;
	          if (null != t && "" !== t) return t;
	        }
	      } catch (t) {
	        r$1.info(
	          "Intl.DateTimeFormat threw an error, cannot detect user's time zone:" +
	            getErrorMessage(t),
	        ),
	          (e = !0);
	      }
	    if (e) return "";
	    const s = t.getTimezoneOffset();
	    return this.Ga(s);
	  }
	  Ga(t) {
	    const e = Math.trunc(t / 60),
	      r = Math.trunc(t % 60);
	    let s = "GMT";
	    return (
	      0 !== t &&
	        ((s += t < 0 ? "+" : "-"),
	        (s +=
	          ("00" + Math.abs(e)).slice(-2) +
	          ":" +
	          ("00" + Math.abs(r)).slice(-2))),
	      s
	    );
	  }
	}

	var Xt = {
	  Na: "invalid_api_key",
	  Xa: "blacklisted",
	  $a: "no_device_identifier",
	  Ba: "invalid_json_response",
	  Ra: "empty_response",
	  __: "sdk_auth_error",
	};

	const D = {
	  _s: {
	    Ka: "data",
	    Xs: "content_cards/sync",
	    Ri: "feature_flags/sync",
	    Tr: "template",
	  },
	  ku: (t) => (null == t ? void 0 : t.j(STORAGE_KEYS.C.lE)),
	  sm: (t) => (null == t ? void 0 : t.j(STORAGE_KEYS.C.SE)),
	  nm: (t, e) => {
	    null == t || t.I(STORAGE_KEYS.C.lE, e);
	  },
	  um: (t, e) => {
	    null == t || t.I(STORAGE_KEYS.C.SE, e);
	  },
	  Wa: (t, e) => {
	    if (!t || !e) return -1;
	    const s = D.ku(t);
	    if (null == s) return -1;
	    const n = s[e];
	    return null == n || isNaN(n) ? -1 : n;
	  },
	  Ya: (t, e) => {
	    let s = REQUEST_ATTEMPT_DEFAULT;
	    if (!t || !e) return s;
	    const n = D.sm(t);
	    return null == n ? s : ((s = n[e]), null == s || isNaN(s) ? REQUEST_ATTEMPT_DEFAULT : s);
	  },
	  Hs: (t, e, s) => {
	    if (!t || !e) return;
	    let n = D.ku(t);
	    null == n && (n = {}), (n[e] = s), D.nm(t, n);
	  },
	  Ws: (t, e, s) => {
	    if (!t || !e) return;
	    let n = D.sm(t);
	    null == n && (n = {}), (n[e] = s), D.um(t, n);
	  },
	  ti: (t, e) => {
	    if (!t || !e) return;
	    const s = D.Ya(t, e);
	    D.Ws(t, e, s + 1);
	  },
	};

	class Pt {
	  constructor(t, e, i, s, r, n, o, h, a, u, l, c) {
	    (this.on = t),
	      (this.u = e),
	      (this.Ko = i),
	      (this.yt = s),
	      (this.oi = r),
	      (this.qt = n),
	      (this.rn = o),
	      (this.Go = h),
	      (this.Bo = a),
	      (this.Vo = u),
	      (this.appVersion = l),
	      (this.Xh = c),
	      (this.Hh = (t) => (null == t ? "" : `${t} `)),
	      (this.on = t),
	      (this.u = e),
	      (this.Ko = i),
	      (this.yt = s),
	      (this.oi = r),
	      (this.qt = n),
	      (this.rn = o),
	      (this.Go = h),
	      (this.Bo = a),
	      (this.Vo = u),
	      (this.appVersion = l),
	      (this.Xh = c),
	      (this.Yh = ["npm"]);
	  }
	  $s(t, e = !1, i = !1) {
	    const s = this.on.ce(!i),
	      r = s.Mr(),
	      n = this.u.j(STORAGE_KEYS.C.Fa);
	    isEqual(n, r) || (t.device = r),
	      (t.api_key = this.rn),
	      (t.time = convertMsToSeconds(new Date().valueOf(), !0));
	    const a = this.u.j(STORAGE_KEYS.C.Jh) || [],
	      u = this.u.j(STORAGE_KEYS.C.Qh) || "";
	    if (
	      (this.Yh.length > 0 &&
	        (!isEqual(a, this.Yh) || u !== this.oi.xi()) &&
	        (t.sdk_metadata = this.Yh),
	      (t.sdk_version = this.Bo),
	      this.Vo && (t.sdk_flavor = this.Vo),
	      (t.app_version = this.appVersion),
	      (t.app_version_code = this.Xh),
	      (t.device_id = s.id),
	      e)
	    ) {
	      const e = this.yt.getUserId();
	      null != e && (t.user_id = e);
	    }
	    if (!t.user_id && !this.Ko.Fh()) {
	      const e = getAlias(this.u);
	      e && (t.alias = e);
	    }
	    return t;
	  }
	  Qs(e, s, n) {
	    const o = s.auth_error,
	      h = s.error;
	    if (!o && !h) return !0;
	    if (o) {
	      let t;
	      this.Ko.Bh();
	      const i = { errorCode: o.error_code };
	      for (const t of n)
	        isArray(t) && "X-Braze-Auth-Signature" === t[0] && (i.signature = t[1]);
	      e.respond_with && e.respond_with.user_id
	        ? (i.userId = e.respond_with.user_id)
	        : e.user_id && (i.userId = e.user_id);
	      const s = o.reason;
	      return (
	        s
	          ? ((i.reason = s), (t = `due to ${s}`))
	          : (t = `with error code ${o.error_code}.`),
	        this.Ko.Fh() ||
	          (t +=
	            ' Please use the "enableSdkAuthentication" initialization option to enable authentication.'),
	        r$1.error(`SDK Authentication failed ${t}`),
	        this.Zh(e.events || [], e.attributes || []),
	        this.Ko.qh(i),
	        !1
	      );
	    }
	    if (h) {
	      let n,
	        o = h;
	      switch (o) {
	        case Xt.Ra:
	          return (
	            (n = "Received successful response with empty body."),
	            t$1.q(i.Ls, { e: n }),
	            r$1.info(n),
	            !1
	          );
	        case Xt.Ba:
	          return (
	            (n = "Received successful response with invalid JSON"),
	            t$1.q(i.Ls, { e: n + ": " + s.response }),
	            r$1.info(n),
	            !1
	          );
	        case Xt.Na:
	          o = `The API key "${e.api_key}" is invalid for the baseUrl ${this.Go}`;
	          break;
	        case Xt.Xa:
	          o =
	            "Sorry, we are not currently accepting your requests. If you think this is in error, please contact us.";
	          break;
	        case Xt.$a:
	          o = "No device identifier. Please contact support@braze.com";
	      }
	      r$1.error("Backend error: " + o);
	    }
	    return !1;
	  }
	  La(t, e, i, s) {
	    return !!((t && 0 !== t.length) || (e && 0 !== e.length) || i || s);
	  }
	  Ea(t, e, i, s, r = !1) {
	    const n = [],
	      o = (t) => t || "",
	      h = o(this.yt.getUserId());
	    let a = this.Ir(t, e);
	    const u = [],
	      l = [];
	    let c,
	      d = null;
	    if (i.length > 0) {
	      const t = [];
	      for (const e of i) {
	        if (((c = e.Mr()), this.Ko.Fh())) {
	          if (h && !c.user_id) {
	            d || (d = {}), d.events || (d.events = []), d.events.push(c);
	            continue;
	          }
	          if (o(c.user_id) !== h) {
	            l.push(c);
	            continue;
	          }
	        }
	        t.push(c);
	      }
	      t.length > 0 && (a.events = t);
	    }
	    if (s.length > 0) {
	      const t = [];
	      for (const e of s)
	        e && (this.Ko.Fh() && o(e.user_id) !== h ? u.push(e) : t.push(e));
	      t.length > 0 && (a.attributes = t);
	    }
	    if ((this.Zh(l, u), (a = this.$s(a, !0, r)), d)) {
	      d = this.$s(d, !1, r);
	      const t = { requestData: d, headers: this.Ps(d, D._s.Ka) };
	      n.push(t);
	    }
	    if (a && !this.La(a.events, a.attributes, t, e)) return d ? n : null;
	    const f = { requestData: a, headers: this.Ps(a, D._s.Ka) };
	    return n.push(f), n;
	  }
	  Zh(t, e) {
	    if (t) {
	      const e = [];
	      for (const i of t) {
	        const t = ve.fromJson(i);
	        (t.time = convertSecondsToMs(t.time)), e.push(t);
	      }
	      this.u.zo(e);
	    }
	    if (e) for (const t of e) this.u.Pa(t);
	  }
	  Ys(t, e) {
	    let i = "HTTP error ";
	    null != t && (i += t + " "), (i += e), r$1.error(i);
	  }
	  qr(e) {
	    return t$1.q(i.Ua, { n: e });
	  }
	  Ir(t, e, i) {
	    const s = {};
	    t && (s.feed = !0), e && (s.triggers = !0);
	    const r = null != i ? i : this.yt.getUserId();
	    if ((r && (s.user_id = r), !s.user_id && !this.Ko.Fh())) {
	      const t = getAlias(this.u);
	      t && (s.alias = t);
	    }
	    return (s.config = { config_time: this.qt.hi() }), { respond_with: s };
	  }
	  Ha(t) {
	    const e = new Date().valueOf();
	    let i = LAST_REQUEST_TO_ENDPOINT_MS_AGO_DEFAULT.toString();
	    const s = D.Wa(this.u, t);
	    if (-1 !== s) {
	      i = (e - s).toString();
	    }
	    return i;
	  }
	  Ps(t, e, i = !1) {
	    const s = [["X-Braze-Api-Key", this.rn]],
	      r = this.Ha(e);
	    s.push(["X-Braze-Last-Req-Ms-Ago", r]);
	    const n = D.Ya(this.u, e).toString();
	    s.push(["X-Braze-Req-Attempt", n]);
	    let h = !1;
	    if (
	      (null != t.respond_with &&
	        t.respond_with.triggers &&
	        (s.push(["X-Braze-TriggersRequest", "true"]), (h = !0)),
	      null != t.respond_with &&
	        t.respond_with.feed &&
	        (s.push(["X-Braze-FeedRequest", "true"]), (h = !0)),
	      e === D._s.Xs)
	    ) {
	      s.push(["X-Braze-ContentCardsRequest", "true"]);
	      let t = this.u.j(STORAGE_KEYS.C.xs);
	      (t && i) || ((t = 0), this.u.I(STORAGE_KEYS.C.xs, t)),
	        s.push(["BRAZE-SYNC-RETRY-COUNT", t.toString()]),
	        (h = !0);
	    }
	    if (
	      (e === D._s.Ri &&
	        (s.push(["X-Braze-FeatureFlagsRequest", "true"]), (h = !0)),
	      h && s.push(["X-Braze-DataRequest", "true"]),
	      this.Ko.Fh())
	    ) {
	      const t = this.Ko.kh();
	      null != t && s.push(["X-Braze-Auth-Signature", t]);
	    }
	    return s;
	  }
	  Ja(t, e, i, s) {
	    window.setTimeout(() => {
	      r$1.info(`Retrying rate limited ${this.Hh(s)}SDK request.`),
	        this.Gs(e, i, s);
	    }, t);
	  }
	  Gs(t, e, i, s) {
	    if (!this.Qa(i))
	      return (
	        r$1.info(`${this.Hh(i)}SDK request being rate limited.`),
	        void ("function" == typeof s && s())
	      );
	    const n = this.Va();
	    if (!n.Za)
	      return (
	        r$1.info(
	          `${this.Hh(
            i,
          )}SDK request being rate limited. Request will be retried in ${Math.trunc(
            n.au / 1e3,
          )} seconds.`,
	        ),
	        void this.Ja(n.au, t, e, i)
	      );
	    this.u.I(STORAGE_KEYS.C.du, new Date().valueOf());
	    const h = t.device;
	    h && h.os_version instanceof Promise
	      ? h.os_version.then((i) => {
	          (t.device.os_version = i), e(n.fu);
	        })
	      : e(n.fu);
	  }
	  vu(t) {
	    var e;
	    null === (e = this.u) || void 0 === e || e.I(STORAGE_KEYS.C.Ru, t);
	  }
	  gu(t, e) {
	    let i = this.pu();
	    null == i && (i = {}), (i[t] = e), this.u.I(STORAGE_KEYS.C.bu, i);
	  }
	  qu() {
	    var t;
	    return null === (t = this.u) || void 0 === t ? void 0 : t.j(STORAGE_KEYS.C.Ru);
	  }
	  pu() {
	    var t;
	    return null === (t = this.u) || void 0 === t ? void 0 : t.j(STORAGE_KEYS.C.bu);
	  }
	  Au(t, e, i, s, r = "") {
	    let n;
	    if (r) {
	      const t = this.pu();
	      n = null == t || isNaN(t[r]) ? e : t[r];
	    } else (n = this.qu()), (null == n || isNaN(n)) && (n = e);
	    const o = (t - s) / 1e3;
	    return (n = Math.min(n + o / i, e)), n;
	  }
	  Du(t, e) {
	    return Math.max(0, (1 - t) * e * 1e3);
	  }
	  Tu(t, e = "") {
	    var i, s, r, n, h;
	    const a = { Za: !0, fu: -1, au: 0 };
	    if ((null == t && (t = !0), !t && !e)) return a;
	    let u,
	      l,
	      c = null;
	    if (t) c = null === (i = this.u) || void 0 === i ? void 0 : i.j(STORAGE_KEYS.C.du);
	    else {
	      const t = D.ku(this.u);
	      if (null == t || null == t[e]) return a;
	      c = t[e];
	    }
	    if (null == c || isNaN(c)) return a;
	    if (
	      (t
	        ? ((u =
	            (null === (s = this.qt) || void 0 === s ? void 0 : s.Cu()) || -1),
	          (l =
	            (null === (r = this.qt) || void 0 === r ? void 0 : r.Su()) || -1))
	        : ((u =
	            (null === (n = this.qt) || void 0 === n ? void 0 : n.Bu(e)) || -1),
	          (l =
	            (null === (h = this.qt) || void 0 === h ? void 0 : h.wu(e)) || -1)),
	      -1 === u || -1 === l)
	    )
	      return a;
	    const d = new Date().valueOf();
	    let f = this.Au(d, u, l, c, e);
	    return f < 1
	      ? ((a.Za = !1), (a.au = this.Du(f, l)), a)
	      : ((f = Math.trunc(f) - 1),
	        (a.fu = f),
	        t ? this.vu(f) : this.gu(e, f),
	        a);
	  }
	  Va() {
	    return this.Tu(!0);
	  }
	  Qa(t) {
	    const e = this.Tu(!1, t);
	    return !(e && !e.Za);
	  }
	  Vs() {
	    this.Ko.Vs();
	  }
	  Os() {
	    return this.Go;
	  }
	  addSdkMetadata(t) {
	    for (const e of t) -1 === this.Yh.indexOf(e) && this.Yh.push(e);
	  }
	}

	const C = {
	  Ks: (t) => {
	    let e, o;
	    try {
	      const n = () => {
	        r$1.error("This browser does not have any supported ajax options!");
	      };
	      let s = !1;
	      if ((window.XMLHttpRequest && (s = !0), !s)) return void n();
	      e = new XMLHttpRequest();
	      const i = () => {
	        "function" == typeof t.error && t.error(e.status),
	          "function" == typeof t.Zs && t.Zs(!1);
	      };
	      (e.onload = () => {
	        let o = !1;
	        if (4 === e.readyState)
	          if (
	            ((o = (e.status >= 200 && e.status < 300) || 304 === e.status), o)
	          ) {
	            if ("function" == typeof t.L) {
	              let o, r;
	              try {
	                (o = JSON.parse(e.responseText)),
	                  (r = e.getAllResponseHeaders());
	              } catch (o) {
	                const n = {
	                  error: "" === e.responseText ? Xt.Ra : Xt.Ba,
	                  response: e.responseText,
	                };
	                (0, t.L)(n, r);
	              }
	              o && t.L(o, r);
	            }
	            "function" == typeof t.Zs && t.Zs(!0);
	          } else i();
	      }),
	        (e.onerror = () => {
	          i();
	        }),
	        (e.ontimeout = () => {
	          i();
	        }),
	        (o = JSON.stringify(t.data)),
	        e.open("POST", t.url, !0),
	        e.setRequestHeader("Content-type", "application/json"),
	        e.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	      const f = t.headers || [];
	      for (const t of f) e.setRequestHeader(t[0], t[1]);
	      e.send(o);
	    } catch (t) {
	      r$1.error(`Network request error: ${getErrorMessage(t)}`);
	    }
	  },
	};
	const readResponseHeaders = (t) => {
	  const e = {},
	    o = t.toString().split("\r\n");
	  if (!o) return e;
	  let r, n;
	  for (const t of o)
	    t &&
	      ((r = t.slice(0, t.indexOf(":")).toLowerCase().trim()),
	      (n = t.slice(t.indexOf(":") + 1).trim()),
	      (e[r] = n));
	  return e;
	};

	const randomInclusive = (t, a) => (
	  (t = Math.ceil(t)),
	  (a = Math.floor(a)),
	  Math.floor(Math.random() * (a - t + 1)) + t
	);

	class s {
	  constructor(t = !1, s = []) {
	    (this.L = t), (this.ge = s), (this.L = t), (this.ge = s);
	  }
	  P(t) {
	    (this.L = this.L && t.L), this.ge.push(...t.ge);
	  }
	}

	const yt = {
	  pn: () =>
	    "serviceWorker" in navigator &&
	    "undefined" != typeof ServiceWorkerRegistration &&
	    "showNotification" in ServiceWorkerRegistration.prototype &&
	    "PushManager" in window,
	  yn: () =>
	    "safari" in window &&
	    "pushNotification" in window.safari &&
	    "function" == typeof window.safari.pushNotification.permission &&
	    "function" == typeof window.safari.pushNotification.requestPermission,
	  isPushSupported: () => yt.pn() || yt.yn(),
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
	  Wi: () =>
	    !yt.isPushBlocked() &&
	    yt.isPushSupported() &&
	    !yt.isPushPermissionGranted(),
	};
	var yt$1 = yt;

	class Lt {
	  constructor(t, i, s, e, h, o, n, r, u, l) {
	    (this.rn = t),
	      (this.baseUrl = i),
	      (this.oi = s),
	      (this.on = e),
	      (this.yt = h),
	      (this.qt = o),
	      (this.u = n),
	      (this.yu = r),
	      (this.Ko = u),
	      (this.$t = l),
	      (this.rn = t),
	      (this.baseUrl = i),
	      (this.ju = 0),
	      (this.fE = n.dE() || 0),
	      (this.$u = null),
	      (this.oi = s),
	      (this.on = e),
	      (this.yt = h),
	      (this.qt = o),
	      (this.u = n),
	      (this.Ko = u),
	      (this.$t = l),
	      (this.yu = r),
	      (this.Fu = new T()),
	      (this.Lu = null),
	      (this.Mu = 50),
	      (this.Pu = !1);
	  }
	  xu(t, i) {
	    return !t && !i && this.Ko.Gh() >= this.Mu;
	  }
	  Iu(t) {
	    let s = this.oi.Gl();
	    if (t.length > 0) {
	      const e = this.yt.getUserId();
	      for (const h of t) {
	        const t = (!h.userId && !e) || h.userId === e;
	        h.type === i.ql && t && (s = !0);
	      }
	    }
	    return s;
	  }
	  Nu(t = !1, i = !1, s = !0, e, h, n, u = !1, l = !1) {
	    s && this.Ou();
	    const a = this.u.AE(),
	      c = this.u.OE();
	    let d = !1;
	    const m = (t, i, r = -1) => {
	        let u = !1;
	        const l = new Date().valueOf();
	        D.Hs(this.u, D._s.Ka, l),
	          -1 !== r && i.push(["X-Braze-Req-Tokens-Remaining", r.toString()]),
	          C.Ks({
	            url: this.baseUrl + "/data/",
	            data: t,
	            headers: i,
	            L: (s) => {
	              null != t.respond_with &&
	                t.respond_with.triggers &&
	                (this.ju = Math.max(this.ju - 1, 0)),
	                this.$t.Qs(t, s, i)
	                  ? (this.Ko.Vs(),
	                    this.qt.al(s),
	                    (null != t.respond_with &&
	                      t.respond_with.user_id != this.yt.getUserId()) ||
	                      (null != t.device && this.u.I(STORAGE_KEYS.C.Fa, t.device),
	                      null != t.sdk_metadata &&
	                        (this.u.I(STORAGE_KEYS.C.Jh, t.sdk_metadata),
	                        this.u.I(STORAGE_KEYS.C.Qh, this.oi.xi())),
	                      this.yu(s),
	                      D.Ws(this.u, D._s.Ka, 1),
	                      "function" == typeof e && e()))
	                  : s.auth_error && (u = !0);
	            },
	            error: () => {
	              null != t.respond_with &&
	                t.respond_with.triggers &&
	                (this.ju = Math.max(this.ju - 1, 0)),
	                this.$t.Zh(t.events, t.attributes),
	                "function" == typeof h && h();
	            },
	            Zs: (t) => {
	              if (("function" == typeof n && n(t), s && !d)) {
	                if (t && !u) this.zu();
	                else {
	                  D.ti(this.u, D._s.Ka);
	                  let t = this.$u;
	                  (null == t || t < 1e3 * this.fE) && (t = 1e3 * this.fE),
	                    this.zu(Math.min(3e5, randomInclusive(1e3 * this.fE, 3 * t)));
	                }
	                d = !0;
	              }
	            },
	          });
	      },
	      f = this.Iu(a),
	      g = i || f;
	    if (this.xu(u, f))
	      return void r$1.info(
	        "Declining to flush data due to 50 consecutive authentication failures",
	      );
	    if (s && !this.$t.La(a, c, t, g))
	      return this.zu(), void ("function" == typeof n && n(!0));
	    const v = this.$t.Ea(t, g, a, c, l);
	    g && this.ju++;
	    let p = !1;
	    if (v)
	      for (const t of v)
	        this.$t.Gs(
	          t.requestData,
	          (i) => m(t.requestData, t.headers, i),
	          D._s.Ka,
	          h,
	        ),
	          (p = !0);
	    this.Ko.Fh() && s && !p
	      ? this.zu()
	      : f && (r$1.info("Invoking new session subscriptions"), this.Fu.Rt());
	  }
	  Uu() {
	    return this.ju > 0;
	  }
	  zu(t = 1e3 * this.fE) {
	    this.Pu ||
	      (this.Ou(),
	      (this.Lu = window.setTimeout(() => {
	        if (document.hidden) {
	          const t = "visibilitychange",
	            i = () => {
	              document.hidden ||
	                (document.removeEventListener(t, i, !1), this.Nu());
	            };
	          document.addEventListener(t, i, !1);
	        } else this.Nu();
	      }, t)),
	      (this.$u = t));
	  }
	  Ou() {
	    null != this.Lu && (clearTimeout(this.Lu), (this.Lu = null));
	  }
	  initialize() {
	    (this.Pu = !1), this.zu();
	  }
	  destroy() {
	    this.Fu.removeAllSubscriptions(),
	      this.Ko.yh(),
	      this.Ou(),
	      (this.Pu = !0),
	      this.Nu(void 0, void 0, !1, void 0, void 0, void 0, void 0, !0),
	      (this.Lu = null);
	  }
	  mr(t) {
	    return this.Fu.Nt(t);
	  }
	  openSession() {
	    const t = this.oi.xi() !== this.oi.xo();
	    t && (this.u.cE(STORAGE_KEYS.iu.Uo), this.u.cE(STORAGE_KEYS.iu.su)),
	      this.Nu(void 0, !1, void 0, () => {
	        this.u.ii(STORAGE_KEYS.C.wi);
	      }),
	      this.Mn(),
	      t &&
	        Promise.resolve().then(function () { return pushManagerFactory; }).then((t) => {
	          if (this.Pu) return;
	          const i = t.default.m();
	          if (
	            null != i &&
	            (yt$1.isPushPermissionGranted() || yt$1.isPushBlocked())
	          ) {
	            const t = () => {
	                i.mn()
	                  ? r$1.info(
	                      "Push token maintenance is disabled, not refreshing token for backend.",
	                    )
	                  : i.subscribe();
	              },
	              s = (i, s) => {
	                s && t();
	              },
	              e = () => {
	                const i = this.u.j(STORAGE_KEYS.C.In);
	                (null == i || i) && t();
	              },
	              h = A.ts.Zt;
	            new A(h, r$1).jr(h.hs.cu, s, e);
	          }
	        });
	  }
	  _u() {
	    this.u.ii(STORAGE_KEYS.C.vi), this.u.ii(STORAGE_KEYS.C.bs), this.u.ii(STORAGE_KEYS.C.Xr);
	  }
	  changeUser(t, i, s) {
	    const e = this.yt.getUserId();
	    if (e !== t) {
	      this.oi.yl(),
	        this._u(),
	        null != e && this.Nu(void 0, !1, void 0, void 0, void 0),
	        this.yt.ou(t),
	        s ? this.Ko.setSdkAuthenticationSignature(s) : this.Ko.xh();
	      for (let t = 0; t < i.length; t++) i[t].changeUser(null == e);
	      null != e && this.u.ii(STORAGE_KEYS.C.J),
	        this.u.ii(STORAGE_KEYS.C.Fa),
	        this.u.ii(STORAGE_KEYS.C.nE),
	        this.u.ii(STORAGE_KEYS.C._E),
	        this.openSession(),
	        r$1.info('Changed user to "' + t + '".');
	    } else {
	      let i = "Doing nothing.";
	      s &&
	        this.Ko.kh() !== s &&
	        (this.Ko.setSdkAuthenticationSignature(s),
	        (i = "Updated SDK authentication signature")),
	        r$1.info(`Current user is already ${t}. ${i}`);
	    }
	  }
	  requestImmediateDataFlush(t) {
	    this.Ou(), this.oi.xo();
	    this.Nu(
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      () => {
	        r$1.error("Failed to flush data, request will be retried automatically.");
	      },
	      t,
	      !0,
	    );
	  }
	  requestFeedRefresh() {
	    this.oi.xo(), this.Nu(!0);
	  }
	  $r(t, i) {
	    this.oi.xo(),
	      r$1.info("Requesting explicit trigger refresh."),
	      this.Nu(void 0, !0, void 0, t, i);
	  }
	  Cn(s, e) {
	    const h = i.Eu,
	      n = { a: s, l: e },
	      u = t$1.q(h, n);
	    return (
	      u && (r$1.info(`Logged alias ${s} with label ${e}`), this.u.I(STORAGE_KEYS.C._E, n)), u
	    );
	  }
	  Fn(i, e, h) {
	    if (this.qt.hu(e))
	      return (
	        r$1.info(`Custom Attribute "${e}" is blocklisted, ignoring.`), new s()
	      );
	    const o = { key: e, value: h },
	      n = t$1.q(i, o);
	    if (n) {
	      const t = "object" == typeof h ? JSON.stringify(h, null, 2) : h;
	      r$1.info(`Logged custom attribute: ${e} with value: ${t}`);
	    }
	    return n;
	  }
	  setLastKnownLocation(s, e, h, o, n, u) {
	    const l = { latitude: e, longitude: h };
	    null != o && (l.altitude = o),
	      null != n && (l.ll_accuracy = n),
	      null != u && (l.alt_accuracy = u);
	    const a = t$1.q(i.Ju, l, s || void 0);
	    return (
	      a &&
	        r$1.info(`Set user last known location as ${JSON.stringify(l, null, 2)}`),
	      a
	    );
	  }
	  kr(t, s) {
	    const e = this.oi.xo();
	    return new ve(this.yt.getUserId(), i.Ku, t, e, { cid: s });
	  }
	  Wu(t, i) {
	    return new A(t, i);
	  }
	  Mn() {
	    const t = A.ts.Zt;
	    this.Wu(t, r$1).setItem(t.hs.Ka, 1, {
	      baseUrl: this.baseUrl,
	      data: { api_key: this.rn, device_id: this.on.ce().id },
	      userId: this.yt.getUserId(),
	      sdkAuthEnabled: this.Ko.Fh(),
	    });
	  }
	  yr(t) {
	    for (const i of t)
	      if (i.api_key === this.rn) this.$t.Zh(i.events, i.attributes);
	      else {
	        const t = A.ts.Zt;
	        new A(t, r$1).setItem(t.hs.wr, p$1.W(), i);
	      }
	  }
	  Gn(e, h, o) {
	    if (this.qt.hu(e))
	      return (
	        r$1.info(`Custom Attribute "${e}" is blocklisted, ignoring.`), new s()
	      );
	    let n, u;
	    return (
	      null === h && null === o
	        ? ((n = i.Gu), (u = { key: e }))
	        : ((n = i.Xu), (u = { key: e, latitude: h, longitude: o })),
	      t$1.q(n, u)
	    );
	  }
	  Hn(s, e) {
	    const h = { group_id: s, status: e };
	    return t$1.q(i.Hu, h);
	  }
	}

	class Jt {
	  constructor(
	    t = 0,
	    i = [],
	    s = [],
	    h = [],
	    e = null,
	    r = null,
	    l = { enabled: !1 },
	    a = { enabled: !1, refresh_rate_limit: void 0 },
	    n = { enabled: !0, capacity: GLOBAL_RATE_LIMIT_CAPACITY_DEFAULT, refill_rate: GLOBAL_RATE_LIMIT_REFILL_RATE_DEFAULT, endpoint_overrides: {} },
	  ) {
	    (this.hl = t),
	      (this.gl = i),
	      (this.fl = s),
	      (this.bl = h),
	      (this.Rl = e),
	      (this.cl = r),
	      (this.ml = l),
	      (this.ai = a),
	      (this.ol = n),
	      (this.hl = t),
	      (this.gl = i),
	      (this.fl = s),
	      (this.bl = h),
	      (this.Rl = e),
	      (this.cl = r),
	      (this.ml = l),
	      (this.ai = a),
	      (this.ol = n);
	  }
	  Y() {
	    return {
	      s: "5.5.0",
	      l: this.hl,
	      e: this.gl,
	      a: this.fl,
	      p: this.bl,
	      m: this.Rl,
	      v: this.cl,
	      c: this.ml,
	      f: this.ai,
	      grl: this.ol,
	    };
	  }
	  static qn(t) {
	    let i = t.l;
	    return (
	      "5.5.0" !== t.s && (i = 0),
	      new Jt(i, t.e, t.a, t.p, t.m, t.v, t.c, t.f, t.grl)
	    );
	  }
	}

	class Dt {
	  constructor(t) {
	    (this.u = t),
	      (this.u = t),
	      (this.tl = new T()),
	      (this.el = new T()),
	      (this.il = new T()),
	      (this.sl = null),
	      (this.rl = null);
	  }
	  ll() {
	    if (null == this.rl) {
	      const t = this.u.j(STORAGE_KEYS.C.ul);
	      this.rl = null != t ? Jt.qn(t) : new Jt();
	    }
	    return this.rl;
	  }
	  hi() {
	    return this.ll().hl;
	  }
	  al(t) {
	    if (null != t && null != t.config) {
	      const e = t.config;
	      if (e.time > this.ll().hl) {
	        const t = (t) => (null == t ? this.ll().ol : t),
	          i = new Jt(
	            e.time,
	            e.events_blacklist,
	            e.attributes_blacklist,
	            e.purchases_blacklist,
	            e.messaging_session_timeout,
	            e.vapid_public_key,
	            e.content_cards,
	            e.feature_flags,
	            t(e.global_request_rate_limit),
	          );
	        let s = !1;
	        null != i.cl && this.Wn() !== i.cl && (s = !0);
	        let r = !1;
	        null != i.ml.enabled && this.ei() !== i.ml.enabled && (r = !0);
	        let n = !1;
	        null != i.ai.enabled && this.mi() !== i.ai.enabled && (n = !0),
	          (this.rl = i),
	          this.u.I(STORAGE_KEYS.C.ul, i.Y()),
	          s && this.tl.Rt(),
	          r && this.el.Rt(),
	          n && this.il.Rt();
	      }
	    }
	  }
	  _n(t) {
	    const e = this.tl.Nt(t);
	    return this.sl && this.tl.removeSubscription(this.sl), (this.sl = e), e;
	  }
	  Ms(t) {
	    return this.el.Nt(t);
	  }
	  bi(t) {
	    return this.il.Nt(t);
	  }
	  me(t) {
	    return -1 !== this.ll().gl.indexOf(t);
	  }
	  hu(t) {
	    return -1 !== this.ll().fl.indexOf(t);
	  }
	  Dr(t) {
	    return -1 !== this.ll().bl.indexOf(t);
	  }
	  dl() {
	    return this.ll().Rl;
	  }
	  Wn() {
	    return this.ll().cl;
	  }
	  ei() {
	    return this.ll().ml.enabled || !1;
	  }
	  Cl() {
	    const t = this.ll().ol;
	    return !(!t || null == t.enabled) && t.enabled;
	  }
	  Cu() {
	    if (!this.Cl()) return -1;
	    const t = this.ll().ol;
	    return null == t.capacity || t.capacity < 10 ? -1 : t.capacity;
	  }
	  Su() {
	    if (!this.Cl()) return -1;
	    const t = this.ll().ol;
	    return null == t.refill_rate || t.refill_rate <= 0 ? -1 : t.refill_rate;
	  }
	  vl(t) {
	    const e = this.ll().ol.endpoint_overrides;
	    return null == e ? null : e[t];
	  }
	  Bu(t) {
	    const e = this.vl(t);
	    return null == e || isNaN(e.capacity) || e.capacity <= 0 ? -1 : e.capacity;
	  }
	  wu(t) {
	    const e = this.vl(t);
	    return null == e || isNaN(e.refill_rate) || e.refill_rate <= 0
	      ? -1
	      : e.refill_rate;
	  }
	  mi() {
	    return this.ll().ai.enabled && null == this.Di()
	      ? (t$1.q(i.Ls, { e: "Missing feature flag refresh_rate_limit." }), !1)
	      : this.ll().ai.enabled || !1;
	  }
	  Di() {
	    return this.ll().ai.refresh_rate_limit;
	  }
	}

	class Mt {
	  constructor(s, t, i, e) {
	    (this.u = s),
	      (this.yt = t),
	      (this.qt = i),
	      (this.wl = e),
	      (this.u = s),
	      (this.yt = t),
	      (this.qt = i),
	      (this.Sl = 1e3),
	      (null == e || isNaN(e)) && (e = 1800),
	      e < this.Sl / 1e3 &&
	        (r$1.info(
	          "Specified session timeout of " +
	            e +
	            "s is too small, using the minimum session timeout of " +
	            this.Sl / 1e3 +
	            "s instead.",
	        ),
	        (e = this.Sl / 1e3)),
	      (this.wl = e);
	  }
	  jl(s, t) {
	    return new ve(this.yt.getUserId(), i.xl, s, t.eu, { d: convertMsToSeconds(s - t.Dl) });
	  }
	  xi() {
	    const s = this.u.tu(STORAGE_KEYS.iu.El);
	    return null == s ? null : s.eu;
	  }
	  Gl() {
	    const s = new Date().valueOf(),
	      t = this.qt.dl(),
	      i = this.u.j(STORAGE_KEYS.C.Nl);
	    if (null != i && null == t) return !1;
	    let e = !1;
	    return (
	      null == i ? (e = !0) : null != t && (e = s - i > 1e3 * t),
	      e && this.u.I(STORAGE_KEYS.C.Nl, s),
	      e
	    );
	  }
	  zl(s, t) {
	    return null == t || null == t.Hl || (!(s - t.Dl < this.Sl) && t.Hl < s);
	  }
	  xo() {
	    const s = new Date().valueOf(),
	      t = s + 1e3 * this.wl,
	      e = this.u.tu(STORAGE_KEYS.iu.El);
	    if (this.zl(s, e)) {
	      let n = "Generating session start event with time " + s;
	      if (null != e) {
	        let s = e.Wl;
	        s - e.Dl < this.Sl && (s = e.Dl + this.Sl),
	          this.u.kl(this.jl(s, e)),
	          (n += " (old session ended " + s + ")");
	      }
	      (n += ". Will expire " + t.valueOf()), r$1.info(n);
	      const l = new _t(p$1.W(), t);
	      this.u.kl(new ve(this.yt.getUserId(), i.ql, s, l.eu)),
	        this.u.uu(STORAGE_KEYS.iu.El, l);
	      return null == this.u.j(STORAGE_KEYS.C.Nl) && this.u.I(STORAGE_KEYS.C.Nl, s), l.eu;
	    }
	    if (null != e) return (e.Wl = s), (e.Hl = t), this.u.uu(STORAGE_KEYS.iu.El, e), e.eu;
	  }
	  yl() {
	    const s = this.u.tu(STORAGE_KEYS.iu.El);
	    null != s &&
	      (this.u.Al(STORAGE_KEYS.iu.El), this.u.kl(this.jl(new Date().valueOf(), s)));
	  }
	}

	const Wt = {
	  Wh: function (e, t = !1) {
	    let a = !1;
	    try {
	      if (localStorage && localStorage.getItem)
	        try {
	          localStorage.setItem(STORAGE_KEYS.C.ec, "true"),
	            localStorage.getItem(STORAGE_KEYS.C.ec) &&
	              (localStorage.removeItem(STORAGE_KEYS.C.ec), (a = !0));
	        } catch (e) {
	          if (
	            !(
	              e instanceof Error &&
	              ("QuotaExceededError" === e.name ||
	                "NS_ERROR_DOM_QUOTA_REACHED" === e.name) &&
	              localStorage.length > 0
	            )
	          )
	            throw e;
	          a = !0;
	        }
	    } catch (e) {
	      r$1.info("Local Storage not supported!");
	    }
	    const n = Wt.oc(),
	      c = new Q.tc(e, n && !t, a);
	    let l;
	    return (l = a ? new Q.rc(e) : new Q.ac()), new Q(c, l);
	  },
	  oc: function () {
	    return (
	      navigator.cookieEnabled ||
	      ("cookie" in document &&
	        (document.cookie.length > 0 ||
	          (document.cookie = "test").indexOf.call(document.cookie, "test") >
	            -1))
	    );
	  },
	};

	class ControlMessage {
	  constructor(t, s) {
	    (this.triggerId = t),
	      (this.messageExtras = s),
	      (this.triggerId = t),
	      (this.messageExtras = s),
	      (this.extras = {}),
	      (this.isControl = !0);
	  }
	  static fromJson(t) {
	    return new ControlMessage(t.trigger_id, t.message_extras);
	  }
	}

	function _isInView(t, n = !1, e = !1, s = !1) {
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
	const DOMUtils = { dc: null, po: _isInView };
	const DIRECTIONS = { Oe: "up", Qe: "down", U: "left", V: "right" };
	function supportsPassive() {
	  if (null == DOMUtils.dc) {
	    DOMUtils.dc = !1;
	    try {
	      const t = Object.defineProperty({}, "passive", {
	        get: () => {
	          DOMUtils.dc = !0;
	        },
	      });
	      window.addEventListener("testPassive", () => {}, t),
	        window.removeEventListener("testPassive", () => {}, t);
	    } catch (t) {
	      r$1.error(getErrorMessage(t));
	    }
	  }
	  return DOMUtils.dc;
	}
	function addPassiveEventListener(t, n, e = () => {}) {
	  t.addEventListener(n, e, !!supportsPassive() && { passive: !0 });
	}
	function topIsInView(t) {
	  return DOMUtils.po(t, !0, !1, !1);
	}
	function bottomIsInView(t) {
	  return DOMUtils.po(t, !1, !0, !1);
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
	  addPassiveEventListener(t, "touchstart", (t) => {
	    (s = t.touches[0].clientX), (i = t.touches[0].clientY);
	  }),
	    addPassiveEventListener(t, "touchmove", (o) => {
	      if (null == s || null == i) return;
	      const l = s - o.touches[0].clientX,
	        u = i - o.touches[0].clientY;
	      Math.abs(l) > Math.abs(u) && Math.abs(l) >= 25
	        ? (((l > 0 && n === DIRECTIONS.U) || (l < 0 && n === DIRECTIONS.V)) &&
	            e(o),
	          (s = null),
	          (i = null))
	        : Math.abs(u) >= 25 &&
	          (((u > 0 &&
	            n === DIRECTIONS.Oe &&
	            t.scrollTop === t.scrollHeight - t.offsetHeight) ||
	            (u < 0 && n === DIRECTIONS.Qe && 0 === t.scrollTop)) &&
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

	const KeyCodes = { Fo: 32, lo: 9, To: 13, mh: 27 };

	const isIFrame = (e) => null !== e && "IFRAME" === e.tagName;

	class InAppMessage {
	  constructor(
	    t,
	    s,
	    i,
	    h,
	    e,
	    E,
	    n,
	    o,
	    r,
	    l,
	    u,
	    a,
	    I,
	    c,
	    A,
	    O,
	    _,
	    m,
	    L,
	    N,
	    S,
	    R,
	    M,
	    D,
	    C,
	    d,
	    U,
	    b,
	    P,
	    p,
	  ) {
	    (this.message = t),
	      (this.messageAlignment = s),
	      (this.slideFrom = i),
	      (this.extras = h),
	      (this.triggerId = e),
	      (this.clickAction = E),
	      (this.uri = n),
	      (this.openTarget = o),
	      (this.dismissType = r),
	      (this.duration = l),
	      (this.icon = u),
	      (this.imageUrl = a),
	      (this.imageStyle = I),
	      (this.iconColor = c),
	      (this.iconBackgroundColor = A),
	      (this.backgroundColor = O),
	      (this.textColor = _),
	      (this.closeButtonColor = m),
	      (this.animateIn = L),
	      (this.animateOut = N),
	      (this.header = S),
	      (this.headerAlignment = R),
	      (this.headerTextColor = M),
	      (this.frameColor = D),
	      (this.buttons = C),
	      (this.cropType = d),
	      (this.orientation = U),
	      (this.htmlId = b),
	      (this.css = P),
	      (this.messageExtras = p),
	      (this.message = t),
	      (this.messageAlignment = s || InAppMessage.TextAlignment.CENTER),
	      (this.duration = l || 5e3),
	      (this.slideFrom = i || InAppMessage.SlideFrom.BOTTOM),
	      (this.extras = h || {}),
	      (this.triggerId = e),
	      (this.clickAction = E || InAppMessage.ClickAction.NONE),
	      (this.uri = n),
	      (this.openTarget = o || InAppMessage.OpenTarget.NONE),
	      (this.dismissType = r || InAppMessage.DismissType.AUTO_DISMISS),
	      (this.icon = u),
	      (this.imageUrl = a),
	      (this.imageStyle = I || InAppMessage.ImageStyle.TOP),
	      (this.iconColor = c || InAppMessage.th.ih),
	      (this.iconBackgroundColor = A || InAppMessage.th.sh),
	      (this.backgroundColor = O || InAppMessage.th.ih),
	      (this.textColor = _ || InAppMessage.th.hh),
	      (this.closeButtonColor = m || InAppMessage.th.eh),
	      (this.animateIn = L),
	      null == this.animateIn && (this.animateIn = !0),
	      (this.animateOut = N),
	      null == this.animateOut && (this.animateOut = !0),
	      (this.header = S),
	      (this.headerAlignment = R || InAppMessage.TextAlignment.CENTER),
	      (this.headerTextColor = M || InAppMessage.th.hh),
	      (this.frameColor = D || InAppMessage.th.Eh),
	      (this.buttons = C || []),
	      (this.cropType = d || InAppMessage.CropType.FIT_CENTER),
	      (this.orientation = U),
	      (this.htmlId = b),
	      (this.css = P),
	      (this.isControl = !1),
	      (this.messageExtras = p),
	      (this.nh = !1),
	      (this.Th = !1),
	      (this.vo = !1),
	      (this.oh = !1),
	      (this.Re = null),
	      (this.ke = null),
	      (this.Et = new T()),
	      (this.rh = new T()),
	      (this.qe = InAppMessage.TextAlignment.CENTER);
	  }
	  subscribeToClickedEvent(t) {
	    return this.Et.Nt(t);
	  }
	  subscribeToDismissedEvent(t) {
	    return this.rh.Nt(t);
	  }
	  removeSubscription(t) {
	    this.Et.removeSubscription(t), this.rh.removeSubscription(t);
	  }
	  removeAllSubscriptions() {
	    this.Et.removeAllSubscriptions(), this.rh.removeAllSubscriptions();
	  }
	  closeMessage() {
	    this.Cr(this.Re);
	  }
	  $e() {
	    return !0;
	  }
	  do() {
	    return this.$e();
	  }
	  Ce() {
	    return null != this.htmlId && this.htmlId.length > 4;
	  }
	  ve() {
	    return this.Ce() && null != this.css && this.css.length > 0;
	  }
	  we() {
	    if (this.Ce() && this.ve()) return this.htmlId + "-css";
	  }
	  K() {
	    return !this.Th && ((this.Th = !0), !0);
	  }
	  Wr() {
	    return this.Th;
	  }
	  p(t) {
	    return !this.vo && ((this.vo = !0), this.Et.Rt(), !0);
	  }
	  N() {
	    return !this.oh && ((this.oh = !0), this.rh.Rt(), !0);
	  }
	  hide(t) {
	    if (t && t.parentNode) {
	      let s = t.closest(".ab-iam-root");
	      if ((null == s && (s = t), this.$e() && null != s.parentNode)) {
	        const t = s.parentNode.classList;
	        t && t.contains(InAppMessage.lh) && t.remove(InAppMessage.lh),
	          document.body.removeEventListener("touchmove", InAppMessage.uh);
	      }
	      s.className = s.className.replace(InAppMessage.ah, InAppMessage.Ih);
	    }
	    return this.animateOut || !1;
	  }
	  Cr(t, s) {
	    if (null == t) return;
	    let i;
	    (this.Re = null),
	      (i =
	        -1 === t.className.indexOf("ab-in-app-message")
	          ? t.getElementsByClassName("ab-in-app-message")[0]
	          : t);
	    let h = !1;
	    i && (h = this.hide(i));
	    const e = document.body;
	    let E;
	    null != e && (E = e.scrollTop);
	    const n = () => {
	      if (t && t.parentNode) {
	        let s = t.closest(".ab-iam-root");
	        null == s && (s = t), s.parentNode && s.parentNode.removeChild(s);
	      }
	      const i = this.we();
	      if (null != i) {
	        const t = document.getElementById(i);
	        t && t.parentNode && t.parentNode.removeChild(t);
	      }
	      null != e && "Safari" === X.browser && (e.scrollTop = E),
	        s ? s() : this.N();
	    };
	    h ? setTimeout(n, InAppMessage.Ah) : n(), this.ke && this.ke.focus();
	  }
	  Ge() {
	    return document.createTextNode(this.message || "");
	  }
	  Ae(t) {
	    let s = "";
	    this.message || this.header || !this.$e() || (s = "Modal Image"),
	      t.setAttribute("alt", s);
	  }
	  static uh(t) {
	    if (t.targetTouches && t.targetTouches.length > 1) return;
	    const s = t.target;
	    (s &&
	      s.classList &&
	      s.classList.contains("ab-message-text") &&
	      s.scrollHeight > s.clientHeight) ||
	      (document.querySelector(`.${InAppMessage.lh}`) &&
	        t.cancelable &&
	        t.preventDefault());
	  }
	  Oh(t) {
	    const s = t.parentNode;
	    this.$e() &&
	      null != s &&
	      this.orientation !== InAppMessage.Orientation.LANDSCAPE &&
	      (null != s.classList && s.classList.add(InAppMessage.lh),
	      document.body.addEventListener(
	        "touchmove",
	        InAppMessage.uh,
	        !!supportsPassive() && { passive: !1 },
	      )),
	      (t.className += " " + InAppMessage.ah);
	  }
	  static _h(t) {
	    if (
	      t.keyCode === KeyCodes.mh &&
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
	            "ab-programmatic-close-button",
	          )[0]),
	          null != t && (clickElement(t), (s = !0));
	      }
	      if (!s) {
	        const t = document.querySelectorAll(
	          ".ab-modal-interactions > .ab-close-button",
	        )[0];
	        null != t && clickElement(t);
	      }
	    }
	  }
	  Nh() {
	    this.nh ||
	      e.nn(L.Lh) ||
	      (document.addEventListener("keydown", InAppMessage._h, !1),
	      e.Sh(() => {
	        document.removeEventListener("keydown", InAppMessage._h);
	      }),
	      (this.nh = !0));
	  }
	  Y(t) {
	    const s = {};
	    return t
	      ? ((s[InAppMessage.tt.Yr] = this.message),
	        (s[InAppMessage.tt.Zr] = this.messageAlignment),
	        (s[InAppMessage.tt.Rh] = this.slideFrom),
	        (s[InAppMessage.tt.bt] = this.extras),
	        (s[InAppMessage.tt.ea] = this.triggerId),
	        (s[InAppMessage.tt.ra] = this.clickAction),
	        (s[InAppMessage.tt.URI] = this.uri),
	        (s[InAppMessage.tt.sa] = this.openTarget),
	        (s[InAppMessage.tt.ta] = this.dismissType),
	        (s[InAppMessage.tt.ia] = this.duration),
	        (s[InAppMessage.tt.aa] = this.icon),
	        (s[InAppMessage.tt.ot] = this.imageUrl),
	        (s[InAppMessage.tt.oa] = this.imageStyle),
	        (s[InAppMessage.tt.pa] = this.iconColor),
	        (s[InAppMessage.tt.ma] = this.iconBackgroundColor),
	        (s[InAppMessage.tt.na] = this.backgroundColor),
	        (s[InAppMessage.tt.ua] = this.textColor),
	        (s[InAppMessage.tt.ca] = this.closeButtonColor),
	        (s[InAppMessage.tt.fa] = this.animateIn),
	        (s[InAppMessage.tt.da] = this.animateOut),
	        (s[InAppMessage.tt.la] = this.header),
	        (s[InAppMessage.tt.ga] = this.headerAlignment),
	        (s[InAppMessage.tt.ja] = this.headerTextColor),
	        (s[InAppMessage.tt.xa] = this.frameColor),
	        (s[InAppMessage.tt.za] = this.buttons),
	        (s[InAppMessage.tt.ha] = this.cropType),
	        (s[InAppMessage.tt.va] = this.orientation),
	        (s[InAppMessage.tt.wa] = this.htmlId),
	        (s[InAppMessage.tt.CSS] = this.css),
	        (s[InAppMessage.tt.Z] = t),
	        (s[InAppMessage.tt.ya] = this.messageExtras),
	        s)
	      : s;
	  }
	}
	(InAppMessage.th = {
	  hh: 4281545523,
	  ih: 4294967295,
	  sh: 4278219733,
	  Mh: 4293914607,
	  Dh: 4283782485,
	  Eh: 3224580915,
	  eh: 4288387995,
	}),
	  (InAppMessage.Le = {
	    Ch: "hd",
	    ze: "ias",
	    dh: "of",
	    Uh: "do",
	    bh: "umt",
	    Ph: "tf",
	    ph: "te",
	  }),
	  (InAppMessage.SlideFrom = { TOP: "TOP", BOTTOM: "BOTTOM" }),
	  (InAppMessage.ClickAction = {
	    NEWS_FEED: "NEWS_FEED",
	    URI: "URI",
	    NONE: "NONE",
	  }),
	  (InAppMessage.DismissType = {
	    AUTO_DISMISS: "AUTO_DISMISS",
	    MANUAL: "SWIPE",
	  }),
	  (InAppMessage.OpenTarget = { NONE: "NONE", BLANK: "BLANK" }),
	  (InAppMessage.ImageStyle = { TOP: "TOP", GRAPHIC: "GRAPHIC" }),
	  (InAppMessage.Orientation = { PORTRAIT: "PORTRAIT", LANDSCAPE: "LANDSCAPE" }),
	  (InAppMessage.TextAlignment = {
	    START: "START",
	    CENTER: "CENTER",
	    END: "END",
	  }),
	  (InAppMessage.CropType = {
	    CENTER_CROP: "CENTER_CROP",
	    FIT_CENTER: "FIT_CENTER",
	  }),
	  (InAppMessage.Be = {
	    Qr: "SLIDEUP",
	    Lr: "MODAL",
	    Ue: "MODAL_STYLED",
	    Hr: "FULL",
	    Kr: "WEB_HTML",
	    Me: "HTML",
	    Ve: "HTML_FULL",
	  }),
	  (InAppMessage.Ah = 500),
	  (InAppMessage.fh = 200),
	  (InAppMessage.ah = "ab-show"),
	  (InAppMessage.Ih = "ab-hide"),
	  (InAppMessage.lh = "ab-pause-scrolling"),
	  (InAppMessage.tt = {
	    Yr: "m",
	    Zr: "ma",
	    Rh: "sf",
	    bt: "e",
	    ea: "ti",
	    ra: "ca",
	    URI: "u",
	    sa: "oa",
	    ta: "dt",
	    ia: "d",
	    aa: "i",
	    ot: "iu",
	    oa: "is",
	    pa: "ic",
	    ma: "ibc",
	    na: "bc",
	    ua: "tc",
	    ca: "cbc",
	    fa: "ai",
	    da: "ao",
	    la: "h",
	    ga: "ha",
	    ja: "htc",
	    xa: "fc",
	    za: "b",
	    ha: "ct",
	    va: "o",
	    wa: "hi",
	    CSS: "css",
	    Z: "type",
	    uo: "messageFields",
	    ya: "me",
	  });

	class HtmlMessage extends InAppMessage {
	  constructor(i, o, e, r, d, t, s, v, n, u, a, c) {
	    super(
	      i,
	      void 0,
	      void 0,
	      o,
	      e,
	      void 0,
	      void 0,
	      void 0,
	      (r = r || InAppMessage.DismissType.MANUAL),
	      d,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      t,
	      s,
	      void 0,
	      void 0,
	      void 0,
	      v,
	      void 0,
	      void 0,
	      void 0,
	      n,
	      u,
	      c,
	    ),
	      (this.messageFields = a),
	      (this.messageFields = a);
	  }
	  do() {
	    return !1;
	  }
	  p(i) {
	    if (this.xe === InAppMessage.Be.Kr) {
	      if (this.vo) return !1;
	      this.vo = !0;
	    }
	    return this.Et.Rt(i), !0;
	  }
	  Y() {
	    const i = super.Y(HtmlMessage.it);
	    return (i[InAppMessage.tt.uo] = this.messageFields), i;
	  }
	  static Jr(i) {
	    return new HtmlMessage(
	      i[InAppMessage.tt.Yr],
	      i[InAppMessage.tt.bt],
	      i[InAppMessage.tt.ea],
	      i[InAppMessage.tt.ta],
	      i[InAppMessage.tt.ia],
	      i[InAppMessage.tt.fa],
	      i[InAppMessage.tt.da],
	      i[InAppMessage.tt.xa],
	      i[InAppMessage.tt.wa],
	      i[InAppMessage.tt.CSS],
	      i[InAppMessage.tt.uo],
	      i[InAppMessage.tt.ya],
	    );
	  }
	}
	HtmlMessage.it = InAppMessage.Be.Kr;

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
	      (this.backgroundColor = t || InAppMessage.th.sh),
	      (this.textColor = i || InAppMessage.th.ih),
	      (this.borderColor = r || this.backgroundColor),
	      (this.clickAction = h || InAppMessage.ClickAction.NONE),
	      (this.uri = e),
	      null == n && (n = InAppMessageButton.Ki),
	      (this.id = n),
	      (this.vo = !1),
	      (this.Et = new T());
	  }
	  subscribeToClickedEvent(s) {
	    return this.Et.Nt(s);
	  }
	  removeSubscription(s) {
	    this.Et.removeSubscription(s);
	  }
	  removeAllSubscriptions() {
	    this.Et.removeAllSubscriptions();
	  }
	  p() {
	    return !this.vo && ((this.vo = !0), this.Et.Rt(), !0);
	  }
	  static fromJson(s) {
	    return new InAppMessageButton(
	      s.text,
	      s.bg_color,
	      s.text_color,
	      s.border_color,
	      s.click_action,
	      s.uri,
	      s.id,
	    );
	  }
	}
	InAppMessageButton.Ki = -1;

	class FullScreenMessage extends InAppMessage {
	  constructor(
	    e,
	    r,
	    s,
	    t,
	    i,
	    a,
	    o,
	    p,
	    m,
	    n,
	    u,
	    c,
	    f,
	    d,
	    l,
	    g,
	    j,
	    x,
	    z,
	    h,
	    v,
	    w,
	    y,
	    S,
	    b,
	    k,
	    q,
	    A,
	    B,
	  ) {
	    (p = p || InAppMessage.DismissType.MANUAL),
	      (k = k || InAppMessage.Orientation.PORTRAIT),
	      super(
	        e,
	        r,
	        void 0,
	        s,
	        t,
	        i,
	        a,
	        o,
	        p,
	        m,
	        n,
	        u,
	        c,
	        f,
	        d,
	        l,
	        g,
	        j,
	        x,
	        z,
	        h,
	        v,
	        w,
	        y,
	        S,
	        (b = b || InAppMessage.CropType.CENTER_CROP),
	        k,
	        q,
	        A,
	        B,
	      ),
	      (this.qe = InAppMessage.TextAlignment.CENTER);
	  }
	  Y() {
	    return super.Y(FullScreenMessage.it);
	  }
	  static Jr(e) {
	    return new FullScreenMessage(
	      e[InAppMessage.tt.Yr],
	      e[InAppMessage.tt.Zr],
	      e[InAppMessage.tt.bt],
	      e[InAppMessage.tt.ea],
	      e[InAppMessage.tt.ra],
	      e[InAppMessage.tt.URI],
	      e[InAppMessage.tt.sa],
	      e[InAppMessage.tt.ta],
	      e[InAppMessage.tt.ia],
	      e[InAppMessage.tt.aa],
	      e[InAppMessage.tt.ot],
	      e[InAppMessage.tt.oa],
	      e[InAppMessage.tt.pa],
	      e[InAppMessage.tt.ma],
	      e[InAppMessage.tt.na],
	      e[InAppMessage.tt.ua],
	      e[InAppMessage.tt.ca],
	      e[InAppMessage.tt.fa],
	      e[InAppMessage.tt.da],
	      e[InAppMessage.tt.la],
	      e[InAppMessage.tt.ga],
	      e[InAppMessage.tt.ja],
	      e[InAppMessage.tt.xa],
	      buttonsFromSerializedInAppMessage(e[InAppMessage.tt.za]),
	      e[InAppMessage.tt.ha],
	      e[InAppMessage.tt.va],
	      e[InAppMessage.tt.wa],
	      e[InAppMessage.tt.CSS],
	      e[InAppMessage.tt.ya],
	    );
	  }
	}
	FullScreenMessage.it = InAppMessage.Be.Hr;

	class ModalMessage extends InAppMessage {
	  constructor(
	    e,
	    r,
	    s,
	    t,
	    i,
	    o,
	    a,
	    p,
	    m,
	    n,
	    u,
	    c,
	    d,
	    f,
	    l,
	    g,
	    j,
	    v,
	    x,
	    z,
	    h,
	    w,
	    y,
	    S,
	    b,
	    k,
	    q,
	    A,
	  ) {
	    super(
	      e,
	      r,
	      void 0,
	      s,
	      t,
	      i,
	      o,
	      a,
	      (p = p || InAppMessage.DismissType.MANUAL),
	      m,
	      n,
	      u,
	      c,
	      d,
	      f,
	      l,
	      g,
	      j,
	      v,
	      x,
	      z,
	      h,
	      w,
	      y,
	      S,
	      (b = b || InAppMessage.CropType.FIT_CENTER),
	      void 0,
	      k,
	      q,
	      A,
	    ),
	      (this.qe = InAppMessage.TextAlignment.CENTER);
	  }
	  Y() {
	    return super.Y(ModalMessage.it);
	  }
	  static Jr(e) {
	    return new ModalMessage(
	      e[InAppMessage.tt.Yr],
	      e[InAppMessage.tt.Zr],
	      e[InAppMessage.tt.bt],
	      e[InAppMessage.tt.ea],
	      e[InAppMessage.tt.ra],
	      e[InAppMessage.tt.URI],
	      e[InAppMessage.tt.sa],
	      e[InAppMessage.tt.ta],
	      e[InAppMessage.tt.ia],
	      e[InAppMessage.tt.aa],
	      e[InAppMessage.tt.ot],
	      e[InAppMessage.tt.oa],
	      e[InAppMessage.tt.pa],
	      e[InAppMessage.tt.ma],
	      e[InAppMessage.tt.na],
	      e[InAppMessage.tt.ua],
	      e[InAppMessage.tt.ca],
	      e[InAppMessage.tt.fa],
	      e[InAppMessage.tt.da],
	      e[InAppMessage.tt.la],
	      e[InAppMessage.tt.ga],
	      e[InAppMessage.tt.ja],
	      e[InAppMessage.tt.xa],
	      buttonsFromSerializedInAppMessage(e[InAppMessage.tt.za]),
	      e[InAppMessage.tt.ha],
	      e[InAppMessage.tt.wa],
	      e[InAppMessage.tt.CSS],
	      e[InAppMessage.tt.ya],
	    );
	  }
	}
	ModalMessage.it = InAppMessage.Be.Lr;

	class SlideUpMessage extends InAppMessage {
	  constructor(
	    e,
	    t,
	    s,
	    o,
	    i,
	    r,
	    n,
	    d,
	    a,
	    u,
	    p,
	    m,
	    c,
	    l,
	    v,
	    x,
	    f,
	    h,
	    g,
	    I,
	    M,
	    b,
	  ) {
	    (x = x || InAppMessage.th.Dh),
	      (v = v || InAppMessage.th.Mh),
	      super(
	        e,
	        (t = t || InAppMessage.TextAlignment.START),
	        s,
	        o,
	        i,
	        r,
	        n,
	        d,
	        a,
	        u,
	        p,
	        m,
	        void 0,
	        c,
	        l,
	        v,
	        x,
	        f,
	        h,
	        g,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        I,
	        M,
	        b,
	      ),
	      (this.qe = InAppMessage.TextAlignment.START);
	  }
	  $e() {
	    return !1;
	  }
	  Ge() {
	    const e = document.createElement("span");
	    return e.appendChild(document.createTextNode(this.message || "")), e;
	  }
	  Oh(e) {
	    const t = e.getElementsByClassName("ab-in-app-message")[0];
	    DOMUtils.po(t, !0, !0) ||
	      (this.slideFrom === InAppMessage.SlideFrom.TOP
	        ? (t.style.top = "0px")
	        : (t.style.bottom = "0px")),
	      super.Oh(e);
	  }
	  Y() {
	    return super.Y(SlideUpMessage.it);
	  }
	  static Jr(e) {
	    return new SlideUpMessage(
	      e[InAppMessage.tt.Yr],
	      e[InAppMessage.tt.Zr],
	      e[InAppMessage.tt.Rh],
	      e[InAppMessage.tt.bt],
	      e[InAppMessage.tt.ea],
	      e[InAppMessage.tt.ra],
	      e[InAppMessage.tt.URI],
	      e[InAppMessage.tt.sa],
	      e[InAppMessage.tt.ta],
	      e[InAppMessage.tt.ia],
	      e[InAppMessage.tt.aa],
	      e[InAppMessage.tt.ot],
	      e[InAppMessage.tt.pa],
	      e[InAppMessage.tt.ma],
	      e[InAppMessage.tt.na],
	      e[InAppMessage.tt.ua],
	      e[InAppMessage.tt.ca],
	      e[InAppMessage.tt.fa],
	      e[InAppMessage.tt.da],
	      e[InAppMessage.tt.wa],
	      e[InAppMessage.tt.CSS],
	      e[InAppMessage.tt.ya],
	    );
	  }
	}
	SlideUpMessage.it = InAppMessage.Be.Qr;

	function newInAppMessageFromJson(e) {
	  if (!e) return null;
	  if (e.is_control) return ControlMessage.fromJson(e);
	  let o = e.type;
	  null != o && (o = o.toUpperCase());
	  const s = e.message,
	    n = e.text_align_message,
	    t = e.slide_from,
	    m = e.extras,
	    l = e.trigger_id,
	    i = e.click_action,
	    f = e.uri,
	    p = e.open_target,
	    u = e.message_close,
	    a = e.duration,
	    d = e.icon,
	    g = e.image_url,
	    c = e.image_style,
	    j = e.icon_color,
	    w = e.icon_bg_color,
	    b = e.bg_color,
	    h = e.text_color,
	    v = e.close_btn_color,
	    x = e.header,
	    I = e.text_align_header,
	    A = e.header_text_color,
	    F = e.frame_color,
	    M = [];
	  let k = e.btns;
	  null == k && (k = []);
	  for (let e = 0; e < k.length; e++) M.push(InAppMessageButton.fromJson(k[e]));
	  const y = e.crop_type,
	    z = e.orientation,
	    J = e.animate_in,
	    S = e.animate_out;
	  let q = e.html_id,
	    B = e.css;
	  (null != q && "" !== q && null != B && "" !== B) ||
	    ((q = void 0), (B = void 0));
	  const C = e.message_extras;
	  let D;
	  if (o === ModalMessage.it || o === InAppMessage.Be.Ue)
	    D = new ModalMessage(
	      s,
	      n,
	      m,
	      l,
	      i,
	      f,
	      p,
	      u,
	      a,
	      d,
	      g,
	      c,
	      j,
	      w,
	      b,
	      h,
	      v,
	      J,
	      S,
	      x,
	      I,
	      A,
	      F,
	      M,
	      y,
	      q,
	      B,
	      C,
	    );
	  else if (o === FullScreenMessage.it)
	    D = new FullScreenMessage(
	      s,
	      n,
	      m,
	      l,
	      i,
	      f,
	      p,
	      u,
	      a,
	      d,
	      g,
	      c,
	      j,
	      w,
	      b,
	      h,
	      v,
	      J,
	      S,
	      x,
	      I,
	      A,
	      F,
	      M,
	      y,
	      z,
	      q,
	      B,
	      C,
	    );
	  else if (o === SlideUpMessage.it)
	    D = new SlideUpMessage(
	      s,
	      n,
	      t,
	      m,
	      l,
	      i,
	      f,
	      p,
	      u,
	      a,
	      d,
	      g,
	      j,
	      w,
	      b,
	      h,
	      v,
	      J,
	      S,
	      q,
	      B,
	      C,
	    );
	  else {
	    if (
	      o !== HtmlMessage.it &&
	      o !== InAppMessage.Be.Me &&
	      o !== InAppMessage.Be.Ve
	    )
	      return void r$1.error("Ignoring message with unknown type " + o);
	    {
	      const o = e.message_fields;
	      (D = new HtmlMessage(s, m, l, u, a, J, S, F, q, B, o, C)),
	        (D.trusted = e.trusted || !1);
	    }
	  }
	  return (D.xe = o), D;
	}
	function buttonsFromSerializedInAppMessage(e) {
	  const o = [];
	  for (const s of e)
	    o.push(
	      new InAppMessageButton(
	        s.text,
	        s.backgroundColor,
	        s.textColor,
	        s.borderColor,
	        s.clickAction,
	        s.uri,
	        s.id,
	      ),
	    );
	  return o;
	}

	class ts {
	  constructor(t) {
	    (this.Bl = t), (this.Bl = t);
	  }
	  Jl(t) {
	    return null == this.Bl || this.Bl === t[0];
	  }
	  static fromJson(t) {
	    return new ts(t ? t.event_name : null);
	  }
	  Y() {
	    return this.Bl;
	  }
	}

	class lr {
	  constructor(t, s, e, i) {
	    (this.Tl = t),
	      (this._l = s),
	      (this.comparator = e),
	      (this.Ll = i),
	      (this.Tl = t),
	      (this._l = s),
	      (this.comparator = e),
	      (this.Ll = i),
	      this._l === lr.Ol.Il &&
	        this.comparator !== lr.Ql.Ul &&
	        this.comparator !== lr.Ql.Xl &&
	        this.comparator !== lr.Ql.Fl &&
	        this.comparator !== lr.Ql.Kl &&
	        (this.Ll = dateFromUnixTimestamp(this.Ll));
	  }
	  Jl(t) {
	    let s = null;
	    switch ((null != t && (s = t[this.Tl]), this.comparator)) {
	      case lr.Ql.Pl:
	        return null != s && s.valueOf() === this.Ll.valueOf();
	      case lr.Ql.Yl:
	        return null == s || s.valueOf() !== this.Ll.valueOf();
	      case lr.Ql.Zl:
	        return null != s && typeof s == typeof this.Ll && s > this.Ll;
	      case lr.Ql.Ul:
	        return this._l === lr.Ol.Il
	          ? null != s && isDate(s) && secondsAgo(s) <= this.Ll.valueOf()
	          : null != s && typeof s == typeof this.Ll && s >= this.Ll;
	      case lr.Ql.$l:
	        return null != s && typeof s == typeof this.Ll && s < this.Ll;
	      case lr.Ql.Xl:
	        return this._l === lr.Ol.Il
	          ? null != s && isDate(s) && secondsAgo(s) >= this.Ll.valueOf()
	          : null != s && typeof s == typeof this.Ll && s <= this.Ll;
	      case lr.Ql.Qu:
	        return (
	          null != s &&
	          "string" == typeof s &&
	          typeof s == typeof this.Ll &&
	          null != s.match(this.Ll)
	        );
	      case lr.Ql.Vu:
	        return null != s;
	      case lr.Ql.Yu:
	        return null == s;
	      case lr.Ql.Fl:
	        return null != s && isDate(s) && secondsInTheFuture(s) < this.Ll;
	      case lr.Ql.Kl:
	        return null != s && isDate(s) && secondsInTheFuture(s) > this.Ll;
	      case lr.Ql.Zu:
	        return (
	          null == s ||
	          typeof s != typeof this.Ll ||
	          "string" != typeof s ||
	          null == s.match(this.Ll)
	        );
	    }
	    return !1;
	  }
	  static fromJson(t) {
	    return new lr(
	      t.property_key,
	      t.property_type,
	      t.comparator,
	      t.property_value,
	    );
	  }
	  Y() {
	    let t = this.Ll;
	    return (
	      isDate(this.Ll) && (t = convertMsToSeconds(t.valueOf())),
	      { k: this.Tl, t: this._l, c: this.comparator, v: t }
	    );
	  }
	  static qn(t) {
	    return new lr(t.k, t.t, t.c, t.v);
	  }
	}
	(lr.Ol = { yE: "boolean", HE: "number", LE: "string", Il: "date" }),
	  (lr.Ql = {
	    Pl: 1,
	    Yl: 2,
	    Zl: 3,
	    Ul: 4,
	    $l: 5,
	    Xl: 6,
	    Qu: 10,
	    Vu: 11,
	    Yu: 12,
	    Fl: 15,
	    Kl: 16,
	    Zu: 17,
	  });

	class is {
	  constructor(t) {
	    (this.filters = t), (this.filters = t);
	  }
	  Jl(t) {
	    let r = !0;
	    for (let e = 0; e < this.filters.length; e++) {
	      const o = this.filters[e];
	      let s = !1;
	      for (let r = 0; r < o.length; r++)
	        if (o[r].Jl(t)) {
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
	      for (let t = 0; t < s.length; t++) o.push(lr.fromJson(s[t]));
	      r.push(o);
	    }
	    return new is(r);
	  }
	  Y() {
	    const t = [];
	    for (let r = 0; r < this.filters.length; r++) {
	      const e = this.filters[r],
	        o = [];
	      for (let t = 0; t < e.length; t++) o.push(e[t].Y());
	      t.push(o);
	    }
	    return t;
	  }
	  static qn(t) {
	    const r = [];
	    for (let e = 0; e < t.length; e++) {
	      const o = [],
	        s = t[e];
	      for (let t = 0; t < s.length; t++) o.push(lr.qn(s[t]));
	      r.push(o);
	    }
	    return new is(r);
	  }
	}

	class rs {
	  constructor(t, s) {
	    (this.Bl = t), (this.Ml = s), (this.Bl = t), (this.Ml = s);
	  }
	  Jl(t) {
	    if (null == this.Bl || null == this.Ml) return !1;
	    const s = t[0],
	      i = t[1];
	    return s === this.Bl && this.Ml.Jl(i);
	  }
	  static fromJson(t) {
	    return new rs(
	      t ? t.event_name : null,
	      t ? is.fromJson(t.property_filters) : null,
	    );
	  }
	  Y() {
	    return { e: this.Bl, pf: this.Ml ? this.Ml.Y() : null };
	  }
	}

	class ni {
	  constructor(t, i) {
	    (this.tf = t), (this.if = i), (this.tf = t), (this.if = i);
	  }
	  Jl(t) {
	    if (null == this.tf) return !1;
	    const i = ri.rf(t[0], this.tf);
	    if (!i) return !1;
	    let r = null == this.if || 0 === this.if.length;
	    if (null != this.if)
	      for (let i = 0; i < this.if.length; i++)
	        if (this.if[i] === t[1]) {
	          r = !0;
	          break;
	        }
	    return i && r;
	  }
	  static fromJson(t) {
	    return new ni(t ? t.id : null, t ? t.buttons : null);
	  }
	  Y() {
	    return this.tf;
	  }
	}

	class ns {
	  constructor(t) {
	    (this.productId = t), (this.productId = t);
	  }
	  Jl(t) {
	    return null == this.productId || t[0] === this.productId;
	  }
	  static fromJson(t) {
	    return new ns(t ? t.product_id : null);
	  }
	  Y() {
	    return this.productId;
	  }
	}

	class hs {
	  constructor(t, s) {
	    (this.productId = t), (this.Ml = s), (this.productId = t), (this.Ml = s);
	  }
	  Jl(t) {
	    if (null == this.productId || null == this.Ml) return !1;
	    const s = t[0],
	      i = t[1];
	    return s === this.productId && this.Ml.Jl(i);
	  }
	  static fromJson(t) {
	    return new hs(
	      t ? t.product_id : null,
	      t ? is.fromJson(t.property_filters) : null,
	    );
	  }
	  Y() {
	    return { id: this.productId, pf: this.Ml ? this.Ml.Y() : null };
	  }
	}

	class ur {
	  constructor(t) {
	    (this.tf = t), (this.tf = t);
	  }
	  Jl(t) {
	    return null == this.tf || ri.rf(t[0], this.tf);
	  }
	  static fromJson(t) {
	    return new ur(t ? t.campaign_id : null);
	  }
	  Y() {
	    return this.tf;
	  }
	}

	var tt = {
	  OPEN: "open",
	  Rr: "purchase",
	  vr: "push_click",
	  ue: "custom_event",
	  Vr: "iam_click",
	  kt: "test",
	};

	class ri {
	  constructor(e, t) {
	    (this.type = e), (this.data = t), (this.type = e), (this.data = t);
	  }
	  sc(e, t) {
	    return ri.cc[this.type] === e && (null == this.data || this.data.Jl(t));
	  }
	  static rf(e, t) {
	    let s = null;
	    try {
	      s = window.atob(e);
	    } catch (t) {
	      return r$1.info("Failed to unencode analytics id " + e + ": " + getErrorMessage(t)), !1;
	    }
	    return t === s.split("_")[0];
	  }
	  static fromJson(e) {
	    const t = e.type;
	    let r = null;
	    switch (t) {
	      case ri.Er.OPEN:
	      case ri.Er.kt:
	        break;
	      case ri.Er.Rr:
	        r = ns.fromJson(e.data);
	        break;
	      case ri.Er.nc:
	        r = hs.fromJson(e.data);
	        break;
	      case ri.Er.vr:
	        r = ur.fromJson(e.data);
	        break;
	      case ri.Er.ue:
	        r = ts.fromJson(e.data);
	        break;
	      case ri.Er.lc:
	        r = rs.fromJson(e.data);
	        break;
	      case ri.Er.Vr:
	        r = ni.fromJson(e.data);
	    }
	    return new ri(t, r);
	  }
	  Y() {
	    return { t: this.type, d: this.data ? this.data.Y() : null };
	  }
	  static qn(e) {
	    let t,
	      r = null;
	    switch (e.t) {
	      case ri.Er.OPEN:
	      case ri.Er.kt:
	        break;
	      case ri.Er.Rr:
	        r = new ns(e.d);
	        break;
	      case ri.Er.nc:
	        (t = e.d || {}), (r = new hs(t.id, is.qn(t.pf || [])));
	        break;
	      case ri.Er.vr:
	        r = new ur(e.d);
	        break;
	      case ri.Er.ue:
	        r = new ts(e.d);
	        break;
	      case ri.Er.lc:
	        (t = e.d || {}), (r = new rs(t.e, is.qn(t.pf || [])));
	        break;
	      case ri.Er.Vr:
	        r = new ni(e.d);
	    }
	    return new ri(e.t, r);
	  }
	}
	(ri.Er = {
	  OPEN: "open",
	  Rr: "purchase",
	  nc: "purchase_property",
	  vr: "push_click",
	  ue: "custom_event",
	  lc: "custom_event_property",
	  Vr: "iam_click",
	  kt: "test",
	}),
	  (ri.cc = {}),
	  (ri.cc[ri.Er.OPEN] = tt.OPEN),
	  (ri.cc[ri.Er.Rr] = tt.Rr),
	  (ri.cc[ri.Er.nc] = tt.Rr),
	  (ri.cc[ri.Er.vr] = tt.vr),
	  (ri.cc[ri.Er.ue] = tt.ue),
	  (ri.cc[ri.Er.lc] = tt.ue),
	  (ri.cc[ri.Er.Vr] = tt.Vr),
	  (ri.cc[ri.Er.kt] = tt.kt);

	class gt {
	  constructor(t, i = [], s, e, r = 0, h, l, o = 0, n = gt.td, a, u, d) {
	    (this.id = t),
	      (this.sd = i),
	      (this.startTime = s),
	      (this.endTime = e),
	      (this.priority = r),
	      (this.type = h),
	      (this.data = l),
	      (this.ed = o),
	      (this.rd = n),
	      (this.Or = a),
	      (this.hd = u),
	      (this.od = d),
	      (this.id = t),
	      (this.sd = i || []),
	      void 0 === s && (s = null),
	      (this.startTime = s),
	      void 0 === e && (e = null),
	      (this.endTime = e),
	      (this.priority = r || 0),
	      (this.type = h),
	      (this.ed = o || 0),
	      null == a && (a = 1e3 * (this.ed + 30)),
	      (this.Or = a),
	      (this.data = l),
	      null != n && (this.rd = n),
	      (this.hd = u),
	      (this.od = d || null);
	  }
	  nd(t) {
	    return (
	      null == this.od || (this.rd !== gt.td && t - this.od >= 1e3 * this.rd)
	    );
	  }
	  ad(t) {
	    this.od = t;
	  }
	  ud(t) {
	    const i = t + 1e3 * this.ed;
	    return Math.max(i - new Date().valueOf(), 0);
	  }
	  dd(t) {
	    const i = new Date().valueOf() - t,
	      s = null == t || isNaN(i) || null == this.Or || i < this.Or;
	    return (
	      s ||
	        r$1.info(
	          `Trigger action ${this.type} is no longer eligible for display - fired ${i}ms ago and has a timeout of ${this.Or}ms.`,
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
	      h = t.priority,
	      o = t.type,
	      n = t.delay,
	      a = t.re_eligibility,
	      u = t.timeout,
	      d = t.data,
	      m = t.min_seconds_since_last_trigger;
	    return validateValueIsFromEnum(
	      gt.Er,
	      o,
	      "Could not construct Trigger from server data",
	      "Trigger.Types",
	    )
	      ? new gt(i, s, e, r, h, o, d, n, a, u, m)
	      : null;
	  }
	  Y() {
	    const t = [];
	    for (let i = 0; i < this.sd.length; i++) t.push(this.sd[i].Y());
	    return {
	      i: this.id,
	      c: t,
	      s: this.startTime,
	      e: this.endTime,
	      p: this.priority,
	      t: this.type,
	      da: this.data,
	      d: this.ed,
	      r: this.rd,
	      tm: this.Or,
	      ss: this.hd,
	      ld: this.od,
	    };
	  }
	  static qn(t) {
	    const i = [],
	      s = t.c || [];
	    for (let t = 0; t < s.length; t++) i.push(ri.qn(s[t]));
	    return new gt(
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
	      t.ld,
	    );
	  }
	}
	(gt.Er = { _r: "inapp", md: "templated_iam" }), (gt.td = -1);

	function attachCSS(n, t, o) {
	  const c = n || document.querySelector("head"),
	    s = `ab-${t}-css-definitions-${"5.5.0".replace(/\./g, "-")}`;
	  if (!c) return;
	  const a = c.ownerDocument || document;
	  if (null == a.getElementById(s)) {
	    const n = a.createElement("style");
	    (n.innerHTML = o || ""), (n.id = s);
	    const t = e.nn(L.bo);
	    null != t && n.setAttribute("nonce", t), c.appendChild(n);
	  }
	}

	function loadFontAwesome() {
	  if (e.nn(L.Mo)) return;
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
	    "body>.ab-feed{position:fixed;top:0;right:0;bottom:0;width:421px;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0}body>.ab-feed .ab-feed-body{position:absolute;top:0;left:0;right:0;border:none;border-left:1px solid #d0d0d0;padding-top:70px;min-height:100%}body>.ab-feed .ab-initial-spinner{float:none}body>.ab-feed .ab-no-cards-message{position:absolute;width:100%;margin-left:-20px;top:40%}.ab-feed{-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-box-shadow:0 1px 7px 1px rgba(66,82,113,.15);-moz-box-shadow:0 1px 7px 1px rgba(66,82,113,.15);box-shadow:0 1px 7px 1px rgba(66,82,113,.15);width:402px;background-color:#eee;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;font-size:13px;line-height:130%;letter-spacing:normal;overflow-y:auto;overflow-x:visible;z-index:9011;-webkit-overflow-scrolling:touch}.ab-feed :focus,.ab-feed:focus{outline:0}.ab-feed .ab-feed-body{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;border:1px solid #d0d0d0;border-top:none;padding:20px 20px 0 20px}.ab-feed.ab-effect-slide{-webkit-transform:translateX(450px);-moz-transform:translateX(450px);-ms-transform:translateX(450px);transform:translateX(450px);-webkit-transition:transform .5s ease-in-out;-moz-transition:transform .5s ease-in-out;-o-transition:transform .5s ease-in-out;transition:transform .5s ease-in-out}.ab-feed.ab-effect-slide.ab-show{-webkit-transform:translateX(0);-moz-transform:translateX(0);-ms-transform:translateX(0);transform:translateX(0)}.ab-feed.ab-effect-slide.ab-hide{-webkit-transform:translateX(450px);-moz-transform:translateX(450px);-ms-transform:translateX(450px);transform:translateX(450px)}.ab-feed .ab-card{position:relative;-webkit-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);-moz-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);box-shadow:0 2px 3px 0 rgba(178,178,178,.5);-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;width:100%;border:1px solid #d0d0d0;margin-bottom:20px;overflow:hidden;background-color:#fff;-webkit-transition:height .4s ease-in-out,margin .4s ease-in-out;-moz-transition:height .4s ease-in-out,margin .4s ease-in-out;-o-transition:height .4s ease-in-out,margin .4s ease-in-out;transition:height .4s ease-in-out,margin .4s ease-in-out}.ab-feed .ab-card .ab-pinned-indicator{position:absolute;right:0;top:0;margin-right:-1px;width:0;height:0;border-style:solid;border-width:0 24px 24px 0;border-color:transparent #1676d0 transparent transparent}.ab-feed .ab-card .ab-pinned-indicator .fa-star{position:absolute;right:-21px;top:2px;font-size:9px;color:#fff}.ab-feed .ab-card.ab-effect-card.ab-hide{-webkit-transition:all .5s ease-in-out;-moz-transition:all .5s ease-in-out;-o-transition:all .5s ease-in-out;transition:all .5s ease-in-out}.ab-feed .ab-card.ab-effect-card.ab-hide.ab-swiped-left{-webkit-transform:translateX(-450px);-moz-transform:translateX(-450px);-ms-transform:translateX(-450px);transform:translateX(-450px)}.ab-feed .ab-card.ab-effect-card.ab-hide.ab-swiped-right{-webkit-transform:translateX(450px);-moz-transform:translateX(450px);-ms-transform:translateX(450px);transform:translateX(450px)}.ab-feed .ab-card.ab-effect-card.ab-hide:not(.ab-swiped-left):not(.ab-swiped-right){opacity:0}.ab-feed .ab-card .ab-close-button{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;background-color:transparent;background-size:15px;border:none;width:15px;min-width:15px;height:15px;cursor:pointer;display:block;font-size:15px;line-height:0;padding-top:15px;padding-right:15px;padding-left:15px;padding-bottom:15px;position:absolute;top:0;z-index:9021;opacity:0;-webkit-transition:.5s;-moz-transition:.5s;-o-transition:.5s;transition:.5s}.ab-feed .ab-card .ab-close-button[dir=rtl]{left:0}.ab-feed .ab-card .ab-close-button[dir=ltr]{right:0}.ab-feed .ab-card .ab-close-button svg{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;fill:#9b9b9b;height:auto;width:100%}.ab-feed .ab-card .ab-close-button svg.ab-chevron{display:none}.ab-feed .ab-card .ab-close-button:active{background-color:transparent}.ab-feed .ab-card .ab-close-button:focus{background-color:transparent}.ab-feed .ab-card .ab-close-button:hover{background-color:transparent}.ab-feed .ab-card .ab-close-button:hover svg{fill-opacity:.8}.ab-feed .ab-card .ab-close-button:hover{opacity:1}.ab-feed .ab-card .ab-close-button:focus{opacity:1}.ab-feed .ab-card a{float:none;color:inherit;text-decoration:none}.ab-feed .ab-card a:hover{text-decoration:underline}.ab-feed .ab-card .ab-image-area{float:none;display:inline-block;vertical-align:top;line-height:0;overflow:hidden;width:100%;-webkit-box-sizing:initial;-moz-box-sizing:initial;box-sizing:initial}.ab-feed .ab-card .ab-image-area img{float:none;height:auto;width:100%}.ab-feed .ab-card.ab-image-only .ab-card-body{display:none}.ab-feed .ab-card .ab-card-body{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:inline-block;width:100%;position:relative}.ab-feed .ab-card .ab-unread-indicator{position:absolute;bottom:0;margin-right:-1px;width:100%;height:5px;background-color:#1676d0}.ab-feed .ab-card .ab-unread-indicator.read{background-color:transparent}.ab-feed .ab-card .ab-title{float:none;letter-spacing:0;margin:0;font-weight:700;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;display:block;overflow:hidden;word-wrap:break-word;text-overflow:ellipsis;font-size:18px;line-height:130%;padding:20px 25px 0 25px}.ab-feed .ab-card .ab-description{float:none;color:#545454;padding:15px 25px 20px 25px;word-wrap:break-word;white-space:pre-wrap}.ab-feed .ab-card .ab-description.ab-no-title{padding-top:20px}.ab-feed .ab-card .ab-url-area{float:none;color:#1676d0;margin-top:12px;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif}.ab-feed .ab-card.ab-classic-card .ab-card-body{min-height:40px;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px}.ab-feed .ab-card.ab-classic-card.with-image .ab-card-body{min-height:100px}.ab-feed .ab-card.ab-classic-card.with-image .ab-card-body[dir=ltr]{padding-left:72px}.ab-feed .ab-card.ab-classic-card.with-image .ab-card-body[dir=rtl]{padding-right:72px}.ab-feed .ab-card.ab-classic-card.with-image .ab-image-area{width:60px;height:60px;padding:20px 0 25px 25px;position:absolute}.ab-feed .ab-card.ab-classic-card.with-image .ab-image-area[dir=rtl]{padding:20px 25px 25px 0}.ab-feed .ab-card.ab-classic-card.with-image .ab-image-area img{-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;max-width:100%;max-height:100%;width:auto;height:auto}.ab-feed .ab-card.ab-classic-card.with-image .ab-title{background-color:transparent;font-size:16px}.ab-feed .ab-card.ab-classic-card.with-image .ab-description{padding-top:10px}.ab-feed .ab-card.ab-control-card{height:0;width:0;margin:0;border:0}.ab-feed .ab-feed-buttons-wrapper{float:none;position:relative;background-color:#282828;height:50px;-webkit-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);-moz-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);box-shadow:0 2px 3px 0 rgba(178,178,178,.5);z-index:1}.ab-feed .ab-feed-buttons-wrapper .ab-close-button,.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button{float:none;cursor:pointer;color:#fff;font-size:18px;padding:16px;-webkit-transition:.2s;-moz-transition:.2s;-o-transition:.2s;transition:.2s}.ab-feed .ab-feed-buttons-wrapper .ab-close-button:hover,.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button:hover{font-size:22px}.ab-feed .ab-feed-buttons-wrapper .ab-close-button{float:right}.ab-feed .ab-feed-buttons-wrapper .ab-close-button:hover{padding-top:12px;padding-right:14px}.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button{padding-left:17px}.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button:hover{padding-top:13px;padding-left:14px}.ab-feed .ab-no-cards-message{text-align:center;margin-bottom:20px}@media (max-width:600px){body>.ab-feed{width:100%}}",
	  );
	}
	function setupFeedUI() {
	  attachFeedCSS(), loadFontAwesome();
	}

	function attachInAppMessageCSS(t) {
	  attachCSS(
	    t,
	    "iam",
	    ".ab-pause-scrolling,body.ab-pause-scrolling,html.ab-pause-scrolling{overflow:hidden;touch-action:none}.ab-iam-root.v3{position:fixed;top:0;right:0;bottom:0;left:0;pointer-events:none;z-index:9011;-webkit-tap-highlight-color:transparent}.ab-iam-root.v3:focus{outline:0}.ab-iam-root.v3.ab-effect-fullscreen,.ab-iam-root.v3.ab-effect-html,.ab-iam-root.v3.ab-effect-modal{opacity:0}.ab-iam-root.v3.ab-effect-fullscreen.ab-show,.ab-iam-root.v3.ab-effect-html.ab-show,.ab-iam-root.v3.ab-effect-modal.ab-show{opacity:1}.ab-iam-root.v3.ab-effect-fullscreen.ab-show.ab-animate-in,.ab-iam-root.v3.ab-effect-html.ab-show.ab-animate-in,.ab-iam-root.v3.ab-effect-modal.ab-show.ab-animate-in{-webkit-transition:opacity .5s;-moz-transition:opacity .5s;-o-transition:opacity .5s;transition:opacity .5s}.ab-iam-root.v3.ab-effect-fullscreen.ab-hide,.ab-iam-root.v3.ab-effect-html.ab-hide,.ab-iam-root.v3.ab-effect-modal.ab-hide{opacity:0}.ab-iam-root.v3.ab-effect-fullscreen.ab-hide.ab-animate-out,.ab-iam-root.v3.ab-effect-html.ab-hide.ab-animate-out,.ab-iam-root.v3.ab-effect-modal.ab-hide.ab-animate-out{-webkit-transition:opacity .5s;-moz-transition:opacity .5s;-o-transition:opacity .5s;transition:opacity .5s}.ab-iam-root.v3.ab-effect-slide .ab-in-app-message{-webkit-transform:translateX(535px);-moz-transform:translateX(535px);-ms-transform:translateX(535px);transform:translateX(535px)}.ab-iam-root.v3.ab-effect-slide.ab-show .ab-in-app-message{-webkit-transform:translateX(0);-moz-transform:translateX(0);-ms-transform:translateX(0);transform:translateX(0)}.ab-iam-root.v3.ab-effect-slide.ab-show.ab-animate-in .ab-in-app-message{-webkit-transition:transform .5s ease-in-out;-moz-transition:transform .5s ease-in-out;-o-transition:transform .5s ease-in-out;transition:transform .5s ease-in-out}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message{-webkit-transform:translateX(535px);-moz-transform:translateX(535px);-ms-transform:translateX(535px);transform:translateX(535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message.ab-swiped-left{-webkit-transform:translateX(-535px);-moz-transform:translateX(-535px);-ms-transform:translateX(-535px);transform:translateX(-535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message.ab-swiped-up{-webkit-transform:translateY(-535px);-moz-transform:translateY(-535px);-ms-transform:translateY(-535px);transform:translateY(-535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message.ab-swiped-down{-webkit-transform:translateY(535px);-moz-transform:translateY(535px);-ms-transform:translateY(535px);transform:translateY(535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide.ab-animate-out .ab-in-app-message{-webkit-transition:transform .5s ease-in-out;-moz-transition:transform .5s ease-in-out;-o-transition:transform .5s ease-in-out;transition:transform .5s ease-in-out}.ab-iam-root.v3 .ab-ios-scroll-wrapper{position:fixed;top:0;right:0;bottom:0;left:0;overflow:auto;pointer-events:all;touch-action:auto;-webkit-overflow-scrolling:touch}.ab-iam-root.v3 .ab-in-app-message{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:fixed;text-align:center;-webkit-box-shadow:0 0 4px rgba(0,0,0,.3);-moz-box-shadow:0 0 4px rgba(0,0,0,.3);box-shadow:0 0 4px rgba(0,0,0,.3);line-height:normal;letter-spacing:normal;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;z-index:9011;max-width:100%;overflow:hidden;display:inline-block;pointer-events:all;color:#333;color-scheme:normal}.ab-iam-root.v3 .ab-in-app-message.ab-no-shadow{-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none}.ab-iam-root.v3 .ab-in-app-message :focus,.ab-iam-root.v3 .ab-in-app-message:focus{outline:0}.ab-iam-root.v3 .ab-in-app-message.ab-clickable{cursor:pointer}.ab-iam-root.v3 .ab-in-app-message.ab-background{background-color:#fff}.ab-iam-root.v3 .ab-in-app-message .ab-close-button{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;background-color:transparent;background-size:15px;border:none;width:15px;min-width:15px;height:15px;cursor:pointer;display:block;font-size:15px;line-height:0;padding-top:15px;padding-right:15px;padding-left:15px;padding-bottom:15px;position:absolute;top:0;z-index:9021}.ab-iam-root.v3 .ab-in-app-message .ab-close-button[dir=rtl]{left:0}.ab-iam-root.v3 .ab-in-app-message .ab-close-button[dir=ltr]{right:0}.ab-iam-root.v3 .ab-in-app-message .ab-close-button svg{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;fill:#9b9b9b;height:auto;width:100%}.ab-iam-root.v3 .ab-in-app-message .ab-close-button svg.ab-chevron{display:none}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:active{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:focus{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:hover{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:hover svg{fill-opacity:.8}.ab-iam-root.v3 .ab-in-app-message .ab-message-text{float:none;line-height:1.5;margin:20px 25px;max-width:100%;overflow:hidden;overflow-y:auto;vertical-align:text-bottom;word-wrap:break-word;white-space:pre-wrap;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif}.ab-iam-root.v3 .ab-in-app-message .ab-message-text.start-aligned{text-align:start}.ab-iam-root.v3 .ab-in-app-message .ab-message-text.end-aligned{text-align:end}.ab-iam-root.v3 .ab-in-app-message .ab-message-text.center-aligned{text-align:center}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar{-webkit-appearance:none;width:14px}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar-thumb{-webkit-appearance:none;border:4px solid transparent;background-clip:padding-box;-webkit-border-radius:7px;-moz-border-radius:7px;border-radius:7px;background-color:rgba(0,0,0,.2)}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar-button{width:0;height:0;display:none}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar-corner{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-message-header{float:none;letter-spacing:0;margin:0;font-weight:700;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;display:block;font-size:20px;margin-bottom:10px;line-height:1.3}.ab-iam-root.v3 .ab-in-app-message .ab-message-header.start-aligned{text-align:start}.ab-iam-root.v3 .ab-in-app-message .ab-message-header.end-aligned{text-align:end}.ab-iam-root.v3 .ab-in-app-message .ab-message-header.center-aligned{text-align:center}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen,.ab-iam-root.v3 .ab-in-app-message.ab-modal,.ab-iam-root.v3 .ab-in-app-message.ab-slideup{-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;cursor:pointer;overflow:hidden;word-wrap:break-word;text-overflow:ellipsis;font-size:14px;font-weight:700;margin:20px;margin-top:calc(constant(safe-area-inset-top,0) + 20px);margin-right:calc(constant(safe-area-inset-right,0) + 20px);margin-bottom:calc(constant(safe-area-inset-bottom,0) + 20px);margin-left:calc(constant(safe-area-inset-left,0) + 20px);margin-top:calc(env(safe-area-inset-top,0) + 20px);margin-right:calc(env(safe-area-inset-right,0) + 20px);margin-bottom:calc(env(safe-area-inset-bottom,0) + 20px);margin-left:calc(env(safe-area-inset-left,0) + 20px);max-height:150px;padding:10px;right:0;background-color:#efefef}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone{max-height:66px;margin:10px;margin-top:calc(constant(safe-area-inset-top,0) + 10px);margin-right:calc(constant(safe-area-inset-right,0) + 10px);margin-bottom:calc(constant(safe-area-inset-bottom,0) + 10px);margin-left:calc(constant(safe-area-inset-left,0) + 10px);margin-top:calc(env(safe-area-inset-top,0) + 10px);margin-right:calc(env(safe-area-inset-right,0) + 10px);margin-bottom:calc(env(safe-area-inset-bottom,0) + 10px);margin-left:calc(env(safe-area-inset-left,0) + 10px);max-width:90%;max-width:calc(100% - 40px);min-width:90%;min-width:calc(100% - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-close-button{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-close-button svg:not(.ab-chevron){display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone.ab-clickable .ab-close-button{display:block;height:20px;padding:0 20px 0 18px;pointer-events:none;top:50%;-webkit-transform:translateY(-50%);-moz-transform:translateY(-50%);-ms-transform:translateY(-50%);transform:translateY(-50%);width:12px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone.ab-clickable .ab-close-button svg.ab-chevron{display:inline}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone.ab-clickable .ab-message-text{border-right-width:40px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text{max-width:100%;border-right-width:10px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text span{max-height:66px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text.ab-with-icon,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text.ab-with-image{max-width:80%;max-width:calc(100% - 50px - 5px - 10px - 25px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-image-area{width:50px;height:50px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-image-area img{max-width:100%;max-height:100%;width:auto;height:auto}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:active .ab-message-text,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:focus .ab-message-text,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:hover .ab-message-text{opacity:.8}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:active .ab-close-button svg.ab-chevron,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:focus .ab-close-button svg.ab-chevron,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:hover .ab-close-button svg.ab-chevron{fill-opacity:.8}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:table-cell;border-color:transparent;border-style:solid;border-width:5px 25px 5px 10px;max-width:430px;vertical-align:middle;margin:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text[dir=rtl]{border-width:5px 10px 5px 25px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text span{display:block;max-height:150px;overflow:auto}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-icon,.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-image{max-width:365px;border-top:0;border-bottom:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;background-color:transparent;background-size:15px;border:none;width:15px;min-width:15px;height:15px;cursor:pointer;display:block;font-size:15px;line-height:0;padding-top:15px;padding-right:15px;padding-left:15px;padding-bottom:15px;position:absolute;top:0;z-index:9021}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button[dir=rtl]{left:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button[dir=ltr]{right:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button svg{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;fill:#9b9b9b;height:auto;width:100%}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button svg.ab-chevron{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:active{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:focus{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:hover{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:hover svg{fill-opacity:.8}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area{float:none;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:table-cell;border-color:transparent;border-style:solid;border-width:5px 0 5px 5px;vertical-align:top;width:60px;margin:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area.ab-icon-area{width:auto}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area img{float:none;width:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen,.ab-iam-root.v3 .ab-in-app-message.ab-modal{font-size:14px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area{float:none;position:relative;display:block;overflow:hidden}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area .ab-center-cropped-img,.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area .ab-center-cropped-img{background-size:cover;background-repeat:no-repeat;background-position:50% 50%;position:absolute;top:0;right:0;bottom:0;left:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-icon,.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-icon{margin-top:20px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic{padding:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-message-text,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-message-text{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-message-buttons,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-message-buttons{bottom:0;left:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area{float:none;height:auto;margin:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-image-area img,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area img{display:block;top:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none}.ab-iam-root.v3 .ab-in-app-message.ab-modal{padding-top:20px;width:450px;max-width:450px;max-height:720px}.ab-iam-root.v3 .ab-in-app-message.ab-modal.simulate-phone{max-width:91%;max-width:calc(100% - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal.simulate-phone.graphic .ab-image-area img{max-width:91vw;max-width:calc(100vw - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text{max-height:660px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-image{max-height:524.82758621px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-icon{max-height:610px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-buttons{margin-bottom:93px;max-height:587px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-buttons.ab-with-image{max-height:451.82758621px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-buttons.ab-with-icon{max-height:537px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area{margin-top:-20px;max-height:155.17241379px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area img{max-width:100%;max-height:155.17241379px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area.ab-icon-area{height:auto}.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic{width:auto;overflow:hidden}.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area{display:inline}.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area img{width:auto;max-height:720px;max-width:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen{width:450px;max-height:720px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape{width:720px;max-height:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape .ab-image-area{height:225px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape.graphic .ab-image-area{height:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape .ab-message-text{max-height:112px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-message-text{max-height:247px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-message-text.ab-with-buttons{margin-bottom:93px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area{height:360px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-image-area{height:720px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone{-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone:not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone:not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-html-message{background-color:transparent;border:none;height:100%;overflow:auto;position:relative;touch-action:auto;width:100%}.ab-iam-root.v3 .ab-in-app-message .ab-message-buttons{position:absolute;bottom:0;width:100%;padding:17px 25px 30px 25px;z-index:inherit;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.ab-iam-root.v3 .ab-in-app-message .ab-message-button{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-border-radius:5px;-moz-border-radius:5px;border-radius:5px;-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none;cursor:pointer;display:inline-block;font-size:14px;font-weight:700;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;height:44px;line-height:normal;letter-spacing:normal;margin:0;max-width:100%;min-width:80px;padding:0 12px;position:relative;text-transform:none;width:48%;width:calc(50% - 5px);border:1px solid #1b78cf;-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;overflow:hidden;word-wrap:break-word;text-overflow:ellipsis;word-wrap:normal;white-space:nowrap}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:first-of-type{float:left;background-color:#fff;color:#1b78cf}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:last-of-type{float:right;background-color:#1b78cf;color:#fff}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:first-of-type:last-of-type{float:none;width:auto}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:after{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:hover{opacity:.8}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:active:after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.08)}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:focus:after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.15)}.ab-iam-root.v3 .ab-in-app-message .ab-message-button a{color:inherit;text-decoration:inherit}.ab-iam-root.v3 .ab-in-app-message img{float:none;display:inline-block}.ab-iam-root.v3 .ab-in-app-message .ab-icon{float:none;display:inline-block;padding:10px;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px}.ab-iam-root.v3 .ab-in-app-message .ab-icon .fa{float:none;font-size:30px;width:30px}.ab-iam-root.v3 .ab-start-hidden{visibility:hidden}.ab-iam-root.v3 .ab-centered{margin:auto;position:absolute;top:50%;left:50%;-webkit-transform:translate(-50%,-50%);-moz-transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);transform:translate(-50%,-50%)}.ab-iam-root.v3{-webkit-border-radius:0;-moz-border-radius:0;border-radius:0}.ab-iam-root.v3 .ab-page-blocker{position:fixed;top:0;left:0;width:100%;height:100%;z-index:9001;pointer-events:all;background-color:rgba(51,51,51,.75)}@media (max-width:600px){.ab-iam-root.v3 .ab-in-app-message.ab-slideup{max-height:66px;margin:10px;margin-top:calc(constant(safe-area-inset-top,0) + 10px);margin-right:calc(constant(safe-area-inset-right,0) + 10px);margin-bottom:calc(constant(safe-area-inset-bottom,0) + 10px);margin-left:calc(constant(safe-area-inset-left,0) + 10px);margin-top:calc(env(safe-area-inset-top,0) + 10px);margin-right:calc(env(safe-area-inset-right,0) + 10px);margin-bottom:calc(env(safe-area-inset-bottom,0) + 10px);margin-left:calc(env(safe-area-inset-left,0) + 10px);max-width:90%;max-width:calc(100% - 40px);min-width:90%;min-width:calc(100% - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button svg:not(.ab-chevron){display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable .ab-close-button{display:block;height:20px;padding:0 20px 0 18px;pointer-events:none;top:50%;-webkit-transform:translateY(-50%);-moz-transform:translateY(-50%);-ms-transform:translateY(-50%);transform:translateY(-50%);width:12px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable .ab-close-button svg.ab-chevron{display:inline}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable .ab-message-text{border-right-width:40px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text{max-width:100%;border-right-width:10px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text span{max-height:66px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-icon,.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-image{max-width:80%;max-width:calc(100% - 50px - 5px - 10px - 25px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area{width:50px;height:50px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area img{max-width:100%;max-height:100%;width:auto;height:auto}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape{-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-close-button,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen .ab-image-area,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-image-area,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen .ab-message-text,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen .ab-message-text.ab-with-buttons,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-message-text.ab-with-buttons,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape:not(.graphic),.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen:not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape:not(.graphic) .ab-message-buttons,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen:not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.graphic,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.graphic{display:block}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.graphic .ab-image-area,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.graphic .ab-message-button,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}@media (max-width:480px){.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop){max-width:91%;max-width:calc(100% - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop).graphic .ab-image-area img{max-width:91vw;max-width:calc(100vw - 30px)}}@media (max-height:750px){.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop){max-height:91%;max-height:calc(100% - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop).graphic .ab-image-area img{max-height:91vh;max-height:calc(100vh - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text{max-height:65vh;max-height:calc(100vh - 30px - 60px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-image{max-height:45vh;max-height:calc(100vh - 30px - 155.17241379310346px - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-icon{max-height:45vh;max-height:calc(100vh - 30px - 70px - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-buttons{max-height:50vh;max-height:calc(100vh - 30px - 93px - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-buttons.ab-with-image{max-height:30vh;max-height:calc(100vh - 30px - 155.17241379310346px - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-buttons.ab-with-icon{max-height:30vh;max-height:calc(100vh - 30px - 70px - 93px - 20px)}}@media (min-width:601px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area img{max-height:100%;max-width:100%}}@media (max-height:750px) and (min-width:601px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop){-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important;width:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop) .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop) .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop) .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop):not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop):not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}@media (max-height:480px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop){-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}@media (max-width:750px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop){-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}",
	  );
	}
	function setupInAppMessageUI() {
	  attachInAppMessageCSS(), loadFontAwesome();
	}

	function me(e) {
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

	function createCloseButton(t, o, e, n = "ltr") {
	  const r = document.createElement("button");
	  r.setAttribute("aria-label", t),
	    r.setAttribute("tabindex", "0"),
	    r.setAttribute("role", "button"),
	    (r.dir = n),
	    addPassiveEventListener(r, "touchstart"),
	    (r.className = "ab-close-button");
	  const l = buildSvg(
	    "0 0 15 15",
	    "M15 1.5L13.5 0l-6 6-6-6L0 1.5l6 6-6 6L1.5 15l6-6 6 6 1.5-1.5-6-6 6-6z",
	    o,
	  );
	  return (
	    r.appendChild(l),
	    r.addEventListener("keydown", (t) => {
	      (t.keyCode !== KeyCodes.Fo && t.keyCode !== KeyCodes.To) ||
	        (e(), t.stopPropagation());
	    }),
	    (r.onclick = (t) => {
	      e(), t.stopPropagation();
	    }),
	    r
	  );
	}

	function isTransparent(r) {
	  return (
	    null != r &&
	    ((r = parseInt(r.toString())), !isNaN(r) && (4278190080 & r) >>> 24 == 0)
	  );
	}
	function toRgba(r, n) {
	  if (null == r) return "";
	  if (((r = parseInt(r.toString())), isNaN(r))) return "";
	  (n && !isNaN(parseFloat(n.toString()))) || (n = 1);
	  return (
	    "rgba(" +
	    [
	      (16711680 & (r >>>= 0)) >>> 16,
	      (65280 & r) >>> 8,
	      255 & r,
	      (((4278190080 & r) >>> 24) / 255) * n,
	    ].join(",") +
	    ")"
	  );
	}

	function logInAppMessageImpression(o) {
	  if (!e.X()) return !1;
	  if (!(o instanceof InAppMessage || o instanceof ControlMessage))
	    return r$1.error(MUST_BE_IN_APP_MESSAGE_WARNING), !1;
	  const s = o instanceof ControlMessage ? i.mo : i.Xi;
	  return se$1.m().q(o, s).L;
	}

	function logInAppMessageClick(o) {
	  if (!e.X()) return !1;
	  if (!(o instanceof InAppMessage)) return r$1.error(MUST_BE_IN_APP_MESSAGE_WARNING), !1;
	  const s = se$1.m().q(o, i.$i);
	  if (s) {
	    o.Wr() || logInAppMessageImpression(o);
	    for (let r = 0; r < s.ge.length; r++)
	      TriggersProviderFactory.rr().fe(tt.Vr, [o.triggerId], s.ge[r]);
	  }
	  return s.L;
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
	  const n = window;
	  if ("screen" in n) {
	    let e =
	      n.screen.orientation || screen.mozOrientation || screen.msOrientation;
	    return (
	      null != e && "object" == typeof e && (e = e.type),
	      "landscape-primary" === e || "landscape-secondary" === e
	        ? ORIENTATION.LANDSCAPE
	        : ORIENTATION.PORTRAIT
	    );
	  }
	  return ORIENTATION.PORTRAIT;
	}
	function _openUri(n, e, t) {
	  n && (e || (null != t && t.metaKey) ? window.open(n) : (window.location = n));
	}
	function _getCurrentUrl() {
	  return window.location.href;
	}
	const WindowUtils = {
	  openUri: _openUri,
	  fo: _isPhone,
	  co: _getOrientation,
	  Zo: _getCurrentUrl,
	};

	function getUser() {
	  if (e.X()) return e.pr();
	}

	function _handleBrazeAction(o, s, t) {
	  if (e.X())
	    if (BRAZE_ACTION_URI_REGEX.test(o)) {
	      const s = getDecodedBrazeAction(o);
	      if (!s) return;
	      const t = (o) => {
	        if (!isValidBrazeActionJson(o))
	          return void r$1.error(
	            `Decoded Braze Action json is invalid: ${JSON.stringify(
              o,
              null,
              2,
            )}`,
	          );
	        const s = BRAZE_ACTIONS.properties.type,
	          i = BRAZE_ACTIONS.properties.oo,
	          n = BRAZE_ACTIONS.properties.eo,
	          a = o[s];
	        if (a === BRAZE_ACTIONS.types.ro) {
	          const e = o[i];
	          for (const o of e) t(o);
	        } else {
	          const s = o[n];
	          let t, i;
	          switch (a) {
	            case BRAZE_ACTIONS.types.logCustomEvent:
	              Promise.resolve().then(function () { return logCustomEvent$1; }).then(
	                ({ logCustomEvent: logCustomEvent }) => {
	                  e.so()
	                    ? ((i = Array.prototype.slice.call(s)),
	                      logCustomEvent(...i))
	                    : r$1.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
	                },
	              );
	              break;
	            case BRAZE_ACTIONS.types.requestPushPermission:
	              Promise.resolve().then(function () { return requestPushPermission$1; }).then(
	                ({ requestPushPermission: requestPushPermission }) => {
	                  e.so()
	                    ? "Safari" === X.browser && X.OS === OperatingSystems.io
	                      ? window.navigator.standalone && requestPushPermission()
	                      : requestPushPermission()
	                    : r$1.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
	                },
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
	            case BRAZE_ACTIONS.types.no:
	            case BRAZE_ACTIONS.types.ao:
	              (i = Array.prototype.slice.call(s)), WindowUtils.openUri(...i);
	              break;
	            default:
	              r$1.info(`Ignoring unknown Braze Action: ${a}`);
	          }
	        }
	      };
	      t(s);
	    } else WindowUtils.openUri(o, s, t);
	}
	function handleBrazeAction(o, e) {
	  _handleBrazeAction(o, e);
	}

	function parseQueryStringKeyValues(t) {
	  null == t && (t = "");
	  const r = t.split("?").slice(1).join("?"),
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

	function logInAppMessageHtmlClick(t, s, o) {
	  if (!e.X()) return !1;
	  if (!(t instanceof HtmlMessage))
	    return (
	      r$1.error(
	        "inAppMessage argument to logInAppMessageHtmlClick must be an HtmlMessage object.",
	      ),
	      !1
	    );
	  let m = i.$i;
	  null != s && (m = i.Oi);
	  const n = se$1.m().q(t, m, s, o);
	  if (n.L)
	    for (let e = 0; e < n.ge.length; e++)
	      TriggersProviderFactory.rr().fe(tt.Vr, [t.triggerId, s], n.ge[e]);
	  return n.L;
	}

	const buildHtmlClickHandler = (t, r, e, o) => {
	  const s = e.getAttribute("href"),
	    n = e.onclick;
	  return (i) => {
	    if (null != n && "function" == typeof n && !1 === n.bind(e)(i)) return;
	    let u = parseQueryStringKeyValues(s).abButtonId;
	    if (
	      ((null != u && "" !== u) || (u = e.getAttribute("id") || void 0),
	      null != s && "" !== s && 0 !== s.indexOf("#"))
	    ) {
	      const n =
	          "blank" ===
	          (e.getAttribute("target") || "").toLowerCase().replace("_", ""),
	        c = o || t.openTarget === InAppMessage.OpenTarget.BLANK || n,
	        a = () => {
	          logInAppMessageHtmlClick(t, u, s), WindowUtils.openUri(s, c, i);
	        };
	      c ? a() : t.Cr(r, a);
	    } else logInAppMessageHtmlClick(t, u, s || void 0);
	    return i.stopPropagation(), !1;
	  };
	};
	const applyNonceToDynamicallyCreatedTags = (t, r, e) => {
	  const o = `([\\w]+)\\s*=\\s*document.createElement\\(['"]${e}['"]\\)`,
	    s = t.match(new RegExp(o));
	  if (s) {
	    const e = `${s[1]}.setAttribute("nonce", "${r}")`;
	    return `${t.slice(0, s.index + s[0].length)};${e};${t.slice(
      s.index + s[0].length,
    )}`;
	  }
	  return null;
	};
	const buildBrazeBridge = (t, o, s) => {
	  const n = {
	      closeMessage: function () {
	        t.Cr(o);
	      },
	      logClick: function () {
	        logInAppMessageHtmlClick(t, ...arguments);
	      },
	      display: {},
	      web: {},
	    },
	    requestPushPermission = function () {
	      return function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return requestPushPermission$1; }).then((o) => {
	          e.so()
	            ? o.requestPushPermission(...Array.prototype.slice.call(t))
	            : r$1.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
	        });
	      };
	    },
	    i = {
	      requestImmediateDataFlush: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return requestImmediateDataFlush$1; }).then(
	          ({ requestImmediateDataFlush: requestImmediateDataFlush }) => {
	            e.so()
	              ? requestImmediateDataFlush(...Array.prototype.slice.call(t))
	              : r$1.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
	          },
	        );
	      },
	      logCustomEvent: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return logCustomEvent$1; }).then(
	          ({ logCustomEvent: logCustomEvent }) => {
	            if (!e.so()) return void r$1.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
	            logCustomEvent(...Array.prototype.slice.call(t));
	          },
	        );
	      },
	      logPurchase: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return logPurchase$1; }).then(
	          ({ logPurchase: logPurchase }) => {
	            if (!e.so()) return void r$1.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
	            logPurchase(...Array.prototype.slice.call(t));
	          },
	        );
	      },
	      unregisterPush: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return unregisterPush$1; }).then(
	          ({ unregisterPush: unregisterPush }) => {
	            e.so()
	              ? unregisterPush(...Array.prototype.slice.call(t))
	              : r$1.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
	          },
	        );
	      },
	      requestPushPermission: requestPushPermission(),
	      changeUser: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return changeUser$1; }).then(
	          ({ changeUser: changeUser }) => {
	            if (!e.so()) return void r$1.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
	            changeUser(...Array.prototype.slice.call(t));
	          },
	        );
	      },
	    },
	    u = function (t) {
	      return function () {
	        i[t](...Array.prototype.slice.call(arguments));
	      };
	    };
	  for (const t of keys(i)) n[t] = u(t);
	  const c = [
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
	      "removeFromSubscriptionGroup",
	    ],
	    a = function (t) {
	      return function () {
	        const r = getUser();
	        r && r[t](...Array.prototype.slice.call(arguments));
	      };
	    },
	    m = {};
	  for (let t = 0; t < c.length; t++) m[c[t]] = a(c[t]);
	  n.getUser = function () {
	    return m;
	  };
	  const l = { showFeed: s },
	    f = function (r) {
	      return function () {
	        const e = arguments;
	        t.Cr(o, function () {
	          l[r](...Array.prototype.slice.call(e));
	        });
	      };
	    },
	    p = n.display;
	  for (const t of keys(l)) p[t] = f(t);
	  const d = { registerAppboyPushMessages: requestPushPermission() },
	    g = function (t) {
	      return function () {
	        d[t](...Array.prototype.slice.call(arguments));
	      };
	    },
	    h = n.web;
	  for (const t of keys(d)) h[t] = g(t);
	  return n;
	};

	function dt(t, e, n, o, s, l) {
	  const c = document.createElement("iframe");
	  c.setAttribute("title", "Modal Message"),
	    s && (c.style.zIndex = (s + 1).toString());
	  let r = null;
	  if (null != l) {
	    (r = document.createElement("html")), (r.innerHTML = t.message || "");
	    const e = r.getElementsByTagName("style");
	    for (let t = 0; t < e.length; t++) e[t].setAttribute("nonce", l);
	    const n = r.getElementsByTagName("script");
	    for (let t = 0; t < n.length; t++) {
	      n[t].setAttribute("nonce", l),
	        (n[t].innerHTML = n[t].innerHTML.replace(
	          /<style>/g,
	          `<style nonce='${l}'>`,
	        ));
	      const e = applyNonceToDynamicallyCreatedTags(n[t].innerHTML, l, "script");
	      e && (n[t].innerHTML = e);
	      const o = applyNonceToDynamicallyCreatedTags(n[t].innerHTML, l, "style");
	      o && (n[t].innerHTML = o);
	    }
	  }
	  if (
	    ((c.srcdoc = r ? r.innerHTML : t.message || ""),
	    (c.onload = () => {
	      const s = c.contentWindow;
	      s.focus();
	      const r = s.document.getElementsByTagName("head")[0];
	      if (null != r) {
	        if (t.ve()) {
	          const e = document.createElement("style");
	          (e.innerHTML = t.css || ""),
	            (e.id = t.we() || ""),
	            null != l && e.setAttribute("nonce", l),
	            r.appendChild(e);
	        }
	        const e = s.document.createElement("base");
	        null != e && (e.setAttribute("target", "_parent"), r.appendChild(e));
	      }
	      const i = s.document.getElementsByTagName("title");
	      i && i.length > 0 && c.setAttribute("title", i[0].textContent || "");
	      const a = buildBrazeBridge(t, c, e);
	      if (
	        ((s.appboyBridge = a), (s.brazeBridge = a), t.xe !== InAppMessage.Be.Me)
	      ) {
	        const e = s.document.getElementsByTagName("a");
	        for (let n = 0; n < e.length; n++) e[n].onclick = buildHtmlClickHandler(t, c, e[n], o);
	        const n = s.document.getElementsByTagName("button");
	        for (let e = 0; e < n.length; e++) n[e].onclick = buildHtmlClickHandler(t, c, n[e], o);
	      }
	      const d = s.document.body;
	      if (null != d) {
	        t.Ce() && (d.id = t.htmlId || "");
	        const e = document.createElement("hidden");
	        (e.onclick = a.closeMessage),
	          (e.className = "ab-programmatic-close-button"),
	          d.appendChild(e);
	      }
	      s.dispatchEvent(new CustomEvent("ab.BridgeReady")),
	        -1 !== c.className.indexOf("ab-start-hidden") &&
	          ((c.className = c.className.replace("ab-start-hidden", "")), n(c));
	    }),
	    (c.className =
	      "ab-in-app-message ab-start-hidden ab-html-message ab-modal-interactions"),
	    X.OS === OperatingSystems.io)
	  ) {
	    const e = document.createElement("div");
	    return (
	      (e.className = "ab-ios-scroll-wrapper"), e.appendChild(c), (t.Re = e), e
	    );
	  }
	  return (t.Re = c), c;
	}

	function logInAppMessageButtonClick(o, t) {
	  var s;
	  if (!e.X()) return !1;
	  if (!(o instanceof InAppMessageButton))
	    return r$1.error("button must be an InAppMessageButton object"), !1;
	  if (!(t instanceof InAppMessage)) return r$1.error(MUST_BE_IN_APP_MESSAGE_WARNING), !1;
	  const n = se$1.m().Ji(o, t);
	  if (n.L)
	    for (let r = 0; r < n.ge.length; r++)
	      TriggersProviderFactory.rr().fe(
	        tt.Vr,
	        [
	          t.triggerId,
	          null === (s = o.id) || void 0 === s ? void 0 : s.toString(),
	        ],
	        n.ge[r],
	      );
	  return n.L;
	}

	const le = {
	  Je: (t) => {
	    const o = t.querySelectorAll(
	      ".ab-close-button, .ab-message-text, .ab-message-button",
	    );
	    let e;
	    for (let t = 0; t < o.length; t++) (e = o[t]), (e.tabIndex = 0);
	    if (o.length > 0) {
	      const e = o[0],
	        s = o[o.length - 1];
	      t.addEventListener("keydown", (o) => {
	        const a = document.activeElement;
	        o.keyCode === KeyCodes.lo &&
	          (o.shiftKey || (a !== s && a !== t)
	            ? !o.shiftKey ||
	              (a !== e && a !== t) ||
	              (o.preventDefault(), s.focus())
	            : (o.preventDefault(), e.focus()));
	      });
	    }
	  },
	  Ke: (t, o) => {
	    o.setAttribute("role", "dialog"),
	      o.setAttribute("aria-modal", "true"),
	      o.setAttribute("aria-label", "Modal Message"),
	      t && o.setAttribute("aria-labelledby", t);
	  },
	  He: (t, o, e, s) => {
	    if (t.buttons && t.buttons.length > 0) {
	      const a = document.createElement("div");
	      (a.className = "ab-message-buttons"), e.appendChild(a);
	      const l = e.getElementsByClassName("ab-message-text")[0];
	      null != l && (l.className += " ab-with-buttons");
	      const n = (a) => (l) => (
	        t.Cr(e, () => {
	          logInAppMessageButtonClick(a, t),
	            a.clickAction === InAppMessage.ClickAction.URI
	              ? _handleBrazeAction(
	                  a.uri || "",
	                  s || t.openTarget === InAppMessage.OpenTarget.BLANK,
	                  l,
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
	          t.ve() ||
	            ((s.style.backgroundColor = toRgba(e.backgroundColor)),
	            (s.style.color = toRgba(e.textColor)),
	            (s.style.borderColor = toRgba(e.borderColor))),
	          (s.onclick = n(e)),
	          a.appendChild(s);
	      }
	    }
	  },
	};

	function ce(e, o, a, t, n, s, i, l = document.body, b = "ltr") {
	  if (((e.ke = document.activeElement), e instanceof HtmlMessage))
	    return dt(e, o, a, n, s, i);
	  const g = (function (e, o, a, t, n, s, i = document.body, m = "ltr") {
	    let l = null;
	    const c = document.createElement("div");
	    (c.dir = m),
	      (c.className = "ab-in-app-message ab-start-hidden ab-background"),
	      s && (c.style.zIndex = (s + 1).toString()),
	      e.$e() &&
	        ((c.className += " ab-modal-interactions"),
	        c.setAttribute("tabindex", "-1")),
	      e.ve() ||
	        ((c.style.color = toRgba(e.textColor)),
	        (c.style.backgroundColor = toRgba(e.backgroundColor)),
	        isTransparent(e.backgroundColor) && (c.className += " ab-no-shadow"));
	    const b = () => {
	        -1 !== c.className.indexOf("ab-start-hidden") &&
	          ((c.className = c.className.replace("ab-start-hidden", "")),
	          document.querySelectorAll(".ab-iam-img-loading").length > 0
	            ? t(
	                `Cannot show in-app message ${e.message} because another message is being shown.`,
	                InAppMessage.Le.ze,
	              )
	            : a(c));
	      },
	      g = (o = !0) => {
	        let a = document.querySelectorAll(".ab-iam-root");
	        (a && 0 !== a.length) || (a = i.querySelectorAll(".ab-iam-root")),
	          a &&
	            a.length > 0 &&
	            (a[0].classList.remove("ab-iam-img-loading"),
	            l && (clearTimeout(l), (l = null)),
	            o
	              ? b()
	              : r$1.error(
	                  `Cannot show in-app message ${e.message} because the image failed to load.`,
	                ));
	      };
	    e.imageStyle === InAppMessage.ImageStyle.GRAPHIC &&
	      (c.className += " graphic"),
	      e.orientation === InAppMessage.Orientation.LANDSCAPE &&
	        (c.className += " landscape"),
	      null != e.buttons &&
	        0 === e.buttons.length &&
	        (e.clickAction !== InAppMessage.ClickAction.NONE &&
	          (c.className += " ab-clickable"),
	        (c.onclick = (a) => (
	          e.Cr(c, () => {
	            logInAppMessageClick(e),
	              e.clickAction === InAppMessage.ClickAction.URI
	                ? _handleBrazeAction(
	                    e.uri || "",
	                    n || e.openTarget === InAppMessage.OpenTarget.BLANK,
	                    a,
	                  )
	                : e.clickAction === InAppMessage.ClickAction.NEWS_FEED && o();
	          }),
	          a.stopPropagation(),
	          !1
	        )));
	    const f = createCloseButton(
	      "Close Message",
	      e.ve() ? void 0 : toRgba(e.closeButtonColor),
	      () => {
	        e.Cr(c);
	      },
	      m,
	    );
	    c.appendChild(f), s && (f.style.zIndex = (s + 2).toString());
	    const h = document.createElement("div");
	    (h.className = "ab-message-text"), (h.dir = m);
	    const j = (e.messageAlignment || e.qe).toLowerCase();
	    h.className += " " + j + "-aligned";
	    let w = !1;
	    const v = document.createElement("div");
	    if (((v.className = "ab-image-area"), e.imageUrl)) {
	      if (e.cropType === InAppMessage.CropType.CENTER_CROP) {
	        const o = document.createElement("span");
	        (o.className = "ab-center-cropped-img"),
	          (o.style.backgroundImage = "url(" + e.imageUrl + ")"),
	          o.setAttribute("role", "img"),
	          o.setAttribute("aria-label", "Modal Image"),
	          e.Ae(o),
	          v.appendChild(o);
	      } else {
	        const o = document.createElement("img");
	        if (
	          (o.setAttribute("src", e.imageUrl),
	          e.Ae(o),
	          0 === document.querySelectorAll(".ab-iam-img-loading").length)
	        ) {
	          w = !0;
	          const e = document.querySelectorAll(".ab-iam-root");
	          e && e.length > 0 && e[0].classList.add("ab-iam-img-loading"),
	            (l = window.setTimeout(() => {
	              g(!1);
	            }, 6e4)),
	            (o.onload = () => {
	              g();
	            }),
	            (o.onerror = () => {
	              g(!1);
	            });
	        }
	        v.appendChild(o);
	      }
	      c.appendChild(v), (h.className += " ab-with-image");
	    } else if (e.icon) {
	      v.className += " ab-icon-area";
	      const o = document.createElement("span");
	      (o.className = "ab-icon"),
	        e.ve() ||
	          ((o.style.backgroundColor = toRgba(e.iconBackgroundColor)),
	          (o.style.color = toRgba(e.iconColor)));
	      const a = document.createElement("i");
	      (a.className = "fa"),
	        a.appendChild(document.createTextNode(e.icon)),
	        a.setAttribute("aria-hidden", "true"),
	        o.appendChild(a),
	        v.appendChild(o),
	        c.appendChild(v),
	        (h.className += " ab-with-icon");
	    }
	    if ((addPassiveEventListener(h, "touchstart"), e.header && e.header.length > 0)) {
	      const o = document.createElement("h1");
	      (o.className = "ab-message-header"), (e.De = p$1.W()), (o.id = e.De);
	      const a = (
	        e.headerAlignment || InAppMessage.TextAlignment.CENTER
	      ).toLowerCase();
	      (o.className += " " + a + "-aligned"),
	        e.ve() || (o.style.color = toRgba(e.headerTextColor)),
	        o.appendChild(document.createTextNode(e.header)),
	        h.appendChild(o);
	    }
	    return h.appendChild(e.Ge()), c.appendChild(h), w || b(), (e.Re = c), c;
	  })(e, o, a, t, n, s, l, b);
	  if (e instanceof FullScreenMessage || e instanceof ModalMessage) {
	    const a = e instanceof FullScreenMessage ? "ab-fullscreen" : "ab-modal";
	    (g.className += ` ${a} ab-centered`),
	      le.He(e, o, g, n),
	      le.Je(g),
	      le.Ke(e.De, g);
	  } else if (e instanceof SlideUpMessage) {
	    g.className += " ab-slideup";
	    const o = g.getElementsByClassName("ab-close-button")[0];
	    if (null != o) {
	      const a = buildSvg(
	        "0 0 11.38 19.44",
	        "M11.38 9.72l-9.33 9.72L0 17.3l7.27-7.58L0 2.14 2.05 0l9.33 9.72z",
	        e.ve() ? void 0 : toRgba(e.closeButtonColor),
	      );
	      a.setAttribute("class", "ab-chevron"), o.appendChild(a);
	    }
	    let a, t;
	    detectSwipe(g, DIRECTIONS.U, (e) => {
	      (g.className += " ab-swiped-left"),
	        null != o && null != o.onclick && o.onclick(e);
	    }),
	      detectSwipe(g, DIRECTIONS.V, (e) => {
	        (g.className += " ab-swiped-right"),
	          null != o && null != o.onclick && o.onclick(e);
	      }),
	      e.slideFrom === InAppMessage.SlideFrom.TOP
	        ? ((a = DIRECTIONS.Oe), (t = " ab-swiped-up"))
	        : ((a = DIRECTIONS.Qe), (t = " ab-swiped-down")),
	      detectSwipe(g, a, (e) => {
	        (g.className += t), null != o && null != o.onclick && o.onclick(e);
	      });
	  }
	  return g;
	}

	var xt = {
	  en: {
	    NO_CARDS_MESSAGE:
	      "We have no updates for you at this time.<br/>Please check again later.",
	    FEED_TIMEOUT_MESSAGE:
	      "Sorry, this refresh timed out.<br/>Please try again later.",
	  },
	  ar: {
	    NO_CARDS_MESSAGE: "ليس لدينا أي تحديث. يرجى التحقق مرة أخرى لاحقاً",
	    FEED_TIMEOUT_MESSAGE: "يرجى تكرار المحاولة لاحقا",
	  },
	  cs: {
	    NO_CARDS_MESSAGE:
	      "V tuto chvíli pro vás nemáme žádné aktualizace.<br/>Zkontrolujte prosím znovu později.",
	    FEED_TIMEOUT_MESSAGE: "Prosím zkuste to znovu později.",
	  },
	  da: {
	    NO_CARDS_MESSAGE: "Vi har ingen updates.<br/>Prøv venligst senere.",
	    FEED_TIMEOUT_MESSAGE: "Prøv venligst senere.",
	  },
	  de: {
	    NO_CARDS_MESSAGE:
	      "Derzeit sind keine Updates verfügbar.<br/>Bitte später noch einmal versuchen.",
	    FEED_TIMEOUT_MESSAGE: "Bitte später noch einmal versuchen.",
	  },
	  es: {
	    NO_CARDS_MESSAGE:
	      "No tenemos actualizaciones.<br/>Por favor compruébelo más tarde.",
	    FEED_TIMEOUT_MESSAGE: "Por favor inténtelo más tarde.",
	  },
	  "es-mx": {
	    NO_CARDS_MESSAGE:
	      "No tenemos ninguna actualización.<br/>Vuelva a verificar más tarde.",
	    FEED_TIMEOUT_MESSAGE: "Por favor, vuelva a intentarlo más tarde.",
	  },
	  et: {
	    NO_CARDS_MESSAGE:
	      "Uuendusi pole praegu saadaval.<br/>Proovige hiljem uuesti.",
	    FEED_TIMEOUT_MESSAGE: "Palun proovige hiljem uuesti.",
	  },
	  fi: {
	    NO_CARDS_MESSAGE:
	      "Päivityksiä ei ole saatavilla.<br/>Tarkista myöhemmin uudelleen.",
	    FEED_TIMEOUT_MESSAGE: "Yritä myöhemmin uudelleen.",
	  },
	  fr: {
	    NO_CARDS_MESSAGE:
	      "Aucune mise à jour disponible.<br/>Veuillez vérifier ultérieurement.",
	    FEED_TIMEOUT_MESSAGE: "Veuillez réessayer ultérieurement.",
	  },
	  he: {
	    NO_CARDS_MESSAGE: ".אין לנו עדכונים. בבקשה בדוק שוב בקרוב",
	    FEED_TIMEOUT_MESSAGE: ".בבקשה נסה שוב בקרוב",
	  },
	  hi: {
	    NO_CARDS_MESSAGE:
	      "हमारे पास कोई अपडेट नहीं हैं। कृपया बाद में फिर से जाँच करें.।",
	    FEED_TIMEOUT_MESSAGE: "कृपया बाद में दोबारा प्रयास करें।.",
	  },
	  id: {
	    NO_CARDS_MESSAGE: "Kami tidak memiliki pembaruan. Coba lagi nanti.",
	    FEED_TIMEOUT_MESSAGE: "Coba lagi nanti.",
	  },
	  it: {
	    NO_CARDS_MESSAGE: "Non ci sono aggiornamenti.<br/>Ricontrollare più tardi.",
	    FEED_TIMEOUT_MESSAGE: "Riprovare più tardi.",
	  },
	  ja: {
	    NO_CARDS_MESSAGE:
	      "アップデートはありません。<br/>後でもう一度確認してください。",
	    FEED_TIMEOUT_MESSAGE: "後でもう一度試してください。",
	  },
	  ko: {
	    NO_CARDS_MESSAGE: "업데이트가 없습니다. 다음에 다시 확인해 주십시오.",
	    FEED_TIMEOUT_MESSAGE: "나중에 다시 시도해 주십시오.",
	  },
	  ms: {
	    NO_CARDS_MESSAGE: "Tiada kemas kini. Sila periksa kemudian.",
	    FEED_TIMEOUT_MESSAGE: "Sila cuba kemudian.",
	  },
	  nl: {
	    NO_CARDS_MESSAGE: "Er zijn geen updates.<br/>Probeer het later opnieuw.",
	    FEED_TIMEOUT_MESSAGE: "Probeer het later opnieuw.",
	  },
	  no: {
	    NO_CARDS_MESSAGE:
	      "Vi har ingen oppdateringer.<br/>Vennligst sjekk igjen senere.",
	    FEED_TIMEOUT_MESSAGE: "Vennligst prøv igjen senere.",
	  },
	  pl: {
	    NO_CARDS_MESSAGE:
	      "Brak aktualizacji.<br/>Proszę sprawdzić ponownie później.",
	    FEED_TIMEOUT_MESSAGE: "Proszę spróbować ponownie później.",
	  },
	  pt: {
	    NO_CARDS_MESSAGE:
	      "Não temos atualizações.<br/>Por favor, verifique mais tarde.",
	    FEED_TIMEOUT_MESSAGE: "Por favor, tente mais tarde.",
	  },
	  "pt-br": {
	    NO_CARDS_MESSAGE:
	      "Não temos nenhuma atualização.<br/>Verifique novamente mais tarde.",
	    FEED_TIMEOUT_MESSAGE: "Tente novamente mais tarde.",
	  },
	  ru: {
	    NO_CARDS_MESSAGE:
	      "Обновления недоступны.<br/>Пожалуйста, проверьте снова позже.",
	    FEED_TIMEOUT_MESSAGE: "Пожалуйста, повторите попытку позже.",
	  },
	  sv: {
	    NO_CARDS_MESSAGE: "Det finns inga uppdateringar.<br/>Försök igen senare.",
	    FEED_TIMEOUT_MESSAGE: "Försök igen senare.",
	  },
	  th: {
	    NO_CARDS_MESSAGE: "เราไม่มีการอัพเดต กรุณาตรวจสอบภายหลัง.",
	    FEED_TIMEOUT_MESSAGE: "กรุณาลองใหม่ภายหลัง.",
	  },
	  uk: {
	    NO_CARDS_MESSAGE:
	      "Оновлення недоступні.<br/>ласка, перевірте знову пізніше.",
	    FEED_TIMEOUT_MESSAGE: "Будь ласка, спробуйте ще раз пізніше.",
	  },
	  vi: {
	    NO_CARDS_MESSAGE:
	      "Chúng tôi không có cập nhật nào.<br/>Vui lòng kiểm tra lại sau.",
	    FEED_TIMEOUT_MESSAGE: "Vui lòng thử lại sau.",
	  },
	  "zh-hk": {
	    NO_CARDS_MESSAGE: "暫時沒有更新.<br/>請稍候再試.",
	    FEED_TIMEOUT_MESSAGE: "請稍候再試.",
	  },
	  "zh-hans": {
	    NO_CARDS_MESSAGE: "暂时没有更新.<br/>请稍后再试.",
	    FEED_TIMEOUT_MESSAGE: "请稍候再试.",
	  },
	  "zh-hant": {
	    NO_CARDS_MESSAGE: "暫時沒有更新.<br/>請稍候再試.",
	    FEED_TIMEOUT_MESSAGE: "請稍候再試.",
	  },
	  "zh-tw": {
	    NO_CARDS_MESSAGE: "暫時沒有更新.<br/>請稍候再試.",
	    FEED_TIMEOUT_MESSAGE: "請稍候再試.",
	  },
	  zh: {
	    NO_CARDS_MESSAGE: "暂时没有更新.<br/>请稍后再试.",
	    FEED_TIMEOUT_MESSAGE: "请稍候再试.",
	  },
	};

	class nr {
	  constructor(t, e = !1) {
	    if (
	      ((this.language = t),
	      null != t && (t = t.toLowerCase()),
	      null != t && null == xt[t])
	    ) {
	      const e = t.indexOf("-");
	      e > 0 && (t = t.substring(0, e));
	    }
	    if (null == xt[t]) {
	      const a =
	        "Braze does not yet have a localization for language " +
	        t +
	        ", defaulting to English. Please contact us if you are willing and able to help us translate our SDK into this language.";
	      e ? r$1.error(a) : r$1.info(a), (t = "en");
	    }
	    this.language = t;
	  }
	  get(t) {
	    return xt[this.language][t];
	  }
	  wo() {
	    switch (this.language) {
	      case "ar":
	      case "he":
	      case "fa":
	        return "rtl";
	      default:
	        return "ltr";
	    }
	  }
	}

	const ue = {
	  t: !1,
	  i: null,
	  m: () => {
	    if ((ue.o(), !ue.i)) {
	      let r = X.language,
	        t = !1;
	      e.nn(L.zn) && ((r = e.nn(L.zn)), (t = !0)), (ue.i = new nr(r, t));
	    }
	    return ue.i;
	  },
	  o: () => {
	    ue.t || (e.g(ue), (ue.t = !0));
	  },
	  destroy: () => {
	    (ue.i = null), (ue.t = !1);
	  },
	};

	function showInAppMessage(t, o, s) {
	  if (!e.X()) return;
	  if ((setupInAppMessageUI(), null == t)) return !1;
	  if (t instanceof ControlMessage)
	    return (
	      r$1.info(
	        "User received control for a multivariate test, logging to Braze servers.",
	      ),
	      logInAppMessageImpression(t),
	      !0
	    );
	  if (!(t instanceof InAppMessage)) return !1;
	  if (t.constructor === InAppMessage) return !1;
	  t.Nh();
	  const i = t instanceof HtmlMessage;
	  if (i && !t.trusted && !e.tr())
	    return (
	      r$1.error(
	        'HTML in-app messages are disabled. Use the "allowUserSuppliedJavascript" option for braze.initialize to enable these messages.',
	      ),
	      !1
	    );
	  if ((null == o && (o = document.body), t.$e())) {
	    if (o.querySelectorAll(".ab-modal-interactions").length > 0)
	      return (
	        r$1.info(
	          `Cannot show in-app message ${t.message} because another message is being shown.`,
	        ),
	        !1
	      );
	  }
	  if (WindowUtils.fo()) {
	    const e = WindowUtils.co();
	    if (
	      (e === ORIENTATION.PORTRAIT &&
	        t.orientation === InAppMessage.Orientation.LANDSCAPE) ||
	      (e === ORIENTATION.LANDSCAPE &&
	        t.orientation === InAppMessage.Orientation.PORTRAIT)
	    ) {
	      const o = e === ORIENTATION.PORTRAIT ? "portrait" : "landscape",
	        s =
	          t.orientation === InAppMessage.Orientation.PORTRAIT
	            ? "portrait"
	            : "landscape";
	      return (
	        r$1.info(
	          `Not showing ${s} in-app message ${t.message} because the screen is currently ${o}`,
	        ),
	        !1
	      );
	    }
	  }
	  if (!e.tr()) {
	    let e = !1;
	    if (t.buttons && t.buttons.length > 0) {
	      const o = t.buttons;
	      for (let t = 0; t < o.length; t++)
	        if (o[t].clickAction === InAppMessage.ClickAction.URI) {
	          const s = o[t].uri;
	          e = isURIJavascriptOrData(s);
	        }
	    } else t.clickAction === InAppMessage.ClickAction.URI && (e = isURIJavascriptOrData(t.uri));
	    if (e)
	      return (
	        r$1.error(
	          'Javascript click actions are disabled. Use the "allowUserSuppliedJavascript" option for braze.initialize to enable these actions.',
	        ),
	        !1
	      );
	  }
	  const n = document.createElement("div");
	  if (
	    ((n.className = "ab-iam-root v3"),
	    (n.className += me(t)),
	    n.setAttribute("role", "complementary"),
	    t.Ce() && (n.id = t.htmlId),
	    e.nn(L.jo) && (n.style.zIndex = (e.nn(L.jo) + 1).toString()),
	    o.appendChild(n),
	    t.ve())
	  ) {
	    const o = document.createElement("style");
	    (o.innerHTML = t.css),
	      (o.id = t.we()),
	      null != e.nn(L.bo) && o.setAttribute("nonce", e.nn(L.bo)),
	      document.getElementsByTagName("head")[0].appendChild(o);
	  }
	  const a = t instanceof SlideUpMessage,
	    l = ce(
	      t,
	      () => {
	        Promise.resolve().then(function () { return showFeed$1; }).then((t) => {
	          e.so() ? t.showFeed() : r$1.error(BRAZE_MUST_BE_INITIALIZED_ERROR);
	        });
	      },
	      (o) => {
	        if (t.$e() && t.do()) {
	          const s = document.createElement("div");
	          if (
	            ((s.className = "ab-page-blocker"),
	            t.ve() || (s.style.backgroundColor = toRgba(t.frameColor)),
	            e.nn(L.jo) && (s.style.zIndex = e.nn(L.jo).toString()),
	            n.appendChild(s),
	            !e.nn(L.Lh))
	          ) {
	            const e = new Date().valueOf();
	            s.onclick = (s) => {
	              new Date().valueOf() - e > InAppMessage.fh &&
	                (t.Cr(o), s.stopPropagation());
	            };
	          }
	          n.appendChild(o), o.focus(), t.Oh(n);
	        } else if (a) {
	          const e = document.querySelectorAll(".ab-slideup");
	          let s = null;
	          for (let t = e.length - 1; t >= 0; t--)
	            if (e[t] !== o) {
	              s = e[t];
	              break;
	            }
	          if (t.slideFrom === InAppMessage.SlideFrom.TOP) {
	            let e = 0;
	            null != s && (e = s.offsetTop + s.offsetHeight),
	              (o.style.top = Math.max(e, 0) + "px");
	          } else {
	            let e = 0;
	            null != s &&
	              (e =
	                (window.innerHeight || document.documentElement.clientHeight) -
	                s.offsetTop),
	              (o.style.bottom = Math.max(e, 0) + "px");
	          }
	        } else if (i && !e.nn(L.Lh)) {
	          const e = t;
	          isIFrame(o) &&
	            o.contentWindow &&
	            o.contentWindow.addEventListener("keydown", function (t) {
	              t.keyCode === KeyCodes.mh && e.closeMessage();
	            });
	        }
	        logInAppMessageImpression(t),
	          t.dismissType === InAppMessage.DismissType.AUTO_DISMISS &&
	            setTimeout(() => {
	              n.contains(o) && t.Cr(o);
	            }, t.duration),
	          "function" == typeof s && s();
	      },
	      (e) => {
	        r$1.info(e);
	      },
	      e.nn(L.ho),
	      e.nn(L.jo),
	      e.nn(L.bo),
	      o,
	      ue.m().wo(),
	    );
	  return (i || a) && (n.appendChild(l), t.Oh(n)), !0;
	}

	function subscribeToInAppMessage(n) {
	  if (e.X())
	    return "function" != typeof n
	      ? null
	      : se$1.m().Mi(function (r) {
	          return n(r[0]), r.slice(1);
	        });
	}

	function automaticallyShowInAppMessages() {
	  if (!e.X()) return;
	  setupInAppMessageUI();
	  const s = se$1.m();
	  if (null == s._i()) {
	    const r = subscribeToInAppMessage((s) => showInAppMessage(s));
	    s.Pi(r);
	  }
	  return s._i();
	}

	function deferInAppMessage(s) {
	  if (e.X())
	    return s instanceof ControlMessage
	      ? (r$1.info("Not deferring since this is a ControlMessage."), !1)
	      : s instanceof InAppMessage
	      ? se$1.m().je(s)
	      : (r$1.info("Not an instance of InAppMessage, ignoring."), !1);
	}

	function getDeferredInAppMessage() {
	  if (e.X()) return se$1.m().Se();
	}

	class aa {
	  constructor(t, s, i, r) {
	    (this.$t = t),
	      (this.oi = s),
	      (this.u = i),
	      (this.yt = r),
	      (this.$t = t),
	      (this.oi = s),
	      (this.u = i),
	      (this.yt = r),
	      (this._e = new T()),
	      e.Ht(this._e),
	      (this.Xe = 1e3),
	      (this.We = 6e4),
	      (this.Ye = null);
	  }
	  Ze() {
	    return this._e;
	  }
	  Mi(t) {
	    return this._e.Nt(t);
	  }
	  _i() {
	    return this.Ye;
	  }
	  Pi(t) {
	    this.Ye = t;
	  }
	  q(e, n, o, a) {
	    const l = new s();
	    let u;
	    if (e instanceof ControlMessage) u = { trigger_ids: [e.triggerId] };
	    else {
	      if (n === i.$i || (e instanceof HtmlMessage && n === i.Oi)) {
	        if (!e.p(a))
	          return (
	            r$1.info(
	              "This in-app message has already received a click. Ignoring analytics event.",
	            ),
	            l
	          );
	      } else if (n === i.Xi) {
	        if (!e.K())
	          return (
	            r$1.info(
	              "This in-app message has already received an impression. Ignoring analytics event.",
	            ),
	            l
	          );
	      }
	      u = this.Hi(e);
	    }
	    return null == u
	      ? l
	      : (e.messageExtras && (u.message_extras = e.messageExtras),
	        null != o && (u.bid = o),
	        t$1.q(n, u));
	  }
	  Ji(e, n) {
	    const o = new s();
	    if (!e.p())
	      return (
	        r$1.info(
	          "This in-app message button has already received a click. Ignoring analytics event.",
	        ),
	        o
	      );
	    const a = this.Hi(n);
	    return null == a
	      ? o
	      : e.id === InAppMessageButton.Ki
	      ? (r$1.info(
	          "This in-app message button does not have a tracking id. Not logging event to Braze servers.",
	        ),
	        o)
	      : (null != e.id && (a.bid = e.id), t$1.q(i.Oi, a));
	  }
	  Li(t) {
	    const e = t.messageFields;
	    return (null != e && e.is_push_primer) || !1;
	  }
	  Qi(t) {
	    if (!(t instanceof InAppMessage)) return;
	    const e = (t) => {
	      if (!t) return;
	      const e = getDecodedBrazeAction(t);
	      return containsUnknownBrazeAction(e)
	        ? ineligibleBrazeActionURLErrorMessage(INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Vi, "In-App Message")
	        : containsPushPrimerBrazeAction(e) && !yt$1.Wi()
	        ? ineligibleBrazeActionURLErrorMessage(INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Yi, "In-App Message")
	        : void 0;
	    };
	    if (this.Li(t) && !yt$1.Wi())
	      return "In-App Message contains a push prompt, but is not eligible for a push prompt. Ignoring.";
	    const s = t.buttons || [];
	    let i;
	    for (const t of s)
	      if (
	        t.clickAction === InAppMessage.ClickAction.URI &&
	        t.uri &&
	        BRAZE_ACTION_URI_REGEX.test(t.uri) &&
	        ((i = e(t.uri)), i)
	      )
	        return i;
	    return t.clickAction === InAppMessage.ClickAction.URI &&
	      t.uri &&
	      BRAZE_ACTION_URI_REGEX.test(t.uri)
	      ? e(t.uri)
	      : void 0;
	  }
	  Zi(t, e, s, i) {
	    const n = this.$t;
	    if (!n) return;
	    const o = n.Ir(!1, !1),
	      a = n.$s(o);
	    (a.template = { trigger_id: t.triggerId, trigger_event_type: e }),
	      null != s && (a.template.data = s.Mr());
	    const l = n.Ps(a, D._s.Tr);
	    n.Gs(
	      a,
	      (n = -1) => {
	        if (!this.$t) return;
	        const o = new Date().valueOf();
	        D.Hs(this.u, D._s.Tr, o),
	          -1 !== n && l.push(["X-Braze-Req-Tokens-Remaining", n.toString()]),
	          C.Ks({
	            url: `${this.$t.Os()}/template/`,
	            data: a,
	            headers: l,
	            L: (e) => {
	              if ((D.Ws(this.u, D._s.Tr, 1), !this.$t.Qs(a, e, l)))
	                return void ("function" == typeof t.Br && t.Br());
	              if ((this.$t.Vs(), null == e || null == e.templated_message))
	                return;
	              const s = e.templated_message;
	              if (s.type !== gt.Er._r) return;
	              const i = newInAppMessageFromJson(s.data);
	              if (null == i) return;
	              const n = this.Qi(i);
	              if (n)
	                return r$1.error(n), void ("function" == typeof t.Br && t.Br());
	              "function" == typeof t.Gr && t.Gr(i);
	            },
	            error: (r) => {
	              let n = `getting user personalization for message ${t.triggerId}`;
	              if (new Date().valueOf() - t.Nr < t.Or) {
	                D.ti(this.u, D._s.Tr);
	                const r = Math.min(t.Or, this.We),
	                  o = this.Xe;
	                null == i && (i = o);
	                const a = Math.min(r, randomInclusive(o, 3 * i));
	                (n += `. Retrying in ${a} ms`),
	                  setTimeout(() => {
	                    this.Zi(t, e, s, a);
	                  }, a);
	              }
	              this.$t.Ys(r, n);
	            },
	          });
	      },
	      D._s.Tr,
	    );
	  }
	  Hi(t) {
	    if (null == t.triggerId)
	      return (
	        r$1.info(
	          "The in-app message has no analytics id. Not logging event to Braze servers.",
	        ),
	        null
	      );
	    const e = {};
	    return null != t.triggerId && (e.trigger_ids = [t.triggerId]), e;
	  }
	  je(t) {
	    return (
	      !!this.u &&
	      !(
	        !(t && t instanceof InAppMessage && t.constructor !== InAppMessage) ||
	        t instanceof ControlMessage
	      ) &&
	      this.u.I(STORAGE_KEYS.C.Xr, t.Y())
	    );
	  }
	  Se() {
	    if (!this.u) return null;
	    const t = this.u.j(STORAGE_KEYS.C.Xr);
	    if (!t) return null;
	    let e;
	    switch (t.type) {
	      case InAppMessage.Be.Hr:
	        e = FullScreenMessage.Jr(t);
	        break;
	      case InAppMessage.Be.Kr:
	      case InAppMessage.Be.Me:
	      case InAppMessage.Be.Ve:
	        e = HtmlMessage.Jr(t);
	        break;
	      case InAppMessage.Be.Lr:
	      case InAppMessage.Be.Ue:
	        e = ModalMessage.Jr(t);
	        break;
	      case InAppMessage.Be.Qr:
	        e = SlideUpMessage.Jr(t);
	    }
	    return e && this.Ur(), e;
	  }
	  Ur() {
	    this.u && this.u.ii(STORAGE_KEYS.C.Xr);
	  }
	}

	const se = {
	  i: null,
	  t: !1,
	  m: () => (
	    se.o(), se.i || (se.i = new aa(e.nr(), e.zr(), e.l(), e.er())), se.i
	  ),
	  o: () => {
	    se.t || (e.g(se), (se.t = !0));
	  },
	  destroy: () => {
	    (se.i = null), (se.t = !1);
	  },
	};
	var se$1 = se;

	class wt {
	  constructor(t, s, i, h, l) {
	    (this.triggerId = t),
	      (this.Gr = s),
	      (this.Br = i),
	      (this.Nr = h),
	      (this.Or = l),
	      (this.triggerId = t),
	      (this.Gr = s),
	      (this.Br = i),
	      (this.Nr = h),
	      (this.Or = l);
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
	      (this.Bt = i),
	      (this.u = s),
	      (this.Ui = e),
	      (this.ig = r),
	      (this.tg = t),
	      (this.Bt = i),
	      (this.u = s),
	      (this.Ui = e),
	      (this.ig = r),
	      (this.sg = []),
	      (this.eg = []),
	      (this.hg = null),
	      (this.ng = {}),
	      (this.og = {}),
	      (this.triggers = []),
	      (this.lg = 0),
	      this.ag(),
	      this.gg();
	  }
	  fg() {
	    if (this.u) {
	      (this.hg = this.u.j(STORAGE_KEYS.C.iE) || this.hg),
	        (this.ng = this.u.j(STORAGE_KEYS.C.EE) || this.ng),
	        (this.og = this.u.j(STORAGE_KEYS.C.aE) || this.og);
	      for (let t = 0; t < this.triggers.length; t++) {
	        const i = this.triggers[t];
	        i.id && null != this.og[i.id] && i.ad(this.og[i.id]);
	      }
	    }
	  }
	  ag() {
	    if (!this.u) return;
	    this.lg = this.u.j(STORAGE_KEYS.C.oE) || 0;
	    const t = this.u.j(STORAGE_KEYS.C.rE) || [],
	      i = [];
	    for (let s = 0; s < t.length; s++) i.push(gt.qn(t[s]));
	    (this.triggers = i), this.fg();
	  }
	  gg() {
	    const t = this,
	      i = function (i, s, e, r, h) {
	        return function () {
	          t.cg(i, s, e, r, h);
	        };
	      },
	      s = {};
	    for (const t of this.triggers) t.id && (s[t.id] = t);
	    let e = !1;
	    for (let t = 0; t < this.triggers.length; t++) {
	      const r = this.triggers[t];
	      if (r.id && null != this.ng[r.id]) {
	        const t = this.ng[r.id],
	          h = [];
	        for (let e = 0; e < t.length; e++) {
	          const n = t[e],
	            o = r.ud(n.Nr || 0);
	          if (o > 0) {
	            let t, e;
	            h.push(n),
	              null != n.ug && (t = n.ug),
	              null != n.dg && ve.RE(n.dg) && (e = ve.qn(n.dg));
	            const l = [];
	            if (n.pg && isArray(n.pg))
	              for (let t = 0; t < n.pg.length; t++) {
	                const i = s[n.pg[t]];
	                null != i && l.push(i);
	              }
	            this.eg.push(window.setTimeout(i(r, n.Nr || 0, t, e, l), o));
	          }
	        }
	        this.ng[r.id].length > h.length &&
	          ((this.ng[r.id] = h),
	          (e = !0),
	          0 === this.ng[r.id].length && delete this.ng[r.id]);
	      }
	    }
	    e && this.u && this.u.I(STORAGE_KEYS.C.EE, this.ng);
	  }
	  mg() {
	    if (!this.u) return;
	    const t = [];
	    for (let i = 0; i < this.triggers.length; i++) t.push(this.triggers[i].Y());
	    (this.lg = new Date().valueOf()),
	      this.u.I(STORAGE_KEYS.C.rE, t),
	      this.u.I(STORAGE_KEYS.C.oE, this.lg);
	  }
	  bg() {
	    if (!this.u) return;
	    (this.u.j(STORAGE_KEYS.C.oE) || 0) > this.lg ? this.ag() : this.fg();
	  }
	  Ss(t) {
	    let i = !1;
	    if (null != t && t.triggers) {
	      this.ig.Ur(), this.fg();
	      const s = {},
	        e = {};
	      this.triggers = [];
	      for (let r = 0; r < t.triggers.length; r++) {
	        const h = gt.fromJson(t.triggers[r]);
	        if (h) {
	          h.id &&
	            null != this.og[h.id] &&
	            (h.ad(this.og[h.id]), (s[h.id] = this.og[h.id])),
	            h.id && null != this.ng[h.id] && (e[h.id] = this.ng[h.id]);
	          for (let t = 0; t < h.sd.length; t++)
	            if (h.sd[t].sc(tt.kt, null)) {
	              i = !0;
	              break;
	            }
	          this.triggers.push(h);
	        }
	      }
	      isEqual(this.og, s) || ((this.og = s), this.u && this.u.I(STORAGE_KEYS.C.aE, this.og)),
	        isEqual(this.ng, e) || ((this.ng = e), this.u && this.u.I(STORAGE_KEYS.C.EE, this.ng)),
	        this.mg(),
	        i &&
	          (r$1.info("Trigger with test condition found, firing test."),
	          this.fe(tt.kt)),
	        this.fe(tt.OPEN);
	      const h = this.sg;
	      let n;
	      this.sg = [];
	      for (let t = 0; t < h.length; t++)
	        (n = Array.prototype.slice.call(h[t])), this.fe(...n);
	    }
	  }
	  cg(t, i, s, e, h) {
	    const n = (e) => {
	        this.fg();
	        const h = new Date().valueOf();
	        t.dd(i) ||
	          (!1 === navigator.onLine && t.type === gt.Er._r && e.imageUrl
	            ? r$1.info(
	                `Not showing ${t.type} trigger action ${t.id} due to offline state.`,
	              )
	            : t.nd(h) && this.wg(t, h, s)
	            ? 0 === this.Bt.ic()
	              ? r$1.info(
	                  `Not displaying trigger ${t.id} because neither automaticallyShowInAppMessages() nor subscribeToInAppMessage() were called.`,
	                )
	              : (this.Bt.Rt([e]), this.yg(t, h))
	            : r$1.info(
	                `Not displaying trigger ${t.id} because display time fell outside of the acceptable time window.`,
	              ));
	      },
	      o = () => {
	        this.fg();
	        const n = h.pop();
	        if (null != n)
	          if ((this.Tg(n, i, s, e, h), n.dd(i))) {
	            let t = `Server aborted in-app message display, but the timeout on fallback trigger ${n.id} has already elapsed.`;
	            h.length > 0 && (t += " Continuing to fall back."), r$1.info(t), o();
	          } else {
	            r$1.info(
	              `Server aborted in-app message display. Falling back to lower priority ${n.type} trigger action ${t.id}.`,
	            );
	            const o = 1e3 * n.ed - (new Date().valueOf() - i);
	            o > 0
	              ? this.eg.push(
	                  window.setTimeout(() => {
	                    this.cg(n, i, s, e, h);
	                  }, o),
	                )
	              : this.cg(n, i, s, e, h);
	          }
	      };
	    let l, a, g;
	    switch (t.type) {
	      case gt.Er._r:
	        if (((l = newInAppMessageFromJson(t.data)), null == l)) {
	          r$1.error(
	            `Could not parse trigger data for trigger ${t.id}, ignoring.`,
	          );
	          break;
	        }
	        if (((a = this.ig.Qi(l)), a)) {
	          r$1.error(a), o();
	          break;
	        }
	        n(l);
	        break;
	      case gt.Er.md:
	        if (((g = wt.fromJson(t.data, n, o, i, t.Or || 0)), null == g)) {
	          r$1.error(
	            `Could not parse trigger data for trigger ${t.id}, ignoring.`,
	          );
	          break;
	        }
	        this.ig.Zi(g, s, e);
	        break;
	      default:
	        r$1.error(`Trigger ${t.id} was of unexpected type ${t.type}, ignoring.`);
	    }
	  }
	  fe(t, i = null, s) {
	    if (!validateValueIsFromEnum(tt, t, "Cannot fire trigger action.", "TriggerEvents")) return;
	    if (this.Ui && this.Ui.Uu())
	      return (
	        r$1.info(
	          "Trigger sync is currently in progress, awaiting sync completion before firing trigger event.",
	        ),
	        void this.sg.push(arguments)
	      );
	    this.bg();
	    const e = new Date().valueOf(),
	      h = e - (this.hg || 0);
	    let n = !0,
	      o = !0;
	    const l = [];
	    for (let s = 0; s < this.triggers.length; s++) {
	      const r = this.triggers[s],
	        h = e + 1e3 * r.ed;
	      if (
	        r.nd(h) &&
	        (null == r.startTime || r.startTime.valueOf() <= e) &&
	        (null == r.endTime || r.endTime.valueOf() >= e)
	      ) {
	        let s = !1;
	        for (let e = 0; e < r.sd.length; e++)
	          if (r.sd[e].sc(t, i)) {
	            s = !0;
	            break;
	          }
	        s && ((n = !1), this.wg(r, h, t) && ((o = !1), l.push(r)));
	      }
	    }
	    if (n)
	      return void r$1.info(
	        `Trigger event ${t} did not match any trigger conditions.`,
	      );
	    if (o)
	      return void r$1.info(
	        `Ignoring ${t} trigger event because a trigger was displayed ${
          h / 1e3
        }s ago.`,
	      );
	    l.sort((t, i) => t.priority - i.priority);
	    const a = l.pop();
	    null != a &&
	      (r$1.info(
	        `Firing ${a.type} trigger action ${a.id} from trigger event ${t}.`,
	      ),
	      this.Tg(a, e, t, s, l),
	      0 === a.ed
	        ? this.cg(a, e, t, s, l)
	        : this.eg.push(
	            window.setTimeout(() => {
	              this.cg(a, e, t, s, l);
	            }, 1e3 * a.ed),
	          ));
	  }
	  changeUser(t = !1) {
	    if (((this.triggers = []), this.u && this.u.ii(STORAGE_KEYS.C.rE), !t)) {
	      (this.sg = []), (this.hg = null), (this.og = {}), (this.ng = {});
	      for (let t = 0; t < this.eg.length; t++) clearTimeout(this.eg[t]);
	      (this.eg = []),
	        this.u && (this.u.ii(STORAGE_KEYS.C.iE), this.u.ii(STORAGE_KEYS.C.aE), this.u.ii(STORAGE_KEYS.C.EE));
	    }
	  }
	  clearData() {
	    (this.triggers = []), (this.hg = null), (this.og = {}), (this.ng = {});
	    for (let t = 0; t < this.eg.length; t++) clearTimeout(this.eg[t]);
	    this.eg = [];
	  }
	  wg(t, i, s) {
	    if (null == this.hg) return !0;
	    if (s === tt.kt)
	      return (
	        r$1.info(
	          "Ignoring minimum interval between trigger because it is a test type.",
	        ),
	        !0
	      );
	    let e = t.hd;
	    return null == e && (e = this.tg), i - this.hg >= 1e3 * e;
	  }
	  Tg(t, i, s, e, r) {
	    this.fg(), t.id && (this.ng[t.id] = this.ng[t.id] || []);
	    const h = {};
	    let n;
	    (h.Nr = i), (h.ug = s), null != e && (n = e.Y()), (h.dg = n);
	    const l = [];
	    for (const t of r) t.id && l.push(t.id);
	    (h.pg = l),
	      t.id && this.ng[t.id].push(h),
	      this.u && this.u.I(STORAGE_KEYS.C.EE, this.ng);
	  }
	  yg(t, i) {
	    this.fg(),
	      t.ad(i),
	      (this.hg = i),
	      t.id && (this.og[t.id] = i),
	      this.u && (this.u.I(STORAGE_KEYS.C.iE, i), this.u.I(STORAGE_KEYS.C.aE, this.og));
	  }
	}

	const TriggersProviderFactory = {
	  t: !1,
	  provider: null,
	  rr: () => (
	    TriggersProviderFactory.o(),
	    TriggersProviderFactory.provider || TriggersProviderFactory.rg(),
	    TriggersProviderFactory.provider
	  ),
	  rg: () => {
	    if (!TriggersProviderFactory.provider) {
	      const r = e.nn(L.Oo);
	      (TriggersProviderFactory.provider = new gr(
	        null != r ? r : 30,
	        se$1.m().Ze(),
	        e.l(),
	        e.cr(),
	        se$1.m(),
	      )),
	        e.ar(TriggersProviderFactory.provider);
	    }
	  },
	  o: () => {
	    TriggersProviderFactory.t ||
	      (TriggersProviderFactory.rg(),
	      e.g(TriggersProviderFactory),
	      (TriggersProviderFactory.t = !0));
	  },
	  destroy: () => {
	    (TriggersProviderFactory.provider = null), (TriggersProviderFactory.t = !1);
	  },
	};

	class ti {
	  constructor(t, i, s, l, h) {
	    (this.endpoint = t),
	      (this.Vn = i),
	      (this.publicKey = s),
	      (this.Vl = l),
	      (this.cl = h),
	      (this.endpoint = t || null),
	      (this.Vn = i || null),
	      (this.publicKey = s || null),
	      (this.Vl = l || null),
	      (this.cl = h || null);
	  }
	  Y() {
	    return {
	      e: this.endpoint,
	      c: this.Vn,
	      p: this.publicKey,
	      u: this.Vl,
	      v: this.cl,
	    };
	  }
	  static qn(t) {
	    return new ti(t.e, rehydrateDateAfterJsonization(t.c), t.p, t.u, t.v);
	  }
	}

	class kt {
	  constructor(t, s) {
	    (this.qt = t), (this.u = s), (this.qt = t), (this.u = s);
	  }
	  getUserId() {
	    const t = this.u.tu(STORAGE_KEYS.iu.su);
	    if (null == t) return null;
	    let s = t.eu,
	      i = getByteLength(s);
	    if (i > User.lr) {
	      for (; i > User.lr; ) (s = s.slice(0, s.length - 1)), (i = getByteLength(s));
	      (t.eu = s), this.u.uu(STORAGE_KEYS.iu.su, t);
	    }
	    return s;
	  }
	  ou(t) {
	    const s = null == this.getUserId();
	    this.u.uu(STORAGE_KEYS.iu.su, new _t(t)), s && this.u.ru(t);
	  }
	  setCustomUserAttribute(t, s) {
	    if (this.qt.hu(t))
	      return (
	        r$1.info('Custom Attribute "' + t + '" is blocklisted, ignoring.'), !1
	      );
	    const i = {};
	    return (i[t] = s), this.nu(User.lu, i, !0);
	  }
	  nu(t, s, i = !1, e = !1) {
	    const u = this.u.mu(this.getUserId(), t, s);
	    let o = "",
	      h = t,
	      n = s;
	    return (
	      i &&
	        ((o = " custom"),
	        "object" == typeof s &&
	          ((h = Object.keys(s)[0]),
	          (n = s[h]),
	          "object" == typeof n && (n = JSON.stringify(n, null, 2)))),
	      !e && u && r$1.info(`Logged${o} attribute ${h} with value ${n}`),
	      u
	    );
	  }
	  Pn(t, s, i, e, u) {
	    this.nu("push_token", t, !1, !0),
	      this.nu("custom_push_public_key", i, !1, !0),
	      this.nu("custom_push_user_auth", e, !1, !0),
	      this.nu("custom_push_vapid_public_key", u, !1, !0);
	    const h = A.ts.Zt,
	      n = new A(h, r$1),
	      l = new ti(t, s, i, e, u);
	    this.u.I(STORAGE_KEYS.C.In, l.Y()), n.setItem(h.hs.cu, h.ie, !0);
	  }
	  Sn(t) {
	    if (
	      (this.nu("push_token", null, !1, !0),
	      this.nu("custom_push_public_key", null, !1, !0),
	      this.nu("custom_push_user_auth", null, !1, !0),
	      this.nu("custom_push_vapid_public_key", null, !1, !0),
	      t)
	    ) {
	      const t = A.ts.Zt,
	        s = new A(t, r$1);
	      this.u.I(STORAGE_KEYS.C.In, !1), s.setItem(t.hs.cu, t.ie, !1);
	    }
	  }
	}

	const L = {
	  Eo: "allowCrawlerActivity",
	  _o: "baseUrl",
	  Io: "noCookies",
	  So: "devicePropertyAllowlist",
	  Aa: "disablePushTokenMaintenance",
	  Ao: "enableLogging",
	  No: "enableSdkAuthentication",
	  qa: "manageServiceWorkerExternally",
	  Oo: "minimumIntervalBetweenTriggerActionsInSeconds",
	  Ro: "sessionTimeoutInSeconds",
	  Po: "appVersion",
	  Lo: "appVersionNumber",
	  Ma: "serviceWorkerLocation",
	  ka: "safariWebsitePushId",
	  zn: "localization",
	  bo: "contentSecurityNonce",
	  Do: "allowUserSuppliedJavascript",
	  jo: "inAppMessageZIndex",
	  ho: "openInAppMessagesInNewTab",
	  tn: "openCardsInNewTab",
	  en: "openNewsFeedCardsInNewTab",
	  Lh: "requireExplicitInAppMessageDismissal",
	  Mo: "doNotLoadFontAwesome",
	  Uo: "deviceId",
	  _a: "serviceWorkerScope",
	  Wo: "sdkFlavor",
	};
	class Vt {
	  constructor() {
	    (this.rn = ""),
	      (this.Bo = ""),
	      (this.Vo = void 0),
	      (this.Ko = null),
	      (this.on = null),
	      (this.$t = null),
	      (this.Ui = null),
	      (this.qt = null),
	      (this.oi = null),
	      (this.u = null),
	      (this.yt = null),
	      (this.Go = ""),
	      (this.isInitialized = !1),
	      (this.$o = !1),
	      (this.qo = new T()),
	      (this.Jo = new T()),
	      (this.options = {}),
	      (this.Yo = []),
	      (this.Ho = []),
	      (this._e = []),
	      (this.Bo = "5.5.0");
	  }
	  Xo(t) {
	    this.qo.Nt(t);
	  }
	  Sh(t) {
	    this.Jo.Nt(t);
	  }
	  initialize(t, i) {
	    if (this.so())
	      return r$1.info("Braze has already been initialized with an API key."), !0;
	    this.options = i || {};
	    let s = this.nn(L.Ao);
	    const e = parseQueryStringKeyValues(WindowUtils.Zo());
	    if (
	      (e && "true" === e.brazeLogging && (s = !0),
	      r$1.init(s),
	      r$1.info(
	        `Initialization Options: ${JSON.stringify(this.options, null, 2)}`,
	      ),
	      null == t || "" === t || "string" != typeof t)
	    )
	      return r$1.error("Braze requires a valid API key to be initialized."), !1;
	    this.rn = t;
	    let n = this.nn(L._o);
	    if (null == n || "" === n || "string" != typeof n)
	      return r$1.error("Braze requires a valid baseUrl to be initialized."), !1;
	    !1 === /^https?:/.test(n) && (n = `https://${n}`);
	    const h = n;
	    if (
	      ((n = document.createElement("a")),
	      (n.href = h),
	      "/" === n.pathname && (n = `${n}api/v3`),
	      (this.Go = n.toString()),
	      X.Qo && !this.nn(L.Eo))
	    )
	      return (
	        r$1.info("Ignoring activity from crawler bot " + navigator.userAgent),
	        (this.$o = !0),
	        !1
	      );
	    const a = this.nn(L.Io) || !1;
	    if (
	      ((this.u = Wt.Wh(t, a)), a && this.u.Vh(t), new Q.ee(null, !0).br(STORAGE_KEYS.se))
	    )
	      return (
	        r$1.info("Ignoring all activity due to previous opt out"),
	        (this.$o = !0),
	        !1
	      );
	    for (const t of keys(this.options))
	      -1 === values(zt).indexOf(t) &&
	        r$1.warn(`Ignoring unknown initialization option '${t}'.`);
	    const l = ["mparticle", "wordpress", "tealium"];
	    if (null != this.nn(L.Wo)) {
	      const t = this.nn(L.Wo);
	      -1 !== l.indexOf(t)
	        ? (this.Vo = t)
	        : r$1.error("Invalid sdk flavor passed: " + t);
	    }
	    let u = this.nn(zt.So);
	    if (null != u)
	      if (isArray(u)) {
	        const t = [];
	        for (let i = 0; i < u.length; i++)
	          validateValueIsFromEnum(
	            DeviceProperties,
	            u[i],
	            "devicePropertyAllowlist contained an invalid value.",
	            "DeviceProperties",
	          ) && t.push(u[i]);
	        u = t;
	      } else
	        r$1.error(
	          "devicePropertyAllowlist must be an array. Defaulting to all properties.",
	        ),
	          (u = null);
	    const c = this.nn(L.Uo);
	    if (c) {
	      const t = new _t(c);
	      this.u.uu(STORAGE_KEYS.iu.Uo, t);
	    }
	    (this.on = new Ot(this.u, u)),
	      (this.qt = new Dt(this.u)),
	      (this.yt = new kt(this.qt, this.u)),
	      (this.oi = new Mt(this.u, this.yt, this.qt, this.nn(L.Ro)));
	    const f = new T();
	    return (
	      (this.Ko = new qt(this.u, this.nn(L.No), f)),
	      this.Ht(f),
	      (this.$t = new Pt(
	        this.on,
	        this.u,
	        this.Ko,
	        this.yt,
	        this.oi,
	        this.qt,
	        this.rn,
	        this.Go,
	        this.Bo,
	        this.Vo || "",
	        this.nn(L.Po),
	        this.nn(L.Lo),
	      )),
	      (this.Ui = new Lt(
	        this.rn,
	        this.Go,
	        this.oi,
	        this.on,
	        this.yt,
	        this.qt,
	        this.u,
	        (t) => {
	          if (this.so()) for (const i of this.gr()) i.Ss(t);
	        },
	        this.Ko,
	        this.$t,
	      )),
	      this.Ui.initialize(),
	      a || this.u.Kh(),
	      r$1.info(
	        `Initialized for the Braze backend at "${this.nn(
          L._o,
        )}" with API key "${this.rn}".`,
	      ),
	      TriggersProviderFactory.o(),
	      this.qt.bi(() => {
	        var t;
	        this.isInitialized &&
	          (null === (t = this.qt) || void 0 === t ? void 0 : t.mi()) &&
	          Promise.resolve().then(function () { return refreshFeatureFlags$1; }).then((t) => {
	            if (!this.isInitialized) return;
	            (0, t.default)();
	          });
	      }),
	      this.Ui.mr(() => {
	        var t;
	        this.isInitialized &&
	          (null === (t = this.qt) || void 0 === t ? void 0 : t.mi()) &&
	          Promise.resolve().then(function () { return refreshFeatureFlags$1; }).then((t) => {
	            if (!this.isInitialized) return;
	            (0, t.default)(void 0, void 0, !0);
	          });
	      }),
	      this.qo.Rt(this.options),
	      (this.isInitialized = !0),
	      window.dispatchEvent(new CustomEvent("braze.initialized")),
	      !0
	    );
	  }
	  destroy(t) {
	    if ((r$1.destroy(), this.so())) {
	      this.Jo.Rt(), this.Jo.removeAllSubscriptions();
	      for (const t of this.Yo) t.destroy();
	      this.Yo = [];
	      for (const t of this.Ho) t.clearData(!1);
	      (this.Ho = []),
	        this.removeAllSubscriptions(),
	        (this._e = []),
	        null != this.Ui && this.Ui.destroy(),
	        (this.Ui = null),
	        (this.Ko = null),
	        (this.on = null),
	        (this.$t = null),
	        (this.qt = null),
	        (this.oi = null),
	        (this.yt = null),
	        (this.options = {}),
	        (this.Vo = void 0),
	        (this.isInitialized = !1),
	        (this.$o = !1),
	        t && (this.u = null);
	    }
	  }
	  X() {
	    return !this.$h() && (!!this.so() || (console.warn(BRAZE_MUST_BE_INITIALIZED_ERROR), !1));
	  }
	  ba() {
	    return this.rn;
	  }
	  Sr() {
	    return this.Ko;
	  }
	  Os() {
	    return this.Go;
	  }
	  te() {
	    return this.on;
	  }
	  nr() {
	    return this.$t;
	  }
	  nn(t) {
	    return this.options[t];
	  }
	  gr() {
	    return this.Ho;
	  }
	  cr() {
	    return this.Ui;
	  }
	  ir() {
	    return this.qt;
	  }
	  zr() {
	    return this.oi;
	  }
	  l() {
	    return this.u;
	  }
	  pr() {
	    if (this.yt && this.Ui) return new User(this.yt, this.Ui);
	  }
	  er() {
	    return this.yt;
	  }
	  tr() {
	    return !0 === this.nn(L.Do);
	  }
	  g(t) {
	    let i = !1;
	    for (const s of this.Yo) s === t && (i = !0);
	    i || this.Yo.push(t);
	  }
	  ar(t) {
	    let i = !1;
	    for (const s of this.Ho) s.constructor === t.constructor && (i = !0);
	    t instanceof y && !i && this.Ho.push(t);
	  }
	  Ht(t) {
	    t instanceof T && this._e.push(t);
	  }
	  removeAllSubscriptions() {
	    if (this.X()) for (const t of this._e) t.removeAllSubscriptions();
	  }
	  removeSubscription(t) {
	    if (this.X()) for (const i of this._e) i.removeSubscription(t);
	  }
	  oe(t) {
	    this.$o = t;
	  }
	  so() {
	    return this.isInitialized;
	  }
	  $h() {
	    return this.$o;
	  }
	  ks() {
	    return this.Bo;
	  }
	}
	const e = new Vt();

	const t = {
	  q: (o, t, n) => {
	    var i, l;
	    const d = new s(),
	      m = e.zr();
	    if (!m)
	      return (
	        r$1.info(
	          `Not logging event with type "${o}" because the current session ID could not be found.`,
	        ),
	        d
	      );
	    const u = m.xo();
	    return (
	      d.ge.push(
	        new ve(
	          n || (null === (i = e.er()) || void 0 === i ? void 0 : i.getUserId()),
	          o,
	          new Date().valueOf(),
	          u,
	          t,
	        ),
	      ),
	      (d.L =
	        (null === (l = e.l()) || void 0 === l ? void 0 : l.zo(d.ge)) || !1),
	      d
	    );
	  },
	};
	var t$1 = t;

	class a {
	  constructor(t) {
	    (this.u = t), (this.u = t);
	  }
	  h(n, e) {
	    const l = new s();
	    if ((n.p(), null == n.url || "" === n.url))
	      return (
	        r$1.info(`Card ${n.id} has no url. Not logging click to Braze servers.`),
	        l
	      );
	    if (e && n.id && this.u) {
	      const t = this.u.j(STORAGE_KEYS.C.v) || {};
	      (t[n.id] = !0), this.u.I(STORAGE_KEYS.C.v, t);
	    }
	    const a = this.$([n]);
	    if (null == a) return l;
	    const u = e ? i.k : i.D;
	    return t$1.q(u, a);
	  }
	  B(n) {
	    const e = new s();
	    if (!n.N())
	      return (
	        r$1.info(
	          `Card ${n.id} refused this dismissal. Ignoring analytics event.`,
	        ),
	        e
	      );
	    if (n.id && this.u) {
	      const t = this.u.j(STORAGE_KEYS.C.A) || {};
	      (t[n.id] = !0), this.u.I(STORAGE_KEYS.C.A, t);
	    }
	    const l = this.$([n]);
	    return null == l ? e : t$1.q(i.F, l);
	  }
	  G(n, e) {
	    const l = new s(!0),
	      a = [],
	      u = [];
	    let c = {};
	    this.u && (c = e ? this.u.j(STORAGE_KEYS.C.H) || {} : this.u.j(STORAGE_KEYS.C.J) || {});
	    for (const t of n) {
	      t.K()
	        ? (t instanceof ControlCard ? u.push(t) : a.push(t),
	          t.id && (c[t.id] = !0))
	        : r$1.info(
	            `Card ${t.id} logged an impression too recently. Ignoring analytics event.`,
	          );
	    }
	    const h = this.$(a),
	      m = this.$(u);
	    if (null == h && null == m) return (l.L = !1), l;
	    if ((this.u && (e ? this.u.I(STORAGE_KEYS.C.H, c) : this.u.I(STORAGE_KEYS.C.J, c)), null != h)) {
	      const s = e ? i.M : i.O,
	        n = t$1.q(s, h);
	      l.P(n);
	    }
	    if (null != m && e) {
	      const s = t$1.q(i.R, m);
	      l.P(s);
	    }
	    return l;
	  }
	  $(t) {
	    let s,
	      n = null;
	    for (let r = 0; r < t.length; r++)
	      (s = t[r].id),
	        null != s &&
	          "" !== s &&
	          ((n = n || {}), (n.ids = n.ids || []), n.ids.push(s));
	    return n;
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
	  },
	};
	var n$1 = n;

	function logCardClick(o, m) {
	  return (
	    !!e.X() &&
	    (o instanceof Card ? n$1.m().h(o, m).L : (r$1.error("card " + MUST_BE_CARD_WARNING_SUFFIX), !1))
	  );
	}

	function logCardDismissal(o) {
	  return (
	    !!e.X() && (o instanceof Card ? n$1.m().B(o).L : (r$1.error("card " + MUST_BE_CARD_WARNING_SUFFIX), !1))
	  );
	}

	function logCardImpressions(o, s) {
	  if (!e.X()) return !1;
	  if (!isArray(o)) return r$1.error("cards must be an array"), !1;
	  for (const n of o)
	    if (!(n instanceof Card)) return r$1.error(`Each card in cards ${MUST_BE_CARD_WARNING_SUFFIX}`), !1;
	  return n$1.m().G(o, s).L;
	}

	function logContentCardImpressions(o) {
	  return logCardImpressions(o, !0);
	}

	function logContentCardClick(o) {
	  return logCardClick(o, !0);
	}

	class x {
	  constructor(s, e) {
	    (this.cards = s),
	      (this.lastUpdated = e),
	      (this.cards = s),
	      (this.lastUpdated = e);
	  }
	  getUnreadCardCount() {
	    let s = 0;
	    for (const e of this.cards) e.viewed || e instanceof ControlCard || s++;
	    return s;
	  }
	  dr() {
	    r$1.error("Must be implemented in a subclass");
	  }
	  logCardImpressions(s) {
	    r$1.error("Must be implemented in a subclass");
	  }
	  logCardClick(s) {
	    r$1.error("Must be implemented in a subclass");
	  }
	  sr() {
	    r$1.error("Must be implemented in a subclass");
	  }
	}
	(x.ur = 6e4), (x.Ah = 500), (x.Co = 1e4);

	function newCard(n, e, t, o, i, l, u, d, a, w, f, s, m, C, p, c, x, F) {
	  let j;
	  if (e === Card.it.Pt || e === Card.it.Ut)
	    j = new ClassicCard(n, t, o, i, l, u, d, a, w, f, s, m, C, p, c, x);
	  else if (e === Card.it.st)
	    j = new CaptionedImage(n, t, o, i, l, u, d, a, w, f, s, m, C, p, c, x);
	  else if (e === Card.it.Gt)
	    j = new ImageOnly(n, t, i, u, d, a, w, f, s, m, C, p, c, x);
	  else {
	    if (e !== Card.it.Xt)
	      return r$1.error("Ignoring card with unknown type " + e), null;
	    j = new ControlCard(n, t, d, w, C, p);
	  }
	  return F && (j.test = F), j;
	}
	function newCardFromContentCardsJson(n) {
	  if (n[Card._t.Ot]) return null;
	  const e = n[Card._t.ht],
	    r = n[Card._t.Z],
	    t = n[Card._t.et],
	    o = n[Card._t.rt],
	    i = n[Card._t.ot],
	    u = n[Card._t.ct],
	    d = dateFromUnixTimestamp(n[Card._t.nt]),
	    a = d;
	  let w;
	  w = n[Card._t.lt] === Card.Mt ? null : dateFromUnixTimestamp(n[Card._t.lt]);
	  return newCard(
	    e,
	    r,
	    t,
	    o,
	    i,
	    u,
	    a,
	    d,
	    null,
	    w,
	    n[Card._t.URL],
	    n[Card._t.ft],
	    n[Card._t.xt],
	    n[Card._t.bt],
	    n[Card._t.gt],
	    n[Card._t.jt],
	    n[Card._t.zt],
	    n[Card._t.kt] || !1,
	  );
	}
	function newCardFromFeedJson(n) {
	  return newCard(
	    n.id,
	    n.type,
	    n.viewed,
	    n.title,
	    n.image,
	    n.description,
	    dateFromUnixTimestamp(n.created),
	    dateFromUnixTimestamp(n.updated),
	    n.categories,
	    dateFromUnixTimestamp(n.expires_at),
	    n.url,
	    n.domain,
	    n.aspect_ratio,
	    n.extras,
	    !1,
	    !1,
	  );
	}
	function newCardFromSerializedValue(n) {
	  return (
	    newCard(
	      n[Card.tt.ht],
	      n[Card.tt.Z],
	      n[Card.tt.et],
	      n[Card.tt.rt],
	      n[Card.tt.ot],
	      n[Card.tt.ct],
	      rehydrateDateAfterJsonization(n[Card.tt.dt]),
	      rehydrateDateAfterJsonization(n[Card.tt.nt]),
	      n[Card.tt.ut],
	      rehydrateDateAfterJsonization(n[Card.tt.lt]),
	      n[Card.tt.URL],
	      n[Card.tt.ft],
	      n[Card.tt.xt],
	      n[Card.tt.bt],
	      n[Card.tt.gt],
	      n[Card.tt.jt],
	      n[Card.tt.zt],
	      n[Card.tt.kt] || !1,
	    ) || void 0
	  );
	}

	class v extends y {
	  constructor(t, s, i, h, n) {
	    super(),
	      (this.yt = t),
	      (this.u = s),
	      (this.qt = i),
	      (this.Jt = h),
	      (this.$t = n),
	      (this.yt = t),
	      (this.u = s),
	      (this.qt = i),
	      (this.Jt = h),
	      (this.$t = n),
	      (this.Bt = new T()),
	      e.Ht(this.Bt),
	      (this.Kt = 0),
	      (this.Qt = 0),
	      (this.cards = []),
	      this.Yt();
	    const o = A.ts.Zt;
	    new A(o, r$1).ss(o.hs.es, (t) => {
	      this.rs(t);
	    }),
	      (this.ns = null),
	      (this.os = null),
	      (this.ls = null),
	      (this.us = null),
	      (this.cs = null),
	      (this.fs = 10),
	      (this.ds = 0);
	  }
	  ps() {
	    return this.ns;
	  }
	  vs(t) {
	    this.ns = t;
	  }
	  ws() {
	    return this.os;
	  }
	  Cs(t) {
	    this.os = t;
	  }
	  Yt() {
	    if (!this.u) return;
	    const t = this.u.j(STORAGE_KEYS.C.bs) || [],
	      s = [];
	    for (let i = 0; i < t.length; i++) {
	      const e = newCardFromSerializedValue(t[i]);
	      null != e && s.push(e);
	    }
	    (this.cards = this.gs(this.ys(s, !1))),
	      (this.Kt = this.u.j(STORAGE_KEYS.C.js) || this.Kt),
	      (this.Qt = this.u.j(STORAGE_KEYS.C.Rs) || this.Qt);
	  }
	  Ns(t, s = !1, i = 0, e = 0) {
	    let h;
	    if (s) {
	      h = [];
	      for (const t of this.cards) t.test && h.push(t);
	    } else h = this.cards.slice();
	    for (let i = 0; i < t.length; i++) {
	      const e = t[i];
	      let r = null;
	      for (let t = 0; t < this.cards.length; t++)
	        if (e.id === this.cards[t].id) {
	          r = this.cards[t];
	          break;
	        }
	      if (s) {
	        const t = newCardFromContentCardsJson(e);
	        null != r && r.viewed && t && (t.viewed = !0), null != t && h.push(t);
	      } else if (null == r) {
	        const t = newCardFromContentCardsJson(e);
	        null != t && h.push(t);
	      } else {
	        if (!r.Lt(e))
	          for (let t = 0; t < h.length; t++)
	            if (e.id === h[t].id) {
	              h.splice(t, 1);
	              break;
	            }
	      }
	    }
	    (this.cards = this.gs(this.ys(h, s))),
	      this.Ts(),
	      (this.Kt = i),
	      (this.Qt = e),
	      this.u && (this.u.I(STORAGE_KEYS.C.js, this.Kt), this.u.I(STORAGE_KEYS.C.Rs, this.Qt));
	  }
	  Ss(t) {
	    if (this.Ds() && null != t && t.cards) {
	      this.u && this.u.I(STORAGE_KEYS.C.Us, e.ks());
	      const s = t.full_sync;
	      s || this.Yt(),
	        this.Ns(t.cards, s, t.last_full_sync_at, t.last_card_updated_at),
	        this.Bt.Rt(this.As(!0));
	    }
	  }
	  Fs(t) {
	    this.u && this.u.I(STORAGE_KEYS.C.xs, t);
	  }
	  zs(s, e, h) {
	    const r = () => {
	        this.qs(e, h, !0);
	      },
	      n = s ? readResponseHeaders(s) : null;
	    let l;
	    if ((this.Es(), !n || !n["retry-after"])) return void this.Fs(0);
	    const a = n["retry-after"];
	    if (isNaN(a) && !isNaN(Date.parse(a)))
	      (l = Date.parse(a) - new Date().getTime()), l < 0 && r();
	    else {
	      if (isNaN(parseFloat(a.toString()))) {
	        const s =
	          "Received unexpected value for retry-after header in /sync response";
	        return t$1.q(i.Ls, { e: s + ": " + a }), void this.Fs(0);
	      }
	      l = 1e3 * parseFloat(a.toString());
	    }
	    this.ls = window.setTimeout(() => {
	      r();
	    }, l);
	    let u = 0;
	    this.u && (u = this.u.j(STORAGE_KEYS.C.xs)),
	      (null == u || isNaN(parseInt(u.toString()))) && (u = 0),
	      this.Fs(parseInt(u.toString()) + 1);
	  }
	  rs(t) {
	    var s;
	    if (!this.Ds()) return;
	    this.Yt();
	    const i = this.cards.slice();
	    let e = null;
	    e = null === (s = this.yt) || void 0 === s ? void 0 : s.getUserId();
	    for (let s = 0; s < t.length; s++)
	      if (e === t[s].userId || (null == e && null == t[s].userId)) {
	        const e = t[s].card;
	        let h = null;
	        for (let t = 0; t < this.cards.length; t++)
	          if (e.id === this.cards[t].id) {
	            h = this.cards[t];
	            break;
	          }
	        if (null == h) {
	          const t = newCardFromContentCardsJson(e);
	          null != t && i.push(t);
	        } else {
	          if (!h.Lt(e))
	            for (let t = 0; t < i.length; t++)
	              if (e.id === i[t].id) {
	                i.splice(t, 1);
	                break;
	              }
	        }
	      }
	    (this.cards = this.gs(this.ys(i, !1))), this.Ts(), this.Bt.Rt(this.As(!0));
	  }
	  ys(t, s) {
	    let i = {},
	      e = {},
	      h = {};
	    this.u &&
	      ((i = this.u.j(STORAGE_KEYS.C.v) || {}),
	      (e = this.u.j(STORAGE_KEYS.C.H) || {}),
	      (h = this.u.j(STORAGE_KEYS.C.A) || {}));
	    const r = {},
	      n = {},
	      l = {};
	    for (let s = 0; s < t.length; s++) {
	      const o = t[s].id;
	      o &&
	        (i[o] && ((t[s].clicked = !0), (r[o] = !0)),
	        e[o] && ((t[s].viewed = !0), (n[o] = !0)),
	        h[o] && ((t[s].dismissed = !0), (l[o] = !0)));
	    }
	    return (
	      s &&
	        this.u &&
	        (this.u.I(STORAGE_KEYS.C.v, r), this.u.I(STORAGE_KEYS.C.H, n), this.u.I(STORAGE_KEYS.C.A, l)),
	      t
	    );
	  }
	  gs(t) {
	    const s = [],
	      i = new Date();
	    let e = {};
	    this.u && (e = this.u.j(STORAGE_KEYS.C.A) || {});
	    let h = !1;
	    for (let n = 0; n < t.length; n++) {
	      const o = t[n].url;
	      if (!this.Jt && o && isURIJavascriptOrData(o)) {
	        r$1.error(
	          `Card with url ${o} will not be displayed because Javascript URLs are disabled. Use the "allowUserSuppliedJavascript" option for braze.initialize to enable this card.`,
	        );
	        continue;
	      }
	      const l = t[n].expiresAt;
	      let a = !0;
	      if ((null != l && (a = l >= i), (a = a && !t[n].dismissed), a))
	        s.push(t[n]);
	      else {
	        const s = t[n].id;
	        s && (e[s] = !0), (h = !0);
	      }
	    }
	    return h && this.u && this.u.I(STORAGE_KEYS.C.A, e), s;
	  }
	  Ts() {
	    var t;
	    const s = [];
	    for (let t = 0; t < this.cards.length; t++) s.push(this.cards[t].Y());
	    null === (t = this.u) || void 0 === t || t.I(STORAGE_KEYS.C.bs, s);
	  }
	  Es() {
	    this.ls && (clearTimeout(this.ls), (this.ls = null));
	  }
	  Is() {
	    null != this.us && (clearTimeout(this.us), (this.us = null));
	  }
	  Js(t = 1e3 * this.fs, s, i) {
	    this.Is(),
	      (this.us = window.setTimeout(() => {
	        this.qs(s, i, !0);
	      }, t)),
	      (this.cs = t);
	  }
	  qs(t, s, i = !1, h = !0) {
	    var r;
	    const n = this.$t,
	      l = this.u;
	    if (!n || !l) return void ("function" == typeof s && s());
	    if ((!i && (this.Es(), this.Fs(0)), !this.Ds()))
	      return void (
	        null === (r = this.qt) ||
	        void 0 === r ||
	        r.Ms(() => {
	          this.qs(t, s);
	        })
	      );
	    h && this.Is();
	    const a = n.$s({}, !0);
	    l.j(STORAGE_KEYS.C.Us) !== e.ks() && this.Bs(),
	      (a.last_full_sync_at = this.Kt),
	      (a.last_card_updated_at = this.Qt);
	    const u = n.Ps(a, D._s.Xs, i);
	    let c = !1;
	    n.Gs(
	      a,
	      (i = -1) => {
	        if (this.u) {
	          const t = new Date().valueOf();
	          D.Hs(this.u, D._s.Xs, t);
	        }
	        -1 !== i && u.push(["X-Braze-Req-Tokens-Remaining", i.toString()]),
	          C.Ks({
	            url: `${n.Os()}/content_cards/sync`,
	            data: a,
	            headers: u,
	            L: (i, e) => {
	              if (!n.Qs(a, i, u))
	                return (c = !0), void ("function" == typeof s && s());
	              n.Vs(),
	                this.zs(e, t, s),
	                this.Ss(i),
	                (c = !1),
	                D.Ws(this.u, D._s.Xs, 1),
	                "function" == typeof t && t();
	            },
	            error: (t) => {
	              n.Ys(t, "retrieving content cards"),
	                (c = !0),
	                "function" == typeof s && s();
	            },
	            Zs: () => {
	              if (c && h && !this.us && this.ds + 1 < MAX_ERROR_RETRIES_CONTENT_CARDS) {
	                D.ti(this.u, D._s.Xs);
	                let i = this.cs;
	                (null == i || i < 1e3 * this.fs) && (i = 1e3 * this.fs),
	                  this.Js(Math.min(3e5, randomInclusive(1e3 * this.fs, 3 * i)), t, s),
	                  (this.ds = this.ds + 1);
	              }
	            },
	          });
	      },
	      D._s.Xs,
	      s,
	    );
	  }
	  As(t) {
	    t || this.Yt();
	    const s = this.gs(this.cards);
	    s.sort((t, s) =>
	      t.pinned && !s.pinned
	        ? -1
	        : s.pinned && !t.pinned
	        ? 1
	        : t.updated && s.updated && t.updated > s.updated
	        ? -1
	        : t.updated && s.updated && s.updated > t.updated
	        ? 1
	        : 0,
	    );
	    let i = Math.max(this.Qt || 0, this.Kt || 0);
	    return (
	      0 === i && (i = void 0),
	      this.u && this.u.j(STORAGE_KEYS.C.Rs) === this.Qt && void 0 === i && (i = this.Qt),
	      new ContentCards(s, dateFromUnixTimestamp(i))
	    );
	  }
	  si(t) {
	    return this.Bt.Nt(t);
	  }
	  Bs() {
	    (this.Kt = 0),
	      (this.Qt = 0),
	      this.u && (this.u.ii(STORAGE_KEYS.C.js), this.u.ii(STORAGE_KEYS.C.Rs));
	  }
	  changeUser(t) {
	    t ||
	      ((this.cards = []),
	      this.Bt.Rt(new ContentCards(this.cards.slice(), null)),
	      this.u &&
	        (this.u.ii(STORAGE_KEYS.C.bs),
	        this.u.ii(STORAGE_KEYS.C.v),
	        this.u.ii(STORAGE_KEYS.C.H),
	        this.u.ii(STORAGE_KEYS.C.A))),
	      this.Bs();
	  }
	  clearData(t) {
	    (this.Kt = 0),
	      (this.Qt = 0),
	      (this.cards = []),
	      this.Bt.Rt(new ContentCards(this.cards.slice(), null)),
	      t &&
	        this.u &&
	        (this.u.ii(STORAGE_KEYS.C.bs),
	        this.u.ii(STORAGE_KEYS.C.v),
	        this.u.ii(STORAGE_KEYS.C.H),
	        this.u.ii(STORAGE_KEYS.C.A),
	        this.u.ii(STORAGE_KEYS.C.js),
	        this.u.ii(STORAGE_KEYS.C.Rs));
	  }
	  Ds() {
	    return (
	      !!this.qt && (!!this.qt.ei() || (0 !== this.qt.hi() && this.ri(), !1))
	    );
	  }
	  ri() {
	    this.Bt.Rt(new ContentCards([], new Date())), this.u && this.u.ii(STORAGE_KEYS.C.bs);
	  }
	}

	const g = {
	  t: !1,
	  provider: null,
	  rr: () => (
	    g.o(),
	    g.provider ||
	      ((g.provider = new v(e.er(), e.l(), e.ir(), e.tr(), e.nr())),
	      e.ar(g.provider)),
	    g.provider
	  ),
	  o: () => {
	    g.t || (e.g(g), (g.t = !0));
	  },
	  destroy: () => {
	    (g.provider = null), (g.t = !1);
	  },
	};
	var g$1 = g;

	function requestContentCardsRefresh(r, t) {
	  if (e.X()) return g$1.rr().qs(r, t);
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
	    return logCardClick(r, !0);
	  }
	  sr() {
	    requestContentCardsRefresh();
	  }
	  dr() {
	    return !0;
	  }
	}
	ContentCards.ur = 6e4;

	function getCachedContentCards() {
	  if (e.X()) return g$1.rr().As(!1);
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
	    if (((a = o.T), a && o.imageUrl && "number" == typeof o.aspectRatio)) {
	      const t = n / o.aspectRatio;
	      t && (a.style.height = `${t}px`);
	    }
	}
	function cardToHtml(t, logCardClick, o, e = "ltr") {
	  const a = document.createElement("div");
	  (a.dir = e),
	    (a.className = "ab-card ab-effect-card " + t._),
	    t.id &&
	      (a.setAttribute("data-ab-card-id", t.id), a.setAttribute("id", t.id)),
	    a.setAttribute("role", "article"),
	    a.setAttribute("tabindex", "0");
	  let n = "",
	    i = !1;
	  t.url && "" !== t.url && ((n = t.url), (i = !0));
	  const r = (e) => (markCardAsRead(a), i && (logCardClick(t), _handleBrazeAction(n, o, e)), !1);
	  if (t.pinned) {
	    const t = document.createElement("div");
	    t.className = "ab-pinned-indicator";
	    const o = document.createElement("i");
	    (o.className = "fa fa-star"), t.appendChild(o), a.appendChild(t);
	  }
	  if (t.imageUrl && "" !== t.imageUrl) {
	    const o = document.createElement("div");
	    (o.dir = e), (o.className = "ab-image-area");
	    const d = document.createElement("img");
	    if (
	      (d.setAttribute("src", t.imageUrl),
	      (d.onload = () => {
	        a.style.height = "auto";
	      }),
	      _setImageAltText(t, d),
	      o.appendChild(d),
	      (a.className += " with-image"),
	      i && !t.S)
	    ) {
	      const t = document.createElement("a");
	      t.setAttribute("href", n),
	        (t.onclick = r),
	        t.appendChild(o),
	        a.appendChild(t);
	    } else a.appendChild(o);
	  }
	  const s = document.createElement("div");
	  if (((s.className = "ab-card-body"), (s.dir = e), t.dismissible)) {
	    t.logCardDismissal = () => logCardDismissal(t);
	    const o = createCloseButton("Dismiss Card", void 0, t.dismissCard.bind(t), e);
	    a.appendChild(o),
	      detectSwipe(s, DIRECTIONS.U, (t) => {
	        (a.className += " ab-swiped-left"), o.onclick(t);
	      }),
	      detectSwipe(s, DIRECTIONS.V, (t) => {
	        (a.className += " ab-swiped-right"), o.onclick(t);
	      });
	  }
	  let l = "",
	    b = !1;
	  if ((t.title && "" !== t.title && ((l = t.title), (b = !0)), b)) {
	    const t = document.createElement("h1");
	    if (
	      ((t.className = "ab-title"),
	      (t.id = p$1.W()),
	      a.setAttribute("aria-labelledby", t.id),
	      i)
	    ) {
	      const o = document.createElement("a");
	      o.setAttribute("href", n),
	        (o.onclick = r),
	        o.appendChild(document.createTextNode(l)),
	        t.appendChild(o);
	    } else t.appendChild(document.createTextNode(l));
	    s.appendChild(t);
	  }
	  const f = document.createElement("div");
	  if (
	    ((f.className = b ? "ab-description" : "ab-description ab-no-title"),
	    (f.id = p$1.W()),
	    a.setAttribute("aria-describedby", f.id),
	    t.description && f.appendChild(document.createTextNode(t.description)),
	    i)
	  ) {
	    const o = document.createElement("div");
	    o.className = "ab-url-area";
	    const e = document.createElement("a");
	    e.setAttribute("href", n),
	      t.linkText && e.appendChild(document.createTextNode(t.linkText)),
	      (e.onclick = r),
	      o.appendChild(e),
	      f.appendChild(o);
	  }
	  s.appendChild(f), a.appendChild(s);
	  const x = document.createElement("div");
	  return (
	    (x.className = "ab-unread-indicator"),
	    t.viewed && (x.className += " read"),
	    a.appendChild(x),
	    (t.T = a),
	    a
	  );
	}

	function removeSubscription(r) {
	  e.X() && e.removeSubscription(r);
	}

	const LAST_REQUESTED_REFRESH_DATA_ATTRIBUTE =
	  "data-last-requested-refresh";
	const scrollListeners = {};
	function destroyFeedHtml(e) {
	  e &&
	    ((e.className = e.className.replace("ab-show", "ab-hide")),
	    setTimeout(() => {
	      e && e.parentNode && e.parentNode.removeChild(e);
	    }, x.Ah));
	  const t = e.getAttribute("data-update-subscription-id");
	  null != t && removeSubscription(t);
	  const o = e.getAttribute("data-listener-id");
	  null != o &&
	    (window.removeEventListener("scroll", scrollListeners[o]),
	    delete scrollListeners[o]);
	}
	function generateFeedBody(e, t) {
	  const o = ue.m(),
	    s = document.createElement("div");
	  if (
	    ((s.className = "ab-feed-body"),
	    s.setAttribute("aria-label", "Feed"),
	    s.setAttribute("role", "feed"),
	    null == e.lastUpdated)
	  ) {
	    const e = document.createElement("div");
	    e.className = "ab-no-cards-message";
	    const t = document.createElement("i");
	    (t.className = "fa fa-spinner fa-spin fa-4x ab-initial-spinner"),
	      e.appendChild(t),
	      s.appendChild(e);
	  } else {
	    let n = !1;
	    const logCardClick = (t) => e.logCardClick(t);
	    for (const i of e.cards) {
	      const a = i instanceof ControlCard;
	      !a || e.dr()
	        ? (s.appendChild(cardToHtml(i, logCardClick, t, o.wo())), (n = n || !a))
	        : r$1.error(
	            "Received a control card for a legacy news feed. Control cards are only supported with content cards.",
	          );
	    }
	    if (!n) {
	      const e = document.createElement("div");
	      (e.className = "ab-no-cards-message"),
	        (e.innerHTML = o.get("NO_CARDS_MESSAGE") || ""),
	        e.setAttribute("role", "article"),
	        s.appendChild(e);
	    }
	  }
	  return s;
	}
	function detectFeedImpressions(e, t) {
	  if (null != e && null != t) {
	    const o = [],
	      s = t.querySelectorAll(".ab-card");
	    e.yo || (e.yo = {});
	    for (let t = 0; t < s.length; t++) {
	      const n = getCardId(s[t]),
	        r = topIsInView(s[t]),
	        i = bottomIsInView(s[t]);
	      if (e.yo[n]) {
	        r || i || markCardAsRead(s[t]);
	        continue;
	      }
	      let a = topHadImpression(s[t]),
	        d = bottomHadImpression(s[t]);
	      const l = a,
	        c = d;
	      if (
	        (!a && r && ((a = !0), impressOnTop(s[t])),
	        !d && i && ((d = !0), impressOnBottom(s[t])),
	        a && d)
	      ) {
	        if (l && c) continue;
	        for (const t of e.cards)
	          if (t.id === n) {
	            (e.yo[t.id] = !0), o.push(t);
	            break;
	          }
	      }
	    }
	    o.length > 0 && e.logCardImpressions(o);
	  }
	}
	function refreshFeed(e, t) {
	  if (null == e || null == t) return;
	  t.setAttribute("aria-busy", "true");
	  const o = t.querySelectorAll(".ab-refresh-button")[0];
	  null != o && (o.className += " fa-spin");
	  const s = new Date().valueOf().toString();
	  t.setAttribute("data-last-requested-refresh", s),
	    setTimeout(() => {
	      if (t.getAttribute("data-last-requested-refresh") === s) {
	        const e = t.querySelectorAll(".fa-spin");
	        for (let t = 0; t < e.length; t++)
	          e[t].className = e[t].className.replace(/fa-spin/g, "");
	        const o = t.querySelectorAll(".ab-initial-spinner")[0];
	        if (null != o) {
	          const e = document.createElement("span");
	          (e.innerHTML = ue.m().get("FEED_TIMEOUT_MESSAGE") || ""),
	            null != o.parentNode &&
	              (o.parentNode.appendChild(e), o.parentNode.removeChild(o));
	        }
	        "true" === t.getAttribute("aria-busy") &&
	          t.setAttribute("aria-busy", "false");
	      }
	    }, x.Co),
	    e.sr();
	}
	function feedToHtml(e, t, o) {
	  const s = document.createElement("div");
	  (s.className = "ab-feed ab-hide ab-effect-slide"),
	    s.setAttribute("role", "dialog"),
	    s.setAttribute("aria-label", "Feed"),
	    s.setAttribute("tabindex", "-1");
	  const n = document.createElement("div");
	  (n.className = "ab-feed-buttons-wrapper"),
	    n.setAttribute("role", "group"),
	    s.appendChild(n);
	  const r = document.createElement("i");
	  (r.className = "fa fa-times ab-close-button"),
	    r.setAttribute("aria-label", "Close Feed"),
	    r.setAttribute("tabindex", "0"),
	    r.setAttribute("role", "button");
	  const i = (e) => {
	    destroyFeedHtml(s), e.stopPropagation();
	  };
	  r.addEventListener("keydown", (e) => {
	    (e.keyCode !== KeyCodes.Fo && e.keyCode !== KeyCodes.To) || i(e);
	  }),
	    (r.onclick = i);
	  const a = document.createElement("i");
	  (a.className = "fa fa-refresh ab-refresh-button"),
	    e && null == e.lastUpdated && (a.className += " fa-spin"),
	    a.setAttribute("aria-label", "Refresh Feed"),
	    a.setAttribute("tabindex", "0"),
	    a.setAttribute("role", "button");
	  const d = (t) => {
	    refreshFeed(e, s), t.stopPropagation();
	  };
	  a.addEventListener("keydown", (e) => {
	    (e.keyCode !== KeyCodes.Fo && e.keyCode !== KeyCodes.To) || d(e);
	  }),
	    (a.onclick = d),
	    n.appendChild(a),
	    n.appendChild(r),
	    s.appendChild(generateFeedBody(e, t));
	  const l = () => detectFeedImpressions(e, s);
	  if ((s.addEventListener("scroll", l), !o)) {
	    window.addEventListener("scroll", l);
	    const e = p$1.W();
	    (scrollListeners[e] = l), s.setAttribute("data-listener-id", e);
	  }
	  return s;
	}
	function updateFeedCards(e, t, o, s, n) {
	  if (!isArray(t)) return;
	  const i = [];
	  for (const e of t)
	    if (e instanceof Card) {
	      if (e.url && BRAZE_ACTION_URI_REGEX.test(e.url)) {
	        const t = getDecodedBrazeAction(e.url);
	        if (containsUnknownBrazeAction(t)) {
	          r$1.error(ineligibleBrazeActionURLErrorMessage(INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Vi, "Content Card"));
	          continue;
	        }
	      }
	      i.push(e);
	    }
	  if (((e.cards = i), (e.lastUpdated = o), null != s))
	    if ((s.setAttribute("aria-busy", "false"), null == e.lastUpdated))
	      destroyFeedHtml(s);
	    else {
	      const t = s.querySelectorAll(".ab-feed-body")[0];
	      if (null != t) {
	        const o = generateFeedBody(e, n);
	        t.parentNode && t.parentNode.replaceChild(o, t),
	          detectFeedImpressions(e, o.parentNode);
	      }
	    }
	}
	function registerFeedSubscriptionId(e, t) {
	  e && t.setAttribute("data-update-subscription-id", e);
	}

	function hideContentCards(n) {
	  if (!e.X()) return;
	  const o = document.querySelectorAll(".ab-feed");
	  for (let e = 0; e < o.length; e++)
	    (null == n || (null != n && o[e].parentNode === n)) && destroyFeedHtml(o[e]);
	}

	function showContentCards(n, t) {
	  if (!e.X()) return;
	  setupFeedUI();
	  let o = !1;
	  null == n && ((n = document.body), (o = !0));
	  const i = e.nn(L.tn) || e.nn(L.en) || !1,
	    a = g$1.rr().As(!1);
	  "function" == typeof t && updateFeedCards(a, t(a.cards.slice()), a.lastUpdated, null, i);
	  const s = feedToHtml(a, i, o),
	    f = g$1.rr(),
	    l = f.ps();
	  (null == a.lastUpdated ||
	    new Date().valueOf() - a.lastUpdated.valueOf() > ContentCards.ur) &&
	    (null == l || new Date().valueOf() - l > ContentCards.ur) &&
	    (r$1.info(
	      `Cached content cards were older than max TTL of ${ContentCards.ur} ms, requesting an update from the server.`,
	    ),
	    refreshFeed(a, s),
	    f.vs(new Date().valueOf()));
	  const c = new Date().valueOf(),
	    u = subscribeToContentCardsUpdates(function (n) {
	      const e = s.querySelectorAll(".ab-refresh-button")[0];
	      if (null != e) {
	        let n = 500,
	          t = (n -= new Date().valueOf() - c);
	        const o = s.getAttribute(LAST_REQUESTED_REFRESH_DATA_ATTRIBUTE);
	        o && ((t = parseInt(o)), isNaN(t) || (n -= new Date().valueOf() - t)),
	          setTimeout(
	            function () {
	              e.className = e.className.replace(/fa-spin/g, "");
	            },
	            Math.max(n, 0),
	          );
	      }
	      let o = n.cards;
	      "function" == typeof t && (o = t(o.slice())),
	        updateFeedCards(a, o, n.lastUpdated, s, i);
	    });
	  registerFeedSubscriptionId(u, s);
	  const d = function (n) {
	    const t = n.querySelectorAll(".ab-feed");
	    let e = null;
	    for (let o = 0; o < t.length; o++) t[o].parentNode === n && (e = t[o]);
	    null != e
	      ? (destroyFeedHtml(e), null != e.parentNode && e.parentNode.replaceChild(s, e))
	      : n.appendChild(s),
	      setTimeout(function () {
	        s.className = s.className.replace("ab-hide", "ab-show");
	      }, 0),
	      o && s.focus(),
	      detectFeedImpressions(a, s),
	      setCardHeight(a.cards, n);
	  };
	  var m;
	  null != n
	    ? d(n)
	    : (window.onload =
	        ((m = window.onload),
	        function () {
	          "function" == typeof m && m(new Event("oldLoad")), d(document.body);
	        }));
	}

	function subscribeToContentCardsUpdates(r) {
	  if (!e.X()) return;
	  const t = g$1.rr(),
	    n = t.si(r);
	  if (!t.ws()) {
	    const r = e.cr();
	    if (r) {
	      const n = r.mr(() => {
	        t.qs();
	      });
	      n && t.Cs(n);
	    }
	  }
	  return n;
	}

	function toggleContentCards(n, o) {
	  e.X() &&
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
	  SHOPIFY: "shp",
	};

	function addSdkMetadata(a) {
	  if (!e.X()) return;
	  const t = e.nr();
	  if (t) {
	    if (!isArray(a))
	      return (
	        r$1.error("Cannot set SDK metadata because metadata is not an array."), !1
	      );
	    for (const t of a)
	      if (
	        !validateValueIsFromEnum(
	          BrazeSdkMetadata,
	          t,
	          "sdkMetadata contained an invalid value.",
	          "BrazeSdkMetadata",
	        )
	      )
	        return !1;
	    return t.addSdkMetadata(a), !0;
	  }
	}

	function changeUser(i, t) {
	  if (!e.X()) return;
	  if (null == i || 0 === i.length || i != i)
	    return void r$1.error("changeUser requires a non-empty userId.");
	  if (getByteLength(i) > User.lr)
	    return void r$1.error(
	      `Rejected user id "${i}" because it is longer than ${User.lr} bytes.`,
	    );
	  if (null != t && !validateStandardString(t, "set signature for new user", "signature")) return;
	  const n = e.cr();
	  n && n.changeUser(i.toString(), e.gr(), t);
	}

	var changeUser$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		changeUser: changeUser
	});

	function destroy() {
	  r$1.info("Destroying Braze instance"), e.destroy(!0);
	}

	function disableSDK() {
	  const n = e.cr();
	  n && n.requestImmediateDataFlush();
	  const s = new Q.ee(null, !0),
	    a = "This-cookie-will-expire-in-" + s.ne();
	  s.store(STORAGE_KEYS.se, a);
	  const i = A.ts.Zt;
	  new A(i, r$1).setItem(i.hs.ae, i.ie, !0),
	    r$1.info("disableSDK was called"),
	    e.destroy(!1),
	    e.oe(!0);
	}

	function enableSDK() {
	  new Q.ee(null, !0).remove(STORAGE_KEYS.se);
	  const a = A.ts.Zt;
	  new A(a, r$1).re(a.hs.ae, a.ie),
	    r$1.info("enableSDK was called"),
	    e.destroy(!1),
	    e.oe(!1);
	}

	function getDeviceId(t) {
	  if (!e.X()) return;
	  const i = e.te();
	  if (!i) return;
	  const n = i.ce().id;
	  if ("function" != typeof t) return n;
	  r$1.warn(
	    "The callback for getDeviceId is deprecated. You can access its return value directly instead (e.g. `const id = braze.getDeviceId()`)",
	  ),
	    t(n);
	}

	function initialize(i, n) {
	  return e.initialize(i, n);
	}

	function isDisabled() {
	  return !!new Q.ee(null, !0).br(STORAGE_KEYS.se);
	}

	function isInitialized() {
	  return e.so();
	}

	function logCustomEvent(o, n) {
	  if (!e.X()) return !1;
	  if (null == o || o.length <= 0)
	    return (
	      r$1.error(
	        `logCustomEvent requires a non-empty eventName, got "${o}". Ignoring event.`,
	      ),
	      !1
	    );
	  if (!validateCustomString(o, "log custom event", "the event name")) return !1;
	  const [s, m] = validateCustomProperties(
	    n,
	    LOG_CUSTOM_EVENT_STRING,
	    "eventProperties",
	    `log custom event "${o}"`,
	    "event",
	  );
	  if (!s) return !1;
	  const g = e.ir();
	  if (g && g.me(o))
	    return r$1.info(`Custom Event "${o}" is blocklisted, ignoring.`), !1;
	  const f = t$1.q(i.CustomEvent, { n: o, p: m });
	  if (f.L) {
	    r$1.info(`Logged custom event "${o}".`);
	    for (const t of f.ge) TriggersProviderFactory.rr().fe(tt.ue, [o, n], t);
	  }
	  return f.L;
	}

	var logCustomEvent$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		logCustomEvent: logCustomEvent
	});

	function logPurchase(o, n, s, D, u) {
	  if (!e.X()) return !1;
	  if (
	    (null == s && (s = "USD"), null == D && (D = 1), null == o || o.length <= 0)
	  )
	    return (
	      r$1.error(
	        `logPurchase requires a non-empty productId, got "${o}", ignoring.`,
	      ),
	      !1
	    );
	  if (!validateCustomString(o, "log purchase", "the purchase name")) return !1;
	  if (null == n || isNaN(parseFloat(n.toString())))
	    return (
	      r$1.error(`logPurchase requires a numeric price, got ${n}, ignoring.`), !1
	    );
	  const a = parseFloat(n.toString()).toFixed(2);
	  if (null == D || isNaN(parseInt(D.toString())))
	    return (
	      r$1.error(`logPurchase requires an integer quantity, got ${D}, ignoring.`),
	      !1
	    );
	  const g = parseInt(D.toString());
	  if (g < 1 || g > MAX_PURCHASE_QUANTITY)
	    return (
	      r$1.error(
	        `logPurchase requires a quantity >1 and <${MAX_PURCHASE_QUANTITY}, got ${g}, ignoring.`,
	      ),
	      !1
	    );
	  s = null != s ? s.toUpperCase() : s;
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
	      "ZWL",
	    ].indexOf(s)
	  )
	    return (
	      r$1.error(`logPurchase requires a valid currencyCode, got ${s}, ignoring.`),
	      !1
	    );
	  const [P, R] = validateCustomProperties(
	    u,
	    "logPurchase",
	    "purchaseProperties",
	    `log purchase "${o}"`,
	    "purchase",
	  );
	  if (!P) return !1;
	  const c = e.ir();
	  if (c && c.Dr(o))
	    return r$1.info(`Purchase "${o}" is blocklisted, ignoring.`), !1;
	  const l = t$1.q(i.Pr, { pid: o, c: s, p: a, q: g, pr: R });
	  if (l.L) {
	    r$1.info(`Logged ${g} purchase${g > 1 ? "s" : ""} of "${o}" for ${s} ${a}.`);
	    for (const r of l.ge) TriggersProviderFactory.rr().fe(tt.Rr, [o, u], r);
	  }
	  return l.L;
	}

	var logPurchase$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		logPurchase: logPurchase
	});

	function openSession() {
	  if (!e.X()) return;
	  const i = e.cr();
	  if (!i) return;
	  i.openSession();
	  const t = A.ts.Zt,
	    o = new A(t, r$1);
	  o.jr(t.hs.hr, (n, e) => {
	    const s = e.lastClick,
	      c = e.trackingString;
	    r$1.info(`Firing push click trigger from ${c} push click at ${s}`);
	    const g = i.kr(s, c),
	      f = function () {
	        TriggersProviderFactory.rr().fe(tt.vr, [c], g);
	      };
	    i.$r(f, f), o.re(t.hs.hr, n);
	  }),
	    o.ss(t.hs.wr, function (r) {
	      i.yr(r);
	    });
	}

	function removeAllSubscriptions() {
	  e.X() && e.removeAllSubscriptions();
	}

	function requestImmediateDataFlush(t) {
	  if (!e.X()) return;
	  const r = e.cr();
	  r && r.requestImmediateDataFlush(t);
	}

	var requestImmediateDataFlush$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		requestImmediateDataFlush: requestImmediateDataFlush
	});

	function setLogger(e) {
	  r$1.setLogger(e);
	}

	function setSdkAuthenticationSignature(t) {
	  if (!e.X()) return !1;
	  if ("" === t || !validateStandardString(t, "set signature", "signature", !1)) return !1;
	  const r = e.Sr();
	  return !!r && (r.setSdkAuthenticationSignature(t), !0);
	}

	function subscribeToSdkAuthenticationFailures(i) {
	  var r;
	  if (e.X())
	    return null === (r = e.Sr()) || void 0 === r
	      ? void 0
	      : r.subscribeToSdkAuthenticationFailures(i);
	}

	function toggleLogging() {
	  r$1.toggleLogging();
	}

	function wipeData() {
	  const o = e.l();
	  if (null == o) return void r$1.warn(BRAZE_MUST_BE_INITIALIZED_ERROR);
	  o.clearData();
	  const t = keys(A.ts);
	  for (let o = 0; o < t.length; o++) {
	    const n = t[o],
	      i = A.ts[n];
	    new A(i, r$1).clearData();
	  }
	  if (e.X()) for (const o of e.gr()) o.clearData(!0);
	}

	class ee extends y {
	  constructor(t, s) {
	    super(),
	      (this.u = t),
	      (this.Ui = s),
	      (this.cards = []),
	      (this.ki = null),
	      (this.u = t),
	      (this.Ui = s),
	      (this.Bt = new T()),
	      e.Ht(this.Bt),
	      this.Yt();
	  }
	  Yt() {
	    let t = [];
	    this.u && (t = this.u.j(STORAGE_KEYS.C.Ai) || []);
	    const s = [];
	    for (let i = 0; i < t.length; i++) {
	      const e = newCardFromSerializedValue(t[i]);
	      null != e && s.push(e);
	    }
	    (this.cards = s), this.u && (this.ki = rehydrateDateAfterJsonization(this.u.j(STORAGE_KEYS.C.Bi)));
	  }
	  Ei(t) {
	    const s = [];
	    let i = null,
	      e = {};
	    this.u && (e = this.u.j(STORAGE_KEYS.C.J) || {});
	    const r = {};
	    for (let h = 0; h < t.length; h++) {
	      i = t[h];
	      const o = newCardFromFeedJson(i);
	      if (null != o) {
	        const t = o.id;
	        t && e[t] && ((o.viewed = !0), (r[t] = !0)), s.push(o);
	      }
	    }
	    (this.cards = s),
	      this.Ts(),
	      (this.ki = new Date()),
	      this.u && (this.u.I(STORAGE_KEYS.C.J, r), this.u.I(STORAGE_KEYS.C.Bi, this.ki));
	  }
	  Ts() {
	    var t;
	    const s = [];
	    for (let t = 0; t < this.cards.length; t++) s.push(this.cards[t].Y());
	    null === (t = this.u) || void 0 === t || t.I(STORAGE_KEYS.C.Ai, s);
	  }
	  Ss(t) {
	    null != t &&
	      t.feed &&
	      (this.Yt(),
	      this.Ei(t.feed),
	      this.Bt.Rt(new Feed(this.cards.slice(), this.ki)));
	  }
	  Gi() {
	    this.Yt();
	    const t = [],
	      s = new Date();
	    for (let i = 0; i < this.cards.length; i++) {
	      const e = this.cards[i].expiresAt;
	      let r = !0;
	      null != e && (r = e >= s), r && t.push(this.cards[i]);
	    }
	    return new Feed(t, this.ki);
	  }
	  qs() {
	    this.Ui && this.Ui.requestFeedRefresh();
	  }
	  si(t) {
	    return this.Bt.Nt(t);
	  }
	  clearData(t) {
	    null == t && (t = !1),
	      (this.cards = []),
	      (this.ki = null),
	      t && this.u && (this.u.ii(STORAGE_KEYS.C.Ai), this.u.ii(STORAGE_KEYS.C.Bi)),
	      this.Bt.Rt(new Feed(this.cards.slice(), this.ki));
	  }
	}

	const re = {
	  t: !1,
	  provider: null,
	  rr: () => (
	    re.o(),
	    re.provider || ((re.provider = new ee(e.l(), e.cr())), e.ar(re.provider)),
	    re.provider
	  ),
	  o: () => {
	    re.t || (e.g(re), (re.t = !0));
	  },
	  destroy: () => {
	    (re.provider = null), (re.t = !1);
	  },
	};
	var re$1 = re;

	function requestFeedRefresh() {
	  if (e.X()) return re$1.rr().qs();
	}

	class Feed extends x {
	  constructor(r, e) {
	    super(r, e);
	  }
	  logCardImpressions(r) {
	    logCardImpressions(r, !1);
	  }
	  logCardClick(r) {
	    return logCardClick(r, !1);
	  }
	  sr() {
	    requestFeedRefresh();
	  }
	  dr() {
	    return !1;
	  }
	}

	function getCachedFeed() {
	  if (e.X()) return re$1.rr().Gi();
	}

	function destroyFeed() {
	  if (!e.X()) return;
	  const o = document.querySelectorAll(".ab-feed");
	  for (let e = 0; e < o.length; e++) destroyFeedHtml(o[e]);
	}

	function logFeedDisplayed() {
	  var r;
	  if (e.X())
	    return null === (r = e.nr()) || void 0 === r ? void 0 : r.qr(or.Ar).L;
	}

	function showFeed(t, n, o) {
	  if (!e.X()) return;
	  setupFeedUI();
	  const i = (e, t) => {
	      if (null == t) return e;
	      const n = [];
	      for (let e = 0; e < t.length; e++) n.push(t[e].toLowerCase());
	      const o = [];
	      for (let t = 0; t < e.length; t++) {
	        const r = [],
	          i = e[t].categories || [];
	        for (let e = 0; e < i.length; e++) r.push(i[e].toLowerCase());
	        intersection(r, n).length > 0 && o.push(e[t]);
	      }
	      return o;
	    },
	    s = e.nn(L.tn) || e.nn(L.en) || !1;
	  let l = !1;
	  null == t && ((t = document.body), (l = !0));
	  let f,
	    a = !1;
	  null == n
	    ? ((f = re$1.rr().Gi()),
	      updateFeedCards(f, i(f.cards, o), f.lastUpdated, null, s),
	      (a = !0))
	    : (f = new Feed(i(n, o), new Date()));
	  const u = feedToHtml(f, s, l);
	  if (a) {
	    (null == f.lastUpdated ||
	      new Date().valueOf() - f.lastUpdated.valueOf() > Feed.ur) &&
	      (r$1.info(
	        `Cached feed was older than max TTL of ${Feed.ur} ms, requesting an update from the server.`,
	      ),
	      refreshFeed(f, u));
	    const e = new Date().valueOf(),
	      t = subscribeToFeedUpdates(function (t) {
	        const n = u.querySelectorAll(".ab-refresh-button")[0];
	        if (null != n) {
	          let t = 500;
	          t -= new Date().valueOf() - e;
	          const o = u.getAttribute(LAST_REQUESTED_REFRESH_DATA_ATTRIBUTE);
	          if (o) {
	            const e = parseInt(o);
	            isNaN(e) || (t -= new Date().valueOf() - e);
	          }
	          setTimeout(
	            function () {
	              n.className = n.className.replace(/fa-spin/g, "");
	            },
	            Math.max(t, 0),
	          );
	        }
	        updateFeedCards(f, i(t.cards, o), t.lastUpdated, u, s);
	      });
	    registerFeedSubscriptionId(t, u);
	  }
	  const d = (e) => {
	    const t = e.querySelectorAll(".ab-feed");
	    let n = null;
	    for (let o = 0; o < t.length; o++) t[o].parentNode === e && (n = t[o]);
	    null != n
	      ? (destroyFeedHtml(n), n.parentNode && n.parentNode.replaceChild(u, n))
	      : e.appendChild(u),
	      setTimeout(function () {
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
	        function () {
	          "function" == typeof m && m(new Event("oldLoad")), d(document.body);
	        }));
	}

	var showFeed$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		showFeed: showFeed
	});

	function subscribeToFeedUpdates(r) {
	  if (e.X()) return re$1.rr().si(r);
	}

	function toggleFeed(o, n, r) {
	  e.X() &&
	    (document.querySelectorAll(".ab-feed").length > 0
	      ? destroyFeed()
	      : showFeed(o, n, r));
	}

	function isPushBlocked() {
	  if (e.X()) return yt$1.isPushBlocked();
	}

	function isPushPermissionGranted() {
	  if (e.X()) return yt$1.isPushPermissionGranted();
	}

	function isPushSupported() {
	  if (e.X()) return yt$1.isPushSupported();
	}

	class ea {
	  constructor(i, t, e, s, r, n, o, u, a, h, c) {
	    (this.sn = i),
	      (this.rn = t),
	      (this.on = e),
	      (this.un = r),
	      (this.an = n),
	      (this.hn = o),
	      (this.qt = u),
	      (this.cn = a),
	      (this.fn = h),
	      (this.u = c),
	      (this.sn = i),
	      (this.rn = t),
	      (this.on = e),
	      (this.ln = s + "/safari/" + t),
	      (this.un = r || "/service-worker.js"),
	      (this.hn = o),
	      (this.qt = u),
	      (this.cn = a || !1),
	      (this.fn = h || !1),
	      (this.u = c),
	      (this.dn = yt$1.pn()),
	      (this.bn = yt$1.yn());
	  }
	  mn() {
	    return this.fn;
	  }
	  gn(i, t, e, s, n) {
	    i.unsubscribe()
	      .then((i) => {
	        i
	          ? this.vn(t, e, s, n)
	          : (r$1.error("Failed to unsubscribe device from push."),
	            "function" == typeof n && n(!1));
	      })
	      .catch((i) => {
	        r$1.error("Push unsubscription error: " + i),
	          "function" == typeof n && n(!1);
	      });
	  }
	  wn(i, t, e) {
	    var s;
	    const n = ((i) => {
	      if ("string" == typeof i) return i;
	      if (0 !== i.endpoint.indexOf("https://android.googleapis.com/gcm/send"))
	        return i.endpoint;
	      let t = i.endpoint;
	      const e = i;
	      return (
	        e.kn &&
	          -1 === i.endpoint.indexOf(e.kn) &&
	          (t = i.endpoint + "/" + e.kn),
	        t
	      );
	    })(i);
	    let o = null,
	      u = null;
	    const a = i;
	    if (null != a.getKey)
	      try {
	        const i = Array.from(new Uint8Array(a.getKey("p256dh"))),
	          t = Array.from(new Uint8Array(a.getKey("auth")));
	        (o = btoa(String.fromCharCode.apply(null, i))),
	          (u = btoa(String.fromCharCode.apply(null, t)));
	      } catch (i) {
	        r$1.error(getErrorMessage(i));
	      }
	    const h = ((i) => {
	      let t;
	      return i.options &&
	        (t = i.options.applicationServerKey) &&
	        t.byteLength &&
	        t.byteLength > 0
	        ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(t))))
	            .replace(/\+/g, "-")
	            .replace(/\//g, "_")
	        : null;
	    })(a);
	    null === (s = this.sn) || void 0 === s || s.Pn(n, t, o, u, h),
	      n && "function" == typeof e && e(n, o, u);
	  }
	  Dn() {
	    var i;
	    null === (i = this.sn) || void 0 === i || i.Sn(!0);
	  }
	  An(i, t) {
	    var e;
	    null === (e = this.sn) || void 0 === e || e.Sn(!1),
	      r$1.info(i),
	      "function" == typeof t && t(!1);
	  }
	  jn(i, t, e, s) {
	    var n;
	    if ("default" === t.permission)
	      try {
	        window.safari.pushNotification.requestPermission(
	          this.ln,
	          i,
	          {
	            api_key: this.rn,
	            device_id:
	              (null === (n = this.on) || void 0 === n ? void 0 : n.ce().id) ||
	              "",
	          },
	          (t) => {
	            "granted" === t.permission &&
	              this.sn &&
	              this.sn.setPushNotificationSubscriptionType(
	                User.NotificationSubscriptionTypes.OPTED_IN,
	              ),
	              this.jn(i, t, e, s);
	          },
	        );
	      } catch (i) {
	        this.An("Could not request permission for push: " + i, s);
	      }
	    else
	      "denied" === t.permission
	        ? this.An(
	            "The user has blocked notifications from this site, or Safari push is not configured in the Braze dashboard.",
	            s,
	          )
	        : "granted" === t.permission &&
	          (r$1.info("Device successfully subscribed to push."),
	          this.wn(t.deviceToken, new Date(), e));
	  }
	  requestPermission(i, t, e) {
	    const s = (s) => {
	      switch (s) {
	        case "granted":
	          return void ("function" == typeof i && i());
	        case "default":
	          return void ("function" == typeof t && t());
	        case "denied":
	          return void ("function" == typeof e && e());
	        default:
	          r$1.error("Received unexpected permission result " + s);
	      }
	    };
	    let n = !1;
	    if ("default" !== window.Notification.permission)
	      s(Notification.permission);
	    else {
	      const i = window.Notification.requestPermission((i) => {
	        n && s(i);
	      });
	      i
	        ? i.then((i) => {
	            s(i);
	          })
	        : (n = !0);
	    }
	  }
	  vn(i, t, e, s) {
	    const n = { userVisibleOnly: !0 };
	    null != t && (n.applicationServerKey = t),
	      i.pushManager
	        .subscribe(n)
	        .then((i) => {
	          r$1.info("Device successfully subscribed to push."),
	            this.wn(i, new Date(), e);
	        })
	        .catch((i) => {
	          yt$1.isPushBlocked()
	            ? (r$1.info("Permission for push notifications was denied."),
	              "function" == typeof s && s(!1))
	            : (r$1.error("Push subscription failed: " + i),
	              "function" == typeof s && s(!0));
	        });
	  }
	  xn() {
	    if (this.cn) return navigator.serviceWorker.getRegistration(this.un);
	    const i = this.an ? { scope: this.an } : void 0;
	    return navigator.serviceWorker.register(this.un, i).then(() =>
	      navigator.serviceWorker.ready.then(
	        (i) => (
	          i &&
	            "function" == typeof i.update &&
	            i.update().catch((i) => {
	              r$1.info("ServiceWorker update failed: " + i);
	            }),
	          i
	        ),
	      ),
	    );
	  }
	  Nn(i) {
	    this.cn ||
	      (i.unregister(), r$1.info("Service worker successfully unregistered."));
	  }
	  subscribe(i, t) {
	    if (!yt$1.isPushSupported())
	      return r$1.info(ea.Un), void ("function" == typeof t && t(!1));
	    if (this.dn) {
	      if (!this.cn && null != window.location) {
	        let i = this.un;
	        -1 === i.indexOf(window.location.host) &&
	          (i = window.location.host + i),
	          -1 === i.indexOf(window.location.protocol) &&
	            (i = window.location.protocol + "//" + i);
	      }
	      if (yt$1.isPushBlocked())
	        return void this.An(
	          "Notifications from this site are blocked. This may be a temporary embargo or a permanent denial.",
	          t,
	        );
	      if (this.qt && !this.qt.Wn() && 0 === this.qt.hi())
	        return (
	          r$1.info(
	            "Waiting for VAPID key from server config before subscribing to push.",
	          ),
	          void this.qt._n(() => {
	            this.subscribe(i, t);
	          })
	        );
	      const e = () => {
	          r$1.info("Permission for push notifications was denied."),
	            "function" == typeof t && t(!1);
	        },
	        s = () => {
	          let i = "Permission for push notifications was ignored.";
	          yt$1.isPushBlocked() &&
	            (i +=
	              " The browser has automatically blocked further permission requests for a period (probably 1 week)."),
	            r$1.info(i),
	            "function" == typeof t && t(!0);
	        },
	        n = yt$1.isPushPermissionGranted(),
	        u = () => {
	          !n &&
	            this.sn &&
	            this.sn.setPushNotificationSubscriptionType(
	              User.NotificationSubscriptionTypes.OPTED_IN,
	            ),
	            this.xn()
	              .then((e) => {
	                if (null == e)
	                  return (
	                    r$1.error(
	                      "No service worker registration. Set the `manageServiceWorkerExternally` initialization option to false or ensure that your service worker is registered before calling registerPush.",
	                    ),
	                    void ("function" == typeof t && t(!0))
	                  );
	                e.pushManager
	                  .getSubscription()
	                  .then((s) => {
	                    var n;
	                    let u = null;
	                    if (
	                      (null !=
	                        (null === (n = this.qt) || void 0 === n
	                          ? void 0
	                          : n.Wn()) && (u = ei.Tn(this.qt.Wn())),
	                      s)
	                    ) {
	                      let n,
	                        a = null,
	                        h = null;
	                      if ((this.u && (n = this.u.j(STORAGE_KEYS.C.In)), n && !isArray(n))) {
	                        let i;
	                        try {
	                          i = ti.qn(n).Vn;
	                        } catch (t) {
	                          i = null;
	                        }
	                        null == i ||
	                          isNaN(i.getTime()) ||
	                          0 === i.getTime() ||
	                          ((a = i),
	                          (h = new Date(a)),
	                          h.setMonth(a.getMonth() + 6));
	                      }
	                      null != u &&
	                      s.options &&
	                      s.options.applicationServerKey &&
	                      s.options.applicationServerKey.byteLength &&
	                      s.options.applicationServerKey.byteLength > 0 &&
	                      !isEqual(u, new Uint8Array(s.options.applicationServerKey))
	                        ? (s.options.applicationServerKey.byteLength > 12
	                            ? r$1.info(
	                                "Device was already subscribed to push using a different VAPID provider, creating new subscription.",
	                              )
	                            : r$1.info(
	                                "Attempting to upgrade a gcm_sender_id-based push registration to VAPID - depending on the browser this may or may not result in the same gcm_sender_id-based subscription.",
	                              ),
	                          this.gn(s, e, u, i, t))
	                        : s.expirationTime &&
	                          new Date(s.expirationTime).valueOf() <=
	                            new Date().valueOf()
	                        ? (r$1.info(
	                            "Push subscription is expired, creating new subscription.",
	                          ),
	                          this.gn(s, e, u, i, t))
	                        : n && isArray(n)
	                        ? this.gn(s, e, u, i, t)
	                        : null == h
	                        ? (r$1.info(
	                            "No push subscription creation date found, creating new subscription.",
	                          ),
	                          this.gn(s, e, u, i, t))
	                        : h.valueOf() <= new Date().valueOf()
	                        ? (r$1.info(
	                            "Push subscription older than 6 months, creating new subscription.",
	                          ),
	                          this.gn(s, e, u, i, t))
	                        : (r$1.info(
	                            "Device already subscribed to push, sending existing subscription to backend.",
	                          ),
	                          this.wn(s, a, i));
	                    } else this.vn(e, u, i, t);
	                  })
	                  .catch((i) => {
	                    r$1.error("Error checking current push subscriptions: " + i);
	                  });
	              })
	              .catch((i) => {
	                r$1.error("ServiceWorker registration failed: " + i);
	              });
	        };
	      this.requestPermission(u, s, e);
	    } else if (this.bn) {
	      if (null == this.hn || "" === this.hn)
	        return (
	          r$1.error(
	            "You must supply the safariWebsitePushId initialization option in order to use registerPush on Safari",
	          ),
	          void ("function" == typeof t && t(!0))
	        );
	      const e = window.safari.pushNotification.permission(this.hn);
	      this.jn(this.hn, e, i, t);
	    }
	  }
	  unsubscribe(i, t) {
	    if (!yt$1.isPushSupported())
	      return r$1.info(ea.Un), void ("function" == typeof t && t());
	    this.dn
	      ? navigator.serviceWorker.getRegistration(this.un).then((e) => {
	          e
	            ? e.pushManager
	                .getSubscription()
	                .then((s) => {
	                  s
	                    ? (this.Dn(),
	                      s
	                        .unsubscribe()
	                        .then((s) => {
	                          s
	                            ? (r$1.info(
	                                "Device successfully unsubscribed from push.",
	                              ),
	                              "function" == typeof i && i())
	                            : (r$1.error(
	                                "Failed to unsubscribe device from push.",
	                              ),
	                              "function" == typeof t && t()),
	                            this.Nn(e);
	                        })
	                        .catch((i) => {
	                          r$1.error("Push unsubscription error: " + i),
	                            "function" == typeof t && t();
	                        }))
	                    : (r$1.info("Device already unsubscribed from push."),
	                      "function" == typeof i && i());
	                })
	                .catch((i) => {
	                  r$1.error("Error unsubscribing from push: " + i),
	                    "function" == typeof t && t();
	                })
	            : (r$1.info("Device already unsubscribed from push."),
	              "function" == typeof i && i());
	        })
	      : this.bn &&
	        (this.Dn(),
	        r$1.info("Device unsubscribed from push."),
	        "function" == typeof i && i());
	  }
	}
	ea.Un = "Push notifications are not supported in this browser.";

	const na = {
	  t: !1,
	  i: null,
	  m: () => (
	    na.o(),
	    na.i ||
	      (na.i = new ea(
	        e.pr(),
	        e.ba(),
	        e.te(),
	        e.Os(),
	        e.nn(L.Ma),
	        e.nn(L._a),
	        e.nn(L.ka),
	        e.ir(),
	        e.nn(L.qa),
	        e.nn(L.Aa),
	        e.l(),
	      )),
	    na.i
	  ),
	  o: () => {
	    na.t || (e.g(na), (na.t = !0));
	  },
	  destroy: () => {
	    (na.i = null), (na.t = !1);
	  },
	};
	var na$1 = na;

	var pushManagerFactory = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': na$1
	});

	function requestPushPermission(r, n) {
	  if (e.X())
	    return na$1.m().subscribe((n, o, t) => {
	      const s = e.cr();
	      s && s.requestImmediateDataFlush(), "function" == typeof r && r(n, o, t);
	    }, n);
	}

	var requestPushPermission$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		requestPushPermission: requestPushPermission
	});

	function unregisterPush(r, n) {
	  if (e.X()) return na$1.m().unsubscribe(r, n);
	}

	var unregisterPush$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		unregisterPush: unregisterPush
	});

	class FeatureFlag {
	  constructor(t, e = !1, r = {}, i) {
	    (this.id = t),
	      (this.enabled = e),
	      (this.properties = r),
	      (this.trackingString = i),
	      (this.id = t),
	      (this.enabled = e),
	      (this.properties = r),
	      (this.trackingString = i);
	  }
	  he(t, e, r) {
	    const i = this.properties[t];
	    return null == i ? (this.ye(t), null) : e(i) ? i.value : (this.Pe(r), null);
	  }
	  getStringProperty(t) {
	    return this.he(t, this.be, "string");
	  }
	  getNumberProperty(t) {
	    return this.he(t, this.Ie, "number");
	  }
	  getBooleanProperty(t) {
	    return this.he(t, this.de, "boolean");
	  }
	  getImageProperty(t) {
	    return this.he(t, this.Te, "image");
	  }
	  getJsonProperty(t) {
	    return this.he(t, this.Ee, "jsonobject");
	  }
	  getTimestampProperty(t) {
	    return this.he(t, this.Ne, "datetime");
	  }
	  Y() {
	    const t = {};
	    return (
	      (t[FeatureFlag.tt.ht] = this.id),
	      (t[FeatureFlag.tt.le] = this.enabled),
	      (t[FeatureFlag.tt.pe] = this.properties),
	      (t[FeatureFlag.tt.Fe] = this.trackingString),
	      t
	    );
	  }
	  Pe(t) {
	    r$1.info(`Property is not of type ${t}.`);
	  }
	  ye(t) {
	    r$1.info(`${t} not found in feature flag properties.`);
	  }
	  be(t) {
	    return "string" === t.type && "string" == typeof t.value;
	  }
	  Ie(t) {
	    return "number" === t.type && "number" == typeof t.value;
	  }
	  de(t) {
	    return "boolean" === t.type && "boolean" == typeof t.value;
	  }
	  Te(t) {
	    return "image" === t.type && "string" == typeof t.value;
	  }
	  Ee(t) {
	    return (
	      "jsonobject" === t.type &&
	      "object" == typeof t.value &&
	      t.value.constructor == Object
	    );
	  }
	  Ne(t) {
	    return "datetime" === t.type && "number" == typeof t.value;
	  }
	}
	(FeatureFlag.tt = { ht: "id", le: "e", pe: "pr", Fe: "fts" }),
	  (FeatureFlag._t = { ht: "id", le: "enabled", pe: "properties", Fe: "fts" });

	function newFeatureFlagFromJson(e) {
	  if (e[FeatureFlag._t.ht] && "boolean" == typeof e[FeatureFlag._t.le])
	    return new FeatureFlag(
	      e[FeatureFlag._t.ht],
	      e[FeatureFlag._t.le],
	      e[FeatureFlag._t.pe],
	      e[FeatureFlag._t.Fe],
	    );
	  r$1.info(`Unable to create feature flag from ${JSON.stringify(e, null, 2)}`);
	}
	function newFeatureFlagFromSerializedValue(e) {
	  if (e[FeatureFlag.tt.ht] && "boolean" == typeof e[FeatureFlag.tt.le])
	    return new FeatureFlag(
	      e[FeatureFlag.tt.ht],
	      e[FeatureFlag.tt.le],
	      e[FeatureFlag.tt.pe],
	      e[FeatureFlag.tt.Fe],
	    );
	  r$1.info(
	    `Unable to deserialize feature flag from ${JSON.stringify(e, null, 2)}`,
	  );
	}

	class er extends y {
	  constructor(t, s, i, r) {
	    super(),
	      (this.qt = t),
	      (this.$t = s),
	      (this.u = i),
	      (this.oi = r),
	      (this.ai = []),
	      (this.ni = 0),
	      (this.qt = t),
	      (this.$t = s),
	      (this.u = i),
	      (this.oi = r),
	      (this.li = null),
	      (this.ui = new T()),
	      (this.fi = 10),
	      (this.ci = null),
	      (this.di = null),
	      e.Ht(this.ui);
	  }
	  Ss(t) {
	    var s;
	    if (
	      (null === (s = this.qt) || void 0 === s ? void 0 : s.mi()) &&
	      null != t &&
	      t.feature_flags
	    ) {
	      this.ai = [];
	      for (const s of t.feature_flags) {
	        const t = newFeatureFlagFromJson(s);
	        t && this.ai.push(t);
	      }
	      (this.ni = new Date().getTime()), this.gi(), this.ui.Rt(this.ai);
	    }
	  }
	  Fi() {
	    let t = {};
	    this.u && (t = this.u.j(STORAGE_KEYS.C.vi));
	    const s = {};
	    for (const i in t) {
	      const e = newFeatureFlagFromSerializedValue(t[i]);
	      e && (s[e.id] = e);
	    }
	    return s;
	  }
	  pi() {
	    var t;
	    return (null === (t = this.u) || void 0 === t ? void 0 : t.j(STORAGE_KEYS.C.wi)) || {};
	  }
	  ji(t) {
	    this.u && this.u.I(STORAGE_KEYS.C.wi, t);
	  }
	  si(t) {
	    return this.ui.Nt(t);
	  }
	  refreshFeatureFlags(t, s, i = !1, e = !0) {
	    const r = () => {
	      "function" == typeof s && s(), this.ui.Rt(this.ai);
	    };
	    if (!this.yi(i))
	      return (
	        !this.li &&
	          this.qt &&
	          (this.li = this.qt.bi(() => {
	            this.refreshFeatureFlags(t, s);
	          })),
	        void r()
	      );
	    const h = this.$t;
	    if (!h) return void r();
	    e && this.Ci();
	    const o = h.$s({}, !0),
	      a = h.Ps(o, D._s.Ri);
	    let n = !1;
	    h.Gs(
	      o,
	      (h = -1) => {
	        if (!this.$t) return void r();
	        const l = new Date().valueOf();
	        D.Hs(this.u, D._s.Ri, l),
	          -1 !== h && a.push(["X-Braze-Req-Tokens-Remaining", h.toString()]),
	          C.Ks({
	            url: `${this.$t.Os()}/feature_flags/sync`,
	            headers: a,
	            data: o,
	            L: (s) => {
	              if (!this.$t.Qs(o, s, a)) return (n = !0), void r();
	              this.$t.Vs(),
	                this.Ss(s),
	                (n = !1),
	                D.Ws(this.u, D._s.Ri, 1),
	                "function" == typeof t && t();
	            },
	            error: (t) => {
	              this.$t.Ys(t, "retrieving feature flags"), (n = !0), r();
	            },
	            Zs: () => {
	              if (e && n && !this.di) {
	                D.ti(this.u, D._s.Ri);
	                let e = this.ci;
	                (null == e || e < 1e3 * this.fi) && (e = 1e3 * this.fi),
	                  this.Ti(Math.min(3e5, randomInclusive(1e3 * this.fi, 3 * e)), t, s, i);
	              }
	            },
	          });
	      },
	      D._s.Ri,
	      s,
	    );
	  }
	  Ci() {
	    null != this.di && (clearTimeout(this.di), (this.di = null));
	  }
	  Ti(t = 1e3 * this.fi, s, i, e = !1) {
	    this.Ci(),
	      (this.di = window.setTimeout(() => {
	        this.refreshFeatureFlags(s, i, e);
	      }, t)),
	      (this.ci = t);
	  }
	  yi(t) {
	    if (!this.qt) return !1;
	    if (!t) {
	      const t = this.qt.Di();
	      if (null == t) return !1;
	      let s = !1;
	      if (!isNaN(t)) {
	        if (-1 === t) return r$1.info("Feature flag refreshes not allowed"), !1;
	        s = new Date().getTime() >= (this.ni || 0) + 1e3 * t;
	      }
	      if (!s)
	        return (
	          r$1.info(`Feature flag refreshes were rate limited to ${t} seconds`), !1
	        );
	    }
	    return this.qt.mi();
	  }
	  Ii() {
	    var t;
	    return (
	      (null === (t = this.u) || void 0 === t ? void 0 : t.j(STORAGE_KEYS.C.Si)) || null
	    );
	  }
	  qi() {
	    var t, s;
	    null === (t = this.u) ||
	      void 0 === t ||
	      t.I(STORAGE_KEYS.C.Si, null === (s = this.oi) || void 0 === s ? void 0 : s.xi());
	  }
	  Ni() {
	    var t;
	    const s = null === (t = this.oi) || void 0 === t ? void 0 : t.xi(),
	      i = this.Ii();
	    return null == i || s === i;
	  }
	  gi() {
	    if (!this.u) return;
	    const t = {};
	    for (const s of this.ai) {
	      const i = s.Y();
	      t[s.id] = i;
	    }
	    this.u.I(STORAGE_KEYS.C.vi, t), this.u.I(STORAGE_KEYS.C.zi, this.ni), this.qi();
	  }
	}

	const ir = {
	  t: !1,
	  provider: null,
	  rr: () => (
	    ir.o(),
	    ir.provider ||
	      ((ir.provider = new er(e.ir(), e.nr(), e.l(), e.zr())),
	      e.ar(ir.provider)),
	    ir.provider
	  ),
	  o: () => {
	    ir.t || (e.g(ir), (ir.t = !0));
	  },
	  destroy: () => {
	    (ir.provider = null), (ir.t = !1);
	  },
	};
	var ir$1 = ir;

	function tr(r, t, a = !1) {
	  if (e.X()) return ir$1.rr().refreshFeatureFlags(r, t, a);
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
	  if (!e.X()) return;
	  const n = e.ir();
	  if (n && !n.mi()) return r$1.info("Feature flags are not enabled."), null;
	  const a = ir$1.rr().Fi();
	  return a[t] ? a[t] : null;
	}

	function getAllFeatureFlags() {
	  if (!e.X()) return;
	  const t = [],
	    n = e.ir();
	  if (n && !n.mi()) return r$1.info("Feature flags are not enabled."), t;
	  const o = ir$1.rr().Fi();
	  for (const r in o) t.push(o[r]);
	  return t;
	}

	function subscribeToFeatureFlagsUpdates(r) {
	  if (!e.X()) return;
	  const t = ir$1.rr();
	  if (t.Ni()) {
	    const t = getAllFeatureFlags();
	    t && "function" == typeof r && r(t);
	  }
	  return t.si(r);
	}

	function logFeatureFlagImpression(o) {
	  if (!e.X()) return;
	  if (!o) return !1;
	  const n =
	      "Not logging a feature flag impression. The feature flag was not part of any matching experiment.",
	    s = ir$1.rr().Fi();
	  if (!s[o]) return r$1.info(n), !1;
	  const a = s[o].trackingString;
	  if (!a) return r$1.info(n), !1;
	  const f = ir$1.rr().pi();
	  if (f[a])
	    return (
	      r$1.info(
	        "Not logging another feature flag impression. This ID was already logged this session.",
	      ),
	      !1
	    );
	  (f[a] = !0), ir$1.rr().ji(f);
	  const g = { fid: o, fts: a };
	  return t$1.q(i.Fr, g).L;
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
		ImageOnly: ImageOnly,
		CaptionedImage: CaptionedImage,
		ClassicCard: ClassicCard,
		ControlCard: ControlCard,
		ContentCards: ContentCards,
		getCachedContentCards: getCachedContentCards,
		hideContentCards: hideContentCards,
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
		isInitialized: isInitialized,
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
		deferInAppMessage: deferInAppMessage,
		getDeferredInAppMessage: getDeferredInAppMessage,
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
		getAllFeatureFlags: getAllFeatureFlags,
		logFeatureFlagImpression: logFeatureFlagImpression
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
	    suffix = 'v5',
	    moduleId = 28,
	    version = '5.0.3',
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
	    '07': 'sdk.iad-07.braze.com',
	    '08': 'sdk.iad-08.braze.com',
	    EU: 'sdk.fra-01.braze.eu',
	    EU02: 'sdk.fra-02.braze.eu',
	    AU: 'sdk.au-01.braze.com',
	};

	var constructor = function() {
	    var self = this,
	        forwarderSettings,
	        options = {},
	        reportingService,
	        hasConsentMappings,
	        parsedConsentMappings,
	        parsedSubscriptionGroupMapping = {},
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

	    function setSubscriptionGroups(key, value) {
	        var subscriptionGroupId = parsedSubscriptionGroupMapping[key];

	        if (typeof value !== 'boolean') {
	            kitLogger(
	                "Can't call setSubscriptionGroups on forwarder " +
	                    name +
	                    ', setSubscriptionGroups must set this value to a boolean'
	            );
	            return;
	        }

	        var action = value
	            ? 'addToSubscriptionGroup'
	            : 'removeFromSubscriptionGroup';
	        kitLogger('braze.getUser().' + action, subscriptionGroupId);
	        braze.getUser()[action](subscriptionGroupId);
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
	        if (key in DefaultAttributeMethods) {
	            return setDefaultAttribute(key, value);
	        }

	        if (parsedSubscriptionGroupMapping[key]) {
	            setSubscriptionGroups(key, value);
	            return;
	        }

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

	        braze.getUser().setCustomUserAttribute(sanitizedKey, sanitizedValue);
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
	        // https://www.braze.com/docs/developer_guide/platform_integration_guides/web/push_notifications/soft_push_prompt
	        braze.subscribeToInAppMessage(function(inAppMessage) {
	            var shouldDisplay = true;
	            var pushPrimer = false;
	            if (inAppMessage instanceof braze.InAppMessage) {
	                // access the key-value pairs, defined as `extras`
	                const keyValuePairs = inAppMessage.extras || {};
	                // check the value of our key `msg-id` defined in the Braze dashboard
	                if (keyValuePairs['msg-id'] === 'push-primer') {
	                    pushPrimer = true;
	                    // We don't want to display the soft push prompt to users on browsers
	                    // that don't support push, or if the user has already granted/blocked permission
	                    if (
	                        braze.isPushSupported() === false ||
	                        braze.isPushPermissionGranted() ||
	                        braze.isPushBlocked()
	                    ) {
	                        // do not call `showInAppMessage`
	                        shouldDisplay = false;
	                        return;
	                    }

	                    // user is eligible to receive the native prompt
	                    // register a click handler on one of the two buttons
	                    if (inAppMessage.buttons[0]) {
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
	            // If it is not a push primer, we should show the message if the setting for register_inapp === 'True'
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

	            if (forwarderSettings.subscriptionGroupMapping) {
	                parsedSubscriptionGroupMapping = decodeSubscriptionGroupMappings(
	                    forwarderSettings.subscriptionGroupMapping
	                );
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

	    function decodeSubscriptionGroupMappings(subscriptionGroupSetting) {
	        var subscriptionGroupIds = {};
	        try {
	            var decodedSetting = subscriptionGroupSetting.replace(
	                /&quot;/g,
	                '"'
	            );
	            var parsedSetting = JSON.parse(decodedSetting);
	            for (let subscriptionGroupMap of parsedSetting) {
	                var key = subscriptionGroupMap.map;
	                var value = subscriptionGroupMap.value;
	                subscriptionGroupIds[key] = value;
	            }
	        } catch (e) {
	            console.error(
	                'Unable to configure custom Braze subscription group mappings.'
	            );
	        }
	        return subscriptionGroupIds;
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
	    this.decodeSubscriptionGroupMappings = decodeSubscriptionGroupMappings;

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

	Object.defineProperty(exports, '__esModule', { value: true });

	return exports;

})({});
