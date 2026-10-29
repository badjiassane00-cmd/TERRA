import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Observations — TERRA" };

export default async function ObservationsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; species?: string | string[] }> }) {
  const params = await searchParams;
  const requestedQuery = params.q || params.species;
  const initialQuery = Array.isArray(requestedQuery) ? requestedQuery[0] || "" : requestedQuery || "";
  redirect(`/explorer?section=observations${initialQuery ? `&q=${encodeURIComponent(initialQuery)}` : ""}`);
}
