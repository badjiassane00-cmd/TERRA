"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Search, UserRound, Leaf } from "lucide-react";

type UserResult = { id: string; name: string; institution: string | null; avatarUrl: string | null };
type SpeciesResult = { id: string; name: string; scientificName: string; imageUrl: string | null; observationId?: string };

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [species, setSpecies] = useState<SpeciesResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) { setUsers([]); setSpecies([]); setError(""); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const response = await apiFetch(`/api/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Recherche indisponible.");
        setUsers(data.users || []); setSpecies(data.species || []);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Recherche indisponible."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);
  return <main className="terra-search-page">
    <header><span><Search size={16} /> EXPLORER LA COMMUNAUTÉ</span><h1>Qui ou quoi<br/><em>avez-vous rencontré ?</em></h1><p>Retrouvez des naturalistes et des espèces observées sur TERRA.</p></header>
    <label className="terra-search-input"><Search size={20}/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom d’utilisateur, plante, insecte, animal…" aria-label="Rechercher des utilisateurs ou des espèces"/><kbd>⌕</kbd></label>
    {loading && <p role="status">Recherche en cours…</p>}{error && <p role="alert">{error}</p>}
    {query.trim().length >= 2 && !loading && !error && <div className="terra-search-results">
      <section><h2><UserRound size={18}/> Naturalistes <small>{users.length}</small></h2>{users.length ? users.map((user) => <Link className="terra-search-user" href={`/profile/${user.id}`} key={user.id}>{user.avatarUrl ? <Image src={user.avatarUrl} alt="" width={44} height={44} unoptimized/> : <span><UserRound size={19}/></span>}<div><strong>{user.name}</strong>{user.institution && <small>{user.institution}</small>}</div></Link>) : <p>Aucun profil trouvé.</p>}</section>
      <section><h2><Leaf size={18}/> Espèces <small>{species.length}</small></h2>{species.length ? species.map((item) => <Link className="terra-search-species" href={item.observationId ? `/observations/${item.observationId}` : `/observations?q=${encodeURIComponent(item.scientificName)}`} key={`${item.id}-${item.scientificName}`}>{item.imageUrl ? <Image src={item.imageUrl} alt="" width={64} height={64} unoptimized/> : <span><Leaf size={20}/></span>}<div><strong>{item.name}</strong><i>{item.scientificName}</i></div></Link>) : <p>Aucune espèce trouvée.</p>}</section>
    </div>}
  </main>;
}
