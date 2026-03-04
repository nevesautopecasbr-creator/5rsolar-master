/**
 * Entrypoint da função serverless na Vercel.
 * O path real (rewrite "/(.*)" -> "/api?path=$1") é aplicado em serverless.ts antes do Express.
 */
const handler = require("../dist/src/serverless").default;

module.exports = function (req, res) {
  return handler(req, res);
};
