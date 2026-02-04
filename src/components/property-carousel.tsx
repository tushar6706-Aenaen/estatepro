"use client";

import { useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import Image from "next/image";

type PropertyCardMobileProps = {
  properties: Array<{
    id: string;
    title: string;
    city: string;
    price: number | string;
    imageUrl?: string | null;
  }>;
};

export function PropertyCardCarousel({ properties }: PropertyCardMobileProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Determine if we should move to next/prev card
    if (Math.abs(velocity) >= 500 || Math.abs(offset) > 100) {
      if (offset > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (offset < 0 && currentIndex < properties.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  return (
    <div className="md:hidden relative overflow-hidden py-4 bg-gradient-to-b from-transparent to-gray-50/50">
      {/* Carousel Container */}
      <div className="relative h-96 touch-pan-y">
        <AnimatePresence initial={false} custom={currentIndex}>
          <motion.div
            key={currentIndex}
            custom={currentIndex}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 px-4"
          >
            <div className="h-full rounded-3xl border-2 border-gray-200 bg-white shadow-2xl overflow-hidden backdrop-blur-sm">
              {/* Image */}
              <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300">
                {properties[currentIndex].imageUrl && (
                  <Image
                    src={properties[currentIndex].imageUrl}
                    alt={properties[currentIndex].title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 80vw"
                    priority
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                <div className="absolute bottom-4 left-4 rounded-2xl bg-white/95 backdrop-blur-md px-4 py-2 text-lg font-bold text-gray-900 shadow-2xl border border-white/40">
                  ₹{Number(properties[currentIndex].price).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 bg-gradient-to-b from-white to-gray-50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                    {properties[currentIndex].title}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 21s-6-4.4-6-10a6 6 0 1 1 12 0c0 5.6-6 10-6 10z" />
                        <circle cx="12" cy="11" r="2" />
                      </svg>
                    </div>
                    <span className="font-medium">{properties[currentIndex].city}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="flex-1 bg-gray-900 text-white py-3.5 rounded-2xl font-semibold text-sm hover:bg-gray-800 transition-all active:scale-95 shadow-lg hover:shadow-xl">
                    View Details
                  </button>
                  <button className="p-3.5 border-2 border-gray-300 rounded-2xl hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all active:scale-95 group">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:fill-current">
                      <path d="M20.8 8.6a5 5 0 0 0-8-4 5 5 0 0 0-8 4c0 6 8 10.4 8 10.4s8-4.4 8-10.4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2.5 mt-6">
        {properties.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? "w-10 bg-gray-900" : "w-2.5 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to property ${index + 1}`}
          />
        ))}
      </div>

      {/* Swipe Indicator */}
      {currentIndex === 0 && properties.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 text-sm text-gray-500 flex items-center gap-2 pointer-events-none bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
        >
          <motion.svg
            animate={{ x: [-3, 0, -3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </motion.svg>
          Swipe to explore
          <motion.svg
            animate={{ x: [3, 0, 3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </motion.svg>
        </motion.div>
      )}
    </div>
  );
}
