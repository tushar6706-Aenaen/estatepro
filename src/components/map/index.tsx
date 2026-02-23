"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

// Dynamically import map components to avoid SSR issues with Leaflet
// Leaflet requires `window` which doesn't exist on the server

const PropertyMapDynamic = dynamic(
  () => import("./property-map").then((mod) => mod.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-50 w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 md:rounded-3xl">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading map...
        </div>
      </div>
    ),
  },
);

const ListingsMapDynamic = dynamic(
  () => import("./listings-map").then((mod) => mod.ListingsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-100 w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 md:rounded-3xl">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading map...
        </div>
      </div>
    ),
  },
);

export type PropertyMapProps = ComponentProps<typeof PropertyMapDynamic>;
export type ListingsMapProps = ComponentProps<typeof ListingsMapDynamic>;

export { PropertyMapDynamic as PropertyMap, ListingsMapDynamic as ListingsMap };
export type { MapProperty } from "./listings-map";
