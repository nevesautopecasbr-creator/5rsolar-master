/**
 * Entrypoint da função serverless na Vercel.
 * Envolve req em um Proxy que força url/path/originalUrl/baseUrl para o path real,
 * para o roteador do Express/Nest sempre enxergar o path correto (ex.: /api/auth/login).
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
    console.log("[api/index] method=" + (req.method || "") + " req.url=" + (req.url || "") + " path=" + (path || "(null)") + " useProxy=" + !!(path && path !== "/api"));
  }
  if (!path || path === "/api") {
    return handler(req, res);
  }
  const wrappedReq = new Proxy(req, {
    get(target, prop) {
      if (prop === "url" || prop === "originalUrl" || prop === "path") return path;
      if (prop === "baseUrl") return "";
      return target[prop];
    },
  });
  handler(wrappedReq, res);
};
