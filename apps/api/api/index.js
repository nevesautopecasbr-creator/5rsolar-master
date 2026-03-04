/**
 * Entrypoint da função serverless na Vercel.
 * Rewrite "/(.*)" -> "/api?path=$1". Corrige o path aqui (Proxy no req) para o Nest enxergar a rota.
 */
const { parse } = require("url");
const handler = require("../dist/src/serverless").default;

function getPath(req) {
  const raw = (req.url || req.originalUrl || "").trim();
  const parsed = parse(raw, true);
  const pathParam = parsed.query && parsed.query.path;
  const s = typeof pathParam === "string" ? pathParam : Array.isArray(pathParam) ? pathParam[0] : null;
  if (!s || !s.trim()) return null;
  return s.startsWith("/") ? s : "/" + s;
}

module.exports = function (req, res) {
  const rawUrl = (req.url || req.originalUrl || "").trim();
  const path = getPath(req);
  if (process.env.VERCEL) {
    console.log("[api/index] rawUrl=" + rawUrl + " path=" + (path || "(null)") + " method=" + (req.method || ""));
  }
  if (!path || path === "/api") return handler(req, res);
  const fullPath = path.indexOf("?") >= 0 ? path.slice(0, path.indexOf("?")) : path;
  if (process.env.VERCEL) console.log("[api/index] fullPath=" + fullPath);
  const search = path.indexOf("?") >= 0 ? path.slice(path.indexOf("?")) : "";
  const parsedUrl = { pathname: fullPath, path: fullPath, search, query: {} };
  const wrapped = new Proxy(req, {
    get(target, prop) {
      if (prop === "url") return fullPath;
      if (prop === "originalUrl") return fullPath;
      if (prop === "path") return fullPath;
      if (prop === "_parsedUrl" || prop === "_parsedOriginalUrl") return parsedUrl;
      return target[prop];
    },
  });
  return handler(wrapped, res);
};
