import type { ObservationLocationVisibility } from "@prisma/client";

export function publicCoordinates(
  location: { latitude: number | null; longitude: number | null; locationVisibility: ObservationLocationVisibility; userId: string },
  viewerId: string | null,
) {
  if (location.locationVisibility === "PRIVATE" && viewerId !== location.userId) {
    return { latitude: null, longitude: null, locationVisibility: "PRIVATE" as const };
  }
  if (location.locationVisibility === "APPROXIMATE" && viewerId !== location.userId) {
    return {
      latitude: location.latitude === null ? null : Math.round(location.latitude * 100) / 100,
      longitude: location.longitude === null ? null : Math.round(location.longitude * 100) / 100,
      locationVisibility: "APPROXIMATE" as const,
    };
  }
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    locationVisibility: location.locationVisibility,
  };
}
