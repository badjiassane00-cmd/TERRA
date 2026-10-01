"use client";

import { apiFetch } from "@/lib/api-client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, UserRound, Leaf, X } from "lucide-react";

type SearchUser = { id: string; name: string; institution: string | null; avatarUrl: string | null };
type SearchSpecies = { id: string; name: string; scientificName: string; imageUrl: string | null; observationId?: string };

export default function CommunitySearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [species, setSpecies] = useState<SearchSpecies[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || query.trim().length < 2) { setUsers([]); setSpecies([]); setError(""); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Recherche momentanément indisponible.");
        setUsers(result.users || []); setSpecies(result.species || []); setError("");
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Recherche momentanément indisponible."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query]);

  return <div className="nature-header-search-wrap">
    <button type="button" className={`nature-nav-link nature-search-toggle ${open ? "active" : ""}`} aria-expanded={open} aria-controls="nature-global-search" onClick={() => { setOpen((value) => !value); setQuery(""); }}><Search size={16}/><span>Rechercher</span></button>
    {open && <section id="nature-global-search" className="nature-global-search" role="dialog" aria-label="Recherche TERRA">
      <div className="nature-global-search-heading"><strong>Rechercher sur TERRA</strong><button type="button" aria-label="Fermer la recherche" onClick={() => setOpen(false)}><X size={17}/></button></div>
      <label><Search size={17}/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }} placeholder="Personne, plante, insecte, animal…"/><kbd>ESC</kbd></label>
      {query.trim().length < 2 ? <p className="nature-global-search-hint">Saisissez au moins 2 caractères pour chercher des naturalistes ou des espèces.</p> : loading ? <p className="nature-global-search-hint" role="status">Recherche…</p> : error ? <p className="nature-global-search-error" role="alert">{error}</p> : <div className="nature-global-search-results">
        <div><h3><UserRound size={15}/> Naturalistes</h3>{users.length ? users.map((user) => <Link key={user.id} href={`/profile/${user.id}`} onClick={() => setOpen(false)}>{user.avatarUrl ? <Image src={user.avatarUrl} width={34} height={34} alt="" unoptimized/> : <span className="nature-search-avatar"><UserRound size={15}/></span>}<span><strong>{user.name}</strong>{user.institution && <small>{user.institution}</small>}</span></Link>) : <p>Aucun profil trouvé.</p>}</div>
        <div><h3><Leaf size={15}/> Espèces</h3>{species.length ? species.map((item) => <Link key={`${item.id}-${item.scientificName}`} href={item.observationId ? `/observations/${item.observationId}` : `/observations?q=${encodeURIComponent(item.scientificName)}`} onClick={() => setOpen(false)}>{item.imageUrl ? <Image src={item.imageUrl} width={40} height={40} alt="" unoptimized/> : <span className="nature-search-avatar"><Leaf size={15}/></span>}<span><strong>{item.name}</strong><small><i>{item.scientificName}</i></small></span></Link>) : <p>Aucune espèce trouvée.</p>}</div>
      </div>}
    </section>}
  </div>;
}
