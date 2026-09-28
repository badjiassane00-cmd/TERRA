"use client";

import { useState } from "react";
import { BookOpen, Plus, Check, Loader2 } from "lucide-react";

interface ExhibitionOption {
  id: string;
  title: string;
}

interface AddToExhibitionButtonProps {
  userId?: string;
  scientificName: string;
  commonName?: string;
  imageUrl?: string;
}

export default function AddToExhibitionButton({
  userId,
  scientificName,
  commonName,
  imageUrl,
}: AddToExhibitionButtonProps) {
  const [open, setOpen] = useState(false);
  const [exhibitions, setExhibitions] = useState<ExhibitionOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [added, setAdded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!userId) return null;

  const openPicker = () => {
    setOpen((v) => !v);
    if (!open) {
      setIsLoading(true);
      fetch(`/api/my-exhibitions?userId=${userId}`)
        .then((res) => res.json())
        .then((data) =>
          setExhibitions((data.exhibitions || []).map((e: { id: string; title: string }) => ({ id: e.id, title: e.title })))
        )
        .catch(() => setExhibitions([]))
        .finally(() => setIsLoading(false));
    }
  };

  const addTo = async (exhibitionId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/my-exhibitions/${exhibitionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, scientificName, commonName, imageUrl }),
      });
      if (!res.ok) throw new Error();
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        setOpen(false);
      }, 1200);
    } catch {
      // erreur silencieuse : le popover reste ouvert
    } finally {
      setIsSubmitting(false);
    }
  };

  const createAndAdd = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/my-exhibitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: newTitle.trim() }),
      });
      const data = await res.json();
      if (data.exhibition?.id) {
        await addTo(data.exhibition.id);
        setNewTitle("");
      }
    } catch {
      // erreur silencieuse
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={openPicker}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-primary/30 text-primary rounded-full hover:bg-primary/5 transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Ajouter à une exposition
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 mt-2 w-72 bg-white border border-border rounded-lg shadow-lg p-3">
          {added ? (
            <p className="text-sm text-primary flex items-center gap-2 py-2">
              <Check className="w-4 h-4" /> Ajoutée !
            </p>
          ) : (
            <>
              {isLoading && (
                <p className="text-xs text-foreground/50 flex items-center gap-2 py-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Chargement...
                </p>
              )}
              {!isLoading && exhibitions.length > 0 && (
                <div className="space-y-1 mb-2 max-h-36 overflow-y-auto">
                  {exhibitions.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => addTo(ex.id)}
                      disabled={isSubmitting}
                      className="w-full text-left text-xs px-2 py-1.5 hover:bg-primary/5 rounded disabled:opacity-50"
                    >
                      {ex.title}
                    </button>
                  ))}
                </div>
              )}
              {!isLoading && exhibitions.length === 0 && (
                <p className="text-xs text-foreground/50 mb-2">Aucune exposition pour l&apos;instant.</p>
              )}
              <div className="flex gap-1.5 pt-2 border-t border-border">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ou créer une nouvelle..."
                  className="flex-1 text-xs border border-border rounded px-2 py-1.5"
                />
                <button
                  onClick={createAndAdd}
                  disabled={isSubmitting || !newTitle.trim()}
                  className="text-xs px-2 py-1.5 bg-primary text-white rounded disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
