import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { ORGANISM_LABELS } from "@/types/nature";
import ProfileFollowButton from "@/components/profile/ProfileFollowButton";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewerId = await getSessionUserId();
  const profile = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, institution: true, bio: true, avatarUrl: true, createdAt: true,
      _count: { select: { followers: true, following: true, communityPosts: true } },
      followers: viewerId ? { where: { followerId: viewerId }, select: { id: true } } : false,
      communityPosts: { where: { removed: false }, orderBy: { createdAt: "desc" }, select: { id: true, plantName: true, imageUrl: true, thumbnailUrl: true, organismGroup: true }, take: 60 },
    },
  });
  if (!profile) notFound();
  const isFollowing = Array.isArray(profile.followers) && profile.followers.length > 0;
  const { followers, ...user } = profile;
  return <main className="nature-profile-page"><header className="nature-profile-topbar"><Link href="/observations"><ArrowLeft size={16} /> Retour au fil</Link><Link href="/">✳ SunuNature</Link></header><section className="nature-profile-heading"><div className="nature-profile-large-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.name.slice(0, 1).toUpperCase()}</div><div className="nature-profile-info"><div className="nature-profile-title"><h1>{profile.name}</h1>{viewerId !== profile.id && <ProfileFollowButton userId={profile.id} initialFollowing={isFollowing} signedIn={!!viewerId} />}</div><p>{profile.institution || "Naturaliste de la communauté"}</p><div className="nature-profile-stats"><span><strong>{profile._count.communityPosts}</strong> observations</span><span><strong>{profile._count.followers}</strong> abonnés</span><span><strong>{profile._count.following}</strong> abonnements</span></div>{profile.bio && <p className="nature-profile-bio">{profile.bio}</p>}<small>Membre depuis {profile.createdAt.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</small></div></section><div className="nature-profile-gallery-heading"><Camera size={17} /> OBSERVATIONS PARTAGÉES</div>{user.communityPosts.length ? <div className="nature-profile-grid">{user.communityPosts.map((post) => <Link key={post.id} href={`/observations/${post.id}`} className="nature-profile-tile"><img src={post.thumbnailUrl || post.imageUrl} alt={post.plantName} /><span>{post.plantName}<small>{ORGANISM_LABELS[post.organismGroup]}</small></span></Link>)}</div> : <div className="nature-profile-empty"><Users size={27} /><p>Les rencontres de ce naturaliste apparaîtront ici.</p></div>}</main>;
}
