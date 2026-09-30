"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ShieldCheck, Check, X, Loader2, Languages, Image as ImageIcon } from "lucide-react";

interface PendingName {
  id: string;
  language: string;
  languageName: string;
  name: string;
  contributedBy: string | null;
  plant: { scientificName: string };
}

interface PendingPost {
  id: string;
  plantName: string;
  scientificName: string;
  imageUrl: string;
  region: string;
  description: string | null;
}

interface InstitutionPanelProps {
  userId: string;
}

export default function InstitutionPanel({ userId }: InstitutionPanelProps) {
  const [names, setNames] = useState<PendingName[]>([]);
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  const load = useCallback(() => {
    setIsLoading(true);
    fetch(`/api/institution/pending?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setNames(data.pendingNames || []);
        setPosts(data.pendingPosts || []);
      })
      .catch(() => {
        setNames([]);
        setPosts([]);
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (userId) load();
  }, [userId, load]);

  const verifyName = async (id: string) => {
    setBusyId(id);
    await fetch(`/api/local-names/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setNames((prev) => prev.filter((n) => n.id !== id));
    setBusyId(null);
  };

  const rejectName = async (id: string) => {
    setBusyId(id);
    await fetch(`/api/local-names/${id}?userId=${userId}`, { method: "DELETE" });
    setNames((prev) => prev.filter((n) => n.id !== id));
    setBusyId(null);
  };

  const moderatePost = async (id: string, action: "verify" | "remove") => {
    setBusyId(id);
    await fetch(`/api/community/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setBusyId(null);
  };

  const totalPending = names.length + posts.length;

  return (
    <div className="botanical-card rounded-2xl p-6 border-2 border-primary/20">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h3 className="font-serif text-xl font-bold text-foreground">Espace institution</h3>
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        Validez les contributions de la communauté : noms locaux et identifications partagées.
        {totalPending > 0 && (
          <span className="ml-2 text-primary font-medium">{totalPending} en attente</span>
        )}
      </p>

      {isLoading && (
        <div className="flex items-center justify-center py-8 text-foreground/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement...
        </div>
      )}

      {!isLoading && totalPending === 0 && (
        <p className="text-sm text-foreground/60 py-6 text-center">
          Rien en attente de validation pour le moment.
        </p>
      )}

      {names.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-medium text-foreground/60 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Languages className="w-3.5 h-3.5" /> Noms locaux
          </h4>
          <div className="space-y-2">
            {names.map((n) => (
              <div key={n.id} className="flex items-center gap-3 p-3 border border-border rounded-lg text-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-foreground">
                    <span className="font-medium">{n.name}</span>
                    <span className="text-foreground/50"> — {n.languageName}</span>
                  </p>
                  <p className="text-xs text-foreground/50 italic truncate">{n.plant.scientificName}</p>
                </div>
                <button
                  onClick={() => verifyName(n.id)}
                  disabled={busyId === n.id}
                  className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-700 rounded-full hover:bg-green-100 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => rejectName(n.id)}
                  disabled={busyId === n.id}
                  className="w-8 h-8 flex items-center justify-center bg-accent/10 text-accent rounded-full hover:bg-accent/20 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-foreground/60 uppercase tracking-wide mb-2 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" /> Publications communautaires
          </h4>
          <div className="space-y-2">
            {posts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 border border-border rounded-lg text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{p.plantName}</p>
                  <p className="text-xs text-foreground/50 italic truncate">{p.scientificName} • {p.region}</p>
                </div>
                <button
                  onClick={() => moderatePost(p.id, "verify")}
                  disabled={busyId === p.id}
                  className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-700 rounded-full hover:bg-green-100 disabled:opacity-50"
                  title="Certifier l'identification"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moderatePost(p.id, "remove")}
                  disabled={busyId === p.id}
                  className="w-8 h-8 flex items-center justify-center bg-accent/10 text-accent rounded-full hover:bg-accent/20 disabled:opacity-50"
                  title="Retirer la publication"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
