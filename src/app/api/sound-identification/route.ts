import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";

// Compatible with a self-hosted acoustic classifier. Keep the provider URL and
// credentials server-side; no audio is saved by TERRA.
async function POSTImpl(request: Request) {
  if (!await getSessionUserId()) return NextResponse.json({ error: "Connectez-vous pour analyser un enregistrement." }, { status: 401 });
  const endpoint = process.env.SOUND_IDENTIFICATION_API_URL;
  if (!endpoint) {
    return NextResponse.json({ error: "Le moteur audio n’est pas encore configuré sur le serveur." }, { status: 503 });
  }
  const incoming = await request.formData();
  const audio = incoming.get("audio");
  if (!(audio instanceof File) || !audio.type.startsWith("audio/") || audio.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Fournissez un enregistrement audio de 15 Mo maximum." }, { status: 400 });
  }
  const outgoing = new FormData();
  outgoing.set("audio", audio, audio.name || "nature-audio.webm");
  const latitude = incoming.get("latitude");
  const longitude = incoming.get("longitude");
  if (typeof latitude === "string") outgoing.set("latitude", latitude);
  if (typeof longitude === "string") outgoing.set("longitude", longitude);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: process.env.SOUND_IDENTIFICATION_API_KEY ? { Authorization: `Bearer ${process.env.SOUND_IDENTIFICATION_API_KEY}` } : undefined,
      body: outgoing,
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) return NextResponse.json({ error: "Le moteur audio n’a pas pu analyser cet enregistrement." }, { status: 502 });
    const result: unknown = await response.json();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Le service d’identification sonore est injoignable." }, { status: 502 });
  }
}


export const POST = withApiErrors(POSTImpl);
