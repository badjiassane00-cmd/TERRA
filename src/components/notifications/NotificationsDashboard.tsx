"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { announceNotificationsUpdated } from "@/lib/notification-events";
import { useCallback, useEffect, useState } from "react";
import { AtSign, Bell, CheckCheck, ChevronRight, CircleCheck, Leaf, LoaderCircle, MessageCircle, MessageSquareText, Save, Send, Smartphone } from "lucide-react";

type Channel = "email" | "sms" | "whatsapp";
interface NotificationItem { id: string; title: string; body: string; href: string; kind: string; readAt: string | null; createdAt: string }
interface Preferences { phoneNumber: string | null; notifyEmail: boolean; notifySms: boolean; notifyWhatsApp: boolean }
type Providers = Record<Channel, boolean>;
const CHANNELS: Array<{ id: Channel; preference: keyof Pick<Preferences, "notifyEmail" | "notifySms" | "notifyWhatsApp">; label: string; detail: string; icon: typeof AtSign }> = [
  { id: "email", preference: "notifyEmail", label: "E-mail", detail: "Un message clair dès qu’un naturaliste interagit avec vos observations.", icon: AtSign },
  { id: "sms", preference: "notifySms", label: "SMS", detail: "Les nouvelles importantes, directement sur votre téléphone.", icon: Smartphone },
  { id: "whatsapp", preference: "notifyWhatsApp", label: "WhatsApp", detail: "Suivez la vie de votre galerie dans votre messagerie préférée.", icon: MessageCircle },
];

export default function NotificationsDashboard() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [providers, setProviders] = useState<Providers>({ email: false, sms: false, whatsapp: false });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<Channel | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/account/notifications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger vos alertes.");
      setPreferences(data.preferences);
      setPhoneNumber(data.preferences.phoneNumber || "");
      setNotifications(data.notifications || []);
      setUnreadCount(Number.isFinite(Number(data.unreadCount)) ? Math.max(0, Number(data.unreadCount)) : 0);
      setProviders(data.providers);
      setDirty(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger vos alertes.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function savePreferences() {
    if (!preferences) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/account/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber, notifyEmail: preferences.notifyEmail, notifySms: preferences.notifySms, notifyWhatsApp: preferences.notifyWhatsApp }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Enregistrement impossible.");
      setPreferences(data.preferences); setPhoneNumber(data.preferences.phoneNumber || ""); setDirty(false); setNotice("Vos préférences sont enregistrées.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }

  async function sendTest(channel: Channel) {
    setTesting(channel); setError(""); setNotice("");
    try {
      const response = await fetch("/api/account/notifications/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Le message de test n’a pas pu être envoyé.");
      setNotice(data.message);
    } catch (testError) { setError(testError instanceof Error ? testError.message : "Le message de test n’a pas pu être envoyé."); }
    finally { setTesting(null); }
  }

  async function markAllRead() {
    setError("");
    try {
      const response = await fetch("/api/account/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de marquer les notifications comme lues.");
      setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setUnreadCount(0);
      announceNotificationsUpdated();
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Impossible de marquer les notifications comme lues.");
    }
  }

  async function openNotification(item: NotificationItem) {
    if (item.readAt) return;
    try {
      const response = await fetch(`/api/notifications/${item.id}`, { method: "PATCH" });
      if (!response.ok) return;
      setNotifications((items) => items.map((candidate) => candidate.id === item.id ? { ...candidate, readAt: new Date().toISOString() } : candidate));
      setUnreadCount((count) => Math.max(0, count - 1));
      announceNotificationsUpdated();
    } catch {
      setError("La notification n’a pas pu être marquée comme lue.");
    }
  }

  const update = (key: "notifyEmail" | "notifySms" | "notifyWhatsApp", value: boolean) => {
    setPreferences((current) => current ? { ...current, [key]: value } : current); setDirty(true); setNotice("");
  };

  if (loading) return <div className="nature-settings-loading"><LoaderCircle className="animate-spin" /> Chargement de votre espace…</div>;
  if (!preferences) return <div className="nature-settings-empty">{error || "Impossible de charger ce compte."}</div>;

  return <div className="nature-notifications-layout">
    <section className="nature-notification-hero"><div className="nature-notification-hero-icon"><Bell size={22} /></div><div><span>VOTRE ESPACE NATURE</span><h1>La nature vous donne des nouvelles.</h1><p>Gardez le fil des identifications, des nouveaux abonnés et des échanges autour de vos découvertes.</p></div><div className="nature-notification-count"><strong>{unreadCount}</strong><span>non lue{unreadCount > 1 ? "s" : ""}</span></div></section>
    {(notice || error) && <div className={`nature-settings-message ${error ? "error" : "success"}`} role={error ? "alert" : "status"}>{error || notice}</div>}
    <div className="nature-notification-columns">
      <section className="nature-settings-card nature-inbox"><div className="nature-settings-card-heading"><div><span>LE FIL DE VOTRE COMMUNAUTÉ</span><h2>Notifications récentes</h2></div>{unreadCount > 0 && <button onClick={() => void markAllRead()}><CheckCheck size={15} /> Tout lire</button>}</div>
        {notifications.length ? <div className="nature-notification-list">{notifications.map((item) => <Link href={item.href} key={item.id} onClick={(event) => { if (!item.readAt) { event.preventDefault(); void openNotification(item).finally(() => router.push(item.href)); } }} className={`nature-notification-item ${item.readAt ? "read" : "unread"}`}><span className="nature-notification-item-icon">{item.kind === "follow" ? <Leaf size={17} /> : item.kind === "like" ? <CircleCheck size={17} /> : <MessageSquareText size={17} />}</span><span className="nature-notification-copy"><strong>{item.title}</strong><span>{item.body}</span><small>{new Date(item.createdAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></span>{!item.readAt && <i />}</Link>)}</div> : <div className="nature-notification-empty"><span><Bell size={22} /></span><strong>Votre communauté est calme pour l’instant</strong><p>Les réponses, abonnements et appréciations apparaîtront ici.</p><Link href="/observations">Explorer le fil <ChevronRight size={15} /></Link></div>}
      </section>
      <section className="nature-settings-card nature-channel-settings"><div className="nature-settings-card-heading"><div><span>À VOTRE RYTHME</span><h2>Où vous écrire ?</h2></div></div><p className="nature-channel-intro">Choisissez comment recevoir les nouvelles de votre communauté. Les alertes dans l’application restent actives.</p><label className="nature-phone-field">Votre numéro international <input type="tel" value={phoneNumber} placeholder="+221 77 123 45 67" autoComplete="tel" onChange={(event) => { setPhoneNumber(event.target.value); setDirty(true); }} /><small>Exemple Sénégal : +221771234567</small></label>
        <div className="nature-channel-list">{CHANNELS.map(({ id, preference, label, detail, icon: Icon }) => { const enabled = preferences[preference]; return <article className="nature-channel-item" key={id}><span className="nature-channel-icon"><Icon size={18} /></span><div className="nature-channel-details"><strong>{label}</strong><span>{id === "email" ? "Adresse associée au compte" : phoneNumber || "Numéro non renseigné"}</span><p>{detail}</p><small className={providers[id] ? "configured" : "not-configured"}>{providers[id] ? "Service connecté" : "Fournisseur à configurer"}</small></div><label className="nature-switch" aria-label={`${enabled ? "Désactiver" : "Activer"} les notifications ${label.toLowerCase()}`}><input type="checkbox" checked={enabled} onChange={(event) => update(preference, event.target.checked)} /><span /></label><button className="nature-test-channel" disabled={!enabled || !providers[id] || saving || testing !== null} onClick={() => void sendTest(id)}>{testing === id ? <LoaderCircle className="animate-spin" size={14} /> : <Send size={14} />} Tester</button></article>; })}</div>
        {(preferences.notifySms || preferences.notifyWhatsApp) && <p className="nature-consent-copy">En activant SMS ou WhatsApp, vous consentez à recevoir les alertes TERRA sur ce numéro. Vous pouvez retirer votre accord ici à tout moment. WhatsApp exige un expéditeur approuvé et un modèle de message accepté.</p>}
        <div className="nature-settings-footer"><span>{dirty ? "Modifications non enregistrées" : "Vos choix restent privés et modifiables"}</span><button disabled={!dirty || saving} onClick={() => void savePreferences()}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />} Enregistrer</button></div>
      </section>
    </div>
  </div>;
}
