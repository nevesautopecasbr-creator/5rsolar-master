/**
 * Entrypoint da função serverless na Vercel.
 * Encaminha todas as requisições ao handler Nest (dist/src/serverless.js).
 * O rewrite envia o path em ?path=...; precisamos repassar como pathname para o Nest.
 */
const { parse } = require("url");
const handler = require("../dist/src/serverless").default;

function getPathFromRequest(req) {
  const rawUrl = (req.url || req.originalUrl || "").trim();
  const parsed = parse(rawUrl, true);
  const query = parsed.query || req.query || {};
  const pathFromQuery = query.path;
  if (pathFromQuery) {
    const s = typeof pathFromQuery === "string" ? pathFromQuery : pathFromQuery[0];
    if (s) return s.startsWith("/") ? s : "/" + s;
  }
  const pathFromHeader =
    req.headers["x-invoke-path"] ||
    req.headers["x-vercel-original-url"] ||
    req.headers["x-url"] ||
    req.headers["x-forwarded-uri"] ||
    req.headers["x-original-url"];
  if (pathFromHeader) {
    const p = pathFromHeader.startsWith("/") ? pathFromHeader : "/" + pathFromHeader;
    return p.indexOf("?") >= 0 ? p.slice(0, p.indexOf("?")) : p;
  }
  if (rawUrl.startsWith("/api") && rawUrl.length > 4) {
    return rawUrl.indexOf("?") >= 0 ? rawUrl.slice(0, rawUrl.indexOf("?")) : rawUrl;
  }
  return null;
}

module.exports = function (req, res) {
  const path = getPathFromRequest(req);
  if (path && path !== "/api") {
    req.url = path;
    req.originalUrl = path;
    req.path = path;
    req.baseUrl = "";
  }
  handler(req, res);
};
