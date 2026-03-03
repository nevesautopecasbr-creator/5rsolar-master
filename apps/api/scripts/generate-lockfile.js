/**
 * Gera package-lock.json para apps/api em isolamento (sem monorepo).
 * Rode da raiz do repo: node apps/api/scripts/generate-lockfile.js
 * Ou de apps/api: node scripts/generate-lockfile.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const apiDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(apiDir, "../..");
const tempDir = path.join(rootDir, ".tmp-api-lock");

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((f) => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) rmDir(p);
    else fs.unlinkSync(p);
  });
  fs.rmdirSync(dir);
}

console.log("Criando diretório temporário...");
if (fs.existsSync(tempDir)) rmDir(tempDir);
fs.mkdirSync(tempDir, { recursive: true });

console.log("Copiando package.json...");
fs.copyFileSync(
  path.join(apiDir, "package.json"),
  path.join(tempDir, "package.json")
);

console.log("Rodando npm install --ignore-scripts no diretório isolado...");
execSync("npm install --ignore-scripts", {
  cwd: tempDir,
  stdio: "inherit",
  env: { ...process.env, npm_config_ignore_scripts: "true" },
});

const lockPath = path.join(tempDir, "package-lock.json");
if (!fs.existsSync(lockPath)) {
  console.error("package-lock.json não foi gerado.");
  process.exit(1);
}

console.log("Copiando package-lock.json para apps/api...");
fs.copyFileSync(lockPath, path.join(apiDir, "package-lock.json"));

console.log("Limpando diretório temporário...");
rmDir(tempDir);

console.log("Concluído. Faça commit de apps/api/package-lock.json");
process.exit(0);
