import type { Metadata } from "next";
import ObservationExplorer from "@/components/observations/ObservationExplorer";

export const metadata: Metadata = { title: "Observations — SunuNature" };

export default function ObservationsPage() {
  return <ObservationExplorer />;
}
