import Link from "next/link";
import { ArrowLeft, Bell, Camera, Leaf } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import IdentificationWorkspace from "@/components/identification/IdentificationWorkspace";
import NotificationBell from "@/components/notifications/NotificationBell";

export default async function IdentifierPage() {
  const user = await getSessionUser();
  const role = user?.role.toLowerCase() as "user" | "admin" | "institution" | undefined;
  return <main className="nature-identifier-page"><header className="nature-identifier-header"><Link href="/" className="nature-identifier-brand"><Leaf size={21} /> SunuNature</Link><nav><Link href="/observations"><Camera size={16} /> Fil des observations</Link>{user && <NotificationBell />}<Link href={user ? "/notifications" : "/connexion"} className="nature-identifier-alert-link"><Bell size={16} /> Alertes</Link></nav></header><IdentificationWorkspace userId={user?.id || null} userRole={role || null} /><footer className="nature-identifier-footer"><Link href="/"><ArrowLeft size={15} /> Retour aux publications de la communauté</Link><span>SunuNature · Observer · Comprendre · Protéger</span></footer></main>;
}
