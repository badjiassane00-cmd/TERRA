"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, Compass, Leaf, LogIn, Menu, Shield, Target, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/notifications/NotificationBell";
import CommunitySearch from "@/components/search/CommunitySearch";
import { AppPreferenceControls, useAppPreferences } from "@/components/preferences/AppPreferences";

type HeaderUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
};

export default function NatureAppHeader({ user }: Readonly<{ user: HeaderUser | null }>) {
  const pathname = usePathname();
  const { t } = useAppPreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeClass = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) ? "nature-nav-link active" : "nature-nav-link";
  return (
    <header className="nature-identifier-header nature-app-header">
      <div className="nature-app-header-top">
        <Link href="/" className="nature-identifier-brand" aria-label={t("TERRA, reconnaître le vivant", "TERRA, identify life")}>
          <Leaf size={22} /> TERRA
        </Link>
        <div className="nature-app-header-tools">
          <AppPreferenceControls />
          <button className="nature-mobile-menu-toggle" type="button" aria-label={menuOpen ? t("Fermer le menu", "Close menu") : t("Ouvrir le menu", "Open menu")} aria-expanded={menuOpen} aria-controls="terra-primary-navigation" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}<span>{menuOpen ? t("Fermer", "Close") : t("Menu", "Menu")}</span>
          </button>
        </div>
      </div>
      <nav id="terra-primary-navigation" className={menuOpen ? "is-open" : ""} aria-label={t("Navigation principale", "Main navigation")} onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setMenuOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setMenuOpen(false); }}>
        <Link href="/" className={activeClass("/")} aria-current={pathname === "/" ? "page" : undefined}><Camera size={16} /> {t("Reconnaître", "Identify")}</Link>
        <Link href="/biodiversite" className={`${activeClass("/biodiversite")}${pathname.startsWith("/especes/") ? " active" : ""}`} aria-current={pathname.startsWith("/biodiversite") || pathname.startsWith("/especes/") ? "page" : undefined}><Leaf size={16} /> {t("Biodiversité", "Biodiversity")}</Link>
        <Link href="/explorer" className={`${activeClass("/explorer")}${pathname.startsWith("/observations") || pathname.startsWith("/catalogues") ? " active" : ""}`} aria-current={pathname.startsWith("/explorer") || pathname.startsWith("/observations") || pathname.startsWith("/catalogues") ? "page" : undefined}><Compass size={16} /> {t("Communauté", "Community")}</Link>
        <Link href="/missions" className={activeClass("/missions")} aria-current={pathname.startsWith("/missions") ? "page" : undefined}><Target size={16} /> {t("Missions", "Missions")}</Link>
        <CommunitySearch />
        {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && <Link href="/admin" className={activeClass("/admin")} aria-current={pathname.startsWith("/admin") ? "page" : undefined}><Shield size={16} /> {t("Administration", "Administration")}</Link>}
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
