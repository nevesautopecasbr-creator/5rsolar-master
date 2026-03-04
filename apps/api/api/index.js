/**
 * Entrypoint da função serverless na Vercel.
 * Encaminha todas as requisições ao handler Nest (dist/src/serverless.js).
 * O build (npm run build) deve rodar antes para gerar dist/.
 */
module.exports = require("../dist/src/serverless").default;
