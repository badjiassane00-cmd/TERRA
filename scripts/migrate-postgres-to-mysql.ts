import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import mysql from "mysql2/promise";
import { isImageDataUrl, isStorageConfigured, storePrivateImage, storePublicImage } from "../src/server/media/object-storage";


async function main() {
  loadEnvConfig(process.cwd());

type Row = Record<string, unknown>;
const sourceUrl = process.env.LEGACY_POSTGRES_URL;
const targetUrl = process.env.DATABASE_URL;
if (process.env.CONFIRM_POSTGRES_TO_MYSQL !== "yes") throw new Error("Pour lancer le transfert, définissez CONFIRM_POSTGRES_TO_MYSQL=yes après avoir vérifié la source et la cible.");
if (!sourceUrl?.startsWith("postgresql://") && !sourceUrl?.startsWith("postgres://")) throw new Error("LEGACY_POSTGRES_URL doit désigner l’ancienne base PostgreSQL.");
if (!targetUrl?.startsWith("mysql://")) throw new Error("DATABASE_URL doit désigner la nouvelle base MySQL.");

const source = new Pool({ connectionString: sourceUrl, max: 3, application_name: "terra-postgres-migration" });
const target = await mysql.createConnection(targetUrl);
const quote = (identifier: string) => `\`${identifier.replaceAll("`", "``")}\``;
const quotePostgres = (identifier: string) => '"' + identifier.replaceAll('"', '""') + '"';
const imageData = (value: unknown): value is string => typeof value === "string" && isImageDataUrl(value);

try {
  const [tableRows] = await target.query<mysql.RowDataPacket[]>("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME <> '_prisma_migrations'");
  if (!tableRows.length) throw new Error("La migration initiale MySQL n’est pas appliquée. Exécutez `npx prisma migrate deploy` d’abord.");
  let existingRows = 0;
  for (const table of tableRows) {
    const [countRows] = await target.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS count FROM ${quote(table.name as string)}`);
    existingRows += Number(countRows[0].count);
  }
  if (existingRows) throw new Error("La base MySQL cible contient déjà des données. Le transfert s’arrête sans écraser quoi que ce soit.");

  const { rows: sourceTables } = await source.query<{ tablename: string }>("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename");
  const targetNames = new Set(tableRows.map((row) => row.name as string));
  const transferTables = sourceTables.map((row) => row.tablename).filter((name) => targetNames.has(name));
  await target.query("SET FOREIGN_KEY_CHECKS = 0");
  await target.beginTransaction();
  const counts: Array<{ table: string; count: number }> = [];
  for (const table of transferTables) {
    const { rows } = await source.query<Row>(`SELECT * FROM public.${quotePostgres(table)}`);
    if (!rows.length) continue;
    const columns = Object.keys(rows[0]);
    const sql = `INSERT INTO ${quote(table)} (${columns.map(quote).join(",")}) VALUES (${columns.map(() => "?").join(",")})`;
    for (const row of rows) {
      const data = { ...row };
      if (isStorageConfigured() && table === "users" && imageData(data.avatarUrl)) data.avatarUrl = await storePublicImage(data.avatarUrl, "avatars");
      if (table === "community_posts") {
        if (isStorageConfigured() && imageData(data.imageUrl)) data.imageUrl = await storePublicImage(data.imageUrl, "observations");
        if (isStorageConfigured() && imageData(data.thumbnailUrl)) data.thumbnailUrl = await storePublicImage(data.thumbnailUrl, "observations");
      }
      if (isStorageConfigured() && table === "scan_history" && imageData(data.imageUrl)) {
        const asset = await storePrivateImage(data.imageUrl);
        const assetId = randomUUID();
        await target.execute("INSERT INTO `media_assets` (`id`,`userId`,`objectKey`,`contentType`) VALUES (?,?,?,?)", [assetId, data.userId as string | null, asset.key, asset.mime]);
        data.imageUrl = `/api/media/private/${assetId}`;
      }
      const values = columns.map((column) => {
        const value = data[column];
        return value && typeof value === "object" && !(value instanceof Date) && !Buffer.isBuffer(value) ? JSON.stringify(value) : value;
      });
      await target.execute(sql, values as never[]);
    }
    counts.push({ table, count: rows.length });
  }
  await target.commit();
  await target.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log(`Transfert terminé : ${counts.reduce((sum, item) => sum + item.count, 0)} lignes dans ${counts.length} tables.`);
  for (const item of counts) console.log(`${item.table}: ${item.count}`);
} catch (error) {
  await target.rollback().catch(() => undefined);
  await target.query("SET FOREIGN_KEY_CHECKS = 1").catch(() => undefined);
  throw error;
} finally {
  await source.end();
  await target.end();
}

}

void main().catch((error: unknown) => { console.error("Transfert interrompu :", error instanceof Error ? error.message : "erreur inconnue"); process.exitCode = 1; });
