"use client";

import { useEffect, useState, useCallback } from "react";
import { Languages, Plus, ThumbsUp, Loader2, BadgeCheck } from "lucide-react";

interface LocalName {
  id: string;
  language: string;
  languageName: string;
  name: string;
  votes: number;
  verified: boolean;
}

interface LocalNamesProps {
  scientificName: string;
  currentUserId?: string;
  currentUserRole?: "user" | "admin" | "institution";
}

// Langues locales suggérées par défaut (Afrique de l'Ouest, cohérent
// avec le reste de l'exposition régionale). L'utilisateur peut aussi
// taper une autre langue via "Autre".
const SUGGESTED_LANGUAGES = [
  { code: "wo", label: "Wolof" },
  { code: "bm", label: "Bambara" },
  { code: "ff", label: "Peul (Pulaar)" },
  { code: "mos", label: "Mooré" },
  { code: "dyu", label: "Dioula" },
];

export default function LocalNames({ scientificName, currentUserId, currentUserRole }: LocalNamesProps) {
  const isModerator = currentUserRole === "institution" || currentUserRole === "admin";
  const [names, setNames] = useState<LocalName[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [langCode, setLangCode] = useState("wo");
  const [customLang, setCustomLang] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!scientificName) return;
    setIsLoading(true);
    fetch(`/api/local-names?scientificName=${encodeURIComponent(scientificName)}`)
      .then((res) => res.json())
      .then((data) => setNames(data.names || []))
      .catch(() => setNames([]))
      .finally(() => setIsLoading(false));
  }, [scientificName]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    setShowForm(false);
  }, [load]);

  const submit = async () => {
    if (!nameInput.trim()) return;
    const isCustom = langCode === "other";
    const languageName = isCustom ? customLang.trim() : SUGGESTED_LANGUAGES.find((l) => l.code === langCode)?.label || langCode;
    const language = isCustom ? customLang.trim().toLowerCase().slice(0, 8) : langCode;

    if (isCustom && !customLang.trim()) {
      setError("Précisez le nom de la langue.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/local-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scientificName, language, languageName, name: nameInput.trim() }),
      });
      if (!res.ok) throw new Error();
      setNameInput("");
      setShowForm(false);
      load();
    } catch {
      setError("Impossible d'enregistrer ce nom pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const upvote = async (n: LocalName) => {
    // Revoter = renvoyer la même contribution ; la route incrémente le compteur.
    try {
      await fetch("/api/local-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scientificName, language: n.language, languageName: n.languageName, name: n.name }),
      });
      load();
    } catch {
      // silencieux : le vote n'est qu'un bonus, pas une action critique
    }
  };

  const verify = async (n: LocalName) => {
    if (!currentUserId) return;
    try {
      await fetch("/api/local-names", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id, userId: currentUserId }),
      });
      load();
    } catch {
      // silencieux
    }
  };

  return (
    <div className="mb-6 p-4 border border-border rounded-lg bg-paper/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-medium text-foreground">Noms en langues locales</h4>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Ajouter
        </button>
      </div>

      {isLoading && (
        <p className="text-xs text-foreground/50 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Chargement...
        </p>
      )}

      {!isLoading && names.length === 0 && !showForm && (
        <p className="text-xs text-foreground/50">
          Aucun nom local renseigné pour l&apos;instant. Vous connaissez le nom de cette plante
          en wolof, bambara ou une autre langue ? Ajoutez-le.
        </p>
      )}

      {!isLoading && names.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {names.map((n) => (
            <div key={n.id} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-border rounded-full text-xs">
              <button
                onClick={() => upvote(n)}
                title={`${n.votes} vote${n.votes > 1 ? "s" : ""} — cliquer pour confirmer ce nom`}
                className="flex items-center gap-1.5 hover:opacity-80"
              >
                <span className="text-foreground/50">{n.languageName} :</span>
                <span className="font-medium text-foreground">{n.name}</span>
                <span className="flex items-center gap-0.5 text-primary">
                  <ThumbsUp className="w-3 h-3" />
                  {n.votes}
                </span>
              </button>
              {n.verified ? (
                <BadgeCheck className="w-3.5 h-3.5 text-primary" aria-label="Nom vérifié" />
              ) : (
                isModerator && (
                  <button
                    onClick={() => verify(n)}
                    title="Certifier ce nom (compte institution)"
                    className="text-foreground/30 hover:text-primary"
                  >
                    <BadgeCheck className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
          <select
            value={langCode}
            onChange={(e) => setLangCode(e.target.value)}
            className="text-xs border border-border rounded px-2 py-1.5 bg-white"
          >
            {SUGGESTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
            <option value="other">Autre langue…</option>
          </select>
          {langCode === "other" && (
            <input
              type="text"
              value={customLang}
              onChange={(e) => setCustomLang(e.target.value)}
              placeholder="Nom de la langue"
              className="text-xs border border-border rounded px-2 py-1.5 w-32"
            />
          )}
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Nom de la plante dans cette langue"
            className="text-xs border border-border rounded px-2 py-1.5 flex-1 min-w-[160px]"
          />
          <button
            onClick={submit}
            disabled={isSubmitting || !nameInput.trim()}
            className="text-xs px-3 py-1.5 bg-primary text-white rounded disabled:opacity-50"
          >
            {isSubmitting ? "..." : "Valider"}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-accent mt-2">{error}</p>}
    </div>
  );
}
