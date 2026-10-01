import Image from "next/image";
import Link from "next/link";
import { BookOpen, Camera, Compass, Leaf, LogIn, MapPinned, Search } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

type HeaderUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export default function NatureAppHeader({ user }: { user: HeaderUser | null }) {
  return (
    <header className="nature-identifier-header nature-app-header">
      <Link href="/" className="nature-identifier-brand" aria-label="TERRA, reconnaître le vivant">
        <Leaf size={22} /> TERRA
      </Link>
      <nav aria-label="Navigation principale">
        <Link href="/"><Camera size={16} /> Reconnaître</Link>
        <Link href="/explorer"><Compass size={16} /> Explorer</Link>
        <Link href="/recherche"><Search size={16} /> Rechercher</Link>
        <Link href="/observations"><MapPinned size={16} /> Observations</Link>
        {user && <Link href="/catalogues"><BookOpen size={16} /> Catalogues</Link>}
        {user ? (
          <>
            <NotificationBell />
            <Link href={`/profile/${user.id}`} className="nature-app-header-profile">
              <span className="nature-app-header-avatar">
                {user.avatarUrl ? <Image src={user.avatarUrl} alt="" width={32} height={32} unoptimized /> : user.name.slice(0, 1).toUpperCase()}
              </span>
              <span>Ma galerie</span>
            </Link>
          </>
        ) : (
          <Link href="/connexion"><LogIn size={16} /> Connexion</Link>
        )}
      </nav>
    </header>
  );
}
