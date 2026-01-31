"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RippleButton } from "./ui/ripple-button";
import { useToast } from "./ui/toast-provider";

type FABAction = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
};

type FloatingActionButtonProps = {
  actions?: FABAction[];
};

export function FloatingActionButton({ actions }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  const defaultActions: FABAction[] = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      label: "Find Homes",
      onClick: () => {
        showToast("Searching for homes...", "info");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.8 8.6a5 5 0 0 0-8-4 5 5 0 0 0-8 4c0 6 8 10.4 8 10.4s8-4.4 8-10.4z" />
        </svg>
      ),
      label: "Favorites",
      onClick: () => showToast("Opening favorites...", "info"),
      color: "bg-red-500 hover:bg-red-600",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      label: "Contact",
      onClick: () => showToast("Opening chat...", "info"),
      color: "bg-blue-500 hover:bg-blue-600",
    },
  ];

  const displayActions = actions || defaultActions;

  return (
    <div className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8">
      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col-reverse gap-3 mb-3">
            {displayActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
                  {action.label}
                </span>
                <RippleButton
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`${
                    action.color || "bg-gray-900 hover:bg-gray-800"
                  } text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition`}
                >
                  {action.icon}
                </RippleButton>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <RippleButton
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:bg-gray-800 transition"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.div>
      </RippleButton>
    </div>
  );
}
