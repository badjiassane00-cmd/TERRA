import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Camera, Compass, MapPinned, Users } from "lucide-react";
import CommunityFeed from "@/components/community/CommunityFeed";
import ObservationExplorer from "@/components/observations/ObservationExplorer";
import PersonalCatalogs from "@/components/catalogs/PersonalCatalogs";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ORGANISM_LABELS } from "@/types/nature";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Communauté naturaliste — TERRA",
  description: "Retrouvez le fil naturaliste, les observations, votre galerie et vos catalogues dans un espace communautaire unique.",
};

const SECTIONS = [
  { id: "fil", label: "Fil", icon: Users },
  { id: "observations", label: "Observations", icon: MapPinned },
  { id: "galerie", label: "Ma galerie", icon: Camera },
  { id: "catalogues", label: "Catalogues", icon: BookOpen },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

export default async function ExplorerPage({ searchParams }: { searchParams: Promise<{ section?: string | string[]; q?: string | string[]; publier?: string | string[]; source?: string | string[] }> }) {
  const params = await searchParams;
  const requestedSection = Array.isArray(params.section) ? params.section[0] : params.section;
  const section: SectionId = SECTIONS.some((item) => item.id === requestedSection) ? requestedSection as SectionId : "fil";
  const requestedQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const requestedSource = Array.isArray(params.source) ? params.source[0] : params.source;
  const openComposer = Array.isArray(params.publier) ? params.publier[0] === "1" : params.publier === "1";
  const initialQuery = requestedQuery || "";
  const user = await getSessionUser();
  if (!user && section !== "observations") redirect(`/connexion?next=${encodeURIComponent(`/explorer?section=${section}`)}`);
  const role = user?.role.toLowerCase() as "user" | "admin" | "super_admin" | "institution" | undefined;
  const gallery = section === "galerie" && user ? await prisma.communityPost.findMany({
    where: { userId: user.id, removed: false, isEphemeral: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, plantName: true, imageUrl: true, thumbnailUrl: true, organismGroup: true, createdAt: true },
    take: 60,
  }) : [];

  return <div className="community-hub-page">
    <header className="community-hub-hero">
      <div><span><Compass size={15} /> ESPACE NATURALISTE TERRA</span><h1>La communauté<br /><em>du vivant.</em></h1><p>Vos observations, vos rencontres et vos collections réunies au même endroit.</p></div>
      <Link href="/explorer?section=fil&publier=1" className="community-hub-publish"><Camera size={16} /> Partager une observation</Link>
    </header>
    <nav className="community-hub-tabs" aria-label="Sections de la communauté">
      {SECTIONS.map(({ id, label, icon: Icon }) => <Link key={id} href={`/explorer?section=${id}`} aria-current={section === id ? "page" : undefined} className={section === id ? "active" : ""}><Icon size={16} />{label}</Link>)}
    </nav>

    {section === "fil" && <>
      <section className="community-hub-section-heading"><div><span>LE CARNET COLLECTIF</span><h2>Rencontres récentes</h2><p>Échangez autour des découvertes des naturalistes.</p></div><Link href="/explorer?section=observations">Parcourir les observations <MapPinned size={15} /></Link></section>
      <div className="nature-explorer-feed-wrap"><CommunityFeed currentUserId={user?.id} currentUserRole={role} initialComposerOpen={openComposer} /></div>
    </>}

    {section === "observations" && <ObservationExplorer isAuthenticated={Boolean(user)} initialQuery={initialQuery} initialSource={requestedSource === "iNaturalist" || requestedSource === "TERRA" ? requestedSource : undefined} />}

    {section === "galerie" && user && <section className="community-hub-gallery">
      <header><div><span>VOS RENCONTRES DOCUMENTÉES</span><h2>Ma galerie naturaliste</h2><p>Les observations que vous avez publiées dans la communauté TERRA.</p></div><Link href={`/profile/${user.id}`}>Gérer mon profil</Link></header>
      {gallery.length ? <div className="nature-profile-grid">{gallery.map((post) => <Link key={post.id} href={`/observations/${post.id}`} className="nature-profile-tile"><Image src={post.thumbnailUrl || post.imageUrl} alt={post.plantName} fill sizes="(max-width: 650px) 33vw, 320px" unoptimized /><span>{post.plantName}<small>{ORGANISM_LABELS[post.organismGroup]} · {post.createdAt.toLocaleDateString("fr-FR")}</small></span></Link>)}</div> : <div className="nature-profile-empty"><Camera size={27} /><p>Votre galerie est vide pour l’instant. Partagez votre première rencontre avec le vivant.</p><Link href="/explorer?section=fil&publier=1">Publier une observation</Link></div>}
      <Link className="community-hub-profile-link" href={`/profile/${user.id}`}>Ouvrir mon profil complet et partager ma galerie</Link>
    </section>}

    {section === "catalogues" && <PersonalCatalogs />}
  </div>;
}
