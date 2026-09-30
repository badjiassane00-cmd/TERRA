import type { Metadata } from "next";
import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import CommunityFeed from "@/components/community/CommunityFeed";
import NatureAppHeader from "@/components/navigation/NatureAppHeader";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Explorer les publications — TERRA",
  description: "Découvrez les plantes, insectes et animaux observés et partagés par la communauté TERRA.",
};

export default async function ExplorerPage() {
  const user = await getSessionUser();
  const role = user?.role.toLowerCase() as "user" | "admin" | "institution" | undefined;

  return (
    <main className="nature-explorer-page">
      <NatureAppHeader user={user ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl } : null} />
      <section className="nature-explorer-intro" id="reseau" aria-labelledby="explorer-title">
        <div className="nature-explorer-copy">
          <span><Compass size={15} /> 03 — LE RÉSEAU</span>
          <h1 id="explorer-title">Un réseau social<br />pour la <em>nature</em>.</h1>
          <p>TERRA relie naturalistes, chercheurs, écoles et curieux partout dans le monde pour observer, identifier et documenter la biodiversité.</p>
          <ul><li>Partagez vos photos et observations de terrain</li><li>Suivez des espèces, des régions et des naturalistes</li><li>Contribuez aux identifications et aux projets participatifs</li></ul>
          <Link href="#publications" className="nature-explorer-identify-link">Explorer les publications <ArrowRight size={15} /></Link>
        </div>
        <span className="nature-explorer-image-credit">OBSERVATIONS PARTAGÉES · COMMUNAUTÉ INTERNATIONALE</span>
      </section>
      <section className="nature-explorer-publications" id="publications" aria-label="Publications de la communauté">
        <div className="nature-explorer-section-heading"><div><span>LE CARNET COLLECTIF</span><h2>Rencontres récentes</h2></div><Link href="/observations">Carte et observations <ArrowRight size={15} /></Link></div>
        <div className="nature-explorer-feed-wrap"><CommunityFeed currentUserId={user?.id} currentUserRole={role} /></div>
      </section>
    </main>
  );
}
