"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2, MapPin, Leaf, BadgeCheck, ShieldAlert, Trash2, X, LocateFixed, CalendarDays, LockKeyhole, Bookmark, Send } from "lucide-react";
import { ORGANISM_GROUPS, ORGANISM_LABELS, type OrganismFilter, type OrganismGroup } from "@/types/nature";

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

interface CommunityFeedProps {
  currentUserId?: string;
  currentUserRole?: "user" | "admin" | "institution";
  groupFilter?: OrganismFilter;
  onGroupFilterChange?: (group: OrganismFilter) => void;
}

interface ApiPost {
  id: string;
  userId: string;
  user?: { name?: string; institution?: string; avatarUrl?: string | null; isDemo?: boolean };
  plantName: string;
  organismGroup?: OrganismGroup;
  scientificName: string;
  imageUrl: string;
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


interface ObservationPhotos { imageUrl: string; thumbnailUrl: string }

function photoLicenseUrl(code: string) {
  const license = code.toLowerCase();
  if (license === "cc0") return "https://creativecommons.org/publicdomain/zero/1.0/";
  if (license === "cc-by-sa") return "https://creativecommons.org/licenses/by-sa/4.0/";
  return "https://creativecommons.org/licenses/by/4.0/";
}

async function canvasDataUrl(canvas: HTMLCanvasElement, quality: number): Promise<string> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Impossible de préparer la photo.");
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture de photo impossible."));
    reader.onerror = () => reject(new Error("Lecture de photo impossible."));
    reader.readAsDataURL(blob);
  });
}

async function compressObservationPhoto(file: File): Promise<ObservationPhotos> {
  if (!file.type.startsWith("image/")) throw new Error("Choisissez une photo au format JPEG, PNG ou WebP.");
  if (file.size > 15 * 1024 * 1024) throw new Error("La photo originale ne doit pas dépasser 15 Mo.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Impossible de préparer la photo.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let fullCanvas = canvas;
  let fullPhoto = await canvasDataUrl(fullCanvas, 0.72);
  if (fullPhoto.length > 1_200_000) {
    const smaller = document.createElement("canvas");
    smaller.width = Math.round(canvas.width * 0.72);
    smaller.height = Math.round(canvas.height * 0.72);
    smaller.getContext("2d")?.drawImage(canvas, 0, 0, smaller.width, smaller.height);
    fullCanvas = smaller;
    fullPhoto = await canvasDataUrl(fullCanvas, 0.61);
  }
  if (fullPhoto.length > 1_200_000) throw new Error("La photo reste trop lourde après compression. Choisissez une autre image.");
  const thumbnail = document.createElement("canvas");
  const thumbnailScale = Math.min(1, 480 / Math.max(fullCanvas.width, fullCanvas.height));
  thumbnail.width = Math.max(1, Math.round(fullCanvas.width * thumbnailScale));
  thumbnail.height = Math.max(1, Math.round(fullCanvas.height * thumbnailScale));
  thumbnail.getContext("2d")?.drawImage(fullCanvas, 0, 0, thumbnail.width, thumbnail.height);
  return { imageUrl: fullPhoto, thumbnailUrl: await canvasDataUrl(thumbnail, 0.58) };
}

export default function CommunityFeed({ currentUserId, currentUserRole, groupFilter = "ALL", onGroupFilterChange }: CommunityFeedProps) {
  const isModerator = currentUserRole === "institution" || currentUserRole === "admin";
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState("");
  const [newSpeciesName, setNewSpeciesName] = useState("");
  const [newScientificName, setNewScientificName] = useState("");
  const [newObservedAt, setNewObservedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [newPhoto, setNewPhoto] = useState<ObservationPhotos | null>(null);
  const [newLocation, setNewLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationVisibility, setLocationVisibility] = useState<"PUBLIC" | "APPROXIMATE" | "PRIVATE">("APPROXIMATE");
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [newOrganismGroup, setNewOrganismGroup] = useState<OrganismGroup>("PLANT");
  const [newRegion, setNewRegion] = useState("Sénégal");
  const [postError, setPostError] = useState<string | null>(null);
  const visiblePosts = groupFilter === "ALL" ? posts : posts.filter((post) => post.organismGroup === groupFilter);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [now] = useState(() => Date.now());

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/community?limit=20");
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

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadPosts(); }, 0);
    const openComposer = () => setShowForm(true);
    window.addEventListener("sununature:compose", openComposer);
    return () => { window.clearTimeout(timer); window.removeEventListener("sununature:compose", openComposer); };
  }, [loadPosts]);

  const toggleLike = async (postId: string) => {
    if (!currentUserId) { window.location.assign("/connexion"); return; }
    const before = posts.find((post) => post.id === postId);
    if (!before) return;
    const willLike = !before.liked;
    setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, liked: willLike, likes: Math.max(0, post.likes + (willLike ? 1 : -1)) } : post));
    try {
      const response = await fetch(`/api/community/${postId}/like`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, liked: result.liked, likes: result.likes } : post));
    } catch {
      setPosts((prev) => prev.map((post) => post.id === postId ? before : post));
    }
  };

  const toggleFollow = async (authorId: string) => {
    if (!currentUserId) { window.location.assign("/connexion"); return; }
    try {
      const response = await fetch(`/api/users/${authorId}/follow`, { method: "POST" });
      if (!response.ok) throw new Error();
      const result = await response.json();
      setPosts((prev) => prev.map((post) => post.userId === authorId ? { ...post, following: result.following } : post));
    } catch { /* Le compte reste affiché si l’abonnement échoue. */ }
  };

  const publishPost = async () => {
    if (!newSpeciesName.trim() || !newPost.trim() || !newPhoto) return;
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantName: newSpeciesName.trim(),
          organismGroup: newOrganismGroup,
          scientificName: newScientificName.trim(),
          imageUrl: newPhoto.imageUrl,
          thumbnailUrl: newPhoto.thumbnailUrl,
          region: newRegion,
          description: newPost,
          observedAt: newObservedAt,
          latitude: newLocation?.latitude ?? null,
          longitude: newLocation?.longitude ?? null,
          locationVisibility,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Publication impossible pour le moment.");
      setNewPost("");
      setNewSpeciesName("");
      setNewScientificName("");
      setNewObservedAt(new Date().toISOString().slice(0, 10));
      setNewPhoto(null);
      setNewLocation(null);
      setLocationVisibility("APPROXIMATE");
      setNewOrganismGroup("PLANT");
      setNewRegion("Sénégal");
      setShowForm(false);
      await loadPosts();
    } catch (error) {
      setPostError(error instanceof Error ? error.message : "Publication impossible pour le moment.");
    } finally {
      setPosting(false);
    }
  };

  const moderate = async (postId: string, action: "verify" | "remove") => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/community/${postId}`, {
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
      await fetch(`/api/community/${postId}?userId=${currentUserId}`, { method: "DELETE" });
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
            <p>Des rencontres sauvages, partagées depuis l’Afrique</p>
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

      {showForm && (
        <div className="mb-6 p-4 bg-paper border border-border rounded-lg">
          <select
            value={newOrganismGroup}
            onChange={(event) => setNewOrganismGroup(event.target.value as OrganismGroup)}
            className="herbarium-input mb-3"
            aria-label="Groupe du vivant"
          >
            {ORGANISM_GROUPS.map((group) => <option key={group} value={group}>{ORGANISM_LABELS[group]}</option>)}
          </select>
          <label className="observation-field-label">Photo de l’observation
            <input type="file" accept="image/jpeg,image/png,image/webp" className="herbarium-input mb-3" disabled={photoProcessing} onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setPostError(null);
              setPhotoProcessing(true);
              try { setNewPhoto(await compressObservationPhoto(file)); }
              catch (error) { setPostError(error instanceof Error ? error.message : "Impossible de charger la photo."); }
              finally { setPhotoProcessing(false); }
            }} />
          </label>
          {newPhoto && <div className="observation-photo-preview"><img src={newPhoto.thumbnailUrl} alt="Aperçu de l’observation" /><button type="button" aria-label="Retirer la photo" onClick={() => setNewPhoto(null)}><X size={16} /></button></div>}
          <label className="observation-field-label">Date de l’observation
            <input type="date" value={newObservedAt} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setNewObservedAt(event.target.value)} className="herbarium-input mb-3" />
          </label>
          <select value={newRegion} onChange={(event) => setNewRegion(event.target.value)} className="herbarium-input mb-3" aria-label="Pays ou région">
            {["Sénégal", "Côte d’Ivoire", "Mali", "Burkina Faso", "Ghana", "Bénin", "Togo", "Niger", "Guinée", "Cameroun", "Kenya", "Afrique du Sud", "Autre région d’Afrique"].map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
          <input
            value={newSpeciesName}
            onChange={(e) => setNewSpeciesName(e.target.value)}
            placeholder="Espèce observée (plante, insecte, oiseau…)"
            className="herbarium-input mb-3"
            maxLength={120}
          />
          <input value={newScientificName} onChange={(event) => setNewScientificName(event.target.value)} placeholder="Nom scientifique (si vous le connaissez)" className="herbarium-input mb-3" maxLength={180} />
          <div className="observation-location-row"><button type="button" className="herbarium-button" onClick={() => navigator.geolocation?.getCurrentPosition(({ coords }) => setNewLocation({ latitude: coords.latitude, longitude: coords.longitude }), () => setPostError("Position introuvable. Vous pouvez publier sans coordonnées."))}><LocateFixed size={15} /> {newLocation ? "Position ajoutée" : "Ajouter ma position"}</button><select aria-label="Confidentialité de la position" value={locationVisibility} onChange={(event) => setLocationVisibility(event.target.value as typeof locationVisibility)} className="herbarium-input"><option value="APPROXIMATE">Position approximative</option><option value="PUBLIC">Position visible</option><option value="PRIVATE">Position privée</option></select></div>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Racontez le lieu, le comportement ou ce qui vous a marqué…"
            className="herbarium-input mb-3"
            rows={3}
          />
          {postError && <p className="mb-3 text-sm text-terracotta" role="alert">{postError}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setPostError(null); }} className="herbarium-button">
              Annuler
            </button>
            <button
              onClick={publishPost}
              disabled={posting || photoProcessing || !newPhoto || !newSpeciesName.trim() || !newPost.trim()}
              className="herbarium-button herbarium-button-primary disabled:opacity-50"
            >
              {photoProcessing ? "Préparation de la photo…" : posting ? "Publication..." : "Publier l’observation"}
            </button>
          </div>
        </div>
      )}

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
            <div className="nature-post-header"><Link href={`/profile/${post.userId}`} className="nature-profile-avatar">{post.user.avatarUrl ? <img src={post.user.avatarUrl} alt="" /> : post.user.name.slice(0, 1).toUpperCase()}</Link><Link href={`/profile/${post.userId}`} className="nature-post-author"><strong>{post.user.name}</strong><span>{post.user.isDemo ? "Compte fictif · démonstration" : post.user.institution || "Naturaliste"} · {formatTimeAgo(post.timestamp)}</span></Link>{currentUserId && currentUserId !== post.userId && <button className={`nature-follow-button ${post.following ? "following" : ""}`} onClick={() => void toggleFollow(post.userId)}>{post.following ? "Abonné·e" : "Suivre"}</button>}<span className="nature-post-group-label">{ORGANISM_LABELS[post.organismGroup]}</span></div>
            <div className={`${post.imageUrl ? "nature-post-photo" : "nature-post-photo empty"} bg-gradient-to-br from-primary/10 to-accent/10 relative`}>
              {post.imageUrl ? (
                <Link href={`/observations/${post.id}`} aria-label={`Voir ${post.plantName}`}><img src={post.imageUrl} alt={post.plantName} className="w-full h-full object-cover" /></Link>
              ) : (
                <div className="flex min-h-28 items-center justify-center gap-3 px-5 text-primary/70">
                  <Leaf className="h-7 w-7" />
                  <span className="font-serif text-lg">Une rencontre avec le vivant</span>
                </div>
              )}
              <div className="nature-photo-place"><MapPin size={13} />{post.region}</div>
            </div>
            <div className="nature-post-body">
              <div className="nature-post-actions"><button aria-label={post.liked ? "Retirer la mention j’aime" : "Aimer cette observation"} onClick={() => void toggleLike(post.id)} className={post.liked ? "liked" : ""}><Heart className={post.liked ? "fill-current" : ""} /></button><Link href={`/observations/${post.id}#discussion`} aria-label="Commenter"><MessageCircle /></Link><button aria-label="Partager cette observation" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/observations/${post.id}`)}><Send /></button><Link className="nature-save-action" href={`/observations/${post.id}`} aria-label="Ouvrir la fiche"><Bookmark /></Link></div>
              <div className="nature-like-count">{post.likes.toLocaleString("fr-FR")} J’aime</div>
              {post.isDemo && <div className="nature-demo-source"><strong>Publication de démonstration</strong><span>Observation réelle par {post.sourceObserver || "un naturaliste iNaturalist"} · Crédit photo : {post.photoAttribution || post.sourceObserver || "iNaturalist"}{post.photoLicense && <> · <a href={photoLicenseUrl(post.photoLicense)} target="_blank" rel="noreferrer">Licence {post.photoLicense.toUpperCase()}</a></>}</span>{post.sourceUrl && <a href={post.sourceUrl} target="_blank" rel="noreferrer">Voir la source iNaturalist ↗</a>}</div>}
              {post.verified && <div className="flex items-center gap-1.5 mb-2 text-xs text-primary"><BadgeCheck className="w-3.5 h-3.5" />Identification certifiée{post.verifiedBy ? ` par ${post.verifiedBy}` : ""}</div>}
              <div className="nature-observation-caption"><Link href={`/profile/${post.userId}`}><strong>{post.user.name}</strong></Link> <Link href={`/observations/${post.id}`}><strong>{post.plantName}</strong></Link> <span className="nature-caption-group">{ORGANISM_LABELS[post.organismGroup]}</span>{post.description && <span> — {post.description}</span>}</div>
              {post.scientificName && <p className="text-sm text-foreground/60 italic mb-2">{post.scientificName}</p>}
              <div className="observation-card-meta"><span><CalendarDays size={14} />{post.observedAt ? new Date(post.observedAt).toLocaleDateString("fr-FR") : formatTimeAgo(post.timestamp)}</span><span><MapPin size={14} />{post.region}</span>{post.latitude != null && post.longitude != null && <span><LockKeyhole size={13} />Position masquée</span>}</div>
              <Link href={`/observations/${post.id}#discussion`} className="nature-comments-link">{post.comments ? `Voir les ${post.comments} commentaires` : "Ajouter un commentaire"}</Link>
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
