"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import RegionalExhibition from "@/components/RegionalExhibition";
import BotanicalBackground from "@/components/three/BotanicalBackground";
import GamificationPanel from "@/components/gamification/GamificationPanel";
import CommunityFeed from "@/components/community/CommunityFeed";
import NotificationBell from "@/components/notifications/NotificationBell";
import DailyNatureQuest from "@/components/community/DailyNatureQuest";
import SmartReminders from "@/components/notifications/SmartReminders";
import MyExhibitions from "@/components/exhibitions/MyExhibitions";
import ResearchExport from "@/components/exhibitions/ResearchExport";
import AcademicJournal from "@/components/academic/AcademicJournal";
import PlantQuiz from "@/components/academic/PlantQuiz";
import { type OrganismFilter } from "@/types/nature";
import {
  Leaf,
  Menu,
  X,
  User,
  AlertTriangle,
  Camera,
  UserPlus,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  Crosshair,
  Globe,
  MapPin,
  Bug,
  Bird,
  PawPrint,
  TreePine,
  ArrowRight,
} from "lucide-react";

const BotanicalMap = dynamic(() => import("@/components/map/BotanicalMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-primary/5 rounded-2xl flex items-center justify-center">
      <p className="text-foreground/60">Chargement de la carte...</p>
    </div>
  ),
});

const DiseaseHeatmap = dynamic(() => import("@/components/map/DiseaseHeatmap"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-accent/5 rounded-2xl flex items-center justify-center">
      <p className="text-foreground/60">Chargement de la carte des maladies...</p>
    </div>
  ),
});

const TrackingJournal = dynamic(() => import("@/components/journal/TrackingJournal"), {
  ssr: false,
});

interface User {
  id: string;
  email: string;
  name: string;
  institution?: string;
  role: "user" | "admin" | "institution";
}

type AuthMode = "login" | "signup" | null;

export default function Home() {
  const router = useRouter();
  const [organismFilter, setOrganismFilter] = useState<OrganismFilter>("ALL");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "", institution: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationNotice, setLocationNotice] = useState("");
  const userLoaded = useRef(false);

  const loadInitialData = useCallback(() => {
    // On affiche d'abord ce qui est en cache local pour un rendu
    // instantané, puis on vérifie auprès du serveur (cookie httpOnly)
    // que la session est bien valide — localStorage seul ne prouve
    // rien, n'importe qui peut le modifier depuis la console.
    const savedUser = localStorage.getItem("botanique_user");
    if (savedUser && !userLoaded.current) {
      try {
        setUser(JSON.parse(savedUser));
        userLoaded.current = true;
      } catch {}
    }

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("botanique_user", JSON.stringify(data.user));
          userLoaded.current = true;
        } else {
          setUser(null);
          localStorage.removeItem("botanique_user");
          userLoaded.current = false;
        }
      })
      .catch(() => {});

  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitialData();

  }, [loadInitialData]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then((registrations) => registrations.forEach((registration) => void registration.unregister())).catch(() => {});
      if ("caches" in window) caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("sununature-" )).map((key) => caches.delete(key)))).catch(() => {});
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  const handleAuth = async (action: "login" | "signup") => {
    setAuthError(null);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, password: authForm.password, name: authForm.name, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUser(data.user);
      localStorage.setItem("botanique_user", JSON.stringify(data.user));
      setAuthMode(null);
      setAuthForm({ email: "", password: "", name: "", institution: "" });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("botanique_user");
    fetch("/api/auth", { method: "DELETE" }).catch(() => {});
  };

  const enableLocation = () => {
    if (!navigator.geolocation) { setLocationNotice("La géolocalisation n’est pas disponible."); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setUserLocation({ lat: coords.latitude, lng: coords.longitude }); setLocationNotice("Position ajoutée à votre carte."); },
      () => setLocationNotice("Position non disponible. Vous pouvez explorer sans la partager."),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BotanicalBackground />

      <nav className="sticky top-0 z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Leaf className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-foreground">SunuNature</span>
            </motion.div>

            <div className="hidden md:flex items-center gap-8">
              {["fil", "identification", "carte"].map((section, index) => (
                <motion.a
                  key={section}
                  href={section === "identification" ? "/identifier" : `#${section}`}
                  className="text-foreground/70 hover:text-primary transition-colors"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  {section === "fil" ? "Découvrir" : section === "identification" ? "Identifier" : "Carte"}
                </motion.a>
              ))}
              {user ? (
                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <NotificationBell />
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.role === "institution" ? (
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <Link href={`/profile/${user.id}`} className="text-left hover:text-primary">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-foreground/60">Ma galerie · {user.institution || user.email}</p>
                    </Link>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  onClick={() => router.push("/connexion")}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogIn className="w-4 h-4" />
                  Connexion
                </motion.button>
              )}
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden bg-white border-t border-border"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="px-4 py-4 space-y-3">
                {["fil", "identification", "carte"].map((section) => (
                  <a
                    key={section}
                    href={section === "identification" ? "/identifier" : `#${section}`}
                    className="block text-foreground/70 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {section === "fil" ? "Découvrir" : section === "identification" ? "Identifier" : "Carte"}
                  </a>
                ))}
                {user ? (
                  <div className="space-y-2">
                    <Link href={`/profile/${user.id}`} className="block font-medium text-foreground">Ma galerie · {user.name}</Link>
                    <Link href="/notifications" className="block font-medium text-foreground">Notifications et alertes</Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-foreground/70"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => router.push("/connexion")}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full w-full justify-center"
                  >
                    <LogIn className="w-4 h-4" />
                    Connexion
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {authMode && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-paper border border-border rounded-2xl shadow-xl max-w-md w-full p-8 relative"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <button
                onClick={() => { setAuthMode(null); setAuthError(null); }}
                className="absolute top-4 right-4 text-foreground/40 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center">
                  {authMode === "login" ? (
                    <LogIn className="w-5 h-5 text-primary" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-primary" />
                  )}
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground">
                  {authMode === "login" ? "Connexion" : "Créer un compte"}
                </h2>
              </div>

              {authError && (
                <motion.div
                  className="mb-4 p-3 bg-terracotta/10 border border-terracotta/30 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm text-terracotta">{authError}</p>
                </motion.div>
              )}

              <div className="space-y-4">
                {authMode === "signup" && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        value={authForm.name}
                        onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                        className="herbarium-input"
                        placeholder="Jean Dupont"
                      />
                    </motion.div>

                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="herbarium-input"
                    placeholder="vous@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="herbarium-input"
                    placeholder="••••••••"
                  />
                </div>
                <motion.button
                  onClick={() => handleAuth(authMode)}
                  className="herbarium-button herbarium-button-primary w-full py-3 rounded-full font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {authMode === "login" ? "Se connecter" : "S&apos;inscrire"}
                </motion.button>
              </div>

              <p className="text-center text-sm text-foreground/60 mt-6">
                {authMode === "login" ? (
                  <>
                    Pas encore de compte ?{" "}
                    <button
                      onClick={() => setAuthMode("signup")}
                      className="text-primary font-medium hover:underline"
                    >
                      S&apos;inscrire
                    </button>
                  </>
                ) : (
                  <>
                    Déjà un compte ?{" "}
                    <button
                      onClick={() => setAuthMode("login")}
                      className="text-primary font-medium hover:underline"
                    >
                      Se connecter
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="wild-hero px-4 py-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="wild-hero-panel">
            <div className="wild-hero-copy">
              <span className="wild-eyebrow"><span className="wild-live-dot" /> LE VIVANT, RACONTÉ PAR L’AFRIQUE</span>
              <h1>Chaque rencontre<br />avec la nature <em>compte.</em></h1>
              <p>Observez, identifiez et partagez les espèces qui vous entourent. Une communauté africaine pour mieux connaître et protéger notre biodiversité.</p>
              <div className="wild-hero-actions">
                <button type="button" onClick={() => { window.dispatchEvent(new Event("sununature:compose")); document.getElementById("fil")?.scrollIntoView({ behavior: "smooth" }); }} className="wild-button-primary"><Camera size={18} /> Partager une observation</button>
                <a href="#fil" className="wild-button-quiet">Explorer les découvertes <ArrowRight size={16} /></a>
              </div>
              <div className="wild-community-proof"><div className="wild-avatar-stack"><span>🌿</span><span>🦋</span><span>🐦</span></div><span>La nature n’a pas de frontières.<br /><strong>Votre regard enrichit la science.</strong></span></div>
            </div>
            <div className="wild-hero-art" role="img" aria-label="Photo d’une forêt tropicale" />
          </div>
          <div className="wild-stats-strip"><span><strong>Plantes</strong> médecine, forêt, savane</span><i /><span><strong>Insectes</strong> pollinisateurs & alliés</span><i /><span><strong>Oiseaux, mammifères</strong> et tout le vivant</span><i /><span className="wild-location"><MapPin size={15} /> De Dakar à Nairobi</span></div>
        </div>
      </section>


      <section id="fil" className="wild-discover px-4 py-10 md:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="wild-section-heading"><div><span className="wild-eyebrow dark">LA COMMUNAUTÉ DU VIVANT</span><h2>Le fil des découvertes</h2><p>Les observations récentes de naturalistes d’ici et d’ailleurs.</p></div><Link href="/observations" className="wild-text-link">Toutes les observations <ArrowRight size={16} /></Link></div>
          <div className="wild-category-row">
            {[
              { name: "Plantes", detail: "Fleurs, arbres, herbes", icon: Leaf, tone: "sage", group: "PLANT" as const },
              { name: "Insectes", detail: "Pollinisateurs, papillons", icon: Bug, tone: "ochre", group: "INSECT" as const },
              { name: "Oiseaux", detail: "Des jardins aux mangroves", icon: Bird, tone: "sky", group: "BIRD" as const },
              { name: "Animaux", detail: "Mammifères & reptiles", icon: PawPrint, tone: "clay", group: "MAMMAL" as const },
              { name: "Écosystèmes", detail: "Forêts, savanes, océans", icon: TreePine, tone: "forest", group: "OTHER" as const },
             ].map(({ name, detail, icon: Icon, tone, group }) => <a href="#fil" onClick={() => setOrganismFilter(group)} key={name} className={`wild-category ${tone}`}><span className="wild-category-icon"><Icon size={21} /></span><span><strong>{name}</strong><small>{detail}</small></span><ArrowRight size={15} className="wild-category-arrow" /></a>)}
          </div>
          <div className="wild-feed-layout">
            <div className="wild-feed-main"><div className="wild-feed-tabs"><span className="active">Pour vous</span><a href="#carte">À proximité</a><Link href="/identifier">À identifier</Link><button onClick={() => { window.dispatchEvent(new Event("sununature:compose")); document.getElementById("fil")?.scrollIntoView({ behavior: "smooth" }); }}><Camera size={16} /> Publier</button></div><CommunityFeed currentUserId={user?.id} currentUserRole={user?.role} groupFilter={organismFilter} onGroupFilterChange={setOrganismFilter} /></div>
            <aside className="wild-side-column">
              <DailyNatureQuest userId={user?.id} />
              <div className="wild-side-card wild-field-note"><span className="wild-eyebrow dark">LE CARNET AFRICAIN</span><div className="wild-note-art"><span>🌱</span><span>🦋</span><span>🐝</span></div><h3>Le vivant, dans toutes ses langues.</h3><p>Partagez les noms locaux et les savoirs transmis dans votre communauté.</p><button onClick={() => user ? (window.dispatchEvent(new Event("sununature:compose")), document.getElementById("fil")?.scrollIntoView({ behavior: "smooth" })) : setAuthMode("login")}><UserPlus size={15} /> {user ? "Partager une observation" : "Rejoindre la communauté"}</button></div>
            </aside>
          </div>
        </div>
      </section>



      <section className="py-16 px-4 bg-paper">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              Expériences innovantes
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Outils intelligents
            </h2>
            <p className="text-base text-foreground/70 max-w-2xl mx-auto">
              Assistant vocal, réalité augmentée, gamification et communauté
              pour une expérience botanique moderne.
            </p>
          </div>

          <div className="nature-modern-shortcuts">
            <Link href="/identifier" className="nature-modern-shortcut nature-modern-shortcut-scan"><span>✳ STUDIO IA</span><strong>Identifier une rencontre</strong><small>Plantes · Insectes · Faune · Diagnostic</small><ArrowRight size={18} /></Link>
            <Link href="/observations" className="nature-modern-shortcut nature-modern-shortcut-community"><span>✦ COMMUNAUTÉ</span><strong>Explorer les galeries</strong><small>Des observations partagées depuis l’Afrique</small><ArrowRight size={18} /></Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-8">
              <GamificationPanel userId={user?.id} />
              <SmartReminders userId={user?.id} />
            </div>
          </div>

          {user && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TrackingJournal userId={user.id} />
              <MyExhibitions userId={user.id} />
            </div>
          )}
          {user && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AcademicJournal userId={user.id} />
              <ResearchExport userId={user.id} userRole={user.role} />
            </div>
          )}
          <div className="mt-8">
            <PlantQuiz />
          </div>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <RegionalExhibition />
      </motion.div>

      <section id="carte" className="py-16 px-4 bg-gradient-to-b from-white to-background">
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4 border border-primary/10">
              <Globe className="w-4 h-4" />
              Explorer les écosystèmes
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              La biodiversité près de vous
            </h2>
            <p className="text-base text-foreground/70 max-w-2xl mx-auto">
              Explorez les espaces naturels et les lieux de découverte en Afrique de l’Ouest.
            </p>
            <button className="nature-map-location-button" onClick={enableLocation}><Crosshair size={15} /> {userLocation ? "Position activée" : "Me situer sur la carte"}</button>
            {locationNotice && <p className="nature-location-notice" role="status">{locationNotice}</p>}
          </div>

          <BotanicalMap
            region="Afrique de l'Ouest"
            userLocation={userLocation}
          />
        </motion.div>
      </section>

      <section id="maladies" className="py-16 px-4 bg-paper">
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm mb-4 border border-accent/10">
              <AlertTriangle className="w-4 h-4" />
              Veille sanitaire
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Foyers de maladies détectés
            </h2>
            <p className="text-base text-foreground/70 max-w-2xl mx-auto">
              Construite à partir des scans réalisés par la communauté (positions regroupées
              par zone pour préserver la confidentialité). Utile pour anticiper les traitements
              en pépinière ou en exploitation.
            </p>
          </div>

          <DiseaseHeatmap center={userLocation ?? undefined} />
        </motion.div>
      </section>

      <footer className="bg-primary-dark text-white py-12 px-4 relative">
        <div className="absolute inset-0 botanical-gradient opacity-50"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 h-6" />
                <span className="text-lg font-bold">SunuNature</span>
              </div>
              <p className="text-white/70 text-sm">
                Réseau africain pour observer, identifier et partager les plantes, les insectes, les oiseaux et la vie sauvage.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Fonctionnalités</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Identification par photo</li>
                <li>Détection de maladies</li>
                <li>Conseils d&apos;entretien</li>
                <li>Carte régionale</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Public cible</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Universités</li>
                <li>Pépinières</li>
                <li>Commerçants</li>
                <li>Grand public</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Documentation</li>
                <li>Support</li>
                <li>Partenariats</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-white/50">
            © 2026 SunuNature. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
