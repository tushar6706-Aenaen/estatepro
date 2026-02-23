"use client";

import { useState } from "react";
import { ListingsMap, type MapProperty } from "@/src/components/map";

type MapToggleViewProps = {
  properties: MapProperty[];
  gridView: React.ReactNode;
};

/**
 * Client component that provides a toggle between grid and map views.
 * The grid view (server-rendered) is passed as children,
 * the map view is rendered client-side when toggled.
 */
export function MapToggleView({ properties, gridView }: MapToggleViewProps) {
  const [view, setView] = useState<"grid" | "map">("grid");

  const mappableProperties = properties.filter(
    (p) => p.latitude && p.longitude,
  );

  return (
    <div>
      {/* View Toggle */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
              view === "grid"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            disabled={mappableProperties.length === 0}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
              view === "map"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Map{mappableProperties.length > 0 ? ` (${mappableProperties.length})` : ""}
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "grid" ? (
        gridView
      ) : (
        <ListingsMap
          properties={mappableProperties}
          className="h-125 md:h-150"
          onPropertyClick={(id) => {
            window.open(`/properties/${id}`, "_blank");
          }}
        />
      )}
    </div>
  );
}
