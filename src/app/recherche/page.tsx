import { redirect } from "next/navigation";

export default async function LegacySearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] : params.q;
  redirect(query ? `/biodiversite?q=${encodeURIComponent(query)}` : "/biodiversite");
}
