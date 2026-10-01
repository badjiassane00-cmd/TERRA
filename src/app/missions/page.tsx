import type { Metadata } from "next";
import FieldMissionsDashboard from "@/components/missions/FieldMissionsDashboard";
import { Compass, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Missions de terrain — TERRA",
  description: "Des missions naturalistes guidées par les observations de votre région.",
};

export default function FieldMissionsPage() {
  return (
    <main className="field-missions-page">
      <div className="field-missions-shell">
        <header className="field-missions-intro">
          <div>
            <span className="field-missions-eyebrow"><Sparkles size={14} /> TERRA · OBSERVATION ACTIVE</span>
            <h1>Le vivant a ses angles morts.</h1>
            <p>Choisissez une mission là où les observations publiques sont les plus rares, puis contribuez avec une nouvelle identification.</p>
          </div>
          <div className="field-missions-orbit" aria-hidden="true"><Compass size={30} /><span>ZONE<br />À EXPLORER</span></div>
        </header>
        <FieldMissionsDashboard />
      </div>
    </main>
  );
}