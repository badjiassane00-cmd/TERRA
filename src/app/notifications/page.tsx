import { redirect } from "next/navigation";
import NotificationsDashboard from "@/components/notifications/NotificationsDashboard";
import { getSessionUserId } from "@/lib/session";

export default async function NotificationsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion?next=/notifications");
  return <main className="nature-notifications-page"><NotificationsDashboard /></main>;
}
