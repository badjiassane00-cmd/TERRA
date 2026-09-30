"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, Bug, Crosshair, FlaskConical, History, Leaf, Sparkles, Trees, Zap } from "lucide-react";
import PhotoUpload from "@/components/PhotoUpload";
import PlantResult from "@/components/PlantResult";
import NearbySightings from "@/components/NearbySightings";
import GamificationPanel from "@/components/gamification/GamificationPanel";
import AIPlantRecognition from "@/components/ai/AIPlantRecognition";
import ARView from "@/components/ar/ARView";
import VoiceAssistant from "@/components/voice/VoiceAssistant";
import FieldSession from "@/components/academic/FieldSession";
import { recognizeLifeLocally } from "@/lib/local-life-recognition";

interface PlantIdentificationResult {
  id: string;
  scientific_name: string;
  common_names: string[];
  probability: number;
  description?: string;
  taxonomy?: { family?: string; genus?: string; species?: string };
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
const MODES: Array<{ id: Mode; label: string; note: string; icon: typeof Leaf }> = [
  { id: "identify", label: "Plantes", note: "Espèces végétales", icon: Leaf },
  { id: "life", label: "Insectes & animaux", note: "Le vivant en mouvement", icon: Bug },
  { id: "disease", label: "Santé végétale", note: "Signes & maladies", icon: FlaskConical },
];

export default function IdentificationWorkspace({ userId, userRole }: { userId: string | null; userRole: "user" | "admin" | "institution" | null }) {
  const [mode, setMode] = useState<Mode>("identify");
  const [treatmentStage, setTreatmentStage] = useState<"before" | "after">("before");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PlantIdentificationResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [fieldSessionId, setFieldSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [voiceNote, setVoiceNote] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setHistory(JSON.parse(localStorage.getItem("sununature_identification_history") || "[]")); } catch { /* ignore cache */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const identify = useCallback(async (file: File) => {
    setBusy(true); setError(""); setResult(null);
    try {
      let data: { result?: PlantIdentificationResult; candidates?: Array<{ scientific_name: string; common_names: string[]; probability: number }>; error?: string };
      if (mode === "life") {
        const predictions = await recognizeLifeLocally(file);
        const response = await fetch("/api/identify-life", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ predictions }) });
        data = await response.json();
        if (!response.ok) throw new Error(data.error || "L’identification du vivant a échoué.");
      } else {
        const form = new FormData(); form.append("image", file); form.append("mode", mode);
        if (mode === "disease") form.append("treatmentStage", treatmentStage);
        if (location) { form.append("lat", String(location.lat)); form.append("lng", String(location.lng)); }
        if (fieldSessionId) form.append("sessionId", fieldSessionId);
        const response = await fetch("/api/identify", { method: "POST", body: form });
        data = await response.json();
        if (!response.ok) throw new Error(data.error || "L’analyse a échoué.");
      }
      if (!data.result?.scientific_name) throw new Error("Aucun résultat. Réessayez avec une photo nette et bien cadrée.");
      const identified = { ...data.result, alternatives: mode === "life" ? data.candidates : undefined };
      setResult(identified);
      const item: HistoryItem = { date: new Date().toISOString(), name: identified.common_names?.[0] || identified.scientific_name, imageUrl: preview, probability: identified.probability, mode };
      setHistory((previous) => { const next = [item, ...previous].slice(0, 12); try { localStorage.setItem("sununature_identification_history", JSON.stringify(next)); } catch { /* quota or private mode */ } return next; });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Une erreur a empêché l’identification."); }
    finally { setBusy(false); }
  }, [mode, treatmentStage, location, fieldSessionId, preview]);

  function requestLocation() {
    if (!navigator.geolocation) { setError("La géolocalisation n’est pas disponible sur cet appareil."); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => { setLocation({ lat: coords.latitude, lng: coords.longitude }); setError(""); }, () => setError("Position non disponible. Vous pouvez continuer sans la partager."), { timeout: 10_000, maximumAge: 300_000 });
  }

  return <div className="nature-identifier-workspace">
    <section className="nature-identifier-hero"><video className="nature-identifier-hero-video" autoPlay muted loop playsInline preload="metadata" poster="/images/terra-hero.webp" aria-hidden="true" tabIndex={-1}><source src="/videos/terra-biodiversity.mp4" type="video/mp4" /></video><div className="nature-identifier-hero-copy"><span className="nature-identifier-eyebrow"><Sparkles size={14} /> TERRA · LE RÉSEAU MONDIAL DU VIVANT</span><h1>Photographiez la<br /><em>vie</em> autour de vous.</h1><p>Plante, insecte, oiseau ou mammifère : partagez une image, obtenez des pistes d’identification et enrichissez les savoirs du terrain.</p><div className="nature-hero-actions"><Link href="#reconnaissance" className="nature-hero-cta">Commencer une identification <ArrowRight size={16} /></Link><Link href="/explorer" className="nature-hero-secondary">Découvrir le réseau</Link></div><div className="nature-identifier-trust"><span><BadgeCheck size={15} /> Une proposition, à confirmer</span><span><Trees size={15} /> Des savoirs naturalistes partagés partout</span></div></div><div className="nature-identifier-hero-art"><span>01 / OBSERVER</span><div className="nature-identifier-orbit"><Leaf /><Bug /><span>✳</span></div><strong>Observer.<br />Comprendre.<br />Transmettre.</strong></div></section>
    <div className="nature-identifier-layout"><section className="nature-identifier-main" id="reconnaissance"><div className="nature-mode-selector" id="identifier">{MODES.map(({ id, label, note, icon: Icon }) => <button key={id} className={mode === id ? "active" : ""} onClick={() => { setMode(id); setResult(null); setError(""); }}><span><Icon size={18} /></span><strong>{label}</strong><small>{note}</small></button>)}</div>
      {mode === "life" && <p className="nature-identifier-note"><Zap size={14} /> L’analyse de cette photo est faite localement sur votre appareil ; les espèces rares ou proches peuvent nécessiter l’avis de la communauté.</p>}
      {mode === "disease" && <div className="nature-treatment-choice"><span><AlertTriangle size={16} /> Moment du diagnostic</span>{(["before", "after"] as const).map((stage) => <button key={stage} onClick={() => setTreatmentStage(stage)} className={treatmentStage === stage ? "active" : ""}>{stage === "before" ? "Avant traitement" : "Après traitement"}</button>)}</div>}
      <div className="nature-identifier-tools"><button onClick={requestLocation} className={location ? "enabled" : ""}><Crosshair size={16} /> {location ? "Position activée" : "Ajouter ma position"}</button>{userId && <span><BadgeCheck size={14} /> Session de terrain disponible dans votre espace</span>}</div>
      {userId && <div className="nature-field-session"><FieldSession userId={userId} onSessionChange={setFieldSessionId} /></div>}
      <div className="nature-recognition-grid"><div><PhotoUpload onImageUpload={(file) => void identify(file)} isLoading={busy} onPreviewChange={setPreview} />{error && <div className="nature-identifier-error" role="alert">{error}</div>}</div><div className="nature-identification-result"><PlantResult result={result} isLoading={busy} previewUrl={preview} userId={userId || undefined} userRole={userRole || undefined} mode={mode} />{result && <NearbySightings scientificName={result.scientific_name} location={location} />}</div></div>
    </section><aside className="nature-identifier-side"><div className="nature-identify-side-card"><span>VOTRE JOURNAL</span><History size={20} /><h2>Chaque sortie<br />laisse une trace.</h2><p>Retrouvez ici les identifications faites sur cet appareil.</p><strong>{history.length} rencontre{history.length > 1 ? "s" : ""} récemment</strong></div>{history.slice(0, 4).map((entry, index) => <article className="nature-history-item" key={index}>{entry.imageUrl ? <Image src={entry.imageUrl} alt="" width={40} height={40} unoptimized /> : <span><Leaf size={18} /></span>}<div><strong>{entry.name}</strong><small>{new Date(entry.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {Math.round(entry.probability * 100)}%</small></div></article>)}{userId ? <GamificationPanel userId={userId} /> : <div className="nature-identifier-login"><strong>Construisez votre carnet vivant</strong><p>Connectez-vous pour conserver vos sorties et faire grandir votre profil naturaliste.</p><Link href="/connexion">Rejoindre TERRA <ArrowRight size={15} /></Link></div>}</aside></div>
    <section className="nature-ai-contribution"><div><span>LA SCIENCE S’ENRICHIT ENSEMBLE</span><h2>Votre connaissance peut améliorer les prochains résultats.</h2><p>Contribuez à l’identification botanique et partagez les noms transmis dans votre région.</p></div><AIPlantRecognition /></section>
    <details className="nature-immersive-tools"><summary><span><Sparkles size={17} /> Explorer en mode terrain immersif</span><small>Réalité augmentée · assistant vocal</small></summary><div className="nature-immersive-grid"><div><h2>Une observation mains libres</h2><p>Capturez une photo avec la caméra immersive ou dictez le nom que vous connaissez.</p>{voiceNote && <p className="nature-voice-note" role="status">{voiceNote}</p>}<VoiceAssistant onResult={(text) => setVoiceNote("Note vocale : " + text)} onPlantIdentified={(name) => setVoiceNote("Espèce prononcée : " + name)} /></div><div><ARView onCapture={(file) => void identify(file)} /></div></div></details>
  </div>;
}
