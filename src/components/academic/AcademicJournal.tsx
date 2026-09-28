"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { GraduationCap, Leaf, Loader2, Pencil, Check, X } from "lucide-react";

interface ScanEntry {
  id: string;
  createdAt: string;
  lat: number | null;
  lng: number | null;
  courseName: string | null;
  objective: string | null;
  result: {
    scientific_name?: string;
    common_names?: string[];
    taxonomy?: { family?: string; genus?: string };
  } | null;
}

interface AcademicJournalProps {
  userId: string;
}

const UNTAGGED_LABEL = "Sans cours associé";

export default function AcademicJournal({ userId }: AcademicJournalProps) {
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courseInput, setCourseInput] = useState("");
  const [objectiveInput, setObjectiveInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isInitialMount = useRef(true);

  const load = () => {
    setIsLoading(true);
    fetch(`/api/scan-history?userId=${userId}&limit=100`)
      .then((res) => res.json())
      .then((data) => setScans(data.data || []))
      .catch(() => setScans([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (userId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const grouped = useMemo(() => {
    const map = new Map<string, ScanEntry[]>();
    for (const scan of scans) {
      const key = scan.courseName?.trim() || UNTAGGED_LABEL;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(scan);
    }
    // Le groupe "sans cours" en dernier, les cours nommés triés par nombre de relevés
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === UNTAGGED_LABEL) return 1;
      if (b[0] === UNTAGGED_LABEL) return -1;
      return b[1].length - a[1].length;
    });
  }, [scans]);

  const startEdit = (scan: ScanEntry) => {
    setEditingId(scan.id);
    setCourseInput(scan.courseName || "");
    setObjectiveInput(scan.objective || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCourseInput("");
    setObjectiveInput("");
  };

  const saveEdit = async (scanId: string) => {
    setIsSaving(true);
    try {
      await fetch(`/api/scan-history/${scanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseName: courseInput.trim(), objective: objectiveInput.trim() }),
      });
      cancelEdit();
      load();
    } catch {
      // erreur silencieuse : l'édition reste ouverte, l'utilisateur peut réessayer
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="botanical-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h3 className="font-serif text-xl font-bold text-foreground">Carnet de terrain académique</h3>
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        Rattachez vos relevés à un cours ou un TP (ex: &quot;TP Botanique L2 — Sortie Bandia&quot;)
        pour constituer un dossier consultable par votre encadrant.
      </p>

      {isLoading && (
        <div className="flex items-center justify-center py-10 text-foreground/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Chargement...
        </div>
      )}

      {!isLoading && scans.length === 0 && (
        <p className="text-sm text-foreground/60 py-6 text-center">
          Aucun relevé pour l&apos;instant. Identifiez une plante pour commencer votre carnet.
        </p>
      )}

      <div className="space-y-6">
        {grouped.map(([courseName, entries]) => (
          <div key={courseName}>
            <p
              className={`text-xs font-medium uppercase tracking-wide mb-2 ${
                courseName === UNTAGGED_LABEL ? "text-foreground/40" : "text-primary"
              }`}
            >
              {courseName} · {entries.length} relevé{entries.length > 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {entries.map((scan) => {
                const commonNames = scan.result?.common_names || [];
                const name = commonNames[0] || scan.result?.scientific_name || "Espèce inconnue";
                const isEditing = editingId === scan.id;

                return (
                  <div key={scan.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <p className="text-xs text-foreground/50">
                          {new Date(scan.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(scan)}
                          className="text-foreground/30 hover:text-primary flex-shrink-0"
                          title="Rattacher à un cours"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {scan.objective && !isEditing && (
                      <p className="text-xs text-foreground/60 mt-2 pl-5">{scan.objective}</p>
                    )}

                    {isEditing && (
                      <div className="mt-3 pl-5 space-y-2">
                        <input
                          type="text"
                          value={courseInput}
                          onChange={(e) => setCourseInput(e.target.value)}
                          placeholder="Nom du cours/TP (ex: TP Botanique L2 — Sortie Bandia)"
                          className="w-full text-xs border border-border rounded px-2 py-1.5"
                        />
                        <input
                          type="text"
                          value={objectiveInput}
                          onChange={(e) => setObjectiveInput(e.target.value)}
                          placeholder="Objectif de l'observation (optionnel)"
                          className="w-full text-xs border border-border rounded px-2 py-1.5"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(scan.id)}
                            disabled={isSaving}
                            className="flex items-center gap-1 text-xs px-2 py-1 bg-primary text-white rounded disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" /> Enregistrer
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 text-xs px-2 py-1 border border-border rounded"
                          >
                            <X className="w-3 h-3" /> Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
