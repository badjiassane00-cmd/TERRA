"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useRef, useState } from "react";
import { Radio, Users, Copy, Check, LogOut, Loader2, Leaf } from "lucide-react";

interface SessionEntry {
  id: string;
  createdAt: string;
  user: { name: string };
  result: { scientific_name?: string; common_names?: string[] } | null;
}

interface SessionDetail {
  id: string;
  title: string;
  code: string;
  active: boolean;
  supervisorId: string;
  supervisor?: { name: string };
  entries: SessionEntry[];
}

interface FieldSessionProps {
  userId: string;
  onSessionChange: (sessionId: string | null) => void;
}

const STORAGE_KEY = "botanique_active_session_id";

export default function FieldSession({ userId, onSessionChange }: FieldSessionProps) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [title, setTitle] = useState("");
  const [courseName, setCourseName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSession = (id: string) => {
    apiFetch(`/api/field-sessions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session);
          setIsSupervisor(data.session.supervisorId === userId);
          onSessionChange(data.session.active ? data.session.id : null);
          if (!data.session.active) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) loadSession(storedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session?.active) {
      pollRef.current = setInterval(() => loadSession(session.id), 6000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.active]);

  const createSession = async () => {
    if (!title.trim()) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await apiFetch("/api/field-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: title.trim(), courseName: courseName || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(STORAGE_KEY, data.session.id);
      setIsSupervisor(true);
      loadSession(data.session.id);
      setShowCreate(false);
      setTitle("");
      setCourseName("");
    } catch {
      setError("Impossible de créer la session.");
    } finally {
      setIsBusy(false);
    }
  };

  const joinSession = async () => {
    if (!joinCode.trim()) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await apiFetch("/api/field-sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(STORAGE_KEY, data.session.id);
      setIsSupervisor(false);
      loadSession(data.session.id);
      setShowJoin(false);
      setJoinCode("");
    } catch {
      setError("Code invalide ou session terminée.");
    } finally {
      setIsBusy(false);
    }
  };

  const leaveOrEnd = async () => {
    if (!session) return;
    if (isSupervisor) {
      await apiFetch(`/api/field-sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, active: false }),
      });
    }
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    onSessionChange(null);
  };

  const copyCode = () => {
    if (!session) return;
    navigator.clipboard?.writeText(session.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (session?.active) {
    return (
      <div className="botanical-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            <h3 className="font-serif text-xl font-bold text-foreground">{session.title}</h3>
          </div>
          <button
            onClick={leaveOrEnd}
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" />
            {isSupervisor ? "Terminer la session" : "Quitter"}
          </button>
        </div>

        {isSupervisor ? (
          <>
            <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 rounded-lg">
              <span className="text-xs text-foreground/60">Code à partager :</span>
              <span className="font-mono text-lg font-bold text-primary tracking-widest">
                {session.code}
              </span>
              <button onClick={copyCode} className="text-foreground/40 hover:text-primary">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <span className="ml-auto text-xs text-foreground/50 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {session.entries.length} relevé{session.entries.length !== 1 ? "s" : ""}
              </span>
            </div>

            {session.entries.length === 0 ? (
              <p className="text-sm text-foreground/50 text-center py-6">
                En attente des premières identifications des étudiants...
              </p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {session.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 p-2 border border-border rounded-lg text-sm"
                  >
                    <Leaf className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="font-medium text-foreground">{entry.user.name}</span>
                    <span className="text-foreground/50">—</span>
                    <span className="text-foreground/70 truncate">
                      {entry.result?.common_names?.[0] || entry.result?.scientific_name || "Espèce"}
                    </span>
                    <span className="ml-auto text-xs text-foreground/40 flex-shrink-0">
                      {new Date(entry.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-foreground/60">
            Session active encadrée par {session.supervisor?.name || "votre enseignant"}. Vos
            prochaines identifications seront automatiquement ajoutées à cette session.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="botanical-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Radio className="w-5 h-5 text-primary" />
        <h3 className="font-serif text-xl font-bold text-foreground">Session de terrain</h3>
      </div>
      <p className="text-sm text-foreground/60 mb-4">
        Un encadrant crée une session pour une sortie et voit les identifications des étudiants
        arriver en direct. Un étudiant rejoint avec le code communiqué sur place.
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => { setShowCreate((v) => !v); setShowJoin(false); }}
          className="text-sm px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
        >
          Créer une session
        </button>
        <button
          onClick={() => { setShowJoin((v) => !v); setShowCreate(false); }}
          className="text-sm px-4 py-2 border border-primary/30 text-primary rounded-full hover:bg-primary/5 transition-colors"
        >
          Rejoindre avec un code
        </button>
      </div>

      {showCreate && (
        <div className="space-y-2 p-4 border border-border rounded-xl bg-paper/50 mb-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la sortie (ex: TP Botanique L2 — Bandia)"
            className="w-full text-sm border border-border rounded px-3 py-2"
          />
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Cours associé (optionnel)"
            className="w-full text-sm border border-border rounded px-3 py-2"
          />
          <button
            onClick={createSession}
            disabled={isBusy || !title.trim()}
            className="text-sm px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Démarrer"}
          </button>
        </div>
      )}

      {showJoin && (
        <div className="flex gap-2 p-4 border border-border rounded-xl bg-paper/50 mb-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Code (ex: 7K2XQ)"
            className="flex-1 text-sm border border-border rounded px-3 py-2 font-mono tracking-widest"
            maxLength={6}
          />
          <button
            onClick={joinSession}
            disabled={isBusy || !joinCode.trim()}
            className="text-sm px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
          >
            Rejoindre
          </button>
        </div>
      )}

      {error && <p className="text-xs text-accent">{error}</p>}
    </div>
  );
}
