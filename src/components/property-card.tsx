"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useComparison } from "./comparison-provider";
import { useToast } from "./ui/toast-provider";
import { PropertyQuickView } from "./property-quick-view";

type PropertyCardProps = {
  id: string;
  title: string;
  city: string;
  price: number | string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  badge?: string;
  imageUrl?: string | null;
  index: number;
  isNew?: boolean;
  priceChange?: "up" | "down" | null;
  priceChangePercent?: number;
};

export function PropertyCard({
  id,
  title,
  city,
  price,
  property_type,
  bedrooms,
  bathrooms,
  area_sqft,
  badge,
  imageUrl,
  index,
  isNew = false,
  priceChange = null,
  priceChangePercent = 0,
}: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const { addProperty, isInComparison } = useComparison();
  const { showToast } = useToast();

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowQuickView(true);
  };

  const handleAddToComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    addProperty({
      id,
      title,
      city,
      price,
      bedrooms,
      bathrooms,
      area_sqft,
      imageUrl,
    });
    showToast("Added to comparison", "success");
  };

  const inComparison = isInComparison(id);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
      >
        <div className="relative">
          <Link href={`/properties/${id}`}>
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-xl"
            >
              {/* Image Container with Skeleton */}
              <div className="relative h-64 bg-gray-200 overflow-hidden">
                {/* Gradient Overlay for Better Badge Visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 z-10" />

                {/* Skeleton Loader */}
                {!imageLoaded && <div className="absolute inset-0 skeleton" />}

                {/* Actual Image */}
                {imageUrl && (
                  <motion.div
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <img
                      src={imageUrl}
                      alt={title}
                      className="h-full w-full object-cover"
                      onLoad={() => setImageLoaded(true)}
                      style={{ opacity: imageLoaded ? 1 : 0 }}
                    />
                  </motion.div>
                )}

                {/* Badges Container */}
                <div className="absolute left-4 top-4 flex flex-col gap-2 z-20">
                  <div className="rounded-full bg-gray-900/90 backdrop-blur-sm px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                    {badge ?? "For Sale"}
                  </div>
                  {isNew && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="rounded-full bg-green-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
                    >
                      New
                    </motion.div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute right-4 top-4 flex flex-col gap-2 z-20">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.preventDefault();
                      showToast("Added to favorites", "success");
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 backdrop-blur transition hover:bg-white"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.8 8.6a5 5 0 0 0-8-4 5 5 0 0 0-8 4c0 6 8 10.4 8 10.4s8-4.4 8-10.4z" />
                    </svg>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAddToComparison}
                    className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition ${
                      inComparison
                        ? "bg-blue-500 text-white"
                        : "bg-white/90 text-gray-700 hover:bg-white"
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </motion.button>
                </div>

                {/* Price Badge with Change Indicator */}
                <div className="absolute bottom-4 left-4 z-20">
                  <div className="rounded-full bg-gray-900/90 backdrop-blur-sm px-3 py-1 text-sm font-semibold text-white flex items-center gap-2">
                    <span>${Number(price).toLocaleString()}</span>
                    {priceChange && (
                      <span
                        className={`flex items-center text-xs ${
                          priceChange === "up" ? "text-red-300" : "text-green-300"
                        }`}
                      >
                        {priceChange === "up" ? "↑" : "↓"} {priceChangePercent}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick View Button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  onClick={handleQuickView}
                  className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-900 hover:bg-white"
                >
                  Quick View
                </motion.button>
              </div>

              {/* Content */}
              <div className="space-y-3 px-5 py-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
                  <p className="text-sm text-gray-600">{city}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-70"
                    >
                      <path d="M3 10h18" />
                      <path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
                      <path d="M5 20v-6h14v6" />
                    </svg>
                    {bedrooms ?? "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-70"
                    >
                      <path d="M9 6h6" />
                      <path d="M7 6h10l1 6H6l1-6z" />
                      <path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
                    </svg>
                    {bathrooms ?? "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-70"
                    >
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <path d="M4 12h16" />
                      <path d="M12 4v16" />
                    </svg>
                    {area_sqft ? `${area_sqft} sqft` : "—"}
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Quick View Modal */}
      <PropertyQuickView
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        property={{
          id,
          title,
          city,
          price,
          property_type,
          bedrooms,
          bathrooms,
          area_sqft,
          badge,
          imageUrl,
        }}
      />
    </>
  );
}
