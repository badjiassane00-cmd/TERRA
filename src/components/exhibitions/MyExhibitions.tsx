"use client";
/* eslint-disable @next/next/no-img-element -- QR image URLs are generated dynamically by the QR provider */

import { motion, AnimatePresence } from "framer-motion";
import { useMyExhibitions } from "./useMyExhibitions";
import { apiFetch } from "@/lib/api-client";
import { parseCommonNames } from "./types";
import {
  BookOpen,
  Plus,
  X,
  Globe,
  Lock,
  Trash2,
  Leaf,
  Share2,
  ChevronDown,
  Loader2,
  Check,
  QrCode,
} from "lucide-react";

interface MyExhibitionsProps {
  userId: string;
}

export default function MyExhibitions({ userId }: MyExhibitionsProps) {
  const {
    exhibitions, isLoading, showCreateForm, setShowCreateForm, newTitle, setNewTitle,
    newTheme, setNewTheme, newPublic, setNewPublic, isCreating, openId, detail,
    detailLoading, plantInput, setPlantInput, isAddingPlant, mediaImageUrl, setMediaImageUrl, mediaVideoUrl, setMediaVideoUrl, mediaUploading, setMediaUploading, copiedId, qrOpenId, setQrOpenId,
    createExhibition, deleteExhibition, togglePublic, addPlant, removePlant,
    sharePublicLink, toggleOpen,
  } = useMyExhibitions(userId);

  async function uploadExhibitionMedia(file?: File) {
    if (!file) return;
    setMediaUploading(true);
    try {
      const form = new FormData(); form.set("file", file);
      const response = await apiFetch("/api/media/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Téléversement impossible.");
      if (data.mediaType === "video") setMediaVideoUrl(data.videoUrl); else setMediaImageUrl(data.imageUrl);
    } catch { /* Le choix du média peut être relancé sans perdre l’exposition. */ }
    finally { setMediaUploading(false); }
  }

  return (
    <div className="botanical-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-serif text-xl font-bold text-foreground">Mes expositions</h3>
        </div>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nouvelle exposition
        </button>
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        Composez votre propre collection de plantes — pour un cours, une vitrine de pépinière,
        ou simplement votre jardin. Rendez-la publique pour la partager via un lien.
      </p>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 border border-border rounded-xl bg-paper/50 space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titre de l'exposition (ex: Plantes médicinales du Sahel)"
                className="w-full text-sm border border-border rounded px-3 py-2"
              />
              <input
                type="text"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                placeholder="Thème (optionnel) — ornementale, médicinale, jardin d'école..."
                className="w-full text-sm border border-border rounded px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  checked={newPublic}
                  onChange={(e) => setNewPublic(e.target.checked)}
                />
                Rendre publique dès la création (partageable via un lien)
              </label>
              <button
                onClick={createExhibition}
                disabled={isCreating || !newTitle.trim()}
                className="text-sm px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
              >
                {isCreating ? "Création..." : "Créer"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="flex items-center justify-center py-10 text-foreground/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Chargement...
        </div>
      )}

      {!isLoading && exhibitions.length === 0 && !showCreateForm && (
        <p className="text-sm text-foreground/60 py-6 text-center">
          Vous n&apos;avez pas encore d&apos;exposition. Créez-en une pour commencer à
          rassembler vos plantes préférées.
        </p>
      )}

      <div className="space-y-3">
        {exhibitions.map((ex) => {
          const isOpen = openId === ex.id;
          return (
            <div key={ex.id} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleOpen(ex.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ex.title}</p>
                  <p className="text-xs text-foreground/60 truncate">
                    {ex._count.items} plante{ex._count.items !== 1 ? "s" : ""}
                    {ex.theme ? ` • ${ex.theme}` : ""}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${
                    ex.isPublic ? "bg-primary/10 text-primary" : "bg-paper text-foreground/50"
                  }`}
                >
                  {ex.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {ex.isPublic ? "Publique" : "Privée"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-foreground/40 transition-transform flex-shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-border bg-paper/50">
                      {detailLoading && (
                        <p className="text-xs text-foreground/50 py-3 flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Chargement...
                        </p>
                      )}

                      {!detailLoading && detail && detail.id === ex.id && (
                        <>
                          {detail.items.length === 0 ? (
                            <p className="text-xs text-foreground/50 py-3">
                              Aucune plante pour l&apos;instant.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-3">
                              {detail.items.map((item) => {
                                const commonNames = parseCommonNames(item.plant.commonNames);
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 p-2 bg-white border border-border rounded-lg text-xs"
                                  >
                                    {item.videoUrl ? <video src={item.videoUrl} poster={item.imageUrl || undefined} controls className="exhibition-item-media" /> : item.imageUrl ? <img src={item.imageUrl} alt="" className="exhibition-item-media" /> : <Leaf className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-foreground truncate">
                                        {commonNames[0] || item.plant.scientificName}
                                      </p>
                                      <p className="text-foreground/50 italic truncate">
                                        {item.plant.scientificName}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => removePlant(ex.id, item.id)}
                                      className="text-foreground/30 hover:text-accent flex-shrink-0"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                            <input
                              type="text"
                              value={plantInput}
                              onChange={(e) => setPlantInput(e.target.value)}
                              placeholder="Nom scientifique à ajouter (ex: Adansonia digitata)"
                              className="text-xs border border-border rounded px-2 py-1.5 flex-1 min-w-[180px]"
                            />
                            <label className="text-xs cursor-pointer">Ajouter photo/vidéo<input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="block max-w-48" disabled={mediaUploading} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void uploadExhibitionMedia(file); }} /></label>
                            <button
                              onClick={() => addPlant(ex.id)}
                              disabled={isAddingPlant || mediaUploading || (!plantInput.trim() && !mediaImageUrl && !mediaVideoUrl)}
                              className="text-xs px-3 py-1.5 bg-primary text-white rounded disabled:opacity-50 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Ajouter
                            </button>
                          </div>

                          <div className="flex items-center gap-3 pt-3 mt-2 border-t border-border">
                            <button
                              onClick={() => togglePublic(ex)}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              {ex.isPublic ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                              {ex.isPublic ? "Rendre privée" : "Rendre publique"}
                            </button>
                            {ex.isPublic && (
                              <button
                                onClick={() => sharePublicLink(ex.id)}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                {copiedId === ex.id ? (
                                  <>
                                    <Check className="w-3 h-3" /> Lien copié
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="w-3 h-3" /> Copier le lien
                                  </>
                                )}
                              </button>
                            )}
                            {ex.isPublic && (
                              <button
                                onClick={() => setQrOpenId(qrOpenId === ex.id ? null : ex.id)}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <QrCode className="w-3 h-3" />
                                QR code
                              </button>
                            )}
                            <button
                              onClick={() => deleteExhibition(ex.id)}
                              className="text-xs text-accent hover:underline flex items-center gap-1 ml-auto"
                            >
                              <Trash2 className="w-3 h-3" />
                              Supprimer
                            </button>
                          </div>

                          {qrOpenId === ex.id && (
                            <div className="flex flex-col items-center gap-2 pt-3 mt-1 border-t border-border">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                  `${window.location.origin}/exposition/${ex.id}`
                                )}`}
                                alt={`QR code vers l'exposition ${ex.title}`}
                                width={180}
                                height={180}
                                className="border border-border rounded"
                              />
                              <p className="text-xs text-foreground/50 text-center">
                                À imprimer et afficher en boutique — les visiteurs scannent pour
                                accéder à la fiche complète de chaque plante.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
