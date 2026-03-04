/**
 * Entrypoint da função serverless na Vercel.
 * Repassa req/res ao handler Nest. Só corrige req.url quando a Vercel
 * envia só "/api" (destination do rewrite); quando já vem "/api/...", deixa como está.
 */
const { parse } = require("url");
const handler = require("../dist/src/serverless").default;

function getPathFromRequest(req) {
  const rawUrl = (req.url || req.originalUrl || "").trim();
  const parsed = parse(rawUrl, true);
  const pathname = (parsed.pathname || "").trim();
  if (pathname !== "/api" && pathname.startsWith("/api")) {
    return null;
  }
  const query = parsed.query || req.query || {};
  const pathFromQuery = query.path;
  if (pathFromQuery) {
    const s = typeof pathFromQuery === "string" ? pathFromQuery : pathFromQuery[0];
    if (s) return s.startsWith("/") ? s : "/" + s;
  }
  return null;
}

module.exports = function (req, res) {
  const path = getPathFromRequest(req);
  if (path) {
    req.url = path;
    req.originalUrl = path;
    req.path = path;
    req.baseUrl = "";
  }
  handler(req, res);
};
