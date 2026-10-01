import type { Metadata } from "next";
import ObservationExplorer from "@/components/observations/ObservationExplorer";
import CommunityFeed from "@/components/community/CommunityFeed";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Observations — TERRA" };

export default async function ObservationsPage() {
  const user = await getSessionUser();
  const role = user?.role.toLowerCase() as "user" | "admin" | "super_admin" | "institution" | undefined;
  return <div className="observations-page">
    <section className="observation-publish-first" aria-labelledby="observation-publish-title">
      <div className="observation-publish-heading"><span>VOTRE CARNET DU VIVANT</span><h1 id="observation-publish-title">Commencez par partager<br/><em>votre rencontre.</em></h1><p>Une photo ou une vidéo suffit pour raconter ce que vous avez observé.</p></div>
      <CommunityFeed currentUserId={user?.id} currentUserRole={role} initialComposerOpen />
    </section>
    <ObservationExplorer />
  </div>;
}
