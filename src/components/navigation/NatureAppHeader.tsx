"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Camera, Compass, Leaf, LogIn, MapPinned, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/notifications/NotificationBell";
import CommunitySearch from "@/components/search/CommunitySearch";

type HeaderUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
};

export default function NatureAppHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const activeClass = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) ? "nature-nav-link active" : "nature-nav-link";
  return (
    <header className="nature-identifier-header nature-app-header">
      <Link href="/" className="nature-identifier-brand" aria-label="TERRA, reconnaître le vivant">
        <Leaf size={22} /> TERRA
      </Link>
      <nav aria-label="Navigation principale">
        <Link href="/" className={activeClass("/")} aria-current={pathname === "/" ? "page" : undefined}><Camera size={16} /> Reconnaître</Link>
        <Link href="/explorer" className={activeClass("/explorer")} aria-current={pathname.startsWith("/explorer") ? "page" : undefined}><Compass size={16} /> Explorer</Link>
        <CommunitySearch />
        <Link href="/observations" className={activeClass("/observations")} aria-current={pathname.startsWith("/observations") ? "page" : undefined}><MapPinned size={16} /> Observations</Link>
        {user && <Link href="/catalogues" className={activeClass("/catalogues")} aria-current={pathname.startsWith("/catalogues") ? "page" : undefined}><BookOpen size={16} /> Catalogues</Link>}
        {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && <Link href="/admin" className={activeClass("/admin")}><Shield size={16} /> Administration</Link>}
        {user ? (
          <>
            <NotificationBell />
            <Link href={`/profile/${user.id}`} className={`nature-app-header-profile ${pathname.startsWith("/profile/") ? "active" : ""}`} aria-current={pathname.startsWith("/profile/") ? "page" : undefined}>
              <span className="nature-app-header-avatar">
                {user.avatarUrl ? <Image src={user.avatarUrl} alt="" width={32} height={32} unoptimized /> : user.name.slice(0, 1).toUpperCase()}
              </span>
              <span>Ma galerie</span>
            </Link>
          </>
        ) : (
          <Link href="/connexion" className={activeClass("/connexion")} aria-current={pathname.startsWith("/connexion") ? "page" : undefined}><LogIn size={16} /> Connexion</Link>
        )}
      </nav>
    </header>
  );
}
