import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import { AuthError, authService } from "@/server/auth/auth.service";

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
  response.cookies.set(SESSION_COOKIE_NAME, signSessionToken(user.id, user.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    ...(remember ? { maxAge: SESSION_MAX_AGE_SECONDS } : {}),
    path: "/",
  });
  return response;
}
async function POSTImpl(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const action = body.action === "login" ? "login" : "signup";

    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !password) {
      return NextResponse.json({ error: "Adresse email et mot de passe valides requis" }, { status: 400 });
    }

    const user = action === "login"
      ? await authService.authenticate(email, password)
      : await authService.register({ email, password, name: typeof body.name === "string" ? body.name : "" });

    return authenticatedResponse(user, action === "signup" || body.remember !== false);
  } catch (error) {
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
  response.cookies.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return response;
}


export const DELETE = withApiErrors(DELETEImpl);
