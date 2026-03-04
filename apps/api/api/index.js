/**
 * Entrypoint da função serverless na Vercel.
 * Repassa req/res ao handler Nest. A correção do path (?path=...) é feita
 * dentro do Nest (middleware em app.factory.ts) para garantir que o roteador veja o path certo.
 */
module.exports = require("../dist/src/serverless").default;
