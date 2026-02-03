"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

type PropertyQuickViewProps = {
  isOpen: boolean;
  onClose: () => void;
  property: {
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
  };
};

export function PropertyQuickView({ isOpen, onClose, property }: PropertyQuickViewProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="overflow-y-auto max-h-[90vh]">
              {/* Image Section */}
              <div className="relative h-96 bg-gray-200">
                {property.imageUrl && (
                  <Image
                    src={property.imageUrl}
                    alt={property.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 960px"
                    priority
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                
                {/* Badge */}
                <div className="absolute left-6 top-6 rounded-full bg-gray-900/90 backdrop-blur-sm px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white">
                  {property.badge ?? "For Sale"}
                </div>

                {/* Price */}
                <div className="absolute bottom-6 left-6 rounded-xl bg-white/95 backdrop-blur-sm px-5 py-3 shadow-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{Number(property.price).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8 space-y-6">
                {/* Title and Location */}
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{property.title}</h2>
                  <div className="flex items-center gap-2 mt-2 text-gray-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 21s-6-4.4-6-10a6 6 0 1 1 12 0c0 5.6-6 10-6 10z" />
                      <circle cx="12" cy="11" r="2" />
                    </svg>
                    <span>{property.city}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{property.bedrooms ?? "—"}</div>
                    <div className="text-sm text-gray-600 mt-1">Bedrooms</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{property.bathrooms ?? "—"}</div>
                    <div className="text-sm text-gray-600 mt-1">Bathrooms</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {property.area_sqft ?? "—"}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Sq Ft</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-gray-900 capitalize">{property.property_type}</div>
                    <div className="text-sm text-gray-600 mt-1">Type</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Link
                    href={`/properties/${property.id}`}
                    className="flex-1 bg-gray-900 text-white text-center py-4 md:py-4 rounded-xl font-semibold hover:bg-gray-800 transition min-h-[56px] flex items-center justify-center text-base md:text-sm"
                  >
                    View Full Details
                  </Link>
                  <button className="px-6 py-4 md:py-4 border-2 border-gray-300 rounded-xl font-semibold hover:border-gray-400 transition min-h-[56px] min-w-[56px]">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="inline md:w-5 md:h-5"
                    >
                      <path d="M20.8 8.6a5 5 0 0 0-8-4 5 5 0 0 0-8 4c0 6 8 10.4 8 10.4s8-4.4 8-10.4z" />
                    </svg>
                  </button>
                  <button className="px-6 py-4 md:py-4 border-2 border-gray-300 rounded-xl font-semibold hover:border-gray-400 transition min-h-[56px] min-w-[56px]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-5 md:h-5">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
