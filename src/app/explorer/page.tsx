import type { Metadata } from "next";
import { ArrowRight, Compass, Leaf } from "lucide-react";
import Link from "next/link";
import CommunityFeed from "@/components/community/CommunityFeed";
import NatureAppHeader from "@/components/navigation/NatureAppHeader";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Explorer les publications — SunuNature",
  description: "Découvrez les plantes, insectes et animaux observés et partagés par la communauté SunuNature.",
};

export default async function ExplorerPage() {
  const user = await getSessionUser();
  const role = user?.role.toLowerCase() as "user" | "admin" | "institution" | undefined;

  return (
    <main className="nature-explorer-page">
      <NatureAppHeader user={user ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl } : null} />
      <section className="nature-explorer-intro">
        <span><Compass size={15} /> LE FIL DU VIVANT</span>
        <h1>Explorer les rencontres<br />de la communauté.</h1>
        <p>Plantes, insectes, oiseaux et animaux observés à travers l’Afrique. Chaque publication enrichit notre connaissance du vivant.</p>
        <Link href="/" className="nature-explorer-identify-link"><Leaf size={16} /> Identifier une espèce <ArrowRight size={15} /></Link>
      </section>
      <div className="nature-explorer-feed-wrap">
        <CommunityFeed currentUserId={user?.id} currentUserRole={role} />
      </div>
    </main>
  );
}
