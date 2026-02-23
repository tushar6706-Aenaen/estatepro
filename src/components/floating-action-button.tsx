"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
        window.scrollTo({ top: 0, behavior: "smooth" });
        // Focus on search input after scroll
        setTimeout(() => {
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
        }, 500);
      },
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.8 8.6a5 5 0 0 0-8-4 5 5 0 0 0-8 4c0 6 8 10.4 8 10.4s8-4.4 8-10.4z" />
        </svg>
      ),
      label: "Favorites",
      onClick: () => {
        // Store current favorites to localStorage for now
        const favorites = localStorage.getItem('favorites');
        if (!favorites || JSON.parse(favorites).length === 0) {
          showToast("No favorites yet. Add properties to favorites!", "info");
        } else {
          showToast(`You have ${JSON.parse(favorites).length} favorites`, "success");
          // Could navigate to a favorites page: router.push('/favorites');
        }
      },
      color: "bg-red-500 hover:bg-red-600",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      label: "Contact",
      onClick: () => {
        router.push('/chats');
      },
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
                <motion.span
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap shadow-2xl border border-gray-700"
                >
                  {action.label}
                </motion.span>
                <RippleButton
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  aria-label={action.label}
                  title={action.label}
                  className={`${
                    action.color || "bg-gradient-to-r from-gray-900 to-gray-800"
                  } text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition hover:scale-110 active:scale-95`}
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
        aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
        title={isOpen ? "Close quick actions" : "Open quick actions"}
        className="bg-gradient-to-r from-gray-900 to-gray-800 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition active:scale-95 border-2 border-gray-700"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.div>
      </RippleButton>
    </div>
  );
}
