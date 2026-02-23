"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with bundlers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type PropertyMapProps = {
  latitude: number;
  longitude: number;
  title?: string;
  city?: string;
  zoom?: number;
  className?: string;
};

/**
 * Single-property map for the property detail page.
 * Renders an interactive Leaflet map centered on the property location.
 */
export function PropertyMap({
  latitude,
  longitude,
  title,
  city,
  zoom = 14,
  className = "",
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([latitude, longitude], { icon: defaultIcon }).addTo(map);

    if (title || city) {
      marker.bindPopup(
        `<div style="font-family: system-ui, sans-serif; font-size: 13px;">
          ${title ? `<strong>${title}</strong>` : ""}
          ${city ? `<br/><span style="color: #6b7280;">${city}</span>` : ""}
        </div>`,
      );
    }

    mapInstanceRef.current = map;

    // Fix map rendering in containers that start hidden
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, title, city, zoom]);

  return (
    <div
      ref={mapRef}
      className={`h-full w-full rounded-2xl md:rounded-3xl ${className}`}
      style={{ minHeight: "200px" }}
    />
  );
}
