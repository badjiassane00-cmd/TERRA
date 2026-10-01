import { getSessionUser } from "@/lib/session";
import IdentificationWorkspace from "@/components/identification/IdentificationWorkspace";
import BackLink from "@/components/navigation/BackLink";

export default async function IdentificationPage({ searchParams }: Readonly<{ searchParams: Promise<{ mode?: string | string[]; group?: string | string[]; region?: string | string[] }> }>) {
  const params = await searchParams;
  const requestedMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const requestedGroup = Array.isArray(params.group) ? params.group[0] : params.group;
  const requestedRegion = Array.isArray(params.region) ? params.region[0] : params.region;
  const initialMode = requestedMode === "life" || requestedMode === "disease" ? requestedMode : "identify";
  const initialLifeTarget = ["insects", "animals", "fish", "all"].includes(requestedGroup || "")
    ? requestedGroup as "insects" | "animals" | "fish" | "all"
    : "all";
  const user = await getSessionUser();
  const role = user?.role.toLowerCase() as "user" | "admin" | "institution" | undefined;
  return (
    <main className="nature-identifier-page">
      <IdentificationWorkspace userId={user?.id || null} userRole={role || null} initialMode={initialMode} initialLifeTarget={initialLifeTarget} initialRegion={requestedRegion?.slice(0, 80) || ""} />
      <footer className="nature-identifier-footer">
        <BackLink href="/" label="Accueil reconnaissance" />
        <span>TERRA · Observer · Comprendre · Protéger</span>
      </footer>
    </main>
  );
}
