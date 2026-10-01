"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bird,
  Bug,
  Compass,
  Crosshair,
  Droplets,
  Leaf,
  MapPin,
  PawPrint,
  Sparkles,
  Trees,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { ORGANISM_LABELS, type OrganismGroup } from "@/types/nature";

interface EcologySignals {
  currentMonth: {
    month: number;
    count: number;
    species: string[];
    speciesCount: number;
    groupCounts: Record<string, number>;
  };
  region: string;
  radiusKm: number | null;
  sourceCount: number;
}

interface MissionDefinition {
  id: string;
  group: OrganismGroup;
  title: string;
  description: string;
  mode: "identify" | "life";
  lifeGroup?: "insects" | "animals" | "fish" | "all";
  icon: LucideIcon;
}

const MISSIONS: MissionDefinition[] = [
  { id: "plants", group: "PLANT", title: "Végétaux et arbres", description: "Documenter les plantes visibles et leurs changements saisonniers.", mode: "identify", icon: Leaf },
  { id: "invertebrates", group: "INSECT", title: "Insectes et invertébrés", description: "Observer les petits habitants du sol, des fleurs et des points d’eau.", mode: "life", lifeGroup: "insects", icon: Bug },
  { id: "birds", group: "BIRD", title: "Oiseaux", description: "Photographier les oiseaux présents dans les milieux proches.", mode: "life", lifeGroup: "animals", icon: Bird },
  { id: "mammals", group: "MAMMAL", title: "Mammifères", description: "Repérer les mammifères sans les déranger ni s’approcher des animaux sauvages.", mode: "life", lifeGroup: "animals", icon: PawPrint },
  { id: "reptiles", group: "REPTILE", title: "Reptiles", description: "Documenter les espèces visibles, sans les manipuler.", mode: "life", lifeGroup: "animals", icon: Droplets },
  { id: "amphibians", group: "AMPHIBIAN", title: "Amphibiens", description: "Observer les espèces sans les capturer ni déplacer leur habitat.", mode: "life", lifeGroup: "animals", icon: Droplets },
  { id: "fungi", group: "FUNGUS", title: "Champignons", description: "Photographier les formes et habitats, sans récolter les spécimens.", mode: "life", lifeGroup: "all", icon: Sparkles },
  { id: "aquatic", group: "AQUATIC", title: "Vie aquatique", description: "Observer les organismes visibles près des eaux accessibles.", mode: "life", lifeGroup: "fish", icon: Waves },
  { id: "other", group: "OTHER", title: "Autres formes de vie", description: "Signaler les organismes qui ne correspondent pas aux autres groupes.", mode: "life", lifeGroup: "all", icon: Trees },
];

function monthLabel(month: number) {
  return new Date(Date.UTC(2025, month - 1, 1)).toLocaleDateString("fr-FR", { month: "long", timeZone: "UTC" });
}

export default function FieldMissionsDashboard() {
  const [signals, setSignals] = useState<EcologySignals | null>(null);
  const [regionInput, setRegionInput] = useState("");
  const [activeRegion, setActiveRegion] = useState("");
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [areaLabel, setAreaLabel] = useState("Monde");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (activeRegion) params.set("region", activeRegion);
    if (position) {
      params.set("lat", String(position.latitude));
      params.set("lng", String(position.longitude));
      params.set("radius", "30");
    }

    void fetch(`/api/ecology?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Les données écologiques sont indisponibles.");
        setSignals(payload as EcologySignals);
        setError("");
      })
      .catch((error_: unknown) => {
        if (error_ instanceof Error && error_.name === "AbortError") return;
        setError(error_ instanceof Error ? error_.message : "Les données écologiques sont indisponibles.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [activeRegion, position]);

  function applyRegion(event: { preventDefault: () => void }) {
    event.preventDefault();
    setPosition(null);
    setActiveRegion(regionInput.trim());
    setAreaLabel(regionInput.trim() || "Monde");
    setLoading(true);
    setError("");
  }

  function useApproximateLocation() {
    if (!navigator.geolocation) {
      setError("La géolocalisation n’est pas disponible sur cet appareil.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ latitude: Math.round(coords.latitude * 10) / 10, longitude: Math.round(coords.longitude * 10) / 10 });
        setActiveRegion("");
        setRegionInput("");
        setAreaLabel("Autour de moi");
      },
      () => {
        setLoading(false);
        setError("Position non disponible. Vous pouvez rechercher par région.");
      },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  }

  const rankedMissions = [...MISSIONS].sort((left, right) =>
    (signals?.currentMonth.groupCounts[left.group] || 0) - (signals?.currentMonth.groupCounts[right.group] || 0));
  const currentMonthLabel = signals ? monthLabel(signals.currentMonth.month) : "ce mois-ci";

  return (
    <div className="field-missions-dashboard">
      <section className="field-missions-controls" aria-label="Zone des missions">
        <form onSubmit={applyRegion} className="field-missions-region-form">
          <label htmlFor="mission-region"><MapPin size={17} /> Rechercher une région</label>
          <div>
            <input
              id="mission-region"
              type="search"
              value={regionInput}
              onChange={(event) => setRegionInput(event.target.value)}
              placeholder="Ex. Dakar, Sénégal"
              maxLength={80}
            />
            <button type="submit">Explorer la zone <ArrowRight size={15} /></button>
          </div>
        </form>
        <button type="button" className="field-missions-location" onClick={useApproximateLocation}>
          <Crosshair size={17} /> Autour de moi <span>30 km</span>
        </button>
      </section>

      <div className="field-missions-summary" aria-live="polite">
        <div><span>ZONE</span><strong>{signals?.region || areaLabel}</strong></div>
        <div><span>SAISON OBSERVÉE</span><strong>{currentMonthLabel}</strong></div>
        <div><span>RELEVÉS PUBLICS</span><strong>{signals?.currentMonth.count ?? 0}</strong></div>
        <div><span>ESPÈCES DOCUMENTÉES</span><strong>{signals?.currentMonth.speciesCount ?? 0}</strong></div>
      </div>

      {error && <p className="field-missions-error" role="alert">{error}</p>}
      <div className="field-missions-heading">
        <div><span>À EXPLORER EN PRIORITÉ</span><h2>Les angles morts du vivant</h2></div>
        {loading && <span className="field-missions-loading">Actualisation…</span>}
      </div>
      <div className="field-missions-grid">
        {rankedMissions.map((mission, index) => {
          const Icon = mission.icon;
          const observationCount = signals?.currentMonth.groupCounts[mission.group] || 0;
          const params = new URLSearchParams({ mode: mission.mode });
          if (mission.lifeGroup) params.set("group", mission.lifeGroup);
          if (activeRegion) params.set("region", activeRegion);
          return (
            <article className={`field-mission-card field-mission-${mission.group.toLowerCase()}`} key={mission.id}>
              <div className="field-mission-card-top">
                <span className="field-mission-icon"><Icon size={19} /></span>
                {index < 2 && <span className="field-mission-priority">À documenter</span>}
              </div>
              <p className="field-mission-group">{ORGANISM_LABELS[mission.group]}</p>
              <h3>{mission.title}</h3>
              <p className="field-mission-description">{mission.description}</p>
              <div className="field-mission-signal"><strong>{observationCount}</strong><span>observation{observationCount > 1 ? "s" : ""} publique{observationCount > 1 ? "s" : ""} de ce groupe ce mois-ci</span></div>
              <Link href={`/identifier?${params.toString()}`} className="field-mission-action">Lancer la mission <ArrowRight size={16} /></Link>
            </article>
          );
        })}
      </div>
      <p className="field-missions-method">Les priorités reposent sur les observations publiques TERRA du même mois, recueillies dans les deux dernières années. Une zone peu documentée ne signifie pas qu’une espèce y est absente.</p>
      {signals?.sourceCount === 0 && !loading && <p className="field-missions-empty"><Compass size={17} /> Aucune observation publique récente dans cette zone. Chaque publication validée aidera à faire apparaître de nouveaux repères.</p>}
      {position && <p className="field-missions-privacy">Votre position est arrondie avant la recherche et n’est pas enregistrée.</p>}
    </div>
  );
}
