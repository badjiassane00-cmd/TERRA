import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaf } from "lucide-react";
import BackLink from "@/components/navigation/BackLink";
import NotificationsDashboard from "@/components/notifications/NotificationsDashboard";
import { getSessionUserId } from "@/lib/session";

export default async function NotificationsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion?next=/notifications");
  return <main className="nature-notifications-page"><header className="nature-notifications-header"><Link href="/"><Leaf size={21} /> TERRA</Link><BackLink href="/" label="Retour à l’accueil" /></header><NotificationsDashboard /></main>;
}
