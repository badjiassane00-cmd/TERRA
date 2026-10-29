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
  if (Buffer.byteLength(secret, "utf8") < 32 || /^(change-me|secret|password)/i.test(secret)) {
    throw new Error("JWT_SECRET doit être un secret aléatoire d’au moins 32 octets.");
  }
  return secret;
}

export function signSessionToken(userId: string, _legacyEmail?: string): string {
  void _legacyEmail; // Accept the legacy argument during rollout, but never store email in the token.
  return jwt.sign({ userId }, getJwtSecret(), { algorithm: "HS256", expiresIn: "7d" });
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

    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as { userId?: unknown };
    return typeof payload.userId === "string" && payload.userId.length > 0 ? payload.userId : null;
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
