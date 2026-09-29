"use client";

import { Bug, Flower2 } from "lucide-react";

type Relation = { plant: string; insect: string; occurrences: number };

export default function PollinatorNetwork({ relations }: { relations: Relation[] }) {
  return <article className="herbarium-card rounded-2xl p-5">
    <div className="mb-2 flex items-center gap-2"><Flower2 className="h-5 w-5 text-primary"/><h3 className="font-serif text-lg font-semibold">Plantes & insectes</h3></div>
    <p className="mb-4 text-xs text-foreground/60">Co-présences dans un même secteur et le même mois, issues de positions rendues publiques.</p>
    {relations.length ? <ul className="space-y-2">{relations.slice(0, 5).map((relation) => <li key={`${relation.plant}-${relation.insect}`} className="rounded-xl border border-border bg-paper p-3">
      <div className="flex items-center gap-2 text-sm"><span className="min-w-0 flex-1 truncate font-medium">{relation.plant}</span><span aria-hidden="true" className="text-primary">↔</span><Bug className="h-4 w-4 shrink-0 text-accent"/><span className="min-w-0 flex-1 truncate">{relation.insect}</span></div>
      <p className="mt-1 text-[11px] text-foreground/50">{relation.occurrences} co-présences enregistrées · interaction non confirmée</p>
    </li>)}</ul> : <p className="rounded-xl bg-paper p-4 text-sm text-foreground/60">Les liens apparaîtront lorsque des observations publiques de plantes et d’insectes coïncideront dans le temps et l’espace.</p>}
  </article>;
}
