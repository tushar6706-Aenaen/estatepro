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
    <div className="md:hidden relative overflow-hidden">
      {/* Carousel Container */}
      <div className="relative h-[380px] touch-pan-y">
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
            <div className="h-full rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
              {/* Image */}
              <div className="relative h-52 bg-gray-200">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                <div className="absolute bottom-3 left-3 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-base font-bold text-gray-900 shadow-lg">
                  ₹{Number(properties[currentIndex].price).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1.5 line-clamp-2">
                    {properties[currentIndex].title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 21s-6-4.4-6-10a6 6 0 1 1 12 0c0 5.6-6 10-6 10z" />
                      <circle cx="12" cy="11" r="2" />
                    </svg>
                    <span>{properties[currentIndex].city}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition active:scale-95">
                    View Details
                  </button>
                  <button className="p-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 transition active:scale-95">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <div className="flex justify-center gap-2 mt-4">
        {properties.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? "w-8 bg-gray-900" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Swipe Indicator */}
      {currentIndex === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 text-sm text-gray-500 flex items-center gap-2 pointer-events-none"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Swipe to explore
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.div>
      )}
    </div>
  );
}
