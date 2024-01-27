import { r as react_reactServerExports, g as getDefaultExportFromCjs } from "./assets/react.react-server-yjb63mRX.js";
var server_edge$1 = { exports: {} };
var reactServerDomWebpackServer_edge_production_min = {};
var reactDom_reactServer = { exports: {} };
var reactDom_reactServer_production_min = {};
var e = { usingClientEntryPoint: false, Events: null, Dispatcher: { current: null } };
function f(b, a) {
  if ("font" === b)
    return "";
  if ("string" === typeof a)
    return "use-credentials" === a ? a : "";
}
var h = e.Dispatcher;
reactDom_reactServer_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = e;
reactDom_reactServer_production_min.preconnect = function(b, a) {
  var c = h.current;
  c && "string" === typeof b && (a ? (a = a.crossOrigin, a = "string" === typeof a ? "use-credentials" === a ? a : "" : void 0) : a = null, c.preconnect(b, a));
};
reactDom_reactServer_production_min.prefetchDNS = function(b) {
  var a = h.current;
  a && "string" === typeof b && a.prefetchDNS(b);
};
reactDom_reactServer_production_min.preinit = function(b, a) {
  var c = h.current;
  if (c && "string" === typeof b && a && "string" === typeof a.as) {
    var d = a.as, g = f(d, a.crossOrigin), k = "string" === typeof a.integrity ? a.integrity : void 0, l = "string" === typeof a.fetchPriority ? a.fetchPriority : void 0;
    "style" === d ? c.preinitStyle(b, "string" === typeof a.precedence ? a.precedence : void 0, { crossOrigin: g, integrity: k, fetchPriority: l }) : "script" === d && c.preinitScript(b, { crossOrigin: g, integrity: k, fetchPriority: l, nonce: "string" === typeof a.nonce ? a.nonce : void 0 });
  }
};
reactDom_reactServer_production_min.preinitModule = function(b, a) {
  var c = h.current;
  if (c && "string" === typeof b)
    if ("object" === typeof a && null !== a) {
      if (null == a.as || "script" === a.as) {
        var d = f(a.as, a.crossOrigin);
        c.preinitModuleScript(b, { crossOrigin: d, integrity: "string" === typeof a.integrity ? a.integrity : void 0, nonce: "string" === typeof a.nonce ? a.nonce : void 0 });
      }
    } else
      null == a && c.preinitModuleScript(b);
};
reactDom_reactServer_production_min.preload = function(b, a) {
  var c = h.current;
  if (c && "string" === typeof b && "object" === typeof a && null !== a && "string" === typeof a.as) {
    var d = a.as, g = f(d, a.crossOrigin);
    c.preload(b, d, { crossOrigin: g, integrity: "string" === typeof a.integrity ? a.integrity : void 0, nonce: "string" === typeof a.nonce ? a.nonce : void 0, type: "string" === typeof a.type ? a.type : void 0, fetchPriority: "string" === typeof a.fetchPriority ? a.fetchPriority : void 0, referrerPolicy: "string" === typeof a.referrerPolicy ? a.referrerPolicy : void 0, imageSrcSet: "string" === typeof a.imageSrcSet ? a.imageSrcSet : void 0, imageSizes: "string" === typeof a.imageSizes ? a.imageSizes : void 0 });
  }
};
reactDom_reactServer_production_min.preloadModule = function(b, a) {
  var c = h.current;
  if (c && "string" === typeof b)
    if (a) {
      var d = f(a.as, a.crossOrigin);
      c.preloadModule(b, { as: "string" === typeof a.as && "script" !== a.as ? a.as : void 0, crossOrigin: d, integrity: "string" === typeof a.integrity ? a.integrity : void 0 });
    } else
      c.preloadModule(b);
};
{
  reactDom_reactServer.exports = reactDom_reactServer_production_min;
}
var reactDom_reactServerExports = reactDom_reactServer.exports;
var aa = react_reactServerExports, ba = reactDom_reactServerExports, m = null, n = 0;
function p(a, b) {
  if (0 !== b.byteLength)
    if (512 < b.byteLength)
      0 < n && (a.enqueue(new Uint8Array(m.buffer, 0, n)), m = new Uint8Array(512), n = 0), a.enqueue(b);
    else {
      var d = m.length - n;
      d < b.byteLength && (0 === d ? a.enqueue(m) : (m.set(b.subarray(0, d), n), a.enqueue(m), b = b.subarray(d)), m = new Uint8Array(512), n = 0);
      m.set(b, n);
      n += b.byteLength;
    }
  return true;
}
var q = new TextEncoder();
function ca(a, b) {
  "function" === typeof a.error ? a.error(b) : a.close();
}
var r = Symbol.for("react.client.reference"), t = Symbol.for("react.server.reference");
function u(a, b, d) {
  return Object.defineProperties(a, { $$typeof: { value: r }, $$id: { value: b }, $$async: { value: d } });
}
var da = Function.prototype.bind, ea = Array.prototype.slice;
function fa() {
  var a = da.apply(this, arguments);
  if (this.$$typeof === t) {
    var b = ea.call(arguments, 1);
    return Object.defineProperties(a, { $$typeof: { value: t }, $$id: { value: this.$$id }, $$bound: { value: this.$$bound ? this.$$bound.concat(b) : b }, bind: { value: fa } });
  }
  return a;
}
var ha = Promise.prototype, ia = { get: function(a, b) {
  switch (b) {
    case "$$typeof":
      return a.$$typeof;
    case "$$id":
      return a.$$id;
    case "$$async":
      return a.$$async;
    case "name":
      return a.name;
    case "displayName":
      return;
    case "defaultProps":
      return;
    case "toJSON":
      return;
    case Symbol.toPrimitive:
      return Object.prototype[Symbol.toPrimitive];
    case "Provider":
      throw Error("Cannot render a Client Context Provider on the Server. Instead, you can export a Client Component wrapper that itself renders a Client Context Provider.");
  }
  throw Error("Cannot access " + (String(a.name) + "." + String(b)) + " on the server. You cannot dot into a client module from a server component. You can only pass the imported name through.");
}, set: function() {
  throw Error("Cannot assign to a client module from a server module.");
} };
function ja(a, b) {
  switch (b) {
    case "$$typeof":
      return a.$$typeof;
    case "$$id":
      return a.$$id;
    case "$$async":
      return a.$$async;
    case "name":
      return a.name;
    case "defaultProps":
      return;
    case "toJSON":
      return;
    case Symbol.toPrimitive:
      return Object.prototype[Symbol.toPrimitive];
    case "__esModule":
      var d = a.$$id;
      a.default = u(function() {
        throw Error("Attempted to call the default export of " + d + " from the server but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
      }, a.$$id + "#", a.$$async);
      return true;
    case "then":
      if (a.then)
        return a.then;
      if (a.$$async)
        return;
      var c = u({}, a.$$id, true), e2 = new Proxy(c, ka);
      a.status = "fulfilled";
      a.value = e2;
      return a.then = u(function(f2) {
        return Promise.resolve(f2(e2));
      }, a.$$id + "#then", false);
  }
  c = a[b];
  c || (c = u(function() {
    throw Error("Attempted to call " + String(b) + "() from the server but " + String(b) + " is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
  }, a.$$id + "#" + b, a.$$async), Object.defineProperty(c, "name", { value: b }), c = a[b] = new Proxy(c, ia));
  return c;
}
var ka = { get: function(a, b) {
  return ja(a, b);
}, getOwnPropertyDescriptor: function(a, b) {
  var d = Object.getOwnPropertyDescriptor(a, b);
  d || (d = { value: ja(a, b), writable: false, configurable: false, enumerable: false }, Object.defineProperty(a, b, d));
  return d;
}, getPrototypeOf: function() {
  return ha;
}, set: function() {
  throw Error("Cannot assign to a client module from a server module.");
} }, sa = { prefetchDNS: la, preconnect: ma, preload: na, preloadModule: oa, preinitStyle: pa, preinitScript: qa, preinitModuleScript: ra };
function la(a) {
  if ("string" === typeof a && a) {
    var b = v();
    if (b) {
      var d = b.hints, c = "D|" + a;
      d.has(c) || (d.add(c), w(b, "D", a));
    }
  }
}
function ma(a, b) {
  if ("string" === typeof a) {
    var d = v();
    if (d) {
      var c = d.hints, e2 = "C|" + (null == b ? "null" : b) + "|" + a;
      c.has(e2) || (c.add(e2), "string" === typeof b ? w(d, "C", [a, b]) : w(d, "C", a));
    }
  }
}
function na(a, b, d) {
  if ("string" === typeof a) {
    var c = v();
    if (c) {
      var e2 = c.hints, f2 = "L";
      if ("image" === b && d) {
        var g = d.imageSrcSet, k = d.imageSizes, h2 = "";
        "string" === typeof g && "" !== g ? (h2 += "[" + g + "]", "string" === typeof k && (h2 += "[" + k + "]")) : h2 += "[][]" + a;
        f2 += "[image]" + h2;
      } else
        f2 += "[" + b + "]" + a;
      e2.has(f2) || (e2.add(f2), (d = y(d)) ? w(c, "L", [a, b, d]) : w(c, "L", [a, b]));
    }
  }
}
function oa(a, b) {
  if ("string" === typeof a) {
    var d = v();
    if (d) {
      var c = d.hints, e2 = "m|" + a;
      if (!c.has(e2))
        return c.add(e2), (b = y(b)) ? w(d, "m", [a, b]) : w(d, "m", a);
    }
  }
}
function pa(a, b, d) {
  if ("string" === typeof a) {
    var c = v();
    if (c) {
      var e2 = c.hints, f2 = "S|" + a;
      if (!e2.has(f2))
        return e2.add(f2), (d = y(d)) ? w(c, "S", [a, "string" === typeof b ? b : 0, d]) : "string" === typeof b ? w(c, "S", [a, b]) : w(c, "S", a);
    }
  }
}
function qa(a, b) {
  if ("string" === typeof a) {
    var d = v();
    if (d) {
      var c = d.hints, e2 = "X|" + a;
      if (!c.has(e2))
        return c.add(e2), (b = y(b)) ? w(d, "X", [a, b]) : w(d, "X", a);
    }
  }
}
function ra(a, b) {
  if ("string" === typeof a) {
    var d = v();
    if (d) {
      var c = d.hints, e2 = "M|" + a;
      if (!c.has(e2))
        return c.add(e2), (b = y(b)) ? w(d, "M", [a, b]) : w(d, "M", a);
    }
  }
}
function y(a) {
  if (null == a)
    return null;
  var b = false, d = {}, c;
  for (c in a)
    null != a[c] && (b = true, d[c] = a[c]);
  return b ? d : null;
}
var ta = ba.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Dispatcher, ua = "function" === typeof AsyncLocalStorage, va = ua ? new AsyncLocalStorage() : null;
"object" === typeof async_hooks ? async_hooks.createHook : function() {
  return { enable: function() {
  }, disable: function() {
  } };
};
"object" === typeof async_hooks ? async_hooks.executionAsyncId : null;
var z = Symbol.for("react.element"), wa = Symbol.for("react.fragment"), xa = Symbol.for("react.server_context"), ya = Symbol.for("react.forward_ref"), za = Symbol.for("react.suspense"), Aa = Symbol.for("react.suspense_list"), Ba = Symbol.for("react.memo"), A = Symbol.for("react.lazy"), Ca = Symbol.for("react.memo_cache_sentinel");
var Da = Symbol.iterator, B = null;
function C(a, b) {
  if (a !== b) {
    a.context._currentValue = a.parentValue;
    a = a.parent;
    var d = b.parent;
    if (null === a) {
      if (null !== d)
        throw Error("The stacks must reach the root at the same time. This is a bug in React.");
    } else {
      if (null === d)
        throw Error("The stacks must reach the root at the same time. This is a bug in React.");
      C(a, d);
      b.context._currentValue = b.value;
    }
  }
}
function Ea(a) {
  a.context._currentValue = a.parentValue;
  a = a.parent;
  null !== a && Ea(a);
}
function Fa(a) {
  var b = a.parent;
  null !== b && Fa(b);
  a.context._currentValue = a.value;
}
function Ga(a, b) {
  a.context._currentValue = a.parentValue;
  a = a.parent;
  if (null === a)
    throw Error("The depth must equal at least at zero before reaching the root. This is a bug in React.");
  a.depth === b.depth ? C(a, b) : Ga(a, b);
}
function Ha(a, b) {
  var d = b.parent;
  if (null === d)
    throw Error("The depth must equal at least at zero before reaching the root. This is a bug in React.");
  a.depth === d.depth ? C(a, d) : Ha(a, d);
  b.context._currentValue = b.value;
}
var Ia = Error("Suspense Exception: This is not a real error! It's an implementation detail of `use` to interrupt the current render. You must either rethrow it immediately, or move the `use` call outside of the `try/catch` block. Capturing without rethrowing will lead to unexpected behavior.\n\nTo handle async errors, wrap your component in an error boundary, or call the promise's `.catch` method and pass the result to `use`");
function Ja() {
}
function Ka(a, b, d) {
  d = a[d];
  void 0 === d ? a.push(b) : d !== b && (b.then(Ja, Ja), b = d);
  switch (b.status) {
    case "fulfilled":
      return b.value;
    case "rejected":
      throw b.reason;
    default:
      if ("string" !== typeof b.status)
        switch (a = b, a.status = "pending", a.then(function(c) {
          if ("pending" === b.status) {
            var e2 = b;
            e2.status = "fulfilled";
            e2.value = c;
          }
        }, function(c) {
          if ("pending" === b.status) {
            var e2 = b;
            e2.status = "rejected";
            e2.reason = c;
          }
        }), b.status) {
          case "fulfilled":
            return b.value;
          case "rejected":
            throw b.reason;
        }
      D = b;
      throw Ia;
  }
}
var D = null;
function La() {
  if (null === D)
    throw Error("Expected a suspended thenable. This is a bug in React. Please file an issue.");
  var a = D;
  D = null;
  return a;
}
var E = null, F = 0, G = null;
function Ma() {
  var a = G;
  G = null;
  return a;
}
function Na(a) {
  return a._currentValue;
}
var Ra = { useMemo: function(a) {
  return a();
}, useCallback: function(a) {
  return a;
}, useDebugValue: function() {
}, useDeferredValue: H, useTransition: H, readContext: Na, useContext: Na, useReducer: H, useRef: H, useState: H, useInsertionEffect: H, useLayoutEffect: H, useImperativeHandle: H, useEffect: H, useId: Oa, useSyncExternalStore: H, useCacheRefresh: function() {
  return Pa;
}, useMemoCache: function(a) {
  for (var b = Array(a), d = 0; d < a; d++)
    b[d] = Ca;
  return b;
}, use: Qa };
function H() {
  throw Error("This Hook is not supported in Server Components.");
}
function Pa() {
  throw Error("Refreshing the cache is not supported in Server Components.");
}
function Oa() {
  if (null === E)
    throw Error("useId can only be used while React is rendering");
  var a = E.identifierCount++;
  return ":" + E.identifierPrefix + "S" + a.toString(32) + ":";
}
function Qa(a) {
  if (null !== a && "object" === typeof a || "function" === typeof a) {
    if ("function" === typeof a.then) {
      var b = F;
      F += 1;
      null === G && (G = []);
      return Ka(G, a, b);
    }
    if (a.$$typeof === xa)
      return a._currentValue;
  }
  throw Error("An unsupported type was passed to use(): " + String(a));
}
function Sa() {
  return new AbortController().signal;
}
function Ta() {
  var a = v();
  return a ? a.cache : /* @__PURE__ */ new Map();
}
var Ua = { getCacheSignal: function() {
  var a = Ta(), b = a.get(Sa);
  void 0 === b && (b = Sa(), a.set(Sa, b));
  return b;
}, getCacheForType: function(a) {
  var b = Ta(), d = b.get(a);
  void 0 === d && (d = a(), b.set(a, d));
  return d;
} }, Va = Array.isArray, Wa = Object.getPrototypeOf;
function Xa(a) {
  return Object.prototype.toString.call(a).replace(/^\[object (.*)\]$/, function(b, d) {
    return d;
  });
}
function Ya(a) {
  switch (typeof a) {
    case "string":
      return JSON.stringify(10 >= a.length ? a : a.slice(0, 10) + "...");
    case "object":
      if (Va(a))
        return "[...]";
      a = Xa(a);
      return "Object" === a ? "{...}" : a;
    case "function":
      return "function";
    default:
      return String(a);
  }
}
function I(a) {
  if ("string" === typeof a)
    return a;
  switch (a) {
    case za:
      return "Suspense";
    case Aa:
      return "SuspenseList";
  }
  if ("object" === typeof a)
    switch (a.$$typeof) {
      case ya:
        return I(a.render);
      case Ba:
        return I(a.type);
      case A:
        var b = a._payload;
        a = a._init;
        try {
          return I(a(b));
        } catch (d) {
        }
    }
  return "";
}
function J(a, b) {
  var d = Xa(a);
  if ("Object" !== d && "Array" !== d)
    return d;
  d = -1;
  var c = 0;
  if (Va(a)) {
    var e2 = "[";
    for (var f2 = 0; f2 < a.length; f2++) {
      0 < f2 && (e2 += ", ");
      var g = a[f2];
      g = "object" === typeof g && null !== g ? J(g) : Ya(g);
      "" + f2 === b ? (d = e2.length, c = g.length, e2 += g) : e2 = 10 > g.length && 40 > e2.length + g.length ? e2 + g : e2 + "...";
    }
    e2 += "]";
  } else if (a.$$typeof === z)
    e2 = "<" + I(a.type) + "/>";
  else {
    e2 = "{";
    f2 = Object.keys(a);
    for (g = 0; g < f2.length; g++) {
      0 < g && (e2 += ", ");
      var k = f2[g], h2 = JSON.stringify(k);
      e2 += ('"' + k + '"' === h2 ? k : h2) + ": ";
      h2 = a[k];
      h2 = "object" === typeof h2 && null !== h2 ? J(h2) : Ya(h2);
      k === b ? (d = e2.length, c = h2.length, e2 += h2) : e2 = 10 > h2.length && 40 > e2.length + h2.length ? e2 + h2 : e2 + "...";
    }
    e2 += "}";
  }
  return void 0 === b ? e2 : -1 < d && 0 < c ? (a = " ".repeat(d) + "^".repeat(c), "\n  " + e2 + "\n  " + a) : "\n  " + e2;
}
var Za = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, $a = aa.__SECRET_SERVER_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
if (!$a)
  throw Error('The "react" package in this environment is not configured correctly. The "react-server" condition must be enabled in any environment that runs React Server Components.');
var ab = Object.prototype, K = JSON.stringify, bb = $a.ReactCurrentCache, cb = Za.ReactCurrentDispatcher;
function db(a) {
  console.error(a);
}
function eb() {
}
function fb(a, b, d, c, e2, f2) {
  if (null !== bb.current && bb.current !== Ua)
    throw Error("Currently React only supports one RSC renderer at a time.");
  ta.current = sa;
  bb.current = Ua;
  var g = /* @__PURE__ */ new Set();
  c = [];
  var k = /* @__PURE__ */ new Set(), h2 = {
    status: 0,
    flushScheduled: false,
    fatalError: null,
    destination: null,
    bundlerConfig: b,
    cache: /* @__PURE__ */ new Map(),
    nextChunkId: 0,
    pendingChunks: 0,
    hints: k,
    abortableTasks: g,
    pingedTasks: c,
    completedImportChunks: [],
    completedHintChunks: [],
    completedRegularChunks: [],
    completedErrorChunks: [],
    writtenSymbols: /* @__PURE__ */ new Map(),
    writtenClientReferences: /* @__PURE__ */ new Map(),
    writtenServerReferences: /* @__PURE__ */ new Map(),
    writtenProviders: /* @__PURE__ */ new Map(),
    writtenObjects: /* @__PURE__ */ new WeakMap(),
    identifierPrefix: e2 || "",
    identifierCount: 1,
    taintCleanupQueue: [],
    onError: void 0 === d ? db : d,
    onPostpone: void 0 === f2 ? eb : f2,
    toJSON: function(l, x) {
      return gb(h2, this, l, x);
    }
  };
  h2.pendingChunks++;
  a = L(h2, a, null, g);
  c.push(a);
  return h2;
}
var M = null;
function v() {
  if (M)
    return M;
  if (ua) {
    var a = va.getStore();
    if (a)
      return a;
  }
  return null;
}
function hb(a, b) {
  a.pendingChunks++;
  var d = L(a, null, B, a.abortableTasks);
  switch (b.status) {
    case "fulfilled":
      return d.model = b.value, ib(a, d), d.id;
    case "rejected":
      var c = N(a, b.reason);
      O(a, d.id, c);
      return d.id;
    default:
      "string" !== typeof b.status && (b.status = "pending", b.then(function(e2) {
        "pending" === b.status && (b.status = "fulfilled", b.value = e2);
      }, function(e2) {
        "pending" === b.status && (b.status = "rejected", b.reason = e2);
      }));
  }
  b.then(function(e2) {
    d.model = e2;
    ib(a, d);
  }, function(e2) {
    d.status = 4;
    e2 = N(a, e2);
    O(a, d.id, e2);
    a.abortableTasks.delete(d);
    null !== a.destination && P(a, a.destination);
  });
  return d.id;
}
function w(a, b, d) {
  d = K(d);
  var c = a.nextChunkId++;
  b = "H" + b;
  b = c.toString(16) + ":" + b;
  d = q.encode(b + d + "\n");
  a.completedHintChunks.push(d);
  jb(a);
}
function kb(a) {
  if ("fulfilled" === a.status)
    return a.value;
  if ("rejected" === a.status)
    throw a.reason;
  throw a;
}
function lb(a) {
  switch (a.status) {
    case "fulfilled":
    case "rejected":
      break;
    default:
      "string" !== typeof a.status && (a.status = "pending", a.then(function(b) {
        "pending" === a.status && (a.status = "fulfilled", a.value = b);
      }, function(b) {
        "pending" === a.status && (a.status = "rejected", a.reason = b);
      }));
  }
  return { $$typeof: A, _payload: a, _init: kb };
}
function Q(a, b, d, c, e2, f2) {
  if (null !== c && void 0 !== c)
    throw Error("Refs cannot be used in Server Components, nor passed to Client Components.");
  if ("function" === typeof b) {
    if (b.$$typeof === r)
      return [z, b, d, e2];
    F = 0;
    G = f2;
    e2 = b(e2);
    return "object" === typeof e2 && null !== e2 && "function" === typeof e2.then ? "fulfilled" === e2.status ? e2.value : lb(e2) : e2;
  }
  if ("string" === typeof b)
    return [z, b, d, e2];
  if ("symbol" === typeof b)
    return b === wa ? e2.children : [z, b, d, e2];
  if (null != b && "object" === typeof b) {
    if (b.$$typeof === r)
      return [z, b, d, e2];
    switch (b.$$typeof) {
      case A:
        var g = b._init;
        b = g(b._payload);
        return Q(a, b, d, c, e2, f2);
      case ya:
        return a = b.render, F = 0, G = f2, a(e2, void 0);
      case Ba:
        return Q(a, b.type, d, c, e2, f2);
    }
  }
  throw Error("Unsupported Server Component type: " + Ya(b));
}
function ib(a, b) {
  var d = a.pingedTasks;
  d.push(b);
  1 === d.length && (a.flushScheduled = null !== a.destination, setTimeout(function() {
    return mb(a);
  }, 0));
}
function L(a, b, d, c) {
  var e2 = { id: a.nextChunkId++, status: 0, model: b, context: d, ping: function() {
    return ib(a, e2);
  }, thenableState: null };
  c.add(e2);
  return e2;
}
function R(a) {
  return "$" + a.toString(16);
}
function nb(a, b, d) {
  a = K(d);
  b = b.toString(16) + ":" + a + "\n";
  return q.encode(b);
}
function ob(a, b, d, c) {
  var e2 = c.$$async ? c.$$id + "#async" : c.$$id, f2 = a.writtenClientReferences, g = f2.get(e2);
  if (void 0 !== g)
    return b[0] === z && "1" === d ? "$L" + g.toString(16) : R(g);
  try {
    var k = a.bundlerConfig, h2 = c.$$id;
    g = "";
    var l = k[h2];
    if (l)
      g = l.name;
    else {
      var x = h2.lastIndexOf("#");
      -1 !== x && (g = h2.slice(x + 1), l = k[h2.slice(0, x)]);
      if (!l)
        throw Error('Could not find the module "' + h2 + '" in the React Client Manifest. This is probably a bug in the React Server Components bundler.');
    }
    var Gb = true === c.$$async ? [l.id, l.chunks, g, 1] : [
      l.id,
      l.chunks,
      g
    ];
    a.pendingChunks++;
    var Y = a.nextChunkId++, Hb = K(Gb), Ib = Y.toString(16) + ":I" + Hb + "\n", Jb = q.encode(Ib);
    a.completedImportChunks.push(Jb);
    f2.set(e2, Y);
    return b[0] === z && "1" === d ? "$L" + Y.toString(16) : R(Y);
  } catch (Kb) {
    return a.pendingChunks++, b = a.nextChunkId++, d = N(a, Kb), O(a, b, d), R(b);
  }
}
function S(a, b) {
  a.pendingChunks++;
  b = L(a, b, B, a.abortableTasks);
  pb(a, b);
  return b.id;
}
var T = false;
function gb(a, b, d, c) {
  switch (c) {
    case z:
      return "$";
  }
  for (; "object" === typeof c && null !== c && (c.$$typeof === z || c.$$typeof === A); )
    try {
      switch (c.$$typeof) {
        case z:
          var e2 = a.writtenObjects, f2 = e2.get(c);
          if (void 0 !== f2) {
            if (-1 === f2) {
              var g = S(a, c);
              return R(g);
            }
            if (T === c)
              T = null;
            else
              return R(f2);
          } else
            e2.set(c, -1);
          var k = c;
          c = Q(a, k.type, k.key, k.ref, k.props, null);
          break;
        case A:
          var h2 = c._init;
          c = h2(c._payload);
      }
    } catch (l) {
      b = l === Ia ? La() : l;
      if ("object" === typeof b && null !== b && "function" === typeof b.then)
        return a.pendingChunks++, a = L(a, c, B, a.abortableTasks), c = a.ping, b.then(c, c), a.thenableState = Ma(), "$L" + a.id.toString(16);
      a.pendingChunks++;
      c = a.nextChunkId++;
      b = N(a, b);
      O(a, c, b);
      return "$L" + c.toString(16);
    }
  if (null === c)
    return null;
  if ("object" === typeof c) {
    if (c.$$typeof === r)
      return ob(a, b, d, c);
    b = a.writtenObjects;
    d = b.get(c);
    if ("function" === typeof c.then) {
      if (void 0 !== d)
        if (T === c)
          T = null;
        else
          return "$@" + d.toString(16);
      a = hb(a, c);
      b.set(c, a);
      return "$@" + a.toString(16);
    }
    if (void 0 !== d) {
      if (-1 === d)
        return a = S(a, c), R(a);
      if (T === c)
        T = null;
      else
        return R(d);
    } else
      b.set(c, -1);
    if (Va(c))
      return c;
    if (c instanceof Map) {
      c = Array.from(c);
      for (b = 0; b < c.length; b++)
        d = c[b][0], "object" === typeof d && null !== d && (e2 = a.writtenObjects, void 0 === e2.get(d) && e2.set(d, -1));
      return "$Q" + S(a, c).toString(16);
    }
    if (c instanceof Set) {
      c = Array.from(c);
      for (b = 0; b < c.length; b++)
        d = c[b], "object" === typeof d && null !== d && (e2 = a.writtenObjects, void 0 === e2.get(d) && e2.set(d, -1));
      return "$W" + S(a, c).toString(16);
    }
    null === c || "object" !== typeof c ? a = null : (a = Da && c[Da] || c["@@iterator"], a = "function" === typeof a ? a : null);
    if (a)
      return Array.from(c);
    a = Wa(c);
    if (a !== ab && (null === a || null !== Wa(a)))
      throw Error("Only plain objects, and a few built-ins, can be passed to Client Components from Server Components. Classes or null prototypes are not supported.");
    return c;
  }
  if ("string" === typeof c) {
    if ("Z" === c[c.length - 1] && b[d] instanceof Date)
      return "$D" + c;
    if (1024 <= c.length)
      return a.pendingChunks += 2, b = a.nextChunkId++, c = q.encode(c), d = c.byteLength, d = b.toString(16) + ":T" + d.toString(16) + ",", d = q.encode(d), a.completedRegularChunks.push(d, c), R(b);
    a = "$" === c[0] ? "$" + c : c;
    return a;
  }
  if ("boolean" === typeof c)
    return c;
  if ("number" === typeof c)
    return a = c, Number.isFinite(a) ? 0 === a && -Infinity === 1 / a ? "$-0" : a : Infinity === a ? "$Infinity" : -Infinity === a ? "$-Infinity" : "$NaN";
  if ("undefined" === typeof c)
    return "$undefined";
  if ("function" === typeof c) {
    if (c.$$typeof === r)
      return ob(a, b, d, c);
    if (c.$$typeof === t)
      return b = a.writtenServerReferences, d = b.get(c), void 0 !== d ? a = "$F" + d.toString(16) : (d = c.$$bound, d = { id: c.$$id, bound: d ? Promise.resolve(d) : null }, a = S(a, d), b.set(c, a), a = "$F" + a.toString(16)), a;
    if (/^on[A-Z]/.test(d))
      throw Error("Event handlers cannot be passed to Client Component props." + J(b, d) + "\nIf you need interactivity, consider converting part of this to a Client Component.");
    throw Error('Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".' + J(b, d));
  }
  if ("symbol" === typeof c) {
    e2 = a.writtenSymbols;
    f2 = e2.get(c);
    if (void 0 !== f2)
      return R(f2);
    f2 = c.description;
    if (Symbol.for(f2) !== c)
      throw Error("Only global symbols received from Symbol.for(...) can be passed to Client Components. The symbol Symbol.for(" + (c.description + ") cannot be found among global symbols.") + J(b, d));
    a.pendingChunks++;
    b = a.nextChunkId++;
    d = nb(a, b, "$S" + f2);
    a.completedImportChunks.push(d);
    e2.set(c, b);
    return R(b);
  }
  if ("bigint" === typeof c)
    return "$n" + c.toString(10);
  throw Error("Type " + typeof c + " is not supported in Client Component props." + J(b, d));
}
function N(a, b) {
  a = a.onError;
  b = a(b);
  if (null != b && "string" !== typeof b)
    throw Error('onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "' + typeof b + '" instead');
  return b || "";
}
function qb(a, b) {
  null !== a.destination ? (a.status = 2, ca(a.destination, b)) : (a.status = 1, a.fatalError = b);
}
function O(a, b, d) {
  d = { digest: d };
  b = b.toString(16) + ":E" + K(d) + "\n";
  b = q.encode(b);
  a.completedErrorChunks.push(b);
}
function pb(a, b) {
  if (0 === b.status) {
    var d = B, c = b.context;
    d !== c && (null === d ? Fa(c) : null === c ? Ea(d) : d.depth === c.depth ? C(d, c) : d.depth > c.depth ? Ga(d, c) : Ha(d, c), B = c);
    try {
      var e2 = b.model;
      if ("object" === typeof e2 && null !== e2 && e2.$$typeof === z) {
        a.writtenObjects.set(e2, b.id);
        d = e2;
        var f2 = b.thenableState;
        b.model = e2;
        e2 = Q(a, d.type, d.key, d.ref, d.props, f2);
        for (b.thenableState = null; "object" === typeof e2 && null !== e2 && e2.$$typeof === z; )
          a.writtenObjects.set(e2, b.id), f2 = e2, b.model = e2, e2 = Q(a, f2.type, f2.key, f2.ref, f2.props, null);
      }
      "object" === typeof e2 && null !== e2 && a.writtenObjects.set(e2, b.id);
      var g = b.id;
      T = e2;
      var k = K(e2, a.toJSON), h2 = g.toString(16) + ":" + k + "\n", l = q.encode(h2);
      a.completedRegularChunks.push(l);
      a.abortableTasks.delete(b);
      b.status = 1;
    } catch (x) {
      g = x === Ia ? La() : x, "object" === typeof g && null !== g && "function" === typeof g.then ? (a = b.ping, g.then(a, a), b.thenableState = Ma()) : (a.abortableTasks.delete(b), b.status = 4, g = N(a, g), O(a, b.id, g));
    }
  }
}
function mb(a) {
  var b = cb.current;
  cb.current = Ra;
  var d = M;
  E = M = a;
  try {
    var c = a.pingedTasks;
    a.pingedTasks = [];
    for (var e2 = 0; e2 < c.length; e2++)
      pb(a, c[e2]);
    null !== a.destination && P(a, a.destination);
  } catch (f2) {
    N(a, f2), qb(a, f2);
  } finally {
    cb.current = b, E = null, M = d;
  }
}
function P(a, b) {
  m = new Uint8Array(512);
  n = 0;
  try {
    for (var d = a.completedImportChunks, c = 0; c < d.length; c++)
      a.pendingChunks--, p(b, d[c]);
    d.splice(0, c);
    var e2 = a.completedHintChunks;
    for (c = 0; c < e2.length; c++)
      p(b, e2[c]);
    e2.splice(0, c);
    var f2 = a.completedRegularChunks;
    for (c = 0; c < f2.length; c++)
      a.pendingChunks--, p(b, f2[c]);
    f2.splice(0, c);
    var g = a.completedErrorChunks;
    for (c = 0; c < g.length; c++)
      a.pendingChunks--, p(b, g[c]);
    g.splice(0, c);
  } finally {
    a.flushScheduled = false, m && 0 < n && (b.enqueue(new Uint8Array(m.buffer, 0, n)), m = null, n = 0);
  }
  0 === a.pendingChunks && b.close();
}
function rb(a) {
  a.flushScheduled = null !== a.destination;
  ua ? setTimeout(function() {
    return va.run(a, mb, a);
  }, 0) : setTimeout(function() {
    return mb(a);
  }, 0);
}
function jb(a) {
  if (false === a.flushScheduled && 0 === a.pingedTasks.length && null !== a.destination) {
    var b = a.destination;
    a.flushScheduled = true;
    setTimeout(function() {
      return P(a, b);
    }, 0);
  }
}
function sb(a, b) {
  try {
    var d = a.abortableTasks;
    if (0 < d.size) {
      a.pendingChunks++;
      var c = a.nextChunkId++, e2 = void 0 === b ? Error("The render was aborted by the server without a reason.") : b, f2 = N(a, e2);
      O(a, c, f2, e2);
      d.forEach(function(g) {
        g.status = 3;
        var k = R(c);
        g = nb(a, g.id, k);
        a.completedErrorChunks.push(g);
      });
      d.clear();
    }
    null !== a.destination && P(a, a.destination);
  } catch (g) {
    N(a, g), qb(a, g);
  }
}
function tb(a, b) {
  var d = "", c = a[b];
  if (c)
    d = c.name;
  else {
    var e2 = b.lastIndexOf("#");
    -1 !== e2 && (d = b.slice(e2 + 1), c = a[b.slice(0, e2)]);
    if (!c)
      throw Error('Could not find the module "' + b + '" in the React Server Manifest. This is probably a bug in the React Server Components bundler.');
  }
  return [c.id, c.chunks, d];
}
var U = /* @__PURE__ */ new Map();
function ub(a) {
  var b = __webpack_require__(a);
  if ("function" !== typeof b.then || "fulfilled" === b.status)
    return null;
  b.then(function(d) {
    b.status = "fulfilled";
    b.value = d;
  }, function(d) {
    b.status = "rejected";
    b.reason = d;
  });
  return b;
}
function vb() {
}
function wb(a) {
  for (var b = a[1], d = [], c = 0; c < b.length; ) {
    var e2 = b[c++];
    b[c++];
    var f2 = U.get(e2);
    if (void 0 === f2) {
      f2 = __webpack_chunk_load__(e2);
      d.push(f2);
      var g = U.set.bind(U, e2, null);
      f2.then(g, vb);
      U.set(e2, f2);
    } else
      null !== f2 && d.push(f2);
  }
  return 4 === a.length ? 0 === d.length ? ub(a[0]) : Promise.all(d).then(function() {
    return ub(a[0]);
  }) : 0 < d.length ? Promise.all(d) : null;
}
function V(a) {
  var b = __webpack_require__(a[0]);
  if (4 === a.length && "function" === typeof b.then)
    if ("fulfilled" === b.status)
      b = b.value;
    else
      throw b.reason;
  return "*" === a[2] ? b : "" === a[2] ? b.__esModule ? b.default : b : b[a[2]];
}
function xb(a, b, d, c) {
  this.status = a;
  this.value = b;
  this.reason = d;
  this._response = c;
}
xb.prototype = Object.create(Promise.prototype);
xb.prototype.then = function(a, b) {
  switch (this.status) {
    case "resolved_model":
      yb(this);
  }
  switch (this.status) {
    case "fulfilled":
      a(this.value);
      break;
    case "pending":
    case "blocked":
      a && (null === this.value && (this.value = []), this.value.push(a));
      b && (null === this.reason && (this.reason = []), this.reason.push(b));
      break;
    default:
      b(this.reason);
  }
};
function zb(a, b) {
  for (var d = 0; d < a.length; d++)
    (0, a[d])(b);
}
function Ab(a, b) {
  if ("pending" === a.status || "blocked" === a.status) {
    var d = a.reason;
    a.status = "rejected";
    a.reason = b;
    null !== d && zb(d, b);
  }
}
function Bb(a, b, d, c, e2, f2) {
  var g = tb(a._bundlerConfig, b);
  a = wb(g);
  if (d)
    d = Promise.all([d, a]).then(function(k) {
      k = k[0];
      var h2 = V(g);
      return h2.bind.apply(h2, [null].concat(k));
    });
  else if (a)
    d = Promise.resolve(a).then(function() {
      return V(g);
    });
  else
    return V(g);
  d.then(Cb(c, e2, f2), Db(c));
  return null;
}
var W = null, X = null;
function yb(a) {
  var b = W, d = X;
  W = a;
  X = null;
  try {
    var c = JSON.parse(a.value, a._response._fromJSON);
    null !== X && 0 < X.deps ? (X.value = c, a.status = "blocked", a.value = null, a.reason = null) : (a.status = "fulfilled", a.value = c);
  } catch (e2) {
    a.status = "rejected", a.reason = e2;
  } finally {
    W = b, X = d;
  }
}
function Eb(a, b) {
  a._chunks.forEach(function(d) {
    "pending" === d.status && Ab(d, b);
  });
}
function Z(a, b) {
  var d = a._chunks, c = d.get(b);
  c || (c = a._formData.get(a._prefix + b), c = null != c ? new xb("resolved_model", c, null, a) : new xb("pending", null, null, a), d.set(b, c));
  return c;
}
function Cb(a, b, d) {
  if (X) {
    var c = X;
    c.deps++;
  } else
    c = X = { deps: 1, value: null };
  return function(e2) {
    b[d] = e2;
    c.deps--;
    0 === c.deps && "blocked" === a.status && (e2 = a.value, a.status = "fulfilled", a.value = c.value, null !== e2 && zb(e2, c.value));
  };
}
function Db(a) {
  return function(b) {
    return Ab(a, b);
  };
}
function Fb(a, b) {
  a = Z(a, b);
  "resolved_model" === a.status && yb(a);
  if ("fulfilled" !== a.status)
    throw a.reason;
  return a.value;
}
function Lb(a, b, d, c) {
  if ("$" === c[0])
    switch (c[1]) {
      case "$":
        return c.slice(1);
      case "@":
        return b = parseInt(c.slice(2), 16), Z(a, b);
      case "S":
        return Symbol.for(c.slice(2));
      case "F":
        return c = parseInt(c.slice(2), 16), c = Fb(a, c), Bb(a, c.id, c.bound, W, b, d);
      case "Q":
        return b = parseInt(c.slice(2), 16), a = Fb(a, b), new Map(a);
      case "W":
        return b = parseInt(c.slice(2), 16), a = Fb(a, b), new Set(a);
      case "K":
        b = c.slice(2);
        var e2 = a._prefix + b + "_", f2 = new FormData();
        a._formData.forEach(function(g, k) {
          k.startsWith(e2) && f2.append(
            k.slice(e2.length),
            g
          );
        });
        return f2;
      case "I":
        return Infinity;
      case "-":
        return "$-0" === c ? -0 : -Infinity;
      case "N":
        return NaN;
      case "u":
        return;
      case "D":
        return new Date(Date.parse(c.slice(2)));
      case "n":
        return BigInt(c.slice(2));
      default:
        c = parseInt(c.slice(1), 16);
        a = Z(a, c);
        switch (a.status) {
          case "resolved_model":
            yb(a);
        }
        switch (a.status) {
          case "fulfilled":
            return a.value;
          case "pending":
          case "blocked":
            return c = W, a.then(Cb(c, b, d), Db(c)), null;
          default:
            throw a.reason;
        }
    }
  return c;
}
function Mb(a, b) {
  var d = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : new FormData(), c = /* @__PURE__ */ new Map(), e2 = { _bundlerConfig: a, _prefix: b, _formData: d, _chunks: c, _fromJSON: function(f2, g) {
    return "string" === typeof g ? Lb(e2, this, f2, g) : g;
  } };
  return e2;
}
function Nb(a) {
  Eb(a, Error("Connection closed."));
}
function Ob(a, b, d) {
  var c = tb(a, b);
  a = wb(c);
  return d ? Promise.all([d, a]).then(function(e2) {
    e2 = e2[0];
    var f2 = V(c);
    return f2.bind.apply(f2, [null].concat(e2));
  }) : a ? Promise.resolve(a).then(function() {
    return V(c);
  }) : Promise.resolve(V(c));
}
function Pb(a, b, d) {
  a = Mb(b, d, a);
  Nb(a);
  a = Z(a, 0);
  a.then(function() {
  });
  if ("fulfilled" !== a.status)
    throw a.reason;
  return a.value;
}
reactServerDomWebpackServer_edge_production_min.createClientModuleProxy = function(a) {
  a = u({}, a, false);
  return new Proxy(a, ka);
};
reactServerDomWebpackServer_edge_production_min.decodeAction = function(a, b) {
  var d = new FormData(), c = null;
  a.forEach(function(e2, f2) {
    f2.startsWith("$ACTION_") ? f2.startsWith("$ACTION_REF_") ? (e2 = "$ACTION_" + f2.slice(12) + ":", e2 = Pb(a, b, e2), c = Ob(b, e2.id, e2.bound)) : f2.startsWith("$ACTION_ID_") && (e2 = f2.slice(11), c = Ob(b, e2, null)) : d.append(f2, e2);
  });
  return null === c ? null : c.then(function(e2) {
    return e2.bind(null, d);
  });
};
reactServerDomWebpackServer_edge_production_min.decodeFormState = function(a, b, d) {
  var c = b.get("$ACTION_KEY");
  if ("string" !== typeof c)
    return Promise.resolve(null);
  var e2 = null;
  b.forEach(function(g, k) {
    k.startsWith("$ACTION_REF_") && (g = "$ACTION_" + k.slice(12) + ":", e2 = Pb(b, d, g));
  });
  if (null === e2)
    return Promise.resolve(null);
  var f2 = e2.id;
  return Promise.resolve(e2.bound).then(function(g) {
    return null === g ? null : [a, c, f2, g.length - 1];
  });
};
reactServerDomWebpackServer_edge_production_min.decodeReply = function(a, b) {
  if ("string" === typeof a) {
    var d = new FormData();
    d.append("0", a);
    a = d;
  }
  a = Mb(b, "", a);
  b = Z(a, 0);
  Nb(a);
  return b;
};
reactServerDomWebpackServer_edge_production_min.registerClientReference = function(a, b, d) {
  return u(a, b + "#" + d, false);
};
reactServerDomWebpackServer_edge_production_min.registerServerReference = function(a, b, d) {
  return Object.defineProperties(a, { $$typeof: { value: t }, $$id: { value: null === d ? b : b + "#" + d }, $$bound: { value: null }, bind: { value: fa } });
};
reactServerDomWebpackServer_edge_production_min.renderToReadableStream = function(a, b, d) {
  var c = fb(a, b, d ? d.onError : void 0, d ? d.context : void 0, d ? d.identifierPrefix : void 0, d ? d.onPostpone : void 0);
  if (d && d.signal) {
    var e2 = d.signal;
    if (e2.aborted)
      sb(c, e2.reason);
    else {
      var f2 = function() {
        sb(c, e2.reason);
        e2.removeEventListener("abort", f2);
      };
      e2.addEventListener("abort", f2);
    }
  }
  return new ReadableStream({ type: "bytes", start: function() {
    rb(c);
  }, pull: function(g) {
    if (1 === c.status)
      c.status = 2, ca(g, c.fatalError);
    else if (2 !== c.status && null === c.destination) {
      c.destination = g;
      try {
        P(
          c,
          g
        );
      } catch (k) {
        N(c, k), qb(c, k);
      }
    }
  }, cancel: function(g) {
    c.destination = null;
    sb(c, g);
  } }, { highWaterMark: 0 });
};
{
  server_edge$1.exports = reactServerDomWebpackServer_edge_production_min;
}
var server_edgeExports = server_edge$1.exports;
const server_edge = /* @__PURE__ */ getDefaultExportFromCjs(server_edgeExports);
export {
  server_edge as default,
  server_edgeExports as s
};
