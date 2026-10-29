"use client";

import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, Bug, Crosshair, FlaskConical, History, Leaf, Sparkles, Trees, Zap } from "lucide-react";
import PhotoUpload from "@/components/PhotoUpload";
import PlantResult from "@/components/PlantResult";
import NearbySightings from "@/components/NearbySightings";
import IdentificationSharingActions from "@/components/identification/IdentificationSharingActions";
import GamificationPanel from "@/components/gamification/GamificationPanel";
import AIPlantRecognition from "@/components/ai/AIPlantRecognition";
import ARView from "@/components/ar/ARView";
import VoiceAssistant from "@/components/voice/VoiceAssistant";
import FieldSession from "@/components/academic/FieldSession";
import { useAppPreferences } from "@/components/preferences/AppPreferences";

interface PlantIdentificationResult {
  id: string;
  scientific_name: string;
  common_names: string[];
  probability: number;
  description?: string;
  taxonomy?: { kingdom?: string; phylum?: string; class?: string; order?: string; family?: string; genus?: string; species?: string };
  medicinal?: boolean;
  edible_parts?: string[];
  toxicity?: string[];
  watering?: string;
  sunlight?: string;
  soil?: string;
  growth_rate?: string;
  disease_detection?: Array<{ disease: string; confidence: number; description: string; treatment: string[] }>;
  similar_images?: Array<{ url: string; similarity: number }>;
  sources?: { provider: string; gbif?: string };
  alternatives?: Array<{ scientific_name: string; common_names: string[]; probability: number }>;
}
interface HistoryItem { date: string; name: string; imageUrl: string | null; probability: number; mode: "identify" | "disease" | "life" }

type Mode = "identify" | "disease" | "life";
const MODES: Array<{ id: Mode; label: string; englishLabel: string; note: string; englishNote: string; icon: typeof Leaf }> = [
  { id: "identify", label: "Plantes", englishLabel: "Plants", note: "Espèces végétales", englishNote: "Plant species", icon: Leaf },
  { id: "life", label: "Insectes & animaux", englishLabel: "Insects & animals", note: "Le vivant en mouvement", englishNote: "Wildlife in motion", icon: Bug },
  { id: "disease", label: "Santé végétale", englishLabel: "Plant health", note: "Signes & maladies", englishNote: "Symptoms & disease", icon: FlaskConical },
];

export default function IdentificationWorkspace({ userId, userRole, initialMode = "identify", initialLifeTarget = "all", initialRegion = "" }: Readonly<{ userId: string | null; userRole: "user" | null | "admin" | "institution"; initialMode?: Mode; initialLifeTarget?: "insects" | "animals" | "fish" | "all"; initialRegion?: string }>) {
  const { t } = useAppPreferences();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [lifeTarget, setLifeTarget] = useState<"insects" | "animals" | "fish" | "all">(initialLifeTarget);
  const [treatmentStage, setTreatmentStage] = useState<"before" | "after">("before");
  const [heroMotionAllowed, setHeroMotionAllowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PlantIdentificationResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [fieldSessionId, setFieldSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [voiceNote, setVoiceNote] = useState("");
  const requestSequence = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem("sununature_identification_history") || "[]");
        if (Array.isArray(stored)) {
          const cleanHistory = stored.slice(0, 12).filter((entry): entry is HistoryItem => Boolean(entry && typeof entry.name === "string" && typeof entry.date === "string" && Number.isFinite(entry.probability) && ["identify", "disease", "life"].includes(entry.mode))).map((entry) => ({ ...entry, imageUrl: null }));
          setHistory(cleanHistory);
          localStorage.setItem("sununature_identification_history", JSON.stringify(cleanHistory));
        }
      } catch { /* ignore invalid or unavailable cache */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 761px) and (prefers-reduced-motion: no-preference)");
    const update = () => setHeroMotionAllowed(media.matches);
    const timer = window.setTimeout(update, 0);
    media.addEventListener("change", update);
    return () => { window.clearTimeout(timer); media.removeEventListener("change", update); };
  }, []);

  const identify = useCallback(async (file: File) => {
    const requestId = ++requestSequence.current;
    const requestedMode = mode;
    const requestedLifeTarget = lifeTarget;
    const requestedTreatmentStage = treatmentStage;
    const requestedLocation = location;
    const requestedFieldSessionId = fieldSessionId;
    setBusy(true); setError(""); setResult(null);
    try {
      let data: { result?: PlantIdentificationResult; candidates?: Array<{ scientific_name: string; common_names: string[]; probability: number }>; error?: string };
      if (requestedMode === "life") {
        const form = new FormData();
        form.append("image", file);
        form.append("group", requestedLifeTarget);
        const response = await apiFetch("/api/identify-life", { method: "POST", body: form });
        data = await response.json();
        if (!response.ok) throw new Error(data.error || "L’identification du vivant a échoué.");
      } else {
        const form = new FormData(); form.append("image", file); form.append("mode", requestedMode);
        if (requestedMode === "disease") form.append("treatmentStage", requestedTreatmentStage);
        if (requestedLocation) { form.append("lat", String(requestedLocation.lat)); form.append("lng", String(requestedLocation.lng)); }
        if (requestedFieldSessionId) form.append("sessionId", requestedFieldSessionId);
        const response = await apiFetch(requestedMode === "disease" ? "/api/diagnose-disease" : "/api/identify", { method: "POST", body: form });
        data = await response.json();
        if (!response.ok) throw new Error(data.error || "L’analyse a échoué.");
      }
      if (!data.result?.scientific_name) throw new Error("Aucun résultat. Réessayez avec une photo nette et bien cadrée.");
      if (requestId !== requestSequence.current) return;
      const identified = { ...data.result, alternatives: requestedMode === "life" ? data.candidates : undefined };
      setResult(identified);
      // Keep uploaded photos out of localStorage: data URLs can be large and contain private location/context.
      const item: HistoryItem = { date: new Date().toISOString(), name: identified.common_names?.[0] || identified.scientific_name, imageUrl: null, probability: identified.probability, mode: requestedMode };
      setHistory((previous) => { const next = [item, ...previous].slice(0, 12); try { localStorage.setItem("sununature_identification_history", JSON.stringify(next)); } catch { /* quota or private mode */ } return next; });
    } catch (caught) { if (requestId === requestSequence.current) setError(caught instanceof Error ? caught.message : "Une erreur a empêché l’identification."); }
    finally { if (requestId === requestSequence.current) setBusy(false); }
  }, [mode, treatmentStage, location, fieldSessionId, lifeTarget]);

  function identifyPhoto(file: File) {
    setImageFile(file);
    void identify(file);
  }

  function updatePreview(value: string | null) {
    setPreview(value);
    if (!value) setImageFile(null);
  }

  function requestLocation() {
    if (!navigator.geolocation) { setError("La géolocalisation n’est pas disponible sur cet appareil."); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => { setLocation({ lat: coords.latitude, lng: coords.longitude }); setError(""); }, () => setError("Position non disponible. Vous pouvez continuer sans la partager."), { timeout: 10_000, maximumAge: 300_000 });
  }

  return <div className="nature-identifier-workspace">
    <section className="nature-identifier-hero">{heroMotionAllowed && <video className="nature-identifier-hero-video" autoPlay muted loop playsInline preload="none" poster="/images/terra-hero.webp" aria-hidden="true" tabIndex={-1}><source src="/videos/terra-biodiversity.mp4" type="video/mp4" /></video>}<div className="nature-identifier-hero-copy"><span className="nature-identifier-eyebrow"><Sparkles size={14} /> TERRA · {t("LE RÉSEAU MONDIAL DU VIVANT", "THE GLOBAL NETWORK FOR LIFE")}</span><h1>{t("Photographiez la", "Photograph the")}<br /><em>{t("vie", "life")}</em> {t("autour de vous.", "around you.")}</h1><p>{t("Plante, insecte, oiseau ou mammifère : partagez une image, obtenez des pistes d’identification et enrichissez les savoirs du terrain.", "Plants, insects, birds, or mammals: share a photo, get identification suggestions, and add to field knowledge.")}</p><div className="nature-hero-actions"><Link href="#reconnaissance" className="nature-hero-cta">{t("Commencer une identification", "Start identifying")} <ArrowRight size={16} /></Link><Link href="/biodiversite" className="nature-hero-secondary">{t("Explorer les espèces", "Explore species")}</Link><Link href="/explorer" className="nature-hero-secondary">{t("Découvrir le réseau", "Explore the network")}</Link></div><div className="nature-identifier-trust"><span><BadgeCheck size={15} /> {t("Une proposition, à confirmer", "A suggestion to verify")}</span><span><Trees size={15} /> {t("Des savoirs naturalistes partagés partout", "Naturalist knowledge shared worldwide")}</span></div></div><div className="nature-identifier-hero-art"><span>01 / {t("OBSERVER", "OBSERVE")}</span><div className="nature-identifier-orbit"><Leaf /><Bug /><span>✳</span></div><strong>{t("Observer.", "Observe.")}<br />{t("Comprendre.", "Understand.")}<br />{t("Transmettre.", "Share knowledge.")}</strong></div></section>
    <div className="nature-identifier-layout"><section className="nature-identifier-main" id="reconnaissance"><div className="nature-mode-selector" id="identifier" role="group" aria-label={t("Type d’identification", "Identification type")}>{MODES.map(({ id, label, englishLabel, note, englishNote, icon: Icon }) => <button type="button" key={id} className={mode === id ? "active" : ""} aria-pressed={mode === id} onClick={() => { requestSequence.current++; setBusy(false); setMode(id); setResult(null); setError(""); }}><span><Icon size={18} /></span><strong>{t(label, englishLabel)}</strong><small>{t(note, englishNote)}</small></button>)}</div>
      {mode === "life" && <><div className="nature-mode-selector" role="group" aria-label={t("Groupe du vivant", "Life group")}>{[{ id: "all" as const, label: t("Tous les êtres vivants", "All living things"), note: t("Plantes, champignons, animaux…", "Plants, fungi, animals…"), icon: Sparkles }, { id: "insects" as const, label: t("Insectes & invertébrés", "Insects & invertebrates"), note: t("Insectes, araignées, mollusques", "Insects, spiders, mollusks"), icon: Bug }, { id: "animals" as const, label: t("Animaux terrestres", "Land animals"), note: t("Oiseaux, reptiles, mammifères", "Birds, reptiles, mammals"), icon: Trees }, { id: "fish" as const, label: t("Poissons & vie aquatique", "Fish & aquatic life"), note: t("Poissons, animaux aquatiques", "Fish and aquatic animals"), icon: Leaf }].map(({ id, label, note, icon: Icon }) => <button type="button" key={id} className={lifeTarget === id ? "active" : ""} aria-pressed={lifeTarget === id} onClick={() => { requestSequence.current++; setBusy(false); setLifeTarget(id); setResult(null); setError(""); }}><span><Icon size={18} /></span><strong>{label}</strong><small>{note}</small></button>)}</div><p className="nature-identifier-note"><Zap size={14} /> {t("BioCLIP analyse la photo; Gemini sert de solution de repli si le service BioCLIP ne répond pas. La photo est transmise au fournisseur utilisé; vérifiez les suggestions auprès de la communauté ou d’une personne spécialiste.", "BioCLIP analyzes the photo; Gemini is used as a fallback if BioCLIP is unavailable. Your photo is sent to the provider used. Verify suggestions with the naturalist community or a specialist.")}</p></>}
      {mode === "disease" && <p className="nature-identifier-note"><AlertTriangle size={14} /> Modèle open source PlantVillage (38 classes de cultures). Le résultat est une piste visuelle et ne remplace pas un diagnostic agronomique ; espèces et conditions de terrain limitées.</p>}
      {mode === "disease" && <div className="nature-treatment-choice"><span><AlertTriangle size={16} /> Moment du diagnostic</span>{(["before", "after"] as const).map((stage) => <button key={stage} onClick={() => setTreatmentStage(stage)} className={treatmentStage === stage ? "active" : ""}>{stage === "before" ? "Avant traitement" : "Après traitement"}</button>)}</div>}
      <div className="nature-identifier-tools"><button onClick={requestLocation} className={location ? "enabled" : ""}><Crosshair size={16} /> {location ? "Position activée" : "Ajouter ma position"}</button>{userId && <span><BadgeCheck size={14} /> Session de terrain disponible dans votre espace</span>}</div>
      {userId && <div className="nature-field-session"><FieldSession userId={userId} onSessionChange={setFieldSessionId} /></div>}
      <div className="nature-recognition-grid"><div><PhotoUpload onImageUpload={identifyPhoto} isLoading={busy} onPreviewChange={updatePreview} />{error && <div className="nature-identifier-error" role="alert">{error}</div>}</div><div className="nature-identification-result"><PlantResult result={result} isLoading={busy} previewUrl={preview} userId={userId || undefined} userRole={userRole || undefined} mode={mode} />{result && <IdentificationSharingActions key={`${mode}:${result.id}:${imageFile?.name}:${imageFile?.size}:${imageFile?.lastModified}`} result={result} imageFile={imageFile} mode={mode} lifeTarget={lifeTarget} userId={userId} region={initialRegion} />}{result && <NearbySightings scientificName={result.scientific_name} location={location} />}</div></div>
    </section><aside className="nature-identifier-side"><div className="nature-identify-side-card"><span>VOTRE JOURNAL</span><History size={20} /><h2>Chaque sortie<br />laisse une trace.</h2><p>Retrouvez ici les identifications faites sur cet appareil.</p><strong>{history.length} rencontre{history.length > 1 ? "s" : ""} récemment</strong></div>{history.slice(0, 4).map((entry, index) => <article className="nature-history-item" key={index}>{entry.imageUrl ? <Image src={entry.imageUrl} alt="" width={40} height={40} unoptimized /> : <span><Leaf size={18} /></span>}<div><strong>{entry.name}</strong><small>{new Date(entry.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {Math.round(entry.probability * 100)}%</small></div></article>)}{userId ? <GamificationPanel userId={userId} /> : <div className="nature-identifier-login"><strong>Construisez votre carnet vivant</strong><p>Connectez-vous pour conserver vos sorties et faire grandir votre profil naturaliste.</p><Link href="/connexion">Rejoindre TERRA <ArrowRight size={15} /></Link></div>}</aside></div>
      <section className="nature-ai-contribution"><div><span>{t("LA SCIENCE S’ENRICHIT ENSEMBLE", "SCIENCE GROWS THROUGH SHARING")}</span><h2>{t("Votre connaissance peut améliorer les prochains résultats.", "Your knowledge can improve future identifications.")}</h2><p>{t("Contribuez à l’identification botanique et partagez les noms transmis dans votre région.", "Help improve plant identification and share the names used in your region.")}</p></div><AIPlantRecognition /></section>
    <details className="nature-immersive-tools"><summary><span><Sparkles size={17} /> Explorer en mode terrain immersif</span><small>Réalité augmentée · assistant vocal</small></summary><div className="nature-immersive-grid"><div><h2>Une observation mains libres</h2><p>Capturez une photo avec la caméra immersive ou dictez le nom que vous connaissez.</p>{voiceNote && <p className="nature-voice-note" role="status">{voiceNote}</p>}<VoiceAssistant onResult={(text) => setVoiceNote("Note vocale : " + text)} onPlantIdentified={(name) => setVoiceNote("Espèce prononcée : " + name)} /></div><div><ARView onCapture={identifyPhoto} /></div></div></details>
  </div>;
}
