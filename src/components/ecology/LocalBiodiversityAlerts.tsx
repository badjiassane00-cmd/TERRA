"use client";

import { apiFetch } from "@/lib/api-client";
import { useState } from "react";
import { BellRing, MapPin } from "lucide-react";

type Alert = { id: string; name: string; group: string; region: string; observedAt: string | null; distanceKm: number };

export default function LocalBiodiversityAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [message, setMessage] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  const findNearby = () => {
    if (!navigator.geolocation) { setMessage("La géolocalisation n’est pas disponible sur cet appareil."); return; }
    setMessage("Recherche des observations publiques proches…");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await apiFetch(`/api/ecology/alerts?lat=${coords.latitude}&lng=${coords.longitude}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setAlerts(data.alerts || []);
        setMessage(data.count ? `${data.count} observation(s) publique(s) dans les 30 derniers jours.` : "Aucune observation récente dans les 30 km. Cela ne signifie pas que les espèces sont absentes.");
        if (data.count && "Notification" in window && Notification.permission === "granted") new Notification("TERRA · Vie près de vous", { body: `${data.count} observation(s) publique(s) ont été partagées à proximité.` });
      } catch (error) { setMessage(error instanceof Error ? error.message : "Les alertes locales sont indisponibles."); }
    }, () => setMessage("Position non partagée. Vous pouvez réessayer depuis les réglages du navigateur."), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) { setNotificationMessage("Les notifications navigateur ne sont pas prises en charge ici."); return; }
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    setNotificationMessage(permission === "granted" ? "Notifications locales activées sur cet appareil." : "Notifications refusées. Les alertes restent visibles dans TERRA.");
  };

  return <article className="herbarium-card rounded-2xl p-5 xl:col-span-3">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div><div className="mb-1 flex items-center gap-2"><BellRing className="h-5 w-5 text-primary"/><h3 className="font-serif text-lg font-semibold">Veille biodiversité près de vous</h3></div><p className="text-sm text-foreground/60">Repérez les observations publiques partagées dans un rayon de 30 km durant le dernier mois.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={findNearby} className="herbarium-button herbarium-button-primary shrink-0"><MapPin className="h-4 w-4"/>Voir autour de moi</button><button type="button" onClick={() => void enableNotifications()} className="herbarium-button shrink-0"><BellRing className="h-4 w-4"/>Activer les notifications</button></div>
    </div>
    {notificationMessage && <p className="mt-3 text-xs text-foreground/60" aria-live="polite">{notificationMessage}</p>}{message && <p className="mt-3 text-sm text-foreground/70" aria-live="polite">{message}</p>}
    {alerts.length > 0 && <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">{alerts.slice(0, 8).map((alert) => <div key={alert.id} className="rounded-xl border border-border bg-paper p-3"><strong className="block truncate text-sm">{alert.name}</strong><span className="mt-1 block text-xs text-foreground/60">{alert.group} · {alert.distanceKm} km · {alert.region}</span><span className="text-[11px] text-foreground/50">{alert.observedAt ? new Date(alert.observedAt).toLocaleDateString("fr-FR") : "Date inconnue"}</span></div>)}</div>}
  </article>;
}
