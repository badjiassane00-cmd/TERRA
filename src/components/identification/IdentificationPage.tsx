import { getSessionUser } from "@/lib/session";
import IdentificationWorkspace from "@/components/identification/IdentificationWorkspace";
import NatureAppHeader from "@/components/navigation/NatureAppHeader";
import BackLink from "@/components/navigation/BackLink";

export default async function IdentificationPage() {
  const user = await getSessionUser();
  const role = user?.role.toLowerCase() as "user" | "admin" | "institution" | undefined;
  return (
    <main className="nature-identifier-page">
      <NatureAppHeader user={user ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl } : null} />
      <IdentificationWorkspace userId={user?.id || null} userRole={role || null} />
      <footer className="nature-identifier-footer">
        <BackLink href="/" label="Accueil reconnaissance" />
        <span>SunuNature · Observer · Comprendre · Protéger</span>
      </footer>
    </main>
  );
}
