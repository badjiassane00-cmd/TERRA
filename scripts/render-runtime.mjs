import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function configureRenderEnvironment() {
  if (process.env.RENDER !== "true") {
    throw new Error("Ce script de démarrage est réservé au déploiement Render.");
  }

  const required = ["MYSQL_HOSTPORT", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD", "MEDIA_S3_HOSTPORT", "DISEASE_MODEL_HOSTPORT"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Variables Render manquantes : ${missing.join(", ")}`);

  const mysqlHostport = process.env.MYSQL_HOSTPORT;
  if (!/^[a-zA-Z0-9.-]+:\d+$/.test(mysqlHostport)) throw new Error("MYSQL_HOSTPORT doit être au format hôte:port.");
  process.env.DATABASE_URL = `mysql://${encodeURIComponent(process.env.MYSQL_USER)}:${encodeURIComponent(process.env.MYSQL_PASSWORD)}@${mysqlHostport}/${encodeURIComponent(process.env.MYSQL_DATABASE)}`;
  process.env.MEDIA_S3_ENDPOINT ||= `http://${process.env.MEDIA_S3_HOSTPORT}`;
  process.env.DISEASE_MODEL_URL ||= `http://${process.env.DISEASE_MODEL_HOSTPORT}`;
  process.env.APP_URL ||= process.env.RENDER_EXTERNAL_URL;

  if (!process.env.APP_URL) throw new Error("Render n’a pas fourni l’URL publique HTTPS du service.");
}

async function runPrismaMigrations() {
  const cliPath = path.join(projectRoot, "node_modules", "prisma", "build", "index.js");
  const attempts = 24;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const result = spawnSync(process.execPath, [cliPath, "migrate", "deploy"], {
      cwd: projectRoot,
      env: process.env,
      encoding: "utf8",
    });
    const output = `${result.stdout || ""}${result.stderr || ""}`;
    if (output) process.stdout.write(output);
    if (result.status === 0) return;

    const databaseStarting = /Can't reach database server|P1001|ECONNREFUSED|Connection refused/i.test(output);
    if (!databaseStarting || attempt === attempts) {
      process.exit(result.status || 1);
    }
    console.log(`MySQL privé pas encore prêt (essai ${attempt}/${attempts}); nouvelle tentative dans 10 s.`);
    await delay(10_000);
  }
}

export async function migrateRenderDatabase() {
  configureRenderEnvironment();
  await runPrismaMigrations();
}

export function startRenderApplication() {
  configureRenderEnvironment();
  const nextCli = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
  const port = process.env.PORT || "10000";
  const server = spawn(process.execPath, [nextCli, "start", "--hostname", "0.0.0.0", "--port", port], {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
  server.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}
