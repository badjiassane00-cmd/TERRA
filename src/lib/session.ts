import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "botanique_session";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET manquant. Définissez-le dans .env (ex: openssl rand -base64 32)."
    );
  }
  return secret;
}

export function signSessionToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, getJwtSecret(), { expiresIn: "7d" });
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours, aligné sur l'expiration du JWT

// Lit et vérifie le cookie de session (httpOnly, jamais accessible en
// JS côté client — c'est ce qui le rend fiable, contrairement à un
// userId simplement transmis par le client). Renvoie null si absent
// ou invalide, sans jamais lever d'exception vers l'appelant.
export async function getSessionUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = jwt.verify(token, getJwtSecret()) as { userId?: string };
    return payload.userId || null;
  } catch {
    return null;
  }
}

// Variante avec le profil complet (utile quand on a aussi besoin du
// rôle) — toujours vérifié en base, jamais déduit du token seul, pour
// refléter un éventuel changement de rôle sans attendre l'expiration.
export async function getSessionUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, institution: true, bio: true, avatarUrl: true, role: true },
  });
}
