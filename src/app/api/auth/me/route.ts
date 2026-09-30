import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/session";

// Permet au client de vérifier/restaurer la session au chargement de
// la page, à partir du cookie httpOnly plutôt que de faire confiance
// aveuglément à ce qui est stocké dans localStorage (qui ne prouve
// rien : n'importe qui peut y écrire depuis la console du navigateur).
async function GETImpl() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      ...user,
      role: user.role.toLowerCase(),
    },
  });
}


export const GET = withApiErrors(GETImpl);
