"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring, useInView } from "framer-motion";
import { useRef } from "react";
import { RippleButton } from "./ui/ripple-button";

type StatisticProps = {
  end: number;
  label: string;
  suffix?: string;
  delay?: number;
};

function AnimatedStatistic({ end, label, suffix = "", delay = 0 }: StatisticProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
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
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 md:mt-2 text-xs md:text-sm text-white/80">{label}</div>
    </motion.div>
  );
}

type AnimatedHeroProps = {
  stats?: {
    properties: number;
    clients: number;
    agents: number;
  };
};

export function AnimatedHero({ stats }: AnimatedHeroProps = {}) {
  const scrollYProgress = useMotionValue(0);
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const ySmooth = useSpring(y, { stiffness: 100, damping: 30 });

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

  const text = "Find Your Dream Home";

  return (
    <section className="relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-[url('/landing_page.png')] bg-cover bg-center"
        style={{ y: ySmooth }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      <div className="relative mx-auto grid min-h-[500px] md:min-h-[600px] w-full max-w-6xl items-center px-4 md:px-6 py-12 md:py-20">
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

          {/* Statistics Section */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 pt-4 md:pt-8">
            <AnimatedStatistic 
              end={stats?.properties ?? 0} 
              label="Properties Listed" 
              suffix="+" 
              delay={200} 
            />
            <AnimatedStatistic 
              end={stats?.clients ?? 0} 
              label="Happy Clients" 
              suffix="+" 
              delay={400} 
            />
            <AnimatedStatistic 
              end={stats?.agents ?? 0} 
              label="Expert Agents" 
              suffix="+" 
              delay={600} 
            />
          </div>

          {/* Simple Hero Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2 }}
            className="flex flex-col gap-3 rounded-2xl border-2 border-white/20 bg-white/95 backdrop-blur-md p-3 md:p-4 shadow-2xl md:flex-row md:items-center"
          >
            <div className="flex flex-1 items-center gap-2 md:gap-3 rounded-xl bg-gray-50 px-3 md:px-4 py-3 text-sm text-gray-700">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500 flex-shrink-0"
              >
                <path d="M12 21s-6-4.4-6-10a6 6 0 1 1 12 0c0 5.6-6 10-6 10z" />
                <circle cx="12" cy="11" r="2" />
              </svg>
              <input
                type="text"
                placeholder="Enter an address, neighborhood, city, or ZIP"
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
            </div>
            <RippleButton
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 md:px-6 md:py-3 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800"
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
