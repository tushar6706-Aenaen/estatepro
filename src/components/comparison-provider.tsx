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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-2xl shadow-2xl p-4 min-w-[500px]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span className="font-semibold">{properties.length} Properties Selected</span>
              </div>
              
              <div className="flex items-center gap-2">
                {properties.length >= 2 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
                  >
                    Compare Now
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAll}
                  className="px-4 py-2 bg-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-700 transition"
                >
                  Clear All
                </motion.button>
              </div>
            </div>

            {/* Selected Properties Preview */}
            <div className="mt-3 flex gap-2">
              {properties.map((property) => (
                <div key={property.id} className="relative group">
                  <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden">
                    {property.imageUrl && (
                      <Image
                        src={property.imageUrl}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => removeProperty(property.id)}
                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 z-[70] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Compare Properties</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-3 gap-6">
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
