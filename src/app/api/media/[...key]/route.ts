import { NextResponse } from "next/server";
import { readStoredImage } from "@/server/media/object-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.join("/");
  if (!/^(?:avatars|observations)\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/.test(key)) return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
  try {
    const image = await readStoredImage(key);
    if (!image) return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
    return new Response(image.body, { headers: { "Content-Type": image.contentType, ...(image.contentLength ? { "Content-Length": String(image.contentLength) } : {}), "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
    console.error("Erreur de lecture du média:", error);
    return NextResponse.json({ error: "Média indisponible." }, { status: 503 });
  }
}
