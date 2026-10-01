"use client";

import { apiFetch } from "@/lib/api-client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, MessageCircle, Share2, MapPin, Leaf, BadgeCheck, ShieldAlert, Trash2, X, LocateFixed, Sparkles, ArrowRight, Camera, Upload } from "lucide-react";
import { ORGANISM_GROUPS, ORGANISM_LABELS, type OrganismFilter, type OrganismGroup } from "@/types/nature";
import { compressObservationPhoto, createVideoPoster, photoLicenseUrl, type ObservationPhotos } from "@/lib/observation-media";

interface CommunityPost {
  id: string;
  userId: string;
  user: {
    name: string;
    avatar?: string;
    institution?: string;
    avatarUrl?: string | null;
    isDemo?: boolean;
  };
  plantName: string;
  organismGroup: OrganismGroup;
  scientificName: string;
  imageUrl: string;
  videoUrl?: string | null;
  region: string;
  likes: number;
  comments: number;
  liked: boolean;
  following?: boolean;
  timestamp: string;
  observedAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
  verified?: boolean;
  verifiedBy?: string | null;
  isDemo?: boolean;
  sourceUrl?: string | null;
  sourceObserver?: string | null;
  photoAttribution?: string | null;
  photoLicense?: string | null;
}

const FIELD_GUIDANCE: Record<OrganismGroup, { title: string; text: string }> = {
  PLANT: { title: "Montrez la plante dans son milieu", text: "Une photo des feuilles, des fleurs et de l’habitat aide à distinguer les espèces proches. Ne prélevez rien." },
  INSECT: { title: "Observez sans capturer", text: "Le comportement et la plante visitée sont de précieux indices. Gardez l’insecte libre et évitez de le manipuler." },
  BIRD: { title: "Écoutez avant de vous approcher", text: "Le chant, l’heure et l’habitat complètent la photo. Restez à distance des nids." },
  MAMMAL: { title: "Les traces racontent aussi", text: "Empreintes, poils et passages peuvent documenter une présence sans déranger l’animal. Ne le nourrissez pas." },
  REPTILE: { title: "Laissez-lui une voie de fuite", text: "Photographiez à distance sans toucher l’animal ni déplacer pierres, bois ou abris." },
  AMPHIBIAN: { title: "Documentez le point d’eau", text: "La mare, l’humidité et le moment de la journée donnent du contexte. Évitez de déplacer les animaux." },
  FUNGUS: { title: "Photographiez aussi le support", text: "Le bois, le sol ou la litière aident à documenter la rencontre. Ne consommez jamais une espèce non identifiée." },
  AQUATIC: { title: "Montrez l’état du milieu", text: "Clarté de l’eau, végétation et berge donnent des indices. Observez sans capturer ni piétiner les zones fragiles." },
  OTHER: { title: "Ajoutez une échelle et l’habitat", text: "Un repère de taille et une vue du milieu rendent votre observation plus utile aux naturalistes." },
};

interface PendingObservation {
  id: string;
  queuedAt: string;
  body: Record<string, unknown>;
}

interface CommunityFeedProps {
  currentUserId?: string;
  currentUserRole?: "user" | "admin" | "institution";
  groupFilter?: OrganismFilter;
  onGroupFilterChange?: (group: OrganismFilter) => void;
  initialComposerOpen?: boolean;
}

interface ApiPost {
  id: string;
  userId: string;
  user?: { name?: string; institution?: string; avatarUrl?: string | null; isDemo?: boolean };
  plantName: string;
  organismGroup?: OrganismGroup;
  scientificName: string;
  imageUrl: string;
  videoUrl?: string | null;
  region: string;
  likes: number;
  comments: number;
  createdAt: string;
  observedAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
  verified?: boolean;
  verifiedBy?: string | null;
  liked?: boolean;
  isDemo?: boolean;
  sourceUrl?: string | null;
  sourceObserver?: string | null;
  photoAttribution?: string | null;
  photoLicense?: string | null;
  following?: boolean;
}


export default function CommunityFeed({ currentUserId, currentUserRole, groupFilter = "ALL", onGroupFilterChange, initialComposerOpen = false }: CommunityFeedProps) {
  const router = useRouter();
  const isModerator = currentUserRole === "institution" || currentUserRole === "admin";
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stories, setStories] = useState<Array<{ id: string; userId: string; user: { name: string; avatarUrl: string | null }; imageUrl: string; videoUrl: string | null; caption: string | null; createdAt: string; expiresAt: string }>>([]);
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [newPost, setNewPost] = useState("");
  const [newSpeciesName, setNewSpeciesName] = useState("");
  const [newScientificName, setNewScientificName] = useState("");
  const [newObservedAt, setNewObservedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [newPhoto, setNewPhoto] = useState<ObservationPhotos | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [publishAsStory, setPublishAsStory] = useState(false);
  const [newLocation, setNewLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationVisibility, setLocationVisibility] = useState<"PUBLIC" | "APPROXIMATE" | "PRIVATE">("APPROXIMATE");
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [newOrganismGroup, setNewOrganismGroup] = useState<OrganismGroup>("PLANT");
  const [newRegion, setNewRegion] = useState("");
  const [postError, setPostError] = useState<string | null>(null);
  const visiblePosts = groupFilter === "ALL" ? posts : posts.filter((post) => post.organismGroup === groupFilter);
  const [showForm, setShowForm] = useState(initialComposerOpen);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [pendingObservations, setPendingObservations] = useState<PendingObservation[]>([]);
  const [shareNotice, setShareNotice] = useState<{ postId: string; message: string } | null>(null);
  const [now] = useState(() => Date.now());

  const loadPosts = useCallback(async () => {
    try {
      const res = await apiFetch("/api/community?limit=20");
      if (res.ok) {
        const data = await res.json();
        setPosts(
          (data.data || []).map((post: ApiPost) => ({
            id: post.id,
            userId: post.userId,
            user: { name: post.user?.name || "Membre", institution: post.user?.institution, avatarUrl: post.user?.avatarUrl, isDemo: post.user?.isDemo },
            plantName: post.plantName,
            organismGroup: post.organismGroup || "PLANT",
            scientificName: post.scientificName,
            imageUrl: post.imageUrl,
            videoUrl: post.videoUrl,
            region: post.region,
            likes: post.likes,
            comments: post.comments,
            liked: post.liked || false,
            following: post.following || false,
            timestamp: post.createdAt,
            observedAt: post.observedAt,
            latitude: post.latitude,
            longitude: post.longitude,
            description: post.description,
            verified: post.verified,
            verifiedBy: post.verifiedBy,
            isDemo: post.isDemo,
            sourceUrl: post.sourceUrl,
            sourceObserver: post.sourceObserver,
            photoAttribution: post.photoAttribution,
            photoLicense: post.photoLicense,
          }))
        );
      }
    } catch {
      // Erreur silencieuse : liste vide affichée
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStories = useCallback(async () => {
    try {
      const response = await apiFetch("/api/stories", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      setStories(payload.stories || []);
    } catch { /* Le fil principal reste utilisable si les stories sont indisponibles. */ }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("sununature:pending-observations");
        if (saved) setPendingObservations(JSON.parse(saved) as PendingObservation[]);
      } catch { localStorage.removeItem("sununature:pending-observations"); }
      void loadPosts();
      void loadStories();
      if (new URLSearchParams(window.location.search).get("compose") === "1") setShowForm(true);
    }, 0);
    const openComposer = (event: Event) => {
      setShowForm(true);
      const group = (event as CustomEvent<{ organismGroup?: OrganismGroup }>).detail?.organismGroup;
      if (group && ORGANISM_GROUPS.includes(group)) setNewOrganismGroup(group);
    };
    window.addEventListener("sununature:compose", openComposer);
    return () => { window.clearTimeout(timer); window.removeEventListener("sununature:compose", openComposer); };
  }, [loadPosts, loadStories]);

  useEffect(() => {
    const synchronize = async () => {
      if (!navigator.onLine) return;
      const saved = localStorage.getItem("sununature:pending-observations");
      if (!saved) return;
      let queue: PendingObservation[];
      try { queue = JSON.parse(saved) as PendingObservation[]; } catch { localStorage.removeItem("sununature:pending-observations"); return; }
      const remaining: PendingObservation[] = [];
      for (const item of queue) {
        try {
          const response = await apiFetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item.body) });
          if (!response.ok) remaining.push(item);
        } catch { remaining.push(item); }
      }
      localStorage.setItem("sununature:pending-observations", JSON.stringify(remaining));
      setPendingObservations(remaining);
      if (remaining.length < queue.length) { window.dispatchEvent(new Event("sununature:observation-published")); await loadPosts(); }
    };
    window.addEventListener("online", synchronize);
    const timer = window.setTimeout(synchronize, 0);
    return () => { window.removeEventListener("online", synchronize); window.clearTimeout(timer); };
  }, [loadPosts, currentUserId]);

  const toggleLike = async (postId: string) => {
    if (!currentUserId) { router.push("/connexion"); return; }
    const before = posts.find((post) => post.id === postId);
    if (!before) return;
    const willLike = !before.liked;
    setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, liked: willLike, likes: Math.max(0, post.likes + (willLike ? 1 : -1)) } : post));
    try {
      const response = await apiFetch(`/api/community/${postId}/like`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, liked: result.liked, likes: result.likes } : post));
    } catch {
      setPosts((prev) => prev.map((post) => post.id === postId ? before : post));
    }
  };

  const shareObservation = async (post: CommunityPost) => {
    const url = `${window.location.origin}/observations/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${post.plantName} · TERRA`, text: `Une rencontre avec ${post.plantName} observée au ${post.region}.`, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error("Le partage n’est pas disponible sur cet appareil.");
      }
      setShareNotice({ postId: post.id, message: "Fiche naturaliste partagée" });
      window.setTimeout(() => setShareNotice((current) => current?.postId === post.id ? null : current), 2400);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setShareNotice({ postId: post.id, message: error instanceof Error ? error.message : "Partage impossible." });
      window.setTimeout(() => setShareNotice((current) => current?.postId === post.id ? null : current), 3000);
    }
  };

  const toggleFollow = async (authorId: string) => {
    if (!currentUserId) { router.push("/connexion"); return; }
    try {
      const response = await apiFetch(`/api/users/${authorId}/follow`, { method: "POST" });
      if (!response.ok) throw new Error();
      const result = await response.json();
      setPosts((prev) => prev.map((post) => post.userId === authorId ? { ...post, following: result.following } : post));
    } catch { /* Le compte reste affiché si l’abonnement échoue. */ }
  };

  const requestMediaLocation = (kind: "photo" | "vidéo") => {
    if (!navigator.geolocation) { setLocationMessage("La géolocalisation n’est pas disponible sur cet appareil."); return; }
    setLocationMessage("Demande d’autorisation de position…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setNewLocation({ latitude: coords.latitude, longitude: coords.longitude }); setLocationMessage(`Position de la ${kind} ajoutée. Sa visibilité reste approximative par défaut.`); },
      () => setLocationMessage("Position non ajoutée. Vous pouvez publier sans coordonnées."),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  const addObservationPhoto = async (file: File) => {
    setPostError(null);
    setPhotoProcessing(true);
    try {
      setNewPhoto(await compressObservationPhoto(file));
      setNewVideoUrl("");
      requestMediaLocation("photo");
    } catch (error) {
      setPostError(error instanceof Error ? error.message : "Impossible de charger la photo.");
    } finally {
      setPhotoProcessing(false);
    }
  };

  const addObservationVideo = async (file: File) => {
    setPostError(null);
    if (file.size > 35 * 1024 * 1024) { setPostError("La vidéo doit faire moins de 35 Mo."); return; }
    setPhotoProcessing(true);
    try {
      const poster = await createVideoPoster(file);
      const form = new FormData(); form.set("file", file);
      const response = await apiFetch("/api/media/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Téléversement de la vidéo impossible.");
      setNewPhoto(poster); setNewVideoUrl(result.videoUrl); requestMediaLocation("vidéo");
    } catch (error) { setPostError(error instanceof Error ? error.message : "Impossible de charger la vidéo."); }
    finally { setPhotoProcessing(false); }
  };

  const processObservationMedia = (file: File) => file.type.startsWith("video/") ? void addObservationVideo(file) : void addObservationPhoto(file);

  const publishPost = async () => {
    if (!newPhoto) return;
    setPosting(true);
    setPostError(null);
    const clientSubmissionId = crypto.randomUUID();
    const body = {
      plantName: newSpeciesName.trim() || "Espèce non identifiée", organismGroup: newOrganismGroup,
      scientificName: newScientificName.trim(), imageUrl: newPhoto.imageUrl,
      thumbnailUrl: newPhoto.thumbnailUrl, videoUrl: newVideoUrl || null, region: newRegion, description: newPost,
      isEphemeral: publishAsStory,
      observedAt: newObservedAt, latitude: newLocation?.latitude ?? null,
      longitude: newLocation?.longitude ?? null, locationVisibility, clientSubmissionId,
    };
    const queueOffline = (): boolean => {
      if (pendingObservations.length >= 2) return false;
      const queue = [...pendingObservations, { id: clientSubmissionId, queuedAt: new Date().toISOString(), body }];
      try { localStorage.setItem("sununature:pending-observations", JSON.stringify(queue)); }
      catch { return false; }
      setPendingObservations(queue);
      setNewPost(""); setNewSpeciesName(""); setNewScientificName(""); setNewPhoto(null); setNewVideoUrl(""); setNewLocation(null); setLocationMessage(""); setPublishAsStory(false);
      setNewObservedAt(new Date().toISOString().slice(0, 10)); setLocationVisibility("APPROXIMATE"); setNewOrganismGroup("PLANT"); setNewRegion("");
      setShowForm(false);
      return true;
    };
    try {
      const res = await apiFetch("/api/community", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Publication impossible pour le moment.");
      setNewPost(""); setNewSpeciesName(""); setNewScientificName("");
      setNewObservedAt(new Date().toISOString().slice(0, 10)); setNewPhoto(null); setNewVideoUrl(""); setNewLocation(null); setLocationMessage(""); setPublishAsStory(false);
      setLocationVisibility("APPROXIMATE"); setNewOrganismGroup("PLANT"); setNewRegion("");
      setShowForm(false);
      window.dispatchEvent(new CustomEvent("sununature:observation-published", { detail: { organismGroup: newOrganismGroup } }));
      await Promise.all([loadPosts(), loadStories()]);
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError) {
        const saved = queueOffline();
        setPostError(saved ? "Observation enregistrée sur cet appareil. Elle sera publiée au retour de la connexion." : "La file hors ligne est pleine ou le stockage est saturé. Rétablissez la connexion avant de réessayer.");
      } else setPostError(error instanceof Error ? error.message : "Publication impossible pour le moment.");
    } finally { setPosting(false); }
  };

  const moderate = async (postId: string, action: "verify" | "remove") => {
    if (!currentUserId) return;
    try {
      const res = await apiFetch(`/api/community/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, action }),
      });
      if (!res.ok) throw new Error();
      if (action === "remove") {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        await loadPosts();
      }
    } catch {
      // action de modération échouée : l'état affiché reste inchangé
    }
  };

  const deletePost = async (postId: string) => {
    if (!currentUserId) return;
    try {
      await apiFetch(`/api/community/${postId}?userId=${currentUserId}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      // suppression échouée : le post reste affiché
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = now - new Date(timestamp).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "À l'instant";
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <div className="nature-social-feed">
      <div className="nature-feed-heading">
        <div className="flex items-center gap-3">
          <div className="nature-feed-brand-avatar">✳</div>
          <div>
            <h3>Le fil du vivant</h3>
            <p>Des rencontres sauvages partagées partout dans le monde</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="nature-publish-button"
        >
          <Share2 className="w-4 h-4" />
          Nouvelle observation
        </button>
      </div>

      <section className="nature-stories-strip" aria-label="Publications éphémères de 24 heures">
        <button type="button" className="nature-story-add" onClick={() => { setPublishAsStory(true); setShowForm(true); }}><span>＋</span><small>Ma story · 24 h</small></button>
        {stories.map((story) => <button type="button" className="nature-story-person" key={story.id} onClick={() => setActiveStory(story.id)}><span>{story.imageUrl ? <Image src={story.imageUrl} alt="" width={58} height={58} unoptimized /> : <span>✳</span>}</span><small>{story.user.name}</small></button>)}
      </section>

      {activeStory && (() => { const story = stories.find((item) => item.id === activeStory); return story ? <div className="nature-story-viewer" role="dialog" aria-modal="true" aria-label={`Story de ${story.user.name}`} onClick={() => setActiveStory(null)}><button type="button" aria-label="Fermer la story" onClick={() => setActiveStory(null)}><X size={20} /></button><div onClick={(event) => event.stopPropagation()}>{story.videoUrl ? <video src={story.videoUrl} poster={story.imageUrl} controls autoPlay playsInline /> : <Image src={story.imageUrl} alt={`Story de ${story.user.name}`} width={900} height={1200} unoptimized />}<strong>{story.user.name}</strong>{story.caption && <p>{story.caption}</p>}<small>Expire dans 24 h</small></div></div> : null; })()}

      {showForm && (
        <div className="mb-6 p-4 bg-paper border border-border rounded-lg">
          <div className="mb-3">
            <p className="observation-field-label">Ajoutez une photo ou une vidéo (35 Mo max)</p>
            <div className="flex flex-wrap gap-2">
              <label className="herbarium-button herbarium-button-primary cursor-pointer"><Camera size={16} /> Prendre une photo ou vidéo<input type="file" accept="image/*,video/*" capture="environment" className="sr-only" disabled={photoProcessing} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) processObservationMedia(file); }} /></label>
              <label className="herbarium-button cursor-pointer"><Upload size={16} /> Choisir une photo<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={photoProcessing} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void addObservationPhoto(file); }} /></label>
              <label className="herbarium-button cursor-pointer"><Upload size={16} /> Choisir une vidéo<input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" disabled={photoProcessing} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void addObservationVideo(file); }} /></label>
            </div>
            {photoProcessing && <p className="mt-2 text-xs text-foreground/60" role="status">Préparation du média…</p>}
          </div>
          {newPhoto && <div className="observation-photo-preview">{newVideoUrl ? <video src={newVideoUrl} poster={newPhoto.thumbnailUrl} controls playsInline /> : <Image src={newPhoto.imageUrl} alt="Aperçu complet de l’observation" width={1280} height={900} unoptimized />}<button type="button" aria-label="Retirer le média" onClick={() => { setNewPhoto(null); setNewVideoUrl(""); setNewLocation(null); setLocationMessage(""); }}><X size={16} /></button></div>}
          <label className="observation-field-label">Type d’être vivant
            <select value={newOrganismGroup} onChange={(event) => setNewOrganismGroup(event.target.value as OrganismGroup)} className="herbarium-input mb-3" aria-label="Type d’être vivant">
              {ORGANISM_GROUPS.map((group) => <option key={group} value={group}>{ORGANISM_LABELS[group]}</option>)}
            </select>
          </label>
          <label className="observation-field-label">Date de l’observation
            <input type="date" value={newObservedAt} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setNewObservedAt(event.target.value)} className="herbarium-input mb-3" />
          </label>
          <input value={newRegion} onChange={(event) => setNewRegion(event.target.value)} placeholder="Pays, région ou lieu (facultatif)" className="herbarium-input mb-3" aria-label="Pays, région ou lieu" maxLength={120} />
          <input
            value={newSpeciesName}
            onChange={(e) => setNewSpeciesName(e.target.value)}
            placeholder="Espèce observée (facultatif)"
            className="herbarium-input mb-3"
            maxLength={120}
          />
          <input value={newScientificName} onChange={(event) => setNewScientificName(event.target.value)} placeholder="Nom scientifique (facultatif)" className="herbarium-input mb-3" maxLength={180} />
          <div className="observation-location-row"><button type="button" className="herbarium-button" onClick={() => {
            if (!navigator.geolocation) { setLocationMessage("La géolocalisation n’est pas disponible sur cet appareil."); return; }
            setLocationMessage("Recherche de la position…");
            navigator.geolocation.getCurrentPosition(({ coords }) => { setNewLocation({ latitude: coords.latitude, longitude: coords.longitude }); setLocationMessage("Position ajoutée à l’observation."); }, () => setLocationMessage("Position introuvable. Vous pouvez publier sans coordonnées."), { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 });
          }}><LocateFixed size={15} /> {newLocation ? "Actualiser ma position" : "Ajouter ma position"}</button><select aria-label="Confidentialité de la position" value={locationVisibility} onChange={(event) => setLocationVisibility(event.target.value as typeof locationVisibility)} className="herbarium-input"><option value="APPROXIMATE">Position approximative</option><option value="PUBLIC">Position visible</option><option value="PRIVATE">Position privée</option></select></div>
          {locationMessage && <p className="mt-2 text-xs text-foreground/60" role="status">{locationMessage}</p>}
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Racontez le lieu ou le comportement (facultatif)…"
            className="herbarium-input mb-3"
            rows={3}
          />
          {postError && <p className="mb-3 text-sm text-terracotta" role="alert">{postError}</p>}
          <div className="flex flex-wrap justify-between gap-2">
            <button type="button" onClick={() => setPublishAsStory((value) => !value)} className={`herbarium-button ${publishAsStory ? "herbarium-button-primary" : ""}`}>{publishAsStory ? "Story activée · 24 h" : "Partager en story · 24 h"}</button>
            <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setPostError(null); }} className="herbarium-button">
              Annuler
            </button>
            <button
              onClick={publishPost}
              disabled={posting || photoProcessing || !newPhoto}
              className="herbarium-button herbarium-button-primary disabled:opacity-50"
            >
              {photoProcessing ? "Préparation…" : posting ? "Publication..." : publishAsStory ? "Partager pour 24 h" : "Publier l’observation"}
            </button>
            </div>
          </div>
        </div>
      )}

      {pendingObservations.length > 0 && <aside className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4" aria-live="polite"><strong className="text-sm">{pendingObservations.length} observation(s) en attente de connexion</strong><p className="mt-1 text-xs text-foreground/60">Elles seront envoyées automatiquement quand le réseau reviendra.</p><ul className="mt-2 space-y-1">{pendingObservations.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 text-xs"><span className="truncate">{String(item.body.plantName)} · enregistrée le {new Date(item.queuedAt).toLocaleString("fr-FR")}</span><button type="button" className="text-terracotta underline" onClick={() => { const next = pendingObservations.filter((pending) => pending.id !== item.id); setPendingObservations(next); localStorage.setItem("sununature:pending-observations", JSON.stringify(next)); }}>Supprimer</button></li>)}</ul></aside>}

      <div className="nature-filter-row">
        <button type="button" onClick={() => onGroupFilterChange?.("ALL")} className={`nature-filter-chip ${groupFilter === "ALL" ? "active" : ""}`}>Tout</button>
        {ORGANISM_GROUPS.map((group) => <button type="button" key={group} onClick={() => onGroupFilterChange?.(group)} className={`nature-filter-chip ${groupFilter === group ? "active" : ""}`}>{ORGANISM_LABELS[group]}</button>)}
      </div>
      <div className="nature-post-list">
        {loading && (
          <p className="nature-empty-feed">Les observations de la communauté arrivent…</p>
        )}
        {!loading && visiblePosts.length === 0 && (
          <p className="nature-empty-feed">
            {posts.length === 0 ? "Aucune observation pour le moment. Soyez le premier à partager votre découverte !" : "Aucune observation dans ce groupe pour l’instant."}
          </p>
        )}
        {visiblePosts.map((post) => (
          <article
            key={post.id}
            className="nature-social-post"
          >
            <div className="nature-post-header"><Link href={`/profile/${post.userId}`} className="nature-profile-avatar">{post.user.avatarUrl ? <Image src={post.user.avatarUrl} alt={`Photo de ${post.user.name}`} width={39} height={39} unoptimized /> : post.user.name.slice(0, 1).toUpperCase()}</Link><Link href={`/profile/${post.userId}`} className="nature-post-author"><strong>{post.user.name}</strong><span>{post.user.isDemo ? "Compte fictif · démonstration" : post.user.institution || "Naturaliste"} · {formatTimeAgo(post.timestamp)}</span></Link>{currentUserId && currentUserId !== post.userId && <button className={`nature-follow-button ${post.following ? "following" : ""}`} onClick={() => void toggleFollow(post.userId)}>{post.following ? "Abonné·e" : "Suivre"}</button>}<span className="nature-post-group-label">{ORGANISM_LABELS[post.organismGroup]}</span></div>
            <div className={`${post.imageUrl ? "nature-post-photo" : "nature-post-photo empty"} bg-gradient-to-br from-primary/10 to-accent/10 relative`}>
              {post.videoUrl ? (
                <video src={post.videoUrl} poster={post.imageUrl} controls playsInline preload="metadata" aria-label={`Vidéo de ${post.plantName}`} />
              ) : post.imageUrl ? (
                <Link href={`/observations/${post.id}`} aria-label={`Voir ${post.plantName}`}><Image src={post.imageUrl} alt={post.plantName} width={1280} height={960} unoptimized className="w-full h-full object-contain" /></Link>
              ) : (
                <div className="flex min-h-28 items-center justify-center gap-3 px-5 text-primary/70">
                  <Leaf className="h-7 w-7" />
                  <span className="font-serif text-lg">Une rencontre avec le vivant</span>
                </div>
              )}
              <div className="nature-photo-place"><MapPin size={13} />{post.region}</div>
            </div>
            <div className="nature-post-body">
              <div className="nature-post-actions">
                <button aria-label={post.liked ? "Retirer belle rencontre" : "Belle rencontre"} aria-pressed={post.liked} onClick={() => void toggleLike(post.id)} className={`nature-action-like ${post.liked ? "liked" : ""}`}><Heart className={post.liked ? "fill-current" : ""}/><span>{post.liked ? "Rencontre aimée" : "Belle rencontre"}</span></button>
                <Link href={`/observations/${post.id}#discussion`} className="nature-action-comment" aria-label={`Échanger sur ${post.plantName}`}><MessageCircle/><span>Échanger{post.comments ? ` · ${post.comments}` : ""}</span></Link>
                <button type="button" className="nature-action-share" aria-label={`Partager la fiche de ${post.plantName}`} onClick={() => void shareObservation(post)}><Share2/><span>Partager la fiche</span></button>
              </div>
              {shareNotice?.postId === post.id && <p className="nature-share-notice" role="status">{shareNotice.message}</p>}
              <div className="nature-like-count">{post.likes.toLocaleString("fr-FR")} appréciation{post.likes === 1 ? "" : "s"} de naturalistes</div>
              {post.isDemo && <div className="nature-demo-source"><strong>Publication de démonstration</strong><span>Observation réelle par {post.sourceObserver || "un naturaliste iNaturalist"} · Crédit photo : {post.photoAttribution || post.sourceObserver || "iNaturalist"}{post.photoLicense && <> · <a href={photoLicenseUrl(post.photoLicense)} target="_blank" rel="noreferrer">Licence {post.photoLicense.toUpperCase()}</a></>}</span>{post.sourceUrl && <a href={post.sourceUrl} target="_blank" rel="noreferrer">Voir la source iNaturalist ↗</a>}</div>}
              {post.verified && <div className="flex items-center gap-1.5 mb-2 text-xs text-primary"><BadgeCheck className="w-3.5 h-3.5" />Identification certifiée{post.verifiedBy ? ` par ${post.verifiedBy}` : ""}</div>}
              <div className="nature-observation-caption"><Link href={`/profile/${post.userId}`}><strong>{post.user.name}</strong></Link> <Link href={`/observations/${post.id}`}><strong>{post.plantName}</strong></Link> <span className="nature-caption-group">{ORGANISM_LABELS[post.organismGroup]}</span>{post.description && <span> — {post.description}</span>}</div>
              {post.scientificName && <p className="text-sm text-foreground/60 italic mb-2">{post.scientificName}</p>}
              <aside className="nature-observation-record">
                <div className="nature-observation-record-heading"><span><Leaf size={14}/> CARNET DE TERRAIN</span><span className={post.verified ? "confirmed" : "pending"}>{post.verified ? "Identifiée" : "À confirmer"}</span></div>
                <div className="nature-observation-record-grid">
                  <div><small>GROUPE DU VIVANT</small><strong>{ORGANISM_LABELS[post.organismGroup]}</strong></div>
                  <div><small>TERRITOIRE</small><strong>{post.region}</strong></div>
                  <div><small>RENCONTRE OBSERVÉE</small><strong>{post.observedAt ? new Date(post.observedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : formatTimeAgo(post.timestamp)}</strong></div>
                  <div><small>IDENTIFICATION</small><strong>{post.verified ? "Confirmée par la communauté" : "Proposez un nom local ou scientifique"}</strong></div>
                </div>
                <Link href={`/observations/${post.id}#identification`}>Compléter cette fiche naturaliste <ArrowRight size={13}/></Link>
              </aside>
              <aside className="nature-field-insight"><span><Sparkles size={13} /> CONSEIL DE TERRAIN · {ORGANISM_LABELS[post.organismGroup].toLocaleUpperCase("fr")}</span><strong>{FIELD_GUIDANCE[post.organismGroup].title}</strong><p>{FIELD_GUIDANCE[post.organismGroup].text}</p><Link href={`/observations/${post.id}`} aria-label={`En savoir plus sur ${post.plantName}`}>Ouvrir la fiche terrain <ArrowRight size={13} /></Link></aside>
              <Link href={`/observations/${post.id}`} className="nature-detail-link">Explorer la fiche naturaliste <Share2 size={13} /></Link>

              {(isModerator || currentUserId === post.userId) && (
                <div className="flex items-center gap-3 pt-2 mt-2 border-t border-border">
                  {isModerator && !post.verified && (
                    <button
                      onClick={() => moderate(post.id, "verify")}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Certifier
                    </button>
                  )}
                  {isModerator && (
                    <button
                      onClick={() => moderate(post.id, "remove")}
                      className="flex items-center gap-1 text-xs text-terracotta hover:underline"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Retirer (contenu inapproprié)
                    </button>
                  )}
                  {currentUserId === post.userId && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="flex items-center gap-1 text-xs text-foreground/50 hover:text-terracotta ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
