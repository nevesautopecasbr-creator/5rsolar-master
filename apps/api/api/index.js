/**
 * Entrypoint da função serverless na Vercel.
 * Ajusta req.url / req.originalUrl / req.path antes de repassar ao Nest (rewrite Vercel).
 */
const { parse } = require("url");
const handler = require("../dist/src/serverless").default;

function getPath(req) {
  const rawUrl = (req.url || req.originalUrl || "").trim();
  const parsed = parse(rawUrl, true);
  const pathname = (parsed.pathname || "").trim();
  const pathFromQuery = parsed.query && parsed.query.path;
  if (pathFromQuery) {
    const s = typeof pathFromQuery === "string" ? pathFromQuery : pathFromQuery[0];
    if (s) return s.startsWith("/") ? s : "/" + s;
  }
  if (pathname.startsWith("/api") && pathname.length > 4) {
    return pathname;
  }
  return null;
}

module.exports = function (req, res) {
  const path = getPath(req);
  if (process.env.VERCEL) {
    console.log("[api/index] method=" + (req.method || "") + " path=" + (path || "(null)"));
  }
  if (path && path !== "/api") {
    req.url = path;
    req.originalUrl = path;
    req.path = path.indexOf("?") >= 0 ? path.slice(0, path.indexOf("?")) : path;
  }
  return handler(req, res);
};
