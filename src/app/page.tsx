"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PhotoUpload from "@/components/PhotoUpload";
import PlantResult from "@/components/PlantResult";
import RegionalExhibition from "@/components/RegionalExhibition";
import BotanicalBackground from "@/components/three/BotanicalBackground";
import VoiceAssistant from "@/components/voice/VoiceAssistant";
import ARView from "@/components/ar/ARView";
import GamificationPanel from "@/components/gamification/GamificationPanel";
import CommunityFeed from "@/components/community/CommunityFeed";
import SmartReminders from "@/components/notifications/SmartReminders";
import MyExhibitions from "@/components/exhibitions/MyExhibitions";
import ResearchExport from "@/components/exhibitions/ResearchExport";
import AcademicJournal from "@/components/academic/AcademicJournal";
import PlantQuiz from "@/components/academic/PlantQuiz";
import FieldSession from "@/components/academic/FieldSession";
import AIPlantRecognition from "@/components/ai/AIPlantRecognition";
import NearbySightings from "@/components/NearbySightings";
import { recognizeLifeLocally } from "@/lib/local-life-recognition";
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
  FlaskConical,
  Sparkles,
  ChevronDown,
  Zap,
  Crosshair,
  Brain,
  Globe,
  MapPin,
  Bug,
  Bird,
  PawPrint,
  TreePine,
  Compass,
  ArrowRight,
} from "lucide-react";

const Plant3DShowcase = dynamic(() => import("@/components/three/Plant3DShowcase"), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[260px]" />,
});

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

interface PlantIdentificationResult {
  id: string;
  scientific_name: string;
  common_names: string[];
  probability: number;
  description?: string;
  taxonomy?: {
    family?: string;
    genus?: string;
    species?: string;
  };
  medicinal?: boolean;
  edible_parts?: string[];
  toxicity?: string[];
  watering?: string;
  sunlight?: string;
  soil?: string;
  growth_rate?: string;
  disease_detection?: Array<{
    disease: string;
    confidence: number;
    description: string;
    treatment: string[];
  }>;
  similar_images?: Array<{
    url: string;
    similarity: number;
  }>;
  sources?: { provider: string; gbif?: string };
  alternatives?: Array<{ scientific_name: string; common_names: string[]; probability: number }>;
}

interface User {
  id: string;
  email: string;
  name: string;
  institution?: string;
  role: "user" | "admin" | "institution";
}

type AuthMode = "login" | "signup" | null;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [organismFilter, setOrganismFilter] = useState<OrganismFilter>("ALL");
  const [result, setResult] = useState<PlantIdentificationResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"identify" | "disease" | "life">("identify");
  const [treatmentMode, setTreatmentMode] = useState<"before" | "after">("before");
  const [history, setHistory] = useState<Array<{ date: string; result: PlantIdentificationResult; imageUrl?: string }>>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "", institution: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeFieldSessionId, setActiveFieldSessionId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
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

    const savedHistory = localStorage.getItem("botanique_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {}
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitialData();

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadInitialData]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
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
    if (!navigator.geolocation) {
      setError("La géolocalisation n’est pas prise en charge par ce navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserLocation({ lat: coords.latitude, lng: coords.longitude }),
      () => setError("Position non disponible. Vous pouvez continuer sans la partager."),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const handleImageUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let data: { result?: PlantIdentificationResult; candidates?: Array<{ scientific_name: string; common_names: string[]; probability: number }>; error?: string };
      if (scanMode === "life") {
        const predictions = await recognizeLifeLocally(file);
        const response = await fetch("/api/identify-life", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ predictions }),
        });
        data = await response.json();
        if (!response.ok) throw new Error(data.error || "L’identification du vivant a échoué.");
      } else {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("mode", scanMode);
      if (treatmentMode === "after") {
        formData.append("treatmentStage", "after");
      }
      if (userLocation) {
        formData.append("lat", String(userLocation.lat));
        formData.append("lng", String(userLocation.lng));
      }
      if (activeFieldSessionId) {
        formData.append("sessionId", activeFieldSessionId);
      }

      const response = await fetch("/api/identify", {
        method: "POST",
        body: formData,
      });

      data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'analyse");
      }
      }

      if (data.result?.scientific_name) {
        const plantResult: PlantIdentificationResult = { ...data.result, alternatives: scanMode === "life" ? data.candidates : undefined };

        setResult(plantResult);

        const newEntry = {
          date: new Date().toISOString(),
          result: plantResult,
          imageUrl: preview || undefined,
        };
        const updatedHistory = [newEntry, ...history].slice(0, 20);
        setHistory(updatedHistory);
        localStorage.setItem("botanique_history", JSON.stringify(updatedHistory));
      } else {
        throw new Error("Aucun résultat. Essayez avec une image plus claire et bien cadrée.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, [scanMode, treatmentMode, userLocation, activeFieldSessionId, preview, history]);

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
                  href={`#${section}`}
                  className="text-foreground/70 hover:text-primary transition-colors"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  {section === "fil" ? "Découvrir" : section === "identification" ? "Observer" : "Carte"}
                </motion.a>
              ))}
              {user ? (
                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.role === "institution" ? (
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-foreground/60">{user.institution || user.email}</p>
                    </div>
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
                  onClick={() => window.location.assign("/connexion")}
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
                    href={`#${section}`}
                    className="block text-foreground/70 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {section === "fil" ? "Découvrir" : section === "identification" ? "Observer" : "Carte"}
                  </a>
                ))}
                {user ? (
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">{user.name}</p>
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
                    onClick={() => window.location.assign("/connexion")}
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
              <div className="wild-community-proof"><div className="wild-avatar-stack"><span>🌿</span><span>🦋</span><span>🐦</span><span>🌍</span></div><span>La nature n’a pas de frontières.<br /><strong>Votre regard enrichit la science.</strong></span></div>
            </div>
            <div className="wild-hero-art" aria-label="La biodiversité africaine en trois dimensions">
              <div className="wild-art-label"><span className="wild-live-dot" /> CARNET DE TERRAIN · SÉNÉGAL</div>
              <div className="wild-art-tree"><Plant3DShowcase /></div>
              <div className="wild-art-caption"><span>01 / BIODIVERSITÉ</span><strong>Le vivant est<br />tout autour de nous.</strong></div>
              <div className="wild-art-stamp">VIVANT<br />AFRICAIN</div>
            </div>
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
            <div className="wild-feed-main"><div className="wild-feed-tabs"><span className="active">Pour vous</span><a href="#carte">À proximité</a><a href="#identification">À identifier</a><button onClick={() => { window.dispatchEvent(new Event("sununature:compose")); document.getElementById("fil")?.scrollIntoView({ behavior: "smooth" }); }}><Camera size={16} /> Publier</button></div><CommunityFeed currentUserId={user?.id} currentUserRole={user?.role} groupFilter={organismFilter} onGroupFilterChange={setOrganismFilter} /></div>
            <aside className="wild-side-column">
              <div className="wild-side-card wild-mission"><span className="wild-side-icon"><Compass size={20} /></span><span className="wild-eyebrow dark">MISSION DU JOUR</span><h3>Regardez de plus près.</h3><p>Un arbre en fleur, un papillon de passage ou un chant d’oiseau : votre observation peut aider la recherche.</p><a href="#identification">Commencer une observation <ArrowRight size={15} /></a></div>
              <div className="wild-side-card wild-field-note"><span className="wild-eyebrow dark">LE CARNET AFRICAIN</span><div className="wild-note-art"><span>🌱</span><span>🦋</span><span>🐝</span></div><h3>Le vivant, dans toutes ses langues.</h3><p>Partagez les noms locaux et les savoirs transmis dans votre communauté.</p><button onClick={() => user ? (window.dispatchEvent(new Event("sununature:compose")), document.getElementById("fil")?.scrollIntoView({ behavior: "smooth" })) : setAuthMode("login")}><UserPlus size={15} /> {user ? "Partager une observation" : "Rejoindre la communauté"}</button></div>
            </aside>
          </div>
        </div>
      </section>

      <section id="identification" className="py-20 px-4 bg-gradient-to-b from-background to-white">
        <motion.div
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4 border border-primary/10">
              <Zap className="w-4 h-4" />
              IA Puissante
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              {scanMode === "life" ? "Reconnaissez le vivant" : scanMode === "disease" ? "Examinez vos plantes" : "Identifiez les plantes"}
            </h2>
            <p className="text-base text-foreground/70 max-w-2xl mx-auto">
              {scanMode === "life" ? "Photographiez un insecte, un animal, un champignon ou une plante. L’analyse visuelle s’effectue directement sur votre appareil." : scanMode === "disease" ? "Photographiez une plante pour analyser ses symptômes." : "Photographiez une plante, une fleur ou un arbre pour obtenir une proposition d’identification botanique."}
            </p>
          </motion.div>

          <motion.div className="flex flex-wrap justify-center gap-4 mb-8" variants={itemVariants}>
            {[
              { mode: "identify" as const, label: "Plantes", icon: Leaf, color: "primary" },
              { mode: "life" as const, label: "Insectes & animaux", icon: Sparkles, color: "primary" },
              { mode: "disease" as const, label: "Maladies des plantes", icon: FlaskConical, color: "terracotta" },
            ].map((option) => (
              <motion.button
                key={option.mode}
                onClick={() => setScanMode(option.mode)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors border ${
                  scanMode === option.mode
                    ? option.color === "primary"
                      ? "bg-primary text-white border-primary"
                      : "bg-terracotta text-white border-terracotta"
                    : option.color === "primary"
                      ? "bg-primary/10 text-primary border-border hover:bg-primary/20"
                      : "bg-terracotta/10 text-terracotta border-border hover:bg-terracotta/20"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <option.icon className="w-5 h-5" />
                {option.label}
              </motion.button>
            ))}
            <button
              type="button"
              onClick={enableLocation}
              className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm border transition-colors ${userLocation ? "bg-primary/10 text-primary border-primary/30" : "bg-white text-foreground/70 border-border hover:border-primary"}`}
            >
              <Crosshair className="w-4 h-4" />
              {userLocation ? "Position activée" : "Affiner avec ma position"}
            </button>
            {scanMode === "life" && <p className="mb-4 text-center text-xs text-foreground/60">MobileNet classe les catégories ImageNet les plus proches · la photo reste sur cet appareil · espèces africaines rares parfois non reconnues</p>}
            {scanMode === "disease" && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="text-sm font-medium text-foreground/70">État:</span>
                {[
                  { value: "before" as const, label: "Avant traitement" },
                  { value: "after" as const, label: "Après traitement" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTreatmentMode(t.value)}
                    className={`herbarium-label cursor-pointer ${
                      treatmentMode === t.value ? "bg-primary text-white border-primary" : ""
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <motion.div variants={itemVariants}>
              <PhotoUpload onImageUpload={handleImageUpload} isLoading={isLoading} onPreviewChange={setPreview} />
              {scanMode === "disease" && (
                <motion.div
                  className="mt-4 p-4 border border-terracotta/30 bg-terracotta/5 rounded-xl"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-terracotta mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-terracotta">Mode diagnostic</p>
                      <p className="text-sm text-terracotta/80 mt-1">
                        L&apos;IA analysera les signes de maladie sur votre plante et proposera des traitements.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              {error && (
                <motion.div
                  className="mt-4 p-4 border border-terracotta/30 bg-terracotta/5 rounded-xl"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <p className="text-terracotta text-sm">{error}</p>
                </motion.div>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <PlantResult result={result} isLoading={isLoading} previewUrl={preview} userId={user?.id} userRole={user?.role} mode={scanMode} />
              <NearbySightings scientificName={result?.scientific_name} location={userLocation} />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {history.length > 0 && (
        <section className="py-16 px-4 bg-paper">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Historique & comparaison
                </h2>
                <p className="text-sm text-foreground/60">
                  Suivez l&apos;évolution de vos plantes dans le temps.
                </p>
              </div>
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem("botanique_history");
                }}
                className="herbarium-button text-xs"
              >
                Réinitialiser
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {history.slice(0, 8).map((entry, index) => (
                <div
                  key={index}
                  className="herbarium-card rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setResult(entry.result)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full border border-border bg-paper flex items-center justify-center">
                      <Leaf className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.result.scientific_name}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {new Date(entry.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  {entry.imageUrl && (
                    <img
                      src={entry.imageUrl}
                      alt=""
                      className="w-full h-24 object-cover rounded-lg border border-border mb-2"
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <span className="herbarium-label text-xs">
                      {Math.round(entry.result.probability * 100)}%
                    </span>
                    {entry.result.disease_detection && entry.result.disease_detection.length > 0 && (
                      <span className="text-xs text-terracotta font-medium">
                        {entry.result.disease_detection.length} maladie(s)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-4 bg-gradient-to-b from-background to-paper">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4 border border-primary/10">
              <Brain className="w-4 h-4" />
              Intelligence Artificielle
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Reconnaissance Botanique par IA
            </h2>
            <p className="text-base text-foreground/70 max-w-2xl mx-auto">
              Modèle entraînable qui s&apos;améliore avec vos contributions.
              Chaque identification enrichit la base de données collective.
            </p>
          </div>

          <AIPlantRecognition />
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <VoiceAssistant
              onResult={(text) => console.log("Voice result:", text)}
              onPlantIdentified={(plantName) => console.log("Identified:", plantName)}
            />
            <ARView
              onCapture={(file) => {
                handleImageUpload(file);
              }}
            />
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
          {user && (
            <div className="mt-8">
              <FieldSession userId={user.id} onSessionChange={setActiveFieldSessionId} />
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
