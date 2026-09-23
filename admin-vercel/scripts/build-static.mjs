import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");

const entries = [
  "index.html",
  "css",
  "js",
  "assets"
];

rmSync(dist, { force: true, recursive: true });
mkdirSync(dist, { recursive: true });

for (const entry of entries) {
  const source = join(root, entry);

  if (!existsSync(source)) {
    throw new Error(`Arquivo ou pasta nao encontrado: ${entry}`);
  }

  cpSync(source, join(dist, entry), { recursive: true });
}

console.log(`Painel admin gerado em ${dist}`);
