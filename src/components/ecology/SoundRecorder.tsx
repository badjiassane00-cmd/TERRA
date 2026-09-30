"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Mic, Radio, Square, Upload } from "lucide-react";

type Candidate = { name?: string; scientificName?: string; commonName?: string; confidence?: number };

export default function SoundRecorder() {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); stream.current?.getTracks().forEach((track) => track.stop()); }, []);

  const identify = async (blob: Blob) => {
    setBusy(true); setMessage("Analyse de l’enregistrement…"); setResults([]);
    try {
      const form = new FormData(); form.set("audio", blob, "observation.webm");
      const response = await apiFetch("/api/sound-identification", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Identification sonore indisponible.");
      const candidates: Candidate[] = Array.isArray(result.species) ? result.species : Array.isArray(result.results) ? result.results : [];
      setResults(candidates.slice(0, 5).map((item) => {
        const label = item.commonName || item.name || item.scientificName || "Espèce proposée";
        return `${label}${item.scientificName && item.scientificName !== label ? ` · ${item.scientificName}` : ""}${typeof item.confidence === "number" ? ` · ${Math.round(item.confidence * 100)} %` : ""}`;
      }));
      setMessage(candidates.length ? "Pistes sonores à confirmer par la communauté." : "Aucune piste renvoyée par le moteur.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Analyse impossible."); }
    finally { setBusy(false); }
  };

  const start = async () => {
    setMessage(""); setResults([]);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setMessage("L’enregistrement audio n’est pas pris en charge par ce navigateur."); return; }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder.current = new MediaRecorder(stream.current); chunks.current = [];
      recorder.current.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      recorder.current.onstop = () => {
        stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null;
        void identify(new Blob(chunks.current, { type: recorder.current?.mimeType || "audio/webm" }));
      };
      recorder.current.start(); setRecording(true);
      timer.current = window.setTimeout(() => { if (recorder.current?.state === "recording") recorder.current.stop(); setRecording(false); timer.current = null; }, 15_000);
    } catch { setMessage("Autorisez l’accès au microphone pour enregistrer un son."); }
  };

  const stop = () => { if (timer.current !== null) window.clearTimeout(timer.current); timer.current = null; if (recorder.current?.state === "recording") recorder.current.stop(); setRecording(false); };

  return <article className="herbarium-card rounded-2xl p-5">
    <div className="mb-2 flex items-center gap-2"><Radio className="h-5 w-5 text-primary"/><h3 className="font-serif text-lg font-semibold">Écoute du vivant</h3></div>
    <p className="mb-4 text-xs text-foreground/60">Enregistrez jusqu’à 15 secondes de chants d’oiseaux, d’insectes ou de grenouilles.</p>
    <div className="flex flex-wrap gap-2">{!recording ? <button type="button" disabled={busy} onClick={() => void start()} className="herbarium-button herbarium-button-primary disabled:opacity-50"><Mic className="h-4 w-4"/>Enregistrer</button> : <button type="button" onClick={stop} className="herbarium-button"><Square className="h-4 w-4"/>Terminer</button>}
      <label className="herbarium-button cursor-pointer"><Upload className="h-4 w-4"/>Importer un son<input className="sr-only" type="file" accept="audio/*" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void identify(file); event.currentTarget.value = ""; }}/></label>
    </div>
    {(busy || message) && <p className="mt-3 flex items-center gap-2 text-xs text-foreground/70" aria-live="polite">{busy && <LoaderCircle className="h-4 w-4 animate-spin"/>}{message}</p>}
    {results.length > 0 && <ul className="mt-3 space-y-1">{results.map((result) => <li key={result} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary"/>{result}</li>)}</ul>}
    <p className="mt-3 text-[11px] text-foreground/50">TERRA ne conserve pas l’audio. Il est transmis au moteur configuré; consultez sa politique de conservation.</p>
  </article>;
}
