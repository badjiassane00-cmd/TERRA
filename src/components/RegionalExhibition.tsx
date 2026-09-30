"use client";

import { apiFetch } from "@/lib/api-client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, Calendar, Search, Grid, List, Loader2, Globe, Flower2 } from "lucide-react";
import { useRef } from "react";
import { AnimatedCounter, PlantCard, RegionCard, SpecialtyCard } from "./regional-exhibition/Cards";
import type { Plant, Region, Specialty } from "./regional-exhibition/types";

const months = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

const currentMonth = months[new Date().getMonth()];

export default function RegionalExhibition() {
  const [data, setData] = useState<{
    plants: Plant[];
    regions: Region[];
    specialties: Specialty[];
    stats: { totalPlants: number; totalSpecies: number; totalRegions: number; totalSpecialties: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>(currentMonth);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const isInitialMount = useRef(true);

  const fetchExhibitionData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/exhibition");
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Erreur lors du chargement");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchExhibitionData();
  }, [fetchExhibitionData]);

  const filteredPlants = useMemo(() => {
    if (!data) return [];
    return data.plants.filter((plant) => {
      const seasonMatch = selectedSeason === "all" || plant.bloomingMonths?.includes(selectedSeason);
      const specialtyMatch = selectedSpecialty === "all" || plant.specialty === selectedSpecialty;
      const regionMatch = !selectedRegion || plant.region === selectedRegion;
      const searchMatch = !searchQuery ||
        plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
      return seasonMatch && specialtyMatch && regionMatch && searchMatch;
    });
  }, [data, selectedSeason, selectedSpecialty, selectedRegion, searchQuery]);

  const selectedRegionData = selectedRegion ? data?.regions.find((r) => r.id === selectedRegion) : null;

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-paper to-background">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-foreground/70">Chargement de l&apos;exposition botanique...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-paper to-background">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-terracotta">{error}</p>
          <button onClick={fetchExhibitionData} className="mt-4 herbarium-button herbarium-button-primary">
            Réessayer
          </button>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-paper to-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4 border border-primary/10">
            <Globe className="w-4 h-4" />
            Exploration mondiale
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-4">
            Exposition Botanique Régionale
          </h2>
          <p className="text-base text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Voyagez à travers les régions d&apos;Afrique et découvrez une biodiversité extraordinaire.
            Chaque région possède ses trésors botaniques uniques.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground"><AnimatedCounter value={data.stats.totalPlants} /></p>
              <p className="text-xs text-foreground/60">Plantes</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground"><AnimatedCounter value={data.stats.totalSpecies} /></p>
              <p className="text-xs text-foreground/60">Espèces</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground"><AnimatedCounter value={data.stats.totalRegions} /></p>
              <p className="text-xs text-foreground/60">Régions</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground"><AnimatedCounter value={data.stats.totalSpecialties} /></p>
              <p className="text-xs text-foreground/60">Spécialités</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-wrap items-center gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une plante, une région..."
              className="herbarium-input pl-10 pr-4 py-2.5"
            />
          </div>
          <div className="flex items-center gap-2 bg-paper border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "text-foreground/60 hover:text-foreground"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-foreground/60 hover:text-foreground"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {selectedRegionData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="herbarium-card rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
              <button
                onClick={() => setSelectedRegion(null)}
                className="mb-4 herbarium-button text-xs"
              >
                ← Retour à la carte
              </button>
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-2xl font-bold text-foreground mb-2">{selectedRegionData.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedRegionData.countries.map((country: string) => (
                      <span key={country} className="herbarium-label">{country}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        <AnimatedCounter value={selectedRegionData.plantCount} />
                      </p>
                      <p className="text-xs text-foreground/60">Espèces répertoriées</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{selectedRegionData.specialties.length}</p>
                      <p className="text-xs text-foreground/60">Spécialités</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {data.regions.map((region, index) => (
              <RegionCard
                key={region.id}
                region={region}
                index={index}
                onClick={() => setSelectedRegion(region.id)}
              />
            ))}
          </div>
        )}

        <div className="mb-12">
          <motion.div
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold text-foreground mb-1">
                Plantes par spécialité
              </h3>
              <p className="text-sm text-foreground/60">Explorez par catégorie botanique</p>
            </div>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.specialties.map((specialty, index) => (
              <SpecialtyCard
                key={specialty.id}
                specialty={specialty}
                index={index}
                isActive={selectedSpecialty === specialty.name}
                onClick={() => setSelectedSpecialty(selectedSpecialty === specialty.name ? "all" : specialty.name)}
              />
            ))}
          </div>
        </div>

        <div>
          <motion.div
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold text-foreground mb-1">
                {selectedRegionData ? `Plantes de ${selectedRegionData.name}` : "Collection botanique"}
              </h3>
                  <p className="text-sm text-foreground/60">
                    {filteredPlants.length} plante{filteredPlants.length !== 1 ? "s" : ""} trouvée{filteredPlants.length !== 1 ? "s" : ""}
                  </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-foreground/60" />
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="herbarium-input text-xs py-1.5 px-3"
              >
                <option value="all">Toute l&apos;année</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month.charAt(0).toUpperCase() + month.slice(1, 3)}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          {filteredPlants.length === 0 ? (
            <motion.div
              className="herbarium-card rounded-xl p-16 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Flower2 className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <p className="text-foreground/60 text-lg mb-2">Aucune plante ne correspond à vos critères</p>
              <p className="text-sm text-foreground/50">Essayez de modifier vos filtres ou votre recherche</p>
            </motion.div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPlants.map((plant, index) => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  index={index}
                  onClick={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlants.map((plant, index) => (
                <motion.div
                  key={plant.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="herbarium-card rounded-xl p-5 flex gap-5 items-center cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                    <Image src={plant.imageUrl || "https://images.unsplash.com/photo-1599592574727-290c38af6f8f"} alt={plant.name} width={96} height={96} unoptimized className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-serif font-semibold text-foreground mb-1">{plant.name}</h4>
                    <p className="text-sm text-foreground/60 italic mb-2">{plant.scientificName}</p>
                    {plant.description && (
                      <p className="text-xs text-foreground/70 mb-3 line-clamp-2">{plant.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="herbarium-label text-xs">
                        <MapPin className="w-3 h-3" />
                        {plant.region}
                      </span>
                      <span className="herbarium-label text-xs">{plant.specialty}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
