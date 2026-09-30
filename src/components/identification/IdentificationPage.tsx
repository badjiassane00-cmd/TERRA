import { getSessionUser } from "@/lib/session";
import IdentificationWorkspace from "@/components/identification/IdentificationWorkspace";
import BackLink from "@/components/navigation/BackLink";

export default async function IdentificationPage() {
  const user = await getSessionUser();
  const role = user?.role.toLowerCase() as "user" | "admin" | "institution" | undefined;
  return (
    <main className="nature-identifier-page">
      <IdentificationWorkspace userId={user?.id || null} userRole={role || null} />
      <footer className="nature-identifier-footer">
        <BackLink href="/" label="Accueil reconnaissance" />
        <span>TERRA · Observer · Comprendre · Protéger</span>
      </footer>
    </main>
  );
}
