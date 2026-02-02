"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomSheet } from "./ui/bottom-sheet";
import { RippleButton } from "./ui/ripple-button";
import { SearchWithAutocomplete } from "./search-autocomplete";

export function MobileFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");

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

  const handleApply = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    
    router.push(`/?${params.toString()}`);
    setIsOpen(false);
  };

  const handleReset = () => {
    setCity("");
    setType("");
    setPriceMin("");
    setPriceMax("");
    router.push("/");
    setIsOpen(false);
  };

  const activeFilterCount = [city, type, priceMin, priceMax].filter(Boolean).length;

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-300 px-6 py-4">
        <RippleButton
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-xl font-semibold text-base shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white text-gray-900 px-2.5 py-0.5 rounded-full text-sm font-bold">
              {activeFilterCount}
            </span>
          )}
        </RippleButton>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Filter Properties">
        <div className="p-6 space-y-6">
          {/* City Search */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">City</label>
            <SearchWithAutocomplete value={city} onChange={setCity} placeholder="Search city" />
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Property Type</label>
            <div className="grid grid-cols-2 gap-3">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setType(type === option.value ? "" : option.value)}
                  className={`py-4 px-4 rounded-xl border-2 font-medium transition active:scale-95 ${
                    type === option.value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Price Range</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Min Price</label>
                <select
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full py-4 px-4 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium"
                >
                  <option value="">Any</option>
                  {minPriceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Max Price</label>
                <select
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full py-4 px-4 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium"
                >
                  <option value="">Any</option>
                  {maxPriceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-semibold text-base text-gray-700 hover:border-gray-400 transition active:scale-95"
            >
              Reset
            </button>
            <RippleButton
              onClick={handleApply}
              className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-semibold text-base"
            >
              Apply Filters
            </RippleButton>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
