"use client";

import { apiFetch } from "@/lib/api-client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Star, Target, Award, Zap } from "lucide-react";

interface GamificationProps {
  userId?: string;
}

interface UserStats {
  points: number;
  level: number;
  badges: string[];
  streak: number;
  scansToday: number;
  dailyGoal: number;
  plantsIdentified: number;
  diseasesDetected: number;
}

const badges = [
  { id: "first_scan", name: "Premier scan", icon: "🌱", description: "Première plante identifiée" },
  { id: "botanist", name: "Botaniste amateur", icon: "🌿", description: "10 plantes identifiées" },
  { id: "expert", name: "Expert botanique", icon: "🌳", description: "50 plantes identifiées" },
  { id: "disease_hunter", name: "Chasseur de maladies", icon: "🔬", description: "5 maladies détectées" },
  { id: "streak_7", name: "7 jours consécutifs", icon: "🔥", description: "Utilisation 7 jours d'affilée" },
  { id: "explorer", name: "Explorateur", icon: "🗺️", description: "5 régions explorées" },
];

const dailyChallenges = [
  { id: "scan_3", title: "Scanner 3 plantes", description: "Identifiez 3 plantes aujourd'hui", reward: 50, completed: false },
  { id: "disease_1", title: "Détecter une maladie", description: "Utilisez le mode maladie", reward: 30, completed: false },
  { id: "region_1", title: "Explorer une région", description: "Consultez l'exposition régionale", reward: 20, completed: false },
];

export default function GamificationPanel({ userId }: GamificationProps) {
  const [stats, setStats] = useState<UserStats>({
    points: 0,
    level: 1,
    badges: [],
    streak: 0,
    scansToday: 0,
    dailyGoal: 5,
    plantsIdentified: 0,
    diseasesDetected: 0,
  });
  const [showBadges, setShowBadges] = useState(false);
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch("/api/gamification");
      if (res.ok) {
        const data = await res.json();
        setStats((prev) => ({
          ...prev,
          points: data.points ?? 0,
          level: data.level ?? 1,
          badges: data.badges ?? [],
          streak: data.streak ?? 0,
          scansToday: data.scansToday ?? 0,
        }));
      }
    } catch {
      // API indisponible : on garde les valeurs par défaut
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const timer = window.setTimeout(() => {
      void fetchStats();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchStats, userId]);

  const progressPercent = Math.min((stats.scansToday / stats.dailyGoal) * 100, 100);
  const levelProgress = ((stats.points % 100) / 100) * 100;

  return (
    <div className="herbarium-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-border bg-paper flex items-center justify-center">
            <Trophy className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-foreground">Progression</h3>
            <p className="text-xs text-foreground/60">Niveau {stats.level}</p>
          </div>
        </div>
        <button
          onClick={() => setShowBadges(!showBadges)}
          className="herbarium-button"
        >
          <Award className="w-4 h-4" />
          Badges
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-border rounded-lg p-3 bg-paper text-center">
          <Zap className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.points}</p>
          <p className="text-xs text-foreground/60">Points</p>
        </div>
        <div className="border border-border rounded-lg p-3 bg-paper text-center">
          <Flame className="w-5 h-5 text-terracotta mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.streak}</p>
          <p className="text-xs text-foreground/60">Jours consécutifs</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground/70">Niveau {stats.level}</span>
          <span className="text-xs text-foreground/60">{stats.points % 100}/100 XP</span>
        </div>
        <div className="confidence-gauge">
          <div
            className="confidence-gauge-fill bg-accent"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground/70">Objectif quotidien</span>
          <span className="text-xs text-foreground/60">
            {stats.scansToday}/{stats.dailyGoal}
          </span>
        </div>
        <div className="confidence-gauge">
          <div
            className="confidence-gauge-fill bg-primary"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {stats.scansToday >= stats.dailyGoal && (
          <p className="text-xs text-primary font-medium mt-1">
            Objectif atteint ! +50 points bonus
          </p>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-medium text-foreground">Défis quotidiens</h4>
        </div>
        <div className="space-y-2">
          {dailyChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                stats.scansToday >= stats.dailyGoal
                  ? "border-primary/20 bg-primary/5"
                  : "border-border bg-paper"
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{challenge.title}</p>
                <p className="text-xs text-foreground/60">{challenge.description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-accent font-medium">
                <Star className="w-3 h-3" />
                +{challenge.reward}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showBadges && (
          <motion.div
            className="border-t border-border pt-4 mt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h4 className="text-sm font-medium text-foreground mb-3">Badges débloqués</h4>
            <div className="grid grid-cols-3 gap-2">
              {badges.map((badge) => {
                const unlocked = stats.badges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-lg border text-center ${
                      unlocked
                        ? "border-primary/20 bg-primary/5"
                        : "border-border bg-paper opacity-50"
                    }`}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <p className="text-xs font-medium text-foreground truncate">
                      {badge.name}
                    </p>
                    <p className="text-xs text-foreground/60 truncate">
                      {unlocked ? badge.description : "??? "}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
