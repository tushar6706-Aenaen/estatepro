"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
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

type FavoriteItem = {
  id: string;
  title: string;
  city: string;
  price: number | string;
  imageUrl?: string | null;
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
  const [isFavorite, setIsFavorite] = useState(false);
  const { addProperty, isInComparison } = useComparison();
  const { showToast } = useToast();

  // Check if property is in favorites on mount
  useEffect(() => {
    const favorites = localStorage.getItem("favorites");
    if (!favorites) return;
    try {
      const favArray: FavoriteItem[] = JSON.parse(favorites);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFavorite(favArray.some((fav) => fav.id === id));
    } catch {
      // Ignore malformed localStorage data
    }
  }, [id]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    const favorites = localStorage.getItem("favorites");
    let favArray: FavoriteItem[] = [];

    if (favorites) {
      try {
        favArray = JSON.parse(favorites);
      } catch {
        favArray = [];
      }
    }
    
    if (isFavorite) {
      // Remove from favorites
      favArray = favArray.filter((fav) => fav.id !== id);
      localStorage.setItem("favorites", JSON.stringify(favArray));
      setIsFavorite(false);
      showToast("Removed from favorites", "info");
    } else {
      // Add to favorites
      favArray.push({ id, title, city, price, imageUrl });
      localStorage.setItem("favorites", JSON.stringify(favArray));
      setIsFavorite(true);
      showToast("Added to favorites", "success");
    }
  };

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
        className="h-full"
      >
        <div className="relative h-full">
          <Link href={`/properties/${id}`}>
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group h-full flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-gray-900 transition-all"
            >
              {/* Image Container with Skeleton */}
              <div className="relative h-56 bg-gray-200 overflow-hidden">
                {/* Skeleton Loader */}
                {!imageLoaded && <div className="absolute inset-0 skeleton" />}

                {/* Actual Image */}
                {imageUrl && (
                  <motion.div
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      onLoad={() => setImageLoaded(true)}
                      style={{ opacity: imageLoaded ? 1 : 0 }}
                      priority={index < 3}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20" />
                  </motion.div>
                )}

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex gap-2 z-20">
                  {isNew && (
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg"
                    >
                      ✨ NEW
                    </motion.div>
                  )}
                  <div className="bg-white/95 backdrop-blur-md text-gray-900 px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
                    {badge ?? "For Sale"}
                  </div>
                </div>

                {/* Action Buttons - Top Right */}
                <div className="absolute right-3 top-3 flex gap-2 z-20">
                  <motion.button
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggleFavorite}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-md shadow-lg transition ${
                      isFavorite
                        ? "bg-red-500 text-white"
                        : "bg-white/95 text-red-500 hover:bg-red-50"
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
                      <path d="M20.8 8.6a5 5 0 0 0-8-4 5 5 0 0 0-8 4c0 6 8 10.4 8 10.4s8-4.4 8-10.4z" />
                    </svg>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAddToComparison}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-md shadow-lg transition ${
                      inComparison
                        ? "bg-blue-600 text-white"
                        : "bg-white/95 text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </motion.button>
                </div>

                {/* Price Badge - Bottom */}
                <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between">
                  <div className="bg-white/95 backdrop-blur-md rounded-xl px-3 py-2 shadow-xl flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-600 font-medium">Price</span>
                      <span className="text-lg font-bold text-gray-900">₹{Number(price).toLocaleString('en-IN')}</span>
                    </div>
                    {priceChange && (
                      <div
                        className={`ml-2 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                          priceChange === "up" 
                            ? "bg-red-100 text-red-600" 
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {priceChange === "up" ? "↑" : "↓"} {priceChangePercent}%
                      </div>
                    )}
                  </div>

                  {/* Quick View Button */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    whileHover={{ opacity: 1, x: 0, scale: 1.05 }}
                    onClick={handleQuickView}
                    className="opacity-0 group-hover:opacity-100 transition-all px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-xl hover:bg-gray-800"
                  >
                    Quick View
                  </motion.button>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 flex flex-col p-5 bg-gradient-to-b from-white to-gray-50">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition">
                    {title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-gray-600 mb-4">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 21s-6-4.4-6-10a6 6 0 1 1 12 0c0 5.6-6 10-6 10z" />
                      <circle cx="12" cy="11" r="2" />
                    </svg>
                    <span className="text-sm font-medium">{city}</span>
                  </div>

                  {/* Property Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-200">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 mb-1">
                        <path d="M3 10h18" />
                        <path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
                        <path d="M5 20v-6h14v6" />
                      </svg>
                      <span className="text-sm font-bold text-gray-900">{bedrooms ?? "—"}</span>
                      <span className="text-xs text-gray-500">Beds</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-200">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 mb-1">
                        <path d="M9 6h6" />
                        <path d="M7 6h10l1 6H6l1-6z" />
                        <path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
                      </svg>
                      <span className="text-sm font-bold text-gray-900">{bathrooms ?? "—"}</span>
                      <span className="text-xs text-gray-500">Baths</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-200">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 mb-1">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <path d="M4 12h16" />
                        <path d="M12 4v16" />
                      </svg>
                      <span className="text-sm font-bold text-gray-900">{area_sqft ?? "—"}</span>
                      <span className="text-xs text-gray-500">Sqft</span>
                    </div>
                  </div>
                </div>

                {/* Property Type Badge */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {property_type}
                  </span>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:text-blue-700"
                  >
                    View Details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </motion.div>
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
