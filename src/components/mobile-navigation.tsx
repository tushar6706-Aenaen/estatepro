"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export function MobileNavigation() {
  const searchParams = useSearchParams();
  const activeListingType = searchParams.get("listingType") || "sale";

  const navItems = [
    { label: "Buy", value: "sale", href: "/?listingType=sale", icon: "home" },
    { label: "Rent", value: "rent", href: "/?listingType=rent", icon: "key" },
    { label: "Sell", value: "sell", href: "/onboarding?redirect=/", icon: "tag" },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "home":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case "key":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        );
      case "tag":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t-2 border-gray-200 md:hidden safe-area-bottom shadow-2xl">
      <div className="grid grid-cols-3 gap-0">
        {navItems.map((item) => {
          const isActive = item.value === activeListingType;
          
          return (
            <Link
              key={item.value}
              href={item.href}
              className="relative flex flex-col items-center justify-center py-4 px-2 transition-all active:scale-95"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-gray-900 to-gray-800 rounded-full shadow-lg"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`transition-all duration-200 ${
                  isActive 
                    ? "text-gray-900 scale-110" 
                    : "text-gray-400"
                }`}
              >
                {getIcon(item.icon)}
              </motion.div>
              <span
                className={`text-xs font-bold mt-1.5 transition-all duration-200 ${
                  isActive 
                    ? "text-gray-900 scale-105" 
                    : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
