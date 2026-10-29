import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Mes catalogues naturalistes — TERRA" };

export default function CataloguesPage() {
  redirect("/explorer?section=catalogues");
}
