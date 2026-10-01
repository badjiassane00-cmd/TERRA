"use client";

import { apiFetch } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ReportAction from "@/components/community/ReportAction";

export default function ProfileFollowButton({ userId, initialFollowing, signedIn }: { userId: string; initialFollowing: boolean; signedIn: boolean }) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (!signedIn) {
      router.push(`/connexion?next=${encodeURIComponent(`/profile/${userId}`)}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch(`/api/users/${userId}/follow`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Impossible de mettre à jour l’abonnement.");
      setFollowing(result.following);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Impossible de mettre à jour l’abonnement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={`nature-profile-follow ${following ? "following" : ""}`} onClick={() => void toggle()} disabled={busy}>
        {busy ? "Mise à jour…" : following ? "Abonné·e" : "Suivre"}
      </button>
      {signedIn && <ReportAction targetType="USER" targetId={userId} label="Signaler le compte" />}
      {error && <p className="nature-profile-follow-error" role="alert">{error}</p>}
    </>
  );
}
