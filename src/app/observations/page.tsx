import type { Metadata } from "next";
import ObservationExplorer from "@/components/observations/ObservationExplorer";
import Link from "next/link";
import CommunityFeed from "@/components/community/CommunityFeed";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Observations — TERRA" };

export default async function ObservationsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; species?: string | string[] }> }) {
  const params = await searchParams;
  const requestedQuery = params.q || params.species;
  const initialQuery = Array.isArray(requestedQuery) ? requestedQuery[0] || "" : requestedQuery || "";
  const user = await getSessionUser();
  const role = user?.role.toLowerCase() as "user" | "admin" | "super_admin" | "institution" | undefined;
  return <div className="observations-page">
    <section className="observation-publish-first" aria-labelledby="observation-publish-title">
      <div className="observation-publish-heading"><span>VOTRE CARNET DU VIVANT</span><h1 id="observation-publish-title">Commencez par partager<br/><em>votre rencontre.</em></h1><p>Une photo ou une vidéo suffit pour raconter ce que vous avez observé.</p></div>
      {user ? <CommunityFeed currentUserId={user.id} currentUserRole={role} initialComposerOpen /> : <div className="mx-auto mt-6 max-w-3xl border-y border-border py-8 text-center"><h2 className="font-serif text-2xl">Les publications TERRA sont réservées aux membres.</h2><Link href="/connexion?next=%2Fobservations" className="herbarium-button herbarium-button-primary mt-4">Se connecter</Link></div>}
    </section>
    <ObservationExplorer isAuthenticated={!!user} initialQuery={initialQuery} />
  </div>;
}
