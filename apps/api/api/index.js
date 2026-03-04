/**
 * Entrypoint da função serverless na Vercel.
 * Rewrite "/(.*)" -> "/api?path=$1". Corrige req.url / req._parsedUrl aqui para o Nest enxergar a rota.
 */
const { parse } = require("url");
const handler = require("../dist/src/serverless").default;

function getPath(req) {
  let s = null;
  // 1) Query já parseada (ex.: Vercel pode preencher req.query)
  if (req.query && req.query.path) {
    const q = req.query.path;
    s = typeof q === "string" ? q : Array.isArray(q) ? q[0] : null;
  }
  // 2) Parsear de req.url / originalUrl
  if (!s) {
    const raw = (req.url || req.originalUrl || "").trim();
    const parsed = parse(raw, true);
    const fromUrl = parsed.query && parsed.query.path;
    if (typeof fromUrl === "string") s = fromUrl;
    else if (Array.isArray(fromUrl) && fromUrl[0]) s = fromUrl[0];
    if (!s && raw.startsWith("/") && raw.indexOf("path=") === -1) {
      s = raw.indexOf("?") >= 0 ? raw.slice(0, raw.indexOf("?")) : raw;
    }
  }
  if (!s || !s.trim()) return null;
  try {
    s = decodeURIComponent(s.trim());
  } catch (_) {
    s = s.trim();
  }
  return s.startsWith("/") ? s : "/" + s;
}

/** Ajusta req in-place para Express/Nest verem o path correto. Remove _parsedUrl para o Express repare a partir de req.url (incl. após trim no router /api). */
function rewriteReqPath(req, fullPath) {
  req.url = fullPath;
  req.originalUrl = fullPath;
  delete req._parsedUrl;
  try {
    req.path = fullPath;
  } catch (_) {}
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
  if (process.env.VERCEL) console.log("[api/index] fullPath=" + fullPath + " (rewriting req in-place)");
  rewriteReqPath(req, fullPath);
  return handler(req, res);
};
