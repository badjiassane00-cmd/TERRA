"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Droplets, Sun, Wind, Calendar, Plus, X, Check } from "lucide-react";

interface Reminder {
  id: string;
  type: "watering" | "sunlight" | "fertilizing" | "pruning";
  plantName: string;
  frequency: "daily" | "weekly" | "monthly";
  time: string;
  enabled: boolean;
  nextReminder: string;
  weatherAdvice?: string | null;
  skipSuggested?: boolean;
}

interface SmartRemindersProps {
  userId?: string;
}

export default function SmartReminders({ userId }: SmartRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [authRequired, setAuthRequired] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    type: "watering" as Reminder["type"],
    plantName: "",
    frequency: "weekly" as Reminder["frequency"],
    time: "08:00",
  });
  const loadReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders");
      if (res.status === 401) {
        setAuthRequired(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setReminders(data.data || []);
        setAuthRequired(false);
      }
    } catch {
      // Erreur silencieuse : liste vide affichée
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const timer = window.setTimeout(() => {
      void loadReminders();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReminders, userId]);

  const toggleReminder = async (id: string) => {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;
    const newEnabled = !target.enabled;
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: newEnabled } : r))
    );
    try {
      await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled: newEnabled }),
      });
    } catch {
      // En cas d'échec, on garde l'état optimiste local
    }
  };

  const addReminder = async () => {
    if (!newReminder.plantName.trim()) return;
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReminder),
      });
      if (res.ok) {
        setNewReminder({
          type: "watering",
          plantName: "",
          frequency: "weekly",
          time: "08:00",
        });
        setShowForm(false);
        await loadReminders();
      }
    } catch {
      // Ajout impossible
    }
  };

  const getIcon = (type: Reminder["type"]) => {
    switch (type) {
      case "watering": return <Droplets className="w-4 h-4" />;
      case "sunlight": return <Sun className="w-4 h-4" />;
      case "fertilizing": return <Wind className="w-4 h-4" />;
      case "pruning": return <Calendar className="w-4 h-4" />;
    }
  };

  const getLabel = (type: Reminder["type"]) => {
    switch (type) {
      case "watering": return "Arrosage";
      case "sunlight": return "Ensoleillement";
      case "fertilizing": return "Fertilisation";
      case "pruning": return "Taille";
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("SunuNature", {
          body: "Les notifications sont activées pour vos rappels botaniques.",
          icon: "/favicon.ico",
        });
      }
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (authRequired) {
    return (
      <div className="herbarium-card rounded-xl p-6 text-center">
        <Bell className="w-6 h-6 text-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-foreground/60">
          Connectez-vous pour créer et suivre vos rappels d&apos;entretien.
        </p>
      </div>
    );
  }

  return (
    <div className="herbarium-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-border bg-paper flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-foreground">Rappels intelligents</h3>
            <p className="text-xs text-foreground/60">
              {reminders.filter((r) => r.enabled).length} actif(s)
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="herbarium-button herbarium-button-primary"
        >
          <Plus className="w-4 h-4" />
          Nouveau
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-paper border border-border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                Plante
              </label>
              <input
                type="text"
                value={newReminder.plantName}
                onChange={(e) => setNewReminder({ ...newReminder, plantName: e.target.value })}
                className="herbarium-input"
                placeholder="Nom de la plante"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                Type
              </label>
              <select
                value={newReminder.type}
                onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value as Reminder["type"] })}
                className="herbarium-input"
              >
                <option value="watering">Arrosage</option>
                <option value="sunlight">Ensoleillement</option>
                <option value="fertilizing">Fertilisation</option>
                <option value="pruning">Taille</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                Fréquence
              </label>
              <select
                value={newReminder.frequency}
                onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value as Reminder["frequency"] })}
                className="herbarium-input"
              >
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                Heure
              </label>
              <input
                type="time"
                value={newReminder.time}
                onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                className="herbarium-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="herbarium-button">
              Annuler
            </button>
            <button onClick={addReminder} className="herbarium-button herbarium-button-primary">
              Ajouter
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading && (
          <p className="text-sm text-foreground/60 text-center py-6">Chargement des rappels...</p>
        )}
        {!loading && reminders.length === 0 && (
          <p className="text-sm text-foreground/60 text-center py-6">
            Aucun rappel. Créez-en un pour prendre soin de vos plantes !
          </p>
        )}
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              reminder.enabled
                ? "border-primary/20 bg-primary/5"
                : "border-border bg-paper opacity-60"
            }`}
          >
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
              reminder.enabled ? "border-primary bg-white" : "border-border bg-paper"
            }`}>
              {getIcon(reminder.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{reminder.plantName}</p>
              <p className="text-xs text-foreground/60">
                {getLabel(reminder.type)} • {reminder.frequency} • {reminder.time}
              </p>
              {reminder.weatherAdvice && (
                <p
                  className={`text-xs mt-1.5 px-2 py-1 rounded inline-block ${
                    reminder.skipSuggested
                      ? "bg-blue-50 text-blue-700"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  🌤️ {reminder.weatherAdvice}
                  {reminder.skipSuggested ? " — arrosage à sauter" : ""}
                </p>
              )}
            </div>
            <button
              onClick={() => toggleReminder(reminder.id)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                reminder.enabled
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-paper text-foreground/40"
              }`}
            >
              {reminder.enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
