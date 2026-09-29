import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Leaf } from "lucide-react";
import NotificationsDashboard from "@/components/notifications/NotificationsDashboard";
import { getSessionUserId } from "@/lib/session";

export default async function NotificationsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion?next=/notifications");
  return <main className="nature-notifications-page"><header className="nature-notifications-header"><Link href="/"><Leaf size={21} /> SunuNature</Link><Link href="/"><ArrowLeft size={15} /> Retour à mes découvertes</Link></header><NotificationsDashboard /></main>;
}
