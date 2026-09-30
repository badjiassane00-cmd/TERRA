"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export default function ProfileShareButton({ displayName }: { displayName: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  async function share() {
    setError("");
    try {
      const shareData = { title: `Galerie de ${displayName} — TERRA`, url: window.location.href };
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(shareData.url); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") return;
      setError("Impossible de partager le lien sur cet appareil.");
    }
  }
  return <span className="nature-share-profile-wrap"><button className="nature-share-profile" onClick={() => void share()}><Share2 size={15} />{copied ? <><Check size={14} />Lien copié</> : <><Copy size={14} />Partager la galerie</>}</button>{error && <small role="alert">{error}</small>}</span>;
}
