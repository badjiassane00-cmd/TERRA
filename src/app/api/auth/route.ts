import { ApiError, withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import { AuthError, authService } from "@/server/auth/auth.service";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { readLimitedJson } from "@/server/http/read-limited-form-data";

function authenticatedResponse(user: Awaited<ReturnType<typeof authService.authenticate>>, remember = true) {
  const safeUser = {
    id: user.id,
    name: user.name,
    institution: user.institution,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
  const response = NextResponse.json({
    user: { ...safeUser, role: safeUser.role.toLowerCase() },
  });
  response.cookies.set(SESSION_COOKIE_NAME, signSessionToken(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    ...(remember ? { maxAge: SESSION_MAX_AGE_SECONDS } : {}),
    path: "/",
  });
  return response;
}
async function POSTImpl(request: Request) {
  const limited = await enforceRateLimit(request, "auth", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const body = await readLimitedJson<Record<string, unknown>>(request, 16_384);
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : email || phoneNumber;
    const password = typeof body.password === "string" ? body.password : "";
    const action = body.action === "login" ? "login" : "signup";

    if (!identifier || !password) {
      return NextResponse.json({ error: "Adresse e-mail ou numéro et mot de passe requis." }, { status: 400 });
    }

    const user = action === "login"
      ? await authService.authenticate(identifier, password)
      : await authService.register({ email, phoneNumber, password, name: typeof body.name === "string" ? body.name : "" });

    return authenticatedResponse(user, action === "signup" || body.remember !== false);
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erreur auth:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'authentification" }, { status: 500 });
  }
}



export const POST = withApiErrors(POSTImpl);

async function DELETEImpl() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}


export const DELETE = withApiErrors(DELETEImpl);
