/**
 * Entrypoint da função serverless na Vercel.
 * Encaminha todas as requisições ao handler Nest (dist/src/serverless.js).
 * O rewrite envia o path original em ?path=... para o Nest receber a URL correta.
 */
const { parse } = require("url");
const handler = require("../dist/src/serverless").default;

module.exports = function (req, res) {
  const parsed = parse(req.url || "", true);
  const path = parsed.query && parsed.query.path;
  if (path) {
    const pathStr = typeof path === "string" ? path : path[0];
    req.url = pathStr.startsWith("/") ? pathStr : "/" + pathStr;
  }
  handler(req, res);
};
