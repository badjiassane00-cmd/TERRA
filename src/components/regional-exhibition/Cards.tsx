"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Leaf, Flower2, TreePine, Sparkles, TrendingUp, Globe, ChevronRight } from "lucide-react";
import type { Plant, Region, Specialty } from "./types";

export function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView.current) {
          isInView.current = true;
          let startTime: number;
          const duration = 1500;

          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOut * value));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export function RegionCard({ region, index, onClick }: { region: Region; index: number; onClick: () => void }) {
  const colors: Record<string, string> = {
    "west-africa": "#4a9e6b",
    "central-africa": "#78b57c",
    "east-africa": "#52b788",
    "north-africa": "#74c69d",
  };

  const color = colors[region.id] || "#4a9e6b";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className="herbarium-card rounded-xl p-6 cursor-pointer group relative overflow-hidden card-hover"
    >
      <div className="absolute top-0 left-0 right-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: `${color}40`, backgroundColor: `${color}15` }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <MapPin className="w-6 h-6" style={{ color }} />
          </motion.div>
          <div>
            <h3 className="font-serif font-semibold text-foreground text-lg">{region.name}</h3>
            <p className="text-xs text-foreground/60 mt-0.5">{region.countries.length} pays</p>
          </div>
        </div>
        <motion.div
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ x: 3 }}
        >
          <ChevronRight className="w-4 h-4 text-primary" />
        </motion.div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <p className="text-xs font-medium text-foreground/70">En fleur ce mois-ci</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {region.bloomingNow.length > 0 ? (
            region.bloomingNow.slice(0, 4).map((plant) => (
              <motion.span
                key={plant}
                className="herbarium-label text-xs cursor-default"
                whileHover={{ scale: 1.05 }}
              >
                {plant}
              </motion.span>
            ))
          ) : (
            <span className="text-xs text-foreground/50">Aucune donnée</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm text-foreground/70">
            <AnimatedCounter value={region.plantCount} /> plantes
          </span>
        </div>
        <span className="text-xs font-medium" style={{ color }}>
          Explorer →
        </span>
      </div>
    </motion.div>
  );
}

export function SpecialtyCard({ specialty, index, isActive, onClick }: { specialty: Specialty; index: number; isActive: boolean; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onClick={onClick}
      className={`herbarium-card rounded-xl p-6 cursor-pointer text-center transition-all duration-300 relative overflow-hidden ${
        isActive ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
      }`}
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-primary/5"
          layoutId="specialtyGlow"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div className="relative z-10">
        <motion.div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isActive ? "bg-primary/15" : "bg-primary/5"
          }`}
          whileHover={{ scale: 1.1, rotate: 10 }}
        >
          {specialty.name === "Médicinale" && <Leaf className={`w-7 h-7 ${isActive ? "text-primary" : "text-primary/70"}`} />}
          {specialty.name === "Ornementale" && <Flower2 className={`w-7 h-7 ${isActive ? "text-primary" : "text-primary/70"}`} />}
          {specialty.name === "Forestière" && <TreePine className={`w-7 h-7 ${isActive ? "text-primary" : "text-primary/70"}`} />}
          {(specialty.name === "Alimentaire" || specialty.name === "Savane" || specialty.name === "Montagnarde" || specialty.name === "Désertique" || specialty.name === "Tropicale" || specialty.name === "Méditerranéenne") && <Leaf className={`w-7 h-7 ${isActive ? "text-primary" : "text-primary/70"}`} />}
        </motion.div>
        <h4 className="font-serif font-semibold text-foreground mb-1">{specialty.name}</h4>
        <p className="text-xs text-foreground/60 mb-3">{specialty.description}</p>
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Globe className="w-3 h-3" />
          <AnimatedCounter value={specialty.count} /> espèces
        </div>
      </div>
    </motion.div>
  );
}

export function PlantCard({ plant, index, onClick }: { plant: Plant; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateY: 15 }}
      whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className="herbarium-card rounded-xl overflow-hidden cursor-pointer group relative"
    >
      <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden">
        <motion.img
          src={plant.imageUrl || "https://images.unsplash.com/photo-1599592574727-290c38af6f8f"}
          alt={plant.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.6 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3">
          <span className={`herbarium-label text-xs backdrop-blur-sm ${
            plant.medicinal ? "bg-accent/90 text-white border-accent" : "bg-white/90 text-primary border-white"
          }`}>
            {plant.medicinal ? "Médicinale" : "Commune"}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h4 className="font-serif font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {plant.name}
        </h4>
        <p className="text-sm text-foreground/60 italic mb-2">{plant.scientificName}</p>
        {plant.description && (
          <p className="text-xs text-foreground/70 mb-3 line-clamp-2">{plant.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-foreground/50">
            <MapPin className="w-3 h-3" />
            <span>{plant.region}</span>
          </div>
          <span className="herbarium-label text-xs">{plant.specialty}</span>
        </div>
        {plant.diseases && plant.diseases.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-foreground/60">
              {plant.diseases.length} maladie(s) connue(s)
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

