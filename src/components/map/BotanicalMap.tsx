"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Filter, Leaf, Calendar } from "lucide-react";
import "leaflet/dist/leaflet.css";

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  region: string;
  speciesCount: number;
  type: string;
  description: string;
  bloomingMonths?: string[];
  distance?: number | null;
}

interface BotanicalMapProps {
  region?: string;
  type?: string;
  userLocation?: { lat: number; lng: number } | null | undefined;
}

const regionColors: Record<string, string> = {
  "Afrique de l'Ouest": "#78b57c",
  "Afrique Centrale": "#40916c",
  "Afrique de l'Est": "#52b788",
  "Afrique du Nord": "#74c69d",
};

function MapController({ userLocation }: { userLocation: { lat: number; lng: number } | null | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 10);
    }
  }, [map, userLocation]);

  return null;
}

const months = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

const currentMonth = months[new Date().getMonth()];

export default function BotanicalMap({ region, type, userLocation }: BotanicalMapProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(type || "all");
  const [selectedSeason, setSelectedSeason] = useState<string>(currentMonth);
  const [detectedLocation, setDetectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const currentUserLocation = detectedLocation ?? userLocation;
  const [geoError, setGeoError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (region) params.set("region", region);
      if (filterType && filterType !== "all") params.set("type", filterType);
      if (selectedSeason && selectedSeason !== "all") params.set("season", selectedSeason);
      if (currentUserLocation) {
        params.set("lat", currentUserLocation.lat.toString());
        params.set("lng", currentUserLocation.lng.toString());
        params.set("radius", "500");
      }

      const response = await fetch(`/api/locations?${params.toString()}`);
      const data = await response.json();
      const enriched = (data.data || []).map((loc: Location) => ({
        ...loc,
        bloomingMonths: loc.bloomingMonths || [selectedSeason],
      }));
      setLocations(enriched);
    } catch (error) {
      console.error("Erreur lors du chargement des lieux:", error);
    } finally {
      setLoading(false);
    }
  }, [region, filterType, selectedSeason, currentUserLocation]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchLocations();
  }, [fetchLocations]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError("Géolocalisation non supportée");
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setDetectedLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        setGeoError(error.message);
      }
    );
  };

  const getMarkerIcon = (loc: Location) => {
    const color = regionColors[loc.region] || "#78b57c";
    return L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-foreground/60" />
          <span className="text-sm font-medium text-foreground">Type:</span>
        </div>
        {["all", "Jardin botanique", "Parc national", "Réserve", "Jardin universitaire"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`herbarium-label cursor-pointer ${
              filterType === t ? "bg-primary text-white border-primary" : ""
            }`}
          >
            {t === "all" ? "Tous" : t}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <Calendar className="w-4 h-4 text-foreground/60" />
          <span className="text-sm font-medium text-foreground">Saison:</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedSeason("all")}
            className={`herbarium-label cursor-pointer ${
              selectedSeason === "all" ? "bg-primary text-white border-primary" : ""
            }`}
          >
            Toutes
          </button>
          {months.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedSeason(month)}
              className={`herbarium-label cursor-pointer hidden md:inline-flex ${
                selectedSeason === month ? "bg-primary text-white border-primary" : ""
              }`}
            >
              {month.slice(0, 3)}
            </button>
          ))}
        </div>
        <button
          onClick={handleGeolocate}
          className="herbarium-button"
        >
          <MapPin className="w-4 h-4" />
          Me localiser
        </button>
        {geoError && (
          <span className="text-sm text-terracotta">{geoError}</span>
        )}
      </div>

      <div className="herbarium-card rounded-xl overflow-hidden">
        <MapContainer
          center={[7.5, 20]}
          zoom={2}
          style={{ height: "500px", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController userLocation={currentUserLocation} />
          {currentUserLocation && (
            <Marker
              position={[currentUserLocation.lat, currentUserLocation.lng]}
              icon={L.divIcon({
                className: "user-location",
                html: `
                  <div style="
                    width: 20px;
                    height: 20px;
                    background: #3b82f6;
                    border: 4px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
                    animation: pulse 2s infinite;
                  "></div>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            >
              <Popup>Votre position</Popup>
            </Marker>
          )}
          {locations.map((loc) => (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={getMarkerIcon(loc)}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-serif font-semibold text-gray-800 mb-1">{loc.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{loc.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Leaf className="w-3 h-3" />
                      {loc.speciesCount} espèces
                    </span>
                    <span>{loc.region}</span>
                  </div>
                  {loc.bloomingMonths && loc.bloomingMonths.length > 0 && (
                    <p className="text-xs text-primary mt-1">
                      En fleur: {loc.bloomingMonths.join(", ")}
                    </p>
                  )}
                  {loc.distance !== null && loc.distance !== undefined && (
                    <p className="text-xs text-blue-600 mt-1">
                      À {loc.distance.toFixed(1)} km
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <p className="text-sm text-foreground/60">Chargement des lieux botaniques...</p>
        </div>
      )}

      {!loading && locations.length === 0 && (
        <div className="herbarium-card rounded-xl p-12 text-center mt-6">
          <MapPin className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
          <p className="text-foreground/60 mb-1">Aucun lieu botanique trouvé pour ces critères.</p>
          <p className="text-sm text-foreground/50">Essayez d&apos;élargir votre recherche ou de changer de saison.</p>
        </div>
      )}

      {locations.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {locations.slice(0, 4).map((loc) => (
            <div
              key={loc.id}
              className="herbarium-card rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border border-border bg-paper"
                  style={{ color: regionColors[loc.region] || "#78b57c" }}
                >
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-medium text-foreground text-sm mb-1">
                    {loc.name}
                  </h4>
                  <p className="text-xs text-foreground/60 mb-2">{loc.type}</p>
                  <div className="flex items-center gap-2 text-xs text-foreground/50">
                    <MapPin className="w-3 h-3" />
                    <span>{loc.region}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
