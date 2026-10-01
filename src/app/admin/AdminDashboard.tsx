"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Flag, Heart, RefreshCw, Shield, Trash2, Users } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

type Report = {
  id: string; targetType: "POST" | "USER"; targetId: string; reason: string; details: string | null;
  status: "OPEN" | "REVIEWED" | "DISMISSED"; createdAt: string; reporter: { name: string; email: string };
  target: { name?: string; email?: string; plantName?: string; removed?: boolean; user?: { name: string }; role?: string } | null;
};
type AdminUser = { id: string; name: string; email: string; role: "USER" | "INSTITUTION" | "ADMIN" | "SUPER_ADMIN"; createdAt: string };
type AdminData = {
  adminRole: "ADMIN" | "SUPER_ADMIN";
  adminId: string;
  stats: {
    userCount: number; adminCount: number; superAdminCount: number; institutionCount: number;
    reportCount: number; openReportCount: number; reportsByStatus: Array<{ status: string; _count: { _all: number } }>;
    reportsByReason: Array<{ reason: string; _count: { _all: number } }>;
    topPost: { id: string; plantName: string; likes: number; user: { name: string } } | null;
    topAccount: { name: string; _count: { followers: number } } | null;
  };
  users: AdminUser[];
  reports: Report[];
};

const STATUS_LABEL: Record<Report["status"], string> = { OPEN: "À traiter", REVIEWED: "Examiné", DISMISSED: "Classé" };
const REASON_LABEL: Record<string, string> = { SPAM: "Spam", HARASSMENT: "Harcèlement", INAPPROPRIATE: "Contenu inapproprié", MISINFORMATION: "Information erronée", OTHER: "Autre" };
const ROLE_LABEL: Record<AdminUser["role"], string> = { USER: "Membre", INSTITUTION: "Institution", ADMIN: "Admin", SUPER_ADMIN: "Super-admin" };

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [view, setView] = useState<"overview" | "reports" | "accounts">("overview");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const response = await apiFetch("/api/admin", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Chargement impossible.");
      setData(payload as AdminData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function updateReport(reportId: string, status: Report["status"]) {
    setBusyId(reportId);
    try {
      const response = await apiFetch(`/api/admin/reports/${reportId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Mise à jour impossible.");
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Mise à jour impossible.");
    } finally {
      setBusyId("");
    }
  }

  async function removeTarget(type: "POST" | "USER", id: string, label: string) {
    if (!window.confirm(`Supprimer définitivement ${label} ?`)) return;
    setBusyId(id);
    try {
      const endpoint = type === "POST" ? `/api/community/${id}` : `/api/admin/users/${id}`;
      const response = await apiFetch(endpoint, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Suppression impossible.");
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Suppression impossible.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <main className="mx-auto w-full max-w-7xl px-5 py-12" aria-live="polite">Chargement du tableau de bord…</main>;
  if (!data) return <main className="mx-auto w-full max-w-7xl px-5 py-12"><p role="alert" className="text-terracotta">{error || "Données indisponibles."}</p></main>;

  const { stats } = data;
  const reportStatuses = ["OPEN", "REVIEWED", "DISMISSED"] as const;
  const countForStatus = (status: string) => stats.reportsByStatus.find((item) => item.status === status)?._count._all ?? 0;
  const metrics = [
    { label: "Membres", value: stats.userCount, Icon: Users },
    { label: "Administrateurs", value: stats.adminCount, Icon: Shield },
    { label: "Super-admins", value: stats.superAdminCount, Icon: BadgeCheck },
    { label: "À traiter", value: stats.openReportCount, Icon: Flag },
  ];

  return <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 md:py-12">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">TERRA · Modération</p><h1 className="mt-2 font-serif text-3xl md:text-4xl">Administration</h1><p className="mt-2 text-sm text-foreground/65">Vue d’ensemble de la communauté et des signalements.</p></div>
      <button type="button" onClick={() => void load()} aria-label="Actualiser" title="Actualiser" className="inline-flex h-10 w-10 items-center justify-center border border-border bg-card-bg hover:bg-paper"><RefreshCw size={17} /></button>
    </header>
    <nav aria-label="Sections administration" className="mb-7 flex gap-5 overflow-x-auto border-b border-border">
      {([["overview", "Synthèse"], ["reports", `Signalements · ${stats.openReportCount}`], ["accounts", "Comptes"]] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setView(key)} className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm ${view === key ? "border-primary font-semibold text-foreground" : "border-transparent text-foreground/60 hover:text-foreground"}`}>{label}</button>)}
    </nav>
    {error && <p role="alert" className="mb-5 border-l-2 border-terracotta bg-card-bg px-4 py-3 text-sm text-terracotta">{error}</p>}

    {view === "overview" && <>
      <section aria-label="Statistiques principales" className="grid grid-cols-2 border-y border-border md:grid-cols-4">
        {metrics.map(({ label, value, Icon }) => <div key={label} className="border-b border-r border-border px-4 py-5 last:border-r-0 md:border-b-0"><Icon size={18} className="mb-3 text-primary-dark" /><p className="text-2xl font-semibold tabular-nums">{value.toLocaleString("fr-FR")}</p><p className="mt-1 text-xs text-foreground/60">{label}</p></div>)}
      </section>
      <section className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div><div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl">Signalements</h2><span className="text-sm text-foreground/60">{stats.reportCount} au total</span></div>
          <div className="grid grid-cols-3 border-y border-border">{reportStatuses.map((status) => <div key={status} className="border-r border-border px-3 py-4 last:border-r-0"><strong className="block text-xl tabular-nums">{countForStatus(status)}</strong><span className="text-xs text-foreground/60">{STATUS_LABEL[status]}</span></div>)}</div>
          <div className="mt-4 space-y-2">{stats.reportsByReason.map((item) => <div key={item.reason} className="flex items-center justify-between border-b border-border/70 py-2 text-sm"><span>{REASON_LABEL[item.reason] || item.reason}</span><strong className="tabular-nums">{item._count._all}</strong></div>)}{stats.reportCount === 0 && <p className="py-4 text-sm text-foreground/60">Aucun signalement reçu.</p>}</div>
        </div>
        <div className="space-y-7">
          <section><h2 className="mb-3 font-serif text-2xl">Publication appréciée</h2>{stats.topPost ? <div className="border-l-2 border-primary bg-card-bg px-4 py-3"><p className="font-semibold">{stats.topPost.plantName}</p><p className="mt-1 text-sm text-foreground/60">Par {stats.topPost.user.name}</p><p className="mt-3 inline-flex items-center gap-2 text-sm"><Heart size={15} className="text-terracotta" />{stats.topPost.likes.toLocaleString("fr-FR")} appréciations</p></div> : <p className="text-sm text-foreground/60">Aucune publication.</p>}</section>
          <section><h2 className="mb-3 font-serif text-2xl">Compte le plus suivi</h2>{stats.topAccount ? <div className="border-l-2 border-accent bg-card-bg px-4 py-3"><p className="font-semibold">{stats.topAccount.name}</p><p className="mt-2 inline-flex items-center gap-2 text-sm text-foreground/65"><Users size={15} />{stats.topAccount._count.followers.toLocaleString("fr-FR")} abonnés</p></div> : <p className="text-sm text-foreground/60">Aucun compte.</p>}</section>
          <p className="text-xs text-foreground/55">{stats.institutionCount} compte(s) institutionnel(s) · {stats.adminCount + stats.superAdminCount} compte(s) d’administration</p>
        </div>
      </section>
    </>}

    {view === "reports" && <section><div className="mb-4 flex items-baseline justify-between gap-3"><h2 className="font-serif text-2xl">File de modération</h2><span className="text-sm text-foreground/60">{data.reports.length} récents</span></div>
      {data.reports.length === 0 ? <p className="border-y border-border py-8 text-sm text-foreground/60">Aucun signalement à examiner.</p> : <div className="divide-y divide-border border-y border-border">{data.reports.map((report) => <article key={report.id} className="grid gap-4 py-5 lg:grid-cols-[1fr_auto]">
        <div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold uppercase text-primary-dark">{report.targetType === "POST" ? "Publication" : "Compte"}</span><span className="text-xs text-foreground/45">·</span><span className="text-xs">{new Date(report.createdAt).toLocaleString("fr-FR")}</span><span className={`ml-1 border px-2 py-1 text-xs ${report.status === "OPEN" ? "border-terracotta/50 text-terracotta" : "border-border text-foreground/60"}`}>{STATUS_LABEL[report.status]}</span></div>
        <p className="mt-2 font-medium">{report.target?.plantName || report.target?.name || "Cible supprimée"}</p><p className="mt-1 text-sm text-foreground/65">{REASON_LABEL[report.reason] || report.reason}{report.target?.user?.name ? ` · publié par ${report.target.user.name}` : ""}</p>{report.details && <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm">{report.details}</p>}<p className="mt-2 text-xs text-foreground/50">Signalé par {report.reporter.name} · {report.reporter.email}</p></div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end"><select aria-label="Statut du signalement" value={report.status} disabled={busyId === report.id} onChange={(event) => void updateReport(report.id, event.target.value as Report["status"])} className="border border-border bg-card-bg px-2 py-2 text-xs">{reportStatuses.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</select>{report.target && <button type="button" disabled={busyId === report.targetId || (report.targetType === "USER" && report.target.role !== "USER" && report.target.role !== "INSTITUTION" && data.adminRole !== "SUPER_ADMIN")} onClick={() => void removeTarget(report.targetType, report.targetId, report.targetType === "POST" ? "cette publication" : "ce compte")} title="Supprimer la cible" aria-label="Supprimer la cible" className="inline-flex h-9 w-9 items-center justify-center border border-terracotta/30 text-terracotta disabled:opacity-40"><Trash2 size={15} /></button>}</div>
      </article>)}</div>}
    </section>}

    {view === "accounts" && <section><div className="mb-4 flex items-baseline justify-between gap-3"><h2 className="font-serif text-2xl">Comptes récents</h2><span className="text-sm text-foreground/60">{stats.userCount + stats.adminCount + stats.superAdminCount + stats.institutionCount} membres</span></div>
      <div className="overflow-x-auto border-y border-border"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase text-foreground/55"><th className="py-3 pr-4 font-medium">Compte</th><th className="py-3 pr-4 font-medium">Rôle</th><th className="py-3 pr-4 font-medium">Inscription</th><th className="py-3 text-right font-medium">Action</th></tr></thead><tbody>{data.users.map((user) => <tr key={user.id} className="border-b border-border/70 last:border-0"><td className="py-3 pr-4"><strong className="block">{user.name}</strong><span className="text-xs text-foreground/55">{user.email}</span></td><td className="py-3 pr-4">{ROLE_LABEL[user.role]}</td><td className="py-3 pr-4 text-foreground/65">{new Date(user.createdAt).toLocaleDateString("fr-FR")}</td><td className="py-3 text-right"><button type="button" disabled={user.id === data.adminId || busyId === user.id || (user.role !== "USER" && user.role !== "INSTITUTION" && data.adminRole !== "SUPER_ADMIN")} onClick={() => void removeTarget("USER", user.id, `le compte ${user.name}`)} title="Supprimer le compte" aria-label={`Supprimer le compte ${user.name}`} className="inline-flex h-9 w-9 items-center justify-center border border-terracotta/30 text-terracotta disabled:opacity-35"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>
    </section>}
    <p className="mt-8 text-xs text-foreground/45">Les comptes fictifs de démonstration sont exclus des statistiques et de la liste de gestion.</p>
  </main>;
}