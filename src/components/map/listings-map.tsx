"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const activeIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
  className: "active-marker",
});

export type MapProperty = {
  id: string;
  title: string;
  city: string;
  price: number | string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
};

type ListingsMapProps = {
  properties: MapProperty[];
  className?: string;
  onPropertyClick?: (id: string) => void;
};

/**
 * Multi-marker map for the listings/home page.
 * Shows all properties with coordinates on an interactive map.
 */
export function ListingsMap({
  properties,
  className = "",
  onPropertyClick,
}: ListingsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || properties.length === 0) return;

    // Clean up previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
    }

    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    properties.forEach((property) => {
      const latlng = L.latLng(property.latitude, property.longitude);
      bounds.extend(latlng);

      const priceFormatted =
        typeof property.price === "number"
          ? `$${property.price.toLocaleString()}`
          : `$${property.price}`;

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 180px; max-width: 240px;">
          ${
            property.imageUrl
              ? `<img src="${property.imageUrl}" alt="${property.title}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />`
              : ""
          }
          <strong style="font-size: 13px; display: block; line-height: 1.3;">${property.title}</strong>
          <span style="color: #6b7280; font-size: 12px;">${property.city}</span>
          <div style="font-weight: 600; font-size: 14px; margin-top: 4px; color: #111827;">${priceFormatted}</div>
          <a href="/properties/${property.id}" 
             style="display: inline-block; margin-top: 8px; padding: 6px 14px; background: #111827; color: white; border-radius: 9999px; font-size: 11px; font-weight: 600; text-decoration: none; text-align: center;">
            View Details
          </a>
        </div>
      `;

      const marker = L.marker(latlng, { icon: defaultIcon })
        .addTo(map)
        .bindPopup(popupContent);

      marker.on("click", () => {
        setActiveId(property.id);
        onPropertyClick?.(property.id);
      });

      markersRef.current.set(property.id, marker);
    });

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  // Update marker icon when active property changes
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.setIcon(id === activeId ? activeIcon : defaultIcon);
    });
  }, [activeId]);

  if (properties.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 ${className}`} style={{ minHeight: "300px" }}>
        <p className="text-sm text-gray-500">No properties with location data available.</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`w-full rounded-2xl md:rounded-3xl border border-gray-200 ${className}`}
      style={{ minHeight: "400px" }}
    />
  );
}
