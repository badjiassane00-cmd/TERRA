import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ObservationDetail, { type ObservationDetailRecord } from "@/components/observations/ObservationDetail";
import ExternalObservationDetail from "@/components/observations/ExternalObservationDetail";
import { inaturalistService } from "@/server/inaturalist/inaturalist.service";
import { getSessionUserId } from "@/lib/session";
import { publicCoordinates } from "@/server/observations/location";
import { observationRepository } from "@/server/observations/observation.repository";

export const metadata: Metadata = { title: "Fiche d’observation — TERRA" };

export default async function ObservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewerId = await getSessionUserId();
  const observation = await observationRepository.findById(id, viewerId);
  if (observation && !viewerId) redirect(`/connexion?next=${encodeURIComponent(`/observations/${id}`)}`);
  let externalObservation = null;
  if (!observation && /^\d+$/.test(id)) {
    try {
      externalObservation = await inaturalistService.findById(id);
    } catch (error) {
      console.error("Erreur fiche iNaturalist:", error);
    }
  }
  if (!observation && externalObservation) return <ExternalObservationDetail observation={externalObservation} />;
  if (!observation) notFound();
  const location = publicCoordinates(observation, viewerId);
  const detail: ObservationDetailRecord = {
    ...observation,
    liked: observation.postLikes.length > 0,
    ...location,
    createdAt: observation.createdAt.toISOString(),
    sourceUrl: observation.sourceUrl,
    sourceObserver: observation.sourceObserver,
    photoAttribution: observation.photoAttribution,
    photoLicense: observation.photoLicense,
    isDemo: observation.isDemo,
    observedAt: observation.observedAt?.toISOString() ?? null,
    commentsList: observation.commentsList.map((comment) => ({ ...comment, createdAt: comment.createdAt.toISOString() })),
    identifications: observation.identifications.map((identification) => ({ ...identification, createdAt: identification.createdAt.toISOString() })),
  };
  return <ObservationDetail observation={detail} currentUserId={viewerId} />;
}
