import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { ORGANISM_GROUPS } from "@/types/nature";
import { publicCoordinates } from "@/server/observations/location";

const MAX_IMAGE_DATA_URL_LENGTH = 1_250_000;
const MAX_REQUEST_LENGTH = 1_450_000;
const LOCATION_VISIBILITIES = ["PUBLIC", "APPROXIMATE", "PRIVATE"] as const;

function safeImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > MAX_IMAGE_DATA_URL_LENGTH) return null;
  if (/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return value === "" ? "" : null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const group = searchParams.get("group");
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 20), 1), 50);
    const validGroup = group && ORGANISM_GROUPS.includes(group as (typeof ORGANISM_GROUPS)[number])
      ? (group as (typeof ORGANISM_GROUPS)[number])
      : undefined;
    const viewerId = await getSessionUserId();
    const posts = await prisma.communityPost.findMany({
      where: { removed: false, ...(region ? { region } : {}), ...(validGroup ? { organismGroup: validGroup } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, institution: true, avatarUrl: true, isDemo: true, followers: { where: { followerId: viewerId || "__anonymous__" }, select: { id: true } } } },
        postLikes: { where: { userId: viewerId || "__anonymous__" }, select: { id: true } },
      },
    });
    return NextResponse.json({
      count: posts.length,
      data: posts.map((post) => {
        const { imageUrl, thumbnailUrl, ...observation } = post;
        const { postLikes, user, ...publicPost } = observation;
        const { followers, ...publicUser } = user;
        return { ...publicPost, user: { ...publicUser, following: followers.length > 0 }, following: followers.length > 0, liked: postLikes.length > 0, imageUrl: thumbnailUrl || imageUrl, ...publicCoordinates(post, viewerId) };
      }),
    });
  } catch (error) {
    console.error("Erreur observations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorId = await getSessionUserId();
    if (!authorId) {
      return NextResponse.json({ error: "Connectez-vous pour publier une observation." }, { status: 401 });
    }
    const rawBody = await request.text();
    if (rawBody.length > MAX_REQUEST_LENGTH) {
      return NextResponse.json({ error: "La photo est trop lourde. Choisissez une image de moins de 850 Ko." }, { status: 413 });
    }
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    const plantName = typeof body.plantName === "string" ? body.plantName.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!plantName || !description) {
      return NextResponse.json({ error: "Ajoutez le nom de l’espèce et une description de l’observation." }, { status: 400 });
    }
    if (plantName.length > 120 || description.length > 2000) {
      return NextResponse.json({ error: "Le nom ou la description est trop long." }, { status: 400 });
    }
    const imageUrl = safeImageUrl(body.imageUrl);
    const thumbnailUrl = safeImageUrl(body.thumbnailUrl);
    if (!imageUrl || !thumbnailUrl) {
      return NextResponse.json({ error: "Une photo et sa miniature sont nécessaires à cette observation." }, { status: 400 });
    }
    const requestedGroup = body.organismGroup;
    const organismGroup = typeof requestedGroup === "string" && ORGANISM_GROUPS.includes(requestedGroup as (typeof ORGANISM_GROUPS)[number])
      ? (requestedGroup as (typeof ORGANISM_GROUPS)[number])
      : "OTHER";
    const scientificName = typeof body.scientificName === "string" ? body.scientificName.trim().slice(0, 180) : "";
    const region = typeof body.region === "string" ? body.region.trim().slice(0, 120) || "Afrique" : "Afrique";
    const observedAt = typeof body.observedAt === "string" && body.observedAt
      ? new Date(body.observedAt)
      : new Date();
    if (Number.isNaN(observedAt.getTime()) || observedAt.getTime() > Date.now() + 86_400_000) {
      return NextResponse.json({ error: "La date d’observation n’est pas valide." }, { status: 400 });
    }
    const latitude = typeof body.latitude === "number" && Math.abs(body.latitude) <= 90 ? body.latitude : null;
    const longitude = typeof body.longitude === "number" && Math.abs(body.longitude) <= 180 ? body.longitude : null;
    const requestedVisibility = body.locationVisibility;
    const locationVisibility = typeof requestedVisibility === "string" && LOCATION_VISIBILITIES.includes(requestedVisibility as (typeof LOCATION_VISIBILITIES)[number])
      ? (requestedVisibility as (typeof LOCATION_VISIBILITIES)[number])
      : "APPROXIMATE";

    const post = await prisma.communityPost.create({
      data: { userId: authorId, plantName, scientificName, imageUrl, thumbnailUrl, region, description, organismGroup, observedAt, latitude, longitude, locationVisibility },
    });
    return NextResponse.json({ observation: { ...post, ...publicCoordinates(post, authorId) } }, { status: 201 });
  } catch (error) {
    console.error("Erreur création observation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
