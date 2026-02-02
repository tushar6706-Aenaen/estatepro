"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SearchWithAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const POPULAR_CITIES = [
  // Major Indian Cities
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Jaipur",
  "Surat",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Kalyan-Dombivali",
  "Vasai-Virar",
  "Varanasi",
  "Srinagar",
  "Aurangabad",
  "Dhanbad",
  "Amritsar",
  "Navi Mumbai",
  "Allahabad",
  "Ranchi",
  "Howrah",
  "Coimbatore",
  "Jabalpur",
  "Gwalior",
  "Vijayawada",
  "Jodhpur",
  "Madurai",
  "Raipur",
  "Kota",
  "Chandigarh",
  "Guwahati",
  "Solapur",
  "Hubballi-Dharwad",
  "Tiruchirappalli",
];

export function SearchWithAutocomplete({ value, onChange, placeholder }: SearchWithAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("recentCitySearches");
    try {
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    return POPULAR_CITIES.filter((city) =>
      city.toLowerCase().includes(value.toLowerCase()),
    ).slice(0, 5);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return;
    
    const updated = [search, ...recentSearches.filter((s) => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentCitySearches", JSON.stringify(updated));
  };

  const handleSelect = (city: string) => {
    onChange(city);
    saveRecentSearch(city);
    setIsOpen(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentCitySearches");
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto sm:flex-1">
      <div className="relative">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <path d="M12 21s-6-4.4-6-10a6 6 0 1 1 12 0c0 5.6-6 10-6 10z" />
          <circle cx="12" cy="11" r="2" />
        </svg>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || "City"}
          className="w-full rounded-xl border-2 border-gray-200 bg-white pl-12 pr-4 py-3 text-sm font-medium text-gray-900 shadow-sm placeholder:text-gray-400 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 hover:border-gray-300"
        />
        {value && (
          <button
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-[300px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            {/* Recent Searches */}
            {!value && recentSearches.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Recent Searches
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(search)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm text-gray-700"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {search}
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {value && suggestions.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Suggestions
                  </span>
                </div>
                {suggestions.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(city)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700 flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 21s-6-4.4-6-10a6 6 0 1 1 12 0c0 5.6-6 10-6 10z" />
                      <circle cx="12" cy="11" r="2" />
                    </svg>
                    <span>
                      {city.substring(0, value.length)}
                      <strong>{city.substring(value.length)}</strong>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {value && suggestions.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                No cities found
              </div>
            )}

            {/* Popular Cities */}
            {!value && recentSearches.length === 0 && (
              <div className="p-2">
                <div className="px-3 py-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Popular Cities
                  </span>
                </div>
                {POPULAR_CITIES.slice(0, 5).map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(city)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
