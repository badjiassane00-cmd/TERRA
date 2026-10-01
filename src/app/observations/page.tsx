import type { Metadata } from "next";
import ObservationExplorer from "@/components/observations/ObservationExplorer";
import Link from "next/link";
import { Camera, Clapperboard } from "lucide-react";

export const metadata: Metadata = { title: "Observations — TERRA" };

export default function ObservationsPage() {
  return <><div className="observation-media-cta"><span><Camera size={18} /><Clapperboard size={18} /></span><div><strong>Partagez une observation en photo ou en vidéo</strong><small>Ajoutez vos images et vidéos au carnet collectif du vivant.</small></div><Link href="/explorer?compose=1#publications">Ajouter un média</Link></div><ObservationExplorer /></>;
}
