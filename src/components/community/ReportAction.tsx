"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { Flag, X } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

const REASONS = [
  ["SPAM", "Spam ou contenu trompeur"],
  ["HARASSMENT", "Harcèlement"],
  ["INAPPROPRIATE", "Contenu inapproprié"],
  ["MISINFORMATION", "Information naturaliste erronée"],
  ["OTHER", "Autre motif"],
] as const;

type ReportActionProps = Readonly<{
  targetType: "POST" | "USER";
  targetId: string;
  label?: string;
}>;

export default function ReportAction({ targetType, targetId, label = "Signaler" }: ReportActionProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number][0]>("OTHER");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, details }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Le signalement n’a pas pu être envoyé.");
      setOpen(false);
      setFeedback("Signalement transmis");
      window.setTimeout(() => setFeedback(""), 3500);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Le signalement n’a pas pu être envoyé.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button type="button" title={label} aria-label={label} onClick={() => { setOpen(true); setError(""); }} className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-terracotta">
      <Flag size={15} />{label}
    </button>
    {feedback && <output className="text-xs text-primary-dark">{feedback}</output>}
    <dialog ref={dialogRef} aria-labelledby="report-dialog-title" onCancel={(event) => { event.preventDefault(); setOpen(false); }} className="fixed inset-0 z-[100] m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-md border-0 bg-transparent p-0 backdrop:bg-foreground/45">
      <form onSubmit={submit} className="border border-border bg-card-bg p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Modération communautaire</p><h2 id="report-dialog-title" className="mt-1 font-serif text-xl">Signaler {targetType === "POST" ? "une publication" : "un compte"}</h2></div>
          <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="p-1 text-foreground/60 hover:text-foreground"><X size={18} /></button>
        </div>
        <label className="mb-3 block text-sm font-medium"><span className="block">Motif</span>
          <select value={reason} onChange={(event) => setReason(event.target.value as (typeof REASONS)[number][0])} className="herbarium-input mt-1 block">
            {REASONS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Détails <span className="font-normal text-foreground/55">(facultatif)</span>
          <textarea value={details} onChange={(event) => setDetails(event.target.value.slice(0, 1000))} rows={4} maxLength={1000} className="herbarium-input mt-1 block resize-y" placeholder="Ajoutez un contexte utile à l’équipe de modération." />
        </label>
        {error && <p role="alert" className="mt-3 text-sm text-terracotta">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="herbarium-button">Annuler</button>
          <button type="submit" disabled={busy} className="herbarium-button herbarium-button-primary disabled:opacity-60">{busy ? "Envoi…" : "Envoyer le signalement"}</button>
        </div>
      </form>
    </dialog>
  </>;
}