"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchWithAutocomplete } from "./search-autocomplete";
import { RippleButton } from "./ui/ripple-button";
import { motion } from "framer-motion";

// --- Types ---
type Option = {
  label: string;
  value: string;
};

type DropdownProps = {
  label: string;
  options: Option[];
  value: string;
  onChange: (val: string) => void;
};

// --- Reusable Custom Dropdown Component ---
function CustomDropdown({ label, options, value, onChange }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="relative w-full sm:w-48" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
          isOpen
            ? "border-gray-900 ring-4 ring-gray-900/10 bg-gradient-to-br from-gray-50 to-white shadow-lg"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
        }`}
      >
        <span className={value ? "text-gray-900 font-semibold" : "text-gray-500"}>
          {selectedLabel || label}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-[200px] overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-2xl"
        >
          <div className="max-h-60 overflow-y-auto py-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-all ${
                value === "" 
                  ? "bg-gradient-to-r from-gray-900 to-gray-800 font-bold text-white" 
                  : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-gray-900 hover:font-medium"
              }`}
            >
              Any {label}
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-all ${
                  value === opt.value
                    ? "bg-gradient-to-r from-gray-900 to-gray-800 font-bold text-white"
                    : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-gray-900 hover:font-medium"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// --- Main Filter Section Component ---
export function PropertyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch result count in real-time
  useEffect(() => {
    const fetchCount = async () => {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (type) params.set("type", type);
      if (priceMin) params.set("priceMin", priceMin);
      if (priceMax) params.set("priceMax", priceMax);
      
      // Simulate API call (replace with actual API)
      setTimeout(() => {
        // Mock result count based on filters
        const mockCount = Math.floor(Math.random() * 50) + 10;
        setResultCount(mockCount);
        setIsLoading(false);
      }, 300);
    };

    fetchCount();
  }, [city, type, priceMin, priceMax]);

  const handleApply = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    
    // Push new URL (this triggers the Server Component to re-render)
    router.push(`/?${params.toString()}`);
  };

  const handleReset = () => {
    setCity("");
    setType("");
    setPriceMin("");
    setPriceMax("");
    router.push("/");
  };

  const typeOptions = [
    { label: "Apartment", value: "apartment" },
    { label: "House", value: "house" },
    { label: "Land", value: "land" },
    { label: "Commercial", value: "commercial" },
  ];

  const minPriceOptions = [
    { label: "₹50L", value: "5000000" },
    { label: "₹1Cr", value: "10000000" },
    { label: "₹2Cr", value: "20000000" },
  ];

  const maxPriceOptions = [
    { label: "₹50L", value: "5000000" },
    { label: "₹1Cr", value: "10000000" },
    { label: "₹2Cr", value: "20000000" },
    { label: "₹5Cr+", value: "50000000" },
  ];

  return (
    <section className="sticky top-0 z-50 border-y border-gray-300 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-5">
        
        {/* City Input with Autocomplete */}
        <SearchWithAutocomplete
          value={city}
          onChange={setCity}
          placeholder="City"
        />

        {/* Custom Dropdowns */}
        <CustomDropdown
          label="Property Type"
          options={typeOptions}
          value={type}
          onChange={setType}
        />
        
        <CustomDropdown
          label="Min Price"
          options={minPriceOptions}
          value={priceMin}
          onChange={setPriceMin}
        />

        <CustomDropdown
          label="Max Price"
          options={maxPriceOptions}
          value={priceMax}
          onChange={setPriceMax}
        />

        {/* Action Buttons */}
        <div className="mt-2 flex w-full items-center gap-4 sm:mt-0 sm:w-auto">
          <RippleButton
            onClick={handleApply}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 md:py-3 text-sm font-bold text-white shadow-lg shadow-gray-900/20 transition hover:bg-gray-800 hover:shadow-xl sm:w-auto min-h-[48px]"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                />
                Searching...
              </>
            ) : (
              <>
                Search
                {resultCount !== null && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {resultCount}
                  </span>
                )}
              </>
            )}
          </RippleButton>

          <button
            onClick={handleReset}
            className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}