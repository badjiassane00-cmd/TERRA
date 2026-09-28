"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface ObservationPin {
  id: string;
  name: string;
  group: string;
  region: string;
  date: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
}

const marker = L.divIcon({
  className: "observation-marker-shell",
  html: '<span class="observation-marker">✳</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export default function ObservationMap({ observations }: { observations: ObservationPin[] }) {
  const center: [number, number] = observations.length
    ? [observations[0].latitude, observations[0].longitude]
    : [5, 15];
  return (
    <div className="observation-map-frame">
      <MapContainer center={center} zoom={observations.length ? 5 : 3} scrollWheelZoom className="observation-map">
        <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {observations.map((observation) => (
          <Marker key={observation.id} position={[observation.latitude, observation.longitude]} icon={marker}>
            <Popup>
              <a className="observation-map-popup" href={`/observations/${observation.id}`}>
                {observation.imageUrl && <img src={observation.imageUrl} alt="" />}
                <strong>{observation.name}</strong>
                <span>{observation.group} · {observation.region}</span>
                <small>{observation.date}</small>
                <em>Ouvrir la fiche →</em>
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
