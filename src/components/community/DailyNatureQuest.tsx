"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bug, Check, Compass, Leaf, Sparkles } from "lucide-react";
import { ORGANISM_LABELS, type OrganismGroup } from "@/types/nature";

const QUESTS: Array<{ group: OrganismGroup; title: string; text: string; icon: typeof Leaf }> = [
  { group: "PLANT", title: "Un végétal à hauteur d’yeux", text: "Partagez une plante, une fleur ou un arbre près de vous.", icon: Leaf },
  { group: "INSECT", title: "Le petit monde en mouvement", text: "Repérez un insecte et racontez ce qu’il fait.", icon: Bug },
  { group: "BIRD", title: "Un chant dans le paysage", text: "Observez un oiseau et le lieu qu’il habite.", icon: Sparkles },
  { group: "OTHER", title: "Un écosystème vivant", text: "Montrez un paysage, une trace ou une rencontre sauvage.", icon: Compass },
  { group: "MAMMAL", title: "Un voisin à quatre pattes", text: "Partagez une rencontre avec un mammifère.", icon: Sparkles },
  { group: "FUNGUS", title: "Le vivant après la pluie", text: "Cherchez un champignon ou une forme de vie discrète.", icon: Leaf },
  { group: "REPTILE", title: "Sur la piste des reptiles", text: "Signalez un reptile observé sans le déranger.", icon: Compass },
  { group: "AMPHIBIAN", title: "La vie au bord de l’eau", text: "Observez un amphibien ou son habitat.", icon: Sparkles },
];

function dateKey() {
  const now = new Date();
  return String(now.getFullYear()) + "-" + String(now.getMonth() + 1) + "-" + String(now.getDate());
}

export default function DailyNatureQuest({ userId }: { userId?: string }) {
  const [quest, setQuest] = useState(QUESTS[0]);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    const day = dateKey();
    const current = new Date();
    const index = Math.floor(new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime() / 86_400_000) % QUESTS.length;
    const currentQuest = QUESTS[index];
    const timer = window.setTimeout(() => {
      setQuest(currentQuest);
      try { setComplete(localStorage.getItem("sununature_daily_quest") === day + ":" + currentQuest.group); } catch { /* storage can be disabled */ }
    }, 0);
    const handlePublished = (event: Event) => {
      const group = (event as CustomEvent<{ organismGroup?: OrganismGroup }>).detail?.organismGroup;
      if (group !== currentQuest.group) return;
      setComplete(true);
      try { localStorage.setItem("sununature_daily_quest", day + ":" + currentQuest.group); } catch { /* storage can be disabled */ }
    };
    window.addEventListener("sununature:observation-published", handlePublished);
    return () => { window.clearTimeout(timer); window.removeEventListener("sununature:observation-published", handlePublished); };
  }, []);
  const Icon = quest.icon;
  return <article className={"nature-daily-quest " + (complete ? "complete" : "")}><div className="nature-daily-quest-top"><span><Sparkles size={14} /> DÉFI DU JOUR</span><strong>{complete ? <><Check size={14} /> Relevé</> : "1 observation"}</strong></div><div className="nature-daily-quest-icon"><Icon size={19} /></div><small>{ORGANISM_LABELS[quest.group]}</small><h3>{complete ? "Un regard de plus pour la biodiversité." : quest.title}</h3><p>{complete ? "Merci d’enrichir le carnet vivant de la communauté." : quest.text}</p>{!complete && (userId ? <button onClick={() => window.dispatchEvent(new CustomEvent("sununature:compose", { detail: { organismGroup: quest.group } }))}>Relever le défi <ArrowRight size={14} /></button> : <Link href="/connexion">Participer au défi <ArrowRight size={14} /></Link>)}</article>;
}
