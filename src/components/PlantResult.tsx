"use client";

import { Leaf, Bug, Bird, PawPrint, AlertTriangle, Info, Droplets, Sun, Wind, FlaskConical } from "lucide-react";
import LocalNames from "./LocalNames";
import ConservationBadge from "./ConservationBadge";
import SahelCalendar from "./SahelCalendar";
import AddToExhibitionButton from "./exhibitions/AddToExhibitionButton";

interface PlantResult {
  id: string;
  scientific_name: string;
  common_names: string[];
  probability: number;
  description?: string;
  taxonomy?: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
    species?: string;
  };
  medicinal?: boolean;
  edible_parts?: string[];
  toxicity?: string[];
  watering?: string;
  sunlight?: string;
  soil?: string;
  growth_rate?: string;
  disease_detection?: Array<{
    disease: string;
    confidence: number;
    description: string;
    treatment: string[];
  }>;
  similar_images?: Array<{
    url: string;
    similarity: number;
  }>;
  imageUrl?: string;
  sources?: { provider: string; gbif?: string };
  alternatives?: Array<{ scientific_name: string; common_names: string[]; probability: number }>;
}

interface PlantResultProps {
  result: PlantResult | null;
  isLoading: boolean;
  previewUrl?: string | null;
  userId?: string;
  userRole?: "user" | "admin" | "institution";
  mode?: "identify" | "disease" | "life";
}

function ConfidenceGauge({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const color =
    value > 0.8
      ? "bg-primary"
      : value > 0.5
        ? "bg-accent"
        : "bg-terracotta";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-foreground/70">Fiabilité</span>
        <span className="text-xs font-semibold text-foreground">{percent}%</span>
      </div>
      <div className="confidence-gauge">
        <div
          className={`confidence-gauge-fill ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-foreground/60 mt-1">
        {value > 0.8
          ? "Identification fiable"
          : value > 0.5
            ? "Résultat probable, vérifiez les détails"
            : "Résultat incertain, essayez une autre photo"}
      </p>
    </div>
  );
}

function CalloutDot({ label, x, y }: { label: string; x: string; y: string }) {
  return (
    <div
      className="absolute group"
      style={{ left: x, top: y }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-terracotta border border-white shadow-sm" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
        <div className="bg-primary-dark text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {label}
        </div>
      </div>
    </div>
  );
}

export default function PlantResult({ result, isLoading, previewUrl, userId, userRole, mode = "identify" }: PlantResultProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8">
        <div className="herbarium-card rounded-xl p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-base font-medium text-foreground">
              Analyse de l&apos;image en cours...
            </p>
            <p className="text-sm text-foreground/60 mt-2">
              {mode === "life" ? "Analyse multi-espèces sur votre appareil" : mode === "disease" ? "Analyse des signes visibles sur la plante" : "Identification botanique via IA"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const imageToShow = result.imageUrl || previewUrl;
  const isBotanical = !result.sources?.provider?.includes("MobileNet");
  const TaxonIcon = isBotanical ? Leaf : result.taxonomy?.class === "Insecta" ? Bug : result.taxonomy?.class === "Aves" ? Bird : PawPrint;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-6">
      <div className="herbarium-card rounded-xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TaxonIcon className="w-7 h-7 text-primary" />
              <h2 className="font-serif text-2xl font-bold text-foreground">
                {result.scientific_name}
              </h2>
            </div>
            {result.common_names && result.common_names.length > 0 && (
              <p className="text-base text-foreground/70 italic">
                {result.common_names.join(", ")}
              </p>
            )}
            <div className="mt-2">
              <ConservationBadge scientificName={result.scientific_name} />
            </div>
            {result.taxonomy && (
              (() => {
                const t = result.taxonomy;
                const ranks: Array<[string, string | undefined]> = [
                  ["Règne", t.kingdom],
                  ["Embranchement", t.phylum],
                  ["Classe", t.class],
                  ["Ordre", t.order],
                  ["Famille", t.family],
                  ["Genre", t.genus],
                ];
                const known = ranks.filter(([, value]) => Boolean(value));
                if (known.length === 0) return null;
                return (
                  <p className="text-xs text-foreground/50 mt-2 flex flex-wrap gap-x-1.5">
                    {known.map(([label, value], i) => (
                      <span key={label}>
                        <span className="text-foreground/40">{label} :</span>{" "}
                        <span className="text-foreground/70">{value}</span>
                        {i < known.length - 1 ? " ·" : ""}
                      </span>
                    ))}
                  </p>
                );
              })()
            )}
          </div>
          <div className="w-40">
            <ConfidenceGauge value={result.probability} />
          </div>
        </div>

        {result.alternatives && result.alternatives.length > 1 && <div className="mb-5 rounded-xl border border-border bg-paper p-4"><h3 className="mb-3 text-sm font-semibold text-foreground">Autres pistes visuelles</h3><div className="grid gap-2 sm:grid-cols-2">{result.alternatives.slice(1, 5).map((candidate, index) => <div key={`${candidate.scientific_name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2"><span className="min-w-0"><strong className="block truncate text-xs text-foreground">{candidate.common_names[0] || candidate.scientific_name}</strong><small className="block truncate italic text-[10px] text-foreground/55">{candidate.scientific_name}</small></span><span className="text-[10px] font-semibold text-primary">{Math.round(candidate.probability * 100)}%</span></div>)}</div></div>}

        {isBotanical && <>
          <LocalNames scientificName={result.scientific_name} currentUserId={userId} currentUserRole={userRole} />
          <SahelCalendar scientificName={result.scientific_name} />
          <div className="mb-6 -mt-2"><AddToExhibitionButton userId={userId} scientificName={result.scientific_name} commonName={result.common_names?.[0]} /></div>
        </>}

        {imageToShow && (
          <div className="relative rounded-lg overflow-hidden mb-6 border border-border">
            <img
              src={imageToShow}
              alt={result.scientific_name}
              className="w-full h-64 object-cover"
            />
            {isBotanical && <>
              <CalloutDot label="Forme générale" x="25%" y="30%" />
              <CalloutDot label="Nervures" x="60%" y="45%" />
              <CalloutDot label="Texture" x="40%" y="70%" />
            </>}
          </div>
        )}

        {result.taxonomy && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {result.taxonomy.family && (
              <div className="border border-border rounded-lg p-3 bg-paper">
                <p className="text-xs text-foreground/60 uppercase tracking-wide mb-1">Famille</p>
                <p className="font-medium text-foreground text-sm">{result.taxonomy.family}</p>
              </div>
            )}
            {result.taxonomy.genus && (
              <div className="border border-border rounded-lg p-3 bg-paper">
                <p className="text-xs text-foreground/60 uppercase tracking-wide mb-1">Genre</p>
                <p className="font-medium text-foreground text-sm">{result.taxonomy.genus}</p>
              </div>
            )}
            {result.taxonomy.species && (
              <div className="border border-border rounded-lg p-3 bg-paper">
                <p className="text-xs text-foreground/60 uppercase tracking-wide mb-1">Espèce</p>
                <p className="font-medium text-foreground text-sm">{result.taxonomy.species}</p>
              </div>
            )}
          </div>
        )}

        {result.description && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="font-serif font-semibold text-foreground">Description</h3>
            </div>
            <p className="text-foreground/80 leading-relaxed text-sm">{result.description}</p>
          </div>
        )}

        {isBotanical && <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {result.watering && (
            <div className="border border-border rounded-lg p-3 bg-paper">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-primary" />
                <h4 className="font-medium text-foreground text-sm">Arrosage</h4>
              </div>
              <p className="text-xs text-foreground/70">{result.watering}</p>
            </div>
          )}
          {result.sunlight && (
            <div className="border border-border rounded-lg p-3 bg-paper">
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-4 h-4 text-accent" />
                <h4 className="font-medium text-foreground text-sm">Ensoleillement</h4>
              </div>
              <p className="text-xs text-foreground/70">{result.sunlight}</p>
            </div>
          )}
          {result.soil && (
            <div className="border border-border rounded-lg p-3 bg-paper">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="w-4 h-4 text-primary-light" />
                <h4 className="font-medium text-foreground text-sm">Sol</h4>
              </div>
              <p className="text-xs text-foreground/70">{result.soil}</p>
            </div>
          )}
        </div>}

        {isBotanical && result.medicinal && (
          <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-4 h-4 text-primary" />
              <h4 className="font-serif font-semibold text-foreground">Plante médicinale</h4>
            </div>
            <p className="text-sm text-foreground/70">
              Cette plante possède des propriétés médicinales reconnues.
            </p>
          </div>
        )}

        {isBotanical && result.edible_parts && result.edible_parts.length > 0 && (
          <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 mb-6">
            <h4 className="font-serif font-medium text-foreground mb-2 text-sm">Parties comestibles</h4>
            <div className="flex flex-wrap gap-2">
              {result.edible_parts.map((part, index) => (
                <span
                  key={index}
                  className="herbarium-label"
                >
                  {part}
                </span>
              ))}
            </div>
          </div>
        )}

        {isBotanical && result.toxicity && result.toxicity.length > 0 && (
          <div className="border border-terracotta/30 bg-terracotta/5 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-terracotta" />
              <h4 className="font-serif font-semibold text-foreground">Toxicité</h4>
            </div>
            <ul className="list-disc list-inside text-sm text-foreground/70 space-y-1">
              {result.toxicity.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {isBotanical && result.disease_detection && result.disease_detection.length > 0 && (
          <div className="border border-terracotta/30 bg-terracotta/5 rounded-lg p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="w-5 h-5 text-terracotta" />
              <h3 className="font-serif font-semibold text-foreground">Détection de maladies</h3>
            </div>
            <div className="space-y-4">
              {result.disease_detection.map((disease, index) => (
                <div key={index} className="border border-terracotta/20 bg-white rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-terracotta">{disease.disease}</h4>
                    <span className={`herbarium-label ${
                      disease.confidence > 0.7
                        ? "border-terracotta/40 text-terracotta"
                        : disease.confidence > 0.4
                          ? "border-accent text-accent"
                          : "border-border text-foreground/70"
                    }`}>
                      {Math.round(disease.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-foreground/70 mb-3">{disease.description}</p>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Traitements recommandés:</p>
                    <ul className="list-disc list-inside text-sm text-foreground/70 space-y-1">
                      {disease.treatment.map((treatment, i) => (
                        <li key={i}>{treatment}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.similar_images && result.similar_images.length > 0 && (
          <div className="mt-6">
            <h4 className="font-serif font-medium text-foreground mb-3 text-sm">Images similaires</h4>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {result.similar_images.slice(0, 5).map((img, index) => (
                <img
                  key={index}
                  src={img.url}
                  alt={`Similaire ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-lg border border-border flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-foreground/50">
          Identification : {result.sources?.provider || "service IA"}
          {result.sources?.gbif && <> · <a className="underline hover:text-primary" href={result.sources.gbif} target="_blank" rel="noreferrer">fiche taxonomique GBIF</a></>}
        </p>
      </div>
    </div>
  );
}
