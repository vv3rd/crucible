import { r as react_reactServerExports, g as getDefaultExportFromCjs } from "./react.react-server-yjb63mRX.js";
var jsxRuntime$1 = { exports: {} };
var reactJsxRuntime_production_min = {};
var f = react_reactServerExports, k = Symbol.for("react.element"), l = Symbol.for("react.fragment"), m = Object.prototype.hasOwnProperty, n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, p = { key: true, ref: true, __self: true, __source: true };
function q(c, a, g) {
  var b, d = {}, e = null, h = null;
  void 0 !== g && (e = "" + g);
  void 0 !== a.key && (e = "" + a.key);
  void 0 !== a.ref && (h = a.ref);
  for (b in a)
    m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
  if (c && c.defaultProps)
    for (b in a = c.defaultProps, a)
      void 0 === d[b] && (d[b] = a[b]);
  return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
}
reactJsxRuntime_production_min.Fragment = l;
reactJsxRuntime_production_min.jsx = q;
reactJsxRuntime_production_min.jsxs = q;
{
  jsxRuntime$1.exports = reactJsxRuntime_production_min;
}
var jsxRuntimeExports = jsxRuntime$1.exports;
const jsxRuntime = /* @__PURE__ */ getDefaultExportFromCjs(jsxRuntimeExports);
export {
  jsxRuntime as default,
  jsxRuntimeExports as j
};
