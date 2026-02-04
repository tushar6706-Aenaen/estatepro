"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type Property = {
  id: string;
  title: string;
  city: string;
  price: number | string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  imageUrl?: string | null;
};

type ComparisonContextType = {
  properties: Property[];
  addProperty: (property: Property) => void;
  removeProperty: (id: string) => void;
  clearAll: () => void;
  isInComparison: (id: string) => boolean;
};

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within ComparisonProvider");
  }
  return context;
}

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addProperty = (property: Property) => {
    if (properties.length >= 3) {
      alert("You can compare up to 3 properties at once");
      return;
    }
    if (!properties.find((p) => p.id === property.id)) {
      setProperties((prev) => [...prev, property]);
      setIsOpen(true);
    }
  };

  const removeProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAll = () => {
    setProperties([]);
    setIsOpen(false);
  };

  const isInComparison = (id: string) => {
    return properties.some((p) => p.id === id);
  };

  return (
    <ComparisonContext.Provider
      value={{ properties, addProperty, removeProperty, clearAll, isInComparison }}
    >
      {children}
      
      {/* Comparison Floating Bar */}
      <AnimatePresence>
        {properties.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl shadow-2xl p-4 w-[calc(100%-2rem)] md:w-auto md:min-w-[500px] max-w-2xl backdrop-blur-xl border border-white/10"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
                <span className="font-semibold text-sm sm:text-base">{properties.length} {properties.length === 1 ? 'Property' : 'Properties'} Selected</span>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {properties.length >= 2 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-50 transition shadow-lg"
                  >
                    Compare Now
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearAll}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 rounded-xl text-sm font-semibold hover:bg-white/20 transition backdrop-blur-sm"
                >
                  Clear
                </motion.button>
              </div>
            </div>

            {/* Selected Properties Preview */}
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {properties.map((property) => (
                <div key={property.id} className="relative group flex-shrink-0">
                  <div className="w-20 h-20 rounded-xl bg-white/10 overflow-hidden border-2 border-white/20 transition-all group-hover:border-white/40">
                    {property.imageUrl && (
                      <Image
                        src={property.imageUrl}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => removeProperty(property.id)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
                    aria-label="Remove property"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {isOpen && properties.length >= 2 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 md:inset-8 z-50 bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-w-7xl mx-auto"
            >
              <div className="flex items-center justify-between p-4 md:p-6 border-b bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Compare Properties</h2>
                  <p className="text-sm text-gray-600 mt-1">Side by side comparison of {properties.length} properties</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-xl transition-colors flex-shrink-0"
                  aria-label="Close comparison"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {properties.map((property) => (
                    <div key={property.id} className="space-y-4">
                      <div className="aspect-video rounded-xl bg-gray-200 overflow-hidden">
                        {property.imageUrl && (
                          <Image
                            src={property.imageUrl}
                            alt={property.title}
                            fill
                            className="object-cover"
                            sizes="320px"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{property.title}</h3>
                        <p className="text-sm text-gray-600">{property.city}</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Price</span>
                          <span className="font-semibold">₹{Number(property.price).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Bedrooms</span>
                          <span className="font-semibold">{property.bedrooms ?? "—"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Bathrooms</span>
                          <span className="font-semibold">{property.bathrooms ?? "—"}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Area</span>
                          <span className="font-semibold">
                            {property.area_sqft ? `${property.area_sqft} sqft` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ComparisonContext.Provider>
  );
}
