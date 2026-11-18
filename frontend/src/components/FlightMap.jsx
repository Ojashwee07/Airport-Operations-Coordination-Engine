import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { LEVEL_COLOR } from "../lib/format";

const AIRPORT_POINTS = [
  { code: "DEL", lat: 28.5562, lon: 77.1 },
  { code: "BOM", lat: 19.0896, lon: 72.8656 },
];

export default function FlightMap({ flights }) {
  return (
    <div className="h-80 overflow-hidden rounded-xl border border-white/5">
      <MapContainer center={[23, 72]} zoom={5} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {AIRPORT_POINTS.map((a) => (
          <CircleMarker key={a.code} center={[a.lat, a.lon]} radius={5} pathOptions={{ color: "#38bdf8", fillOpacity: 1 }}>
            <Tooltip permanent direction="top">{a.code}</Tooltip>
          </CircleMarker>
        ))}
        {flights.map((f) => (
          <CircleMarker
            key={f.id}
            center={[f.lat, f.lon]}
            radius={10}
            pathOptions={{ color: LEVEL_COLOR[f.prediction.level], fillColor: LEVEL_COLOR[f.prediction.level], fillOpacity: 0.55 }}
          >
            <Tooltip>
              {f.flight_number} · {f.origin} → {f.destination} · {f.prediction.level} ({Math.round(f.prediction.probability * 100)}%)
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
