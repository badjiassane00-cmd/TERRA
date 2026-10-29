"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, Compass, Leaf, LogIn, Shield, Target } from "lucide-react";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/notifications/NotificationBell";
import CommunitySearch from "@/components/search/CommunitySearch";
import { useAppPreferences } from "@/components/preferences/AppPreferences";

type HeaderUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
};

export default function NatureAppHeader({ user }: Readonly<{ user: HeaderUser | null }>) {
  const pathname = usePathname();
  const { t } = useAppPreferences();
  const activeClass = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) ? "nature-nav-link active" : "nature-nav-link";
  return (
    <header className="nature-identifier-header nature-app-header">
      <Link href="/" className="nature-identifier-brand" aria-label={t("TERRA, reconnaître le vivant", "TERRA, identify life")}>
        <Leaf size={22} /> TERRA
      </Link>
      <nav aria-label={t("Navigation principale", "Main navigation")}>
        <Link href="/" className={activeClass("/")} aria-current={pathname === "/" ? "page" : undefined}><Camera size={16} /> {t("Reconnaître", "Identify")}</Link>
        <Link href="/biodiversite" className={`${activeClass("/biodiversite")}${pathname.startsWith("/especes/") ? " active" : ""}`} aria-current={pathname.startsWith("/biodiversite") || pathname.startsWith("/especes/") ? "page" : undefined}><Leaf size={16} /> {t("Biodiversité", "Biodiversity")}</Link>
        <Link href="/explorer" className={`${activeClass("/explorer")}${pathname.startsWith("/observations") || pathname.startsWith("/catalogues") ? " active" : ""}`} aria-current={pathname.startsWith("/explorer") || pathname.startsWith("/observations") || pathname.startsWith("/catalogues") ? "page" : undefined}><Compass size={16} /> {t("Communauté", "Community")}</Link>
        <Link href="/missions" className={activeClass("/missions")}><Target size={16} /> {t("Missions", "Missions")}</Link>
        <CommunitySearch />
        {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && <Link href="/admin" className={activeClass("/admin")}><Shield size={16} /> {t("Administration", "Administration")}</Link>}
        {user ? (
          <>
            <NotificationBell />
            <Link href="/explorer?section=galerie" className={`nature-app-header-profile ${pathname.startsWith("/profile/") ? "active" : ""}`} aria-current={pathname.startsWith("/profile/") ? "page" : undefined}>
              <span className="nature-app-header-avatar">
                {user.avatarUrl ? <Image src={user.avatarUrl} alt="" width={32} height={32} unoptimized /> : user.name.slice(0, 1).toUpperCase()}
              </span>
              <span>{t("Ma galerie", "My gallery")}</span>
            </Link>
          </>
        ) : (
          <Link href="/connexion" className={activeClass("/connexion")} aria-current={pathname.startsWith("/connexion") ? "page" : undefined}><LogIn size={16} /> {t("Connexion", "Sign in")}</Link>
        )}
      </nav>
    </header>
  );
}
