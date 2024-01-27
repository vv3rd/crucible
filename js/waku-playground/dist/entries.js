import { Link } from "./assets/rsc0-47a606723.js";
import { r as react_reactServerExports } from "./assets/react.react-server-yjb63mRX.js";
import { Children, Slot } from "./assets/waku-client.js";
import { j as jsxRuntimeExports } from "./assets/com0-28170e60f.js";
import { Counter } from "./assets/rsc2-ddb75831a.js";
import "./rsdw-server.js";
function getComponentIds(path) {
  const pathItems = path.split("/").filter(Boolean);
  const idSet = /* @__PURE__ */ new Set();
  for (let index = 0; index <= pathItems.length; ++index) {
    const id = [
      ...pathItems.slice(0, index),
      "layout"
    ].join("/");
    idSet.add(id);
  }
  idSet.add([
    ...pathItems,
    "page"
  ].join("/"));
  return Array.from(idSet);
}
function getInputString(path) {
  if (!path.startsWith("/")) {
    throw new Error("Path should start with `/`");
  }
  return path.slice(1);
}
function parseInputString(input) {
  return "/" + input;
}
const PARAM_KEY_SKIP = "waku_router_skip";
const SHOULD_SKIP_ID = "/SHOULD_SKIP";
const joinPath = (...paths) => {
  var _a;
  const isAbsolute = (_a = paths[0]) == null ? void 0 : _a.startsWith("/");
  const items = [].concat(...paths.map((path) => path.split("/")));
  let i = 0;
  while (i < items.length) {
    if (items[i] === "." || items[i] === "") {
      items.splice(i, 1);
    } else if (items[i] === "..") {
      if (i > 0) {
        items.splice(i - 1, 2);
        --i;
      } else {
        items.splice(i, 1);
      }
    } else {
      ++i;
    }
  }
  return (isAbsolute ? "/" : "") + items.join("/") || ".";
};
const ShoudSkipComponent = ({ shouldSkip }) => react_reactServerExports.createElement("meta", {
  name: "waku-should-skip",
  content: JSON.stringify(shouldSkip)
});
function unstable_defineRouter(existsPath, getComponent, getPathsForBuild) {
  const shouldSkip = {};
  const renderEntries = async (input, searchParams) => {
    const path = parseInputString(input);
    if (!await existsPath(path)) {
      return null;
    }
    const skip = searchParams.getAll(PARAM_KEY_SKIP) || [];
    const componentIds = getComponentIds(path);
    const props = {
      path,
      searchParams
    };
    const entries2 = (await Promise.all(componentIds.map(async (id) => {
      if (skip == null ? void 0 : skip.includes(id)) {
        return [];
      }
      const mod = await getComponent(id, (val) => {
        if (val) {
          shouldSkip[id] = val;
        } else {
          delete shouldSkip[id];
        }
      });
      const component = mod && "default" in mod ? mod.default : mod;
      if (!component) {
        return [];
      }
      const element = react_reactServerExports.createElement(component, props, react_reactServerExports.createElement(Children));
      return [
        [
          id,
          element
        ]
      ];
    }))).flat();
    entries2.push([
      SHOULD_SKIP_ID,
      react_reactServerExports.createElement(ShoudSkipComponent, {
        shouldSkip
      })
    ]);
    return Object.fromEntries(entries2);
  };
  const getBuildConfig = async (unstable_collectClientModules) => {
    const pathsForBuild = await (getPathsForBuild == null ? void 0 : getPathsForBuild());
    const path2moduleIds = {};
    for (const path of pathsForBuild || []) {
      const input = getInputString(path);
      const moduleIds = await unstable_collectClientModules(input);
      path2moduleIds[path] = moduleIds;
    }
    const customCode = `
globalThis.__WAKU_ROUTER_PREFETCH__ = (path) => {
  const path2ids = ${JSON.stringify(path2moduleIds)};
  for (const id of path2ids[path] || []) {
    import(id);
  }
};`;
    const buildConfig = [];
    for (const path of pathsForBuild || []) {
      const isStatic = await existsPath(path) === "static";
      const input = getInputString(path);
      const entries2 = [
        {
          input,
          isStatic
        }
      ];
      buildConfig.push({
        pathname: path,
        entries: entries2,
        customCode
      });
    }
    return buildConfig;
  };
  const getSsrConfig = async (pathname, { isPrd }) => {
    const pathType = await existsPath(pathname);
    if (isPrd ? pathType !== "dynamic" : pathType === null) {
      return null;
    }
    const componentIds = getComponentIds(pathname);
    const input = getInputString(pathname);
    const body = react_reactServerExports.createElement(react_reactServerExports.Fragment, null, react_reactServerExports.createElement(Slot, {
      id: SHOULD_SKIP_ID
    }), componentIds.reduceRight((acc, id) => react_reactServerExports.createElement(Slot, {
      id,
      fallback: acc
    }, acc), null));
    return {
      input,
      body
    };
  };
  return {
    renderEntries,
    getBuildConfig,
    getSsrConfig
  };
}
const splitPath = (path) => {
  const p = path.replace(/^\//, "");
  if (!p) {
    return [];
  }
  return p.split("/");
};
const parsePath = (path) => splitPath(path).map((name) => {
  const isSlug = name.startsWith("[") && name.endsWith("]");
  if (isSlug) {
    name = name.slice(1, -1);
  }
  const isWildcard = name.startsWith("...");
  if (isWildcard) {
    name = name.slice(3);
  }
  return {
    name,
    isSlug,
    isWildcard
  };
});
const getDynamicMapping = (parsedPath, actual) => {
  if (parsedPath.length !== actual.length) {
    return null;
  }
  const mapping = {};
  for (let i = 0; i < parsedPath.length; i++) {
    const { name, isSlug } = parsedPath[i];
    if (isSlug) {
      mapping[name] = actual[i];
    } else {
      if (name !== actual[i]) {
        return null;
      }
    }
  }
  return mapping;
};
const getWildcardMapping = (parsedPath, actual) => {
  if (parsedPath.length > actual.length) {
    return null;
  }
  const mapping = {};
  let wildcardStartIndex = -1;
  for (let i = 0; i < parsedPath.length; i++) {
    const { name, isSlug, isWildcard } = parsedPath[i];
    if (isWildcard) {
      wildcardStartIndex = i;
      break;
    } else if (isSlug) {
      mapping[name] = actual[i];
    } else {
      if (name !== actual[i]) {
        return null;
      }
    }
  }
  let wildcardEndIndex = -1;
  for (let i = 0; i < parsedPath.length; i++) {
    const { name, isSlug, isWildcard } = parsedPath[parsedPath.length - i - 1];
    if (isWildcard) {
      wildcardEndIndex = actual.length - i - 1;
      break;
    } else if (isSlug) {
      mapping[name] = actual[actual.length - i - 1];
    } else {
      if (name !== actual[actual.length - i - 1]) {
        return null;
      }
    }
  }
  if (wildcardStartIndex === -1 || wildcardEndIndex === -1) {
    throw new Error("Invalid wildcard path");
  }
  mapping[parsedPath[wildcardStartIndex].name] = actual.slice(wildcardStartIndex, wildcardEndIndex + 1);
  return mapping;
};
function createPages(fn) {
  let configured = false;
  const staticPathSet = /* @__PURE__ */ new Set();
  const dynamicPathMap = /* @__PURE__ */ new Map();
  const wildcardPathMap = /* @__PURE__ */ new Map();
  const staticComponentMap = /* @__PURE__ */ new Map();
  const registerStaticComponent = (id, component) => {
    if (staticComponentMap.has(id) && staticComponentMap.get(id) !== component) {
      throw new Error(`Duplicated component for: ${id}`);
    }
    staticComponentMap.set(id, component);
  };
  const createPage = (page) => {
    if (configured) {
      throw new Error("no longer available");
    }
    const parsedPath = parsePath(page.path);
    const numSlugs = parsedPath.filter(({ isSlug }) => isSlug).length;
    const numWildcards = parsedPath.filter(({ isWildcard }) => isWildcard).length;
    if (page.render === "static" && numSlugs === 0) {
      staticPathSet.add(page.path);
      const id = joinPath(page.path, "page").replace(/^\//, "");
      registerStaticComponent(id, page.component);
    } else if (page.render === "static" && numSlugs > 0 && numWildcards === 0) {
      const staticPaths = page.staticPaths.map((item) => Array.isArray(item) ? item : [
        item
      ]);
      for (const staticPath of staticPaths) {
        if (staticPath.length !== numSlugs) {
          throw new Error("staticPaths does not match with slug pattern");
        }
        const mapping = {};
        let slugIndex = 0;
        const pathItems = parsedPath.map(({ name, isSlug }) => {
          if (isSlug) {
            return mapping[name] = staticPath[slugIndex++];
          }
          return name;
        });
        staticPathSet.add("/" + joinPath(...pathItems));
        const id = joinPath(...pathItems, "page");
        const WrappedComponent = (props) => react_reactServerExports.createElement(page.component, {
          ...props,
          ...mapping
        });
        registerStaticComponent(id, WrappedComponent);
      }
    } else if (page.render === "dynamic" && numWildcards === 0) {
      if (dynamicPathMap.has(page.path)) {
        throw new Error(`Duplicated dynamic path: ${page.path}`);
      }
      dynamicPathMap.set(page.path, [
        parsedPath,
        page.component
      ]);
    } else if (page.render === "dynamic" && numWildcards === 1) {
      if (wildcardPathMap.has(page.path)) {
        throw new Error(`Duplicated dynamic path: ${page.path}`);
      }
      wildcardPathMap.set(page.path, [
        parsedPath,
        page.component
      ]);
    } else {
      throw new Error("Invalid page configuration");
    }
  };
  const createLayout = (layout) => {
    if (configured) {
      throw new Error("no longer available");
    }
    const id = joinPath(layout.path, "layout").replace(/^\//, "");
    registerStaticComponent(id, layout.component);
  };
  const ready = fn({
    createPage,
    createLayout
  }).then(() => {
    configured = true;
  });
  return unstable_defineRouter(async (path) => {
    await ready;
    if (staticPathSet.has(path)) {
      return "static";
    }
    for (const [parsedPath] of dynamicPathMap.values()) {
      const mapping = getDynamicMapping(parsedPath, splitPath(path));
      if (mapping) {
        return "dynamic";
      }
    }
    for (const [parsedPath] of wildcardPathMap.values()) {
      const mapping = getWildcardMapping(parsedPath, splitPath(path));
      if (mapping) {
        return "dynamic";
      }
    }
    return null;
  }, async (id, unstable_setShouldSkip) => {
    await ready;
    const staticComponent = staticComponentMap.get(id);
    if (staticComponent) {
      unstable_setShouldSkip({});
      return staticComponent;
    }
    for (const [parsedPath, Component] of dynamicPathMap.values()) {
      const mapping = getDynamicMapping([
        ...parsedPath,
        {
          name: "page",
          isSlug: false,
          isWildcard: false
        }
      ], id.split("/"));
      if (mapping) {
        if (Object.keys(mapping).length === 0) {
          unstable_setShouldSkip();
          return Component;
        }
        const WrappedComponent = (props) => react_reactServerExports.createElement(Component, {
          ...props,
          ...mapping
        });
        unstable_setShouldSkip();
        return WrappedComponent;
      }
    }
    for (const [parsedPath, Component] of wildcardPathMap.values()) {
      const mapping = getWildcardMapping([
        ...parsedPath,
        {
          name: "page",
          isSlug: false,
          isWildcard: false
        }
      ], id.split("/"));
      if (mapping) {
        const WrappedComponent = (props) => react_reactServerExports.createElement(Component, {
          ...props,
          ...mapping
        });
        unstable_setShouldSkip();
        return WrappedComponent;
      }
    }
    unstable_setShouldSkip({});
    return null;
  }, async () => staticPathSet);
}
const Header = () => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "fixed left-0 top-0 p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold tracking-tight", children: "Waku starter" }) });
};
const Footer = () => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "fixed bottom-0 left-0 p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    "visit",
    " ",
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "a",
      {
        href: "https://waku.gg/",
        target: "_blank",
        rel: "noreferrer",
        className: "mt-4 inline-block underline",
        children: "waku.gg"
      }
    ),
    " ",
    "to learn more"
  ] }) });
};
const RootLayout = async ({ children }) => {
  const data = await getData$2();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { id: "__waku", className: "font-['Nunito']", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { property: "description", content: data.description }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("link", { rel: "icon", type: "image/png", href: data.icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex min-h-svh items-center justify-center *:min-h-64 *:min-w-64", children }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
};
const getData$2 = async () => {
  const data = {
    description: "An internet website!",
    icon: "/images/favicon.png"
  };
  return data;
};
const HomePage = async () => {
  const data = await getData$1();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: data.title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-bold tracking-tight", children: data.headline }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: data.body }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Counter, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/about", className: "mt-4 inline-block underline", children: "Learn more" })
  ] });
};
const getData$1 = async () => {
  const data = {
    title: "Waku",
    headline: "Waku",
    body: "Hello world!"
  };
  return data;
};
const AboutPage = async () => {
  const data = await getData();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: data.title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-bold tracking-tight", children: data.headline }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: data.body }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-4 inline-block underline", children: "Return home" })
  ] });
};
const getData = async () => {
  const data = {
    title: "About",
    headline: "About Waku",
    body: "The minimal React framework"
  };
  return data;
};
const entries = createPages(async ({ createPage, createLayout }) => {
  createLayout({
    render: "static",
    path: "/",
    component: RootLayout
  });
  createPage({
    render: "static",
    path: "/",
    component: HomePage
  });
  createPage({
    render: "static",
    path: "/about",
    component: AboutPage
  });
});
export {
  entries as default
};

export function loadModule(id) {
  switch (id) {
    case 'rsdw-server':
      return import('./rsdw-server.js');

    case 'client/react':
      return import('./public/assets/react.js');
  
    case 'client/rd-server':
      return import('./public/assets/rd-server.js');
  
    case 'client/rsdw-client':
      return import('./public/assets/rsdw-client.js');
  
    case 'client/waku-client':
      return import('./public/assets/waku-client.js');
  
    case 'public/assets/waku-client.js':
      return import('./public/assets/waku-client.js');


    case 'public/assets/rsc0-47a606723.js':
      return import('./public/assets/rsc0-47a606723.js');
    case 'public/assets/rsc1-8e67dcaea.js':
      return import('./public/assets/rsc1-8e67dcaea.js');
    case 'public/assets/rsc2-ddb75831a.js':
      return import('./public/assets/rsc2-ddb75831a.js');
    default:
      throw new Error('Cannot find module: ' + id);
  }
}

const staticInputSet = new Set(["","about"]);
export function skipRenderRsc(input) {
  return staticInputSet.has(input);
}

export function loadHtmlHead(pathname) {
  return {"/":"\n    <base href=\"/\">\n    <script type=\"module\" async>\nglobalThis.__waku_module_cache__ = new Map();\nglobalThis.__webpack_chunk_load__ = (id) => import(id).then((m) => globalThis.__waku_module_cache__.set(id, m));\nglobalThis.__webpack_require__ = (id) => globalThis.__waku_module_cache__.get(id);</script>\n\n<meta charset=\"utf-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <script async type=\"module\" crossorigin src=\"/assets/indexHtml-sM_D3mTj.js\"></script>\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/index-ZTOZCyuL.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/jsx-runtime--3Vb6qXs.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/index-ygKPTG2k.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/waku-client.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/rsc0-47a606723.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/main-Dn1pTRZ5.js\">\n    <link rel=\"stylesheet\" href=\"assets/entries-Q8eT2CaU.css\">\n  <script type=\"module\" async>\nglobalThis.__WAKU_PREFETCHED__ = {\n  '/RSC/index.txt': fetch('/RSC/index.txt'),\n};\nimport('/assets/waku-client.js');\nimport('/assets/rsc2-ddb75831a.js');\nimport('/assets/rsc0-47a606723.js');\nglobalThis.__WAKU_ROUTER_PREFETCH__ = (path) => {\n  const path2ids = {\"/\":[\"/assets/waku-client.js\",\"/assets/rsc2-ddb75831a.js\",\"/assets/rsc0-47a606723.js\"],\"/about\":[\"/assets/waku-client.js\",\"/assets/rsc0-47a606723.js\"]};\n  for (const id of path2ids[path] || []) {\n    import(id);\n  }\n};</script>","/about":"\n    <base href=\"/\">\n    <script type=\"module\" async>\nglobalThis.__waku_module_cache__ = new Map();\nglobalThis.__webpack_chunk_load__ = (id) => import(id).then((m) => globalThis.__waku_module_cache__.set(id, m));\nglobalThis.__webpack_require__ = (id) => globalThis.__waku_module_cache__.get(id);</script>\n\n<meta charset=\"utf-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <script async type=\"module\" crossorigin src=\"/assets/indexHtml-sM_D3mTj.js\"></script>\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/index-ZTOZCyuL.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/jsx-runtime--3Vb6qXs.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/index-ygKPTG2k.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/waku-client.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/rsc0-47a606723.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/main-Dn1pTRZ5.js\">\n    <link rel=\"stylesheet\" href=\"assets/entries-Q8eT2CaU.css\">\n  <script type=\"module\" async>\nglobalThis.__WAKU_PREFETCHED__ = {\n  '/RSC/about.txt': fetch('/RSC/about.txt'),\n};\nimport('/assets/waku-client.js');\nimport('/assets/rsc0-47a606723.js');\nglobalThis.__WAKU_ROUTER_PREFETCH__ = (path) => {\n  const path2ids = {\"/\":[\"/assets/waku-client.js\",\"/assets/rsc2-ddb75831a.js\",\"/assets/rsc0-47a606723.js\"],\"/about\":[\"/assets/waku-client.js\",\"/assets/rsc0-47a606723.js\"]};\n  for (const id of path2ids[path] || []) {\n    import(id);\n  }\n};</script>"}[pathname] || "\n    <base href=\"/\">\n    <script type=\"module\" async>\nglobalThis.__waku_module_cache__ = new Map();\nglobalThis.__webpack_chunk_load__ = (id) => import(id).then((m) => globalThis.__waku_module_cache__.set(id, m));\nglobalThis.__webpack_require__ = (id) => globalThis.__waku_module_cache__.get(id);</script>\n\n<meta charset=\"utf-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <script async type=\"module\" crossorigin src=\"/assets/indexHtml-sM_D3mTj.js\"></script>\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/index-ZTOZCyuL.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/jsx-runtime--3Vb6qXs.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/index-ygKPTG2k.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/waku-client.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/rsc0-47a606723.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/main-Dn1pTRZ5.js\">\n    <link rel=\"stylesheet\" href=\"assets/entries-Q8eT2CaU.css\">\n  ";
}
