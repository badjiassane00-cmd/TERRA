/** Great-circle distance between two WGS84 coordinates, in kilometers. */
export function distanceKm(aLatitude: number, aLongitude: number, bLatitude: number, bLongitude: number): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(bLatitude - aLatitude);
  const longitudeDelta = radians(bLongitude - aLongitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(aLatitude)) * Math.cos(radians(bLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
