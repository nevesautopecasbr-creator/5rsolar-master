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
  const path = getPath(req);
  if (!path || path === "/api") return handler(req, res);
  const fullPath = path.indexOf("?") >= 0 ? path.slice(0, path.indexOf("?")) : path;
  // Na Vercel o Nest roda sem prefixo global: rotas são /auth/login. Passamos path sem /api.
  const pathForRouter = fullPath.startsWith("/api") ? fullPath.slice(4) || "/" : fullPath;
  const search = path.indexOf("?") >= 0 ? path.slice(path.indexOf("?")) : "";
  const parsedUrl = { pathname: pathForRouter, path: pathForRouter, search, query: {} };
  const wrapped = new Proxy(req, {
    get(target, prop) {
      if (prop === "url") return pathForRouter;
      if (prop === "originalUrl") return pathForRouter;
      if (prop === "path") return pathForRouter;
      if (prop === "_parsedUrl" || prop === "_parsedOriginalUrl") return parsedUrl;
      return target[prop];
    },
  });
  return handler(wrapped, res);
};
