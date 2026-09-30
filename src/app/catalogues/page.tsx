import type { Metadata } from "next";
import PersonalCatalogs from "@/components/catalogs/PersonalCatalogs";
import { getSessionUserId } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Mes catalogues naturalistes — TERRA" };

export default async function CataloguesPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  return <PersonalCatalogs />;
}
