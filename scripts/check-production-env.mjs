import { existsSync, readFileSync } from "node:fs";

const files = [".env", ".env.production", ".env.production.local"];
const values = {};
for (const file of files) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
}
Object.assign(values, process.env);

const issues = [];
for (const key of ["DATABASE_URL", "JWT_SECRET", "APP_URL", "MEDIA_S3_ENDPOINT", "MEDIA_S3_BUCKET", "MEDIA_S3_ACCESS_KEY", "MEDIA_S3_SECRET_KEY"]) {
  if (!values[key]?.trim()) issues.push(`${key} est requis.`);
}
if (values.DATABASE_URL && !values.DATABASE_URL.startsWith("mysql://")) issues.push("DATABASE_URL doit utiliser MySQL.");
if (values.JWT_SECRET && (values.JWT_SECRET.length < 32 || /^(change-me|secret|password)/i.test(values.JWT_SECRET))) issues.push("JWT_SECRET doit être un secret aléatoire d’au moins 32 caractères.");
for (const key of ["APP_URL", "MEDIA_S3_ENDPOINT"]) {
  if (!values[key]) continue;
  let url;
  try { url = new URL(values[key]); } catch { issues.push(`${key} doit être une URL valide.`); continue; }
  if (key === "APP_URL" && (url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname))) issues.push("APP_URL doit être le domaine public TERRA en HTTPS.");
  if (key === "MEDIA_S3_ENDPOINT" && !["http:", "https:"].includes(url.protocol)) issues.push("MEDIA_S3_ENDPOINT doit utiliser HTTP ou HTTPS.");
}
if (issues.length) {
  console.error("Configuration de production incomplète :\n- " + issues.join("\n- "));
  process.exit(1);
}
console.log("Variables de production présentes et formats vérifiés (aucune valeur affichée).");
