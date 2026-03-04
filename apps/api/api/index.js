/**
 * Entrypoint da função serverless na Vercel.
 * Rewrite "/(.*)" -> "/api?path=$1". Corrige o path aqui (Proxy no req) para o Nest enxergar a rota.
 */
const { parse } = require("url");
const handler = require("../dist/src/serverless").default;

function getPath(req) {
  let s = null;
  const raw = (req.url || req.originalUrl || "").trim();
  const parsed = parse(raw, true);
  const fromUrl = parsed.query && parsed.query.path;
  if (typeof fromUrl === "string") s = fromUrl;
  else if (Array.isArray(fromUrl) && fromUrl[0]) s = fromUrl[0];
  if (!s && req.query && req.query.path) {
    const q = req.query.path;
    s = typeof q === "string" ? q : Array.isArray(q) ? q[0] : null;
  }
  // Fallback: req.url já é o path (ex.: Vercel repassa o path original)
  if (!s && raw && raw.startsWith("/") && raw.indexOf("path=") === -1) {
    s = raw.indexOf("?") >= 0 ? raw.slice(0, raw.indexOf("?")) : raw;
  }
  if (!s || !s.trim()) return null;
  try {
    s = decodeURIComponent(s.trim());
  } catch (_) {
    s = s.trim();
  }
  return s.startsWith("/") ? s : "/" + s;
}

module.exports = function (req, res) {
  const rawUrl = (req.url || req.originalUrl || "").trim();
  const path = getPath(req);
  if (process.env.VERCEL) {
    console.log("[api/index] rawUrl=" + rawUrl + " path=" + (path || "(null)") + " method=" + (req.method || ""));
  }
  if (!path || path === "/api") {
    if (process.env.VERCEL && !path) {
      console.warn("[api/index] path vazio: req.url=" + rawUrl + " req.query.path=" + (req.query && req.query.path));
    }
    return handler(req, res);
  }
  const fullPath = path.indexOf("?") >= 0 ? path.slice(0, path.indexOf("?")) : path;
  if (process.env.VERCEL) console.log("[api/index] fullPath=" + fullPath);
  const wrapped = new Proxy(req, {
    get(target, prop) {
      const rawTarget =
        typeof target.url === "string" && target.url !== "" && target.url !== fullPath ? target.url : null;
      const stripped = rawTarget
        ? rawTarget.indexOf("?") >= 0
          ? rawTarget.slice(0, rawTarget.indexOf("?"))
          : rawTarget
        : null;
      const pathname = stripped != null ? stripped : fullPath;
      if (prop === "url") {
        if (stripped != null) {
          const withQuery =
            typeof target.url === "string" && target.url.indexOf("?") >= 0
              ? target.url.slice(target.url.indexOf("?"))
              : "";
          return stripped + withQuery;
        }
        return fullPath;
      }
      if (prop === "originalUrl") return fullPath;
      if (prop === "path") return pathname;
      if (prop === "_parsedUrl") {
        const orig = target._parsedUrl || {};
        const search =
          (typeof target.url === "string" && target.url.indexOf("?") >= 0
            ? target.url.slice(target.url.indexOf("?"))
            : orig.search) || "";
        return Object.assign({}, orig, { pathname, path: pathname + search });
      }
      return target[prop];
    },
  });
  return handler(wrapped, res);
};
