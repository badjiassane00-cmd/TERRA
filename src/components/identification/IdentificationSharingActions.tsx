"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, Check, Copy, Globe2, MessageCircle, Share2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { compressObservationPhoto } from "@/lib/observation-media";
import { useAppPreferences } from "@/components/preferences/AppPreferences";

interface IdentificationResult {
  id: string;
  scientific_name: string;
  common_names: string[];
  probability: number;
  taxonomy?: { kingdom?: string; class?: string };
}

type Mode = "identify" | "disease" | "life";
type LifeTarget = "insects" | "animals" | "fish" | "all";
type OrganismGroup = "PLANT" | "INSECT" | "BIRD" | "MAMMAL" | "REPTILE" | "AMPHIBIAN" | "FUNGUS" | "AQUATIC" | "OTHER";
type Props = Readonly<{
  result: IdentificationResult;
  imageFile: File | null;
  mode: Mode;
  lifeTarget: LifeTarget;
  userId: string | null;
  region: string;
}>;
const MODE_NAMES: Record<Mode, string> = {
  identify: "Identification botanique",
  disease: "Diagnostic végétal",
  life: "Identification du vivant",
};
function organismGroupForResult(result: IdentificationResult, mode: Mode, lifeTarget: LifeTarget): OrganismGroup {
  if (mode !== "life") return "PLANT";
  if (lifeTarget === "insects") return "INSECT";
  if (lifeTarget === "fish") return "AQUATIC";

  const kingdom = result.taxonomy?.kingdom?.toLocaleLowerCase("en") || "";
  const taxonClass = result.taxonomy?.class?.toLocaleLowerCase("en") || "";
  if (kingdom.includes("plant")) return "PLANT";
  if (kingdom.includes("fung")) return "FUNGUS";
  if (taxonClass.includes("aves") || taxonClass.includes("bird")) return "BIRD";
  if (taxonClass.includes("mammal")) return "MAMMAL";
  if (taxonClass.includes("reptil")) return "REPTILE";
  if (taxonClass.includes("amphib")) return "AMPHIBIAN";
  return "OTHER";
}

export default function IdentificationSharingActions({
  result,
  imageFile,
  mode,
  lifeTarget,
  userId,
  region,
}: Props) {
  const [confirmedPublic, setConfirmedPublic] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [catalogs, setCatalogs] = useState<Array<{ id: string; title: string }>>([]);
  const [catalogId, setCatalogId] = useState("");
  const [savingToCatalog, setSavingToCatalog] = useState(false);
  const { t } = useAppPreferences();
  const name = result.common_names?.[0] || result.scientific_name;
  const modeName = MODE_NAMES[mode];
  const summary = `${modeName} TERRA : ${name} (${result.scientific_name}), score estimé ${Math.round(result.probability * 100)} %. Piste visuelle à confirmer.`;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void apiFetch("/api/catalogues", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Chargement impossible.");
      if (!cancelled) {
        const items = Array.isArray(payload.catalogs) ? payload.catalogs : [];
        setCatalogs(items.map((item: { id: string; title: string }) => ({ id: item.id, title: item.title })));
        setCatalogId(items[0]?.id || "");
      }
    }).catch(() => { if (!cancelled) setCatalogs([]); });
    return () => { cancelled = true; };
  }, [userId]);

  async function addIdentificationToCatalog() {
    if (!catalogId || !userId) return;
    setSavingToCatalog(true); setError(""); setNotice("");
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const compressed = await compressObservationPhoto(imageFile);
        const blob = await fetch(compressed.imageUrl).then((response) => response.blob());
        const photo = new File([blob], "identification.jpg", { type: blob.type || "image/jpeg" });
        const form = new FormData(); form.set("file", photo); form.set("visibility", "private");
        const upload = await apiFetch("/api/media/upload", { method: "POST", body: form });
        const uploaded = await upload.json();
        if (!upload.ok) throw new Error(uploaded.error || "Téléversement de la photo impossible.");
        imageUrl = uploaded.imageUrl || null;
      }
      const group = organismGroupForResult(result, mode, lifeTarget);
      const response = await apiFetch(`/api/catalogues/${catalogId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scientificName: result.scientific_name, group, imageUrl, note: `${modeName} TERRA · ${Math.round(result.probability * 100)} % · piste à confirmer` }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Ajout au catalogue impossible.");
      setNotice(t("Résultat ajouté à votre catalogue.", "Identification added to your catalog."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ajout au catalogue impossible.");
    } finally { setSavingToCatalog(false); }
  }

  async function shareContent(title: string, text: string, url?: string) {
    const nativeShare = Reflect.get(navigator, "share");
    if (typeof nativeShare === "function") {
      await nativeShare.call(navigator, { title, text, ...(url ? { url } : {}) });
      return "native";
    }
    if (!navigator.clipboard) throw new Error("Le partage et la copie ne sont pas disponibles sur cet appareil.");
    await navigator.clipboard.writeText(url ? `${text} ${url}` : text);
    setNotice(url ? "Lien copié." : "Résumé copié.");
    return "clipboard";
  }

  async function shareSummary() {
    setError("");
    setNotice("");
    try {
      const channel = await shareContent(`${name} · TERRA`, summary);
      if (channel === "native") setNotice("Résumé prêt à être partagé.");
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") return;
      setError(shareError instanceof Error ? shareError.message : "Partage impossible.");
    }
  }

  async function publishShareableIdentification() {
    if (!imageFile || !confirmedPublic) return;
    setPublishing(true);
    setError("");
    setNotice("");
    try {
      const photos = await compressObservationPhoto(imageFile);
      const organismGroup = organismGroupForResult(result, mode, lifeTarget);
      const response = await apiFetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantName: name,
          scientificName: result.scientific_name,
          imageUrl: photos.imageUrl,
          thumbnailUrl: photos.thumbnailUrl,
          region: region || "Monde",
          organismGroup,
          description: "Piste d’identification visuelle proposée par TERRA, à confirmer.",
          isEphemeral: false,
          publicShareEnabled: true,
          identificationProbability: result.probability,
          observedAt: new Date().toISOString(),
          latitude: null,
          longitude: null,
          locationVisibility: "PUBLIC",
          clientSubmissionId: crypto.randomUUID(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Publication impossible.");
      const shareUrl = `${window.location.origin}/identifications/${payload.observation.id}`;
      setPublishedUrl(shareUrl);
      setNotice("La fiche publique a été créée. Vous pouvez maintenant partager son lien.");
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Publication impossible.");
    } finally {
      setPublishing(false);
    }
  }

  async function sharePublishedUrl() {
    if (!publishedUrl) return;
    setError("");
    setNotice("");
    try {
      const channel = await shareContent(`${name} · TERRA`, summary, publishedUrl);
      if (channel === "native") setNotice("Lien prêt à être partagé.");
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") return;
      setError(shareError instanceof Error ? shareError.message : "Partage du lien impossible.");
    }
  }

  return (
    <section className="mt-6 border-t border-border pt-5" aria-label={t("Partager le résultat", "Share the result")}>
      {userId && <div className="mb-5 rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground">{t("Garder dans un catalogue", "Save to a catalog")}</h3>
        <p className="mt-1 text-sm text-foreground/70">{t("Ajoutez cette espèce et sa photo à votre collection personnelle.", "Add this species and its photo to your personal collection.")}</p>
        {catalogs.length ? <div className="mt-3 flex flex-wrap items-center gap-2">
          <select aria-label={t("Choisir un catalogue", "Choose a catalog")} className="min-h-10 rounded-lg border border-border bg-card-bg px-3 text-sm text-foreground" value={catalogId} onChange={(event) => setCatalogId(event.target.value)}>
            {catalogs.map((catalog) => <option key={catalog.id} value={catalog.id}>{catalog.title}</option>)}
          </select>
          <button type="button" onClick={() => void addIdentificationToCatalog()} disabled={!catalogId || savingToCatalog} className="herbarium-button disabled:opacity-50">
            <BookmarkPlus size={16} /> {savingToCatalog ? t("Ajout…", "Saving…") : t("Ajouter au catalogue", "Add to catalog")}
          </button>
        </div> : <Link href="/catalogues" className="herbarium-button mt-3 inline-flex">{t("Créer un catalogue", "Create a catalog")}</Link>}
      </div>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void shareSummary()} className="herbarium-button">
          <Share2 size={16} /> {t("Partager le résumé", "Share summary")}
        </button>
        <p className="text-xs text-foreground/60">Sans publication ni partage de votre position.</p>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <h3 className="text-sm font-semibold text-foreground">{t("Publier une fiche publique", "Publish a public record")}</h3>
        <p className="mt-1 text-sm text-foreground/70">{t("Une fiche publique avec la photo, le nom et le score. Aucune coordonnée précise ni profil ne sera affiché.", "A public record with the photo, name, and score. Your precise coordinates and profile will not be shown.")}{region ? ` ${t("La région", "Region")} « ${region} » ${t("figurera sur l’observation.", "will appear on the observation.")}` : ""}</p>
        {!userId && (
          <Link href="/connexion?next=%2Fidentifier" className="herbarium-button mt-3 inline-flex">
            {t("Se connecter pour publier", "Sign in to publish")}
          </Link>
        )}
        {userId && !imageFile && (
          <p className="mt-3 text-sm text-foreground/60">{t("Une photo est nécessaire pour créer une fiche partageable.", "A photo is required to publish a shareable record.")}</p>
        )}
        {userId && imageFile && (
          <>
            <label className="mt-3 flex items-start gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={confirmedPublic}
                onChange={(event) => setConfirmedPublic(event.target.checked)}
                className="mt-1 accent-primary"
              />
              <span>{t("Je confirme que cette photo et ce résultat seront accessibles publiquement et pourront apparaître dans le flux des observations", "I confirm that this photo and result will be public and may appear in the observations feed")}{region ? ` ${t("avec la région", "with region")} « ${region} »` : ""}.</span>
            </label>
            <button
              type="button"
              onClick={() => void publishShareableIdentification()}
              disabled={!confirmedPublic || publishing}
              className="herbarium-button herbarium-button-primary mt-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Globe2 size={16} /> {publishing ? t("Publication…", "Publishing…") : t("Créer la fiche publique", "Publish record")}
            </button>
          </>
        )}
      </div>

      {publishedUrl && (
        <output className="mt-4 flex flex-wrap items-center gap-3" aria-live="polite">
          <a href={publishedUrl} className="break-all text-sm text-primary underline">{publishedUrl}</a>
          <button type="button" onClick={() => void sharePublishedUrl()} className="herbarium-button">
            <Copy size={16} /> Partager le lien
          </button>
          <a className="herbarium-button" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${summary} ${publishedUrl}`)}`}>
            <MessageCircle size={16} /> WhatsApp
          </a>
        </output>
      )}
      {notice && <output className="mt-3 flex items-center gap-2 text-sm text-primary" aria-live="polite"><Check size={15} />{notice}</output>}
      {error && <p className="mt-3 text-sm text-terracotta" role="alert">{error}</p>}
    </section>
  );
}
