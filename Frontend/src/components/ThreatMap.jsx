// src/components/ThreatMap.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import L from "leaflet";

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ThreatMap = () => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/threat-map`);
        const valid = data.filter(item => item?.ipGeo?.lat && item?.ipGeo?.lon);
        setLocations(valid);
      } catch (err) {
        console.error("Failed to fetch threat map data:", err.message);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="h-[500px] w-full rounded overflow-hidden">
      <MapContainer center={[20.5937, 78.9629]} zoom={4} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {locations.map((item, index) => (
          <Marker key={index} position={[item.ipGeo.lat, item.ipGeo.lon]}>
            <Popup>
              <div className="text-sm space-y-1">
                <div><strong>Wallet:</strong> {item.wallet}</div>
                <div><strong>Bank:</strong> {item.bank || "N/A"}</div>
                <div><strong>City:</strong> {item.ipGeo.city || "Unknown"}</div>
                <div><strong>Org:</strong> {item.ipGeo.org || "Unknown"}</div>
                <div><strong>Risk:</strong> <span className="font-bold text-red-600">{item.risk || "Unrated"}</span></div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ThreatMap;
