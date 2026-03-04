/**
 * Entrypoint da função serverless na Vercel.
 * Encaminha todas as requisições ao handler Nest (dist/src/serverless.js).
 * O rewrite em vercel.json envia o path original em ?path=... para o Nest receber a URL correta.
 */
const { parse } = require("url");
const handler = require("../dist/src/serverless").default;

function getPathFromRequest(req) {
  const rawUrl = req.url || "";
  const parsed = parse(rawUrl, true);
  const query = parsed.query || req.query || {};
  const pathFromQuery = query.path;
  if (pathFromQuery) {
    const s = typeof pathFromQuery === "string" ? pathFromQuery : pathFromQuery[0];
    return s ? (s.startsWith("/") ? s : "/" + s) : null;
  }
  const pathFromHeader =
    req.headers["x-invoke-path"] ||
    req.headers["x-vercel-original-url"] ||
    req.headers["x-url"];
  if (pathFromHeader) {
    try {
      const p = pathFromHeader.startsWith("/") ? pathFromHeader : "/" + pathFromHeader;
      return p.indexOf("?") >= 0 ? p.slice(0, p.indexOf("?")) : p;
    } catch {
      return null;
    }
  }
  if (rawUrl.startsWith("/api")) {
    return rawUrl.indexOf("?") >= 0 ? rawUrl.slice(0, rawUrl.indexOf("?")) : rawUrl;
  }
  return null;
}

module.exports = function (req, res) {
  const path = getPathFromRequest(req);
  if (path) {
    req.url = path;
    if (typeof req.originalUrl !== "undefined") req.originalUrl = path;
  }
  handler(req, res);
};
