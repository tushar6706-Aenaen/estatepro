"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, useSpring, useInView } from "framer-motion";
import { RippleButton } from "./ui/ripple-button";
import { supabaseBrowserClient } from "@/src/lib/supabase/client";

type StatisticProps = {
  end: number | null;
  label: string;
  suffix?: string;
  delay?: number;
};

function AnimatedStatistic({ end, label, suffix = "", delay = 0 }: StatisticProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (end == null) {
      setCount(0);
      return;
    }

    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = end / steps;
      const stepDuration = duration / steps;

      setTimeout(() => {
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current));
          }
        }, stepDuration);
      }, delay);
    }
  }, [isInView, end, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: delay / 1000 }}
      className="text-center"
    >
      <div className="text-2xl md:text-4xl font-bold text-white">
        {end == null ? "--" : `${count.toLocaleString()}${suffix}`}
      </div>
      <div className="mt-1 md:mt-2 text-xs md:text-sm text-white/80">{label}</div>
    </motion.div>
  );
}

type AnimatedHeroProps = {
  stats?: {
    properties: number | null;
    clients: number | null;
    agents: number | null;
  };
};

type PropertySuggestion = {
  id: string;
  title: string;
  city: string | null;
};

export function AnimatedHero({ stats }: AnimatedHeroProps = {}) {
  const router = useRouter();
  const scrollYProgress = useMotionValue(0);
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const ySmooth = useSpring(y, { stiffness: 100, damping: 30 });
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PropertySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scroll = window.scrollY;
      scrollYProgress.set(scroll / 1000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollYProgress]);

  // Typewriter effect variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.5,
      },
    },
  };

  const charVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  useEffect(() => {
    const query = searchQuery.trim();
    console.log(query);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (query.length <= 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      setLoadingSuggestions(true);

      try {
        const { data, error } = await supabaseBrowserClient
          .from("properties")
          .select("id,title,city")
          .or(`title.ilike.%${query}%,city.ilike.%${query}%`)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Property suggestion search failed", error);
          setSuggestions([]);
          return;
        }

        const results = (data ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          city: item.city ?? null,
        }));

        console.log(results);
        setSuggestions(results);
      } catch (error) {
        console.error("Property suggestion search failed", error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    setShowDropdown(searchQuery.trim().length > 2);
  }, [searchQuery]);

  const handleSuggestionClick = (id: string) => {
    router.push(`/properties/${id}`);
  };

  const text = "Find Your Dream Home";

  return (
    <section className="relative overflow-visible">
      <motion.div
        className="absolute inset-0 bg-[url('/landing_page.png')] bg-cover bg-center"
        style={{ y: ySmooth }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/50 to-black/30" />
      <div className="relative mx-auto grid w-full max-w-6xl items-center px-4 md:px-6 py-6 md:py-8">
        <div className="space-y-6 md:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white"
          >
            Premium listings
          </motion.div>

          <motion.h1
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-lg"
          >
            {text.split("").map((char, index) => (
              <motion.span key={index} variants={charVariants}>
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="max-w-2xl text-base md:text-lg text-white/90 drop-shadow-md"
          >
            Discover luxury properties in exclusive locations tailored to your
            lifestyle.
          </motion.p>

          {/* Marketplace Highlights */}
          <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3 md:gap-5 md:pt-8">
            <div className="rounded-2xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-sm">
              <AnimatedStatistic
                end={stats?.properties ?? null}
                label="Verified Listings"
                delay={200}
              />
            </div>
            <div className="rounded-2xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-sm text-white">
              <p className="text-2xl md:text-3xl font-bold">Map-Ready</p>
              <p className="mt-1 text-xs md:text-sm text-white/80">Explore location context instantly</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-sm text-white">
              <p className="text-2xl md:text-3xl font-bold">Live Chat</p>
              <p className="mt-1 text-xs md:text-sm text-white/80">Message agents directly from listings</p>
            </div>
          </div>

          {/* Simple Hero Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2 }}
            className="relative flex flex-col gap-3 rounded-2xl border-2 border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-md md:flex-row md:items-center md:p-4"
          >
            <div className="relative flex flex-1 items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-700 md:gap-3 md:px-4">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-gray-500"
              >
                <path d="M12 21s-6-4.4-6-10a6 6 0 1 1 12 0c0 5.6-6 10-6 10z" />
                <circle cx="12" cy="11" r="2" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setShowDropdown(searchQuery.trim().length > 2)}
                placeholder="Enter an address, neighborhood, city, or ZIP"
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              {showDropdown && (
                <div className="absolute bottom-[calc(100%+10px)] left-0 z-50 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                  {loadingSuggestions ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Searching properties...</div>
                  ) : suggestions.length > 0 ? (
                    <div className="max-h-72 overflow-auto">
                      {suggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestionClick(item.id)}
                          className="flex w-full flex-col gap-0.5 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50 last:border-b-0"
                        >
                          <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                          <span className="text-xs text-gray-500">{item.city ?? "Location pending"}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
            </div>
            <RippleButton
              type="button"
              onClick={() => {
                if (suggestions[0]) {
                  handleSuggestionClick(suggestions[0].id);
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800 md:px-6 md:py-3"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Search
            </RippleButton>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
