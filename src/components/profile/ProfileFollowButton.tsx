"use client";

import { useState } from "react";

export default function ProfileFollowButton({ userId, initialFollowing, signedIn }: { userId: string; initialFollowing: boolean; signedIn: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    if (!signedIn) { window.location.assign("/connexion"); return; }
    setBusy(true);
    try {
      const response = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
      const result = await response.json();
      if (response.ok) setFollowing(result.following);
    } finally { setBusy(false); }
  }
  return <button className={`nature-profile-follow ${following ? "following" : ""}`} onClick={() => void toggle()} disabled={busy}>{following ? "Abonné·e" : "Suivre"}</button>;
}
