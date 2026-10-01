"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LoaderCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export default function ProfileLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch("/api/auth", { method: "DELETE" });
      if (!response.ok) throw new Error("La déconnexion a échoué. Réessayez.");
      router.replace("/connexion");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La déconnexion a échoué. Réessayez.");
      setBusy(false);
    }
  }

  return (
    <span className="nature-share-profile-wrap">
      <button type="button" className="nature-share-profile nature-profile-logout" onClick={() => void logout()} disabled={busy}>
        {busy ? <LoaderCircle size={15} className="nature-spin" /> : <LogOut size={15} />}
        {busy ? "Déconnexion…" : "Déconnexion"}
      </button>
      {error && <small role="alert">{error}</small>}
    </span>
  );
}
