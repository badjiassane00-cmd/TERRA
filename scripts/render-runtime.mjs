import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function configureRenderEnvironment() {
  if (process.env.RENDER !== "true") {
    throw new Error("Ce script de démarrage est réservé au déploiement Render.");
  }

  if (!process.env.DATABASE_URL) {
    const required = ["MYSQL_HOSTPORT", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD"];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) throw new Error(`DATABASE_URL absente, et variables MySQL manquantes : ${missing.join(", ")}`);
    const mysqlHostport = process.env.MYSQL_HOSTPORT;
    if (!/^[a-zA-Z0-9.-]+:\d+$/.test(mysqlHostport)) throw new Error("MYSQL_HOSTPORT doit être au format hôte:port.");
    process.env.DATABASE_URL = `mysql://${encodeURIComponent(process.env.MYSQL_USER)}:${encodeURIComponent(process.env.MYSQL_PASSWORD)}@${mysqlHostport}/${encodeURIComponent(process.env.MYSQL_DATABASE)}`;
  }

  if (!process.env.MEDIA_S3_ENDPOINT) {
    if (!process.env.MEDIA_S3_HOSTPORT) throw new Error("MEDIA_S3_ENDPOINT (ou MEDIA_S3_HOSTPORT) manquant.");
    process.env.MEDIA_S3_ENDPOINT = `http://${process.env.MEDIA_S3_HOSTPORT}`;
  }

  if (!process.env.DISEASE_MODEL_URL && process.env.DISEASE_MODEL_HOSTPORT) {
    process.env.DISEASE_MODEL_URL = `http://${process.env.DISEASE_MODEL_HOSTPORT}`;
  }

  if (!process.env.BIOCLIP_API_URL && process.env.BIOCLIP_HOSTPORT) {
    process.env.BIOCLIP_API_URL = `http://${process.env.BIOCLIP_HOSTPORT}`;
  }

  process.env.APP_URL ||= process.env.RENDER_EXTERNAL_URL;
}

async function runPrismaMigrations() {
  const cliPath = path.join(projectRoot, "node_modules", "prisma", "build", "index.js");
  const attempts = 12;
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
    console.log(`Base de données pas encore prête (essai ${attempt}/${attempts}); nouvelle tentative dans 10 s.`);
    await delay(10_000);
  }
}

function runSuperAdminBootstrap() {
  const hasEmail = Boolean(process.env.SUPER_ADMIN_EMAIL);
  const hasPassword = Boolean(process.env.SUPER_ADMIN_PASSWORD);
  if (!hasEmail && !hasPassword) {
    console.log("Bootstrap super-admin ignoré : configurez SUPER_ADMIN_EMAIL et SUPER_ADMIN_PASSWORD dans Render.");
    return;
  }
  if (hasEmail !== hasPassword) {
    console.warn("Bootstrap super-admin ignoré : SUPER_ADMIN_EMAIL et SUPER_ADMIN_PASSWORD doivent être définis ensemble.");
    return;
  }

  const cliPath = path.join(projectRoot, "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [cliPath, "db", "seed"], {
    cwd: projectRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error("Le bootstrap super-admin a échoué.");
}

export async function migrateRenderDatabase() {
  configureRenderEnvironment();
  await runPrismaMigrations();
}

export function startRenderApplication() {
  configureRenderEnvironment();
  if (!process.env.APP_URL) throw new Error("Render n’a pas fourni l’URL publique HTTPS du service.");
  runSuperAdminBootstrap();
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
