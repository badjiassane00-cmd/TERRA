import type { Metadata } from "next";
import ObservationExplorer from "@/components/observations/ObservationExplorer";

export const metadata: Metadata = { title: "Observations — TERRA" };

export default function ObservationsPage() {
  return <ObservationExplorer />;
}
