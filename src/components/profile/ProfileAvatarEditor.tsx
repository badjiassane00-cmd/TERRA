"use client";

import { useRef, useState } from "react";
import NextImage from "next/image";
import { Camera, Check, LoaderCircle, X } from "lucide-react";

type Props = { initialAvatarUrl: string | null; displayName: string };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Cette image ne peut pas être ouverte.")); };
    image.src = url;
  });
}

function toJpeg(image: HTMLImageElement, size: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return reject(new Error("La préparation de la photo a échoué."));
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("La compression de la photo a échoué.")), "image/jpeg", quality);
  });
}

function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture de la photo impossible."));
    reader.onerror = () => reject(new Error("Lecture de la photo impossible."));
    reader.readAsDataURL(blob);
  });
}

export default function ProfileAvatarEditor({ initialAvatarUrl, displayName }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function saveFile(file?: File) {
    if (!file) return;
    setError("");
    setSaved(false);
    if (!file.type.startsWith("image/")) { setError("Choisissez un fichier image."); return; }
    setBusy(true);
    try {
      const image = await loadImage(file);
      let blob = await toJpeg(image, 320, 0.82);
      if (blob.size > 320_000) blob = await toJpeg(image, 256, 0.68);
      if (blob.size > 320_000) throw new Error("Cette photo est trop lourde. Choisissez-en une autre.");
      const dataUrl = await readDataUrl(blob);
      const response = await fetch("/api/account/profile/avatar", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: dataUrl }) });
      const result = await response.json() as { avatarUrl?: string; error?: string };
      if (!response.ok || !result.avatarUrl) throw new Error(result.error || "Impossible d’enregistrer cette photo.");
      setAvatarUrl(result.avatarUrl);
      window.dispatchEvent(new CustomEvent("sununature:avatar-updated", { detail: { avatarUrl: result.avatarUrl } }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2600);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function removeAvatar() {
    setBusy(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/account/profile/avatar", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: null }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Impossible de retirer cette photo.");
      setAvatarUrl(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2600);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue.");
    } finally { setBusy(false); }
  }

  return <div className="nature-profile-avatar-editor">
    <div className="nature-profile-large-avatar">{avatarUrl ? <NextImage src={avatarUrl} alt={`Photo de profil de ${displayName}`} width={320} height={320} unoptimized /> : <span aria-label={`Initiale de ${displayName}`}>{displayName.slice(0, 1).toLocaleUpperCase("fr")}</span>}</div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void saveFile(event.currentTarget.files?.[0])} hidden />
    <button className="nature-profile-avatar-edit" type="button" onClick={() => input.current?.click()} disabled={busy} aria-label="Choisir une photo de profil">{busy ? <LoaderCircle size={15} className="nature-spin" /> : saved ? <Check size={15} /> : <Camera size={15} />}<span>{busy ? "Enregistrement…" : saved ? "Enregistré" : "Modifier la photo"}</span></button>
    {avatarUrl && <button className="nature-profile-avatar-remove" type="button" onClick={() => void removeAvatar()} disabled={busy} aria-label="Retirer la photo de profil"><X size={13} /></button>}
    <p className="nature-profile-avatar-message" role={error ? "alert" : "status"}>{error || (saved ? "Photo de profil mise à jour." : "JPG, PNG ou WebP · photo carrée automatique")}</p>
  </div>;
}
